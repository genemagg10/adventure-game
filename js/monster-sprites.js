// ============================================
// Ingoizer's World - Hostile creature artwork
// ============================================
//
// Every normal hostile owns a silhouette here. The shapes deliberately use
// stepped polygons, hard value changes, and small pixel clusters so they sit
// beside Ingoizer's sprite instead of reading as smooth debug primitives.

const MonsterSprite = {
    metrics: {
        goblin:          { base: 12, width: 31, top: -25, bottom: 16, motion: "scuttle" },
        skeleton:        { base: 13, width: 34, top: -28, bottom: 18, motion: "step" },
        wolf:            { base: 12, width: 43, top: -18, bottom: 15, motion: "lope" },
        troll:           { base: 18, width: 47, top: -34, bottom: 24, motion: "weight" },
        wraith:          { base: 14, width: 35, top: -30, bottom: 22, motion: "float" },
        dragon_whelp:    { base: 16, width: 52, top: -27, bottom: 20, motion: "scamper" },
        bandit:          { base: 13, width: 34, top: -27, bottom: 18, motion: "step" },
        swamp_creature:  { base: 14, width: 41, top: -22, bottom: 18, motion: "hop" },
        green_guardian:  { base: 16, width: 39, top: -32, bottom: 21, motion: "step" },
        vine_beast:      { base: 14, width: 43, top: -28, bottom: 21, motion: "root" },
        cave_spider:     { base: 15, width: 54, top: -17, bottom: 16, motion: "skitter" },
        cave_bat:        { base: 12, width: 49, top: -23, bottom: 15, motion: "wing" },
        deep_troll:      { base: 20, width: 51, top: -38, bottom: 26, motion: "weight" },
        crystal_golem:   { base: 18, width: 46, top: -35, bottom: 24, motion: "weight" },
        shadow_serpent:  { base: 14, width: 47, top: -23, bottom: 20, motion: "slither" },
        storm_harpy:     { base: 15, width: 52, top: -30, bottom: 18, motion: "wing" },
        thunder_wisp:    { base: 13, width: 37, top: -29, bottom: 23, motion: "float" },
        golden_griffin:  { base: 18, width: 61, top: -30, bottom: 23, motion: "wing" },
        cloud_giant:     { base: 22, width: 54, top: -42, bottom: 29, motion: "weight" },
        bronze_talos:    { base: 24, width: 53, top: -44, bottom: 29, motion: "weight" },
    },

    palette: {
        ink: "#16141b",
        deepInk: "#0c0b10",
        bone: "#d5c9a6",
        boneLight: "#eee4c8",
        iron: "#5e6670",
        ironLight: "#aeb5b5",
        leather: "#5a3925",
        leatherLight: "#8a5a34",
        bloodEye: "#ff473d",
        goldEye: "#ffd34e",
    },

    scaleFor(monster) {
        const metric = this.metrics[monster.type];
        return metric ? clamp(monster.size / metric.base, 0.82, 1.28) : 1;
    },

    getTop(monster) {
        const metric = this.metrics[monster.type];
        if (!metric) return -monster.size;
        return metric.top * this.scaleFor(monster);
    },

    draw(ctx, monster, sx, sy, time) {
        const metric = this.metrics[monster.type];
        const renderer = this.renderers[monster.type];
        if (!metric || !renderer) return false;

        const scale = this.scaleFor(monster);
        const moving = monster.state === "chase" || monster.state === "patrol" || monster.state === "return";
        const step = moving ? Math.sin(monster.walkFrame * Math.PI / 2) : Math.sin(time * 0.0025) * 0.18;
        const attackedAgo = Date.now() - monster.lastAttackTime;
        const attack = attackedAgo < 230 ? Math.sin((1 - attackedAgo / 230) * Math.PI) : 0;
        let bob = 0;
        if (metric.motion === "float" || metric.motion === "wing") bob = Math.sin(time * 0.005) * 2.2;
        else if (metric.motion === "hop") bob = moving ? -Math.abs(step) * 4 : 0;
        else if (moving) bob = -Math.abs(step) * (metric.motion === "weight" ? 1 : 2);

        ctx.save();
        ctx.imageSmoothingEnabled = false;

        // A wider or narrower shadow reinforces the creature's actual anatomy.
        ctx.fillStyle = "rgba(8, 8, 14, 0.38)";
        ctx.beginPath();
        ctx.ellipse(Math.round(sx), Math.round(sy + metric.bottom * scale * 0.72), metric.width * scale * 0.43, Math.max(3, metric.bottom * scale * 0.18), 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.translate(Math.round(sx), Math.round(sy + bob));
        const face = monster.facing.x < -0.08 ? -1 : 1;
        ctx.scale(scale * face, scale);
        renderer.call(this, ctx, monster, time, step, attack);
        ctx.restore();
        return true;
    },

    box(ctx, color, x, y, w, h) {
        ctx.fillStyle = color;
        ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
    },

    poly(ctx, color, points) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(Math.round(points[0][0]), Math.round(points[0][1]));
        for (let i = 1; i < points.length; i++) ctx.lineTo(Math.round(points[i][0]), Math.round(points[i][1]));
        ctx.closePath();
        ctx.fill();
    },

    line(ctx, color, width, points) {
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.lineCap = "square";
        ctx.lineJoin = "miter";
        ctx.beginPath();
        ctx.moveTo(Math.round(points[0][0]), Math.round(points[0][1]));
        for (let i = 1; i < points.length; i++) ctx.lineTo(Math.round(points[i][0]), Math.round(points[i][1]));
        ctx.stroke();
    },

    eye(ctx, x, y, color = "#ffcf45", size = 2) {
        this.box(ctx, this.palette.deepInk, x - 1, y - 1, size + 2, size + 2);
        this.box(ctx, color, x, y, size, size);
    },

    claw(ctx, color, x, y, dir = 1) {
        this.box(ctx, color, x, y, 5, 2);
        this.box(ctx, "#d7cda9", x + dir * 4, y + 1, 2, 1);
    },

    renderers: {
        goblin(ctx, m, time, step, attack) {
            const p = this.palette;
            const lean = m.state === "chase" ? 2 : 0;
            const leg = Math.round(step * 2);
            // Knife and battered shield create an intentionally uneven read.
            this.line(ctx, p.ink, 4, [[8 + attack * 4, -3], [18 + attack * 8, -10]]);
            this.line(ctx, p.ironLight, 2, [[9 + attack * 4, -4], [18 + attack * 8, -10]]);
            this.poly(ctx, "#4b301f", [[-16, -5], [-9, -11], [-4, -7], [-5, 8], [-14, 10], [-18, 4]]);
            this.poly(ctx, "#7c5430", [[-14, -5], [-9, -8], [-7, 6], [-13, 7]]);
            this.box(ctx, p.ink, -9 - leg, 8, 6, 8);
            this.box(ctx, p.ink, 4 + leg, 8, 6, 8);
            this.box(ctx, "#415f22", -8 - leg, 8, 5, 6);
            this.box(ctx, "#415f22", 4 + leg, 8, 5, 6);
            this.poly(ctx, p.ink, [[-9, -10], [-3, -17], [9, -15], [13, -5], [9, 9], [-7, 9], [-11, 1]]);
            this.poly(ctx, "#4b7928", [[-7, -9], [-2, -14], [8, -12], [10, -4], [7, 6], [-5, 6], [-8, 0]]);
            this.box(ctx, p.leather, -8, 1, 18, 6);
            this.box(ctx, "#b68b3d", 0, 2, 4, 4);
            // Long ears and wedge-shaped head.
            this.poly(ctx, p.ink, [[-7 + lean, -11], [-18 + lean, -19], [-8 + lean, -21], [-4 + lean, -24], [8 + lean, -21], [15 + lean, -17], [8 + lean, -10]]);
            this.poly(ctx, "#659b31", [[-7 + lean, -13], [-15 + lean, -18], [-6 + lean, -18], [-3 + lean, -22], [7 + lean, -19], [12 + lean, -17], [7 + lean, -12]]);
            this.box(ctx, "#8fbd44", -2 + lean, -21, 7, 3);
            this.eye(ctx, 1 + lean, -17, p.bloodEye, 2);
            this.box(ctx, p.ink, 7 + lean, -13, 5, 2);
            this.box(ctx, "#d9c796", 7 + lean, -12, 2, 2);
        },

        skeleton(ctx, m, time, step, attack) {
            const p = this.palette;
            const leg = Math.round(step * 2);
            // Sword, shield, then separated bone anatomy.
            this.line(ctx, p.ink, 5, [[9 + attack * 3, -2], [20 + attack * 7, -15]]);
            this.line(ctx, p.ironLight, 2, [[10 + attack * 3, -3], [20 + attack * 7, -15]]);
            this.poly(ctx, "#353a3f", [[-18, -8], [-8, -13], [-5, -7], [-6, 12], [-14, 16], [-20, 8]]);
            this.poly(ctx, "#747a78", [[-16, -7], [-10, -10], [-8, -5], [-9, 9], [-14, 12], [-17, 7]]);
            this.box(ctx, "#9a743e", -14, -1, 5, 5);
            this.line(ctx, p.ink, 5, [[-5 - leg, 8], [-7 - leg, 18]]);
            this.line(ctx, p.bone, 2, [[-5 - leg, 8], [-7 - leg, 18]]);
            this.line(ctx, p.ink, 5, [[6 + leg, 8], [8 + leg, 18]]);
            this.line(ctx, p.bone, 2, [[6 + leg, 8], [8 + leg, 18]]);
            this.line(ctx, p.ink, 5, [[-7, -7], [-10, 7]]);
            this.line(ctx, p.bone, 2, [[-7, -7], [-10, 7]]);
            this.line(ctx, p.ink, 5, [[8, -7], [11, 6]]);
            this.line(ctx, p.bone, 2, [[8, -7], [11, 6]]);
            this.box(ctx, p.bone, -3, -9, 7, 17);
            this.box(ctx, p.ink, -8, -5, 17, 2);
            this.box(ctx, p.bone, -7, -7, 15, 2);
            this.box(ctx, p.bone, -8, -1, 16, 2);
            this.box(ctx, p.bone, -7, 3, 14, 2);
            this.box(ctx, p.ink, -2, -6, 4, 13);
            // Skull and oxidized iron cap.
            this.poly(ctx, p.ink, [[-8, -24], [4, -27], [10, -22], [10, -12], [6, -8], [-5, -8], [-10, -13], [-10, -21]]);
            this.poly(ctx, p.bone, [[-6, -22], [4, -24], [8, -20], [8, -13], [4, -10], [-4, -10], [-8, -14], [-8, -20]]);
            this.box(ctx, p.ink, -4, -19, 4, 4);
            this.box(ctx, p.ink, 4, -19, 4, 4);
            this.box(ctx, p.ink, 0, -14, 3, 3);
            this.box(ctx, p.boneLight, -5, -12, 11, 2);
            this.box(ctx, p.ink, -2, -12, 2, 3);
            this.box(ctx, p.ink, 3, -12, 2, 3);
            this.poly(ctx, p.iron, [[-10, -23], [-5, -28], [5, -29], [10, -23], [8, -20], [-8, -20]]);
            this.box(ctx, p.ironLight, -4, -27, 3, 6);
        },

        wolf(ctx, m, time, step, attack) {
            const p = this.palette;
            const lope = Math.round(step * 3);
            const lunge = attack * 5;
            this.poly(ctx, p.ink, [[-19, -8], [-11, -15], [5, -14], [14 + lunge, -10], [17 + lunge, 2], [8, 8], [-10, 8], [-20, 2]]);
            this.poly(ctx, "#4d515b", [[-16, -7], [-9, -12], [5, -11], [11 + lunge, -7], [12 + lunge, 2], [6, 5], [-10, 5], [-17, 1]]);
            this.poly(ctx, "#737985", [[-10, -11], [0, -13], [7, -8], [-7, -7]]);
            // Tail, legs and raised shoulder blades.
            this.line(ctx, p.ink, 6, [[-15, -5], [-24, -12], [-27, -9]]);
            this.line(ctx, "#4d515b", 3, [[-15, -5], [-24, -12], [-27, -9]]);
            this.line(ctx, p.ink, 5, [[-10, 5], [-13 - lope, 14]]);
            this.line(ctx, "#343842", 3, [[-10, 5], [-13 - lope, 14]]);
            this.line(ctx, p.ink, 5, [[7, 5], [11 + lope, 14]]);
            this.line(ctx, "#343842", 3, [[7, 5], [11 + lope, 14]]);
            this.poly(ctx, p.ink, [[7 + lunge, -12], [11 + lunge, -19], [15 + lunge, -13], [19 + lunge, -18], [22 + lunge, -9], [27 + lunge, -5], [25 + lunge, 2], [15 + lunge, 4], [10 + lunge, -2]]);
            this.poly(ctx, "#555b66", [[11 + lunge, -11], [12 + lunge, -16], [16 + lunge, -11], [19 + lunge, -15], [19 + lunge, -7], [24 + lunge, -4], [23 + lunge, 0], [16 + lunge, 1], [12 + lunge, -3]]);
            this.poly(ctx, "#b9b8ad", [[19 + lunge, -4], [27 + lunge, -3], [24 + lunge, 2], [17 + lunge, 1]]);
            this.eye(ctx, 17 + lunge, -8, p.goldEye, 2);
            this.box(ctx, p.deepInk, 25 + lunge, -3, 3, 3);
            this.box(ctx, p.boneLight, 20 + lunge, 1, 2, 3);
        },

        troll(ctx, m, time, step, attack) {
            const p = this.palette;
            const guardian = !!m.isSheathGuardian;
            const skin = guardian ? "#6f8238" : "#657843";
            const light = guardian ? "#a9bd54" : "#8fa45b";
            const foot = Math.round(step * 2);
            // Club is planted at idle and rises during the slam recoil.
            this.line(ctx, p.deepInk, 8, [[14, -10], [23 + attack * 6, 21 - attack * 25]]);
            this.line(ctx, "#604224", 5, [[14, -10], [23 + attack * 6, 21 - attack * 25]]);
            this.poly(ctx, p.ink, [[-14, -19], [-5, -29], [12, -27], [18, -14], [15, 7], [10, 16], [-12, 16], [-19, 4]]);
            this.poly(ctx, skin, [[-11, -18], [-3, -26], [9, -24], [14, -13], [11, 7], [7, 13], [-10, 13], [-15, 3]]);
            this.poly(ctx, light, [[-7, -20], [2, -24], [6, -20], [-8, -11]]);
            // Long weight-bearing arms and shovel hands.
            this.line(ctx, p.ink, 10, [[-12, -13], [-21, 8], [-21, 20]]);
            this.line(ctx, skin, 6, [[-12, -13], [-21, 8], [-21, 20]]);
            this.box(ctx, p.ink, -27, 17, 12, 7);
            this.box(ctx, skin, -25, 18, 9, 5);
            this.line(ctx, p.ink, 10, [[12, -10], [18, 7], [18, 18]]);
            this.line(ctx, skin, 6, [[12, -10], [18, 7], [18, 18]]);
            this.box(ctx, p.ink, 14, 16, 12, 7);
            this.box(ctx, skin, 15, 17, 9, 5);
            this.box(ctx, p.ink, -12 - foot, 12, 11, 12);
            this.box(ctx, skin, -10 - foot, 13, 8, 9);
            this.box(ctx, p.ink, 3 + foot, 12, 12, 12);
            this.box(ctx, skin, 4 + foot, 13, 9, 9);
            // Heavy brow, jaw and tusks.
            this.poly(ctx, p.ink, [[-11, -28], [-2, -34], [10, -31], [15, -24], [12, -14], [6, -9], [-7, -11], [-13, -18]]);
            this.poly(ctx, skin, [[-8, -27], [-1, -31], [8, -29], [12, -23], [9, -15], [4, -12], [-5, -14], [-10, -19]]);
            this.box(ctx, "#46502f", -8, -24, 19, 5);
            this.eye(ctx, 4, -22, guardian ? "#d7ff5a" : p.goldEye, 2);
            this.box(ctx, p.ink, 0, -16, 12, 4);
            this.box(ctx, p.boneLight, 1, -13, 3, 5);
            this.box(ctx, p.boneLight, 8, -13, 3, 5);
            this.poly(ctx, "#4c2d1c", [[-10, 5], [11, 5], [8, 15], [-8, 15]]);
            if (guardian) {
                this.poly(ctx, "#e7d067", [[0, -6], [4, -2], [0, 3], [-4, -2]]);
                this.box(ctx, "#fff3a0", -1, -4, 2, 3);
            } else {
                this.box(ctx, "#8e9b54", -13, -17, 3, 3);
                this.box(ctx, "#8e9b54", 10, -26, 3, 3);
            }
        },

        wraith(ctx, m, time, step, attack) {
            const p = this.palette;
            const sway = Math.round(Math.sin(time * 0.004) * 2);
            ctx.save();
            ctx.globalAlpha *= 0.22;
            this.poly(ctx, "#704fc4", [[-18, -8], [-10, -27], [6, -30], [16, -12], [15, 17], [8, 12], [3, 21], [-3, 14], [-10, 21], [-15, 11]]);
            ctx.restore();
            this.poly(ctx, p.ink, [[-14, -8], [-8, -25], [4, -29], [13, -13], [12, 14], [7 + sway, 10], [2, 20], [-4 + sway, 13], [-10, 20], [-13, 9]]);
            this.poly(ctx, "#33265f", [[-11, -7], [-6, -22], [3, -25], [10, -12], [9, 10], [5, 7], [1, 15], [-4, 9], [-8, 15], [-10, 7]]);
            this.poly(ctx, "#59428f", [[-7, -22], [3, -27], [10, -13], [5, -15], [-3, -16]]);
            this.poly(ctx, p.deepInk, [[-6, -19], [2, -22], [7, -16], [4, -9], [-4, -10], [-8, -15]]);
            this.eye(ctx, -1, -16, "#a16cff", 2);
            this.eye(ctx, 4, -16, "#a16cff", 2);
            this.line(ctx, p.ink, 6, [[-8, -7], [-18 - attack * 5, 2], [-20 - attack * 8, 10]]);
            this.line(ctx, "#7160a0", 3, [[-8, -7], [-18 - attack * 5, 2], [-20 - attack * 8, 10]]);
            this.claw(ctx, "#a8a1b9", -25 - attack * 8, 9, -1);
            this.line(ctx, p.ink, 6, [[9, -7], [16 + attack * 5, 3], [18 + attack * 8, 10]]);
            this.line(ctx, "#7160a0", 3, [[9, -7], [16 + attack * 5, 3], [18 + attack * 8, 10]]);
            this.claw(ctx, "#a8a1b9", 17 + attack * 8, 9, 1);
        },

        dragon_whelp(ctx, m, time, step, attack) {
            const p = this.palette;
            const wing = 4 + Math.abs(Math.sin(time * 0.009)) * 5;
            const foot = Math.round(step * 2);
            // Long tail behind the four-legged body.
            this.line(ctx, p.ink, 7, [[-11, 4], [-24, 10], [-30, 4], [-33, 8]]);
            this.line(ctx, "#9c371f", 4, [[-11, 4], [-24, 10], [-30, 4], [-33, 8]]);
            this.poly(ctx, p.ink, [[-12, -10], [3, -16], [15, -8], [16, 8], [7, 13], [-11, 10], [-17, 1]]);
            this.poly(ctx, "#a83e22", [[-10, -8], [3, -13], [12, -7], [13, 6], [6, 10], [-9, 8], [-14, 1]]);
            this.poly(ctx, "#d16932", [[0, -10], [9, -6], [8, 7], [1, 9]]);
            for (const x of [-9, 8]) {
                this.line(ctx, p.ink, 6, [[x, 7], [x + foot, 18]]);
                this.line(ctx, "#8e2e1c", 3, [[x, 7], [x + foot, 18]]);
                this.claw(ctx, p.ink, x + foot - 2, 17, 1);
            }
            // Membranous wings with visible finger spars.
            this.poly(ctx, p.ink, [[-5, -11], [-18, -25 - wing], [-18, -6], [-8, 1]]);
            this.poly(ctx, "#7e2a20", [[-6, -10], [-16, -22 - wing], [-15, -8], [-9, -1]]);
            this.line(ctx, "#d06338", 2, [[-6, -10], [-16, -22 - wing], [-15, -8]]);
            this.poly(ctx, p.ink, [[6, -12], [14, -28 - wing], [20, -8], [10, 0]]);
            this.poly(ctx, "#8b3022", [[7, -10], [14, -24 - wing], [17, -9], [10, -2]]);
            this.line(ctx, "#d06338", 2, [[7, -10], [14, -24 - wing], [17, -9]]);
            const lunge = attack * 5;
            this.poly(ctx, p.ink, [[8 + lunge, -14], [13 + lunge, -23], [20 + lunge, -19], [27 + lunge, -14], [25 + lunge, -5], [17 + lunge, -2], [10 + lunge, -7]]);
            this.poly(ctx, "#c34a27", [[11 + lunge, -14], [14 + lunge, -20], [19 + lunge, -17], [24 + lunge, -13], [22 + lunge, -7], [17 + lunge, -5], [12 + lunge, -8]]);
            this.poly(ctx, "#e27b39", [[12 + lunge, -19], [14 + lunge, -26], [18 + lunge, -19]]);
            this.poly(ctx, "#e27b39", [[18 + lunge, -18], [22 + lunge, -24], [22 + lunge, -16]]);
            this.eye(ctx, 19 + lunge, -14, p.goldEye, 2);
            this.box(ctx, p.deepInk, 24 + lunge, -10, 3, 2);
            this.box(ctx, p.boneLight, 21 + lunge, -6, 2, 3);
        },

        bandit(ctx, m, time, step, attack) {
            const p = this.palette;
            const leg = Math.round(step * 2);
            this.box(ctx, p.ink, -8 - leg, 8, 6, 10);
            this.box(ctx, "#26372c", -7 - leg, 8, 4, 8);
            this.box(ctx, p.ink, 3 + leg, 8, 6, 10);
            this.box(ctx, "#26372c", 4 + leg, 8, 4, 8);
            this.poly(ctx, p.ink, [[-10, -12], [7, -14], [12, -4], [9, 9], [-8, 9], [-13, 0]]);
            this.poly(ctx, "#4b3a2c", [[-8, -10], [6, -11], [9, -3], [6, 6], [-6, 6], [-10, 0]]);
            this.box(ctx, "#262329", -10, -4, 20, 6);
            this.box(ctx, "#987044", -8, 3, 17, 4);
            this.box(ctx, "#c59a50", 0, 3, 4, 4);
            this.line(ctx, p.ink, 6, [[-7, -7], [-15, 5]]);
            this.line(ctx, "#65452f", 3, [[-7, -7], [-15, 5]]);
            this.line(ctx, p.ink, 5, [[8, -6], [16 + attack * 8, -2 - attack * 8]]);
            this.line(ctx, "#9b7653", 3, [[8, -6], [16 + attack * 8, -2 - attack * 8]]);
            this.line(ctx, p.ironLight, 3, [[15 + attack * 8, -2 - attack * 8], [24 + attack * 10, -12 - attack * 8]]);
            // Low hood and scarf leave only a hard stare.
            this.poly(ctx, p.ink, [[-9, -18], [-3, -26], [8, -23], [13, -14], [8, -8], [-6, -9], [-11, -14]]);
            this.poly(ctx, "#3f3328", [[-7, -18], [-2, -23], [7, -21], [10, -15], [7, -11], [-5, -12], [-8, -15]]);
            this.box(ctx, "#18251d", -8, -16, 19, 7);
            this.box(ctx, "#bc8b61", -3, -16, 10, 3);
            this.eye(ctx, 4, -16, "#efe0b0", 1);
            this.poly(ctx, "#26372c", [[-10, -11], [10, -12], [13, -5], [-10, -4]]);
        },

        swamp_creature(ctx, m, time, step, attack) {
            const p = this.palette;
            const squat = attack * 3;
            // Webbed feet and splayed hands ground the amphibian silhouette.
            this.poly(ctx, p.ink, [[-9, 8], [-20, 15], [-11, 15], [-5, 12]]);
            this.poly(ctx, "#466d3c", [[-8, 9], [-17, 14], [-10, 13], [-4, 11]]);
            this.poly(ctx, p.ink, [[9, 8], [20, 15], [11, 15], [5, 12]]);
            this.poly(ctx, "#466d3c", [[8, 9], [17, 14], [10, 13], [4, 11]]);
            this.poly(ctx, p.ink, [[-13, -10 + squat], [-5, -18 + squat], [9, -16 + squat], [15, -6 + squat], [13, 8], [7, 13], [-8, 13], [-15, 5]]);
            this.poly(ctx, "#3d6b42", [[-10, -9 + squat], [-4, -15 + squat], [7, -13 + squat], [12, -5 + squat], [10, 6], [5, 10], [-7, 10], [-12, 4]]);
            this.poly(ctx, "#78905b", [[-6, 2], [9, 1], [7, 9], [-5, 9]]);
            // Dorsal spines masquerade as marsh reeds.
            this.poly(ctx, "#273e2b", [[-9, -12], [-10, -25], [-5, -14], [-2, -27], [2, -14], [7, -24], [8, -11]]);
            this.box(ctx, "#759650", -8, -13 + squat, 8, 6);
            this.box(ctx, "#759650", 6, -12 + squat, 8, 6);
            this.eye(ctx, -5, -12 + squat, p.goldEye, 2);
            this.eye(ctx, 9, -11 + squat, p.goldEye, 2);
            this.box(ctx, p.ink, -2, -4 + squat, 13, 3);
            this.box(ctx, "#9bae6c", 0, -1 + squat, 8, 2);
            this.line(ctx, p.ink, 7, [[-10, -4], [-20 - attack * 5, 4]]);
            this.line(ctx, "#466d3c", 4, [[-10, -4], [-20 - attack * 5, 4]]);
            this.claw(ctx, "#283d27", -25 - attack * 5, 3, -1);
            this.line(ctx, p.ink, 7, [[11, -3], [20 + attack * 5, 5]]);
            this.line(ctx, "#466d3c", 4, [[11, -3], [20 + attack * 5, 5]]);
            this.claw(ctx, "#283d27", 19 + attack * 5, 4, 1);
        },

        green_guardian(ctx, m, time, step, attack) {
            const p = this.palette;
            const leg = Math.round(step * 2);
            // Rooted boots, bark armour, brass-edged leaf shield.
            this.poly(ctx, p.ink, [[-8 - leg, 7], [-12 - leg, 18], [-2 - leg, 18], [0 - leg, 7]]);
            this.poly(ctx, "#314728", [[-6 - leg, 8], [-9 - leg, 16], [-3 - leg, 16], [-2 - leg, 8]]);
            this.poly(ctx, p.ink, [[3 + leg, 7], [2 + leg, 18], [12 + leg, 18], [10 + leg, 7]]);
            this.poly(ctx, "#314728", [[5 + leg, 8], [4 + leg, 16], [10 + leg, 16], [8 + leg, 8]]);
            this.poly(ctx, "#8b6f34", [[-20, -9], [-9, -15], [-4, -7], [-7, 12], [-16, 17], [-23, 7]]);
            this.poly(ctx, "#426c32", [[-18, -8], [-11, -12], [-7, -6], [-10, 9], [-15, 13], [-20, 6]]);
            this.line(ctx, "#d2a84a", 2, [[-18, -8], [-11, -12], [-7, -6], [-10, 9], [-15, 13], [-20, 6], [-18, -8]]);
            this.poly(ctx, p.ink, [[-10, -13], [9, -14], [14, -4], [10, 10], [-8, 10], [-14, -2]]);
            this.poly(ctx, "#3b572e", [[-8, -11], [7, -11], [11, -3], [7, 7], [-6, 7], [-11, -1]]);
            this.box(ctx, "#9b7933", -9, -7, 19, 3);
            this.poly(ctx, "#557d38", [[-4, -8], [4, -8], [7, 2], [0, 7], [-6, 2]]);
            this.line(ctx, p.ink, 5, [[9, -7], [17 + attack * 7, -1 - attack * 7], [25 + attack * 8, -9 - attack * 8]]);
            this.line(ctx, "#a98b43", 3, [[10, -7], [17 + attack * 7, -1 - attack * 7], [25 + attack * 8, -9 - attack * 8]]);
            this.poly(ctx, "#507b39", [[22 + attack * 8, -12 - attack * 8], [28 + attack * 8, -17 - attack * 8], [27 + attack * 8, -8 - attack * 8]]);
            // Antlered bark helm.
            this.poly(ctx, p.ink, [[-9, -23], [-4, -30], [7, -29], [13, -21], [10, -12], [-8, -12], [-12, -18]]);
            this.poly(ctx, "#405c30", [[-7, -22], [-3, -27], [6, -26], [10, -20], [7, -15], [-6, -15], [-9, -18]]);
            this.line(ctx, "#6e4e2e", 3, [[-5, -26], [-10, -32], [-9, -25], [-14, -29]]);
            this.line(ctx, "#6e4e2e", 3, [[7, -26], [12, -33], [11, -25], [16, -30]]);
            this.box(ctx, p.deepInk, -6, -21, 15, 5);
            this.eye(ctx, 3, -20, "#9cff55", 2);
        },

        vine_beast(ctx, m, time, step, attack) {
            const p = this.palette;
            const sway = Math.round(Math.sin(time * 0.004) * 2);
            // Root gait intentionally has different lengths on every limb.
            this.line(ctx, p.ink, 7, [[-6, 5], [-13 - step * 2, 19]]);
            this.line(ctx, "#38562c", 4, [[-6, 5], [-13 - step * 2, 19]]);
            this.line(ctx, p.ink, 7, [[7, 4], [13 + step * 3, 17]]);
            this.line(ctx, "#4a7034", 4, [[7, 4], [13 + step * 3, 17]]);
            this.line(ctx, p.ink, 7, [[-9, -3], [-21 - attack * 5, 9]]);
            this.line(ctx, "#3c6230", 4, [[-9, -3], [-21 - attack * 5, 9]]);
            this.line(ctx, "#77a849", 2, [[-15, 3], [-22, -2], [-20, 8], [-27, 5]]);
            this.line(ctx, p.ink, 7, [[9, -5], [20 + sway + attack * 5, 5]]);
            this.line(ctx, "#557a35", 4, [[9, -5], [20 + sway + attack * 5, 5]]);
            this.poly(ctx, p.ink, [[-12, -16], [-2, -25], [12, -18], [15, -3], [8, 10], [-8, 9], [-15, -3]]);
            this.poly(ctx, "#426934", [[-9, -15], [-1, -21], [9, -16], [12, -3], [6, 7], [-6, 6], [-12, -3]]);
            this.line(ctx, "#7ea349", 2, [[-6, 4], [1, -18], [7, 5]]);
            // One flower-like eye is the focal point.
            for (let i = 0; i < 6; i++) {
                const a = i * Math.PI / 3;
                this.box(ctx, i % 2 ? "#8f3f67" : "#b95b76", Math.cos(a) * 6 - 2, -12 + Math.sin(a) * 5 - 2, 5, 5);
            }
            this.box(ctx, p.deepInk, -4, -16, 9, 9);
            this.eye(ctx, -1, -13, "#f4c64f", 3);
            this.poly(ctx, "#618a3d", [[-8, -19], [-12, -27], [-4, -23]]);
            this.poly(ctx, "#759d47", [[7, -19], [13, -27], [12, -18]]);
        },

        cave_spider(ctx, m, time, step, attack) {
            const p = this.palette;
            const phase = Math.round(step * 3);
            // Eight independently phased legs make a broad, low hazard.
            const legs = [
                [[-7, -6], [-19, -14 - phase], [-27, -9]],
                [[-10, -2], [-23, -5 + phase], [-29, 1]],
                [[-10, 3], [-22, 8 - phase], [-27, 14]],
                [[-6, 7], [-16, 16 + phase], [-20, 18]],
                [[7, -6], [19, -14 + phase], [27, -9]],
                [[10, -2], [23, -5 - phase], [29, 1]],
                [[10, 3], [22, 8 + phase], [27, 14]],
                [[6, 7], [16, 16 - phase], [20, 18]],
            ];
            for (const leg of legs) {
                this.line(ctx, p.deepInk, 5, leg);
                this.line(ctx, "#573657", 2, leg);
            }
            this.poly(ctx, p.ink, [[-12, -10], [2, -15], [14, -7], [13, 8], [3, 13], [-11, 9], [-16, 0]]);
            this.poly(ctx, "#4a2b4b", [[-9, -8], [1, -12], [11, -6], [10, 6], [2, 10], [-8, 7], [-12, 0]]);
            this.poly(ctx, "#6e3d65", [[-5, -8], [2, -10], [7, -5], [5, 3], [-3, 3], [-7, -2]]);
            this.box(ctx, p.ink, 7 + attack * 3, -7, 11, 12);
            this.box(ctx, "#352038", 8 + attack * 3, -6, 8, 9);
            for (const [x, y] of [[10,-5],[14,-5],[9,-1],[15,-1]]) this.eye(ctx, x + attack * 3, y, "#ff5b3f", 1);
            this.box(ctx, p.boneLight, 9 + attack * 3, 4, 2, 4);
            this.box(ctx, p.boneLight, 14 + attack * 3, 4, 2, 4);
        },

        cave_bat(ctx, m, time, step, attack) {
            const p = this.palette;
            const flap = Math.round(Math.sin(time * 0.012) * 7);
            this.poly(ctx, p.ink, [[-4, -9], [-15, -18 - flap], [-27, -14 - flap], [-20, -2], [-27, 5], [-12, 3], [-4, 9]]);
            this.poly(ctx, "#3d2b45", [[-5, -7], [-15, -15 - flap], [-23, -12 - flap], [-17, -3], [-22, 2], [-11, 0], [-4, 6]]);
            this.line(ctx, "#725178", 2, [[-5, -7], [-15, -15 - flap], [-17, -3], [-22, 2]]);
            this.poly(ctx, p.ink, [[4, -9], [15, -18 - flap], [27, -14 - flap], [20, -2], [27, 5], [12, 3], [4, 9]]);
            this.poly(ctx, "#3d2b45", [[5, -7], [15, -15 - flap], [23, -12 - flap], [17, -3], [22, 2], [11, 0], [4, 6]]);
            this.line(ctx, "#725178", 2, [[5, -7], [15, -15 - flap], [17, -3], [22, 2]]);
            this.poly(ctx, p.ink, [[-7, -14], [-2, -22], [1, -15], [5, -22], [9, -13], [8, 7], [1, 13], [-7, 6]]);
            this.poly(ctx, "#4a344d", [[-4, -12], [-2, -18], [1, -12], [5, -18], [6, -11], [5, 5], [1, 9], [-4, 5]]);
            this.eye(ctx, -1, -8, "#ff586b", 2);
            this.eye(ctx, 4, -8, "#ff586b", 2);
            this.box(ctx, p.boneLight, 0, -3, 2, 3);
            this.box(ctx, p.boneLight, 4, -3, 2, 3);
        },

        deep_troll(ctx, m, time, step, attack) {
            // Reuse troll anatomy, then add the mineral story of the deep cave.
            this.renderers.troll.call(this, ctx, m, time, step, attack);
            this.poly(ctx, "#6f738c", [[-12, -23], [-16, -34], [-8, -28]]);
            this.poly(ctx, "#8e87ba", [[8, -29], [12, -39], [15, -27]]);
            this.poly(ctx, "#555c70", [[-17, 2], [-24, -7], [-18, -10]]);
            this.box(ctx, "#b7ace4", 10, -32, 2, 6);
        },

        crystal_golem(ctx, m, time, step, attack) {
            const p = this.palette;
            const float = Math.round(Math.sin(time * 0.004) * 2);
            // Detached stone limbs frame a bright, faceted core.
            this.poly(ctx, p.ink, [[-11, 7], [-5, 3], [-1, 18], [-6, 23], [-15, 20]]);
            this.poly(ctx, "#494a61", [[-9, 8], [-6, 6], [-3, 17], [-7, 20], [-12, 18]]);
            this.poly(ctx, p.ink, [[5, 4], [13, 7], [15, 20], [8, 24], [1, 18]]);
            this.poly(ctx, "#55566f", [[7, 7], [11, 9], [12, 18], [8, 21], [4, 17]]);
            this.poly(ctx, p.ink, [[-13, -17], [1, -27], [15, -17], [13, 7], [1, 15], [-14, 6]]);
            this.poly(ctx, "#54556e", [[-10, -15], [1, -23], [12, -15], [10, 5], [1, 11], [-11, 4]]);
            this.poly(ctx, "#77789b", [[-7, -14], [1, -20], [5, -5], [-5, 0]]);
            this.poly(ctx, "#4f3d73", [[-5, -6], [2, -13], [8, -5], [2, 6]]);
            this.poly(ctx, "#aa87e7", [[-2, -6], [2, -10], [5, -5], [2, 1]]);
            this.box(ctx, "#e5d6ff", 0, -8, 2, 5);
            const reach = attack * 6;
            this.poly(ctx, p.ink, [[-17 - reach, -13 + float], [-10 - reach, -18 + float], [-5 - reach, -8 + float], [-10 - reach, 7 + float], [-21 - reach, 5 + float], [-24 - reach, -5 + float]]);
            this.poly(ctx, "#4b4c63", [[-18 - reach, -11 + float], [-12 - reach, -15 + float], [-8 - reach, -7 + float], [-12 - reach, 4 + float], [-19 - reach, 3 + float], [-21 - reach, -4 + float]]);
            this.poly(ctx, p.ink, [[17 + reach, -13 - float], [10 + reach, -18 - float], [5 + reach, -8 - float], [10 + reach, 7 - float], [21 + reach, 5 - float], [24 + reach, -5 - float]]);
            this.poly(ctx, "#5d5e79", [[18 + reach, -11 - float], [12 + reach, -15 - float], [8 + reach, -7 - float], [12 + reach, 4 - float], [19 + reach, 3 - float], [21 + reach, -4 - float]]);
            this.poly(ctx, p.ink, [[-8, -27], [0, -35], [10, -28], [8, -19], [-7, -19]]);
            this.poly(ctx, "#666887", [[-5, -27], [0, -32], [7, -27], [5, -22], [-5, -22]]);
            this.eye(ctx, -2, -26, "#c6a4ff", 2);
            this.eye(ctx, 4, -26, "#c6a4ff", 2);
        },

        shadow_serpent(ctx, m, time, step, attack) {
            const p = this.palette;
            const wave = Math.sin(time * 0.008) * 3;
            // Segmented S-curve avoids a circular collision-ball silhouette.
            const segments = [[-20,12],[-12,16],[-3,13],[2,6],[-3,0],[-10,-3],[-7,-9],[2,-12],[10,-9]];
            this.line(ctx, p.deepInk, 11, segments);
            this.line(ctx, "#292858", 7, segments);
            this.line(ctx, "#55518d", 2, segments.slice(2, 8));
            const hx = 11 + attack * 5;
            this.poly(ctx, p.ink, [[4, -14], [11, -23], [23, -18], [27, -10], [20, -3], [8, -6]]);
            this.poly(ctx, "#35336b", [[7, -14], [12, -20], [21, -16], [24, -11], [19, -6], [10, -8]]);
            this.poly(ctx, "#6c62a3", [[11, -19], [9, -25], [15, -20]]);
            this.poly(ctx, "#6c62a3", [[18, -17], [21, -23], [22, -15]]);
            this.eye(ctx, hx + 5, -15, "#b784ff", 2);
            this.box(ctx, p.deepInk, hx + 12, -11, 3, 2);
            this.line(ctx, "#b87de0", 1, [[hx + 14, -9], [hx + 20, -6 + wave], [hx + 23, -9]]);
        },

        storm_harpy(ctx, m, time, step, attack) {
            const p = this.palette;
            const flap = Math.round(Math.sin(time * 0.01) * 6);
            this.poly(ctx, p.ink, [[-6, -8], [-17, -24 - flap], [-29, -17 - flap], [-20, -3], [-27, 7], [-10, 4]]);
            this.poly(ctx, "#506a9d", [[-7, -7], [-17, -20 - flap], [-25, -16 - flap], [-17, -4], [-22, 4], [-10, 1]]);
            this.line(ctx, "#9bb0d2", 2, [[-9,-8],[-17,-20-flap],[-17,-4],[-22,4]]);
            this.poly(ctx, p.ink, [[6, -8], [17, -24 - flap], [29, -17 - flap], [20, -3], [27, 7], [10, 4]]);
            this.poly(ctx, "#506a9d", [[7, -7], [17, -20 - flap], [25, -16 - flap], [17, -4], [22, 4], [10, 1]]);
            this.line(ctx, "#9bb0d2", 2, [[9,-8],[17,-20-flap],[17,-4],[22,4]]);
            this.poly(ctx, p.ink, [[-8, -15], [1, -24], [10, -14], [9, 5], [2, 12], [-8, 5]]);
            this.poly(ctx, "#6f88bd", [[-5, -14], [1, -21], [7, -13], [6, 4], [1, 8], [-5, 4]]);
            this.poly(ctx, "#d1c1a2", [[-5, -17], [1, -24], [8, -17], [6, -10], [-3, -9]]);
            this.eye(ctx, 3, -17, "#e8f4ff", 2);
            this.poly(ctx, "#dfb849", [[7, -15], [16 + attack * 4, -12], [7, -9]]);
            this.line(ctx, p.ink, 4, [[-3, 5], [-6, 17]]);
            this.line(ctx, "#bd9a44", 2, [[-3, 5], [-6, 17]]);
            this.claw(ctx, "#e4c15d", -9, 16, -1);
            this.line(ctx, p.ink, 4, [[5, 5], [8, 17]]);
            this.line(ctx, "#bd9a44", 2, [[5, 5], [8, 17]]);
            this.claw(ctx, "#e4c15d", 6, 16, 1);
        },

        thunder_wisp(ctx, m, time, step, attack) {
            const p = this.palette;
            const pulse = Math.round(Math.sin(time * 0.009) * 2);
            ctx.save();
            ctx.globalAlpha *= 0.25;
            this.poly(ctx, "#7f83da", [[-16,-10],[-6,-27],[7,-26],[17,-9],[10,7],[4,21],[-2,14],[-9,23],[-8,7]]);
            ctx.restore();
            this.poly(ctx, p.deepInk, [[-11,-11],[-4,-25],[7,-22],[13,-9],[8,6],[3,17],[-2,10],[-7,19],[-7,5]]);
            this.poly(ctx, "#343a87", [[-8,-10],[-2,-21],[5,-19],[10,-8],[6,4],[2,12],[-2,6],[-5,13],[-4,3]]);
            this.poly(ctx, "#f4e66a", [[1,-17],[7,-9],[3,-8],[8,1],[1,-3],[-2,5],[-1,-6],[-6,-4]]);
            this.box(ctx, "#fff6b0", 1, -13, 2, 8);
            this.eye(ctx, -3, -12, "#fff7a0", 2);
            this.eye(ctx, 5, -12, "#fff7a0", 2);
            const arms = 5 + attack * 5;
            this.line(ctx, "#f8e96f", 2, [[-7,-5],[-14-arms,-1+pulse],[-10-arms,5],[-18-arms,8]]);
            this.line(ctx, "#f8e96f", 2, [[9,-5],[15+arms,-10-pulse],[13+arms,-3],[21+arms,-1]]);
        },

        golden_griffin(ctx, m, time, step, attack) {
            const p = this.palette;
            const flap = Math.round(Math.sin(time * 0.009) * 7);
            const foot = Math.round(step * 2);
            // Lion hindquarters, eagle forequarters, and a hooked beak.
            this.line(ctx, p.ink, 7, [[-12,1],[-25,8],[-30,2],[-32,7]]);
            this.line(ctx, "#a87825", 4, [[-12,1],[-25,8],[-30,2],[-32,7]]);
            this.poly(ctx, p.ink, [[-15,-10],[5,-15],[17,-7],[16,9],[5,14],[-14,10],[-20,0]]);
            this.poly(ctx, "#b98426", [[-13,-8],[4,-12],[14,-6],[13,7],[4,11],[-12,8],[-17,0]]);
            this.poly(ctx, "#dfbd55", [[1,-10],[13,-6],[11,7],[2,9]]);
            this.poly(ctx, p.ink, [[-4,-9],[-15,-28-flap],[-26,-22-flap],[-16,-6],[-22,2],[-7,0]]);
            this.poly(ctx, "#d6ae45", [[-5,-8],[-15,-24-flap],[-22,-20-flap],[-13,-7],[-18,-1],[-8,-2]]);
            this.poly(ctx, p.ink, [[7,-10],[15,-29-flap],[28,-21-flap],[18,-5],[25,2],[9,0]]);
            this.poly(ctx, "#e0bf58", [[8,-9],[15,-25-flap],[24,-19-flap],[16,-6],[20,-1],[10,-2]]);
            for (const x of [-10,8]) {
                this.line(ctx, p.ink, 6, [[x,7],[x+foot,21]]);
                this.line(ctx, "#9f6f25", 3, [[x,7],[x+foot,21]]);
                this.claw(ctx, "#e7c65e", x+foot-2, 20, 1);
            }
            const lunge = attack * 5;
            this.poly(ctx, p.ink, [[8+lunge,-13],[13+lunge,-25],[23+lunge,-23],[29+lunge,-16],[25+lunge,-7],[14+lunge,-5]]);
            this.poly(ctx, "#e2c86e", [[11+lunge,-13],[15+lunge,-22],[22+lunge,-20],[26+lunge,-15],[23+lunge,-10],[15+lunge,-8]]);
            this.poly(ctx, "#f2da84", [[13+lunge,-21],[15+lunge,-29],[19+lunge,-22]]);
            this.eye(ctx, 20+lunge, -16, "#5a2b16", 2);
            this.poly(ctx, "#b8791f", [[25+lunge,-15],[34+lunge,-12],[25+lunge,-8]]);
        },

        cloud_giant(ctx, m, time, step, attack) {
            const p = this.palette;
            const foot = Math.round(step * 2);
            // Column-like legs and overhanging storm-cloud shoulders.
            this.poly(ctx, p.ink, [[-13-foot,6],[-18-foot,28],[-3-foot,28],[0-foot,5]]);
            this.poly(ctx, "#687594", [[-11-foot,7],[-15-foot,25],[-5-foot,25],[-2-foot,6]]);
            this.poly(ctx, p.ink, [[3+foot,5],[3+foot,28],[18+foot,28],[13+foot,6]]);
            this.poly(ctx, "#71809f", [[5+foot,7],[6+foot,25],[15+foot,25],[11+foot,7]]);
            this.poly(ctx, p.ink, [[-17,-20],[-8,-34],[9,-34],[18,-20],[16,9],[8,16],[-9,15],[-18,5]]);
            this.poly(ctx, "#7380a2", [[-14,-19],[-6,-30],[7,-30],[15,-18],[13,7],[6,12],[-7,12],[-15,4]]);
            this.poly(ctx, "#9aa8c4", [[-10,-24],[-2,-30],[8,-27],[12,-19],[-8,-16]]);
            // Cloud masses remain clustered and stepped, not circular.
            this.poly(ctx, "#dce3ea", [[-23,-19],[-20,-29],[-12,-32],[-7,-27],[-1,-36],[8,-36],[13,-29],[22,-27],[26,-17],[18,-11],[-18,-11]]);
            this.poly(ctx, "#aab5c9", [[-20,-18],[-18,-26],[-11,-29],[-6,-24],[-1,-32],[6,-32],[11,-25],[19,-24],[22,-18],[16,-14],[-16,-14]]);
            this.box(ctx, p.deepInk, -6, -23, 16, 6);
            this.eye(ctx, -2, -22, "#bde9ff", 2);
            this.eye(ctx, 6, -22, "#bde9ff", 2);
            const reach = attack * 7;
            this.line(ctx, p.ink, 12, [[-15,-13],[-24-reach,8],[-23-reach,20]]);
            this.line(ctx, "#6b7898", 7, [[-15,-13],[-24-reach,8],[-23-reach,20]]);
            this.box(ctx, p.ink, -29-reach, 17, 13, 9);
            this.box(ctx, "#8391ad", -27-reach, 18, 10, 6);
            this.line(ctx, p.ink, 12, [[15,-13],[24+reach,8],[23+reach,20]]);
            this.line(ctx, "#74819f", 7, [[15,-13],[24+reach,8],[23+reach,20]]);
            this.box(ctx, p.ink, 17+reach, 17, 13, 9);
            this.box(ctx, "#8996b0", 18+reach, 18, 10, 6);
        },

        bronze_talos(ctx, m, time, step, attack) {
            const p = this.palette;
            const foot = Math.round(step * 2);
            // Mechanical joints and segmented bronze plates distinguish Talos.
            this.box(ctx, p.ink, -15-foot, 5, 12, 24);
            this.box(ctx, "#76501d", -12-foot, 7, 7, 19);
            this.box(ctx, "#c18a32", -11-foot, 8, 3, 13);
            this.box(ctx, p.ink, 4+foot, 5, 12, 24);
            this.box(ctx, "#76501d", 6+foot, 7, 7, 19);
            this.box(ctx, "#c18a32", 7+foot, 8, 3, 13);
            this.poly(ctx, p.ink, [[-18,-24],[-9,-35],[10,-34],[20,-22],[17,9],[8,17],[-10,16],[-20,7]]);
            this.poly(ctx, "#8a5f1c", [[-15,-22],[-7,-31],[8,-30],[17,-20],[14,7],[7,13],[-8,12],[-17,5]]);
            this.poly(ctx, "#b77c25", [[-10,-26],[2,-30],[10,-24],[9,-7],[-8,-7]]);
            this.box(ctx, "#d5a54c", -13, -4, 28, 3);
            this.box(ctx, "#4a3016", -13, 3, 28, 3);
            this.poly(ctx, "#352419", [[-6,-17],[2,-23],[9,-16],[3,-7],[-5,-9]]);
            this.poly(ctx, "#f0a936", [[-3,-16],[2,-20],[6,-15],[2,-10]]);
            this.box(ctx, "#ffe084", 0, -17, 2, 5);
            const reach = attack * 7;
            for (const dir of [-1,1]) {
                const d = dir;
                this.line(ctx, p.ink, 13, [[d*16,-17],[d*(25+reach),2],[d*(25+reach),19]]);
                this.line(ctx, "#7e561e", 8, [[d*16,-17],[d*(25+reach),2],[d*(25+reach),19]]);
                this.box(ctx, "#d19a3d", d > 0 ? 20+reach : -28-reach, -1, 8, 5);
                this.box(ctx, p.ink, d > 0 ? 19+reach : -31-reach, 16, 13, 10);
                this.box(ctx, "#895d20", d > 0 ? 21+reach : -29-reach, 18, 9, 6);
            }
            this.poly(ctx, p.ink, [[-12,-34],[-5,-44],[7,-43],[14,-34],[11,-22],[-10,-22],[-15,-29]]);
            this.poly(ctx, "#9b6b24", [[-9,-34],[-4,-40],[6,-39],[11,-33],[8,-25],[-8,-25],[-11,-29]]);
            this.box(ctx, "#402918", -7, -34, 17, 6);
            this.eye(ctx, 2, -33, "#ffc94e", 2);
            this.box(ctx, "#d3a24a", -4, -39, 3, 10);
            this.box(ctx, "#edc66a", -3, -38, 1, 7);
        },
    },
};

