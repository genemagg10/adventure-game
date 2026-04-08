// ============================================
// Ingoizer's World - World Generation & Rendering
// ============================================

class World {
    constructor() {
        this.tiles = [];
        this.gems = [];
        this.shops = [];
        this.decorations = [];
        this.ladyOfLake = null;
        this.generate();
    }

    generate() {
        const rng = seededRandom(42);
        this.tiles = new Array(WORLD_H);

        for (let y = 0; y < WORLD_H; y++) {
            this.tiles[y] = new Array(WORLD_W);
            for (let x = 0; x < WORLD_W; x++) {
                this.tiles[y][x] = this.getTileForPosition(x, y, rng);
            }
        }

        // Carve paths between zones
        this.carvePath(30, 25, 30, 55, rng);  // meadow -> village
        this.carvePath(30, 25, 70, 25, rng);  // meadow -> forest
        this.carvePath(70, 25, 120, 25, rng); // forest -> desert
        this.carvePath(70, 25, 70, 70, rng);  // forest -> swamp
        this.carvePath(120, 25, 130, 60, rng);// desert -> mountains
        this.carvePath(130, 60, 170, 60, rng);// mountains -> castle
        this.carvePath(30, 55, 50, 70, rng);  // village -> lake edge
        this.carvePath(70, 70, 25, 100, rng); // swamp -> ruins
        this.carvePath(130, 60, 130, 110, rng);// mountains -> darklands

        // Build bridges from shore to Lady of the Lake's island on all four sides
        this.buildBridge(50, 52, 50, 67);  // North: shore to island north edge
        this.buildBridge(50, 69, 50, 88);  // South: island south edge to shore
        this.buildBridge(41, 68, 49, 68);  // West: shore to island west edge
        this.buildBridge(51, 68, 59, 68);  // East: island east edge to shore

        // Build castle walls and gate
        this.buildCastle();

        // Place shops
        this.placeShops();

        // Place world gems
        this.placeGems();

        // Place Lady of the Lake
        this.placeLadyOfLake();

        // Place Merlin and his hut
        this.placeMerlin();
        this.placeMerlinHut();

        // World coins
        this.coins = [];
        this.placeCoins(rng);

        // Green Knight's Domain (initially blocked, but castle marker always known)
        this.greenCastleBuilt = false;
        this.greenGems = [];
        // Pre-calculate green castle position so it shows on maps from the start
        const gateX = GREEN_CASTLE_POS.x + Math.floor(12 / 2);
        this.greenKnightCastle = {
            x: gateX * TILE_SIZE + TILE_SIZE / 2,
            y: (GREEN_CASTLE_POS.y + 12 + 2) * TILE_SIZE + TILE_SIZE / 2,
        };
        this.greenBossSpawnPoint = tileToWorld(gateX, GREEN_CASTLE_POS.y + 12 + 2);

        // Place cave entrances at map corners with obstacle rings
        this.caveEntrances = [];
        this.placeCaveEntrances();

        // Fountain of Youth
        this.fountainOfYouth = null;
        this.placeFountainOfYouth(rng);

        // Add decorations
        this.generateDecorations(rng);
    }

    getTileForPosition(x, y, rng) {
        const zone = getZoneAt(x, y);

        // Out of defined zones
        if (zone === "wilderness") {
            return rng() < 0.15 ? TILE.TREE : TILE.GRASS;
        }

        const z = ZONES[zone];

        switch (zone) {
            case "meadow":
                if (rng() < z.treeChance) return TILE.TREE;
                return TILE.GRASS;

            case "forest":
                if (rng() < z.treeChance) return TILE.TREE;
                return TILE.DARK_GRASS;

            case "village":
                if (rng() < z.treeChance) return TILE.TREE;
                return TILE.GRASS;

            case "desert":
                if (rng() < 0.02) return TILE.STONE;
                return TILE.SAND;

            case "swamp":
                if (rng() < 0.08) return TILE.WATER;
                if (rng() < z.treeChance) return TILE.TREE;
                return TILE.SWAMP;

            case "mountains":
                if (rng() < 0.15) return TILE.MOUNTAIN;
                if (rng() < z.treeChance) return TILE.TREE;
                return TILE.STONE;

            case "lake": {
                // Shore detection
                const dx = x - (z.x + z.w / 2);
                const dy = y - (z.y + z.h / 2);
                const d = Math.sqrt(dx * dx / (z.w * z.w / 4) + dy * dy / (z.h * z.h / 4));
                if (d > 0.85) return TILE.SAND;
                return TILE.WATER;
            }

            case "castle":
                if (rng() < z.treeChance) return TILE.TREE;
                return TILE.STONE;

            case "ruins":
                if (rng() < 0.08) return TILE.WALL;
                if (rng() < z.treeChance) return TILE.TREE;
                return TILE.STONE;

            case "darklands":
                if (rng() < 0.05) return TILE.LAVA;
                if (rng() < z.treeChance) return TILE.TREE;
                return TILE.DARK_GRASS;

            case "greenlands":
                if (rng() < 0.10) return TILE.TREE;
                if (rng() < 0.03) return TILE.WALL;
                return TILE.DARK_GRASS;

            default:
                return TILE.GRASS;
        }
    }

