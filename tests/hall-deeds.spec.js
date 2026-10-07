const { test, expect } = require("@playwright/test");
const { openTitle, chooseCharacterAndBegin, openPause, dismissDialogs, startNewGame } = require("./helpers");

test.describe("Hall of Champions", () => {
    test("asks for a player tag after a sibling is chosen", async ({ page }) => {
        await openTitle(page);
        await page.click("#startBtn");
        await page.click('.char-card[data-id="elara"]');
        await expect(page.locator("#charBeginBtn")).toBeEnabled();
        await page.click("#charBeginBtn");
        await expect(page.locator("#tag-screen")).toBeVisible();
        await expect(page.locator("#tag-title")).toHaveText("What shall the Hall call you?");
        expect(await page.evaluate(() => window.game.state)).toBe("title");

        await expect(page.locator("#tagBeginBtn")).toBeDisabled();
        await expect(page.locator("#tag-screen")).toBeVisible();

        await page.fill("#player-tag", "Elara's Scout");
        await page.click("#tagBeginBtn");
        await page.waitForFunction(() => window.game.state === "playing");
        await dismissDialogs(page);
        const who = await page.evaluate(() => ({
            tag: window.game.player.playerTag,
            sibling: window.game.player.siblingId,
        }));
        expect(who).toEqual({ tag: "Elara's Scout", sibling: "elara" });
    });

    test("the board is on the title screen and the pause menu, and a deed is recorded once", async ({ page }) => {
        await openTitle(page);
        await page.evaluate(() => {
            HallOfDeeds.record({
                playerTag: "Mara",
                siblingName: "Lyra",
                milestoneId: "makers-hollow",
                at: Date.parse("2026-10-06T02:00:00Z"),
            });
            HallOfDeeds.record({
                playerTag: "Mara",
                siblingName: "Lyra",
                milestoneId: "makers-hollow",
                at: Date.parse("2026-11-01T02:00:00Z"),
            });
            HallOfDeeds.record({
                playerTag: "Mara",
                siblingName: "Lyra",
                milestoneId: "not-a-deed",
            });
        });

        await expect(page.locator("#hallBtn")).toHaveText("Hall of Champions");
        await page.click("#hallBtn");
        await expect(page.locator("#hall-overlay")).toBeVisible();
        await expect(page.locator("#hall-title")).toHaveText("Hall of Champions");
        const row = page.locator(".champion-row");
        await expect(row).toHaveCount(1);
        await expect(row).toContainText("Mara");
        await expect(row.locator(".champ-rank")).toHaveText("1");
        await expect(row.locator(".champ-score")).toHaveText("1");
        await expect(row.locator(".champ-count")).toHaveText("1");
        await row.click();
        const deed = page.locator(".champion-deed");
        await expect(deed).toContainText("A secret space was discovered");
        await expect(row.locator(".champ-badge")).toHaveAttribute("title", "A secret space was discovered");
        await expect(page.locator("#hall-overlay")).not.toContainText("Maker");
        await expect(deed).toContainText("Early · 1 pts");
        await expect(row.locator(".champ-twist")).toHaveText("▾");
        await expect(deed).toContainText("Oct 5, 2026 · 7:00 PM PT");
        await page.click("#hall-close");
        await expect(page.locator("#title-screen")).toBeVisible();

        // Begin a run without wiping the hall that was just written.
        await chooseCharacterAndBegin(page);
        await page.waitForFunction(() => window.game.state === "playing");
        await dismissDialogs(page);
        await openPause(page);
        await expect(page.locator("#pause-hall")).toHaveText("Hall of Champions");
        await page.click("#pause-hall");
        await expect(page.locator("#hall-overlay")).toBeVisible();
        await expect(page.locator("#pause-overlay")).toBeHidden();
        await expect(page.locator(".champion-row")).toHaveCount(1);
        await page.click("#hall-close");
        await expect(page.locator("#pause-overlay")).toBeVisible();
    });

    test("groups deeds by tag, keeps the earliest one, and ranks the weighted score", async ({ page }) => {
        await openTitle(page);
        const hour = 60 * 60 * 1000;
        const t = Date.parse("2026-10-06T02:00:00Z");
        const ranked = await page.evaluate((pack) => {
            const champs = HallOfDeeds.champions(pack.rows);
            const weights = Object.keys(HALL_MILESTONES).map((id) => HALL_DEED_WEIGHT[id].weight);
            return {
                covered: Object.keys(HALL_DEED_WEIGHT).slice().sort().join(),
                allowed: Object.keys(HALL_MILESTONES).slice().sort().join(),
                total: weights.reduce((sum, n) => sum + n, 0),
                champs: champs.map((c) => ({
                    tag: c.playerTag,
                    score: c.score,
                    count: c.count,
                    hardest: c.hardest,
                    hardestId: c.hardestId,
                    reachedAt: c.reachedAt,
                    deeds: c.deeds.map((d) => d.milestoneId),
                    keyLabel: c.deeds.filter((d) => d.milestoneId.startsWith("strange-key-")).map((d) => d.milestone),
                })),
            };
        }, { rows: championRows(t, hour) });

        expect(ranked.covered).toBe(ranked.allowed);
        expect(ranked.total).toBe(87);
        expect(ranked.champs.map((c) => c.tag)).toEqual([
            "Ivo", "Nia", "Bram", "Cass", "Dee", "Finn", "Gio", "Eve", "Ada", "Ann", "Zoe",
        ]);
        expect(ranked.champs[0]).toMatchObject({
            score: 31, count: 5, hardest: 10, hardestId: "luca-defeated",
            deeds: ["luca-defeated", "beat-zeus", "planted-worldtree", "giant-turtle", "black-knight"],
        });
        expect(ranked.champs[1]).toMatchObject({ score: 16, count: 3, hardest: 8 });
        expect(ranked.champs[2]).toMatchObject({ tag: "Bram", score: 6, count: 4, hardest: 3 });
        expect(ranked.champs[3]).toMatchObject({ tag: "Cass", score: 6, count: 3 });
        expect(ranked.champs[4]).toMatchObject({ tag: "Dee", score: 6, count: 2, hardest: 5 });
        expect(ranked.champs[5]).toMatchObject({ tag: "Finn", score: 6, count: 2, hardest: 3 });
        expect(ranked.champs[6]).toMatchObject({ tag: "Gio", score: 6, count: 2, hardest: 3 });
        expect(ranked.champs[7]).toMatchObject({ tag: "Eve", score: 6, count: 2, hardest: 3 });
        expect(ranked.champs[5].reachedAt).toBeLessThan(ranked.champs[6].reachedAt);
        expect(ranked.champs[6].reachedAt).toBeLessThan(ranked.champs[7].reachedAt);
        expect(ranked.champs[8]).toMatchObject({ tag: "Ada", score: 1, count: 1 });
        expect(ranked.champs[9].tag).toBe("Ann");
        expect(ranked.champs[10].tag).toBe("Zoe");
        expect(ranked.champs[9].reachedAt).toBe(ranked.champs[10].reachedAt);
        expect(ranked.champs[2].keyLabel).toEqual([]);
        const mara = await page.evaluate(() => {
            const early = Date.parse("2026-10-06T02:00:00Z");
            const late = Date.parse("2026-11-01T02:00:00Z");
            const champs = HallOfDeeds.champions([
                { tagKey: "mara", playerTag: "Mara Late", milestoneId: "makers-hollow", milestone: "Found Maker's Hollow", achievedAt: late },
                { tagKey: "mara", playerTag: "Mara", milestoneId: "makers-hollow", milestone: "Found Maker's Hollow", achievedAt: early },
                { tagKey: "mara", playerTag: "Mara", milestoneId: "strange-key-jade", milestone: "Found a strange key", achievedAt: late },
            ]);
            return champs[0];
        });
        expect(mara.playerTag).toBe("Mara");
        expect(mara.score).toBe(3);
        expect(mara.count).toBe(2);
        expect(mara.deeds.map((d) => d.milestone)).toEqual(["Found a strange key", "A secret space was discovered"]);
        expect(mara.deeds[1].achievedAt).toBe(Date.parse("2026-10-06T02:00:00Z"));
    });

    test("a full set of deeds is the jade crown and worth ten more", async ({ page }) => {
        await openTitle(page);
        const ranked = await page.evaluate(() => {
            const t = Date.parse("2026-10-06T02:00:00Z");
            const hour = 60 * 60 * 1000;
            const ids = Object.keys(HALL_MILESTONES);
            function pack(tag, completeAt, dropId) {
                return ids.filter((id) => id !== dropId).map((id, i) => ({
                    tagKey: tag.toLowerCase(),
                    playerTag: tag,
                    milestoneId: id,
                    milestone: HALL_MILESTONES[id],
                    achievedAt: i === ids.length - 1 || (dropId && i === ids.length - 2) ? completeAt : t + i * 1000,
                }));
            }
            const champs = HallOfDeeds.champions([
                ...pack("Quin", t + hour),
                ...pack("Vesper", t + 5 * hour),
                ...pack("Nim", t + 2 * hour, "strange-key-crystal"),
                ...pack("Pia", t + 3 * hour, "makers-hollow"),
            ]);
            return champs.map((c) => ({
                tag: c.playerTag,
                score: c.score,
                count: c.count,
                fullSet: c.fullSet,
                bonus: c.bonus,
                hardest: c.hardest,
                hardestMark: c.hardestMark,
                hardestTier: c.hardestTier,
                hardestLabel: c.hardestLabel,
                reachedAt: c.reachedAt,
                keys: c.deeds.filter((d) => d.milestoneId.startsWith("strange-key-")).map((d) => d.milestoneId),
            }));
        });

        expect(ranked.map((c) => c.tag)).toEqual(["Quin", "Vesper", "Pia", "Nim"]);
        expect(ranked[0]).toMatchObject({
            score: 97, count: 26, fullSet: true, bonus: 10, hardest: 10, hardestMark: 11,
            hardestTier: "Jade", hardestLabel: "Full set",
        });
        expect(ranked[0].keys).toEqual(["strange-key-copper", "strange-key-jade", "strange-key-crystal"]);
        expect(ranked[1]).toMatchObject({ score: 97, fullSet: true, hardestMark: 11 });
        expect(ranked[0].reachedAt).toBeLessThan(ranked[1].reachedAt);
        expect(ranked[2]).toMatchObject({ tag: "Pia", fullSet: false, bonus: 0, score: 86, count: 25, hardestMark: 10 });
        expect(ranked[3]).toMatchObject({ tag: "Nim", fullSet: false, bonus: 0, score: 85, count: 25 });
        expect(ranked[3].keys).not.toContain("strange-key-crystal");

        await page.evaluate(() => {
            const t = Date.parse("2026-10-06T02:00:00Z");
            const ids = Object.keys(HALL_MILESTONES);
            HallOfDeeds.writeStore(ids.map((id, i) => ({
                tagKey: "quin",
                playerTag: "Quin",
                siblingName: "Lyra",
                milestoneId: id,
                milestone: HALL_MILESTONES[id],
                achievedAt: t + i * 1000,
                synced: true,
            })));
        });
        await page.click("#hallBtn");
        const row = page.locator(".champion-row");
        await expect(row).toHaveCount(1);
        await expect(row.locator(".champ-score")).toHaveText("97");
        await expect(row.locator(".champ-count")).toHaveText("26");
        await expect(row.locator(".champ-badge")).toHaveAttribute("data-tier", "Jade");
        await expect(row).toHaveClass(/champion-row-jade/);
        const badgeColor = await row.locator(".champ-badge").evaluate((el) => getComputedStyle(el).color);
        expect(badgeColor).toBe("rgb(61, 206, 124)");
        await page.emulateMedia({ reducedMotion: "reduce" });
        const still = await row.locator(".champ-badge-icon").evaluate((el) => getComputedStyle(el).animationName);
        expect(still).toBe("none");
        await row.click();
        await expect(page.locator(".champion-deed").first()).toHaveText("Jade · Full set · +10 pts");
        await expect(page.locator(".champion-deed").nth(1).locator(".deed-tier")).toHaveText("Legend · 10 pts");
    });

    test("beating Luca is worth ten and the laser stays off the board", async ({ page }) => {
        await openTitle(page);
        const result = await page.evaluate(() => {
            const luca = HallOfDeeds.record({
                playerTag: "Mara",
                siblingName: "Lyra",
                milestoneId: "luca-defeated",
            });
            const again = HallOfDeeds.record({
                playerTag: "Mara",
                siblingName: "Lyra",
                milestoneId: "luca-defeated",
            });
            const laser = HallOfDeeds.record({
                playerTag: "Mara",
                siblingName: "Lyra",
                milestoneId: "laser-gun",
            });
            const champs = HallOfDeeds.champions(HallOfDeeds.readStore());
            return {
                luca: luca && luca.milestone,
                again: again && again.milestoneId,
                laser,
                stored: HallOfDeeds.readStore().map((d) => d.milestoneId),
                score: champs[0].score,
                tier: champs[0].hardestTier,
                hardest: champs[0].hardest,
                weight: HALL_DEED_WEIGHT["luca-defeated"],
            };
        });
        expect(result.luca).toBe("Beat Luca");
        expect(result.again).toBe("luca-defeated");
        expect(result.laser).toBeNull();
        expect(result.stored).toEqual(["luca-defeated"]);
        expect(result.score).toBe(10);
        expect(result.tier).toBe("Legend");
        expect(result.hardest).toBe(10);
        expect(result.weight).toEqual({ weight: 10, tier: "Legend" });

        await page.click("#hallBtn");
        const row = page.locator(".champion-row");
        await expect(row.locator(".champ-badge")).toHaveAttribute("data-tier", "Legend");
        const color = await row.locator(".champ-badge").evaluate((el) => getComputedStyle(el).color);
        expect(color).toBe("rgb(26, 143, 74)");
        await row.click();
        await expect(page.locator(".champion-deed").first().locator(".deed-name")).toHaveText("Beat Luca");
        await expect(page.locator(".champion-deed").first().locator(".deed-tier")).toHaveText("Legend · 10 pts");
        await expect(page.locator("#hall-overlay")).not.toContainText("Laser");
    });

    test("a champion opens from a click, the keyboard, and a gamepad button", async ({ page }) => {
        await openTitle(page);
        const hour = 60 * 60 * 1000;
        const t = Date.parse("2026-10-06T02:00:00Z");
        await page.evaluate((rows) => {
            HallOfDeeds.writeStore(rows);
        }, seedChampions(championRows(t, hour), ["Ivo", "Nia"]));

        await page.click("#hallBtn");
        const rows = page.locator(".champion-row");
        await expect(rows).toHaveCount(2);
        await expect(rows.first()).toBeFocused();
        await expect(rows.first().locator(".champ-twist")).toHaveText("▸");
        await expect(rows.first().locator(".champ-tag")).toHaveText("Ivo");
        await expect(rows.first().locator(".champ-score")).toHaveText("31");
        await expect(rows.nth(1).locator(".champ-tag")).toHaveText("Nia");

        await page.keyboard.press("Space");
        await expect(rows.first()).toHaveAttribute("aria-expanded", "true");
        const ivoDeeds = page.locator(".champion").first().locator(".champion-deed");
        await expect(ivoDeeds).toHaveCount(5);
        await expect(ivoDeeds.first().locator(".deed-name")).toHaveText("Beat Luca");
        await expect(rows.first().locator(".champ-twist")).toHaveText("▾");
        await expect(ivoDeeds.first().locator(".deed-tier")).toHaveText("Legend · 10 pts");
        await expect(ivoDeeds.nth(1).locator(".deed-name")).toHaveText("Beat Zeus");
        await expect(ivoDeeds.nth(1).locator(".deed-tier")).toHaveText("Ending · 8 pts");

        await page.keyboard.press("ArrowDown");
        await expect(rows.nth(1)).toBeFocused();
        await page.keyboard.press("Enter");
        await expect(rows.nth(1)).toHaveAttribute("aria-expanded", "true");
        await expect(page.locator(".champion").nth(1).locator(".deed-name").first()).toHaveText("Mended the Worldtree");

        await page.evaluate(() => {
            window.game.ui.applyChampionPad({ up: true, down: false, activate: false });
            window.game.ui.applyChampionPad({ up: false, down: false, activate: true });
        });
        await expect(rows.first()).toBeFocused();
        await expect(rows.first()).toHaveAttribute("aria-expanded", "false");
        await expect(rows.first().locator(".champ-twist")).toHaveText("▸");
    });

    test("the champion list fits a phone landscape screen", async ({ page }) => {
        await page.setViewportSize({ width: 844, height: 390 });
        await openTitle(page);
        const hour = 60 * 60 * 1000;
        const t = Date.parse("2026-10-06T02:00:00Z");
        await page.evaluate((rows) => {
            HallOfDeeds.writeStore(rows);
        }, seedChampions(championRows(t, hour), ["Ivo", "Nia", "Bram"]));
        await page.click("#hallBtn");
        await expect(page.locator(".champion-row")).toHaveCount(3);
        await page.locator(".champion-row").first().click();
        const panel = await page.locator(".hall-panel").boundingBox();
        const scroll = await page.locator(".hall-scroll").boundingBox();
        const back = await page.locator("#hall-close").boundingBox();
        expect(panel).toBeTruthy();
        expect(scroll).toBeTruthy();
        expect(back).toBeTruthy();
        expect(panel.y).toBeGreaterThanOrEqual(0);
        expect(panel.y + panel.height).toBeLessThanOrEqual(392);
        expect(scroll.y + scroll.height).toBeLessThanOrEqual(back.y + 1);
        await expect(page.locator(".champion-deed").first()).toBeVisible();
    });

    test("reads the shared hall in pages and does not write while reading", async ({ page }) => {
        await openTitle(page);
        const result = await page.evaluate(async () => {
            const previous = HallOfDeeds.PAGE_SIZE;
            HallOfDeeds.PAGE_SIZE = 2;
            const urls = [];
            const methods = [];
            window.fetch = async (url, opts) => {
                urls.push(String(url));
                methods.push((opts && opts.method) || "GET");
                const offset = Number(new URL(url, "http://local").searchParams.get("offset") || 0);
                const pageRows = offset === 0
                    ? [
                        { tag_key: "ada", player_tag: "Ada", milestone_id: "makers-hollow", milestone: "Found Maker's Hollow", achieved_at: "2026-10-06T02:00:00.000Z" },
                        { tag_key: "ada", player_tag: "Ada", milestone_id: "clubhouse", milestone: "Found the Clubhouse", achieved_at: "2026-10-06T03:00:00.000Z" },
                    ]
                    : [
                        { tag_key: "bram", player_tag: "Bram", milestone_id: "black-knight", milestone: "Beat the Black Knight", achieved_at: "2026-10-06T04:00:00.000Z" },
                    ];
                return { ok: true, status: 200, json: async () => pageRows };
            };
            try {
                const rows = await HallOfDeeds.fetchRemote();
                return {
                    count: rows.length,
                    tags: rows.map((r) => r.playerTag),
                    urls,
                    methods,
                };
            } finally {
                HallOfDeeds.PAGE_SIZE = previous;
            }
        });
        expect(result.count).toBe(3);
        expect(result.tags).toEqual(["Ada", "Ada", "Bram"]);
        expect(result.methods).toEqual(["GET", "GET"]);
        expect(result.urls[0]).toContain("select=tag_key,player_tag,milestone_id,milestone,achieved_at");
        expect(result.urls[0]).toContain("limit=2");
        expect(result.urls[0]).toContain("offset=0");
        expect(result.urls[1]).toContain("offset=2");
        expect(result.urls.join("\n")).not.toContain("on_conflict");
    });

    test("Pacific timestamps and the public list stay free of the sealed fight", async ({ page }) => {
        await openTitle(page);
        const info = await page.evaluate(() => {
            const ids = Object.keys(HALL_MILESTONES);
            const labels = Object.values(HALL_MILESTONES).join("\n");
            return {
                ids,
                labels,
                winter: HallOfDeeds.formatPacific(new Date("2026-01-15T20:30:00Z")),
                summer: HallOfDeeds.formatPacific(new Date("2026-07-15T19:30:00Z")),
                winterWords: HallOfDeeds.formatWhen(new Date("2026-01-15T20:30:00Z")),
                summerWords: HallOfDeeds.formatWhen(new Date("2026-07-15T19:30:00Z")),
            };
        });
        expect(info.summer).toBe("2026-07-15T12:30:00-07:00");
        expect(info.winter).toBe("2026-01-15T12:30:00-08:00");
        expect(info.summerWords).toBe("Jul 15, 2026 · 12:30 PM PT");
        expect(info.winterWords).toBe("Jan 15, 2026 · 12:30 PM PT");
        expect(info.labels).not.toMatch(/Laser Gun/);
        expect(HALL_LABEL(info, "luca-defeated")).toBe("Beat Luca");
        expect(HALL_LABEL(info, "lady-of-the-lake")).toBe("Helped the Lady of the Lake");
        expect(HALL_LABEL(info, "helped-merlin")).toBe("Helped Merlin");
        expect(info.ids.some(id => id.startsWith("strange-key-"))).toBe(true);
        for (const id of info.ids.filter(id => id.startsWith("strange-key-"))) {
            expect(HALL_LABEL(info, id)).toBe("Found a strange key");
        }
    });

    test("the Lady and Merlin quests are recorded once, when the reward is granted", async ({ page }) => {
        await openTitle(page);
        await chooseCharacterAndBegin(page);
        await page.waitForFunction(() => window.game.state === "playing");
        await dismissDialogs(page);
        const result = await page.evaluate(() => {
            const g = window.game;
            g.ladyQuestState = "given";
            g.player.hasSheath = false;
            g.startLadyQuest();
            g.merlinQuestState = "given";
            g.startMerlinQuest();
            const before = HallOfDeeds.readStore().map((d) => d.milestoneId);

            g.player.hasSheath = true;
            g.ladyQuestState = "sheath_acquired";
            g.startLadyQuest();
            g.startLadyQuest();
            g.player.hasMerlinWand = true;
            g.merlinQuestState = "wand_acquired";
            g.startMerlinQuest();
            g.startMerlinQuest();
            const mine = HallOfDeeds.readStore().filter((d) => d.playerTag === g.player.playerTag);
            const withoutLady = HallOfDeeds.champions(mine.filter((d) => d.milestoneId !== "lady-of-the-lake"));
            return {
                ladyWeight: HALL_DEED_WEIGHT["lady-of-the-lake"],
                merlinWeight: HALL_DEED_WEIGHT["helped-merlin"],
                before,
                lady: g.ladyQuestState,
                excalibur: g.world.ladyOfLake.excaliburGiven,
                weapon: g.player.currentWeapon,
                merlin: g.merlinQuestState,
                mallet: g.player.hasMallet,
                wand: g.player.hasMerlinWand,
                labels: mine.map((d) => d.milestone).sort(),
                counts: {
                    lady: mine.filter((d) => d.milestoneId === "lady-of-the-lake").length,
                    merlin: mine.filter((d) => d.milestoneId === "helped-merlin").length,
                },
                partialFullSet: withoutLady.length ? withoutLady[0].fullSet : false,
            };
        });
        expect(result.ladyWeight).toEqual({ weight: 3, tier: "Mid" });
        expect(result.merlinWeight).toEqual({ weight: 3, tier: "Mid" });
        expect(result.before).toEqual([]);
        expect(result.lady).toBe("complete");
        expect(result.excalibur).toBe(true);
        expect(result.weapon).toBe("excalibur");
        expect(result.merlin).toBe("complete");
        expect(result.mallet).toBe(true);
        expect(result.wand).toBe(false);
        expect(result.counts).toEqual({ lady: 1, merlin: 1 });
        expect(result.labels).toEqual(["Helped Merlin", "Helped the Lady of the Lake"]);
        expect(result.partialFullSet).toBe(false);
    });

    test("the hollow keeps its old stored sentence and shows the vague label", async ({ page }) => {
        await openTitle(page);
        const sent = await page.evaluate(async () => {
            let body = null;
            window.fetch = async (_url, opts) => {
                if (opts && opts.body) body = opts.body;
                return { ok: true, status: 201, json: async () => [] };
            };
            HallOfDeeds.writeStore([]);
            HallOfDeeds.record({
                playerTag: "Mara",
                siblingName: "Lyra",
                milestoneId: "makers-hollow",
            });
            await HallOfDeeds.flush();
            const row = HallOfDeeds.readStore()[0];
            const champ = HallOfDeeds.champions(HallOfDeeds.readStore())[0];
            return {
                posted: body ? JSON.parse(body).milestone : null,
                stored: row.milestone,
                shown: champ.deeds[0].milestone,
                best: champ.hardestLabel,
            };
        });
        expect(sent.posted).toBe("Found Maker's Hollow");
        expect(sent.stored).toBe("Found Maker's Hollow");
        expect(sent.shown).toBe("A secret space was discovered");
        expect(sent.best).toBe("A secret space was discovered");
    });

    test("each cave and the castle secret are one deed, and caves collapse", async ({ page }) => {
        await startNewGame(page);
        const recorded = await page.evaluate(() => {
            const g = window.game;
            const notes = [];
            const orig = g.ui.showNotification.bind(g.ui);
            g.ui.showNotification = (text) => {
                notes.push(text);
                orig(text);
            };
            g.enterMakersHollow();
            g.ui.closeAbout();
            for (const entrance of CAVE_ENTRANCES) {
                g.enterCave(entrance);
                g.exitCave(entrance);
                g.enterCave(entrance);
                g.exitCave(entrance);
            }
            g.world.revealHiddenLadder();
            const hl = g.world.hiddenLadder;
            g.player.x = hl.baseCenterX;
            g.player.y = hl.baseCenterY;
            g.checkHiddenBaseTreasure();
            g.checkHiddenBaseTreasure();
            const ids = HallOfDeeds.readStore().map((d) => d.milestoneId).sort();
            return {
                notes,
                ids,
                weights: {
                    "cave-sw": HALL_DEED_WEIGHT["cave-sw"],
                    "cave-se": HALL_DEED_WEIGHT["cave-se"],
                    "cave-nw": HALL_DEED_WEIGHT["cave-nw"],
                    "cave-ne": HALL_DEED_WEIGHT["cave-ne"],
                    "hidden-base": HALL_DEED_WEIGHT["hidden-base"],
                },
            };
        });
        expect(recorded.notes.some((text) => text.includes("A secret space was discovered"))).toBe(true);
        expect(recorded.notes.join(" ")).not.toContain("Maker");
        expect(recorded.ids).toEqual([
            "cave-ne", "cave-nw", "cave-se", "cave-sw", "hidden-base", "makers-hollow",
        ]);
        expect(recorded.weights["cave-sw"]).toEqual({ weight: 1, tier: "Early" });
        expect(recorded.weights["cave-se"]).toEqual({ weight: 1, tier: "Early" });
        expect(recorded.weights["cave-nw"]).toEqual({ weight: 2, tier: "Road" });
        expect(recorded.weights["cave-ne"]).toEqual({ weight: 2, tier: "Road" });
        expect(recorded.weights["hidden-base"]).toEqual({ weight: 3, tier: "Mid" });

        await dismissDialogs(page);
        await openPause(page);
        await page.click("#pause-hall");
        await page.locator(".champion-row").click();
        await expect(page.locator(".cave-group-toggle")).toContainText("4 caves");
        await expect(page.locator(".cave-group-list")).toBeHidden();
        await page.locator(".cave-group-toggle").click();
        const caves = page.locator(".cave-group-list .deed-name");
        await expect(caves).toHaveText([
            "Explored the NW Cave",
            "Explored the NE Cave",
            "Explored the SW Cave",
            "Explored the SE Cave",
        ]);
        await expect(page.locator(".champion-deed .deed-name", { hasText: "Another secret space was discovered" })).toBeVisible();
        await expect(page.locator("#hall-overlay")).not.toContainText("Black Knight");
        await expect(page.locator("#hall-overlay")).not.toContainText("Maker");
    });

    test("the crown key shows the six metals in order", async ({ page }) => {
        await openTitle(page);
        await page.click("#hallBtn");
        await expect(page.locator(".crown-key-item")).toHaveText([
            "Bronze", "Silver", "Gold", "Crystal", "Diamond", "Jade",
        ]);
        const colors = await page.locator(".crown-key-item .champ-badge").evaluateAll((els) => (
            els.map((el) => getComputedStyle(el).color)
        ));
        expect(colors).toEqual([
            "rgb(193, 122, 58)",
            "rgb(197, 204, 212)",
            "rgb(230, 179, 37)",
            "rgb(143, 212, 234)",
            "rgb(245, 248, 255)",
            "rgb(26, 143, 74)",
        ]);
        expect(new Set(colors).size).toBe(6);
        await expect(page.locator(".crown-key-note")).toHaveText("A full set wears the jade crown with a star.");
    });
});

