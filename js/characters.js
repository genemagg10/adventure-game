// ============================================
// Ingoizer's World - The Ingoizer Siblings
// ============================================
//
// The heroes you choose from before the adventure begins. Their portraits are
// the game's own character concept art (docs/art-direction/concepts), sliced
// into per-hero images under assets/images/heroes. Six are the concept roster
// exactly; the seventh, Isolde, is a helmeted shieldmaiden so a sister stands
// in plate beside her armoured brother.
//
// Each hero carries an accent colour drawn from their cloak. The chosen accent
// follows the hero into the world, tinting the in-play armour trim.

const HERO_IMAGE_BASE = "assets/images/heroes/";

const INGOIZER_SIBLINGS = [
    {
        id: "roland", name: "Roland", gender: "boy", helmet: true,
        epithet: "The Iron Vanguard", accent: "#8b6fd0",
    },
    {
        id: "cedric", name: "Cedric", gender: "boy",
        epithet: "The Verdant Ranger", accent: "#7ba24e",
    },
    {
        id: "magnus", name: "Magnus", gender: "boy",
        epithet: "The Tidewarden", accent: "#4f86d6",
    },
    {
        id: "elara", name: "Elara", gender: "girl",
        epithet: "The Emberheart", accent: "#d2694a",
    },
    {
        id: "amara", name: "Amara", gender: "girl",
        epithet: "The Dusk Sentinel", accent: "#9a6fd0",
    },
    {
        id: "lyra", name: "Lyra", gender: "girl",
        epithet: "The Moonlit Scout", accent: "#8fb59a",
    },
    {
        id: "isolde", name: "Isolde", gender: "girl", helmet: true,
        epithet: "The Shieldmaiden", accent: "#3fb2c4",
    },
];

const SiblingPortrait = {
    _imgCache: {},

    byId(id) {
        return INGOIZER_SIBLINGS.find((s) => s.id === id) || null;
    },

    imageSrc(sibling) {
        return `${HERO_IMAGE_BASE}${sibling.id}.png`;
    },

    // Preload every portrait so the selection screen paints without a flash.
    preload() {
        for (const sib of INGOIZER_SIBLINGS) {
            if (this._imgCache[sib.id]) continue;
            const img = new Image();
            img.src = this.imageSrc(sib);
            this._imgCache[sib.id] = img;
        }
    },

    // #rrggbb -> {r,g,b}
    _rgb(hex) {
        const n = parseInt(hex.slice(1), 16);
        return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
    },

    _mix(c, t, amt) {
        return {
            r: Math.round(c.r + (t.r - c.r) * amt),
            g: Math.round(c.g + (t.g - c.g) * amt),
            b: Math.round(c.b + (t.b - c.b) * amt),
        };
    },

    _hex(c) {
        const h = (v) => v.toString(16).padStart(2, "0");
        return `#${h(c.r)}${h(c.g)}${h(c.b)}`;
    },

    // The armour-trim tint the chosen hero carries into the world, keyed for the
    // sprite cache. Derives light/mid/dark shades from the hero's accent colour
    // and maps them onto the trim palette keys (gold g, orange o, rust r, eyes e).
    trimTintFor(id) {
        const sib = this.byId(id);
        if (!sib || !sib.accent) return null;
        const base = this._rgb(sib.accent);
        const white = { r: 255, g: 255, b: 255 };
        const black = { r: 10, g: 10, b: 16 };
        return {
            id: sib.id,
            g: this._hex(this._mix(base, white, 0.35)), // light trim
            o: this._hex(base),                          // mid trim
            r: this._hex(this._mix(base, black, 0.45)),  // dark trim
            e: this._hex(this._mix(base, white, 0.55)),  // gem glint
        };
    },
};
