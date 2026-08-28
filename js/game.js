Warning: truncated output (original token count: 42104)
Total output lines: 3710

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

        // Keeping the drawing surface the same shape as its box is what stops
        // the picture stretching, and phone browsers cannot be trusted to
        // announce a size change in time - on some devices orientationchange
        // arrives before the new dimensions do. A ResizeObserver fires after
        // layout, whatever the cause, and the loop re-checks a few times a
        // second in case even that is missed.
        this.lastViewportCheck = 0;
        this.resizeViewport();
        if (typeof ResizeObserver !== "undefined") {
            new ResizeObserver(() => this.resizeViewport()).observe(this.canvas.parentElement);
        }
        window.addEventListener("resize", () => this.resizeViewport());
        window.addEventListener("orientationchange", () => this.resizeViewport());
        // A hidden tab stops asking for frames, so nothing would ever turn the
        // Clubhouse music off again. Take the needle off here; the first frame
        // back puts it down again if Ingoizer is still standing in the room.
        document.addEventListener("visibilitychange", () => {
            if (!document.hidden) return;
            this.clubMusicOn = false;
            this.sound.stopClubMusic();
        });

        this.running = false;
        this.frameRequestId = null;
        this.loopGeneration = 0;
        this.paused = false;
        this.lastTime = 0;
        this.time = 0;
        this.engagedPlayTime = 0;
        this.lastMinimapRender = 0;
        this.minimapDirty = true;
        this.minimapStateSignature = "";

        // Input
        this.keys = {
            up: false, down: false, left: false, right: false,
            attack: false, interact: false, map: false,
        };
        this.keyJustPressed = {};

        // Game state
        this.state = "title"; // title, playing, gameover
        this.world = null;
        // Seeds the blue gems' hiding places. Written into every save so a
        // loaded game finds them exactly where it left them.
        this.gemSeed = null;
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
        this.nearMakersHollow = false;
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
        this.skyTreeHintGiven = false;
        this.skyTreeApproachSeen = false;

        // Charting the whole surface is an achievement, and it is announced once.
        this.surfaceCharted = false;

        // Fountain of Youth - the Lady of the Lake's second water
        this.nearFountain = false;
        this.fountainCooldownUntil = 0;
        this.fountainRiddleState = null; // { riddles, currentIndex, onComplete }
        this.fountainIntroShown = false;

        // The tapestry in Ing Castle's great hall - the Black Knight's family
        // tree, and Ingoizer's. Readable only once the Black Knight has fallen.
        this.nearTapestry = false;
        this.tapestryRead = false;

        // The Worldtree Seed and the peace it can buy with Zeus
        this.nearSapling = null;
        this.nearUprootable = null;
        this.worldtreeRestored = false;
        this.zeusAppeased = false;
        this.zeusMetInPeace = false;
        // How many times the seed has been pushed into ground that would not
        // have it. Each miss buys a plainer clue about where the plot is.
        this.seedPlantAttempts = 0;
        // Whether the planting now in the ground went into the old ash - read
        // when it finishes growing, so the ash can be answered by name.
        this.plantedInAsh = false;

        // Lore entries whose spoilers have been earned in the world
        this.loreUnlocks = {};

        // Animal companions
        this.wildAnimals = [];      // untamed critters roaming the surface
        this.companions = [];       // tamed animals following the player
        this.animalSpawnTimer = 0;
        this.nearAnimal = null;
        this.firstTameShown = false;

        // The Clubhouse - what the Green Knight's castle becomes once a full
        // pack of five walks it in. Permanent once earned; the housewarming
        // hit points are handed over exactly once.
        this.clubhouseUnlocked = false;
        this.clubhouseBoonTaken = false;
        this.insideClubhouse = false;
        this.clubGuestTimer = 0;
        this.clubMusicOn = false;

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
        this.ladyQuestAsked = false;  // did she ever set the errand herself?

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

    // Match the drawing surface to the shape of the window. The height never
    // moves, so nothing changes size on screen - a wider window simply shows
    // more ground to left and right, and hands the overlay screens and the
    // thumb controls the room they were letterboxing away.
    resizeViewport() {
        const host = this.canvas.parentElement;
        const rect = host.getBoundingClientRect();
        // Measured first, and every time: the minimap is a DOM panel laid over
        // the canvas, so a height-only resize or a media query changing its
        // scale moves it without CANVAS_W budging an inch.
        this.measureMinimapFootprint();
        const width = canvasWidthForAspect(rect.height > 0 ? rect.width / rect.height : 0);
        if (width === CANVAS_W && this.canvas.width === width) return;

        CANVAS_W = width;
        TILES_X = Math.ceil(CANVAS_W / TILE_SIZE) + 2;
        this.canvas.width = CANVAS_W;
        this.canvas.height = CANVAS_H;
        this.minimapDirty = true;
        applyViewSight();

        // Ground that just came into view should chart on the next frame, not
        // wait for the player to step onto a new tile.
        for (const fog of this.allFogs()) fog.lastTile = null;
        if (this.player && this.state === "playing") this.snapCamera();
    }

    // Where the minimap panel sits, in canvas pixels rather than CSS ones, so
    // the render loop can ask "is the player behind it?" without touching the
    // layout. Null whenever the panel is not on screen to be measured.
    measureMinimapFootprint() {
        this.minimapFootprint = null;
        const panel = this.minimapPanel || (this.minimapPanel = document.getElementById("minimap-container"));
        if (!panel || !this.canvas) return;
        const c = this.canvas.getBoundingClientRect();
        const m = panel.getBoundingClientRect();
        if (c.width <= 0 || c.height <= 0 || m.width <= 0) return;
        const sx = CANVAS_W / c.width;
        const sy = CANVAS_H / c.height;
        this.minimapFootprint = {
            left: (m.left - c.left) * sx,
            right: (m.right - c.left) * sx,
            top: (m.top - c.top) * sy,
            bottom: (m.bottom - c.top) * sy,
        };
    }

    // Fade the minimap down while Ingoizer is standing behind it. Walking into
    // a corner of a world clamps the camera, which parks him - and whatever
    // landmark he came to see - under the panel; this hands the view back
    // without taking the map away, and it fades straight back in on the way out.
    updateMinimapShyness() {
        // Runs every frame, so it holds on to the element and only touches the
        // DOM on the frame the answer actually changes.
        const panel = this.minimapPanel;
        if (!panel) return;
        const box = this.minimapFootprint;

        let shy = false;
        if (box && this.player && this.state === "playing" && !this.ui.isMapOpen()) {
            const pad = MINIMAP_LAYOUT.shy;
            const px = this.player.x - this.camera.x;
            const py = this.player.y - this.camera.y;
            shy = px > box.left - pad.padX && px < box.right + pad.padX
                && py > box.top - pad.padTop && py < box.bottom + pad.padBottom;
        }
        if (shy === this._minimapShy) return;
        this._minimapShy = shy;
        panel.classList.toggle("minimap-shy", shy);
    }

    allFogs() {
        const fogs = [];
        if (this.world) fogs.push(this.world.fog);
        if (this.skyWorld) fogs.push(this.skyWorld.fog);
        for (const id of Object.keys(this.caveWorlds || {})) {
            const cave = this.caveWorlds[id];
            if (cave) fogs.push(cave.fog);
        }
        return fogs.filter(Boolean);
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
            "KeyP": "plant",
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

        // The minimap is also the way into the world map, on every device.
        // Touch has its own handler in touch.js so a tap never fires twice.
        const minimap = this.minimapCanvas.parentElement;
        if (minimap) {
            minimap.addEventListener("click", () => {
                if (this.state !== "playing") return;
                this.keyJustPressed.map = true;
            });
            minimap.addEventListener("keydown", (e) => {
                if (e.key !== "Enter" && e.key !== " ") return;
                e.preventDefault();
                if (this.state !== "playing") return;
                this.keyJustPressed.map = true;
            });
        }
    }

    // Build a complete, playable game from nothing. Both a new adventure and a
    // loaded save come through here first - a load is this followed by an
    // overlay of what the save remembers, which is what lets a save that
    // predates a feature simply inherit that feature's fresh defaults.
    resetState(gemSeed) {
        this.state = "playing";
        this.minimapDirty = true;
        this.lastMinimapRender = 0;
        this.minimapStateSignature = "";
        this.engagedPlayTime = 0;
        this.sound.init();
        this.resizeViewport();
        this.world = new World(gemSeed);
        this.gemSeed = this.world.gemSeed;
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

        // The Clubhouse is not built yet, and the party has not started
        this.clubhouseUnlocked = false;
        this.clubhouseBoonTaken = false;
        this.insideClubhouse = false;
        this.clubGuestTimer = 0;
        this.clubMusicOn = false;
        this.sound.stopClubMusic();

        // Boss (not yet spawned)
        this.boss = new Boss(this.world.bossSpawnPoint.x, this.world.bossSpawnPoint.y);
        this.bossSpawned = false;
        this.bossDefeated = false;
        this.monsterGemDrops = 0;

        // Sheath Guardian Troll
        this.sheathTroll = null;
        this.ladyQuestState = "none";
        this.ladyQuestAsked = false;
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
        this.nearMakersHollow = false;
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
        this.skyTreeHintGiven = false;
        this.skyTreeApproachSeen = false;

        // Charting the whole surface is an achievement, and it is announced once.
        this.surfaceCharted = false;

        // Fountain of Youth
        this.nearFountain = false;
        this.fountainCooldownUntil = 0;
        this.fountainRiddleState = null;
        this.fountainIntroShown = false;

        // Castle tapestry and the Worldtree Seed
        this.nearTapestry = false;
        this.tapestryRead = false;
        this.nearSapling = null;
        this.nearUprootable = null;
        this.worldtreeRestored = false;
        this.zeusAppeased = false;
        this.zeusMetInPeace = false;
        this.seedPlantAttempts = 0;
        this.plantedInAsh = false;
        this.loreUnlocks = {};

        this.ui.showHud();
    }

    startGame() {
        GameAnalytics.track("game-start");
        this.sound.menuSelect();
        this.resetState();
        this.beginLoop();

        // Welcome dialog
        this.ui.showDialog("Welcome, Ingoizer! You awaken in the Green Meadow with a rusty sword and bow.");
        this.ui.showDialog("Seek the 5 Blue Gems scattered across the land. Defeat monsters and explore to find them.");
        this.ui.showDialog("Once you have all 5 gems, journey to Ing Castle where a dark foe awaits...");
        if (this.touchControls.active) {
            this.ui.showDialog("Use the joystick to move. The buttons on the right show what they do: your sword attacks, your bow shoots, the power symbol casts, and the last one acts on whatever you are standing next to.");
        } else {
            this.ui.showDialog("Press SPACE to attack, R to shoot arrows. Unlock Fire power to ignite your arrows!");
        }
        this.ui.showDialog("Harmless animals roam the land. Feed one an apple to tame it and it will fight at your side - up to 5 at a time. You start with 2 apples; find more in the wild or buy them at any shop.");
    }

    beginLoop() {
        this.stopLoop();
        this.running = true;
        const generation = ++this.loopGeneration;
        this.lastTime = performance.now();
        this.frameRequestId = requestAnimationFrame((t) => this.gameLoop(t, generation));
    }

    stopLoop() {
        this.running = false;
        this.loopGeneration++;
        if (this.frameRequestId !== null) {
            cancelAnimationFrame(this.frameRequestId);
            this.frameRequestId = null;
        }
    }

    // ============================================
    // Saved games
    // ============================================

    saveToSlot(slot) {
        if (this.state !== "playing" || !this.player) return false;
        const snapshot = SaveSystem.capture(this);
        const ok = SaveSystem.write(slot, snapshot);
        // Whoever asked for the save says so - the pause menu writes the result
        // into its own panel, so a notification here would only say it twice.
        if (ok) this.sound.menuSelect();
        return ok;
    }

    loadFromSlot(slot) {
        const data = SaveSystem.read(slot);
        if (!data) {
            this.ui.showNotification("That slot has nothing to load");
            return false;
        }

        this.stopLoop();
        this.ui.hideBossHealth();
        this.ui.closeMenus();
        GameAnalytics.track("game-load");
        this.sound.menuSelect();

        // A fresh game on the save's own seed, then the save laid over the top.
        this.resetState(data.world && data.world.gemSeed);
        SaveSystem.restore(this, data);

        // The pack follows the player rather than standing where they were
        // when the game was last written.
        this.gatherCompanions();
        this.snapCamera();
        this.zoneDisplayTimer = 3000;
        this.ui.updateHud(this.player);

        document.getElementById("title-screen").classList.add("hidden");
        this.beginLoop();
        return true;
    }

    restart() {
        this.stopLoop();
        this.ui.closeMenus();
        this.ui.hideBossHealth();
        this.ui.hideHud();
        this.ladyQuestState = "none";
        this.ladyQuestAsked = false;
        this.merlinQuestState = "none";
        this.state = "title";
        document.getElementById("title-screen").classList.remove("hidden");
        this.ui.refreshContinue();
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
                        if (!this.world.blocksMonster(tx, ty)) {
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
                    if (!this.world.blocksMonster(tx, ty)) {
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
                    if (!this.world.blocksMonster(tx, ty)) {
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

        // Companions fight alongside the player in every realm - overworld,
        // caves and the Cloudlands
        for (const companion of this.companions) {
            const hits = companion.update(dt, this.player, activeWorld, hostiles, this.combat);
            for (const hit of hits) {
                this.sound.monsterHit();
                if (hit.killed) {
                    const isBoss = hit.target === activeBoss || hit.target === activeGreenKnight;
                    this.onEntityKilled(hit.target, isBoss);
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

        // Wild animals only roam the overworld - not the caves, not the Cloudlands
        if (!this.onSurface) return;
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

    // ============================================
    // The Clubhouse
    // ============================================
    //
    // The Green Knight is beaten and his castle is standing empty. Walk back to
    // it with a full pack of five animals at your heel and they take it off
    // your hands: the green comes off the walls, the floor lights up, the music
    // starts, and every animal for miles lets itself in. Nothing hostile ever
    // does. Step through the door the first time and the place makes you at
    // home the only way it knows how - thirty more hit points, for good.

    updateClubhouse(dt) {
        if (!this.onSurface) {
            this.setInsideClubhouse(false);
            return;
        }
        if (!this.clubhouseUnlocked) {
            this.checkClubhouseTrigger();
            return;
        }
        // A save that remembers the party but not the building - rebuild it.
        if (!this.world.clubhouse) this.world.openClubhouse();

        this.updateClubGuests(dt);
        this.setInsideClubhouse(this.world.inClubhouse(this.player.x, this.player.y));

        // An animal tamed in the middle of the party joins in like everyone else.
        if (this.insideClubhouse) {
            for (const c of this.companions) c.dancing = true;
        }
    }

    // Five animals, one dead Green Knight, and his own front gate.
    checkClubhouseTrigger() {
        if (!this.greenKnightDefeated || !this.world.greenCastleBuilt) return;
        if (this.aliveCompanionCount() < CLUBHOUSE.companionsNeeded) return;
        const gate = this.world.greenKnightCastle;
        if (!gate) return;
        if (dist(this.player.x, this.player.y, gate.x, gate.y) > CLUBHOUSE.approachRange) return;
        this.openClubhouse();
    }

    openClubhouse() {
        if (this.clubhouseUnlocked) return;
        const club = this.world.openClubhouse();
        if (!club) return;

        this.clubhouseUnlocked = true;
        this.clubGuestTimer = 0;
        GameAnalytics.track("clubhouse-opened");
        this.sound.clubhouseFanfare();
        this.ui.showNotification("\u2605 The Clubhouse is open! \u2605");

        // Read the pack back by name. Five of the same animal is a legal pack,
        // so the roll-call is de-duplicated before it is read out.
        const pack = [...new Set(this.companions.filter(c => c.alive).map(c => c.name.toLowerCase()))];
        const roll = pack.length > 1
            ? `${pack.slice(0, -1).join(", ")} and ${pack[pack.length - 1]}`
            : (pack[0] || "the pack");

        this.ui.showDialog(
            "Five animals reach the gate ahead of you and stop, all together, looking up at it. " +
            "Then they go in.", () => {
                this.ui.showDialog(
                    `Something in the building gives up being a castle. The green washes off the walls in long bright ` +
                    `streaks; the flagstones come up lit from underneath; a mirrorball none of you brought turns slowly ` +
                    `over the middle of the floor. Bunting runs itself along the battlements. Somewhere a very good song starts.`, () => {
                        this.ui.showDialog(
                            `Your ${roll} are already dancing. The doorway is knocked wide enough for the lot of you ` +
                            `and there is a sign over it that nobody had time to paint: THE CLUBHOUSE. Everyone welcome. No monsters.`, () => {
                                this.ui.showDialog(
                                    "Nothing with teeth will come through that door again - the whole building is warded " +
                                    "like the Lady's water. Go inside whenever the world gets loud.");
                            });
                    });
            });
    }

    // Turning the party on and off around Ingoizer.
    setInsideClubhouse(inside) {
        const next = !!inside;
        if (next === this.insideClubhouse) return;
        this.insideClubhouse = next;

        // The pack dances with him, and gets back to work when he leaves.
        for (const c of this.companions) {
            c.dancing = next;
            c.danceSpot = null;
            c.danceTimer = randFloat(0, 900);
        }

        if (next) this.onEnterClubhouse();
    }

    onEnterClubhouse() {
        this.sound.partyCheer();

        if (!this.clubhouseBoonTaken) {
            this.clubhouseBoonTaken = true;
            this.player.maxHp += CLUBHOUSE.maxHpBonus;
            this.player.hp = Math.min(this.player.hp + CLUBHOUSE.maxHpBonus, this.player.maxHp);
            GameAnalytics.track("clubhouse-entered");
            this.ui.showNotification(`\u2605 Welcome to the Clubhouse! (+${CLUBHOUSE.maxHpBonus} Max HP)`);
            this.ui.showDialog(
                "The room turns round to look at you and then cheers, all of it at once. A paper crown has been put on " +
                "the biggest animal in the room and nobody will say who did it. You are handed food you cannot identify " +
                "and it is wonderful.", () => {
                    this.ui.showDialog(
                        `You leave the door a good deal harder to knock over than you came in: +${CLUBHOUSE.maxHpBonus} maximum health, ` +
                        `for the rest of the story.`);
                });
        } else {
            this.ui.showNotification("\u266a The party is still going \u266b");
        }
    }

    // Animals hear about the place and turn up. They arrive at the door, walk
    // in, and dance until somebody stops them, which nobody does.
    updateClubGuests(dt) {
        const club = this.world.clubhouse;
        if (!club) return;

        // Only worth populating when there is somebody there to see it.
        if (dist(this.player.x, this.player.y, club.x, club.y) > 700) return;

        const guests = this.wildAnimals.filter(a => a.alive && a.partyGuest).length;
        if (guests >= CLUBHOUSE.guests) return;

        this.clubGuestTimer -= dt;
        if (this.clubGuestTimer > 0) return;
        this.clubGuestTimer = CLUBHOUSE.guestSpawnDelay;
        this.spawnClubGuest(club, guests);
    }

    spawnClubGuest(club, existing) {
        const types = Object.keys(ANIMAL_TYPES);
        const type = types[randInt(0, types.length - 1)];

        // In at the door, in a loose queue, so they read as arriving.
        const guest = new Animal(type, club.doorX + randFloat(-26, 26), club.doorY + randFloat(6, 40));
        guest.homeZone = "clubhouse";
        guest.partyGuest = true;
        guest.dancing = true;
        guest.danceHome = { x: club.x, y: club.y, r: CLUBHOUSE.danceRadius };
        guest.danceTimer = 0;
        this.wildAnimals.push(guest);

        // A cheer as the room notices the new arrival - not for every single one.
        if (existing % 3 === 0) this.sound.partyCheer();
    }

    // The record player. Driven from the frame rather than from the door, so
    // pausing, dying, loading and quitting all stop it without each having to
    // remember to.
    syncClubMusic() {
        const wanted = this.state === "playing" && !this.paused && this.insideClubhouse;
        if (wanted === this.clubMusicOn) return;
        this.clubMusicOn = wanted;
        if (wanted) this.sound.startClubMusic();
        else this.sound.stopClubMusic();
    }

    gameLoop(timestamp, generation) {
        if (!this.running || generation !== this.loopGeneration) return;
        this.frameRequestId = null;

        const dt = Math.min(timestamp - this.lastTime, 50); // Cap delta
        this.lastTime = timestamp;
        this.time = timestamp;

        if (timestamp - this.lastViewportCheck > 250) {
            this.lastViewportCheck = timestamp;
            this.resizeViewport();
        }

        // Closing the pause menu has to be handled out here: update() is what
        // reads the key, and update() is exactly what pausing stops.
        if (this.state === "playing" && this.paused && this.keyJustPressed.pause) {
            if (this.ui.isSlotsOpen()) this.ui.closeSlots();
            else if (this.ui.isControlsOpen()) this.ui.closeControls();
            else if (this.ui.isPauseOpen()) this.ui.closePause();
            this.keyJustPressed.pause = false;
        }

        if (this.state === "playing" && !this.paused) {
            this.update(dt);
        }

        // The party plays while Ingoizer is standing in it, and only then -
        // pausing, dying, going down a cave or walking back out of the door all
        // put the needle back on the shelf.
        this.syncClubMusic();

        // The on-screen buttons wear what they will do, so they are repainted
        // from the same state the frame is drawn from.
        this.touchControls.syncButtons();

        this.render();

        // Clear just-pressed keys
        this.keyJustPressed = {};

        if (this.running && generation === this.loopGeneration) {
            this.frameRequestId = requestAnimationFrame((t) => this.gameLoop(t, generation));
        }
    }

    update(dt) {
        // Apply touch controls input
        this.touchControls.applyInput();

        // Don't update during dialogs, menus
        const inMenu = this.ui.isMapOpen() || this.ui.isShopOpen() || this.ui.isInventoryOpen() || this.ui.dialogActive || this.ui.isRiddleOpen() || this.ui.isEnchantOpen() || this.ui.isLoreOpen() || this.ui.isAboutOpen() || this.ui.isGameOverOpen();

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
        // Either key climbs back up out of the hollow.
        if (this.ui.isAboutOpen() && (this.keyJustPressed.pause || this.keyJustPressed.interact)) {
            this.ui.closeAbout();
            this.sound.menuSelect();
            return;
        }
        if (this.keyJustPressed.pause) {
            if (this.ui.isShopOpen()) this.ui.closeShop();
            else if (this.ui.isInventoryOpen()) this.ui.closeInventory();
            else if (this.ui.isMapOpen()) this.ui.toggleMap();
            else if (this.ui.isEnchantOpen()) this.ui.closeEnchant();
            else if (this.ui.isLoreOpen()) this.ui.closeLore();
            else if (this.ui.isPauseOpen()) this.ui.closePause();
            else this.ui.openPause();
        }

        if (inMenu) return;

        this.engagedPlayTime += dt;
        if (this.engagedPlayTime >= 5 * 60 * 1000) {
            GameAnalytics.track("engaged-5-minutes");
        }

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

        // Chart whatever can be seen from where the player now stands. The
        // sweep only runs when they step onto a new tile.
        if (activeWorld.fog) {
            activeWorld.fog.revealAround(this.player.x, this.player.y, (tx, ty) => activeWorld.blocksSight(tx, ty));
            if (this.onSurface) this.checkSurfaceCharted();
        }

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

        // P plants the seed where you stand, and takes it back out again: at a
        // Worldtree that never took, the same key lifts the whole tree.
        // (The inventory relic shelf offers both, which is the phone route.)
        if (this.keyJustPressed.plant) {
            if (this.player.hasWorldtreeSeed) {
                this.plantWorldtreeSeed();
            } else if (this.nearUprootable) {
                this.uprootSapling();
            }
        }

        // Interaction check
        if (this.keyJustPressed.interact) {
            this.handleInteraction();
        }

        // Update monsters (surface or cave). Monsters hunt the pack as well as
        // Ingoizer, so they need to know who is walking at his heel.
        const pack = this.companions.filter(c => c.alive);
        for (const monster of activeMonsters) {
            const result = monster.update(dt, this.player, activeWorld, pack);
            if (result && result.type === "companionHit") {
                this.combat.addDamageNumber(result.companion.x, result.companion.y, result.damage, false);
                this.sound.monsterAttack();
            }
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
        this.checkMakersHollow();
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
        if (this.onSurface) for (const apple of this.world.apples) {
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
            if (this.world.updateSkyTree(dt)) this.onWorldtreeBurned();
            if (this.world.updateSapling(dt)) this.onWorldtreeGrown();
            if (this.skyTreeHintCooldown > 0) this.skyTreeHintCooldown -= dt;
        …12104 tokens truncated…worldY) < CAVE_ENTRANCE_RANGE) {
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
            if (this.tapestryRead) {
                // The player has read the tapestry and knows exactly who this is.
                this.ui.showDialog(`"So you found the hall, and you found the weaving, and you came down here anyway."`);
                this.ui.showDialog(`"Cousin. My brothers and I cut every one of these tunnels with our own hands, because down here there is no sun and no sky and nobody to tell us what our name means. You killed our father. Get out of our dark."`);
            } else {
                this.ui.showDialog(`"You brought daylight in with you. We dug all four of these caves to be rid of it."`);
                this.ui.showDialog(`"None shall plunder my domain!"`);
            }
        }
    }

    // Mark a spoiler lore entry earned. It appears on Merlin's shelf from here on.
    unlockLore(key) {
        if (this.loreUnlocks[key]) return false;
        this.loreUnlocks[key] = true;
        return true;
    }

    // The great hall, after the Black Knight. The drape he hung over the north
    // wall comes down and the family tree underneath turns out to be Ingoizer's
    // own - which makes the man he has just killed his uncle.
    readCastleTapestry() {
        this.sound.menuSelect();
        if (this.tapestryRead) {
            this.ui.showDialog(
                "\"Ingoizer\" is stitched across the top of the tapestry in gold thread, once, over all of it. " +
                "Your uncle's branch is still there beside your father's. Nobody has cut it out."
            );
            return;
        }

        this.tapestryRead = true;
        GameAnalytics.track("tapestry-read");
        this.unlockLore("tapestry");

        this.ui.showDialog(
            "The great hall is quiet now. The black drape over the north wall slides off its rail and lands in a heap, " +
            "and what it was hiding is a tapestry: a family tree, woven generations ago.",
            () => {
                this.ui.showDialog(
                    "You know it. You have had the same names recited at you since you could walk \u2014 the same branches, " +
                    "in the same order, ending at the same place. It is the tree of the house of Ingoizer. It is yours.",
                    () => {
                        this.ui.showDialog(
                            "Beside your father there is a brother. Nobody ever spoke of him. He is the man lying in black armour " +
                            "on the flagstones behind you. The Black Knight was your uncle.",
                            () => {
                                this.ui.showDialog(
                                    "He read the family name as a curse and walked out to find a better fate. You read it as a promise " +
                                    "and stayed. That is the whole of the difference between you.",
                                    () => {
                                        this.ui.showDialog(
                                            "The tapestry does not end with him. Below his name is a row of sons \u2014 your cousins. " +
                                            "The Green Knight in the southern woods. The wardens who dug the caves. " +
                                            "Every one of them is family, and every one of them is still refusing the name.",
                                            () => {
                                                this.ui.showNotification("\ud83e\uddf5 The truth of the Black Knight is written in Merlin's lore.");
                                            }
                                        );
                                    }
                                );
                            }
                        );
                    }
                );
            }
        );
    }

    // Every chest that should be on screen right now, with the state of its
    // lid. Maze caves keep theirs in the middle; boss caves keep theirs behind
    // the guardian, shut until he falls.
    visibleChests() {
        if (!this.inCave) return [];
        const caveWorld = this.caveWorlds[this.activeCaveId];
        if (!caveWorld) return [];
        const chests = [];
        if (caveWorld.treasurePos) {
            // Nudged a tile clear of the centre exit so the chest and the
            // ladder out of the maze do not sit on top of one another.
            chests.push({
                x: caveWorld.treasurePos.x,
                y: caveWorld.treasurePos.y - TILE_SIZE,
                opened: !!this.caveTreasureCollected[this.activeCaveId],
            });
        }
        if (caveWorld.hoardPos) {
            chests.push({
                x: caveWorld.hoardPos.x,
                y: caveWorld.hoardPos.y,
                opened: !!this.caveBossDefeated[this.activeCaveId],
            });
        }
        return chests;
    }

    checkCaveTreasure() {
        if (!this.inCave) return;
        const caveId = this.activeCaveId;
        const caveWorld = this.caveWorlds[caveId];
        if (!caveWorld || !caveWorld.treasurePos) return;
        if (this.caveTreasureCollected[caveId]) return;

        if (dist(this.player.x, this.player.y, caveWorld.treasurePos.x, caveWorld.treasurePos.y) < 40) {
            this.caveTreasureCollected[caveId] = true;
            GameAnalytics.track("first-cave-completed");
            this.sound.gemCollect();
            const ce = CAVE_ENTRANCES.find(e => e.id === caveId);
            if (ce.difficulty === 1) {
                // SW cave: coins + health potion
                const coins = randInt(50, 100);
                this.player.gold += coins;
                this.player.addHealthPotion("regular");
                this.player.addHealthPotion("regular");
                this.ui.showNotification(`Found ${coins} gold and 2 Health Potions!`);
                this.ui.showDialog("A treasure chest sits at the dead centre of the maze. The lid swings up on gold and two stoppered flasks \u2014 somebody hauled this down here on purpose, and meant to come back for it.");
            } else if (ce.difficulty === 2) {
                // SE cave: purple gem (health) + health potion
                this.player.purpleGemHealth = true;
                this.player.maxHp += PURPLE_GEMS.health.bonus;
                this.player.hp = Math.min(this.player.hp + PURPLE_GEMS.health.bonus, this.player.maxHp);
                this.player.addHealthPotion("regular");
                this.ui.showNotification(`${PURPLE_GEMS.health.icon} ${PURPLE_GEMS.health.name} found! +${PURPLE_GEMS.health.bonus} Max HP`);
                this.ui.showDialog(`The chest at the heart of the maze opens on a single stone. The ${PURPLE_GEMS.health.name} pulses with healing energy! Your maximum health has increased!`);
            }
        }
    }

    clearCaveObstacle(entranceId) {
        const cleared = this.world.clearCaveObstacle(entranceId, this.player.x, this.player.y);
        if (cleared > 0) {
            this.world.invalidateMapCache();
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

    // The fire burns out. The old texts were right that there is a ladder in
    // the trunk and wrong about what fire does to it: the ladder is part of the
    // living tree and it goes up with the tree. What is left is ash, one seed,
    // and no way into the Cloudlands at all until another Worldtree is standing.
    onWorldtreeBurned() {
        this.sound.excaliburReveal();
        this.player.hasWorldtreeSeed = true;
        this.unlockLore("seed");
        this.ui.showDialog(
            "The Worldtree burns down to ash, and for one moment you see it: rungs, worn smooth by hands that were " +
            "never mortal, running all the way up the inside of the trunk. Then they burn too, and the sky closes " +
            "over the top of them.",
            () => {
                this.ui.showDialog(
                    "The ladder was never hidden in the tree. It was part of it. You have just burned down the only " +
                    "road between this country and the one above it, and there is nothing standing here now but ash.",
                    () => {
                        this.ui.showDialog(
                            "One thing survives the fire. In the middle of the ash there is a seed the size of a thumbnail, " +
                            "far heavier than it has any right to be, and still warm. It is a Worldtree, entire, waiting.",
                            () => {
                                this.ui.showNotification(`${WORLDTREE_SEED.icon} ${WORLDTREE_SEED.name} obtained!`);
                                this.ui.showDialog(
                                    "Plant it and a Worldtree comes up with a ladder in it, and the way to the Cloudlands is open again \u2014 " +
                                    "open the inventory and use it, or press P where you stand. It will grow anywhere. " +
                                    "But where you put it decides what is waiting at the top."
                                );
                                this.ui.showDialog(
                                    "A Worldtree will not take in ash, or stone, or another tree's shadow. Put it in ground that holds it and " +
                                    "the boundary you burned is mended and the gods have nothing left to quarrel about. Put it anywhere else " +
                                    "and you will still have your ladder \u2014 and you will have to fight for what is at the top of it."
                                );
                            }
                        );
                    }
                );
            }
        );
    }

    // ============================================
    // The Worldtree Seed
    // ============================================

    // Push the seed into the ground under Ingoizer's feet. Every planting grows
    // a Worldtree with a ladder in it, so the Cloudlands open wherever the seed
    // goes. Only the Waiting Ground holds the tree - and only a tree that has
    // taken settles Zeus's quarrel. Anything else can be lifted out and moved.
    plantWorldtreeSeed() {
        if (!this.onSurface) {
            this.ui.showNotification("There is no ground to plant in here.");
            return;
        }
        if (!this.player.hasWorldtreeSeed) return;

        // Remember what kind of ground this was before the seed leaves the
        // hand: the ash is the guess everyone makes, and it deserves a straight
        // answer rather than the generic one.
        const inAsh = this.world.isWorldtreeAsh(this.player.x, this.player.y);

        const sapling = this.world.plantSeed(this.player.x, this.player.y);
        if (!sapling) {
            this.ui.showNotification("Nothing will take root here.");
            return;
        }

        this.player.hasWorldtreeSeed = false;
        this.plantedInAsh = inAsh;
        this.sound.gemCollect();
        this.ui.showNotification(`${WORLDTREE_SEED.icon} Seed planted. Something is coming up.`);
    }

    // The planting finishes. There is a Worldtree standing and a way into the
    // Cloudlands either way - what the ground decides is who meets you up there.
    onWorldtreeGrown() {
        const sap = this.world.sapling;
        GameAnalytics.track("worldtree-ladder-opened");
        if (!sap.rooted) {
            this.onWorldtreeGrownWrong();
            return;
        }
        this.onWorldtreeRegrown();
    }

    // A Worldtree in ground that will not hold it. The ladder is real and the
    // climb is open; nothing else about the story has been answered, and the
    // tree can be lifted out and carried to the ground that wants it.
    onWorldtreeGrownWrong() {
        const inAsh = this.plantedInAsh;
        this.plantedInAsh = false;

        const step = Math.min(this.seedPlantAttempts, WORLDTREE_SEED_CLUES.length - 1);
        this.seedPlantAttempts++;
        GameAnalytics.track("worldtree-seed-missed");

        this.sound.divineChime();
        this.ui.showNotification("\ud83c\udf33 A Worldtree stands - the Cloudlands are open.");

        const clue = () => {
            this.ui.showDialog(WORLDTREE_SEED_CLUES[step], () => this.chartWaitingGroundIfLost());
        };

        const verdict = () => {
            this.ui.showDialog(
                "A Worldtree comes up under your hands with a ladder running up the inside of it, and the way into " +
                "the Cloudlands is open again. Press E at the trunk to climb.",
                () => {
                    this.ui.showDialog(
                        "But it has climbed without taking. The ground is holding it up rather than holding on to it, " +
                        "and up there the boundary is still burned: whatever is waiting at the top of this ladder will " +
                        "want a fight. Press P at the trunk to lift the tree out again and carry it on.",
                        clue
                    );
                }
            );
        };

        if (inAsh) {
            // The one wrong answer worth naming out loud.
            this.ui.showDialog(
                "You put the seed into the ash on the exact spot the old trunk stood, and something does come up \u2014 " +
                "but the ground under it stays dead. Ash is what is left when a thing has finished; a Worldtree cannot " +
                "begin in the end of itself.",
                verdict
            );
            return;
        }
        verdict();
    }

    // The seed is the only route to peace with Zeus, so it must never become
    // a dead end. Once the clues have run their course the plot is marked.
    chartWaitingGroundIfLost() {
        const plot = this.world.worldtreePlot;
        if (!plot || plot.discovered || plot.charted) return;
        if (this.seedPlantAttempts < WORLDTREE_PLOT.hintAfter) return;

        plot.charted = true;
        this.ui.showNotification(`\ud83d\uddfa\ufe0f ${WORLDTREE_PLOT.name} marked on your map`);
    }

    // The seed taking in the Waiting Ground: the Worldtree stands again, the
    // ladder in it is the way up, and the quarrel Zeus was going to pick is
    // settled before it starts. That is a trade - the twelve-form fight and the
    // ending that comes with it are off the table for this run - so the game
    // says so out loud rather than letting a player find out afterwards.
    onWorldtreeRegrown() {
        this.worldtreeRestored = true;
        this.sound.divineChime();
        this.ui.showNotification("\ud83c\udf33 The Worldtree stands again!");
        this.ui.showDialog(
            "The Worldtree takes. It is young and thin and it does not stop at the clouds \u2014 it goes through them, out of " +
            "the Fallow and into the country above, with a ladder running up the inside of it, and the boundary between the " +
            "two lands is whole. It is nowhere near where the old one stood. It does not seem to matter.",
            () => {
                if (this.olympianDefeated) {
                    this.ui.showDialog("Somewhere far above, in a Cloudlands with no king left in it, the weather turns gentle for a moment.");
                    return;
                }
                if (this.olympianSpawned) {
                    // Too late to talk: he is already wearing his family as armour.
                    this.ui.showDialog(
                        "Far above, the storm over the Temple of Olympus falters for a heartbeat \u2014 and then closes again. " +
                        "You put the tree back one quarrel too late. Zeus is already out of his temple, and he will have to be fought."
                    );
                    return;
                }
                this.zeusAppeased = true;
                this.ui.showDialog(
                    "\"YOU PUT IT BACK.\" The voice is not sound; it is weather, and it is coming from directly overhead.",
                    () => {
                        this.ui.showDialog(
                            "\"Not where I put it.\" A pause, and the weather thinks about it. \"No matter. A Worldtree is not a fencepost, " +
                            "mortal, it is a knot \u2014 and a knot holds wherever it is tied.\""
                        );
                        this.ui.showDialog(
                            "\"I had two quarrels with you. That you burned the boundary stone between my country and yours, " +
                            "and that you had no business standing in mine. You have answered the first. The second dies with it \u2014 " +
                            "a man who mends a Worldtree has business anywhere it grows.\"",
                            () => {
                                if (!this.player.hasZeusBolts) {
                                    this.player.hasZeusBolts = true;
                                    this.sound.victoryFanfare();
                                    this.ui.showNotification(`${ZEUS_BOLT.icon} Zeus grants you his lightning! (+${ZEUS_BOLT.damageBonus} DMG)`);
                                }
                                this.ui.showDialog(
                                    `The arrows in your quiver crackle and change without a blow being struck. Every one of them is a bolt of ` +
                                    `Zeus now, and every arrow you pick up from here will become one too. +${ZEUS_BOLT.damageBonus} damage on top of your bow.`,
                                    () => {
                                        this.ui.showDialog(
                                            "\"Climb when you like. I will be at the temple, and I will not raise a hand to you.\"",
                                            () => {
                                                // Say the price plainly. This run cannot earn the
                                                // other ending any more, and that was the choice.
                                                this.ui.showDialog(
                                                    "And that is that. The Twelve will not rise for you now, and Zeus will not fight you \u2014 " +
                                                    "so throwing down the King of Olympus is not something this run can do any more. " +
                                                    "You chose to mend the thing you broke instead. Only one of those two ever gets to be true."
                                                );
                                            }
                                        );
                                    }
                                );
                            }
                        );
                    }
                );
            }
        );
    }

    // The last corner of the realm charted. Every cell of surface fog can be
    // reached on foot, so this is a thing a player finishes rather than a thing
    // that happens to them - it gets its own tune and its own announcement, and
    // like every other one-shot it is remembered in the save.
    checkSurfaceCharted() {
        if (this.surfaceCharted || !FOG_ENABLED) return;
        const fog = this.world.fog;
        if (!fog || fog.charted < fog.cols * fog.rows) return;

        this.surfaceCharted = true;
        GameAnalytics.track("surface-fully-charted");
        this.sound.explorerFanfare();
        this.ui.showNotification("\ud83d\uddfa\ufe0f The realm is charted!");
        this.ui.showDialog("Congratulations, you've explored 100% of the surface level! The fog has been cleared.");
    }

    // Lift a Worldtree that never took back out of the ground. A grown one is
    // the whole route to the Cloudlands, so this closes the way up until it is
    // planted again - which is the point: the seed is meant to be carried until
    // it is somewhere worth leaving.
    uprootSapling() {
        // Proximity to the tree is only tracked while Ingoizer is on the
        // surface, so the last reading goes stale underground and in the sky.
        // Nobody pulls the ladder out from halfway up it.
        if (!this.onSurface) return;
        const grown = !!(this.world.sapling && this.world.sapling.grown);
        if (!this.world.uprootSapling()) return;
        this.player.hasWorldtreeSeed = true;
        this.sound.applePickup();
        this.ui.showNotification(`${WORLDTREE_SEED.icon} ${WORLDTREE_SEED.name} recovered.`);
        if (!grown) {
            this.ui.showDialog("The shoot comes up easily, and the seed at its root is as whole and as heavy as the day the fire left it.");
            return;
        }
        this.ui.showDialog(
            "You take hold of the trunk and the whole Worldtree comes up in your hands \u2014 roots, ladder, crown and all \u2014 " +
            "folding down as it rises until there is nothing left of it but a seed the size of a thumbnail. The ground " +
            "underneath is not even marked. It never had hold of it.",
            () => {
                this.ui.showDialog("The way into the Cloudlands closes with it. There is no ladder anywhere in the realm now \u2014 only the seed in your hand.");
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

        // The pack climbs the Worldtree with you
        this.nearAnimal = null;
        this.gatherCompanions();

        this.currentZone = "sky";
        this.zoneDisplayTimer = 3000;
        this.sound.divineChime();
        this.ui.showNotification("You climb into the Cloudlands.");
        if (this.zeusAppeased && !this.zeusMetInPeace) {
            this.ui.showDialog(
                "You haul yourself over the edge onto ground that should not hold your weight, and nothing challenges you. " +
                "The keepers of the Cloudlands watch you pass and let you pass."
            );
            this.ui.showDialog("The temple of white marble at the centre of the islands has its doors open. Somebody is waiting on the steps.");
        } else if (!this.olympianSummoned && !this.olympianDefeated) {
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
        this.gatherCompanions();

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
        if (this.olympianSummoned || this.olympianDefeated || this.zeusAppeased) return;
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

    // With the Worldtree back in the ground Zeus has nothing left to fight
    // about. He meets you at the temple instead, and the Cloudlands stay quiet.
    checkZeusPeaceMeeting() {
        if (!this.zeusAppeased || this.zeusMetInPeace || this.olympianSpawned || this.olympianDefeated) return;
        const t = this.skyWorld.bossSpawnTile;
        if (!t) return;
        const pos = tileToWorld(t.x, t.y);
        if (dist(this.player.x, this.player.y, pos.x, pos.y) > 240) return;

        this.zeusMetInPeace = true;
        GameAnalytics.track("olympus-peace");
        this.sound.divineChime();
        this.ui.showDialog(
            "The temple doors stand open and nothing comes out of them at a run. Zeus is sitting on the steps " +
            "with his chin on his fist, watching a green shoot come up through the clouds away in the south of the world.",
            () => {
                this.ui.showDialog(
                    "\"Every mortal who has ever come up that ladder came up it to take something from me. You came up " +
                    "having already given it back.\"",
                    () => {
                        this.ui.showDialog(
                            "\"Keep the bolts. Keep the Cloudlands, for as long as you can stand the walk. And when that tree " +
                            "in the south is tall enough to hold the sky apart on its own, come up and tell me.\"",
                            () => {
                                this.ui.showGameOver(true,
                                    "You have made peace with the King of Olympus without lifting your sword to him. Ingoizer, who woke in the " +
                                    "Green Meadow with a rusty sword, burned down a Worldtree, carried its last seed corner to corner across the " +
                                    "whole realm, and found the one acre of ground that had been kept bare for it. Zeus's lightning rides in your quiver, freely given. " +
                                    `Monsters defeated: ${this.player.monstersKilled}. ` +
                                    "The realm below, the caves beneath and the heavens above are all yours to wander."
                                );
                            }
                        );
                    }
                );
            }
        );
    }

    checkOlympianTrigger() {
        if (this.zeusAppeased) return;
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
                this.ui.showDialog("\"You burned the Worldtree. It was not a door and it was not a staircase \u2014 it was the boundary stone between your country and mine, and it was older than either of us, and you set fire to it to save yourself a walk.\"", () => {
                    this.ui.showDialog("\"And now you stand in the Cloudlands. Nothing up here was made for mortals. You do not belong in my country, and you burned down the only thing that was holding it apart from yours.\"", () => {
                        this.ui.showDialog("\"Strike me if you can. You will find there is always another of us behind the one you hit.\"");
                    });
                });
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
        GameAnalytics.track("olympus-defeated");
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
        if (!this.fountainIntroShown) {
            this.fountainIntroShown = true;
            this.ui.showDialog(
                "The water stills, and the voice that comes out of it is the one from Crystal Lake. " +
                "\"Both waters are mine, Ingoizer \u2014 the lake and the fountain alike. At the lake I ask you for courage. " +
                "Here I ask you for wit. Answer me three times.\""
            );
        }
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
            this.ui.showDialog("The Fountain of Youth glows with radiant light and you feel completely rejuvenated! \"Well answered,\" says the Lady of the Lake, from the water. \"Go carefully.\"");
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
            this.ui.showNotification("The Lady withdraws from the fountain. Return in 3 minutes.");
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
            this.ui.showDialog("\"I am The Green Knight. I know your name, Ingoizer. I have known it my whole life.\"");
            this.ui.showDialog("\"The man you cut down at Ing Castle was my father. He gave up a house and a destiny to raise us out of sight of it, and you walked into his hall and took him from us in an afternoon.\"");
            this.ui.showDialog("\"I do not want the realm. I do not want the gems. I want you. Prepare yourself.\"");
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
                // A secret zone announces itself only once the landmark that
                // gives it its name has actually been found.
                if (zone !== "wilderness" && ZONES[zone] && this.world.isZoneRevealed(zone)) {
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
            this.world.render(ctx, this.camera, this.time, { carryingSeed: this.player.hasWorldtreeSeed });
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

        // Wild animals (overworld only) and companions
        if (this.onSurface) {
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

        // Treasure chests: the prize at the heart of a maze cave, and the
        // guardian's own hoard at the back of a boss lair.
        for (const chest of this.visibleChests()) {
            renderables.push({
                y: chest.y,
                render: () => TreasureChestSprite.draw(
                    ctx, chest.x - this.camera.x, chest.y - this.camera.y, chest.opened, this.time
                ),
            });
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

        // The Clubhouse hangs its mirrorball, its confetti and its sign above
        // everybody's heads, so they go on after the dancers rather than under them.
        if (this.onSurface) {
            this.world.renderClubhouseOverhead(ctx, this.camera, this.time);
        }

        // Zone display
        if (this.zoneDisplayTimer > 0) {
            const zoneName = this.currentZone === "cave" ? "The Caves Below"
                : this.currentZone === "sky" ? "The Cloudlands"
                : (ZONES[this.currentZone] && this.world.isZoneRevealed(this.currentZone)
                    ? ZONES[this.currentZone].name : null);
            if (zoneName) {
                const alpha = Math.min(1, this.zoneDisplayTimer / 500);
                ctx.save();
                ctx.globalAlpha = alpha;
                this.ui.showZoneName(ctx, zoneName);
                ctx.restore();
            }
        }

        // Light spilling up out of the Maker's Hollow. Only visible from close
        // by - enough to say "something is down there" to a player who has
        // already wandered to the corner, and nothing at all from a distance.
        if (this.onSurface && this.world.makersHollow) {
            const h = this.world.makersHollow;
            const hx = h.x - this.camera.x;
            const hy = h.y - this.camera.y;
            if (hx > -60 && hx < CANVAS_W + 60 && hy > -60 && hy < CANVAS_H + 60) {
                const flicker = 0.5 + Math.sin(this.time * 0.0024) * 0.22 + Math.sin(this.time * 0.0071) * 0.08;
                const r = 48;
                ctx.save();
                // Added rather than painted over, so it reads as lamplight on
                // the flagstones instead of a coloured disc lying on them.
                ctx.globalCompositeOperation = "lighter";
                const glow = ctx.createRadialGradient(hx, hy, 0, hx, hy, r);
                glow.addColorStop(0, `rgba(255, 198, 104, ${0.30 * flicker + 0.20})`);
                glow.addColorStop(0.45, `rgba(255, 158, 58, ${0.15 * flicker + 0.07})`);
                glow.addColorStop(1, "rgba(255, 140, 30, 0)");
                ctx.fillStyle = glow;
                ctx.beginPath();
                ctx.arc(hx, hy, r, 0, Math.PI * 2);
                ctx.fill();
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

        // Interaction prompts. On touch the wording names the very symbol the
        // ACT button is wearing right now, so prompt and button always agree.
        const isMobile = this.touchControls.active;
        const act = this.ui.dialogActive ? null : this.interactContext();
        if (act) {
            this.ui.renderInteractionPrompt(ctx, isMobile
                ? `Tap ${act.icon} to ${act.short}`
                : `Press E to ${act.long}`);
        } else if (this.onSurface && this.player.hasWorldtreeSeed && this.world.isWorldtreeGround(this.player.x, this.player.y)) {
            this.ui.renderInteractionPrompt(ctx, isMobile
                ? "This ground was turned for it - plant the seed from your inventory"
                : "This ground was turned for it - press P to plant the Worldtree Seed");
        }

        // Render cave / sky exit labels
        if (this.inCave && this.caveWorlds[this.activeCaveId]) {
            this.caveWorlds[this.activeCaveId].renderExitLabels(ctx, this.camera, this.time);
        } else if (this.inSky) {
            this.skyWorld.renderExitLabels(ctx, this.camera, this.time);
        }

        // The minimap is information, not the primary animation surface. Its
        // fog, markers and terrain are comparatively expensive to compose, so
        // cap it at 12 FPS while the game is moving and force a fresh frame
        // after state resets or viewport changes.
        this.updateMinimapShyness();
        const mapOpts = { time: this.time };
        const minimapRealm = this.inCave ? `cave:${this.activeCaveId}` : (this.inSky ? "sky" : "surface");
        const minimapState = `${minimapRealm}:${Math.floor(this.player.x / TILE_SIZE)}:${Math.floor(this.player.y / TILE_SIZE)}`;
        if (minimapState !== this.minimapStateSignature) this.minimapDirty = true;
        const minimapDue = this.minimapDirty
            || (!this.paused && this.time - this.lastMinimapRender >= 1000 / 12);
        if (minimapDue) {
            if (this.inCave && this.caveWorlds[this.activeCaveId]) {
                this.caveWorlds[this.activeCaveId].renderMinimap(this.minimapCtx, this.player, this.caveMonsters, this.caveBoss, mapOpts);
            } else if (this.inSky) {
                this.skyWorld.renderMinimap(this.minimapCtx, this.player, this.skyMonsters, this.olympianBoss, mapOpts);
            } else {
                this.world.renderMinimap(this.minimapCtx, this.player, this.monsters, this.boss, this.greenKnight, this.companions, mapOpts);
            }
            this.lastMinimapRender = this.time;
            this.minimapStateSignature = minimapState;
            this.minimapDirty = false;
        }

        // Render world map if open
        if (this.ui.isMapOpen()) {
            if (this.inCave && this.caveWorlds[this.activeCaveId]) {
                this.caveWorlds[this.activeCaveId].renderWorldMap(this.worldmapCtx, this.player, mapOpts);
            } else if (this.inSky) {
                this.skyWorld.renderWorldMap(this.worldmapCtx, this.player, mapOpts);
            } else {
                this.world.renderWorldMap(this.worldmapCtx, this.player, mapOpts);
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
    window.game.ui.refreshContinue();
});
