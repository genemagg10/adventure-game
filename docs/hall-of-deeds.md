# Hall of Champions setup

The Hall of Champions is the board players open from the title screen and the pause menu. Underneath it is the same shared list of first-time public milestones. The game is a static GitHub Pages site, so the board has two layers:

1. This browser, always. Deeds are written to `localStorage` under `ingoizersWorld.hall` as soon as they happen.
2. A shared table. `js/hall-config.js` points at the Lafayette Pulse Supabase project (`https://kcrhxkebazpospwljpit.supabase.co`) with that project's publishable anon key. The schema is migration `016_hall_deeds` in [genemagg10/lafayette-pulse](https://github.com/genemagg10/lafayette-pulse). The table is `public.hall_deeds`. Anon may select and insert only. The insert check allows the 18 milestone id and label pairs below, and a tag of 1 to 16 characters using the characters the game allows, with `tag_key` equal to the normalized tag. CORS from `https://luca.maggio.xyz` is allowed.

Empty strings in the config still keep deeds on this browser only. Each new deed is queued locally (`synced: false`) until a send succeeds. A `409` (already there) counts as done. A `400`, `401`, or `403` — PostgREST's answer when a row violates RLS or a check, including `42501` — is logged once and dropped from the retry queue. The deed stays on this browser. Network errors and `5xx` responses stay queued.

Do not put a service-role key in the repo, in Pages, or in `hall-config.js`. The anon key is public. Row Level Security is what keeps the table safe.

## What the client sends

Each row is one player tag plus one milestone. The same tag and milestone keep the earliest timestamp. The client never updates or deletes a row.

| Column | Meaning |
|---|---|
| `tag_key` | The player tag, trimmed, lowercased. Used for the unique key. |
| `player_tag` | The tag as the player typed it (1–16 characters). |
| `sibling_name` | The sibling chosen for that run. |
| `milestone_id` | Stable id. See the allow-list below. |
| `milestone` | The words shown on the board. Must match the id. |
| `achieved_at` | When it first happened, UTC. The board prints it in Pacific Time. |

Public milestone ids and the exact labels the insert policy must accept:

| `milestone_id` | `milestone` |
|---|---|
| `makers-hollow` | Found Maker's Hollow |
| `black-knight` | Beat the Black Knight |
| `green-knight` | Beat the Green Knight |
| `giant-turtle` | Beat the Giant Snapping Turtle |
| `planted-worldtree` | Planted the Worldtree |
| `climbed-cloudlands` | Climbed to the Cloudlands |
| `beat-zeus` | Beat Zeus |
| `mended-worldtree` | Mended the Worldtree |
| `blue-gem-1` | Collected 1 Blue Gem |
| `blue-gem-2` | Collected 2 Blue Gems |
| `blue-gem-3` | Collected 3 Blue Gems |
| `blue-gem-4` | Collected 4 Blue Gems |
| `blue-gem-5` | Collected all Blue Gems |
| `clubhouse` | Found the Clubhouse |
| `charted-surface` | Charted the whole surface |
| `strange-key-copper` | Found a strange key |
| `strange-key-jade` | Found a strange key |
| `strange-key-crystal` | Found a strange key |

Keep this list in step with `HALL_MILESTONES` in `js/hall.js`. Anything not on the list is dropped by the client and should be rejected by the database. The Luca fight and the laser deeds are not on this list, so they never appear on the board. The three strange keys share one public label, "Found a strange key", and stay three separate milestones.

## How a champion is ranked

The database is unchanged. The client reads `tag_key`, `player_tag`, `milestone_id`, `milestone`, and `achieved_at`, paging with `limit` and `offset`. It groups those rows by tag. The same tag and milestone keep the earliest timestamp. Each champion is one row.

Score is the sum of the weights below. A champion who has every public deed also receives 10 points. That is the sixteen lines in the table, and the strange-key line counts only when the copper, jade, and crystal keys have all been found. The Best column then shows a diamond crown, and opening that champion starts with "Diamond · Full set · +10 pts". A higher score ranks first. Ties break by number of deeds, then by the hardest mark (a full set outranks any single deed), then by who reached that score first. The full-set bonus is reached when the last of those deeds lands. Opening a champion lists every deed, hardest first, with its tier and the Pacific time it happened.

