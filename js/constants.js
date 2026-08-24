// ============================================
// Ingoizer's World - Game Constants
// ============================================

// The playfield keeps a fixed height and takes the shape of the window. A
// phone held sideways is far wider than 4:3, and the old fixed 800x600 box
// threw that width away as letterbox - space both the thumbs and the overlay
// screens want. Because only the width moves, nothing changes size on screen:
// a wider window simply shows more ground to either side.
const CANVAS_H = 600;
const CANVAS_MIN_W = 800;    // 4:3 - the shape the game was drawn at
const CANVAS_MAX_W = 1400;   // 7:3 - wider than any phone; the view stops here
let CANVAS_W = CANVAS_MIN_W;

const TILE_SIZE = 32;
let TILES_X = Math.ceil(CANVAS_W / TILE_SIZE) + 2;
const TILES_Y = Math.ceil(CANVAS_H / TILE_SIZE) + 2;

// Backing-store width for a window of this shape. Rounded only to an even
// number of pixels: any coarser and the drawing surface stops matching the box
// it is stretched into closely enough for the tiles to stay square.
function canvasWidthForAspect(aspect) {
    if (!aspect || !isFinite(aspect) || aspect <= 0) return CANVAS_MIN_W;
    const raw = Math.round(aspect * CANVAS_H / 2) * 2;
    return Math.max(CANVAS_MIN_W, Math.min(CANVAS_MAX_W, raw));
}

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
    greenlands: { name: "Green Knight's Domain", x: 50, y: 120, w: 60, h: 30, color: "#0a3a0e", treeChance: 0.06, locked: true },
    // The corner the Worldtree grows in. Marked secret: until the tree itself
    // has been found, the maps draw this ground as unnamed wilderness, so the
    // first Fire Gem memory still points at a blank on the chart.
    worldtree: { name: "The Worldtree Reach", x: 160, y: 0, w: 40, h: 40, color: "#1c3d4e", treeChance: 0.09, secret: true },
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
    CAVE_FLOOR: 16,
    CAVE_WALL: 17,
    CAVE_ENTRANCE: 18,
    LADDER: 19,
    SKY_TREE: 20,
    SKY_TREE_BURNING: 21,
    SKY_LADDER: 22,
    CLOUD: 23,
    SKY_VOID: 24,
    MARBLE: 25,
    PILLAR: 26,
    SKY_PORTAL: 27,
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
    [TILE.CAVE_FLOOR]: "#3a3a3a",
    [TILE.CAVE_WALL]: "#1a1a1a",
    [TILE.CAVE_ENTRANCE]: "#2a2a2a",
    [TILE.LADDER]: "#3a3a4a",
    [TILE.SKY_TREE]: "#1a4a12",
    [TILE.SKY_TREE_BURNING]: "#2a3a12",
    [TILE.SKY_LADDER]: "#4a4038",
    [TILE.CLOUD]: "#e6ecff",
    [TILE.SKY_VOID]: "#4a7fd0",
    [TILE.MARBLE]: "#d8d4e8",
    [TILE.PILLAR]: "#bfb9d4",
    [TILE.SKY_PORTAL]: "#cfd8ff",
};

// Solid tiles (can't walk through)
const SOLID_TILES = new Set([TILE.TREE, TILE.WATER, TILE.WALL, TILE.MOUNTAIN, TILE.CASTLE_WALL, TILE.LAVA, TILE.BURNING_TREE, TILE.CAVE_WALL, TILE.SKY_TREE, TILE.SKY_TREE_BURNING, TILE.SKY_VOID, TILE.PILLAR]);

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
    arrow_strength_bow: { name: "Bow of Arrow Strength", icon: "🏹", damage: 30, speed: 1.1, range: 320, price: 0, description: "A mighty bow from the hidden base — its arrows strike as hard as Excalibur, and grow stronger with every enchantment and gem", projectileSpeed: 7 },
};

// Armor
const ARMOR = {
    cloth_tunic: { name: "Cloth Tunic", icon: "👕", defense: 0, price: 0, description: "Basic clothing, no protection" },
    leather_armor: { name: "Leather Armor", icon: "🦺", defense: 3, price: 60, description: "Light and flexible" },
    chain_mail: { name: "Chain Mail", icon: "⛓️", defense: 5, price: 130, description: "Linked metal rings" },
    iron_plate: { name: "Iron Plate", icon: "🛡️", defense: 8, price: 220, description: "Heavy but sturdy" },
    knights_armor: { name: "Knight's Armor", icon: "🏰", defense: 12, price: 350, description: "Armor of the Round Table" },
    shadow_cloak: { name: "Shadow Cloak", icon: "🧥", defense: 10, price: 0, description: "Woven from darkness" },
    ingozer_armor: { name: "Ingozer's Armour", icon: "🛡️", defense: 20, price: 0, description: "The most defensive armour in the land, from the hidden base — blocks 20 damage" },
};

