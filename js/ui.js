// ============================================
// Ingoizer's World - UI System
// ============================================

class UIManager {
    constructor(game) {
        this.game = game;
        this.dialogQueue = [];
        this.dialogActive = false;
        this.notificationTimer = 0;

        // DOM references
        this.titleScreen = document.getElementById("title-screen");
        this.characterScreen = document.getElementById("character-screen");
        this.characterGrid = document.getElementById("character-grid");
        this.charBeginBtn = document.getElementById("charBeginBtn");
        this.charHint = document.getElementById("char-hint");
        this.selectedSiblingId = null;
        this.charScreenBuilt = false;
        this.controlsScreen = document.getElementById("controls-screen");
        this.hud = document.getElementById("hud");
        this.healthFill = document.getElementById("health-fill");
        this.healthText = document.getElementById("health-text");
        this.gemCount = document.getElementById("gem-count");
        this.goldCount = document.getElementById("gold-count");
        this.weaponDisplay = document.getElementById("current-weapon");
        this.mapOverlay = document.getElementById("map-overlay");
        this.shopOverlay = document.getElementById("shop-overlay");
        this.shopTitle = document.getElementById("shop-title");
        this.shopGoldCount = document.getElementById("shop-gold-count");
        this.shopItems = document.getElementById("shop-items");
        this.shopTabs = document.getElementById("shop-tabs");
        this.merchantPortrait = document.getElementById("merchant-portrait");
        this.merchantName = document.getElementById("merchant-name");
        this.merchantGreeting = document.getElementById("merchant-greeting");
        this.inventoryOverlay = document.getElementById("inventory-overlay");
        this.inventoryTabs = document.getElementById("inventory-tabs");
        this.inventoryItems = document.getElementById("inventory-items");
        this.inventoryRelics = document.getElementById("inventory-relics");
        this.inventoryHero = document.getElementById("inventory-hero");
        this.equippedSummary = document.getElementById("equipped-summary");
        this.invWeapons = document.getElementById("inventory-weapons");
        this.invGems = document.getElementById("inventory-gems");
        this.arrowCount = document.getElementById("arrow-count");
        this.keyPipRow = document.getElementById("key-pips");
        this.keyPips = document.querySelectorAll("#key-pips .key-pip");
        this.arrowIcon = document.getElementById("arrow-icon");
        this.greenGemCounter = document.getElementById("green-gem-counter");
        this.greenGemCount = document.getElementById("green-gem-count");
        this.skyCounter = document.getElementById("sky-counter");
        this.skyKillCount = document.getElementById("sky-kill-count");
        this.potionCount = document.getElementById("potion-count");
        this.appleCount = document.getElementById("apple-count");
        this.energyBar = document.getElementById("energy-bar");
        this.energyFill = document.getElementById("energy-fill");
        this.energyText = document.getElementById("energy-text");
        this.companionCounter = document.getElementById("companion-counter");
        this.companionCount = document.getElementById("companion-count");
        this.questItems = document.getElementById("quest-items");
        this.invBows = document.getElementById("inventory-bows");
        this.invArmor = document.getElementById("inventory-armor");
        this.invCompanions = document.getElementById("inventory-companions");
        this.dialogBox = document.getElementById("dialog-box");
        this.dialogText = document.getElementById("dialog-text");
        this.gameOverScreen = document.getElementById("game-over-screen");
        this.gameOverTitle = document.getElementById("game-over-title");
        this.gameOverText = document.getElementById("game-over-text");
        this.keepPlayingBtn = document.getElementById("keepPlayingBtn");
        this.restartBtn = document.getElementById("restartBtn");
        this.gameOverNote = document.getElementById("game-over-note");
        // Set once the leave button has asked whether the unsaved run can go.
        this.gameOverQuitArmed = false;

        this.enchantOverlay = document.getElementById("enchant-overlay");
        this.enchantItems = document.getElementById("enchant-items");
        this.enchantElements = document.getElementById("enchant-elements");
        this.enchantElementDesc = document.getElementById("enchant-element-desc");

        this.loreOverlay = document.getElementById("lore-overlay");
        this.loreContent = document.getElementById("lore-content");
        this.lorePage = 0;

        this.riddleOverlay = document.getElementById("riddle-overlay");
        this.riddleQuestion = document.getElementById("riddle-question");
        this.riddleChoices = document.getElementById("riddle-choices");
        this.riddleResult = document.getElementById("riddle-result");
        this.riddleCallback = null;

        this.activeShopCategory = "weapons";
        this.activeInventoryCategory = "gear";

        this.elemSlots = {
            fire: document.getElementById("elem-fire"),
            water: document.getElementById("elem-water"),
            ice: document.getElementById("elem-ice"),
            lightning: document.getElementById("elem-lightning"),
            earth: document.getElementById("elem-earth"),
        };
        this._hudSignature = null;

        this.setupButtons();
    }

    setupButtons() {
        document.getElementById("startBtn").addEventListener("click", () => {
            this.openCharacterSelect();
        });

        document.getElementById("charBackBtn").addEventListener("click", () => {
            this.closeCharacterSelect();
        });

        document.getElementById("charControlsBtn").addEventListener("click", () => {
            this.openControls("character");
        });

        this.charBeginBtn.addEventListener("click", () => {
            if (!this.selectedSiblingId) return;
            this.openPlayerTag();
        });

        const tagInput = document.getElementById("player-tag");
        const tagBegin = document.getElementById("tagBeginBtn");
        if (tagInput && tagBegin) {
            tagInput.addEventListener("input", () => {
                const ok = !!HallOfDeeds.normalizeTag(tagInput.value);
                tagBegin.disabled = !ok;
                const hint = document.getElementById("tag-hint");
                if (hint) hint.textContent = "";
            });
            tagInput.addEventListener("keydown", (e) => {
                if (e.key === "Enter" && !tagBegin.disabled) tagBegin.click();
            });
            tagBegin.addEventListener("click", () => {
                const tag = HallOfDeeds.normalizeTag(tagInput.value);
                const hint = document.getElementById("tag-hint");
                if (!tag) {
                    if (hint) hint.textContent = "A short name, please.";
                    return;
                }
                document.getElementById("tag-screen").classList.add("hidden");
                this.game.startGame(this.selectedSiblingId, tag);
            });
        }
        const tagBack = document.getElementById("tagBackBtn");
        if (tagBack) {
            tagBack.addEventListener("click", () => {
                this.game.sound.menuSelect();
                document.getElementById("tag-screen").classList.add("hidden");
                this.characterScreen.classList.remove("hidden");
            });
        }

        const hallBtn = document.getElementById("hallBtn");
        if (hallBtn) hallBtn.addEventListener("click", () => this.openHall("title"));
        const pauseHall = document.getElementById("pause-hall");
        if (pauseHall) pauseHall.addEventListener("click", () => this.openHall("pause"));
        const hallClose = document.getElementById("hall-close");
        if (hallClose) hallClose.addEventListener("click", () => this.closeHall());
        this.bindHallKeys();

        document.getElementById("continueBtn").addEventListener("click", () => {
            if (this.continueSlot === null || this.continueSlot === undefined) return;
            this.game.loadFromSlot(this.continueSlot);
        });

        document.getElementById("pause-resume").addEventListener("click", () => {
            this.closePause();
        });

        document.getElementById("pause-save").addEventListener("click", () => {
            this.openSlots("save", "pause");
        });

        document.getElementById("pause-load").addEventListener("click", () => {
            this.openSlots("load", "pause");
        });

        document.getElementById("pause-controls").addEventListener("click", () => {
            this.openControls("pause");
        });

        document.getElementById("loadBtn").addEventListener("click", () => {
            this.openSlots("load", "title");
        });

        document.getElementById("slots-close").addEventListener("click", () => {
            this.closeSlots();
        });

        document.getElementById("pause-quit").addEventListener("click", () => {
            this.closePause();
            this.game.restart();
        });

        document.getElementById("controlsBtn").addEventListener("click", () => {
            this.openControls("title");
        });

        document.getElementById("backBtn").addEventListener("click", () => {
            this.closeControls();
        });

        document.getElementById("shop-close").addEventListener("click", () => {
            this.closeShop();
        });

        document.getElementById("enchant-close").addEventListener("click", () => {
            this.closeEnchant();
        });

        document.getElementById("lore-close").addEventListener("click", () => {
            this.closeLore();
        });

        document.getElementById("lore-prev").addEventListener("click", () => {
            if (this.lorePage > 0) {
                this.lorePage--;
                this.renderLorePage();
            }
        });

        document.getElementById("lore-next").addEventListener("click", () => {
            if (this.lorePage < this.unlockedLore().length - 1) {
                this.lorePage++;
                this.renderLorePage();
            }
        });

        document.getElementById("inv-close").addEventListener("click", () => {
            this.closeInventory();
        });

        document.getElementById("map-close").addEventListener("click", () => {
            if (this.isMapOpen()) this.toggleMap();
        });

        document.getElementById("about-close").addEventListener("click", () => {
            this.closeAbout();
        });

        document.getElementById("keepPlayingBtn").addEventListener("click", () => {
            this.closeGameOver();
        });

        document.getElementById("restartBtn").addEventListener("click", () => {
            // A defeat has nothing to lose; an ending reached mid-run does.
            const armable = this.gameOverScreen.classList.contains("victory");
            if (armable && !this.gameOverQuitArmed) {
                this.armGameOverQuit();
                return;
            }
            this.closeGameOver();
            this.game.restart();
        });
    }

    showHud() {
        this._hudSignature = null;
        this.hud.classList.remove("hidden");
    }

    hideHud() {
        this.hud.classList.add("hidden");
    }

