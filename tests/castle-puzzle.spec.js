const { test, expect } = require("@playwright/test");
const { startNewGame, openPause } = require("./helpers");

test("a tree just east of Ing Castle changes with the elements and pays once", async ({ page }) => {
    await startNewGame(page);
    const placed = await page.evaluate(() => {
        const w = window.game.world;
        const p = w.castlePuzzle;
        const wallX = p.tileX - 1;
        const beside = w.tiles[p.tileY][p.tileX + 1];
        return {
            x: p.tileX,
            y: p.tileY,
            stage: p.stage,
            tile: w.tiles[p.tileY][p.tileX],
            wall: w.tiles[p.tileY][wallX],
            besideSolid: SOLID_TILES.has(beside),
            zone: getZoneAt(p.tileX, p.tileY),
        };
    });
    expect(placed).toMatchObject({
        x: 191,
        y: 63,
        stage: "tree",
        tile: 1,
        wall: 12,
        besideSolid: false,
        zone: "castle",
    });

    const chain = await page.evaluate(() => {
        const g = window.game;
        const w = g.world;
        const p = w.castlePuzzle;
        const at = () => w.tiles[p.tileY][p.tileX];
        // Earth does nothing to the tree. Fire is what burns it.
        w.clearTerrain("earth", p.x, p.y);
        const ignored = { stage: p.stage, tile: at() };
        w.clearTerrain("fire", p.x, p.y);
        const mountain = { stage: p.stage, tile: at(), flash: p.flash };
        p.flash = null;
        w.clearTerrain("earth", p.x, p.y);
        const pool = { stage: p.stage, tile: at() };
        p.flash = null;
        w.clearTerrain("ice", p.x, p.y);
        const fire = { stage: p.stage, tile: at() };
        p.flash = null;
        w.clearTerrain("water", p.x, p.y);
        const ladder = { stage: p.stage, tile: at() };
        g.player.x = p.x;
        g.player.y = p.y;
        g.checkCastlePuzzle();
        g.claimCastleLadder();
        const first = {
            near: g.nearCastleLadder,
            jade: g.player.holdsKey("jade"),
            armor: g.player.armors.includes("knights_armor"),
            worn: g.player.currentArmor,
            bow: g.player.bows.includes("hunters_bow"),
            drawn: g.player.currentBow,
            rewarded: p.rewarded,
            armorCount: g.player.armors.length,
            bowCount: g.player.bows.length,
            keyCount: g.player.heldKeys.length,
        };
        g.claimCastleLadder();
        const second = {
            armorCount: g.player.armors.length,
            bowCount: g.player.bows.length,
            keyCount: g.player.heldKeys.length,
            rewarded: p.rewarded,
        };
        return { ignored, mountain, pool, fire, ladder, first, second };
    });

    expect(chain.ignored).toEqual({ stage: "tree", tile: 1 });
    expect(chain.mountain).toMatchObject({ stage: "mountain", tile: 9, flash: "mountain" });
    expect(chain.pool).toEqual({ stage: "pool", tile: 2 });
    expect(chain.fire).toEqual({ stage: "fire", tile: 14 });
    expect(chain.ladder).toEqual({ stage: "ladder", tile: 19 });
    expect(chain.first.near).toBe(true);
    expect(chain.first.jade).toBe(true);
    expect(chain.first.armor).toBe(true);
    expect(chain.first.worn).toBe("knights_armor");
    expect(chain.first.bow).toBe(true);
    expect(chain.first.drawn).toBe("hunters_bow");
    expect(chain.first.rewarded).toBe(true);
    expect(chain.second).toEqual({
        armorCount: chain.first.armorCount,
        bowCount: chain.first.bowCount,
        keyCount: chain.first.keyCount,
        rewarded: true,
    });
});

