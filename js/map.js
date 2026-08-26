// ============================================
// Ingoizer's World - Maps, Fog of War, and Map Art
// ============================================
//
// Everything the two map surfaces share lives here:
//
//   * FogOfWar      - the discovery grid each realm keeps for itself.
//   * renderFogOfWar - composites the three discovery states over a drawn map.
//   * MapArt        - the frame, plates, markers and legend the maps are built from.
//   * MapTerrain    - the cached illustrated terrain layer both maps read from.
//
// The maps themselves (World / CaveWorld / SkyWorld renderMinimap and
// renderWorldMap) live in world.js and call into this file.

// ============================================
// Fog of war
// ============================================

// Set to false to chart the whole realm from the first frame - useful when
// testing something that lives on the far side of the map.
const FOG_ENABLED = true;

// Discovery is stored per realm on a coarse grid rather than per tile. Coarse
// cells mean the revealed shape has clean, readable edges instead of a ragged
// per-tile crawl, and they keep the mask small enough to rebuild every frame.
const FOG_SETTINGS = {
    // Open country: you chart roughly what fits on screen as you walk.
    surface: { cellTiles: 2, sight: 13, losBlocked: false },
    // Underground: rock stops the eye, so unexplored tunnels stay unexplored
    // even when they run a few paces from a corridor you have walked.
    cave: { cellTiles: 1, sight: 7, losBlocked: true },
    // Above the clouds the view is long but the islands are small.
    sky: { cellTiles: 1, sight: 11, losBlocked: false },
};

// Sight follows the window. The playfield widens to the shape of the screen,
// and a player who can see ground on a wide phone should have it charted -
// otherwise fog sits over terrain that is plainly visible in front of them.
// At the original 800x600 these work out to exactly 13, 7 and 11.
function applyViewSight() {
    const screen = Math.max(8, Math.round(Math.max(CANVAS_W, CANVAS_H) / TILE_SIZE / 2));
    FOG_SETTINGS.surface.sight = screen;
    FOG_SETTINGS.cave.sight = Math.max(4, Math.round(screen * 0.55));
    FOG_SETTINGS.sky.sight = Math.max(6, Math.round(screen * 0.85));
}

class FogOfWar {
    constructor(tilesW, tilesH, settings) {
        this.tilesW = tilesW;
        this.tilesH = tilesH;
        this.cell = settings.cellTiles;
        this.settings = settings;
        this.losBlocked = !!settings.losBlocked;
        this.cols = Math.ceil(tilesW / this.cell);
        this.rows = Math.ceil(tilesH / this.cell);
        this.seen = new Uint8Array(this.cols * this.rows);
        this.charted = 0;
        this.lastTile = null;      // skip the sweep until the player changes tile
        if (!FOG_ENABLED) this.revealAll();
    }

    // Read live, so widening the window immediately widens what gets charted.
    get sight() {
        return this.settings.sight;
    }

    index(col, row) {
        return row * this.cols + col;
    }

    isCellSeen(col, row) {
        if (col < 0 || row < 0 || col >= this.cols || row >= this.rows) return false;
        return this.seen[row * this.cols + col] === 1;
    }

    isTileSeen(tx, ty) {
        return this.isCellSeen(Math.floor(tx / this.cell), Math.floor(ty / this.cell));
    }

    isWorldSeen(wx, wy) {
        return this.isTileSeen(Math.floor(wx / TILE_SIZE), Math.floor(wy / TILE_SIZE));
    }

    fraction() {
        return this.charted / (this.cols * this.rows);
    }

    // Called every frame from the game loop; does real work only when the
    // player has stepped onto a new tile.
    revealAround(worldX, worldY, blocksSight) {
        const tx = Math.floor(worldX / TILE_SIZE);
        const ty = Math.floor(worldY / TILE_SIZE);
        if (this.lastTile && this.lastTile.x === tx && this.lastTile.y === ty) return 0;
        this.lastTile = { x: tx, y: ty };
        return this.revealFromTile(tx, ty, this.sight, this.losBlocked ? blocksSight : null);
    }

    revealFromTile(tx, ty, radius, blocksSight) {
        let gained = 0;
        const c0 = Math.max(0, Math.floor((tx - radius) / this.cell));
        const c1 = Math.min(this.cols - 1, Math.floor((tx + radius) / this.cell));
        const r0 = Math.max(0, Math.floor((ty - radius) / this.cell));
        const r1 = Math.min(this.rows - 1, Math.floor((ty + radius) / this.cell));
        const half = (this.cell - 1) / 2;

        for (let r = r0; r <= r1; r++) {
            for (let c = c0; c <= c1; c++) {
                const i = r * this.cols + c;
                if (this.seen[i]) continue;
                const mx = c * this.cell + half;
                const my = r * this.cell + half;
                const dx = mx - tx;
                const dy = my - ty;
                if (dx * dx + dy * dy > radius * radius) continue;
                if (blocksSight && !this.hasLineOfSight(tx, ty, Math.round(mx), Math.round(my), blocksSight)) continue;
                this.seen[i] = 1;
                gained++;
            }
        }
        this.charted += gained;
        return gained;
    }

    // Bresenham walk. The blocking tile itself is visible - you can see the
    // wall you are standing in front of, just not what is behind it.
    hasLineOfSight(x0, y0, x1, y1, blocksSight) {
        let x = x0, y = y0;
        const dx = Math.abs(x1 - x0);
        const dy = Math.abs(y1 - y0);
        const sx = x0 < x1 ? 1 : -1;
        const sy = y0 < y1 ? 1 : -1;
        let err = dx - dy;
        while (x !== x1 || y !== y1) {
            const e2 = 2 * err;
            if (e2 > -dy) { err -= dy; x += sx; }
            if (e2 < dx) { err += dx; y += sy; }
            if (x === x1 && y === y1) return true;
            if (blocksSight(x, y)) return false;
        }
        return true;
    }

