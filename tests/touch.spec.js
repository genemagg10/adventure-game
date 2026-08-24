const { test, expect } = require("@playwright/test");
const { startNewGame, seedRun, waitForRunningGame, slotChoose } = require("./helpers");

// Runs under the phone project in playwright.config.js.
//
// Escape is not a key a phone has. Until the touch controls carried a menu
// button there was no way to save on one at all, so this walks the whole
// save-and-load path with taps only.

test.describe.serial("saving from a phone", () => {
    /** @type {import('@playwright/test').Page} */
    let page;

    test.beforeAll(async ({ browser }) => {
        page = await browser.newPage();
        await startNewGame(page);
        await seedRun(page, { gold: 640, blueGems: 3 });
    });

    test.afterAll(async () => {
        await page.close();
    });

    test("the touch controls are up, with a menu button", async () => {
        expect(await page.evaluate(() => window.game.touchControls.active)).toBe(true);
        await expect(page.locator('[data-action="pause"]')).toBeVisible();
    });

    test("the menu button opens the pause menu", async () => {
        await page.tap('[data-action="pause"]');
        await expect(page.locator("#pause-overlay")).toBeVisible();
        expect(await page.evaluate(() => window.game.paused)).toBe(true);
    });

    test("a game can be saved by tapping", async () => {
        await page.tap("#pause-save");
        await expect(page.locator("#slots-overlay")).toBeVisible();

        await page.tap(slotChoose(1));
        await expect.poll(() => page.evaluate(() => SaveSystem.hasSave(1))).toBe(true);
    });

    test("the confirmation is readable on a short screen", async () => {
        // A media rule hides .menu-note on short screens to buy room on the
        // title screen; this line is the only word that a save happened.
        await expect(page.locator("#slots-subtitle")).toBeVisible();
        await expect(page.locator("#slots-subtitle")).toContainText("Saved to slot 1");
    });

    test("the slot panel fits the screen without clipping", async () => {
        const fits = await page.evaluate(() => {
            const panel = document.querySelector(".slots-panel").getBoundingClientRect();
            return {
                withinWidth: panel.left >= 0 && panel.right <= window.innerWidth + 1,
                backVisible: panel.bottom <= window.innerHeight + 1,
            };
        });
        expect(fits.withinWidth, "panel does not overflow sideways").toBe(true);
        expect(fits.backVisible, "the Back button is reachable").toBe(true);
    });

    test("a saved game can be loaded back by tapping", async () => {
        await page.tap("#slots-close");
        await page.tap("#pause-load");
        await page.tap(slotChoose(1));
        await waitForRunningGame(page);

        expect(await page.evaluate(() => window.game.player.gold)).toBe(640);
        expect(await page.evaluate(() => window.game.paused)).toBe(false);
    });
});
