# Ingoizer's World Development Binder

## A Clear Guide to the Game, Its Story, and Future Ideas

**Document status:** Working master  
**Prepared for:** Luca, Creator, Owner and Product Lead  
**Current build reviewed:** Repository `main` at commit `ab1b48f`  
**Review date:** August 2026

> IMPORTANT: This binder keeps the current game separate from new ideas. Luca makes the final choices about the game, story, characters, worlds, art, and releases. An idea becomes official only when Luca approves it.

<!-- PAGEBREAK -->

# Binder Table of Contents

Use numbered divider tabs in the printed binder. New pages can be added behind a tab without changing the tab numbers.

| Tab | Section | Primary contents | Status today |
|---|---|---|---|
| 00 | How to Use This Binder | Who decides, page labels, update rules, and page list | In this guide |
| 01 | Luca's Game Vision | What Luca wants players to feel and what must stay special | Good next page to make |
| 02 | The Game Right Now | README, game link, controls, features, and known facts | README is ready |
| 03 | The Story Right Now | Official story, where players learn it, exact lore, items, and open questions | In this guide |
| 04 | Version 3.2 Proposal | Cover, goals, ideas, choices, and Luca's approvals | Cover and pictures exist |
| 05 | Art Style Guide | Colors, pixel-art rules, character rules, world rules, and concept pictures | Strong draft exists |
| 06 | Worlds and Maps | Main world, caves, Cloudlands, maps, exploration, and fog of war | Pictures exist; rules still needed |
| 07 | Characters and Creatures | Ingoizer, hero choices, people, animals, monsters, and bosses | Current list and new pictures exist |
| 08 | Game Rules | Fighting, elements, items, friends, shops, quests, rewards, and progress | The current code tells us the facts |
| 09 | Screens and Controls | Start screen, inventory, shops, HUD, maps, easy-to-use options, and mobile | Version 3.2 pictures exist |
| 10 | How the Code Works | Sixth-grade diagrams, game parts, memory, worlds, and future saves | In this guide |
| 11 | Building and Testing a Release | What is included, work steps, tests, and bug list | Good next page to make |
| 12 | Luca's Decisions | Approved ideas, rejected ideas, story changes, and release notes | Blank form below |
| 13 | Creator's Workshop | Blank pages for ideas, story, lore, characters, worlds, quests, screens, tests, and releases | Printable master pages included |
| A | Extra Information | README, controls, source list, word list, and old reviews | README is included |

## How to put the binder together

1. Place the illustrated Development Binder cover in the front sleeve.
2. Add this master document behind Tab 00.
3. Place the current README behind Tab 02.
4. Place the Current Lore Compendium behind Tab 03.
5. Place the Version 3.2 proposal cover and proposal pages behind Tab 04.
6. Print the art review and concept pictures behind Tabs 05-09 using the page list below.
7. Place the illustrated “How the Game Works” chapter behind Tab 10.
8. Keep Luca's decision pages and release pages easy to replace. They will change often.
9. Place the blank Creator's Workshop masters behind Tab 13. Keep one clean copy of every master and print a copy before writing on it.

## Page labels

Put one of these labels on every page or design:

- **CURRENT:** This is in the playable game now and was checked in the code.
- **PROPOSED:** This is a new idea waiting for Luca's choice.
- **APPROVED:** Luca said yes, but it may not be built yet.
- **IMPLEMENTED:** The approved idea is now in the game.
- **SUPERSEDED:** A newer choice replaced this one. Keep it for history.
- **REJECTED:** Luca thought about this idea and chose not to use it.

## Luca's decision form

**Decision ID:** IW-YYYY-NNN  
**Topic:**  
**Choices considered:**  
**Luca's decision:**  
**How this changes the story or game:**  
**Release it belongs in:**  
**Date approved:**  
**Building status:**  
**Files or pictures affected:**

# How to Use This Binder

## Luca is the game leader

Ingoizer's World is Luca's original creation. This binder keeps three things organized: the game as it is now, ideas for the future, and Luca's choices. Keep those three groups clearly labeled.

Luca must approve these choices:

- The identity, history and role of Ingoizer.
- Official story, places, names, and character relationships.
- What goes into each release and what gets built first.
- Final character, monster, boss and environment designs.
- Changes to difficulty, progression, rewards and endings.
- Public descriptions, logos, credits, and ownership words.

## What to put at the top of a new page

Each new binder page should show:

- Section and document title.
- Its page label: Current, Proposed, Approved, Implemented, Superseded, or Rejected.
- The game version or build that was checked.
- Who made the page.
- The date it was updated.
- A decision number if Luca needs to approve it.

## Where the current pages and pictures are

| Page or picture | File location | Binder tab |
|---|---|---|
| Development binder cover | `output/pdf/ingoizers-world-development-binder-cover.pdf` | Front sleeve |
| Version 3.2 proposal cover | `output/pdf/ingoizers-world-v3.2-design-proposal-cover.pdf` | 04 |
| Whole-game art review | `docs/art-direction/ART_DIRECTION_REVIEW.md` | 05 |
| Start and character-selection concept | `docs/art-direction/concepts/start-character-select-concept.png` | 07 and 09 |
| Main, cave and Cloudlands fog maps | `docs/art-direction/concepts/*-fog-map-concept.png` | 06 and 09 |
| Inventory and shop concept | `docs/art-direction/concepts/inventory-shop-concept.png` | 09 |
| Main-world, cave and Cloudlands environments | `docs/art-direction/concepts/*-environment-concept.png` and `green-meadow-concept.png` | 05 and 06 |
| Monster size-and-shape picture | `docs/art-direction/concepts/monster-roster-concept.png` | 07 |
| Sixth-grade guide to how the game works | This master, “How the Game Works” chapter | 10 |
| Current README | `README.md` | 02 and Appendix A |
| Older game and code review | `RECOMMENDATIONS.md` | Appendix A; label it as old |

## Helpful pages to make next

1. **One-page game vision:** Luca explains what the game is, who it is for, and what must always stay special.
2. **Version 3.2 summary:** what the release should do, what it will not do, and which ideas need Luca's approval.
3. **Who is Ingoizer?:** one page comparing the possible answers.
4. **Release test sheet:** clear checks for fog of war, character selection, and the new inventory.
5. **Current build card:** date, game link, code version, supported devices, and finished parts of the adventure.
6. **Story change list:** every story change Luca approves, while keeping the older version for history.
7. **Playtest notes:** who played, when they played, what happened, how serious each problem is, and Luca's choice.
8. **Art list:** every character, monster, tile set, icon, and screen, labeled Final, Proposed, or Rejected.

# The Story in the Current Game

## What this section includes

This section explains the story that players can learn in the game right now. It keeps official story facts separate from game rules, clues in the world, and older ideas.

**Main files checked:**

- `js/constants.js`: Merlin's 15 lore pages, world names, items, enemies, bosses, Olympians, and riddles.
- `js/game.js`: the opening story, quests, discoveries, boss speeches, changes, and endings.
- `js/world.js`: places, maps, landmarks, and names shown in the world.
- `js/ui.js`: the Ancient Lore screen, item screens, riddles, and endings.
- `index.html`: the title, subtitle, controls, and named screens.

> STORY RULE: Story text in the playable game is official right now. Instructions, random riddles, and simple item rules may not be story facts. `RECOMMENDATIONS.md` and the new concept art are ideas, not official story.

## The current story in one page

**Ingoizer is a family name, not a first name.** The current game shows one young knight of that house, from Green Meadow. He wakes up with a rusty sword and bow. His quest is to find five Blue Gems. Ancient elemental spirits made the gems in Crystal Lake. A great disaster scattered them. The Black Knight wants the gems. He took over Ing Castle and made the land afraid.

The house of Ingoizer carries two readings of its own name. One says the line is cursed: an Ingoizer is born into danger and never gets a quiet life. The other says the line is a promise: only an Ingoizer will be standing when the world needs saving. Both are true, and every generation someone has to pick a side.

The five gems awaken Fire, Water, Ice, Lightning, and Earth. Ingoizer needs all five to face the Black Knight. **The Black Knight was an Ingoizer too.** He read the name as a curse, walked out on his family and his destiny, and came back years later to take Ing Castle. When he falls, the shroud lifts from the castle and the drape he kept over the north wall of the great hall comes down. Underneath it is a tapestry: the family tree of the house of Ingoizer, with a brother beside the hero's father whom nobody ever mentioned. The Black Knight was Ingoizer's uncle.

**The Green Knight and the cave guardians are the Black Knight's sons**, and so Ingoizer's cousins. The Green Knight holds the southern woods and wants Ingoizer dead for killing his father - not the realm, not the gems, just him. His brothers, the Stone Warden and the Crystal Titan, dug the four caves themselves because they wanted somewhere with less sun, and have guarded that dark ever since. Beating the Black Knight reveals the Green Knight's Domain and two Green Gems.

At Crystal Lake, the Lady of the Lake tests Ingoizer; he must bring back Excalibur's jeweled sheath. **She keeps both waters** - the lake and the Fountain of Youth - and it is her voice that asks the fountain's riddles. Merlin was forced away from Ing Castle. He asks Ingoizer to find his wand, then gives him the Enchanter's Mallet.