    // Scripted reveals: a map bought from a merchant, a vantage point, a story
    // beat that hands the player a region outright.
    revealTileRect(tx, ty, w, h) {
        const c0 = Math.max(0, Math.floor(tx / this.cell));
        const c1 = Math.min(this.cols - 1, Math.floor((tx + w - 1) / this.cell));
        const r0 = Math.max(0, Math.floor(ty / this.cell));
        const r1 = Math.min(this.rows - 1, Math.floor((ty + h - 1) / this.cell));
        for (let r = r0; r <= r1; r++) {
            for (let c = c0; c <= c1; c++) {
                const i = r * this.cols + c;
                if (!this.seen[i]) { this.seen[i] = 1; this.charted++; }
            }
        }
    }

    revealAll() {
        this.seen.fill(1);
        this.charted = this.cols * this.rows;
    }
}

// ============================================
// Scratch canvases
// ============================================

// The fog compositor needs two throwaway layers per frame. Allocating them on
// every draw would churn the GC, so they are pooled by size.
const MAP_SCRATCH = {};

// Returns a canvas of the requested size, reporting whether it is newly
// allocated. Callers that redraw every frame ask mapScratch() for a cleared
// one; callers that cache a picture check `fresh` and keep what is there.
function mapLayer(key, w, h) {
    w = Math.max(1, Math.ceil(w));
    h = Math.max(1, Math.ceil(h));
    let s = MAP_SCRATCH[key];
    if (!s || s.canvas.width !== w || s.canvas.height !== h) {
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        s = { canvas, ctx: canvas.getContext("2d"), fresh: true };
        MAP_SCRATCH[key] = s;
    } else {
        s.fresh = false;
    }
    return s;
}

function mapScratch(key, w, h) {
    const s = mapLayer(key, w, h);
    if (!s.fresh) {
        s.ctx.setTransform(1, 0, 0, 1, 0, 0);
        s.ctx.globalAlpha = 1;
        s.ctx.globalCompositeOperation = "source-over";
        s.ctx.clearRect(0, 0, s.canvas.width, s.canvas.height);
    }
    return s;
}

// ============================================
// Fog compositing
// ============================================

// A clustered-dot ordered dither. Clustered rather than dispersed because the
// game is pixel art: growing dots read as texture, scattered pixels read as
// noise, and neither reads as a soft photographic blur.
const FOG_DITHER = [
    [12, 5, 6, 13],
    [4, 0, 1, 7],
    [11, 3, 2, 8],
    [15, 10, 9, 14],
];
const FOG_DITHER_N = 4;

const FOG_STYLE = {
    surface: { deep: "#0a1226", mid: "#111d3a", wisp: "rgba(120,150,215,0.10)", dim: "rgba(20,28,52,0.50)" },
    cave: { deep: "#05060c", mid: "#0b0e1a", wisp: "rgba(90,110,160,0.07)", dim: "rgba(10,12,24,0.42)" },
    sky: { deep: "#12203f", mid: "#1c2e54", wisp: "rgba(190,210,255,0.12)", dim: "rgba(30,45,86,0.38)" },
};

// Pre-render the fog texture once per size. It is deliberately not flat black:
// undiscovered ground should read as weather rolled over the parchment, not as
// a hole in the interface.
function fogTexture(w, h, style, seed) {
    // Keyed by size as well as palette: the minimap and the world map ask for
    // different sizes every frame, and a shared key would rebuild both.
    const s = mapLayer(`fogtex:${style.deep}:${Math.ceil(w)}x${Math.ceil(h)}`, w, h);
    if (!s.fresh) return s.canvas;
    const ctx = s.ctx;
    ctx.clearRect(0, 0, s.canvas.width, s.canvas.height);
    w = s.canvas.width;
    h = s.canvas.height;

    const grad = ctx.createLinearGradient(0, 0, w * 0.4, h);
    grad.addColorStop(0, style.mid);
    grad.addColorStop(1, style.deep);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    const rng = seededRandom(seed || 991);

    // Slow banks of cloud.
    for (let i = 0; i < 40; i++) {
        const cx = rng() * w;
        const cy = rng() * h;
        const rx = 18 + rng() * 55;
        ctx.fillStyle = style.wisp;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, rx * (0.28 + rng() * 0.25), rng() * Math.PI, 0, Math.PI * 2);
        ctx.fill();
    }

    // Pixel grain, aligned to a 2px grid so it stays in the game's language.
    ctx.fillStyle = "rgba(255,255,255,0.045)";
    for (let i = 0; i < (w * h) / 90; i++) {
        const gx = Math.floor(rng() * w / 2) * 2;
        const gy = Math.floor(rng() * h / 2) * 2;
        ctx.fillRect(gx, gy, 2, 2);
    }

    return s.canvas;
}

