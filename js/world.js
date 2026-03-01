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
        this.gems = GEM_SPAWN_POINTS.map(g => ({
            x: g.x * TILE_SIZE + TILE_SIZE / 2,
            y: g.y * TILE_SIZE + TILE_SIZE / 2,
            zone: g.zone,
            collected: false,
            pulsePhase: Math.random() * Math.PI * 2,
        }));
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
            riddleActive: false,
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

        // Render Lady of the Lake
        if (this.ladyOfLake && !this.ladyOfLake.excaliburGiven) {
            const lx = this.ladyOfLake.x - camera.x;
            const ly = this.ladyOfLake.y - camera.y;
            if (lx > -60 && lx < CANVAS_W + 60 && ly > -60 && ly < CANVAS_H + 60) {
                this.renderLadyOfLake(ctx, lx, ly, time);
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

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 0, g: 0, b: 0 };
    }

    renderMinimap(ctx, player, monsters, boss) {
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

        // Draw gem markers
        for (const gem of this.gems) {
            if (gem.collected) continue;
            ctx.fillStyle = COLORS.gem;
            ctx.fillRect(gem.x * scale - 2, gem.y * scale - 2, 4, 4);
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

        // Draw gem locations
        for (const gem of this.gems) {
            if (gem.collected) continue;
            const gx = gem.x * scale + offsetX;
            const gy = gem.y * scale + offsetY;
            ctx.fillStyle = COLORS.gem;
            ctx.beginPath();
            ctx.moveTo(gx, gy - 5);
            ctx.lineTo(gx + 4, gy);
            ctx.lineTo(gx, gy + 5);
            ctx.lineTo(gx - 4, gy);
            ctx.closePath();
            ctx.fill();
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
        ctx.fillStyle = COLORS.gem; ctx.fillRect(120, ly, 8, 8);
        ctx.fillStyle = "#aaa"; ctx.fillText("Blue Gem", 132, ly + 8);
        ctx.fillStyle = "#ffd700"; ctx.fillRect(210, ly, 8, 8);
        ctx.fillStyle = "#aaa"; ctx.fillText("Castle", 222, ly + 8);
    }
}
