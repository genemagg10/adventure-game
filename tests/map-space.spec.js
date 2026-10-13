const { test, expect } = require("@playwright/test");
const { startNewGame } = require("./helpers");

async function mapOpen(page) {
    return page.evaluate(() => !document.getElementById("map-overlay").classList.contains("hidden"));
}

test("space does not open the map when the map button is focused", async ({ page }) => {
    await startNewGame(page);

    await page.focus("#minimap-container");
    const focused = await page.evaluate(() => document.activeElement && document.activeElement.id);
    expect(focused).toBe("minimap-container");

    await page.keyboard.press("Space");
    await page.waitForTimeout(150);
    expect(await mapOpen(page)).toBe(false);

    const swung = await page.evaluate(() => Date.now() - window.game.player.lastAttackTime < 1000);
    expect(swung).toBe(true);

    await page.keyboard.press("KeyM");
    await page.waitForTimeout(150);
    expect(await mapOpen(page)).toBe(true);

    await page.keyboard.press("KeyM");
    await page.waitForTimeout(150);
    expect(await mapOpen(page)).toBe(false);

    await page.click("#minimap-container");
    await page.waitForTimeout(150);
    expect(await mapOpen(page)).toBe(true);
    const blurred = await page.evaluate(() => document.activeElement && document.activeElement.id);
    expect(blurred).not.toBe("minimap-container");
});
