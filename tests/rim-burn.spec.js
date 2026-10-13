const { test, expect } = require("@playwright/test");
const { startNewGame } = require("./helpers");

test("fire burns a tree on the top row and the rim still holds the player in", async ({ page }) => {
    await startNewGame(page);
    const result = await page.evaluate(() => {
        const g = window.game;
        const w = g.world;

        function quiet() {
            g.ui.dialogQueue = [];
            g.ui.dialogActive = false;
            document.getElementById("dialog-box").classList.add("hidden");
            g.keyJustPressed = {};
        }

        function standFor(tx, ty) {
            for (let dy = -TERRAIN_CLEAR_RADIUS; dy <= TERRAIN_CLEAR_RADIUS; dy++) {
                for (let dx = -TERRAIN_CLEAR_RADIUS; dx <= TERRAIN_CLEAR_RADIUS; dx++) {
                    const x = tx + dx;
                    const y = ty + dy;
                    if (x < 0 || y < 0 || x >= WORLD_W || y >= WORLD_H) continue;
                    if (!w.isSolid(x, y)) return { x, y };
                }
            }
            return null;
        }

        function cast(element, stand) {
            quiet();
            g.player.elements[element] = true;
            g.player.activeElement = element;
            g.player.elementCooldown = 0;
            g.player.x = stand.x * TILE_SIZE + TILE_SIZE / 2;
            g.player.y = stand.y * TILE_SIZE + TILE_SIZE / 2;
            g.keyJustPressed = { element: true };
            g.update(16);
        }

        let top = null;
        for (let y = 0; y < 2 && !top; y++) {
            for (let x = 0; x < WORLD_W && !top; x++) {
                if (w.tiles[y][x] !== TILE.TREE) continue;
                if (w.terrainProtected(x, y, "fire")) continue;
                const stand = standFor(x, y);
                if (stand) top = { x, y, stand };
            }
        }
        if (!top) {
            w.tiles[0][40] = TILE.TREE;
            if (w.isSolid(40, 3)) w.tiles[3][40] = TILE.GRASS;
            top = { x: 40, y: 0, stand: { x: 40, y: 3 } };
        }

        cast("fire", top.stand);
        const burning = w.tiles[top.y][top.x];
        g.player.x = top.x * TILE_SIZE + TILE_SIZE / 2;
        g.player.y = Math.max(top.y, 1) * TILE_SIZE + TILE_SIZE / 2;
        g.updateBurningTrees(8000);
        const ash = w.tiles[top.y][top.x];

        g.player.x = top.x * TILE_SIZE + TILE_SIZE / 2;
        g.player.y = top.y * TILE_SIZE + TILE_SIZE / 2;
        const up = { up: true };
        for (let i = 0; i < 40; i++) g.player.update(16, up, w);
        const north = g.player.y;

        function shove(x, y, keys) {
            g.player.x = x;
            g.player.y = y;
            for (let i = 0; i < 40; i++) g.player.update(16, keys, w);
            return { x: g.player.x, y: g.player.y };
        }
        const size = g.player.size;
        const maxX = WORLD_W * TILE_SIZE - size;
        const maxY = WORLD_H * TILE_SIZE - size;
        const west = shove(0, 80 * TILE_SIZE, { left: true });
        const east = shove(WORLD_W * TILE_SIZE, 80 * TILE_SIZE, { right: true });
        const south = shove(80 * TILE_SIZE, WORLD_H * TILE_SIZE, { down: true });

        // Every planted tile sits on the outer two rows or columns. A line of
        // four would walk off the rim, and water would then be allowed to
        // quench the lava that had slipped inside.
        function rimClears(spots) {
            w.tiles[spots.tree.y][spots.tree.x] = TILE.TREE;
            w.tiles[spots.water.y][spots.water.x] = TILE.WATER;
            w.tiles[spots.mountain.y][spots.mountain.x] = TILE.MOUNTAIN;
            w.tiles[spots.lava.y][spots.lava.x] = TILE.LAVA;
            const px = spots.tree.x * TILE_SIZE + TILE_SIZE / 2;
            const py = spots.tree.y * TILE_SIZE + TILE_SIZE / 2;
            w.clearTerrain("fire", px, py);
            w.clearTerrain("ice", px, py);
            w.clearTerrain("earth", px, py);
            w.clearTerrain("water", px, py);
            return {
                tree: w.tiles[spots.tree.y][spots.tree.x],
                water: w.tiles[spots.water.y][spots.water.x],
                mountain: w.tiles[spots.mountain.y][spots.mountain.x],
                lava: w.tiles[spots.lava.y][spots.lava.x],
            };
        }
        const edges = {
            top: rimClears({
                tree: { x: 40, y: 0 },
                water: { x: 41, y: 0 },
                mountain: { x: 40, y: 1 },
                lava: { x: 41, y: 1 },
            }),
            left: rimClears({
                tree: { x: 0, y: 20 },
                water: { x: 1, y: 20 },
                mountain: { x: 0, y: 21 },
                lava: { x: 1, y: 21 },
            }),
            right: rimClears({
                tree: { x: WORLD_W - 1, y: 20 },
                water: { x: WORLD_W - 2, y: 20 },
                mountain: { x: WORLD_W - 1, y: 21 },
                lava: { x: WORLD_W - 2, y: 21 },
            }),
            bottom: rimClears({
                tree: { x: 80, y: WORLD_H - 1 },
                water: { x: 81, y: WORLD_H - 1 },
                mountain: { x: 80, y: WORLD_H - 2 },
                lava: { x: 81, y: WORLD_H - 2 },
            }),
        };

        const hollow = w.tiles[w.makersHollow.tileY][w.makersHollow.tileX];
        w.clearTerrain("fire", w.makersHollow.x, w.makersHollow.y);
        w.clearTerrain("earth", w.makersHollow.x, w.makersHollow.y);
        const plot = w.tiles[w.worldtreePlot.tileY][w.worldtreePlot.tileX];
        w.clearTerrain("fire", w.worldtreePlot.x, w.worldtreePlot.y);
        w.clearTerrain("earth", w.worldtreePlot.x, w.worldtreePlot.y);

        return {
            topY: top.y,
            burning,
            ash,
            north,
            size,
            west,
            east,
            south,
            maxX,
            maxY,
            edges,
            outside: w.isSolid(-1, 0) && w.isSolid(0, -1) && w.isSolid(WORLD_W, 0) && w.isSolid(0, WORLD_H),
            hollowBefore: hollow,
            hollow: w.tiles[w.makersHollow.tileY][w.makersHollow.tileX],
            plotBefore: plot,
            plot: w.tiles[w.worldtreePlot.tileY][w.worldtreePlot.tileX],
            burningTile: TILE.BURNING_TREE,
            path: TILE.PATH,
            stone: TILE.STONE,
            lava: TILE.LAVA,
            ladder: TILE.LADDER,
            bare: TILE.BARE_EARTH,
        };
    });

    expect(result.topY).toBeLessThan(2);
    expect(result.burning).toBe(result.burningTile);
    expect(result.ash).toBe(result.path);
    expect(result.north).toBeGreaterThanOrEqual(result.size);
    expect(result.west.x).toBeGreaterThanOrEqual(result.size);
    expect(result.east.x).toBeLessThanOrEqual(result.maxX);
    expect(result.south.y).toBeLessThanOrEqual(result.maxY);
    expect(result.outside).toBe(true);

    for (const side of ["top", "left", "right", "bottom"]) {
        expect(result.edges[side].tree).toBe(result.burningTile);
        expect(result.edges[side].water).toBe(result.stone);
        expect(result.edges[side].mountain).toBe(result.stone);
        expect(result.edges[side].lava).toBe(result.lava);
    }

    expect(result.hollow).toBe(result.hollowBefore);
    expect(result.hollow).toBe(result.ladder);
    expect(result.plot).toBe(result.plotBefore);
    expect(result.plot).toBe(result.bare);
});
