// ============================================
// Ingoizer's World - Utilities
// ============================================

function dist(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
}

function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
}

function lerp(a, b, t) {
    return a + (b - a) * t;
}

function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randFloat(min, max) {
    return Math.random() * (max - min) + min;
}

function choose(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

// Simple seeded random for deterministic world generation
function seededRandom(seed) {
    let s = seed;
    return function() {
        s = (s * 16807 + 0) % 2147483647;
        return (s - 1) / 2147483646;
    };
}

function tileToWorld(tx, ty) {
    return { x: tx * TILE_SIZE + TILE_SIZE / 2, y: ty * TILE_SIZE + TILE_SIZE / 2 };
}

function worldToTile(wx, wy) {
    return { x: Math.floor(wx / TILE_SIZE), y: Math.floor(wy / TILE_SIZE) };
}

function rectOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

function circleOverlap(x1, y1, r1, x2, y2, r2) {
    return dist(x1, y1, x2, y2) < r1 + r2;
}

function getZoneAt(tx, ty) {
    for (const [key, z] of Object.entries(ZONES)) {
        if (tx >= z.x && tx < z.x + z.w && ty >= z.y && ty < z.y + z.h) {
            return key;
        }
    }
    return "wilderness";
}

function normalize(dx, dy) {
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len === 0) return { x: 0, y: 0 };
    return { x: dx / len, y: dy / len };
}

function angleToDir(angle) {
    return { x: Math.cos(angle), y: Math.sin(angle) };
}

function dirToAngle(dx, dy) {
    return Math.atan2(dy, dx);
}
