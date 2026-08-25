const { test, expect } = require("@playwright/test");
const { startNewGame, dismissDialogs } = require("./helpers");

// Burning the Worldtree takes the ladder up with it: the fire leaves ash and
// one seed, and no way into the Cloudlands at all. Every planting grows that
// way back - a Worldtree with a ladder in it - but only the Waiting Ground
// holds one, and only a tree that has taken settles Zeus's quarrel. These
// tests cover the ash being a dead end, the plot being genuinely the clean
// square of earth it is described as, the clues that walk a lost player to it,
// a wrong planting opening the climb without buying peace, and the trade the
// right planting makes: peace bought, the Olympian fight given up.

/** Read every dialog the game has queued, answering each one as a player would. */
async function drainDialogs(page, limit = 40) {
    const said = [];
    for (let i = 0; i < limit; i++) {
        const line = await page.evaluate(() => {
            const ui = window.game.ui;
            if (!ui.dialogActive) return null;
            const next = ui.dialogQueue[0] ? ui.dialogQueue[0].text : null;
            ui.advanceDialog();
            return next;
        });
        if (line === null) break;
        said.push(line);
    }
    return said;
}

/** Hand over the seed the way burning the tree does, without the archery. */
async function giveSeed(page) {
    await page.evaluate(() => {
        window.game.world.burnWorldtreeToAsh();
        window.game.player.hasWorldtreeSeed = true;
    });
    await dismissDialogs(page);
}

/** Stand somewhere and push the seed in. Returns everything the game said. */
async function plantAt(page, where) {
    await page.evaluate((w) => {
        const g = window.game;
        const spot = {
            plot: () => g.world.worldtreePlot,
            ash: () => g.world.skyTree,
        }[w];
        const target = spot ? spot() : w;
        g.player.x = target.x;
        g.player.y = target.y;
        g.plantWorldtreeSeed();
    }, where);
    return drainDialogs(page);
}

/** Let a planting finish. The game pauses while a dialog is up, so keep talking. */
async function growPlanting(page) {
    const heard = [];
    await expect.poll(async () => {
        heard.push(...await drainDialogs(page));
        return page.evaluate(() => !!(window.game.world.sapling && window.game.world.sapling.grown));
    }, { timeout: 15000 }).toBe(true);
    heard.push(...await drainDialogs(page));
    return heard;
}

/** Lift a Worldtree that never took back out, so the seed can be tried elsewhere. */
async function recoverSeed(page) {
    await page.evaluate(() => {
        const g = window.game;
        const sap = g.world.sapling;
        g.player.x = sap.x;
        g.player.y = sap.y;
        g.checkProximity();
        g.uprootSapling();
    });
    await drainDialogs(page);
}

