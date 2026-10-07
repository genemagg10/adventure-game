const { test, expect } = require("@playwright/test");
const { startNewGame } = require("./helpers");

test("a gravestone marks the spot and stays in the save", async ({ page }) => {
    await startNewGame(page);
    const result = await page.evaluate(() => {
        const g = window.game;
        const clearTalk = () => {
            g.ui.dialogQueue = [];
            g.ui.dialogActive = false;
            document.getElementById("dialog-box").classList.add("hidden");
        };
        const spot = { x: g.player.x, y: g.player.y };
        const tx = Math.floor(spot.x / TILE_SIZE);
        const ty = Math.floor(spot.y / TILE_SIZE);
        const solidBefore = g.world.isSolid(tx, ty);
        g.player.hp = 0;
        g.update(16);
        const stone = g.gravestones[0];
        const solidAfter = g.world.isSolid(tx, ty);
        const awake = { x: g.player.x, y: g.player.y, hp: g.player.hp, surface: g.onSurface };

        g.saveToSlot(1);
        const saved = SaveSystem.read(1).game.gravestones;
        g.loadFromSlot(1);
        const loaded = g.gravestones.map((s) => ({ realm: s.realm, x: s.x, y: s.y }));

        const entrance = CAVE_ENTRANCES[2];
        g.enterCave(entrance);
        g.player.x = 220;
        g.player.y = 180;
        clearTalk();
        g.player.hp = 0;
        g.update(16);
        const caveStone = g.gravestones.find((s) => s.realm === "cave");
        g.enterCave(entrance);
        const inThatCave = g.gravestonesHere().some((s) => s.realm === "cave" && s.caveId === entrance.id);
        g.exitCave(entrance);
        const hiddenOnSurface = g.gravestonesHere().every((s) => s.realm === "surface");

        g.inSky = true;
        g.player.x = 90;
        g.player.y = 70;
        clearTalk();
        g.player.hp = 0;
        g.update(16);
        g.inSeal = true;
        g.player.x = 40;
        g.player.y = 40;
        clearTalk();
        g.player.hp = 0;
        g.update(16);
        const realms = g.gravestones.map((s) => s.realm);

        for (let i = 0; i < 25; i++) {
            g.player.x = 120 + i;
            g.player.y = 140;
            clearTalk();
            g.player.hp = 0;
            g.update(16);
        }

        return {
            solidBefore,
            solidAfter,
            stone,
            awake,
            saved,
            loaded,
            caveStone,
            inThatCave,
            hiddenOnSurface,
            realms,
            capped: g.gravestones.length,
            newest: g.gravestones[g.gravestones.length - 1],
        };
    });

    expect(result.solidBefore).toBe(false);
    expect(result.solidAfter).toBe(false);
    expect(result.stone).toMatchObject({ realm: "surface", x: result.awake.x, y: result.awake.y });
    expect(result.awake.hp).toBeGreaterThan(0);
    expect(result.awake.surface).toBe(true);
    expect(result.saved).toEqual([result.stone]);
    expect(result.loaded).toEqual([{ realm: "surface", x: result.stone.x, y: result.stone.y }]);
    expect(result.caveStone).toMatchObject({ realm: "cave", caveId: 2 });
    expect(result.inThatCave).toBe(true);
    expect(result.hiddenOnSurface).toBe(true);
    expect(result.realms).toEqual(expect.arrayContaining(["surface", "cave", "sky", "seal"]));
    expect(result.capped).toBe(20);
    expect(result.newest).toMatchObject({ realm: "surface", x: 144, y: 140 });
});
