const { test, expect } = require("@playwright/test");
const { startNewGame } = require("./helpers");

// The Lady of the Lake keeps both waters. Nothing hostile crosses her bridges
// or comes at the Fountain of Youth, whose riddles are asked in her voice -
// while Ingoizer and the animals with him walk over either as they please.

test.describe("the Lady's ward", () => {
    test.beforeEach(async ({ page }) => {
        await startNewGame(page);
    });

    test("her bridges and her fountain are warded ground", async ({ page }) => {
        const ward = await page.evaluate(() => {
            const w = window.game.world;
            const f = w.fountainOfYouth;
            return {
                northBridge: w.isWarded(50, 60),
                westBridge: w.isWarded(45, 68),
                fountainMiddle: w.isWarded(f.tileX, f.tileY),
                fountainApproach: w.isWarded(f.tileX, f.tileY + LADY_WARD.fountainRadius),
                openMeadow: w.isWarded(30, 30),
                // Warded is not the same as walled: Ingoizer walks over both.
                bridgeSolid: w.isSolid(50, 60),
            };
        });

        expect(ward.northBridge, "the north bridge is hers").toBe(true);
        expect(ward.westBridge, "so is the west one").toBe(true);
        expect(ward.fountainMiddle, "and the fountain itself").toBe(true);
        expect(ward.fountainApproach, "and the ground it stands in").toBe(true);
        expect(ward.openMeadow, "open meadow is nobody's").toBe(false);
        expect(ward.bridgeSolid, "the ward is not a wall - the player crosses").toBe(false);
    });

    test("a monster chasing Ingoizer stops at the bridge", async ({ page }) => {
        const chase = await page.evaluate(() => {
            const g = window.game;
            g.monsters.length = 0;
            g.companions.length = 0;

            // Ingoizer out on the bridge, a wolf on the shore behind him.
            const bridge = tileToWorld(50, 60);
            const shore = tileToWorld(50, 51);
            g.player.x = bridge.x; g.player.y = bridge.y;
            const wolf = new Monster("wolf", shore.x, shore.y);
            g.monsters.push(wolf);

            let trespassed = false;
            let closest = Infinity;
            for (let i = 0; i < 400; i++) {
                wolf.update(16, g.player, g.world, []);
                const t = worldToTile(wolf.x, wolf.y);
                if (g.world.isWarded(t.x, t.y)) trespassed = true;
                closest = Math.min(closest, dist(wolf.x, wolf.y, g.player.x, g.player.y));
            }
            return { trespassed, closest, hunting: wolf.target === g.player };
        });

        expect(chase.hunting, "it is coming for him, not standing about").toBe(true);
        expect(chase.trespassed, "and it never sets foot on the bridge").toBe(false);
        expect(chase.closest, "so it is left on the shore, out of reach").toBeGreaterThan(30);
    });

    test("a monster stopped at the fountain cannot reach the water", async ({ page }) => {
        const siege = await page.evaluate(() => {
            const g = window.game;
            g.monsters.length = 0;
            g.companions.length = 0;

            const f = g.world.fountainOfYouth;
            g.player.x = f.x; g.player.y = f.y;
            const start = tileToWorld(f.tileX, f.tileY + LADY_WARD.fountainRadius + 3);
            const bandit = new Monster("bandit", start.x, start.y);
            g.monsters.push(bandit);

            let trespassed = false;
            for (let i = 0; i < 400; i++) {
                bandit.update(16, g.player, g.world, []);
                const t = worldToTile(bandit.x, bandit.y);
                if (g.world.isWarded(t.x, t.y)) trespassed = true;
            }
            return { trespassed };
        });

        expect(siege.trespassed, "the fountain keeps its own quiet").toBe(false);
    });

    test("nothing hostile is ever put down on warded ground", async ({ page }) => {
        const trespassers = await page.evaluate(() => {
            const g = window.game;
            // Several respawn ticks' worth of monsters, all across the realm.
            for (let i = 0; i < 40; i++) g.spawnMonsters(MONSTER_SPAWN_INTERVAL + 1);
            return g.monsters.filter(m => {
                const t = worldToTile(m.x, m.y);
                return g.world.isWarded(t.x, t.y);
            }).length;
        });

        expect(trespassers, "no monster spawns on her water").toBe(0);
    });

    test("a monster somehow left on her ground can still walk off it", async ({ page }) => {
        const freed = await page.evaluate(() => {
            const g = window.game;
            g.monsters.length = 0;
            const bridge = tileToWorld(50, 54);
            const shore = tileToWorld(50, 51);
            const wolf = new Monster("wolf", bridge.x, bridge.y);
            g.monsters.push(wolf);
            g.player.x = shore.x; g.player.y = shore.y;   // stands off the bridge and draws it out

            for (let i = 0; i < 400; i++) wolf.update(16, g.player, g.world, []);
            const t = worldToTile(wolf.x, wolf.y);
            return { stillWarded: g.world.isWarded(t.x, t.y) };
        });

        expect(freed.stillWarded, "the ward turns monsters back, it does not trap them").toBe(false);
    });
});