// Composite the three discovery states over a map that has already been drawn.
//
//   rect - destination rectangle on ctx
//   view - { tx, ty, tw, th } the tile region of the realm shown in rect
//   live - { tx, ty, r } the player's tile and current sight radius, or null
//
// Unseen cells get opaque illustrated fog. Cells that are charted but not in
// sight get a cool wash that dims and desaturates without hiding geography.
// Cells in sight are left at full colour.
function renderFogOfWar(ctx, fog, rect, view, live, styleName) {
    if (!fog) return;
    const style = FOG_STYLE[styleName] || FOG_STYLE.surface;
    const cell = fog.cell;

    const c0 = Math.max(0, Math.floor(view.tx / cell));
    const r0 = Math.max(0, Math.floor(view.ty / cell));
    const c1 = Math.min(fog.cols, Math.ceil((view.tx + view.tw) / cell));
    const r1 = Math.min(fog.rows, Math.ceil((view.ty + view.th) / cell));
    const cw = c1 - c0;
    const ch = r1 - r0;
    if (cw <= 0 || ch <= 0) return;

    const D = FOG_DITHER_N;
    const maskW = cw * D;
    const maskH = ch * D;

    const fogMask = mapScratch("fogMask", maskW, maskH);
    const dimMask = mapScratch("dimMask", cw, ch);
    const fogImg = fogMask.ctx.createImageData(maskW, maskH);
    const dimImg = dimMask.ctx.createImageData(cw, ch);
    const fogData = fogImg.data;
    const dimData = dimImg.data;

    const liveR2 = live ? live.r * live.r : -1;
    let anyFog = false;
    let anyDim = false;

    for (let r = r0; r < r1; r++) {
        for (let c = c0; c < c1; c++) {
            const seen = fog.seen[r * fog.cols + c] === 1;

            // Coverage never drops below fully opaque over unseen ground. Only
            // charted cells that border the unknown get a dithered fringe, so
            // the boundary breaks up without ever thinning the fog itself.
            let coverage;
            if (!seen) {
                coverage = 1;
            } else {
                let unseenNeighbours = 0;
                for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        if (dx === 0 && dy === 0) continue;
                        if (!fog.isCellSeen(c + dx, r + dy)) unseenNeighbours++;
                    }
                }
                coverage = (unseenNeighbours / 8) * 0.7;
            }

            const mc = c - c0;
            const mr = r - r0;

            if (coverage > 0) {
                const level = coverage * (D * D);
                for (let sy = 0; sy < D; sy++) {
                    for (let sx = 0; sx < D; sx++) {
                        if (level <= FOG_DITHER[sy][sx]) continue;
                        const px = (mr * D + sy) * maskW + (mc * D + sx);
                        fogData[px * 4 + 3] = 255;
                        anyFog = true;
                    }
                }
            }

            if (!seen) continue;

            // In sight right now? Then no wash at all.
            let inSight = false;
            if (live) {
                const mx = c * cell + (cell - 1) / 2;
                const my = r * cell + (cell - 1) / 2;
                const dx = mx - live.tx;
                const dy = my - live.ty;
                inSight = dx * dx + dy * dy <= liveR2;
            }
            if (!inSight) {
                dimData[(mr * cw + mc) * 4 + 3] = 255;
                anyDim = true;
            }
        }
    }

    if (!anyFog && !anyDim) return;

    const pxPerTileX = rect.w / view.tw;
    const pxPerTileY = rect.h / view.th;
    const dx0 = (c0 * cell - view.tx) * pxPerTileX;
    const dy0 = (r0 * cell - view.ty) * pxPerTileY;
    const dw = cw * cell * pxPerTileX;
    const dh = ch * cell * pxPerTileY;

    // Layer 1: the memory wash over charted-but-unlit ground.
    if (anyDim) {
        dimMask.ctx.putImageData(dimImg, 0, 0);
        const dimLayer = mapScratch("fogDimLayer", rect.w, rect.h);
        dimLayer.ctx.fillStyle = style.dim;
        dimLayer.ctx.fillRect(0, 0, rect.w, rect.h);
        dimLayer.ctx.globalCompositeOperation = "destination-in";
        dimLayer.ctx.imageSmoothingEnabled = false;
        dimLayer.ctx.drawImage(dimMask.canvas, 0, 0, cw, ch, dx0, dy0, dw, dh);
        ctx.drawImage(dimLayer.canvas, rect.x, rect.y);
    }

    // Layer 2: opaque fog over everything still uncharted.
    if (anyFog) {
        fogMask.ctx.putImageData(fogImg, 0, 0);
        const fogLayer = mapScratch("fogLayer", rect.w, rect.h);
        fogLayer.ctx.drawImage(fogTexture(rect.w, rect.h, style, 4242), 0, 0);
        fogLayer.ctx.globalCompositeOperation = "destination-in";
        fogLayer.ctx.imageSmoothingEnabled = false;
        fogLayer.ctx.drawImage(fogMask.canvas, 0, 0, maskW, maskH, dx0, dy0, dw, dh);
        ctx.drawImage(fogLayer.canvas, rect.x, rect.y);
    }
}

// ============================================
// Illustrated terrain layer
// ============================================

