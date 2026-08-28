const { test, expect } = require("@playwright/test");
const { startNewGame, dismissDialogs } = require("./helpers");

test.describe("runtime scheduling", () => {
    test.beforeEach(async ({ page }) => {
        await startNewGame(page);
        await dismissDialogs(page);
    });

    test("loading replaces the scheduled game loop instead of adding another", async ({ page }) => {
        const result = await page.evaluate(() => {
            const g = window.game;
            SaveSystem.write(1, SaveSystem.capture(g));

            const previousFrame = g.frameRequestId;
            const previousGeneration = g.loopGeneration;
            const cancelled = [];
            const nativeCancel = window.cancelAnimationFrame.bind(window);
            window.cancelAnimationFrame = id => {
                cancelled.push(id);
                nativeCancel(id);
            };

            const loaded = g.loadFromSlot(1);
            window.cancelAnimationFrame = nativeCancel;
            return {
                loaded,
                previousFrame,
                currentFrame: g.frameRequestId,
                previousGeneration,
                currentGeneration: g.loopGeneration,
                cancelled,
            };
        });

        expect(result.loaded).toBe(true);
        expect(result.cancelled).toContain(result.previousFrame);
        expect(result.currentFrame).not.toBe(result.previousFrame);
        expect(result.currentGeneration).toBeGreaterThan(result.previousGeneration);
    });

    test("unchanged HUD state does not repaint the DOM", async ({ page }) => {
        const result = await page.evaluate(() => {
            const g = window.game;
            g.ui._hudSignature = null;
            const initial = g.ui.updateHud(g.player);
            const unchanged = g.ui.updateHud(g.player);
            g.player.gold += 1;
            const changed = g.ui.updateHud(g.player);
            const unchangedAgain = g.ui.updateHud(g.player);
            return { initial, unchanged, changed, unchangedAgain };
        });

        expect(result).toEqual({
            initial: true,
            unchanged: false,
            changed: true,
            unchangedAgain: false,
        });
    });

    test("minimap rendering is capped independently of the main canvas", async ({ page }) => {
        const count = await page.evaluate(() => {
            const g = window.game;
            g.stopLoop();
            g.paused = false;
            g.minimapDirty = true;
            g.lastMinimapRender = 0;

            let renders = 0;
            const nativeRender = g.world.renderMinimap.bind(g.world);
            g.world.renderMinimap = (...args) => {
                renders++;
                return nativeRender(...args);
            };

            for (let time = 0; time <= 1000; time += 1000 / 60) {
                g.time = time;
                g.render();
            }
            return renders;
        });

        expect(count).toBeGreaterThanOrEqual(11);
        expect(count).toBeLessThanOrEqual(13);
    });
});
