// ============================================
// Ingoizer's World - Hall of Deeds
// ============================================
//
// A shared log of first-time public milestones. Deeds are kept in this
// browser immediately. When HALL_CONFIG names a Supabase project, the same
// rows are inserted there (first timestamp wins) and the board reads back
// the shared table. See docs/hall-of-deeds.md.

const HALL_MILESTONES = {
    "makers-hollow": "Found Maker's Hollow",
    "black-knight": "Beat the Black Knight",
    "green-knight": "Beat the Green Knight",
    "giant-turtle": "Beat the Giant Snapping Turtle",
    "planted-worldtree": "Planted the Worldtree",
    "climbed-cloudlands": "Climbed to the Cloudlands",
    "beat-zeus": "Beat Zeus",
    "mended-worldtree": "Mended the Worldtree",
    "blue-gem-1": "Collected 1 Blue Gem",
    "blue-gem-2": "Collected 2 Blue Gems",
    "blue-gem-3": "Collected 3 Blue Gems",
    "blue-gem-4": "Collected 4 Blue Gems",
    "blue-gem-5": "Collected all Blue Gems",
    "clubhouse": "Found the Clubhouse",
    "charted-surface": "Charted the whole surface",
    "strange-key-copper": "Found a strange key",
    "strange-key-jade": "Found a strange key",
    "strange-key-crystal": "Found a strange key",
};

const HallOfDeeds = {
    STORAGE_KEY: "ingoizersWorld.hall",

    label(milestoneId) {
        return HALL_MILESTONES[milestoneId] || null;
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
            milestone: label,
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

    endpoint() {
        return String(HALL_CONFIG.supabaseUrl || "").replace(/\/$/, "");
    },

    async flush() {
        if (!this.configured()) return false;
        const deeds = this.readStore();
        const pending = deeds.filter(d => !d.synced);
        if (pending.length === 0) return true;
        let ok = true;
        for (const row of pending) {
            const sent = await this.insertRemote(row);
            if (sent) row.synced = true;
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
                        milestone: row.milestone,
                        achieved_at: new Date(row.achievedAt).toISOString(),
                    }),
                }
            );
            return res.ok || res.status === 409;
        } catch (e) {
            return false;
        }
    },

    async fetchRemote() {
        if (!this.configured()) return [];
        try {
            const res = await fetch(
                `${this.endpoint()}/rest/v1/hall_deeds?select=tag_key,player_tag,sibling_name,milestone_id,milestone,achieved_at&order=achieved_at.asc`,
                {
                    headers: {
                        apikey: HALL_CONFIG.supabaseAnonKey,
                        Authorization: `Bearer ${HALL_CONFIG.supabaseAnonKey}`,
                    },
                }
            );
            if (!res.ok) return [];
            const rows = await res.json();
            if (!Array.isArray(rows)) return [];
            return rows.map(r => ({
                tagKey: r.tag_key,
                playerTag: r.player_tag,
                siblingName: r.sibling_name,
                milestoneId: r.milestone_id,
                milestone: r.milestone,
                achievedAt: Date.parse(r.achieved_at),
                synced: true,
            })).filter(r => r.milestoneId && r.tagKey && isFinite(r.achievedAt));
        } catch (e) {
            return [];
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
