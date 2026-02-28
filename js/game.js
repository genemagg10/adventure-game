// ============================================
// Ingoizer's World - Main Game Engine
// ============================================

class Game {
    constructor() {
        this.canvas = document.getElementById("gameCanvas");
        this.ctx = this.canvas.getContext("2d");
        this.minimapCanvas = document.getElementById("minimap");
        this.minimapCtx = this.minimapCanvas.getContext("2d");
        this.worldmapCanvas = document.getElementById("worldmap");
        this.worldmapCtx = this.worldmapCanvas.getContext("2d");

        this.running = false;
        this.paused = false;
        this.lastTime = 0;
        this.time = 0;

        // Input
        this.keys = {
            up: false, down: false, left: false, right: false,
            attack: false, interact: false, map: false,
        };
        this.keyJustPressed = {};

        // Game state
        this.state = "title"; // title, playing, gameover
        this.world = null;
        this.player = null;
        this.monsters = [];
        this.boss = null;
        this.bossSpawned = false;
        this.bossDefeated = false;
        this.combat = null;

        // Camera
        this.camera = { x: 0, y: 0 };

        // Spawn timer
        this.monsterSpawnTimer = 0;

        // Current zone display
        this.currentZone = "";
        this.zoneDisplayTimer = 0;

        // Interaction
        this.nearShop = null;
        this.nearGem = null;
        this.nearLady = false;

        // Lady of the Lake riddle state
        this.riddleIndex = 0;
        this.riddleFailed = false;
        this.riddleCooldown = 0;

        // Monster gem drops (2 from monsters total)
        this.monsterGemDrops = 0;
        this.maxMonsterGemDrops = 2;

        // Sound system
        this.sound = new SoundSystem();

        // Footstep timer
        this.footstepTimer = 0;

        // UI Manager
        this.ui = new UIManager(this);

        // Touch controls (auto-detects mobile)
        this.touchControls = new TouchControls(this);

        this.setupInput();
    }

    setupInput() {
        const keyMap = {
            "ArrowUp": "up", "KeyW": "up",
            "ArrowDown": "down", "KeyS": "down",
            "ArrowLeft": "left", "KeyA": "left",
            "ArrowRight": "right", "KeyD": "right",
            "Space": "attack",
            "KeyE": "interact",
            "KeyM": "map",
            "KeyQ": "element",
            "KeyR": "shoot",
            "KeyI": "inventory",
            "Digit1": "elem1",
            "Digit2": "elem2",
            "Digit3": "elem3",
            "Digit4": "elem4",
            "Escape": "pause",
        };

        window.addEventListener("keydown", (e) => {
            const action = keyMap[e.code];
            if (action) {
                e.preventDefault();
                if (!this.keys[action]) {
                    this.keyJustPressed[action] = true;
                }
                this.keys[action] = true;
            }
        });

        window.addEventListener("keyup", (e) => {
            const action = keyMap[e.code];
            if (action) {
                e.preventDefault();
                this.keys[action] = false;
            }
        });
    }

    startGame() {
        this.state = "playing";
        this.sound.init();
        this.sound.menuSelect();
        this.world = new World();
        this.combat = new CombatSystem();

        // Spawn player in meadow
        const startPos = tileToWorld(10, 15);
        this.player = new Player(startPos.x, startPos.y);

        // Initial monsters
        this.monsters = [];
        this.spawnInitialMonsters();

        // Boss (not yet spawned)
        this.boss = new Boss(this.world.bossSpawnPoint.x, this.world.bossSpawnPoint.y);
        this.bossSpawned = false;
        this.bossDefeated = false;
        this.monsterGemDrops = 0;

        this.ui.showHud();
        this.running = true;

        // Welcome dialog
        this.ui.showDialog("Welcome, Ingoizer! You awaken in the Green Meadow with a rusty sword and bow.");
        this.ui.showDialog("Seek the 5 Blue Gems scattered across the land. Defeat monsters and explore to find them.");
        this.ui.showDialog("Once you have all 5 gems, journey to Ing Castle where a dark foe awaits...");
        if (this.touchControls.active) {
            this.ui.showDialog("Use the joystick to move. ATK to attack, PWR for elemental powers, ACT to interact.");
        } else {
            this.ui.showDialog("Press SPACE to attack, R to shoot arrows. Unlock Fire power to ignite your arrows!");
        }

        this.lastTime = performance.now();
        requestAnimationFrame((t) => this.gameLoop(t));
    }

