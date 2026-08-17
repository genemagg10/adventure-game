// ============================================
// Ingoizer's World - Character Sprites
// ============================================
//
// Ingoizer is drawn from hand-authored pixel art rather than primitive
// shapes. Each row below is one pixel row; every character maps to a colour
// in INGOIZER_PALETTE ("." is transparent). Frames are composed once into
// offscreen canvases at INGOIZER_SCALE and then blitted 1:1, so the chunky
// pixels stay crisp and the per-frame cost is a single drawImage.

const INGOIZER_PALETTE = {
    k: "#0b0b12", // outline / deepest shadow
    d: "#1c1d29", // dark plate
    a: "#303348", // armour mid-tone
    s: "#565d7d", // steel
    l: "#9aa2c2", // light steel (helm dome, pauldron rims)
    w: "#e2e8f7", // highlight
    r: "#7c3a12", // rust-dark trim
    o: "#c86f1e", // orange trim
    g: "#f4b63f", // gold trim
    e: "#ff9c2b", // glowing eyes
    b: "#4a2f18", // leather
};

const INGOIZER_SPRITE_W = 14;
const INGOIZER_SPRITE_H = 17;
const INGOIZER_SCALE = 2;

// Rows 0-12: helm, pauldrons and cuirass. These never change between walk
// frames - only the legs (rows 13-16) do. Row 0 is deliberately clear so the
// quiver's arrows, drawn separately in Player.renderQuiver, read against it.
const INGOIZER_TORSO = {
    down: [
        "..............", // clear above the helm - the quiver's arrows show here
        ".....kssk.....", // domed helm
        "....kslsak....",
        "...kslllaak...",
        "...klwwwwlk...", // brow ridge
        "...kkeddekk...", // visor, eyes burning through
        "...kdsaasdk...",
        "....ksrrsk....", // gorget
        ".klwkdaadkwlk.", // pauldrons cap the shoulders
        "klwskaggakswlk", // breastplate
        ".kslkoggoklsk.",
        "..sdkaooakds..", // waist tapers in
        "..lskrggrksl..", // belt + gauntlets
    ],
    up: [
        "..............",
        ".....kssk.....",
        "....kslsak....",
        "...kslllaak...",
        "...klllllak...",
        "...kksaaskk...", // back of the helm - no visor
        "...kdsaasdk...",
        "....ksrrsk....",
        ".klwkdaadkwlk.",
        "klwskdaadkswlk",
        ".kslkdaadklsk.",
        "..sdkdaadkds..",
        "..lskrggrksl..",
    ],
    // Profile view, facing right. The left-facing frames are mirrored at
    // build time so the two sides can never drift apart.
    side: [
        "..............",
        ".....ksak.....",
        "....kslaak....",
        "....kslaaak...",
        "....klwwlak...", // brow ridge
        ".....kddeek...", // eyes toward the front
        ".....kdsask...",
        ".....ksrrsk...",
        "..klwkaddak...", // near pauldron
        ".klwskaggak...",
        "..kslkoggok...",
        "...sdkaooakds.", // sword arm reaches forward
        "...lskrggrksl.",
    ],
};

// Rows 13-16, one entry per walk frame. Frames 0 and 2 are the passing
// pose; 1 and 3 are the two strides.
const INGOIZER_LEGS = {
    down: [
        [
            "....kaaaak....",
            "...kdakkadk...",
            "...ksakksak...",
            "..klsk..kslk..",
        ],
        [
            "....kaaaak....",
            "..kdak..kadk..",
            "..ksak..ksak..",
            ".klsk....kslk.",
        ],
        [
            "....kaaaak....",
            "...kdakkadk...",
            "...ksakksak...",
            "..klsk..kslk..",
        ],
        [
            "....kaaaak....",
            "..kadk..kdak..",
            "..ksak..ksak..",
            ".kslk....klsk.",
        ],
    ],
    up: [
        [
            "....kaaaak....",
            "...kdakkadk...",
            "...ksakksak...",
            "..klsk..kslk..",
        ],
        [
            "....kaaaak....",
            "..kdak..kadk..",
            "..ksak..ksak..",
            ".klsk....kslk.",
        ],
        [
            "....kaaaak....",
            "...kdakkadk...",
            "...ksakksak...",
            "..klsk..kslk..",
        ],
        [
            "....kaaaak....",
            "..kadk..kdak..",
            "..ksak..ksak..",
            ".kslk....klsk.",
        ],
    ],
    side: [
        [
            ".....kaaak....",
            ".....kdaak....",
            ".....ksaak....",
            "....klssak....",
        ],
        [
            ".....kaaak....",
            "....kdk.kak...",
            "...ksk...kak..",
            "..klsk...klsk.",
        ],
        [
            ".....kaaak....",
            ".....kdaak....",
            ".....ksaak....",
            "....klssak....",
        ],
        [
            ".....kaaak....",
            "....kak.kdk...",
            "...kak...ksk..",
            "..kslk...kssk.",
        ],
    ],
};

const IngoizerSprite = {
    // Screen-space metrics, relative to the entity's centre point.
    width: INGOIZER_SPRITE_W * INGOIZER_SCALE,   // 28
    height: INGOIZER_SPRITE_H * INGOIZER_SCALE,  // 34
    // Feet land 14px below centre so the sprite sits on the same ground line
    // the shadow and depth sorting already use.
    footOffset: 14,

    _cache: {},

    // Pick the sprite direction from a normalized facing vector. Diagonals
    // resolve to the profile view, which reads better than a squashed
    // front-on pose.
    dirFor(facing) {
        if (Math.abs(facing.x) >= Math.abs(facing.y)) {
            return facing.x < 0 ? "left" : "right";
        }
        return facing.y < 0 ? "up" : "down";
    },

    _build(dir, frame) {
        const source = dir === "left" ? "right" : dir;
        const mapKey = source === "right" ? "side" : source;
        const rows = INGOIZER_TORSO[mapKey].concat(INGOIZER_LEGS[mapKey][frame]);

        const canvas = document.createElement("canvas");
        canvas.width = INGOIZER_SPRITE_W * INGOIZER_SCALE;
        canvas.height = INGOIZER_SPRITE_H * INGOIZER_SCALE;
        const c = canvas.getContext("2d");

        for (let row = 0; row < rows.length; row++) {
            const line = rows[row];
            for (let col = 0; col < line.length; col++) {
                const color = INGOIZER_PALETTE[line[col]];
                if (!color) continue;
                c.fillStyle = color;
                c.fillRect(col * INGOIZER_SCALE, row * INGOIZER_SCALE, INGOIZER_SCALE, INGOIZER_SCALE);
            }
        }

        if (dir === "left") {
            const flipped = document.createElement("canvas");
            flipped.width = canvas.width;
            flipped.height = canvas.height;
            const f = flipped.getContext("2d");
            f.translate(canvas.width, 0);
            f.scale(-1, 1);
            f.drawImage(canvas, 0, 0);
            return flipped;
        }
        return canvas;
    },

    get(dir, frame) {
        const key = dir + frame;
        if (!this._cache[key]) {
            this._cache[key] = this._build(dir, frame);
        }
        return this._cache[key];
    },

    // Draw centred horizontally on cx, with the feet resting at cy + footOffset.
    draw(ctx, dir, frame, cx, cy) {
        const sprite = this.get(dir, frame);
        ctx.drawImage(
            sprite,
            Math.round(cx - this.width / 2),
            Math.round(cy + this.footOffset - this.height)
        );
    },
};
