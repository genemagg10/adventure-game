# Ingoizer's World — Complete Monster Roster

Review date: August 2026
Scope: every hostile definition and named combatant instantiated by `game.js`, including the overworld, Greenlands, all four caves, Cloudlands, quest guardians, bosses, and the twelve Olympian forms.

## Roster at a glance

The game contains **20 standard monster types**, **1 named monster variant**, **4 named non-divine bosses**, and **12 hostile Olympian forms**: **37 distinct hostile identities** in total. Zeus's final true form is a stronger return state of Zeus, not a thirteenth god. Friendly rabbits, foxes, toads, owls, and turtles are companions and are not part of this roster.

The new production renderer in `js/monster-sprites.js` covers all 20 standard monsters, the Sheath Guardian variant, and the four named non-divine bosses. The Olympians retain their existing authored form-cycle presentation, signature attacks, palette, aura, robe, and emblems because they are divine characters rather than monsters and were already the game's strongest hostile art system.

## Overworld monsters

| Monster | Habitat | Implemented visual identity |
|---|---|---|
| Goblin | Green Meadow, Dark Forest | Short, forward-leaning raider; long triangular ears, bent legs, knife and battered shield, patched leather, red eye. |
| Skeleton Knight | Ancient Ruins, Darklands | Visible rib cage and limb gaps; warm bone, oxidized helmet, sword and shield, hollow skull. |
| Dire Wolf | Dark Forest, Dragon Mountains | Low horizontal quadruped; raised shoulders, long muzzle, gray fur planes, yellow eye, lope-ready legs and tail. |
| Cave Troll | Dragon Mountains, Merlin's Swamp | Tall hunched brute; massive brow and jaw, tusks, long load-bearing arms, shovel hands, club, mossy skin. |
| Dark Wraith | Darklands, Ancient Ruins | Empty angular hood, violet eyes, grasping spectral claws, layered torn robe and footless floating trail. |
| Dragon Whelp | Dragon Mountains, Scorched Wastes | Four-legged rust-red reptile; long tail, horned head, claws, articulated membrane wings, amber belly. |
| Bandit | Dark Forest, Green Meadow, Scorched Wastes | Human rogue silhouette; low hood, face scarf, leather belt, sword hand, sidestep-ready stance. |
| Swamp Creature | Merlin's Swamp | Squat amphibian predator; webbed limbs, splayed claws, dorsal reeds/spines, wet belly plane and predatory gold eyes. |

## Quest and Greenlands monsters

| Monster | Role | Implemented visual identity |
|---|---|---|
| Sheath Guardian | Lady of the Lake quest guardian | A larger Cave Troll from the same anatomical family, marked by brighter elder-moss skin and a luminous golden chest jewel. |
| Green Guardian | Green Knight's Domain | Bark-and-brass humanoid knight; rooted boots, leaf shield, antlered helm and living branch-blade. |
| Vine Beast | Green Knight's Domain | Asymmetric root gait, mismatched vine arms, leaf growths and a single flower-like eye as its focal point. |

## Cave monsters

| Monster | Habitat | Implemented visual identity |
|---|---|---|
| Giant Cave Spider | All caves | Extremely wide, low body; eight independently phased legs, clustered eyes, fangs and purple-black chitin. |
| Shadow Bat | All caves | Tiny body inside a broad wing rhythm; angular membrane fingers, pointed ears, red eyes and tucked dive posture. |
| Deep Troll | All caves | Heavier cave-relative of the surface troll; long arms, oversized hands and mineral growths breaking its outline. |
| Crystal Golem | All caves | Faceted stone torso, detached floating slab arms, block feet, violet crystal heart and emissive eyes. |
| Shadow Serpent | All caves | Segmented S-curve body led by a horned wedge head, purple edge highlights, forked tongue and luminous eye. |

## Cloudlands monsters

| Monster | Habitat | Implemented visual identity |
|---|---|---|
| Storm Harpy | Cloudlands | Bird-humanoid hybrid with a small central body, huge storm wings, hooked beak and extended talons. |
| Thunder Wisp | Cloudlands | Footless indigo spirit built around a jagged lightning core, angular static arms and bright hostile eyes. |
| Golden Griffin | Cloudlands | Lion hindquarters and tail, eagle head and forequarters, four legs, hooked beak and large golden wings. |
| Cloud Giant | Cloudlands | Towering column legs, long arms, block hands, overhanging storm-cloud shoulders and icy blue eyes. |
| Bronze Talos | Cloudlands | Monumental clockwork humanoid; segmented bronze plates, riveted joints, furnace core, heavy fists and crested helm. |

## Named bosses

| Boss | Encounter | Implemented visual identity |
|---|---|---|
| The Black Knight | Ing Castle finale | Wide jagged pauldrons, narrow armored waist, long torn blood-red cape, red visor and asymmetrical cursed blade. |
| The Green Knight | Green Knight's Domain | Root-edged cape, leaf pauldrons, branch-antler crest, luminous green visor and a living leaf blade. |
| The Stone Warden | Northwest cave | Squat rune-powered stone mass, enormous slab arms, block feet, cracked planes and a bright cyan core. |
| The Crystal Titan | Northeast cave | Tall faceted body, crown-like amethyst growths, prismatic heart, crystal shelves and a lance-shaped arm. |

All existing boss telegraphs remain intact: charge lines, windups, spin radii, projectiles, spawn effects, death effects, and health-bar behavior are unchanged.

## Hostile Olympian forms

The Cloudlands boss cycles through twelve divine identities. They are hostile combatants but are not monster species, so they remain a separate presentation tier.

| Form | Title | Signature combat identity |
|---|---|---|
| Zeus | King of Olympus | Lightning bolts; returns as the killable true form after the full cycle. |
| Hera | Queen of the Gods | Orbiting peacock-eye projectiles. |
| Poseidon | The Earthshaker | Rolling tidal shockwaves. |
| Demeter | Lady of the Harvest | A creeping line of thorn bursts. |
| Athena | Goddess of Wisdom | Fast piercing spear volley. |
| Apollo | The Radiant | Radial sunburst. |
| Artemis | The Huntress | Tight, high-speed arrow volley. |
| Ares | God of War | Armored headlong charge. |
| Aphrodite | Goddess of Love | Slow homing charm projectiles. |
| Hephaestus | The Forgemaster | Forge-ember bombardment. |
| Hermes | The Messenger | Blink reposition and wing burst. |
| Dionysus | Lord of the Vine | Expanding spiral of vine orbs. |

## Production rules applied

- Silhouettes identify species before color or labels.
- Contours use stepped polygons and hard pixel clusters instead of a shared smooth circle.
- Every creature uses an outline/shadow value, dominant mid-tone and controlled light plane.
- Bone, metal, fur, scale, cloth, stone, crystal, vegetation and cloud receive different highlight logic.
- Locomotion supports identity: scuttle, stiff step, lope, weighted gait, float, hop, root gait, skitter, wingbeat or slither.
- Attack recoil adds readable menace while leaving timing, damage and collision behavior untouched.
- Health bars now sit above authored sprite bounds instead of assuming every body is a circle.

## Review surface

Open `docs/review/monster-roster.html` through the same local web server used for the game to inspect all 25 non-divine hostile presentations together at gameplay scale.