// Map colours are deliberately not the in-world tile colours. A map is a
// drawing of a place, so biomes are pushed apart in hue and value to stay
// legible at three pixels per tile.
const MAP_BIOME_ART = {
    meadow: { base: "#4e8f39", alt: "#5da346", ink: "#2f6b28", mark: "grass" },
    forest: { base: "#265c1e", alt: "#1c4a17", ink: "#0f3510", mark: "conifer" },
    village: { base: "#6b9a48", alt: "#7bac57", ink: "#4a7030", mark: "cottage" },
    desert: { base: "#c8a84e", alt: "#d8bb62", ink: "#9a7b33", mark: "dune" },
    swamp: { base: "#35512f", alt: "#3f5d38", ink: "#213a1e", mark: "reeds" },
    mountains: { base: "#70707a", alt: "#84848f", ink: "#4a4a54", mark: "peak" },
    lake: { base: "#2a5fae", alt: "#3a72c4", ink: "#1d4788", mark: "wave" },
    castle: { base: "#474659", alt: "#55546a", ink: "#2e2d3e", mark: "tower" },
    ruins: { base: "#6b6b59", alt: "#7b7b67", ink: "#4c4c3f", mark: "column" },
    darklands: { base: "#26203c", alt: "#30284a", ink: "#171328", mark: "spire" },
    greenlands: { base: "#164220", alt: "#1d4f27", ink: "#0a2c0f", mark: "banner" },
    // The corner the Worldtree stands in. Hidden until the tree is found.
    worldtree: { base: "#1c3d4e", alt: "#23495c", ink: "#112733", mark: "star" },
    // The rested acre in the southeast. Green, and flecked all over with the
    // brown of bare earth - which is the whole reason anyone looks twice.
    fallow: { base: "#54843f", alt: "#61944b", ink: "#3a6029", mark: "furrow" },
    wilderness: { base: "#40543f", alt: "#4a6049", ink: "#2b3a2c", mark: "scrub" },
};

// Tiles that carry their own meaning on a map - water, roads, walls, forest -
// keep a dedicated colour so coastlines and roads stay readable across biomes.
function mapTileColour(tile, art, shade) {
    switch (tile) {
        case TILE.WATER: return shade ? "#3a72c4" : "#2a5fae";
        case TILE.BRIDGE: return "#8a6a3a";
        case TILE.PATH: return shade ? "#b39a63" : "#a68d59";
        case TILE.BARE_EARTH: return shade ? "#8a6134" : "#77522b";
        case TILE.TREE: return art.ink;
        case TILE.BURNING_TREE: return "#7a3a18";
        case TILE.LAVA: return shade ? "#e05a1a" : "#cc3300";
        case TILE.MOUNTAIN: return shade ? "#9a9aa6" : "#83838f";
        case TILE.WALL: return "#57574a";
        case TILE.CASTLE_WALL: return "#2b2a3c";
        case TILE.CASTLE_FLOOR: return "#5a5970";
        case TILE.CLUB_WALL: return "#5a2f6e";
        case TILE.CLUB_FLOOR: return shade ? "#7d4fb0" : "#6b3f9c";
        case TILE.SHOP_FLOOR: return "#8a6a3a";
        case TILE.CAVE_ENTRANCE: return "#2b2333";
        case TILE.SKY_TREE: return "#1f5a1a";
        case TILE.SKY_TREE_BURNING: return "#8a4416";
        case TILE.SKY_LADDER: return "#c9a35e";
        default: return shade ? art.alt : art.base;
    }
}

