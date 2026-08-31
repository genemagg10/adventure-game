// Shared setup for the saved-game tests.
//
// These drive the real game in a real browser rather than importing pieces of
// it: the game is loaded as plain <script> tags with no module boundary, and
// what is worth testing about saving is the round trip through localStorage
// and back into a running world.

/** Row selector for a slot in the save/load panel. Slots are 1-based. */
const slotRow = n => `#slots-list .save-slot:nth-child(${n})`;

/** The button that picks a slot. */
const slotChoose = n => `${slotRow(n)} .save-slot-choose`;

/** The red button in an armed confirm row - Overwrite, or Delete. */
const slotConfirm = n => `${slotRow(n)} .save-slot-btn-danger`;

/** The Cancel button in an armed confirm row. */
const slotCancel = n => `${slotRow(n)} .save-slot-btn:not(.save-slot-btn-danger)`;

/** The standing Delete button on an occupied slot. */
const slotDelete = n => `${slotRow(n)} .save-slot-btn`;

/**
 * Load the page with no saved games, so a test never inherits another's slots.
 */
async function openTitle(page) {
    await page.goto("/index.html");
    await page.waitForFunction(() => window.game);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForFunction(() => window.game);
}

/**
 * Start a new game and clear the intro dialogs, which otherwise swallow input.
 */
async function startNewGame(page) {
    await openTitle(page);
    await chooseCharacterAndBegin(page);
    await page.waitForFunction(() => window.game.state === "playing");
    await dismissDialogs(page);
}

/**
 * From the title screen, open character selection, pick a sibling, and begin.
 * Defaults to the first sibling; pass an id to pick a specific one.
 */
async function chooseCharacterAndBegin(page, siblingId) {
    await page.click("#startBtn");
    await page.waitForSelector("#character-screen:not(.hidden)");
    const card = siblingId ? `.char-card[data-id="${siblingId}"]` : ".char-card";
    await page.click(card);
    await page.click("#charBeginBtn");
}

async function dismissDialogs(page) {
    await page.evaluate(() => {
        window.game.ui.dialogQueue = [];
        window.game.ui.dialogActive = false;
        document.getElementById("dialog-box").classList.add("hidden");
    });
}

/**
 * Walk the player around for a moment so the fog of war charts real ground -
 * a save that claims to remember the map should be remembering something.
 */
async function walkAround(page, steps = 120) {
    await page.evaluate(async (n) => {
        const g = window.game;
        for (let i = 0; i < n; i++) {
            g.keys.right = true;
            g.keys.down = i % 2 === 0;
            await new Promise(r => setTimeout(r, 8));
        }
        g.keys.right = false;
        g.keys.down = false;
    }, steps);
}

/**
 * Give the run a handful of recognisable values so a save can be told apart
 * from a fresh game, and from another save.
 */
async function seedRun(page, { gold = 480, blueGems = 2, playtimeMinutes = 47 } = {}) {
    await page.evaluate(({ gold, blueGems, playtimeMinutes }) => {
        window.game.player.gold = gold;
        window.game.player.blueGems = blueGems;
        window.game.engagedPlayTime = playtimeMinutes * 60 * 1000;
    }, { gold, blueGems, playtimeMinutes });
}

/** Open the pause menu from play. */
async function openPause(page) {
    await page.keyboard.press("Escape");
    await page.waitForSelector("#pause-overlay:not(.hidden)");
}

/**
 * Save the current game into a slot through the menus a player would use.
 * Occupied slots ask before overwriting, so this answers that too.
 */
async function saveToSlot(page, slot) {
    await openPause(page);
    await page.click("#pause-save");
    await page.waitForSelector("#slots-overlay:not(.hidden)");
    await page.click(slotChoose(slot));
    if (await page.isVisible(`${slotRow(slot)}.save-slot-confirm`)) {
        await page.click(slotConfirm(slot));
    }
    await page.waitForFunction(s => SaveSystem.hasSave(s), slot);
    await page.click("#slots-close");
    await page.waitForSelector("#pause-overlay:not(.hidden)");
    await page.click("#pause-resume");
    await page.waitForSelector("#pause-overlay", { state: "hidden" });
}

/** Wait until a load has actually put a game back on its feet. */
async function waitForRunningGame(page) {
    await page.waitForFunction(() => window.game.state === "playing" && window.game.running);
    // One frame, so the restored state has been through render at least once.
    await page.evaluate(() => new Promise(r => requestAnimationFrame(() => r())));
}

/**
 * Everything a save is expected to carry, read straight off the live game.
 * Taken before saving and after loading; the two should match.
 */
function readState(page) {
    return page.evaluate(() => {
        const g = window.game;
        const p = g.player;
        return {
            gemSeed: g.world.gemSeed,
            // Player progress
            gold: p.gold, blueGems: p.blueGems, arrows: p.arrows, hp: p.hp, maxHp: p.maxHp,
            potions: p.healthPotions, greaterPotions: p.greaterHealthPotions, apples: p.apples,
            weapons: p.weapons.slice(), currentWeapon: p.currentWeapon,
            bows: p.bows.slice(), currentBow: p.currentBow,
            armors: p.armors.slice(), currentArmor: p.currentArmor,
            elements: { ...p.elements }, activeElement: p.activeElement,
            enchantments: { ...p.enchantments },
            hasSheath: p.hasSheath, hasMerlinWand: p.hasMerlinWand, hasMallet: p.hasMallet,
            hasRainbowGem: p.hasRainbowGem, hasZeusBolts: p.hasZeusBolts,
            hasWorldtreeSeed: p.hasWorldtreeSeed,
            purpleGemAttack: p.purpleGemAttack, greenGemAttack: p.greenGemAttack,
            monstersKilled: p.monstersKilled,
            // Quest and realm progress
            ladyQuestState: g.ladyQuestState, merlinQuestState: g.merlinQuestState,
            greenlandsUnlocked: g.greenlandsUnlocked, tapestryRead: g.tapestryRead,
            bossDefeated: g.bossDefeated, greenKnightDefeated: g.greenKnightDefeated,
            olympianSummoned: g.olympianSummoned, olympianDefeated: g.olympianDefeated,
            skyMonsterKills: g.skyMonsterKills, monsterGemDrops: g.monsterGemDrops,
            loreUnlocks: { ...g.loreUnlocks },
            caveTreasureCollected: { ...g.caveTreasureCollected },
            caveBossDefeated: { ...g.caveBossDefeated },
            // The pack
            companions: g.companions.map(c => ({ type: c.type, hp: c.hp, maxHp: c.maxHp })),
            // The world
            charted: g.world.fog.charted,
            gemPositions: g.world.gems.map(gem => [gem.x, gem.y]),
            gemsCollected: g.world.gems.map(gem => gem.collected),
            coinsCollected: g.world.coins.map(c => c.collected),
            applesCollected: g.world.apples.map(a => a.collected),
            excaliburGiven: g.world.ladyOfLake.excaliburGiven,
            wandCollected: g.world.merlinHut.wandCollected,
            tapestryUncovered: g.world.castleTapestry.uncovered,
            hollowDiscovered: g.world.makersHollow.discovered,
            hiddenRevealed: g.world.hiddenLadder.revealed,
            skyTreeState: g.world.skyTree.state,
        };
    });
}

module.exports = {
    slotRow, slotChoose, slotConfirm, slotCancel, slotDelete,
    openTitle, startNewGame, chooseCharacterAndBegin, dismissDialogs, walkAround, seedRun,
    openPause, saveToSlot, waitForRunningGame, readState,
};
