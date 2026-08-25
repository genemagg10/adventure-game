const { test, expect } = require("@playwright/test");
const { startNewGame, saveToSlot } = require("./helpers");

// Charting every last cell of surface fog is something a player finishes, so it
// is announced: a tune, a notification, and a dialog saying so. It fires once,
// it is remembered in the save, and it is reported to the analytics.

/** Watch what the game hands to sound and analytics from here on. */
async function spyOnCelebration(page) {
    await page.evaluate(() => {
        const g = window.game;
        window.__fanfares = 0;
        window.__events = [];
        const realFanfare = g.sound.explorerFanfare.bind(g.sound);
        g.sound.explorerFanfare = (...args) => { window.__fanfares++; return realFanfare(...args); };
        const realTrack = GameAnalytics.track;
        GameAnalytics.track = (name) => { window.__events.push(name); return realTrack(name); };
    });
}

/** Chart everything but one cell, then step into it. */
async function chartAlmostEverything(page) {
    await page.evaluate(() => {
        const fog = window.game.world.fog;
        fog.seen.fill(1);
        fog.charted = fog.cols * fog.rows;
        // Leave one cell of the meadow dark, and put the player well away from it.
        const idx = 0;
        fog.seen[idx] = 0;
        fog.charted--;
        fog.lastTile = null;
    });
}

test.describe("charting the whole surface", () => {
    test.beforeEach(async ({ page }) => {
        await startNewGame(page);
        await spyOnCelebration(page);
    });

    test("nothing is announced while a corner is still dark", async ({ page }) => {
        await chartAlmostEverything(page);
        await page.evaluate(() => {
            const g = window.game;
            g.checkSurfaceCharted();
        });

        expect(await page.evaluate(() => window.game.surfaceCharted), "not charted yet").toBe(false);
        expect(await page.evaluate(() => window.__fanfares), "and nothing has played").toBe(0);
    });

    test("walking into the last dark cell is announced, with music", async ({ page }) => {
        await chartAlmostEverything(page);

        // Walk into the one cell left dark, the way a player would arrive at it.
        const shown = await page.evaluate(() => {
            const g = window.game;
            const fog = g.world.fog;
            const spot = tileToWorld(1, 1);
            g.player.x = spot.x;
            g.player.y = spot.y;
            fog.revealAround(g.player.x, g.player.y, () => false);
            g.checkSurfaceCharted();
            return {
                charted: g.surfaceCharted,
                fraction: fog.fraction(),
                fanfares: window.__fanfares,
                dialog: document.getElementById("dialog-text").textContent,
                events: window.__events,
            };
        });

        expect(shown.fraction, "every cell is charted").toBe(1);
        expect(shown.charted, "the achievement is marked").toBe(true);
        expect(shown.fanfares, "the tune plays").toBe(1);
        expect(shown.dialog).toBe(
            "Congratulations, you've explored 100% of the surface level! The fog has been cleared."
        );
        expect(shown.events, "and it reaches the analytics").toContain("surface-fully-charted");
    });

    test("it is announced once, not on every step afterwards", async ({ page }) => {
        await chartAlmostEverything(page);
        const fanfares = await page.evaluate(() => {
            const g = window.game;
            g.world.fog.revealTileRect(0, 0, WORLD_W, WORLD_H);
            for (let i = 0; i < 20; i++) g.checkSurfaceCharted();
            return window.__fanfares;
        });

        expect(fanfares, "one tune, however far the player walks after it").toBe(1);
    });

    test("a save remembers it, so a loaded game does not celebrate again", async ({ page }) => {
        await page.evaluate(() => {
            const g = window.game;
            g.world.fog.revealTileRect(0, 0, WORLD_W, WORLD_H);
            g.checkSurfaceCharted();
            g.ui.dialogQueue = [];
            g.ui.dialogActive = false;
            document.getElementById("dialog-box").classList.add("hidden");
        });
        await saveToSlot(page, 1);

        // Back to the title with the save still in storage, then continue it.
        await page.reload();
        await page.waitForFunction(() => window.game);
        await spyOnCelebration(page);
        await page.click("#continueBtn");
        await page.waitForFunction(() => window.game.state === "playing");
        await page.waitForTimeout(300);

        const loaded = await page.evaluate(() => ({
            charted: window.game.surfaceCharted,
            fanfares: window.__fanfares,
        }));

        expect(loaded.charted, "the loaded run remembers it was earned").toBe(true);
        expect(loaded.fanfares, "so it is not celebrated a second time").toBe(0);
    });
});
