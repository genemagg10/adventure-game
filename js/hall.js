// ============================================
// Ingoizer's World - Hall of Champions
// ============================================
//
// A shared log of first-time public milestones. Deeds are kept in this
// browser immediately. When HALL_CONFIG names a Supabase project, the same
// rows are inserted there (first timestamp wins) and the board reads back
// the shared table. See docs/hall-of-deeds.md.

const HALL_MILESTONES = {
    // The board shows this. The shared table still stores the older sentence;
    // champions() always prints the words from this map.
    "makers-hollow": "A secret space was discovered",
    "hidden-base": "Another secret space was discovered",
    "cave-sw": "Explored the SW Cave",
    "cave-se": "Explored the SE Cave",
    "cave-nw": "Explored the NW Cave",
    "cave-ne": "Explored the NE Cave",
    "black-knight": "Beat the Black Knight",
    "green-knight": "Beat the Green Knight",
    "giant-turtle": "Beat the Giant Snapping Turtle",
    "planted-worldtree": "Planted the Worldtree",
    "climbed-cloudlands": "Climbed to the Cloudlands",
    "beat-zeus": "Beat Zeus",
    "mended-worldtree": "Mended the Worldtree",
    "luca-defeated": "Beat Luca",
    "blue-gem-1": "Collected 1 Blue Gem",
    "blue-gem-2": "Collected 2 Blue Gems",
    "blue-gem-3": "Collected 3 Blue Gems",
    "blue-gem-4": "Collected 4 Blue Gems",
    "blue-gem-5": "Collected all Blue Gems",
    "clubhouse": "Found the Clubhouse",
    "charted-surface": "Charted the whole surface",
    "lady-of-the-lake": "Helped the Lady of the Lake",
    "helped-merlin": "Helped Merlin",
    "strange-key-copper": "Found a strange key",
    "strange-key-jade": "Found a strange key",
    "strange-key-crystal": "Found a strange key",
};

// Difficulty of each public deed. The board ranks a champion by the sum.
// Early finds are 1, the road out of the meadow is 2, the mid bosses are 3,
// the late trials are 5, the two endings are 8, and beating Luca is 10.
const HALL_DEED_WEIGHT = {
    "makers-hollow": { weight: 1, tier: "Early" },
    // The two maze caves are early wanders. The two boss caves take a gem to
    // open and a fight at the end, so they sit one step up, on the road.
    "cave-sw": { weight: 1, tier: "Early" },
    "cave-se": { weight: 1, tier: "Early" },
    "cave-nw": { weight: 2, tier: "Road" },
    "cave-ne": { weight: 2, tier: "Road" },
    "clubhouse": { weight: 1, tier: "Early" },
    "blue-gem-1": { weight: 1, tier: "Early" },
    "blue-gem-2": { weight: 1, tier: "Early" },
    "blue-gem-3": { weight: 2, tier: "Road" },
    "strange-key-copper": { weight: 2, tier: "Road" },
    "strange-key-jade": { weight: 2, tier: "Road" },
    "strange-key-crystal": { weight: 2, tier: "Road" },
    "blue-gem-4": { weight: 3, tier: "Mid" },
    "black-knight": { weight: 3, tier: "Mid" },
    "green-knight": { weight: 3, tier: "Mid" },
    // Excalibur and the Enchanter's Mallet are mid-game rewards: the sheath
    // troll stands in the Dark Forest, and Merlin's wand is at the castle gates.
    "lady-of-the-lake": { weight: 3, tier: "Mid" },
    "helped-merlin": { weight: 3, tier: "Mid" },
    // Inside the castle, after an elemental gem opens a hidden ladder.
    "hidden-base": { weight: 3, tier: "Mid" },
    "blue-gem-5": { weight: 5, tier: "Late" },
    "giant-turtle": { weight: 5, tier: "Late" },
    "planted-worldtree": { weight: 5, tier: "Late" },
    "climbed-cloudlands": { weight: 5, tier: "Late" },
    "charted-surface": { weight: 5, tier: "Late" },
    "beat-zeus": { weight: 8, tier: "Ending" },
    "mended-worldtree": { weight: 8, tier: "Ending" },
    "luca-defeated": { weight: 10, tier: "Legend" },
};

// A champion who has every public deed earns this on top of the weights.
// It is not another deed. The Best column shows it as the jade crown.
const HALL_FULL_SET_BONUS = 10;

