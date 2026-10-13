const { test, expect } = require("@playwright/test");
const { startNewGame } = require("./helpers");

test("fire burns trees down to ash and leaves other clears as stone", async ({ page }) => {
    await startNewGame(page);
    const result = await page.evaluate(() => {
        const g = window.game;
        const w = g.world;
        for (const m of g.monsters) {
            m.x = 0;
            m.y = 0;
        }

        function note() {
            const el = document.querySelector(".notification");
            return el ? el.textContent : "";
        }

        function quiet() {
            g.ui.dialogQueue = [];
            g.ui.dialogActive = false;
            document.getElementById("dialog-box").classList.add("hidden");
            g.keyJustPressed = {};
        }

        function neighbor(tx, ty) {
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    if (!dx && !dy) continue;
                    const x = tx + dx;
                    const y = ty + dy;
                    if (x < 2 || y < 2 || x >= WORLD_W - 2 || y >= WORLD_H - 2) continue;
                    if (!w.isSolid(x, y)) return { x, y };
                }
            }
            return null;
        }

        function find(pred) {
            for (let y = 2; y < WORLD_H - 2; y++) {
                for (let x = 2; x < WORLD_W - 2; x++) {
                    if (!pred(x, y)) continue;
                    const stand = neighbor(x, y);
                    if (stand) return { x, y, stand };
                }
            }
            return null;
        }

        function cast(element, stand) {
            quiet();
            g.player.elements[element] = true;
            g.player.activeElement = element;
            g.player.elementCooldown = 0;
            g.player.x = stand.x * TILE_SIZE + TILE_SIZE / 2;
            g.player.y = stand.y * TILE_SIZE + TILE_SIZE / 2;
            g.keyJustPressed = { element: true };
            g.update(16);
        }

        function nearEntrance(entrance, tile) {
            let found = null;
            for (let dy = -3; dy <= 3 && !found; dy++) {
                for (let dx = -3; dx <= 3 && !found; dx++) {
                    const x = entrance.x + dx;
                    const y = entrance.y + dy;
                    if (w.tiles[y][x] !== tile) continue;
                    const stand = neighbor(x, y);
                    if (stand) found = { x, y, stand };
                }
            }
            return found;
        }

        const tree = find((x, y) => w.tiles[y][x] === TILE.TREE && getZoneAt(x, y) === "forest");
        const fireCave = CAVE_ENTRANCES.find(e => e.element === "fire");
        const earthCave = CAVE_ENTRANCES.find(e => e.element === "earth");
        const iceCave = CAVE_ENTRANCES.find(e => e.element === "ice");
        const caveTree = nearEntrance(fireCave, TILE.TREE);
        const caveRock = nearEntrance(earthCave, TILE.MOUNTAIN);
        const caveWater = nearEntrance(iceCave, TILE.WATER);

        let edge = null;
        for (let y = 2; y < WORLD_H - 2 && !edge; y++) {
            for (const x of [0, 1]) {
                if (w.tiles[y][x] !== TILE.TREE) continue;
                if (w.isSolid(3, y)) continue;
                edge = { x, y };
                break;
            }
        }

        cast("fire", tree.stand);
        const key = `${tree.x},${tree.y}`;
        const burning = {
            note: note(),
            tile: w.tiles[tree.y][tree.x],
            timer: w.burningTrees && w.burningTrees[key] ? w.burningTrees[key].timer : null,
        };
        const monster = new Monster("goblin", tree.x * TILE_SIZE + TILE_SIZE / 2, tree.y * TILE_SIZE + TILE_SIZE / 2);
        monster.hp = 500;
        monster.maxHp = 500;
        const beforeHp = monster.hp;
        g.monsters.push(monster);
        g.updateBurningTrees(16);
        const burnedHp = monster.hp;
        g.monsters = g.monsters.filter(m => m !== monster);

        const snap = SaveSystem.capture(g);
        const fresh = new World(w.gemSeed);
        SaveSystem.restoreWorld(fresh, snap.world);

        // The burn only advances while Ingoizer is standing near it, same as a fire arrow.
        g.updateBurningTrees(8000);
        const ash = {
            tile: w.tiles[tree.y][tree.x],
            stillBurning: !!(w.burningTrees && w.burningTrees[key]),
        };
        const ashSnap = SaveSystem.capture(g);
        const freshAsh = new World(w.gemSeed);
        SaveSystem.restoreWorld(freshAsh, ashSnap.world);

        cast("fire", caveTree.stand);
        cast("earth", caveRock.stand);
        cast("ice", caveWater.stand);
        cast("fire", { x: 3, y: edge.y });

        return {
            burning,
            burnedHp,
            beforeHp,
            savedTile: fresh.tiles[tree.y][tree.x],
            savedTimer: fresh.burningTrees && fresh.burningTrees[key] ? fresh.burningTrees[key].timer : null,
            ash,
            ashTile: freshAsh.tiles[tree.y][tree.x],
            ashSaved: !!(freshAsh.burningTrees && freshAsh.burningTrees[key]),
            caveTree: w.tiles[caveTree.y][caveTree.x],
            caveRock: w.tiles[caveRock.y][caveRock.x],
            caveWater: w.tiles[caveWater.y][caveWater.x],
            edge: w.tiles[edge.y][edge.x],
            canopy: w.tiles[w.skyTree.tileY][w.skyTree.tileX],
            burningTile: TILE.BURNING_TREE,
            path: TILE.PATH,
            stone: TILE.STONE,
            tree: TILE.TREE,
            sky: TILE.SKY_TREE,
        };
    });

    expect(result.burning.note).toBe("Fire burns the trees away");
    expect(result.burning.tile).toBe(result.burningTile);
    expect(result.burning.tile).not.toBe(result.stone);
    expect(result.burning.timer).toBe(8000 - 16);
    expect(result.burnedHp).toBeLessThan(result.beforeHp);
    expect((result.beforeHp - result.burnedHp) % 8).toBe(0);
    expect(result.savedTile).toBe(result.burningTile);
    expect(result.savedTimer).toBe(8000 - 32);
    expect(result.ash.tile).toBe(result.path);
    expect(result.ash.stillBurning).toBe(false);
    expect(result.ashTile).toBe(result.path);
    expect(result.ashSaved).toBe(false);
    expect(result.caveTree).toBe(result.burningTile);
    expect(result.caveRock).toBe(result.stone);
    expect(result.caveWater).toBe(result.stone);
    expect(result.edge).toBe(result.tree);
    expect(result.canopy).toBe(result.sky);
});
