const { test, expect } = require("@playwright/test");
const {
    startNewGame, chooseCharacterAndBegin, seedRun, saveToSlot, openPause, waitForRunningGame, slotChoose,
} = require("./helpers");

// The menus that reach saving. Escape has to back out one layer at a time
// rather than dumping the player into a fight, and Controls has to return to
// wherever it was opened from.

test.describe.serial("the pause menu", () => {
    /** @type {import('@playwright/test').Page} */
    let page;

    test.beforeAll(async ({ browser }) => {
        page = await browser.newPage();
        await startNewGame(page);
    });

    test.afterAll(async () => {
        await page.close();
    });

    test("Escape opens it and stops the world", async () => {
        await openPause(page);
        expect(await page.evaluate(() => window.game.paused)).toBe(true);
    });

    test("Escape closes it again", async () => {
        // Worth its own test: pausing stops the loop that reads the key, so
        // closing has to be handled outside that loop.
        await page.keyboard.press("Escape");
        await expect(page.locator("#pause-overlay")).toBeHidden();
        expect(await page.evaluate(() => window.game.paused)).toBe(false);
    });

    test("Controls opens from the pause menu and returns to it", async () => {
        await openPause(page);
        await page.click("#pause-controls");

        await expect(page.locator("#controls-screen")).toBeVisible();
        await expect(page.locator("#pause-overlay")).toBeHidden();

        await page.click("#backBtn");
        await expect(page.locator("#pause-overlay")).toBeVisible();
        await expect(page.locator("#title-screen")).toBeHidden();
        expect(await page.evaluate(() => window.game.paused), "still paused").toBe(true);
    });

    test("Escape backs out of the slot panel to the pause menu", async () => {
        await page.click("#pause-save");
        await expect(page.locator("#slots-overlay")).toBeVisible();

        await page.keyboard.press("Escape");
        await expect(page.locator("#slots-overlay")).toBeHidden();
        await expect(page.locator("#pause-overlay")).toBeVisible();
    });

    test("Escape then closes the pause menu and resumes play", async () => {
        await page.keyboard.press("Escape");
        await expect(page.locator("#pause-overlay")).toBeHidden();
        expect(await page.evaluate(() => window.game.paused)).toBe(false);
    });

    test("Quit to Title leaves play and clears the menus", async () => {
        await openPause(page);
        await page.click("#pause-quit");

        await expect(page.locator("#title-screen")).toBeVisible();
        await expect(page.locator("#pause-overlay")).toBeHidden();
        expect(await page.evaluate(() => window.game.paused)).toBe(false);
    });
});

test.describe.serial("the title screen", () => {
    /** @type {import('@playwright/test').Page} */
    let page;

    test.beforeAll(async ({ browser }) => {
        page = await browser.newPage();
        await startNewGame(page);
        await seedRun(page, { gold: 777, blueGems: 4 });
        await saveToSlot(page, 2);
        await openPause(page);
        await page.click("#pause-quit");
    });

    test.afterAll(async () => {
        await page.close();
    });

    test("Load Game appears once a save exists", async () => {
        await expect(page.locator("#loadBtn")).toBeVisible();
        await expect(page.locator("#continueBtn")).toBeVisible();
    });

    test("the slot panel takes the title screen's place while open", async () => {
        await page.click("#loadBtn");
        await expect(page.locator("#slots-overlay")).toBeVisible();
        // Both sit on the same stacking layer, so leaving the title art up
        // would put it in front and swallow every click.
        await expect(page.locator("#title-screen")).toBeHidden();
    });

    test("Back returns to the title screen", async () => {
        await page.click("#slots-close");
        await expect(page.locator("#title-screen")).toBeVisible();
        await expect(page.locator("#slots-overlay")).toBeHidden();
    });

    test("Controls from the title returns to the title", async () => {
        await page.click("#controlsBtn");
        await expect(page.locator("#controls-screen")).toBeVisible();

        await page.click("#backBtn");
        await expect(page.locator("#title-screen")).toBeVisible();
        await expect(page.locator("#pause-overlay")).toBeHidden();
    });

    test("a slot can be loaded straight from the title", async () => {
        await page.click("#loadBtn");
        await page.click(slotChoose(2));
        await waitForRunningGame(page);

        expect(await page.evaluate(() => window.game.player.gold)).toBe(777);
        await expect(page.locator("#title-screen")).toBeHidden();
    });

    test("starting a new game does not disturb the saves", async () => {
        await openPause(page);
        await page.click("#pause-quit");
        await chooseCharacterAndBegin(page);
        await page.waitForFunction(() => window.game.state === "playing");

        expect(await page.evaluate(() => SaveSystem.meta(2).gold)).toBe(777);
        expect(await page.evaluate(() => window.game.player.gold), "the new run starts fresh").toBe(50);
    });
});
