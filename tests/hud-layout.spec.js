const { test, expect } = require("@playwright/test");
const { startNewGame, dismissDialogs, saveToSlot } = require("./helpers");

// Two pieces of layout that only break when something else is added: the
// minimap stopped being the whole realm when fog of war arrived, and the title
// screen started pushing its own crest through the frame when Continue and
// Load Game turned up beside Begin Adventure. Both are the kind of regression
// nobody notices from a passing unit test, so they are measured here.

// The gilt frame is drawn at inset 10px and carries another 5px of inner
// bevel, so anything closer than this to an edge is touching it.
const FRAME = 15;

/**
 * Where the player diamond has been drawn on the minimap, as a fraction of the
 * charted window: 0,0 is its top-left corner and 1,1 its bottom-right.
 *
 * Found by its fill rather than by asking the map where it put it, so the test
 * measures what a player can actually see. The diamond is #4ef06a; the tight
 * window keeps out the Green Castle crown a few shades down at #4cd964, and
 * the meadow itself.
 */
function markerAt(page) {
    return page.evaluate(() => {
        const canvas = document.getElementById("minimap");
        const view = MINIMAP_LAYOUT.view;
        const w = canvas.width, h = canvas.height;
        const px = canvas.getContext("2d").getImageData(0, 0, w, h).data;
        const near = (v, want) => Math.abs(v - want) <= 6;
        let sx = 0, sy = 0, n = 0;
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                const i = (y * w + x) * 4;
                if (near(px[i], 0x4e) && near(px[i + 1], 0xf0) && near(px[i + 2], 0x6a)) {
                    sx += x; sy += y; n++;
                }
            }
        }
        if (n < 3) return null;
        return { x: (sx / n - view.x) / view.w, y: (sy / n - view.y) / view.h };
    });
}

/** Where the player actually is, as a fraction of the realm. */
function playerAt(page) {
    return page.evaluate(() => ({
        x: window.game.player.x / (WORLD_W * TILE_SIZE),
        y: window.game.player.y / (WORLD_H * TILE_SIZE),
    }));
}

/** Put the player somewhere and let the HUD draw a frame of it. */
async function standAt(page, tileX, tileY) {
    await page.evaluate(([tx, ty]) => {
        window.game.player.x = tx * TILE_SIZE;
        window.game.player.y = ty * TILE_SIZE;
    }, [tileX, tileY]);
    await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
}

test.describe.serial("the minimap is the whole realm", () => {
    /** @type {import('@playwright/test').Page} */
    let page;

    test.beforeAll(async ({ browser }) => {
        page = await browser.newPage();
        await startNewGame(page);
        await dismissDialogs(page);
    });

    test.afterAll(async () => {
        await page.close();
    });

    test("the canvas is the size the map code draws at", async () => {
        // The element carries its own width and height, so a change to the
        // layout that skips index.html would silently draw off the edge.
        const canvas = await page.evaluate(() => {
            const c = document.getElementById("minimap");
            return { w: c.width, h: c.height, layout: { w: MINIMAP_LAYOUT.w, h: MINIMAP_LAYOUT.h } };
        });
        expect(canvas.w).toBe(canvas.layout.w);
        expect(canvas.h).toBe(canvas.layout.h);
    });

    // The one thing a full map does that a window around the player cannot:
    // where you are on the map is where you are in the world. A windowed
    // minimap keeps the marker pinned near the middle wherever you walk.
    for (const [where, tx, ty] of [
        ["the north-west meadow", 12, 12],
        ["Ing Castle, right across the realm", 180, 60],
        ["the southern greenlands", 80, 138],
    ]) {
        test(`the player marker sits where the player stands - ${where}`, async () => {
            await standAt(page, tx, ty);
            const marker = await markerAt(page);
            const player = await playerAt(page);
            expect(marker, "the player marker is drawn").not.toBeNull();
            expect(Math.abs(marker.x - player.x), "east to west").toBeLessThan(0.03);
            expect(Math.abs(marker.y - player.y), "north to south").toBeLessThan(0.03);
        });
    }
});

test.describe.serial("the title screen fits its frame", () => {
    /** @type {import('@playwright/test').Page} */
    let page;

    test.beforeAll(async ({ browser }) => {
        page = await browser.newPage();
        await startNewGame(page);
        await saveToSlot(page, 1);
        // Back to the title the long way round, so it comes up the way a
        // returning player sees it: Continue and Load Game both present.
        await page.reload();
        await page.waitForFunction(() => window.game);
        await expect(page.locator("#continueBtn")).toBeVisible();
        await expect(page.locator("#loadBtn")).toBeVisible();
    });

    test.afterAll(async () => {
        await page.close();
    });

    for (const [w, h] of [[1280, 800], [1180, 820], [1024, 640], [1280, 560], [844, 390]]) {
        test(`nothing crosses the border at ${w}x${h}`, async () => {
            await page.setViewportSize({ width: w, height: h });
            await page.evaluate(() => new Promise(r => requestAnimationFrame(() => r())));

            const box = await page.evaluate(() => {
                const screen = document.getElementById("title-screen").getBoundingClientRect();
                const lockup = document.querySelector(".title-lockup").getBoundingClientRect();
                const menu = document.querySelector(".title-menu").getBoundingClientRect();
                const version = document.querySelector(".title-version");
                const shown = getComputedStyle(version).display !== "none";
                return {
                    top: lockup.top - screen.top,
                    bottom: screen.bottom - menu.bottom,
                    left: lockup.left - screen.left,
                    versionTop: shown ? version.getBoundingClientRect().top : null,
                    menuBottom: menu.bottom,
                };
            });

            expect(box.top, "the crest clears the top of the frame").toBeGreaterThanOrEqual(FRAME);
            expect(box.bottom, "the menu clears the bottom of the frame").toBeGreaterThanOrEqual(FRAME);
            expect(box.left, "the lockup clears the side of the frame").toBeGreaterThanOrEqual(FRAME);
            if (box.versionTop !== null) {
                expect(box.versionTop, "the version line sits below the menu").toBeGreaterThanOrEqual(box.menuBottom);
            }
        });
    }
});
