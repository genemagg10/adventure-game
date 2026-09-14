// The sprint & energy system: hold F to run faster while energy lasts, eat
// apples (E, when nothing else is near) to refill the bar, and see it all on
// the HUD.
const { test, expect } = require("@playwright/test");
const { startNewGame } = require("./helpers");

test.describe("sprint and energy", () => {
    test.beforeEach(async ({ page }) => {
        await startNewGame(page);
    });

    test("the energy bar is on the HUD, starting full", async ({ page }) => {
        await expect(page.locator("#energy-bar")).toBeVisible();
        const [energy, maxEnergy] = await page.evaluate(() => {
            const p = window.game.player;
            return [p.energy, p.maxEnergy];
        });
        expect(energy).toBe(maxEnergy);
        await expect(page.locator("#energy-text")).toHaveText(`${maxEnergy}/${maxEnergy}`);
        // Fill spans the whole bar at full energy.
        await expect(page.locator("#energy-fill")).toHaveAttribute("style", /width:\s*100%/);
    });

    test("holding sprint while moving drains energy and speeds the hero up", async ({ page }) => {
        const before = await page.evaluate(() => window.game.player.energy);
        const covered = await page.evaluate(async () => {
            const g = window.game;
            const startX = g.player.x;
            g.keys.right = true;
            g.keys.sprint = true;
            await new Promise(r => setTimeout(r, 500));
            g.keys.right = false;
            g.keys.sprint = false;
            return g.player.x - startX;
        });
        const after = await page.evaluate(() => window.game.player.energy);
        expect(after).toBeLessThan(before);          // energy was spent
        expect(g_positive(covered)).toBe(true);       // the hero actually moved

        // The bar wears the "sprinting" cue while the boot is down.
        const sprintingClass = await page.evaluate(async () => {
            const g = window.game;
            g.keys.right = true; g.keys.sprint = true;
            await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
            const has = document.getElementById("energy-bar").classList.contains("sprinting");
            g.keys.right = false; g.keys.sprint = false;
            return has;
        });
        expect(sprintingClass).toBe(true);
    });

    test("sprinting covers more ground than walking the same time", async ({ page }) => {
        const measure = async (sprint) => page.evaluate(async (sprint) => {
            const g = window.game;
            g.player.energy = g.player.maxEnergy;      // fresh bar each run
            const startX = g.player.x;
            g.keys.right = true;
            g.keys.sprint = sprint;
            await new Promise(r => setTimeout(r, 400));
            g.keys.right = false;
            g.keys.sprint = false;
            return Math.abs(g.player.x - startX);
        }, sprint);
        const walked = await measure(false);
        const sprinted = await measure(true);
        expect(sprinted).toBeGreaterThan(walked);
    });

    test("you cannot sprint on an empty bar", async ({ page }) => {
        const covered = await page.evaluate(async () => {
            const g = window.game;
            g.player.energy = 0;
            const startX = g.player.x;
            g.keys.right = true;
            g.keys.sprint = true;
            await new Promise(r => setTimeout(r, 300));
            g.keys.right = false;
            g.keys.sprint = false;
            return Math.abs(g.player.x - startX);
        });
        const energy = await page.evaluate(() => window.game.player.energy);
        expect(energy).toBe(0);   // stayed at zero, never went negative
        // With an empty bar the hero can still walk, just not faster.
        expect(covered).toBeGreaterThan(0);
        await expect(page.locator("#energy-bar")).toHaveClass(/empty/);
    });

    test("pressing E on an empty bar eats an apple to refill a quarter", async ({ page }) => {
        const result = await page.evaluate(async () => {
            const g = window.game;
            g.player.apples = 3;
            g.player.energy = 0;              // bar spent, so E feeds
            const applesBefore = g.player.apples;
            g.keyJustPressed.interact = true; // nothing is near
            g.update(16);
            return {
                applesBefore,
                applesAfter: g.player.apples,
                energyAfter: g.player.energy,
                gain: ENERGY_CONFIG.appleGain,
            };
        });
        expect(result.applesAfter).toBe(result.applesBefore - 1);
        expect(result.energyAfter).toBe(result.gain);
    });

    test("E does not eat an apple while there is still energy left", async ({ page }) => {
        const result = await page.evaluate(async () => {
            const g = window.game;
            g.player.apples = 2;
            g.player.energy = 40;             // not empty -> no nibbling
            g.keyJustPressed.interact = true;
            g.update(16);
            return { energy: g.player.energy, apples: g.player.apples };
        });
        expect(result.apples).toBe(2);       // apple saved
        expect(result.energy).toBe(40);      // untouched
    });
});

// tiny local helper so the assertion above reads cleanly
function g_positive(n) { return n > 0; }