    restart() {
        this.ui.hideBossHealth();
        this.ui.hideHud();
        this.riddleIndex = 0;
        this.riddleFailed = false;
        this.riddleCooldown = 0;
        this.state = "title";
        document.getElementById("title-screen").classList.remove("hidden");
    }

    spawnInitialMonsters() {
        for (const [type, def] of Object.entries(MONSTER_TYPES)) {
            for (const zoneName of def.zones) {
                const zone = ZONES[zoneName];
                if (!zone) continue;
                const count = randInt(3, MAX_MONSTERS_PER_ZONE);
                for (let i = 0; i < count; i++) {
                    let attempts = 0;
                    while (attempts < 20) {
                        const tx = zone.x + randInt(2, zone.w - 3);
                        const ty = zone.y + randInt(2, zone.h - 3);
                        if (!this.world.isSolid(tx, ty)) {
                            const pos = tileToWorld(tx, ty);
                            this.monsters.push(new Monster(type, pos.x, pos.y));
                            break;
                        }
                        attempts++;
                    }
                }
            }
        }
    }

    spawnMonsters(dt) {
        this.monsterSpawnTimer += dt;
        if (this.monsterSpawnTimer < MONSTER_SPAWN_INTERVAL) return;
        this.monsterSpawnTimer = 0;

        for (const [type, def] of Object.entries(MONSTER_TYPES)) {
            for (const zoneName of def.zones) {
                const zone = ZONES[zoneName];
                if (!zone) continue;

                // Count alive monsters of this type in this zone
                const count = this.monsters.filter(m =>
                    m.alive && m.type === type && getZoneAt(
                        Math.floor(m.x / TILE_SIZE),
                        Math.floor(m.y / TILE_SIZE)
                    ) === zoneName
                ).length;

                if (count >= MAX_MONSTERS_PER_ZONE) continue;
                if (Math.random() > MONSTER_SPAWN_RATE) continue;

                let attempts = 0;
                while (attempts < 10) {
                    const tx = zone.x + randInt(2, zone.w - 3);
                    const ty = zone.y + randInt(2, zone.h - 3);
                    if (!this.world.isSolid(tx, ty)) {
                        const pos = tileToWorld(tx, ty);
                        // Don't spawn near player
                        if (dist(pos.x, pos.y, this.player.x, this.player.y) > 300) {
                            this.monsters.push(new Monster(type, pos.x, pos.y));
                            break;
                        }
                    }
                    attempts++;
                }
            }
        }

        // Cleanup dead monsters
        this.monsters = this.monsters.filter(m => m.alive || m.deathTimer > 0);
    }

    gameLoop(timestamp) {
        if (!this.running) return;

        const dt = Math.min(timestamp - this.lastTime, 50); // Cap delta
        this.lastTime = timestamp;
        this.time = timestamp;

        if (this.state === "playing" && !this.paused) {
            this.update(dt);
        }

        this.render();

        // Clear just-pressed keys
        this.keyJustPressed = {};

        requestAnimationFrame((t) => this.gameLoop(t));
    }

