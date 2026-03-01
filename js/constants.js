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
    BURNING_TREE: 15,
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
    [TILE.BURNING_TREE]: "#1a5a12",
};

// Solid tiles (can't walk through)
const SOLID_TILES = new Set([TILE.TREE, TILE.WATER, TILE.WALL, TILE.MOUNTAIN, TILE.CASTLE_WALL, TILE.LAVA, TILE.BURNING_TREE]);

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

// Bows (ranged weapons, used with R key independently of melee weapon)
const BOWS = {
    rusty_bow: { name: "Rusty Bow", icon: "🏹", damage: 10, speed: 0.8, range: 200, price: 0, description: "A worn but functional bow", projectileSpeed: 5 },
    hunters_bow: { name: "Hunter's Bow", icon: "🏹", damage: 16, speed: 1.0, range: 280, price: 120, description: "A sturdy hunting bow", projectileSpeed: 6 },
    longbow: { name: "Longbow", icon: "🏹", damage: 22, speed: 1.1, range: 350, price: 200, description: "Powerful and precise", projectileSpeed: 7 },
};

// Armor
const ARMOR = {
    cloth_tunic: { name: "Cloth Tunic", icon: "👕", defense: 0, price: 0, description: "Basic clothing, no protection" },
    leather_armor: { name: "Leather Armor", icon: "🦺", defense: 3, price: 60, description: "Light and flexible" },
    chain_mail: { name: "Chain Mail", icon: "⛓️", defense: 5, price: 130, description: "Linked metal rings" },
    iron_plate: { name: "Iron Plate", icon: "🛡️", defense: 8, price: 220, description: "Heavy but sturdy" },
    knights_armor: { name: "Knight's Armor", icon: "🏰", defense: 12, price: 350, description: "Armor of the Round Table" },
    shadow_cloak: { name: "Shadow Cloak", icon: "🧥", defense: 10, price: 0, description: "Woven from darkness" },
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
        zones: ["ruins", "darklands"], weaponDrop: "iron_sword", gemDrop: true, gemChance: 0.2, armorDrop: "chain_mail"
    },
    wolf: {
        name: "Dire Wolf", icon: "🐺", hp: 35, damage: 8, speed: 2.0,
        xp: 15, goldDrop: [3, 12], color: "#777788", size: 12,
        zones: ["forest", "mountains"], weaponDrop: null, gemDrop: false
    },
    troll: {
        name: "Cave Troll", icon: "👹", hp: 80, damage: 15, speed: 0.7,
        xp: 35, goldDrop: [20, 40], color: "#558844", size: 18,
        zones: ["mountains", "swamp"], weaponDrop: "battle_axe", gemDrop: true, gemChance: 0.3, armorDrop: "iron_plate"
    },
    wraith: {
        name: "Dark Wraith", icon: "👻", hp: 60, damage: 12, speed: 1.5,
        xp: 30, goldDrop: [15, 35], color: "#4444aa", size: 14,
        zones: ["darklands", "ruins"], weaponDrop: "dark_blade", gemDrop: true, gemChance: 0.25, armorDrop: "shadow_cloak"
    },
    dragon_whelp: {
        name: "Dragon Whelp", icon: "🐉", hp: 70, damage: 18, speed: 1.3,
        xp: 40, goldDrop: [25, 50], color: "#cc4422", size: 16,
        zones: ["mountains", "desert"], weaponDrop: "knights_blade", gemDrop: true, gemChance: 0.35, armorDrop: "knights_armor"
    },
    bandit: {
        name: "Bandit", icon: "🥷", hp: 40, damage: 9, speed: 1.4,
        xp: 18, goldDrop: [15, 30], color: "#886644", size: 13,
        zones: ["forest", "meadow", "desert"], weaponDrop: "mace", gemDrop: false, armorDrop: "leather_armor"
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
    arrows_bundle: { name: "Arrow Bundle", icon: "🏹", price: 15, description: "10 arrows", effect: "arrows", value: 10 },
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
    { x: 15, y: 60, name: "Camelot Armory", inventory: ["iron_sword", "mace", "spear", "hunters_bow", "leather_armor", "chain_mail", "health_potion", "mana_potion", "arrows_bundle"] },
    { x: 130, y: 20, name: "Desert Trader", inventory: ["battle_axe", "knights_blade", "longbow", "iron_plate", "knights_armor", "greater_health", "shield_potion", "arrows_bundle"] },
    { x: 75, y: 70, name: "Swamp Witch", inventory: ["health_potion", "greater_health", "mana_potion", "shield_potion", "arrows_bundle"] },
];

// Lady of the Lake (Excalibur encounter)
const LADY_OF_LAKE = {
    x: 50, y: 68, // tile coordinates - on the shore of Crystal Lake
    interactRange: 50,
};

// Sheath Guardian Troll - guards the jewel-encrusted sheath of Excalibur
const SHEATH_TROLL = {
    name: "Sheath Guardian",
    icon: "👹",
    hp: 120,
    damage: 18,
    speed: 0.8,
    size: 22,
    color: "#447744",
    xp: 50,
    goldDrop: [30, 50],
    spawnTile: { x: 80, y: 40 }, // in the Dark Forest
    aggroRange: 120,
    leashRange: 200,
};