test.describe("the Waiting Ground", () => {
    test.beforeEach(async ({ page }) => {
        await startNewGame(page);
    });

    test("is bare earth in a clearing with nothing else in it", async ({ page }) => {
        const plot = await page.evaluate(() => {
            const w = window.game.world;
            const P = WORLDTREE_PLOT;
            let trees = 0, paths = 0, solid = 0, earth = 0, decorations = 0;
            for (let dy = -P.clearRadius; dy <= P.clearRadius; dy++) {
                for (let dx = -P.clearRadius; dx <= P.clearRadius; dx++) {
                    if (dx * dx + dy * dy > P.clearRadius * P.clearRadius) continue;
                    const tile = w.tiles[P.y + dy][P.x + dx];
                    if (tile === TILE.TREE) trees++;
                    if (tile === TILE.PATH) paths++;
                    if (tile === TILE.BARE_EARTH) earth++;
                    if (SOLID_TILES.has(tile)) solid++;
                }
            }
            for (const dec of w.decorations) {
                if (w.isWorldtreeClearing(Math.floor(dec.x / TILE_SIZE), Math.floor(dec.y / TILE_SIZE))) decorations++;
            }
            return {
                trees, paths, solid, earth, decorations,
                zone: getZoneAt(P.x, P.y),
                middle: w.tiles[P.y][P.x],
            };
        });

        expect(plot.zone, "the plot lies in the Fallow").toBe("fallow");
        expect(plot.middle, "the middle of it is turned earth").toBe(28); // TILE.BARE_EARTH
        expect(plot.earth, "and there is a proper patch of it").toBeGreaterThan(8);
        expect(plot.trees, "no trees around it").toBe(0);
        expect(plot.paths, "no path around it").toBe(0);
        expect(plot.solid, "nothing solid in the clearing at all").toBe(0);
        expect(plot.decorations, "and nothing scattered over it").toBe(0);
    });

    test("sits in an acre with no road and no tree in it", async ({ page }) => {
        const fallow = await page.evaluate(() => {
            const w = window.game.world;
            const z = ZONES.fallow;
            let paths = 0, trees = 0, earth = 0;
            for (let y = z.y; y < Math.min(z.y + z.h, WORLD_H); y++) {
                for (let x = z.x; x < Math.min(z.x + z.w, WORLD_W); x++) {
                    if (w.tiles[y][x] === TILE.PATH) paths++;
                    if (w.tiles[y][x] === TILE.TREE) trees++;
                    if (w.tiles[y][x] === TILE.BARE_EARTH) earth++;
                }
            }
            return { paths, trees, earth };
        });

        expect(fallow.paths, "the Fallow is trackless").toBe(0);
        expect(fallow.trees, "nothing has ever grown in it").toBe(0);
        expect(fallow.earth, "the brown shows from a long way off").toBeGreaterThan(20);
    });

    test("is the only ground the seed answers to", async ({ page }) => {
        const answers = await page.evaluate(() => {
            const w = window.game.world;
            w.burnWorldtreeToAsh();
            const P = w.worldtreePlot;
            const st = w.skyTree;
            return {
                plot: w.isWorldtreeGround(P.x, P.y),
                plotEdge: w.isWorldtreeGround(P.x + WORLDTREE_PLOT.earthRadius * TILE_SIZE, P.y),
                nearby: w.isWorldtreeGround(P.x + 6 * TILE_SIZE, P.y),
                ash: w.isWorldtreeGround(st.x, st.y),
                ashIsAsh: w.isWorldtreeAsh(st.x, st.y),
            };
        });

        expect(answers.plot, "the turned earth takes it").toBe(true);
        expect(answers.plotEdge, "the whole plot takes it").toBe(true);
        expect(answers.nearby, "the grass beside it does not").toBe(false);
        expect(answers.ash, "and neither does the ash it came out of").toBe(false);
        expect(answers.ashIsAsh, "the ash is still recognised, so it gets its own answer").toBe(true);
    });
});