    update(dt) {
        // Apply touch controls input
        this.touchControls.applyInput();

        // Don't update during dialogs, menus
        const inMenu = this.ui.isMapOpen() || this.ui.isShopOpen() || this.ui.isInventoryOpen() || this.ui.dialogActive || this.ui.isRiddleOpen();

        // Handle menu input
        if (this.keyJustPressed.map) {
            if (!this.ui.isShopOpen() && !this.ui.isInventoryOpen()) {
                this.ui.toggleMap();
            }
        }
        if (this.keyJustPressed.inventory) {
            if (!this.ui.isShopOpen() && !this.ui.isMapOpen()) {
                if (this.ui.isInventoryOpen()) {
                    this.ui.closeInventory();
                } else {
                    this.ui.openInventory(this.player);
                }
            }
        }
        if (this.keyJustPressed.interact && this.ui.dialogActive) {
            this.sound.dialogAdvance();
            this.ui.advanceDialog();
            return;
        }
        if (this.keyJustPressed.pause) {
            if (this.ui.isShopOpen()) this.ui.closeShop();
            else if (this.ui.isInventoryOpen()) this.ui.closeInventory();
            else if (this.ui.isMapOpen()) this.ui.toggleMap();
        }

        if (inMenu) return;

        // Element selection
        const elemKeys = ["elem1", "elem2", "elem3", "elem4"];
        const elemNames = ["fire", "water", "ice", "lightning"];
        for (let i = 0; i < 4; i++) {
            if (this.keyJustPressed[elemKeys[i]]) {
                if (this.player.elements[elemNames[i]]) {
                    this.player.activeElement = this.player.activeElement === elemNames[i] ? null : elemNames[i];
                    if (this.player.activeElement) {
                        this.ui.showNotification(`${ELEMENTS[elemNames[i]].name} power active!`);
                    }
                }
            }
        }

        // Update player
        this.player.update(dt, this.keys, this.world);

        // Player attack
        if (this.keyJustPressed.attack) {
            if (this.player.attack()) {
                this.sound.swordSlash();
            }
        }

        // Shoot arrow (R key)
        if (this.keyJustPressed.shoot) {
            const arrowData = this.player.shootArrow();
            if (arrowData) {
                this.combat.addArrow(arrowData);
                if (arrowData.isFireArrow) {
                    this.ui.showNotification("Fire arrow!");
                }
            } else if (this.player.arrows <= 0) {
                this.ui.showNotification("No arrows!");
            }
        }

        // Use element
        if (this.keyJustPressed.element) {
            const elemUsed = this.player.useElement();
            if (elemUsed) {
                // Play element sound
                switch (elemUsed) {
                    case "fire": this.sound.fireBlast(); break;
                    case "water": this.sound.waterSplash(); break;
                    case "ice": this.sound.iceFreeze(); break;
                    case "lightning": this.sound.lightningStrike(); break;
                }
                const results = this.combat.useElement(this.player, elemUsed, this.monsters, this.boss);
                for (const r of results) {
                    if (r.killed) {
                        this.onEntityKilled(r.target, r.isBoss);
                    }
                }
            }
        }

        // Interaction check
        if (this.keyJustPressed.interact) {
            this.handleInteraction();
        }

        // Update monsters
        for (const monster of this.monsters) {
            const result = monster.update(dt, this.player, this.world);
            if (result && result.type === "playerHit") {
                this.combat.addDamageNumber(this.player.x, this.player.y, result.damage, false);
                this.sound.playerHurt();
                this.sound.monsterAttack();
            }
        }

        // Update boss
        if (this.boss && this.boss.spawned) {
            const prevCharging = this.boss.charging;
            const prevSpinning = this.boss.spinning;
            const prevProjCount = this.boss.projectiles.length;
            this.boss.update(dt, this.player, this.world);
            if (this.boss.alive) {
                this.ui.showBossHealth(this.boss);
                // Boss attack sounds
                if (!prevCharging && this.boss.charging) this.sound.bossCharge();
                if (!prevSpinning && this.boss.spinning) this.sound.bossSpin();
                if (this.boss.projectiles.length > prevProjCount) this.sound.bossProjectile();
            }
        }

        // Update arrow projectiles
        const arrowHits = this.combat.updateArrows(dt, this.monsters, this.boss);
        for (const hit of arrowHits) {
            if (hit.killed) {
                this.onEntityKilled(hit.target, hit.isBoss);
            }
        }

        // Combat attack hits (continued swings)
        if (this.player.attacking) {
            const hits = this.combat.checkPlayerAttack(this.player, this.monsters, this.boss);
            for (const hit of hits) {
                if (hit.crit) {
                    this.sound.criticalHit();
                } else {
                    this.sound.swordHit();
                }
                if (hit.killed) {
                    this.onEntityKilled(hit.target, hit.isBoss);
                }
            }
        }

        // Footstep sounds
        if (this.keys.up || this.keys.down || this.keys.left || this.keys.right) {
            this.footstepTimer += dt;
            if (this.footstepTimer > 280) {
                this.sound.footstep();
                this.footstepTimer = 0;
            }
        } else {
            this.footstepTimer = 200; // ready to play on next move
        }

        // Riddle cooldown
        if (this.riddleCooldown > 0) {
            this.riddleCooldown -= dt;
        }

        // Check proximity for interactions
        this.checkProximity();

        // Spawn monsters
        this.spawnMonsters(dt);

        // Update combat effects
        this.combat.update(dt);

        // Update camera
        this.updateCamera();

        // Check zone change
        this.checkZone();

        // Check player death
        if (this.player.hp <= 0) {
            this.state = "gameover";
            this.sound.playerDeath();
            this.ui.showGameOver(false, "Ingoizer has fallen in battle... The realm is lost.");
            this.ui.hideBossHealth();
        }

        // Check if boss trigger (all 5 gems)
        if (this.player.blueGems >= 5 && !this.bossSpawned && !this.bossDefeated) {
            this.checkBossTrigger();
        }

        // Update HUD
        this.ui.updateHud(this.player);
    }