    updateHud(player) {
        const following = this.game.aliveCompanionCount ? this.game.aliveCompanionCount() : 0;
        const weapon = player.getWeapon();
        const bow = player.getBow();
        const armor = player.getArmor();
        const elementState = Object.keys(this.elemSlots)
            .map(key => `${key}:${player.elements[key] ? 1 : 0}:${player.activeElement === key ? 1 : 0}`)
            .join(",");
        const signature = [
            Math.ceil(player.hp), player.maxHp, player.blueGems,
            this.game.greenlandsUnlocked, player.greenGemAttack, player.greenGemDefense,
            player.gold, player.arrows, player.hasZeusBolts,
            this.game.inSky, this.game.olympianSummoned, this.game.olympianDefeated,
            this.game.zeusAppeased, this.game.skyMonsterKills,
            player.healthPotions, player.greaterHealthPotions, player.apples, following,
            Math.ceil(player.energy), player.maxEnergy, player.sprinting,
            weapon.name, weapon.damage, bow.name, bow.damage, armor.name, armor.defense,
            player.hasMerlinWand, player.hasSheath, player.hasWorldtreeSeed,
            this.game.ladyQuestState, this.game.touchControls && this.game.touchControls.active,
            (player.heldKeys || []).join(","),
            elementState,
        ].join("|");
        if (signature === this._hudSignature) return false;
        this._hudSignature = signature;

        // Health
        const hpPercent = (player.hp / player.maxHp) * 100;
        this.healthFill.style.width = hpPercent + "%";
        this.healthText.textContent = `${Math.ceil(player.hp)}/${player.maxHp}`;

        // Health bar color
        if (hpPercent > 50) {
            this.healthFill.style.background = "linear-gradient(180deg, #4caf50 0%, #2e7d32 100%)";
        } else if (hpPercent > 25) {
            this.healthFill.style.background = "linear-gradient(180deg, #ff9800 0%, #e65100 100%)";
        } else {
            this.healthFill.style.background = "linear-gradient(180deg, #f44336 0%, #b71c1c 100%)";
        }

        // Energy - fills on apples, drains on sprint. The bar goes bright and
        // pulses while sprinting, and greys out when there is nothing left.
        if (this.energyFill) {
            const maxEnergy = player.maxEnergy || ENERGY_CONFIG.max;
            const energyPercent = clamp((player.energy / maxEnergy) * 100, 0, 100);
            this.energyFill.style.width = energyPercent + "%";
            if (this.energyText) {
                this.energyText.textContent = `${Math.ceil(player.energy)}/${maxEnergy}`;
            }
            if (this.energyBar) {
                this.energyBar.classList.toggle("sprinting", !!player.sprinting);
                this.energyBar.classList.toggle("empty", player.energy <= 0);
            }
        }

        // Gems
        this.gemCount.textContent = player.blueGems;

        // Green gems (show after Black Knight defeated)
        const greenGemEl = this.greenGemCounter;
        if (greenGemEl) {
            if (this.game.greenlandsUnlocked) {
                greenGemEl.classList.remove("hidden");
                const count = (player.greenGemAttack ? 1 : 0) + (player.greenGemDefense ? 1 : 0);
                this.greenGemCount.textContent = count;
            } else {
                greenGemEl.classList.add("hidden");
            }
        }

        // Gold
        this.goldCount.textContent = player.gold;

        // Arrows - once Zeus falls, every arrow in the quiver is one of his bolts
        this.arrowCount.textContent = player.arrows;
        if (this.keyPips && this.keyPips.length) {
            const held = player.heldKeys || [];
            // The empty notches spell out that three strange keys exist.
            // Keep the whole row off the HUD until the first one is in hand.
            if (this.keyPipRow) this.keyPipRow.classList.toggle("hidden", held.length === 0);
            for (const pip of this.keyPips) {
                pip.classList.toggle("on", held.indexOf(pip.dataset.key) !== -1);
            }
        }
        const arrowIcon = this.arrowIcon;
        if (arrowIcon) {
            const bowNow = BOWS[player.currentBow];
            const laser = !!(bowNow && bowNow.bolt === "laser" && typeof LaserIcon !== "undefined");
            const mode = laser ? "laser" : (player.hasZeusBolts ? "zeus" : "arrow");
            if (arrowIcon.dataset.mode !== mode) {
                arrowIcon.dataset.mode = mode;
                if (laser) {
                    arrowIcon.innerHTML = LaserIcon.markup();
                    arrowIcon.title = bowNow.name;
                } else {
                    arrowIcon.textContent = player.hasZeusBolts ? ZEUS_BOLT.icon : "🏹";
                    arrowIcon.title = player.hasZeusBolts
                        ? `${ZEUS_BOLT.name} (+${ZEUS_BOLT.damageBonus} DMG)`
                        : "Arrows";
                }
            }
        }

        // Cloudlands keeper counter (only while up in the sky, before the summon)
        const skyEl = this.skyCounter;
        if (skyEl) {
            if (this.game.inSky && !this.game.olympianSummoned && !this.game.olympianDefeated && !this.game.zeusAppeased) {
                skyEl.classList.remove("hidden");
                this.skyKillCount.textContent = this.game.skyMonsterKills;
            } else {
                skyEl.classList.add("hidden");
            }
        }

        // Health potions
        const potionEl = this.potionCount;
        if (potionEl) {
            potionEl.textContent = player.healthPotions + player.greaterHealthPotions;
        }

        // Apples
        const appleEl = this.appleCount;
        if (appleEl) {
            appleEl.textContent = player.apples;
        }

        // Animal companions (only shown once you have one)
        const companionWrap = this.companionCounter;
        if (companionWrap) {
            if (following > 0) {
                companionWrap.classList.remove("hidden");
                this.companionCount.textContent = following;
            } else {
                companionWrap.classList.add("hidden");
            }
        }

        // Weapon & Armor. The laser uses the same drawn icon as the inventory.
        const defText = armor.defense > 0 ? `  |  ${armor.icon} DEF: ${armor.defense}` : "";
        const laserHud = bow.bolt === "laser" && typeof LaserIcon !== "undefined";
        const hudKey = weapon.name + "|" + bow.name + "|" + (laserHud ? "laser" : bow.icon) + "|" + armor.defense;
        if (this._weaponHudKey !== hudKey) {
            this._weaponHudKey = hudKey;
            const bowMark = laserHud ? LaserIcon.markup() : bow.icon;
            const line = `${weapon.icon} ${weapon.name}  |  ${bowMark} ${bow.name}${defText}`;
            if (laserHud) this.weaponDisplay.innerHTML = line;
            else this.weaponDisplay.textContent = line;
        }

        // Carried quest items sit at the end of the counter row: a small
        // gold-edged chip each, with the errand in its tooltip.
        const questEl = this.questItems;
        if (questEl) {
            const touch = this.game.touchControls && this.game.touchControls.active;
            const carrying = [];
            if (player.hasMerlinWand) {
                carrying.push({ icon: "\ud83e\ude84", label: "Merlin's Wand - take it back to Merlin" });
            }
            if (player.hasSheath && this.game.ladyQuestState !== "complete") {
                carrying.push({ icon: "\ud83d\udde1\uFE0F", label: "Jewel Sheath - take it back to the Lady of the Lake" });
            }
            if (player.hasWorldtreeSeed) {
                carrying.push({
                    icon: WORLDTREE_SEED.icon,
                    label: `${WORLDTREE_SEED.name} - ${touch ? "plant it" : "press P to plant it"} to open the way to the Cloudlands. In the bare earth of the Fallow, far to the southeast, it also buys peace`,
                });
            }

            // Rebuilt only when the list actually changes; this runs every frame.
            const signature = carrying.map(q => q.label).join("~");
            if (signature !== this._questSignature) {
                this._questSignature = signature;
                questEl.innerHTML = "";
                for (const q of carrying) {
                    const chip = document.createElement("span");
                    chip.className = "quest-item-icon";
                    chip.textContent = q.icon;
                    chip.title = q.label;
                    questEl.appendChild(chip);
                }
            }
        }

        // Element slots
        for (const [key, slot] of Object.entries(this.elemSlots)) {
            slot.classList.remove("unlocked", "active");
            if (player.elements[key]) {
                slot.classList.add("unlocked");
            }
            if (player.activeElement === key) {
                slot.classList.add("active");
            }
        }
        return true;
    }

    // Zone name display
    showZoneName(ctx, zoneName) {
        ctx.save();
        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        ctx.fillRect(CANVAS_W / 2 - 100, 40, 200, 30);
        ctx.fillStyle = "#ffd700";
        ctx.font = "14px monospace";
        ctx.textAlign = "center";
        ctx.fillText(zoneName, CANVAS_W / 2, 60);
        ctx.restore();
    }

    // Dialog system
    showDialog(text, callback) {
        this.dialogQueue.push({ text, callback });
        if (!this.dialogActive) {
            this.showNextDialog();
        }
    }

    showNextDialog() {
        if (this.dialogQueue.length === 0) {
            this.dialogActive = false;
            this.dialogBox.classList.add("hidden");
            return;
        }
        this.dialogActive = true;
        const dialog = this.dialogQueue[0];
        this.dialogText.textContent = dialog.text;
        this.dialogBox.classList.remove("hidden");
    }

    advanceDialog() {
        if (!this.dialogActive) return;
        const dialog = this.dialogQueue.shift();
        if (dialog && dialog.callback) dialog.callback();
        this.showNextDialog();
    }

    // Notification
    showNotification(text) {
        this.clearNotification();

        const el = document.createElement("div");
        el.className = "notification";
        el.textContent = text;
        document.getElementById("game-container").appendChild(el);
        this.notificationTimer = setTimeout(() => {
            el.remove();
            this.notificationTimer = 0;
        }, 2500);
    }

    clearNotification() {
        if (this.notificationTimer) {
            clearTimeout(this.notificationTimer);
            this.notificationTimer = 0;
        }
        document.querySelectorAll(".notification").forEach(el => el.remove());
    }

    // The Maker's Hollow
    openAbout() {
        this.aboutOverlay = this.aboutOverlay || document.getElementById("about-overlay");
        this.renderHollowDoorways();
        this.aboutOverlay.classList.remove("hidden");
    }

    // Fill the Hollow's wall of doorways from the places the player has found.
    // Rebuilt each time the room is opened, so newly discovered landmarks show
    // up without a reload.
    renderHollowDoorways() {
        const container = document.getElementById("hollow-doorways");
        if (!container) return;
        container.innerHTML = "";
        const dests = this.game.hollowDestinations ? this.game.hollowDestinations() : [];
        if (!dests.length) {
            const none = document.createElement("p");
            none.className = "hollow-hint";
            none.textContent = "The doorways are dark - explore the realm and they will open.";
            container.appendChild(none);
            return;
        }
        for (const d of dests) {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "hollow-door";
            btn.setAttribute("aria-label", `Travel to ${d.label}`);
            const glyph = document.createElement("span");
            glyph.className = "hollow-door-glyph";
            glyph.setAttribute("aria-hidden", "true");
            glyph.textContent = d.glyph;
            const name = document.createElement("span");
            name.textContent = d.label;
            btn.appendChild(glyph);
            btn.appendChild(name);
            btn.addEventListener("click", () => {
                this.game.teleportFromHollow(d.x, d.y, d.label);
            });
            container.appendChild(btn);
        }
    }

    closeAbout() {
        this.aboutOverlay = this.aboutOverlay || document.getElementById("about-overlay");
        this.aboutOverlay.classList.add("hidden");
    }

    isAboutOpen() {
        this.aboutOverlay = this.aboutOverlay || document.getElementById("about-overlay");
        return !this.aboutOverlay.classList.contains("hidden");
    }

    // Controls
    // ============================================
    // Character selection - the Ingoizer siblings
    // ============================================

    openPlayerTag() {
        this.game.sound.menuSelect();
        this.characterScreen.classList.add("hidden");
        const screen = document.getElementById("tag-screen");
        screen.classList.remove("hidden");
        const input = document.getElementById("player-tag");
        const begin = document.getElementById("tagBeginBtn");
        if (begin) begin.disabled = !HallOfDeeds.normalizeTag(input.value);
        const hint = document.getElementById("tag-hint");
        if (hint) hint.textContent = "";
        if (input) input.focus();
    }

    openHall(returnTo) {
        this.clearNotification();
        this.game.sound.menuSelect();
        this.hallReturnTo = returnTo;
        this.pauseOverlay = this.pauseOverlay || document.getElementById("pause-overlay");
        if (returnTo === "pause") this.pauseOverlay.classList.add("hidden");
        else if (returnTo === "title") this.titleScreen.classList.add("hidden");
        const overlay = document.getElementById("hall-overlay");
        overlay.classList.remove("hidden");
        const status = document.getElementById("hall-status");
        if (status) {
            status.textContent = HallOfDeeds.configured()
                ? "A shared record. The first time a name earns a deed, it stays."
                : "Recorded on this device until a shared hall is connected.";
        }
        const rows = document.getElementById("hall-rows");
        if (rows) rows.innerHTML = "";
        const empty = document.getElementById("hall-empty");
        if (empty) {
            empty.classList.remove("hidden");
            empty.textContent = "Reading the hall…";
        }
        HallOfDeeds.loadBoard().then((deeds) => {
            if (overlay.classList.contains("hidden")) return;
            this.renderHall(deeds);
        }).catch(() => {
            if (!overlay.classList.contains("hidden")) this.renderHall(HallOfDeeds.readStore());
        });
        this.startChampionPad();
    }

