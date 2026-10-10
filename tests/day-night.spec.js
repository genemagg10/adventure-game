const { test, expect } = require("@playwright/test");
const { startNewGame } = require("./helpers");

test("night strengthens hostile monsters and improves their loot", async ({ page }) => {
    await startNewGame(page);
    const result = await page.evaluate(() => {
        const g = window.game;
        const goblin = g.monsters.find(m => m.alive && m.type === "goblin");
        const day = { hp: goblin.maxHp, damage: goblin.damage, speed: goblin.speed };

        const rabbit = new Animal("rabbit", g.player.x, g.player.y);
        rabbit.tame(0);
        g.companions.push(rabbit);
        const pack = { hp: rabbit.maxHp, damage: rabbit.damage, speed: rabbit.speed };

        const guardian = new Monster("troll", 0, 0);
        guardian.isSheathGuardian = true;
        g.monsters.push(guardian);

        const caveGoblin = new Monster("goblin", 80, 80);
        g.caveMonsters.push(caveGoblin);

        g.jumpToNight();
        const note = document.querySelector(".notification") ? document.querySelector(".notification").textContent : "";
        const clock = document.getElementById("day-clock").dataset.state;
        const night = {
            hp: goblin.maxHp,
            damage: goblin.damage,
            speed: goblin.speed,
            boosted: !!goblin.nightBoosted,
            isNight: g.isNight(),
        };
        const packNight = { hp: rabbit.maxHp, damage: rabbit.damage, speed: rabbit.speed };
        const guard = { hp: guardian.maxHp, damage: guardian.damage, boosted: !!guardian.nightBoosted };
        const cave = { hp: caveGoblin.maxHp, damage: caveGoblin.damage, boosted: !!caveGoblin.nightBoosted };
        const arrows = g.arrowDropBounds(true).slice();

        const rolls = [0, 0.35, 0.35, 0.2];
        const original = Math.random;
        const queue = () => {
            let i = 0;
            Math.random = () => rolls[Math.min(i++, rolls.length - 1)];
        };
        const skeleton = new Monster("skeleton", 0, 0);
        queue();
        const dayDrops = skeleton.getDrops(false);
        queue();
        const nightDrops = skeleton.getDrops(true);
        Math.random = original;

        const savedTime = SaveSystem.capture(g).game.worldTime;
        g.jumpToDay();
        const dawnNote = document.querySelector(".notification") ? document.querySelector(".notification").textContent : "";
        const dawn = {
            hp: goblin.maxHp,
            damage: goblin.damage,
            speed: goblin.speed,
            boosted: !!goblin.nightBoosted,
            isNight: g.isNight(),
        };

        g.companions = g.companions.filter(c => c !== rabbit);
        g.monsters = g.monsters.filter(m => m !== guardian);
        g.caveMonsters = g.caveMonsters.filter(m => m !== caveGoblin);

        return {
            day, night, pack, packNight, guard, cave, note, clock, arrows,
            dayDrops, nightDrops, savedTime, dawn, dawnNote,
            cycle: DAY_CYCLE.length,
            power: {
                hp: NIGHT_POWER.hp,
                damage: NIGHT_POWER.damage,
                speed: NIGHT_POWER.speed,
                gold: NIGHT_POWER.gold,
                dropChance: NIGHT_POWER.dropChance,
                chanceCap: NIGHT_POWER.chanceCap,
                gemCap: NIGHT_POWER.gemCap,
            },
        };
    });

    expect(result.cycle).toBe(6 * 60 * 1000);
    expect(result.power).toEqual({
        hp: 1.5, damage: 1.5, speed: 1.15, gold: 1.5, dropChance: 1.5, chanceCap: 0.75, gemCap: 1,
    });
    expect(result.night.isNight).toBe(true);
    expect(result.clock).toBe("night");
    expect(result.note).toBe("Night falls - monsters grow stronger");
    expect(result.night.hp).toBe(Math.round(result.day.hp * 1.5));
    expect(result.night.damage).toBe(Math.round(result.day.damage * 1.5));
    expect(result.night.speed).toBe(Math.round(result.day.speed * 1.15 * 100) / 100);
    expect(result.night.boosted).toBe(true);
    expect(result.cave.hp).toBe(Math.round(result.day.hp * 1.5));
    expect(result.cave.boosted).toBe(true);
    expect(result.packNight).toEqual(result.pack);
    expect(result.guard.hp).toBe(80);
    expect(result.guard.damage).toBe(15);
    expect(result.guard.boosted).toBe(false);
    expect(result.arrows).toEqual([2, 4]);
    expect(result.dayDrops).toEqual({ gold: 10, weapon: null, armor: null, gem: false });
    expect(result.nightDrops).toEqual({ gold: 15, weapon: "iron_sword", armor: "chain_mail", gem: true });
    expect(result.savedTime).toBeGreaterThan(0);
    expect(result.dawn.isNight).toBe(false);
    expect(result.dawn.boosted).toBe(false);
    expect(result.dawn).toMatchObject(result.day);
    expect(result.dawnNote).toBe("Dawn breaks");
});

