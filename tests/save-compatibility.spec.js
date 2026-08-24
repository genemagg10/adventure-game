const { test, expect } = require("@playwright/test");
const { startNewGame, seedRun, saveToSlot, waitForRunningGame } = require("./helpers");

// Saves outlive the build that wrote them. A save made before a feature
// existed has to load anyway, inheriting that feature's fresh-game defaults
// rather than refusing or arriving half-built.

test.describe.serial("saves from other builds", () => {
    /** @type {import('@playwright/test').Page} */
    let page;

    test.beforeAll(async ({ browser }) => {
        page = await browser.newPage();
        await startNewGame(page);
        await seedRun(page, { gold: 1234, blueGems: 3 });
        await saveToSlot(page, 1);
    });

    test.afterAll(async () => {
        await page.close();
    });

    test("an older save inherits defaults for what it never knew about", async () => {
        // Strip fields to imitate a save written before they were added.
        await page.evaluate(() => {
            const raw = JSON.parse(localStorage.getItem("ingoizersWorld.save.slot1"));
            delete raw.player.hasZeusBolts;
            delete raw.player.apples;
            delete raw.game.zeusAppeased;
            delete raw.world.makersHollow;
            delete raw.companions;
            localStorage.setItem("ingoizersWorld.save.slot1", JSON.stringify(raw));
        });

        await page.evaluate(() => window.game.loadFromSlot(1));
        await waitForRunningGame(page);

        const state = await page.evaluate(() => ({
            zeusBolts: window.game.player.hasZeusBolts,
            apples: window.game.player.apples,
            zeusAppeased: window.game.zeusAppeased,
            hollowDiscovered: window.game.world.makersHollow.discovered,
            companions: window.game.companions.length,
            gold: window.game.player.gold,
        }));

        expect(state.zeusBolts, "a missing flag defaults to off").toBe(false);
        expect(state.apples, "a missing count defaults to a new game's 2").toBe(2);
        expect(state.zeusAppeased).toBe(false);
        expect(state.hollowDiscovered, "a missing world object defaults to undiscovered").toBe(false);
        expect(state.companions, "a missing pack loads as no pack").toBe(0);
        expect(state.gold, "fields the save did carry still arrive").toBe(1234);
    });

    test("a save from a newer build is refused rather than half-loaded", async () => {
        const result = await page.evaluate(() => {
            const raw = JSON.parse(localStorage.getItem("ingoizersWorld.save.slot1"));
            raw.version = SaveSystem.VERSION + 1;
            localStorage.setItem("ingoizersWorld.save.slot1", JSON.stringify(raw));
            return { read: SaveSystem.read(1), recent: SaveSystem.mostRecentSlot() };
        });

        expect(result.read, "a newer save is not parsed into this build").toBeNull();
        expect(result.recent, "Continue does not offer a save it cannot read").toBeNull();
    });

    test("corrupt save data does not take the game down with it", async () => {
        const result = await page.evaluate(() => {
            localStorage.setItem("ingoizersWorld.save.slot2", "{ this is not json");
            return { read: SaveSystem.read(2), hasSave: SaveSystem.hasSave(2) };
        });

        expect(result.read).toBeNull();
        expect(result.hasSave).toBe(false);
    });

    test("the title screen hides Continue when nothing is readable", async () => {
        await page.evaluate(() => localStorage.clear());
        await page.reload();
        await page.waitForFunction(() => window.game);

        await expect(page.locator("#continueBtn")).toBeHidden();
        await expect(page.locator("#loadBtn")).toBeHidden();
        await expect(page.locator("#startBtn")).toBeVisible();
    });
});