// Named bosses keep their combat classes and collision shapes, but no longer
// share the Black Knight's body. This renderer only changes presentation.
const BossSprite = {
    draw(ctx, boss, sx, sy, time) {
        if (boss.name === "The Stone Warden") {
            this.drawStoneWarden(ctx, boss, sx, sy, time);
            return true;
        }
        if (boss.name === "The Crystal Titan") {
            this.drawCrystalTitan(ctx, boss, sx, sy, time);
            return true;
        }
        this.drawBlackKnight(ctx, boss, sx, sy, time);
        return true;
    },

    motion(boss, time) {
        return {
            bob: Math.sin(boss.walkFrame * Math.PI / 2) * 1.5,
            step: Math.round(Math.sin(boss.walkFrame * Math.PI / 2) * 3),
            pulse: Math.sin(time * 0.004),
            cape: Math.round(Math.sin(time * 0.003) * 3),
        };
    },

    drawBlackKnight(ctx, b, sx, sy, time) {
        const h = MonsterSprite;
        const p = h.palette;
        const a = this.motion(b, time);
        ctx.save();
        ctx.translate(Math.round(sx), Math.round(sy + a.bob));
        ctx.imageSmoothingEnabled = false;

        ctx.fillStyle = "rgba(0,0,0,0.52)";
        ctx.beginPath(); ctx.ellipse(0, 27, 25, 6, 0, 0, Math.PI * 2); ctx.fill();

        // Long torn cape makes the silhouette unmistakable even from behind.
        h.poly(ctx, p.deepInk, [[-17,-18],[16,-18],[21,23],[13,19],[8,28],[1,22],[-7,29],[-13,20],[-21,24]]);
        h.poly(ctx, "#43101a", [[-14,-15],[13,-15],[17,19],[11,16],[7,23],[1,18],[-6,24],[-10,16],[-17,19]]);
        h.box(ctx, "#711728", -11, -13, 22, 3);

        // Narrow waist between heavy greaves and exaggerated pauldrons.
        h.box(ctx, p.deepInk, -11-a.step, 6, 9, 21);
        h.box(ctx, "#242632", -9-a.step, 7, 6, 17);
        h.box(ctx, p.deepInk, 3+a.step, 6, 9, 21);
        h.box(ctx, "#2d2f3c", 4+a.step, 7, 6, 17);
        h.box(ctx, p.deepInk, -15, -15, 30, 24);
        h.poly(ctx, "#20222c", [[-12,-13],[11,-13],[14,-3],[8,7],[-8,7],[-14,-3]]);
        h.box(ctx, "#4a4d59", -9, -10, 17, 2);
        h.box(ctx, "#5f1725", -10, -2, 20, 3);
        h.poly(ctx, "#8c2134", [[0,-8],[5,-2],[0,4],[-5,-2]]);
        h.box(ctx, "#d34a58", -1, -6, 2, 5);

        // Wide, jagged pauldrons.
        h.poly(ctx, p.deepInk, [[-12,-14],[-20,-22],[-28,-17],[-23,-11],[-30,-8],[-15,-6]]);
        h.poly(ctx, "#30323e", [[-14,-14],[-20,-19],[-25,-16],[-21,-12],[-26,-10],[-15,-8]]);
        h.poly(ctx, "#555866", [[-20,-19],[-22,-26],[-17,-20]]);
        h.poly(ctx, p.deepInk, [[12,-14],[20,-22],[28,-17],[23,-11],[30,-8],[15,-6]]);
        h.poly(ctx, "#30323e", [[14,-14],[20,-19],[25,-16],[21,-12],[26,-10],[15,-8]]);
        h.poly(ctx, "#555866", [[20,-19],[22,-26],[17,-20]]);

        // Angular sallet helm and a single predatory visor slit.
        h.poly(ctx, p.deepInk, [[-11,-25],[-5,-35],[8,-34],[14,-26],[11,-16],[-10,-16],[-15,-21]]);
        h.poly(ctx, "#181a24", [[-8,-25],[-4,-31],[7,-31],[11,-25],[8,-19],[-8,-19],[-11,-22]]);
        h.box(ctx, "#353844", -5, -30, 3, 10);
        h.poly(ctx, "#09090e", [[-9,-26],[9,-26],[12,-22],[-8,-21]]);
        h.box(ctx, "#ff263e", -5, -24, 11, 2);
        h.box(ctx, "#ff8793", 2, -24, 3, 1);
        h.poly(ctx, "#681121", [[-3,-33],[0,-43],[4,-33]]);

        // Asymmetrical cursed blade mirrors the current attack direction.
        const angle = b.charging ? dirToAngle(b.chargeDir.x, b.chargeDir.y) : dirToAngle(b.facing.x, b.facing.y);
        ctx.save();
        ctx.translate(16, -4);
        ctx.rotate(angle);
        h.box(ctx, p.deepInk, -4, -5, 8, 17);
        h.box(ctx, "#704658", -2, -4, 4, 15);
        h.box(ctx, "#a92848", -8, 8, 16, 4);
        h.poly(ctx, p.deepInk, [[-5,10],[-7,38],[-1,48],[5,35],[4,10]]);
        h.poly(ctx, "#38142b", [[-2,12],[-4,35],[0,43],[3,33],[2,12]]);
        h.line(ctx, "#b52a55", 2, [[1,14],[-1,34],[1,39]]);
        ctx.restore();

        // Restrained aura: magic supports the shape without swallowing it.
        ctx.globalAlpha = 0.22 + a.pulse * 0.05;
        h.line(ctx, "#b11f40", 2, [[-24,24],[-29,4],[-25,-18]]);
        h.line(ctx, "#b11f40", 2, [[24,24],[29,4],[25,-18]]);
        ctx.restore();
    },

    drawStoneWarden(ctx, b, sx, sy, time) {
        const h = MonsterSprite;
        const p = h.palette;
        const a = this.motion(b, time);
        const slam = b.chargeWindup > 0 ? 8 : 0;
        ctx.save();
        ctx.translate(Math.round(sx), Math.round(sy + Math.abs(a.bob) * 0.3));
        ctx.imageSmoothingEnabled = false;
        ctx.fillStyle = "rgba(0,0,0,0.56)";
        ctx.beginPath(); ctx.ellipse(0, 30, 31, 7, 0, 0, Math.PI * 2); ctx.fill();

        // Block feet and a squat, load-bearing torso.
        h.poly(ctx, p.deepInk, [[-19,10],[-7,5],[-3,28],[-11,33],[-24,29]]);
        h.poly(ctx, "#45485a", [[-16,12],[-9,9],[-6,26],[-12,29],[-20,27]]);
        h.poly(ctx, p.deepInk, [[7,5],[20,10],[24,29],[11,33],[3,28]]);
        h.poly(ctx, "#505368", [[9,9],[17,12],[20,27],[12,29],[6,26]]);
        h.poly(ctx, p.deepInk, [[-22,-22],[-7,-35],[12,-32],[23,-17],[20,12],[7,22],[-11,21],[-24,10]]);
        h.poly(ctx, "#494c60", [[-18,-20],[-5,-30],[9,-28],[19,-15],[16,9],[6,17],[-9,17],[-20,8]]);
        h.poly(ctx, "#666a7d", [[-12,-21],[-4,-27],[7,-24],[11,-9],[-9,-8]]);

        // Ancient cyan rune core.
        h.poly(ctx, "#182b35", [[-8,-12],[1,-20],[10,-11],[8,4],[0,12],[-9,3]]);
        h.poly(ctx, "#45a7b8", [[-4,-10],[1,-15],[6,-9],[5,1],[0,7],[-5,1]]);
        h.box(ctx, "#b9f6ec", -1, -11, 3, 13);
        h.line(ctx, "#73909a", 2, [[-17,0],[-8,5],[-13,12]]);
        h.line(ctx, "#73788b", 2, [[12,-23],[7,-15],[15,-10]]);

        // Huge slab arms rise during the charge warning.
        h.poly(ctx, p.deepInk, [[-22,-18],[-35,-15-slam],[-40,5-slam],[-32,24-slam],[-18,17],[-15,-4]]);
        h.poly(ctx, "#3f4255", [[-24,-15],[-32,-12-slam],[-36,4-slam],[-30,19-slam],[-21,14],[-19,-4]]);
        h.line(ctx, "#6b7083", 2, [[-31,-10-slam],[-26,2-slam],[-33,10-slam]]);
        h.poly(ctx, p.deepInk, [[22,-18],[35,-15-slam],[40,5-slam],[32,24-slam],[18,17],[15,-4]]);
        h.poly(ctx, "#484b5e", [[24,-15],[32,-12-slam],[36,4-slam],[30,19-slam],[21,14],[19,-4]]);
        h.line(ctx, "#73788c", 2, [[31,-10-slam],[26,2-slam],[33,10-slam]]);

        h.poly(ctx, p.deepInk, [[-12,-33],[-4,-42],[9,-39],[16,-31],[12,-20],[-10,-21],[-17,-27]]);
        h.poly(ctx, "#55586b", [[-9,-32],[-3,-38],[7,-36],[12,-30],[9,-24],[-8,-24],[-13,-28]]);
        h.box(ctx, "#171923", -8, -31, 19, 6);
        h.box(ctx, "#77e5dc", -4, -29, 3, 2);
        h.box(ctx, "#77e5dc", 5, -29, 3, 2);
        ctx.restore();
    },

    drawCrystalTitan(ctx, b, sx, sy, time) {
        const h = MonsterSprite;
        const p = h.palette;
        const a = this.motion(b, time);
        const flare = Math.round((a.pulse + 1) * 2);
        ctx.save();
        ctx.translate(Math.round(sx), Math.round(sy + a.bob * 0.35));
        ctx.imageSmoothingEnabled = false;
        ctx.fillStyle = "rgba(0,0,0,0.58)";
        ctx.beginPath(); ctx.ellipse(0, 33, 31, 7, 0, 0, Math.PI * 2); ctx.fill();

        // Tall faceted legs taper into crystal points.
        h.poly(ctx, p.deepInk, [[-15,4],[-3,4],[-5,31],[-13,36],[-22,31]]);
        h.poly(ctx, "#4c3c62", [[-12,6],[-6,7],[-8,28],[-13,32],[-18,29]]);
        h.poly(ctx, "#8a65ab", [[-11,8],[-8,8],[-10,27],[-13,30]]);
        h.poly(ctx, p.deepInk, [[4,4],[16,4],[22,31],[13,36],[5,31]]);
        h.poly(ctx, "#59436f", [[7,7],[13,6],[18,29],[13,32],[8,29]]);
        h.poly(ctx, "#9b72bf", [[9,8],[12,8],[16,28],[13,30]]);

        h.poly(ctx, p.deepInk, [[-18,-26],[-5,-40],[12,-36],[22,-20],[17,11],[5,20],[-11,18],[-23,7]]);
        h.poly(ctx, "#56416e", [[-14,-24],[-3,-35],[9,-32],[18,-18],[13,8],[4,15],[-9,14],[-19,5]]);
        h.poly(ctx, "#795897", [[-9,-25],[0,-33],[8,-28],[9,-6],[-8,-7]]);
        h.poly(ctx, "#3a2c50", [[-8,-10],[1,-21],[11,-9],[8,7],[0,15],[-9,5]]);
        h.poly(ctx, "#af74e0", [[-4,-9],[1,-16],[6,-8],[5,3],[0,9],[-5,3]]);
        h.box(ctx, "#f0d7ff", -1, -11, 3, 13);

        // Crystal shelves and shoulder blades amplify the silhouette.
        h.poly(ctx, p.deepInk, [[-15,-23],[-31,-24],[-24,-17],[-35,-11],[-17,-8]]);
        h.poly(ctx, "#704f8c", [[-17,-21],[-27,-21],[-22,-17],[-30,-13],[-18,-11]]);
        h.poly(ctx, "#b884d9", [[-24,-22],[-28,-34-flare],[-18,-23]]);
        h.poly(ctx, p.deepInk, [[14,-23],[30,-24],[23,-17],[34,-11],[17,-8]]);
        h.poly(ctx, "#785394", [[16,-21],[26,-21],[21,-17],[29,-13],[18,-11]]);
        h.poly(ctx, "#c18ee0", [[23,-22],[29,-35-flare],[18,-23]]);

        // Left fist; right arm has grown into a prismatic lance.
        h.line(ctx, p.deepInk, 13, [[-18,-13],[-29,7],[-27,24]]);
        h.line(ctx, "#4a395f", 8, [[-18,-13],[-29,7],[-27,24]]);
        h.poly(ctx, p.deepInk, [[-34,19],[-22,19],[-19,28],[-27,34],[-37,29]]);
        h.poly(ctx, "#6b4e87", [[-31,21],[-24,21],[-22,27],[-27,31],[-33,28]]);
        h.line(ctx, p.deepInk, 11, [[17,-14],[27,1],[31,11]]);
        h.line(ctx, "#64477e", 7, [[17,-14],[27,1],[31,11]]);
        h.poly(ctx, p.deepInk, [[27,6],[37,9],[48,35],[37,28],[28,17]]);
        h.poly(ctx, "#a66dcc", [[30,8],[35,11],[43,29],[37,25],[31,16]]);
        h.box(ctx, "#ecd3ff", 34, 13, 2, 11);

        // Crown-like crystal head.
        h.poly(ctx, p.deepInk, [[-10,-37],[-5,-49],[0,-42],[7,-53],[10,-41],[17,-45],[14,-31],[8,-23],[-8,-24],[-16,-31]]);
        h.poly(ctx, "#684c83", [[-7,-36],[-4,-44],[0,-38],[6,-48],[8,-37],[13,-40],[11,-32],[7,-27],[-6,-27],[-12,-31]]);
        h.box(ctx, "#271d36", -7, -35, 18, 6);
        h.box(ctx, "#d29aff", -3, -33, 3, 2);
        h.box(ctx, "#d29aff", 6, -33, 3, 2);
        h.box(ctx, "#dfb7f3", 6, -46, 2, 9);
        ctx.restore();
    },

    drawGreenKnight(ctx, b, sx, sy, time) {
        const h = MonsterSprite;
        const p = h.palette;
        const a = this.motion(b, time);
        ctx.save();
        ctx.translate(Math.round(sx), Math.round(sy + a.bob));
        ctx.imageSmoothingEnabled = false;
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.beginPath(); ctx.ellipse(0, 27, 25, 6, 0, 0, Math.PI * 2); ctx.fill();

        // Root-edged cape and bark-black greaves.
        h.poly(ctx, p.deepInk, [[-16,-16],[15,-16],[20,21],[13,18],[8,28],[1,21],[-6,29],[-12,19],[-21,24]]);
        h.poly(ctx, "#153d20", [[-13,-13],[12,-13],[16,18],[10,15],[6,23],[1,17],[-5,24],[-9,16],[-16,19]]);
        h.box(ctx, p.deepInk, -11-a.step, 6, 9, 21);
        h.box(ctx, "#244629", -9-a.step, 7, 6, 17);
        h.box(ctx, p.deepInk, 3+a.step, 6, 9, 21);
        h.box(ctx, "#2b5130", 4+a.step, 7, 6, 17);

        h.poly(ctx, p.deepInk, [[-15,-15],[14,-15],[17,-2],[9,9],[-8,9],[-17,-1]]);
        h.poly(ctx, "#285332", [[-12,-12],[11,-12],[14,-2],[7,6],[-6,6],[-14,-1]]);
        h.box(ctx, "#8e763b", -10, -9, 20, 2);
        h.poly(ctx, "#5c8c46", [[0,-8],[6,-2],[0,5],[-6,-2]]);
        h.line(ctx, "#b2a14d", 2, [[0,-7],[0,3]]);

        // Leaf-shaped pauldrons with antlered branch tips.
        h.poly(ctx, p.deepInk, [[-12,-14],[-21,-23],[-29,-15],[-23,-7],[-14,-6]]);
        h.poly(ctx, "#35653b", [[-14,-14],[-21,-20],[-26,-15],[-21,-10],[-15,-8]]);
        h.line(ctx, "#8a6b3b", 3, [[-21,-20],[-24,-29],[-20,-24],[-29,-26]]);
        h.poly(ctx, p.deepInk, [[12,-14],[21,-23],[29,-15],[23,-7],[14,-6]]);
        h.poly(ctx, "#35653b", [[14,-14],[21,-20],[26,-15],[21,-10],[15,-8]]);
        h.line(ctx, "#8a6b3b", 3, [[21,-20],[24,-29],[20,-24],[29,-26]]);

        h.poly(ctx, p.deepInk, [[-11,-25],[-5,-35],[8,-34],[14,-25],[10,-16],[-10,-16],[-15,-21]]);
        h.poly(ctx, "#24492c", [[-8,-25],[-4,-31],[7,-31],[11,-24],[8,-19],[-8,-19],[-11,-22]]);
        h.box(ctx, "#0b1710", -9, -26, 20, 5);
        h.box(ctx, "#6eff64", -5, -24, 11, 2);
        h.box(ctx, "#d1ff8c", 2, -24, 3, 1);
        h.line(ctx, "#6a4d2f", 3, [[-4,-33],[-9,-42],[-7,-33],[-14,-38]]);
        h.line(ctx, "#6a4d2f", 3, [[7,-33],[13,-43],[10,-33],[17,-38]]);

        // Living blade with an uneven leaf edge.
        const angle = b.charging ? dirToAngle(b.chargeDir.x, b.chargeDir.y) : dirToAngle(b.facing.x, b.facing.y);
        ctx.save();
        ctx.translate(16, -4);
        ctx.rotate(angle);
        h.box(ctx, p.deepInk, -4, -4, 8, 17);
        h.box(ctx, "#755631", -2, -3, 4, 15);
        h.box(ctx, "#a78f49", -8, 8, 16, 4);
        h.poly(ctx, p.deepInk, [[-4,10],[-7,34],[-1,47],[5,35],[4,10]]);
        h.poly(ctx, "#276d3b", [[-1,12],[-4,33],[0,42],[3,33],[2,12]]);
        h.line(ctx, "#70d65e", 2, [[1,14],[-1,33],[1,38]]);
        ctx.restore();
        ctx.restore();
    },
};
