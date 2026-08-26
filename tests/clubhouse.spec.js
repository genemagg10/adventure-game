const { test, expect } = require("@playwright/test");
const { startNewGame, dismissDialogs, saveToSlot, waitForRunningGame } = require("./helpers");

// The Green Knight is beaten and his castle is standing empty. Walk back to it
// with a full pack of five animals and the animals take it off your hands: the
// green comes off the walls, the floor lights up, the music starts, and every
// animal for miles lets itself in. Nothing hostile ever does - the whole
// building is warded - and the first time Ingoizer walks through the door it is
// worth thirty hit points, once, for good.

// The numbers the design asks for, written out rather than read back off the
// game, so this file says what the feature is supposed to do.
const FULL_PACK = 5;
const HP_BONUS = 30;
const GUESTS = 9;

/** Beat the Green Knight and put a pack of `count` animals at Ingoizer's heel. */
async function packOf(page, count) {
    await page.evaluate((n) => {
        const g = window.game;
        g.greenlandsUnlocked = true;
        g.world.unlockGreenlands();
        g.greenKnightDefeated = true;
        g.companions.length = 0;
        const types = Object.keys(ANIMAL_TYPES);
        for (let i = 0; i < n; i++) {
            const animal = new Animal(types[i % types.length], g.player.x, g.player.y);
            animal.tame(i);
            g.companions.push(animal);
        }
    }, count);
    await dismissDialogs(page);
}

/** Walk up to the Green Knight's gate and let the game decide what happens. */
async function approachTheGate(page) {
    await page.evaluate(() => {
        const g = window.game;
        const gate = g.world.greenKnightCastle;
        g.player.x = gate.x;
        g.player.y = gate.y + 40;
        g.updateClubhouse(16);
    });
    await dismissDialogs(page);
}

/** Stand in the middle of the dance floor. */
async function stepInside(page) {
    await page.evaluate(() => {
        const g = window.game;
        const club = g.world.clubhouse;
        g.player.x = club.x;
        g.player.y = club.y;
        g.updateClubhouse(16);
        g.syncClubMusic();
    });
    await dismissDialogs(page);
}

/** Walk back out onto the road below the door. */
async function stepOutside(page) {
    await page.evaluate(() => {
        const g = window.game;
        g.player.x = g.world.greenKnightCastle.x;
        g.player.y = g.world.greenKnightCastle.y + 140;
        g.updateClubhouse(16);
        g.syncClubMusic();
    });
    await dismissDialogs(page);
}

