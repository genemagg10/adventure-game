// ============================================
// Ingoizer's World - Game Constants
// ============================================

const CANVAS_W = 800;
const CANVAS_H = 600;
const TILE_SIZE = 32;
const TILES_X = Math.ceil(CANVAS_W / TILE_SIZE) + 2;
const TILES_Y = Math.ceil(CANVAS_H / TILE_SIZE) + 2;

// World dimensions (in tiles)
const WORLD_W = 200;
const WORLD_H = 150;

// Zone definitions (rectangular areas in world coordinates)
const ZONES = {
    meadow: { name: "Green Meadow", x: 0, y: 0, w: 60, h: 50, color: "#3a7d2e", treeChance: 0.03 },
    forest: { name: "Dark Forest", x: 60, y: 0, w: 50, h: 60, color: "#1e5a16", treeChance: 0.12 },
    village: { name: "Camelot Village", x: 0, y: 50, w: 40, h: 40, color: "#5a8a3e", treeChance: 0.01 },
    desert: { name: "Scorched Wastes", x: 110, y: 0, w: 50, h: 50, color: "#c4a54a", treeChance: 0.005 },
    swamp: { name: "Merlin's Swamp", x: 60, y: 60, w: 50, h: 40, color: "#2e4a2e", treeChance: 0.05 },
    mountains: { name: "Dragon Mountains", x: 110, y: 50, w: 50, h: 50, color: "#6b6b6b", treeChance: 0.02 },
    lake: { name: "Crystal Lake", x: 40, y: 50, w: 20, h: 40, color: "#2255aa", treeChance: 0 },
    castle: { name: "Ing Castle", x: 160, y: 40, w: 40, h: 40, color: "#3a3a4a", treeChance: 0.01 },
    ruins: { name: "Ancient Ruins", x: 0, y: 90, w: 50, h: 40, color: "#5a5a4a", treeChance: 0.03 },
    darklands: { name: "The Darklands", x: 110, y: 100, w: 60, h: 50, color: "#1a1a2e", treeChance: 0.04 },
};

// Tile types
const TILE = {
    GRASS: 0,
    TREE: 1,
    WATER: 2,
    SAND: 3,
    STONE: 4,
    PATH: 5,
    WALL: 6,
    BRIDGE: 7,
    DARK_GRASS: 8,
    MOUNTAIN: 9,
    SWAMP: 10,
    CASTLE_FLOOR: 11,
    CASTLE_WALL: 12,
    SHOP_FLOOR: 13,
    LAVA: 14,
};

// Tile colors
const TILE_COLORS = {
    [TILE.GRASS]: "#3a7d2e",
    [TILE.TREE]: "#1a5a12",
    [TILE.WATER]: "#2255aa",
    [TILE.SAND]: "#c4a54a",
    [TILE.STONE]: "#7a7a7a",
    [TILE.PATH]: "#9a8a5a",
    [TILE.WALL]: "#4a4a5a",
    [TILE.BRIDGE]: "#8a6a3a",
    [TILE.DARK_GRASS]: "#2a5a1e",
    [TILE.MOUNTAIN]: "#5a5a6a",
    [TILE.SWAMP]: "#3a5a2a",
    [TILE.CASTLE_FLOOR]: "#4a4a5a",
    [TILE.CASTLE_WALL]: "#2a2a3a",
    [TILE.SHOP_FLOOR]: "#6a5a3a",
    [TILE.LAVA]: "#cc3300",
};

// Solid tiles (can't walk through)
const SOLID_TILES = new Set([TILE.TREE, TILE.WATER, TILE.WALL, TILE.MOUNTAIN, TILE.CASTLE_WALL, TILE.LAVA]);

