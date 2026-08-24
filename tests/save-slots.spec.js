const { test, expect } = require("@playwright/test");
const {
    startNewGame, seedRun, saveToSlot, openPause, waitForRunningGame,
    slotRow, slotChoose, slotConfirm, slotCancel, slotDelete,
} = require("./helpers");

// Three slots that hold three different runs, and never lose one by accident.
// Overwriting and deleting both throw away a run, so both have to ask first
// and both have to be genuinely cancellable.

test.describe.serial("save slots", () => {
    /** @type {import('@playwright/test').Page} */
    let page;

    const goldIn = slot => page.evaluate(s => SaveSystem.meta(s).gold, slot);

    test.beforeAll(async ({ browser }) => {
        page = await browser.newPage();
        await startNewGame(page);
    });

    test.afterAll(async () => {
        await page.close();
    });

    test("three runs can be kept side by side", async () => {
        for (const [slot, gold] of [[1, 111], [2, 222], [3, 333]]) {
            await seedRun(page, { gold });
            await saveToSlot(page, slot);
        }

        expect(await goldIn(1)).toBe(111);
        expect(await goldIn(2)).toBe(222);
        expect(await goldIn(3)).toBe(333);
    });

    test("each slot shows what is in it", async () => {
        await openPause(page);
        await page.click("#pause-load");

        const row = page.locator(slotRow(1));
        await expect(row).toContainText("Slot 1");
        await expect(row).toContainText("Green Meadow");
        await expect(row).toContainText("111 gold");
        await expect(row).toContainText("played");
    });

    test("overwriting asks first, and names the run at stake", async () => {
        await page.click("#slots-close");
        await page.click("#pause-save");
        await seedRun(page, { gold: 999 });

        await page.click(slotChoose(2));
        const confirm = page.locator(`${slotRow(2)}.save-slot-confirm`);
        await expect(confirm).toBeVisible();
        // Naming the run is the point: the player can still change their mind.
        await expect(confirm).toContainText("Overwrite slot 2");
        await expect(confirm).toContainText("Green Meadow");
    });

    test("cancelling an overwrite leaves the save alone", async () => {
        await page.click(slotCancel(2));
        await expect(page.locator(`${slotRow(2)}.save-slot-confirm`)).toHaveCount(0);
        expect(await goldIn(2)).toBe(222);
    });

    test("confirming an overwrite replaces only that slot", async () => {
        // seedRun cannot run while the panel is up without reopening it, so the
        // gold set before the previous test still stands.
        await page.click(slotChoose(2));
        await page.click(slotConfirm(2));
        await expect.poll(() => goldIn(2)).toBe(999);

        expect(await goldIn(1), "slot 1 untouched").toBe(111);
        expect(await goldIn(3), "slot 3 untouched").toBe(333);
    });

    test("the panel says what it just did", async () => {
        await expect(page.locator("#slots-subtitle")).toContainText("Saved to slot 2");
    });

    test("deleting asks first", async () => {
        await page.click(slotDelete(3));
        const confirm = page.locator(`${slotRow(3)}.save-slot-confirm`);
        await expect(confirm).toBeVisible();
        await expect(confirm).toContainText("cannot be undone");
    });

    test("cancelling a delete keeps the save", async () => {
        await page.click(slotCancel(3));
        expect(await page.evaluate(() => SaveSystem.hasSave(3))).toBe(true);
    });

    test("confirming a delete empties the slot and offers it again", async () => {
        await page.click(slotDelete(3));
        await page.click(slotConfirm(3));
        await expect.poll(() => page.evaluate(() => SaveSystem.hasSave(3))).toBe(false);
        await expect(page.locator(slotRow(3))).toContainText("Empty");
    });

    test("an empty slot can be saved into but not loaded from", async () => {
        await page.click("#slots-close");
        await page.click("#pause-load");

        await expect(page.locator(slotChoose(3))).toBeDisabled();
        await expect(page.locator(slotChoose(1))).toBeEnabled();
    });

    test("loading picks the chosen slot, not the most recent one", async () => {
        // Slot 2 was written last; asking for slot 1 must get slot 1.
        await page.click(slotChoose(1));
        await waitForRunningGame(page);

        expect(await page.evaluate(() => window.game.player.gold)).toBe(111);
    });

    test("a game loaded from a paused game does not arrive paused", async () => {
        expect(await page.evaluate(() => window.game.paused)).toBe(false);
        await expect(page.locator("#slots-overlay")).toBeHidden();
        await expect(page.locator("#pause-overlay")).toBeHidden();
    });
});
