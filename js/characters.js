// ============================================
// Ingoizer's World - The Ingoizer Siblings
// ============================================
//
// Six heroes to choose from before the adventure begins: three sisters and
// three brothers, paired by the colour they wear. Each is drawn from the same
// hand-authored pixel language as Ingoizer himself (see sprites.js) - one grid
// of pixel rows, composed once into an offscreen canvas and blitted crisp.
//
// The two body grids (a brother and a sister) are shared; each sibling recolours
// the cloth (C/D/L), a gilt trim stripe (T), their hair (H/h) and skin (S/s), so
// the family reads as a family while every face is its own. The chosen sibling's
// colour then follows the hero into the world, tinting their armour trim.

const SIBLING_PORTRAIT_W = 16;
const SIBLING_PORTRAIT_H = 24;

// Fixed pixels shared by every sibling. Per-sibling colours (cloth, hair, skin)
// are layered on top of this when a portrait is built.
const SIBLING_BASE_PALETTE = {
    k: "#150d1e", // outline / deepest shadow
    W: "#f6f1e8", // linen collar highlight
    B: "#3c2a17", // boot / shoe leather
    b: "#241809", // boot shadow
    P: "#2f2740", // trousers (brothers) - a cool neutral so the tunic reads
    p: "#211b30", // trouser shadow
};

// Brother: short hair, colour tunic, neutral trousers, laced boots.
const SIBLING_BOY = [
    "......kkkk......",
    ".....khhhhk.....",
    "....khHHHHhk....",
    "....kHHSSHHk....",
    "....kHSSSSHk....",
    "....kSSSSSSk....",
    "....kSkSSkSk....",
    "....kSSssSSk....",
    ".....kSSSSk.....",
    "......kSSk......",
    "....kkCCCCkk....",
    "...kCLCCCCLCk...",
    "..kSCCCTCCCCSk..",
    "..kSDCCTCCCDSk..",
    "...kCCCTCCCCk...",
    "...kBBBBTBBBk...",
    "...kPPPPPPPPk...",
    "...kPPPPPPPPk...",
    "...kPPP..PPPk...",
    "...kPPP..PPPk...",
    "...kBBB..BBBk...",
    "...kBBB..BBBk...",
    "..kbBBB..BBBbk..",
    "..kkkk....kkkk..",
];

// Sister: long framing hair, colour gown that flares into a skirt, slippers.
const SIBLING_GIRL = [
    "......kkkk......",
    ".....kHHHHk.....",
    "....kHHHHHHk....",
    "...kHHSSSSHHk...",
    "...kHSSSSSSHk...",
    "...kHSkSSkSHk...",
    "...kHSSssSSHk...",
    "...kHkSSSSkHk...",
    "....kHkSSkHk....",
    "......kSSk......",
    "....kkCCCCkk....",
    "...kCLCCCCLCk...",
    "..kSCCCTCCCCSk..",
    "..kSDCCTCCCDSk..",
    "...kCCCTCCCCk...",
    "...kCCCCCCCCk...",
    "..kCCCCCCCCCCk..",
    "..kDCCCCCCCCDk..",
    ".kCCCCCCCCCCCCk.",
    ".kDCCCCCCCCCCDk.",
    "kCCCCCCCCCCCCCCk",
    "kDDDDDDDDDDDDDDk",
    "...kSSk..kSSk...",
    "...kBBk..kBBk...",
];

// The three houses. T is the shared gilt trim that marks them all as royal.
const SIBLING_CLOTH = {
    purple: { C: "#8b53d4", D: "#5a2f9c", L: "#bb8ef2", T: "#f2d27a" },
    red:    { C: "#d24242", D: "#8f2626", L: "#f0846e", T: "#f2d27a" },
    blue:   { C: "#3f7bd6", D: "#254f96", L: "#83b3f2", T: "#f2d27a" },
};

// The armour trim keys (gold g, orange o, rust r) recoloured in-world so the
// hero carries their house colour into the adventure.
const SIBLING_TRIM = {
    purple: { g: "#bb8ef2", o: "#8b53d4", r: "#5a2f9c", e: "#c79bff" },
    red:    { g: "#f0846e", o: "#d24242", r: "#8f2626", e: "#ff8a5a" },
    blue:   { g: "#83b3f2", o: "#3f7bd6", r: "#254f96", e: "#7fd0ff" },
};