    renderHall(deeds) {
        const rows = document.getElementById("hall-rows");
        const empty = document.getElementById("hall-empty");
        const head = document.querySelector("#hall-overlay .champion-head");
        if (!rows) return;
        rows.innerHTML = "";
        const champs = HallOfDeeds.champions(deeds);
        if (empty) {
            empty.textContent = "No champions yet.";
            empty.classList.toggle("hidden", champs.length > 0);
        }
        if (head) head.classList.toggle("hidden", champs.length === 0);
        champs.forEach((champ, i) => {
            const block = document.createElement("div");
            block.className = "champion";

            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = champ.diamond ? "champion-row champion-row-diamond" : "champion-row";
            btn.setAttribute("aria-expanded", "false");
            const panelId = "champion-deeds-" + i;
            btn.setAttribute("aria-controls", panelId);
            btn.setAttribute("aria-label",
                `Rank ${champ.rank}, ${champ.playerTag}, score ${champ.score}, ${champ.count} deeds, hardest ${champ.hardestLabel}`);

            const twist = document.createElement("span");
            twist.className = "champ-twist";
            twist.setAttribute("aria-hidden", "true");
            twist.textContent = "▸";

            const rank = document.createElement("span");
            rank.className = "champ-rank";
            rank.textContent = String(champ.rank);

            const tag = document.createElement("span");
            tag.className = "champ-tag";
            tag.textContent = champ.playerTag || "";

            const score = document.createElement("span");
            score.className = "champ-score";
            score.textContent = String(champ.score);

            const count = document.createElement("span");
            count.className = "champ-count";
            count.textContent = String(champ.count);

            const badge = document.createElement("span");
            badge.className = "champ-badge";
            badge.dataset.tier = champ.hardestTier || "";
            badge.title = champ.hardestLabel || "";
            badge.innerHTML = this.championBadgeSvg(champ.hardestTier);
            const badgeName = document.createElement("span");
            badgeName.className = "visually-hidden";
            badgeName.textContent = champ.hardestLabel || "";
            badge.appendChild(badgeName);

            btn.append(twist, rank, tag, score, count, badge);

            const panel = document.createElement("div");
            panel.id = panelId;
            panel.className = "champion-deeds hidden";
            panel.setAttribute("role", "region");
            panel.setAttribute("aria-label", `${champ.playerTag} accomplishments`);
            if (champ.diamond) {
                const bonus = document.createElement("div");
                bonus.className = "champion-deed champion-deed-diamond";
                const bonusText = document.createElement("span");
                bonusText.className = "deed-name";
                bonusText.textContent = "Diamond · Full set · +10 pts";
                bonus.appendChild(bonusText);
                panel.appendChild(bonus);
            }
            for (const deed of champ.deeds) {
                const line = document.createElement("div");
                line.className = "champion-deed";
                const name = document.createElement("span");
                name.className = "deed-name";
                name.textContent = deed.milestone || "";
                const tier = document.createElement("span");
                tier.className = "deed-tier";
                tier.textContent = `${deed.tier} · ${deed.weight} pts`;
                const when = document.createElement("span");
                when.className = "deed-when";
                when.textContent = HallOfDeeds.formatWhen(deed.achievedAt);
                line.append(name, tier, when);
                panel.appendChild(line);
            }

            btn.addEventListener("click", () => {
                const open = btn.getAttribute("aria-expanded") === "true";
                btn.setAttribute("aria-expanded", open ? "false" : "true");
                twist.textContent = open ? "▸" : "▾";
                panel.classList.toggle("hidden", open);
            });

            block.append(btn, panel);
            rows.appendChild(block);
        });
        const board = rows.closest(".hall-scroll");
        if (board) {
            const range = document.createRange();
            let nameWidth = 0;
            rows.querySelectorAll(".champ-tag").forEach((el) => {
                range.selectNodeContents(el);
                nameWidth = Math.max(nameWidth, range.getBoundingClientRect().width);
            });
            board.style.setProperty("--champ-name", Math.ceil(nameWidth + 12) + "px");
        }
        const first = rows.querySelector(".champion-row");
        if (first) first.focus();
        else {
            const back = document.getElementById("hall-close");
            if (back) back.focus();
        }
    }

    championBadgeSvg(tier) {
        // One crown for every tier. Color, set on the badge, is the metal.
        const crown = '<path class="champ-crown" fill="currentColor" d="M1.4 11.4h13.2v2.2H1.4Zm.7-1.3 1.7-5.1 2.5 2.6L8 2.1l1.7 5.5 2.5-2.6 1.7 5.1Z"/>';
        if (tier === "Legend") {
            // A star over the same crown, so a weight of 10 sits above Ending gold.
            const star = '<path fill="currentColor" d="M8-3.4 8.7-1.6 10.6-1.2 8.7-.8 8 .9 7.3-.8 5.4-1.2 7.3-1.6Z"/>';
            return `<svg class="champ-badge-icon champ-badge-legend" viewBox="0 -4 16 20" aria-hidden="true">${star}${crown}</svg>`;
        }
        if (tier !== "Diamond") {
            return `<svg class="champ-badge-icon" viewBox="0 0 16 16" aria-hidden="true">${crown}</svg>`;
        }
        // A readable gem sits on the crown, with a spark that can shimmer.
        const gem = '<path class="champ-gem" fill="#5adfff" d="M8-2.2 11.4 1.5 8 5.2 4.6 1.5Z"/>';
        const facet = '<path class="champ-gem-facet" fill="#dff8ff" d="M8-.8 9.7 1.5 8 3.8 6.3 1.5Z"/>';
        const spark = '<path class="champ-spark" fill="#ffffff" d="M13.2-1.6 13.55-.55 14.6-.2 13.55.15 13.2 1.2 12.85.15 11.8-.2 12.85-.55Z"/>';
        return `<svg class="champ-badge-icon champ-badge-diamond" viewBox="0 -3.4 16 19.4" aria-hidden="true">${crown}${gem}${facet}${spark}</svg>`;
    }

