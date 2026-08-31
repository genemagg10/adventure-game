const { test, expect } = require("@playwright/test");
const {
    openTitle, chooseCharacterAndBegin, dismissDialogs, saveToSlot, waitForRunningGame,
} = require("./helpers");

// Begin Adventure leads through a character-selection screen modeled on the
// concept art: the Ingoizer heroes shown as portraits in a single row, with a
// helmeted brother (Roland) and a helmeted sister (Isolde). The chosen hero
// starts the run and is remembered across a save.

test.describe.serial("choosing a hero", () => {
    let page;

    test.beforeAll(async ({ browser }) => {
        page = await browser.newPage();
        await openTitle(page);
    });

    test.afterAll(async () => {
        await page.close();
    });

    test("Begin Adventure opens the character screen, not the world", async () => {
        await page.click("#startBtn");
        await expect(page.locator("#character-screen")).toBeVisible();
        await expect(page.locator("#title-screen")).toBeHidden();
        expect(await page.evaluate(() => window.game.state)).toBe("title");
    });

    test("every hero has a card, with at least three sisters and three brothers", async () => {
        const roster = await page.evaluate(() => INGOIZER_SIBLINGS.map(s => s.id));
        await expect(page.locator(".char-card")).toHaveCount(roster.length);
        const genders = await page.evaluate(() => INGOIZER_SIBLINGS.map(s => s.gender));
        expect(genders.filter(g => g === "girl").length).toBeGreaterThanOrEqual(3);
        expect(genders.filter(g => g === "boy").length).toBeGreaterThanOrEqual(3);
    });

    test("a brother and a sister both wear a helmet", async () => {
        const helms = await page.evaluate(() =>
            INGOIZER_SIBLINGS.filter(s => s.helmet).map(s => s.gender)
        );
        expect(helms).toContain("boy");
        expect(helms).toContain("girl");
    });

    test("each card shows a portrait image that loads", async () => {
        const broken = await page.evaluate(() =>
            [...document.querySelectorAll(".char-card .char-portrait")]
                .filter(img => !img.complete || img.naturalWidth === 0).length
        );
        expect(broken, "no broken hero portraits").toBe(0);
    });

    test("Begin Adventure is locked until a hero is picked", async () => {
        await expect(page.locator("#charBeginBtn")).toBeDisabled();
        await page.click('.char-card[data-id="isolde"]');
        await expect(page.locator('.char-card[data-id="isolde"]')).toHaveClass(/selected/);
        await expect(page.locator("#charBeginBtn")).toBeEnabled();
    });

    test("Back returns to the title without starting", async () => {
        await page.click("#charBackBtn");
        await expect(page.locator("#title-screen")).toBeVisible();
        await expect(page.locator("#character-screen")).toBeHidden();
        expect(await page.evaluate(() => window.game.state)).toBe("title");
    });

    test("the chosen hero starts the run and is remembered by a save", async () => {
        await chooseCharacterAndBegin(page, "isolde");
        await page.waitForFunction(() => window.game.state === "playing");
        await dismissDialogs(page);

        expect(await page.evaluate(() => window.game.player.siblingId)).toBe("isolde");

        await saveToSlot(page, 1);
        await page.evaluate(() => window.game.restart());
        await page.click("#continueBtn");
        await waitForRunningGame(page);

        expect(
            await page.evaluate(() => window.game.player.siblingId),
            "the loaded run keeps its hero"
        ).toBe("isolde");
    });
});