test.describe("the Clubhouse", () => {
    test.beforeEach(async ({ page }) => {
        await startNewGame(page);
    });

    test("a short pack walks past an empty castle", async ({ page }) => {
        await packOf(page, FULL_PACK - 1);
        await approachTheGate(page);

        const state = await page.evaluate(() => ({
            unlocked: window.game.clubhouseUnlocked,
            club: !!window.game.world.clubhouse,
        }));
        expect(state.unlocked, "four animals is not a full pack").toBe(false);
        expect(state.club, "so the castle is still a castle").toBe(false);
    });

    test("a live Green Knight keeps his own castle", async ({ page }) => {
        await packOf(page, FULL_PACK);
        await page.evaluate(() => { window.game.greenKnightDefeated = false; });
        await approachTheGate(page);

        expect(await page.evaluate(() => window.game.clubhouseUnlocked),
            "the party waits until he is beaten").toBe(false);
    });

    test("a full pack turns the castle into the Clubhouse", async ({ page }) => {
        await packOf(page, FULL_PACK);
        await approachTheGate(page);

        const club = await page.evaluate(() => {
            const w = window.game.world;
            const c = w.clubhouse;
            return {
                unlocked: window.game.clubhouseUnlocked,
                floor: w.tiles[c.ty + 3][c.tx + 3] === TILE.CLUB_FLOOR,
                wall: w.tiles[GREEN_CASTLE_POS.y][GREEN_CASTLE_POS.x] === TILE.CLUB_WALL,
                doorway: w.tiles[c.doorTY][c.doorTX + 2] === TILE.CLUB_FLOOR,
                label: w.mapLandmarks().find(m => m.x === w.greenKnightCastle.x).label,
                // The walls still stop you; the ward is what stops monsters.
                wallSolid: w.isSolid(GREEN_CASTLE_POS.x, GREEN_CASTLE_POS.y),
                floorSolid: w.isSolid(c.tx + 3, c.ty + 3),
            };
        });

        expect(club.unlocked, "the pack walked it in").toBe(true);
        expect(club.floor, "the flagstones came up as a dance floor").toBe(true);
        expect(club.wall, "and the green came off the walls").toBe(true);
        expect(club.doorway, "the door was knocked wide enough for the pack").toBe(true);
        expect(club.label, "the map calls it by its new name").toBe("The Clubhouse");
        expect(club.wallSolid, "the walls are still walls").toBe(true);
        expect(club.floorSolid, "the floor is walkable").toBe(false);
    });

    test("nothing hostile gets through the door", async ({ page }) => {
        await packOf(page, FULL_PACK);
        await approachTheGate(page);

        const siege = await page.evaluate(() => {
            const g = window.game;
            const c = g.world.clubhouse;
            g.monsters.length = 0;
            g.companions.length = 0;

            // Ingoizer on the dance floor, a wolf on the road outside the door.
            g.player.x = c.x;
            g.player.y = c.y;
            const road = tileToWorld(c.doorTX, c.doorTY + 3);
            const wolf = new Monster("wolf", road.x, road.y);
            g.monsters.push(wolf);

            let trespassed = false;
            for (let i = 0; i < 500; i++) {
                wolf.update(16, g.player, g.world, []);
                if (g.world.inClubhouse(wolf.x, wolf.y)) trespassed = true;
            }
            return { trespassed, hunting: wolf.target === g.player };
        });

        expect(siege.hunting, "it wants him").toBe(true);
        expect(siege.trespassed, "and it never gets in").toBe(false);
    });

    test("the first time inside is worth thirty hit points, once", async ({ page }) => {
        await packOf(page, FULL_PACK);
        await approachTheGate(page);

        const before = await page.evaluate(() => window.game.player.maxHp);
        await stepInside(page);
        const welcomed = await page.evaluate(() => ({
            maxHp: window.game.player.maxHp,
            inside: window.game.insideClubhouse,
            taken: window.game.clubhouseBoonTaken,
        }));

        expect(welcomed.inside, "he is in the room").toBe(true);
        expect(welcomed.maxHp - before, "and the room makes him at home").toBe(HP_BONUS);
        expect(welcomed.taken, "which is written down").toBe(true);

        // Out and back in again, twice, and the housewarming is not repeated.
        await stepOutside(page);
        await stepInside(page);
        await stepOutside(page);
        await stepInside(page);
        expect(await page.evaluate(() => window.game.player.maxHp),
            "the gift is a one-off").toBe(welcomed.maxHp);
    });

    test("the pack dances inside and goes back to work outside", async ({ page }) => {
        await packOf(page, FULL_PACK);
        await approachTheGate(page);
        await stepInside(page);

        expect(await page.evaluate(() => window.game.companions.every(c => c.dancing)),
            "everyone dances").toBe(true);

        await stepOutside(page);
        expect(await page.evaluate(() => window.game.companions.some(c => c.dancing)),
            "and nobody dances on the road").toBe(false);
    });

    test("every animal for miles lets itself in", async ({ page }) => {
        await packOf(page, FULL_PACK);
        await approachTheGate(page);
        await stepInside(page);

        const party = await page.evaluate(() => {
            const g = window.game;
            // Let them arrive, and give them long enough to reach the floor.
            for (let i = 0; i < 60; i++) g.updateClubGuests(500);
            const guests = g.wildAnimals.filter(a => a.partyGuest);
            for (let i = 0; i < 900; i++) {
                for (const a of guests) a.update(16, g.player, g.world, [], g.combat);
            }
            return {
                count: guests.length,
                dancing: guests.every(a => a.dancing),
                onTheFloor: guests.filter(a => g.world.inClubhouse(a.x, a.y)).length,
                // Guests are nobody's problem: they do not count against the
                // wild-animal caps kept per biome.
                zones: [...new Set(guests.map(a => a.homeZone))],
            };
        });

        expect(party.count, "the room fills up").toBe(GUESTS);
        expect(party.dancing, "and every one of them is dancing").toBe(true);
        expect(party.onTheFloor, "on the floor, not out on the road").toBe(GUESTS);
        expect(party.zones, "and they belong to the party, not to a biome").toEqual(["clubhouse"]);
    });

    test("the music plays in the room and nowhere else", async ({ page }) => {
        await packOf(page, FULL_PACK);
        await approachTheGate(page);

        expect(await page.evaluate(() => window.game.clubMusicOn),
            "nothing is playing out on the road").toBe(false);

        await stepInside(page);
        expect(await page.evaluate(() => window.game.clubMusicOn),
            "the party starts when he walks in").toBe(true);

        // Pausing puts the needle back on the shelf, and resuming drops it again.
        await page.evaluate(() => { window.game.paused = true; window.game.syncClubMusic(); });
        expect(await page.evaluate(() => window.game.clubMusicOn), "paused is quiet").toBe(false);
        await page.evaluate(() => { window.game.paused = false; window.game.syncClubMusic(); });
        expect(await page.evaluate(() => window.game.clubMusicOn), "and back on again").toBe(true);

        await stepOutside(page);
        expect(await page.evaluate(() => window.game.clubMusicOn),
            "and it stops at the door").toBe(false);
    });

    test("a save remembers the Clubhouse and the thirty hit points", async ({ page }) => {
        await packOf(page, FULL_PACK);
        await approachTheGate(page);
        await stepInside(page);
        await stepOutside(page);

        const before = await page.evaluate(() => window.game.player.maxHp);
        await saveToSlot(page, 1);
        await page.reload();
        await page.waitForFunction(() => window.game);
        await page.click("#loadBtn");
        await page.waitForSelector("#slots-overlay:not(.hidden)");
        await page.click("#slots-list .save-slot:nth-child(1) .save-slot-choose");
        await waitForRunningGame(page);

        const loaded = await page.evaluate(() => {
            const g = window.game;
            const c = g.world.clubhouse;
            return {
                unlocked: g.clubhouseUnlocked,
                boon: g.clubhouseBoonTaken,
                maxHp: g.player.maxHp,
                club: !!c,
                floor: !!c && g.world.tiles[c.ty + 3][c.tx + 3] === TILE.CLUB_FLOOR,
                warded: c ? g.world.isWarded(c.tx + 3, c.ty + 3) : false,
            };
        });

        expect(loaded.club, "the building came back").toBe(true);
        expect(loaded.floor, "with its floor still lit").toBe(true);
        expect(loaded.warded, "and still warded").toBe(true);
        expect(loaded.unlocked, "the party is remembered").toBe(true);
        expect(loaded.boon, "and so is the welcome").toBe(true);
        expect(loaded.maxHp, "which is not handed out twice").toBe(before);

        // Walking back in on a loaded game does not top it up again.
        await stepInside(page);
        expect(await page.evaluate(() => window.game.player.maxHp),
            "still the same").toBe(before);
    });
});
