# -*- coding: utf-8 -*-
"""Regenerate the binder's lore section straight from js/constants.js so the
printed binder can never drift from the words in the game.

Run from the repository root:  python3 docs/development-binder/regenerate_lore_section.py

When a lore entry is added or renamed in js/constants.js, add a matching
row to NOTES below - the script fails loudly on a title it does not know.
"""
import io, re, codecs

src = io.open("js/constants.js", encoding="utf-8").read()
block = src.split("const MERLIN_LORE = [", 1)[1].split("\n];", 1)[0]

entries = []
for chunk in re.findall(r"\{(.*?)\n    \}", block, re.S):
    def field(name):
        m = re.search(r'%s:\s*"((?:[^"\\]|\\.)*)"' % name, chunk, re.S)
        if not m:
            return None
        return codecs.decode(m.group(1), "unicode_escape")
    unlock = field("unlock")
    entries.append({"title": field("title"), "icon": field("icon"),
                    "text": field("text"), "unlock": unlock})

# Per-entry binder notes, keyed by title.
NOTES = {
 "The Legend of Ingoizer": ("Merlin's Hut.",
    "Establishes that Ingoizer is a family name carried by a long line, not a single hero's first name, and states the main quest."),
 "The House of Ingoizer": ("Merlin's Hut.",
    "Explains the two readings of the family name - curse or promise - which is the disagreement the whole Black Knight story rests on."),
 "The Five Blue Gems": ("Merlin's Hut; repeated in the message shown when a gem is collected.",
    "Explains who made the gems, what they do, and why they are spread across the land."),
 "Merlin the Wizard": ("Merlin's Hut; reinforced by Merlin's quest in the swamp.",
    "Explains Merlin's past, why he lives in the swamp, why his magic is weaker, and what his mallet does."),
 "The Black Knight": ("Merlin's Hut; reinforced outside Ing Castle.",
    "Keeps his real name a mystery but says plainly that he left a family and a destiny behind him. It sets up the tapestry without spoiling it."),
 "Ing Castle": ("Merlin's Hut; reinforced by the castle landmark and boss approach.",
    "Explains what the castle used to be and points at the covered tapestry on the north wall of the great hall."),
 "The Tapestry in the Great Hall": ("Merlin's Hut, but only after the tapestry has been read inside Ing Castle.",
    "The reveal: the Black Knight was Ingoizer's uncle. Hidden until the player has seen it in the world."),
 "The Sons of the Black Knight": ("Merlin's Hut, but only after the tapestry has been read inside Ing Castle.",
    "The Green Knight and the cave guardians are the Black Knight's sons and Ingoizer's cousins, and the guardians dug the caves themselves."),
 "The Lady of the Lake": ("Merlin's Hut; enacted through the Crystal Lake quest and the Fountain of Youth riddles.",
    "Explains who the Lady is, how Excalibur is earned, and states that she keeps the fountain as well as the lake."),
 "The Elemental Powers": ("Merlin's Hut; reinforced whenever a Blue Gem is collected.",
    "Explains the five elements and what each one does in a fight."),
 "The Lands of the Realm": ("Merlin's Hut; reinforced by map and zone-name displays.",
    "Names the main lands, notes that the four caves were dug on purpose rather than formed by nature, and points at the Fallow as the one country nothing has ever happened to."),
 "The Worldtree": ("Merlin's Hut; hinted again when Fire unlocks; discovered in the far northeast.",
    "Explains the tree and the fire-arrow key, and delivers the twist the old texts miss: the ladder is part of the tree, so burning it closes the only road between the two countries. All the fire leaves is ash and one seed, and the seed is now the way up."),
 "The Worldtree Seed": ("Merlin's Hut, but only after the Worldtree has burned and the seed is in hand.",
    "Explains that any planting grows a Worldtree with a ladder in it, so the Cloudlands open wherever the seed goes; that only the Waiting Ground in the Fallow will hold one; that a tree which never took folds back into the seed to be carried on; and that mending the boundary means giving up the fight with Zeus for good."),
 "The Fallow": ("Merlin's Hut, from the first minute; the Fallow itself is named on the map from the start.",
    "Says what the empty southeast corner of the map is for, and describes the plot of bare earth in the middle of it - the clue a player can find before they ever need it."),
 "The Cloudlands": ("Merlin's Hut; confirmed when climbing the Worldtree ladder.",
    "Introduces the sky world and states that mortals do not belong there - Zeus's second grievance."),
 "The Twelve Olympians": ("Merlin's Hut; demonstrated in the Temple of Olympus encounter.",
    "Explains Zeus's two grievances, the 12-part boss fight, and that replanting the Worldtree is the other way through - and states plainly that the two endings are exclusive: a Zeus who never rises can never be thrown down."),
}

out = []
out.append("# Merlin's Ancient Lore Library\n")
out.append(
 "The library holds %d entries at Merlin's Hut near Ing Castle. The player walks to the hut, presses E, "
 "and uses Previous and Next. %d of the entries are hidden at the start of the game and only appear on the "
 "shelf once the player has earned them in the world; they are marked **Hidden until earned** below. "
 "The exact words come from `js/constants.js`. The screen that shows them is built in `js/ui.js`.\n"
 % (len(entries), sum(1 for e in entries if e["unlock"])))
out.append(
 "> LUCA'S WORDS: The lore passages below are kept exactly as they appear in the current game. Some words may be "
 "above sixth-grade level because they are Luca's story words. They should not be simplified unless Luca chooses to edit them.\n")

for i, e in enumerate(entries, 1):
    learned, why = NOTES[e["title"]]
    out.append("## %d. %s\n" % (i, e["title"]))
    if e["unlock"]:
        out.append("**Hidden until earned.**  ")
    out.append("**Learned at:** %s  \n**Why it matters:** %s\n" % (learned, why))
    out.append("> %s\n" % e["text"])

new_section = "\n".join(out)

doc = io.open("docs/development-binder/BINDER_MASTER.md", encoding="utf-8").read()
start = doc.index("# Merlin's Ancient Lore Library")
end = doc.index("# Story Learned by Playing")
doc = doc[:start] + new_section + "\n" + doc[end:]
io.open("docs/development-binder/BINDER_MASTER.md", "w", encoding="utf-8").write(doc)
print("regenerated %d entries" % len(entries))