    bindHallKeys() {
        if (this._hallKeys) return;
        this._hallKeys = (e) => {
            if (!this.isHallOpen()) return;
            if (e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")) return;
            if (e.code === "ArrowUp" || e.code === "ArrowDown") {
                e.preventDefault();
                e.stopPropagation();
                this.moveChampionFocus(e.code === "ArrowDown" ? 1 : -1);
            } else if (e.code === "Space") {
                const overlay = document.getElementById("hall-overlay");
                const btn = document.activeElement;
                e.preventDefault();
                e.stopPropagation();
                if (!e.repeat && btn && overlay && overlay.contains(btn) && btn.tagName === "BUTTON") btn.click();
            } else if (e.code === "Escape") {
                e.preventDefault();
                e.stopPropagation();
                if (!e.repeat) this.closeHall();
            }
        };
        window.addEventListener("keydown", this._hallKeys, true);
    }

    moveChampionFocus(dir) {
        const rows = [...document.querySelectorAll("#hall-rows .champion-row")];
        if (!rows.length) return;
        let index = rows.indexOf(document.activeElement);
        if (index < 0) index = dir > 0 ? -1 : rows.length;
        const next = rows[Math.max(0, Math.min(rows.length - 1, index + dir))];
        if (next) next.focus();
    }

    applyChampionPad(state) {
        const prev = this._padPrev || {};
        const up = !!(state && state.up);
        const down = !!(state && state.down);
        const activate = !!(state && state.activate);
        if (up && !prev.up) this.moveChampionFocus(-1);
        if (down && !prev.down) this.moveChampionFocus(1);
        if (activate && !prev.activate) {
            const btn = document.activeElement;
            if (btn && btn.classList && btn.classList.contains("champion-row")) btn.click();
        }
        this._padPrev = { up, down, activate };
    }

    startChampionPad() {
        this.stopChampionPad();
        this._padPrev = {};
        const tick = () => {
            if (!this.isHallOpen()) {
                this._padFrame = 0;
                return;
            }
            this._padFrame = requestAnimationFrame(tick);
            const pads = navigator.getGamepads ? navigator.getGamepads() : [];
            let up = false;
            let down = false;
            let activate = false;
            for (const pad of pads) {
                if (!pad) continue;
                const axis = pad.axes && pad.axes.length > 1 ? pad.axes[1] : 0;
                const buttons = pad.buttons || [];
                up = up || !!(buttons[12] && buttons[12].pressed) || axis < -0.5;
                down = down || !!(buttons[13] && buttons[13].pressed) || axis > 0.5;
                activate = activate || !!(buttons[0] && buttons[0].pressed);
            }
            this.applyChampionPad({ up, down, activate });
        };
        this._padFrame = requestAnimationFrame(tick);
    }

    stopChampionPad() {
        if (this._padFrame) cancelAnimationFrame(this._padFrame);
        this._padFrame = 0;
    }

    closeHall() {
        this.stopChampionPad();
        this.game.sound.menuSelect();
        const overlay = document.getElementById("hall-overlay");
        if (overlay) overlay.classList.add("hidden");
        this.pauseOverlay = this.pauseOverlay || document.getElementById("pause-overlay");
        if (this.hallReturnTo === "pause") this.pauseOverlay.classList.remove("hidden");
        else if (this.hallReturnTo === "title") {
            this.titleScreen.classList.remove("hidden");
            this.refreshContinue();
        }
    }

    isHallOpen() {
        const overlay = document.getElementById("hall-overlay");
        return !!(overlay && !overlay.classList.contains("hidden"));
    }

    openCharacterSelect() {
        this.game.sound.menuSelect();
        if (typeof SiblingPortrait !== "undefined") SiblingPortrait.preload();
        this.buildCharacterGrid();
        this.titleScreen.classList.add("hidden");
        this.characterScreen.classList.remove("hidden");
    }

    closeCharacterSelect() {
        this.game.sound.menuSelect();
        this.characterScreen.classList.add("hidden");
        this.titleScreen.classList.remove("hidden");
    }

    isCharacterSelectOpen() {
        return !this.characterScreen.classList.contains("hidden");
    }

    // Build the hero cards once, then reuse them. Each card is a portrait from
    // the game's own character concept art on a dark plate; selecting one arms
    // the Begin button and names the hero in the caption below the row.
    buildCharacterGrid() {
        if (this.charScreenBuilt || typeof INGOIZER_SIBLINGS === "undefined") return;

        this.characterGrid.innerHTML = "";
        for (const sib of INGOIZER_SIBLINGS) {
            const card = document.createElement("button");
            card.type = "button";
            card.className = "char-card";
            card.setAttribute("role", "radio");
            card.setAttribute("aria-checked", "false");
            card.setAttribute("aria-label", `${sib.name}, ${sib.epithet}`);
            card.dataset.id = sib.id;

            const img = document.createElement("img");
            img.className = "char-portrait";
            img.src = SiblingPortrait.imageSrc(sib);
            img.alt = "";
            img.draggable = false;
            card.appendChild(img);

            const tag = document.createElement("span");
            tag.className = "char-card-name";
            tag.textContent = sib.name;
            card.appendChild(tag);

            card.addEventListener("click", () => this.selectSibling(sib.id));
            card.addEventListener("dblclick", () => {
                this.selectSibling(sib.id);
                this.charBeginBtn.click();
            });

            this.characterGrid.appendChild(card);
        }
        this.charScreenBuilt = true;
    }

    selectSibling(id) {
        this.game.sound.menuSelect();
        this.selectedSiblingId = id;
        const sib = SiblingPortrait.byId(id);
        for (const card of this.characterGrid.querySelectorAll(".char-card")) {
            const chosen = card.dataset.id === id;
            card.classList.toggle("selected", chosen);
            card.setAttribute("aria-checked", chosen ? "true" : "false");
        }
        this.charBeginBtn.disabled = false;
        if (sib && this.charHint) {
            const kin = sib.gender === "girl" ? "Sister" : "Brother";
            this.charHint.innerHTML =
                `<strong>${sib.name}</strong> · <em>${sib.epithet}</em> · ${kin} of the Ingoizer line`;
        }
    }

    openControls(returnTo) {
        this.pauseOverlay = this.pauseOverlay || document.getElementById("pause-overlay");
        this.controlsReturnTo = returnTo;
        if (returnTo === "pause") this.pauseOverlay.classList.add("hidden");
        else if (returnTo === "character") this.characterScreen.classList.add("hidden");
        else this.titleScreen.classList.add("hidden");
        this.controlsScreen.classList.remove("hidden");
    }

    closeControls() {
        this.pauseOverlay = this.pauseOverlay || document.getElementById("pause-overlay");
        this.controlsScreen.classList.add("hidden");
        if (this.controlsReturnTo === "pause") this.pauseOverlay.classList.remove("hidden");
        else if (this.controlsReturnTo === "character") this.characterScreen.classList.remove("hidden");
        else this.titleScreen.classList.remove("hidden");
    }

    isControlsOpen() {
        return !this.controlsScreen.classList.contains("hidden");
    }

    // Pause menu
    openPause() {
        this.pauseOverlay = this.pauseOverlay || document.getElementById("pause-overlay");
        this.pauseOverlay.classList.remove("hidden");
        this.game.paused = true;
    }

    closePause() {
        this.pauseOverlay = this.pauseOverlay || document.getElementById("pause-overlay");
        this.pauseOverlay.classList.add("hidden");
        this.game.paused = false;
    }

    // Everything the pause menu can put on screen, torn down at once - used
    // when the game underneath is being replaced or abandoned.
    closeMenus() {
        this.pauseOverlay = this.pauseOverlay || document.getElementById("pause-overlay");
        document.getElementById("slots-overlay").classList.add("hidden");
        this.controlsScreen.classList.add("hidden");
        const hall = document.getElementById("hall-overlay");
        if (hall) hall.classList.add("hidden");
        this.stopChampionPad();
        const tag = document.getElementById("tag-screen");
        if (tag) tag.classList.add("hidden");
        this.pauseOverlay.classList.add("hidden");
        this.closeGameOver();
        this.slotsPending = null;
        this.game.paused = false;
    }

    isPauseOpen() {
        this.pauseOverlay = this.pauseOverlay || document.getElementById("pause-overlay");
        return !this.pauseOverlay.classList.contains("hidden");
    }

    // ============================================
    // Save slots
    // ============================================
    //
    // One panel serves both saving and loading. `mode` decides what a row
    // does when it is chosen and which rows are choosable at all - an empty
    // slot is somewhere to save but nothing to load.

    openSlots(mode, returnTo) {
        this.pauseOverlay = this.pauseOverlay || document.getElementById("pause-overlay");
        this.slotsMode = mode;
        this.slotsReturnTo = returnTo;
        this.slotsPending = null;
        this.slotsMessage = "";

        const overlay = document.getElementById("slots-overlay");
        document.getElementById("slots-title").textContent =
            mode === "save" ? "Save Game" : "Load Game";

        // The panel takes over whichever screen asked for it, the same way the
        // Controls screen does - the title art sits at the same layer, so
        // leaving it up would put it in front.
        if (returnTo === "pause") this.pauseOverlay.classList.add("hidden");
        else this.titleScreen.classList.add("hidden");
        overlay.classList.remove("hidden");
        this.renderSlots();
    }

    closeSlots() {
        this.pauseOverlay = this.pauseOverlay || document.getElementById("pause-overlay");
        document.getElementById("slots-overlay").classList.add("hidden");
        this.slotsPending = null;
        if (this.slotsReturnTo === "pause") {
            this.pauseOverlay.classList.remove("hidden");
        } else {
            this.titleScreen.classList.remove("hidden");
            this.refreshContinue();
        }
    }

    isSlotsOpen() {
        const overlay = document.getElementById("slots-overlay");
        return overlay && !overlay.classList.contains("hidden");
    }

    renderSlots() {
        const list = document.getElementById("slots-list");
        const subtitle = document.getElementById("slots-subtitle");
        list.innerHTML = "";

        if (!SaveSystem.available()) {
            subtitle.textContent = "This browser is not storing data, so games cannot be saved here.";
            return;
        }
        subtitle.textContent = this.slotsMessage || (this.slotsMode === "save"
            ? "Choose where to keep this adventure."
            : "Choose an adventure to return to.");

        for (let slot = 1; slot <= SaveSystem.SLOTS; slot++) {
            list.appendChild(this.buildSlotRow(slot));
        }
    }

    buildSlotRow(slot) {
        const summary = SaveSystem.describeSlot(slot);
        const pending = this.slotsPending && this.slotsPending.slot === slot ? this.slotsPending.type : null;

        const row = document.createElement("div");
        row.className = "save-slot" + (summary ? "" : " save-slot-empty");
        row.setAttribute("role", "listitem");

        // Overwriting a slot and deleting one both throw a run away, so both
        // ask first, in place, rather than acting on the first tap.
        if (pending) {
            row.classList.add("save-slot-confirm");
            // Name the run being thrown away, not just the slot number - the
            // whole point of asking is that the player can still change course.
            const losing = summary
                ? `${summary.realm}, ${summary.gems}, ${summary.playtime} played`
                : "";
            const question = document.createElement("span");
            question.className = "save-slot-question";
            question.textContent = pending === "delete"
                ? `Delete slot ${slot} - ${losing}? This cannot be undone.`
                : `Overwrite slot ${slot} - ${losing}?`;
            row.appendChild(question);

            const confirm = document.createElement("button");
            confirm.className = "save-slot-btn save-slot-btn-danger";
            confirm.textContent = pending === "delete" ? "Delete" : "Overwrite";
            confirm.addEventListener("click", () => {
                if (pending === "delete") this.deleteSlot(slot);
                else this.saveToSlot(slot);
            });
            row.appendChild(confirm);

            const cancel = document.createElement("button");
            cancel.className = "save-slot-btn";
            cancel.textContent = "Cancel";
            cancel.addEventListener("click", () => {
                this.slotsPending = null;
                this.renderSlots();
            });
            row.appendChild(cancel);
            return row;
        }

        const choose = document.createElement("button");
        choose.className = "save-slot-choose";
        choose.innerHTML = summary
            ? `<span class="save-slot-head">
                   <span class="save-slot-name">Slot ${slot}</span>
                   <span class="save-slot-realm">${summary.realm}</span>
               </span>
               <span class="save-slot-date">${summary.savedAt}</span>
               <span class="save-slot-stats">${summary.gems} &middot; ${summary.gold} &middot; ${summary.playtime} played</span>`
            : `<span class="save-slot-head">
                   <span class="save-slot-name">Slot ${slot}</span>
                   <span class="save-slot-realm">Empty</span>
               </span>`;

        if (this.slotsMode === "load" && !summary) {
            choose.disabled = true;
        } else {
            choose.addEventListener("click", () => {
                if (this.slotsMode === "load") {
                    this.game.loadFromSlot(slot);
                    return;
                }
                if (summary) {
                    this.slotsPending = { slot, type: "overwrite" };
                    this.renderSlots();
                } else {
                    this.saveToSlot(slot);
                }
            });
        }
        row.appendChild(choose);

        if (summary) {
            const del = document.createElement("button");
            del.className = "save-slot-btn";
            del.textContent = "Delete";
            del.setAttribute("aria-label", `Delete slot ${slot}`);
            del.addEventListener("click", () => {
                this.slotsPending = { slot, type: "delete" };
                this.renderSlots();
            });
            row.appendChild(del);
        }
        return row;
    }

    saveToSlot(slot) {
        const ok = this.game.saveToSlot(slot);
        this.slotsPending = null;
        this.slotsMessage = ok
            ? `Saved to slot ${slot}.`
            : "Could not save - this browser is not storing data.";
        this.renderSlots();
    }

    deleteSlot(slot) {
        SaveSystem.clear(slot);
        this.slotsPending = null;
        this.slotsMessage = `Slot ${slot} deleted.`;
        this.renderSlots();
    }

    // Continue only means something once there is something to continue, so
    // the title screen asks storage every time it is shown.
    refreshContinue() {
        const button = document.getElementById("continueBtn");
        const note = document.getElementById("continue-note");
        if (!button || !note) return;

        const startBtn = document.getElementById("startBtn");
        const startNote = document.getElementById("start-note");
        const loadButton = document.getElementById("loadBtn");

        const slot = SaveSystem.available() ? SaveSystem.mostRecentSlot() : null;
        this.continueSlot = slot;
        if (slot === null) {
            button.classList.add("hidden");
            note.classList.add("hidden");
            loadButton.classList.add("hidden");
            startBtn.classList.add("menu-btn-primary");
            startNote.classList.remove("hidden");
            return;
        }
        loadButton.classList.remove("hidden");

        // Picking the adventure back up is the headline action once there is
        // one to pick up, so starting over steps down to a plain button.
        const summary = SaveSystem.describeSlot(slot);
        button.classList.remove("hidden");
        note.classList.remove("hidden");
        note.textContent = `${summary.realm} - ${summary.gems}, ${summary.playtime} played`;
        startBtn.classList.remove("menu-btn-primary");
        startNote.classList.add("hidden");
    }

    // Map
    toggleMap() {
        if (this.mapOverlay.classList.contains("hidden")) {
            this.mapOverlay.classList.remove("hidden");
            return true;
        } else {
            this.mapOverlay.classList.add("hidden");
            return false;
        }
    }

    isMapOpen() {
        return !this.mapOverlay.classList.contains("hidden");
    }

    // Shop
    itemKind(itemId) {
        if (WEAPONS[itemId]) return "weapon";
        if (BOWS[itemId]) return "bow";
        if (ARMOR[itemId]) return "armor";
        if (SHOP_POTIONS[itemId]) return "supply";
        return null;
    }

    itemFor(itemId) {
        return WEAPONS[itemId] || BOWS[itemId] || ARMOR[itemId] || SHOP_POTIONS[itemId] || null;
    }

    speedLabel(speed) {
        return speed >= 1.1 ? "Fast" : speed >= 1 ? "Steady" : speed >= 0.8 ? "Slow" : "Heavy";
    }

    bonusDamage(player, itemId, kind) {
        const item = kind === "weapon" ? WEAPONS[itemId] : BOWS[itemId];
        if (!item) return 0;
        let value = item.damage;
        if (player.hasSheath) value += SHEATH_DAMAGE_BONUS;
        if (player.enchantments[itemId]) value += ENCHANT_DAMAGE_BONUS;
        if (player.greenGemAttack) value += GREEN_GEM_ATTACK.bonus;
        if (player.hasMagicCharm) value += MAGIC_CHARM.damageBonus;
        if (player.hasGauntlet) value += CAVE_GAUNTLET.damageBonus;
        if (player.purpleGemAttack) value += PURPLE_GEMS.attack.bonus;
        if (player.hasRainbowGem) value += RAINBOW_GEM.bonus;
        if (kind === "bow" && player.hasZeusBolts) value += ZEUS_BOLT.damageBonus;
        return value;
    }

    bonusDefense(player, itemId) {
        const item = ARMOR[itemId];
        if (!item) return 0;
        let value = item.defense;
        if (player.greenGemDefense) value += GREEN_GEM_DEFENSE.bonus;
        if (player.purpleGemArmor) value += PURPLE_GEMS.armor.bonus;
        if (player.hasRainbowGem) value += RAINBOW_GEM.bonus;
        return value;
    }

    comparisonMarkup(itemId, kind, player) {
        if (kind === "supply") return "";
        const equippedId = kind === "weapon" ? player.currentWeapon : kind === "bow" ? player.currentBow : player.currentArmor;
        const current = kind === "armor"
            ? this.bonusDefense(player, equippedId)
            : this.bonusDamage(player, equippedId, kind);
        const candidate = kind === "armor"
            ? this.bonusDefense(player, itemId)
            : this.bonusDamage(player, itemId, kind);
        const direction = candidate > current ? "upgrade" : candidate < current ? "downgrade" : "same";
        const arrow = candidate > current ? "↑" : candidate < current ? "↓" : "–";
        const label = kind === "armor" ? "DEF" : "DMG";
        const item = this.itemFor(itemId);
        const secondary = kind === "armor"
            ? "Protection"
            : `${this.speedLabel(item.speed)} · Range ${item.range}`;
        return `<div class="stat-comparison">
            <div><span>${label}</span><b>${current}</b><i>→</i><b class="${direction}">${candidate}</b><em class="${direction}">${arrow}</em></div>
            <small>${secondary}</small>
        </div>`;
    }

    shopProfile(shopName) {
        if (/desert/i.test(shopName)) {
            return { role: "Desert Trader", greeting: "Travel light, traveler. The wastes punish heavy steps.", type: "desert" };
        }
        if (/witch|swamp/i.test(shopName)) {
            return { role: "Swamp Witch", greeting: "A bright potion for the dark road ahead?", type: "witch" };
        }
        return { role: "Camelot Armourer", greeting: "Steel tested, edges keen, and fair prices for heroes.", type: "armourer" };
    }

    drawMerchantPortrait(type) {
        const canvas = this.merchantPortrait;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        const s = 4;
        ctx.imageSmoothingEnabled = false;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#090d17";
        ctx.fillRect(0, 0, 112, 112);
        ctx.fillStyle = type === "witch" ? "#172417" : type === "desert" ? "#302016" : "#18202a";
        ctx.fillRect(8, 8, 96, 96);
        ctx.fillStyle = "rgba(232, 176, 67, .16)";
        ctx.fillRect(12, 12, 88, 5);

        const px = (color, x, y, w, h) => {
            ctx.fillStyle = color;
            ctx.fillRect(x * s, y * s, w * s, h * s);
        };

        if (type === "witch") {
            px("#2c173e", 5, 4, 18, 3); px("#55306d", 8, 1, 11, 3); px("#6b3f82", 14, 0, 4, 2);
            px("#d9d0c5", 8, 7, 4, 10); px("#c5b7aa", 18, 7, 3, 10);
            px("#79985c", 10, 7, 9, 10); px("#94aa70", 11, 8, 7, 6);
            px("#1b2020", 12, 10, 2, 1); px("#1b2020", 17, 10, 1, 1); px("#b9c887", 14, 12, 2, 2);
            px("#5a315f", 9, 17, 12, 3); px("#352040", 5, 20, 20, 7); px("#8d58a0", 12, 20, 6, 2);
        } else if (type === "desert") {
            px("#6e2b21", 6, 4, 17, 5); px("#a44b2e", 8, 2, 13, 4); px("#d38442", 10, 5, 9, 3);
            px("#9e633c", 9, 8, 11, 10); px("#c68a58", 11, 8, 7, 7);
            px("#25170f", 11, 11, 2, 1); px("#25170f", 17, 11, 2, 1); px("#ead2a7", 13, 14, 4, 1);
            px("#6e2b21", 8, 17, 13, 4); px("#382339", 4, 21, 22, 6); px("#d39b40", 13, 21, 3, 3);
        } else {
            px("#777b7f", 8, 3, 13, 5); px("#a2a5a5", 10, 2, 9, 3); px("#46494c", 7, 6, 3, 9); px("#46494c", 20, 6, 3, 9);
            px("#a96e4e", 9, 7, 12, 10); px("#d49a70", 11, 7, 8, 7);
            px("#201710", 11, 10, 2, 1); px("#201710", 17, 10, 2, 1); px("#d7a17e", 14, 12, 2, 2);
            px("#5d5552", 9, 15, 12, 5); px("#88817d", 11, 15, 8, 3); px("#382542", 5, 20, 20, 7); px("#d8a73e", 13, 20, 3, 3);
        }

        ctx.strokeStyle = "#a97527";
        ctx.lineWidth = 3;
        ctx.strokeRect(5.5, 5.5, 101, 101);
    }

    openShop(shop, player, category = this.activeShopCategory) {
        this.activeShopCategory = category;
        this.shopTitle.textContent = shop.name;
        this.shopGoldCount.textContent = player.gold;
        this.shopOverlay.classList.remove("hidden");

        const profile = this.shopProfile(shop.name);
        this.merchantName.textContent = profile.role;
        this.merchantGreeting.textContent = profile.greeting;
        this.drawMerchantPortrait(profile.type);
        this.renderShopTabs(shop, player);
        this.renderShopItems(shop, player);
    }

    renderShopTabs(shop, player) {
        const sellCount = this.sellableItems(player).length;
        const tabs = [
            { id: "weapons", icon: "⚔", label: "Weapons" },
            { id: "bows", icon: "➶", label: "Bows" },
            { id: "armor", icon: "♜", label: "Armor" },
            { id: "supplies", icon: "◒", label: "Supplies" },
            { id: "sell", icon: "●", label: `Sell${sellCount ? ` (${sellCount})` : ""}` },
        ];
        this.shopTabs.innerHTML = "";
        for (const tab of tabs) {
            const button = document.createElement("button");
            button.className = "category-tab" + (this.activeShopCategory === tab.id ? " active" : "");
            button.innerHTML = `<span aria-hidden="true">${tab.icon}</span><b>${tab.label}</b>`;
            button.addEventListener("click", () => this.openShop(shop, player, tab.id));
            this.shopTabs.appendChild(button);
        }
    }

    sellableItems(player) {
        return [
            ...player.weapons.filter(id => WEAPONS[id].price > 0 && id !== player.currentWeapon).map(id => ({ id, kind: "weapon" })),
            ...player.bows.filter(id => BOWS[id].price > 0 && id !== player.currentBow).map(id => ({ id, kind: "bow" })),
            ...player.armors.filter(id => ARMOR[id].price > 0 && id !== player.currentArmor).map(id => ({ id, kind: "armor" })),
        ];
    }

    renderShopItems(shop, player) {
        this.shopItems.innerHTML = "";
        let entries;
        if (this.activeShopCategory === "sell") {
            entries = this.sellableItems(player);
        } else {
            const categoryKind = { weapons: "weapon", bows: "bow", armor: "armor", supplies: "supply" }[this.activeShopCategory];
            entries = shop.inventory
                .filter(id => this.itemKind(id) === categoryKind)
                .map(id => ({ id, kind: categoryKind }));
        }

        if (entries.length === 0) {
            const empty = document.createElement("div");
            empty.className = "catalog-empty";
            empty.innerHTML = this.activeShopCategory === "sell"
                ? `<span>⚖</span><strong>Nothing ready to sell</strong><p>Equipped gear stays safely with you. Equip a different item in Inventory, then return here to sell the spare.</p>`
                : `<span>◇</span><strong>No wares in this category</strong><p>This merchant carries different goods.</p>`;
            this.shopItems.appendChild(empty);
            return;
        }

        for (const entry of entries) {
            this.shopItems.appendChild(this.buildShopRow(entry.id, entry.kind, player, shop, this.activeShopCategory === "sell"));
        }
    }

    buildShopRow(itemId, kind, player, shop, selling) {
        const item = this.itemFor(itemId);
        const owned = (kind === "weapon" && player.weapons.includes(itemId)) ||
            (kind === "bow" && player.bows.includes(itemId)) ||
            (kind === "armor" && player.armors.includes(itemId));
        const equipped = itemId === player.currentWeapon || itemId === player.currentBow || itemId === player.currentArmor;
        const canAfford = player.gold >= item.price;
        const price = selling ? Math.floor(item.price * 0.5) : item.price;
        const row = document.createElement("article");
        row.className = `catalog-row ${kind}${owned ? " owned" : ""}${equipped ? " equipped" : ""}${!selling && !canAfford ? " too-expensive" : ""}`;
        row.innerHTML = `
            <div class="catalog-icon" aria-hidden="true">${item.icon}</div>
            <div class="catalog-copy">
                <div class="catalog-name"><strong>${item.name}</strong><span>${kind === "supply" ? "Supply" : kind}</span></div>
                <p>${item.description}</p>
            </div>
            ${this.comparisonMarkup(itemId, kind, player)}
            <div class="catalog-action">
                <span class="row-price"><i class="tiny-coin">●</i>${price}</span>
                <button type="button"></button>
            </div>`;

        const button = row.querySelector("button");
        if (selling) {
            button.textContent = "Sell";
            button.className = "trade-button sell-button";
            button.addEventListener("click", () => this.sellItem(itemId, kind, price, player, shop));
        } else if (owned) {
            button.textContent = equipped ? "Equipped" : "Owned";
            button.className = "trade-button owned-button";
            button.disabled = true;
        } else {
            button.textContent = canAfford ? "Buy" : "Need gold";
            button.className = "trade-button";
            button.disabled = !canAfford;
            if (canAfford) {
                button.addEventListener("click", () => {
                    this.buyItem(itemId, WEAPONS[itemId], BOWS[itemId], ARMOR[itemId], SHOP_POTIONS[itemId], player, shop);
                });
            }
        }
        return row;
    }

    sellItem(itemId, itemType, sellPrice, player, shop) {
        player.gold += sellPrice;
        if (this.game.sound) this.game.sound.goldCollect();

        if (itemType === "weapon") {
            player.weapons = player.weapons.filter(w => w !== itemId);
            delete player.enchantments[itemId];
            this.showNotification(`Sold ${WEAPONS[itemId].name} for ${sellPrice} gold`);
        } else if (itemType === "bow") {
            player.bows = player.bows.filter(b => b !== itemId);
            delete player.enchantments[itemId];
            this.showNotification(`Sold ${BOWS[itemId].name} for ${sellPrice} gold`);
        } else if (itemType === "armor") {
            player.armors = player.armors.filter(a => a !== itemId);
            if (player.armorEnchantedId === itemId) {
                player.armorEnchantment = null;
                player.armorEnchantedId = null;
            }
            this.showNotification(`Sold ${ARMOR[itemId].name} for ${sellPrice} gold`);
        }

        // Refresh the Sell tab so the result is immediately visible.
        this.openShop(shop, player, "sell");
    }

    buyItem(itemId, isWeapon, isBow, isArmor, isPotion, player, shop) {
        const item = isWeapon || isBow || isArmor || isPotion;
        if (player.gold < item.price) {
            this.showNotification("Not enough gold!");
            return;
        }

        player.gold -= item.price;
        if (this.game.sound) this.game.sound.shopBuy();

        if (isWeapon) {
            player.addWeapon(itemId);
            player.equipWeapon(itemId);
            this.showNotification(`Purchased ${item.name}!`);
        } else if (isBow) {
            player.addBow(itemId);
            player.equipBow(itemId);
            this.showNotification(`Purchased ${item.name}!`);
        } else if (isArmor) {
            player.addArmor(itemId);
            player.equipArmor(itemId);
            this.showNotification(`Purchased ${item.name}! (DEF +${isArmor.defense})`);
        } else if (isPotion) {
            switch (isPotion.effect) {
                case "health_potion":
                    if (player.addHealthPotion("regular")) {
                        this.showNotification(`${item.name} added to inventory!`);
                    } else {
                        this.showNotification("Potion inventory full!");
                        player.gold += item.price; // refund
                    }
                    break;
                case "greater_health_potion":
                    if (player.addHealthPotion("greater")) {
                        this.showNotification(`${item.name} added to inventory!`);
                    } else {
                        this.showNotification("Potion inventory full!");
                        player.gold += item.price;
                    }
                    break;
                case "shield":
                    player.shieldActive = true;
                    player.shieldHits = isPotion.value;
                    this.showNotification("Shield activated!");
                    break;
                case "arrows":
                    player.arrows += isPotion.value;
                    this.showNotification(`Got ${isPotion.value} arrows!`);
                    break;
                case "apples":
                    if (player.addApples(isPotion.value)) {
                        this.showNotification(`Got ${isPotion.value} apple${isPotion.value > 1 ? "s" : ""}! Feed one to a wild animal.`);
                    } else {
                        this.showNotification("You can't carry any more apples!");
                        player.gold += item.price; // refund
                    }
                    break;
            }
        }

        // Refresh the active category and its comparisons.
        this.openShop(shop, player, this.activeShopCategory);
    }

    closeShop() {
        this.shopOverlay.classList.add("hidden");
        this.activeShopCategory = "weapons";
    }

    isShopOpen() {
        return !this.shopOverlay.classList.contains("hidden");
    }

    // Inventory
    openInventory(player, category = this.activeInventoryCategory) {
        this.activeInventoryCategory = category;
        this.inventoryOverlay.classList.remove("hidden");
        this.renderPaperDoll(player);
        this.renderInventoryTabs(player);
        this.renderInventoryItems(player);
        this.renderRelicShelf(player);
    }

    renderInventoryTabs(player) {
        const companionCount = (this.game.companions || []).filter(c => c.alive).length;
        const tabs = [
            { id: "gear", icon: "⚔", label: "Gear", count: player.weapons.length + player.bows.length + player.armors.length },
            { id: "supplies", icon: "◒", label: "Pack", count: player.healthPotions + player.greaterHealthPotions + player.apples },
            { id: "pets", icon: "♞", label: "Pets", count: companionCount },
            { id: "relics", icon: "◆", label: "Relics", count: this.collectedRelics(player).length },
        ];
        this.inventoryTabs.innerHTML = "";
        for (const tab of tabs) {
            const button = document.createElement("button");
            button.className = "category-tab" + (this.activeInventoryCategory === tab.id ? " active" : "");
            button.innerHTML = `<span aria-hidden="true">${tab.icon}</span><b>${tab.label}</b><i>${tab.count}</i>`;
            button.addEventListener("click", () => this.openInventory(player, tab.id));
            this.inventoryTabs.appendChild(button);
        }
    }

    renderPaperDoll(player) {
        const canvas = this.inventoryHero;
        const ctx = canvas.getContext("2d");
        ctx.imageSmoothingEnabled = false;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const glow = ctx.createRadialGradient(90, 86, 12, 90, 86, 78);
        glow.addColorStop(0, "rgba(230, 177, 63, .2)");
        glow.addColorStop(1, "rgba(9, 14, 25, 0)");
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, 180, 190);
        ctx.fillStyle = "rgba(0, 0, 0, .5)";
        ctx.fillRect(35, 151, 110, 7);
        ctx.fillStyle = "#7c5925";
        ctx.fillRect(48, 158, 84, 3);
        ctx.fillStyle = "#b68735";
        ctx.fillRect(62, 161, 56, 2);

        if (typeof IngoizerSprite !== "undefined") {
            const tint = typeof player.getSiblingTint === "function" ? player.getSiblingTint() : null;
            const sprite = IngoizerSprite.get("down", 0, tint);
            ctx.drawImage(sprite, 0, 0, sprite.width, sprite.height, 34, 22, 112, 136);
        }

        const setSlot = (id, item, label, status) => {
            const slot = document.getElementById(id);
            slot.innerHTML = `<span>${item.icon}</span><small>${label}</small><strong>${item.name}</strong><i>${status}</i>`;
            slot.title = item.description || item.name;
        };
        setSlot("equipped-weapon", WEAPONS[player.currentWeapon], "Weapon", `DMG ${player.getWeapon().damage}`);
        const bowItem = BOWS[player.currentBow];
        const bowIcon = bowItem.bolt === "laser" && typeof LaserIcon !== "undefined" ? LaserIcon.markup() : bowItem.icon;
        setSlot("equipped-bow", { ...bowItem, icon: bowIcon }, bowItem.bolt === "laser" ? "Ranged" : "Bow", `DMG ${player.getBow().damage}`);
        setSlot("equipped-armor", ARMOR[player.currentArmor], "Armor", `DEF ${player.getArmor().defense}`);
        const consumable = player.greaterHealthPotions > 0
            ? { icon: "🧪", name: "Greater Potion", description: "Heals 80 HP" }
            : { icon: "🧪", name: "Health Potion", description: "Heals 40 HP" };
        const potionCount = player.greaterHealthPotions > 0 ? player.greaterHealthPotions : player.healthPotions;
        setSlot("equipped-consumable", consumable, "Quick item", `× ${potionCount}`);

        this.equippedSummary.innerHTML = `
            <div><span>Blade</span><b>${player.getWeapon().damage}</b><small>DMG</small></div>
            <div><span>Bow</span><b>${player.getBow().damage}</b><small>DMG</small></div>
            <div><span>Guard</span><b>${player.getArmor().defense}</b><small>DEF</small></div>`;
    }