The Worldtree stands in the far northeast. It is older than the mountains and touches two worlds, and there is a ladder inside its trunk that leads to the Cloudlands, a land of hard cloud and white marble. A fire arrow burns the tree down - and the ladder is part of the tree, so it burns too. The fire leaves ash and one seed, and until that seed is planted there is no way up at all. Plant it anywhere and a Worldtree comes up with a ladder in it and the climb is open again. Strong keepers guard it. Beating five keepers wakes the Temple of Olympus, and Zeus comes out with two complaints: that Ingoizer burned down the boundary stone between their two countries, and that a mortal has no business standing in the Cloudlands at all. He then fights as the Twelve Olympians, one after another. When all 12 masks are gone, Ingoizer can fight Zeus himself. Winning turns all of Ingoizer's arrows into lightning bolts.

**Where the seed goes decides the ending.** Any planting opens the climb, but only one plot will *hold* a Worldtree: the Waiting Ground, a square of turned brown earth in the middle of the Fallow, in the far southeast corner. The ash it came out of is the one place it is certain to fail - a Worldtree cannot begin in the end of itself. Planted in the Waiting Ground it takes, and it is nowhere near where the old one stood, and that does not matter: a Worldtree is a knot, and a knot holds wherever it is tied. The boundary is mended, Zeus's first complaint stops being true and his second one goes with it, and he grants the lightning freely and meets Ingoizer on the temple steps instead of fighting him. Planted anywhere else the tree stands and climbs but never settles - Ingoizer gets his ladder and a hostile Cloudlands, and can take hold of the trunk and lift the whole tree back out to try again somewhere else.

**The two endings are exclusive, on purpose.** A Zeus with no quarrel never rises, and a Zeus who never rises cannot be thrown down, so a run that mends the Worldtree can never earn the Olympus-defeated ending or its analytics event. The game says this out loud at the moment the tree takes, and the lore pages say it before that, so the choice is made knowingly rather than discovered afterwards.

## Where players learn the story

| Story source | Where it is | What the player does | What the player learns |
|---|---|---|---|
| Opening words | Green Meadow starting point | Choose Begin Adventure | Ingoizer wakes up, must find five gems, learns about Ing Castle and animals |
| Ancient Lore library | Merlin's Hut near Ing Castle | Press E at the hut | 16 lore pages about the main story and Cloudlands; 3 stay hidden until earned |
| Lady of the Lake | Island at Crystal Lake | Speak to the Lady | Excalibur, its sheath, the guardian troll and worthiness test |
| Merlin | Merlin's Swamp | Speak to Merlin | His exile, missing wand and Enchanter's Mallet quest |
| Blue Gems | Random places and monster drops | Pick up a gem | A new element awakens; five gems are needed at Ing Castle |
| Black Knight encounter | Outside Ing Castle | Approach with all five Blue Gems | His claim to the gems and the battle for the realm |
| Family tapestry | North wall of Ing Castle's great hall | Beat the Black Knight, then walk back in and press E | The Black Knight was Ingoizer's uncle; the Green Knight and cave guardians are his sons |
| Greenlands reveal | South after the Black Knight fight | Beat the Black Knight | The Green Knight, two Green Gems, and a new land |
| Green Knight's challenge | Green Knight's Domain | Approach with both Green Gems | He is the Black Knight's son and wants revenge for his father |
| Cave guardian's challenge | NW and NE cave boss lairs | Approach the lair | The guardians dug the caves to be rid of the sun; after the tapestry they name Ingoizer as their cousin |
| Cave discoveries | Four cave entrances and their rooms | Clear the obstacle, enter, and reach treasure or a boss | Underground guards, Purple Gems, and special items |
| Hidden base | Northwest wall inside Ing Castle | Use Ice Gem nearby, then climb | Ingozer's Armour, Bow of Arrow Strength and Rainbow Gem cache |
| Fountain of Youth | A set area near the meadow and village | Answer three random riddles | The Lady of the Lake keeps this water too; the lake tests courage, the fountain tests wit |
| Worldtree | Far northeast | Unlock Fire, approach and shoot a fire arrow | Tree between worlds, and a non-mortal ladder that is part of it - burning the tree closes the route and leaves ash and one seed |
| The Waiting Ground | Middle of the Fallow, far southeast | Walk into it | A plot of bare earth somebody has kept clear of trees, stone and road for longer than anyone remembers, and the reason why |
| Worldtree Seed | Anywhere on the surface; correctly in the Waiting Ground, far southeast | Press P, or use the seed in the inventory | Any planting grows a Worldtree with a ladder in it and reopens the Cloudlands; only the Waiting Ground holds one. A tree that never took folds back into the seed, and every miss buys a plainer clue |
| Cloudlands | Up the ladder in whatever Worldtree is standing | Plant the seed, then climb | Sky country, keepers, Temple of Olympus and its challenge |
| Olympian encounter | Temple of Olympus | Defeat five keepers and approach temple | Zeus's two grievances, twelve masks, his true form and divine reward |
| Peace with Zeus | Temple of Olympus, after replanting the Worldtree | Plant the seed in the Waiting Ground, then climb | Mending the Worldtree answers both grievances, wherever it is mended; Zeus grants the lightning without a fight - and the Olympian fight is given up for the run |
| Maps and place names | Small map, world map, and area entrances | Explore or press M | Names and locations in the three world layers |
| Inventory and pickups | Throughout all realms | Obtain or inspect an item | Short histories and powers of relics, gems, weapons and armor |
| Victory screens | Green Knight, Zeus, and the peaceful Olympus ending | Defeat the boss, or make peace | Champion status, freedom of the land and mastery of the realms |

# Merlin's Ancient Lore Library

The library holds 16 entries at Merlin's Hut near Ing Castle. The player walks to the hut, presses E, and uses Previous and Next. 3 of the entries are hidden at the start of the game and only appear on the shelf once the player has earned them in the world; they are marked **Hidden until earned** below. The exact words come from `js/constants.js`. The screen that shows them is built in `js/ui.js`.

> LUCA'S WORDS: The lore passages below are kept exactly as they appear in the current game. Some words may be above sixth-grade level because they are Luca's story words. They should not be simplified unless Luca chooses to edit them.

## 1. The Legend of Ingoizer

**Learned at:** Merlin's Hut.  
**Why it matters:** Establishes that Ingoizer is a family name carried by a long line, not a single hero's first name, and states the main quest.

> Ingoizer is not a first name. It is a last one. For as long as the realm has kept records there have been Ingoizers, and every one of them was born to the same strange inheritance: trouble finds them, and they are the only ones who can end it. In an age of shadow and fading hope the newest of that line woke in the humble Green Meadow with a rusty sword, a rusty bow, and no idea what his own surname meant. Destiny chose him to reclaim the stolen Blue Gems and restore peace to a land gripped by evil. His journey would take him through treacherous forests, scorching deserts, and haunted ruins — but Ingoizer would not falter, for the fate of the realm rested upon his shoulders.

## 2. The House of Ingoizer

**Learned at:** Merlin's Hut.  
**Why it matters:** Explains the two readings of the family name - curse or promise - which is the disagreement the whole Black Knight story rests on.

> The old houses of the realm each carry a word. The house of Ingoizer carries two, and they contradict each other. Some of the family read the line as a curse: an Ingoizer is born into danger, buries more of his kin than any man should, and is never allowed a quiet life. Others read exactly the same line as a promise: only an Ingoizer will be standing when the world needs saving, because only an Ingoizer is made for it. Both readings are true. That is the whole difficulty. Every generation someone in the family must decide which half they believe — and not everyone has decided the way you would hope.

## 3. The Five Blue Gems

**Learned at:** Merlin's Hut; repeated in the message shown when a gem is collected.  
**Why it matters:** Explains who made the gems, what they do, and why they are spread across the land.

> Long ago, five Blue Gems of immense power were forged in the heart of Crystal Lake by the ancient elemental spirits. Each gem holds the essence of a primal force — Fire, Water, Ice, Lightning, and Earth. Scattered across the land by a great cataclysm, the gems call out to those brave enough to seek them. When united, they grant the bearer mastery over all five elements and the strength to challenge even the darkest of foes. Monsters who have absorbed their energy may carry gem fragments within.

## 4. Merlin the Wizard

**Learned at:** Merlin's Hut; reinforced by Merlin's quest in the swamp.  
**Why it matters:** Explains Merlin's past, why he lives in the swamp, why his magic is weaker, and what his mallet does.

> I, Merlin, have walked these lands for centuries, watching kingdoms rise and fall. My swamp may seem humble, but it is steeped in ancient magic. I once served as advisor to the great kings of Ing Castle, until the Black Knight drove me into exile. My Enchanter's Mallet, a relic of the old world, can imbue weapons and armor with elemental fury. Though my powers have waned without my wand, my knowledge endures. Seek wisdom, young Ingoizer, for brute strength alone will not save the realm.

## 5. The Black Knight

**Learned at:** Merlin's Hut; reinforced outside Ing Castle.  
**Why it matters:** Keeps his real name a mystery but says plainly that he left a family and a destiny behind him. It sets up the tapestry without spoiling it.

> None know the Black Knight's true name — only that he was somebody's son before he was anybody's terror. He was not born in shadow. He walked into it, on a night he decided that the name he had been given was a curse and nothing more, and that a cursed man owes the world nothing. He left his family, his house and his destiny behind him in one stride, and by morning nobody could say where he had gone. When the gems were scattered he came back clad in armor darker than midnight, with eyes that glow like embers of hate. He seized Ing Castle and claimed the gems as his own. He commands legions of monsters and dark magic that grows stronger the longer the gems remain apart. Only one who carries all five gems can force him from the shadows to face battle.

