# Seeing Other Players in Ingoizer's World

**Page label:** PROPOSED
**Prepared for:** Luca, Creator, Owner and Project Lead
**Question answered:** What would it take to see other players walking the realm at the same time?
**Build reviewed:** Repository `main` at commit `76d6967`, August 2026

> This page is a study of what the work would involve. Nothing here is part of the
> game, and nothing here is decided. Luca chooses whether any of it gets built.

## The short answer

Most of the hard part is already done, and the one missing piece is the one the
project has never had: **a computer that stays switched on**.

Ingoizer's World is a static site. It is HTML, CSS and JavaScript files served by
GitHub Pages at `luca.maggio.xyz`. There is no server, no database, no accounts,
and nothing in the code that has ever sent or received a message — a search of
`js/` for `fetch`, `WebSocket`, `XMLHttpRequest` or `localStorage` returns nothing
at all. Players cannot see each other because there is currently nothing in the
world that could carry the news that another player exists.

The good news is that the world itself is already shared. Every realm is built
from a fixed seed, so two people opening the game on opposite sides of the planet
already generate a byte-identical map:

| Realm | Seed | Where |
|---|---|---|
| Main world | `seededRandom(42)` | `js/world.js:25` |
| Green Knight's Domain | `seededRandom(99)` | `js/world.js:506` |
| The four caves | `seededRandom(77 + entranceId * 31)` | `js/world.js:2517` |
| The Cloudlands | `seededRandom(1207)` | `js/world.js:3146` |

Every player starts on the same tile as well — `tileToWorld(10, 15)` in Green
Meadow (`js/game.js:266`). So two players are *already* standing in the same
place in the same world, drawing the same grass. They simply cannot see each
other. All that is missing is a way for one browser to tell another where its
hero is standing.

## Three sizes of multiplayer

It matters a great deal which of these Luca means, because they are days of work,
months of work, and a different game.

### Tier 1 — Presence, or "ghosts"

You see other players walking around. Their heroes appear on screen and on the
map, wearing whatever gear they have equipped, with a name over their head. You
cannot touch them, fight them, help them, or trade with them. They cannot hurt
you and you cannot hurt them. Every player still has their own monsters, their
own gems, their own quest, and their own ending.

This is what "see other players playing in the world at the same time" asks for
literally, and it is by far the best value for the effort. **This page recommends
Tier 1.**

### Tier 2 — Shared world and co-op

You and another player fight the *same* troll. When they kill it, it is dead for
you too. Chests, gems, bosses and the Black Knight are shared.

This is a much larger project and is discussed at the end.

### Tier 3 — A proper persistent online world

Accounts, saved characters, hundreds of players, an economy. This is a different
product with a different cost structure. It is not considered here.

---

# What Tier 1 actually needs

## 1. A relay server — the only genuinely new thing

This is the whole reason multiplayer is not a weekend afternoon. The game
currently costs nothing to run and cannot break, because GitHub Pages just hands
out files. A multiplayer game needs a program that is always awake.

The good news is that the program is very small. It does not simulate anything,
does not know the rules of the game, and stores nothing on disk. It only:

1. Accepts a WebSocket connection and hands out an id.
2. Sorts players into rooms — one per realm (see §4).
3. Receives a small position message from each player about ten times a second.
4. Sends every player the current list of everybody else in their room.
5. Forgets anyone who has gone quiet for ten seconds.

That is roughly 150 lines. It would run comfortably on Cloudflare Durable
Objects, Deno Deploy, Fly.io, or a small Node process with the `ws` package.

**The real cost here is not the code, it is the commitment.** The game becomes
something that can be down. It needs a hostname, a certificate, somewhere to run,
and someone to notice when it stops. It is worth saying plainly before starting.

## 2. A networking layer in the client — new file `js/net.js`

A single new script, loaded last, that owns the connection and knows nothing
about how the game is drawn.

**Sending.** Ten times a second, a small message of roughly this shape:

