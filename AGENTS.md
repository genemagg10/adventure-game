# Agent notes

Luca created Ingoizer's World and has the final say on story, characters, and what ships.

## Changelog

Every pull request adds an entry to `CHANGELOG.md` before it merges. The in-game What's New panel fetches that file, so the entry is what players read.

- Put the new entry first in the record, above the previous one.
- Its version is the pull request number, written `**v123**` for pull request 123. Do not invent a separate v0.x scheme.
- Date it in Pacific time, on the same line: `- **v123** — **Month D, YYYY** — [#123](https://github.com/genemagg10/adventure-game/pull/123) — One or two sentences about what changed for a player.`
- A commit that lands on main without a pull request does not take the next number. Mark it `**vN.1**` (then `.2`, `.3`) using the pull request it follows. The first writing, before v1, is `**Direct**`.
- Changelog entries must not spoil secrets or name the Luca boss. Do not name the sealed fight's weapon, the three named keys, or where a hidden door stands. Hint, instead, the way a story would: "Some say there's more to find for those who gather what's hidden." Lines that credit the maker, such as "Luca created the game" and "Luca, 2026", stay. The Hall's public names are enough.