    renderInventoryItems(player) {
        this.inventoryItems.innerHTML = "";
        if (this.activeInventoryCategory === "gear") this.renderOwnedGear(player);
        if (this.activeInventoryCategory === "supplies") this.renderSupplies(player);
        if (this.activeInventoryCategory === "pets") this.renderPets(player);
        if (this.activeInventoryCategory === "relics") this.renderRelics(player);
    }

    inventoryCard(itemId, kind, player) {
        const item = this.itemFor(itemId);
        const equipped = itemId === player.currentWeapon || itemId === player.currentBow || itemId === player.currentArmor;
        const enchant = kind === "armor"
            ? (player.armorEnchantedId === itemId ? player.armorEnchantment : null)
            : player.enchantments[itemId];
        const card = document.createElement("button");
        card.className = `inventory-card ${kind}${equipped ? " equipped" : ""}`;
        const stat = kind === "armor"
            ? `DEF ${this.bonusDefense(player, itemId)}`
            : `DMG ${this.bonusDamage(player, itemId, kind)}`;
        const icon = (itemId === "laser_gun" && typeof LaserIcon !== "undefined") ? LaserIcon.markup() : item.icon;
        card.innerHTML = `
            <span class="inventory-card-icon">${icon}</span>
            <span class="inventory-card-copy"><strong>${item.name}${enchant ? ` ${ELEMENTS[enchant].icon}` : ""}</strong><small>${stat} · ${kind}</small></span>
            <span class="inventory-card-state">${equipped ? "✓ Equipped" : "Equip"}</span>`;
        card.addEventListener("click", () => {
            if (kind === "weapon") player.equipWeapon(itemId);
            if (kind === "bow") player.equipBow(itemId);
            if (kind === "armor") player.equipArmor(itemId);
            this.openInventory(player, "gear");
            this.showNotification(`Equipped ${item.name}`);
        });
        return card;
    }

