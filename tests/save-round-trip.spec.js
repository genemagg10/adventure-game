const { test, expect } = require("@playwright/test");
const {
    startNewGame, walkAround, waitForRunningGame, readState, slotChoose, openPause,
} = require("./helpers");

// The load-bearing test. A save that quietly drops a field costs a player
// hours and reports nothing, so this walks a run into a distinctive state,
// saves, throws the whole page away, loads it back, and compares.
//
// When you add something to the game that ought to survive a save, add it to
// readState() in helpers.js and to the field lists in js/save.js. If you add
// it here and forget js/save.js, this test is what tells you.

test.describe.serial("a saved game comes back as it was", () => {
    /** @type {import('@playwright/test').Page} */
    let page;
    let before;

    test.beforeAll(async ({ browser }) => {
        page = await browser.newPage();
        await startNewGame(page);
        await walkAround(page);
    });

    test.afterAll(async () => {
        await page.close();
    });

    test("a run in progress can be saved", async () => {
        // Reach into the game to set up a state that would take an hour to
        // play to. Every one of these is something a player would be furious
        // to lose.
        await page.evaluate(() => {
            const g = window.game;
            const p = g.player;

            p.gold = 1234;
            p.blueGems = 3;
            p.arrows = 17;
            p.hp = 42;
            p.maxHp = 130;
            p.healthPotions = 5;
            p.greaterHealthPotions = 2;
            p.apples = 9;
            p.weapons = ["rusty_sword", "excalibur"];
            p.currentWeapon = "excalibur";
            p.enchantments = { excalibur: "fire" };
            p.elements = { fire: true, ice: true };
            p.activeElement = "fire";
            p.hasSheath = true;
            p.hasMerlinWand = true;
            p.hasMallet = true;
            p.hasRainbowGem = true;
            p.hasWorldtreeSeed = true;
            p.purpleGemAttack = true;
            p.greenGemAttack = true;
            p.monstersKilled = 88;

            g.ladyQuestState = "complete";
            g.merlinQuestState = "given";
            g.greenlandsUnlocked = true;
            g.tapestryRead = true;
            g.olympianSummoned = true;
            g.skyMonsterKills = 5;
            g.monsterGemDrops = 2;
            g.loreUnlocks = { origins: true };
            g.caveTreasureCollected = { 1: true, 3: true };
            g.caveBossDefeated = { 1: true };

            // A tamed pack - the one living thing a save is meant to keep.
            g.companions = [];
            Object.keys(ANIMAL_TYPES).slice(0, 3).forEach((type, i) => {
                const animal = new Animal(type, p.x + 20 + i * 10, p.y + 20);
                animal.tame(i);
                animal.hp = 7 + i;
                g.companions.push(animal);
            });

            // Pickups taken off the ground.
            g.world.gems[0].collected = true;
            g.world.coins[2].collected = true;
            g.world.apples[1].collected = true;
            g.world.ladyOfLake.excaliburGiven = true;
            g.world.merlinHut.wandCollected = true;
            g.world.castleTapestry.uncovered = true;
            g.world.makersHollow.discovered = true;

            // Permanent changes to the ground itself.
            g.world.revealHiddenLadder();
            g.world.burnWorldtreeToAsh();
        });

        // Burn a patch of forest to ash - the change the tile diff exists for.
        const burnt = await page.evaluate(() => {
            const tiles = window.game.world.tiles;
            const burnt = [];
            for (let y = 0; y < WORLD_H && burnt.length < 6; y++) {
                for (let x = 0; x < WORLD_W && burnt.length < 6; x++) {
                    if (tiles[y][x] === TILE.TREE) {
                        tiles[y][x] = TILE.PATH;
                        burnt.push([x, y]);
                    }
                }
            }
            return burnt;
        });

        // Read the run only once the world has stopped. Taking it while the
        // game is still running leaves a window between the reading and the
        // write in which a monster can take another bite out of a companion -
        // and then the save is a faithful record of a run this test never
        // looked at, and the comparison below fails for being right.
        await openPause(page);

        before = { ...(await readState(page)), burnt };
        expect(before.charted, "walking charted some ground to remember").toBeGreaterThan(0);

        await page.click("#pause-save");
        await page.click(slotChoose(1));
        await expect.poll(() => page.evaluate(() => SaveSystem.hasSave(1))).toBe(true);
    });

    test("the title screen offers to continue it", async () => {
        await page.reload();
        await page.waitForFunction(() => window.game);

        await expect(page.locator("#continueBtn")).toBeVisible();
        await expect(page.locator("#continue-note")).toContainText("3/5 gems");
        await expect(page.locator("#loadBtn")).toBeVisible();
    });

    test("continuing restores the run exactly", async () => {
        // Stop the world on the very frame the restored run starts, before a
        // single update has gone through. Reading it back takes several round
        // trips to the browser, and a monster standing next to a companion
        // will happily spend them taking another bite out of it - which is a
        // fair thing for a monster to do, and nothing whatever to do with
        // whether the save came back intact.
        await page.evaluate(() => {
            const g = window.game;
            const begin = g.beginLoop.bind(g);
            g.beginLoop = () => { begin(); g.paused = true; };
        });
        await page.click("#continueBtn");
        await waitForRunningGame(page);

        const after = await readState(page);
        for (const key of Object.keys(after)) {
            expect(after[key], `${key} survived the round trip`).toEqual(before[key]);
        }
    });

    test("ground the player changed stays changed", async () => {
        const stillAsh = await page.evaluate(
            burnt => burnt.every(([x, y]) => window.game.world.tiles[y][x] === TILE.PATH),
            before.burnt);
        expect(stillAsh, "burnt trees did not grow back on load").toBe(true);
    });

    test("the living world is repopulated rather than restored", async () => {
        // Monsters and wild animals are deliberately not saved; they respawn.
        const alive = await page.evaluate(() => ({
            monsters: window.game.monsters.length,
            wildAnimals: window.game.wildAnimals.length,
        }));
        expect(alive.monsters).toBeGreaterThan(0);
        expect(alive.wildAnimals).toBeGreaterThan(0);
    });
});
