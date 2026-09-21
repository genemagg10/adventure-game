const { test, expect } = require("@playwright/test");
const { startNewGame, dismissDialogs } = require("./helpers");

// The Giant Snapping Turtle guards the Fallow - the same acre of bare earth,
// south of the Black Knight's castle, where a Worldtree Seed is meant to be
// planted. It is bigger than any other monster, as tough as the Black Knight,
// and nothing takes root here until it is dead. Felling it yields Turtle Shell
// Armor, three points sturdier than the Knight's Armor.

test.describe("the Giant Snapping Turtle", () => {
    test.beforeEach(async ({ page }) => {
        await startNewGame(page);
    });

    test("is far larger than the monsters and as tough as the Black Knight", async ({ page }) => {
        const stats = await page.evaluate(() => {
            const biggestMonster = Math.max(...Object.values(MONSTER_TYPES).map(m => m.size));
            return {
                hp: GIANT_TURTLE.hp,
                blackKnightHp: BOSS.hp,
                damage: GIANT_TURTLE.damage,
                blackKnightDamage: BOSS.damage,
                size: GIANT_TURTLE.size,
                biggestMonster,
                blackKnightSize: BOSS.size,
                turtleSpeed: GIANT_TURTLE.speed,
                blackKnightSpeed: BOSS.speed,
            };
        });
        // As hard to defeat as the Black Knight: same health pool and bite.
        expect(stats.hp).toBe(stats.blackKnightHp);
        expect(stats.damage).toBe(stats.blackKnightDamage);
        // Larger than most monsters, and than the Black Knight himself.
        expect(stats.size).toBeGreaterThan(stats.biggestMonster);
        expect(stats.size).toBeGreaterThan(stats.blackKnightSize);
        // Heavy and lumbering: slower on its feet than the Black Knight.
        expect(stats.turtleSpeed).toBeLessThan(stats.blackKnightSpeed);
    });

    test("its shell armor is exactly three better than the Knight's Armor", async ({ page }) => {
        const def = await page.evaluate(() => ({
            turtle: ARMOR.turtle_shell_armor.defense,
            knight: ARMOR.knights_armor.defense,
            drops: GIANT_TURTLE.armorDrop,
        }));
        expect(def.drops).toBe("turtle_shell_armor");
        expect(def.turtle).toBe(def.knight + 3);
    });

    test("guards the Waiting Ground in the Fallow, south of the Black Knight's castle", async ({ page }) => {
        const place = await page.evaluate(() => {
            const g = window.game;
            const sp = g.world.giantTurtleSpawnPoint;
            const plot = g.world.worldtreePlot;
            const tx = Math.floor(sp.x / TILE_SIZE);
            const ty = Math.floor(sp.y / TILE_SIZE);
            // The Black Knight's castle: Ing Castle, in the northeast.
            return {
                zone: getZoneAt(tx, ty),
                nearPlot: dist(sp.x, sp.y, plot.x, plot.y),
                turtleTileY: ty,
                castleBottom: ZONES.castle.y + ZONES.castle.h,
            };
        });
        expect(place.zone).toBe("fallow");
        // It stands right by the plot it is guarding.
        expect(place.nearPlot).toBeLessThan(200);
        // South (greater tile-Y) of the whole of Ing Castle.
        expect(place.turtleTileY).toBeGreaterThan(place.castleBottom);
    });

    test("rises when the player reaches the Fallow, and drops its shell when felled", async ({ page }) => {
        // Walk the player onto the guardian's ground and let the trigger fire.
        await page.evaluate(() => {
            const g = window.game;
            const sp = g.world.giantTurtleSpawnPoint;
            g.player.x = sp.x;
            g.player.y = sp.y;
            g.checkGiantTurtleTrigger();
        });
        await dismissDialogs(page);

        const spawned = await page.evaluate(() => {
            const t = window.game.giantTurtle;
            return { exists: !!t, spawned: t && t.spawned, name: t && t.name };
        });
        expect(spawned.exists).toBe(true);
        expect(spawned.spawned).toBe(true);
        expect(spawned.name).toBe("The Giant Snapping Turtle");

        // Land the killing blow the way combat does, then run the death handler.
        const result = await page.evaluate(() => {
            const g = window.game;
            const killed = g.giantTurtle.takeDamage(9999, g.player.x + 10, g.player.y);
            if (killed) g.onEntityKilled(g.giantTurtle, true);
            return {
                defeated: g.giantTurtleDefeated,
                hasArmor: g.player.armors.includes("turtle_shell_armor"),
            };
        });
        expect(result.defeated).toBe(true);
        expect(result.hasArmor).toBe(true);
    });

    test("no Worldtree Seed takes root until the turtle is defeated", async ({ page }) => {
        // Hand the player a seed and stand them on the one plot that will take it.
        await page.evaluate(() => {
            const g = window.game;
            g.world.burnWorldtreeToAsh();
            g.player.hasWorldtreeSeed = true;
            const plot = g.world.worldtreePlot;
            g.player.x = plot.x;
            g.player.y = plot.y;
        });
        await dismissDialogs(page);

        // While the guardian lives, the seed refuses the ground.
        const blocked = await page.evaluate(() => {
            const g = window.game;
            g.giantTurtleDefeated = false;
            g.plantWorldtreeSeed();
            return { planted: !!g.world.sapling, stillHasSeed: g.player.hasWorldtreeSeed };
        });
        expect(blocked.planted).toBe(false);
        expect(blocked.stillHasSeed).toBe(true);
        await dismissDialogs(page);

        // With the turtle dead, the very same planting takes.
        const allowed = await page.evaluate(() => {
            const g = window.game;
            g.giantTurtleDefeated = true;
            g.plantWorldtreeSeed();
            return { planted: !!g.world.sapling, stillHasSeed: g.player.hasWorldtreeSeed };
        });
        expect(allowed.planted).toBe(true);
        expect(allowed.stillHasSeed).toBe(false);
    });
});
