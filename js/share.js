// Notes for Luca. The browser only talks to the share-with-luca function.
// The address it is delivered to, and the key that sends the letter, stay
// on the server.
const ShareWithLuca = {
    categories: {
        idea: "An idea",
        request: "A feature request",
        frustration: "A frustration",
        story: "An epic story",
        accomplishment: "A major accomplishment",
        discovery: "A discovery",
    },

    limits: { message: 2000, name: 40, contact: 120 },

    prepare({ category, message, name, contact, company } = {}) {
        const cat = this.categories[category] ? category : "";
        const note = String(message || "").replace(/\r\n/g, "\n").trim();
        const who = String(name || "").trim().replace(/\s+/g, " ");
        const reach = String(contact || "").trim().replace(/\s+/g, " ");
        const trap = String(company || "");
        if (!cat) return { error: "Pick what kind of note this is." };
        if (!note) return { error: "Write a note first." };
        if (note.length > this.limits.message) return { error: "That note is too long." };
        if (who.length > this.limits.name) return { error: "That name is too long." };
        if (reach.length > this.limits.contact) return { error: "That contact line is too long." };
        return {
            payload: {
                category: cat,
                message: note,
                name: who,
                contact: reach,
                company: trap,
            },
        };
    },

    async send(payload) {
        if (typeof HALL_CONFIG === "undefined" || !HALL_CONFIG.supabaseUrl || !HALL_CONFIG.supabaseAnonKey) {
            return { ok: false, reason: "offline" };
        }
        const url = String(HALL_CONFIG.supabaseUrl).replace(/\/$/, "") + "/functions/v1/share-with-luca";
        try {
            const res = await fetch(url, {
                method: "POST",
                headers: {
                    apikey: HALL_CONFIG.supabaseAnonKey,
                    Authorization: "Bearer " + HALL_CONFIG.supabaseAnonKey,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });
            if (res.status === 429) return { ok: false, reason: "rate" };
            let data = null;
            try { data = await res.json(); } catch (e) { data = null; }
            if (!res.ok || !data || data.ok !== true) return { ok: false, reason: "refused" };
            return { ok: true, delivered: data.delivered === true };
        } catch (e) {
            return { ok: false, reason: "offline" };
        }
    },
};