test.describe("planting the Worldtree Seed", () => {
    test.beforeEach(async ({ page }) => {
        await startNewGame(page);
    });

    test("burning the tree takes the ladder up with it", async ({ page }) => {
        const after = await page.evaluate(() => {
            const g = window.game;
            g.world.burnWorldtreeToAsh();
            const st = g.world.skyTree;
            let ladderTiles = 0;
            for (let dy = -SKY_TREE.radius; dy <= SKY_TREE.radius; dy++) {
                for (let dx = -SKY_TREE.radius; dx <= SKY_TREE.radius; dx++) {
                    if (g.world.tiles[st.tileY + dy][st.tileX + dx] === TILE.SKY_LADDER) ladderTiles++;
                }
            }
            // Stand in the middle of the ash and try to climb.
            g.player.x = st.x;
            g.player.y = st.y;
            g.checkSkyProximity();
            return {
                ladder: g.world.skyLadder,
                ladderTiles,
                canClimb: g.nearSkyLadder,
                marked: g.world.mapLandmarks().some(m => m.label === "Worldtree Ash"),
            };
        });

        expect(after.ladder, "there is no ladder anywhere").toBeNull();
        expect(after.ladderTiles, "and none left in the ash").toBe(0);
        expect(after.canClimb, "so standing in the ash climbs nothing").toBe(false);
        expect(after.marked, "the spot is still worth finding, as a ruin").toBe(true);
    });

    test("a seed planted anywhere opens the way up, without buying peace", async ({ page }) => {
        await giveSeed(page);
        await plantAt(page, { x: 1200, y: 900 });
        const said = (await growPlanting(page)).join(" ");

        const state = await page.evaluate(() => {
            const g = window.game;
            g.checkSkyProximity();
            return {
                grown: g.world.sapling.grown,
                rooted: g.world.sapling.rooted,
                ladder: !!g.world.skyLadder,
                canClimb: g.nearSkyLadder,
                appeased: g.zeusAppeased,
                restored: g.worldtreeRestored,
                marked: g.world.mapLandmarks().some(m => m.label === "Worldtree & Sky Ladder"),
            };
        });

        expect(state.grown, "a Worldtree comes up").toBe(true);
        expect(state.rooted, "but it has not taken").toBe(false);
        expect(state.ladder, "it carries a ladder all the same").toBe(true);
        expect(state.canClimb, "and standing at the trunk offers the climb").toBe(true);
        expect(state.appeased, "Zeus is not appeased by a tree that has not taken").toBe(false);
        expect(state.restored, "nothing has been put back").toBe(false);
        expect(said, "and the game says the climb is open").toContain("the way into the Cloudlands is open again");
        expect(said, "and that there will be a fight at the top").toContain("will want a fight");
        expect(state.marked, "the tree is the route now, and the chart says so").toBe(true);
    });

    test("lifting the tree out again closes the way up", async ({ page }) => {
        await giveSeed(page);
        await plantAt(page, { x: 1200, y: 900 });
        await growPlanting(page);
        await recoverSeed(page);

        const after = await page.evaluate(() => {
            const g = window.game;
            g.checkSkyProximity();
            return { carrying: g.player.hasWorldtreeSeed, ladder: g.world.skyLadder, canClimb: g.nearSkyLadder };
        });

        expect(after.carrying, "the seed is back in hand").toBe(true);
        expect(after.ladder, "and the ladder went with the tree").toBeNull();
        expect(after.canClimb, "so there is nothing to climb").toBe(false);
    });

    test("the old ash grows a tree that will not take, and says why", async ({ page }) => {
        await giveSeed(page);
        await plantAt(page, "ash");
        const said = (await growPlanting(page)).join(" ");

        const state = await page.evaluate(() => ({
            rooted: window.game.world.sapling.rooted,
            grown: window.game.world.sapling.grown,
            restored: window.game.worldtreeRestored,
        }));

        expect(said, "the ash is named as the wrong answer").toContain("cannot begin in the end of itself");
        expect(state.grown, "something still comes up").toBe(true);
        expect(state.rooted, "but nothing takes there").toBe(false);
        expect(state.restored, "and no Worldtree is put back").toBe(false);

        await recoverSeed(page);
        expect(await page.evaluate(() => window.game.player.hasWorldtreeSeed),
            "a tree that never took always gives the seed back").toBe(true);
    });

    test("every miss buys a plainer clue, and enough of them chart the plot", async ({ page }) => {
        await giveSeed(page);
        const rungs = await page.evaluate(() => WORLDTREE_SEED_CLUES.length);
        const clues = [];
        for (let i = 0; i < rungs; i++) {
            if (i > 0) await recoverSeed(page);
            await plantAt(page, { x: 1200 + i * 260, y: 900 });
            clues.push((await growPlanting(page)).join(" "));
        }

        expect(clues[0], "the first miss says the tree is unsettled").toContain("does not sway like that");
        expect(clues[1], "the second points a direction").toContain("south");
        expect(clues[2], "the third names the country").toContain("Fallow");
        expect(clues[3], "the fourth describes the plot").toContain("bare turned earth");

        const charted = await page.evaluate(() => ({
            charted: window.game.world.worldtreePlot.charted,
            marked: window.game.world.mapLandmarks().some(m => m.label === WORLDTREE_PLOT.name),
        }));
        expect(charted.charted, "a lost player is never left lost").toBe(true);
        expect(charted.marked, "the plot goes on the chart").toBe(true);
    });

    test("the right plot settles Zeus, and spends the Olympian fight to do it", async ({ page }) => {
        await giveSeed(page);
        await plantAt(page, "plot");
        expect(await page.evaluate(() => window.game.world.sapling.rooted), "it goes in ground that holds it").toBe(true);
        const said = (await growPlanting(page)).join(" ");

        const state = await page.evaluate(() => {
            const g = window.game;
            g.checkSkyProximity();
            return {
                restored: g.worldtreeRestored,
                regrown: g.world.skyTree.regrown,
                appeased: g.zeusAppeased,
                bolts: g.player.hasZeusBolts,
                canClimb: g.nearSkyLadder,
                marked: g.world.mapLandmarks().some(m => m.label === "The Worldtree"),
                // A tree that has taken is not coming back out.
                liftable: g.world.uprootSapling(),
            };
        });

        expect(said, "Zeus notices it is not where he left it").toContain("Not where I put it");
        expect(said, "and the run is told what it just gave up").toContain("is not something this run can do any more");
        expect(state.restored, "the Worldtree stands again").toBe(true);
        expect(state.regrown, "the world knows it").toBe(true);
        expect(state.appeased, "the quarrel is over before it starts").toBe(true);
        expect(state.bolts, "with the lightning given freely").toBe(true);
        expect(state.canClimb, "and the climb is open at the new tree").toBe(true);
        expect(state.marked, "which is what the chart calls it now").toBe(true);
        expect(state.liftable, "a tree that has taken cannot be lifted out").toBe(false);
    });

    test("peace and the Olympian fight can never both happen", async ({ page }) => {
        await giveSeed(page);
        await plantAt(page, "plot");
        await growPlanting(page);

        const locked = await page.evaluate(() => {
            const g = window.game;
            // Everything the Olympian trigger needs, short of the quarrel.
            g.inSky = true;
            g.olympianSummoned = true;
            g.skyMonsterKills = SKY_MONSTERS_TO_SUMMON;
            const t = g.skyWorld.bossSpawnTile;
            const pos = tileToWorld(t.x, t.y);
            g.player.x = pos.x;
            g.player.y = pos.y;
            g.checkOlympianTrigger();
            return { spawned: g.olympianSpawned, boss: !!g.olympianBoss, defeated: g.olympianDefeated };
        });

        expect(locked.spawned, "the Twelve do not rise for a run that made peace").toBe(false);
        expect(locked.boss, "so there is nobody at the temple to fight").toBe(false);
        expect(locked.defeated, "and the Olympus-defeated ending stays unearned").toBe(false);
    });

    test("a save remembers the misses and the plot it has found", async ({ page }) => {
        await giveSeed(page);
        await plantAt(page, { x: 1200, y: 900 });
        await growPlanting(page);
        await page.evaluate(() => { window.game.world.worldtreePlot.discovered = true; });

        const restored = await page.evaluate(() => {
            const data = SaveSystem.capture(window.game);
            const round = JSON.parse(JSON.stringify(data));
            window.game.seedPlantAttempts = 0;
            window.game.world.worldtreePlot.discovered = false;
            window.game.world.worldtreePlot.charted = false;
            SaveSystem.restore(window.game, round);
            return {
                attempts: window.game.seedPlantAttempts,
                discovered: window.game.world.worldtreePlot.discovered,
                // The ladder is the tree, so a restored tree restores the route.
                ladder: !!window.game.world.skyLadder,
                burned: window.game.world.skyTree.state,
            };
        });

        expect(restored.attempts, "the misses are remembered").toBe(1);
        expect(restored.discovered, "and so is finding the plot").toBe(true);
        expect(restored.burned, "the burned tree stays burned").toBe("revealed");
        expect(restored.ladder, "and the planted tree brings its ladder back with it").toBe(true);
    });
});