    renderOwnedGear(player) {
        const groups = [
            { title: "Weapons", kind: "weapon", items: player.weapons },
            { title: "Bows", kind: "bow", items: player.bows },
            { title: "Armor", kind: "armor", items: player.armors },
        ];
        for (const group of groups) {
            const heading = document.createElement("h3");
            heading.className = "inventory-group-title";
            heading.innerHTML = `<span>${group.title}</span><i>${group.items.length} owned</i>`;
            this.inventoryItems.appendChild(heading);
            for (const id of group.items) this.inventoryItems.appendChild(this.inventoryCard(id, group.kind, player));
        }
        this.appendHeldKeys(player);
    }

    supplyCard(icon, name, count, description, action, actionLabel = "Use") {
        const card = document.createElement("article");
        card.className = "supply-card" + (count <= 0 ? " empty" : "");
        card.innerHTML = `<span class="inventory-card-icon">${icon}</span><div><strong>${name}</strong><small>${description}</small></div><b>× ${count}</b>`;
        if (action && count > 0) {
            const button = document.createElement("button");
            button.textContent = actionLabel;
            button.addEventListener("click", action);
            card.appendChild(button);
        }
        return card;
    }

    usePotionFromInventory(player, type) {
        if (player.hp >= player.maxHp) return null;
        const greater = type === "greater";
        const stockKey = greater ? "greaterHealthPotions" : "healthPotions";
        if (player[stockKey] <= 0) return null;
        const amount = greater ? HEALTH_POTION.greaterHealAmount : HEALTH_POTION.healAmount;
        player[stockKey]--;
        const healed = Math.min(amount, player.maxHp - player.hp);
        player.hp = Math.min(player.maxHp, player.hp + amount);
        return { type, healed };
    }

    renderSupplies(player) {
        this.inventoryItems.appendChild(this.supplyCard("🧪", "Health Potion", player.healthPotions, "Restores up to 40 HP", () => {
            const result = this.usePotionFromInventory(player, "regular");
            if (result) this.showNotification(`Used Health Potion! +${result.healed} HP`);
            this.openInventory(player, "supplies");
        }));
        this.inventoryItems.appendChild(this.supplyCard("🧪", "Greater Potion", player.greaterHealthPotions, "Restores up to 80 HP", () => {
            const result = this.usePotionFromInventory(player, "greater");
            if (result) this.showNotification(`Used Greater Potion! +${result.healed} HP`);
            this.openInventory(player, "supplies");
        }));
        this.inventoryItems.appendChild(this.supplyCard(player.hasZeusBolts ? ZEUS_BOLT.icon : "➶", player.hasZeusBolts ? "Zeus's Bolts" : "Arrows", player.arrows, "Ammunition for your equipped bow"));
        this.inventoryItems.appendChild(this.supplyCard(APPLE_ITEM.icon, "Apples", player.apples, "Feed one to a wild animal to tame it"));
        this.inventoryItems.appendChild(this.supplyCard("🛡️", "Shield Rune", player.shieldHits, player.shieldActive ? "Ready to block the next hit" : "No shield rune is active"));
        this.appendHeldKeys(player);
    }