## 6. Ing Castle

**Learned at:** Merlin's Hut; reinforced by the castle landmark and boss approach.  
**Why it matters:** Explains what the castle used to be and points at the covered tapestry on the north wall of the great hall.

> Ing Castle once stood as a beacon of hope and justice, home to noble kings who ruled with wisdom and compassion. Its walls were built from enchanted stone, said to be unbreakable by mortal weapons. When the Black Knight conquered the castle, a dark shroud fell over its towers, and the once-golden banners turned to ash. The castle gates remain sealed to all but those who carry the five Blue Gems. Beyond those gates, the Black Knight waits, drawing power from the very stones that once protected the realm. The great hall keeps one thing he never took down: an old woven family tree on the north wall, hung there long before he came, and covered over the day he did.

## 7. The Tapestry in the Great Hall

**Hidden until earned.**  
**Learned at:** Merlin's Hut, but only after the tapestry has been read inside Ing Castle.  
**Why it matters:** The reveal: the Black Knight was Ingoizer's uncle. Hidden until the player has seen it in the world.

> The Black Knight is dead and the shroud over Ing Castle has lifted, and the thing he kept covered all these years is only a tapestry. It is a family tree. It is your family tree — the same names, the same branches, stitched in the same order your own house has recited them for generations — and the branch beside your father's is a brother nobody ever mentioned to you. The armour you have just left cooling on the flagstones belongs to your uncle. He believed the name Ingoizer was a curse, so he left the family and went looking for a destiny he liked better. You believed it was a promise, so you stayed. That is the only difference there has ever been between the two of you.

## 8. The Sons of the Black Knight

**Hidden until earned.**  
**Learned at:** Merlin's Hut, but only after the tapestry has been read inside Ing Castle.  
**Why it matters:** The Green Knight and the cave guardians are the Black Knight's sons and Ingoizer's cousins, and the guardians dug the caves themselves.

> The tapestry does not stop at your uncle. It goes on, into a row of sons — your cousins, every one of them, and you have met most of them already with a sword in your hand. Their father raised them underground and out of sight, and they grew up hating the sun that had shone on the family that let him leave. The eldest, the Green Knight, took the southern woods and holds them still; he does not want the realm, he wants the man who killed his father. His brothers went down instead of out. The Stone Warden and the Crystal Titan dug the four caves themselves, hollow by hollow, for no better reason than that a cave has no sky in it, and they have guarded their own dark ever since. They are not monsters that wandered in. They are the family, still refusing the name.

## 9. The Lady of the Lake

**Learned at:** Merlin's Hut; enacted through the Crystal Lake quest and the Fountain of Youth riddles.  
**Why it matters:** Explains who the Lady is, how Excalibur is earned, and states that she keeps the fountain as well as the lake.

> At the heart of Crystal Lake dwells the Lady of the Lake, an ethereal guardian who has watched over Excalibur since time immemorial. She is neither mortal nor spirit, but something in between — a keeper of ancient promises. The legendary sword Excalibur, forged by gods and tempered in starlight, rests in her care. She will bestow it only upon a warrior who proves their worth by recovering its jewel-encrusted sheath from the fearsome Sheath Guardian Troll that lurks in the Dark Forest. Nor is the lake her only water. The Fountain of Youth answers to her as well — the same hand keeps both, one to test a warrior's courage and one to test their wit — and when the fountain asks you a riddle, it is the Lady asking.

## 10. The Elemental Powers

**Learned at:** Merlin's Hut; reinforced whenever a Blue Gem is collected.  
**Why it matters:** Explains the five elements and what each one does in a fight.

> The five elements — Fire, Water, Ice, Lightning, and Earth — are the fundamental forces that shaped this world. Fire burns with untamed fury, consuming all in its path. Water heals and cleanses, but strikes with the force of crashing waves. Ice freezes foes in their tracks, cold and merciless. Lightning strikes with devastating precision, the wrath of storms made manifest. Earth, the most ancient power, shakes the ground itself, stunning all who stand upon it. As Ingoizer collects the Blue Gems, these powers awaken within him. Master them all, and no enemy shall stand.

## 11. The Lands of the Realm

**Learned at:** Merlin's Hut; reinforced by map and zone-name displays.  
**Why it matters:** Names the main lands, notes that the four caves were dug on purpose rather than formed by nature, and points at the Fallow as the one country nothing has ever happened to.

> The realm stretches from the peaceful Green Meadow in the west to the dread Darklands in the east. Camelot Village shelters honest folk and merchants. The Dark Forest hides dangers and treasures in equal measure. The Scorched Wastes bake under an unforgiving sun, while the Dragon Mountains pierce the clouds with jagged peaks. Merlin's Swamp bubbles with arcane energy, and the Ancient Ruins hold secrets of civilizations long forgotten. Beneath all of it run four caves that no river cut and no earthquake opened — those were dug, by hands, on purpose. In the far southeast, past the last of the Darklands, lies the emptiest country of the lot: the Fallow, an acre of plain grass and bare brown earth where nothing has ever been built, felled or sown. Nobody remembers deciding to leave it alone. Everybody has. Each land harbors unique monsters and challenges for those who dare explore.

## 12. The Worldtree

**Learned at:** Merlin's Hut; hinted again when Fire unlocks; discovered in the far northeast.  
**Why it matters:** Explains the tree and the fire-arrow key, and delivers the twist the old texts miss: the ladder is part of the tree, so burning it closes the only road between the two countries. All the fire leaves is ash and one seed, and the seed is now the way up.

> In the farthest northeast corner of the realm, where no road runs and no monster dares nest, there stands a single ancient tree. It was old when the mountains were young. The elders called it the Worldtree, for its roots drink from this world while its crown drinks from another. No axe has ever marked it and no storm has ever bent it — but the old texts whisper of one key: fire loosed from a bowstring. Set a fire arrow into the Worldtree, and what the trunk conceals will finally be laid bare. A ladder. And it does not go down. What the texts do not say, because the people who wrote them never got that far, is that the ladder is not hidden in the tree. It is part of the tree. Burn the tree and you burn the ladder with it, and for the first time in the history of either country there will be no road between them at all. All the fire leaves is ash and one seed. That seed is now the only way up, and where it goes decides who is waiting at the top. Do not lose it — and do not waste it on the ash it came out of. A Worldtree does not begin where one ended.

## 13. The Worldtree Seed

**Hidden until earned.**  
**Learned at:** Merlin's Hut, but only after the Worldtree has burned and the seed is in hand.  
**Why it matters:** Explains that any planting grows a Worldtree with a ladder in it, so the Cloudlands open wherever the seed goes; that only the Waiting Ground in the Fallow will hold one; that a tree which never took folds back into the seed to be carried on; and that mending the boundary means giving up the fight with Zeus for good.

> One seed came out of the ash, no bigger than a thumbnail and far heavier than it has any right to be. It is a Worldtree, entire, waiting — and with the old tree burned it is the only road left between this country and the one above it. Push it into any ground that will take it and a Worldtree comes up in seconds with a ladder running up the inside of the trunk, and the Cloudlands are open again. That much the seed will do anywhere. What it will not do anywhere is take. A Worldtree cannot begin in the end of itself, so the ash is the one place it is certain to fail; nor will it hold in stone, or under another tree's shadow, or beside a road that people have worn. It wants the opposite of all of that — bare living earth that has never carried a tree, never been paved, never been built on, never been sown. There is exactly one acre of it left, in the far southeast corner of the realm, and the maps have called it the Fallow since before there were maps. Somewhere in the middle of it, in plain grass with no tree near it and no road within a long walk, there is a small square of turned brown earth. That is the Waiting Ground. A tree planted anywhere else stands, and climbs, and never quite settles — take hold of the trunk and the whole thing comes up in your hands, ladder and all, and folds back down into the seed for you to carry on. A tree planted in the Waiting Ground stays. And when it stays, the boundary you burned is mended, and the gods above have nothing left to quarrel with you about. Choose knowing this: a king with no quarrel is a king you will never get to fight.

## 14. The Fallow

**Learned at:** Merlin's Hut, from the first minute; the Fallow itself is named on the map from the start.  
**Why it matters:** Says what the empty southeast corner of the map is for, and describes the plot of bare earth in the middle of it - the clue a player can find before they ever need it.

> Every other country in the realm is the shape of what happened to it. The meadow was grazed, the forest grew, the Wastes burned, the Ruins fell down. The Fallow is the shape of what did not happen to it. It is thirty miles of plain grass in the far southeast corner, scraped here and there with bare brown earth, and in all the years anybody has kept records nothing has ever been raised there, cut down there, or driven across it. No road was ever laid to it and no road was ever laid through it. Ask a farmer why and you will be told that ground is fallow, which only means it is resting; ask what it is resting for, and the answer stops. The truth is older than the asking. A Worldtree was going to be needed one day, and a Worldtree cannot be started in ash or stone or another tree's shadow. So a plot was left bare and it has been kept bare ever since, and in the middle of the Fallow you can still see it — a small square of turned earth with clean grass all round it, waiting for the one thing it was turned for.

