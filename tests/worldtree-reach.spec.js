const { test, expect } = require("@playwright/test");
const { startNewGame } = require("./helpers");

// "...where no road runs and no monster dares nest..." - the verse the game
// tells about the Worldtree. The corner used to be carved with an approach road
// so it could be found on foot, which the lore says is exactly what is not
// there. The Reach is trackless now, so this checks both halves: that no path
// tile survives inside it, and that the tree can still be walked up to anyway.

test.describe("the Worldtree Reach is trackless", () => {
    test.beforeEach(async ({ page }) => {
        await startNewGame(page);
    });

    test("no road runs into the Reach", async ({ page }) => {
        const paths = await page.evaluate(() => {
            const w = window.game.world;
            const z = ZONES.worldtree;
            let count = 0;
            for (let y = z.y; y < Math.min(z.y + z.h, WORLD_H); y++) {
                for (let x = z.x; x < Math.min(z.x + z.w, WORLD_W); x++) {
                    if (w.tiles[y][x] === TILE.PATH) count++;
                }
            }
            return count;
        });

        expect(paths, "the Reach carries no path tiles").toBe(0);
    });

    test("the Worldtree can still be reached on foot", async ({ page }) => {
        const glade = await page.evaluate(() => {
            const w = window.game.world;
            const start = worldToTile(window.game.player.x, window.game.player.y);
            const seen = new Set();
            const key = (x, y) => y * WORLD_W + x;
            const stack = [start];
            seen.add(key(start.x, start.y));

            while (stack.length) {
                const c = stack.pop();
                for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
                    const nx = c.x + dx, ny = c.y + dy;
                    if (nx < 0 || ny < 0 || nx >= WORLD_W || ny >= WORLD_H) continue;
                    if (seen.has(key(nx, ny))) continue;
                    if (SOLID_TILES.has(w.tiles[ny][nx])) continue;
                    seen.add(key(nx, ny));
                    stack.push({ x: nx, y: ny });
                }
            }

            // Ground beside the trunk: everything within a fire arrow's walk of
            // it that is not the canopy itself.
            const t = SKY_TREE;
            let open = 0, reachable = 0;
            for (let dy = -2; dy <= 2; dy++) {
                for (let dx = -2; dx <= 2; dx++) {
                    const x = t.x + dx, y = t.y + dy;
                    if (x < 0 || y < 0 || x >= WORLD_W || y >= WORLD_H) continue;
                    if (SOLID_TILES.has(w.tiles[y][x])) continue;
                    open++;
                    if (seen.has(key(x, y))) reachable++;
                }
            }
            return { open, reachable };
        });

        expect(glade.open, "there is open ground beside the trunk").toBeGreaterThan(0);
        expect(glade.reachable, "all of it can be walked to from where the game starts").toBe(glade.open);
    });
});
