const { test, expect } = require("@playwright/test");
const { startNewGame, dismissDialogs } = require("./helpers");

// Burning the Worldtree leaves one seed, and the seed does not go back in the
// ash - that is the whole point of it. It goes in the Waiting Ground: a square
// of bare brown earth in the middle of the Fallow, in the far southeast, with
// no tree, no stone and no road anywhere near it. These tests cover the plot
// being genuinely that, the clues that walk a lost player to it, and the tree
// that comes up when the seed finally lands where it belongs.

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
        window.game.world.revealSkyLadder();
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

/** Pull a rootless sapling back up so the seed can be tried somewhere else. */
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
            w.revealSkyLadder();
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
        await giveSeed(page);
    });

    test("the old ash grows a sapling and says why", async ({ page }) => {
        const said = (await plantAt(page, "ash")).join(" ");

        const state = await page.evaluate(() => ({
            rooted: window.game.world.sapling.rooted,
            restored: window.game.worldtreeRestored,
            carrying: window.game.player.hasWorldtreeSeed,
        }));

        expect(said, "the ash is named as the wrong answer").toContain("cannot begin in the end of itself");
        expect(state.rooted, "nothing takes root there").toBe(false);
        expect(state.restored, "and no Worldtree comes back").toBe(false);
        expect(state.carrying, "the seed is in the ground, not the pocket").toBe(false);

        await recoverSeed(page);
        expect(await page.evaluate(() => window.game.player.hasWorldtreeSeed),
            "a rootless sapling always gives the seed back").toBe(true);
    });

    test("every miss buys a plainer clue, and enough of them chart the plot", async ({ page }) => {
        const rungs = await page.evaluate(() => WORLDTREE_SEED_CLUES.length);
        const clues = [];
        for (let i = 0; i < rungs; i++) {
            if (i > 0) await recoverSeed(page);
            clues.push((await plantAt(page, { x: 1200 + i * 260, y: 900 })).join(" "));
        }

        expect(clues[0], "the first miss is just a sapling").toContain("it is not a Worldtree");
        expect(clues[1], "the second points a direction").toContain("south");
        expect(clues[2], "the third names the country").toContain("Fallow");
        expect(clues[3], "the fourth describes the plot").toContain("bare turned earth");

        const charted = await page.evaluate(() => {
            const plot = window.game.world.worldtreePlot;
            return {
                charted: plot.charted,
                marked: window.game.world.mapLandmarks().some(m => m.label === WORLDTREE_PLOT.name),
            };
        });
        expect(charted.charted, "a lost player is never left lost").toBe(true);
        expect(charted.marked, "the plot goes on the chart").toBe(true);
    });

    test("the right plot grows the Worldtree and settles Zeus", async ({ page }) => {
        const planted = (await plantAt(page, "plot")).join(" ");
        expect(planted, "the ground was ready for it").toContain("as though the hole had been dug for it");
        expect(await page.evaluate(() => window.game.world.sapling.rooted), "it takes root").toBe(true);

        // Growing is on a timer, and the game pauses while a dialog is up - so
        // keep answering the world, and keep everything it says.
        const heard = [];
        await expect.poll(async () => {
            heard.push(...await drainDialogs(page));
            return page.evaluate(() => window.game.world.sapling.grown);
        }, { timeout: 15000 }).toBe(true);
        heard.push(...await drainDialogs(page));
        const said = heard.join(" ");

        const state = await page.evaluate(() => ({
            restored: window.game.worldtreeRestored,
            regrown: window.game.world.skyTree.regrown,
            appeased: window.game.zeusAppeased,
            bolts: window.game.player.hasZeusBolts,
            marked: window.game.world.mapLandmarks().some(m => m.label === "The Worldtree"),
        }));

        expect(said, "Zeus notices it is not where he left it").toContain("Not where I put it");
        expect(state.restored, "the Worldtree stands again").toBe(true);
        expect(state.regrown, "the world knows it").toBe(true);
        expect(state.appeased, "and the quarrel is over before it starts").toBe(true);
        expect(state.bolts, "with the lightning given freely").toBe(true);
        expect(state.marked, "the new tree is on the chart, in the Fallow").toBe(true);
    });

    test("a save remembers the misses and the plot it has found", async ({ page }) => {
        await plantAt(page, { x: 1200, y: 900 });
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
            };
        });

        expect(restored.attempts, "the misses are remembered").toBe(1);
        expect(restored.discovered, "and so is finding the plot").toBe(true);
    });
});
