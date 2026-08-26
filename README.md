# Ingoizer's World

**A Tale of Gems and Glory**

Ingoizer's World is a pixel-art adventure game that runs in a web browser. Luca created the game and leads the project. Luca makes the final choices about the game, story, characters, worlds, art, and releases.

Play the current build: [genemagg10.github.io/adventure-game](https://genemagg10.github.io/adventure-game/)

## Current game

The player wakes up as Ingoizer in Green Meadow with a rusty sword and bow. Ingoizer is a family name, and the house that carries it cannot agree whether the name is a curse or a promise. The main quest is to find five Blue Gems with elemental powers. Ingoizer can then face the Black Knight at Ing Castle — and once the Black Knight falls, a tapestry in the great hall shows whose family the man in the black armour belonged to. The adventure also opens the Green Knight's Domain, four caves, the Worldtree, Cloudlands, the Twelve Olympians, and Zeus.

Current features include:

- A large main world with named lands, landmarks, shops, quests, and maps.
- Drawn maps with fog of war: the mini map and the world map start blank and fill in as the player travels.
- Close-range weapons, bows, armor, usable items, elemental powers, enchanting, monster drops, and treasure.
- The Lady of the Lake, the Excalibur quest, and the Fountain of Youth she also keeps.
- Merlin's wand quest, Enchanter's Mallet, and a sixteen-entry Ancient Lore library whose hidden entries stay hidden until the player earns them.
- Black Knight and Green Knight progression arcs, and the family tapestry in Ing Castle that connects them.
- Four caves with elemental locks, mazes or bosses, treasure chests, Purple Gems, and special rewards.
- The Worldtree, Cloudlands, Temple of Olympus, twelve-form Olympian encounter, and Zeus reward — or the peace that replaces all of it.
- The Worldtree Seed: burning the Worldtree takes the ladder to the Cloudlands with it, and the seed is the only way to open the way up again. Plant it anywhere for the climb; plant it in the Waiting Ground in the far southeast and Zeus grants his lightning without a fight.
- Fountain of Youth riddles.
- Friendly wild animals that can be tamed with apples and accompany the player. A companion fights what threatens Ingoizer, and monsters fight back: they hunt the pack as readily as the hero, and an animal that bites one has its attention until the grudge wears off.
- Keyboard and touch controls, mobile landscape play, sound, inventory, shops, a mini map, and a world map.
- An announcement, with a tune of its own, for charting every last cell of the surface map.

## Controls

| Input | Action |
|---|---|
| WASD / Arrow keys | Move |
| Space | Melee attack |
| R | Shoot an arrow |
| E | Interact, enter, shop, or tame an animal |
| M | Toggle map (or click the mini map) |
| 1-5 | Select an unlocked elemental power |
| Q | Use the selected elemental power |
| T | Use a health potion |
| I | Open inventory |
| P | Plant the Worldtree Seed, or lift a Worldtree that never took back out |
| Esc | Pause menu — save, load, controls, quit |

Touch controls appear automatically on supported phones and tablets. Hold the device sideways for the best view — the game fills the whole screen, so a wide phone puts the joystick and the action buttons out at the edges where the thumbs already are. The action buttons wear symbols rather than labels, and the symbols are the things themselves: the sword or axe you have equipped, your bow, the elemental power you have selected, and — on the last button — whatever is in reach, an apple for an animal waiting to be tamed, a shop front, a speech bubble for someone with something to say. A button with nothing to do — no potions left, no arrows, no power chosen, nothing within reach — fades until it does. The mini map is the map button: tap it to open the world map, and tap anywhere to close it again. The menu button beside the pack opens the pause menu, which is where saving and loading live. The first elemental power a Blue Gem gives is selected automatically, so it is ready to use straight away.

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
| `js/map.js` | Fog of war, the drawn map layer, and the shared map frame, markers, and legend |
| `js/entities.js` | Player, enemies, bosses, arrows and other flying attacks, and the Olympian fight |
| `js/animals.js` | Wild animals and companions |
| `js/combat.js` | Close attacks, arrows, elemental effects, damage, and fight events |
| `js/ui.js` | Health display, shops, inventory, lore, riddles, speech, enchanting, and endings |
| `js/game.js` | Main repeating loop, progress, quests, travel between realms, and story events |
| `js/save.js` | Saved games: what a save keeps, how it is written, and how it is read back |
| `js/sprites.js` | Draws the handmade pixel characters and objects, including the treasure chest |
| `js/monster-sprites.js` | Draws the species-specific hostile creatures and named bosses |
| `js/sound.js` | Makes sound and music signals |
| `js/touch.js` | Mobile and touch controls |
| `tests/` | Browser tests for saving and loading, and the small server that runs them |
| `docs/art-direction/` | Art-direction review and visual concepts |
| `docs/development-binder/` | Development-binder structure and current lore documentation |
| `output/pdf/` | Print-ready proposal and binder covers |

## Saved games

Progress is saved by hand, never automatically. There are three slots, kept in
the browser's own storage on the device that made them — they do not follow a
player to another browser or another machine.

Saving and loading are reached from the pause menu (Escape on a keyboard, the
menu button beside the pack on a touch screen). The title screen offers
**Continue** for the most recently saved game and **Load Game** for the rest,
once at least one save exists.

A save keeps progress, not the living world. The player, their gear and quest
flags, what has been charted, what has been picked up, and any tamed animal
companions all come back. Monsters and wild animals are not saved; they
repopulate on load, as they do constantly during play anyway. Terrain is not
written down either — every world is generated from a fixed seed, so loading
regenerates the same ground and only records the tiles the player has since
changed, such as burnt forest.

### Adding something that should survive a save

`js/save.js` works from explicit lists of field names, `PLAYER_FIELDS` and
`GAME_FIELDS`. **A new field that is not added to the right list will not
persist, and nothing will report it** — the player simply loses it on load. If
you add progress to `Player` or `Game` that should outlive a session, add its
name to the matching list, and add it to `readState()` in `tests/helpers.js` so
the tests hold you to it.

Saves carry a version number. A save written by an older build loads normally
and inherits new-game defaults for anything it predates, so old saves keep
working as the game grows. A save from a *newer* build is refused rather than
half-loaded.

## Testing

The save system is the one part of the game where a bug is both invisible and
destructive, so it has browser tests. They drive the real game in a real
browser: start a run, save it, throw the page away, load it back, and check
that what returned matches what was there.

```bash
npm install                     # once
npx playwright install chromium # once, downloads the test browser
npm test
```

`npm test` starts its own web server and takes about half a minute. Other
useful forms:

```bash
npm run test:headed   # watch it happen in a visible browser
npm test -- --ui      # step through tests interactively
npm run test:report   # open the report from the last run
```

If a machine already has a Chromium that Playwright can use, point at it with
`CHROMIUM_PATH=/path/to/chrome npm test` and skip the browser download.

## Screen size

The playfield is always 600 units tall and takes the width of the screen, between 4:3 and 7:3. The drawing surface is resized to match its box whenever that box changes, so the picture never stretches out of square — phone browsers do not always announce a size change in time, so the game watches its own box rather than trusting the event. Nothing changes size when the shape changes — a wider screen simply shows more ground to the left and right, and gives the inventory, the shop and the touch controls more room. A phone held sideways is about 2.2:1, so it now fills the whole display instead of sitting in a 4:3 box with black bars either side. How far the player can see, and therefore how much of the map they chart as they walk, follows the width too.

## Maps and fog of war

Both maps are drawn pictures of the realm rather than coloured boxes. Each land has its own colour and its own small marks — pine trees, dunes, mountain peaks, ruined columns — and roads, rivers and coastlines come straight from the real ground the player walks on. Every map is one window: a title plate at the top, the land in the middle, and the key in its own bar at the bottom, so names and markers never sit on top of each other.

The mini map in the corner shows the whole realm, drawn the same way the world map draws it, so where the player stands on the map is where they stand in the world. Fog of war is what hides the parts nobody has walked yet, which is why it needs no arrow on the rim pointing anywhere. Living things — monsters, companions, a boss — appear only while they are close enough to see. It is also the map button — clicking or tapping it opens the world map — so touch play no longer needs a separate MAP button sitting on the playfield.

Nothing is charted at the start. The map fills in as the player travels, and each place has three looks:

1. **Not found yet** — thick fog. No ground, no names, no markers.
2. **Found, but not here now** — the land stays on the map, a little darker and cooler, with everything the player discovered still marked.
3. **Here now** — full colour, plus whatever is moving nearby.

The realm above ground, each of the four caves, and the Cloudlands each remember their own travels. Underground, rock blocks the view, so walking one tunnel never draws the tunnel behind the wall. Two things are never hidden, so a player can always find their way: Ing Castle and the Green Knight's castle are on the map from the first minute, and quest people the story has already named — the Lady of the Lake, Merlin — show as a hollow dashed marker until the player actually reaches them.

Charting the whole surface is possible, and the game says so when it happens: the last cell of fog plays a short tune of its own and announces that 100% of the surface has been explored. It is announced once and remembered in the save.

The mini map is a panel laid over the playfield, and the camera stops at the edge of the world — so walking into a corner parks the player, and whatever landmark they came to see, underneath it. On a short wide phone screen that is enough to hide a whole Worldtree. Two things stop it: the corner landmarks are held back far enough from the edges to stay clear of the panel, and the panel fades down to a ghost whenever the player walks in behind it, fading straight back in on the way out. It stays on screen and stays tappable the whole time — it is the map button as well as the map.

The corner where the Worldtree grows has no name on the map until the tree is found. Before that it looks like plain wilderness. Walk close enough to see the tree and the whole region turns its own colour and is named **The Worldtree Reach**. No road runs into it, as the old verse says: the Reach is trackless ground, and the only way to the tree is to leave the roads and walk.

**The Fallow**, in the opposite corner, is on the chart from the first minute — and it is the emptiest thing on it. Thirty tiles of plain grass, flecked all over with the brown of bare earth, with no road laid to it or through it, not one tree standing in it, and nothing hostile nesting in it. Somewhere in the middle of that grass is a small square of turned brown earth with a clean margin all round: **the Waiting Ground**. Walk into it and it names itself and goes on the map for good. That is where the Worldtree Seed goes.

## The Worldtree Seed

The old texts promise a ladder hidden inside the Worldtree's trunk, and they are right. What they leave out — because nobody who wrote them ever got that far — is that the ladder is *part of the tree*. Burn the tree and the ladder goes up with it. The fire leaves ash, one seed, and, for the first time in the history of either country, no road at all between the realm and the Cloudlands.

So the seed is the way up. Push it into any ground that will take it and a Worldtree comes up in seconds with a ladder running up the inside of the trunk; press E at the trunk to climb. That much works anywhere.

What does not work anywhere is *taking*. A Worldtree cannot begin in its own ash, and it will not hold in stone, under another tree's shadow, or beside a worn road. It wants bare living earth that has never carried a tree, never been paved and never been sown, and there is exactly one plot of that left: the Waiting Ground, in the heart of the Fallow, in the far southeast corner.

That gives the player two ways through the ending, and the game is explicit about both:

- **Plant it anywhere.** You get your ladder and your climb, and the boundary stays burned. The keepers of the Cloudlands are hostile, and Zeus rises as the Twelve Olympians and has to be beaten mask by mask. Win and his bolts become your arrows.
- **Plant it in the Waiting Ground.** The Worldtree takes, the boundary is mended, and Zeus has nothing left to quarrel about. He meets you on the temple steps and gives you the lightning without a blow being struck.

**Choosing peace gives up the other ending.** A Zeus with no quarrel never rises, and a Zeus who never rises cannot be thrown down — so a run that mends the Worldtree can never earn the Olympus-defeated ending or its analytics event. The two are mutually exclusive by design, and the game says so out loud at the moment the tree takes, rather than letting a player discover it afterwards.

Nothing is lost by guessing wrong. A Worldtree that never took comes up as easily as it went in — press P at the trunk, or use the relic shelf in the inventory on a phone — and the whole tree folds back down into the seed, ladder and all. The way up closes until you plant it again, which is the point: the seed is meant to be carried until it is somewhere worth leaving. Each wrong planting also buys a plainer clue — the tree's own restlessness, then a direction, then the name of the country, then a description of the plot — and after three misses the Waiting Ground is marked on the chart outright. A player can be delayed. They cannot be stranded.

## Development documents

- `docs/art-direction/ART_DIRECTION_REVIEW.md` - review of how the whole game looks, art rules, work order, and concept pictures.
- `docs/art-direction/MONSTER_ROSTER.md` - complete hostile roster and the production art identity for every monster and boss.
- `docs/development-binder/BINDER_MASTER.md` - plan for the printed binder and a guide to the current story.
- `RECOMMENDATIONS.md` - an older review with ideas for the game. It is not the official current story.

## Lore access in the game

The main lore library is at Merlin's Hut near Ing Castle. Three of its entries are hidden at the start and only join the shelf once the player has earned them in the world — by reading the tapestry in Ing Castle, or by taking the seed out of the Worldtree's ashes. *The Fallow* is on the shelf from the first minute, and it says what that empty corner of the map is for. Players also learn the story from the opening, the Lady of the Lake and Merlin quests, boss speeches and endings, Blue Gems, caves, the Worldtree, Cloudlands, special item descriptions, maps, and landmarks.

## Project authority

Luca is the creator, owner, and project leader of Ingoizer's World. Design pages may include new ideas and concept art. They are not official story or promised features unless Luca approves them.

## License

The project does not currently list a public license. The project owner keeps all rights unless a license is added later.