// Weapons
const WEAPONS = {
    rusty_sword: { name: "Rusty Sword", icon: "🗡️", damage: 8, speed: 1.0, range: 28, price: 0, description: "A worn but reliable blade" },
    iron_sword: { name: "Iron Sword", icon: "⚔️", damage: 14, speed: 1.0, range: 30, price: 80, description: "Sturdy iron craftsmanship" },
    battle_axe: { name: "Battle Axe", icon: "🪓", damage: 22, speed: 0.7, range: 26, price: 150, description: "Slow but devastating" },
    knights_blade: { name: "Knight's Blade", icon: "🗡️", damage: 20, speed: 1.1, range: 32, price: 250, description: "Blade of the Round Table" },
    excalibur: { name: "Excalibur", icon: "⚔️", damage: 30, speed: 1.2, range: 36, price: 0, description: "The legendary sword of kings" },
    mace: { name: "War Mace", icon: "🔨", damage: 18, speed: 0.8, range: 24, price: 120, description: "Crushing blows" },
    spear: { name: "Long Spear", icon: "🔱", damage: 16, speed: 1.0, range: 42, price: 100, description: "Great reach" },
    dark_blade: { name: "Dark Blade", icon: "🗡️", damage: 26, speed: 1.1, range: 34, price: 0, description: "Forged in shadow" },
};

// Elements / Gem powers
const ELEMENTS = {
    fire: { name: "Fire", icon: "🔥", color: "#ff4400", gemColor: "#ff6644", damage: 25, manaCost: 20 },
    water: { name: "Water", icon: "💧", color: "#2288ff", gemColor: "#44aaff", damage: 15, manaCost: 15, heal: 20 },
    ice: { name: "Ice", icon: "❄️", color: "#88ddff", gemColor: "#aaeeff", damage: 20, manaCost: 18, slowDuration: 3000 },
    lightning: { name: "Lightning", icon: "⚡", color: "#ffee00", gemColor: "#ffff44", damage: 35, manaCost: 30 },
};

// Monster types
const MONSTER_TYPES = {
    goblin: {
        name: "Goblin", icon: "👺", hp: 30, damage: 5, speed: 1.2,
        xp: 10, goldDrop: [5, 15], color: "#55aa33", size: 12,
        zones: ["meadow", "forest"], weaponDrop: null, gemDrop: false
    },
    skeleton: {
        name: "Skeleton Knight", icon: "💀", hp: 50, damage: 10, speed: 1.0,
        xp: 20, goldDrop: [10, 25], color: "#ccccaa", size: 13,
        zones: ["ruins", "darklands"], weaponDrop: "iron_sword", gemDrop: true, gemChance: 0.2
    },
    wolf: {
        name: "Dire Wolf", icon: "🐺", hp: 35, damage: 8, speed: 2.0,
        xp: 15, goldDrop: [3, 12], color: "#777788", size: 12,
        zones: ["forest", "mountains"], weaponDrop: null, gemDrop: false
    },
    troll: {
        name: "Cave Troll", icon: "👹", hp: 80, damage: 15, speed: 0.7,
        xp: 35, goldDrop: [20, 40], color: "#558844", size: 18,
        zones: ["mountains", "swamp"], weaponDrop: "battle_axe", gemDrop: true, gemChance: 0.3
    },
    wraith: {
        name: "Dark Wraith", icon: "👻", hp: 60, damage: 12, speed: 1.5,
        xp: 30, goldDrop: [15, 35], color: "#4444aa", size: 14,
        zones: ["darklands", "ruins"], weaponDrop: "dark_blade", gemDrop: true, gemChance: 0.25
    },
    dragon_whelp: {
        name: "Dragon Whelp", icon: "🐉", hp: 70, damage: 18, speed: 1.3,
        xp: 40, goldDrop: [25, 50], color: "#cc4422", size: 16,
        zones: ["mountains", "desert"], weaponDrop: "knights_blade", gemDrop: true, gemChance: 0.35
    },
    bandit: {
        name: "Bandit", icon: "🥷", hp: 40, damage: 9, speed: 1.4,
        xp: 18, goldDrop: [15, 30], color: "#886644", size: 13,
        zones: ["forest", "meadow", "desert"], weaponDrop: "mace", gemDrop: false
    },
    swamp_creature: {
        name: "Swamp Creature", icon: "🐸", hp: 45, damage: 10, speed: 0.9,
        xp: 22, goldDrop: [8, 20], color: "#336633", size: 14,
        zones: ["swamp"], weaponDrop: "spear", gemDrop: true, gemChance: 0.2
    },
};

