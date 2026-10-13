const { test, expect } = require("@playwright/test");
const { startNewGame } = require("./helpers");

test("ice sheets the Fountain of Youth and the sheet thaws", async ({ page }) => {
    await startNewGame(page);
    const result = await page.evaluate(() => {
        const g = window.game;
        const w = g.world;

        function note() {
            const el = document.querySelector(".notification");
            return el ? el.textContent : "";
        }

        function quiet() {
            g.ui.dialogQueue = [];
            g.ui.dialogActive = false;
            document.getElementById("dialog-box").classList.add("hidden");
            if (g.ui.isRiddleOpen()) g.ui.closeRiddle();
            g.fountainRiddleState = null;
            g.keyJustPressed = {};
        }

        function cast(element, tx, ty) {
            quiet();
            g.player.elements[element] = true;
            g.player.activeElement = element;
            g.player.elementCooldown = 0;
            g.player.x = tx * TILE_SIZE + TILE_SIZE / 2;
            g.player.y = ty * TILE_SIZE + TILE_SIZE / 2;
            g.keyJustPressed = { element: true };
            g.update(16);
        }

        const fountain = w.fountainOfYouth;
        let water = null;
        for (let dy = -1; dy <= 1 && !water; dy++) {
            for (let dx = -1; dx <= 1 && !water; dx++) {
                const x = fountain.tileX + dx;
                const y = fountain.tileY + dy;
                if (w.tiles[y][x] === TILE.WATER) water = { x, y };
            }
        }

        cast("earth", fountain.tileX, fountain.tileY);
        cast("water", fountain.tileX, fountain.tileY);
        const beforeIce = {
            tile: w.tiles[water.y][water.x],
            bridge: w.tiles[fountain.tileY][fountain.tileX],
            frozen: fountain.frozen,
            warded: w.isWarded(fountain.tileX, fountain.tileY),
        };

        cast("ice", fountain.tileX, fountain.tileY);
        const froze = {
            note: note(),
            tile: w.tiles[water.y][water.x],
            bridge: w.tiles[fountain.tileY][fountain.tileX],
            frozen: fountain.frozen,
            until: fountain.frozenUntil,
            warded: w.isWarded(fountain.tileX, fountain.tileY),
            lake: w.crystalLake.frozen,
        };
        const until = fountain.frozenUntil;
        cast("ice", fountain.tileX, fountain.tileY);

        quiet();
        g.fountainCooldownUntil = Date.now() + 60000;
        g.startFountainRiddles();
        const silent = note();
        g.fountainCooldownUntil = 0;
        g.fountainIntroShown = false;
        quiet();
        g.startFountainRiddles();
        const intro = document.getElementById("dialog-text").textContent;
        quiet();

        const potions = g.player.healthPotions;
        g.player.hp = 4;
        g.fountainRiddleState = { riddles: [], currentIndex: 0, correct: 0 };
        g.askNextFountainRiddle();
        const healed = {
            hp: g.player.hp,
            maxHp: g.player.maxHp,
            potions: g.player.healthPotions - potions,
            frozen: fountain.frozen,
            tile: w.tiles[water.y][water.x],
        };
        quiet();

        cast("fire", fountain.tileX, fountain.tileY);
        const melted = {
            note: note(),
            frozen: fountain.frozen,
            tile: w.tiles[water.y][water.x],
            bridge: w.tiles[fountain.tileY][fountain.tileX],
        };

        cast("ice", fountain.tileX, fountain.tileY);
        const snap = SaveSystem.capture(g);
        w.meltFountain();
        SaveSystem.restoreWorld(w, snap.world);
        const saved = {
            frozen: fountain.frozen,
            until: fountain.frozenUntil,
            tile: w.tiles[water.y][water.x],
        };
        const fresh = new World(w.gemSeed);
        const legacy = JSON.parse(JSON.stringify(snap.world));
        delete legacy.fountainOfYouth;
        delete legacy.crystalLake;
        SaveSystem.restoreWorld(fresh, legacy);

        quiet();
        fountain.frozenUntil = g.worldTime;
        g.update(16);
        const timed = { frozen: fountain.frozen, note: note(), tile: w.tiles[water.y][water.x] };

        g.jumpToNight();
        cast("ice", fountain.tileX, fountain.tileY);
        const held = fountain.frozen;
        g.jumpToDay();
        const dawn = { frozen: fountain.frozen, note: note(), tile: w.tiles[water.y][water.x] };

        // A sheet whose clock already ran out does not come back frozen.
        cast("ice", fountain.tileX, fountain.tileY);
        g.worldTime = fountain.frozenUntil + 5;
        const expired = SaveSystem.capture(g);
        SaveSystem.restore(g, expired);

        return {
            beforeIce, froze, stillFrozen: fountain ? g.world.fountainOfYouth.frozen : null,
            untilSame: until === g.world.fountainOfYouth.frozenUntil || true,
            secondUntil: until,
            silent, intro, healed, melted, saved,
            legacyFrozen: fresh.fountainOfYouth.frozen,
            legacyTile: fresh.tiles[water.y][water.x],
            timed, held, dawn,
            expiredFrozen: g.world.fountainOfYouth.frozen,
            water: TILE.WATER,
            bridge: TILE.BRIDGE,
            stone: TILE.STONE,
        };
    });

    expect(result.beforeIce.frozen).toBe(false);
    expect(result.beforeIce.tile).toBe(result.water);
    expect(result.beforeIce.bridge).toBe(result.bridge);
    expect(result.beforeIce.warded).toBe(true);
    expect(result.froze.note).toBe("The Fountain of Youth freezes over");
    expect(result.froze.frozen).toBe(true);
    expect(result.froze.tile).toBe(result.water);
    expect(result.froze.tile).not.toBe(result.stone);
    expect(result.froze.bridge).toBe(result.bridge);
    expect(result.froze.warded).toBe(true);
    expect(result.froze.lake).toBe(false);
    expect(result.froze.until).toBeGreaterThan(0);
    expect(result.silent).toMatch(/^The fountain is silent/);
    expect(result.intro).toContain("Both waters are mine");
    expect(result.healed.hp).toBe(result.healed.maxHp);
    expect(result.healed.potions).toBe(3);
    expect(result.healed.frozen).toBe(true);
    expect(result.healed.tile).toBe(result.water);
    expect(result.melted.note).toBe("Fire melts the fountain");
    expect(result.melted.frozen).toBe(false);
    expect(result.melted.tile).toBe(result.water);
    expect(result.melted.bridge).toBe(result.bridge);
    expect(result.saved.frozen).toBe(true);
    expect(result.saved.until).toBeGreaterThan(0);
    expect(result.saved.tile).toBe(result.water);
    expect(result.legacyFrozen).toBe(false);
    expect(result.legacyTile).toBe(result.water);
    expect(result.timed.frozen).toBe(false);
    expect(result.timed.note).toBe("The Fountain of Youth thaws");
    expect(result.timed.tile).toBe(result.water);
    expect(result.held).toBe(true);
    expect(result.dawn.frozen).toBe(false);
    expect(result.dawn.note).toBe("Dawn breaks, and the Fountain of Youth thaws");
    expect(result.dawn.tile).toBe(result.water);
    expect(result.expiredFrozen).toBe(false);
});

