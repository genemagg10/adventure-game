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

        // Green Knight
        this.greenKnight = null;
        this.greenKnightSpawned = false;
        this.greenKnightDefeated = false;
        this.greenlandsUnlocked = false;

        // Cave system - 4 separate caves
        this.inCave = false;
        this.activeCaveId = null;
        this.caveWorlds = {};       // id -> CaveWorld
        this.caveMonsters = [];
        this.caveBoss = null;
        this.caveBossSpawned = {};  // id -> bool
        this.caveBossDefeated = {}; // id -> bool
        this.caveTreasureCollected = {}; // id -> bool
        this.caveMonsterSpawnTimer = 0;
        this.nearCaveEntrance = null;
        this.nearCaveExit = null;
        this.savedSurfacePos = null;

        // The Cloudlands (sky realm above the world)
        this.inSky = false;
        this.skyWorld = null;
        this.skyMonsters = [];
        this.skyMonsterSpawnTimer = 0;
        this.skyMonsterKills = 0;
        this.olympianBoss = null;
        this.olympianSummoned = false;
        this.olympianSpawned = false;
        this.olympianDefeated = false;
        this.nearSkyLadder = false;
        this.nearSkyExit = false;
        this.skyTreeHintCooldown = 0;

        // Fountain of Youth
        this.nearFountain = false;
        this.fountainCooldownUntil = 0;
        this.fountainRiddleState = null; // { riddles, currentIndex, onComplete }

        // Animal companions
        this.wildAnimals = [];      // untamed critters roaming the surface
        this.companions = [];       // tamed animals following the player
        this.animalSpawnTimer = 0;
        this.nearAnimal = null;
        this.firstTameShown = false;

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
        this.nearMerlin = false;
        this.nearMerlinHut = false;

        // Lady of the Lake quest state
        this.ladyQuestState = "none"; // none, given, sheath_acquired, complete

        // Merlin quest state
        this.merlinQuestState = "none"; // none, given, wand_acquired, complete

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

    // True only when the player is walking the overworld - not underground,
    // not up in the Cloudlands.
    get onSurface() {
        return !this.inCave && !this.inSky;
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
            "KeyT": "potion",
            "Digit1": "elem1",
            "Digit2": "elem2",
            "Digit3": "elem3",
            "Digit4": "elem4",
            "Digit5": "elem5",
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

        // Wild animals roaming the biomes
        this.wildAnimals = [];
        this.companions = [];
        this.animalSpawnTimer = 0;
        this.nearAnimal = null;
        this.firstTameShown = false;
        this.spawnInitialAnimals();

        // Boss (not yet spawned)
        this.boss = new Boss(this.world.bossSpawnPoint.x, this.world.bossSpawnPoint.y);
        this.bossSpawned = false;
        this.bossDefeated = false;
        this.monsterGemDrops = 0;

        // Sheath Guardian Troll
        this.sheathTroll = null;
        this.ladyQuestState = "none";
        this.merlinQuestState = "none";
        this.spawnSheathTroll();

        // Green Knight
        this.greenKnight = null;
        this.greenKnightSpawned = false;
        this.greenKnightDefeated = false;
        this.greenlandsUnlocked = false;

        // Cave system - 4 separate caves
        this.inCave = false;
        this.activeCaveId = null;
        this.caveWorlds = {};
        for (const entrance of CAVE_ENTRANCES) {
            this.caveWorlds[entrance.id] = new CaveWorld(entrance.id);
        }
        this.caveMonsters = [];
        this.caveBoss = null;
        this.caveBossSpawned = {};
        this.caveBossDefeated = {};
        this.caveTreasureCollected = {};
        this.caveMonsterSpawnTimer = 0;
        this.nearCaveEntrance = null;
        this.nearCaveExit = null;
        this.savedSurfacePos = null;

        // The Cloudlands
        this.inSky = false;
        this.skyWorld = new SkyWorld();
        this.skyMonsters = [];
        this.skyMonsterSpawnTimer = 0;
        this.skyMonsterKills = 0;
        this.olympianBoss = null;
        this.olympianSummoned = false;
        this.olympianSpawned = false;
        this.olympianDefeated = false;
        this.nearSkyLadder = false;
        this.nearSkyExit = false;
        this.skyTreeHintCooldown = 0;

        // Fountain of Youth
        this.nearFountain = false;
        this.fountainCooldownUntil = 0;
        this.fountainRiddleState = null;

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
        this.ui.showDialog("Harmless animals roam the land. Feed one an apple to tame it and it will fight at your side - up to 5 at a time. You start with 2 apples; find more in the wild or buy them at any shop.");

        this.lastTime = performance.now();
        requestAnimationFrame((t) => this.gameLoop(t));
    }

    restart() {
        this.running = false;
        this.ui.hideBossHealth();
        this.ui.hideHud();
        this.ladyQuestState = "none";
        this.merlinQuestState = "none";
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

        // Spawn green monsters if greenlands unlocked
        if (this.greenlandsUnlocked) {
            for (const [type, def] of Object.entries(GREEN_MONSTER_TYPES)) {
                const zone = ZONES.greenlands;
                if (!zone) continue;
                const count = this.monsters.filter(m =>
                    m.alive && m.type === type && getZoneAt(
                        Math.floor(m.x / TILE_SIZE),
                        Math.floor(m.y / TILE_SIZE)
                    ) === "greenlands"
                ).length;
                if (count >= MAX_MONSTERS_PER_ZONE) continue;
                if (Math.random() > MONSTER_SPAWN_RATE) continue;
                let attempts = 0;
                while (attempts < 10) {
                    const tx = zone.x + randInt(2, zone.w - 3);
                    const ty = zone.y + randInt(2, zone.h - 3);
                    if (!this.world.isSolid(tx, ty)) {
                        const pos = tileToWorld(tx, ty);
                        if (dist(pos.x, pos.y, this.player.x, this.player.y) > 300) {
                            const m = new Monster("goblin", pos.x, pos.y);
                            m.type = type;
                            m.name = def.name;
                            m.hp = def.hp;
                            m.maxHp = def.hp;
                            m.damage = def.damage;
                            m.speed = def.speed;
                            m.xp = def.xp;
                            m.goldDrop = def.goldDrop;
                            m.color = def.color;
                            m.size = def.size;
                            m.weaponDrop = def.weaponDrop;
                            m.gemDrop = def.gemDrop;
                            this.monsters.push(m);
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

    // Find a walkable spot for a wild animal inside (or just outside) a biome.
    // The margin lets lake turtles settle on the shore, since open water is solid.
    findAnimalSpawnPos(zoneName, margin) {
        const zone = ZONES[zoneName];
        if (!zone) return null;
        const m = margin || 0;
        const x0 = Math.max(1, zone.x + 2 - m);
        const x1 = Math.min(WORLD_W - 2, zone.x + zone.w - 3 + m);
        const y0 = Math.max(1, zone.y + 2 - m);
        const y1 = Math.min(WORLD_H - 2, zone.y + zone.h - 3 + m);
        if (x1 <= x0 || y1 <= y0) return null;

        for (let attempt = 0; attempt < 60; attempt++) {
            const tx = randInt(x0, x1);
            const ty = randInt(y0, y1);
            if (this.world.isSolid(tx, ty)) continue;
            const pos = tileToWorld(tx, ty);
            // Keep clear of the Lady of the Lake so taming never steals her dialog
            if (this.world.ladyOfLake && dist(pos.x, pos.y, this.world.ladyOfLake.x, this.world.ladyOfLake.y) < 140) continue;
            return pos;
        }
        return null;
    }

    spawnInitialAnimals() {
        for (const [type, def] of Object.entries(ANIMAL_TYPES)) {
            for (const zoneName of def.zones) {
                for (let i = 0; i < ANIMAL_CONFIG.perZone; i++) {
                    const margin = zoneName === "lake" ? 3 : 0;
                    const pos = this.findAnimalSpawnPos(zoneName, margin);
                    if (!pos) continue;
                    const animal = new Animal(type, pos.x, pos.y);
                    animal.homeZone = zoneName;
                    this.wildAnimals.push(animal);
                }
            }
        }
    }

    spawnWildAnimals(dt) {
        this.animalSpawnTimer += dt;
        if (this.animalSpawnTimer < ANIMAL_CONFIG.spawnInterval) return;
        this.animalSpawnTimer = 0;

        for (const [type, def] of Object.entries(ANIMAL_TYPES)) {
            for (const zoneName of def.zones) {
                const count = this.wildAnimals.filter(a => a.alive && a.type === type && a.homeZone === zoneName).length;
                if (count >= ANIMAL_CONFIG.maxPerZone) continue;
                if (Math.random() > ANIMAL_CONFIG.spawnChance) continue;

                const margin = zoneName === "lake" ? 3 : 0;
                const pos = this.findAnimalSpawnPos(zoneName, margin);
                if (!pos) continue;
                // Don't pop into existence in front of the player
                if (dist(pos.x, pos.y, this.player.x, this.player.y) < 250) continue;

                const animal = new Animal(type, pos.x, pos.y);
                animal.homeZone = zoneName;
                this.wildAnimals.push(animal);
            }
        }
    }

    // Everything a companion is willing to bite, in the world the player is in.
    getHostiles(activeMonsters, activeBoss, activeGreenKnight) {
        const hostiles = [];
        for (const m of activeMonsters) {
            if (m.alive) hostiles.push(m);
        }
        if (activeBoss && activeBoss.alive && activeBoss.spawned) hostiles.push(activeBoss);
        if (activeGreenKnight && activeGreenKnight.alive && activeGreenKnight.spawned) hostiles.push(activeGreenKnight);
        return hostiles;
    }

    updateAnimals(dt, activeWorld, activeMonsters, activeBoss, activeGreenKnight) {
        const hostiles = this.getHostiles(activeMonsters, activeBoss, activeGreenKnight);

        // Companions fight alongside the player, in caves as well as on the surface
        for (const companion of this.companions) {
            const hits = companion.update(dt, this.player, activeWorld, hostiles, this.combat);
            for (const hit of hits) {
                this.sound.monsterHit();
                if (hit.killed) {
                    this.onEntityKilled(hit.target, hit.isBoss);
                }
            }
            if (!companion.alive && !companion.deathAnnounced) {
                companion.deathAnnounced = true;
                this.sound.monsterDeath();
                this.ui.showNotification(`${companion.icon} Your ${companion.name} has fallen!`);
            }
        }
        this.companions = this.companions.filter(c => c.alive || c.deathTimer > 0);

        // Keep follow slots contiguous so the pack doesn't leave gaps in formation
        let slot = 0;
        for (const c of this.companions) {
            if (c.alive) c.followIndex = slot++;
        }

        // Wild animals only roam the surface
        if (this.inCave) return;
        for (const animal of this.wildAnimals) {
            animal.update(dt, this.player, activeWorld, [], this.combat);
        }
        this.wildAnimals = this.wildAnimals.filter(a => a.alive);
        this.spawnWildAnimals(dt);
    }

    aliveCompanionCount() {
        return this.companions.filter(c => c.alive).length;
    }

    // Bring the pack to the player after a teleport (cave transition, respawn)
    gatherCompanions() {
        let i = 0;
        for (const companion of this.companions) {
            if (!companion.alive) continue;
            const angle = (i / ANIMAL_CONFIG.maxCompanions) * Math.PI * 2;
            companion.x = this.player.x + Math.cos(angle) * 26;
            companion.y = this.player.y + Math.sin(angle) * 26;
            companion.target = null;
            companion.knockbackVx = 0;
            companion.knockbackVy = 0;
            i++;
        }
    }

    tameNearbyAnimal() {
        const animal = this.nearAnimal;
        if (!animal || !animal.alive || animal.tamed) return false;

        if (this.aliveCompanionCount() >= ANIMAL_CONFIG.maxCompanions) {
            this.ui.showNotification(`Your pack is full! (${ANIMAL_CONFIG.maxCompanions}/${ANIMAL_CONFIG.maxCompanions})`);
            return true;
        }
        if (this.player.apples < ANIMAL_CONFIG.applesToTame) {
            this.ui.showNotification("You need an apple to tame an animal!");
            return true;
        }

        this.player.apples -= ANIMAL_CONFIG.applesToTame;
        animal.tame(this.aliveCompanionCount());
        this.wildAnimals = this.wildAnimals.filter(a => a !== animal);
        this.companions.push(animal);
        this.nearAnimal = null;

        this.sound.animalTame();
        this.ui.showNotification(`${animal.icon} ${animal.name} joins you! (${this.aliveCompanionCount()}/${ANIMAL_CONFIG.maxCompanions})`);

        if (!this.firstTameShown) {
            this.firstTameShown = true;
            this.ui.showDialog(`The ${animal.name} takes the apple and trots to your side. ${animal.flavor}.`, () => {
                this.ui.showDialog(`It will follow you and fight what threatens you until it falls. You can keep ${ANIMAL_CONFIG.maxCompanions} companions at once.`);
            });
        }
        return true;
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
        const inMenu = this.ui.isMapOpen() || this.ui.isShopOpen() || this.ui.isInventoryOpen() || this.ui.dialogActive || this.ui.isRiddleOpen() || this.ui.isEnchantOpen() || this.ui.isLoreOpen();

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
            else if (this.ui.isEnchantOpen()) this.ui.closeEnchant();
            else if (this.ui.isLoreOpen()) this.ui.closeLore();
        }

        if (inMenu) return;

        // Element selection
        const elemKeys = ["elem1", "elem2", "elem3", "elem4", "elem5"];
        const elemNames = ["fire", "water", "ice", "lightning", "earth"];
        for (let i = 0; i < 5; i++) {
            if (this.keyJustPressed[elemKeys[i]]) {
                if (this.player.elements[elemNames[i]]) {
                    this.player.activeElement = this.player.activeElement === elemNames[i] ? null : elemNames[i];
                    if (this.player.activeElement) {
                        this.ui.showNotification(`${ELEMENTS[elemNames[i]].name} power active!`);
                    }
                }
            }
        }

        // Active world/monsters/boss references based on which realm we're in
        const activeCave = this.inCave ? this.caveWorlds[this.activeCaveId] : null;
        const activeWorld = activeCave || (this.inSky ? this.skyWorld : this.world);
        const activeMonsters = this.inCave ? this.caveMonsters : (this.inSky ? this.skyMonsters : this.monsters);
        const activeBoss = this.inCave ? this.caveBoss : (this.inSky ? this.olympianBoss : this.boss);
        const activeGreenKnight = this.onSurface ? this.greenKnight : null;

        // Update player (use correct world for collision)
        this.player.update(dt, this.keys, activeWorld);

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
                    case "earth": this.sound.earthQuake(); break;
                }
                const results = this.combat.useElement(this.player, elemUsed, activeMonsters, activeBoss, activeGreenKnight);
                for (const r of results) {
                    if (r.killed) {
                        this.onEntityKilled(r.target, r.isBoss);
                    }
                }
                // Check if element clears cave obstacle tiles near player
                if (this.onSurface) {
                    for (const entrance of this.world.caveEntrances) {
                        if (dist(this.player.x, this.player.y, entrance.worldX, entrance.worldY) < 150) {
                            const ce = CAVE_ENTRANCES.find(e => e.id === entrance.id);
                            if (ce && ce.element === elemUsed) {
                                this.clearCaveObstacle(entrance.id);
                            }
                        }
                    }
                }

                // Ice Gem reveals the hidden ladder in the castle's NW corner
                if (this.onSurface && elemUsed === "ice") {
                    this.tryRevealHiddenLadder();
                }

                // A point-blank Fire blast will also set the Worldtree alight
                if (this.onSurface && elemUsed === "fire") {
                    this.tryIgniteSkyTree(90);
                }
            }
        }

        // Use health potion (T key or touch button)
        if (this.keyJustPressed.potion) {
            const result = this.player.useHealthPotion();
            if (result) {
                this.sound.goldCollect();
                this.ui.showNotification(`Used ${result.type === "greater" ? "Greater " : ""}Health Potion! +${result.healed} HP`);
            } else if (this.player.healthPotions + this.player.greaterHealthPotions === 0) {
                this.ui.showNotification("No health potions!");
            } else {
                this.ui.showNotification("Health is full!");
            }
        }

        // Interaction check
        if (this.keyJustPressed.interact) {
            this.handleInteraction();
        }

        // Update monsters (surface or cave)
        for (const monster of activeMonsters) {
            const result = monster.update(dt, this.player, activeWorld);
            if (result && result.type === "playerHit") {
                this.combat.addDamageNumber(this.player.x, this.player.y, result.damage, false);
                this.sound.playerHurt();
                this.sound.monsterAttack();
                // Armor enchantment defensive effect
                if (this.player.lastHitArmorEnchant) {
                    this.combat.spawnArmorDefenseEffect(
                        this.player.lastHitArmorEnchant, this.player,
                        this.player.lastHitFromX, this.player.lastHitFromY
                    );
                    this.player.lastHitArmorEnchant = null;
                }
            }
        }

        // Update cave boss
        if (this.inCave && this.caveBoss && this.caveBoss.spawned) {
            const prevCharging = this.caveBoss.charging;
            const prevSpinning = this.caveBoss.spinning;
            const prevProjCount = this.caveBoss.projectiles.length;
            const prevPlayerHp = this.player.hp;
            this.caveBoss.update(dt, this.player, activeCave);
            if (this.caveBoss.alive) {
                this.ui.showBossHealth(this.caveBoss, this.caveBoss.name || "Cave Boss");
                if (!prevCharging && this.caveBoss.charging) this.sound.bossCharge();
                if (!prevSpinning && this.caveBoss.spinning) this.sound.bossSpin();
                if (this.caveBoss.projectiles.length > prevProjCount) this.sound.bossProjectile();
                if (this.player.hp < prevPlayerHp && this.player.lastHitArmorEnchant) {
                    this.combat.spawnArmorDefenseEffect(
                        this.player.lastHitArmorEnchant, this.player,
                        this.player.lastHitFromX, this.player.lastHitFromY
                    );
                    this.player.lastHitArmorEnchant = null;
                }
            }
        }

        // Update the Olympian (Cloudlands only)
        if (this.inSky && this.olympianBoss && this.olympianBoss.spawned) {
            const ob = this.olympianBoss;
            const prevCharging = ob.charging;
            const prevProjCount = ob.projectiles.length;
            const prevPlayerHp = this.player.hp;
            ob.update(dt, this.player, this.skyWorld);
            this.drainOlympianEvents(ob);
            if (ob.alive) {
                this.ui.showBossHealth(ob, ob.displayName);
                if (!prevCharging && ob.charging) this.sound.bossCharge();
                if (ob.projectiles.length > prevProjCount) this.sound.bossProjectile();
                if (this.player.hp < prevPlayerHp && this.player.lastHitArmorEnchant) {
                    this.combat.spawnArmorDefenseEffect(
                        this.player.lastHitArmorEnchant, this.player,
                        this.player.lastHitFromX, this.player.lastHitFromY
                    );
                    this.player.lastHitArmorEnchant = null;
                }
            }
        }

        // Update boss (surface only)
        if (this.onSurface && this.boss && this.boss.spawned) {
            const prevCharging = this.boss.charging;
            const prevSpinning = this.boss.spinning;
            const prevProjCount = this.boss.projectiles.length;
            const prevPlayerHp = this.player.hp;
            this.boss.update(dt, this.player, this.world);
            if (this.boss.alive) {
                this.ui.showBossHealth(this.boss, "The Black Knight");
                // Boss attack sounds
                if (!prevCharging && this.boss.charging) this.sound.bossCharge();
                if (!prevSpinning && this.boss.spinning) this.sound.bossSpin();
                if (this.boss.projectiles.length > prevProjCount) this.sound.bossProjectile();
                // Armor enchantment defensive effect on boss hit
                if (this.player.hp < prevPlayerHp && this.player.lastHitArmorEnchant) {
                    this.combat.spawnArmorDefenseEffect(
                        this.player.lastHitArmorEnchant, this.player,
                        this.player.lastHitFromX, this.player.lastHitFromY
                    );
                    this.player.lastHitArmorEnchant = null;
                }
            }
        }

        // Update Green Knight (surface only)
        if (this.onSurface && this.greenKnight && this.greenKnight.spawned) {
            const prevCharging = this.greenKnight.charging;
            const prevSpinning = this.greenKnight.spinning;
            const prevProjCount = this.greenKnight.projectiles.length;
            const prevPlayerHp = this.player.hp;
            this.greenKnight.update(dt, this.player, this.world);
            if (this.greenKnight.alive) {
                this.ui.showBossHealth(this.greenKnight, "The Green Knight");
                if (!prevCharging && this.greenKnight.charging) this.sound.bossCharge();
                if (!prevSpinning && this.greenKnight.spinning) this.sound.bossSpin();
                if (this.greenKnight.projectiles.length > prevProjCount) this.sound.bossProjectile();
                if (this.player.hp < prevPlayerHp && this.player.lastHitArmorEnchant) {
                    this.combat.spawnArmorDefenseEffect(
                        this.player.lastHitArmorEnchant, this.player,
                        this.player.lastHitFromX, this.player.lastHitFromY
                    );
                    this.player.lastHitArmorEnchant = null;
                }
            }
        }

        // Update wild animals and companions
        this.updateAnimals(dt, activeWorld, activeMonsters, activeBoss, activeGreenKnight);

        // Update arrow projectiles
        const arrowHits = this.combat.updateArrows(dt, activeMonsters, activeBoss, activeWorld, activeGreenKnight);
        for (const hit of arrowHits) {
            if (hit.killed) {
                this.onEntityKilled(hit.target, hit.isBoss);
            }
        }

        // Combat attack hits (continued swings)
        if (this.player.attacking) {
            const hits = this.combat.checkPlayerAttack(this.player, activeMonsters, activeBoss, activeGreenKnight);
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

        // Update burning trees (damage nearby monsters/boss) - surface only
        if (this.onSurface) this.updateBurningTrees(dt);

        // Eternal flame damage (SE cave entrance obstacle)
        if (this.onSurface) {
            const seCave = this.world.caveEntrances.find(e => e.id === 1);
            if (seCave && !seCave.cleared) {
                const playerTile = worldToTile(this.player.x, this.player.y);
                if (playerTile.x >= seCave.x - 3 && playerTile.x <= seCave.x + 3 &&
                    playerTile.y >= seCave.y - 3 && playerTile.y <= seCave.y + 3 &&
                    this.world.tiles[playerTile.y] && this.world.tiles[playerTile.y][playerTile.x] === TILE.LAVA) {
                    if (this.player.takeDamage(ETERNAL_FLAME_DAMAGE, this.player.x, this.player.y)) {
                        // Knockback away from entrance
                        const norm = normalize(this.player.x - seCave.worldX, this.player.y - seCave.worldY);
                        this.player.knockbackVx = norm.x * ETERNAL_FLAME_KNOCKBACK;
                        this.player.knockbackVy = norm.y * ETERNAL_FLAME_KNOCKBACK;
                        this.ui.showNotification("The eternal flame burns you!");
                    }
                }
            }
        }

        // Check proximity for interactions
        this.checkCaveProximity();
        this.checkSkyProximity();
        if (this.onSurface) {
            this.checkProximity();
        }

        // Spawn monsters
        if (this.inCave) {
            this.spawnCaveMonsters(dt);
        } else if (this.inSky) {
            this.spawnSkyMonsters(dt);
        } else {
            this.spawnMonsters(dt);
        }

        // Respawn coins (surface only)
        if (this.onSurface) for (const coin of this.world.coins) {
            if (coin.collected && coin.respawnTimer > 0) {
                coin.respawnTimer -= dt;
                if (coin.respawnTimer <= 0) {
                    coin.collected = false;
                    coin.respawnTimer = 0;
                }
            }
        }

        // Respawn apples (surface only)
        if (!this.inCave) for (const apple of this.world.apples) {
            if (apple.collected && apple.respawnTimer > 0) {
                apple.respawnTimer -= dt;
                if (apple.respawnTimer <= 0) {
                    apple.collected = false;
                    apple.respawnTimer = 0;
                }
            }
        }

        // Update combat effects
        this.combat.update(dt);

        // Update camera
        this.updateCamera();

        // Check zone change
        this.checkZone();

        // Check player death - respawn with a gold penalty
        if (this.player.hp <= 0) {
            this.respawnPlayer();
        }

        // Check if boss trigger (all 5 gems) - surface only
        if (this.onSurface && this.player.blueGems >= 5 && !this.bossSpawned && !this.bossDefeated) {
            this.checkBossTrigger();
        }

        // Check Green Knight trigger (both green gems + near green castle) - surface only
        if (this.onSurface && this.greenlandsUnlocked && !this.greenKnightSpawned && !this.greenKnightDefeated
            && this.player.greenGemAttack && this.player.greenGemDefense) {
            this.checkGreenKnightTrigger();
        }

        // Check cave boss trigger
        if (this.inCave) {
            this.checkCaveBossTrigger();
            this.checkCaveTreasure();
        }

        // Cloudlands: burn down the Worldtree, summon the Olympian, gather ambrosia
        if (this.onSurface) {
            if (this.world.updateSkyTree(dt)) this.onSkyLadderRevealed();
            if (this.skyTreeHintCooldown > 0) this.skyTreeHintCooldown -= dt;
        }
        if (this.inSky) {
            this.checkOlympianTrigger();
            this.checkAmbrosia();
        }
        this.drainCombatWorldEvents();

        // Check fountain proximity
        this.checkFountainProximity();

        // Check hidden base treasure (surface only)
        if (this.onSurface) {
            this.checkHiddenBaseTreasure();
        }

        // Update HUD
        this.ui.updateHud(this.player);
    }

    respawnPlayer() {
        this.sound.playerDeath();

        // Gold penalty: lose 100, or everything if under 100
        const goldLost = Math.min(100, this.player.gold);
        this.player.gold -= goldLost;

        // If the player died in a cave or up in the Cloudlands, return them to the surface
        this.inCave = false;
        this.activeCaveId = null;
        this.caveBoss = null;
        this.inSky = false;

        // The Olympian resets to his first face so the whole cycle can be fought again
        if (this.olympianSpawned && !this.olympianDefeated) {
            this.olympianSpawned = false;
            this.olympianBoss = null;
        }

        // Reset any undefeated boss encounter so it can be triggered again
        if (this.bossSpawned && !this.bossDefeated) {
            this.bossSpawned = false;
            this.boss = new Boss(this.world.bossSpawnPoint.x, this.world.bossSpawnPoint.y);
        }
        if (this.greenKnightSpawned && !this.greenKnightDefeated) {
            this.greenKnightSpawned = false;
            this.greenKnight = null;
        }
        for (const id of Object.keys(this.caveBossSpawned)) {
            if (this.caveBossSpawned[id] && !this.caveBossDefeated[id]) {
                this.caveBossSpawned[id] = false;
            }
        }
        this.ui.hideBossHealth();

        // Respawn at the game's starting position with full health
        const startPos = tileToWorld(10, 15);
        this.player.x = startPos.x;
        this.player.y = startPos.y;
        this.player.hp = this.player.maxHp;
        this.player.knockbackVx = 0;
        this.player.knockbackVy = 0;

        // Brief grace period so nearby monsters can't chain-kill on respawn
        this.player.invincible = true;
        this.player.invincibleTimer = 2000;

        // Surviving companions regroup around the player
        this.nearAnimal = null;
        this.gatherCompanions();

        // Snap the camera to the respawn point instead of panning across the map
        this.camera.x = clamp(this.player.x - CANVAS_W / 2, 0, WORLD_W * TILE_SIZE - CANVAS_W);
        this.camera.y = clamp(this.player.y - CANVAS_H / 2, 0, WORLD_H * TILE_SIZE - CANVAS_H);
        this.currentZone = "meadow";
        this.zoneDisplayTimer = 3000;

        if (goldLost > 0) {
            this.ui.showNotification(`You fell in battle! -${goldLost} gold`);
            this.ui.showDialog(`Ingoizer has fallen... You awaken back in the Green Meadow, ${goldLost} gold lighter.`);
        } else {
            this.ui.showNotification("You fell in battle!");
            this.ui.showDialog("Ingoizer has fallen... You awaken back in the Green Meadow.");
        }
    }

    onEntityKilled(entity, isBoss) {
        // The Olympian killed - only possible once Zeus is back in his true form
        if (isBoss && entity === this.olympianBoss) {
            this.onOlympianDefeated();
            return;
        }

        // Cave Boss killed
        if (isBoss && entity === this.caveBoss && this.inCave) {
            const caveId = this.activeCaveId;
            this.caveBossDefeated[caveId] = true;
            this.ui.hideBossHealth();
            this.sound.bossDefeat();
            const caveWorld = this.caveWorlds[caveId];
            setTimeout(() => {
                this.sound.victoryFanfare();
                if (caveWorld.difficulty === 3) {
                    // NW cave boss drops purple gem of attack
                    this.player.purpleGemAttack = true;
                    this.ui.showNotification(`${PURPLE_GEMS.attack.icon} ${PURPLE_GEMS.attack.name} obtained! (+${PURPLE_GEMS.attack.bonus} DMG)`);
                    this.ui.showDialog(`The boss crumbles and drops the ${PURPLE_GEMS.attack.name}!`, () => {
                        this.ui.showDialog(`All your weapons deal +${PURPLE_GEMS.attack.bonus} additional damage!`);
                    });
                } else if (caveWorld.difficulty === 4) {
                    // NE cave boss drops purple gem of armor + Titan's Gauntlet
                    this.player.purpleGemArmor = true;
                    this.player.hasGauntlet = true;
                    this.ui.showNotification(`${PURPLE_GEMS.armor.icon} ${PURPLE_GEMS.armor.name} obtained! (+${PURPLE_GEMS.armor.bonus} DEF)`);
                    this.ui.showDialog(`The boss crumbles and drops the ${PURPLE_GEMS.armor.name}!`, () => {
                        this.ui.showDialog(`All your armor gains +${PURPLE_GEMS.armor.bonus} additional defense!`, () => {
                            this.ui.showNotification(`${CAVE_GAUNTLET.icon} ${CAVE_GAUNTLET.name} obtained! (+${CAVE_GAUNTLET.damageBonus} DMG)`);
                            this.ui.showDialog(`Among the shards you find the ${CAVE_GAUNTLET.name}! All your weapons deal +${CAVE_GAUNTLET.damageBonus} additional damage.`);
                        });
                    });
                }
            }, 2000);
            return;
        }

        // Green Knight killed
        if (isBoss && entity === this.greenKnight) {
            this.greenKnightDefeated = true;
            this.ui.hideBossHealth();
            this.sound.bossDefeat();
            // Drop Magic Charm
            this.player.hasMagicCharm = true;
            setTimeout(() => {
                this.ui.showNotification(`${MAGIC_CHARM.icon} ${MAGIC_CHARM.name} obtained! (+${MAGIC_CHARM.damageBonus} DMG all weapons)`);
                this.ui.showDialog("The Green Knight crumbles and drops a shimmering Magic Charm!", () => {
                    this.ui.showDialog(`The ${MAGIC_CHARM.name} empowers all your weapons with +${MAGIC_CHARM.damageBonus} attack damage!`, () => {
                        this.ui.showGameOver(true,
                            "The Green Knight has been vanquished! Ingoizer is the true champion of the realm. " +
                            "Both the Black Knight and the Green Knight have fallen. The land is forever free! " +
                            `Monsters defeated: ${this.player.monstersKilled}. ` +
                            "You may continue exploring with all your gear!"
                        );
                    });
                });
            }, 2000);
            return;
        }

        // Black Knight killed
        if (isBoss && entity === this.boss) {
            this.bossDefeated = true;
            this.ui.hideBossHealth();
            this.sound.bossDefeat();
            // Drop Dark Knight's Crest
            this.player.hasDarkCrest = true;
            this.player.maxHp += DARK_CREST.maxHpBonus;
            this.player.hp = Math.min(this.player.hp + DARK_CREST.maxHpBonus, this.player.maxHp);
            setTimeout(() => {
                this.sound.victoryFanfare();
                this.ui.showNotification(`${DARK_CREST.icon} ${DARK_CREST.name} obtained! (+${DARK_CREST.maxHpBonus} Max HP)`);
                // Unlock greenlands
                this.greenlandsUnlocked = true;
                this.world.unlockGreenlands();
                // Spawn green monster types
                this.spawnGreenMonsters();
                this.ui.showDialog(`The Black Knight drops the ${DARK_CREST.name}! Your max HP increases by ${DARK_CREST.maxHpBonus}!`, () => {
                    this.ui.showDialog("A mysterious green domain has appeared to the south! Legends speak of the Green Knight and powerful Green Gems within.", () => {
                        this.ui.showDialog("Find the two Green Gems - one grants attack power, the other grants defense. Collect both to challenge the Green Knight!");
                        this.ui.showNotification("Green Knight's Domain unlocked!");
                    });
                });
            }, 3000);
            return;
        }

        this.sound.monsterDeath();
        this.player.monstersKilled++;

        // Cloudlands keepers count toward summoning the Olympian
        if (entity.isSkyMonster) {
            this.onSkyMonsterSlain();
        }

        // Check if this was the sheath guardian troll
        if (entity.isSheathGuardian) {
            this.player.hasSheath = true;
            if (this.ladyQuestState === "given") {
                this.ladyQuestState = "sheath_acquired";
            }
            this.ui.showNotification("Jewel-encrusted Sheath obtained! (+2 weapon damage)");
            this.ui.showDialog("The troll falls and drops a magnificent sheath encrusted with jewels. It radiates power!", () => {
                this.ui.showDialog("The sheath empowers your weapons! Return to the Lady of the Lake to claim Excalibur.");
            });
        }

        const drops = entity.getDrops();

        // Arrow drops (1-3 arrows per kill)
        const arrowDrop = randInt(1, 3);
        this.player.arrows += arrowDrop;

        // Gold
        this.player.gold += drops.gold;
        this.sound.goldCollect();
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

        // Armor drop
        if (drops.armor) {
            if (this.player.addArmor(drops.armor)) {
                const a = ARMOR[drops.armor];
                this.sound.weaponPickup();
                this.ui.showNotification(`Found ${a.name}! (DEF +${a.defense})`);
                this.ui.showDialog(`You picked up ${a.name}! ${a.description}. DEF: ${a.defense}. Open inventory (I) to equip it.`);
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
        if (lady && this.ladyQuestState !== "complete") {
            if (dist(this.player.x, this.player.y, lady.x, lady.y) < LADY_OF_LAKE.interactRange) {
                this.nearLady = true;
            }
        }

        // Check Merlin
        this.nearMerlin = false;
        const merlin = this.world.merlin;
        if (merlin) {
            if (dist(this.player.x, this.player.y, merlin.x, merlin.y) < MERLIN.interactRange) {
                this.nearMerlin = true;
            }
        }

        // Check Merlin's wand at hut (auto-collect on proximity)
        if (this.merlinQuestState === "given" && this.world.merlinHut && !this.world.merlinHut.wandCollected) {
            const hut = this.world.merlinHut;
            if (dist(this.player.x, this.player.y, hut.x, hut.y) < 50) {
                this.collectMerlinWand();
            }
        }

        // Check green gems (auto-collect on proximity)
        if (this.greenlandsUnlocked && this.world.greenGems) {
            for (const gem of this.world.greenGems) {
                if (gem.collected) continue;
                if (dist(this.player.x, this.player.y, gem.x, gem.y) < 30) {
                    this.collectGreenGem(gem);
                }
            }
        }

        // Check coins (auto-collect on proximity)
        for (const coin of this.world.coins) {
            if (coin.collected) continue;
            if (dist(this.player.x, this.player.y, coin.x, coin.y) < COIN_CONFIG.collectRange) {
                coin.collected = true;
                coin.respawnTimer = COIN_CONFIG.respawnTime;
                this.player.gold += coin.value;
                this.sound.goldCollect();
                this.ui.showNotification(`+${coin.value} gold`);
            }
        }

        // Check apples (auto-collect on proximity)
        for (const apple of this.world.apples) {
            if (apple.collected) continue;
            if (dist(this.player.x, this.player.y, apple.x, apple.y) < APPLE_CONFIG.collectRange) {
                if (!this.player.addApples(1)) continue;
                apple.collected = true;
                apple.respawnTimer = APPLE_CONFIG.respawnTime;
                this.sound.applePickup();
                this.ui.showNotification(`${APPLE_ITEM.icon} Apple collected (${this.player.apples})`);
            }
        }

        // Check for a nearby wild animal to tame
        this.nearAnimal = null;
        if (this.aliveCompanionCount() < ANIMAL_CONFIG.maxCompanions) {
            let closest = Infinity;
            for (const animal of this.wildAnimals) {
                if (!animal.alive || animal.tamed) continue;
                const d = dist(this.player.x, this.player.y, animal.x, animal.y);
                if (d < ANIMAL_CONFIG.tameRange && d < closest) {
                    closest = d;
                    this.nearAnimal = animal;
                }
            }
        }

        // Check Merlin's Hut (for lore access)
        this.nearMerlinHut = false;
        if (this.world.merlinHut) {
            const hut = this.world.merlinHut;
            if (dist(this.player.x, this.player.y, hut.x, hut.y) < MERLIN_HUT_INTERACT_RANGE) {
                this.nearMerlinHut = true;
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
        // Cave entrance/exit interaction
        if (this.nearCaveEntrance && !this.inCave) {
            this.enterCave(this.nearCaveEntrance);
            return;
        }
        if (this.nearCaveExit && this.inCave) {
            this.exitCave(this.nearCaveExit);
            return;
        }

        // Sky ladder up / down
        if (this.nearSkyLadder && this.onSurface) {
            this.enterSky();
            return;
        }
        if (this.nearSkyExit && this.inSky) {
            this.exitSky();
            return;
        }

        // Don't allow surface interactions from another realm
        if (!this.onSurface) return;

        // Fountain of Youth interaction
        if (this.nearFountain) {
            this.startFountainRiddles();
            return;
        }

        // Shop interaction
        if (this.nearShop) {
            this.sound.menuSelect();
            this.ui.openShop(this.nearShop, this.player);
            return;
        }

        // Lady of the Lake interaction
        if (this.nearLady) {
            this.startLadyQuest();
            return;
        }

        // Merlin interaction
        if (this.nearMerlin) {
            this.startMerlinQuest();
            return;
        }

        // Merlin's Hut lore interaction
        if (this.nearMerlinHut) {
            this.sound.menuSelect();
            this.ui.openLore();
            return;
        }

        // Tame a nearby wild animal with an apple
        if (this.nearAnimal) {
            this.tameNearbyAnimal();
        }
    }

    startLadyQuest() {
        if (this.ladyQuestState === "none") {
            // First meeting - give the quest
            this.ui.showDialog("\"I am the Lady of the Lake. I hold Excalibur, the mightiest blade ever forged.\"", () => {
                this.ui.showDialog("\"But before I entrust it to you, brave Ingoizer, you must prove your valor.\"", () => {
                    this.ui.showDialog("\"A fearsome troll guards the jewel-encrusted sheath of Excalibur deep in the Dark Forest.\"", () => {
                        this.ui.showDialog("\"Defeat the troll and bring the sheath back to me. Only then shall the sword be yours.\"", () => {
                            this.ladyQuestState = "given";
                            this.ui.showNotification("Quest: Defeat the Sheath Guardian!");
                        });
                    });
                });
            });
        } else if (this.ladyQuestState === "given") {
            // Quest given but sheath not yet acquired
            this.ui.showDialog("\"The troll still guards the sheath in the Dark Forest. Seek it out and prove your strength, Ingoizer.\"");
        } else if (this.ladyQuestState === "sheath_acquired") {
            // Player has the sheath - give Excalibur
            this.sound.excaliburReveal();
            this.world.ladyOfLake.excaliburGiven = true;
            this.player.addWeapon("excalibur");
            this.player.equipWeapon("excalibur");
            this.ladyQuestState = "complete";
            this.ui.showDialog("\"You have defeated the guardian and recovered the sheath! You are truly worthy, Ingoizer.\"", () => {
                this.ui.showDialog("\"Take Excalibur - the legendary sword of kings! Together with its sheath, you shall be unstoppable.\"");
                this.ui.showNotification("Excalibur obtained!");
            });
        } else if (this.ladyQuestState === "complete") {
            this.ui.showDialog("\"Go forth with Excalibur, brave Ingoizer. The realm depends on you.\"");
        }
    }

    spawnSheathTroll() {
        const cfg = SHEATH_TROLL;
        const pos = tileToWorld(cfg.spawnTile.x, cfg.spawnTile.y);
        this.sheathTroll = new Monster("troll", pos.x, pos.y);
        // Override stats with guardian-specific values
        this.sheathTroll.name = cfg.name;
        this.sheathTroll.hp = cfg.hp;
        this.sheathTroll.maxHp = cfg.hp;
        this.sheathTroll.damage = cfg.damage;
        this.sheathTroll.speed = cfg.speed;
        this.sheathTroll.size = cfg.size;
        this.sheathTroll.color = cfg.color;
        this.sheathTroll.xp = cfg.xp;
        this.sheathTroll.goldDrop = cfg.goldDrop;
        this.sheathTroll.aggroRange = cfg.aggroRange;
        this.sheathTroll.leashRange = cfg.leashRange;
        this.sheathTroll.isSheathGuardian = true;
        this.sheathTroll.weaponDrop = null;
        this.sheathTroll.gemDrop = false;
        this.monsters.push(this.sheathTroll);
    }

    spawnGreenMonsters() {
        for (const [type, def] of Object.entries(GREEN_MONSTER_TYPES)) {
            const zone = ZONES.greenlands;
            if (!zone) continue;
            const count = randInt(4, MAX_MONSTERS_PER_ZONE);
            for (let i = 0; i < count; i++) {
                let attempts = 0;
                while (attempts < 20) {
                    const tx = zone.x + randInt(2, zone.w - 3);
                    const ty = zone.y + randInt(2, zone.h - 3);
                    if (!this.world.isSolid(tx, ty)) {
                        const pos = tileToWorld(tx, ty);
                        const m = new Monster("goblin", pos.x, pos.y);
                        // Override with green monster stats
                        m.type = type;
                        m.name = def.name;
                        m.hp = def.hp;
                        m.maxHp = def.hp;
                        m.damage = def.damage;
                        m.speed = def.speed;
                        m.xp = def.xp;
                        m.goldDrop = def.goldDrop;
                        m.color = def.color;
                        m.size = def.size;
                        m.weaponDrop = def.weaponDrop;
                        m.gemDrop = def.gemDrop;
                        this.monsters.push(m);
                        break;
                    }
                    attempts++;
                }
            }
        }
    }

    startMerlinQuest() {
        if (this.merlinQuestState === "none") {
            this.ui.showDialog("\"Ah, Ingoizer! I am Merlin, the great wizard of these swamps.\"", () => {
                this.ui.showDialog("\"I have lost my wand, you see. Without it, my powers are... diminished.\"", () => {
                    this.ui.showDialog("\"I left it in my old hut, near the gates of Ing Castle. Could you retrieve it for me?\"", () => {
                        this.ui.showDialog("\"Bring my wand back and I shall reward you with my Enchanter's Mallet - a tool of great power!\"", () => {
                            this.merlinQuestState = "given";
                            this.world.merlinHut.showWand = true;
                            this.ui.showNotification("Quest: Retrieve Merlin's Wand!");
                        });
                    });
                });
            });
        } else if (this.merlinQuestState === "given") {
            this.ui.showDialog("\"My wand is in my old hut, near Ing Castle. Please hurry, Ingoizer!\"");
        } else if (this.merlinQuestState === "wand_acquired") {
            // Player has the wand - give reward
            this.merlinQuestState = "complete";
            this.player.hasMallet = true;
            this.player.hasMerlinWand = false;
            this.ui.showDialog("\"You found my wand! Splendid! Thank you, brave Ingoizer!\"", () => {
                this.ui.showDialog("\"As promised, take this Enchanter's Mallet. With it, you can enchant a weapon AND armor with elemental power!\"", () => {
                    this.ui.showDialog("\"Open your inventory and use the mallet to imbue your gear with fire, water, ice, or lightning.\"");
                    this.ui.showNotification("Enchanter's Mallet obtained!");
                });
            });
        } else if (this.merlinQuestState === "complete") {
            if (this.player.hasMallet && (!this.player.malletUsedWeapon || !this.player.malletUsedArmor)) {
                this.ui.showDialog("\"Remember to use the Enchanter's Mallet from your inventory, Ingoizer!\"");
            } else {
                this.ui.showDialog("\"May the enchantment serve you well on your quest, Ingoizer!\"");
            }
        }
    }

    collectGreenGem(gem) {
        gem.collected = true;
        this.sound.gemCollect();
        if (gem.type === "attack") {
            this.player.greenGemAttack = true;
            this.ui.showNotification(`${GREEN_GEM_ATTACK.icon} ${GREEN_GEM_ATTACK.name} found! (+${GREEN_GEM_ATTACK.bonus} ATK)`);
            this.ui.showDialog(`You found the ${GREEN_GEM_ATTACK.name}! It adds +${GREEN_GEM_ATTACK.bonus} attack damage to all your weapons.`);
        } else {
            this.player.greenGemDefense = true;
            this.ui.showNotification(`${GREEN_GEM_DEFENSE.icon} ${GREEN_GEM_DEFENSE.name} found! (+${GREEN_GEM_DEFENSE.bonus} DEF)`);
            this.ui.showDialog(`You found the ${GREEN_GEM_DEFENSE.name}! It adds +${GREEN_GEM_DEFENSE.bonus} defense to all your armor.`);
        }
        // Check if both gems collected
        if (this.player.greenGemAttack && this.player.greenGemDefense) {
            this.ui.showDialog("You have both Green Gems! Journey to the Green Knight's Castle to face the champion!");
        }
    }

    collectMerlinWand() {
        this.world.merlinHut.wandCollected = true;
        this.player.hasMerlinWand = true;
        this.merlinQuestState = "wand_acquired";
        this.sound.gemCollect();
        this.ui.showNotification("Merlin's Wand collected! Return to Merlin.");
        this.ui.showDialog("You found Merlin's wand! It hums with arcane energy. Return it to Merlin in the swamp.");
    }

    updateBurningTrees(dt) {
        // Check for burning trees and damage nearby monsters
        const playerTile = worldToTile(this.player.x, this.player.y);
        const checkRadius = 10; // tiles around player to check

        for (let ty = playerTile.y - checkRadius; ty <= playerTile.y + checkRadius; ty++) {
            for (let tx = playerTile.x - checkRadius; tx <= playerTile.x + checkRadius; tx++) {
                if (tx < 0 || tx >= WORLD_W || ty < 0 || ty >= WORLD_H) continue;
                if (this.world.tiles[ty][tx] !== TILE.BURNING_TREE) continue;

                const treeWorldX = tx * TILE_SIZE + TILE_SIZE / 2;
                const treeWorldY = ty * TILE_SIZE + TILE_SIZE / 2;

                // Update burn timer
                if (!this.world.burningTrees) this.world.burningTrees = {};
                const key = `${tx},${ty}`;
                if (!this.world.burningTrees[key]) {
                    this.world.burningTrees[key] = { timer: 8000 }; // burns for 8 seconds
                }
                this.world.burningTrees[key].timer -= dt;

                // Fire is out - turn to path/ash
                if (this.world.burningTrees[key].timer <= 0) {
                    this.world.tiles[ty][tx] = TILE.PATH;
                    delete this.world.burningTrees[key];
                    continue;
                }

                // Damage monsters that touch the burning tree
                const damageRange = TILE_SIZE * 1.2;
                for (const m of this.monsters) {
                    if (!m.alive) continue;
                    if (dist(m.x, m.y, treeWorldX, treeWorldY) < damageRange) {
                        if (!m._lastBurnTime || Date.now() - m._lastBurnTime > 500) {
                            m._lastBurnTime = Date.now();
                            const fireDmg = 8;
                            const killed = m.takeDamage(fireDmg, treeWorldX, treeWorldY);
                            this.combat.addDamageNumber(m.x, m.y, fireDmg, false);
                            this.combat.spawnHitParticles(m.x, m.y, "#ff6600", 3);
                            if (killed) {
                                this.onEntityKilled(m, false);
                            }
                        }
                    }
                }

                // Also damage Green Knight
                if (this.greenKnight && this.greenKnight.alive && this.greenKnight.spawned) {
                    if (dist(this.greenKnight.x, this.greenKnight.y, treeWorldX, treeWorldY) < damageRange) {
                        if (!this.greenKnight._lastBurnTime || Date.now() - this.greenKnight._lastBurnTime > 500) {
                            this.greenKnight._lastBurnTime = Date.now();
                            const fireDmg = 8;
                            const killed = this.greenKnight.takeDamage(fireDmg, treeWorldX, treeWorldY);
                            this.combat.addDamageNumber(this.greenKnight.x, this.greenKnight.y, fireDmg, false);
                            if (killed) {
                                this.onEntityKilled(this.greenKnight, true);
                            }
                        }
                    }
                }

                // Also damage boss
                if (this.boss && this.boss.alive && this.boss.spawned) {
                    if (dist(this.boss.x, this.boss.y, treeWorldX, treeWorldY) < damageRange) {
                        if (!this.boss._lastBurnTime || Date.now() - this.boss._lastBurnTime > 500) {
                            this.boss._lastBurnTime = Date.now();
                            const fireDmg = 8;
                            const killed = this.boss.takeDamage(fireDmg, treeWorldX, treeWorldY);
                            this.combat.addDamageNumber(this.boss.x, this.boss.y, fireDmg, false);
                            if (killed) {
                                this.onEntityKilled(this.boss, true);
                            }
                        }
                    }
                }

                // Damage player too
                if (dist(this.player.x, this.player.y, treeWorldX, treeWorldY) < damageRange) {
                    this.player.takeDamage(5, treeWorldX, treeWorldY);
                }

                // Spawn fire particles for visual effect
                this.combat.particles.push({
                    x: treeWorldX + randFloat(-8, 8),
                    y: treeWorldY + randFloat(-16, 0),
                    vx: randFloat(-0.3, 0.3),
                    vy: randFloat(-1.5, -0.5),
                    life: 300,
                    maxLife: 300,
                    size: randFloat(2, 5),
                    color: choose(["#ff4400", "#ff8800", "#ffaa00", "#ffcc00"]),
                });
            }
        }
    }

    // ============================================
    // Cave System Methods
    // ============================================

    spawnCaveMonstersForCave(caveWorld) {
        this.caveMonsters = [];
        for (const [type, def] of Object.entries(CAVE_MONSTER_TYPES)) {
            const count = randInt(3, 6);
            for (let i = 0; i < count; i++) {
                let attempts = 0;
                while (attempts < 30) {
                    const tx = randInt(5, CAVE_W - 6);
                    const ty = randInt(5, CAVE_H - 6);
                    if (!caveWorld.isSolid(tx, ty)) {
                        const exit = caveWorld.exit;
                        if (exit && Math.abs(tx - exit.x) <= 3 && Math.abs(ty - exit.y) <= 3) { attempts++; continue; }
                        const pos = tileToWorld(tx, ty);
                        const m = new Monster("goblin", pos.x, pos.y);
                        m.type = type; m.name = def.name; m.hp = def.hp; m.maxHp = def.hp;
                        m.damage = def.damage; m.speed = def.speed; m.xp = def.xp;
                        m.goldDrop = def.goldDrop; m.color = def.color; m.size = def.size;
                        m.weaponDrop = def.weaponDrop; m.weaponDropChance = def.weaponDropChance || 0;
                        m.gemDrop = def.gemDrop; m.armorDrop = def.armorDrop;
                        m.armorDropChance = def.armorDropChance || 0; m.isCaveMonster = true;
                        this.caveMonsters.push(m);
                        break;
                    }
                    attempts++;
                }
            }
        }
    }

    spawnCaveMonsters(dt) {
        if (!this.inCave) return;
        this.caveMonsterSpawnTimer += dt;
        if (this.caveMonsterSpawnTimer < MONSTER_SPAWN_INTERVAL) return;
        this.caveMonsterSpawnTimer = 0;

        const aliveCount = this.caveMonsters.filter(m => m.alive).length;
        if (aliveCount >= 20) return;

        const caveWorld = this.caveWorlds[this.activeCaveId];
        if (!caveWorld) return;

        const types = Object.keys(CAVE_MONSTER_TYPES);
        const type = choose(types);
        const def = CAVE_MONSTER_TYPES[type];
        if (Math.random() > MONSTER_SPAWN_RATE * 2) return;

        let attempts = 0;
        while (attempts < 15) {
            const tx = randInt(5, CAVE_W - 6);
            const ty = randInt(5, CAVE_H - 6);
            if (!caveWorld.isSolid(tx, ty)) {
                const pos = tileToWorld(tx, ty);
                if (dist(pos.x, pos.y, this.player.x, this.player.y) > 200) {
                    const m = new Monster("goblin", pos.x, pos.y);
                    m.type = type; m.name = def.name; m.hp = def.hp; m.maxHp = def.hp;
                    m.damage = def.damage; m.speed = def.speed; m.xp = def.xp;
                    m.goldDrop = def.goldDrop; m.color = def.color; m.size = def.size;
                    m.weaponDrop = def.weaponDrop; m.weaponDropChance = def.weaponDropChance || 0;
                    m.gemDrop = def.gemDrop; m.armorDrop = def.armorDrop;
                    m.armorDropChance = def.armorDropChance || 0; m.isCaveMonster = true;
                    this.caveMonsters.push(m);
                    break;
                }
            }
            attempts++;
        }
        this.caveMonsters = this.caveMonsters.filter(m => m.alive || m.deathTimer > 0);
    }

    enterCave(entrance) {
        this.inCave = true;
        this.activeCaveId = entrance.id;
        this.savedSurfacePos = { x: this.player.x, y: this.player.y };

        const caveWorld = this.caveWorlds[entrance.id];
        if (caveWorld.exit) {
            this.player.x = caveWorld.exit.worldX;
            this.player.y = caveWorld.exit.worldY - TILE_SIZE;
        }

        // Spawn monsters for this cave
        this.spawnCaveMonstersForCave(caveWorld);
        this.caveBoss = null;

        // The pack climbs down with you
        this.nearAnimal = null;
        this.gatherCompanions();

        const ce = CAVE_ENTRANCES.find(e => e.id === entrance.id);
        this.currentZone = "cave";
        this.zoneDisplayTimer = 3000;
        this.sound.menuSelect();
        this.ui.showNotification(`Entered ${ce.label}...`);
        if (ce.difficulty <= 2) {
            this.ui.showDialog("You descend into a dark maze. Find the treasure at the center!");
        } else {
            this.ui.showDialog("You descend into a dark cave. A powerful creature guards something precious within...");
        }
    }

    exitCave(exitData) {
        this.inCave = false;
        this.activeCaveId = null;
        this.caveBoss = null;

        const mainEntrance = this.world.caveEntrances.find(e => e.id === exitData.id);
        if (mainEntrance) {
            this.player.x = mainEntrance.worldX;
            this.player.y = mainEntrance.worldY + TILE_SIZE;
        }

        this.gatherCompanions();
        this.sound.menuSelect();
        this.ui.showNotification("Returned to the surface.");
    }

    checkCaveProximity() {
        if (this.inCave) {
            this.nearCaveExit = null;
            const caveWorld = this.caveWorlds[this.activeCaveId];
            if (!caveWorld) return;
            // Check main exit
            if (caveWorld.exit && dist(this.player.x, this.player.y, caveWorld.exit.worldX, caveWorld.exit.worldY) < CAVE_ENTRANCE_RANGE) {
                this.nearCaveExit = caveWorld.exit;
            }
            // Check center exit (maze caves)
            if (!this.nearCaveExit && caveWorld.centerExit && dist(this.player.x, this.player.y, caveWorld.centerExit.worldX, caveWorld.centerExit.worldY) < CAVE_ENTRANCE_RANGE) {
                this.nearCaveExit = caveWorld.centerExit;
            }
        } else {
            this.nearCaveEntrance = null;
            if (!this.onSurface) return;
            for (const entrance of this.world.caveEntrances) {
                if (dist(this.player.x, this.player.y, entrance.worldX, entrance.worldY) < CAVE_ENTRANCE_RANGE) {
                    this.nearCaveEntrance = entrance;
                    break;
                }
            }
        }
    }

    checkCaveBossTrigger() {
        if (!this.inCave) return;
        const caveId = this.activeCaveId;
        const caveWorld = this.caveWorlds[caveId];
        if (!caveWorld || !caveWorld.bossSpawnTile) return;
        if (this.caveBossDefeated[caveId] || this.caveBossSpawned[caveId]) return;

        const bossPos = tileToWorld(caveWorld.bossSpawnTile.x, caveWorld.bossSpawnTile.y);
        if (dist(this.player.x, this.player.y, bossPos.x, bossPos.y) < 200) {
            const bossConfig = caveWorld.difficulty === 4 ? CAVE_BOSS_4 : CAVE_BOSS_3;
            this.caveBossSpawned[caveId] = true;
            this.caveBoss = new Boss(bossPos.x, bossPos.y);
            this.caveBoss.name = bossConfig.name;
            this.caveBoss.maxHp = bossConfig.hp;
            this.caveBoss.hp = bossConfig.hp;
            this.caveBoss.damage = bossConfig.damage;
            this.caveBoss.baseSpeed = bossConfig.speed;
            this.caveBoss.speed = bossConfig.speed;
            this.caveBoss.size = bossConfig.size;
            this.caveBoss.color = bossConfig.color;
            this.caveBoss.phases = bossConfig.phases;
            this.caveBoss.spawn();
            this.sound.bossRoar();
            this.ui.showDialog(`The ground shakes as ${bossConfig.name} rises from the cave floor...`);
            this.ui.showDialog(`"None shall plunder my domain!"`);
        }
    }

    checkCaveTreasure() {
        if (!this.inCave) return;
        const caveId = this.activeCaveId;
        const caveWorld = this.caveWorlds[caveId];
        if (!caveWorld || !caveWorld.treasurePos) return;
        if (this.caveTreasureCollected[caveId]) return;

        if (dist(this.player.x, this.player.y, caveWorld.treasurePos.x, caveWorld.treasurePos.y) < 40) {
            this.caveTreasureCollected[caveId] = true;
            this.sound.gemCollect();
            const ce = CAVE_ENTRANCES.find(e => e.id === caveId);
            if (ce.difficulty === 1) {
                // SW cave: coins + health potion
                const coins = randInt(50, 100);
                this.player.gold += coins;
                this.player.addHealthPotion("regular");
                this.player.addHealthPotion("regular");
                this.ui.showNotification(`Found ${coins} gold and 2 Health Potions!`);
                this.ui.showDialog("You found a treasure chest in the center of the maze!");
            } else if (ce.difficulty === 2) {
                // SE cave: purple gem (health) + health potion
                this.player.purpleGemHealth = true;
                this.player.maxHp += PURPLE_GEMS.health.bonus;
                this.player.hp = Math.min(this.player.hp + PURPLE_GEMS.health.bonus, this.player.maxHp);
                this.player.addHealthPotion("regular");
                this.ui.showNotification(`${PURPLE_GEMS.health.icon} ${PURPLE_GEMS.health.name} found! +${PURPLE_GEMS.health.bonus} Max HP`);
                this.ui.showDialog(`The ${PURPLE_GEMS.health.name} pulses with healing energy! Your maximum health has increased!`);
            }
        }
    }

    clearCaveObstacle(entranceId) {
        const cleared = this.world.clearCaveObstacle(entranceId, this.player.x, this.player.y);
        if (cleared > 0) {
            const ce = CAVE_ENTRANCES.find(e => e.id === entranceId);
            this.sound.gemCollect();
            this.ui.showNotification(`Cleared ${ce.obstacle} near ${ce.label}!`);
        }
    }

    // ============================================
    // The Cloudlands
    // ============================================

    // Build a Monster from a non-standard definition table (cave, green, sky).
    createCustomMonster(typeKey, def, x, y, extra = {}) {
        const m = new Monster("goblin", x, y);
        m.type = typeKey;
        m.name = def.name;
        m.hp = def.hp;
        m.maxHp = def.hp;
        m.damage = def.damage;
        m.speed = def.speed;
        m.xp = def.xp;
        m.goldDrop = def.goldDrop;
        m.color = def.color;
        m.size = def.size;
        m.weaponDrop = def.weaponDrop || null;
        m.weaponDropChance = def.weaponDropChance || 0;
        m.armorDrop = def.armorDrop || null;
        m.armorDropChance = def.armorDropChance || 0;
        m.gemDrop = !!def.gemDrop;
        m.gemChance = def.gemChance || 0;
        Object.assign(m, extra);
        return m;
    }

    // Fire (from an arrow or a point-blank blast) opens the Worldtree.
    tryIgniteSkyTree(range) {
        const st = this.world.skyTree;
        if (!st || st.state !== "intact") return false;
        if (dist(this.player.x, this.player.y, st.x, st.y) > range) return false;
        if (!this.world.igniteSkyTree()) return false;
        this.onSkyTreeIgnited();
        return true;
    }

    onSkyTreeIgnited() {
        this.sound.fireBlast();
        this.ui.showNotification("The Worldtree catches fire!");
        this.ui.showDialog(
            "Flame races up the Worldtree and the ancient bark splits open. Something inside it is " +
            "not wood at all — rungs, worn smooth by hands that were never mortal. Wait for the fire to do its work."
        );
    }

    onSkyLadderRevealed() {
        this.sound.excaliburReveal();
        this.ui.showNotification("A ladder into the clouds is revealed!");
        this.ui.showDialog(
            "The Worldtree burns away to ash and leaves a ladder standing in empty air, climbing up " +
            "past the clouds until you lose sight of it.",
            () => {
                this.ui.showDialog("Press E at the ladder to climb into the Cloudlands. Whatever lives up there is far stronger than anything below.");
            }
        );
    }

    // Pull world-level events out of the combat system (arrows hitting the Worldtree).
    drainCombatWorldEvents() {
        if (!this.combat || this.combat.worldEvents.length === 0) return;
        for (const ev of this.combat.worldEvents) {
            if (ev.type === "skyTreeIgnited") {
                this.onSkyTreeIgnited();
            } else if (ev.type === "skyTreeResisted") {
                if (this.skyTreeHintCooldown <= 0) {
                    this.skyTreeHintCooldown = 4000;
                    this.sound.monsterHit();
                    this.ui.showNotification("The Worldtree shrugs off your arrow. Try fire.");
                }
            }
        }
        this.combat.worldEvents.length = 0;
    }

    checkSkyProximity() {
        this.nearSkyLadder = false;
        this.nearSkyExit = false;

        if (this.onSurface) {
            const ladder = this.world.skyLadder;
            if (ladder && dist(this.player.x, this.player.y, ladder.x, ladder.y) < SKY_TREE.ladderRange) {
                this.nearSkyLadder = true;
            }
        } else if (this.inSky && this.skyWorld.exit) {
            const e = this.skyWorld.exit;
            if (dist(this.player.x, this.player.y, e.worldX, e.worldY) < CAVE_ENTRANCE_RANGE) {
                this.nearSkyExit = true;
            }
        }
    }

    enterSky() {
        this.inSky = true;
        this.savedSurfacePos = { x: this.player.x, y: this.player.y };

        const exit = this.skyWorld.exit;
        this.player.x = exit.worldX;
        this.player.y = exit.worldY - TILE_SIZE;
        this.snapCamera();

        if (this.skyMonsters.length === 0) this.spawnInitialSkyMonsters();

        this.currentZone = "sky";
        this.zoneDisplayTimer = 3000;
        this.sound.divineChime();
        this.ui.showNotification("You climb into the Cloudlands.");
        if (!this.olympianSummoned && !this.olympianDefeated) {
            this.ui.showDialog(
                "You haul yourself over the edge onto ground that should not hold your weight. Islands of " +
                "hardened cloud drift above a blue abyss, and a temple of white marble waits at the centre of them."
            );
            this.ui.showDialog(
                `Slay ${SKY_MONSTERS_TO_SUMMON} of the Cloudlands' keepers and the temple will answer. (${this.skyMonsterKills}/${SKY_MONSTERS_TO_SUMMON} so far.)`
            );
        }
    }

    exitSky() {
        this.inSky = false;
        this.ui.hideBossHealth();

        const ladder = this.world.skyLadder;
        if (ladder) {
            this.player.x = ladder.x;
            this.player.y = ladder.y + TILE_SIZE;
        } else if (this.savedSurfacePos) {
            this.player.x = this.savedSurfacePos.x;
            this.player.y = this.savedSurfacePos.y;
        }
        this.snapCamera();

        // The Olympian never leaves his temple - he waits for the next climb.
        if (this.olympianBoss && !this.olympianDefeated) {
            this.olympianBoss = null;
            this.olympianSpawned = false;
        }

        this.sound.menuSelect();
        this.ui.showNotification("You climb back down to the realm below.");
    }

    snapCamera() {
        const worldW = this.inCave ? CAVE_W : (this.inSky ? SKY_W : WORLD_W);
        const worldH = this.inCave ? CAVE_H : (this.inSky ? SKY_H : WORLD_H);
        this.camera.x = clamp(this.player.x - CANVAS_W / 2, 0, worldW * TILE_SIZE - CANVAS_W);
        this.camera.y = clamp(this.player.y - CANVAS_H / 2, 0, worldH * TILE_SIZE - CANVAS_H);
    }

    spawnInitialSkyMonsters() {
        this.skyMonsters = [];
        for (const [type, def] of Object.entries(SKY_MONSTER_TYPES)) {
            const count = randInt(3, 5);
            for (let i = 0; i < count; i++) {
                for (let attempt = 0; attempt < 20; attempt++) {
                    const tile = this.skyWorld.randomOpenTile();
                    const pos = tileToWorld(tile.x, tile.y);
                    // Never right on top of the arrival ladder
                    if (dist(pos.x, pos.y, this.skyWorld.exit.worldX, this.skyWorld.exit.worldY) < 140) continue;
                    this.skyMonsters.push(this.createCustomMonster(type, def, pos.x, pos.y, {
                        isSkyMonster: true,
                        aggroRange: 220,
                        leashRange: 420,
                    }));
                    break;
                }
            }
        }
    }

    spawnSkyMonsters(dt) {
        if (!this.inSky) return;
        this.skyMonsterSpawnTimer += dt;
        if (this.skyMonsterSpawnTimer < MONSTER_SPAWN_INTERVAL) return;
        this.skyMonsterSpawnTimer = 0;

        this.skyMonsters = this.skyMonsters.filter(m => m.alive || m.deathTimer > 0);
        const aliveCount = this.skyMonsters.filter(m => m.alive).length;
        if (aliveCount >= 16) return;
        if (Math.random() > MONSTER_SPAWN_RATE * 2) return;

        const type = choose(Object.keys(SKY_MONSTER_TYPES));
        const def = SKY_MONSTER_TYPES[type];
        for (let attempt = 0; attempt < 15; attempt++) {
            const tile = this.skyWorld.randomOpenTile();
            const pos = tileToWorld(tile.x, tile.y);
            if (dist(pos.x, pos.y, this.player.x, this.player.y) < 260) continue;
            this.skyMonsters.push(this.createCustomMonster(type, def, pos.x, pos.y, {
                isSkyMonster: true,
                aggroRange: 220,
                leashRange: 420,
            }));
            break;
        }
    }

    onSkyMonsterSlain() {
        if (this.olympianSummoned || this.olympianDefeated) return;
        this.skyMonsterKills++;
        if (this.skyMonsterKills < SKY_MONSTERS_TO_SUMMON) {
            this.ui.showNotification(
                `Keeper of the Cloudlands slain (${this.skyMonsterKills}/${SKY_MONSTERS_TO_SUMMON})`
            );
            return;
        }
        this.summonOlympian();
    }

    summonOlympian() {
        this.olympianSummoned = true;
        this.sound.divineSummon();
        this.ui.showNotification("⚡ The Temple of Olympus has woken!");
        this.ui.showDialog(
            "The fifth keeper falls and every cloud in the sky turns the colour of a bruise. Far off at " +
            "the centre of the Cloudlands, the Temple of Olympus lights from within.",
            () => {
                this.ui.showDialog("\"WHO CLIMBS?\" The voice is not sound. It is weather. Go to the temple — something has come down to meet you.");
            }
        );
    }

    checkOlympianTrigger() {
        if (!this.olympianSummoned || this.olympianSpawned || this.olympianDefeated) return;
        const t = this.skyWorld.bossSpawnTile;
        if (!t) return;
        const pos = tileToWorld(t.x, t.y);
        if (dist(this.player.x, this.player.y, pos.x, pos.y) > 240) return;

        this.olympianSpawned = true;
        this.olympianBoss = new OlympianBoss(pos.x, pos.y);
        this.olympianBoss.spawn();
        this.sound.zeusRoar();
        this.ui.showDialog("A bolt splits the temple roof and a figure steps out of the light, crowned in lightning.", () => {
            this.ui.showDialog("\"I am Zeus, and you are a long way from your meadow, Ingoizer.\"", () => {
                this.ui.showDialog("\"Strike me if you can. You will find there is always another of us behind the one you hit.\"");
            });
        });
    }

    drainOlympianEvents(boss) {
        if (!boss.pendingEvents.length) return;
        for (const ev of boss.pendingEvents) {
            if (ev.type === "morph") {
                this.sound.godMorph();
                this.combat.spawnHitParticles(boss.x, boss.y, ev.god.aura, 14);
                this.ui.showNotification(`${ev.god.emblem} ${ev.god.name}, ${ev.god.title}!`);
            } else if (ev.type === "trueForm") {
                this.sound.zeusRoar();
                this.ui.showNotification("⚡ ZEUS RETURNS — now he can be killed!");
                const wounded = ev.banked > 0
                    ? ` The wrath you spent on the twelve has already cost him ${ev.banked} health.`
                    : "";
                this.ui.showDialog(
                    "The twelfth face burns away and there are no more masks left to wear. Zeus stands before " +
                    "you as himself, and himself can bleed." + wounded
                );
            }
        }
        boss.pendingEvents.length = 0;
    }

    checkAmbrosia() {
        if (!this.inSky) return;
        for (const a of this.skyWorld.ambrosia) {
            if (a.collected) continue;
            if (dist(this.player.x, this.player.y, a.x, a.y) > AMBROSIA.collectRange) continue;
            a.collected = true;
            const gold = randInt(AMBROSIA.gold[0], AMBROSIA.gold[1]);
            this.player.gold += gold;
            this.player.hp = this.player.maxHp;
            for (let i = 0; i < AMBROSIA.potions; i++) this.player.addHealthPotion("greater");
            this.sound.gemCollect();
            this.ui.showNotification(`${AMBROSIA.icon} Ambrosia! Fully healed, +${gold} gold, +1 Greater Potion`);
        }
    }

    onOlympianDefeated() {
        this.olympianDefeated = true;
        this.ui.hideBossHealth();
        this.sound.bossDefeat();
        this.player.hasZeusBolts = true;

        setTimeout(() => {
            this.sound.victoryFanfare();
            this.ui.showNotification(`${ZEUS_BOLT.icon} Your arrows are now Zeus's lightning bolts! (+${ZEUS_BOLT.damageBonus} DMG)`);
            this.ui.showDialog("Zeus comes apart into weather. The storm over the Cloudlands goes quiet for the first time in an age.", () => {
                this.ui.showDialog(
                    `As the light fades, the arrows in your quiver crackle and change. Every one of them is a bolt of Zeus now — ` +
                    `and every arrow you ever pick up again will become one too. +${ZEUS_BOLT.damageBonus} damage on top of your bow.`,
                    () => {
                        this.ui.showGameOver(true,
                            "You have thrown down the King of Olympus himself. Ingoizer, who woke in the Green Meadow with a rusty " +
                            "sword, now carries the lightning of Zeus in his quiver. " +
                            `Monsters defeated: ${this.player.monstersKilled}. ` +
                            "The realm below, the caves beneath and the heavens above are all yours to wander."
                        );
                    }
                );
            });
        }, 2500);
    }

    tryRevealHiddenLadder() {
        const hl = this.world.hiddenLadder;
        if (!hl || hl.revealed) return;
        if (dist(this.player.x, this.player.y, hl.worldX, hl.worldY) > 130) return;
        if (this.world.revealHiddenLadder()) {
            this.sound.iceFreeze();
            this.sound.gemCollect();
            this.ui.showNotification("A hidden ladder appears in the frozen wall!");
            this.ui.showDialog(
                "You channel the Ice Gem into the northwest wall of the Black Knight's castle. " +
                "The frozen stone splits apart, revealing a hidden ladder. It rises into a secret base above — climb up to see what treasures lie within!"
            );
        }
    }

    checkHiddenBaseTreasure() {
        if (!this.onSurface) return;
        const hl = this.world.hiddenLadder;
        if (!hl || !hl.revealed || hl.looted) return;
        if (dist(this.player.x, this.player.y, hl.baseCenterX, hl.baseCenterY) > 70) return;

        hl.looted = true;
        this.sound.gemCollect();

        this.player.addArmor("ingozer_armor");
        this.player.equipArmor("ingozer_armor");
        this.player.addBow("arrow_strength_bow");
        this.player.equipBow("arrow_strength_bow");
        this.player.hasRainbowGem = true;

        this.ui.showNotification("Looted the hidden base: Ingozer's Armour, Bow of Arrow Strength & the Rainbow Gem!");
        this.ui.showDialog(
            "You climb into the hidden base and find a legendary cache! You claim " +
            `${ARMOR.ingozer_armor.name} (blocks ${ARMOR.ingozer_armor.defense} damage), the ${BOWS.arrow_strength_bow.name} ` +
            `(${BOWS.arrow_strength_bow.damage} damage per arrow), and the ${RAINBOW_GEM.name} — it grants +4 to everything, ` +
            "boosting all your weapons, bows, and armour!"
        );
    }

    checkFountainProximity() {
        if (!this.onSurface || !this.world.fountainOfYouth) return;
        const f = this.world.fountainOfYouth;
        this.nearFountain = dist(this.player.x, this.player.y, f.x, f.y) < 50;
    }

    startFountainRiddles() {
        const now = Date.now();
        if (this.fountainCooldownUntil > now) {
            const remaining = Math.ceil((this.fountainCooldownUntil - now) / 1000);
            this.ui.showNotification(`The fountain is silent. Try again in ${remaining}s.`);
            return;
        }

        // Pick 3 random riddles
        const shuffled = [...FOUNTAIN_RIDDLES].sort(() => Math.random() - 0.5);
        const riddles = shuffled.slice(0, FOUNTAIN_OF_YOUTH.riddleCount);

        this.fountainRiddleState = { riddles, currentIndex: 0, correct: 0 };
        this.askNextFountainRiddle();
    }

    askNextFountainRiddle() {
        const state = this.fountainRiddleState;
        if (!state) return;

        if (state.currentIndex >= state.riddles.length) {
            // All riddles answered correctly!
            this.fountainRiddleState = null;
            this.player.hp = this.player.maxHp;
            for (let i = 0; i < FOUNTAIN_OF_YOUTH.potionsGiven; i++) {
                this.player.addHealthPotion("regular");
            }
            this.sound.excaliburReveal();
            this.ui.showNotification(`Health restored! +${FOUNTAIN_OF_YOUTH.potionsGiven} Health Potions!`);
            this.ui.showDialog("The Fountain of Youth glows with radiant light! You feel completely rejuvenated!");
            return;
        }

        const riddle = state.riddles[state.currentIndex];
        this.ui.openRiddle(riddle, () => {
            // Correct
            state.currentIndex++;
            state.correct++;
            setTimeout(() => this.askNextFountainRiddle(), 500);
        }, () => {
            // Wrong
            this.fountainRiddleState = null;
            this.fountainCooldownUntil = Date.now() + FOUNTAIN_OF_YOUTH.wrongAnswerCooldown;
            this.ui.showNotification("The fountain goes quiet. Return in 3 minutes.");
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

    checkGreenKnightTrigger() {
        const spawnPoint = this.world.greenBossSpawnPoint;
        if (!spawnPoint) return;
        if (dist(this.player.x, this.player.y, spawnPoint.x, spawnPoint.y) < 200) {
            this.greenKnightSpawned = true;
            this.greenKnight = new GreenKnight(spawnPoint.x, spawnPoint.y);
            this.greenKnight.spawn();
            this.sound.bossRoar();

            this.ui.showDialog("The ground trembles as a towering figure in green armor emerges...");
            this.ui.showDialog("\"I am The Green Knight! You dare enter my domain, Ingoizer? Prepare yourself!\"");
            this.ui.showDialog("The battle for the Green Knight's Domain begins!");
        }
    }

    checkZone() {
        if (this.inCave) {
            if (this.currentZone !== "cave") {
                this.currentZone = "cave";
                this.zoneDisplayTimer = 3000;
            }
        } else if (this.inSky) {
            if (this.currentZone !== "sky") {
                this.currentZone = "sky";
                this.zoneDisplayTimer = 3000;
            }
        } else {
            const tile = worldToTile(this.player.x, this.player.y);
            const zone = getZoneAt(tile.x, tile.y);
            if (zone !== this.currentZone) {
                this.currentZone = zone;
                if (zone !== "wilderness" && ZONES[zone]) {
                    this.zoneDisplayTimer = 3000;
                }
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

        // Clamp camera (use correct world dimensions)
        const worldW = this.inCave ? CAVE_W : (this.inSky ? SKY_W : WORLD_W);
        const worldH = this.inCave ? CAVE_H : (this.inSky ? SKY_H : WORLD_H);
        this.camera.x = clamp(this.camera.x, 0, worldW * TILE_SIZE - CANVAS_W);
        this.camera.y = clamp(this.camera.y, 0, worldH * TILE_SIZE - CANVAS_H);
    }

    render() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

        if (this.state !== "playing" && this.state !== "gameover") return;

        // Render world (cave, sky or surface)
        if (this.inCave && this.caveWorlds[this.activeCaveId]) {
            this.caveWorlds[this.activeCaveId].render(ctx, this.camera, this.time);
        } else if (this.inSky) {
            this.skyWorld.render(ctx, this.camera, this.time);
        } else {
            this.world.render(ctx, this.camera, this.time);
        }

        // Render monsters (sorted by Y for depth)
        const renderables = [];
        const renderMonsters = this.inCave ? this.caveMonsters : (this.inSky ? this.skyMonsters : this.monsters);
        for (const m of renderMonsters) {
            if (m.alive || m.deathTimer > 0) {
                renderables.push({ y: m.y, render: () => m.render(ctx, this.camera, this.time) });
            }
        }

        // Player
        renderables.push({ y: this.player.y, render: () => this.player.render(ctx, this.camera, this.time) });

        // Wild animals (surface only) and companions
        if (!this.inCave) {
            for (const a of this.wildAnimals) {
                renderables.push({ y: a.y, render: () => a.render(ctx, this.camera, this.time) });
            }
        }
        for (const c of this.companions) {
            renderables.push({ y: c.y, render: () => c.render(ctx, this.camera, this.time) });
        }

        // Boss (surface)
        if (this.onSurface && this.boss && this.boss.spawned) {
            renderables.push({ y: this.boss.y, render: () => this.boss.render(ctx, this.camera, this.time) });
        }

        // Cave Boss
        if (this.inCave && this.caveBoss && this.caveBoss.spawned) {
            renderables.push({ y: this.caveBoss.y, render: () => this.caveBoss.render(ctx, this.camera, this.time) });
        }

        // Green Knight (surface only)
        if (this.onSurface && this.greenKnight && this.greenKnight.spawned) {
            renderables.push({ y: this.greenKnight.y, render: () => this.greenKnight.render(ctx, this.camera, this.time) });
        }

        // The Olympian (Cloudlands only)
        if (this.inSky && this.olympianBoss && this.olympianBoss.spawned) {
            renderables.push({ y: this.olympianBoss.y, render: () => this.olympianBoss.render(ctx, this.camera, this.time) });
        }

        // Sort by Y and render
        renderables.sort((a, b) => a.y - b.y);
        for (const r of renderables) {
            r.render();
        }

        // Render combat effects (on top)
        this.combat.render(ctx, this.camera, this.time);

        // Zone display
        if (this.zoneDisplayTimer > 0) {
            const zoneName = this.currentZone === "cave" ? "The Caves Below"
                : this.currentZone === "sky" ? "The Cloudlands"
                : (ZONES[this.currentZone] ? ZONES[this.currentZone].name : null);
            if (zoneName) {
                const alpha = Math.min(1, this.zoneDisplayTimer / 500);
                ctx.save();
                ctx.globalAlpha = alpha;
                this.ui.showZoneName(ctx, zoneName);
                ctx.restore();
            }
        }

        // Render fountain of youth marker when nearby
        if (this.onSurface && this.world.fountainOfYouth) {
            const f = this.world.fountainOfYouth;
            const fx = f.x - this.camera.x;
            const fy = f.y - this.camera.y;
            if (fx > -30 && fx < CANVAS_W + 30 && fy > -30 && fy < CANVAS_H + 30) {
                const glow = Math.sin(this.time * 0.003) * 0.2 + 0.5;
                ctx.save();
                ctx.fillStyle = `rgba(100, 200, 255, ${glow})`;
                ctx.beginPath();
                ctx.arc(fx, fy, 18, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = "#fff";
                ctx.font = "16px monospace";
                ctx.textAlign = "center";
                ctx.fillText("⛲", fx, fy + 5);
                ctx.restore();
            }
        }

        // Interaction prompts
        const isMobile = this.touchControls.active;
        if (this.nearCaveEntrance && this.onSurface) {
            this.ui.renderInteractionPrompt(ctx, isMobile ? "Tap ACT to enter cave" : "Press E to enter cave");
        } else if (this.nearSkyLadder && this.onSurface) {
            this.ui.renderInteractionPrompt(ctx, isMobile ? "Tap ACT to climb to the Cloudlands" : "Press E to climb to the Cloudlands");
        } else if (this.nearSkyExit && this.inSky) {
            this.ui.renderInteractionPrompt(ctx, isMobile ? "Tap ACT to climb down" : "Press E to climb back down");
        } else if (this.nearCaveExit && this.inCave) {
            this.ui.renderInteractionPrompt(ctx, isMobile ? "Tap ACT to climb out" : "Press E to climb out");
        } else if (this.nearShop) {
            this.ui.renderInteractionPrompt(ctx, isMobile ? "Tap ACT to enter shop" : "Press E to enter shop");
        } else if (this.nearLady) {
            this.ui.renderInteractionPrompt(ctx, isMobile ? "Tap ACT to speak with the Lady" : "Press E to speak with the Lady of the Lake");
        } else if (this.nearMerlin) {
            this.ui.renderInteractionPrompt(ctx, isMobile ? "Tap ACT to speak with Merlin" : "Press E to speak with Merlin");
        } else if (this.nearMerlinHut) {
            this.ui.renderInteractionPrompt(ctx, isMobile ? "Tap ACT to enter hut" : "Press E to read ancient lore");
        } else if (this.nearFountain) {
            this.ui.renderInteractionPrompt(ctx, isMobile ? "Tap ACT for Fountain" : "Press E for Fountain of Youth");
        } else if (this.nearAnimal) {
            const verb = this.player.apples > 0
                ? `feed an apple to the ${this.nearAnimal.name} (${APPLE_ITEM.icon} ${this.player.apples})`
                : `tame the ${this.nearAnimal.name} - you need an apple!`;
            this.ui.renderInteractionPrompt(ctx, (isMobile ? "Tap ACT to " : "Press E to ") + verb);
        }

        // Render cave / sky exit labels
        if (this.inCave && this.caveWorlds[this.activeCaveId]) {
            this.caveWorlds[this.activeCaveId].renderExitLabels(ctx, this.camera, this.time);
        } else if (this.inSky) {
            this.skyWorld.renderExitLabels(ctx, this.camera, this.time);
        }

        // Render minimap
        if (this.inCave && this.caveWorlds[this.activeCaveId]) {
            this.caveWorlds[this.activeCaveId].renderMinimap(this.minimapCtx, this.player, this.caveMonsters, this.caveBoss);
        } else if (this.inSky) {
            this.skyWorld.renderMinimap(this.minimapCtx, this.player, this.skyMonsters, this.olympianBoss);
        } else {
            this.world.renderMinimap(this.minimapCtx, this.player, this.monsters, this.boss, this.greenKnight, this.companions);
        }

        // Render world map if open
        if (this.ui.isMapOpen()) {
            if (this.inCave && this.caveWorlds[this.activeCaveId]) {
                this.caveWorlds[this.activeCaveId].renderWorldMap(this.worldmapCtx, this.player);
            } else if (this.inSky) {
                this.skyWorld.renderWorldMap(this.worldmapCtx, this.player);
            } else {
                this.world.renderWorldMap(this.worldmapCtx, this.player);
            }
            const mapHint = document.querySelector(".map-hint");
            if (mapHint) {
                mapHint.textContent = isMobile ? "Tap MAP to close" : "Press M to close";
            }
        }

        // Cave boss approaching warning
        if (this.inCave && this.caveWorlds[this.activeCaveId]) {
            const caveWorld = this.caveWorlds[this.activeCaveId];
            if (caveWorld.bossSpawnTile && !this.caveBossSpawned[this.activeCaveId] && !this.caveBossDefeated[this.activeCaveId]) {
                const bossPos = tileToWorld(caveWorld.bossSpawnTile.x, caveWorld.bossSpawnTile.y);
                const d = dist(this.player.x, this.player.y, bossPos.x, bossPos.y);
                if (d < 400 && d > 200) {
                    ctx.save();
                    ctx.fillStyle = `rgba(150, 100, 200, ${0.3 + Math.sin(this.time * 0.005) * 0.15})`;
                    ctx.font = "bold 18px monospace";
                    ctx.textAlign = "center";
                    ctx.fillText("The ground trembles with ancient power...", CANVAS_W / 2, 80);
                    ctx.restore();
                }
            }
        }

        // Cloudlands progress / Olympian approach warning
        if (this.inSky) {
            if (this.olympianSummoned && !this.olympianSpawned && !this.olympianDefeated && this.skyWorld.bossSpawnTile) {
                const tp = tileToWorld(this.skyWorld.bossSpawnTile.x, this.skyWorld.bossSpawnTile.y);
                const td = dist(this.player.x, this.player.y, tp.x, tp.y);
                ctx.save();
                ctx.textAlign = "center";
                if (td < 480 && td > 240) {
                    ctx.fillStyle = `rgba(255, 238, 100, ${0.45 + Math.sin(this.time * 0.005) * 0.2})`;
                    ctx.font = "bold 18px monospace";
                    ctx.fillText("The temple is burning with light...", CANVAS_W / 2, 80);
                } else if (td >= 480) {
                    ctx.fillStyle = "rgba(255, 238, 100, 0.55)";
                    ctx.font = "13px monospace";
                    ctx.fillText("The Temple of Olympus is waiting — check the map (M)", CANVAS_W / 2, 80);
                }
                ctx.restore();
            }
        }

        // Green Knight approaching warning
        if (this.onSurface && this.greenlandsUnlocked && !this.greenKnightSpawned && !this.greenKnightDefeated
            && this.player.greenGemAttack && this.player.greenGemDefense && this.world.greenBossSpawnPoint) {
            const gp = this.world.greenBossSpawnPoint;
            const gd = dist(this.player.x, this.player.y, gp.x, gp.y);
            if (gd < 400 && gd > 200) {
                ctx.save();
                ctx.fillStyle = `rgba(0, 200, 0, ${0.3 + Math.sin(this.time * 0.005) * 0.15})`;
                ctx.font = "bold 18px monospace";
                ctx.textAlign = "center";
                ctx.fillText("You sense a powerful presence within the castle...", CANVAS_W / 2, 80);
                ctx.restore();
            }
        }

        // Boss approaching warning (surface only)
        if (this.onSurface && this.player.blueGems >= 5 && !this.bossSpawned && !this.bossDefeated) {
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
    window.game = new Game();
});