## 15. The Cloudlands

**Learned at:** Merlin's Hut; confirmed when climbing the Worldtree ladder.  
**Why it matters:** Introduces the sky world and states that mortals do not belong there - Zeus's second grievance.

> Above the sky there is another country. Islands of hardened cloud drift over a blue abyss, joined by bridges of vapour, and at their heart stands a temple of white marble that no mortal mason ever raised. This is the Cloudlands. Nothing here was built for you; nothing here expects you; there is no door in the whole country that a mortal was ever meant to walk through. Its guardians — storm harpies, golden griffins, giants of cloud and men of bronze — make the deepest cave troll look like a village nuisance. Slay five of the Cloudlands' keepers and the temple will wake. Something in it has been waiting a very long time for a mortal rude enough to climb.

## 16. The Twelve Olympians

**Learned at:** Merlin's Hut; demonstrated in the Temple of Olympus encounter.  
**Why it matters:** Explains Zeus's two grievances, the 12-part boss fight, and that replanting the Worldtree is the other way through - and states plainly that the two endings are exclusive: a Zeus who never rises can never be thrown down.

> Zeus has two complaints against you and he will make both of them before he makes a fist. The first is the Worldtree: it was his family's boundary stone as much as this realm's, and you burned it down to make yourself a staircase. The second is simpler — you are standing in his country, and mortals do not belong in the Cloudlands. Then he fights, and he does not fight as men fight. When he is roused he wears his family like armour: strike him and he is Hera; strike Hera and he is Poseidon, then Demeter, Athena, Apollo, Artemis, Ares, Aphrodite, Hephaestus, Hermes, Dionysus — twelve faces, twelve furies, and not one of them can be slain, for you cannot kill a god by killing the mask. Endure all twelve and the masks run out. What stands before you then is Zeus himself, and Zeus himself can bleed. Break him, and his bolts become your arrows. There is another way, and it is not a sword. Answer the first complaint before you ever climb — put the Worldtree back in ground that holds it — and the second one dies with it. But understand what you are choosing. A Zeus with no quarrel does not rise, and a Zeus who does not rise cannot be thrown down. Take the peace and the twelve masks stay in the temple, and no run of yours will ever have beaten the King of Olympus. Take the fight and you must beat all twelve to reach him. The realm keeps count of one or the other. It has never had to keep count of both.

# Story Learned by Playing

## Opening sequence

**Where and when:** Choose Begin Adventure; Ingoizer starts in Green Meadow.  
**What players learn:** Ingoizer wakes with a rusty sword and bow. Five Blue Gems can be found in the world or carried by monsters. A dark enemy waits at Ing Castle. Fire can light arrows. Animals are safe and may join Ingoizer after he gives them apples.

The opening is the only story part every player must see. Merlin's library can be missed. Important game directions must still make sense if a player never finds the hut.

## Lady of the Lake and Excalibur

**Where and when:** The Lady stands on the island at Crystal Lake, near tile 50,68. Press E to speak.  
**Quest steps:** Meet the Lady -> beat the Sheath Guardian in Dark Forest -> take the jeweled sheath -> return to the Lady -> receive Excalibur, which is equipped automatically.

**Story facts:** The Lady has the mightiest blade ever forged. Excalibur is the famous sword of kings. Ingoizer proves he is worthy by showing courage. The magical sheath makes weapons stronger. The troll guards the test.

## Merlin, his wand and the Enchanter's Mallet

**Where and when:** Merlin stands in Merlin's Swamp near tile 75,75. His old hut is near Ing Castle around tile 158,58.  
**Quest steps:** Speak to Merlin -> get the wand from the hut -> return the wand -> receive the Enchanter's Mallet.

**Story facts:** Merlin calls himself the great wizard of the swamps. Losing his wand made him weaker. The hut near Ing Castle was his home. The Enchanter's Mallet can put elemental power into weapons and armor.

## Blue Gems and elemental awakening

**Where and when:** Three gems appear in randomly chosen surface lands. Up to two more can be dropped by monsters carrying gems.  
**What players learn:** Each gem unlocks the next element. After finding all five, Ingoizer is sent to Ing Castle. Unlocking Fire also brings back a verse about the Worldtree and the fire-arrow answer.

## Black Knight and the fall of Ing Castle

**Where and when:** Walk to the outside gate of Ing Castle with all five Blue Gems.  
**What he says:** The Black Knight says the gems belong to him and threatens Ingoizer.  
**What winning does:** He drops the Dark Knight's Crest. Ingoizer's maximum health goes up. The shroud lifts from Ing Castle. The Green Knight's Domain appears in the south. The game now tells the player to walk back into the great hall and read the tapestry.

The Black Knight's given name is still not said out loud, and Luca has kept it that way on purpose. What the game does say is where he came from: he was an Ingoizer. He decided the family name was a curse, walked out on his house and his destiny, and came back for the castle and the gems. The older "Sir Mordain" idea is still not official story.

## The family tapestry in the great hall

**Where and when:** Walk into Ing Castle after the Black Knight is beaten and press E at the north wall of the great hall.  
**What players learn:** The black drape the Black Knight hung over the wall falls away. Underneath is a woven family tree - the tree of the house of Ingoizer, the same names the hero has had recited to him since he could walk. Beside his father is a brother nobody ever mentioned. The Black Knight was his uncle. Below that brother is a row of sons: the Green Knight, and the wardens who dug the caves. They are all cousins.

**What it unlocks:** Two lore entries appear on Merlin's shelf - *The Tapestry in the Great Hall* and *The Sons of the Black Knight* - and the cave guardians start speaking to Ingoizer as family instead of as an intruder.

## Green Knight's Domain

**Where and when:** The southern land appears after the Black Knight is beaten. Find both Green Gems and walk to the Green Castle.  
**What players learn:** Legends tell of the Green Knight and strong Green Gems. One gem raises attack. The other raises defense. The Green Knight is the Black Knight's eldest son. He says he has known Ingoizer's name his whole life, that the man cut down at Ing Castle was his father, and that he does not want the realm or the gems - he wants Ingoizer. Winning gives Ingoizer the Magic Charm.

The ending is deliberately not a clean triumph any more. The man in the green armour was a cousin, fighting for a father who had walked out on the family before either of them was born. Two Ingoizers have fallen to a third, and the name outlives all of them. The older "honourable test" idea is still not built.

## The four caves

**Locations and access:**

- Southwest Cave: blocked by trees; Fire clears the entrance; maze and treasure.
- Southeast Cave: blocked by eternal flame; Water clears the entrance; maze and Purple Gem of Vitality.
- Northwest Cave: blocked by water; Ice clears the entrance; Stone Warden and Purple Gem of Fury.
- Northeast Cave: blocked by rocks; Earth clears the entrance; Crystal Titan, Purple Gem of Fortification and Titan's Gauntlet.

**What the story says now:** The four caves were dug, by hand, on purpose. The Stone Warden and the Crystal Titan are the Black Knight's younger sons. Their father raised them underground and out of sight, and they cut these tunnels themselves because a cave has no sky in it and they wanted somewhere with less sun. That is what connects all four caves: the same two brothers made them.

Their spoken lines change once the player has read the tapestry. Before it, they only complain that Ingoizer has brought daylight in with him. After it, they call him cousin and tell him to get out of their dark.

**Treasure chests:** Both maze caves keep a chest at the centre of the maze, and both boss caves keep the guardian's own chest at the back of his lair - shut while he lives, thrown open when he falls. The chest art is hand-authored pixel art in `js/sprites.js` (`TreasureChestSprite`), drawn the same way Ingoizer is, with a closed frame and an open one. The same chest is used for the hoard in the hidden base above Ing Castle.

## Fountain of Youth

**Where and when:** The fountain appears in one of several planned spots near the meadow and village. Interact with it and answer three random riddles correctly.  
**What players learn:** The Lady of the Lake keeps both waters. The first time Ingoizer uses the fountain, the voice that comes out of it is hers: at the lake she asks him for courage, here she asks him for wit. The fountain rewards wisdom, goes quiet after a wrong answer, and heals the player after all three right answers.

The riddle screen has always said “The Lady of the Lake.” That is now official story rather than a reused screen. The game still does not say why the fountain's exact spot can change.

## Hidden base above Ing Castle

**Where and when:** Use the Ice Gem near the northwest wall inside Ing Castle. A frozen wall opens and shows a ladder to a secret base.  
**Artifacts:** Ingozer's Armour, Bow of Arrow Strength and Rainbow Gem.

**What the story says now:** The hidden collection is legendary and was placed above the castle on purpose. The Rainbow Gem makes weapons, bows, and armor stronger. An open treasure chest now stands in the middle of the base with the relics spilled around it.

Because Ingoizer is a family name, “Ingozer's Armour” reads as an ancestor's gear rather than a spelling mistake - the house has been keeping a cache above its own castle for a long time. Luca has not yet decided which ancestor, and the game still does not say.

## Worldtree discovery

**Where and when:** Far northeast, at tile 186,12 - inside the Reach but held back from the very corner, because the camera stops at the edge of the world and anything closer than that is drawn under the minimap on a phone. Unlock Fire to remember a verse. Walk close for another hint. Shoot the tree with a fire arrow.  
**Getting there:** No road runs into the Worldtree Reach - the verse says so, and the map keeps its word. The corner is trackless ground and nothing is carved across it, so the tree is found by leaving the roads and walking northeast. Nothing nests there either: no monster spawns in the Reach.  
**What players learn:** The tree is older than the mountains and joins two worlds. Hands that were not human wore down the ladder steps. Fire burns away the tree and leaves the ladder standing in the air.

