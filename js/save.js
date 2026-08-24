// ============================================
// Ingoizer's World - Saved Games
// ============================================
//
// A save holds progress, not the living world. Monsters, wild animals and
// arrows in flight are all thrown away and repopulated on load - they respawn
// constantly anyway, so keeping them buys nothing. Tamed companions are
// progress and do come back.
//
// Terrain is never written down. Every world in the game is generated from a
// fixed seed, so loading regenerates the same ground and only the handful of
// tiles the player has since changed - burnt trees, opened shafts - are stored
// as a diff against a freshly generated reference.
//
// Older saves load into newer builds: restoring overlays saved fields onto a
// fully initialised new game, so any field a save predates simply keeps the
// new game's default.

// Phase 1 saves and loads a single slot; the three-slot picker comes next.
const SAVE_SLOT_DEFAULT = 1;

const SaveSystem = {
    VERSION: 1,
    SLOTS: 3,
    KEY_PREFIX: "ingoizersWorld.save.slot",

    // Fields copied straight across. Anything not listed here is transient -
    // knockback, attack timers, animation frames - and is rebuilt on load.
    PLAYER_FIELDS: [
        "x", "y", "hp", "maxHp", "speed", "gold", "blueGems", "totalGemsNeeded",
        "weapons", "currentWeapon", "armors", "currentArmor", "bows", "currentBow",
        "arrows", "elements", "activeElement", "elementUnlockOrder", "nextElementIndex",
        "facing", "shieldActive", "shieldHits", "hasSheath",
        "hasMerlinWand", "hasMallet", "malletUsedWeapon", "malletUsedArmor",
        "enchantments", "armorEnchantment", "armorEnchantedId",
        "greenGemAttack", "greenGemDefense", "hasMagicCharm", "hasDarkCrest", "hasGauntlet",
        "purpleGemHealth", "purpleGemAttack", "purpleGemArmor", "hasRainbowGem", "hasZeusBolts",
        "hasWorldtreeSeed", "healthPotions", "greaterHealthPotions", "apples", "monstersKilled",
    ],

    // Progress flags on the Game object itself. Note what is absent: the
    // `...Spawned` flags for undefeated bosses are deliberately left at their
    // fresh-game default, so a boss the player walked away from mid-fight is
    // re-triggered by walking back in - the same thing respawnPlayer() does.
    GAME_FIELDS: [
        "engagedPlayTime",
        "bossDefeated",
        "greenKnightDefeated", "greenlandsUnlocked",
        "inCave", "activeCaveId", "caveBossDefeated", "caveTreasureCollected",
        "savedSurfacePos",
        "inSky", "skyMonsterKills", "olympianSummoned", "olympianDefeated",
        "skyTreeHintGiven", "skyTreeApproachSeen",
        "fountainIntroShown", "tapestryRead",
        "worldtreeRestored", "zeusAppeased", "zeusMetInPeace",
        "loreUnlocks", "firstTameShown",
        "ladyQuestState", "ladyQuestAsked", "merlinQuestState",
        "monsterGemDrops", "currentZone",
    ],

    // ============================================
    // Slot storage
    // ============================================

    slotKey(slot) {
        return `${this.KEY_PREFIX}${slot}`;
    },

    available() {
        try {
            const probe = "ingoizersWorld.probe";
            localStorage.setItem(probe, "1");
            localStorage.removeItem(probe);
            return true;
        } catch (e) {
            return false;
        }
    },

    read(slot) {
        try {
            const raw = localStorage.getItem(this.slotKey(slot));
            if (!raw) return null;
            const data = JSON.parse(raw);
            // A save written by a build newer than this one may describe things
            // this code cannot rebuild. Better to show it as unreadable than to
            // load half of it.
            if (!data || typeof data.version !== "number" || data.version > this.VERSION) return null;
            return data;
        } catch (e) {
            return null;
        }
    },

    // Just the header, for menus that list what is in each slot.
    meta(slot) {
        const data = this.read(slot);
        return data ? data.meta || null : null;
    },

    hasSave(slot) {
        return this.meta(slot) !== null;
    },

    // The slot to offer behind "Continue" - the most recently written one.
    mostRecentSlot() {
        let best = null;
        let bestTime = -1;
        for (let slot = 1; slot <= this.SLOTS; slot++) {
            const meta = this.meta(slot);
            if (meta && typeof meta.savedAt === "number" && meta.savedAt > bestTime) {
                bestTime = meta.savedAt;
                best = slot;
            }
        }
        return best;
    },

    write(slot, data) {
        try {
            localStorage.setItem(this.slotKey(slot), JSON.stringify(data));
            return true;
        } catch (e) {
            return false;
        }
    },

    clear(slot) {
        try {
            localStorage.removeItem(this.slotKey(slot));
            return true;
        } catch (e) {
            return false;
        }
    },

    // ============================================
    // Helpers
    // ============================================

    // Copy the listed keys across, skipping any the source does not carry. A
    // save written before a feature existed leaves that feature's field alone,
    // so it keeps whatever a brand new game starts it at.
    overlay(target, source, fields) {
        if (!target || !source) return;
        for (const key of fields) {
            if (source[key] !== undefined) target[key] = source[key];
        }
    },

    // Fog is a byte per cell but only ever 0 or 1, so pack it to bits before
    // it goes anywhere near localStorage.
    packFog(fog) {
        if (!fog || !fog.seen) return null;
        const bytes = new Uint8Array(Math.ceil(fog.seen.length / 8));
        for (let i = 0; i < fog.seen.length; i++) {
            if (fog.seen[i]) bytes[i >> 3] |= 1 << (i & 7);
        }
        let binary = "";
        for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
        return { cells: fog.seen.length, bits: btoa(binary) };
    },

    unpackFog(fog, packed) {
        if (!fog || !packed || typeof packed.bits !== "string") return;
        // A save charted against a different grid size cannot be mapped onto
        // this one; leave the fresh fog rather than smear it.
        if (packed.cells !== fog.seen.length) return;
        let binary;
        try {
            binary = atob(packed.bits);
        } catch (e) {
            return;
        }
        let charted = 0;
        for (let i = 0; i < fog.seen.length; i++) {
            const bit = (binary.charCodeAt(i >> 3) >> (i & 7)) & 1;
            fog.seen[i] = bit;
            if (bit) charted++;
        }
        fog.charted = charted;
        fog.lastTile = null;
    },

    // Replays the world changes that are big, permanent and rebuildable from a
    // single flag. Doing this to both the live world and the reference world
    // keeps the tile diff down to the small stuff.
    replayWorldEvents(world, flags) {
        if (!world || !flags) return;
        if (flags.greenCastleBuilt) world.unlockGreenlands();
        if (flags.skyLadderRevealed) world.revealSkyLadder();
        if (flags.hiddenLadderRevealed) world.revealHiddenLadder();
    },

    worldEventFlags(world) {
        return {
            greenCastleBuilt: !!world.greenCastleBuilt,
            skyLadderRevealed: !!(world.skyTree && world.skyTree.state === "revealed"),
            hiddenLadderRevealed: !!(world.hiddenLadder && world.hiddenLadder.revealed),
        };
    },

    // Everything the player has changed about the ground that the seed and the
    // replays above do not already account for - burnt trees, mostly.
    tileDiff(world, flags) {
        const reference = new World(world.gemSeed);
        this.replayWorldEvents(reference, flags);
        const diff = [];
        for (let y = 0; y < WORLD_H; y++) {
            for (let x = 0; x < WORLD_W; x++) {
                if (world.tiles[y][x] !== reference.tiles[y][x]) {
                    diff.push(y * WORLD_W + x, world.tiles[y][x]);
                }
            }
        }
        return diff;
    },

    applyTileDiff(world, diff) {
        if (!Array.isArray(diff)) return;
        for (let i = 0; i + 1 < diff.length; i += 2) {
            const y = Math.floor(diff[i] / WORLD_W);
            const x = diff[i] % WORLD_W;
            if (y < 0 || y >= WORLD_H || x < 0 || x >= WORLD_W) continue;
            world.tiles[y][x] = diff[i + 1];
        }
        // The illustrated map layer is drawn from the tiles and cached.
        world.mapTerrain = null;
        world.mapTerrainSig = "";
        world.mapEpoch = (world.mapEpoch || 0) + 1;
    },

    // Pickups sit where the seed put them, so only their state travels. Kept
    // by index; a length mismatch means the placement changed between builds,
    // and leaving them untouched is safer than pairing them up wrongly.
    captureFlags(list, fields) {
        if (!Array.isArray(list)) return [];
        return list.map(item => {
            const out = {};
            for (const key of fields) {
                if (item[key] !== undefined) out[key] = item[key];
            }
            return out;
        });
    },

    restoreFlags(list, saved, fields) {
        if (!Array.isArray(list) || !Array.isArray(saved) || list.length !== saved.length) return;
        for (let i = 0; i < list.length; i++) {
            this.overlay(list[i], saved[i], fields);
        }
    },

    // ============================================
    // Capture
    // ============================================

    capture(game) {
        const world = game.world;
        const flags = this.worldEventFlags(world);

        const snapshot = {
            version: this.VERSION,
            meta: this.captureMeta(game),
            player: this.capturePlayer(game.player),
            game: this.captureGame(game),
            companions: this.captureCompanions(game.companions),
            world: this.captureWorld(world, flags),
            caves: this.captureCaves(game.caveWorlds),
            sky: this.captureSky(game.skyWorld),
        };
        return snapshot;
    },

    captureMeta(game) {
        const zone = ZONES[game.currentZone];
        let realm = zone ? zone.name : "The Wilds";
        if (game.inCave) realm = "Underground";
        else if (game.inSky) realm = "The Cloudlands";
        return {
            savedAt: Date.now(),
            playtime: Math.floor(game.engagedPlayTime || 0),
            realm: realm,
            blueGems: game.player.blueGems,
            gold: game.player.gold,
            hp: game.player.hp,
            maxHp: game.player.maxHp,
        };
    },

    capturePlayer(player) {
        const out = {};
        for (const key of this.PLAYER_FIELDS) {
            const value = player[key];
            out[key] = (value && typeof value === "object") ? JSON.parse(JSON.stringify(value)) : value;
        }
        return out;
    },

    captureGame(game) {
        const out = {};
        for (const key of this.GAME_FIELDS) {
            const value = game[key];
            out[key] = (value && typeof value === "object") ? JSON.parse(JSON.stringify(value)) : value;
        }
        return out;
    },

    // Only the pack that is still on its feet. A companion mid-death animation
    // would come back on load having already been mourned.
    captureCompanions(companions) {
        if (!Array.isArray(companions)) return [];
        return companions.filter(c => c.alive).map(c => ({
            type: c.type,
            x: c.x,
            y: c.y,
            hp: c.hp,
            maxHp: c.maxHp,
        }));
    },

    captureWorld(world, flags) {
        return {
            gemSeed: world.gemSeed,
            events: flags,
            tileDiff: this.tileDiff(world, flags),
            fog: this.packFog(world.fog),
            gems: this.captureFlags(world.gems, ["collected"]),
            coins: this.captureFlags(world.coins, ["collected", "respawnTimer"]),
            apples: this.captureFlags(world.apples, ["collected", "respawnTimer"]),
            greenGems: this.captureFlags(world.greenGems, ["collected"]),
            sapling: world.sapling ? { ...world.sapling } : null,
            skyTree: world.skyTree ? {
                state: world.skyTree.state,
                burnTimer: world.skyTree.burnTimer,
                discovered: world.skyTree.discovered,
                regrown: world.skyTree.regrown,
            } : null,
            hiddenLadder: world.hiddenLadder ? {
                revealed: world.hiddenLadder.revealed,
                looted: world.hiddenLadder.looted,
                treasureIds: (world.hiddenLadder.treasures || []).map(t => t.id),
            } : null,
            ladyOfLake: world.ladyOfLake ? { excaliburGiven: world.ladyOfLake.excaliburGiven } : null,
            merlinHut: world.merlinHut ? {
                showWand: world.merlinHut.showWand,
                wandCollected: world.merlinHut.wandCollected,
            } : null,
            castleTapestry: world.castleTapestry ? { uncovered: world.castleTapestry.uncovered } : null,
            makersHollow: world.makersHollow ? { discovered: world.makersHollow.discovered } : null,
            burningTrees: world.burningTrees ? JSON.parse(JSON.stringify(world.burningTrees)) : null,
        };
    },

    // Cave and sky terrain never changes at runtime, so only what the player
    // has charted and picked up needs keeping.
    captureCaves(caveWorlds) {
        const out = {};
        for (const id of Object.keys(caveWorlds || {})) {
            const cave = caveWorlds[id];
            if (!cave) continue;
            out[id] = { fog: this.packFog(cave.fog) };
        }
        return out;
    },

    captureSky(skyWorld) {
        if (!skyWorld) return null;
        return {
            fog: this.packFog(skyWorld.fog),
            ambrosia: this.captureFlags(skyWorld.ambrosia, ["collected"]),
        };
    },

    // ============================================
    // Restore
    // ============================================
    //
    // Everything below assumes the game has already been reset to a fresh
    // start on this save's gem seed. Restoring is purely an overlay, which is
    // what lets a save from an older build load cleanly.

    restore(game, data) {
        if (!data) return false;
        this.overlay(game.player, data.player, this.PLAYER_FIELDS);
        this.overlay(game, data.game, this.GAME_FIELDS);
        this.restoreCompanions(game, data.companions);
        this.restoreWorld(game.world, data.world);
        this.restoreCaves(game.caveWorlds, data.caves);
        this.restoreSky(game.skyWorld, data.sky);
        return true;
    },

    restoreCompanions(game, saved) {
        game.companions = [];
        if (!Array.isArray(saved)) return;
        for (const entry of saved) {
            if (!entry || !ANIMAL_TYPES[entry.type]) continue;
            const animal = new Animal(entry.type, entry.x, entry.y);
            animal.tame(game.companions.length);
            // The taming glow is a one-off flourish for the moment it happens.
            animal.tameGlow = 0;
            if (typeof entry.maxHp === "number") animal.maxHp = entry.maxHp;
            if (typeof entry.hp === "number") animal.hp = Math.min(entry.hp, animal.maxHp);
            game.companions.push(animal);
        }
    },

    restoreWorld(world, saved) {
        if (!world || !saved) return;

        this.replayWorldEvents(world, saved.events);
        this.applyTileDiff(world, saved.tileDiff);
        this.unpackFog(world.fog, saved.fog);

        this.restoreFlags(world.gems, saved.gems, ["collected"]);
        this.restoreFlags(world.coins, saved.coins, ["collected", "respawnTimer"]);
        this.restoreFlags(world.apples, saved.apples, ["collected", "respawnTimer"]);
        this.restoreFlags(world.greenGems, saved.greenGems, ["collected"]);

        if (saved.sapling) world.sapling = { ...saved.sapling };
        this.overlay(world.skyTree, saved.skyTree, ["state", "burnTimer", "discovered", "regrown"]);
        this.overlay(world.hiddenLadder, saved.hiddenLadder, ["revealed", "looted"]);
        this.overlay(world.ladyOfLake, saved.ladyOfLake, ["excaliburGiven"]);
        this.overlay(world.merlinHut, saved.merlinHut, ["showWand", "wandCollected"]);
        this.overlay(world.castleTapestry, saved.castleTapestry, ["uncovered"]);
        this.overlay(world.makersHollow, saved.makersHollow, ["discovered"]);
        if (saved.burningTrees) world.burningTrees = { ...saved.burningTrees };

        // Treasures already carried out of the hidden base do not lie there
        // waiting to be picked up a second time.
        if (world.hiddenLadder && Array.isArray(world.hiddenLadder.treasures)
            && saved.hiddenLadder && Array.isArray(saved.hiddenLadder.treasureIds)) {
            const remaining = saved.hiddenLadder.treasureIds;
            world.hiddenLadder.treasures = world.hiddenLadder.treasures.filter(t => remaining.includes(t.id));
        }
    },

    restoreCaves(caveWorlds, saved) {
        if (!caveWorlds || !saved) return;
        for (const id of Object.keys(saved)) {
            const cave = caveWorlds[id];
            if (!cave || !saved[id]) continue;
            this.unpackFog(cave.fog, saved[id].fog);
        }
    },

    restoreSky(skyWorld, saved) {
        if (!skyWorld || !saved) return;
        this.unpackFog(skyWorld.fog, saved.fog);
        this.restoreFlags(skyWorld.ambrosia, saved.ambrosia, ["collected"]);
    },

    // ============================================
    // Presentation
    // ============================================

    describeSlot(slot) {
        const meta = this.meta(slot);
        if (!meta) return null;
        return {
            realm: meta.realm || "The Wilds",
            gems: `${meta.blueGems || 0}/5 gems`,
            gold: `${meta.gold || 0} gold`,
            playtime: this.formatPlaytime(meta.playtime || 0),
            savedAt: this.formatDate(meta.savedAt),
        };
    },

    formatPlaytime(ms) {
        const totalMinutes = Math.floor(ms / 60000);
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        if (hours > 0) return `${hours}h ${minutes}m`;
        return `${minutes}m`;
    },

    formatDate(timestamp) {
        if (!timestamp) return "";
        try {
            return new Date(timestamp).toLocaleString(undefined, {
                month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
            });
        } catch (e) {
            return "";
        }
    },
};