    onEntityKilled(entity, isBoss) {
        if (isBoss) {
            this.bossDefeated = true;
            this.ui.hideBossHealth();
            this.sound.bossDefeat();
            setTimeout(() => {
                this.state = "gameover";
                this.sound.victoryFanfare();
                this.ui.showGameOver(true,
                    "The Black Knight has been vanquished! Ingoizer stands victorious. " +
                    "The realm is saved and peace returns to the land. " +
                    `Monsters defeated: ${this.player.monstersKilled}`
                );
            }, 3000);
            return;
        }

        this.sound.monsterDeath();
        this.player.monstersKilled++;
        const drops = entity.getDrops();

        // Arrow drops (1-3 arrows per kill)
        const arrowDrop = randInt(1, 3);
        this.player.arrows += arrowDrop;

        // Gold
        this.player.gold += drops.gold;
        this.sound.goldCollect();
        this.ui.showNotification(`+${drops.gold} gold`);
        this.ui.showNotification(`+${drops.gold} gold  +${arrowDrop} arrows`);

        // Weapon drop
        if (drops.weapon) {
            if (this.player.addWeapon(drops.weapon)) {
                const w = WEAPONS[drops.weapon];
                this.sound.weaponPickup();
                this.ui.showNotification(`Found ${w.name}!`);
                this.ui.showDialog(`You picked up a ${w.name}! ${w.description}. Open inventory (I) to equip it.`);
            }
        }

        // Gem drop
        if (drops.gem && this.monsterGemDrops < this.maxMonsterGemDrops && this.player.blueGems < 5) {
            this.monsterGemDrops++;
            const elem = this.player.collectGem();
            this.sound.gemCollect();
            this.ui.showNotification(`Blue Gem found! (${this.player.blueGems}/5)`);
            if (elem) {
                this.ui.showDialog(`The Blue Gem resonates with ${ELEMENTS[elem].name} energy! You gained the power of ${ELEMENTS[elem].name}! Press ${this.player.nextElementIndex} to select it, Q to use.`);
            }
            if (this.player.blueGems >= 5) {
                this.ui.showDialog("You have all 5 Blue Gems! Journey to Ing Castle - a dark presence awaits outside its gates...");
            }
        }
    }

