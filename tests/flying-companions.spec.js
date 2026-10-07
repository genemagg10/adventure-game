const { test, expect } = require("@playwright/test");
const { startNewGame, dismissDialogs } = require("./helpers");

test.describe("bats and eagles", () => {
    test.beforeEach(async ({ page }) => {
        await startNewGame(page);
        await dismissDialogs(page);
    });

    test("cave bats are tameable animals, not monsters that attack", async ({ page }) => {
        const found = await page.evaluate(() => {
            const g = window.game;
            const surfaceBats = g.wildAnimals.filter(a => a.type === "bat").length;
            const hostileNames = Object.values(CAVE_MONSTER_TYPES).map(d => d.name);
            g.enterCave(CAVE_ENTRANCES[0]);
            const bats = g.wildAnimals.filter(a => a.alive && a.type === "bat" && a.realm === "cave");
            const hostile = g.caveMonsters.filter(m => m.type === "cave_bat" || /bat/i.test(m.name));
            const bat = bats[0];
            g.player.apples = 2;
            g.player.x = bat.x + 10;
            g.player.y = bat.y;
            const world = g.caveWorlds[g.activeCaveId];
            bat.update(16, g.player, world, [], g.combat);
            g.ui.dialogQueue = [];
            g.ui.dialogActive = false;
            g.checkNearAnimal();
            const prompted = g.interactContext();
            const curious = bat.curious;
            const applesBefore = g.player.apples;
            const tamed = g.tameNearbyAnimal();
            g.checkNearAnimal();
            const again = g.tameNearbyAnimal();
            return {
                surfaceBats,
                hostileNames,
                monsterKeys: Object.keys(CAVE_MONSTER_TYPES),
                zones: ANIMAL_TYPES.bat.zones.slice(),
                stats: { hp: ANIMAL_TYPES.bat.hp, damage: ANIMAL_TYPES.bat.damage, speed: ANIMAL_TYPES.bat.speed },
                batCount: bats.length,
                hostile: hostile.length,
                curious,
                prompted: prompted && prompted.long,
                tamed,
                again,
                apples: g.player.apples,
                applesBefore,
                pack: g.companions.filter(c => c.alive).map(c => c.type),
                stillWild: g.wildAnimals.filter(a => a.type === "bat").length,
            };
        });

        expect(found.surfaceBats, "bats do not roam the meadow").toBe(0);
        expect(found.monsterKeys).not.toContain("cave_bat");
        expect(found.hostileNames.join(" ")).not.toMatch(/bat/i);
        expect(found.zones).toEqual(["cave"]);
        expect(found.stats.damage).toBe(10);
        expect(found.stats.hp).toBeGreaterThan(20);
        expect(found.stats.hp).toBeLessThan(50);
        expect(found.batCount).toBe(ANIMAL_PER_ZONE);
        expect(found.hostile).toBe(0);
        expect(found.curious).toBe(true);
        expect(found.prompted).toContain("feed an apple to the Bat");
        expect(found.tamed).toBe(true);
        expect(found.again).toBe(false);
        expect(found.apples).toBe(found.applesBefore - 1);
        expect(found.pack).toEqual(["bat"]);
        expect(found.stillWild).toBe(ANIMAL_PER_ZONE - 1);
    });

    test("eagles circle the Cloudlands and stay tamed in a save", async ({ page }) => {
        const found = await page.evaluate(() => {
            const g = window.game;
            g.enterSky();
            const eagles = g.wildAnimals.filter(a => a.alive && a.type === "eagle" && a.realm === "sky");
            const eagle = eagles[0];
            g.player.apples = 1;
            g.player.x = eagle.x;
            g.player.y = eagle.y + 8;
            eagle.update(16, g.player, g.skyWorld, [], g.combat);
            g.ui.dialogQueue = [];
            g.ui.dialogActive = false;
            g.checkNearAnimal();
            const curious = eagle.curious;
            const tamed = g.tameNearbyAnimal();
            const snap = SaveSystem.capture(g);
            g.companions = [];
            SaveSystem.restore(g, snap);
            const back = g.companions[0];
            return {
                zones: ANIMAL_TYPES.eagle.zones.slice(),
                stats: { hp: ANIMAL_TYPES.eagle.hp, damage: ANIMAL_TYPES.eagle.damage },
                count: eagles.length,
                curious,
                tamed,
                apple: APPLE_ITEM.description,
                type: back && back.type,
                alive: back && back.alive && back.tamed,
                hp: back && back.hp,
                stillSky: g.wildAnimals.filter(a => a.realm === "sky" && a.type === "eagle").length,
            };
        });

        expect(found.zones).toEqual(["cloudlands"]);
        expect(found.stats).toEqual({ hp: 42, damage: 10 });
        expect(found.count).toBe(ANIMAL_PER_ZONE);
        expect(found.curious).toBe(true);
        expect(found.tamed).toBe(true);
        expect(found.apple).toBe("Feed a wild animal to make it your companion");
        expect(found.type).toBe("eagle");
        expect(found.alive).toBe(true);
        expect(found.hp).toBe(42);
        expect(found.stillSky).toBe(ANIMAL_PER_ZONE - 1);
    });

    test("a pack with a bat and an eagle still opens the Clubhouse", async ({ page }) => {
        const opened = await page.evaluate(() => {
            const g = window.game;
            g.greenlandsUnlocked = true;
            g.world.unlockGreenlands();
            g.greenKnightDefeated = true;
            g.companions = [];
            for (const type of ["bat", "eagle", "rabbit", "fox", "toad"]) {
                const animal = new Animal(type, g.player.x, g.player.y);
                animal.tame(g.companions.length);
                g.companions.push(animal);
            }
            const gate = g.world.greenKnightCastle;
            g.player.x = gate.x;
            g.player.y = gate.y + 40;
            g.inCave = false;
            g.inSky = false;
            g.updateClubhouse(16);
            return {
                count: g.aliveCompanionCount(),
                unlocked: g.clubhouseUnlocked,
                types: g.companions.map(c => c.type),
            };
        });
        expect(opened.count).toBe(5);
        expect(opened.unlocked).toBe(true);
        expect(opened.types).toEqual(["bat", "eagle", "rabbit", "fox", "toad"]);
    });
});

const ANIMAL_PER_ZONE = 3;
