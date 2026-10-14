const { test, expect } = require("@playwright/test");
const { startNewGame, seedRun, waitForRunningGame, slotChoose, openTitle, openPause } = require("./helpers");

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
        await expect(page.locator("#slots-subtitle")).toHaveText("Game saved for Wayfarer. Slot 1.");
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

test("tapping a champion name expands the deeds", async ({ page }) => {
    await openTitle(page);
    expect(await page.evaluate(() => document.body.classList.contains("touch-mode"))).toBe(true);
    await page.evaluate(() => {
        HallOfDeeds.writeStore([{
            tagKey: "mara",
            playerTag: "Mara",
            siblingName: "Lyra",
            milestoneId: "clubhouse",
            milestone: "Found the Clubhouse",
            achievedAt: Date.parse("2026-10-06T02:00:00Z"),
            synced: true,
        }]);
    });
    await page.tap("#hallBtn");
    await expect(page.locator("#hall-overlay")).toBeVisible();
    await expect(page.locator(".champion-deeds")).toBeHidden();
    await page.locator(".champ-tag").tap();
    await expect(page.locator(".champion-row")).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator(".champion-deeds")).toBeVisible();
    await expect(page.locator(".deed-name")).toHaveText("Found the Clubhouse");
});

test("sharing a note fits a phone and typing does not swing the sword", async ({ page }) => {
    await startNewGame(page);
    await openPause(page);
    await page.tap("#pause-share");
    await expect(page.locator("#share-overlay")).toBeVisible();
    await expect(page.locator("#share-name")).toHaveValue("Wayfarer");

    const fits = await page.evaluate(() => {
        const panel = document.querySelector(".share-panel").getBoundingClientRect();
        const send = document.getElementById("share-send").getBoundingClientRect();
        return {
            withinWidth: panel.left >= -1 && panel.right <= window.innerWidth + 1,
            sendReachable: send.top >= 0 && send.bottom <= window.innerHeight + 1,
        };
    });
    expect(fits.withinWidth, "the note fits across the screen").toBe(true);
    expect(fits.sendReachable, "Send is on screen").toBe(true);

    await page.locator("#share-message").tap();
    await page.keyboard.type("Hello");
    await page.keyboard.press("Space");
    await page.keyboard.press("KeyR");
    const typed = await page.evaluate(() => ({
        attack: window.game.keys.attack,
        shoot: window.game.keys.shoot,
        text: document.getElementById("share-message").value,
    }));
    expect(typed.attack).toBeFalsy();
    expect(typed.shoot).toBeFalsy();
    expect(typed.text).toBe("Hello r");
});

test("what's new fits a phone and does not swing the sword", async ({ page }) => {
    await startNewGame(page);
    await openPause(page);
    const pauseFits = await page.evaluate(() => {
        const quit = document.getElementById("pause-quit").getBoundingClientRect();
        return quit.bottom <= window.innerHeight + 1;
    });
    expect(pauseFits, "Quit stays on screen with What's New in the menu").toBe(true);

    await page.tap("#pause-news");
    await expect(page.locator("#news-overlay")).toBeVisible();
    await expect(page.locator(".news-text").first()).toContainText("chronicle");

    const fits = await page.evaluate(() => {
        const panel = document.querySelector(".news-panel").getBoundingClientRect();
        const back = document.getElementById("news-close").getBoundingClientRect();
        const scroll = document.getElementById("news-scroll");
        const before = scroll.scrollTop;
        scroll.scrollTop = 200;
        return {
            withinWidth: panel.left >= -1 && panel.right <= window.innerWidth + 1,
            backReachable: back.top >= 0 && back.bottom <= window.innerHeight + 1,
            scrolled: scroll.scrollTop > before,
        };
    });
    expect(fits.withinWidth, "the chronicle fits across the screen").toBe(true);
    expect(fits.backReachable, "Back is on screen").toBe(true);
    expect(fits.scrolled, "the chronicle scrolls").toBe(true);

    await page.locator(".news-scroll").tap();
    await page.keyboard.press("Space");
    await page.keyboard.press("KeyR");
    const typed = await page.evaluate(() => ({
        attack: window.game.keys.attack,
        shoot: window.game.keys.shoot,
    }));
    expect(typed.attack).toBeFalsy();
    expect(typed.shoot).toBeFalsy();

    await page.tap("#news-close");
    await expect(page.locator("#pause-overlay")).toBeVisible();
    await expect(page.locator("#news-overlay")).toBeHidden();
});
