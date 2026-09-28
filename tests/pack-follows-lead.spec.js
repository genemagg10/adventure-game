const { test, expect } = require("@playwright/test");
const { startNewGame } = require("./helpers");

// The pack used to pick its own fights: any monster that wandered near
// Ingoizer got bitten, whether he wanted a fight or not. Now the animals stay
// at heel until he attacks something, and then they go for that - and only
// that - until it falls.

test.describe("the pack follows Ingoizer's lead", () => {
    test.beforeEach(async ({ page }) => {
        await startNewGame(page);
    });

    /**
     * A fox at the player's side and two monsters in easy reach. Every tick is
     * driven inside one evaluate, so the live loop cannot move anything between
     * them.
     */
    async function run(page, script) {
        return page.evaluate(script);
    }

    const stage = `
        const g = window.game;
        g.monsters.length = 0;
        g.companions.length = 0;
        g.packQuarry = null;
        g.player.invincible = true;

        const fox = new Animal("fox", g.player.x + 20, g.player.y);
        fox.tame(0);
        g.companions.push(fox);

        const near = new Monster("troll", g.player.x + 40, g.player.y);
        const far = new Monster("troll", g.player.x - 90, g.player.y);
        for (const m of [near, far]) { m.hp = m.maxHp = 9999; g.monsters.push(m); }

        const tick = n => {
            for (let i = 0; i < n; i++) {
                fox.lastAttackTime = 0;
                fox.lastHurtTime = Date.now();   // keep the fox out of contact damage
                g.updateAnimals(16, g.world, g.monsters, null, null);
            }
        };
    `;

    test("left alone, the pack does not start a fight", async ({ page }) => {
        const result = await run(page, new Function(`${stage}
            tick(120);
            return { near: near.maxHp - near.hp, far: far.maxHp - far.hp, target: fox.target };
        `));

        expect(result.near, "the troll at his elbow is left alone").toBe(0);
        expect(result.far, "and so is the other").toBe(0);
        expect(result.target, "the fox has nothing to hunt").toBeNull();
    });

    test("the pack goes for what Ingoizer hit, not what is nearest", async ({ page }) => {
        const result = await run(page, new Function(`${stage}
            g.setPackQuarry([{ target: far, damage: 1, killed: false }]);
            tick(200);
            return { near: near.maxHp - near.hp, far: far.maxHp - far.hp, onFar: fox.target === far };
        `));

        expect(result.onFar, "the fox is hunting the troll he struck").toBe(true);
        expect(result.far, "and has bitten it").toBeGreaterThan(0);
        expect(result.near, "the nearer troll he left alone is still untouched").toBe(0);
    });

    test("once the quarry falls, the pack stands down", async ({ page }) => {
        const result = await run(page, new Function(`${stage}
            g.setPackQuarry([{ target: near, damage: 1, killed: false }]);
            tick(5);
            near.alive = false;
            tick(5);
            return { quarry: g.packQuarry, target: fox.target, far: far.maxHp - far.hp };
        `));

        expect(result.quarry, "a dead quarry is forgotten").toBeNull();
        expect(result.target, "the fox goes back to heel").toBeNull();
        expect(result.far, "rather than picking on the other troll").toBe(0);
    });

    test("a blow that kills leaves the old quarry standing", async ({ page }) => {
        const result = await run(page, new Function(`${stage}
            g.setPackQuarry([{ target: far, damage: 1, killed: false }]);
            g.setPackQuarry([{ target: near, damage: 1, killed: true }]);
            return g.packQuarry === far;
        `));

        expect(result, "nothing left to chase from that blow, so the fox keeps its mark").toBe(true);
    });
});
