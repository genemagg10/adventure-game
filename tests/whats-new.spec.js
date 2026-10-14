const { test, expect } = require("@playwright/test");
const { openTitle, startNewGame, openPause } = require("./helpers");

test("What's New sits beside Share and reads the chronicle", async ({ page }) => {
    await openTitle(page);
    await expect(page.locator("#newsBtn")).toHaveText("What's New");

    const layout = await page.evaluate(() => {
        const box = (id) => document.getElementById(id).getBoundingClientRect();
        const share = box("shareBtn");
        const news = box("newsBtn");
        const hall = box("hallBtn");
        return {
            beside: Math.abs(share.top - news.top) < 4,
            belowHall: news.top >= hall.bottom - 1,
        };
    });
    expect(layout.beside).toBe(true);
    expect(layout.belowHall).toBe(true);

    await page.click("#newsBtn");
    await expect(page.locator("#news-overlay")).toBeVisible();
    await expect(page.locator("#title-screen")).toBeHidden();
    await expect(page.locator(".news-version").first()).toContainText("What's New");
    await expect(page.locator(".news-version-mark").first()).toHaveText("v0.13");
    const record = page.locator(".news-link").first();
    await expect(record).toHaveText("Record 80");
    await expect(record).toHaveAttribute("target", "_blank");
    await expect(record).toHaveAttribute("href", /\/pull\/80$/);
    await expect(page.locator(".news-text").first()).toContainText("reads this chronicle");

    await page.focus("#news-scroll");
    await page.keyboard.press("Space");
    await page.keyboard.press("KeyR");
    const keys = await page.evaluate(() => ({
        attack: window.game.keys.attack,
        shoot: window.game.keys.shoot,
    }));
    expect(keys.attack).toBeFalsy();
    expect(keys.shoot).toBeFalsy();

    await page.click("#news-close");
    await expect(page.locator("#news-overlay")).toBeHidden();
    await expect(page.locator("#title-screen")).toBeVisible();
});

test("the chronicle refuses raw HTML and hostile links", async ({ page }) => {
    await openTitle(page);
    const rendered = await page.evaluate(() => {
        const root = document.createElement("div");
        Chronicle.render(root, [
            "## v0.1 — Trial",
            "- **October 13, 2026** — [#1](https://example.com/pull/1) — A <script>alert(1)</script> note **kept**.",
            "- **October 13, 2026** — [direct commit](javascript:alert(1)) — Should not run.",
            "See [docs](javascript:alert(2)) and [site](https://luca.maggio.xyz/).",
        ].join("\n"));
        const links = [...root.querySelectorAll("a")].map((a) => ({
            href: a.getAttribute("href"),
            target: a.target,
            rel: a.rel,
        }));
        return {
            html: root.innerHTML,
            text: root.textContent,
            links,
        };
    });
    expect(rendered.html.toLowerCase()).not.toContain("<script");
    expect(rendered.text).toContain("A <script>alert(1)</script> note");
    expect(rendered.text).toContain("kept");
    expect(rendered.links.some((link) => String(link.href).startsWith("javascript:"))).toBe(false);
    expect(rendered.links.every((link) => link.target === "_blank")).toBe(true);
    expect(rendered.links.every((link) => link.rel.includes("noopener"))).toBe(true);
});

test("What's New from the pause menu returns to it", async ({ page }) => {
    await startNewGame(page);
    await openPause(page);
    await page.click("#pause-news");
    await expect(page.locator("#news-overlay")).toBeVisible();
    await expect(page.locator("#pause-overlay")).toBeHidden();
    await page.keyboard.press("Escape");
    await expect(page.locator("#news-overlay")).toBeHidden();
    await expect(page.locator("#pause-overlay")).toBeVisible();
});