```
{ x, y, facing, walkFrame, realm,
  weapon, bow, armor, activeElement,
  attacking, shooting }
```

Everything in it already exists on the `Player` object (`js/entities.js:5`). At
ten messages a second this is a few kilobytes a minute per player.

**Receiving.** A list of the other players in the room, applied to a set of
`RemotePlayer` objects. Because messages arrive ten times a second and the game
draws sixty, positions must be smoothed between updates. The game already runs
everything on a delta-time loop (`js/game.js:646`), so interpolating toward the
last known position is natural and will look correct.

**Three details that are easy to get wrong:**

- **Failure must be invisible.** If the server is down, unreachable, or blocked
  by a school firewall, the game must play exactly as it does today — the whole
  networking layer wrapped so that no error can ever reach the game loop. A
  static site that stops working when a server hiccups would be a step backwards.
- **Menus must not freeze you.** `update()` returns early whenever a menu, shop,
  map or dialog is open (`js/game.js:715`). If sending lives inside `update()`,
  a player who opens their inventory freezes in place for everyone else. Sending
  belongs outside that early return.
- **Background tabs stop.** `requestAnimationFrame` pauses when a tab is hidden,
  so position updates simply stop. This is why the server needs the ten-second
  timeout in §1, otherwise abandoned heroes stand around the meadow forever.

## 3. A `RemotePlayer` class — render-only

This is deliberately **not** a `Player`. It is a shell holding a position, a
facing, a walk frame, the equipment ids needed to draw the right gear, and the
interpolation targets. It has no health, no inventory, and no `update(dt, keys,
world)`.

It can reuse most of `Player.render()` (`js/entities.js:443`), which is already
nicely self-contained — it takes the camera, converts to screen coordinates, and
draws. The sprite work in `IngoizerSprite.draw` needs no changes at all.

Dropping remote players into the picture is close to trivial, because the render
function already collects everything into a depth-sorted list. Next to the line
that adds the local player (`js/game.js:2936`), a loop adds the remote ones and
they sort into the scene correctly by themselves.

**They must stay out of everything else.** Remote players should never enter a
collision check, never be a monster's target, never be hit by an arrow, never
block a doorway, and never satisfy a proximity check in `checkProximity()`.
Keeping them in a list that only `render()` and the map ever read is the simplest
way to guarantee this, and it is worth being strict about — an accidental
interaction here is exactly the kind of bug that is miserable to find.

**They should look different from you.** A name plate above the head, and
probably a slight transparency, so it reads immediately that this is somebody
else's hero and not something you can walk up to and talk to.

## 4. Rooms, one per realm

A player in Cave 2 must not see a player standing in the meadow above them. The
room key is simple:

- `surface`
- `cave:0` … `cave:3`
- `sky`

The four places that change realm are already clean single functions to hook:
`enterCave()` (`js/game.js:2007`), `exitCave()` (`:2038`), `enterSky()` (`:2472`)
and `exitSky()` (`:2508`).

## 5. Names and identity

The game has no name entry, no character select, and no saved data of any kind.
Something has to go above the hero's head.

**Recommendation: do not let players type anything.** Give each player a name
picked from a generated list in the game's own voice — *Wanderer of the Fifth
Gem*, *Traveller Ashfeather* — remembered in `localStorage` so it is the same
each visit. A free text box is a text box shown to strangers, on a game made by a
child and played by children, and it would need filtering, reporting and someone
to handle it. Generated names cost nothing and remove the problem entirely.

For the same reason: **no chat.** Chat is not a feature, it is an ongoing
moderation duty. Seeing another hero wander past is the charming part; it does
not need words attached.

Players will already look meaningfully different from each other, because the
sprite is drawn wearing the equipped weapon, bow and armour, and those diverge
fast. That differentiation is free.

## 6. Actually finding each other — the real design problem

This is the part that is easy to miss, and it is not a coding problem.