// id, display name, gender, house colour, a one-line epithet, and the palette
// bits that make each sibling an individual. Ordered so the grid reads as three
// colour columns (purple, red, blue), sisters on top, brothers below.
const INGOIZER_SIBLINGS = [
    {
        id: "priya", name: "Priya", gender: "girl", color: "purple",
        epithet: "The Amethyst Seer",
        skin: { S: "#c98a5a", s: "#a56b3f" }, hair: { H: "#2f2320", h: "#1c130f" },
    },
    {
        id: "rosa", name: "Rosa", gender: "girl", color: "red",
        epithet: "The Ember Dancer",
        skin: { S: "#e8b184", s: "#c68a5a" }, hair: { H: "#7a4a24", h: "#4d2c14" },
    },
    {
        id: "bianca", name: "Bianca", gender: "girl", color: "blue",
        epithet: "The Sapphire Sentinel",
        skin: { S: "#f2cba4", s: "#d9a878" }, hair: { H: "#d8b45a", h: "#a67f2c" },
    },
    {
        id: "percival", name: "Percival", gender: "boy", color: "purple",
        epithet: "The Twilight Blade",
        skin: { S: "#f0c39a", s: "#d69b6e" }, hair: { H: "#5a3d24", h: "#3a2614" },
    },
    {
        id: "roland", name: "Roland", gender: "boy", color: "red",
        epithet: "The Crimson Vanguard",
        skin: { S: "#a86a44", s: "#834e30" }, hair: { H: "#241a22", h: "#140d13" },
    },
    {
        id: "bram", name: "Bram", gender: "boy", color: "blue",
        epithet: "The Tideborn Ranger",
        skin: { S: "#e0a878", s: "#bc7f50" }, hair: { H: "#4a3520", h: "#2e2013" },
    },
];

const SiblingPortrait = {
    _cache: {},

    byId(id) {
        return INGOIZER_SIBLINGS.find((s) => s.id === id) || null;
    },

    // The armour-trim tint the chosen sibling carries into the world, keyed for
    // the sprite cache. Returns null for an unknown id (a plain gold hero).
    trimTintFor(id) {
        const sib = this.byId(id);
        if (!sib) return null;
        const trim = SIBLING_TRIM[sib.color];
        return { id: sib.id, ...trim };
    },

    // Compose one sibling into an offscreen canvas at the given scale, cached.
    build(sibling, scale) {
        const key = sibling.id + "@" + scale;
        if (this._cache[key]) return this._cache[key];

        const cloth = SIBLING_CLOTH[sibling.color];
        const palette = {
            ...SIBLING_BASE_PALETTE,
            ...cloth,
            ...sibling.hair,
            ...sibling.skin,
        };
        const rows = sibling.gender === "girl" ? SIBLING_GIRL : SIBLING_BOY;

        const canvas = document.createElement("canvas");
        canvas.width = SIBLING_PORTRAIT_W * scale;
        canvas.height = SIBLING_PORTRAIT_H * scale;
        const c = canvas.getContext("2d");
        c.imageSmoothingEnabled = false;

        for (let row = 0; row < rows.length; row++) {
            const line = rows[row];
            for (let col = 0; col < line.length; col++) {
                const color = palette[line[col]];
                if (!color) continue;
                c.fillStyle = color;
                c.fillRect(col * scale, row * scale, scale, scale);
            }
        }

        this._cache[key] = canvas;
        return canvas;
    },

    // Draw a sibling centred in the target canvas, standing on its lower third,
    // with a soft ground shadow. Scale is chosen to fit the canvas height.
    render(targetCanvas, sibling) {
        const ctx = targetCanvas.getContext("2d");
        ctx.imageSmoothingEnabled = false;
        ctx.clearRect(0, 0, targetCanvas.width, targetCanvas.height);

        const scale = Math.max(
            1,
            Math.floor((targetCanvas.height - 12) / SIBLING_PORTRAIT_H)
        );
        const sprite = this.build(sibling, scale);
        const dx = Math.round((targetCanvas.width - sprite.width) / 2);
        const dy = Math.round(targetCanvas.height - sprite.height - 4);

        // Ground shadow beneath the feet.
        ctx.fillStyle = "rgba(0, 0, 0, 0.34)";
        ctx.beginPath();
        ctx.ellipse(
            targetCanvas.width / 2,
            targetCanvas.height - 6,
            sprite.width * 0.34,
            5,
            0, 0, Math.PI * 2
        );
        ctx.fill();

        ctx.drawImage(sprite, dx, dy);
    },
};
