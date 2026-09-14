// The Maker's Hollow is a fast-travel room: doorways line its walls, one per
// landmark the player has found, and stepping through one teleports the hero
// to that spot on the surface.
const { test, expect } = require("@playwright/test");
const { startNewGame } = require("./helpers");

test.describe("the Maker's Hollow doorways", () => {
    test.beforeEach(async ({ page }) => {
        await startNewGame(page);
    });

    test("the Hollow offers doorways, home and the ever-known castle among them", async ({ page }) => {
        await page.evaluate(() => window.game.ui.openAbout());
        await page.waitForSelector("#about-overlay:not(.hidden)");
        const labels = await page.locator("#hollow-doorways .hollow-door").allInnerTexts();
        expect(labels.length).toBeGreaterThan(0);
        const joined = labels.join(" | ");
        expect(joined).toContain("Green Meadow (start)"); // home is always offered
        expect(joined).toContain("Ing Castle");           // the castle is always known
    });

    test("stepping through a doorway teleports the hero and closes the room", async ({ page }) => {
        const target = await page.evaluate(() => {
            const g = window.game;
            const castle = g.hollowDestinations().find(d => d.label === "Ing Castle");
            return { x: castle.x, y: castle.y, tile: TILE_SIZE };
        });

        await page.evaluate(() => window.game.ui.openAbout());
        await page.waitForSelector("#about-overlay:not(.hidden)");
        await page.locator(".hollow-door", { hasText: "Ing Castle" }).click();
        await page.waitForSelector("#about-overlay", { state: "hidden" });

        const after = await page.evaluate(() => ({ x: window.game.player.x, y: window.game.player.y }));
        const d = Math.hypot(after.x - target.x, after.y - target.y);
        // The spiral drops the hero within a handful of tiles of the landmark.
        expect(d).toBeLessThan(12 * target.tile);
    });

    test("the hero lands on ground they can stand on, not inside a wall", async ({ page }) => {
        const solid = await page.evaluate(() => {
            const g = window.game;
            const castle = g.hollowDestinations().find(d => d.label === "Ing Castle");
            g.teleportFromHollow(castle.x, castle.y, castle.label);
            const t = worldToTile(g.player.x, g.player.y);
            return g.world.isSolid(t.x, t.y);
        });
        expect(solid).toBe(false);
    });

    test("a doorway never leads to an undiscovered spot", async ({ page }) => {
        // Fresh game: the deep-desert trader has not been seen, so no door to it.
        const hasUnseen = await page.evaluate(() => {
            const g = window.game;
            const dests = g.hollowDestinations();
            return dests.some(d => {
                // Every offered place is either always-known or charted in fog.
                const t = g.world.mapLandmarks().find(m => m.label === d.label);
                if (!t) return false; // home base is synthetic, always fine
                return !t.always && !g.world.fog.isWorldSeen(t.x, t.y);
            });
        });
        expect(hasUnseen).toBe(false);
    });
});