The main world is 200 × 150 tiles at 32 pixels, which is 6400 × 4800 world pixels
(`js/constants.js:15`, `:29`, `:30`). The view is 600 pixels tall and between
about 800 and 1400 wide. **The visible area is somewhere near one fortieth of the
surface.** Two players wandering independently will almost never walk into each
other's view, and the honest outcome of building §1–§5 and stopping is a
multiplayer game where nobody ever sees anybody.

Three things fix it, and they are cheap:

- **Put other players on the maps.** The mini map already draws companions,
  monsters and bosses as coloured markers (`js/world.js:2372`). Another marker
  colour is about three lines. One deliberate change: companions and monsters are
  filtered by `inSightOf(player, c, sight)` so they only appear when close.
  Other players should *not* be filtered that way — being able to see that
  somebody is over by the lake is the entire point.
- **Say how many are here.** A small line in the HUD — "3 wanderers in the
  realm" — so a player alone at 4am understands the world is empty rather than
  thinking the feature is broken.
- **Everyone already starts on the same tile.** Green Meadow at `(10, 15)` is
  therefore the natural meeting place, and any two players who start within a few
  minutes of each other will see one another immediately. That is a genuinely
  lovely first impression and it is free.

## 7. What Tier 1 does *not* change

Worth stating clearly, because it sets expectations:

- Monsters are still spawned locally by each player's own copy of the game
  (`spawnMonsters()`, `js/game.js:401`, driven by `Math.random()`). You and the
  player standing next to you are fighting different trolls in the same field.
- Blue Gem placement is also `Math.random()` (`js/world.js:354`–`371`), so the
  gems are not even in the same places for two players. Invisible in Tier 1;
  a blocker for Tier 2.
- Fog of war stays entirely personal, which is correct — the map you have drawn
  is a record of *your* travels.
- Burning trees, the planted Worldtree, opened chests, collected gems and
  defeated bosses all stay local. If someone burns a forest down, the trees are
  still standing for you.

## 8. Effort

| Piece | Size |
|---|---|
| Relay server | ~150 lines, plus hosting set-up |
| `js/net.js` | ~250 lines |
| `RemotePlayer` + render hook | ~100 lines |
| Map markers and HUD count | ~30 lines |
| Generated names + `localStorage` | ~40 lines |

A few days of building and a careful week of testing on real phones and real
networks. **The code is the small half. Running a service forever is the large
half.**

---

# Tier 2, briefly — shared monsters and co-op

If the goal is ever *fighting alongside* another player rather than waving at
them, almost none of the above carries over, and it is worth knowing why.

The moment a monster must be dead for both players, the server has to be the
authority on whether it is alive. That means the server has to run the game:
monster movement and targeting, damage, drops, chest contents, boss triggers.
`Monster.update(dt, player, world)` (`js/entities.js:691`) and the combat system
(`js/combat.js:16`) would have to be extractable and runnable with no canvas and
no browser, and the client would need prediction and reconciliation so that
swinging a sword still feels instant over a 100ms connection.

Design questions arrive with it, and they are not small ones. Monsters that
target one player need to choose between several. There are 216 references to
`this.player` in `js/game.js` alone, and every one is an assumption that there is
exactly one hero. Who gets the Blue Gem when two people are standing on it? Does
the Black Knight scale with two players? What happens when a player who has
finished the game joins a player who has just started — and stands next to the
Black Knight with five gems and a lightning bolt? What stops somebody following a
stranger around and stealing every chest?

That is months rather than days, and it changes what the game *is*. Tier 1
changes nothing about the game at all — it just means you are not alone out
there.

# Recommendation

If Luca wants this, build Tier 1 and be honest that it is Tier 1. It keeps every
existing quest and ending exactly as it is, it needs no changes to the world or
the story, and the single-player game stays completely intact if the server ever
goes away. It gives the one thing that was asked for: another hero, walking the
meadow, at the same time as you.

The decision worth making *first* is not technical. It is whether the project
wants to own a service that has to stay switched on.
