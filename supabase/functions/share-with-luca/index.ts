// Accepts a note from the game, stores it, and emails it when the mail
// secrets are set. The recipient is SHARE_TO_EMAIL. It is not in the client.
//
// verify_jwt is off because the game signs in with the public publishable
// key, which is not a user JWT. The function still requires that key.

const PUBLISHABLE_KEY = "sb_publishable_hyj1JfhgsXm7VU-7RkJN8Q_VlV__ida";

const CATEGORIES: Record<string, string> = {
    idea: "An idea",
    request: "A feature request",
    frustration: "A frustration",
    story: "An epic story",
    accomplishment: "A major accomplishment",
    discovery: "A discovery",
};

const LIMITS = { message: 2000, name: 40, contact: 120 };
const HOUR_CAP = 5;
const GAP_MS = 20_000;

function json(status: number, body: Record<string, unknown>, origin: string) {
    return new Response(JSON.stringify(body), {
        status,
        headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Headers": "authorization, apikey, content-type",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Vary": "Origin",
        },
    });
}

function allowOrigin(req: Request) {
    const origin = req.headers.get("origin") || "";
    if (!origin) return "*";
    try {
        const host = new URL(origin).hostname;
        if (
            host === "luca.maggio.xyz" ||
            host === "localhost" ||
            host === "127.0.0.1" ||
            host.endsWith(".github.io")
        ) return origin;
    } catch (_e) {
        return "null";
    }
    return "null";
}

function clean(value: unknown, max: number) {
    return String(value || "").replace(/\r\n/g, "\n").replace(/\u0000/g, "").trim().slice(0, max);
}

async function sha256(text: string) {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function plain(value: string) {
    return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

Deno.serve(async (req: Request) => {
    const origin = allowOrigin(req);
    if (req.method === "OPTIONS") return json(204, {}, origin);
    if (req.method !== "POST") return json(405, { ok: false, reason: "method" }, origin);

    const presented = req.headers.get("apikey") || "";
    const allowed = [
        Deno.env.get("SUPABASE_ANON_KEY") || "",
        Deno.env.get("SHARE_PUBLISHABLE_KEY") || "",
        PUBLISHABLE_KEY,
    ].filter(Boolean);
    if (!allowed.includes(presented)) return json(401, { ok: false, reason: "unauthorized" }, origin);

    const raw = await req.text();
    if (raw.length > 8000) return json(413, { ok: false, reason: "invalid" }, origin);
    let body: Record<string, unknown>;
    try {
        body = JSON.parse(raw);
    } catch (_e) {
        return json(400, { ok: false, reason: "invalid" }, origin);
    }

    if (String(body.company || "").trim() !== "") {
        return json(200, { ok: true, delivered: true }, origin);
    }

    const category = String(body.category || "");
    const label = CATEGORIES[category];
    const message = clean(body.message, LIMITS.message + 1).trim();
    const name = clean(body.name, LIMITS.name + 1).replace(/\s+/g, " ").trim();
    const contact = clean(body.contact, LIMITS.contact + 1).replace(/\s+/g, " ").trim();
    if (!label || message.length < 1 || message.length > LIMITS.message) {
        return json(400, { ok: false, reason: "invalid" }, origin);
    }
    if (name.length > LIMITS.name || contact.length > LIMITS.contact) {
        return json(400, { ok: false, reason: "invalid" }, origin);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    if (!supabaseUrl || !serviceKey) return json(500, { ok: false, reason: "offline" }, origin);

    const ip = (req.headers.get("x-forwarded-for") || "unknown").split(",")[0].trim() || "unknown";
    const salt = Deno.env.get("SHARE_IP_SALT") || "ingoizer-share";
    const ipHash = await sha256(salt + "\n" + ip);
    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const recent = await fetch(
        `${supabaseUrl}/rest/v1/player_notes?select=created_at&ip_hash=eq.${ipHash}&created_at=gte.${encodeURIComponent(since)}&order=created_at.desc&limit=${HOUR_CAP}`,
        { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } },
    );
    if (recent.ok) {
        const rows = await recent.json();
        if (Array.isArray(rows) && rows.length >= HOUR_CAP) {
            return json(429, { ok: false, reason: "rate" }, origin);
        }
        if (Array.isArray(rows) && rows[0] && Date.now() - Date.parse(rows[0].created_at) < GAP_MS) {
            return json(429, { ok: false, reason: "rate" }, origin);
        }
    }

    const stored = await fetch(`${supabaseUrl}/rest/v1/player_notes`, {
        method: "POST",
        headers: {
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
            "Content-Type": "application/json",
            Prefer: "return=minimal",
        },
        body: JSON.stringify({
            category,
            message,
            player_name: name,
            contact,
            ip_hash: ipHash,
        }),
    });
    if (!stored.ok) return json(500, { ok: false, reason: "refused" }, origin);

    const resendKey = Deno.env.get("RESEND_API_KEY") || "";
    const to = Deno.env.get("SHARE_TO_EMAIL") || "";
    const from = Deno.env.get("SHARE_FROM_EMAIL") || "";
    if (!resendKey || !to || !from) return json(200, { ok: true, delivered: false }, origin);

    const text = [
        `Category: ${label}`,
        `Name: ${name ? plain(name) : "(not given)"}`,
        `Contact: ${contact ? plain(contact) : "(not given)"}`,
        "",
        plain(message),
    ].join("\n");

    const mailed = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${resendKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            from,
            to: [to],
            subject: `A note from Ingoizer's World (${label})`,
            text,
        }),
    });
    return json(200, { ok: true, delivered: mailed.ok }, origin);
});
