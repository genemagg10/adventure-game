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
                lucaDeeds: HallOfDeeds.readStore().filter(d => d.milestoneId === "luca-defeated").map(d => d.milestone),
                laserDeed: HallOfDeeds.readStore().some(d => d.milestoneId === "laser-gun"),
                defeated: g.lucaDefeated,
            };
        });
        expect(reward.killed).toBe(true);
        expect(reward.bow).toBe("laser_gun");
        expect(reward.owns).toBe(true);
        expect(reward.stronger).toBe(true);
        expect(reward.bolt).toBe("laser");
        expect(reward.lucaDeeds).toEqual(["Beat Luca"]);
        expect(reward.hallGrew).toBe(false);
        expect(reward.laserDeed).toBe(false);
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
            g.combat.arrowProjectiles.length = 0;
            g.monsters = [];
            g.player.x = 80;
            g.player.y = 80;
            g.player.facing = { x: 1, y: 0 };
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
            g.ui.clearNotification();
            g.keyJustPressed = { shoot: true };
            g.update(16);
            const fireToast = document.querySelector(".notification")
                ? document.querySelector(".notification").textContent
                : "";
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
                fireToast,
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
        expect(shot.fireToast).toBe("Fire laser!");
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

    test("standing in melee range deals no damage without Luca's swipe", async ({ page }) => {
        await startNewGame(page);
        const stood = await page.evaluate(() => {
            const g = window.game;
            const luca = new LucaBoss(g.player.x + 30, g.player.y);
            luca.spawned = true;
            luca.spawnAnimation = 0;
            luca.swipeReadyAt = Date.now() + 10000;
            luca.lastAttackTime = Date.now() + 5000;
            const stuck = { isSolid() { return true; } };
            const hp = g.player.hp;
            let elapsed = 0;
            while (elapsed < 2000) {
                luca.update(16, g.player, stuck);
                elapsed += 16;
            }
            const stoodHp = g.player.hp;
            const stoodSwipe = luca.swipe;
            const stoodBolts = luca.projectiles.length;
            const stoodWindup = luca.windup;
            const inside = Math.hypot(luca.x - g.player.x, luca.y - g.player.y) < luca.size + g.player.size + 6;

            g.player.hp = hp;
            g.player.invincible = false;
            luca.projectiles.length = 0;
            luca.windup = { left: 16, total: LUCA_BOSS.windup, pattern: "frenzy", bolt: 56, angle: 0 };
            luca.swipe = null;
            luca.update(16, g.player, stuck);
            const told = luca.chargeWindup === LUCA_BOSS.chargeWindup && luca.charging === false;
            luca.projectiles.length = 0;
            g.player.hp = hp;
            g.player.invincible = false;
            let woundDamage = false;
            while (luca.chargeWindup > 0) {
                const before = g.player.hp;
                luca.update(16, g.player, stuck);
                if (g.player.hp !== before) woundDamage = true;
            }
            luca.x = g.player.x + 10;
            luca.y = g.player.y;
            luca.charging = true;
            luca.chargeHit = false;
            luca.chargeTimer = 400;
            luca.chargeDir = { x: 0, y: 0 };
            let hits = 0;
            const orig = g.player.takeDamage.bind(g.player);
            g.player.takeDamage = function(amount, fromX, fromY) {
                const landed = orig(amount, fromX, fromY);
                if (landed) hits++;
                this.invincible = false;
                return landed;
            };
            for (let i = 0; i < 20; i++) luca.update(16, g.player, stuck);

            return {
                hp: stoodHp,
                before: hp,
                swipe: stoodSwipe,
                bolts: stoodBolts,
                windup: stoodWindup,
                inside,
                told,
                woundDamage,
                chargeHits: hits,
            };
        });
        expect(stood.hp).toBe(stood.before);
        expect(stood.swipe).toBeNull();
        expect(stood.bolts).toBe(0);
        expect(stood.windup).toBeNull();
        expect(stood.inside).toBe(true);
        expect(stood.told).toBe(true);
        expect(stood.woundDamage).toBe(false);
        expect(stood.chargeHits).toBe(1);
    });

    test("Luca's health bar stays in the sealed room", async ({ page }) => {
        await startNewGame(page);
        const bar = await page.evaluate(() => {
            const g = window.game;
            const shown = () => {
                const el = document.getElementById("boss-health-container");
                const name = document.getElementById("boss-name");
                return el ? (name ? name.textContent : "") : "";
            };
            const arm = () => {
                g.player.holdKey("copper");
                g.player.holdKey("jade");
                g.player.holdKey("crystal");
            };
            const wake = () => {
                g.sealIntro = 0;
                if (!g.luca) return;
                g.luca.spawnAnimation = 0;
                g.luca.swipeReadyAt = Date.now() + 60000;
                g.luca.lastAttackTime = Date.now() + 60000;
            };
            arm();
            g.trySealedDoor();
            wake();
            g.update(16);
            const during = shown();
            g.inSeal = false;
            g.update(16);
            const leaked = shown();
            g.inSeal = true;
            wake();
            g.update(16);
            const back = shown();
            g.exitSeal();
            const left = shown();
            arm();
            g.trySealedDoor();
            wake();
            g.update(16);
            g.player.hp = 0;
            g.update(16);
            const fallen = shown();
            const meadow = g.inSeal === false;
            arm();
            g.trySealedDoor();
            wake();
            g.update(16);
            g.luca.hp = 1;
            const killed = g.luca.takeDamage(5, g.player.x, g.player.y);
            if (killed) g.onEntityKilled(g.luca, true);
            return { during, leaked, back, left, fallen, meadow, won: shown() };
        });
        expect(bar.during).toBe("Luca");
        expect(bar.leaked).toBe("");
        expect(bar.back).toBe("Luca");
        expect(bar.left).toBe("");
        expect(bar.fallen).toBe("");
        expect(bar.meadow).toBe(true);
        expect(bar.won).toBe("");
    });

    test("the sealed room map draws the chamber in pixels", async ({ page }) => {
        await startNewGame(page);
        const px = await page.evaluate(() => {
            const g = window.game;
            g.player.holdKey("copper");
            g.player.holdKey("jade");
            g.player.holdKey("crystal");
            g.trySealedDoor();
            g.sealIntro = 0;
            g.luca.spawnAnimation = 0;
            g.luca.alive = true;
            g.luca.spawned = true;
            const spot = g.sealWorld.bossSpawn;
            g.player.x = spot.worldX;
            g.player.y = spot.worldY + 90;
            g.minimapDirty = true;
            g.render();
            const canvas = document.getElementById("minimap");
            const data = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height).data;
            const count = (r, gch, b, tol) => {
                let n = 0;
                for (let i = 0; i < data.length; i += 4) {
                    if (Math.abs(data[i] - r) <= tol && Math.abs(data[i + 1] - gch) <= tol && Math.abs(data[i + 2] - b) <= tol) n++;
                }
                return n;
            };
            let gold = 0;
            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const gch = data[i + 1];
                const b = data[i + 2];
                if (r > 170 && gch > 120 && b < 140 && r > b + 40 && gch > b) gold++;
            }
            return {
                gold,
                floor: count(0x31, 0x38, 0x46, 2),
                pale: count(0x8d, 0x96, 0xa6, 2),
                wall: count(0x10, 0x14, 0x1c, 2),
                outline: count(0x7d, 0x87, 0x98, 8),
                sigil: count(0x7e, 0xf0, 0xff, 2),
                player: count(0x4e, 0xf0, 0x6a, 2),
                luca: count(0xff, 0x33, 0x55, 10),
            };
        });
        expect(px.pale, "the blank pale-grey fill").toBe(0);
        expect(px.floor, "chamber floor").toBeGreaterThan(400);
        expect(px.wall, "chamber walls").toBeGreaterThan(80);
        expect(px.outline, "wall outline").toBeGreaterThan(40);
        expect(px.gold, "gold frame").toBeGreaterThan(40);
        expect(px.sigil, "sigil").toBeGreaterThan(8);
        expect(px.player, "player dot").toBeGreaterThan(8);
        expect(px.luca, "Luca dot").toBeGreaterThan(4);
    });

    test("a sidestep during the locked glow avoids the bolt", async ({ page }) => {
        await startNewGame(page);
        const dodge = await page.evaluate(() => {
            const g = window.game;
            const open = { isSolid() { return false; } };
            const luca = new LucaBoss(500, 500);
            luca.spawned = true;
            luca.spawnAnimation = 0;
            luca.swipeReadyAt = Date.now() + 600000;
            const player = g.player;
            player.x = luca.x + LUCA_BOSS.boltRange;
            player.y = luca.y;
            player.hp = 100;
            player.invincible = false;
            player.shieldActive = false;
            const origNow = Date.now;
            let clock = origNow.call(Date);
            Date.now = () => clock;
            luca.lastAttackTime = clock - 5000;
            clock += 16;
            luca.update(16, player, open);
            const started = luca.windup && luca.windup.pattern === "bolt" && luca.windup.locked === true;
            const aim = luca.windup ? luca.windup.angle : null;
            player.y += 140;
            let guard = 0;
            while (luca.windup && guard < 40) {
                clock += 16;
                luca.update(16, player, open);
                guard++;
            }
            const bolt = luca.projectiles.find(p => p.kind === "bolt");
            let aimDrift = 99;
            if (bolt && aim != null) {
                const fired = Math.atan2(bolt.vy, bolt.vx);
                aimDrift = Math.abs(fired - aim);
                if (aimDrift > Math.PI) aimDrift = Math.PI * 2 - aimDrift;
            }
            const hp = player.hp;
            if (bolt) {
                for (let i = 0; i < 80; i++) {
                    bolt.x += bolt.vx * 16 * 0.1;
                    bolt.y += bolt.vy * 16 * 0.1;
                    if (circleOverlap(bolt.x, bolt.y, 6, player.x, player.y, player.size)) {
                        player.takeDamage(bolt.damage, bolt.x, bolt.y);
                    }
                }
            }
            luca.hp = luca.maxHp * 0.6;
            luca.projectiles.length = 0;
            luca.windup = null;
            luca.plant = 0;
            luca.swipe = null;
            luca.lastAttackTime = clock - 5000;
            player.x = luca.x + 160;
            player.y = luca.y;
            clock += 16;
            luca.update(16, player, open);
            const tracked = !!(luca.windup && luca.windup.pattern === "fan" && luca.windup.locked === false);
            const before = luca.windup ? luca.windup.angle : 0;
            player.y += 220;
            clock += 16;
            luca.update(16, player, open);
            const followed = luca.windup ? Math.abs(luca.windup.angle - before) > 0.2 : false;
            const stillOpen = luca.windup ? luca.windup.locked === false : false;
            luca.windup.left = LUCA_BOSS.aimLock;
            clock += 16;
            luca.update(16, player, open);
            const lockedAngle = luca.windup.angle;
            const didLock = luca.windup.locked === true;
            player.y -= 400;
            clock += 16;
            luca.update(16, player, open);
            const held = luca.windup.angle === lockedAngle && luca.windup.locked === true;
            Date.now = origNow;
            return {
                started,
                aimDrift,
                missed: player.hp === hp,
                hadBolt: !!bolt,
                tracked,
                followed,
                stillOpen,
                didLock,
                held,
            };
        });
        expect(dodge.started).toBe(true);
        expect(dodge.hadBolt).toBe(true);
        expect(dodge.aimDrift).toBeLessThan(0.05);
        expect(dodge.missed).toBe(true);
        expect(dodge.tracked).toBe(true);
        expect(dodge.followed).toBe(true);
        expect(dodge.stillOpen).toBe(true);
        expect(dodge.didLock).toBe(true);
        expect(dodge.held).toBe(true);
    });

    test("a melee hit lands during the plant window", async ({ page }) => {
        await startNewGame(page);
        const planted = await page.evaluate(() => {
            const g = window.game;
            const open = { isSolid() { return false; } };
            const luca = new LucaBoss(400, 400);
            luca.spawned = true;
            luca.spawnAnimation = 0;
            luca.plant = LUCA_BOSS.plant;
            luca.swipe = null;
            luca.windup = null;
            const player = g.player;
            const pocket = luca.size + player.size + LUCA_BOSS.standoff;
            player.x = luca.x + pocket;
            player.y = luca.y;
            player.facing = { x: -1, y: 0 };
            player.shieldActive = false;
            const swing = (weapon) => {
                luca.hp = luca.maxHp;
                luca.alive = true;
                player.currentWeapon = weapon;
                player.attacking = false;
                player.lastAttackTime = 0;
                player.attackHitTargets = null;
                const before = luca.hp;
                const swung = player.attack();
                g.combat.checkPlayerAttack(player, [], luca, null);
                return { swung, hit: luca.hp < before, hp: luca.hp, before, dist: pocket };
            };
            const dark = swing("dark_blade");
            const rusty = swing("rusty_sword");
            const x0 = luca.x;
            const y0 = luca.y;
            luca.plant = LUCA_BOSS.plant;
            luca.lastAttackTime = 0;
            luca.windup = null;
            luca.swipe = null;
            luca.swipeReadyAt = Date.now() + 600000;
            const origNow = Date.now;
            let clock = origNow.call(Date);
            Date.now = () => clock;
            for (let t = 0; t < 700; t += 16) {
                clock += 16;
                luca.update(16, player, open);
            }
            Date.now = origNow;
            return {
                dark,
                rusty,
                pocket,
                darkReach: WEAPONS.dark_blade.range + luca.size,
                rustyReach: WEAPONS.rusty_sword.range + luca.size,
                still: luca.x === x0 && luca.y === y0,
                quiet: luca.windup == null && luca.projectiles.length === 0,
                planting: luca.plant > 0,
            };
        });
        expect(planted.pocket).toBeLessThan(planted.rustyReach);
        expect(planted.pocket).toBeLessThan(planted.darkReach);
        expect(planted.dark.swung).toBe(true);
        expect(planted.dark.hit).toBe(true);
        expect(planted.rusty.swung).toBe(true);
        expect(planted.rusty.hit).toBe(true);
        expect(planted.still).toBe(true);
        expect(planted.quiet).toBe(true);
        expect(planted.planting).toBe(true);
    });

    test("an honest 300 HP run reaches phase 2", async ({ page }) => {
        await startNewGame(page);
        const run = await page.evaluate(() => {
            const g = window.game;
            g.player.holdKey("copper");
            g.player.holdKey("jade");
            g.player.holdKey("crystal");
            g.trySealedDoor();
            g.sealIntro = 0;
            const luca = g.luca;
            const player = g.player;
            luca.spawned = true;
            luca.spawnAnimation = 0;
            luca.alive = true;
            luca.hp = luca.maxHp;
            luca.swipe = null;
            luca.windup = null;
            luca.plant = 0;
            luca.projectiles.length = 0;
            const spot = g.sealWorld.bossSpawn;
            luca.x = spot.worldX;
            luca.y = spot.worldY;
            player.x = luca.x;
            player.y = luca.y + 48;
            player.currentWeapon = "dark_blade";
            player.currentArmor = "cloth_tunic";
            player.greenGemDefense = false;
            player.purpleGemArmor = false;
            player.hasRainbowGem = false;
            player.maxHp = 300;
            player.hp = 300;
            player.invincible = false;
            player.invincibleTimer = 0;
            player.shieldActive = false;
            player.attacking = false;
            player.lastAttackTime = 0;
            const origNow = Date.now;
            let clock = origNow.call(Date);
            Date.now = () => clock;
            luca.lastAttackTime = clock - 5000;
            const hold = 48;
            const speed = PLAYER_DEFAULTS.speed;
            let steps = 0;
            while (luca.hp / luca.maxHp > 0.72 && player.hp > 0 && luca.alive && steps < 8000) {
                clock += 16;
                let dx = luca.x - player.x;
                let dy = luca.y - player.y;
                let d = Math.hypot(dx, dy) || 1;
                player.facing = { x: dx / d, y: dy / d };
                if (d > hold) {
                    const step = Math.min(speed, d - hold);
                    player.x += (dx / d) * step;
                    player.y += (dy / d) * step;
                } else if (d < hold - 6) {
                    const step = Math.min(speed, (hold - 6) - d);
                    player.x -= (dx / d) * step;
                    player.y -= (dy / d) * step;
                }
                dx = luca.x - player.x;
                dy = luca.y - player.y;
                d = Math.hypot(dx, dy) || 1;
                player.facing = { x: dx / d, y: dy / d };
                if (d <= WEAPONS.dark_blade.range + luca.size && player.attack()) {
                    g.combat.checkPlayerAttack(player, [], luca, null);
                }
                if (player.attacking) {
                    player.attackTimer -= 16;
                    if (player.attackTimer <= 0) player.attacking = false;
                }
                if (player.invincible) {
                    player.invincibleTimer -= 16;
                    if (player.invincibleTimer <= 0) player.invincible = false;
                }
                luca.update(16, player, g.sealWorld);
                steps++;
            }
            const phase2 = luca.hp / luca.maxHp <= 0.72;
            const playerHp = player.hp;
            const ratio = luca.hp / luca.maxHp;
            const lucaHp = luca.hp;

            const soakIframe = (ratioHp, ms) => {
                luca.hp = Math.floor(luca.maxHp * ratioHp);
                luca.alive = true;
                luca.projectiles.length = 0;
                luca.windup = null;
                luca.plant = 0;
                luca.plantAfterCharge = false;
                luca.swipe = null;
                luca.charging = false;
                luca.chargeWindup = 0;
                luca.sweep = null;
                luca.lastAttackTime = clock - 5000;
                player.hp = 100000;
                player.invincible = false;
                player.invincibleTimer = 0;
                const open = { isSolid() { return false; } };
                const start = player.hp;
                for (let t = 0; t < ms; t += 16) {
                    clock += 16;
                    luca.x = 400;
                    luca.y = 400;
                    player.x = 480;
                    player.y = 400;
                    if (player.invincible) {
                        player.invincibleTimer -= 16;
                        if (player.invincibleTimer <= 0) player.invincible = false;
                    }
                    luca.update(16, player, open);
                }
                return start - player.hp;
            };
            const sweep = soakIframe(0.40, 4000);
            const frenzy = soakIframe(0.18, 4000);
            Date.now = origNow;
            return { phase2, playerHp, ratio, lucaHp, steps, sweep, frenzy };
        });
        expect(run.phase2).toBe(true);
        expect(run.playerHp).toBeGreaterThan(0);
        expect(run.ratio).toBeLessThanOrEqual(0.72);
        expect(run.sweep).toBeGreaterThan(80);
        expect(run.sweep).toBeLessThan(320);
        expect(run.frenzy).toBeGreaterThan(80);
        expect(run.frenzy).toBeLessThan(360);
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
