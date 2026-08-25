const { test, expect } = require("@playwright/test");
const { startNewGame, saveToSlot } = require("./helpers");

// Every ending in this game leaves the realm open to wander, so the screen that
// announces one has to offer a way back into the run. It did not: the button it
// tried to add for that carried the same id as the title screen's Continue
// button, found it already in the document and quietly skipped itself. What was
// left was a lone "Try Again", which throws the run away - and a run reached by
// planting the Worldtree Seed is a long one to lose.

test.describe("an ending is not the end of the run", () => {
    test.beforeEach(async ({ page }) => {
        await startNewGame(page);
        await page.evaluate(() => {
            window.game.player.gold = 777;
            window.game.ui.showGameOver(true, "You have made peace with the King of Olympus.");
        });
    });

    test("a victory offers the way back into the world", async ({ page }) => {
        await expect(page.locator("#keepPlayingBtn")).toBeVisible();
        await expect(page.locator("#keepPlayingBtn")).toHaveText("Continue Exploring");
        // "Try Again" is not what a won game offers.
        await expect(page.locator("#restartBtn")).toHaveText("Return to Title");
    });

    test("the title screen's Continue button is left alone", async ({ page }) => {
        // The id collision used to un-hide it over a run with nothing saved.
        await expect(page.locator("#continueBtn")).toBeHidden();
    });

    test("Continue Exploring keeps the run exactly as it was", async ({ page }) => {
        await page.click("#keepPlayingBtn");
        const after = await page.evaluate(() => ({
            state: window.game.state,
            gold: window.game.player.gold,
            screenUp: !document.getElementById("game-over-screen").classList.contains("hidden"),
            onTitle: !document.getElementById("title-screen").classList.contains("hidden"),
        }));

        expect(after.screenUp, "the ending screen closes").toBe(false);
        expect(after.onTitle, "and does not drop the player at the title").toBe(false);
        expect(after.state, "the run carries on").toBe("playing");
        expect(after.gold, "with everything it had").toBe(777);
    });

    test("leaving for the title asks before throwing the run away", async ({ page }) => {
        await page.click("#restartBtn");

        await expect(page.locator("#restartBtn")).toHaveText("Leave without saving");
        await expect(page.locator("#game-over-note")).toBeVisible();
        expect(await page.evaluate(() => window.game.state), "one press does not leave").toBe("playing");

        await page.click("#restartBtn");
        expect(await page.evaluate(() => window.game.state), "the second press does").toBe("title");
        await expect(page.locator("#title-screen")).toBeVisible();
    });

    test("a saved run is still there to continue from the title", async ({ page }) => {
        await page.click("#keepPlayingBtn");
        await saveToSlot(page, 1);
        await page.evaluate(() => window.game.ui.showGameOver(true, "and again"));
        await page.click("#restartBtn");
        await page.click("#restartBtn");

        await expect(page.locator("#continueBtn")).toBeVisible();
        await page.click("#continueBtn");
        await page.waitForFunction(() => window.game.state === "playing");
        expect(await page.evaluate(() => window.game.player.gold), "the saved run comes back").toBe(777);
    });
});