    checkProximity() {
        // Check nearby shop
        this.nearShop = null;
        for (const shop of this.world.shops) {
            if (dist(this.player.x, this.player.y, shop.worldX, shop.worldY) < 50) {
                this.nearShop = shop;
                break;
            }
        }

        // Check nearby gems
        this.nearGem = null;
        for (const gem of this.world.gems) {
            if (gem.collected) continue;
            if (dist(this.player.x, this.player.y, gem.x, gem.y) < 30) {
                this.nearGem = gem;
                break;
            }
        }

        // Auto-collect gem on contact
        if (this.nearGem) {
            this.collectWorldGem(this.nearGem);
        }

        // Check Lady of the Lake
        this.nearLady = false;
        const lady = this.world.ladyOfLake;
        if (lady && !lady.excaliburGiven) {
            if (dist(this.player.x, this.player.y, lady.x, lady.y) < LADY_OF_LAKE.interactRange) {
                this.nearLady = true;
            }
        }
    }

    collectWorldGem(gem) {
        gem.collected = true;
        const elem = this.player.collectGem();
        this.sound.gemCollect();
        this.ui.showNotification(`Blue Gem found! (${this.player.blueGems}/5)`);
        if (elem) {
            this.ui.showDialog(`The Blue Gem pulses with ${ELEMENTS[elem].name} energy! You gained the power of ${ELEMENTS[elem].name}! Press ${this.player.nextElementIndex} to select it, Q to use.`);
        }
        if (this.player.blueGems >= 5) {
            this.ui.showDialog("You have all 5 Blue Gems! Journey to Ing Castle - a dark presence awaits outside its gates...");
        }
    }

    handleInteraction() {
        // Shop interaction
        if (this.nearShop) {
            this.sound.menuSelect();
            this.ui.openShop(this.nearShop, this.player);
            return;
        }

        // Lady of the Lake interaction
        if (this.nearLady && this.riddleCooldown <= 0) {
            this.startLadyRiddle();
        }
    }

    startLadyRiddle() {
        const riddles = LADY_OF_LAKE.riddles;
        // Pick a random riddle the player hasn't answered correctly yet
        const riddle = riddles[this.riddleIndex % riddles.length];

        this.ui.showDialog("\"I am the Lady of the Lake. I hold Excalibur, the mightiest blade ever forged.\"", () => {
            this.ui.showDialog("\"Answer my riddle, brave Ingoizer, and the sword shall be yours.\"", () => {
                this.ui.openRiddle(
                    riddle,
                    // On correct
                    () => {
                        this.sound.riddleCorrect();
                        this.world.ladyOfLake.excaliburGiven = true;
                        this.player.addWeapon("excalibur");
                        this.player.equipWeapon("excalibur");
                        this.sound.excaliburReveal();
                        this.ui.showDialog("\"You have proven your wisdom, Ingoizer. Take Excalibur - the legendary sword of kings!\"");
                        this.ui.showDialog("Excalibur has been added to your inventory and equipped! Its golden blade gleams with power.");
                        this.ui.showNotification("Excalibur obtained!");
                    },
                    // On wrong
                    () => {
                        this.sound.riddleWrong();
                        this.riddleIndex++;
                        this.riddleCooldown = 3000;
                    }
                );
            });
        });
    }

    checkBossTrigger() {
        // Boss spawns when player approaches castle with all gems
        const bossPoint = this.world.bossSpawnPoint;
        if (dist(this.player.x, this.player.y, bossPoint.x, bossPoint.y) < 200) {
            this.bossSpawned = true;
            this.boss.spawn();
            this.sound.bossRoar();

            this.ui.showDialog("A dark figure emerges from the shadows of Ing Castle...");
            this.ui.showDialog("\"I am The Black Knight! Those gems belong to me, Ingoizer. Prepare to die!\"");
            this.ui.showDialog("The battle for the realm begins! Defeat The Black Knight!");
        }
    }

