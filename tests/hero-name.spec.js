const { test, expect } = require("@playwright/test");
const { openTitle, chooseCharacterAndBegin, dismissDialogs } = require("./helpers");

// The knights address the hero by the chosen character's name. Every hero is
// an Ingoizer, so the address is "<Given name> Ingoizer" - keeping the dynasty
// lore while naming the sibling the player picked.

// Collect the text of the active dialog plus everything queued behind it.
function dialogTexts(page) {
    return page.evaluate(() => {
        const cur = document.getElementById("dialog-text").textContent;
        const queued = window.game.ui.dialogQueue.map((d) => d.text);
        return [cur, ...queued];
    });
}

test.describe.serial("the knights name the chosen hero", () => {
    let page;

    test.beforeAll(async ({ browser }) => {
        page = await browser.newPage();
        await openTitle(page);
        await chooseCharacterAndBegin(page, "elara");
        await page.waitForFunction(() => window.game.state === "playing");
        await dismissDialogs(page);
    });

    test.afterAll(async () => {
        await page.close();
    });

    test("heroAddress uses the chosen name and the family name", async () => {
        expect(await page.evaluate(() => window.game.heroAddress())).toBe("Elara Ingoizer");
    });

    test("the Black Knight greets the hero by name", async () => {
        await page.evaluate(() => {
            const g = window.game;
            g.ui.dialogQueue = [];
            g.ui.dialogActive = false;
            g.player.blueGems = 5;
            g.bossSpawned = false;
            g.bossDefeated = false;
            g.player.x = g.world.bossSpawnPoint.x;
            g.player.y = g.world.bossSpawnPoint.y;
            g.checkBossTrigger();
        });
        const texts = await dialogTexts(page);
        expect(texts.some((t) => t.includes("Black Knight"))).toBe(true);
        expect(texts.some((t) => t.includes("Elara Ingoizer"))).toBe(true);
    });

    test("the Green Knight greets the hero by name", async () => {
        const hasSpawn = await page.evaluate(() => !!window.game.world.greenBossSpawnPoint);
        test.skip(!hasSpawn, "no Green Knight spawn point in this world");
        await page.evaluate(() => {
            const g = window.game;
            g.ui.dialogQueue = [];
            g.ui.dialogActive = false;
            g.greenlandsUnlocked = true;
            g.greenKnightSpawned = false;
            g.greenKnightDefeated = false;
            g.player.x = g.world.greenBossSpawnPoint.x;
            g.player.y = g.world.greenBossSpawnPoint.y;
            g.checkGreenKnightTrigger();
        });
        const texts = await dialogTexts(page);
        expect(texts.some((t) => t.includes("Green Knight"))).toBe(true);
        expect(texts.some((t) => t.includes("Elara Ingoizer"))).toBe(true);
    });
});
