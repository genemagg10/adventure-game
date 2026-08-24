const { test, expect } = require("@playwright/test");
const { startNewGame } = require("./helpers");

// Companions used to be safe from everything except their own bravery: a
// monster only ever hunted Ingoizer, and the only way an animal could get hurt
// was by walking into one itself. Monsters now hunt the pack as well, so these
// cover who a monster picks, that it can actually land a blow on an animal, and
// that an animal in a scrum is only billed once for standing in one place.

test.describe("monsters hunt the pack", () => {
    test.beforeEach(async ({ page }) => {
        await startNewGame(page);
    });

    /** Put a companion and a lone monster on clear ground near the player. */
    async function stage(page, { companionAt, monsterAt, type = "troll" }) {
        return page.evaluate(({ companionAt, monsterAt, type }) => {
            const g = window.game;
            g.monsters.length = 0;
            g.companions.length = 0;
            g.player.invincible = true;

            const fox = new Animal("fox", g.player.x + companionAt.x, g.player.y + companionAt.y);
            fox.tame(0);
            g.companions.push(fox);

            const monster = new Monster(type, g.player.x + monsterAt.x, g.player.y + monsterAt.y);
            g.monsters.push(monster);
            return { companionHp: fox.hp };
        }, { companionAt, monsterAt, type });
    }

    test("a monster goes for the animal standing between it and Ingoizer", async ({ page }) => {
        await stage(page, { companionAt: { x: 120, y: 0 }, monsterAt: { x: 150, y: 0 } });

        const mark = await page.evaluate(() => {
            const g = window.game;
            const target = g.monsters[0].chooseTarget(16, g.player, g.companions);
            return target === g.companions[0] ? "companion" : "player";
        });

        expect(mark, "the nearer animal is the better mark").toBe("companion");
    });

    test("Ingoizer is still the mark when he is the one in reach", async ({ page }) => {
        await stage(page, { companionAt: { x: 100, y: 0 }, monsterAt: { x: 20, y: 0 } });

        const mark = await page.evaluate(() => {
            const g = window.game;
            const target = g.monsters[0].chooseTarget(16, g.player, g.companions);
            return target === g.companions[0] ? "companion" : "player";
        });

        expect(mark, "a monster at his elbow does not walk past him").toBe("player");
    });

    test("an animal that bites holds the monster's attention", async ({ page }) => {
        await stage(page, { companionAt: { x: 100, y: 0 }, monsterAt: { x: 20, y: 0 } });

        const mark = await page.evaluate(() => {
            const g = window.game;
            const monster = g.monsters[0];
            // The bite a companion lands, source and all.
            monster.takeDamage(4, g.companions[0].x, g.companions[0].y, g.companions[0]);
            const target = monster.chooseTarget(16, g.player, g.companions);
            return target === g.companions[0] ? "companion" : "player";
        });

        expect(mark, "whatever just bit it is worth turning round for").toBe("companion");
    });

    test("a hunted animal actually loses health", async ({ page }) => {
        await stage(page, { companionAt: { x: 120, y: 0 }, monsterAt: { x: 132, y: 0 } });

        // Driven a tick at a time rather than watched, so what the blow costs is
        // read off one swing and not off however many the live loop got in.
        const swing = await page.evaluate(() => {
            const g = window.game;
            const fox = g.companions[0];
            const monster = g.monsters[0];
            fox.hp = fox.maxHp;
            fox.lastHurtTime = 0;
            monster.lastAttackTime = 0;
            monster.x = fox.x + 12;
            monster.y = fox.y;
            const result = monster.update(16, g.player, g.world, g.companions);
            return { type: result && result.type, lost: fox.maxHp - fox.hp };
        });

        expect(swing.type, "the tick reports a blow struck on the pack").toBe("companionHit");
        expect(swing.lost, "the troll's swing landed on the fox").toBeGreaterThan(0);
    });

    test("an animal in a scrum is not hit twice in the same breath", async ({ page }) => {
        const landed = await page.evaluate(() => {
            const g = window.game;
            const fox = new Animal("fox", g.player.x + 40, g.player.y);
            fox.tame(0);
            return [
                fox.hurtBy(5, fox.x + 10, fox.y),
                fox.hurtBy(5, fox.x + 10, fox.y),
            ];
        });

        expect(landed, "the second blow is inside the guard the contact damage uses").toEqual([true, false]);
    });
});