    checkZone() {
        const tile = worldToTile(this.player.x, this.player.y);
        const zone = getZoneAt(tile.x, tile.y);
        if (zone !== this.currentZone) {
            this.currentZone = zone;
            if (zone !== "wilderness" && ZONES[zone]) {
                this.zoneDisplayTimer = 3000;
            }
        }
        if (this.zoneDisplayTimer > 0) {
            this.zoneDisplayTimer -= 16;
        }
    }

    updateCamera() {
        // Smooth camera follow
        const targetX = this.player.x - CANVAS_W / 2;
        const targetY = this.player.y - CANVAS_H / 2;
        this.camera.x = lerp(this.camera.x, targetX, 0.1);
        this.camera.y = lerp(this.camera.y, targetY, 0.1);

        // Clamp camera
        this.camera.x = clamp(this.camera.x, 0, WORLD_W * TILE_SIZE - CANVAS_W);
        this.camera.y = clamp(this.camera.y, 0, WORLD_H * TILE_SIZE - CANVAS_H);
    }

    render() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

        if (this.state !== "playing" && this.state !== "gameover") return;

        // Render world
        this.world.render(ctx, this.camera, this.time);

        // Render monsters (sorted by Y for depth)
        const renderables = [];
        for (const m of this.monsters) {
            if (m.alive || m.deathTimer > 0) {
                renderables.push({ y: m.y, render: () => m.render(ctx, this.camera, this.time) });
            }
        }

        // Player
        renderables.push({ y: this.player.y, render: () => this.player.render(ctx, this.camera, this.time) });

        // Boss
        if (this.boss && this.boss.spawned) {
            renderables.push({ y: this.boss.y, render: () => this.boss.render(ctx, this.camera, this.time) });
        }

        // Sort by Y and render
        renderables.sort((a, b) => a.y - b.y);
        for (const r of renderables) {
            r.render();
        }

        // Render combat effects (on top)
        this.combat.render(ctx, this.camera, this.time);

        // Zone display
        if (this.zoneDisplayTimer > 0 && ZONES[this.currentZone]) {
            const alpha = Math.min(1, this.zoneDisplayTimer / 500);
            ctx.save();
            ctx.globalAlpha = alpha;
            this.ui.showZoneName(ctx, ZONES[this.currentZone].name);
            ctx.restore();
        }

        // Mana bar
        this.ui.renderManaBar(ctx, this.player);

        // Interaction prompts
        const isMobile = this.touchControls.active;
        if (this.nearShop) {
            this.ui.renderInteractionPrompt(ctx, isMobile ? "Tap ACT to enter shop" : "Press E to enter shop");
        } else if (this.nearLady) {
            this.ui.renderInteractionPrompt(ctx, isMobile ? "Tap ACT to speak with the Lady" : "Press E to speak with the Lady of the Lake");
        }

        // Render minimap
        this.world.renderMinimap(this.minimapCtx, this.player, this.monsters, this.boss);

        // Render world map if open
        if (this.ui.isMapOpen()) {
            this.world.renderWorldMap(this.worldmapCtx, this.player);
            // Update hint for touch mode
            const mapHint = document.querySelector(".map-hint");
            if (mapHint) {
                mapHint.textContent = isMobile ? "Tap MAP to close" : "Press M to close";
            }
        }

        // Boss approaching warning
        if (this.player.blueGems >= 5 && !this.bossSpawned && !this.bossDefeated) {
            const bossPoint = this.world.bossSpawnPoint;
            const d = dist(this.player.x, this.player.y, bossPoint.x, bossPoint.y);
            if (d < 400 && d > 200) {
                ctx.save();
                ctx.fillStyle = `rgba(255, 0, 0, ${0.3 + Math.sin(this.time * 0.005) * 0.15})`;
                ctx.font = "bold 18px monospace";
                ctx.textAlign = "center";
                ctx.fillText("You sense a dark presence ahead...", CANVAS_W / 2, 80);
                ctx.restore();
            }
        }
    }
}

// Initialize game when page loads
window.addEventListener("load", () => {
    const game = new Game();
});
