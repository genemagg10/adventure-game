const { test, expect } = require("@playwright/test");
const { startNewGame, saveToSlot, waitForRunningGame, openTitle } = require("./helpers");

function reachable(tilesSolid, w, h, sx, sy, tx, ty) {
    const seen = new Set([sx + "," + sy]);
    const stack = [[sx, sy]];
    while (stack.length) {
        const [x, y] = stack.pop();
        if (x === tx && y === ty) return true;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const nx = x + dx, ny = y + dy;
            const key = nx + "," + ny;
            if (nx < 0 || ny < 0 || nx >= w || ny >= h || seen.has(key)) continue;
            if (tilesSolid[ny * w + nx]) continue;
            seen.add(key);
            stack.push([nx, ny]);
        }
    }
    return false;
}

test.describe("three keys and the door beside the Hollow", () => {
    test("each realm holds one key, and the door wants all three", async ({ page }) => {
        await startNewGame(page);
        const placed = await page.evaluate(() => {
            const g = window.game;
            const copper = g.world.strangeKey;
            const jade = g.caveWorlds[0].strangeKey;
            const crystal = g.skyWorld.strangeKey;
            const door = g.world.sealedDoor;
            const hollow = g.world.makersHollow;
            const solid = (world, x, y) => world.isSolid(x, y);
            const cave = g.caveWorlds[0];
            const caveSolid = [];
            for (let y = 0; y < CAVE_H; y++) {
                for (let x = 0; x < CAVE_W; x++) caveSolid.push(cave.isSolid(x, y) ? 1 : 0);
            }
            const skySolid = [];
            for (let y = 0; y < SKY_H; y++) {
                for (let x = 0; x < SKY_W; x++) skySolid.push(g.skyWorld.isSolid(x, y) ? 1 : 0);
            }
            const labels = g.world.mapLandmarks().map(m => m.label || "").join(" | ");
            const lore = MERLIN_LORE.map(e => `${e.title}\n${e.text}`).join("\n");
            return {
                copper, jade, crystal, door, hollow,
                copperOpen: !solid(g.world, copper.tileX, copper.tileY),
                jadeOpen: !solid(cave, jade.tileX, jade.tileY),
                crystalOpen: !solid(g.skyWorld, crystal.tileX, crystal.tileY),
                jadeFar: Math.hypot(jade.x - cave.treasurePos.x, jade.y - cave.treasurePos.y),
                crystalFarFromTemple: Math.abs(crystal.tileX - g.skyWorld.templeCenter.x) + Math.abs(crystal.tileY - g.skyWorld.templeCenter.y),
                caveSolid, skySolid,
                caveExit: [cave.exit.x, cave.exit.y],
                skyExit: [g.skyWorld.exit.x, g.skyWorld.exit.y],
                otherCaves: [1, 2, 3].map(id => g.caveWorlds[id].strangeKey),
                labels, lore,
                doorGap: Math.hypot(door.x - hollow.x, door.y - hollow.y),
            };
        });

        expect(placed.copper.id).toBe("copper");
        expect(placed.jade.id).toBe("jade");
        expect(placed.crystal.id).toBe("crystal");
        expect(placed.copperOpen).toBe(true);
        expect(placed.jadeOpen).toBe(true);
        expect(placed.crystalOpen).toBe(true);
        expect(placed.jadeFar).toBeGreaterThan(TILE_GAP());
        expect(placed.crystalFarFromTemple).toBeGreaterThan(12);
        expect(placed.otherCaves.every(k => !k)).toBe(true);
        expect(reachable(placed.caveSolid, 80, 60, placed.caveExit[0], placed.caveExit[1], placed.jade.tileX, placed.jade.tileY)).toBe(true);
        expect(reachable(placed.skySolid, 80, 60, placed.skyExit[0], placed.skyExit[1], placed.crystal.tileX, placed.crystal.tileY)).toBe(true);
        expect(placed.doorGap).toBeGreaterThan(80);
        expect(placed.labels).not.toMatch(/Copper|Jade|Crystal|Laser/);
        expect(placed.lore).not.toMatch(/Laser Gun|Copper Key|Jade Key|Crystal Key/);

        await page.evaluate(() => {
            const g = window.game;
            g.player.x = g.world.sealedDoor.x;
            g.player.y = g.world.sealedDoor.y;
            g.checkSealedDoor();
            g.trySealedDoor();
        });
        await expect(page.locator(".notification")).toHaveText("The locks click. A notch is empty.");
        expect(await page.evaluate(() => window.game.inSeal)).toBe(false);

        const fight = await page.evaluate(() => {
            const g = window.game;
            g.player.holdKey("copper");
            g.player.holdKey("jade");
            g.player.holdKey("crystal");
            g.trySealedDoor();
            const luca = g.luca;
            const fastest = Math.min(...LUCA_BOSS.phases.map(p => p.attackRate));
            const zeusFast = Math.min(...ZEUS_BOSS.phases.map(p => p.attackRate));
            return {
                inSeal: g.inSeal,
                name: luca && luca.name,
                hp: luca && luca.maxHp,
                damage: luca && luca.damage,
                bolt: LUCA_BOSS.boltDamage,
                fastest,
                zeusFast,
                harderThanKnight: LUCA_BOSS.hp > BOSS.hp && LUCA_BOSS.damage > BOSS.damage,
                harderThanTurtle: LUCA_BOSS.hp > GIANT_TURTLE.hp && LUCA_BOSS.damage > GIANT_TURTLE.damage,
                harderThanZeus: LUCA_BOSS.hp > ZEUS_BOSS.hp && LUCA_BOSS.damage > ZEUS_BOSS.damage && LUCA_BOSS.boltDamage > OLYMPIAN_DAMAGE.zeusBolt,
            };
        });
        expect(fight.inSeal).toBe(true);
        expect(fight.name).toBe("Luca");
        expect(fight.harderThanKnight).toBe(true);
        expect(fight.harderThanTurtle).toBe(true);
        expect(fight.harderThanZeus).toBe(true);
        expect(fight.fastest).toBeLessThan(fight.zeusFast);

        const reward = await page.evaluate(() => {
            const g = window.game;
            g.luca.hp = 1;
            const killed = g.luca.takeDamage(5, g.player.x, g.player.y);
            if (killed) g.onEntityKilled(g.luca, true);
            const before = HallOfDeeds.readStore().length;
            HallOfDeeds.record({ playerTag: g.player.playerTag, siblingName: "Wayfarer", milestoneId: "luca-defeated" });
            return {
                killed,
                bow: g.player.currentBow,
                owns: g.player.bows.includes("laser_gun"),
                damage: BOWS.laser_gun.damage,
                speed: BOWS.laser_gun.projectileSpeed,
                rate: BOWS.laser_gun.speed,
                stronger: BOWS.laser_gun.damage > BOWS.arrow_strength_bow.damage
                    && BOWS.laser_gun.projectileSpeed > BOWS.arrow_strength_bow.projectileSpeed
                    && BOWS.laser_gun.speed > BOWS.arrow_strength_bow.speed,
                bolt: BOWS.laser_gun.bolt,
                hallGrew: HallOfDeeds.readStore().length > before,
                defeated: g.lucaDefeated,
            };
        });
        expect(reward.killed).toBe(true);
        expect(reward.bow).toBe("laser_gun");
        expect(reward.owns).toBe(true);
        expect(reward.stronger).toBe(true);
        expect(reward.bolt).toBe("laser");
        expect(reward.hallGrew).toBe(false);
        expect(reward.defeated).toBe(true);
    });

    test("the tag, the keys, and the laser gun survive a save", async ({ page }) => {
        await startNewGame(page);
        await page.evaluate(() => {
            const g = window.game;
            g.player.holdKey("jade");
            g.player.holdKey("crystal");
            g.world.strangeKey.collected = true;
            g.player.holdKey("copper");
            g.player.addBow("laser_gun");
            g.player.equipBow("laser_gun");
            g.player.arrows = 40;
            g.lucaDefeated = true;
        });
        await saveToSlot(page, 2);
        await page.evaluate(() => window.game.restart());
        await page.click("#loadBtn");
        await page.click("#slots-list .save-slot:nth-child(2) .save-slot-choose");
        await waitForRunningGame(page);
        const back = await page.evaluate(() => ({
            tag: window.game.player.playerTag,
            sibling: window.game.player.siblingId,
            keys: window.game.player.heldKeys.slice().sort(),
            bow: window.game.player.currentBow,
            arrows: window.game.player.arrows,
            defeated: window.game.lucaDefeated,
            copperGone: window.game.world.strangeKey.collected,
        }));
        expect(back.tag).toBe("Wayfarer");
        expect(back.sibling).toBeTruthy();
        expect(back.keys).toEqual(["copper", "crystal", "jade"]);
        expect(back.bow).toBe("laser_gun");
        expect(back.arrows).toBe(40);
        expect(back.defeated).toBe(true);
        expect(back.copperGone).toBe(true);
    });

    test("public pages do not describe the sealed fight", async ({ page }) => {
        await openTitle(page);
        const readme = await (await page.request.get("/README.md")).text();
        const binder = await (await page.request.get("/docs/development-binder/BINDER_MASTER.md")).text();
        for (const text of [readme, binder]) {
            expect(text).not.toContain("Laser Gun");
            expect(text).not.toContain("Copper Key");
            expect(text).not.toContain("Jade Key");
            expect(text).not.toContain("Crystal Key");
        }
    });
});

function TILE_GAP() {
    return 32 * 4;
}