test("the castle tree's stage and reward survive a save", async ({ page }) => {
    await startNewGame(page);
    const loaded = await page.evaluate(() => {
        const g = window.game;
        const p = g.world.castlePuzzle;
        g.world.clearTerrain("fire", p.x, p.y);
        p.flash = null;
        g.player.holdKey("jade");
        g.player.addArmor("knights_armor");
        g.player.addBow("hunters_bow");
        p.stage = "ladder";
        p.rewarded = true;
        g.world.applyCastlePuzzleTile();
        g.saveToSlot(1);
        g.loadFromSlot(1);
        const again = g.world.castlePuzzle;
        return {
            stage: again.stage,
            tile: g.world.tiles[again.tileY][again.tileX],
            rewarded: again.rewarded,
            jade: g.player.holdsKey("jade"),
            armor: g.player.armors.filter((id) => id === "knights_armor").length,
            bow: g.player.bows.filter((id) => id === "hunters_bow").length,
        };
    });
    expect(loaded).toEqual({
        stage: "ladder",
        tile: 19,
        rewarded: true,
        jade: true,
        armor: 1,
        bow: 1,
    });
});

test("burning every ordinary tree in a biome is The Destroyer, and the castle tree is not one of them", async ({ page }) => {
    await startNewGame(page);
    const result = await page.evaluate(() => {
        const g = window.game;
        const w = g.world;
        const zone = ZONES.meadow;
        let kept = null;
        for (let y = zone.y; y < zone.y + zone.h; y++) {
            for (let x = zone.x; x < zone.x + zone.w; x++) {
                if (w.tiles[y][x] !== TILE.TREE) continue;
                if (!kept) {
                    kept = { x, y };
                    continue;
                }
                w.tiles[y][x] = TILE.PATH;
            }
        }
        w.igniteTree(kept.x, kept.y);
        w.burningTrees[`${kept.x},${kept.y}`].timer = 1;
        g.player.x = kept.x * TILE_SIZE;
        g.player.y = kept.y * TILE_SIZE;
        g.updateBurningTrees(16);
        const meadow = {
            cleared: !!w.destroyerCleared.meadow,
            weight: HallOfDeeds.weightOf("destroyer-meadow"),
            label: HallOfDeeds.label("destroyer-meadow"),
            tier: HallOfDeeds.tierOf("destroyer-meadow"),
            stored: HallOfDeeds.readStore().some((row) => row.milestoneId === "destroyer-meadow"),
        };

        // The castle biome can be emptied of ordinary trees and still not be
        // cleared, because the puzzle tree does not count and has not burned.
        const castle = ZONES.castle;
        const puzzle = w.castlePuzzle;
        for (let y = castle.y; y < castle.y + castle.h; y++) {
            for (let x = castle.x; x < castle.x + castle.w; x++) {
                if (w.isCastlePuzzle(x, y)) continue;
                if (w.tiles[y][x] === TILE.TREE || w.tiles[y][x] === TILE.BURNING_TREE) {
                    w.tiles[y][x] = TILE.PATH;
                }
            }
        }
        const puzzleStillTree = w.tiles[puzzle.tileY][puzzle.tileX] === TILE.TREE && puzzle.stage === "tree";
        const castleCleared = !!w.destroyerCleared.castle;
        // Burning the puzzle tree advances it. It must not award the castle deed.
        w.clearTerrain("fire", puzzle.x, puzzle.y);
        return {
            meadow,
            puzzleStillTree,
            castleCleared,
            castleAfter: !!w.destroyerCleared.castle,
            puzzleStage: puzzle.stage,
            fullSetNeedsDestroyer: Object.keys(HALL_MILESTONES).some((id) => id.startsWith("destroyer-")),
        };
    });

    expect(result.meadow.cleared).toBe(true);
    expect(result.meadow.weight).toBe(10);
    expect(result.meadow.label).toBe("The Destroyer — Green Meadow");
    expect(result.meadow.tier).toBe("Destroyer");
    expect(result.meadow.stored).toBe(true);
    expect(result.puzzleStillTree).toBe(true);
    expect(result.castleCleared).toBe(false);
    expect(result.castleAfter).toBe(false);
    expect(result.puzzleStage).toBe("mountain");
    expect(result.fullSetNeedsDestroyer).toBe(false);

    await openPause(page);
    await page.click("#pause-hall");
    await expect(page.locator("#hall-overlay")).toBeVisible();
    await expect(page.locator(".champion-row .champ-score")).toHaveText("10");
    await page.locator(".champion-row").click();
    await expect(page.locator(".champion-deed").filter({ hasText: "The Destroyer — Green Meadow" })).toBeVisible();
});