// Sheath damage bonus when in inventory
const SHEATH_DAMAGE_BONUS = 2;

// Merlin the Wizard (in Merlin's Swamp)
const MERLIN = {
    x: 75, y: 75,
    interactRange: 50,
};

// Merlin's Hut (near Ing Castle - where his wand is)
const MERLIN_HUT = {
    x: 158, y: 58,
};

// Enchantment damage bonus when weapon is enchanted with an element
const ENCHANT_DAMAGE_BONUS = 8;

const COLORS = {
    player: "#3388ff",
    gem: "#4488ff",
    gemGlow: "#88bbff",
    gold: "#ffd700",
    shopMarker: "#ffaa00",
};

// Merlin's Hut Lore - Ancient texts and game story
const MERLIN_LORE = [
    {
        title: "The Legend of Ingoizer",
        icon: "⚔️",
        text: "In an age of shadow and fading hope, a young knight named Ingoizer arose from the humble Green Meadow. Though armed with only a rusty sword and bow, his heart burned with courage that no darkness could extinguish. Destiny chose him to reclaim the stolen Blue Gems and restore peace to a land gripped by evil. His journey would take him through treacherous forests, scorching deserts, and haunted ruins — but Ingoizer would not falter, for the fate of the realm rested upon his shoulders."
    },
    {
        title: "The Five Blue Gems",
        icon: "💎",
        text: "Long ago, five Blue Gems of immense power were forged in the heart of Crystal Lake by the ancient elemental spirits. Each gem holds the essence of a primal force — Fire, Water, Ice, and Lightning — while the fifth binds them all together. Scattered across the land by a great cataclysm, the gems call out to those brave enough to seek them. When united, they grant the bearer mastery over the elements and the strength to challenge even the darkest of foes. Monsters who have absorbed their energy may carry gem fragments within."
    },
    {
        title: "Merlin the Wizard",
        icon: "🧙",
        text: "I, Merlin, have walked these lands for centuries, watching kingdoms rise and fall. My swamp may seem humble, but it is steeped in ancient magic. I once served as advisor to the great kings of Ing Castle, until the Black Knight drove me into exile. My Enchanter's Mallet, a relic of the old world, can imbue weapons and armor with elemental fury. Though my powers have waned without my wand, my knowledge endures. Seek wisdom, young Ingoizer, for brute strength alone will not save the realm."
    },
    {
        title: "The Black Knight",
        icon: "🖤",
        text: "None know the Black Knight's true name — only that he appeared from the shadows when the gems were scattered. Clad in armor darker than midnight, with eyes that glow like embers of hate, he seized Ing Castle and claimed the gems as his own. His power grows with each passing day, feeding on the fear of the land. He commands legions of monsters and dark magic that grows stronger the longer the gems remain apart. Only one who carries all five gems can force him from the shadows to face battle."
    },
    {
        title: "Ing Castle",
        icon: "🏰",
        text: "Ing Castle once stood as a beacon of hope and justice, home to noble kings who ruled with wisdom and compassion. Its walls were built from enchanted stone, said to be unbreakable by mortal weapons. When the Black Knight conquered the castle, a dark shroud fell over its towers, and the once-golden banners turned to ash. The castle gates remain sealed to all but those who carry the five Blue Gems. Beyond those gates, the Black Knight waits, drawing power from the very stones that once protected the realm."
    },
    {
        title: "The Lady of the Lake",
        icon: "🌊",
        text: "At the heart of Crystal Lake dwells the Lady of the Lake, an ethereal guardian who has watched over Excalibur since time immemorial. She is neither mortal nor spirit, but something in between — a keeper of ancient promises. The legendary sword Excalibur, forged by gods and tempered in starlight, rests in her care. She will bestow it only upon a warrior who proves their worth by recovering its jewel-encrusted sheath from the fearsome Sheath Guardian Troll that lurks in the Dark Forest."
    },
    {
        title: "The Elemental Powers",
        icon: "✨",
        text: "The four elements — Fire, Water, Ice, and Lightning — are the fundamental forces that shaped this world. Fire burns with untamed fury, consuming all in its path. Water heals and cleanses, but strikes with the force of crashing waves. Ice freezes foes in their tracks, cold and merciless. Lightning strikes with devastating precision, the wrath of storms made manifest. As Ingoizer collects the Blue Gems, these powers awaken within him, each more formidable than the last. Master them all, and no enemy shall stand."
    },
    {
        title: "The Lands of the Realm",
        icon: "🗺️",
        text: "The realm stretches from the peaceful Green Meadow in the west to the dread Darklands in the east. Camelot Village shelters honest folk and merchants. The Dark Forest hides dangers and treasures in equal measure. The Scorched Wastes bake under an unforgiving sun, while the Dragon Mountains pierce the clouds with jagged peaks. Merlin's Swamp bubbles with arcane energy, and the Ancient Ruins hold secrets of civilizations long forgotten. Each land harbors unique monsters and challenges for those who dare explore."
    },
];

// Merlin's Hut interaction range (same as shops)
const MERLIN_HUT_INTERACT_RANGE = 50;
