# Ingoizer's World

**A Tale of Gems and Glory**

Ingoizer's World is a pixel-art adventure game that runs in a web browser. Luca created the game and leads the project. Luca makes the final choices about the game, story, characters, worlds, art, and releases.

Play the current build: [genemagg10.github.io/adventure-game](https://genemagg10.github.io/adventure-game/)

## Current game

The player wakes up as Ingoizer in Green Meadow with a rusty sword and bow. Ingoizer is a family name, and the house that carries it cannot agree whether the name is a curse or a promise. The main quest is to find five Blue Gems with elemental powers. Ingoizer can then face the Black Knight at Ing Castle — and once the Black Knight falls, a tapestry in the great hall shows whose family the man in the black armour belonged to. The adventure also opens the Green Knight's Domain, four caves, the Worldtree, Cloudlands, the Twelve Olympians, and Zeus.

Current features include:

- A large main world with named lands, landmarks, shops, quests, and maps.
- Close-range weapons, bows, armor, usable items, elemental powers, enchanting, monster drops, and treasure.
- The Lady of the Lake, the Excalibur quest, and the Fountain of Youth she also keeps.
- Merlin's wand quest, Enchanter's Mallet, and a fifteen-entry Ancient Lore library whose last three entries stay hidden until the player earns them.
- Black Knight and Green Knight progression arcs, and the family tapestry in Ing Castle that connects them.
- Four caves with elemental locks, mazes or bosses, treasure chests, Purple Gems, and special rewards.
- The Worldtree, Cloudlands, Temple of Olympus, twelve-form Olympian encounter, and Zeus reward.
- The Worldtree Seed: plant it back where the tree stood and Zeus grants his lightning without a fight.
- Fountain of Youth riddles.
- Friendly wild animals that can be tamed with apples and accompany the player.
- Keyboard and touch controls, mobile landscape play, sound, inventory, shops, a small map, and a world map.

## Controls

| Input | Action |
|---|---|
| WASD / Arrow keys | Move |
| Space | Melee attack |
| R | Shoot an arrow |
| E | Interact, enter, shop, or tame an animal |
| M | Toggle map |
| 1-5 | Select an unlocked elemental power |
| Q | Use the selected elemental power |
| T | Use a health potion |
| I | Open inventory |
| P | Plant the Worldtree Seed |
| Esc | Pause |

Touch controls appear automatically on supported phones and tablets. Hold the device sideways for the best view.

## Run locally

The project uses plain HTML, CSS, and JavaScript. It does not need a build step.

1. Clone or download the repository.
2. Start a simple web server in the main project folder.
3. Open `index.html` through the server.

For example, if Python is installed:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Project structure

| Path | Purpose |
|---|---|
| `index.html` | Main drawing area, screens, pop-up layers, controls, and code loading |
| `css/style.css` | How the game and menus look on computers and mobile devices |
| `js/constants.js` | Names and numbers for worlds, items, enemies, bosses, lore, and riddles |
| `js/world.js` | Main world, caves, Cloudlands, landmarks, maps, and drawing |
| `js/entities.js` | Player, enemies, bosses, arrows and other flying attacks, and the Olympian fight |
| `js/animals.js` | Wild animals and companions |
| `js/combat.js` | Close attacks, arrows, elemental effects, damage, and fight events |
| `js/ui.js` | Health display, shops, inventory, lore, riddles, speech, enchanting, and endings |
| `js/game.js` | Main repeating loop, progress, quests, travel between realms, and story events |
| `js/sprites.js` | Draws the handmade pixel characters and objects, including the treasure chest |
| `js/monster-sprites.js` | Draws the species-specific hostile creatures and named bosses |
| `js/sound.js` | Makes sound and music signals |
| `js/touch.js` | Mobile and touch controls |
| `docs/art-direction/` | Art-direction review and visual concepts |
| `docs/development-binder/` | Development-binder structure and current lore documentation |
| `output/pdf/` | Print-ready proposal and binder covers |

## Development documents

- `docs/art-direction/ART_DIRECTION_REVIEW.md` - review of how the whole game looks, art rules, work order, and concept pictures.
- `docs/art-direction/MONSTER_ROSTER.md` - complete hostile roster and the production art identity for every monster and boss.
- `docs/development-binder/BINDER_MASTER.md` - plan for the printed binder and a guide to the current story.
- `RECOMMENDATIONS.md` - an older review with ideas for the game. It is not the official current story.

## Lore access in the game

The main lore library is at Merlin's Hut near Ing Castle. Three of its entries are hidden at the start and only join the shelf once the player has earned them in the world — by reading the tapestry in Ing Castle, or by taking the seed out of the Worldtree's ashes. Players also learn the story from the opening, the Lady of the Lake and Merlin quests, boss speeches and endings, Blue Gems, caves, the Worldtree, Cloudlands, special item descriptions, maps, and landmarks.

## Project authority

Luca is the creator, owner, and project leader of Ingoizer's World. Design pages may include new ideas and concept art. They are not official story or promised features unless Luca approves them.

## License

The project does not currently list a public license. The project owner keeps all rights unless a license is added later.
