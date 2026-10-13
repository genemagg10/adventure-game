const { test, expect } = require("@playwright/test");
const { startNewGame, openPause, slotChoose } = require("./helpers");

test("a save names the Hall tag, and a blank tag falls back", async ({ page }) => {
    await startNewGame(page);
    await page.evaluate(() => { window.game.player.playerTag = "  Mara  "; });
    await openPause(page);
    await page.click("#pause-save");
    await page.click(slotChoose(1));
    const subtitle = page.locator("#slots-subtitle");
    await expect(subtitle).toBeVisible();
    await expect(subtitle).toHaveText("Game saved for Mara. Slot 1.");

    await page.evaluate(() => { window.game.player.playerTag = ""; });
    await page.click(slotChoose(2));
    await expect(subtitle).toHaveText("Game saved for Wayfarer. Slot 2.");
});