**What the fire leaves behind:** one Worldtree Seed, and the game says plainly not to lose it.

## The Worldtree Seed

**Where and when:** Given the moment the Worldtree finishes burning. Plant it with P, or from the relic shelf in the inventory - the inventory route is the one that works on a phone.  
**What players learn:** The seed is the way up. Planted on any ground that will take it, a Worldtree comes up in seconds with a ladder running up the inside of the trunk, and the Cloudlands are open again. What the ground decides is whether the tree *takes*. The ash it came out of is exactly the wrong answer - a Worldtree cannot begin in the end of itself - and so are stone, another tree's shadow and a worn road. It holds only in the Waiting Ground: a square of bare turned earth in the middle of the Fallow, in the far southeast, with no tree, no stone and no road anywhere near it. A tree that never took can be lifted straight back out - press P at the trunk, or use the relic shelf on a phone - and the whole thing folds down into the seed again, ladder and all, so the peaceful route can never be lost by planting in the wrong place. Every wrong planting also buys the next clue down a ladder of four - the tree's own restlessness, a direction, the name of the country, a description of the plot - and after three misses the Waiting Ground is marked on the chart outright. Planted sites are marked on the small map and the world map.

**What happens when it takes:** The Worldtree grows in a matter of seconds, standing in the Fallow and going up through the clouds, and the ladder in its trunk is the way to the Cloudlands from then on. Zeus notices at once that it is not where he put it, and says out loud why that does not matter: a Worldtree is a knot, not a fencepost. His first grievance stops being true, and his second one goes with it - and the game tells the player, plainly, that the fight they just made impossible is not coming back.

## Cloudlands and Temple of Olympus

**Where and when:** Climb the ladder inside whatever Worldtree is standing - which means planting the seed first.  
**What players learn:** Islands made of hard cloud float over a blue emptiness. A white marble temple stands in the center. Storm Harpies, Thunder Wisps, Golden Griffins, Cloud Giants, and Bronze Talos guard the land. Beating five of them wakes the temple.

## Twelve Olympians and Zeus

**Where and when:** Beat five Cloudlands keepers and walk to the Temple of Olympus.  
**Why Zeus is angry:** He makes both complaints before he makes a fist. The first is the Worldtree: it was the boundary stone between his country and Ingoizer's, older than either of them, and Ingoizer burned it down to save himself a walk. The second is simpler - Ingoizer is standing in the Cloudlands, and mortals do not belong there.

**The fight:** He warns that another god stands behind each form. Each hit shows the next form: Zeus, Hera, Poseidon, Demeter, Athena, Apollo, Artemis, Ares, Aphrodite, Hephaestus, Hermes, and Dionysus. After the 12th face is gone, Zeus returns as himself and can be hurt.

**Ending:** Zeus turns into weather. The ancient storm becomes quiet. Every arrow Ingoizer has now or finds later becomes a lightning bolt. The victory words say Ingoizer now commands the land, the caves below it, and the heavens above. The player may keep exploring.

## Peace with Zeus (the second ending)

**Where and when:** Plant the Worldtree Seed in the Waiting Ground, in the far southeast, before provoking Zeus at the temple.  
**What happens:** The tree grows, and Zeus speaks from directly overhead. He says he had two quarrels - the burned boundary stone, and a mortal standing in his country - and that mending the tree answers the first, so the second dies with it. He gives the lightning bolts there and then, with no blow struck. The Cloudlands keepers stop counting toward a summon.

**At the temple:** Climb afterwards and the keepers let Ingoizer pass. Zeus is sitting on the temple steps watching the new shoot climb, tells him to keep the bolts and the run of the Cloudlands, and asks him to come back when the tree is tall enough to hold the sky apart on its own. This is a full victory ending, reached without fighting the Twelve Olympians at all.

**If the player is too late:** planting the seed after Zeus has already come out of his temple only makes the storm falter for a heartbeat. The fight has to be finished.

# Special Story Items

| Item | Where the player gets or learns about it | What it means in the current story |
|---|---|---|
| Five Blue Gems | Exploring the surface, monster drops, Merlin's lore | Elemental spirits made them; together they unlock five powers and the Black Knight fight |
| Excalibur | Lady of the Lake quest at Crystal Lake | Legendary sword of kings, forged by gods and tempered in starlight |
| Jewel-encrusted Sheath | Sheath Guardian in Dark Forest | Proof of courage and a magical item that makes weapons stronger |
| Merlin's Wand | Merlin's Hut near Ing Castle | Gives back or increases Merlin's weakened power |
| Enchanter's Mallet | Reward from Merlin | Old-world relic that binds elemental energy into equipment |
| Dark Knight's Crest | Defeat Black Knight | Dark emblem of power that increases maximum health |
| Green Gem of Power | Green Knight's Domain | Raises attack forever during the current run |
| Green Gem of Fortitude | Green Knight's Domain | Raises defense forever during the current run |
| Magic Charm of Might | Defeat Green Knight | Shimmering charm that strengthens all weapons |
| Purple Gem of Vitality | Southeast Cave | Raises maximum health for the current run |
| Purple Gem of Fury | Stone Warden, Northwest Cave | Raises weapon damage for the current run |
| Purple Gem of Fortification | Crystal Titan, Northeast Cave | Raises armor defense for the current run |
| Titan's Gauntlet | Crystal Titan, Northeast Cave | A special item found in the titan's pieces that makes weapons and bows stronger |
| Ingozer's Armour | Hidden base above Ing Castle | “Most defensive armour in the land”; an ancestor of the house of Ingoizer wore it, though the game does not say which one |
| Bow of Arrow Strength | Hidden base above Ing Castle | Legendary bow equal to Excalibur in base damage and improved by gems/enchanting |
| Rainbow Gem | Hidden base above Ing Castle | Adds 4 points to weapons, bows, and armor |
| Ambrosia of Olympus | Hidden supplies in Cloudlands | A godly item that fully heals and gives gold and a Greater Potion |
| Zeus's Lightning Bolts | Defeat Zeus, **or** replant the Worldtree in the Waiting Ground - never both in one run | Transforms all current and future arrows into divine bolts |
| Worldtree Seed | Left in the ash when the Worldtree burns | The whole Worldtree, waiting, and the only way back into the Cloudlands. Plantable anywhere for a ladder; holds only in the Waiting Ground in the far southeast, and otherwise lifts back out |

# Places and What They Tell the Player

| Place | What it is like in the current game |
|---|---|
| Green Meadow | Ingoizer's simple home, waking place, and return point after defeat |
| Camelot Village | Safe home for friendly people and shopkeepers |
| Crystal Lake | Birthplace of the Blue Gems and home of the Lady of the Lake, who also keeps the Fountain of Youth |
| Dark Forest | A dangerous place with hidden treasure and the Sheath Guardian |
| Scorched Wastes | Harsh desert under an unforgiving sun |
| Merlin's Swamp | A magical land where Merlin lives after being forced away from the castle |
| Dragon Mountains | Jagged peaks associated with dragon-kind |
| Ancient Ruins | Leftover buildings from people who lived long ago |
| Darklands | A frightening eastern land shaped by shadow |
| Ing Castle | A castle that once stood for fairness, taken by the Black Knight; its great hall holds the tapestry of the house of Ingoizer |
| Green Knight's Domain | A southern land held by the Black Knight's eldest son, opened after his father falls |
| Four Caves | Tunnels the Black Knight's younger sons dug by hand to get away from the sun; opened with elements, and each keeps a treasure chest |
| The Fallow | The rested acre in the far southeast: plain grass flecked with bare brown earth, no road laid to it or through it, and not one tree standing in it |
| The Waiting Ground | The plot in the middle of the Fallow, kept bare on purpose since before anyone was writing things down. The one ground a Worldtree Seed will take |
| Worldtree | The boundary stone between the surface realm and the sky country, with the only road between them running up the inside of its trunk. Burnable — which closes that road — and regrowable from its own seed, though it only truly takes in the Waiting Ground |
| Cloudlands | A country above the sky, made from hard cloud and marble built by gods |
| Temple of Olympus | Center of Cloudlands and entrance to the Olympian fight |

<!-- PAGEBREAK -->

# Story Choices for Version 3.2

These are not mistakes for someone else to quietly fix. They are story choices for Luca.

## Choice 1: Who is Ingoizer?

**In the current game:** Ingoizer is one young male knight. The story uses “he,” “him,” and “his.” He comes from Green Meadow and has one special destiny.

**The new question:** The proposed start screen shows three men and three women. The story must explain whether they are different looks for one hero, six different people, or heroes who share the title Ingoizer.

**Possible answers:**

1. **Ingoizer is a hero title.** The chosen hero becomes the current Ingoizer. All six choices can belong in the story. The game title and main quest stay the same.
2. **Ingoizer is one person with different looks.** The six choices are different ways the same hero can look. The game changes words such as he, she, him, and her. Everyone shares the same past.
3. **Ingoizer stays one fixed hero.** The six choices become companions or costumes, or character selection is removed. This requires the fewest story changes.
4. **There are six named heroes.** Each hero has a name and a reason to be part of Ingoizer's World. This gives the most character detail but needs the most new writing, screens, and endings.