// Boss
const BOSS = {
    name: "The Black Knight",
    hp: 500,
    damage: 25,
    speed: 1.0,
    size: 24,
    color: "#111122",
    phases: [
        { hpThreshold: 1.0, speed: 1.0, attackRate: 1500, pattern: "chase" },
        { hpThreshold: 0.7, speed: 1.3, attackRate: 1200, pattern: "charge" },
        { hpThreshold: 0.4, speed: 1.5, attackRate: 900, pattern: "spin" },
        { hpThreshold: 0.15, speed: 1.8, attackRate: 700, pattern: "frenzy" },
    ],
};

// Shop items (includes weapons + potions)
const SHOP_POTIONS = {
    health_potion: { name: "Health Potion", icon: "🧪", price: 25, description: "Restores 40 HP", effect: "heal", value: 40 },
    greater_health: { name: "Greater Potion", icon: "🧪", price: 60, description: "Restores 80 HP", effect: "heal", value: 80 },
    mana_potion: { name: "Mana Crystal", icon: "🔮", price: 30, description: "Restores 30 mana", effect: "mana", value: 30 },
    shield_potion: { name: "Shield Rune", icon: "🛡️", price: 50, description: "Block next hit", effect: "shield", value: 1 },
};

// Player defaults
const PLAYER_DEFAULTS = {
    maxHp: 100,
    speed: 2.5,
    mana: 100,
    maxMana: 100,
    manaRegen: 0.05,
    size: 14,
    iframes: 500,       // invincibility after being hit (ms)
    attackCooldown: 400, // base attack cooldown (ms)
};

// Spawn rates (monsters per zone per respawn tick)
const MONSTER_SPAWN_RATE = 0.02;
const MAX_MONSTERS_PER_ZONE = 8;
const MONSTER_SPAWN_INTERVAL = 5000; // ms

// Shop locations (tile coordinates)
const SHOP_LOCATIONS = [
    { x: 15, y: 60, name: "Camelot Armory", inventory: ["iron_sword", "mace", "spear", "health_potion", "mana_potion"] },
    { x: 130, y: 20, name: "Desert Trader", inventory: ["battle_axe", "knights_blade", "greater_health", "shield_potion"] },
    { x: 75, y: 70, name: "Swamp Witch", inventory: ["health_potion", "greater_health", "mana_potion", "shield_potion"] },
];

// Blue gem locations (fixed spawn points) - some from exploration, some from monsters
const GEM_SPAWN_POINTS = [
    { x: 25, y: 25, zone: "meadow" },       // easy to find
    { x: 85, y: 30, zone: "forest" },        // in the forest
    { x: 130, y: 70, zone: "mountains" },    // mountain gem
];
// 2 more come from monster drops, for total of 5

// Lady of the Lake (Excalibur encounter)
const LADY_OF_LAKE = {
    x: 50, y: 68, // tile coordinates - on the shore of Crystal Lake
    interactRange: 50,
    riddles: [
        {
            question: "What castle stands at the edge of the realm, where darkness gathers and a great evil dwells?",
            choices: ["Dragon Keep", "Ing Castle", "Camelot", "The Black Tower"],
            answer: 1,
        },
        {
            question: "How many Blue Gems must a hero gather before the final battle can begin?",
            choices: ["Three", "Four", "Five", "Seven"],
            answer: 2,
        },
        {
            question: "Which of these lands is home to the Crystal Lake?",
            choices: ["The Darklands", "Scorched Wastes", "Between Camelot Village and Dark Forest", "Dragon Mountains"],
            answer: 2,
        },
        {
            question: "What foul knight clad in shadow guards the gates of Ing Castle?",
            choices: ["The Red Knight", "The Black Knight", "The Iron Knight", "The Pale Knight"],
            answer: 1,
        },
        {
            question: "What ancient power do the Blue Gems bestow upon their bearer?",
            choices: ["Invisibility", "Flight", "Elemental Powers", "Immortality"],
            answer: 2,
        },
    ],
};

const COLORS = {
    player: "#3388ff",
    playerOutline: "#1155cc",
    boss: "#111122",
    bossOutline: "#880000",
    gem: "#4488ff",
    gemGlow: "#88bbff",
    gold: "#ffd700",
    shopMarker: "#ffaa00",
    castleGate: "#8b6914",
};