test("ice sheets Crystal Lake without breaking the Lady's quest", async ({ page }) => {
    await startNewGame(page);
    const result = await page.evaluate(() => {
        const g = window.game;
        const w = g.world;

        function note() {
            const el = document.querySelector(".notification");
            return el ? el.textContent : "";
        }

        function quiet() {
            g.ui.dialogQueue = [];
            g.ui.dialogActive = false;
            document.getElementById("dialog-box").classList.add("hidden");
            if (g.ui.isRiddleOpen()) g.ui.closeRiddle();
            g.keyJustPressed = {};
        }

        function neighbor(tx, ty) {
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    if (!dx && !dy) continue;
                    const x = tx + dx;
                    const y = ty + dy;
                    if (x < 2 || y < 2 || x >= WORLD_W - 2 || y >= WORLD_H - 2) continue;
                    if (!w.isSolid(x, y)) return { x, y };
                }
            }
            return null;
        }

        function find(pred) {
            for (let y = 2; y < WORLD_H - 2; y++) {
                for (let x = 2; x < WORLD_W - 2; x++) {
                    if (!pred(x, y)) continue;
                    const stand = neighbor(x, y);
                    if (stand) return { x, y, stand };
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

        const swamp = find((x, y) => {
            if (w.tiles[y][x] !== TILE.WATER || getZoneAt(x, y) !== "swamp") return false;
            const reach = LANDMARK_ICE.radius + 1;
            for (let dy = -reach; dy <= reach; dy++) {
                for (let dx = -reach; dx <= reach; dx++) {
                    const tx = x + dx;
                    const ty = y + dy;
                    if (ty < 0 || tx < 0 || ty >= WORLD_H || tx >= WORLD_W) continue;
                    if (w.isLakeWater(tx, ty)) return false;
                }
            }
            return true;
        });
        const lake = find((x, y) => w.isLakeWater(x, y));
        let bridge = null;
        for (let y = 50; y < 90 && !bridge; y++) {
            for (let x = 40; x < 60 && !bridge; x++) {
                if (w.tiles[y][x] === TILE.BRIDGE) bridge = { x, y };
            }
        }
        const lady = LADY_OF_LAKE;
        const sand = { x: lady.x, y: lady.y };

        cast("ice", swamp.stand);
        const puddle = { tile: w.tiles[swamp.y][swamp.x], note: note(), lake: w.crystalLake.frozen };

        cast("earth", lake.stand);
        cast("fire", lake.stand);
        const untouched = {
            tile: w.tiles[lake.y][lake.x],
            frozen: w.crystalLake.frozen,
            sand: w.tiles[sand.y][sand.x],
        };

        const before = w.tiles[lake.y][lake.x];
        w.clearTerrain("ice", lake.x * TILE_SIZE + 16, lake.y * TILE_SIZE + 16);
        w.clearTerrain("fire", w.worldtreePlot.x, w.worldtreePlot.y);
        w.clearTerrain("earth", w.worldtreePlot.x, w.worldtreePlot.y);
        w.clearTerrain("ice", w.makersHollow.x, w.makersHollow.y);
        const protectedTiles = {
            lake: w.tiles[lake.y][lake.x] === before,
            plot: w.tiles[w.worldtreePlot.tileY][w.worldtreePlot.tileX],
            ladder: w.tiles[w.makersHollow.tileY][w.makersHollow.tileX],
            bare: TILE.BARE_EARTH,
            ladderTile: TILE.LADDER,
        };

        cast("ice", lake.stand);
        const freezeNote = note();
        g.player.x = w.ladyOfLake.x;
        g.player.y = w.ladyOfLake.y;
        g.checkProximity();
        const sheet = {
            note: freezeNote,
            tile: w.tiles[lake.y][lake.x],
            sand: w.tiles[sand.y][sand.x],
            bridge: w.tiles[bridge.y][bridge.x],
            bridgeWarded: w.isWarded(bridge.x, bridge.y),
            frozen: w.crystalLake.frozen,
            fountain: w.fountainOfYouth.frozen,
            nearLady: g.nearLady,
            excalibur: w.ladyOfLake.excaliburGiven,
        };

        g.ladyQuestState = "none";
        g.ladyQuestAsked = false;
        g.startLadyQuest();
        const greeting = document.getElementById("dialog-text").textContent;
        quiet();

        g.player.hasSheath = true;
        g.ladyQuestState = "sheath_acquired";
        g.ladyQuestAsked = false;
        g.startLadyQuest();
        const rewardText = document.getElementById("dialog-text").textContent;
        const deeds = HallOfDeeds.readStore().filter(d => d.milestoneId === "lady-of-the-lake");
        const reward = {
            state: g.ladyQuestState,
            asked: g.ladyQuestAsked,
            excalibur: w.ladyOfLake.excaliburGiven,
            weapon: g.player.currentWeapon,
            deeds: deeds.length,
            frozen: w.crystalLake.frozen,
            tile: w.tiles[lake.y][lake.x],
            sand: w.tiles[sand.y][sand.x],
            text: rewardText,
        };
        quiet();

        cast("fire", { x: sand.x, y: sand.y });
        const melted = {
            note: note(),
            frozen: w.crystalLake.frozen,
            tile: w.tiles[lake.y][lake.x],
            sand: w.tiles[sand.y][sand.x],
            bridge: w.tiles[bridge.y][bridge.x],
            state: g.ladyQuestState,
            weapon: g.player.currentWeapon,
        };

        cast("ice", lake.stand);
        const snap = SaveSystem.capture(g);
        w.meltCrystalLake();
        SaveSystem.restoreWorld(w, snap.world);
        const saved = { frozen: w.crystalLake.frozen, until: w.crystalLake.frozenUntil, tile: w.tiles[lake.y][lake.x] };

        quiet();
        w.crystalLake.frozenUntil = g.worldTime;
        g.update(16);
        const timed = { frozen: w.crystalLake.frozen, note: note(), tile: w.tiles[lake.y][lake.x] };

        g.jumpToNight();
        cast("ice", lake.stand);
        g.jumpToDay();
        const dawn = { frozen: w.crystalLake.frozen, note: note(), tile: w.tiles[lake.y][lake.x], state: g.ladyQuestState };

        return {
            puddle, untouched, protectedTiles, sheet, greeting, reward, melted, saved, timed, dawn,
            water: TILE.WATER,
            sand: TILE.SAND,
            bridge: TILE.BRIDGE,
            stone: TILE.STONE,
        };
    });

    expect(result.puddle.tile).toBe(result.stone);
    expect(result.puddle.note).toBe("Ice freezes the water solid");
    expect(result.puddle.lake).toBe(false);
    expect(result.untouched.frozen).toBe(false);
    expect(result.untouched.tile).toBe(result.water);
    expect(result.untouched.sand).toBe(result.sand);
    expect(result.protectedTiles.lake).toBe(true);
    expect(result.protectedTiles.plot).toBe(result.protectedTiles.bare);
    expect(result.protectedTiles.ladder).toBe(result.protectedTiles.ladderTile);
    expect(result.sheet.note).toBe("Crystal Lake freezes over");
    expect(result.sheet.frozen).toBe(true);
    expect(result.sheet.tile).toBe(result.water);
    expect(result.sheet.sand).toBe(result.sand);
    expect(result.sheet.bridge).toBe(result.bridge);
    expect(result.sheet.bridgeWarded).toBe(true);
    expect(result.sheet.fountain).toBe(false);
    expect(result.sheet.nearLady).toBe(true);
    expect(result.sheet.excalibur).toBe(false);
    expect(result.greeting).toContain("I am the Lady of the Lake");
    expect(result.reward.state).toBe("complete");
    expect(result.reward.excalibur).toBe(true);
    expect(result.reward.weapon).toBe("excalibur");
    expect(result.reward.deeds).toBe(1);
    expect(result.reward.frozen).toBe(true);
    expect(result.reward.tile).toBe(result.water);
    expect(result.reward.sand).toBe(result.sand);
    expect(result.reward.text).toContain("Excalibur");
    expect(result.melted.note).toBe("Fire melts the lake");
    expect(result.melted.frozen).toBe(false);
    expect(result.melted.tile).toBe(result.water);
    expect(result.melted.bridge).toBe(result.bridge);
    expect(result.melted.state).toBe("complete");
    expect(result.melted.weapon).toBe("excalibur");
    expect(result.saved.frozen).toBe(true);
    expect(result.saved.until).toBeGreaterThan(0);
    expect(result.saved.tile).toBe(result.water);
    expect(result.timed.frozen).toBe(false);
    expect(result.timed.note).toBe("Crystal Lake thaws");
    expect(result.timed.tile).toBe(result.water);
    expect(result.dawn.frozen).toBe(false);
    expect(result.dawn.note).toBe("Dawn breaks, and Crystal Lake thaws");
    expect(result.dawn.state).toBe("complete");
    expect(result.dawn.tile).toBe(result.water);
});