**Luca needs to choose:** the answer, the words used for the hero, the naming rules, and how pronouns work before the character-selection writing is finished.

## Choice 2: Should the Black Knight's real name stay a mystery? — DECIDED

**Luca's decision:** Yes, the given name stays unsaid. His *last* name does not. He was an Ingoizer. He read the family name as a curse rather than a promise, left his house and his destiny behind him, and came back as the Black Knight. The reveal is the tapestry in the great hall, read after he falls. The old "Sir Mordain" idea is rejected.

**Built in the game:** the reworked *The Black Knight* lore page, the new *The House of Ingoizer* page, the tapestry landmark in Ing Castle (`js/world.js`), the reveal dialogue (`Game.readCastleTapestry` in `js/game.js`) and the hidden lore page *The Tapestry in the Great Hall*.

## Choice 3: Why does the Green Knight fight Ingoizer? — DECIDED

**Luca's decision:** Revenge, not a test. The Green Knight is the Black Knight's eldest son and Ingoizer's cousin. He wants Ingoizer dead for killing his father, and says so plainly when he appears. He has no interest in the realm or the gems. The "honourable champion" idea is rejected.

**Built in the game:** his spawn speech and the reworked victory text in `js/game.js`, and the hidden lore page *The Sons of the Black Knight*.

## Choice 4: Who made the caves and Purple Gems? — DECIDED

**Luca's decision:** The Black Knight's younger sons did. The Stone Warden and the Crystal Titan dug all four caves by hand because they wanted somewhere with less sun, and they have guarded that dark ever since. They are not connected to the elemental spirits who made the Blue Gems.

**Built in the game:** the guardians' spawn lines, which change once the tapestry has been read; the reworked *The Lands of the Realm* lore page; and the hidden lore page *The Sons of the Black Knight*.

## Choice 5: Who owned the hidden base? — PARTLY DECIDED

Because Ingoizer is now a family name, "Ingozer's Armour" reads as an ancestor's gear rather than a spelling mistake: the house kept a cache above its own castle. That much is settled. Luca has still not chosen *which* ancestor, and the game does not name one.

## Choice 6: How do all the myths fit in one world?

The game brings together Camelot, Merlin, Excalibur, the gem story, and the Greek gods. This can be fun and magical. A short explanation would show why they belong together. They might all live in one realm. Different realms might meet at the Worldtree. The world might also bring in legends from many cultures.

The Worldtree now carries part of the answer: it is the boundary stone between the two countries, and Zeus says so himself. That is a start, not the whole explanation.

## Choice 7: What happens to the Worldtree after it burns? — DECIDED

**Luca's decision:** Burning it closes the way up, because the ladder is part of the tree. The fire leaves one seed, and that seed is now the only route into the Cloudlands. Planted anywhere it grows a Worldtree with a ladder in it and the climb reopens - but the Olympians stay hostile and Zeus must be fought. Planted in the Waiting Ground, a plot of bare earth in the Fallow in the far southeast that has been kept clear for exactly this, the tree takes: the boundary is mended, both of Zeus's grievances die, and he grants the lightning without a fight. Choosing that peace gives up the Olympus-defeated ending for the run, and the game says so.

**Built in the game:** `WORLDTREE_SEED`, `WORLDTREE_PLOT`, `WORLDTREE_SEED_CLUES` and the `fallow` zone in `js/constants.js`; `World.placeWorldtreePlot`, `World.isWorldtreeGround`, `World.isWorldtreeAsh`, `World.plantSeed`, `World.updateSapling`, `World.uprootSapling` and `World.renderRegrownWorldtree` in `js/world.js`; `Game.plantWorldtreeSeed`, `Game.onSeedPlantedWrong`, `Game.chartWaitingGroundIfLost`, `Game.checkWaitingGroundApproach`, `Game.onWorldtreeRegrown`, `Game.uprootSapling` and `Game.checkZeusPeaceMeeting` in `js/game.js`; the relic card with its Plant button in `js/ui.js`; the P key; the lore pages *The Worldtree Seed* and *The Fallow*; and the browser tests in `tests/waiting-ground.spec.js`.

## Choice 8: Is the Fountain connected to the Lady? — DECIDED

**Luca's decision:** Yes. The Lady of the Lake keeps both waters. At the lake she tests courage; at the fountain she tests wit. The riddle screen's wording was right all along.

**Built in the game:** the reworked *The Lady of the Lake* lore page, and her spoken introduction the first time the fountain is used in `js/game.js`.

## Choice 1 is still open

Choice 1 (who Ingoizer is, and how character selection works) is the one story choice above that Luca has not answered. The family-name decision narrows it usefully: whatever the six start-screen figures turn out to be, they can all share the surname Ingoizer without any of the other story needing to change.

## Helpful story work for Version 3.2

- Decide who Ingoizer is before writing the character-selection screen (Choice 1, still open).
- Decide which ancestor owned the hidden base above Ing Castle (the rest of Choice 5).
- Let the lore list mark each page Hidden, Found, or Read. Hiding already works: three pages now stay off the shelf until they are earned. Marking Found and Read is the part still to build.
- Extend that hiding to the rest of the library so players find lore during the adventure instead of seeing most of it at once.
- Give the Green Knight and the cave guardians a spoken line each *before* the tapestry that hints at the family without giving it away.
- Save a copy of all current story words before changing them.
- Keep a list of Luca-approved story changes behind Tab 12.

<!-- PAGEBREAK -->

# Putting the Version 3.2 Proposal Together

## Ideas already included in the proposal

1. **Fog of war:** maps for the main world, caves, and Cloudlands that uncover as the player explores.
2. **Character selection:** six hero looks and a story choice about who can be Ingoizer.
3. **New inventory and character screen:** equipment, number comparisons, pictures, and information that are easier to understand.

## Concept pictures that support the proposal

- Sample picture of the start and character-selection screen.
- Main-world, cave-system and Cloudlands environment upgrades.
- Main, cave and Cloudlands fog-of-war maps.
- Inventory and shop redesign.
- Monster shape and size lineup.
- One polished sample of Green Meadow.
- Illustrated world map.

## Suggested page order

1. Version 3.2 proposal cover.
2. One-page summary and a place for Luca's approval.
3. What the current game does and what could be clearer.
4. What this release should and should not change.
5. Decision page: Who is Ingoizer?
6. Character-selection idea and sample screen picture.
7. Rules for how fog of war should work.
8. Three fog-map concept plates.
9. Inventory and character-screen proposal.
10. New art ideas for worlds and creatures.
11. How the team could build the ideas and which parts depend on other parts.
12. Pass-or-fail checks and a playtest plan.
13. How much work there is, what order to use, and what might go wrong.
14. Final Luca decision page.

## What Version 3.2 should try to do

- Make exploration feel mysterious without making navigation frustrating.
- Help players feel connected to the hero while keeping the story of Ingoizer's World clear.
- Make equipment, stats, items and comparisons understandable at a glance.
- Add more visual detail while keeping the warm style and easy-to-recognize pixel shapes.
- Make keyboard, touch, small landscape screens, and helpful access options work equally well.

## What Version 3.2 should not change unless Luca says so

- Do not add fighter classes unless Luca chooses to make character selection a bigger feature.
- No stat advantages tied to gender or cosmetic hero choice.
- Do not rebuild the whole world.
- No replacement of the friendly animal or Olympian direction that already works.
- Do not change an old story fact without recording Luca's choice.

# How to Know the New Features Work

The first two lists below check features that are **already in the game**. The lists after them are starter checks for proposed Version 3.2 features that describe future ideas, not the current game.

## The Worldtree Seed (built)

- Burning the Worldtree hands the player a Worldtree Seed and adds the *Worldtree Seed* page to Merlin's shelf.
- Burning it leaves **no ladder**: the ash carries no sky-ladder tile, standing in it offers no climb, and the chart marks the spot as *Worldtree Ash* rather than a route.
- The seed can be planted with P on a computer and from the relic shelf in the inventory on a phone.
- Any planting grows a full Worldtree in a few seconds with a ladder up the trunk. Pressing E at the trunk climbs to the Cloudlands, wherever the tree is.
- A tree planted on ordinary ground says so - it has climbed but not taken - and the Olympians stay hostile.
- A seed planted in the ash where the old trunk stood grows a tree that will not take either, and the game says why in as many words: a Worldtree cannot begin in the end of itself.
- Pressing P at a tree that never took lifts the whole thing back out, ladder and all, and returns the seed. The way up closes with it, and the relic shelf offers the same on a phone. A tree that *has* taken cannot be lifted.
- Uprooting is refused anywhere but the surface, so nobody pulls the ladder out from halfway up it.
- Every wrong planting tells the player one thing more about where the right ground is, in order; after three misses the Waiting Ground is marked on the chart whether the player has been there or not.
- Walking into the Waiting Ground names it, plays the discovery tune and marks it on the map for good, seed in hand or not.
- Standing on the plot carrying the seed lights the turned earth, names it on screen and offers the plant prompt.
- A seed planted in the Waiting Ground takes: the Worldtree stands in the Fallow, climbs through the clouds, and the chart renames it *The Worldtree*.
- Replanting grants Zeus's lightning bolts with no fight, and the arrow icon in the HUD changes to match.
- Climbing to the temple afterwards gives the peaceful ending instead of the twelve-form fight; the keeper counter disappears from the HUD.
- After the tree takes, the Olympian trigger never fires again for that run - the Twelve do not rise and the Olympus-defeated ending cannot be earned. The game says so at the moment it happens.
- Planting the seed after Zeus has already left his temple does **not** cancel the fight.

