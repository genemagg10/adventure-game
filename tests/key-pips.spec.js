const { test, expect } = require("@playwright/test");
const { startNewGame, saveToSlot, waitForRunningGame } = require("./helpers");

function pipState(page) {
    return page.evaluate(() => {
        const row = document.getElementById("key-pips");
        const style = getComputedStyle(row);
        const pips = {};
        for (const pip of row.querySelectorAll(".key-pip")) {
            pips[pip.dataset.key] = pip.classList.contains("on");
        }
        return {
            hidden: row.classList.contains("hidden") || style.display === "none",
            pips,
        };
    });
}

async function loadSlot(page, slot) {
    await page.evaluate(() => window.game.restart());
    await page.click("#loadBtn");
    await page.click(`#slots-list .save-slot:nth-child(${slot}) .save-slot-choose`);
    await waitForRunningGame(page);
}

test("a new game hides the key pip", async ({ page }) => {
    await startNewGame(page);
    const state = await pipState(page);
    expect(state.hidden).toBe(true);
    expect(state.pips).toEqual({ copper: false, jade: false, crystal: false });
});

test("a save with no strange keys keeps the pip hidden", async ({ page }) => {
    await startNewGame(page);
    await saveToSlot(page, 1);
    await loadSlot(page, 1);
    const state = await pipState(page);
    expect(state.hidden).toBe(true);
    expect(state.pips).toEqual({ copper: false, jade: false, crystal: false });
});

test("a save with one strange key shows the pip on load", async ({ page }) => {
    await startNewGame(page);
    await page.evaluate(() => {
        window.game.player.holdKey("jade");
        window.game.ui.updateHud(window.game.player);
    });
    const live = await pipState(page);
    expect(live.hidden).toBe(false);
    expect(live.pips).toEqual({ copper: false, jade: true, crystal: false });

    await saveToSlot(page, 2);
    await loadSlot(page, 2);
    const loaded = await pipState(page);
    expect(loaded.hidden).toBe(false);
    expect(loaded.pips).toEqual({ copper: false, jade: true, crystal: false });
});