    appendHeldKeys(player) {
        const keys = player.heldKeys || [];
        if (!keys.length || typeof STRANGE_KEYS === "undefined") return;
        const row = document.createElement("div");
        row.className = "held-keys";
        for (const id of keys) {
            const key = STRANGE_KEYS[id];
            if (!key) continue;
            const card = document.createElement("article");
            card.className = "supply-card";
            const icon = (typeof KeySprite !== "undefined") ? KeySprite.icon(id) : "🗝️";
            card.innerHTML = `<span class="inventory-card-icon">${icon}</span><div><strong>${key.name}</strong></div>`;
            row.appendChild(card);
        }
        if (row.childElementCount) this.inventoryItems.appendChild(row);
    }

    renderPets(player) {
        const companions = (this.game.companions || []).filter(c => c.alive);
        const intro = document.createElement("div");
        intro.className = "pet-intro";
        intro.innerHTML = `<span>♞</span><div><strong>Traveling Companions</strong><p>${companions.length} of ${ANIMAL_CONFIG.maxCompanions} friends at your side · ${APPLE_ITEM.icon} ${player.apples} apples</p></div>`;
        this.inventoryItems.appendChild(intro);

        for (const companion of companions) {
            const card = document.createElement("article");
            card.className = "pet-card";
            const hp = Math.max(0, Math.ceil(companion.hp));
            const pct = Math.max(0, Math.min(100, (companion.hp / companion.maxHp) * 100));
            card.innerHTML = `
                <span class="pet-avatar">${companion.icon}</span>
                <div><strong>${companion.name}</strong><small>${companion.flavor || "A loyal friend on the road"}</small><div class="pet-health"><i style="width:${pct}%"></i></div></div>
                <b>${hp}/${companion.maxHp} HP<br>${companion.damage} DMG</b>`;
            this.inventoryItems.appendChild(card);
        }

        for (let i = companions.length; i < ANIMAL_CONFIG.maxCompanions; i++) {
            const slot = document.createElement("div");
            slot.className = "empty-pet-slot";
            slot.innerHTML = `<span>＋</span><small>Open companion place</small>`;
            this.inventoryItems.appendChild(slot);
        }

        if (companions.length === 0) {
            const hint = document.createElement("p");
            hint.className = "inventory-empty-hint";
            hint.textContent = "Find a wild animal, carry an apple, and press E nearby to make a new friend.";
            this.inventoryItems.appendChild(hint);
        }
    }

    collectedRelics(player) {
        const relics = [];
        if (player.hasMerlinWand) relics.push({ icon: "🪄", name: "Merlin's Wand", detail: "Quest item · Return it to Merlin", tone: "violet" });
        if (player.hasMallet) relics.push({ icon: "🔨", name: "Enchanter's Mallet", detail: "Enchant a weapon and armor", tone: "violet", action: true });
        if (player.hasSheath) relics.push({ icon: "🗡️", name: "Jewel-encrusted Sheath", detail: `+${SHEATH_DAMAGE_BONUS} damage to weapons and bows`, tone: "gold" });
        if (player.hasDarkCrest) relics.push({ icon: DARK_CREST.icon, name: DARK_CREST.name, detail: `+${DARK_CREST.maxHpBonus} maximum HP`, tone: "red" });
        if (player.greenGemAttack) relics.push({ icon: GREEN_GEM_ATTACK.icon, name: GREEN_GEM_ATTACK.name, detail: `+${GREEN_GEM_ATTACK.bonus} damage to all weapons`, tone: "green" });
        if (player.greenGemDefense) relics.push({ icon: GREEN_GEM_DEFENSE.icon, name: GREEN_GEM_DEFENSE.name, detail: `+${GREEN_GEM_DEFENSE.bonus} defense to all armor`, tone: "green" });
        if (player.hasMagicCharm) relics.push({ icon: MAGIC_CHARM.icon, name: MAGIC_CHARM.name, detail: `+${MAGIC_CHARM.damageBonus} damage to all weapons`, tone: "violet" });
        if (player.hasGauntlet) relics.push({ icon: CAVE_GAUNTLET.icon, name: CAVE_GAUNTLET.name, detail: CAVE_GAUNTLET.description, tone: "violet" });
        if (player.purpleGemHealth) relics.push({ icon: PURPLE_GEMS.health.icon, name: PURPLE_GEMS.health.name, detail: PURPLE_GEMS.health.description, tone: "violet" });
        if (player.purpleGemAttack) relics.push({ icon: PURPLE_GEMS.attack.icon, name: PURPLE_GEMS.attack.name, detail: PURPLE_GEMS.attack.description, tone: "violet" });
        if (player.purpleGemArmor) relics.push({ icon: PURPLE_GEMS.armor.icon, name: PURPLE_GEMS.armor.name, detail: PURPLE_GEMS.armor.description, tone: "violet" });
        if (player.hasRainbowGem) relics.push({ icon: RAINBOW_GEM.icon, name: RAINBOW_GEM.name, detail: RAINBOW_GEM.description, tone: "rainbow" });
        if (player.hasZeusBolts) relics.push({ icon: ZEUS_BOLT.icon, name: ZEUS_BOLT.name, detail: `+${ZEUS_BOLT.damageBonus} bow damage`, tone: "gold" });
        if (player.hasWorldtreeSeed) relics.push({
            icon: WORLDTREE_SEED.icon,
            name: WORLDTREE_SEED.name,
            detail: WORLDTREE_SEED.description,
            tone: "green",
            action: "plant",
        });
        // A Worldtree that never took is still the seed, only standing up. The
        // shelf offers it back, which is the only way to lift one on a phone.
        const planted = this.game.nearUprootable;
        if (planted) relics.push({
            icon: "\ud83c\udf33",
            name: planted.grown ? "Worldtree (not taken)" : "Worldtree Sapling",
            detail: planted.grown
                ? "Standing where you left it, holding the only ladder there is. Lift it out and the way up closes until you plant it again."
                : "Coming up where you left it. Lift it out and carry the seed on.",
            tone: "green",
            action: "uproot",
        });
        return relics;
    }

    renderRelics(player) {
        const blue = document.createElement("article");
        blue.className = "relic-card blue";
        blue.innerHTML = `<span>💎</span><div><strong>Blue Gems</strong><small>${player.blueGems} of 5 reclaimed</small></div>`;
        this.inventoryItems.appendChild(blue);

        const relics = this.collectedRelics(player);
        for (const relic of relics) {
            const card = document.createElement(relic.action ? "button" : "article");
            card.className = `relic-card ${relic.tone}`;
            const actionLabel = relic.action === "plant" ? "Plant ›"
                : relic.action === "uproot" ? "Lift it out ›" : "Use ›";
            card.innerHTML = `<span>${relic.icon}</span><div><strong>${relic.name}</strong><small>${relic.detail}</small></div>${relic.action ? `<b>${actionLabel}</b>` : ""}`;
            if (relic.action === "plant") {
                card.addEventListener("click", () => {
                    this.closeInventory();
                    this.game.plantWorldtreeSeed();
                });
            } else if (relic.action === "uproot") {
                card.addEventListener("click", () => {
                    this.closeInventory();
                    this.game.uprootSapling();
                });
            } else if (relic.action) {
                card.addEventListener("click", () => {
                    this.closeInventory();
                    this.openEnchant(player);
                });
            }
            this.inventoryItems.appendChild(card);
        }
        if (relics.length === 0) {
            const hint = document.createElement("p");
            hint.className = "inventory-empty-hint";
            hint.textContent = "Special treasures, quest items, and permanent rewards will appear here as you discover them.";
            this.inventoryItems.appendChild(hint);
        }
    }

    renderRelicShelf(player) {
        this.inventoryRelics.innerHTML = "";
        for (const name of ["fire", "water", "ice", "lightning", "earth"]) {
            const element = ELEMENTS[name];
            const unlocked = !!player.elements[name];
            const button = document.createElement("button");
            button.className = `element-relic ${unlocked ? "unlocked" : "locked"}${player.activeElement === name ? " active" : ""}`;
            button.style.setProperty("--element-color", element.color);
            button.innerHTML = `<span>${unlocked ? element.icon : "◇"}</span><small>${element.name}</small><i>${unlocked ? (player.activeElement === name ? "Active" : "Ready") : "Locked"}</i>`;
            button.disabled = !unlocked;
            if (unlocked) {
                button.addEventListener("click", () => {
                    player.activeElement = player.activeElement === name ? null : name;
                    this.openInventory(player, this.activeInventoryCategory);
                    this.showNotification(player.activeElement ? `${element.name} power active!` : "Power deactivated");
                });
            }
            this.inventoryRelics.appendChild(button);
        }

        const collected = this.collectedRelics(player);
        const special = document.createElement("button");
        special.className = "special-relic-summary" + (this.activeInventoryCategory === "relics" ? " active" : "");
        special.innerHTML = `<span>✦</span><small>Special items</small><i>${collected.length} found</i>`;
        special.addEventListener("click", () => this.openInventory(player, "relics"));
        this.inventoryRelics.appendChild(special);
    }

    closeInventory() {
        this.inventoryOverlay.classList.add("hidden");
        this.activeInventoryCategory = "gear";
    }

    isInventoryOpen() {
        return !this.inventoryOverlay.classList.contains("hidden");
    }

    // Riddle system
    openRiddle(riddle, onCorrect, onWrong) {
        this.riddleOverlay.classList.remove("hidden");
        this.riddleQuestion.textContent = riddle.question;
        this.riddleResult.textContent = "";
        this.riddleChoices.innerHTML = "";

        for (let i = 0; i < riddle.choices.length; i++) {
            const btn = document.createElement("button");
            btn.className = "riddle-choice";
            btn.textContent = riddle.choices[i];
            btn.addEventListener("click", () => {
                this.handleRiddleAnswer(i, riddle.answer, onCorrect, onWrong);
            });
            this.riddleChoices.appendChild(btn);
        }
    }

    handleRiddleAnswer(chosen, correctIndex, onCorrect, onWrong) {
        const buttons = this.riddleChoices.querySelectorAll(".riddle-choice");
        // Disable all buttons
        buttons.forEach(b => { b.style.pointerEvents = "none"; });

        if (chosen === correctIndex) {
            buttons[chosen].classList.add("correct");
            this.riddleResult.textContent = "Correct! The Lady of the Lake smiles with approval.";
            this.riddleResult.style.color = "#88ff88";
            setTimeout(() => {
                this.closeRiddle();
                if (onCorrect) onCorrect();
            }, 1500);
        } else {
            buttons[chosen].classList.add("wrong");
            buttons[correctIndex].classList.add("correct");
            this.riddleResult.textContent = "Incorrect. Return when you know the land better, brave Ingoizer.";
            this.riddleResult.style.color = "#ff8888";
            setTimeout(() => {
                this.closeRiddle();
                if (onWrong) onWrong();
            }, 2000);
        }
    }

    closeRiddle() {
        this.riddleOverlay.classList.add("hidden");
    }

    isRiddleOpen() {
        return !this.riddleOverlay.classList.contains("hidden");
    }