test("a deed the database refuses is dropped, and only network errors are retried", async ({ page }) => {
    await openTitle(page);
    const notes = [];
    page.on("console", (msg) => notes.push(msg.text()));
    const result = await page.evaluate(async () => {
        const base = {
            tagKey: "mara",
            playerTag: "Mara",
            siblingName: "Lyra",
            milestoneId: "makers-hollow",
            milestone: "Found Maker's Hollow",
            achievedAt: Date.parse("2026-10-06T02:00:00Z"),
            synced: false,
        };
        const calls = [];
        async function trial(kind) {
            calls.length = 0;
            HallOfDeeds.writeStore([{ ...base, synced: false }]);
            window.fetch = async () => {
                calls.push(kind);
                if (kind === "offline") throw new Error("offline");
                const status = kind;
                const ok = status >= 200 && status < 300;
                return { ok, status, json: async () => [] };
            };
            await HallOfDeeds.flush();
            const once = calls.length;
            await HallOfDeeds.flush();
            const row = HallOfDeeds.readStore()[0];
            return {
                kind,
                once,
                twice: calls.length,
                synced: !!row.synced,
                dropped: !!row.dropped,
            };
        }
        return {
            refused: [
                await trial(400),
                await trial(401),
                await trial(403),
            ],
            done: [await trial(409), await trial(201)],
            retry: [await trial(503), await trial("offline")],
        };
    });

    for (const row of result.refused) {
        expect(row.once).toBe(1);
        expect(row.twice).toBe(1);
        expect(row.synced).toBe(false);
        expect(row.dropped).toBe(true);
    }
    for (const row of result.done) {
        expect(row.once).toBe(1);
        expect(row.twice).toBe(1);
        expect(row.synced).toBe(true);
        expect(row.dropped).toBe(false);
    }
    for (const row of result.retry) {
        expect(row.once).toBe(1);
        expect(row.twice).toBe(2);
        expect(row.synced).toBe(false);
        expect(row.dropped).toBe(false);
    }
    const refusedLogs = notes.filter(text => text.includes("Hall of Deeds refused a deed"));
    expect(refusedLogs).toEqual([
        "Hall of Deeds refused a deed (400): makers-hollow",
        "Hall of Deeds refused a deed (401): makers-hollow",
        "Hall of Deeds refused a deed (403): makers-hollow",
    ]);
});