// The live hall_deeds check still requires this exact sentence for the hollow.
// New rows send it. The board never displays it.
const HALL_WIRE_MILESTONE = {
    "makers-hollow": "Found Maker's Hollow",
};

const HallOfDeeds = {
    STORAGE_KEY: "ingoizersWorld.hall",
    PAGE_SIZE: 1000,

    label(milestoneId) {
        return HALL_MILESTONES[milestoneId] || null;
    },

    // What an insert sends. The hollow keeps the sentence the table already
    // accepts. Everything else sends the words the board shows.
    wireMilestone(milestoneId) {
        return HALL_WIRE_MILESTONE[milestoneId] || this.label(milestoneId);
    },

    weightOf(milestoneId) {
        const row = HALL_DEED_WEIGHT[milestoneId];
        return row ? row.weight : 0;
    },

    tierOf(milestoneId) {
        const row = HALL_DEED_WEIGHT[milestoneId];
        return row ? row.tier : "";
    },

    // Every listed public deed. The three strange keys are one line on the
    // board, and that line counts only when all three have been found.
    hasFullSet(deeds) {
        const ids = new Set((deeds || []).map((deed) => deed.milestoneId));
        return Object.keys(HALL_MILESTONES).every((id) => ids.has(id));
    },

    // One champion per tag. Score is the sum of deed weights, plus ten for a
    // full set. Ties break by how many deeds they hold, then by their hardest
    // mark (a full set outranks any single deed), then by who reached that
    // score first. The full-set bonus is reached when the last deed lands.
    champions(rows) {
        const deduped = this.merge(Array.isArray(rows) ? rows : [], []);
        const groups = new Map();
        for (const row of deduped) {
            let champ = groups.get(row.tagKey);
            if (!champ) {
                champ = {
                    tagKey: row.tagKey,
                    playerTag: row.playerTag,
                    firstAt: row.achievedAt,
                    deeds: [],
                };
                groups.set(row.tagKey, champ);
            } else if (row.achievedAt < champ.firstAt) {
                champ.playerTag = row.playerTag || champ.playerTag;
                champ.firstAt = row.achievedAt;
            }
            champ.deeds.push(row);
        }
        const list = [];
        for (const champ of groups.values()) {
            let score = 0;
            let reachedAt = 0;
            let hardest = null;
            const deeds = champ.deeds.map((deed) => {
                const weight = this.weightOf(deed.milestoneId);
                const tier = this.tierOf(deed.milestoneId);
                score += weight;
                if (deed.achievedAt > reachedAt) reachedAt = deed.achievedAt;
                const entry = {
                    milestoneId: deed.milestoneId,
                    // The map wins over whatever text was stored with the row.
                    milestone: this.label(deed.milestoneId) || deed.milestone,
                    weight,
                    tier,
                    achievedAt: deed.achievedAt,
                };
                if (!hardest || weight > hardest.weight || (weight === hardest.weight && deed.achievedAt < hardest.achievedAt)) {
                    hardest = entry;
                }
                return entry;
            });
            deeds.sort((a, b) => {
                if (b.weight !== a.weight) return b.weight - a.weight;
                return a.achievedAt - b.achievedAt;
            });
            const fullSet = this.hasFullSet(deeds);
            if (fullSet) score += HALL_FULL_SET_BONUS;
            const deedWeight = hardest ? hardest.weight : 0;
            list.push({
                tagKey: champ.tagKey,
                playerTag: champ.playerTag,
                score,
                count: deeds.length,
                fullSet,
                bonus: fullSet ? HALL_FULL_SET_BONUS : 0,
                hardest: deedWeight,
                // A full set is the mark in the Best column, above Legend.
                hardestMark: fullSet ? deedWeight + 1 : deedWeight,
                hardestId: fullSet ? "" : (hardest ? hardest.milestoneId : ""),
                hardestLabel: fullSet ? "Full set" : (hardest ? hardest.milestone : ""),
                hardestTier: fullSet ? "Jade" : (hardest ? hardest.tier : ""),
                reachedAt,
                deeds,
            });
        }
        list.sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            if (b.count !== a.count) return b.count - a.count;
            if (b.hardestMark !== a.hardestMark) return b.hardestMark - a.hardestMark;
            if (a.reachedAt !== b.reachedAt) return a.reachedAt - b.reachedAt;
            if (a.tagKey < b.tagKey) return -1;
            if (a.tagKey > b.tagKey) return 1;
            return 0;
        });
        for (let i = 0; i < list.length; i++) list[i].rank = i + 1;
        return list;
    },

    // A display name: trimmed, inner spaces collapsed, 1–16 characters.
    // Letters, numbers, spaces, apostrophes, and hyphens only.
    normalizeTag(raw) {
        const tag = String(raw || "").trim().replace(/\s+/g, " ");
        if (!tag || tag.length > 16) return null;
        if (!/^[A-Za-z0-9][A-Za-z0-9 '\-]*$/.test(tag)) return null;
        return tag;
    },

    tagKey(tag) {
        return String(tag || "").trim().replace(/\s+/g, " ").toLowerCase();
    },

    configured() {
        const cfg = (typeof HALL_CONFIG !== "undefined") ? HALL_CONFIG : {};
        return !!(cfg.supabaseUrl && cfg.supabaseAnonKey);
    },

    readStore() {
        try {
            const raw = localStorage.getItem(this.STORAGE_KEY);
            const data = raw ? JSON.parse(raw) : null;
            const deeds = data && Array.isArray(data.deeds) ? data.deeds : [];
            return deeds.filter(d => d && d.milestoneId && d.tagKey);
        } catch (e) {
            return [];
        }
    },

    writeStore(deeds) {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify({ deeds }));
            return true;
        } catch (e) {
            return false;
        }
    },

    // Record a public milestone. Unknown ids are ignored. The same tag and
    // milestone keep the earliest timestamp.
    record({ playerTag, siblingName, milestoneId, at } = {}) {
        const label = this.label(milestoneId);
        const tag = this.normalizeTag(playerTag);
        if (!label || !tag) return null;
        const sibling = String(siblingName || "Ingoizer").trim().slice(0, 24) || "Ingoizer";
        const when = (typeof at === "number" && isFinite(at)) ? at : Date.now();
        const key = this.tagKey(tag);
        const deeds = this.readStore();
        const existing = deeds.find(d => d.tagKey === key && d.milestoneId === milestoneId);
        if (existing) {
            if (when < existing.achievedAt) {
                existing.achievedAt = when;
                existing.playerTag = existing.playerTag || tag;
                existing.synced = false;
                this.writeStore(deeds);
            }
            return existing;
        }
        const row = {
            tagKey: key,
            playerTag: tag,
            siblingName: sibling,
            milestoneId,
            milestone: this.wireMilestone(milestoneId) || label,
            achievedAt: when,
            synced: false,
        };
        deeds.push(row);
        this.writeStore(deeds);
        this.flush().catch(() => {});
        return row;
    },

    // Pacific Time, ISO 8601 with the numeric offset (PST or PDT as the date requires).
    formatPacific(date) {
        const d = date instanceof Date ? date : new Date(date);
        if (isNaN(d.getTime())) return "";
        let parts;
        try {
            parts = new Intl.DateTimeFormat("en-US", {
                timeZone: "America/Los_Angeles",
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hourCycle: "h23",
                timeZoneName: "longOffset",
            }).formatToParts(d);
        } catch (e) {
            return d.toISOString();
        }
        const get = (type) => {
            const part = parts.find(p => p.type === type);
            return part ? part.value : "";
        };
        let off = get("timeZoneName").replace(/^GMT/i, "").replace("UTC", "");
        const match = off.match(/^([+-])(\d{1,2})(?::?(\d{2}))?$/);
        if (match) {
            off = match[1] + String(match[2]).padStart(2, "0") + ":" + (match[3] || "00");
        } else if (!/^[+-]\d{2}:\d{2}$/.test(off)) {
            off = "Z";
        }
        const hour = get("hour") === "24" ? "00" : get("hour");
        return `${get("year")}-${get("month")}-${get("day")}T${hour}:${get("minute")}:${get("second")}${off}`;
    },

    // The When column. Stored times stay on formatPacific; this is only the line a kid reads.
    formatWhen(date) {
        const d = date instanceof Date ? date : new Date(date);
        if (isNaN(d.getTime())) return "";
        let parts;
        try {
            parts = new Intl.DateTimeFormat("en-US", {
                timeZone: "America/Los_Angeles",
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
            }).formatToParts(d);
        } catch (e) {
            return this.formatPacific(d);
        }
        const get = (type) => {
            const part = parts.find(p => p.type === type);
            return part ? part.value : "";
        };
        const minute = String(get("minute")).padStart(2, "0");
        const period = get("dayPeriod").replace(/\s/g, "").toUpperCase();
        return `${get("month")} ${get("day")}, ${get("year")} · ${get("hour")}:${minute} ${period} PT`;
    },

    endpoint() {
        return String(HALL_CONFIG.supabaseUrl || "").replace(/\/$/, "");
    },

    async flush() {
        if (!this.configured()) return false;
        const deeds = this.readStore();
        const pending = deeds.filter(d => !d.synced && !d.dropped);
        if (pending.length === 0) return true;
        let ok = true;
        for (const row of pending) {
            const sent = await this.insertRemote(row);
            if (sent === "ok") row.synced = true;
            else if (sent === "drop") row.dropped = true;
            else ok = false;
        }
        this.writeStore(deeds);
        return ok;
    },

    async insertRemote(row) {
        try {
            const res = await fetch(
                `${this.endpoint()}/rest/v1/hall_deeds?on_conflict=tag_key,milestone_id`,
                {
                    method: "POST",
                    headers: {
                        apikey: HALL_CONFIG.supabaseAnonKey,
                        Authorization: `Bearer ${HALL_CONFIG.supabaseAnonKey}`,
                        "Content-Type": "application/json",
                        Prefer: "resolution=ignore-duplicates,return=minimal",
                    },
                    body: JSON.stringify({
                        tag_key: row.tagKey,
                        player_tag: row.playerTag,
                        sibling_name: row.siblingName,
                        milestone_id: row.milestoneId,
                        milestone: this.wireMilestone(row.milestoneId) || row.milestone,
                        achieved_at: new Date(row.achievedAt).toISOString(),
                    }),
                }
            );
            if (res.ok || res.status === 409) return "ok";
            // PostgREST answers a refused row with 401 or 403 (RLS, 42501) or
            // 400 (a check failed). Those will never succeed on retry.
            if (res.status < 500) {
                console.warn("Hall of Deeds refused a deed (" + res.status + "):", row.milestoneId);
                return "drop";
            }
            return "retry";
        } catch (e) {
            return "retry";
        }
    },

    async fetchRemote() {
        if (!this.configured()) return [];
        const pageSize = Math.max(1, this.PAGE_SIZE | 0);
        const collected = [];
        try {
            for (let offset = 0; ; offset += pageSize) {
                const res = await fetch(
                    `${this.endpoint()}/rest/v1/hall_deeds?select=tag_key,player_tag,milestone_id,milestone,achieved_at&order=achieved_at.asc&limit=${pageSize}&offset=${offset}`,
                    {
                        headers: {
                            apikey: HALL_CONFIG.supabaseAnonKey,
                            Authorization: `Bearer ${HALL_CONFIG.supabaseAnonKey}`,
                        },
                    }
                );
                if (!res.ok) return offset === 0 ? [] : collected;
                const rows = await res.json();
                if (!Array.isArray(rows) || rows.length === 0) break;
                for (const r of rows) {
                    const row = {
                        tagKey: r.tag_key,
                        playerTag: r.player_tag,
                        milestoneId: r.milestone_id,
                        milestone: r.milestone,
                        achievedAt: Date.parse(r.achieved_at),
                        synced: true,
                    };
                    if (row.milestoneId && row.tagKey && isFinite(row.achievedAt)) collected.push(row);
                }
                if (rows.length < pageSize) break;
            }
            return collected;
        } catch (e) {
            return collected;
        }
    },

    // Local rows plus the shared table. Same tag and milestone: earliest time wins.
    merge(local, remote) {
        const byKey = new Map();
        for (const row of [...local, ...remote]) {
            if (!row || !this.label(row.milestoneId)) continue;
            const id = `${row.tagKey}|${row.milestoneId}`;
            const prev = byKey.get(id);
            if (!prev || row.achievedAt < prev.achievedAt) byKey.set(id, row);
        }
        return [...byKey.values()].sort((a, b) => a.achievedAt - b.achievedAt);
    },

    async loadBoard() {
        await this.flush().catch(() => {});
        const remote = await this.fetchRemote();
        return this.merge(this.readStore(), remote);
    },
};
