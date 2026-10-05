# Hall of Deeds setup

The Hall of Deeds is a shared list of first-time public milestones. The game is a static GitHub Pages site, so the board has two layers:

1. This browser, always. Deeds are written to `localStorage` under `ingoizersWorld.hall` as soon as they happen.
2. A shared table, optional. When `js/hall-config.js` has a Supabase project URL and an **anon** key, the client inserts rows and reads the table back. Until those two strings are filled in, the Hall shows only what this browser has recorded, and each new deed stays queued locally (`synced: false`) until a later visit can send it.

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

Keep this list in step with `HALL_MILESTONES` in `js/hall.js`. Anything not on the list is dropped by the client and should be rejected by the database.

## Supabase

1. Create a free Supabase project.
2. In the SQL editor, run the script below.
3. In Project Settings → API, copy the project URL and the `anon` `public` key.
4. Paste them into `js/hall-config.js`:

```js
const HALL_CONFIG = {
    supabaseUrl: "https://YOUR_PROJECT.supabase.co",
    supabaseAnonKey: "YOUR_ANON_KEY",
};
```

5. Commit that file and let GitHub Pages publish it. The Pages origin (`https://genemagg10.github.io`) calls the REST API with the anon key. Supabase REST accepts that from the browser. No service role is involved.

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

Start a new game, enter a player tag, and do something the board records (finding Maker's Hollow is enough). Open Hall of Deeds from the title screen. The row should be there on this browser even before Supabase is filled in. After the config is published, the same row should appear in `hall_deeds`, and a second browser with the same tag should not add a duplicate.