function HALL_LABEL(info, id) {
    const start = info.ids.indexOf(id);
    return info.labels.split("\n")[start];
}

function seedChampions(rows, tags) {
    const keep = new Set(tags);
    return rows
        .filter((row) => keep.has(row.playerTag) && HALL_MILESTONES_FOR_SEED.has(row.milestoneId))
        .map((row) => ({ ...row, siblingName: "Lyra", synced: true }));
}

const HALL_MILESTONES_FOR_SEED = new Set([
    "makers-hollow", "black-knight", "green-knight", "giant-turtle", "planted-worldtree",
    "climbed-cloudlands", "beat-zeus", "mended-worldtree", "blue-gem-1", "blue-gem-2",
    "blue-gem-3", "blue-gem-4", "blue-gem-5", "clubhouse", "charted-surface",
    "strange-key-copper", "strange-key-jade", "strange-key-crystal",
    "lady-of-the-lake", "helped-merlin", "luca-defeated",
]);

function championRows(t, hour) {
    const row = (tag, id, label, at) => ({
        tagKey: tag.toLowerCase(),
        playerTag: tag,
        milestoneId: id,
        milestone: label,
        achievedAt: at,
    });
    return [
        row("Ivo", "beat-zeus", "Beat Zeus", t + 5 * hour),
        row("Ivo", "giant-turtle", "Beat the Giant Snapping Turtle", t + 4 * hour),
        row("Ivo", "planted-worldtree", "Planted the Worldtree", t + 3 * hour),
        row("Ivo", "black-knight", "Beat the Black Knight", t + 2 * hour),
        row("Ivo", "luca-defeated", "Beat Luca", t),
        row("Nia", "mended-worldtree", "Mended the Worldtree", t + hour),
        row("Nia", "climbed-cloudlands", "Climbed to the Cloudlands", t),
        row("Nia", "green-knight", "Beat the Green Knight", t + 2 * hour),
        row("Bram", "black-knight", "Beat the Black Knight", t),
        row("BRAM", "black-knight", "Beat the Black Knight", t + 50 * hour),
        row("Bram", "makers-hollow", "Found Maker's Hollow", t + hour),
        row("Bram", "clubhouse", "Found the Clubhouse", t + 2 * hour),
        row("Bram", "blue-gem-1", "Collected 1 Blue Gem", t + 3 * hour),
        row("Cass", "green-knight", "Beat the Green Knight", t),
        row("Cass", "blue-gem-3", "Collected 3 Blue Gems", t + hour),
        row("Cass", "blue-gem-1", "Collected 1 Blue Gem", t + 2 * hour),
        row("Dee", "giant-turtle", "Beat the Giant Snapping Turtle", t + 10 * hour),
        row("Dee", "makers-hollow", "Found Maker's Hollow", t),
        row("Finn", "green-knight", "Beat the Green Knight", t),
        row("Finn", "black-knight", "Beat the Black Knight", t + hour),
        row("Gio", "green-knight", "Beat the Green Knight", t + 2 * hour),
        row("Gio", "black-knight", "Beat the Black Knight", t + 5 * hour),
        row("Eve", "black-knight", "Beat the Black Knight", t + 8 * hour),
        row("Eve", "blue-gem-4", "Collected 4 Blue Gems", t + 9 * hour),
        row("Ada", "makers-hollow", "Found Maker's Hollow", t + 20 * hour),
        row("Ann", "clubhouse", "Found the Clubhouse", t + 30 * hour),
        row("Zoe", "clubhouse", "Found the Clubhouse", t + 30 * hour),
    ];
}