    carvePath(x1, y1, x2, y2, rng) {
        let x = x1, y = y1;
        while (x !== x2 || y !== y2) {
            // Path width of 2
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    const tx = x + dx;
                    const ty = y + dy;
                    if (tx >= 0 && tx < WORLD_W && ty >= 0 && ty < WORLD_H) {
                        if (this.tiles[ty][tx] !== TILE.WATER) {
                            this.tiles[ty][tx] = TILE.PATH;
                        }
                    }
                }
            }
            // Move towards target with slight wobble
            if (rng() < 0.6) {
                if (x < x2) x++;
                else if (x > x2) x--;
            } else {
                if (y < y2) y++;
                else if (y > y2) y--;
            }
        }
    }

    buildBridge(x1, y1, x2, y2) {
        for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) {
            for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) {
                if (x >= 0 && x < WORLD_W && y >= 0 && y < WORLD_H) {
                    this.tiles[y][x] = TILE.BRIDGE;
                }
            }
        }
    }

    buildCastle() {
        const cx = 175, cy = 55;
        const cw = 16, ch = 16;

        // Castle walls (outer ring)
        for (let y = cy; y < cy + ch; y++) {
            for (let x = cx; x < cx + cw; x++) {
                if (x >= 0 && x < WORLD_W && y >= 0 && y < WORLD_H) {
                    if (y === cy || y === cy + ch - 1 || x === cx || x === cx + cw - 1) {
                        this.tiles[y][x] = TILE.CASTLE_WALL;
                    } else {
                        this.tiles[y][x] = TILE.CASTLE_FLOOR;
                    }
                }
            }
        }

        // Castle gate (south side, middle)
        const gateX = cx + Math.floor(cw / 2);
        for (let dx = -1; dx <= 1; dx++) {
            const gx = gateX + dx;
            if (cy + ch - 1 >= 0 && cy + ch - 1 < WORLD_H && gx >= 0 && gx < WORLD_W) {
                this.tiles[cy + ch - 1][gx] = TILE.PATH;
            }
        }

        // Path leading to gate
        for (let y = cy + ch; y < cy + ch + 5; y++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (y >= 0 && y < WORLD_H && gateX + dx >= 0 && gateX + dx < WORLD_W) {
                    this.tiles[y][gateX + dx] = TILE.PATH;
                }
            }
        }

        // Boss spawn point (outside gate)
        this.bossSpawnPoint = tileToWorld(gateX, cy + ch + 3);
    }

    placeShops() {
        this.shops = SHOP_LOCATIONS.map(s => {
            // Clear area around shop
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    const tx = s.x + dx;
                    const ty = s.y + dy;
                    if (tx >= 0 && tx < WORLD_W && ty >= 0 && ty < WORLD_H) {
                        this.tiles[ty][tx] = TILE.SHOP_FLOOR;
                    }
                }
            }
            return { ...s, worldX: s.x * TILE_SIZE + TILE_SIZE / 2, worldY: s.y * TILE_SIZE + TILE_SIZE / 2 };
        });
    }

    placeGems() {
        // Randomly place 3 gems in different biomes, evenly spread
        const gemZones = ["meadow", "forest", "desert", "swamp", "mountains", "ruins", "darklands"];
        // Shuffle
        for (let i = gemZones.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [gemZones[i], gemZones[j]] = [gemZones[j], gemZones[i]];
        }
        const selectedZones = gemZones.slice(0, 3);

        this.gems = [];
        for (const zoneName of selectedZones) {
            const zone = ZONES[zoneName];
            for (let attempt = 0; attempt < 50; attempt++) {
                const tx = zone.x + Math.floor(Math.random() * (zone.w - 4)) + 2;
                const ty = zone.y + Math.floor(Math.random() * (zone.h - 4)) + 2;
                if (!this.isSolid(tx, ty)) {
                    this.gems.push({
                        x: tx * TILE_SIZE + TILE_SIZE / 2,
                        y: ty * TILE_SIZE + TILE_SIZE / 2,
                        zone: zoneName,
                        collected: false,
                        pulsePhase: Math.random() * Math.PI * 2,
                    });
                    break;
                }
            }
        }
    }

    placeCoins(rng) {
        this.coins = [];
        const zones = COIN_CONFIG.zones;
        const coinsPerZone = Math.ceil(COIN_CONFIG.count / zones.length);

        for (const zoneName of zones) {
            const zone = ZONES[zoneName];
            let placed = 0;
            for (let attempt = 0; attempt < coinsPerZone * 10 && placed < coinsPerZone; attempt++) {
                const tx = zone.x + Math.floor(rng() * (zone.w - 4)) + 2;
                const ty = zone.y + Math.floor(rng() * (zone.h - 4)) + 2;
                if (!this.isSolid(tx, ty)) {
                    const value = COIN_CONFIG.value[0] + Math.floor(rng() * (COIN_CONFIG.value[1] - COIN_CONFIG.value[0] + 1));
                    this.coins.push({
                        x: tx * TILE_SIZE + TILE_SIZE / 2,
                        y: ty * TILE_SIZE + TILE_SIZE / 2,
                        value: value,
                        collected: false,
                        respawnTimer: 0,
                    });
                    placed++;
                }
            }
        }
    }

    placeLadyOfLake() {
        const l = LADY_OF_LAKE;
        // Clear a sand patch on the shore for her
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                const tx = l.x + dx;
                const ty = l.y + dy;
                if (tx >= 0 && tx < WORLD_W && ty >= 0 && ty < WORLD_H) {
                    this.tiles[ty][tx] = TILE.SAND;
                }
            }
        }
        this.ladyOfLake = {
            x: l.x * TILE_SIZE + TILE_SIZE / 2,
            y: l.y * TILE_SIZE + TILE_SIZE / 2,
            excaliburGiven: false,
        };
    }

    placeMerlin() {
        const m = MERLIN;
        // Clear a small walkable area in the swamp for Merlin
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                const tx = m.x + dx;
                const ty = m.y + dy;
                if (tx >= 0 && tx < WORLD_W && ty >= 0 && ty < WORLD_H) {
                    if (SOLID_TILES.has(this.tiles[ty][tx])) {
                        this.tiles[ty][tx] = TILE.SWAMP;
                    }
                }
            }
        }
        this.merlin = {
            x: m.x * TILE_SIZE + TILE_SIZE / 2,
            y: m.y * TILE_SIZE + TILE_SIZE / 2,
        };
    }

    placeMerlinHut() {
        const h = MERLIN_HUT;
        // Clear area around hut first
        for (let dy = -2; dy <= 2; dy++) {
            for (let dx = -2; dx <= 2; dx++) {
                const tx = h.x + dx;
                const ty = h.y + dy;
                if (tx >= 0 && tx < WORLD_W && ty >= 0 && ty < WORLD_H) {
                    if (SOLID_TILES.has(this.tiles[ty][tx])) {
                        this.tiles[ty][tx] = TILE.PATH;
                    }
                }
            }
        }
        // Build hut floor
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                const tx = h.x + dx;
                const ty = h.y + dy;
                if (tx >= 0 && tx < WORLD_W && ty >= 0 && ty < WORLD_H) {
                    this.tiles[ty][tx] = TILE.SHOP_FLOOR;
                }
            }
        }
        this.merlinHut = {
            x: h.x * TILE_SIZE + TILE_SIZE / 2,
            y: h.y * TILE_SIZE + TILE_SIZE / 2,
            showWand: false,
            wandCollected: false,
        };
    }

    unlockGreenlands() {
        if (this.greenCastleBuilt) return;
        this.greenCastleBuilt = true;

        const rng = seededRandom(99);
        const gz = ZONES.greenlands;

        // Generate greenlands terrain
        for (let y = gz.y; y < gz.y + gz.h; y++) {
            for (let x = gz.x; x < gz.x + gz.w; x++) {
                if (x >= 0 && x < WORLD_W && y >= 0 && y < WORLD_H) {
                    this.tiles[y][x] = this.getTileForPosition(x, y, rng);
                }
            }
        }

        // Carve path from ruins area to greenlands
        this.carvePath(25, 110, 60, 130, rng);
        // Carve path from darklands to greenlands
        this.carvePath(110, 120, 90, 130, rng);

        // Build Green Knight Castle
        this.buildGreenCastle();

        // Place green gems
        this.placeGreenGems(rng);
    }

    buildGreenCastle() {
        const cx = GREEN_CASTLE_POS.x;
        const cy = GREEN_CASTLE_POS.y;
        const cw = 12, ch = 12;

        // Castle walls (outer ring)
        for (let y = cy; y < cy + ch; y++) {
            for (let x = cx; x < cx + cw; x++) {
                if (x >= 0 && x < WORLD_W && y >= 0 && y < WORLD_H) {
                    if (y === cy || y === cy + ch - 1 || x === cx || x === cx + cw - 1) {
                        this.tiles[y][x] = TILE.CASTLE_WALL;
                    } else {
                        this.tiles[y][x] = TILE.CASTLE_FLOOR;
                    }
                }
            }
        }

        // Castle gate (south side, middle)
        const gateX = cx + Math.floor(cw / 2);
        for (let dx = -1; dx <= 1; dx++) {
            const gx = gateX + dx;
            if (cy + ch - 1 >= 0 && cy + ch - 1 < WORLD_H && gx >= 0 && gx < WORLD_W) {
                this.tiles[cy + ch - 1][gx] = TILE.PATH;
            }
        }

        // Path to gate
        for (let y = cy + ch; y < cy + ch + 4; y++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (y >= 0 && y < WORLD_H && gateX + dx >= 0 && gateX + dx < WORLD_W) {
                    this.tiles[y][gateX + dx] = TILE.PATH;
                }
            }
        }

        this.greenKnightCastle = {
            x: gateX * TILE_SIZE + TILE_SIZE / 2,
            y: (cy + ch + 2) * TILE_SIZE + TILE_SIZE / 2,
        };
        this.greenBossSpawnPoint = tileToWorld(gateX, cy + ch + 2);
    }

    placeGreenGems(rng) {
        const gz = ZONES.greenlands;
        this.greenGems = [];

        // Place 2 green gems in the greenlands zone
        for (let i = 0; i < 2; i++) {
            for (let attempt = 0; attempt < 50; attempt++) {
                const tx = gz.x + Math.floor(rng() * (gz.w - 6)) + 3;
                const ty = gz.y + Math.floor(rng() * (gz.h - 6)) + 3;
                // Don't place too close to the castle
                const castleDist = dist(tx * TILE_SIZE, ty * TILE_SIZE, GREEN_CASTLE_POS.x * TILE_SIZE, GREEN_CASTLE_POS.y * TILE_SIZE);
                if (!this.isSolid(tx, ty) && castleDist > 200) {
                    this.greenGems.push({
                        x: tx * TILE_SIZE + TILE_SIZE / 2,
                        y: ty * TILE_SIZE + TILE_SIZE / 2,
                        type: i === 0 ? "attack" : "defense",
                        collected: false,
                        pulsePhase: Math.random() * Math.PI * 2,
                    });
                    break;
                }
            }
        }
    }

    placeCaveEntrances() {
        for (const entrance of CAVE_ENTRANCES) {
            const obstacleTile = CAVE_OBSTACLE_TILES[entrance.obstacle];
            // Place inner cave entrance tile
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    const tx = entrance.x + dx;
                    const ty = entrance.y + dy;
                    if (tx >= 0 && tx < WORLD_W && ty >= 0 && ty < WORLD_H) {
                        this.tiles[ty][tx] = TILE.CAVE_ENTRANCE;
                    }
                }
            }
            // Place obstacle ring around entrance (radius 2-4)
            for (let dy = -4; dy <= 4; dy++) {
                for (let dx = -4; dx <= 4; dx++) {
                    if (Math.abs(dx) <= 1 && Math.abs(dy) <= 1) continue; // skip inner
                    const tx = entrance.x + dx;
                    const ty = entrance.y + dy;
                    if (tx >= 0 && tx < WORLD_W && ty >= 0 && ty < WORLD_H) {
                        if (Math.abs(dx) <= 3 && Math.abs(dy) <= 3) {
                            this.tiles[ty][tx] = obstacleTile;
                        } else {
                            // Outer ring: path for approach
                            if (SOLID_TILES.has(this.tiles[ty][tx])) {
                                this.tiles[ty][tx] = TILE.PATH;
                            }
                        }
                    }
                }
            }
            this.caveEntrances.push({
                ...entrance,
                cleared: false,
                worldX: entrance.x * TILE_SIZE + TILE_SIZE / 2,
                worldY: entrance.y * TILE_SIZE + TILE_SIZE / 2,
            });
        }
    }

    clearCaveObstacle(entranceId, playerX, playerY) {
        const ce = CAVE_ENTRANCES.find(e => e.id === entranceId);
        if (!ce) return;
        const obstacleTile = CAVE_OBSTACLE_TILES[ce.obstacle];
        // Only clear obstacle tiles near the player (within 3 tile radius)
        const ptx = Math.floor(playerX / TILE_SIZE);
        const pty = Math.floor(playerY / TILE_SIZE);
        let cleared = 0;
        for (let dy = -3; dy <= 3; dy++) {
            for (let dx = -3; dx <= 3; dx++) {
                const tx = ptx + dx;
                const ty = pty + dy;
                if (tx >= 0 && tx < WORLD_W && ty >= 0 && ty < WORLD_H) {
                    if (this.tiles[ty][tx] === obstacleTile) {
                        this.tiles[ty][tx] = TILE.STONE;
                        cleared++;
                    }
                }
            }
        }
        return cleared;
    }

    placeFountainOfYouth(rng) {
        // Place fountain in a random non-solid location in the meadow/village area
        let fx, fy;
        let attempts = 0;
        while (attempts < 100) {
            fx = 5 + Math.floor(rng() * 30);
            fy = 25 + Math.floor(rng() * 20);
            if (!SOLID_TILES.has(this.tiles[fy][fx]) && this.tiles[fy][fx] !== TILE.CAVE_ENTRANCE) {
                break;
            }
            attempts++;
        }
        // Place water tiles for the fountain (3x3)
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                const tx = fx + dx;
                const ty = fy + dy;
                if (tx >= 0 && tx < WORLD_W && ty >= 0 && ty < WORLD_H) {
                    if (dx === 0 && dy === 0) {
                        this.tiles[ty][tx] = TILE.BRIDGE; // walkable center
                    } else {
                        this.tiles[ty][tx] = TILE.WATER;
                    }
                }
            }
        }
        // Path to approach (start at py=1 to clear the south water tile adjacent to fountain)
        for (let py = 1; py <= 4; py++) {
            const ty = fy + py;
            if (ty < WORLD_H) this.tiles[ty][fx] = TILE.PATH;
        }
        this.fountainOfYouth = {
            tileX: fx,
            tileY: fy,
            x: fx * TILE_SIZE + TILE_SIZE / 2,
            y: fy * TILE_SIZE + TILE_SIZE / 2,
        };
    }

    generateDecorations(rng) {
        // Add flowers, rocks, etc. as visual decorations
        for (let i = 0; i < 500; i++) {
            const tx = Math.floor(rng() * WORLD_W);
            const ty = Math.floor(rng() * WORLD_H);
            if (ty < WORLD_H && tx < WORLD_W && !SOLID_TILES.has(this.tiles[ty][tx])) {
                const zone = getZoneAt(tx, ty);
                let type;
                if (zone === "meadow" || zone === "village") type = rng() < 0.5 ? "flower" : "bush";
                else if (zone === "desert") type = "cactus";
                else if (zone === "ruins") type = "rubble";
                else if (zone === "mountains") type = "rock";
                else type = "bush";

                this.decorations.push({
                    x: tx * TILE_SIZE + rng() * TILE_SIZE,
                    y: ty * TILE_SIZE + rng() * TILE_SIZE,
                    type: type,
                });
            }
        }
    }

    isSolid(tx, ty) {
        if (tx < 0 || tx >= WORLD_W || ty < 0 || ty >= WORLD_H) return true;
        return SOLID_TILES.has(this.tiles[ty][tx]);
    }

    render(ctx, camera, time) {
        const startTX = Math.floor(camera.x / TILE_SIZE) - 1;
        const startTY = Math.floor(camera.y / TILE_SIZE) - 1;
        const endTX = startTX + TILES_X + 2;
        const endTY = startTY + TILES_Y + 2;

        for (let ty = startTY; ty <= endTY; ty++) {
            for (let tx = startTX; tx <= endTX; tx++) {
                if (tx < 0 || tx >= WORLD_W || ty < 0 || ty >= WORLD_H) {
                    ctx.fillStyle = "#111";
                    ctx.fillRect(tx * TILE_SIZE - camera.x, ty * TILE_SIZE - camera.y, TILE_SIZE, TILE_SIZE);
                    continue;
                }

                const tile = this.tiles[ty][tx];
                const sx = tx * TILE_SIZE - camera.x;
                const sy = ty * TILE_SIZE - camera.y;

                ctx.fillStyle = TILE_COLORS[tile] || "#333";

                // Add subtle variation
                if (tile === TILE.GRASS || tile === TILE.DARK_GRASS || tile === TILE.SWAMP) {
                    const variation = ((tx * 7 + ty * 13) % 3) * 8;
                    const base = this.hexToRgb(TILE_COLORS[tile]);
                    ctx.fillStyle = `rgb(${base.r + variation - 4}, ${base.g + variation - 4}, ${base.b + variation - 4})`;
                }

                ctx.fillRect(sx, sy, TILE_SIZE + 1, TILE_SIZE + 1);

                // Tile details
                this.renderTileDetail(ctx, tile, sx, sy, tx, ty, time);
            }
        }

        // Render decorations in view
        for (const dec of this.decorations) {
            const sx = dec.x - camera.x;
            const sy = dec.y - camera.y;
            if (sx < -20 || sx > CANVAS_W + 20 || sy < -20 || sy > CANVAS_H + 20) continue;
            this.renderDecoration(ctx, dec, sx, sy);
        }

        // Render shops
        for (const shop of this.shops) {
            const sx = shop.worldX - camera.x;
            const sy = shop.worldY - camera.y;
            if (sx < -50 || sx > CANVAS_W + 50 || sy < -50 || sy > CANVAS_H + 50) continue;
            this.renderShop(ctx, sx, sy, shop.name);
        }

        // Render world gems
        for (const gem of this.gems) {
            if (gem.collected) continue;
            const sx = gem.x - camera.x;
            const sy = gem.y - camera.y;
            if (sx < -20 || sx > CANVAS_W + 20 || sy < -20 || sy > CANVAS_H + 20) continue;
            this.renderGem(ctx, sx, sy, time, gem);
        }

        // Render coins
        for (const coin of this.coins) {
            if (coin.collected) continue;
            const cx = coin.x - camera.x;
            const cy = coin.y - camera.y;
            if (cx < -16 || cx > CANVAS_W + 16 || cy < -16 || cy > CANVAS_H + 16) continue;
            this.renderCoin(ctx, cx, cy, time);
        }

        // Render Lady of the Lake (visible until Excalibur is given)
        if (this.ladyOfLake && !this.ladyOfLake.excaliburGiven) {
            const lx = this.ladyOfLake.x - camera.x;
            const ly = this.ladyOfLake.y - camera.y;
            if (lx > -60 && lx < CANVAS_W + 60 && ly > -60 && ly < CANVAS_H + 60) {
                this.renderLadyOfLake(ctx, lx, ly, time);
            }
        }

        // Render green gems
        for (const gem of this.greenGems) {
            if (gem.collected) continue;
            const gsx = gem.x - camera.x;
            const gsy = gem.y - camera.y;
            if (gsx < -20 || gsx > CANVAS_W + 20 || gsy < -20 || gsy > CANVAS_H + 20) continue;
            this.renderGreenGem(ctx, gsx, gsy, time, gem);
        }

        // Render cave entrance markers
        for (const entrance of this.caveEntrances) {
            const ex = entrance.worldX - camera.x;
            const ey = entrance.worldY - camera.y;
            if (ex < -60 || ex > CANVAS_W + 60 || ey < -60 || ey > CANVAS_H + 60) continue;
            this.renderCaveEntrance(ctx, ex, ey, time, entrance.label);
        }

        // Render Green Knight Castle sign (castle itself is tile-based like Ing Castle)
        if (this.greenKnightCastle && this.greenCastleBuilt) {
            const gcx = this.greenKnightCastle.x - camera.x;
            const gcy = this.greenKnightCastle.y - camera.y;
            if (gcx > -100 && gcx < CANVAS_W + 100 && gcy > -100 && gcy < CANVAS_H + 100) {
                ctx.fillStyle = "#44ff44";
                ctx.font = "9px monospace";
                ctx.textAlign = "center";
                ctx.fillText("Green Knight's Castle", gcx, gcy - 100);
            }
        }

        // Render Merlin's Hut
        if (this.merlinHut) {
            const hx = this.merlinHut.x - camera.x;
            const hy = this.merlinHut.y - camera.y;
            if (hx > -80 && hx < CANVAS_W + 80 && hy > -80 && hy < CANVAS_H + 80) {
                this.renderMerlinHut(ctx, hx, hy, time);
            }
        }

        // Render Merlin's wand at the hut (if quest active and not collected)
        if (this.merlinHut && this.merlinHut.showWand && !this.merlinHut.wandCollected) {
            const wx = this.merlinHut.x - camera.x;
            const wy = this.merlinHut.y - camera.y + 22;
            if (wx > -20 && wx < CANVAS_W + 20 && wy > -20 && wy < CANVAS_H + 20) {
                this.renderMerlinWand(ctx, wx, wy, time);
            }
        }

        // Render Merlin
        if (this.merlin) {
            const mx = this.merlin.x - camera.x;
            const my = this.merlin.y - camera.y;
            if (mx > -60 && mx < CANVAS_W + 60 && my > -60 && my < CANVAS_H + 60) {
                this.renderMerlin(ctx, mx, my, time);
            }
        }
    }

    renderTileDetail(ctx, tile, sx, sy, tx, ty, time) {
        switch (tile) {
            case TILE.TREE:
                // Trunk
                ctx.fillStyle = "#5a3a1a";
                ctx.fillRect(sx + 12, sy + 18, 8, 14);
                // Canopy
                ctx.fillStyle = "#2a7a1a";
                ctx.beginPath();
                ctx.arc(sx + 16, sy + 14, 12, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = "#1a6a10";
                ctx.beginPath();
                ctx.arc(sx + 14, sy + 12, 8, 0, Math.PI * 2);
                ctx.fill();
                break;

            case TILE.WATER: {
                // Wave animation
                const wave = Math.sin(time * 0.002 + tx * 0.5 + ty * 0.3) * 10;
                ctx.fillStyle = `rgba(100, ${170 + wave}, 255, 0.3)`;
                ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
                break;
            }

            case TILE.BRIDGE:
                ctx.strokeStyle = "#6a4a2a";
                ctx.lineWidth = 1;
                for (let i = 0; i < TILE_SIZE; i += 8) {
                    ctx.beginPath();
                    ctx.moveTo(sx + i, sy);
                    ctx.lineTo(sx + i, sy + TILE_SIZE);
                    ctx.stroke();
                }
                break;

            case TILE.MOUNTAIN:
                ctx.fillStyle = "#8a8a9a";
                ctx.beginPath();
                ctx.moveTo(sx, sy + TILE_SIZE);
                ctx.lineTo(sx + TILE_SIZE / 2, sy + 2);
                ctx.lineTo(sx + TILE_SIZE, sy + TILE_SIZE);
                ctx.fill();
                ctx.fillStyle = "#fff";
                ctx.beginPath();
                ctx.moveTo(sx + TILE_SIZE / 2 - 4, sy + 8);
                ctx.lineTo(sx + TILE_SIZE / 2, sy + 2);
                ctx.lineTo(sx + TILE_SIZE / 2 + 4, sy + 8);
                ctx.fill();
                break;

            case TILE.CASTLE_WALL:
                ctx.fillStyle = "#3a3a4a";
                ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
                // Battlements
                ctx.fillStyle = "#4a4a5a";
                for (let i = 0; i < TILE_SIZE; i += 8) {
                    ctx.fillRect(sx + i, sy, 4, 6);
                }
                break;

            case TILE.SHOP_FLOOR:
                // Checkerboard pattern
                if ((tx + ty) % 2 === 0) {
                    ctx.fillStyle = "#7a6a4a";
                    ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
                }
                break;

            case TILE.LAVA: {
                const pulse = Math.sin(time * 0.003 + tx + ty) * 20;
                ctx.fillStyle = `rgb(${204 + pulse}, ${51 + pulse * 0.5}, 0)`;
                ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
                break;
            }

            case TILE.CAVE_ENTRANCE: {
                // Dark cave floor
                ctx.fillStyle = "#1a1a1a";
                ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
                // Purple-tinted border glow
                ctx.strokeStyle = `rgba(120, 80, 180, ${0.4 + Math.sin(time * 0.003 + tx) * 0.2})`;
                ctx.lineWidth = 1;
                ctx.strokeRect(sx + 1, sy + 1, TILE_SIZE - 2, TILE_SIZE - 2);
                break;
            }

            case TILE.CAVE_WALL: {
                // Rocky cave wall
                ctx.fillStyle = "#2a2a2a";
                ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
                // Rock texture
                const rHash = (tx * 31 + ty * 17) % 5;
                ctx.fillStyle = "#333";
                ctx.fillRect(sx + rHash * 3, sy + 2, 8, 6);
                ctx.fillRect(sx + 14 - rHash * 2, sy + 18, 10, 5);
                ctx.fillStyle = "#252525";
                ctx.fillRect(sx + 8 + rHash, sy + 10, 6, 8);
                break;
            }

            case TILE.CAVE_FLOOR: {
                // Subtle floor variation
                const fHash = ((tx * 13 + ty * 7) % 4) * 5;
                ctx.fillStyle = `rgb(${55 + fHash}, ${55 + fHash}, ${55 + fHash})`;
                ctx.fillRect(sx, sy, TILE_SIZE + 1, TILE_SIZE + 1);
                // Small pebbles
                if ((tx + ty * 3) % 7 === 0) {
                    ctx.fillStyle = "#4a4a4a";
                    ctx.beginPath();
                    ctx.arc(sx + 10, sy + 20, 2, 0, Math.PI * 2);
                    ctx.fill();
                }
                if ((tx * 5 + ty) % 11 === 0) {
                    ctx.fillStyle = "#484848";
                    ctx.beginPath();
                    ctx.arc(sx + 22, sy + 8, 1.5, 0, Math.PI * 2);
                    ctx.fill();
                }
                break;
            }

            case TILE.BURNING_TREE: {
                // Charred trunk
                ctx.fillStyle = "#3a2010";
                ctx.fillRect(sx + 12, sy + 18, 8, 14);
                // Burning canopy with animated flames
                const flicker = Math.sin(time * 0.01 + tx * 3 + ty * 5) * 2;
                const flicker2 = Math.cos(time * 0.008 + tx * 2) * 3;
                // Outer flames
                ctx.fillStyle = "#ff4400";
                ctx.beginPath();
                ctx.arc(sx + 16 + flicker, sy + 12, 14, 0, Math.PI * 2);
                ctx.fill();
                // Inner flames
                ctx.fillStyle = "#ff8800";
                ctx.beginPath();
                ctx.arc(sx + 14 + flicker2, sy + 10, 10, 0, Math.PI * 2);
                ctx.fill();
                // Core glow
                ctx.fillStyle = "#ffcc00";
                ctx.beginPath();
                ctx.arc(sx + 16, sy + 14 + flicker, 6, 0, Math.PI * 2);
                ctx.fill();
                // Fire glow effect
                ctx.save();
                ctx.shadowColor = "#ff4400";
                ctx.shadowBlur = 15;
                ctx.fillStyle = "rgba(255, 100, 0, 0.3)";
                ctx.beginPath();
                ctx.arc(sx + 16, sy + 14, 18, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
                break;
            }
        }
    }

    renderDecoration(ctx, dec, sx, sy) {
        switch (dec.type) {
            case "flower": {
                const colors = ["#ff6688", "#ffaa44", "#ffff66", "#ff44aa"];
                ctx.fillStyle = colors[Math.floor(Math.abs(dec.x * 7 + dec.y * 13)) % colors.length];
                ctx.beginPath();
                ctx.arc(sx, sy, 3, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = "#4a8a2a";
                ctx.fillRect(sx - 0.5, sy + 2, 1, 4);
                break;
            }
            case "bush":
                ctx.fillStyle = "#3a8a2a";
                ctx.beginPath();
                ctx.arc(sx, sy, 5, 0, Math.PI * 2);
                ctx.fill();
                break;
            case "cactus":
                ctx.fillStyle = "#4a9a3a";
                ctx.fillRect(sx - 2, sy - 6, 4, 12);
                ctx.fillRect(sx - 6, sy - 3, 4, 3);
                ctx.fillRect(sx + 2, sy - 4, 4, 3);
                break;
            case "rock":
                ctx.fillStyle = "#8a8a8a";
                ctx.beginPath();
                ctx.ellipse(sx, sy, 5, 3, 0, 0, Math.PI * 2);
                ctx.fill();
                break;
            case "rubble":
                ctx.fillStyle = "#6a6a5a";
                ctx.fillRect(sx - 3, sy - 2, 6, 4);
                ctx.fillStyle = "#5a5a4a";
                ctx.fillRect(sx + 1, sy - 4, 4, 3);
                break;
        }
    }

    renderShop(ctx, sx, sy, name) {
        // Shop building
        ctx.fillStyle = "#6a4a2a";
        ctx.fillRect(sx - 20, sy - 24, 40, 36);
        // Roof
        ctx.fillStyle = "#8a2a1a";
        ctx.beginPath();
        ctx.moveTo(sx - 24, sy - 24);
        ctx.lineTo(sx, sy - 40);
        ctx.lineTo(sx + 24, sy - 24);
        ctx.fill();
        // Door
        ctx.fillStyle = "#4a3a1a";
        ctx.fillRect(sx - 5, sy, 10, 12);
        // Sign
        ctx.fillStyle = "#ffd700";
        ctx.font = "10px monospace";
        ctx.textAlign = "center";
        ctx.fillText("SHOP", sx, sy - 44);
        // Interaction hint
        ctx.fillStyle = "rgba(255, 215, 0, 0.6)";
        ctx.font = "9px monospace";
        ctx.fillText("[E]", sx, sy + 22);
    }

    renderGem(ctx, sx, sy, time, gem) {
        const pulse = Math.sin(time * 0.004 + gem.pulsePhase) * 0.3 + 0.7;
        const glow = Math.sin(time * 0.003 + gem.pulsePhase) * 5 + 10;

        // Glow
        ctx.save();
        ctx.shadowColor = COLORS.gemGlow;
        ctx.shadowBlur = glow;

        // Diamond shape
        ctx.fillStyle = COLORS.gem;
        ctx.globalAlpha = pulse;
        ctx.beginPath();
        ctx.moveTo(sx, sy - 10);
        ctx.lineTo(sx + 7, sy);
        ctx.lineTo(sx, sy + 10);
        ctx.lineTo(sx - 7, sy);
        ctx.closePath();
        ctx.fill();

        // Inner shine
        ctx.fillStyle = "#aaddff";
        ctx.globalAlpha = pulse * 0.6;
        ctx.beginPath();
        ctx.moveTo(sx, sy - 5);
        ctx.lineTo(sx + 3, sy);
        ctx.lineTo(sx, sy + 5);
        ctx.lineTo(sx - 3, sy);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }

    renderCoin(ctx, sx, sy, time) {
        const bob = Math.sin(time * 0.005 + sx * 0.1) * 2;
        const shine = Math.sin(time * 0.004 + sy * 0.1) * 0.2 + 0.8;
        const cy = sy + bob;

        ctx.save();
        // Glow
        ctx.shadowColor = "#ffd700";
        ctx.shadowBlur = 6;

        // Coin circle
        ctx.fillStyle = `rgba(255, 215, 0, ${shine})`;
        ctx.beginPath();
        ctx.arc(sx, cy, 6, 0, Math.PI * 2);
        ctx.fill();

        // Inner circle
        ctx.fillStyle = `rgba(255, 240, 100, ${shine * 0.7})`;
        ctx.beginPath();
        ctx.arc(sx, cy, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    renderLadyOfLake(ctx, sx, sy, time) {
        const float = Math.sin(time * 0.002) * 3;

        // Water glow beneath
        ctx.save();
        const glowR = 25 + Math.sin(time * 0.003) * 5;
        const gradient = ctx.createRadialGradient(sx, sy + 10, 0, sx, sy + 10, glowR);
        gradient.addColorStop(0, "rgba(100, 180, 255, 0.4)");
        gradient.addColorStop(1, "rgba(100, 180, 255, 0)");
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(sx, sy + 10, glowR, 0, Math.PI * 2);
        ctx.fill();

        // Flowing robe
        ctx.fillStyle = "#88bbee";
        ctx.beginPath();
        ctx.moveTo(sx - 10, sy - 4 + float);
        ctx.lineTo(sx - 14, sy + 18 + float);
        ctx.lineTo(sx + 14, sy + 18 + float);
        ctx.lineTo(sx + 10, sy - 4 + float);
        ctx.fill();

        // Robe detail
        ctx.fillStyle = "#aaddff";
        ctx.beginPath();
        ctx.moveTo(sx - 6, sy - 2 + float);
        ctx.lineTo(sx - 8, sy + 16 + float);
        ctx.lineTo(sx + 8, sy + 16 + float);
        ctx.lineTo(sx + 6, sy - 2 + float);
        ctx.fill();

        // Head
        ctx.fillStyle = "#ffe8cc";
        ctx.beginPath();
        ctx.arc(sx, sy - 10 + float, 7, 0, Math.PI * 2);
        ctx.fill();

        // Hair
        ctx.fillStyle = "#445599";
        ctx.beginPath();
        ctx.arc(sx, sy - 12 + float, 7, Math.PI, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(sx - 7, sy - 10 + float, 2, 12);
        ctx.fillRect(sx + 5, sy - 10 + float, 2, 12);

        // Crown / circlet
        ctx.fillStyle = "#ffd700";
        ctx.fillRect(sx - 5, sy - 17 + float, 10, 2);
        ctx.fillRect(sx - 1, sy - 20 + float, 2, 3);

        // Excalibur in hand (raised)
        const swordGlow = Math.sin(time * 0.005) * 0.3 + 0.7;
        ctx.strokeStyle = `rgba(255, 215, 0, ${swordGlow})`;
        ctx.shadowColor = "#ffd700";
        ctx.shadowBlur = 12;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(sx + 14, sy - 6 + float);
        ctx.lineTo(sx + 18, sy - 30 + float);
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Sword crossguard
        ctx.strokeStyle = "#ffd700";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(sx + 12, sy - 8 + float);
        ctx.lineTo(sx + 22, sy - 8 + float);
        ctx.stroke();

        // Interaction hint
        ctx.fillStyle = `rgba(136, 204, 255, ${0.5 + Math.sin(time * 0.004) * 0.3})`;
        ctx.font = "10px monospace";
        ctx.textAlign = "center";
        ctx.fillText("[E] Speak", sx, sy + 28);

        ctx.restore();
    }

    renderMerlin(ctx, sx, sy, time) {
        const float = Math.sin(time * 0.0015) * 2;

        ctx.save();

        // Magical aura
        const glowR = 20 + Math.sin(time * 0.003) * 5;
        const gradient = ctx.createRadialGradient(sx, sy + 5, 0, sx, sy + 5, glowR);
        gradient.addColorStop(0, "rgba(160, 100, 255, 0.3)");
        gradient.addColorStop(1, "rgba(160, 100, 255, 0)");
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(sx, sy + 5, glowR, 0, Math.PI * 2);
        ctx.fill();

        // Robe
        ctx.fillStyle = "#4a2a8a";
        ctx.beginPath();
        ctx.moveTo(sx - 10, sy - 4 + float);
        ctx.lineTo(sx - 14, sy + 18 + float);
        ctx.lineTo(sx + 14, sy + 18 + float);
        ctx.lineTo(sx + 10, sy - 4 + float);
        ctx.fill();

        // Robe detail
        ctx.fillStyle = "#6a3aaa";
        ctx.beginPath();
        ctx.moveTo(sx - 6, sy - 2 + float);
        ctx.lineTo(sx - 8, sy + 16 + float);
        ctx.lineTo(sx + 8, sy + 16 + float);
        ctx.lineTo(sx + 6, sy - 2 + float);
        ctx.fill();

        // Stars on robe
        ctx.fillStyle = "#ffd700";
        ctx.font = "6px monospace";
        ctx.textAlign = "center";
        ctx.fillText("\u2605", sx - 4, sy + 8 + float);
        ctx.fillText("\u2605", sx + 3, sy + 4 + float);

        // Head
        ctx.fillStyle = "#ffe8cc";
        ctx.beginPath();
        ctx.arc(sx, sy - 10 + float, 7, 0, Math.PI * 2);
        ctx.fill();

        // Beard
        ctx.fillStyle = "#cccccc";
        ctx.beginPath();
        ctx.moveTo(sx - 4, sy - 6 + float);
        ctx.lineTo(sx, sy + 6 + float);
        ctx.lineTo(sx + 4, sy - 6 + float);
        ctx.fill();

        // Pointed hat
        ctx.fillStyle = "#3a1a6a";
        ctx.beginPath();
        ctx.moveTo(sx - 9, sy - 10 + float);
        ctx.lineTo(sx + 2, sy - 32 + float);
        ctx.lineTo(sx + 9, sy - 10 + float);
        ctx.fill();

        // Hat brim
        ctx.fillStyle = "#4a2a7a";
        ctx.fillRect(sx - 10, sy - 11 + float, 20, 3);

        // Hat star
        ctx.fillStyle = "#ffd700";
        ctx.font = "8px monospace";
        ctx.fillText("\u2605", sx + 1, sy - 18 + float);

        // Staff
        ctx.strokeStyle = "#8a6a3a";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(sx + 14, sy - 6 + float);
        ctx.lineTo(sx + 16, sy + 18 + float);
        ctx.stroke();

        // Staff crystal
        const crystalGlow = Math.sin(time * 0.004) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(160, 100, 255, ${crystalGlow})`;
        ctx.shadowColor = "#aa66ff";
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(sx + 14, sy - 10 + float, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Interaction hint
        ctx.fillStyle = `rgba(160, 100, 255, ${0.5 + Math.sin(time * 0.004) * 0.3})`;
        ctx.font = "10px monospace";
        ctx.textAlign = "center";
        ctx.fillText("[E] Speak", sx, sy + 28);

        ctx.restore();
    }

    renderMerlinHut(ctx, sx, sy, time) {
        // Hut walls
        ctx.fillStyle = "#5a3a1a";
        ctx.fillRect(sx - 24, sy - 20, 48, 36);

        // Thatched roof
        ctx.fillStyle = "#6a5a2a";
        ctx.beginPath();
        ctx.moveTo(sx - 30, sy - 20);
        ctx.lineTo(sx, sy - 40);
        ctx.lineTo(sx + 30, sy - 20);
        ctx.fill();

        // Roof thatch lines
        ctx.strokeStyle = "#7a6a3a";
        ctx.lineWidth = 1;
        for (let i = -25; i < 25; i += 5) {
            ctx.beginPath();
            ctx.moveTo(sx + i, sy - 20 - Math.abs(i) * 0.66);
            ctx.lineTo(sx + i, sy - 20);
            ctx.stroke();
        }

        // Door
        ctx.fillStyle = "#3a2a10";
        ctx.fillRect(sx - 6, sy + 2, 12, 14);

        // Windows
        ctx.fillStyle = "#8888aa";
        ctx.fillRect(sx - 18, sy - 10, 8, 8);
        ctx.fillRect(sx + 10, sy - 10, 8, 8);

        // Window glow
        const glow = Math.sin(time * 0.002) * 0.15 + 0.35;
        ctx.fillStyle = `rgba(160, 100, 255, ${glow})`;
        ctx.fillRect(sx - 17, sy - 9, 6, 6);
        ctx.fillRect(sx + 11, sy - 9, 6, 6);

        // Sign
        ctx.fillStyle = "#aa88ff";
        ctx.font = "9px monospace";
        ctx.textAlign = "center";
        ctx.fillText("Merlin's Hut", sx, sy - 44);

        // Lore hint
        ctx.fillStyle = "rgba(170, 136, 255, 0.6)";
        ctx.font = "9px monospace";
        ctx.fillText("[E] Ancient Lore", sx, sy + 24);
    }

    renderMerlinWand(ctx, sx, sy, time) {
        const glow = Math.sin(time * 0.005) * 0.3 + 0.7;
        const bob = Math.sin(time * 0.003) * 2;

        ctx.save();
        ctx.shadowColor = "#aa66ff";
        ctx.shadowBlur = 8;

        // Wand stick
        ctx.strokeStyle = "#8a6a3a";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(sx - 8, sy + 4 + bob);
        ctx.lineTo(sx + 8, sy - 4 + bob);
        ctx.stroke();

        // Wand tip glow
        ctx.fillStyle = `rgba(180, 120, 255, ${glow})`;
        ctx.beginPath();
        ctx.arc(sx + 8, sy - 4 + bob, 4, 0, Math.PI * 2);
        ctx.fill();

        // Pickup hint
        ctx.shadowBlur = 0;
        ctx.fillStyle = `rgba(180, 120, 255, ${0.5 + Math.sin(time * 0.004) * 0.3})`;
        ctx.font = "9px monospace";
        ctx.textAlign = "center";
        ctx.fillText("Merlin's Wand", sx, sy + 16 + bob);

        ctx.restore();
    }

    renderGreenGem(ctx, sx, sy, time, gem) {
        const pulse = Math.sin(time * 0.004 + gem.pulsePhase) * 0.3 + 0.7;
        const glow = Math.sin(time * 0.003 + gem.pulsePhase) * 5 + 10;

        ctx.save();
        ctx.shadowColor = "#44ff44";
        ctx.shadowBlur = glow;

        // Diamond shape (green)
        ctx.fillStyle = "#22aa22";
        ctx.globalAlpha = pulse;
        ctx.beginPath();
        ctx.moveTo(sx, sy - 10);
        ctx.lineTo(sx + 7, sy);
        ctx.lineTo(sx, sy + 10);
        ctx.lineTo(sx - 7, sy);
        ctx.closePath();
        ctx.fill();

        // Inner shine
        ctx.fillStyle = "#88ff88";
        ctx.globalAlpha = pulse * 0.6;
        ctx.beginPath();
        ctx.moveTo(sx, sy - 5);
        ctx.lineTo(sx + 3, sy);
        ctx.lineTo(sx, sy + 5);
        ctx.lineTo(sx - 3, sy);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }

    renderGreenCastle(ctx, sx, sy, time) {
        // Castle walls
        ctx.fillStyle = "#1a4a1a";
        ctx.fillRect(sx - 24, sy - 20, 48, 36);

        // Roof with green tiles
        ctx.fillStyle = "#0a3a0a";
        ctx.beginPath();
        ctx.moveTo(sx - 30, sy - 20);
        ctx.lineTo(sx, sy - 42);
        ctx.lineTo(sx + 30, sy - 20);
        ctx.fill();

        // Door
        ctx.fillStyle = "#0a2a0a";
        ctx.fillRect(sx - 6, sy + 2, 12, 14);

        // Windows with green glow
        const glow = Math.sin(time * 0.002) * 0.15 + 0.35;
        ctx.fillStyle = "#2a5a2a";
        ctx.fillRect(sx - 18, sy - 10, 8, 8);
        ctx.fillRect(sx + 10, sy - 10, 8, 8);
        ctx.fillStyle = `rgba(0, 255, 0, ${glow})`;
        ctx.fillRect(sx - 17, sy - 9, 6, 6);
        ctx.fillRect(sx + 11, sy - 9, 6, 6);

        // Sign
        ctx.fillStyle = "#44ff44";
        ctx.font = "9px monospace";
        ctx.textAlign = "center";
        ctx.fillText("Green Knight's Castle", sx, sy - 46);

        // Banners
        ctx.fillStyle = "#0a5a0a";
        ctx.fillRect(sx - 28, sy - 18, 4, 14);
        ctx.fillRect(sx + 24, sy - 18, 4, 14);
    }

    renderCaveEntrance(ctx, sx, sy, time, label) {
        ctx.save();

        // Pulsing purple glow aura
        const glowPulse = Math.sin(time * 0.003) * 0.15 + 0.4;
        const glowRadius = 36 + Math.sin(time * 0.002) * 4;
        const gradient = ctx.createRadialGradient(sx, sy, 0, sx, sy, glowRadius);
        gradient.addColorStop(0, `rgba(120, 80, 180, ${glowPulse})`);
        gradient.addColorStop(0.6, `rgba(80, 50, 140, ${glowPulse * 0.5})`);
        gradient.addColorStop(1, "rgba(80, 50, 140, 0)");
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(sx, sy, glowRadius, 0, Math.PI * 2);
        ctx.fill();

        // Stone arch frame
        ctx.fillStyle = "#7a7a8a";
        ctx.beginPath();
        ctx.arc(sx, sy - 6, 24, Math.PI, Math.PI * 2);
        ctx.fill();
        // Pillars
        ctx.fillStyle = "#6a6a7a";
        ctx.fillRect(sx - 24, sy - 6, 7, 28);
        ctx.fillRect(sx + 17, sy - 6, 7, 28);
        // Pillar caps
        ctx.fillStyle = "#8a8a9a";
        ctx.fillRect(sx - 26, sy - 8, 11, 4);
        ctx.fillRect(sx + 15, sy - 8, 11, 4);

        // Dark cave opening
        ctx.fillStyle = "#050505";
        ctx.beginPath();
        ctx.ellipse(sx, sy + 4, 16, 20, 0, 0, Math.PI * 2);
        ctx.fill();

        // Inner depth effect
        ctx.fillStyle = "#0a0a15";
        ctx.beginPath();
        ctx.ellipse(sx, sy + 2, 12, 16, 0, 0, Math.PI * 2);
        ctx.fill();

        // Mysterious particles floating out
        for (let i = 0; i < 3; i++) {
            const px = sx + Math.sin(time * 0.003 + i * 2.1) * 10;
            const py = sy - 8 + Math.cos(time * 0.002 + i * 1.7) * 12 - i * 6;
            const pAlpha = Math.sin(time * 0.004 + i) * 0.3 + 0.3;
            ctx.fillStyle = `rgba(160, 120, 255, ${pAlpha})`;
            ctx.beginPath();
            ctx.arc(px, py, 2, 0, Math.PI * 2);
            ctx.fill();
        }

        // Label with shadow for visibility
        ctx.shadowColor = "#000";
        ctx.shadowBlur = 4;
        ctx.fillStyle = `rgba(220, 200, 255, ${0.8 + Math.sin(time * 0.004) * 0.2})`;
        ctx.font = "bold 10px monospace";
        ctx.textAlign = "center";
        ctx.fillText(label, sx, sy - 34);
        ctx.shadowBlur = 0;

        // Interaction hint
        ctx.fillStyle = `rgba(200, 180, 255, ${0.5 + Math.sin(time * 0.004) * 0.2})`;
        ctx.font = "9px monospace";
        ctx.fillText("[E] Enter", sx, sy + 30);

        ctx.restore();
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 0, g: 0, b: 0 };
    }

    renderMinimap(ctx, player, monsters, boss, greenKnight) {
        const mmW = 150, mmH = 150;
        ctx.fillStyle = "#111";
        ctx.fillRect(0, 0, mmW, mmH);

        const scale = mmW / (WORLD_W * TILE_SIZE);

        // Draw zones
        for (const [key, z] of Object.entries(ZONES)) {
            ctx.fillStyle = z.color;
            ctx.globalAlpha = 0.6;
            ctx.fillRect(z.x * TILE_SIZE * scale, z.y * TILE_SIZE * scale,
                z.w * TILE_SIZE * scale, z.h * TILE_SIZE * scale);
        }
        ctx.globalAlpha = 1;

        // Draw shop markers
        for (const shop of this.shops) {
            ctx.fillStyle = COLORS.shopMarker;
            ctx.fillRect(shop.worldX * scale - 2, shop.worldY * scale - 2, 4, 4);
        }

        // Draw monsters
        for (const m of monsters) {
            if (!m.alive) continue;
            ctx.fillStyle = "#ff4444";
            ctx.fillRect(m.x * scale - 1, m.y * scale - 1, 2, 2);
        }

        // Draw boss
        if (boss && boss.alive) {
            ctx.fillStyle = "#ff0000";
            ctx.fillRect(boss.x * scale - 3, boss.y * scale - 3, 6, 6);
        }

        // Draw castle
        ctx.strokeStyle = "#ffd700";
        ctx.lineWidth = 1;
        const cz = ZONES.castle;
        ctx.strokeRect(cz.x * TILE_SIZE * scale, cz.y * TILE_SIZE * scale,
            cz.w * TILE_SIZE * scale, cz.h * TILE_SIZE * scale);

        // Draw Lady of the Lake
        if (this.ladyOfLake && !this.ladyOfLake.excaliburGiven) {
            ctx.fillStyle = "#88ccff";
            ctx.fillRect(this.ladyOfLake.x * scale - 2, this.ladyOfLake.y * scale - 2, 4, 4);
        }

        // Draw Merlin
        if (this.merlin) {
            ctx.fillStyle = "#aa66ff";
            ctx.fillRect(this.merlin.x * scale - 2, this.merlin.y * scale - 2, 4, 4);
        }

        // Draw Merlin's Hut
        if (this.merlinHut) {
            ctx.fillStyle = "#aa66ff";
            ctx.fillRect(this.merlinHut.x * scale - 2, this.merlinHut.y * scale - 2, 4, 4);
        }

        // Draw Green Knight Castle (always visible on minimap)
        if (this.greenKnightCastle) {
            ctx.fillStyle = "#44ff44";
            ctx.fillRect(this.greenKnightCastle.x * scale - 3, this.greenKnightCastle.y * scale - 3, 6, 6);
        }

        // Draw Green Knight
        if (greenKnight && greenKnight.alive) {
            ctx.fillStyle = "#00ff00";
            ctx.fillRect(greenKnight.x * scale - 3, greenKnight.y * scale - 3, 6, 6);
        }

        // Draw cave entrances
        for (const entrance of this.caveEntrances) {
            ctx.fillStyle = "#8866aa";
            ctx.fillRect(entrance.worldX * scale - 2, entrance.worldY * scale - 2, 5, 5);
        }

        // Draw player
        ctx.fillStyle = "#00ff00";
        ctx.fillRect(player.x * scale - 2, player.y * scale - 2, 5, 5);
    }

    renderWorldMap(ctx, player) {
        const mapW = 600, mapH = 450;
        ctx.fillStyle = "#1a1a2e";
        ctx.fillRect(0, 0, mapW, mapH);

        const scaleX = mapW / (WORLD_W * TILE_SIZE);
        const scaleY = mapH / (WORLD_H * TILE_SIZE);
        const scale = Math.min(scaleX, scaleY);
        const offsetX = (mapW - WORLD_W * TILE_SIZE * scale) / 2;
        const offsetY = (mapH - WORLD_H * TILE_SIZE * scale) / 2;

        // Draw zones with labels
        for (const [key, z] of Object.entries(ZONES)) {
            const zx = z.x * TILE_SIZE * scale + offsetX;
            const zy = z.y * TILE_SIZE * scale + offsetY;
            const zw = z.w * TILE_SIZE * scale;
            const zh = z.h * TILE_SIZE * scale;

            ctx.fillStyle = z.color;
            ctx.globalAlpha = 0.7;
            ctx.fillRect(zx, zy, zw, zh);

            ctx.strokeStyle = "#555";
            ctx.lineWidth = 1;
            ctx.globalAlpha = 0.5;
            ctx.strokeRect(zx, zy, zw, zh);

            ctx.globalAlpha = 1;
            ctx.fillStyle = "#fff";
            ctx.font = "11px monospace";
            ctx.textAlign = "center";
            ctx.fillText(z.name, zx + zw / 2, zy + zh / 2 + 4);
        }

        // Draw shop markers
        ctx.globalAlpha = 1;
        for (const shop of this.shops) {
            const sx = shop.worldX * scale + offsetX;
            const sy = shop.worldY * scale + offsetY;
            ctx.fillStyle = COLORS.shopMarker;
            ctx.beginPath();
            ctx.arc(sx, sy, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "#fff";
            ctx.font = "9px monospace";
            ctx.fillText(shop.name, sx, sy - 8);
        }

        // Castle marker
        const cz = ZONES.castle;
        const ccx = (cz.x + cz.w / 2) * TILE_SIZE * scale + offsetX;
        const ccy = (cz.y + cz.h / 2) * TILE_SIZE * scale + offsetY;
        ctx.strokeStyle = "#ffd700";
        ctx.lineWidth = 2;
        ctx.strokeRect(
            cz.x * TILE_SIZE * scale + offsetX,
            cz.y * TILE_SIZE * scale + offsetY,
            cz.w * TILE_SIZE * scale,
            cz.h * TILE_SIZE * scale
        );
        ctx.fillStyle = "#ffd700";
        ctx.font = "bold 12px monospace";
        ctx.fillText("⚔ Ing Castle ⚔", ccx, ccy - 8);

        // Lady of the Lake marker
        if (this.ladyOfLake && !this.ladyOfLake.excaliburGiven) {
            const lx = this.ladyOfLake.x * scale + offsetX;
            const ly = this.ladyOfLake.y * scale + offsetY;
            ctx.fillStyle = "#88ccff";
            ctx.beginPath();
            ctx.arc(lx, ly, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "#fff";
            ctx.font = "9px monospace";
            ctx.fillText("Lady of the Lake", lx, ly - 8);
        }

        // Merlin marker
        if (this.merlin) {
            const mx = this.merlin.x * scale + offsetX;
            const my = this.merlin.y * scale + offsetY;
            ctx.fillStyle = "#aa66ff";
            ctx.beginPath();
            ctx.arc(mx, my, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "#fff";
            ctx.font = "9px monospace";
            ctx.fillText("Merlin", mx, my - 8);
        }

        // Merlin's Hut marker
        if (this.merlinHut) {
            const hx = this.merlinHut.x * scale + offsetX;
            const hy = this.merlinHut.y * scale + offsetY;
            ctx.fillStyle = "#aa66ff";
            ctx.beginPath();
            ctx.arc(hx, hy, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "#fff";
            ctx.font = "8px monospace";
            ctx.fillText("Merlin's Hut", hx, hy - 7);
        }

        // Green Knight Castle marker (always visible on world map)
        if (this.greenKnightCastle) {
            const gx = this.greenKnightCastle.x * scale + offsetX;
            const gy = this.greenKnightCastle.y * scale + offsetY;
            ctx.fillStyle = "#44ff44";
            ctx.beginPath();
            ctx.arc(gx, gy, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "#fff";
            ctx.font = "9px monospace";
            ctx.textAlign = "center";
            ctx.fillText("Green Castle", gx, gy - 8);
        }

        // Cave entrance markers
        for (const entrance of this.caveEntrances) {
            const ex = entrance.worldX * scale + offsetX;
            const ey = entrance.worldY * scale + offsetY;
            ctx.fillStyle = "#8866aa";
            ctx.beginPath();
            ctx.arc(ex, ey, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "#ccc";
            ctx.font = "8px monospace";
            ctx.textAlign = "center";
            ctx.fillText(entrance.label, ex, ey - 7);
        }

        // Player position
        const px = player.x * scale + offsetX;
        const py = player.y * scale + offsetY;
        ctx.fillStyle = "#00ff00";
        ctx.beginPath();
        ctx.arc(px, py, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.font = "9px monospace";
        ctx.fillText("Ingoizer", px, py - 10);

        // Legend
        ctx.textAlign = "left";
        ctx.fillStyle = "#aaa";
        ctx.font = "10px monospace";
        const ly = mapH - 50;
        ctx.fillStyle = "#00ff00"; ctx.fillRect(10, ly, 8, 8);
        ctx.fillStyle = "#aaa"; ctx.fillText("You", 22, ly + 8);
        ctx.fillStyle = COLORS.shopMarker; ctx.fillRect(60, ly, 8, 8);
        ctx.fillStyle = "#aaa"; ctx.fillText("Shop", 72, ly + 8);
        ctx.fillStyle = "#ffd700"; ctx.fillRect(120, ly, 8, 8);
        ctx.fillStyle = "#aaa"; ctx.fillText("Castle", 132, ly + 8);
        ctx.fillStyle = "#8866aa"; ctx.fillRect(190, ly, 8, 8);
        ctx.fillStyle = "#aaa"; ctx.fillText("Cave", 202, ly + 8);
    }
}

// ============================================
// Cave World - Individual cave instances
// ============================================

class CaveWorld {
    constructor(entranceId) {
        this.entranceId = entranceId;
        const entrance = CAVE_ENTRANCES.find(e => e.id === entranceId);
        this.difficulty = entrance ? entrance.difficulty : 1;
        this.tiles = [];
        this.decorations = [];
        this.exit = null; // single exit back to surface
        this.centerExit = null; // maze caves have an exit in the middle
        this.bossSpawnTile = null;
        this.treasurePos = null; // location of treasure/gem in center
        this.generate();
    }

    generate() {
        const rng = seededRandom(77 + this.entranceId * 31);
        this.tiles = new Array(CAVE_H);

        // Fill with cave walls
        for (let y = 0; y < CAVE_H; y++) {
            this.tiles[y] = new Array(CAVE_W);
            for (let x = 0; x < CAVE_W; x++) {
                this.tiles[y][x] = TILE.CAVE_WALL;
            }
        }

        if (this.difficulty <= 2) {
            this.generateMaze(rng);
        } else {
            this.generateBossCave(rng);
        }

        this.generateCaveDecorations(rng);
    }

    generateMaze(rng) {
        // Maze: entrance at bottom, treasure/exit at center
        const mazeW = Math.floor((CAVE_W - 4) / 2);
        const mazeH = Math.floor((CAVE_H - 4) / 2);

        // Initialize maze grid (true = wall)
        const maze = new Array(mazeH * 2 + 1);
        for (let y = 0; y < mazeH * 2 + 1; y++) {
            maze[y] = new Array(mazeW * 2 + 1).fill(true);
        }

        // Recursive backtracker maze generation
        const visited = new Array(mazeH);
        for (let y = 0; y < mazeH; y++) visited[y] = new Array(mazeW).fill(false);

        const stack = [];
        const startCellX = 0, startCellY = mazeH - 1;
        visited[startCellY][startCellX] = true;
        maze[startCellY * 2 + 1][startCellX * 2 + 1] = false;
        stack.push([startCellX, startCellY]);

        while (stack.length > 0) {
            const [cx, cy] = stack[stack.length - 1];
            const neighbors = [];
            if (cx > 0 && !visited[cy][cx - 1]) neighbors.push([-1, 0]);
            if (cx < mazeW - 1 && !visited[cy][cx + 1]) neighbors.push([1, 0]);
            if (cy > 0 && !visited[cy - 1][cx]) neighbors.push([0, -1]);
            if (cy < mazeH - 1 && !visited[cy + 1][cx]) neighbors.push([0, 1]);

            if (neighbors.length > 0) {
                const [dx, dy] = neighbors[Math.floor(rng() * neighbors.length)];
                const nx = cx + dx, ny = cy + dy;
                visited[ny][nx] = true;
                maze[cy * 2 + 1 + dy][cx * 2 + 1 + dx] = false; // remove wall between
                maze[ny * 2 + 1][nx * 2 + 1] = false; // mark cell open
                stack.push([nx, ny]);
            } else {
                stack.pop();
            }
        }

        // Apply maze to cave tiles (offset by 2 to leave border)
        for (let y = 0; y < mazeH * 2 + 1 && y + 2 < CAVE_H; y++) {
            for (let x = 0; x < mazeW * 2 + 1 && x + 2 < CAVE_W; x++) {
                if (!maze[y][x]) {
                    this.tiles[y + 2][x + 2] = TILE.CAVE_FLOOR;
                }
            }
        }

        // Widen all corridors to 2-wide for playability
        const tempTiles = new Array(CAVE_H);
        for (let y = 0; y < CAVE_H; y++) {
            tempTiles[y] = [...this.tiles[y]];
        }
        for (let y = 2; y < CAVE_H - 2; y++) {
            for (let x = 2; x < CAVE_W - 2; x++) {
                if (tempTiles[y][x] === TILE.CAVE_FLOOR) {
                    if (this.tiles[y][x + 1] === TILE.CAVE_WALL && x + 1 < CAVE_W - 1) this.tiles[y][x + 1] = TILE.CAVE_FLOOR;
                    if (this.tiles[y + 1] && this.tiles[y + 1][x] === TILE.CAVE_WALL && y + 1 < CAVE_H - 1) this.tiles[y + 1][x] = TILE.CAVE_FLOOR;
                }
            }
        }

        // Entrance at bottom-center
        const exitX = Math.floor(CAVE_W / 2);
        const exitY = CAVE_H - 4;
        this.carveRoom(exitX, exitY, 3);
        this.tiles[exitY][exitX] = TILE.CAVE_ENTRANCE;
        this.exit = {
            id: this.entranceId,
            x: exitX, y: exitY,
            worldX: exitX * TILE_SIZE + TILE_SIZE / 2,
            worldY: exitY * TILE_SIZE + TILE_SIZE / 2,
        };

        // Connect entrance to maze
        this.carveTunnel(exitX, exitY, exitX, exitY - 10, rng);

        // Center treasure room
        const centerX = Math.floor(CAVE_W / 2);
        const centerY = Math.floor(CAVE_H / 2);
        this.carveRoom(centerX, centerY, 4);
        this.treasurePos = {
            x: centerX * TILE_SIZE + TILE_SIZE / 2,
            y: centerY * TILE_SIZE + TILE_SIZE / 2,
            tileX: centerX, tileY: centerY,
        };

        // Center exit
        this.tiles[centerY][centerX] = TILE.CAVE_ENTRANCE;
        this.centerExit = {
            id: this.entranceId,
            x: centerX, y: centerY,
            worldX: centerX * TILE_SIZE + TILE_SIZE / 2,
            worldY: centerY * TILE_SIZE + TILE_SIZE / 2,
        };

        // Ensure path from entrance to center
        this.carveTunnel(exitX, exitY - 10, centerX, centerY, rng);
    }

    generateBossCave(rng) {
        // Open cave with organic layout + boss room at center
        const open = new Array(CAVE_H);
        for (let y = 0; y < CAVE_H; y++) open[y] = new Array(CAVE_W).fill(false);

        for (let y = 2; y < CAVE_H - 2; y++) {
            for (let x = 2; x < CAVE_W - 2; x++) {
                if (rng() < 0.45) open[y][x] = true;
            }
        }

        for (let pass = 0; pass < 5; pass++) {
            const next = new Array(CAVE_H);
            for (let y = 0; y < CAVE_H; y++) next[y] = new Array(CAVE_W).fill(false);
            for (let y = 2; y < CAVE_H - 2; y++) {
                for (let x = 2; x < CAVE_W - 2; x++) {
                    let walls = 0;
                    for (let dy = -1; dy <= 1; dy++) {
                        for (let dx = -1; dx <= 1; dx++) {
                            if (!open[y + dy][x + dx]) walls++;
                        }
                    }
                    next[y][x] = walls < 5;
                }
            }
            for (let y = 2; y < CAVE_H - 2; y++) {
                for (let x = 2; x < CAVE_W - 2; x++) {
                    open[y][x] = next[y][x];
                }
            }
        }

        for (let y = 0; y < CAVE_H; y++) {
            for (let x = 0; x < CAVE_W; x++) {
                if (open[y][x]) this.tiles[y][x] = TILE.CAVE_FLOOR;
            }
        }

        // Entrance at bottom
        const exitX = Math.floor(CAVE_W / 2);
        const exitY = CAVE_H - 5;
        this.carveRoom(exitX, exitY, 3);
        this.tiles[exitY][exitX] = TILE.CAVE_ENTRANCE;
        this.exit = {
            id: this.entranceId,
            x: exitX, y: exitY,
            worldX: exitX * TILE_SIZE + TILE_SIZE / 2,
            worldY: exitY * TILE_SIZE + TILE_SIZE / 2,
        };

        // Boss room at center
        const bossX = Math.floor(CAVE_W / 2);
        const bossY = Math.floor(CAVE_H / 2);
        this.carveRoom(bossX, bossY, 6);
        this.bossSpawnTile = { x: bossX, y: bossY };

        // Connect entrance to boss room
        this.carveTunnel(exitX, exitY, bossX, bossY, rng);
    }

    carveRoom(cx, cy, radius) {
        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                if (Math.sqrt(dx * dx + dy * dy) <= radius) {
                    const tx = cx + dx, ty = cy + dy;
                    if (tx >= 1 && tx < CAVE_W - 1 && ty >= 1 && ty < CAVE_H - 1) {
                        this.tiles[ty][tx] = TILE.CAVE_FLOOR;
                    }
                }
            }
        }
    }

    carveTunnel(x1, y1, x2, y2, rng) {
        let x = x1, y = y1;
        while (x !== x2 || y !== y2) {
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    const tx = x + dx, ty = y + dy;
                    if (tx >= 1 && tx < CAVE_W - 1 && ty >= 1 && ty < CAVE_H - 1) {
                        if (this.tiles[ty][tx] === TILE.CAVE_WALL) {
                            this.tiles[ty][tx] = TILE.CAVE_FLOOR;
                        }
                    }
                }
            }
            if (rng() < 0.6) {
                if (x < x2) x++; else if (x > x2) x--;
            } else {
                if (y < y2) y++; else if (y > y2) y--;
            }
        }
    }

    generateCaveDecorations(rng) {
        this.decorations = [];
        for (let i = 0; i < 300; i++) {
            const tx = Math.floor(rng() * CAVE_W);
            const ty = Math.floor(rng() * CAVE_H);
            if (ty >= 0 && ty < CAVE_H && tx >= 0 && tx < CAVE_W && this.tiles[ty][tx] === TILE.CAVE_FLOOR) {
                const hasWallAbove = ty > 0 && this.tiles[ty - 1][tx] === TILE.CAVE_WALL;
                const hasWallBelow = ty < CAVE_H - 1 && this.tiles[ty + 1][tx] === TILE.CAVE_WALL;
                let type;
                if (hasWallAbove && rng() < 0.4) type = "stalactite";
                else if (hasWallBelow && rng() < 0.4) type = "stalagmite";
                else if (rng() < 0.3) type = "crystal";
                else type = rng() < 0.5 ? "stalactite" : "stalagmite";

                this.decorations.push({
                    x: tx * TILE_SIZE + rng() * TILE_SIZE,
                    y: ty * TILE_SIZE + rng() * TILE_SIZE,
                    type, size: 3 + rng() * 6,
                });
            }
        }
    }

    isSolid(tx, ty) {
        if (tx < 0 || tx >= CAVE_W || ty < 0 || ty >= CAVE_H) return true;
        return this.tiles[ty][tx] === TILE.CAVE_WALL;
    }

    render(ctx, camera, time) {
        const startTX = Math.floor(camera.x / TILE_SIZE) - 1;
        const startTY = Math.floor(camera.y / TILE_SIZE) - 1;
        const endTX = startTX + TILES_X + 2;
        const endTY = startTY + TILES_Y + 2;

        for (let ty = startTY; ty <= endTY; ty++) {
            for (let tx = startTX; tx <= endTX; tx++) {
                if (tx < 0 || tx >= CAVE_W || ty < 0 || ty >= CAVE_H) {
                    ctx.fillStyle = "#0a0a0a";
                    ctx.fillRect(tx * TILE_SIZE - camera.x, ty * TILE_SIZE - camera.y, TILE_SIZE, TILE_SIZE);
                    continue;
                }

                const tile = this.tiles[ty][tx];
                const sx = tx * TILE_SIZE - camera.x;
                const sy = ty * TILE_SIZE - camera.y;

                ctx.fillStyle = TILE_COLORS[tile] || "#1a1a1a";

                // Cave floor variation
                if (tile === TILE.CAVE_FLOOR) {
                    const variation = ((tx * 7 + ty * 13) % 3) * 5;
                    ctx.fillStyle = `rgb(${55 + variation}, ${53 + variation}, ${50 + variation})`;
                }

                ctx.fillRect(sx, sy, TILE_SIZE + 1, TILE_SIZE + 1);

                // Tile details
                if (tile === TILE.CAVE_WALL) {
                    // Rocky texture
                    const rHash = (tx * 31 + ty * 17) % 5;
                    ctx.fillStyle = "#252525";
                    ctx.fillRect(sx + rHash * 3, sy + 2, 8, 6);
                    ctx.fillRect(sx + 14 - rHash * 2, sy + 18, 10, 5);
                    ctx.fillStyle = "#1e1e1e";
                    ctx.fillRect(sx + 8 + rHash, sy + 10, 6, 8);
                } else if (tile === TILE.CAVE_ENTRANCE) {
                    // Ladder
                    ctx.strokeStyle = "#8a6a3a";
                    ctx.lineWidth = 3;
                    // Vertical rails
                    ctx.beginPath();
                    ctx.moveTo(sx + 10, sy + 2);
                    ctx.lineTo(sx + 10, sy + TILE_SIZE - 2);
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.moveTo(sx + TILE_SIZE - 10, sy + 2);
                    ctx.lineTo(sx + TILE_SIZE - 10, sy + TILE_SIZE - 2);
                    ctx.stroke();
                    // Rungs
                    ctx.lineWidth = 2;
                    for (let r = 6; r < TILE_SIZE - 2; r += 7) {
                        ctx.beginPath();
                        ctx.moveTo(sx + 10, sy + r);
                        ctx.lineTo(sx + TILE_SIZE - 10, sy + r);
                        ctx.stroke();
                    }
                    // Glow effect
                    const ladderGlow = Math.sin(time * 0.003) * 0.2 + 0.3;
                    ctx.fillStyle = `rgba(200, 180, 100, ${ladderGlow})`;
                    ctx.beginPath();
                    ctx.arc(sx + TILE_SIZE / 2, sy + TILE_SIZE / 2, 14, 0, Math.PI * 2);
                    ctx.fill();
                } else if (tile === TILE.CAVE_FLOOR) {
                    // Small pebbles
                    if ((tx + ty * 3) % 7 === 0) {
                        ctx.fillStyle = "#4a4a4a";
                        ctx.beginPath();
                        ctx.arc(sx + 10, sy + 20, 2, 0, Math.PI * 2);
                        ctx.fill();
                    }
                }
            }
        }

        // Render decorations
        for (const dec of this.decorations) {
            const sx = dec.x - camera.x;
            const sy = dec.y - camera.y;
            if (sx < -20 || sx > CANVAS_W + 20 || sy < -20 || sy > CANVAS_H + 20) continue;
            this.renderCaveDecoration(ctx, dec, sx, sy, time);
        }

        // Exit labels rendered via renderExitLabels
    }

    renderCaveDecoration(ctx, dec, sx, sy, time) {
        switch (dec.type) {
            case "stalactite": {
                // Hanging from ceiling - pointed downward
                const h = dec.size * 2;
                ctx.fillStyle = "#5a5a5a";
                ctx.beginPath();
                ctx.moveTo(sx - dec.size * 0.6, sy);
                ctx.lineTo(sx, sy + h);
                ctx.lineTo(sx + dec.size * 0.6, sy);
                ctx.fill();
                // Drip effect
                ctx.fillStyle = "#4a4a6a";
                ctx.beginPath();
                ctx.moveTo(sx - dec.size * 0.3, sy);
                ctx.lineTo(sx, sy + h * 0.7);
                ctx.lineTo(sx + dec.size * 0.3, sy);
                ctx.fill();
                // Water drip
                if (Math.sin(time * 0.002 + dec.x) > 0.9) {
                    ctx.fillStyle = "rgba(100, 150, 255, 0.5)";
                    ctx.beginPath();
                    ctx.arc(sx, sy + h + 2, 1.5, 0, Math.PI * 2);
                    ctx.fill();
                }
                break;
            }
            case "stalagmite": {
                // Rising from floor - pointed upward
                const h = dec.size * 2;
                ctx.fillStyle = "#5a5a4a";
                ctx.beginPath();
                ctx.moveTo(sx - dec.size * 0.6, sy);
                ctx.lineTo(sx, sy - h);
                ctx.lineTo(sx + dec.size * 0.6, sy);
                ctx.fill();
                // Highlight
                ctx.fillStyle = "#6a6a5a";
                ctx.beginPath();
                ctx.moveTo(sx - dec.size * 0.2, sy);
                ctx.lineTo(sx, sy - h * 0.8);
                ctx.lineTo(sx + dec.size * 0.2, sy);
                ctx.fill();
                break;
            }
            case "crystal": {
                // Glowing crystal
                const glow = Math.sin(time * 0.003 + dec.x * 0.1) * 0.3 + 0.5;
                ctx.save();
                ctx.shadowColor = "#6666cc";
                ctx.shadowBlur = 6;
                ctx.fillStyle = `rgba(100, 100, 200, ${glow})`;
                ctx.beginPath();
                ctx.moveTo(sx, sy - dec.size);
                ctx.lineTo(sx + dec.size * 0.4, sy);
                ctx.lineTo(sx, sy + dec.size * 0.3);
                ctx.lineTo(sx - dec.size * 0.4, sy);
                ctx.closePath();
                ctx.fill();
                ctx.restore();
                break;
            }
            case "cave_rock": {
                ctx.fillStyle = "#4a4a4a";
                ctx.beginPath();
                ctx.ellipse(sx, sy, dec.size, dec.size * 0.5, 0, 0, Math.PI * 2);
                ctx.fill();
                break;
            }
        }
    }

    renderMinimap(ctx, player, monsters, caveBoss) {
        const mmW = 150, mmH = 150;
        ctx.fillStyle = "#0a0a0a";
        ctx.fillRect(0, 0, mmW, mmH);

        const scale = mmW / (CAVE_W * TILE_SIZE);

        for (let ty = 0; ty < CAVE_H; ty += 2) {
            for (let tx = 0; tx < CAVE_W; tx += 2) {
                if (this.tiles[ty][tx] === TILE.CAVE_FLOOR || this.tiles[ty][tx] === TILE.CAVE_ENTRANCE) {
                    ctx.fillStyle = this.tiles[ty][tx] === TILE.CAVE_ENTRANCE ? "#8a6a3a" : "#3a3a3a";
                    ctx.fillRect(tx * TILE_SIZE * scale, ty * TILE_SIZE * scale, 3, 3);
                }
            }
        }

        // Draw exit
        if (this.exit) {
            ctx.fillStyle = "#8a6a3a";
            ctx.fillRect(this.exit.worldX * scale - 2, this.exit.worldY * scale - 2, 5, 5);
        }
        if (this.centerExit) {
            ctx.fillStyle = "#ffd700";
            ctx.fillRect(this.centerExit.worldX * scale - 2, this.centerExit.worldY * scale - 2, 5, 5);
        }

        for (const m of monsters) {
            if (!m.alive) continue;
            ctx.fillStyle = "#ff4444";
            ctx.fillRect(m.x * scale - 1, m.y * scale - 1, 2, 2);
        }

        if (caveBoss && caveBoss.alive) {
            ctx.fillStyle = "#ff0000";
            ctx.fillRect(caveBoss.x * scale - 3, caveBoss.y * scale - 3, 6, 6);
        }

        ctx.fillStyle = "#00ff00";
        ctx.fillRect(player.x * scale - 2, player.y * scale - 2, 5, 5);

        const entrance = CAVE_ENTRANCES.find(e => e.id === this.entranceId);
        ctx.fillStyle = "#8866aa";
        ctx.font = "9px monospace";
        ctx.textAlign = "center";
        ctx.fillText(entrance ? entrance.label : "CAVE", mmW / 2, mmH - 4);
    }

    renderWorldMap(ctx, player) {
        const mapW = 600, mapH = 450;
        ctx.fillStyle = "#0a0a0e";
        ctx.fillRect(0, 0, mapW, mapH);

        const scaleX = mapW / (CAVE_W * TILE_SIZE);
        const scaleY = mapH / (CAVE_H * TILE_SIZE);
        const scale = Math.min(scaleX, scaleY);
        const offsetX = (mapW - CAVE_W * TILE_SIZE * scale) / 2;
        const offsetY = (mapH - CAVE_H * TILE_SIZE * scale) / 2;

        for (let ty = 0; ty < CAVE_H; ty += 2) {
            for (let tx = 0; tx < CAVE_W; tx += 2) {
                if (this.tiles[ty][tx] === TILE.CAVE_FLOOR || this.tiles[ty][tx] === TILE.CAVE_ENTRANCE) {
                    const sx = tx * TILE_SIZE * scale + offsetX;
                    const sy = ty * TILE_SIZE * scale + offsetY;
                    ctx.fillStyle = this.tiles[ty][tx] === TILE.CAVE_ENTRANCE ? "#8a6a3a" : "#3a3a3a";
                    ctx.globalAlpha = 0.7;
                    ctx.fillRect(sx, sy, TILE_SIZE * 2 * scale + 1, TILE_SIZE * 2 * scale + 1);
                }
            }
        }
        ctx.globalAlpha = 1;

        // Exit
        if (this.exit) {
            const ex = this.exit.worldX * scale + offsetX;
            const ey = this.exit.worldY * scale + offsetY;
            ctx.fillStyle = "#8a6a3a";
            ctx.beginPath(); ctx.arc(ex, ey, 5, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = "#fff"; ctx.font = "9px monospace"; ctx.textAlign = "center";
            ctx.fillText("Exit", ex, ey - 8);
        }

        // Boss room marker
        if (this.bossSpawnTile) {
            const bx = this.bossSpawnTile.x * TILE_SIZE * scale + offsetX;
            const by = this.bossSpawnTile.y * TILE_SIZE * scale + offsetY;
            ctx.strokeStyle = "#ff4444"; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(bx, by, 8, 0, Math.PI * 2); ctx.stroke();
            ctx.fillStyle = "#ff4444"; ctx.font = "9px monospace";
            ctx.fillText("Boss Lair", bx, by - 12);
        }

        // Treasure marker
        if (this.treasurePos) {
            const tx = this.treasurePos.x * scale + offsetX;
            const ty = this.treasurePos.y * scale + offsetY;
            ctx.fillStyle = "#ffd700";
            ctx.beginPath(); ctx.arc(tx, ty, 5, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = "#ffd700"; ctx.font = "9px monospace"; ctx.textAlign = "center";
            ctx.fillText("Treasure", tx, ty - 8);
        }

        // Player
        const px = player.x * scale + offsetX;
        const py = player.y * scale + offsetY;
        ctx.fillStyle = "#00ff00";
        ctx.beginPath(); ctx.arc(px, py, 6, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#fff"; ctx.font = "9px monospace";
        ctx.fillText("Ingoizer", px, py - 10);

        const entrance = CAVE_ENTRANCES.find(e => e.id === this.entranceId);
        ctx.fillStyle = "#8866aa";
        ctx.font = "bold 14px monospace";
        ctx.textAlign = "center";
        ctx.fillText(entrance ? entrance.label.toUpperCase() : "CAVE", mapW / 2, 18);
    }

    // Render exit labels (used by game render loop)
    renderExitLabels(ctx, camera, time) {
        const exits = [this.exit, this.centerExit].filter(Boolean);
        for (const exit of exits) {
            const ex = exit.worldX - camera.x;
            const ey = exit.worldY - camera.y;
            if (ex < -60 || ex > CANVAS_W + 60 || ey < -60 || ey > CANVAS_H + 60) continue;
            ctx.save();
            ctx.fillStyle = `rgba(200, 180, 100, ${0.6 + Math.sin(time * 0.004) * 0.2})`;
            ctx.font = "9px monospace";
            ctx.textAlign = "center";
            ctx.fillText("Exit", ex, ey - 20);
            ctx.fillStyle = `rgba(200, 180, 100, ${0.4 + Math.sin(time * 0.004) * 0.2})`;
            ctx.fillText("[E] Climb", ex, ey + 26);
            ctx.restore();
        }
    }
}