// Elements / Gem powers
const ELEMENTS = {
    fire: { name: "Fire", icon: "🔥", color: "#ff4400", gemColor: "#ff6644", damage: 25, cooldown: 2000 },
    water: { name: "Water", icon: "💧", color: "#2288ff", gemColor: "#44aaff", damage: 15, cooldown: 1500, heal: 20 },
    ice: { name: "Ice", icon: "❄️", color: "#88ddff", gemColor: "#aaeeff", damage: 20, cooldown: 1800, slowDuration: 3000 },
    lightning: { name: "Lightning", icon: "⚡", color: "#ffee00", gemColor: "#ffff44", damage: 35, cooldown: 3000 },
    earth: { name: "Earth", icon: "🪨", color: "#8b6914", gemColor: "#aa8833", damage: 22, cooldown: 2200, stunDuration: 2000 },
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
    health_potion: { name: "Health Potion", icon: "🧪", price: 25, description: "Adds to inventory (heals 40 HP)", effect: "health_potion", value: 40 },
    greater_health: { name: "Greater Potion", icon: "🧪", price: 60, description: "Adds to inventory (heals 80 HP)", effect: "greater_health_potion", value: 80 },
    shield_potion: { name: "Shield Rune", icon: "🛡️", price: 50, description: "Block next hit", effect: "shield", value: 1 },
    arrows_bundle: { name: "Arrow Bundle", icon: "🏹", price: 15, description: "10 arrows", effect: "arrows", value: 10 },
    apple: { name: "Apple", icon: "🍎", price: 12, description: "Feed a wild animal to tame it", effect: "apples", value: 1 },
    apple_basket: { name: "Basket of Apples", icon: "🧺", price: 50, description: "5 apples for taming animals", effect: "apples", value: 5 },
};

// Player defaults
const PLAYER_DEFAULTS = {
    maxHp: 100,
    speed: 2.5,
    size: 14,
    iframes: 500,       // invincibility after being hit (ms)
    attackCooldown: 400, // base attack cooldown (ms)
};

// Spawn rates (monsters per zone per respawn tick)
const MONSTER_SPAWN_RATE = 0.02;
const MAX_MONSTERS_PER_ZONE = 8;
const MONSTER_SPAWN_INTERVAL = 5000; // ms

// Who a monster goes for. Ingoizer is the obvious mark, but the animals at his
// heel are meat too, and a monster will turn on the nearer of the two - or on
// whichever of them just bit it.
const MONSTER_TARGETING = {
    companionBias: 1.3,     // a companion counts as this much further off than it is, so Ingoizer stays the preferred mark
    switchInterval: 800,    // ms a monster keeps its mark before looking again
    grudgeTime: 2600,       // ms a monster stays fixed on a companion that has hurt it
};