| `milestone_id` | Weight | Tier |
|---|---:|---|
| `makers-hollow` | 1 | Early |
| `clubhouse` | 1 | Early |
| `blue-gem-1` | 1 | Early |
| `blue-gem-2` | 1 | Early |
| `blue-gem-3` | 2 | Road |
| `strange-key-copper` | 2 | Road |
| `strange-key-jade` | 2 | Road |
| `strange-key-crystal` | 2 | Road |
| `blue-gem-4` | 3 | Mid |
| `black-knight` | 3 | Mid |
| `green-knight` | 3 | Mid |
| `blue-gem-5` | 5 | Late |
| `giant-turtle` | 5 | Late |
| `planted-worldtree` | 5 | Late |
| `climbed-cloudlands` | 5 | Late |
| `charted-surface` | 5 | Late |
| `beat-zeus` | 8 | Ending |
| `mended-worldtree` | 8 | Ending |

A champion who has done all eighteen scores 72, the weights plus the full-set bonus. These weights live in `HALL_DEED_WEIGHT` in `js/hall.js`. The bonus is not stored in Supabase.

## Supabase

The live board is already the Lafayette Pulse project. Its schema is migration `016_hall_deeds` in `genemagg10/lafayette-pulse`. The script below is that table, kept here so the client and the database stay on the same list.

To point a different project at the same board:

1. Create a Supabase project and run the script below (or apply migration `016_hall_deeds`).
2. In Project Settings → API, copy the project URL and the publishable `anon` key.
3. Paste them into `js/hall-config.js`:

```js
const HALL_CONFIG = {
    supabaseUrl: "https://YOUR_PROJECT.supabase.co",
    supabaseAnonKey: "YOUR_ANON_KEY",
};
```

4. Commit that file and publish it. The Pages origin (`https://genemagg10.github.io`) and `https://luca.maggio.xyz` call the REST API with the anon key. No service role is involved.

The insert policy allows a new row only. There is no update or delete policy, so the first timestamp for a tag and milestone stays.

```sql
create table public.hall_deeds (
    id bigint generated always as identity primary key,
    tag_key text not null,
    player_tag text not null check (char_length(player_tag) between 1 and 16),
    sibling_name text not null check (char_length(sibling_name) between 1 and 24),
    milestone_id text not null,
    milestone text not null,
    achieved_at timestamptz not null default now(),
    unique (tag_key, milestone_id)
);

alter table public.hall_deeds enable row level security;

create policy hall_deeds_read
    on public.hall_deeds
    for select
    to anon, authenticated
    using (true);

create policy hall_deeds_insert
    on public.hall_deeds
    for insert
    to anon, authenticated
    with check (
        char_length(player_tag) between 1 and 16
        and tag_key = lower(regexp_replace(btrim(player_tag), '\s+', ' ', 'g'))
        and (milestone_id, milestone) in (
            ('makers-hollow', 'Found Maker''s Hollow'),
            ('black-knight', 'Beat the Black Knight'),
            ('green-knight', 'Beat the Green Knight'),
            ('giant-turtle', 'Beat the Giant Snapping Turtle'),
            ('planted-worldtree', 'Planted the Worldtree'),
            ('climbed-cloudlands', 'Climbed to the Cloudlands'),
            ('beat-zeus', 'Beat Zeus'),
            ('mended-worldtree', 'Mended the Worldtree'),
            ('blue-gem-1', 'Collected 1 Blue Gem'),
            ('blue-gem-2', 'Collected 2 Blue Gems'),
            ('blue-gem-3', 'Collected 3 Blue Gems'),
            ('blue-gem-4', 'Collected 4 Blue Gems'),
            ('blue-gem-5', 'Collected all Blue Gems'),
            ('clubhouse', 'Found the Clubhouse'),
            ('charted-surface', 'Charted the whole surface'),
            ('strange-key-copper', 'Found a strange key'),
            ('strange-key-jade', 'Found a strange key'),
            ('strange-key-crystal', 'Found a strange key')
        )
    );
```

Confirm in the table editor that RLS is on and that the `anon` role cannot update or delete.

## Checking it

Start a new game, enter a player tag, and do something the board records (finding Maker's Hollow is enough). Open Hall of Champions from the title screen. The champion is on this browser immediately, and the same deed is inserted into `hall_deeds`. A second browser with the same tag does not add a duplicate.