## Monsters and the pack (built)

- A monster picks between Ingoizer and the animals walking with him and goes for whichever is the better mark; Ingoizer counts as the nearer one on a tie, so a monster at his elbow never walks past him to reach a fox.
- An animal that bites a monster holds that monster's attention for a few seconds, whatever the distances say - the pack can pull a fight off Ingoizer.
- A blow that lands on an animal shows its damage over the animal, and an animal killed by one is announced like any other companion that falls.
- An animal in the middle of a scrum takes one hit per guard window, not one from every monster touching it: the swing a monster aims at it and the damage it takes for standing toe to toe share the same short cooldown.

## The family tapestry and the treasure chests (built)

- The tapestry is a featureless black drape until the Black Knight is beaten, then shows the woven family tree.
- Reading it adds two pages to Merlin's shelf and changes what the cave guardians say when they rise.
- Merlin's shelf shows 13 pages at the start of a game and 16 once every hidden page has been earned; the page counter and the Previous/Next buttons stay correct at every count.
- Both maze caves show a shut chest at the centre that opens when the treasure is taken.
- Both boss caves show a shut chest at the back of the lair that opens when the guardian falls.
- The hidden base above Ing Castle shows an open chest among its relics.

## Fog of war

- Places the player has never seen do not show land shapes, names, markers, or hidden goals.
- Places explored before stay on the map, but do not show moving characters that are out of sight.
- Places the player can see right now show the full current picture.
- The main world, each cave, and Cloudlands remember their own explored areas.
- The map remains usable on desktop and compact landscape screens.
- Charting the last cell of surface fog announces itself: a tune of its own, a banner, and the line *Congratulations, you've explored 100% of the surface level! The fog has been cleared.* Every cell of surface fog can be reached on foot, so this is a thing a player can actually finish. It fires once, is kept in the save, and is counted as `surface-fully-charted` in the analytics.

## Character selection

- Exactly three men and three women are available.
- Every choice has the same game numbers and access unless Luca approves classes.
- Every hero looks different in both the portrait and the small game sprite.
- Every pronoun, speech, and ending matches Luca's choice about who Ingoizer is.
- A future save system remembers the chosen hero look.

## Inventory and character screen

- Equipment, owned items, usable items, and quest items are easy to tell apart.
- Weapon, bow, and armor comparisons show the old and new numbers next to each other.
- Close and Back buttons stay visible on every supported screen size.
- Color is never the only clue. Use words, shapes, or icons too.
- Original item names, powers and quest rules remain accurate.

<!-- PAGEBREAK -->

# How Ingoizer's World Works

## A sixth-grade guide to the game and its systems

**Status:** CURRENT explanation, with future ideas clearly marked PROPOSED  
**Audience:** Luca and anyone helping him. It is written at about a sixth-grade level and follows the game from a button press to a boss reward.

> BIG IDEA: A game is a group of parts working together very quickly. The `Game` class is like a conductor leading a band. It listens to the player, updates the current world and characters, checks the rules, and tells the screen and speakers what happened.

<!-- DIAGRAM:ARCHITECTURE -->

## Words to know

| Word | Plain meaning in this game |
|---|---|
| Architecture | The plan that shows how all the game parts fit and work together |
| System | A part of the game with one main job, such as combat, maps or sound |
| State | Facts that can change, such as health, gems, quests and the current realm |
| Game loop | The fast repeating cycle that listens, updates the game and draws the next picture |
| Trigger | An event the code can notice, such as entering a place or defeating a boss |
| Render | To draw the world, characters, effects or interface on the screen |
| Flag | A named yes/no or step-by-step fact that remembers whether something happened |
| Instance | One created copy of a game object. Each of the four caves has its own copy of `CaveWorld`. |

## The eight building blocks

| Building block | Sixth-grade explanation | Where it lives |
|---|---|---|
| Stage | Holds the canvases, menus, buttons and overlays the player can see or touch | `index.html` |
| Style book | Decides how the stage, menus, HUD and screens look | `css/style.css` |
| Rule book | Names weapons, monsters, gems, zones, bosses, prices and important numbers | `js/constants.js` |
| Conductor | Starts the adventure, remembers the current play session, and tells the systems when to work | `js/game.js` |
| Worlds | Builds and draws the surface, four caves and Cloudlands; answers “can I walk here?” | `js/world.js` |
| Actors | Gives the hero, monsters and bosses their bodies, movement, health and behavior | `js/entities.js`, `js/animals.js`, `js/sprites.js` |
| Referee | Decides which attacks hit, how much damage happens, and which effects appear | `js/combat.js` |
| Messengers | Turn game events into HUD, dialogs, shops, inventory, sound and touch controls | `js/ui.js`, `js/sound.js`, `js/touch.js` |

`js/utils.js` is a shared toolbox. It helps with distance, random choices, map positions, touching objects, and other small jobs used by several systems.

## What happens during one game heartbeat

The browser repeats this loop many times each second. A smooth game often completes the whole circle about 60 times each second.

<!-- DIAGRAM:GAME_LOOP -->

1. **Listen:** keyboard or touch controls report what the player is trying to do.
2. **Choose the stage:** the conductor selects the surface, the active cave or Cloudlands.
3. **Move the actors:** player, monsters, bosses, animals, arrows and effects update.
4. **Check results:** touching objects, attacks, pickups, quests, gates, deaths, and rewards are checked.
5. **Tell and draw:** the world, actors, particles, HUD, map, dialog and sound show the result.
6. **Repeat:** the next heartbeat begins with the newest state.

## The game remembers a run in layers

“State” means facts that can change. Examples are health, collected gems, the current realm, defeated bosses, open quests, and revealed ladders. Right now, the browser remembers these facts only while the game is open.

<!-- DIAGRAM:STATE_AND_WORLDS -->

> CURRENT LIMIT: The current game does not have a permanent save system. Restarting or reloading begins a new adventure. `savedSurfacePos` only remembers where Ingoizer should return during the same play session after visiting a cave or Cloudlands. A future save system would need to record important facts, check that they are safe to use, and rebuild the same adventure later.

## How the three realms connect

- **Main world:** the central hub. It owns zones, shops, Blue Gems, the Lady, Merlin, the Black and Green Knight arcs, cave entrances, the Fountain and the Worldtree.
- **Four caves:** four separate copies of `CaveWorld`, each matched to an entrance number. Every cave has its own rooms, monsters, exits, obstacles, treasure, and possible boss.
- **Cloudlands:** one `SkyWorld` reached by the Worldtree ladder. It contains the cloud islands, keepers, Ambrosia, temple, and Olympian fight.
- **The conductor carries the hero between them:** the player, inventory, powers and companions remain part of the same run while the active world changes.

## Use this game plan when designing Version 3.2

| Feature | Rules and state | Game logic | World or actors | Player-facing result |
|---|---|---|---|---|
| Fog of war | A map list for explored spaces in each realm | Update spaces the player can see or has seen | Maps draw unseen, explored, and visible spaces differently | Clear map key, discovery feedback, and support for a future save system |
| Character selection | Six equal hero choices and the number of the chosen hero | Choose before `startGame()` makes the player | The small hero and portrait use the chosen look | The start screen, pronouns, and endings match Luca's story choice |
| Inventory redesign | The same facts about owned, equipped, quest, and upgraded items | Keep equip, use, buy, and sell rules correct | Item pictures and the hero preview match the facts | One clear character screen for keyboard and touch |

A good feature plan follows one fact through the whole game: name it, change it, show it, test it, and save it if it should still exist after a reload.

## Luca's five questions for tracing any feature

Use these questions when a new idea feels complicated. If each answer is clear, the system usually has a sensible home.

1. **What fact changes?** Example: “this tile has been explored” or “this fox is the selected companion.”
2. **Who owns that fact?** The player, one realm, one actor, the conductor or future save data?
3. **What event changes it?** A button press, touching something, a pickup, quest, timer, boss win, or return from another realm?
4. **Who needs to know?** World drawing, combat, UI, sound, dialog, map, touch controls or several of them?
5. **How will we prove it works?** Decide what players should see, what happens in unusual cases, what a reload does, and how to playtest it.

> CREATOR HABIT: Explain a feature once as a player story and once as a state change. “I explored a dark cave and my map remembered it” becomes “visible tiles update the cave's discovery grid; the map renders that grid; future save data stores it.”

<!-- PAGEBREAK -->

# Secret Builder

## Use the game plan to create secrets with a reason

**Status:** PROPOSED idea-making tool. The examples are not in the current game and are not official story.

> A GOOD SECRET is hidden but fair. The player notices clues, tries an idea, sees the world answer, and earns a reward that fits the secret.

<!-- DIAGRAM:SECRET_BUILDER -->

## First, decide why the secret should exist