const MapTerrain = {
    // Paint the realm into an offscreen canvas at map resolution. Both the
    // world map and the minimap read from this one image, so the two surfaces
    // can never disagree about what the world looks like.
    buildSurface(world, pxPerTile) {
        const w = Math.round(WORLD_W * pxPerTile);
        const h = Math.round(WORLD_H * pxPerTile);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        const rng = seededRandom(1337);

        const revealed = {};
        for (const key of Object.keys(ZONES)) {
            revealed[key] = world.isZoneRevealed(key);
        }

        // Base pass: one rectangle per tile. Inside a zone the player has not
        // yet named, the Worldtree's own tiles are drawn as ordinary woodland
        // - a bright canopy in an anonymous corner would give the secret away.
        for (let ty = 0; ty < WORLD_H; ty++) {
            for (let tx = 0; tx < WORLD_W; tx++) {
                const zoneKey = getZoneAt(tx, ty);
                const hidden = revealed[zoneKey] === false;
                const art = MAP_BIOME_ART[hidden ? "wilderness" : zoneKey] || MAP_BIOME_ART.wilderness;
                let tile = world.tiles[ty][tx];
                if (hidden && (tile === TILE.SKY_TREE || tile === TILE.SKY_TREE_BURNING || tile === TILE.SKY_LADDER)) {
                    tile = TILE.TREE;
                }
                ctx.fillStyle = mapTileColour(tile, art, rng() < 0.35);
                ctx.fillRect(tx * pxPerTile, ty * pxPerTile, pxPerTile + 1, pxPerTile + 1);
            }
        }

        // Texture pass: sparse authored marks so each biome reads as a place
        // rather than a swatch.
        const step = 3;
        for (let ty = 1; ty < WORLD_H - 1; ty += step) {
            for (let tx = 1; tx < WORLD_W - 1; tx += step) {
                const zoneKey = getZoneAt(tx, ty);
                if (revealed[zoneKey] === false) continue;
                const art = MAP_BIOME_ART[zoneKey] || MAP_BIOME_ART.wilderness;
                const tile = world.tiles[ty][tx];
                if (tile === TILE.WATER || tile === TILE.PATH || tile === TILE.BRIDGE) continue;
                if (rng() > 0.4) continue;
                const px = (tx + rng()) * pxPerTile;
                const py = (ty + rng()) * pxPerTile;
                MapTerrain.mark(ctx, art.mark, px, py, pxPerTile, art, rng);
            }
        }

        // Coast and zone edges: a thin ink line makes the geography snap.
        MapTerrain.inkEdges(ctx, world, pxPerTile, revealed);
        return canvas;
    },

    // Tiny biome glyphs. Everything is drawn on whole pixels at map scale so
    // the marks stay crisp when the layer is scaled with nearest-neighbour.
    mark(ctx, kind, x, y, s, art, rng) {
        const u = Math.max(1, Math.round(s * 0.5));
        x = Math.round(x);
        y = Math.round(y);
        switch (kind) {
            case "conifer":
                ctx.fillStyle = art.ink;
                ctx.fillRect(x, y - u, u, u * 2);
                ctx.fillRect(x - u, y, u * 3, u);
                ctx.fillStyle = "rgba(255,255,255,0.10)";
                ctx.fillRect(x, y - u, u, u);
                break;
            case "grass":
                ctx.fillStyle = art.ink;
                ctx.fillRect(x, y, u, u);
                ctx.fillRect(x + u * 2, y + u, u, u);
                break;
            case "scrub":
                ctx.fillStyle = art.ink;
                ctx.fillRect(x, y, u * 2, u);
                break;
            case "furrow":
                // A short scrape of bare earth. Sown thickly enough that the
                // Fallow reads brown-flecked from across the whole chart.
                ctx.fillStyle = "#77522b";
                ctx.fillRect(x, y, u * 3, u);
                ctx.fillStyle = "rgba(150, 108, 60, 0.55)";
                ctx.fillRect(x + u, y + u, u * 2, u);
                break;
            case "cottage":
                ctx.fillStyle = "#7a5030";
                ctx.fillRect(x, y, u * 2, u * 2);
                ctx.fillStyle = "#b8552f";
                ctx.fillRect(x - u, y - u, u * 4, u);
                break;
            case "dune":
                ctx.fillStyle = "rgba(255,240,190,0.35)";
                ctx.fillRect(x, y, u * 3, u);
                ctx.fillStyle = "rgba(120,90,30,0.30)";
                ctx.fillRect(x + u, y + u, u * 2, u);
                break;
            case "reeds":
                ctx.fillStyle = art.ink;
                ctx.fillRect(x, y - u, u, u * 2);
                ctx.fillRect(x + u * 2, y, u, u * 2);
                break;
            case "peak":
                ctx.fillStyle = "#9a9aa6";
                ctx.fillRect(x - u, y + u, u * 4, u);
                ctx.fillRect(x, y, u * 2, u);
                ctx.fillStyle = "#e8e8f2";
                ctx.fillRect(x, y - u, u * 2, u);
                break;
            case "column":
                ctx.fillStyle = "#9a9a86";
                ctx.fillRect(x, y - u * 2, u, u * 3);
                ctx.fillStyle = art.ink;
                ctx.fillRect(x - u, y + u, u * 3, u);
                break;
            case "spire":
                ctx.fillStyle = "#5b3f86";
                ctx.fillRect(x, y - u * 2, u, u * 3);
                ctx.fillStyle = "rgba(190,140,255,0.35)";
                ctx.fillRect(x, y - u * 3, u, u);
                break;
            case "banner":
                ctx.fillStyle = "#0a2c0f";
                ctx.fillRect(x, y - u, u, u * 2);
                ctx.fillStyle = "#7fd06a";
                ctx.fillRect(x + u, y - u, u, u);
                break;
            case "tower":
                ctx.fillStyle = "#6d6c86";
                ctx.fillRect(x, y - u * 2, u * 2, u * 3);
                ctx.fillStyle = "#9a97b8";
                ctx.fillRect(x, y - u * 3, u * 2, u);
                break;
            case "star":
                // The Worldtree's corner sits under a sky that never quite
                // goes dark. Scatter it with faint lights.
                ctx.fillStyle = rng() < 0.5 ? "rgba(200,235,255,0.55)" : "rgba(150,230,190,0.45)";
                ctx.fillRect(x, y, u, u);
                break;
            case "wave":
                ctx.fillStyle = "rgba(255,255,255,0.20)";
                ctx.fillRect(x, y, u * 2, u);
                break;
        }
    },

    // One-pixel ink where water meets land and where a biome changes, so the
    // map has drawn edges instead of colour blocks butted together.
    inkEdges(ctx, world, pxPerTile, revealed) {
        const line = Math.max(1, Math.round(pxPerTile * 0.35));
        for (let ty = 0; ty < WORLD_H; ty++) {
            for (let tx = 0; tx < WORLD_W; tx++) {
                const tile = world.tiles[ty][tx];
                const isWater = tile === TILE.WATER;
                const right = tx + 1 < WORLD_W ? world.tiles[ty][tx + 1] : tile;
                const down = ty + 1 < WORLD_H ? world.tiles[ty + 1][tx] : tile;

                if (isWater !== (right === TILE.WATER)) {
                    ctx.fillStyle = "rgba(12,26,48,0.55)";
                    ctx.fillRect((tx + 1) * pxPerTile - line / 2, ty * pxPerTile, line, pxPerTile + 1);
                }
                if (isWater !== (down === TILE.WATER)) {
                    ctx.fillStyle = "rgba(12,26,48,0.55)";
                    ctx.fillRect(tx * pxPerTile, (ty + 1) * pxPerTile - line / 2, pxPerTile + 1, line);
                }

                const zone = getZoneAt(tx, ty);
                const zoneRight = getZoneAt(tx + 1, ty);
                const zoneDown = getZoneAt(tx, ty + 1);
                const shown = (k) => (revealed[k] === false ? "wilderness" : k);
                if (shown(zone) !== shown(zoneRight)) {
                    ctx.fillStyle = "rgba(20,18,14,0.30)";
                    ctx.fillRect((tx + 1) * pxPerTile - line / 2, ty * pxPerTile, line, pxPerTile + 1);
                }
                if (shown(zone) !== shown(zoneDown)) {
                    ctx.fillStyle = "rgba(20,18,14,0.30)";
                    ctx.fillRect(tx * pxPerTile, (ty + 1) * pxPerTile - line / 2, pxPerTile + 1, line);
                }
            }
        }
    },

    // Caves and the Cloudlands are drawn from their own tile sets.
    buildTiles(tiles, tilesW, tilesH, pxPerTile, colourFor, background) {
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(tilesW * pxPerTile);
        canvas.height = Math.round(tilesH * pxPerTile);
        const ctx = canvas.getContext("2d");
        if (background) {
            ctx.fillStyle = background;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        const rng = seededRandom(8821);
        for (let ty = 0; ty < tilesH; ty++) {
            for (let tx = 0; tx < tilesW; tx++) {
                const colour = colourFor(tiles[ty][tx], tx, ty, rng);
                if (!colour) continue;
                ctx.fillStyle = colour;
                ctx.fillRect(tx * pxPerTile, ty * pxPerTile, pxPerTile + 1, pxPerTile + 1);
            }
        }
        return canvas;
    },
};

// ============================================
// Map furniture: frame, plates, markers, legend
// ============================================

const MAP_UI = {
    parchmentDark: "#131a30",
    parchmentDeep: "#0b1024",
    gold: "#c9a34e",
    goldBright: "#f0d089",
    goldDim: "#7d642c",
    ink: "#0a0d1a",
    text: "#e8dfc4",
    textDim: "#9aa3bb",
};

const MapArt = {
    // The outer window: deep navy ground, a double gold rule, corner ticks.
    panel(ctx, w, h) {
        ctx.save();
        const bg = ctx.createLinearGradient(0, 0, 0, h);
        bg.addColorStop(0, MAP_UI.parchmentDark);
        bg.addColorStop(1, MAP_UI.parchmentDeep);
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, w, h);

        ctx.strokeStyle = MAP_UI.gold;
        ctx.lineWidth = 2;
        ctx.strokeRect(3.5, 3.5, w - 7, h - 7);
        ctx.strokeStyle = MAP_UI.goldDim;
        ctx.lineWidth = 1;
        ctx.strokeRect(7.5, 7.5, w - 15, h - 15);

        // Corner filigree - four short strokes, no flourish that would fight
        // the geography.
        ctx.strokeStyle = MAP_UI.goldBright;
        ctx.lineWidth = 2;
        const c = 16;
        const corners = [[8, 8, 1, 1], [w - 8, 8, -1, 1], [8, h - 8, 1, -1], [w - 8, h - 8, -1, -1]];
        for (const [x, y, sx, sy] of corners) {
            ctx.beginPath();
            ctx.moveTo(x + sx * c, y);
            ctx.lineTo(x, y);
            ctx.lineTo(x, y + sy * c);
            ctx.stroke();
        }
        ctx.restore();
    },

    // Title cartouche, centred, sized to its text.
    cartouche(ctx, cx, y, text, size = 20) {
        ctx.save();
        ctx.font = `bold ${size}px 'Courier New', monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const w = ctx.measureText(text).width + 64;
        const h = size + 16;
        const x = cx - w / 2;

        ctx.fillStyle = "rgba(8,12,26,0.92)";
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = MAP_UI.gold;
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
        ctx.strokeStyle = MAP_UI.goldDim;
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 4.5, y + 4.5, w - 9, h - 9);

        // Wing ticks either side, echoing the concept art's banner.
        ctx.strokeStyle = MAP_UI.gold;
        ctx.lineWidth = 2;
        for (const dir of [-1, 1]) {
            const ex = dir < 0 ? x : x + w;
            ctx.beginPath();
            ctx.moveTo(ex, y + h / 2);
            ctx.lineTo(ex + dir * 18, y + h / 2);
            ctx.moveTo(ex + dir * 18, y + h / 2 - 5);
            ctx.lineTo(ex + dir * 18, y + h / 2 + 5);
            ctx.stroke();
        }

        ctx.fillStyle = MAP_UI.goldBright;
        ctx.fillText(text, cx, y + h / 2 + 1);
        ctx.restore();
        return { x, y, w, h };
    },

    // The recessed window the geography is drawn into.
    viewportFrame(ctx, rect) {
        ctx.save();
        ctx.strokeStyle = MAP_UI.goldDim;
        ctx.lineWidth = 3;
        ctx.strokeRect(rect.x - 2.5, rect.y - 2.5, rect.w + 5, rect.h + 5);
        ctx.strokeStyle = MAP_UI.gold;
        ctx.lineWidth = 1;
        ctx.strokeRect(rect.x - 0.5, rect.y - 0.5, rect.w + 1, rect.h + 1);
        ctx.restore();
    },

    // A label with its own plate, so names never dissolve into terrain.
    labelPlate(ctx, cx, cy, text, opts = {}) {
        const size = opts.size || 10;
        const colour = opts.colour || MAP_UI.text;
        ctx.save();
        ctx.font = `${opts.bold === false ? "" : "bold "}${size}px 'Courier New', monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const w = ctx.measureText(text).width + 12;
        const h = size + 8;
        const x = Math.round(cx - w / 2);
        const y = Math.round(cy - h / 2);
        ctx.fillStyle = opts.fill || "rgba(8,12,26,0.82)";
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = opts.border || "rgba(201,163,78,0.65)";
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
        ctx.fillStyle = colour;
        ctx.fillText(text, x + w / 2, y + h / 2 + 1);
        ctx.restore();
        return { x, y, w, h };
    },

    // Labels are placed against a list of rectangles already on the map and
    // skipped when nothing fits, rather than stacked on top of each other.
    placeLabel(ctx, taken, anchorX, anchorY, text, opts = {}) {
        const size = opts.size || 10;
        ctx.save();
        ctx.font = `bold ${size}px 'Courier New', monospace`;
        const w = ctx.measureText(text).width + 12;
        const h = size + 8;
        ctx.restore();

        const gap = opts.gap || 12;
        const candidates = opts.candidates || [
            [0, -gap], [0, gap], [-(w / 2 + gap), 0], [w / 2 + gap, 0],
            [0, -gap * 2], [0, gap * 2],
        ];
        const bounds = opts.bounds;

        for (const [ox, oy] of candidates) {
            let cx = anchorX + ox;
            let cy = anchorY + oy;
            // A name near the edge slides inward rather than being dropped.
            if (bounds) {
                if (w + 4 > bounds.w || h + 4 > bounds.h) continue;
                cx = clamp(cx, bounds.x + 2 + w / 2, bounds.x + bounds.w - 2 - w / 2);
                cy = clamp(cy, bounds.y + 2 + h / 2, bounds.y + bounds.h - 2 - h / 2);
            }
            const r = { x: cx - w / 2, y: cy - h / 2, w, h };
            let clash = false;
            for (const t of taken) {
                if (rectOverlap(r.x, r.y, r.w, r.h, t.x, t.y, t.w, t.h)) { clash = true; break; }
            }
            if (clash) continue;
            const placed = MapArt.labelPlate(ctx, cx, cy, text, opts);
            taken.push(placed);
            return placed;
        }
        return null;
    },

    // Markers are separated by shape as well as colour, so the map still reads
    // for a player who cannot tell the greens from the reds.
    marker(ctx, x, y, shape, colour, opts = {}) {
        const r = opts.size || 5;
        const ghost = !!opts.ghost;   // known by rumour, not yet charted
        ctx.save();
        ctx.translate(Math.round(x), Math.round(y));
        ctx.lineWidth = opts.lineWidth || 2;
        ctx.strokeStyle = opts.outline || "rgba(6,9,20,0.85)";
        ctx.fillStyle = colour;
        if (ghost) {
            ctx.globalAlpha = 0.55;
            ctx.setLineDash([2, 2]);
        }

        ctx.beginPath();
        switch (shape) {
            case "diamond":
                ctx.moveTo(0, -r); ctx.lineTo(r, 0); ctx.lineTo(0, r); ctx.lineTo(-r, 0);
                ctx.closePath();
                break;
            case "square":
                ctx.rect(-r, -r, r * 2, r * 2);
                break;
            case "arch":
                ctx.moveTo(-r, r);
                ctx.lineTo(-r, 0);
                ctx.arc(0, 0, r, Math.PI, 0);
                ctx.lineTo(r, r);
                ctx.closePath();
                break;
            case "crown":
                ctx.moveTo(-r, r);
                ctx.lineTo(-r, -r * 0.2);
                ctx.lineTo(-r * 0.5, r * 0.3);
                ctx.lineTo(0, -r);
                ctx.lineTo(r * 0.5, r * 0.3);
                ctx.lineTo(r, -r * 0.2);
                ctx.lineTo(r, r);
                ctx.closePath();
                break;
            case "star":
                for (let i = 0; i < 10; i++) {
                    const rad = i % 2 === 0 ? r : r * 0.45;
                    const a = -Math.PI / 2 + (i * Math.PI) / 5;
                    const px = Math.cos(a) * rad;
                    const py = Math.sin(a) * rad;
                    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
                }
                ctx.closePath();
                break;
            case "bang":
                ctx.rect(-r * 0.35, -r, r * 0.7, r * 1.2);
                ctx.rect(-r * 0.35, r * 0.5, r * 0.7, r * 0.5);
                break;
            case "ring":
                ctx.arc(0, 0, r, 0, Math.PI * 2);
                break;
            default:
                ctx.arc(0, 0, r, 0, Math.PI * 2);
        }

        if (ghost) {
            ctx.strokeStyle = colour;
            ctx.stroke();
        } else {
            ctx.fill();
            ctx.stroke();
        }
        ctx.restore();
    },

    // The player's own marker: a gold-ringed diamond with a soft pulse, the
    // only thing on the map allowed to move.
    playerMarker(ctx, x, y, time, size = 6) {
        ctx.save();
        const pulse = 0.5 + Math.sin(time * 0.005) * 0.5;
        ctx.globalAlpha = 0.20 + pulse * 0.18;
        ctx.fillStyle = "#7fff9a";
        ctx.beginPath();
        ctx.arc(x, y, size + 4 + pulse * 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        MapArt.marker(ctx, x, y, "diamond", "#4ef06a", { size, outline: "#0d2a13" });
        ctx.strokeStyle = MAP_UI.goldBright;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(x, y, size + 3, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    },

    // The player is drawn last but reserves its space first, so no landmark
    // plate ends up hidden beneath the marker.
    reservePlayer(taken, x, y, size) {
        const r = size + 6;
        const rect = { x: x - r, y: y - r, w: r * 2, h: r * 2 };
        taken.push(rect);
        return rect;
    },

    // Legend lives in its own bar, outside the geography, so it can never sit
    // on top of a region again.
    legend(ctx, rect, entries) {
        ctx.save();
        ctx.fillStyle = "rgba(8,12,26,0.90)";
        ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
        ctx.strokeStyle = MAP_UI.gold;
        ctx.lineWidth = 2;
        ctx.strokeRect(rect.x + 0.5, rect.y + 0.5, rect.w - 1, rect.h - 1);
        ctx.strokeStyle = MAP_UI.goldDim;
        ctx.lineWidth = 1;
        ctx.strokeRect(rect.x + 4.5, rect.y + 4.5, rect.w - 9, rect.h - 9);

        const slot = (rect.w - 24) / entries.length;
        ctx.font = "11px 'Courier New', monospace";
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        const cy = rect.y + rect.h / 2;
        for (let i = 0; i < entries.length; i++) {
            const e = entries[i];
            const x = rect.x + 12 + slot * i + 10;
            MapArt.marker(ctx, x, cy, e.shape, e.colour, { size: 5, ghost: e.ghost, lineWidth: 1.5 });
            ctx.fillStyle = MAP_UI.textDim;
            ctx.fillText(e.label, x + 12, cy + 1);
        }
        ctx.restore();
    },

    // How much of the realm has been charted. Quiet progress feedback that
    // rewards wandering without turning exploration into a checklist.
    chartedReadout(ctx, x, y, fog, align = "left") {
        if (!fog) return;
        ctx.save();
        ctx.font = "10px 'Courier New', monospace";
        ctx.textAlign = align;
        ctx.textBaseline = "middle";
        ctx.fillStyle = MAP_UI.textDim;
        ctx.fillText(`Charted ${Math.round(fog.fraction() * 100)}%`, x, y);
        ctx.restore();
    },

    // The minimap's own frame: a compact bevelled window with a north tick.
    minimapFrame(ctx, w, h) {
        ctx.save();
        ctx.strokeStyle = "#0a0d1a";
        ctx.lineWidth = 6;
        ctx.strokeRect(3, 3, w - 6, h - 6);
        ctx.strokeStyle = MAP_UI.gold;
        ctx.lineWidth = 2;
        ctx.strokeRect(4.5, 4.5, w - 9, h - 9);
        ctx.strokeStyle = "rgba(240,208,137,0.35)";
        ctx.lineWidth = 1;
        ctx.strokeRect(7.5, 7.5, w - 15, h - 15);

        // Corner ticks.
        ctx.strokeStyle = MAP_UI.goldBright;
        ctx.lineWidth = 2;
        const c = 9;
        const corners = [[5, 5, 1, 1], [w - 5, 5, -1, 1], [5, h - 5, 1, -1], [w - 5, h - 5, -1, -1]];
        for (const [x, y, sx, sy] of corners) {
            ctx.beginPath();
            ctx.moveTo(x + sx * c, y);
            ctx.lineTo(x, y);
            ctx.lineTo(x, y + sy * c);
            ctx.stroke();
        }
        ctx.restore();
    },

    // A caption strip along the bottom of the minimap, in its own band under
    // the geography. It used to be laid over the map, which was harmless while
    // the map was a window that scrolled - but the southern edge of the realm
    // is ground the player can stand on, and a name plate is no place to lose
    // your own marker under.
    minimapCaption(ctx, rect, text) {
        ctx.save();
        ctx.fillStyle = "rgba(8,12,26,0.86)";
        ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
        ctx.font = "bold 9px 'Courier New', monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = MAP_UI.goldBright;
        ctx.fillText(text, rect.x + rect.w / 2, rect.y + rect.h / 2 + 1);
        ctx.restore();
    },
};

// Live actors are shown on the minimap only while they are actually in sight.
// Drawing a monster through fog would both leak the map and bury the HUD in
// spawn noise from the far side of the realm.
function inSightOf(player, entity, radiusTiles) {
    const r = radiusTiles * TILE_SIZE;
    const dx = entity.x - player.x;
    const dy = entity.y - player.y;
    return dx * dx + dy * dy <= r * r;
}

// ============================================
// Map layout
// ============================================

// The world map is drawn as a complete window - title, geography, legend -
// rather than a bare rectangle of terrain with HTML chrome around it, so the
// three parts can never drift apart or overlap.
const WORLD_MAP_LAYOUT = {
    w: 700,
    h: 584,
    view: { x: 26, y: 56, w: 648, h: 486 },
    legend: { x: 62, y: 548, w: 520, h: 28 },
};

// The minimap shows the whole realm, not a window around the player. Fog of
// war already hides everything unwalked, so a local window bought nothing the
// fog was not doing anyway - and it cost the map the one thing a map is for,
// which is seeing where you stand in the world at a glance.
//
// Every realm in the game is four by three - the surface at 200x150 tiles, the
// caves and the Cloudlands at 80x60 - so the geography view is too, at exactly
// one minimap pixel per surface tile. The name strip gets its own band below
// it rather than lying over the map, because the southern edge of the realm is
// ground the player can stand on.
const MINIMAP_LAYOUT = {
    w: 218,
    h: 187,
    view: { x: 9, y: 9, w: 200, h: 150 },
    caption: { x: 8, y: 162, w: 202, h: 16 },
    // The minimap gets out of the way when Ingoizer walks in behind it. That
    // only happens where the camera is clamped against the edge of a world,
    // which is exactly where the corner landmarks stand - and where a player
    // may well plant a Worldtree of their own. The pad is measured in canvas
    // pixels and is deliberately lopsided downwards: the art worth seeing
    // here is tall, and it is drawn above whoever is standing in it.
    shy: { padX: 80, padTop: 40, padBottom: 220 },
};
