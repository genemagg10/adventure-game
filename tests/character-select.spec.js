const { test, expect } = require("@playwright/test");
const {
    openTitle, chooseCharacterAndBegin, dismissDialogs, saveToSlot, waitForRunningGame,
} = require("./helpers");

// Begin Adventure now leads through a character-selection screen: the six
// Ingoizer siblings, three sisters and three brothers, paired by house colour.
// The chosen sibling starts the run and is remembered across a save.

test.describe.serial("choosing an Ingoizer sibling", () => {
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

    test("there are six siblings: three sisters and three brothers", async () => {
        const cards = page.locator(".char-card");
        await expect(cards).toHaveCount(6);

        const roster = await page.evaluate(() =>
            INGOIZER_SIBLINGS.map(s => ({ gender: s.gender, color: s.color }))
        );
        expect(roster.filter(s => s.gender === "girl").length).toBe(3);
        expect(roster.filter(s => s.gender === "boy").length).toBe(3);
    });

    test("each house colour has one sister and one brother", async () => {
        const roster = await page.evaluate(() =>
            INGOIZER_SIBLINGS.map(s => ({ gender: s.gender, color: s.color }))
        );
        for (const color of ["purple", "red", "blue"]) {
            const house = roster.filter(s => s.color === color);
            expect(house.length, `${color} house has two`).toBe(2);
            expect(house.some(s => s.gender === "girl"), `${color} has a sister`).toBe(true);
            expect(house.some(s => s.gender === "boy"), `${color} has a brother`).toBe(true);
        }
    });

    test("Begin Adventure is locked until a sibling is picked", async () => {
        await expect(page.locator("#charBeginBtn")).toBeDisabled();
        await page.click('.char-card[data-id="priya"]');
        await expect(page.locator('.char-card[data-id="priya"]')).toHaveClass(/selected/);
        await expect(page.locator("#charBeginBtn")).toBeEnabled();
    });

    test("Back returns to the title without starting", async () => {
        await page.click("#charBackBtn");
        await expect(page.locator("#title-screen")).toBeVisible();
        await expect(page.locator("#character-screen")).toBeHidden();
        expect(await page.evaluate(() => window.game.state)).toBe("title");
    });

    test("the chosen sibling starts the run and is remembered by a save", async () => {
        await chooseCharacterAndBegin(page, "bianca");
        await page.waitForFunction(() => window.game.state === "playing");
        await dismissDialogs(page);

        expect(await page.evaluate(() => window.game.player.siblingId)).toBe("bianca");

        await saveToSlot(page, 1);
        await page.evaluate(() => window.game.restart());
        await page.click("#continueBtn");
        await waitForRunningGame(page);

        expect(
            await page.evaluate(() => window.game.player.siblingId),
            "the loaded run keeps its hero"
        ).toBe("bianca");
    });
});
