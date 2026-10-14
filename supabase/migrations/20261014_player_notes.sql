-- Notes shared from the game. Nobody playing can read them back.
-- The share-with-luca edge function is the only writer, and it uses the
-- service role, which bypasses row level security.

create table public.player_notes (
    id uuid primary key default gen_random_uuid(),
    category text not null,
    message text not null,
    player_name text not null default '',
    contact text not null default '',
    ip_hash text not null default '',
    created_at timestamptz not null default now(),
    constraint player_notes_category_check check (
        category in ('idea', 'request', 'frustration', 'story', 'accomplishment', 'discovery')
    ),
    constraint player_notes_message_check check (char_length(message) between 1 and 2000),
    constraint player_notes_name_check check (char_length(player_name) <= 40),
    constraint player_notes_contact_check check (char_length(contact) <= 120),
    constraint player_notes_ip_check check (char_length(ip_hash) <= 64)
);

create index player_notes_ip_created_idx
    on public.player_notes (ip_hash, created_at desc);

alter table public.player_notes enable row level security;

revoke all on table public.player_notes from public, anon, authenticated;
grant all on table public.player_notes to service_role;

comment on table public.player_notes is
    'Notes shared with Luca. No public policies: the edge function writes with the service role.';
