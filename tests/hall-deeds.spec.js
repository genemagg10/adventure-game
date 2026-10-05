const { test, expect } = require("@playwright/test");
const { openTitle, chooseCharacterAndBegin, openPause, dismissDialogs } = require("./helpers");

test.describe("Hall of Deeds", () => {
    test("asks for a player tag after a sibling is chosen", async ({ page }) => {
        await openTitle(page);
        await page.click("#startBtn");
        await page.click('.char-card[data-id="elara"]');
        await expect(page.locator("#charBeginBtn")).toBeEnabled();
        await page.click("#charBeginBtn");
        await expect(page.locator("#tag-screen")).toBeVisible();
        await expect(page.locator("#tag-title")).toHaveText("What shall the Hall call you?");
        expect(await page.evaluate(() => window.game.state)).toBe("title");

        await expect(page.locator("#tagBeginBtn")).toBeDisabled();
        await expect(page.locator("#tag-screen")).toBeVisible();

        await page.fill("#player-tag", "Elara's Scout");
        await page.click("#tagBeginBtn");
        await page.waitForFunction(() => window.game.state === "playing");
        await dismissDialogs(page);
        const who = await page.evaluate(() => ({
            tag: window.game.player.playerTag,
            sibling: window.game.player.siblingId,
        }));
        expect(who).toEqual({ tag: "Elara's Scout", sibling: "elara" });
    });

    test("the board is on the title screen and the pause menu, and a deed is recorded once", async ({ page }) => {
        await openTitle(page);
        await page.evaluate(() => {
            HallOfDeeds.record({
                playerTag: "Mara",
                siblingName: "Lyra",
                milestoneId: "makers-hollow",
                at: Date.parse("2026-10-06T02:00:00Z"),
            });
            HallOfDeeds.record({
                playerTag: "Mara",
                siblingName: "Lyra",
                milestoneId: "makers-hollow",
                at: Date.parse("2026-11-01T02:00:00Z"),
            });
            HallOfDeeds.record({
                playerTag: "Mara",
                siblingName: "Lyra",
                milestoneId: "not-a-deed",
            });
        });

        await page.click("#hallBtn");
        await expect(page.locator("#hall-overlay")).toBeVisible();
        await expect(page.locator("#hall-rows tr")).toHaveCount(1);
        await expect(page.locator("#hall-rows tr")).toContainText("Mara");
        await expect(page.locator("#hall-rows tr")).toContainText("Lyra");
        await expect(page.locator("#hall-rows tr")).toContainText("Found Maker's Hollow");
        await expect(page.locator("#hall-rows tr")).toContainText("2026-10-05T19:00:00-07:00");
        await page.click("#hall-close");
        await expect(page.locator("#title-screen")).toBeVisible();

        // Begin a run without wiping the hall that was just written.
        await chooseCharacterAndBegin(page);
        await page.waitForFunction(() => window.game.state === "playing");
        await dismissDialogs(page);
        await openPause(page);
        await page.click("#pause-hall");
        await expect(page.locator("#hall-overlay")).toBeVisible();
        await expect(page.locator("#pause-overlay")).toBeHidden();
        await expect(page.locator("#hall-rows tr")).toHaveCount(1);
        await page.click("#hall-close");
        await expect(page.locator("#pause-overlay")).toBeVisible();
    });

    test("Pacific timestamps and the public list stay free of the sealed fight", async ({ page }) => {
        await openTitle(page);
        const info = await page.evaluate(() => {
            const ids = Object.keys(HALL_MILESTONES);
            const labels = Object.values(HALL_MILESTONES).join("\n");
            return {
                ids,
                labels,
                winter: HallOfDeeds.formatPacific(new Date("2026-01-15T20:30:00Z")),
                summer: HallOfDeeds.formatPacific(new Date("2026-07-15T19:30:00Z")),
            };
        });
        expect(info.summer).toBe("2026-07-15T12:30:00-07:00");
        expect(info.winter).toBe("2026-01-15T12:30:00-08:00");
        expect(info.labels).not.toMatch(/Laser Gun|Luca/);
        expect(info.ids.some(id => id.startsWith("strange-key-"))).toBe(true);
        for (const id of info.ids.filter(id => id.startsWith("strange-key-"))) {
            expect(HALL_LABEL(info, id)).toBe("Found a strange key");
        }
    });
});

function HALL_LABEL(info, id) {
    const start = info.ids.indexOf(id);
    return info.labels.split("\n")[start];
}