// Shop locations (tile coordinates)
const SHOP_LOCATIONS = [
    { x: 15, y: 60, name: "Camelot Armory", inventory: ["iron_sword", "mace", "spear", "hunters_bow", "leather_armor", "chain_mail", "health_potion", "arrows_bundle", "apple", "apple_basket"] },
    { x: 130, y: 20, name: "Desert Trader", inventory: ["battle_axe", "knights_blade", "longbow", "iron_plate", "knights_armor", "greater_health", "shield_potion", "arrows_bundle", "apple", "apple_basket"] },
    { x: 75, y: 70, name: "Swamp Witch", inventory: ["health_potion", "greater_health", "shield_potion", "arrows_bundle", "apple", "apple_basket"] },
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

// Merlin's Hut Lore - Ancient texts and game story.
// Entries with an `unlock` key stay out of the library until the game marks
// that key discovered (see Game.unlockLore). They carry story the player is
// meant to find out in the world first, not read ahead of time.
const MERLIN_LORE = [
    {
        title: "The Legend of Ingoizer",
        icon: "\u2694\ufe0f",
        text: "Ingoizer is not a first name. It is a last one. For as long as the realm has kept records there have been Ingoizers, and every one of them was born to the same strange inheritance: trouble finds them, and they are the only ones who can end it. In an age of shadow and fading hope the newest of that line woke in the humble Green Meadow with a rusty sword, a rusty bow, and no idea what his own surname meant. Destiny chose him to reclaim the stolen Blue Gems and restore peace to a land gripped by evil. His journey would take him through treacherous forests, scorching deserts, and haunted ruins \u2014 but Ingoizer would not falter, for the fate of the realm rested upon his shoulders."
    },
    {
        title: "The House of Ingoizer",
        icon: "\ud83d\udcdc",
        text: "The old houses of the realm each carry a word. The house of Ingoizer carries two, and they contradict each other. Some of the family read the line as a curse: an Ingoizer is born into danger, buries more of his kin than any man should, and is never allowed a quiet life. Others read exactly the same line as a promise: only an Ingoizer will be standing when the world needs saving, because only an Ingoizer is made for it. Both readings are true. That is the whole difficulty. Every generation someone in the family must decide which half they believe \u2014 and not everyone has decided the way you would hope."
    },
    {
        title: "The Five Blue Gems",
        icon: "\ud83d\udc8e",
        text: "Long ago, five Blue Gems of immense power were forged in the heart of Crystal Lake by the ancient elemental spirits. Each gem holds the essence of a primal force \u2014 Fire, Water, Ice, Lightning, and Earth. Scattered across the land by a great cataclysm, the gems call out to those brave enough to seek them. When united, they grant the bearer mastery over all five elements and the strength to challenge even the darkest of foes. Monsters who have absorbed their energy may carry gem fragments within."
    },
    {
        title: "Merlin the Wizard",
        icon: "\ud83e\uddd9",
        text: "I, Merlin, have walked these lands for centuries, watching kingdoms rise and fall. My swamp may seem humble, but it is steeped in ancient magic. I once served as advisor to the great kings of Ing Castle, until the Black Knight drove me into exile. My Enchanter's Mallet, a relic of the old world, can imbue weapons and armor with elemental fury. Though my powers have waned without my wand, my knowledge endures. Seek wisdom, young Ingoizer, for brute strength alone will not save the realm."
    },
    {
        title: "The Black Knight",
        icon: "\ud83d\udda4",
        text: "None know the Black Knight's true name \u2014 only that he was somebody's son before he was anybody's terror. He was not born in shadow. He walked into it, on a night he decided that the name he had been given was a curse and nothing more, and that a cursed man owes the world nothing. He left his family, his house and his destiny behind him in one stride, and by morning nobody could say where he had gone. When the gems were scattered he came back clad in armor darker than midnight, with eyes that glow like embers of hate. He seized Ing Castle and claimed the gems as his own. He commands legions of monsters and dark magic that grows stronger the longer the gems remain apart. Only one who carries all five gems can force him from the shadows to face battle."
    },
    {
        title: "Ing Castle",
        icon: "\ud83c\udff0",
        text: "Ing Castle once stood as a beacon of hope and justice, home to noble kings who ruled with wisdom and compassion. Its walls were built from enchanted stone, said to be unbreakable by mortal weapons. When the Black Knight conquered the castle, a dark shroud fell over its towers, and the once-golden banners turned to ash. The castle gates remain sealed to all but those who carry the five Blue Gems. Beyond those gates, the Black Knight waits, drawing power from the very stones that once protected the realm. The great hall keeps one thing he never took down: an old woven family tree on the north wall, hung there long before he came, and covered over the day he did."
    },
    {
        title: "The Tapestry in the Great Hall",
        icon: "\ud83e\uddf5",
        unlock: "tapestry",
        text: "The Black Knight is dead and the shroud over Ing Castle has lifted, and the thing he kept covered all these years is only a tapestry. It is a family tree. It is your family tree \u2014 the same names, the same branches, stitched in the same order your own house has recited them for generations \u2014 and the branch beside your father's is a brother nobody ever mentioned to you. The armour you have just left cooling on the flagstones belongs to your uncle. He believed the name Ingoizer was a curse, so he left the family and went looking for a destiny he liked better. You believed it was a promise, so you stayed. That is the only difference there has ever been between the two of you."
    },
    {
        title: "The Sons of the Black Knight",
        icon: "\ud83c\udf3f",
        unlock: "tapestry",
        text: "The tapestry does not stop at your uncle. It goes on, into a row of sons \u2014 your cousins, every one of them, and you have met most of them already with a sword in your hand. Their father raised them underground and out of sight, and they grew up hating the sun that had shone on the family that let him leave. The eldest, the Green Knight, took the southern woods and holds them still; he does not want the realm, he wants the man who killed his father. His brothers went down instead of out. The Stone Warden and the Crystal Titan dug the four caves themselves, hollow by hollow, for no better reason than that a cave has no sky in it, and they have guarded their own dark ever since. They are not monsters that wandered in. They are the family, still refusing the name."
    },
    {
        title: "The Lady of the Lake",
        icon: "\ud83c\udf0a",
        text: "At the heart of Crystal Lake dwells the Lady of the Lake, an ethereal guardian who has watched over Excalibur since time immemorial. She is neither mortal nor spirit, but something in between \u2014 a keeper of ancient promises. The legendary sword Excalibur, forged by gods and tempered in starlight, rests in her care. She will bestow it only upon a warrior who proves their worth by recovering its jewel-encrusted sheath from the fearsome Sheath Guardian Troll that lurks in the Dark Forest. Nor is the lake her only water. The Fountain of Youth answers to her as well \u2014 the same hand keeps both, one to test a warrior's courage and one to test their wit \u2014 and when the fountain asks you a riddle, it is the Lady asking."
    },
    {
        title: "The Elemental Powers",
        icon: "\u2728",
        text: "The five elements \u2014 Fire, Water, Ice, Lightning, and Earth \u2014 are the fundamental forces that shaped this world. Fire burns with untamed fury, consuming all in its path. Water heals and cleanses, but strikes with the force of crashing waves. Ice freezes foes in their tracks, cold and merciless. Lightning strikes with devastating precision, the wrath of storms made manifest. Earth, the most ancient power, shakes the ground itself, stunning all who stand upon it. As Ingoizer collects the Blue Gems, these powers awaken within him. Master them all, and no enemy shall stand."
    },
    {
        title: "The Lands of the Realm",
        icon: "\ud83d\uddfa\ufe0f",
        text: "The realm stretches from the peaceful Green Meadow in the west to the dread Darklands in the east. Camelot Village shelters honest folk and merchants. The Dark Forest hides dangers and treasures in equal measure. The Scorched Wastes bake under an unforgiving sun, while the Dragon Mountains pierce the clouds with jagged peaks. Merlin's Swamp bubbles with arcane energy, and the Ancient Ruins hold secrets of civilizations long forgotten. Beneath all of it run four caves that no river cut and no earthquake opened \u2014 those were dug, by hands, on purpose. Each land harbors unique monsters and challenges for those who dare explore."
    },
    {
        title: "The Worldtree",
        icon: "\ud83c\udf33",
        text: "In the farthest northeast corner of the realm, where no road runs and no monster dares nest, there stands a single ancient tree. It was old when the mountains were young. The elders called it the Worldtree, for its roots drink from this world while its crown drinks from another. No axe has ever marked it and no storm has ever bent it \u2014 but the old texts whisper of one key: fire loosed from a bowstring. Set a fire arrow into the Worldtree, and what the trunk conceals will finally be laid bare. A ladder. And it does not go down. Burn it and you will get your ladder. You will also have burned down the only thing holding two worlds together, and the ash will leave you one seed. Do not lose the seed."
    },
    {
        title: "The Worldtree Seed",
        icon: "\ud83c\udf30",
        unlock: "seed",
        text: "One seed came out of the ash, no bigger than a thumbnail and far heavier than it has any right to be. It is a Worldtree, entire, waiting. You may plant it wherever you like and something will grow, because that is what seeds do \u2014 but a Worldtree is not an ordinary tree and it does not want ordinary ground. It wants the ground it came from. Push it into the ash of the northeast corner, on the very spot where the old trunk stood, and it will take root in a night and climb through the hole you tore in the sky. Plant it anywhere else and you will have a sapling, a nice one, and nothing more; dig it up again and you may carry it on. Whatever else you have burned, this can be put back."
    },
    {
        title: "The Cloudlands",
        icon: "\u2601\ufe0f",
        text: "Above the sky there is another country. Islands of hardened cloud drift over a blue abyss, joined by bridges of vapour, and at their heart stands a temple of white marble that no mortal mason ever raised. This is the Cloudlands. Nothing here was built for you; nothing here expects you; there is no door in the whole country that a mortal was ever meant to walk through. Its guardians \u2014 storm harpies, golden griffins, giants of cloud and men of bronze \u2014 make the deepest cave troll look like a village nuisance. Slay five of the Cloudlands' keepers and the temple will wake. Something in it has been waiting a very long time for a mortal rude enough to climb."
    },
    {
        title: "The Twelve Olympians",
        icon: "\u26a1",
        text: "Zeus has two complaints against you and he will make both of them before he makes a fist. The first is the Worldtree: it was his family's boundary stone as much as this realm's, and you burned it down to make yourself a staircase. The second is simpler \u2014 you are standing in his country, and mortals do not belong in the Cloudlands. Then he fights, and he does not fight as men fight. When he is roused he wears his family like armour: strike him and he is Hera; strike Hera and he is Poseidon, then Demeter, Athena, Apollo, Artemis, Ares, Aphrodite, Hephaestus, Hermes, Dionysus \u2014 twelve faces, twelve furies, and not one of them can be slain, for you cannot kill a god by killing the mask. Endure all twelve and the masks run out. What stands before you then is Zeus himself, and Zeus himself can bleed. Break him, and his bolts become your arrows. There is another way, and it is not a sword. Answer the first complaint before you ever climb, and the second one dies with it."
    },
];

// Merlin's Hut interaction range (same as shops)
const MERLIN_HUT_INTERACT_RANGE = 50;

// Green Knight Boss
const GREEN_KNIGHT = {
    name: "The Green Knight",
    hp: 700,
    damage: 30,
    speed: 1.1,
    size: 26,
    color: "#0a3a0a",
    phases: [
        { hpThreshold: 1.0, speed: 1.0, attackRate: 1400, pattern: "chase" },
        { hpThreshold: 0.75, speed: 1.2, attackRate: 1100, pattern: "charge" },
        { hpThreshold: 0.5, speed: 1.4, attackRate: 900, pattern: "poison" },
        { hpThreshold: 0.25, speed: 1.7, attackRate: 650, pattern: "frenzy" },
    ],
};

// The woven family tree on the north wall of Ing Castle's great hall. It only
// becomes readable once the Black Knight has fallen and the shroud lifts.
const CASTLE_TAPESTRY = {
    tileX: 183,          // north wall of the great hall, above the gate line
    tileY: 56,
    interactRange: 56,
};

// Black Knight power-up drop
const DARK_CREST = {
    name: "Dark Knight's Crest",
    icon: "🛡️",
    maxHpBonus: 30,
    description: "A dark emblem of power. Permanently increases max HP by 30.",
};

// Green Knight Castle location (tile coordinates)
const GREEN_CASTLE_POS = { x: 80, y: 130 };

// Green Gems - scattered in the Green Knight's Domain
const GREEN_GEM_ATTACK = {
    name: "Green Gem of Power",
    icon: "💚",
    bonus: 5,
    description: "Adds +5 attack damage to all weapons",
};

const GREEN_GEM_DEFENSE = {
    name: "Green Gem of Fortitude",
    icon: "💚",
    bonus: 4,
    description: "Adds +4 defense to all armor",
};

// Magic Charm - dropped by the Green Knight
const MAGIC_CHARM = {
    name: "Magic Charm of Might",
    icon: "🧿",
    damageBonus: 8,
    description: "Adds +8 attack damage to all weapons",
};

// Rainbow Gem - hidden in the secret base in the northwest corner of Ing Castle
const RAINBOW_GEM = {
    name: "Rainbow Gem",
    icon: "🌈",
    bonus: 4,
    description: "A shimmering gem of every color. Grants +4 to everything — +4 damage to weapons and bows, +4 defense to armour.",
};

// World Coins - randomly scattered collectible gold coins
const COIN_CONFIG = {
    count: 60,           // Total coins scattered across the world
    value: [3, 8],       // Random gold value range per coin
    collectRange: 24,    // Auto-collect proximity in pixels
    respawnTime: 60000,  // Respawn timer in ms (60 seconds)
    zones: ["meadow", "forest", "village", "desert", "swamp", "mountains", "ruins", "darklands"],
};

// ============================================
// Animal Companions
// ============================================

// Harmless critters that roam the biomes. Feed one an apple and it fights at your side.
const ANIMAL_TYPES = {
    rabbit: {
        name: "Rabbit", icon: "🐰", hp: 30, damage: 10, speed: 2.6, size: 9,
        color: "#d8cfc0", accent: "#f4eee4",
        zones: ["meadow", "village"],
        flavor: "A quick little thumper with more courage than sense",
    },
    fox: {
        name: "Fox", icon: "🦊", hp: 30, damage: 10, speed: 2.3, size: 11,
        color: "#d9702c", accent: "#f7ece0",
        zones: ["forest", "meadow"],
        flavor: "Clever, russet-furred, and fiercely loyal once fed",
    },
    toad: {
        name: "Toad", icon: "🐸", hp: 20, damage: 10, speed: 1.3, size: 10,
        color: "#5f9a3c", accent: "#8fce63",
        zones: ["swamp", "ruins"],
        flavor: "Warty, cheerful, and startlingly brave for its size",
    },
    owl: {
        name: "Owl", icon: "🦉", hp: 40, damage: 10, speed: 2.1, size: 12,
        color: "#96794f", accent: "#e8dcc4",
        zones: ["forest", "mountains", "darklands"],
        flavor: "A silent hunter that watches over you from above",
    },
    turtle: {
        name: "Turtle", icon: "🐢", hp: 50, damage: 10, speed: 1.0, size: 12,
        color: "#3f8a63", accent: "#245741",
        zones: ["lake"],
        flavor: "Slow, ancient, and shelled like a walking shield",
    },
};

const ANIMAL_CONFIG = {
    maxCompanions: 5,       // how many can follow you at one time
    applesToTame: 1,        // apples spent per taming
    tameRange: 46,          // how close you must be to feed an animal
    perZone: 3,             // wild animals of each type per biome
    maxPerZone: 4,          // respawn cap per type per biome
    spawnInterval: 12000,   // ms between wild-animal respawn ticks
    spawnChance: 0.35,      // chance to respawn one per tick when under the cap
    followDistance: 46,     // how far behind the player companions trail
    aggroRange: 230,        // how far from the player a companion will engage
    leashRange: 320,        // beyond this a companion breaks off and returns
    attackRange: 26,
    attackCooldown: 1000,   // ms between companion attacks
    hurtCooldown: 1100,     // ms between contact hits a companion can suffer
    skittishRange: 42,      // untamed animals drift away inside this range
    deathFadeTime: 900,
    // Keeping up. Half the roster is slower on its feet than Ingoizer is, so a
    // trailing companion borrows its pace from him rather than using its own -
    // otherwise a toad or a turtle falls behind and never recovers.
    sprintRange: 104,       // how far behind before a companion starts to hurry
    sprintSelf: 1.7,        // hurrying pace, as a multiple of its own speed
    dashSelf: 2.1,          // flat-out pace, as a multiple of its own speed
    sprintFloor: 1.18,      // ...but never slower than this much of the player's
    dashFloor: 1.55,        // ...nor this, once it is a long way back
    // Giving up on the landscape.
    unstickTime: 900,       // ms of getting nowhere before it scampers to you
    recallRange: 560,       // this far behind and it scampers regardless
};

// Headings a walking animal will try when the one it wants is blocked, in
// radians either side of its intended direction. They stop short of a right
// angle: past that a step makes no progress towards where the animal was
// going, and a wedged companion is the scamper's problem, not the steering's.
const ANIMAL_STEER_ANGLES = [0.45, 0.85, 1.15, 1.4];

// Apples - bought from shops or found in the wild, spent to tame animals
const APPLE_ITEM = {
    name: "Apple",
    icon: "🍎",
    maxStack: 99,
    description: "Feed a wild animal to make it your companion",
};

const APPLE_CONFIG = {
    count: 36,           // apples scattered across the world
    collectRange: 24,    // auto-collect proximity in pixels
    respawnTime: 90000,  // respawn timer in ms
    zones: ["meadow", "forest", "village", "swamp", "mountains", "ruins"],
};

// Green Knight's Domain monster types
const GREEN_MONSTER_TYPES = {
    green_guardian: {
        name: "Green Guardian", icon: "🛡️", hp: 90, damage: 16, speed: 1.1,
        xp: 45, goldDrop: [25, 50], color: "#1a6a1a", size: 16,
        zones: ["greenlands"], weaponDrop: null, gemDrop: false
    },
    vine_beast: {
        name: "Vine Beast", icon: "🌿", hp: 65, damage: 14, speed: 1.6,
        xp: 35, goldDrop: [20, 40], color: "#2a7a2a", size: 14,
        zones: ["greenlands"], weaponDrop: null, gemDrop: false
    },
};

// ============================================
// Cave System Constants
// ============================================

// Cave world dimensions for individual caves (smaller than main world)
const CAVE_W = 80;
const CAVE_H = 60;

// Cave entrances: each leads to its own separate cave
// obstacle: what blocks the entrance, element: what clears it
// difficulty: 1=easiest(maze+coins), 2=maze+gem, 3=boss+gem, 4=hardest boss+gem
const CAVE_ENTRANCES = [
    { id: 0, x: 10,  y: 120, label: "SW Cave",  obstacle: "trees",        element: "fire",  difficulty: 1 },
    { id: 1, x: 160, y: 140, label: "SE Cave",  obstacle: "eternal_flame", element: "water", difficulty: 2 },
    { id: 2, x: 15,  y: 10,  label: "NW Cave",  obstacle: "water",        element: "ice",   difficulty: 3 },
    { id: 3, x: 150, y: 10,  label: "NE Cave",  obstacle: "rocks",        element: "earth", difficulty: 4 },
];

// ============================================
// The Maker's Hollow
// ============================================

// A ladder in the far southwest corner of the realm, past the last named land
// and off every chart. Climbing down finds the small chamber the game itself
// was made in. Nothing points at it: it is only ever found by wandering.
const MAKERS_HOLLOW = {
    name: "The Maker's Hollow",
    x: 5, y: 144,        // tile coordinates - the bottom-left corner of the world
    range: 46,           // how close you must stand to climb down
    creator: "Luca",
    year: 2026,
    website: "luca.maggio.xyz",
};

// Obstacle tile types used around cave entrances
const CAVE_OBSTACLE_TILES = {
    trees: TILE.TREE,
    eternal_flame: TILE.LAVA,
    water: TILE.WATER,
    rocks: TILE.MOUNTAIN,
};

// Eternal flame damage when touched
const ETERNAL_FLAME_DAMAGE = 20;
const ETERNAL_FLAME_KNOCKBACK = 8;

// Cave monster types (harder than surface monsters, better loot)
const CAVE_MONSTER_TYPES = {
    cave_spider: {
        name: "Giant Cave Spider", icon: "🕷️", hp: 90, damage: 16, speed: 1.8,
        xp: 50, goldDrop: [30, 60], color: "#4a2a4a", size: 15,
        weaponDrop: "knights_blade", weaponDropChance: 0.2, gemDrop: false,
        armorDrop: "iron_plate", armorDropChance: 0.15
    },
    cave_bat: {
        name: "Shadow Bat", icon: "🦇", hp: 55, damage: 12, speed: 2.2,
        xp: 35, goldDrop: [20, 45], color: "#3a2a3a", size: 12,
        weaponDrop: null, gemDrop: false,
        armorDrop: "shadow_cloak", armorDropChance: 0.1
    },
    deep_troll: {
        name: "Deep Troll", icon: "👹", hp: 140, damage: 22, speed: 0.8,
        xp: 65, goldDrop: [40, 80], color: "#4a5a3a", size: 20,
        weaponDrop: "battle_axe", weaponDropChance: 0.25, gemDrop: false,
        armorDrop: "knights_armor", armorDropChance: 0.15
    },
    crystal_golem: {
        name: "Crystal Golem", icon: "💎", hp: 120, damage: 20, speed: 0.6,
        xp: 55, goldDrop: [35, 70], color: "#6a6aaa", size: 18,
        weaponDrop: "dark_blade", weaponDropChance: 0.15, gemDrop: false,
        armorDrop: "knights_armor", armorDropChance: 0.1
    },
    shadow_serpent: {
        name: "Shadow Serpent", icon: "🐍", hp: 75, damage: 18, speed: 1.6,
        xp: 45, goldDrop: [25, 55], color: "#2a2a5a", size: 14,
        weaponDrop: "dark_blade", weaponDropChance: 0.1, gemDrop: false,
        armorDrop: "shadow_cloak", armorDropChance: 0.12
    },
};

// Cave 3 Boss (NW Cave - difficulty 3)
const CAVE_BOSS_3 = {
    name: "The Stone Warden",
    hp: 600,
    damage: 28,
    speed: 0.9,
    size: 28,
    color: "#3a3a5a",
    phases: [
        { hpThreshold: 1.0, speed: 1.0, attackRate: 1400, pattern: "chase" },
        { hpThreshold: 0.7, speed: 1.2, attackRate: 1100, pattern: "charge" },
        { hpThreshold: 0.4, speed: 1.4, attackRate: 800, pattern: "spin" },
        { hpThreshold: 0.15, speed: 1.7, attackRate: 600, pattern: "frenzy" },
    ],
};

// Cave 4 Boss (NE Cave - difficulty 4, hardest)
const CAVE_BOSS_4 = {
    name: "The Crystal Titan",
    hp: 800,
    damage: 35,
    speed: 1.0,
    size: 30,
    color: "#5a3a6a",
    phases: [
        { hpThreshold: 1.0, speed: 1.0, attackRate: 1300, pattern: "chase" },
        { hpThreshold: 0.75, speed: 1.3, attackRate: 1000, pattern: "charge" },
        { hpThreshold: 0.5, speed: 1.5, attackRate: 750, pattern: "spin" },
        { hpThreshold: 0.25, speed: 1.8, attackRate: 550, pattern: "frenzy" },
    ],
};

// Titan's Gauntlet - dropped by the Crystal Titan (NE cave boss)
const CAVE_GAUNTLET = {
    name: "Titan's Gauntlet",
    icon: "🧤",
    damageBonus: 4,
    description: "Adds +4 attack damage to all weapons and bows",
};

// Purple Gems - one in each of the 3 hardest caves
const PURPLE_GEMS = {
    health: { name: "Purple Gem of Vitality", icon: "💜", bonus: 30, description: "Permanently increases max HP by 30" },
    attack: { name: "Purple Gem of Fury", icon: "💜", bonus: 6, description: "Adds +6 attack damage to all weapons" },
    armor:  { name: "Purple Gem of Fortification", icon: "💜", bonus: 5, description: "Adds +5 defense to all armor" },
};

// Cave entrance interaction range
const CAVE_ENTRANCE_RANGE = 40;

// Cave obstacle clearing radius (tiles around entrance to clear)
const CAVE_OBSTACLE_RADIUS = 3;

// Health Potion inventory system
const HEALTH_POTION = {
    name: "Health Potion",
    icon: "🧪",
    healAmount: 40,
    maxStack: 99,
    shopPrice: 25,
    greaterHealAmount: 80,
    greaterShopPrice: 60,
};

// Fountain of Youth
const FOUNTAIN_OF_YOUTH = {
    healFull: true,
    potionsGiven: 3,
    riddleCount: 3,           // riddles to answer per visit
    wrongAnswerCooldown: 180000, // 3 minutes in ms
};

// Fountain riddle pool (many riddles, 3 chosen randomly each visit)
const FOUNTAIN_RIDDLES = [
    { question: "I have cities, but no houses live there. I have mountains, but no trees grow there. I have water, but no fish swim there. What am I?", choices: ["A map", "A painting", "A dream", "A desert"], answer: 0 },
    { question: "The more you take, the more you leave behind. What am I?", choices: ["Memories", "Footsteps", "Breath", "Time"], answer: 1 },
    { question: "I speak without a mouth and hear without ears. I have no body, but I come alive with wind. What am I?", choices: ["A ghost", "An echo", "A shadow", "A whisper"], answer: 1 },
    { question: "What has keys but no locks, space but no room, and you can enter but can't go inside?", choices: ["A riddle", "A keyboard", "A map", "A book"], answer: 1 },
    { question: "I can be cracked, made, told, and played. What am I?", choices: ["A joke", "A code", "A song", "An egg"], answer: 0 },
    { question: "What comes once in a minute, twice in a moment, but never in a thousand years?", choices: ["A heartbeat", "The letter M", "A blink", "A thought"], answer: 1 },
    { question: "What has a head and a tail but no body?", choices: ["A snake", "A coin", "A needle", "A drum"], answer: 1 },
    { question: "I am not alive, but I grow; I don't have lungs, but I need air; I don't have a mouth, but water kills me. What am I?", choices: ["A candle", "Fire", "A plant", "Rust"], answer: 1 },
    { question: "What can travel around the world while staying in a corner?", choices: ["A spider", "A stamp", "The wind", "A shadow"], answer: 1 },
    { question: "The person who makes it, sells it. The person who buys it never uses it. The person who uses it never knows they're using it. What is it?", choices: ["A coffin", "Medicine", "A gift", "A trap"], answer: 0 },
    { question: "What disappears as soon as you say its name?", choices: ["A secret", "Silence", "A shadow", "Darkness"], answer: 1 },
    { question: "I have branches, but no fruit, trunk, or leaves. What am I?", choices: ["A river", "A bank", "Lightning", "A family tree"], answer: 1 },
    { question: "What can you hold in your left hand but not in your right?", choices: ["Your heart", "A secret", "Your right elbow", "Nothing"], answer: 2 },
    { question: "What gets wetter the more it dries?", choices: ["A sponge", "A towel", "The sun", "A river"], answer: 1 },
    { question: "What has many teeth but cannot bite?", choices: ["A comb", "A saw", "A zipper", "A gear"], answer: 0 },
    { question: "What building has the most stories?", choices: ["A castle", "A library", "A skyscraper", "A museum"], answer: 1 },
    { question: "What runs all around a yard without moving?", choices: ["A path", "A fence", "A shadow", "Wind"], answer: 1 },
    { question: "I am tall when I am young, and short when I am old. What am I?", choices: ["A tree", "A candle", "A person", "A mountain"], answer: 1 },
];

// ============================================
// The Cloudlands - Sky Realm Constants
// ============================================

// The Worldtree stands in the far top-right corner of the realm. Burning it
// with a fire arrow reveals a ladder climbing into the clouds.
const SKY_TREE = {
    name: "The Worldtree",
    x: 193, y: 6,       // tile coordinates (top-right corner of the world)
    radius: 1,          // canopy is a (radius*2+1) square of solid tree tiles
    burnTime: 3600,     // ms the tree burns before the ladder is revealed
    ladderRange: 46,    // interaction range for the revealed ladder
};

// The seed left in the ashes of the Worldtree. Planting it back on the spot
// the old trunk stood regrows the tree and settles Zeus's grievance without a
// fight; planting it anywhere else just grows a sapling you can dig up again.
const WORLDTREE_SEED = {
    name: "Worldtree Seed",
    icon: "\ud83c\udf30",
    description: "All that survived the fire. Plant it \u2014 but a Worldtree wants the ground it came from.",
    plantRange: 60,      // how close to the ashes counts as the right ground
    growTime: 2600,      // ms a rightly planted seed takes to become a Worldtree
};

// Sky world dimensions (in tiles) - a wide, shallow archipelago of clouds
const SKY_W = 80;
const SKY_H = 60;

// How many Cloudlands monsters must fall before the Olympian is summoned
const SKY_MONSTERS_TO_SUMMON = 5;

// Cloudlands monsters - markedly stronger than anything in the caves
const SKY_MONSTER_TYPES = {
    storm_harpy: {
        name: "Storm Harpy", icon: "🦅", hp: 130, damage: 24, speed: 2.2,
        xp: 80, goldDrop: [50, 95], color: "#4f68a4", size: 15,
        weaponDrop: "knights_blade", weaponDropChance: 0.18, gemDrop: false,
        armorDrop: "knights_armor", armorDropChance: 0.14,
    },
    thunder_wisp: {
        name: "Thunder Wisp", icon: "⚡", hp: 105, damage: 27, speed: 2.5,
        xp: 75, goldDrop: [45, 85], color: "#4a4f9e", size: 13,
        weaponDrop: null, gemDrop: false,
        armorDrop: "shadow_cloak", armorDropChance: 0.12,
    },
    golden_griffin: {
        name: "Golden Griffin", icon: "🦁", hp: 185, damage: 31, speed: 1.7,
        xp: 105, goldDrop: [65, 120], color: "#c08a1e", size: 18,
        weaponDrop: "excalibur", weaponDropChance: 0.05, gemDrop: false,
        armorDrop: "knights_armor", armorDropChance: 0.18,
    },
    cloud_giant: {
        name: "Cloud Giant", icon: "☁️", hp: 240, damage: 35, speed: 0.85,
        xp: 120, goldDrop: [80, 140], color: "#7f8cb8", size: 22,
        weaponDrop: "battle_axe", weaponDropChance: 0.22, gemDrop: false,
        armorDrop: "iron_plate", armorDropChance: 0.2,
    },
    bronze_talos: {
        name: "Bronze Talos", icon: "🗿", hp: 285, damage: 40, speed: 0.7,
        xp: 140, goldDrop: [95, 170], color: "#8a5f1c", size: 24,
        weaponDrop: "dark_blade", weaponDropChance: 0.2, gemDrop: false,
        armorDrop: "iron_plate", armorDropChance: 0.2,
    },
};

// The twelve Olympians. The boss cycles through this roster in order: it is
// summoned as Zeus, every hit turns it into the next god, and after all twelve
// have shown their faces it returns to Zeus - who can finally be killed.
const OLYMPIANS = [
    { key: "zeus",       name: "Zeus",       title: "King of Olympus",      emblem: "⚡", color: "#e8c65a", accent: "#fff3b0", aura: "#ffee88", robe: "#8a6a1a", speed: 1.15, move: "bolts" },
    { key: "hera",       name: "Hera",       title: "Queen of the Gods",    emblem: "🦚", color: "#a05fd8", accent: "#e6c8ff", aura: "#cc88ff", robe: "#57238a", speed: 1.0,  move: "orbit" },
    { key: "poseidon",   name: "Poseidon",   title: "The Earthshaker",      emblem: "🔱", color: "#3d8fd8", accent: "#a8dcff", aura: "#4fb0ff", robe: "#1d4f88", speed: 1.05, move: "wave" },
    { key: "demeter",    name: "Demeter",    title: "Lady of the Harvest",  emblem: "🌾", color: "#cfa63a", accent: "#ffe9a3", aura: "#e8c760", robe: "#7a5a12", speed: 0.9,  move: "thorns" },
    { key: "athena",     name: "Athena",     title: "Goddess of Wisdom",    emblem: "🦉", color: "#c2ccd8", accent: "#ffffff", aura: "#dfe8ff", robe: "#5d6b7d", speed: 1.2,  move: "spears" },
    { key: "apollo",     name: "Apollo",     title: "The Radiant",          emblem: "☀️", color: "#ffb347", accent: "#fff0c0", aura: "#ffd070", robe: "#a85f14", speed: 1.1,  move: "sunburst" },
    { key: "artemis",    name: "Artemis",    title: "The Huntress",         emblem: "🏹", color: "#7fd8c0", accent: "#d8fff2", aura: "#88ffdd", robe: "#1f6b58", speed: 1.35, move: "volley" },
    { key: "ares",       name: "Ares",       title: "God of War",           emblem: "⚔️", color: "#c0392b", accent: "#ff9a8a", aura: "#ff5544", robe: "#6b1a12", speed: 1.25, move: "warcharge" },
    { key: "aphrodite",  name: "Aphrodite",  title: "Goddess of Love",      emblem: "🌹", color: "#ff7eb6", accent: "#ffd6e8", aura: "#ff99cc", robe: "#a82f68", speed: 1.0,  move: "charm" },
    { key: "hephaestus", name: "Hephaestus", title: "The Forgemaster",      emblem: "🔨", color: "#e2673a", accent: "#ffb37a", aura: "#ff7733", robe: "#7a2f12", speed: 0.85, move: "embers" },
    { key: "hermes",     name: "Hermes",     title: "The Messenger",        emblem: "🪶", color: "#8fe3a0", accent: "#dcffe4", aura: "#88ffaa", robe: "#1f7a3d", speed: 1.5,  move: "blink" },
    { key: "dionysus",   name: "Dionysus",   title: "Lord of the Vine",     emblem: "🍇", color: "#8e5bd0", accent: "#d9bcff", aura: "#aa77ff", robe: "#4a2280", speed: 1.05, move: "spiral" },
];

// Tuning for the transformation cycle
const OLYMPIAN_CYCLE = {
    morphTime: 700,          // ms of invulnerable transformation between forms
    attackRate: 1300,        // ms between a form's follow-up attacks
    returnPause: 1800,       // dramatic pause when Zeus returns
    bankedDamageCap: 0.35,   // at most this fraction of Zeus's HP can be pre-burned
};

// Zeus, final form - the only form that can actually be killed
const ZEUS_BOSS = {
    name: "Zeus, King of Olympus",
    hp: 1400,
    damage: 40,
    speed: 1.2,
    size: 32,
    phases: [
        { hpThreshold: 1.0,  speed: 1.0, attackRate: 1500, pattern: "storm" },
        { hpThreshold: 0.70, speed: 1.2, attackRate: 1200, pattern: "tempest" },
        { hpThreshold: 0.40, speed: 1.4, attackRate: 950,  pattern: "wrath" },
        { hpThreshold: 0.18, speed: 1.7, attackRate: 700,  pattern: "cataclysm" },
    ],
};

// Damage dealt by the Olympians' attacks (before the player's armour reduction)
const OLYMPIAN_DAMAGE = {
    projectile: 36,
    shockwave: 40,
    strike: 44,
    charge: 50,
    zeusBolt: 52,
};

// Zeus's reward: every arrow becomes one of his lightning bolts
const ZEUS_BOLT = {
    name: "Zeus's Lightning Bolts",
    icon: "⚡",
    damageBonus: 4,
    description: "Every arrow you loose is now a bolt of Zeus. +4 damage on top of your bow.",
};

// Ambrosia caches hidden on the cloud islands
const AMBROSIA = {
    name: "Ambrosia of Olympus",
    icon: "🍯",
    count: 4,             // caches per sky world
    healFull: true,
    potions: 1,
    gold: [40, 90],
    collectRange: 30,
};
