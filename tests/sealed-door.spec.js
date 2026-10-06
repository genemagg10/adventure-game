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
                ambrosiaClear: g.skyWorld.ambrosia.every(a => Math.hypot(a.x - crystal.x, a.y - crystal.y) >= 120),
                jadeFramed: jade.tileX >= 18 && jade.tileY >= 12 && jade.tileX < CAVE_W - 18 && jade.tileY < CAVE_H - 12,
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
        expect(placed.ambrosiaClear).toBe(true);
        expect(placed.jadeFramed).toBe(true);
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
                openerSafe: LUCA_BOSS.phases[0].bolt * 2 < PLAYER_DEFAULTS.maxHp && LUCA_BOSS.phases[1].bolt * 2 < PLAYER_DEFAULTS.maxHp,
                lateHurts: LUCA_BOSS.phases[2].bolt * 2 >= PLAYER_DEFAULTS.maxHp,
                windup: LUCA_BOSS.windup,
            };
        });
        expect(fight.inSeal).toBe(true);
        expect(fight.name).toBe("Luca");
        expect(fight.harderThanKnight).toBe(true);
        expect(fight.harderThanTurtle).toBe(true);
        expect(fight.harderThanZeus).toBe(true);
        expect(fight.fastest).toBeLessThan(fight.zeusFast);
        expect(fight.openerSafe).toBe(true);
        expect(fight.lateHurts).toBe(true);
        expect(fight.windup).toBeGreaterThanOrEqual(400);

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

    test("the room music starts for the fight and stops when you leave", async ({ page }) => {
        await startNewGame(page);
        const entered = await page.evaluate(() => {
            const g = window.game;
            g.player.holdKey("copper");
            g.player.holdKey("jade");
            g.player.holdKey("crystal");
            g.player.x = g.world.sealedDoor.x + 60;
            g.player.y = g.world.sealedDoor.y;
            g.checkSealedDoor();
            const inReach = g.nearSealedDoor;
            g.trySealedDoor();
            g.syncSealMusic();
            return {
                inReach,
                inSeal: g.inSeal,
                drone: g.sealDroneOn,
                fight: g.sealMusicOn,
                droneLive: g.sound.isSealDronePlaying(),
                fightLive: g.sound.isSealMusicPlaying(),
            };
        });
        expect(entered.inReach).toBe(true);
        expect(entered.inSeal).toBe(true);
        expect(entered.drone).toBe(true);
        expect(entered.fight).toBe(false);
        expect(entered.droneLive).toBe(true);
        expect(entered.fightLive).toBe(false);

        const fighting = await page.evaluate(() => {
            const g = window.game;
            g.luca.spawnAnimation = 0;
            g.syncSealMusic();
            return { drone: g.sealDroneOn, fight: g.sealMusicOn, live: g.sound.isSealMusicPlaying() };
        });
        expect(fighting.drone).toBe(false);
        expect(fighting.fight).toBe(true);
        expect(fighting.live).toBe(true);

        const paused = await page.evaluate(() => {
            const g = window.game;
            g.paused = true;
            g.syncSealMusic();
            const quiet = !g.sealMusicOn && !g.sealDroneOn;
            g.paused = false;
            g.syncSealMusic();
            return { quiet, back: g.sealMusicOn && g.sound.isSealMusicPlaying() };
        });
        expect(paused.quiet).toBe(true);
        expect(paused.back).toBe(true);

        const left = await page.evaluate(() => {
            const g = window.game;
            g.exitSeal();
            g.syncSealMusic();
            return { inSeal: g.inSeal, drone: g.sealDroneOn, fight: g.sealMusicOn, live: g.sound.isSealMusicPlaying() };
        });
        expect(left.inSeal).toBe(false);
        expect(left.drone).toBe(false);
        expect(left.fight).toBe(false);
        expect(left.live).toBe(false);

        const died = await page.evaluate(() => {
            const g = window.game;
            g.trySealedDoor();
            g.luca.spawnAnimation = 0;
            g.syncSealMusic();
            const started = g.sealMusicOn;
            g.respawnPlayer();
            g.syncSealMusic();
            return { started, drone: g.sealDroneOn, fight: g.sealMusicOn, inSeal: g.inSeal };
        });
        expect(died.started).toBe(true);
        expect(died.inSeal).toBe(false);
        expect(died.drone).toBe(false);
        expect(died.fight).toBe(false);
    });

    test("the laser hits a monster up close and at a distance", async ({ page }) => {
        await startNewGame(page);
        const shot = await page.evaluate(() => {
            const g = window.game;
            g.player.addBow("laser_gun");
            g.player.equipBow("laser_gun");
            g.player.arrows = 8;
            g.player.facing = { x: 1, y: 0 };
            function loose(distance) {
                const sk = new Monster("skeleton", g.player.x + distance, g.player.y);
                g.player.lastShootTime = 0;
                g.combat.arrowProjectiles.length = 0;
                const arrow = g.player.shootArrow();
                g.combat.addArrow(arrow);
                for (let i = 0; i < 6; i++) g.combat.updateArrows(80, [sk], null, g.world, null);
                return { hp: sk.hp, alive: sk.alive };
            }
            return {
                damage: BOWS.laser_gun.damage,
                close: loose(24),
                far: loose(160),
            };
        });
        expect(shot.damage).toBeGreaterThanOrEqual(50);
        expect(shot.close.alive).toBe(false);
        expect(shot.close.hp).toBeLessThanOrEqual(0);
        expect(shot.far.alive).toBe(false);
        expect(shot.far.hp).toBeLessThanOrEqual(0);
    });

    test("a hypercharged laser chains across nearby enemies", async ({ page }) => {
        await startNewGame(page);
        const shot = await page.evaluate(() => {
            const g = window.game;
            g.player.addBow("laser_gun");
            g.player.equipBow("laser_gun");
            g.player.hasZeusBolts = true;
            g.player.arrows = 6;
            g.player.facing = { x: 1, y: 0 };
            g.player.lastShootTime = 0;
            g.combat.arrowProjectiles.length = 0;
            g.combat.elementEffects.length = 0;

            const ax = g.player.x + 80;
            const ay = g.player.y;
            const primary = new Monster("skeleton", ax, ay);
            const b = new Monster("skeleton", ax, ay + 100);
            const c = new Monster("skeleton", ax, ay + 200);
            const d = new Monster("skeleton", ax, ay + 300);
            const far = new Monster("skeleton", ax + 400, ay + 300);
            const pack = [primary, b, c, d, far];

            const arrow = g.player.shootArrow();
            g.combat.addArrow(arrow);
            for (let i = 0; i < 6; i++) g.combat.updateArrows(80, pack, null, g.world, null);

            const bolts = g.combat.elementEffects.filter(e => e.element === "lightning_bolt" && e.hyper).length;
            const beam = g.combat.elementEffects.some(e => e.element === "hyper_beam");

            g.player.lastShootTime = 0;
            g.player.elements.fire = true;
            g.player.activeElement = "fire";
            const fired = g.player.shootArrow();

            const luca = new LucaBoss(ax, ay + 100);
            luca.spawned = true;
            luca.spawnAnimation = 0;
            const lead = new Monster("skeleton", ax, ay);
            const after = new Monster("skeleton", ax, ay + 200);
            g.player.activeElement = null;
            g.player.lastShootTime = 0;
            g.combat.arrowProjectiles.length = 0;
            const jump = g.player.shootArrow();
            g.combat.addArrow(jump);
            for (let i = 0; i < 6; i++) g.combat.updateArrows(80, [lead, after], luca, g.world, null);

            const lucaDirect = new LucaBoss(ax, ay);
            lucaDirect.spawned = true;
            lucaDirect.spawnAnimation = 0;
            const beside = new Monster("skeleton", ax, ay + 110);
            g.player.lastShootTime = 0;
            g.combat.arrowProjectiles.length = 0;
            const direct = g.player.shootArrow();
            g.combat.addArrow(direct);
            for (let i = 0; i < 6; i++) g.combat.updateArrows(80, [beside], lucaDirect, g.world, null);

            g.hyperchargeTold = false;
            g.ui.clearNotification();
            g.player.lastShootTime = 0;
            g.player.arrows = 4;
            g.keyJustPressed = { shoot: true };
            g.update(16);
            const toast = document.querySelector(".notification")
                ? document.querySelector(".notification").textContent
                : "";
            g.ui.clearNotification();
            g.player.lastShootTime = 0;
            g.keyJustPressed = { shoot: true };
            g.update(16);
            const second = document.querySelector(".notification")
                ? document.querySelector(".notification").textContent
                : "";

            return {
                hypercharged: arrow.hypercharged,
                zeusSprite: arrow.isZeusBolt,
                damage: arrow.damage,
                fireBonus: Math.floor(ELEMENTS.fire.damage * 0.5),
                cap: HYPER_LASER.lucaChainCap,
                primaryHp: primary.hp,
                b: b.hp,
                c: c.hp,
                d: d.hp,
                far: far.hp,
                bolts,
                beam,
                fireDamage: fired.damage,
                fireHyper: fired.hypercharged,
                lucaDrop: luca.maxHp - luca.hp,
                afterHp: after.hp,
                lucaAlive: luca.alive,
                directDrop: lucaDirect.maxHp - lucaDirect.hp,
                directDamage: direct.damage,
                besideHp: beside.hp,
                toast,
                second,
                told: g.hyperchargeTold,
            };
        });

        expect(shot.hypercharged).toBe(true);
        expect(shot.zeusSprite).toBe(false);
        expect(shot.damage).toBeGreaterThan(50);
        expect(shot.primaryHp).toBeLessThanOrEqual(0);
        expect(shot.b).toBe(50 - Math.floor(shot.damage * 0.6));
        expect(shot.c).toBe(50 - Math.floor(shot.damage * 0.4));
        expect(shot.d).toBe(50 - Math.floor(shot.damage * 0.25));
        expect(shot.far).toBe(50);
        expect(shot.bolts).toBe(3);
        expect(shot.beam).toBe(true);
        expect(shot.fireHyper).toBe(true);
        expect(shot.fireDamage).toBe(shot.damage + shot.fireBonus);
        expect(shot.lucaDrop).toBe(Math.min(Math.floor(shot.damage * 0.6), shot.cap));
        expect(shot.afterHp).toBe(50 - Math.floor(shot.damage * 0.4));
        expect(shot.lucaAlive).toBe(true);
        const directHits = [shot.directDamage, Math.floor(shot.directDamage * 1.6)];
        expect(directHits).toContain(shot.directDrop);
        expect(shot.besideHp).toBe(50 - Math.floor(shot.directDamage * 0.6));
        expect(shot.toast).toBe("Hypercharged!");
        expect(shot.told).toBe(true);
        expect(shot.second).not.toBe("Hypercharged!");
    });

    test("a laser without Zeus's bolts does not chain", async ({ page }) => {
        await startNewGame(page);
        const shot = await page.evaluate(() => {
            const g = window.game;
            g.player.addBow("laser_gun");
            g.player.equipBow("laser_gun");
            g.player.hasZeusBolts = false;
            g.player.arrows = 4;
            g.player.facing = { x: 1, y: 0 };
            g.player.lastShootTime = 0;
            g.combat.arrowProjectiles.length = 0;
            g.combat.elementEffects.length = 0;

            const ax = g.player.x + 80;
            const ay = g.player.y;
            const primary = new Monster("skeleton", ax, ay);
            const b = new Monster("skeleton", ax, ay + 100);
            const c = new Monster("skeleton", ax, ay + 200);
            const pack = [primary, b, c];
            const arrow = g.player.shootArrow();
            g.combat.addArrow(arrow);
            for (let i = 0; i < 6; i++) g.combat.updateArrows(80, pack, null, g.world, null);
            return {
                hypercharged: arrow.hypercharged,
                zeusSprite: arrow.isZeusBolt,
                damage: arrow.damage,
                primaryHp: primary.hp,
                b: b.hp,
                c: c.hp,
                bolts: g.combat.elementEffects.filter(e => e.element === "lightning_bolt").length,
            };
        });

        expect(shot.hypercharged).toBe(false);
        expect(shot.zeusSprite).toBe(false);
        expect(shot.damage).toBeGreaterThanOrEqual(50);
        expect(shot.primaryHp).toBeLessThanOrEqual(0);
        expect(shot.b).toBe(50);
        expect(shot.c).toBe(50);
        expect(shot.bolts).toBe(0);
    });

    test("a fire laser burns like a fire arrow and opens the Worldtree", async ({ page }) => {
        await startNewGame(page);
        const shot = await page.evaluate(() => {
            const g = window.game;
            g.player.addBow("laser_gun");
            g.player.equipBow("laser_gun");
            g.player.hasZeusBolts = false;
            g.player.elements.fire = true;
            g.player.activeElement = "fire";
            g.player.arrows = 12;
            g.player.facing = { x: 1, y: 0 };
            g.player.lastShootTime = 0;
            g.combat.arrowProjectiles.length = 0;
            g.combat.elementEffects.length = 0;

            const ax = g.player.x + 80;
            const ay = g.player.y;
            const primary = new Monster("skeleton", ax, ay);
            const beside = new Monster("skeleton", ax, ay + 100);
            const arrow = g.player.shootArrow();
            g.combat.addArrow(arrow);
            for (let i = 0; i < 8; i++) g.combat.updateArrows(80, [primary, beside], null, g.world, null);
            const burned = g.combat.elementEffects.filter(e => e.element === "fire").length;

            const st = g.world.skyTree;
            const before = st.state;
            function looseAtTree(fire) {
                g.player.elements.fire = !!fire;
                g.player.activeElement = fire ? "fire" : null;
                g.player.hasZeusBolts = false;
                g.player.lastShootTime = 0;
                g.player.x = st.x - 100;
                g.player.y = st.y;
                g.player.facing = { x: 1, y: 0 };
                g.combat.arrowProjectiles.length = 0;
                g.combat.worldEvents.length = 0;
                const shot = g.player.shootArrow();
                g.combat.addArrow(shot);
                for (let i = 0; i < 14; i++) g.combat.updateArrows(16, [], null, g.world, null);
                return {
                    fire: shot.isFireArrow,
                    hyper: shot.hypercharged,
                    left: g.combat.arrowProjectiles.length,
                };
            }
            const plain = looseAtTree(false);
            const afterPlain = st.state;
            const resisted = g.combat.worldEvents.some(ev => ev.type === "skyTreeResisted");
            const lit = looseAtTree(true);
            g.combat.worldEvents.length = 0;
            g.ui.dialogQueue = [];
            g.ui.dialogActive = false;
            document.getElementById("dialog-box").classList.add("hidden");

            const calls = { zap: 0, crackle: 0, whoosh: 0 };
            const snd = g.sound;
            const zap = snd.laserZap.bind(snd);
            const crack = snd.hyperCrackle.bind(snd);
            const whoosh = snd.laserFireWhoosh.bind(snd);
            snd.laserZap = () => { calls.zap++; zap(); };
            snd.hyperCrackle = () => { calls.crackle++; crack(); };
            snd.laserFireWhoosh = () => { calls.whoosh++; whoosh(); };
            g.player.elements.fire = true;
            g.player.activeElement = "fire";
            g.player.hasZeusBolts = false;
            g.player.arrows = 4;
            g.player.lastShootTime = 0;
            g.hyperchargeTold = true;
            g.keyJustPressed = { shoot: true };
            g.update(16);
            const fireCalls = { zap: calls.zap, crackle: calls.crackle, whoosh: calls.whoosh };
            g.player.hasZeusBolts = true;
            g.player.lastShootTime = 0;
            calls.zap = 0;
            calls.crackle = 0;
            calls.whoosh = 0;
            g.ui.dialogQueue = [];
            g.ui.dialogActive = false;
            g.keyJustPressed = { shoot: true };
            g.update(16);

            return {
                fire: arrow.isFireArrow,
                hyper: arrow.hypercharged,
                damage: arrow.damage,
                base: BOWS.laser_gun.damage,
                fireBonus: Math.floor(ELEMENTS.fire.damage * 0.5),
                primaryDead: primary.alive === false,
                beside: beside.hp,
                burned,
                before,
                plain,
                afterPlain,
                resisted,
                lit,
                afterFire: st.state,
                fireCalls,
                bothCalls: { zap: calls.zap, crackle: calls.crackle, whoosh: calls.whoosh },
            };
        });

        expect(shot.fire).toBe(true);
        expect(shot.hyper).toBe(false);
        expect(shot.damage).toBe(shot.base + shot.fireBonus);
        expect(shot.primaryDead).toBe(true);
        expect(shot.beside).toBe(50);
        expect(shot.burned).toBeGreaterThan(0);
        expect(shot.plain.fire).toBe(false);
        expect(shot.plain.left).toBe(0);
        expect(shot.afterPlain).toBe(shot.before);
        expect(shot.resisted).toBe(true);
        expect(shot.lit.fire).toBe(true);
        expect(shot.lit.hyper).toBe(false);
        expect(shot.afterFire).toBe("burning");
        expect(shot.fireCalls).toEqual({ zap: 1, crackle: 0, whoosh: 1 });
        expect(shot.bothCalls).toEqual({ zap: 1, crackle: 1, whoosh: 1 });
    });

    test("a fiery chain burns every foe it jumps to", async ({ page }) => {
        await startNewGame(page);
        const shot = await page.evaluate(() => {
            const g = window.game;
            g.player.addBow("laser_gun");
            g.player.equipBow("laser_gun");
            g.player.hasZeusBolts = true;
            g.player.elements.fire = true;
            g.player.activeElement = "fire";
            g.player.arrows = 8;
            g.player.facing = { x: 1, y: 0 };
            g.player.lastShootTime = 0;
            g.combat.arrowProjectiles.length = 0;
            g.combat.elementEffects.length = 0;

            const ax = g.player.x + 80;
            const ay = g.player.y;
            const primary = new Monster("skeleton", ax, ay);
            const b = new Monster("skeleton", ax, ay + 100);
            const c = new Monster("skeleton", ax, ay + 200);
            const d = new Monster("skeleton", ax, ay + 300);
            const far = new Monster("skeleton", ax + 400, ay + 300);
            const pack = [primary, b, c, d, far];
            const arrow = g.player.shootArrow();
            g.combat.addArrow(arrow);
            for (let i = 0; i < 6; i++) g.combat.updateArrows(80, pack, null, g.world, null);

            const nearFire = (m) => g.combat.elementEffects.some(e =>
                e.element === "fire" && Math.hypot(e.x - m.x, e.y - m.y) < 8);
            const bolts = g.combat.elementEffects.filter(e => e.element === "lightning_bolt");
            const burns = {
                b: nearFire(b),
                c: nearFire(c),
                d: nearFire(d),
                far: nearFire(far),
            };
            const boltInfo = {
                bolts: bolts.length,
                fieryBolts: bolts.filter(e => e.fiery && e.hyper).length,
                embers: bolts.reduce((n, e) => n + (e.embers ? e.embers.length : 0), 0),
            };

            g.combat.elementEffects.length = 0;
            g.combat.arrowProjectiles.length = 0;
            g.player.activeElement = null;
            g.player.lastShootTime = 0;
            const quietLead = new Monster("skeleton", ax, ay);
            const quietNext = new Monster("skeleton", ax, ay + 100);
            const quiet = g.player.shootArrow();
            g.combat.addArrow(quiet);
            for (let i = 0; i < 6; i++) g.combat.updateArrows(80, [quietLead, quietNext], null, g.world, null);
            const quietFires = g.combat.elementEffects.filter(e => e.element === "fire").length;
            const quietFiery = g.combat.elementEffects.some(e => e.element === "lightning_bolt" && e.fiery);

            const luca = new LucaBoss(ax, ay + 100);
            luca.spawned = true;
            luca.spawnAnimation = 0;
            const lead = new Monster("skeleton", ax, ay);
            g.player.activeElement = "fire";
            g.player.lastShootTime = 0;
            g.combat.arrowProjectiles.length = 0;
            const jump = g.player.shootArrow();
            g.combat.addArrow(jump);
            for (let i = 0; i < 6; i++) g.combat.updateArrows(80, [lead], luca, g.world, null);

            return {
                fire: arrow.hypercharged && arrow.isFireArrow,
                damage: arrow.damage,
                cap: HYPER_LASER.lucaChainCap,
                primaryDead: primary.alive === false,
                b: b.hp,
                c: c.hp,
                d: d.hp,
                far: far.hp,
                burnB: burns.b,
                burnC: burns.c,
                burnD: burns.d,
                burnFar: burns.far,
                bolts: boltInfo.bolts,
                fieryBolts: boltInfo.fieryBolts,
                embers: boltInfo.embers,
                quietFires,
                quietFiery,
                lucaDrop: luca.maxHp - luca.hp,
                lucaAlive: luca.alive,
            };
        });

        expect(shot.fire).toBe(true);
        expect(shot.primaryDead).toBe(true);
        expect(shot.b).toBe(50 - Math.floor(shot.damage * 0.6));
        expect(shot.c).toBe(50 - Math.floor(shot.damage * 0.4));
        expect(shot.d).toBe(50 - Math.floor(shot.damage * 0.25));
        expect(shot.far).toBe(50);
        expect(shot.burnB).toBe(true);
        expect(shot.burnC).toBe(true);
        expect(shot.burnD).toBe(true);
        expect(shot.burnFar).toBe(false);
        expect(shot.bolts).toBe(3);
        expect(shot.fieryBolts).toBe(3);
        expect(shot.embers).toBeGreaterThan(0);
        expect(shot.quietFires).toBe(0);
        expect(shot.quietFiery).toBe(false);
        expect(shot.lucaDrop).toBe(Math.min(Math.floor(shot.damage * 0.6), shot.cap));
        expect(shot.lucaAlive).toBe(true);
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