| Reason for a secret | What the player should feel | Good reward types |
|---|---|---|
| Exploration | “I found a place most players might miss.” | Shortcut, hidden room, map detail, treasure |
| Lore | “I understand this world better now.” | Journal page, mural, NPC memory, new dialog |
| Mastery | “I used a game rule cleverly.” | Upgrade, rare material, efficient route |
| Kindness | “The world noticed how I treated its creatures.” | Animal friendship, safe haven, cosmetic token |
| World connection | “Things in different realms belong to one story.” | Clues in several realms, a star picture, or joined special items |
| Playfulness | “The creator left me a delightful surprise.” | Harmless animation, sound, costume or joke room |

## Luca's seven-step secret recipe

1. **Purpose:** Write one sentence that says why this secret belongs in Ingoizer's World.
2. **Trigger:** Choose something the code can notice. It might be a place, item, element, animal friend, action order, time, or finished quest.
3. **Clues:** Give at least two hints through the world, lore, sound, map, or speech. The secret can be hard, but it should not need a wild guess.
4. **Memory flag:** Name the fact the game remembers, such as `foxGroveDiscovered`. Decide when it is Hidden, Found, Finished, and Rewarded.
5. **Reveal:** Change something players can see or hear so they know their idea worked.
6. **Reward:** Choose a reward that fits the purpose. A secret does not always need to make fighting easier.
7. **Test:** Make sure the secret can be found, cannot give its reward twice by mistake, works with touch and keyboard, and never blocks the main adventure.

## Three example secrets Luca could think about

### The Fox's Apple Trail — kindness

**PROPOSED:** A fox friend pauses at three stones marked with paws. Visiting all three in any order reveals a tiny apple grove. The code checks which animal is with the player and which places were visited. The world shows the grove. The screen and sound celebrate. A memory flag stops the reward from being given twice. The reward is about friendship, not fighting power.

### The Echoing Cave Runes — mastery and lore

**PROPOSED:** A cave wall shows two element symbols and one broken symbol. Clues nearby help the player find the missing element. Using the three powers in the right order opens a small lore room. The fighting system reports which powers were used. The cave checks the order. One wall piece changes, and the lore screen remembers the discovery.

### The Three-Realm Star — world connection

**PROPOSED:** One star mark appears on the surface, one in a cave, and one above the clouds. Finding all three finishes a star picture in the journal. It also explains why the realms reflect one another. Each realm remembers its own discovery. The conductor notices when the set is complete. The reward is a story page and a glow around the arrow holder. The glow does not change fighting power.

## Secret design card

<!-- SECRET_CARD -->

> CREATOR CHECK: If a secret has no reason, no clues, or no satisfying answer, it is only hidden information. Give every secret a tiny story: invitation, experiment, answer, and memory.

# Creator's Workshop

## Blank master pages for Luca's ideas

**Status:** WORKING NOTES. Nothing written on these pages becomes official until Luca approves it.

> PRINTING RULE: Keep one clean master of every worksheet behind Tab 13. Print or photocopy a fresh page before using it. Add more pages whenever Luca needs them.

These pages turn a big idea into smaller choices that are easier to explain, draw, build, and test. Luca can use only the page he needs. He does not have to fill every box.

| Blank master | Best time to use it |
|---|---|
| Big Idea Spark Sheet | A new idea is exciting but still hard to explain |
| Story Arc and Plot Map | A whole adventure needs a beginning, middle, biggest test, and ending |
| Story Timeline | Events and clues need to happen in a clear order |
| Lore Entry Builder | A new fact, legend, memory, book, mural, or speech may join the official story |
| Character Creator | A hero, friend, shopkeeper, guide, rival, or villain needs a clear role and look |
| Relationship Web | Characters need friendships, rivalries, secrets, promises, or family ties |
| Creature and Monster Designer | An animal or enemy needs a readable shape, behavior, habitat, and fair rules |
| Location and Map Designer | A new room, path, town, cave, island, or realm needs a purpose and layout |
| Quest Builder | A task needs a reason, steps, clues, obstacles, and a reward |
| Boss Fight Planner | A boss needs a story reason, fair signals, phases, counters, and a result |
| Puzzle and Mystery Planner | A challenge needs an answer, clues, feedback, and a fair way to try again |
| Item, Reward, and Shop Designer | An item needs a use, value, place in the world, and clear shop rules |
| Screen and Menu Sketch | A screen needs a purpose, layout, controls, and a clear next action |
| Feature and System Builder | A feature needs facts, triggers, game parts, visuals, saving, and tests |
| Playtest and Bug Hunt | A tester's actions and problems need to be recorded without guessing |
| Release Planner | A game version needs a goal, included work, checks, and a stopping point |
| Luca's Decision Record | An important choice needs Luca's answer and a record of what it changes |

<!-- PAGEBREAK -->
<!-- WORKSHOP_FORM:BIG_IDEA -->

<!-- PAGEBREAK -->
<!-- WORKSHOP_FORM:STORY_ARC -->

<!-- PAGEBREAK -->
<!-- WORKSHOP_FORM:STORY_TIMELINE -->

<!-- PAGEBREAK -->
<!-- WORKSHOP_FORM:LORE_ENTRY -->

<!-- PAGEBREAK -->
<!-- WORKSHOP_FORM:CHARACTER -->

<!-- PAGEBREAK -->
<!-- WORKSHOP_FORM:RELATIONSHIPS -->

<!-- PAGEBREAK -->
<!-- WORKSHOP_FORM:CREATURE -->

<!-- PAGEBREAK -->
<!-- WORKSHOP_FORM:LOCATION -->

<!-- PAGEBREAK -->
<!-- WORKSHOP_FORM:QUEST -->

<!-- PAGEBREAK -->
<!-- WORKSHOP_FORM:BOSS_FIGHT -->

<!-- PAGEBREAK -->
<!-- WORKSHOP_FORM:PUZZLE -->

<!-- PAGEBREAK -->
<!-- WORKSHOP_FORM:ITEM_SHOP -->

<!-- PAGEBREAK -->
<!-- WORKSHOP_FORM:SCREEN_MENU -->

<!-- PAGEBREAK -->
<!-- WORKSHOP_FORM:FEATURE_SYSTEM -->

<!-- PAGEBREAK -->
<!-- WORKSHOP_FORM:PLAYTEST -->

<!-- PAGEBREAK -->
<!-- WORKSHOP_FORM:RELEASE -->

<!-- PAGEBREAK -->
<!-- WORKSHOP_FORM:DECISION -->

<!-- PAGEBREAK -->

# Extra A: Current Project README

The project did not have a README before this binder work. A README now lives at `README.md`. Print it behind Tab 02. Replace it when the public game description changes in an important way.

## README summary

**Title:** Ingoizer's World - A Tale of Gems and Glory  
**Creator, owner and product lead:** Luca  
**Live build:** `https://genemagg10.github.io/adventure-game/`  
**How it is built:** Plain HTML, CSS, and JavaScript; no build step  
**How it is played:** In a web browser; keyboard or a mobile device held sideways  
**Main path:** Five Blue Gems -> Black Knight -> the family tapestry in Ing Castle -> Greenlands and Green Knight. The caves, Excalibur, Merlin, Worldtree, the Worldtree Seed, Cloudlands, and Zeus are also major adventures.

The full README also lists the controls, how to run the game on a computer, current features, what each code file does, where the design pages live, where lore is found, and the current copyright status.

# Extra B: Where the Story Facts Come From

| Kind of story fact | File used by the current game |
|---|---|
| Title and subtitle | `index.html` |
| Realm names and map positions | `js/constants.js`, `js/world.js` |
| Fifteen Ancient Lore entries | `js/constants.js` (`MERLIN_LORE`) |
| Which lore entries are hidden until earned | `js/constants.js` (an entry's `unlock` key), `js/game.js` (`Game.unlockLore`), `js/ui.js` (`UIManager.unlockedLore`) |
| Lore overlay and navigation | `js/ui.js` |
| Character and treasure-chest pixel art | `js/sprites.js` |
| Opening, quests, discoveries and endings | `js/game.js` |
| Item and artifact descriptions | `js/constants.js`, `js/ui.js` |
| Boss names, titles, and fight rules | `js/constants.js`, `js/entities.js`, `js/game.js` |
| Map labels and environmental storytelling | `js/world.js` |
| Older story ideas | `RECOMMENDATIONS.md` - not official story |
| Version 3.2 visual proposals | `docs/art-direction/` - proposed until approved |

<!-- PAGEBREAK -->

# Extra C: Binder Update Checklist

- Check the live game link and the code version that was reviewed.
- Mark every new page Current, Proposed, Approved, Implemented, Superseded or Rejected.
- Write Luca's decision number on approved story and feature changes.
- Update the official story summary after Luca approves a story change.
- Update the README after public feature or control changes.
- Replace old concept pictures. Do not mix final art and new ideas without labels.
- Keep replaced decisions behind Tab 12 so the project history is not lost.
- Run a print check after changing tables, images or section breaks.
- Re-export `Ingoizers_World_Development_Binder_Master.docx` and `.pdf` from this file whenever it changes. Both were exported before the story decisions of Choices 2, 3, 4, 7 and 8 were recorded here, so they are currently behind `BINDER_MASTER.md`. This Markdown file is the master; the printed copies follow it.
- Regenerate the Ancient Lore section with the script that reads `MERLIN_LORE` out of `js/constants.js` rather than retyping the passages, so the binder and the game can never drift apart.