    // An ending. A victory is not the end of the run - every one of them leaves
    // the realm open to wander - so Continue Exploring is the headline action
    // and the button that leaves is honest about what it costs: the run is only
    // in memory, and going back to the title throws it away.
    showGameOver(victory, text) {
        this.gameOverScreen.classList.remove("hidden");
        this.disarmGameOverQuit();

        if (victory) {
            this.gameOverScreen.classList.add("victory");
            this.gameOverTitle.textContent = "Victory!";
            this.keepPlayingBtn.classList.remove("hidden");
            this.restartBtn.textContent = "Return to Title";
        } else {
            this.gameOverScreen.classList.remove("victory");
            this.gameOverTitle.textContent = "Game Over";
            this.keepPlayingBtn.classList.add("hidden");
            this.restartBtn.textContent = "Try Again";
        }
        this.gameOverText.textContent = text;
    }

    closeGameOver() {
        this.gameOverScreen.classList.add("hidden");
        this.gameOverScreen.classList.remove("victory");
        this.keepPlayingBtn.classList.add("hidden");
        this.disarmGameOverQuit();
    }

    // Leaving a run for the title is not undoable and nothing has been written
    // to storage, so the button asks once before it does it.
    armGameOverQuit() {
        this.gameOverQuitArmed = true;
        this.restartBtn.textContent = "Leave without saving";
        this.gameOverNote.textContent = "This run has not been saved. Continue Exploring, then save from the pause menu, to keep it.";
        this.gameOverNote.classList.remove("hidden");
    }

    disarmGameOverQuit() {
        this.gameOverQuitArmed = false;
        this.gameOverNote.classList.add("hidden");
        this.gameOverNote.textContent = "";
    }

    isGameOverOpen() {
        return !this.gameOverScreen.classList.contains("hidden");
    }

    // Boss health
    showBossHealth(boss, bossName) {
        let container = document.getElementById("boss-health-container");
        if (!container) {
            container = document.createElement("div");
            container.id = "boss-health-container";
            container.innerHTML = `
                <div id="boss-name">The Black Knight</div>
                <div id="boss-health-bar"><div id="boss-health-fill"></div></div>
            `;
            document.getElementById("game-container").appendChild(container);
        }

        const nameEl = document.getElementById("boss-name");
        if (nameEl && bossName) {
            nameEl.textContent = bossName;
            this.bossBarName = bossName;
        }

        const fill = document.getElementById("boss-health-fill");
        if (fill) {
            fill.style.width = ((boss.hp / boss.maxHp) * 100) + "%";
        }
    }

    hideBossHealth() {
        const container = document.getElementById("boss-health-container");
        if (container) container.remove();
        this.bossBarName = null;
    }

    // Removed mana bar - mana system no longer exists

    // Enchantment system
    openEnchant(player) {
        this.enchantOverlay.classList.remove("hidden");
        this.enchantItems.innerHTML = "";
        this.enchantElements.classList.add("hidden");
        this.enchantElementDesc.classList.add("hidden");
        document.getElementById("enchant-desc").textContent = "Choose an item to enchant:";
        document.getElementById("enchant-desc").classList.remove("hidden");

        // Show all melee weapons (if weapon enchant not used)
        if (!player.malletUsedWeapon) {
            for (const wid of player.weapons) {
                const w = WEAPONS[wid];
                const enchanted = player.enchantments[wid];
                const el = document.createElement("div");
                el.className = "shop-item" + (enchanted ? " owned" : "");
                el.innerHTML = `
                    <span class="shop-item-icon">${w.icon}</span>
                    <span class="shop-item-name">${w.name}</span>
                    <span class="shop-item-desc">${enchanted ? "Enchanted: " + ELEMENTS[enchanted].name + " " + ELEMENTS[enchanted].icon : w.description}</span>
                    <span class="shop-item-price">${enchanted ? "ENCHANTED" : "Select"}</span>
                `;
                if (!enchanted) {
                    el.addEventListener("click", () => {
                        this.showEnchantElements(player, wid, "weapon");
                    });
                }
                this.enchantItems.appendChild(el);
            }

            // Show all bows
            for (const bid of player.bows) {
                const b = BOWS[bid];
                const enchanted = player.enchantments[bid];
                const el = document.createElement("div");
                el.className = "shop-item" + (enchanted ? " owned" : "");
                el.innerHTML = `
                    <span class="shop-item-icon">${b.icon}</span>
                    <span class="shop-item-name">${b.name}</span>
                    <span class="shop-item-desc">${enchanted ? "Enchanted: " + ELEMENTS[enchanted].name + " " + ELEMENTS[enchanted].icon : b.description}</span>
                    <span class="shop-item-price">${enchanted ? "ENCHANTED" : "Select"}</span>
                `;
                if (!enchanted) {
                    el.addEventListener("click", () => {
                        this.showEnchantElements(player, bid, "weapon");
                    });
                }
                this.enchantItems.appendChild(el);
            }
        }

        // Show armor section (if armor enchant not used)
        if (!player.malletUsedArmor) {
            for (const aid of player.armors) {
                const a = ARMOR[aid];
                const enchanted = player.armorEnchantedId === aid ? player.armorEnchantment : null;
                const el = document.createElement("div");
                el.className = "shop-item" + (enchanted ? " owned" : "");
                el.innerHTML = `
                    <span class="shop-item-icon">${a.icon}</span>
                    <span class="shop-item-name">${a.name}</span>
                    <span class="shop-item-desc">${enchanted ? "Enchanted: " + ELEMENTS[enchanted].name + " " + ELEMENTS[enchanted].icon : a.description}</span>
                    <span class="shop-item-price">${enchanted ? "ENCHANTED" : "Select"}</span>
                `;
                if (!enchanted && a.defense > 0) {
                    el.addEventListener("click", () => {
                        this.showEnchantElements(player, aid, "armor");
                    });
                } else if (!enchanted && a.defense === 0) {
                    el.style.opacity = "0.4";
                    el.querySelector(".shop-item-price").textContent = "Too weak";
                }
                this.enchantItems.appendChild(el);
            }
        }

        // If both are used, show a message
        if (player.malletUsedWeapon && player.malletUsedArmor) {
            document.getElementById("enchant-desc").textContent = "The Enchanter's Mallet has been fully spent.";
        } else if (player.malletUsedWeapon) {
            document.getElementById("enchant-desc").textContent = "Choose armor to enchant:";
        } else if (player.malletUsedArmor) {
            document.getElementById("enchant-desc").textContent = "Choose a weapon to enchant:";
        }
    }

    showEnchantElements(player, itemId, itemType) {
        document.getElementById("enchant-desc").classList.add("hidden");
        this.enchantItems.innerHTML = "";
        this.enchantElements.classList.remove("hidden");
        this.enchantElementDesc.classList.remove("hidden");
        this.enchantElements.innerHTML = "";

        let itemName;
        if (itemType === "armor") {
            itemName = ARMOR[itemId].name;
        } else {
            itemName = WEAPONS[itemId] ? WEAPONS[itemId].name : BOWS[itemId].name;
        }
        this.enchantElementDesc.textContent = `Enchant ${itemName} with:`;

        const elements = ["fire", "water", "ice", "lightning", "earth"];
        for (const en of elements) {
            const elem = ELEMENTS[en];
            const el = document.createElement("div");
            el.className = "shop-item";
            const descText = itemType === "armor"
                ? `${elem.name} defense effect`
                : `+${ENCHANT_DAMAGE_BONUS} ${elem.name} damage`;
            el.innerHTML = `
                <span class="shop-item-icon">${elem.icon}</span>
                <span class="shop-item-name">${elem.name}</span>
                <span class="shop-item-desc">${descText}</span>
                <span class="shop-item-price" style="color:${elem.color}">Enchant</span>
            `;
            el.addEventListener("click", () => {
                this.applyEnchant(player, itemId, en, itemType);
            });
            this.enchantElements.appendChild(el);
        }
    }

    applyEnchant(player, itemId, element, itemType) {
        const elemName = ELEMENTS[element].name;
        let itemName;

        if (itemType === "armor") {
            player.armorEnchantment = element;
            player.armorEnchantedId = itemId;
            player.malletUsedArmor = true;
            itemName = ARMOR[itemId].name;
            this.closeEnchant();
            if (this.game.sound) this.game.sound.gemCollect();
            this.showNotification(`${itemName} enchanted with ${elemName}!`);
            this.showDialog(`The Enchanter's Mallet glows as ${elemName} energy flows into your ${itemName}! It will unleash ${elemName} when you are struck.`);
        } else {
            player.enchantments[itemId] = element;
            player.malletUsedWeapon = true;
            itemName = WEAPONS[itemId] ? WEAPONS[itemId].name : BOWS[itemId].name;
            this.closeEnchant();
            if (this.game.sound) this.game.sound.gemCollect();
            this.showNotification(`${itemName} enchanted with ${elemName}! +${ENCHANT_DAMAGE_BONUS} damage`);
            this.showDialog(`The Enchanter's Mallet glows as ${elemName} energy flows into your ${itemName}! It now deals bonus ${elemName} damage.`);
        }
    }

    closeEnchant() {
        this.enchantOverlay.classList.add("hidden");
    }

    isEnchantOpen() {
        return !this.enchantOverlay.classList.contains("hidden");
    }

    // Lore system (Merlin's Hut)
    // Entries carrying a spoiler stay out of the library until the game marks
    // their unlock key discovered, so the shelf only ever holds what Ingoizer
    // could actually know by now.
    unlockedLore() {
        const unlocked = (this.game && this.game.loreUnlocks) || {};
        return MERLIN_LORE.filter(entry => !entry.unlock || unlocked[entry.unlock]);
    }

    openLore() {
        this.loreOverlay.classList.remove("hidden");
        this.lorePage = 0;
        this.renderLorePage();
    }

    renderLorePage() {
        const pages = this.unlockedLore();
        this.lorePage = clamp(this.lorePage, 0, Math.max(0, pages.length - 1));
        const entry = pages[this.lorePage];
        if (!entry) return;
        this.loreContent.innerHTML = `
            <div class="lore-entry-icon">${entry.icon}</div>
            <div class="lore-entry-title">${entry.title}</div>
            <div class="lore-entry-text">${entry.text}</div>
        `;
        document.getElementById("lore-page-num").textContent = `${this.lorePage + 1} / ${pages.length}`;
        document.getElementById("lore-prev").disabled = this.lorePage === 0;
        document.getElementById("lore-next").disabled = this.lorePage === pages.length - 1;
    }

    closeLore() {
        this.loreOverlay.classList.add("hidden");
    }

    isLoreOpen() {
        return !this.loreOverlay.classList.contains("hidden");
    }

    // Interaction prompt
    renderInteractionPrompt(ctx, text) {
        ctx.save();
        // Measure with the font the text is actually drawn in, left-aligned,
        // then pad both sides. A centered measure was leaving the plate tight
        // enough that the last letters sat on the edge.
        ctx.font = "14px monospace";
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        const textW = Math.ceil(ctx.measureText(text).width);
        const padX = 28;
        const w = textW + padX * 2;
        const h = 30;
        const x = Math.round(CANVAS_W / 2 - w / 2);
        const y = CANVAS_H - 86;
        ctx.fillStyle = "rgba(0, 0, 0, 0.78)";
        ctx.fillRect(x, y, w, h);
        ctx.fillStyle = "#ffd700";
        ctx.fillText(text, x + padX, y + h / 2 + 1);
        ctx.restore();
    }
}
