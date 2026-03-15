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
        this.inventoryOverlay = document.getElementById("inventory-overlay");
        this.invWeapons = document.getElementById("inventory-weapons");
        this.invGems = document.getElementById("inventory-gems");
        this.arrowCount = document.getElementById("arrow-count");
        this.invBows = document.getElementById("inventory-bows");
        this.invArmor = document.getElementById("inventory-armor");
        this.dialogBox = document.getElementById("dialog-box");
        this.dialogText = document.getElementById("dialog-text");
        this.gameOverScreen = document.getElementById("game-over-screen");
        this.gameOverTitle = document.getElementById("game-over-title");
        this.gameOverText = document.getElementById("game-over-text");

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

        this.elemSlots = {
            fire: document.getElementById("elem-fire"),
            water: document.getElementById("elem-water"),
            ice: document.getElementById("elem-ice"),
            lightning: document.getElementById("elem-lightning"),
            earth: document.getElementById("elem-earth"),
        };

        this.setupButtons();
    }

    setupButtons() {
        document.getElementById("startBtn").addEventListener("click", () => {
            this.titleScreen.classList.add("hidden");
            this.game.startGame();
        });

        document.getElementById("controlsBtn").addEventListener("click", () => {
            this.titleScreen.classList.add("hidden");
            this.controlsScreen.classList.remove("hidden");
        });

        document.getElementById("backBtn").addEventListener("click", () => {
            this.controlsScreen.classList.add("hidden");
            this.titleScreen.classList.remove("hidden");
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
            if (this.lorePage < MERLIN_LORE.length - 1) {
                this.lorePage++;
                this.renderLorePage();
            }
        });

        document.getElementById("inv-close").addEventListener("click", () => {
            this.closeInventory();
        });

        document.getElementById("restartBtn").addEventListener("click", () => {
            this.gameOverScreen.classList.add("hidden");
            this.game.restart();
        });
    }

    showHud() {
        this.hud.classList.remove("hidden");
    }

    hideHud() {
        this.hud.classList.add("hidden");
    }

    updateHud(player) {
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

        // Gems
        this.gemCount.textContent = player.blueGems;

        // Gold
        this.goldCount.textContent = player.gold;

        // Arrows
        this.arrowCount.textContent = player.arrows;

        // Weapon & Armor
        const weapon = player.getWeapon();
        const bow = player.getBow();
        const armor = player.getArmor();
        const defText = armor.defense > 0 ? `  |  ${armor.icon} DEF: ${armor.defense}` : "";
        this.weaponDisplay.textContent = `${weapon.icon} ${weapon.name}  |  ${bow.icon} ${bow.name}${defText}`;

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
        // Remove existing
        const existing = document.querySelector(".notification");
        if (existing) existing.remove();

        const el = document.createElement("div");
        el.className = "notification";
        el.textContent = text;
        document.getElementById("game-container").appendChild(el);
        setTimeout(() => el.remove(), 2500);
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
    openShop(shop, player) {
        this.shopTitle.textContent = shop.name;
        this.shopGoldCount.textContent = player.gold;
        this.shopItems.innerHTML = "";
        this.shopOverlay.classList.remove("hidden");

        for (const itemId of shop.inventory) {
            // Check if weapon, bow, armor, or potion
            const isWeapon = WEAPONS[itemId];
            const isBow = BOWS[itemId];
            const isArmor = ARMOR[itemId];
            const isPotion = SHOP_POTIONS[itemId];
            const item = isWeapon || isBow || isArmor || isPotion;
            if (!item) continue;

            const owned = (isWeapon && player.weapons.includes(itemId)) ||
                          (isBow && player.bows.includes(itemId)) ||
                          (isArmor && player.armors.includes(itemId));
            const canAfford = player.gold >= item.price;

            // Build stats line for weapons, bows, and armor
            let statsHtml = "";
            if (isWeapon) {
                const spdLabel = item.speed >= 1.1 ? "Fast" : item.speed >= 1.0 ? "Normal" : item.speed >= 0.8 ? "Slow" : "V.Slow";
                statsHtml = `<div class="shop-item-stats">
                    <span>DMG: ${item.damage}</span>
                    <span>SPD: ${spdLabel}</span>
                    <span>RNG: ${item.range}</span>
                </div>`;
            } else if (isBow) {
                const spdLabel = item.speed >= 1.1 ? "Fast" : item.speed >= 1.0 ? "Normal" : item.speed >= 0.8 ? "Slow" : "V.Slow";
                statsHtml = `<div class="shop-item-stats">
                    <span>DMG: ${item.damage}</span>
                    <span>SPD: ${spdLabel}</span>
                    <span>RNG: ${item.range}</span>
                </div>`;
            } else if (isArmor) {
                statsHtml = `<div class="shop-item-stats">
                    <span>DEF: ${item.defense}</span>
                </div>`;
            }

            const el = document.createElement("div");
            el.className = "shop-item" + (owned ? " owned" : (!canAfford ? " too-expensive" : ""));
            el.innerHTML = `
                <span class="shop-item-icon">${item.icon}</span>
                <span class="shop-item-name">${item.name}</span>
                <span class="shop-item-desc">${item.description}</span>
                ${statsHtml}
                <span class="shop-item-price">${owned ? "OWNED" : item.price + " gold"}</span>
            `;

            if (!owned && canAfford) {
                el.addEventListener("click", () => {
                    this.buyItem(itemId, isWeapon, isBow, isArmor, isPotion, player, shop);
                });
            }

            this.shopItems.appendChild(el);
        }
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
            // Use potion immediately
            switch (isPotion.effect) {
                case "heal":
                    player.heal(isPotion.value);
                    this.showNotification(`Used ${item.name}! +${isPotion.value} HP`);
                    break;
                case "mana":
                    player.mana = Math.min(player.maxMana, player.mana + isPotion.value);
                    this.showNotification(`Used ${item.name}! +${isPotion.value} Mana`);
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
            }
        }

        // Refresh shop
        this.openShop(shop, player);
    }

    closeShop() {
        this.shopOverlay.classList.add("hidden");
    }

    isShopOpen() {
        return !this.shopOverlay.classList.contains("hidden");
    }

    // Inventory
    openInventory(player) {
        this.inventoryOverlay.classList.remove("hidden");
        this.invWeapons.innerHTML = "<h3 style='color:#ffd700;width:100%;text-align:center;margin-bottom:8px;'>Weapons</h3>";
        this.invBows.innerHTML = "<h3 style='color:#cc8844;width:100%;text-align:center;margin-bottom:8px;'>Bows (Arrows: " + player.arrows + ")</h3>";
        this.invGems.innerHTML = "<h3 style='color:#4488ff;width:100%;text-align:center;margin-bottom:8px;'>Blue Gems: " + player.blueGems + " / 5</h3>";

        // Show sheath if acquired
        if (player.hasSheath) {
            const sheathEl = document.createElement("div");
            sheathEl.className = "inv-item equipped";
            sheathEl.style.borderColor = "#ffd700";
            sheathEl.innerHTML = `
                <span class="inv-item-icon">🗡️</span>
                <span class="inv-item-name">Jewel Sheath</span>
                <span class="inv-item-name" style="color:#ffd700;font-size:10px;">+${SHEATH_DAMAGE_BONUS} DMG (all weapons)</span>
            `;
            this.invWeapons.appendChild(sheathEl);
        }

        // Show Enchanter's Mallet if player has it and it can still enchant something
        if (player.hasMallet && (!player.malletUsedWeapon || !player.malletUsedArmor)) {
            const malletEl = document.createElement("div");
            malletEl.className = "inv-item";
            malletEl.style.borderColor = "#aa66ff";
            malletEl.style.boxShadow = "0 0 8px rgba(160, 100, 255, 0.4)";
            const remainingText = !player.malletUsedWeapon && !player.malletUsedArmor
                ? "Tap to enchant weapon or armor"
                : !player.malletUsedWeapon ? "Tap to enchant a weapon" : "Tap to enchant armor";
            malletEl.innerHTML = `
                <span class="inv-item-icon">🔨</span>
                <span class="inv-item-name">Enchanter's Mallet</span>
                <span class="inv-item-name" style="color:#aa66ff;font-size:10px;">${remainingText}</span>
            `;
            malletEl.addEventListener("click", () => {
                this.closeInventory();
                this.openEnchant(player);
            });
            this.invWeapons.appendChild(malletEl);
        }

        for (const wid of player.weapons) {
            const w = WEAPONS[wid];
            let dmg = player.hasSheath ? w.damage + SHEATH_DAMAGE_BONUS : w.damage;
            const enchant = player.enchantments[wid];
            if (enchant) dmg += ENCHANT_DAMAGE_BONUS;
            if (player.greenGemAttack) dmg += GREEN_GEM_ATTACK.bonus;
            if (player.hasMagicCharm) dmg += MAGIC_CHARM.damageBonus;
            const isEquipped = player.currentWeapon === wid;
            const el = document.createElement("div");
            el.className = "inv-item" + (isEquipped ? " equipped" : "");
            if (enchant) el.style.boxShadow = `0 0 8px ${ELEMENTS[enchant].color}40`;
            el.innerHTML = `
                <span class="inv-item-icon">${w.icon}</span>
                <span class="inv-item-name">${w.name}${enchant ? " " + ELEMENTS[enchant].icon : ""}</span>
                <span class="inv-item-name" style="color:#aaa;font-size:10px;">DMG: ${dmg}${enchant ? " (" + ELEMENTS[enchant].name + ")" : ""}</span>
            `;
            el.addEventListener("click", () => {
                player.equipWeapon(wid);
                this.openInventory(player);
                this.showNotification(`Equipped ${w.name}`);
            });
            this.invWeapons.appendChild(el);
        }

        // Show armor
        const totalDef = player.getArmor().defense + (player.greenGemDefense ? GREEN_GEM_DEFENSE.bonus : 0);
        this.invArmor.innerHTML = "<h3 style='color:#88aacc;width:100%;text-align:center;margin-bottom:8px;'>Armor (DEF: " + totalDef + ")</h3>";
        for (const aid of player.armors) {
            const a = ARMOR[aid];
            const isEquipped = player.currentArmor === aid;
            const armorEnchant = player.armorEnchantedId === aid ? player.armorEnchantment : null;
            const el = document.createElement("div");
            el.className = "inv-item" + (isEquipped ? " equipped" : "");
            if (armorEnchant) el.style.boxShadow = `0 0 8px ${ELEMENTS[armorEnchant].color}40`;
            el.innerHTML = `
                <span class="inv-item-icon">${a.icon}</span>
                <span class="inv-item-name">${a.name}${armorEnchant ? " " + ELEMENTS[armorEnchant].icon : ""}</span>
                <span class="inv-item-name" style="color:#aaa;font-size:10px;">DEF: ${a.defense}${armorEnchant ? " (" + ELEMENTS[armorEnchant].name + ")" : ""}</span>
            `;
            el.addEventListener("click", () => {
                player.equipArmor(aid);
                this.openInventory(player);
                this.showNotification(`Equipped ${a.name}`);
            });
            this.invArmor.appendChild(el);
        }

        // Show bows
        for (const bid of player.bows) {
            const b = BOWS[bid];
            let dmgBow = player.hasSheath ? b.damage + SHEATH_DAMAGE_BONUS : b.damage;
            const enchant = player.enchantments[bid];
            if (enchant) dmgBow += ENCHANT_DAMAGE_BONUS;
            if (player.greenGemAttack) dmgBow += GREEN_GEM_ATTACK.bonus;
            if (player.hasMagicCharm) dmgBow += MAGIC_CHARM.damageBonus;
            const isEquipped = player.currentBow === bid;
            const el = document.createElement("div");
            el.className = "inv-item" + (isEquipped ? " equipped" : "");
            if (enchant) el.style.boxShadow = `0 0 8px ${ELEMENTS[enchant].color}40`;
            el.innerHTML = `
                <span class="inv-item-icon">${b.icon}</span>
                <span class="inv-item-name">${b.name}${enchant ? " " + ELEMENTS[enchant].icon : ""}</span>
                <span class="inv-item-name" style="color:#aaa;font-size:10px;">DMG: ${dmgBow}${enchant ? " (" + ELEMENTS[enchant].name + ")" : ""}</span>
            `;
            el.addEventListener("click", () => {
                player.equipBow(bid);
                this.openInventory(player);
                this.showNotification(`Equipped ${b.name}`);
            });
            this.invBows.appendChild(el);
        }

        // Show green gems and magic charm
        if (player.hasDarkCrest || player.greenGemAttack || player.greenGemDefense || player.hasMagicCharm) {
            const specialHeader = document.createElement("h3");
            specialHeader.style.cssText = "color:#44ff44;width:100%;text-align:center;margin-bottom:8px;margin-top:12px;";
            specialHeader.textContent = "Special Items";
            this.invGems.appendChild(specialHeader);

            if (player.hasDarkCrest) {
                const el = document.createElement("div");
                el.className = "inv-item equipped";
                el.style.borderColor = "#cc4444";
                el.innerHTML = `
                    <span class="inv-item-icon">${DARK_CREST.icon}</span>
                    <span class="inv-item-name">${DARK_CREST.name}</span>
                    <span class="inv-item-name" style="color:#cc4444;font-size:10px;">+${DARK_CREST.maxHpBonus} Max HP</span>
                `;
                this.invGems.appendChild(el);
            }
            if (player.greenGemAttack) {
                const el = document.createElement("div");
                el.className = "inv-item equipped";
                el.style.borderColor = "#44ff44";
                el.innerHTML = `
                    <span class="inv-item-icon">${GREEN_GEM_ATTACK.icon}</span>
                    <span class="inv-item-name">${GREEN_GEM_ATTACK.name}</span>
                    <span class="inv-item-name" style="color:#44ff44;font-size:10px;">+${GREEN_GEM_ATTACK.bonus} ATK (all weapons)</span>
                `;
                this.invGems.appendChild(el);
            }
            if (player.greenGemDefense) {
                const el = document.createElement("div");
                el.className = "inv-item equipped";
                el.style.borderColor = "#44ff44";
                el.innerHTML = `
                    <span class="inv-item-icon">${GREEN_GEM_DEFENSE.icon}</span>
                    <span class="inv-item-name">${GREEN_GEM_DEFENSE.name}</span>
                    <span class="inv-item-name" style="color:#44ff44;font-size:10px;">+${GREEN_GEM_DEFENSE.bonus} DEF (all armor)</span>
                `;
                this.invGems.appendChild(el);
            }
            if (player.hasMagicCharm) {
                const el = document.createElement("div");
                el.className = "inv-item equipped";
                el.style.borderColor = "#aa66ff";
                el.style.boxShadow = "0 0 8px rgba(160, 100, 255, 0.4)";
                el.innerHTML = `
                    <span class="inv-item-icon">${MAGIC_CHARM.icon}</span>
                    <span class="inv-item-name">${MAGIC_CHARM.name}</span>
                    <span class="inv-item-name" style="color:#aa66ff;font-size:10px;">+${MAGIC_CHARM.damageBonus} DMG (all weapons)</span>
                `;
                this.invGems.appendChild(el);
            }
        }

        // Show element gems
        const elemNames = ["fire", "water", "ice", "lightning"];
        for (const en of elemNames) {
            const elem = ELEMENTS[en];
            const unlocked = player.elements[en];
            const el = document.createElement("div");
            el.className = "inv-item" + (player.activeElement === en ? " equipped" : "");
            el.style.opacity = unlocked ? "1" : "0.3";
            el.innerHTML = `
                <span class="inv-item-icon">${elem.icon}</span>
                <span class="inv-item-name">${elem.name}</span>
                <span class="inv-item-name" style="color:#aaa;font-size:10px;">${unlocked ? "Unlocked" : "Locked"}</span>
            `;
            if (unlocked) {
                el.addEventListener("click", () => {
                    player.activeElement = player.activeElement === en ? null : en;
                    this.openInventory(player);
                    this.showNotification(player.activeElement ? `${elem.name} power active!` : "Power deactivated");
                });
            }
            this.invGems.appendChild(el);
        }
    }

    closeInventory() {
        this.inventoryOverlay.classList.add("hidden");
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

    // Game Over
    showGameOver(victory, text) {
        this.gameOverScreen.classList.remove("hidden");
        if (victory) {
            this.gameOverScreen.classList.add("victory");
            this.gameOverTitle.textContent = "Victory!";
            // Add continue button for victories
            let continueBtn = document.getElementById("continueBtn");
            if (!continueBtn) {
                continueBtn = document.createElement("button");
                continueBtn.id = "continueBtn";
                continueBtn.className = "menu-btn";
                continueBtn.textContent = "Continue Exploring";
                continueBtn.style.marginTop = "8px";
                document.getElementById("restartBtn").parentNode.insertBefore(continueBtn, document.getElementById("restartBtn"));
            }
            continueBtn.classList.remove("hidden");
            continueBtn.onclick = () => {
                this.gameOverScreen.classList.add("hidden");
                this.gameOverScreen.classList.remove("victory");
                continueBtn.classList.add("hidden");
            };
        } else {
            this.gameOverScreen.classList.remove("victory");
            this.gameOverTitle.textContent = "Game Over";
            const continueBtn = document.getElementById("continueBtn");
            if (continueBtn) continueBtn.classList.add("hidden");
        }
        this.gameOverText.textContent = text;
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
        }

        const fill = document.getElementById("boss-health-fill");
        if (fill) {
            fill.style.width = ((boss.hp / boss.maxHp) * 100) + "%";
        }
    }

    hideBossHealth() {
        const container = document.getElementById("boss-health-container");
        if (container) container.remove();
    }

    // Mana bar rendering on canvas
    renderManaBar(ctx, player) {
        const barW = 120;
        const barH = 8;
        const barX = 12;
        const barY = 34;

        ctx.fillStyle = "#222";
        ctx.fillRect(barX, barY, barW, barH);
        ctx.fillStyle = "#4466cc";
        ctx.fillRect(barX, barY, barW * (player.mana / player.maxMana), barH);
        ctx.strokeStyle = "#666";
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, barW, barH);

        ctx.fillStyle = "#aaccff";
        ctx.font = "8px monospace";
        ctx.textAlign = "left";
        ctx.fillText(`MP ${Math.ceil(player.mana)}/${player.maxMana}`, barX + 2, barY + 7);
    }

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
    openLore() {
        this.loreOverlay.classList.remove("hidden");
        this.lorePage = 0;
        this.renderLorePage();
    }

    renderLorePage() {
        const entry = MERLIN_LORE[this.lorePage];
        this.loreContent.innerHTML = `
            <div class="lore-entry-icon">${entry.icon}</div>
            <div class="lore-entry-title">${entry.title}</div>
            <div class="lore-entry-text">${entry.text}</div>
        `;
        document.getElementById("lore-page-num").textContent = `${this.lorePage + 1} / ${MERLIN_LORE.length}`;
        document.getElementById("lore-prev").disabled = this.lorePage === 0;
        document.getElementById("lore-next").disabled = this.lorePage === MERLIN_LORE.length - 1;
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
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        const w = ctx.measureText(text).width + 20;
        ctx.fillRect(CANVAS_W / 2 - w / 2, CANVAS_H - 80, w, 24);
        ctx.fillStyle = "#ffd700";
        ctx.font = "14px monospace";
        ctx.textAlign = "center";
        ctx.fillText(text, CANVAS_W / 2, CANVAS_H - 63);
        ctx.restore();
    }
}
