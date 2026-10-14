const { test, expect } = require("@playwright/test");
const { openTitle, startNewGame, openPause } = require("./helpers");

async function stubShare(page) {
    await page.evaluate(() => {
        window.__shares = [];
        window.__shareMode = "sent";
        const orig = window.fetch;
        window.fetch = async (url, opts) => {
            if (String(url).includes("/functions/v1/share-with-luca")) {
                const body = JSON.parse(opts.body);
                window.__shares.push(body);
                if (window.__shareMode === "rate") {
                    return new Response(JSON.stringify({ ok: false, reason: "rate" }), { status: 429 });
                }
                return new Response(JSON.stringify({
                    ok: true,
                    delivered: window.__shareMode === "kept" ? false : true,
                }), { status: 200 });
            }
            return orig(url, opts);
        };
    });
}

test("the title leads with one action and the rest sit in a grid", async ({ page }) => {
    await openTitle(page);
    await expect(page.locator("#startBtn")).toBeVisible();
    await expect(page.locator("#startBtn")).toHaveClass(/menu-btn-primary/);
    await expect(page.locator("#continueBtn")).toBeHidden();
    await expect(page.locator("#shareBtn")).toHaveText("Share with Luca");

    const layout = await page.evaluate(() => {
        const box = (id) => document.getElementById(id).getBoundingClientRect();
        const start = box("startBtn");
        const controls = box("controlsBtn");
        const hall = box("hallBtn");
        const share = box("shareBtn");
        return {
            startWider: start.width > controls.width + 20,
            controlsBesideHall: Math.abs(controls.top - hall.top) < 4,
            shareBelow: share.top >= hall.bottom - 1,
        };
    });
    expect(layout.startWider).toBe(true);
    expect(layout.controlsBesideHall).toBe(true);
    expect(layout.shareBelow).toBe(true);
});

test("Continue is the wide button once a game is saved", async ({ page }) => {
    await startNewGame(page);
    await page.evaluate(() => {
        const snap = SaveSystem.capture(window.game);
        SaveSystem.write(1, snap);
        window.game.restart();
    });
    await expect(page.locator("#continueBtn")).toBeVisible();
    await expect(page.locator("#continueBtn")).toHaveClass(/menu-btn-primary/);
    await expect(page.locator("#startBtn")).not.toHaveClass(/menu-btn-primary/);

    const layout = await page.evaluate(() => {
        const box = (id) => document.getElementById(id).getBoundingClientRect();
        const cont = box("continueBtn");
        const start = box("startBtn");
        const load = box("loadBtn");
        return {
            continueWider: cont.width > start.width + 20,
            startBesideLoad: Math.abs(start.top - load.top) < 4,
        };
    });
    expect(layout.continueWider).toBe(true);
    expect(layout.startBesideLoad).toBe(true);
});

test("a note can be sent from the title, and typing does not swing the sword", async ({ page }) => {
    await openTitle(page);
    await page.click("#shareBtn");
    await expect(page.locator("#share-overlay")).toBeVisible();
    await expect(page.locator("#share-name")).toHaveValue("");

    const honey = await page.evaluate(() => {
        const el = document.getElementById("share-company");
        const r = el.getBoundingClientRect();
        return r.right < 0;
    });
    expect(honey).toBe(true);

    await page.focus("#share-send");
    await page.keyboard.press("Space");
    await page.click("#share-send");
    await expect(page.locator("#share-status")).toHaveText("Pick what kind of note this is.");
    expect(await page.evaluate(() => window.game.keys.attack)).toBeFalsy();

    await page.check("input[name='share-category'][value='story']");
    await page.focus("#share-message");
    await page.keyboard.type("The lake froze");
    await page.keyboard.press("Space");
    await page.keyboard.press("KeyR");
    await page.keyboard.press("KeyE");
    const typed = await page.evaluate(() => ({
        attack: window.game.keys.attack,
        shoot: window.game.keys.shoot,
        interact: window.game.keys.interact,
        text: document.getElementById("share-message").value,
    }));
    expect(typed.attack).toBeFalsy();
    expect(typed.shoot).toBeFalsy();
    expect(typed.interact).toBeFalsy();
    expect(typed.text).toBe("The lake froze re");

    await stubShare(page);
    await page.fill("#share-name", "Mara");
    await page.fill("#share-contact", "mara@example.com");
    await page.click("#share-send");
    await expect(page.locator("#share-thanks-text")).toHaveText("Thank you. Your note is on its way.");

    const sent = await page.evaluate(() => window.__shares[0]);
    expect(sent.category).toBe("story");
    expect(sent.message).toBe("The lake froze re");
    expect(sent.name).toBe("Mara");
    expect(sent.contact).toBe("mara@example.com");
    expect(sent.company).toBe("");
    expect(JSON.stringify(sent)).not.toContain("luca@");
});

test("pause prefills the Hall tag, and a kept note still says thank you", async ({ page }) => {
    await startNewGame(page);
    await openPause(page);
    await page.click("#pause-share");
    await expect(page.locator("#share-overlay")).toBeVisible();
    await expect(page.locator("#pause-overlay")).toBeHidden();
    await expect(page.locator("#share-name")).toHaveValue("Wayfarer");

    await page.check("input[name='share-category'][value='discovery']");
    await page.fill("#share-message", "A ladder in the corner");
    await stubShare(page);
    await page.evaluate(() => { window.__shareMode = "kept"; });
    await page.click("#share-send");
    await expect(page.locator("#share-thanks-text")).toHaveText("Thank you. Your note is kept.");

    await page.click("#share-done");
    await expect(page.locator("#share-overlay")).toBeHidden();
    await expect(page.locator("#pause-overlay")).toBeVisible();
});

test("too many notes ask the player to wait", async ({ page }) => {
    await openTitle(page);
    await page.click("#shareBtn");
    await page.check("input[name='share-category'][value='idea']");
    await page.fill("#share-message", "More apples");
    await stubShare(page);
    await page.evaluate(() => { window.__shareMode = "rate"; });
    await page.click("#share-send");
    await expect(page.locator("#share-status")).toHaveText("That's enough for now. Try again in a little while.");
    await expect(page.locator("#share-thanks")).toBeHidden();
});