test("element powers clear matching ground and leave landmarks standing", async ({ page }) => {
    await startNewGame(page);
    const result = await page.evaluate(() => {
        const g = window.game;
        const w = g.world;

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
            g.player.elements[element] = true;
            g.player.activeElement = element;
            g.player.elementCooldown = 0;
            g.player.x = stand.x * TILE_SIZE + TILE_SIZE / 2;
            g.player.y = stand.y * TILE_SIZE + TILE_SIZE / 2;
            g.ui.dialogQueue = [];
            g.ui.dialogActive = false;
            document.getElementById("dialog-box").classList.add("hidden");
            g.keyJustPressed = { element: true };
            g.update(16);
            g.zoneDisplayTimer = 0;
        }

        const water = find((x, y) => w.tiles[y][x] === TILE.WATER && getZoneAt(x, y) === "swamp");
        const mountain = find((x, y) => w.tiles[y][x] === TILE.MOUNTAIN && getZoneAt(x, y) === "mountains");
        const lake = find((x, y) => w.tiles[y][x] === TILE.WATER && getZoneAt(x, y) === "lake");
        const iceCave = CAVE_ENTRANCES.find(e => e.element === "ice");
        const earthCave = CAVE_ENTRANCES.find(e => e.element === "earth");
        function nearEntrance(entrance, tile) {
            let found = null;
            for (let dy = -3; dy <= 3 && !found; dy++) {
                for (let dx = -3; dx <= 3 && !found; dx++) {
                    const x = entrance.x + dx;
                    const y = entrance.y + dy;
                    if (w.tiles[y][x] !== tile) continue;
                    const stand = neighbor(x, y);
                    if (stand) found = { x, y, stand };
                }
            }
            return found;
        }
        const caveWater = nearEntrance(iceCave, TILE.WATER);
        const caveRock = nearEntrance(earthCave, TILE.MOUNTAIN);

        let edge = null;
        for (let y = 2; y < WORLD_H - 2 && !edge; y++) {
            for (const x of [0, 1]) {
                if (w.tiles[y][x] !== TILE.TREE) continue;
                if (w.isSolid(3, y)) continue;
                edge = { x, y, stand: { x: 3, y } };
                break;
            }
        }

        const fountain = w.fountainOfYouth;
        let fountainWater = null;
        for (let dy = -1; dy <= 1 && !fountainWater; dy++) {
            for (let dx = -1; dx <= 1 && !fountainWater; dx++) {
                if (w.tiles[fountain.tileY + dy][fountain.tileX + dx] === TILE.WATER) {
                    fountainWater = { x: fountain.tileX + dx, y: fountain.tileY + dy };
                }
            }
        }

        cast("ice", water.stand);
        const iceNote = document.querySelector(".notification") ? document.querySelector(".notification").textContent : "";
        cast("earth", mountain.stand);
        cast("ice", lake.stand);
        cast("ice", { x: fountain.tileX, y: fountain.tileY });
        cast("ice", caveWater.stand);
        cast("earth", caveRock.stand);
        cast("fire", edge.stand);

        const canopyBefore = w.tiles[w.skyTree.tileY][w.skyTree.tileX];
        w.clearTerrain("fire", w.skyTree.x, w.skyTree.y);
        const plotBefore = w.tiles[w.worldtreePlot.tileY][w.worldtreePlot.tileX];
        w.clearTerrain("fire", w.worldtreePlot.x, w.worldtreePlot.y);
        w.clearTerrain("earth", w.worldtreePlot.x, w.worldtreePlot.y);
        w.clearTerrain("ice", w.worldtreePlot.x, w.worldtreePlot.y);
        const ladderBefore = w.tiles[w.makersHollow.tileY][w.makersHollow.tileX];
        w.clearTerrain("fire", w.makersHollow.x, w.makersHollow.y);
        w.clearTerrain("ice", w.makersHollow.x, w.makersHollow.y);

        const snap = SaveSystem.capture(g);
        const fresh = new World(w.gemSeed);
        SaveSystem.applyTileDiff(fresh, snap.world.tileDiff);

        return {
            iceNote,
            water: w.tiles[water.y][water.x],
            mountain: w.tiles[mountain.y][mountain.x],
            lake: w.tiles[lake.y][lake.x],
            fountain: w.tiles[fountainWater.y][fountainWater.x],
            cave: w.tiles[caveWater.y][caveWater.x],
            caveRock: w.tiles[caveRock.y][caveRock.x],
            edge: w.tiles[edge.y][edge.x],
            canopyBefore,
            canopy: w.tiles[w.skyTree.tileY][w.skyTree.tileX],
            plotBefore,
            plot: w.tiles[w.worldtreePlot.tileY][w.worldtreePlot.tileX],
            ladderBefore,
            ladder: w.tiles[w.makersHollow.tileY][w.makersHollow.tileX],
            savedWater: fresh.tiles[water.y][water.x],
            savedMountain: fresh.tiles[mountain.y][mountain.x],
            savedLake: fresh.tiles[lake.y][lake.x],
            stone: TILE.STONE,
            waterTile: TILE.WATER,
            tree: TILE.TREE,
            bare: TILE.BARE_EARTH,
            ladderTile: TILE.LADDER,
        };
    });

    expect(result.water).toBe(result.stone);
    expect(result.iceNote).toBe("Ice freezes the water solid");
    expect(result.mountain).toBe(result.stone);
    expect(result.cave).toBe(result.stone);
    expect(result.caveRock).toBe(result.stone);
    expect(result.lake).toBe(result.waterTile);
    expect(result.fountain).toBe(result.waterTile);
    expect(result.edge).toBe(result.tree);
    expect(result.canopy).toBe(result.canopyBefore);
    expect(result.plot).toBe(result.plotBefore);
    expect(result.plot).toBe(result.bare);
    expect(result.ladder).toBe(result.ladderBefore);
    expect(result.ladder).toBe(result.ladderTile);
    expect(result.savedWater).toBe(result.stone);
    expect(result.savedMountain).toBe(result.stone);
    expect(result.savedLake).toBe(result.waterTile);
});
