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
        this.shopItems = document.getElementById("shop-items");
        this.inventoryOverlay = document.getElementById("inventory-overlay");
        this.invWeapons = document.getElementById("inventory-weapons");
        this.invGems = document.getElementById("inventory-gems");
        this.dialogBox = document.getElementById("dialog-box");
        this.dialogText = document.getElementById("dialog-text");
        this.gameOverScreen = document.getElementById("game-over-screen");
        this.gameOverTitle = document.getElementById("game-over-title");
        this.gameOverText = document.getElementById("game-over-text");

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

        // Weapon
        const weapon = player.getWeapon();
        this.weaponDisplay.textContent = `${weapon.icon} ${weapon.name}`;

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
        this.shopItems.innerHTML = "";
        this.shopOverlay.classList.remove("hidden");

        for (const itemId of shop.inventory) {
            // Check if weapon or potion
            const isWeapon = WEAPONS[itemId];
            const isPotion = SHOP_POTIONS[itemId];
            const item = isWeapon || isPotion;
            if (!item) continue;

            const owned = isWeapon && player.weapons.includes(itemId);
            const canAfford = player.gold >= item.price;

            const el = document.createElement("div");
            el.className = "shop-item" + (owned ? " owned" : "");
            el.innerHTML = `
                <span class="shop-item-icon">${item.icon}</span>
                <span class="shop-item-name">${item.name}</span>
                <span class="shop-item-desc">${item.description}</span>
                <span class="shop-item-price">${owned ? "OWNED" : item.price + " gold"}</span>
            `;

            if (!owned && canAfford) {
                el.addEventListener("click", () => {
                    this.buyItem(itemId, isWeapon, isPotion, player, shop);
                });
            }

            this.shopItems.appendChild(el);
        }
    }

    buyItem(itemId, isWeapon, isPotion, player, shop) {
        const item = isWeapon || isPotion;
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
        this.invGems.innerHTML = "<h3 style='color:#4488ff;width:100%;text-align:center;margin-bottom:8px;'>Blue Gems: " + player.blueGems + " / 5</h3>";

        for (const wid of player.weapons) {
            const w = WEAPONS[wid];
            const isEquipped = player.currentWeapon === wid;
            const el = document.createElement("div");
            el.className = "inv-item" + (isEquipped ? " equipped" : "");
            el.innerHTML = `
                <span class="inv-item-icon">${w.icon}</span>
                <span class="inv-item-name">${w.name}</span>
                <span class="inv-item-name" style="color:#aaa;font-size:10px;">DMG: ${w.damage}</span>
            `;
            el.addEventListener("click", () => {
                player.equipWeapon(wid);
                this.openInventory(player);
                this.showNotification(`Equipped ${w.name}`);
            });
            this.invWeapons.appendChild(el);
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
        } else {
            this.gameOverScreen.classList.remove("victory");
            this.gameOverTitle.textContent = "Game Over";
        }
        this.gameOverText.textContent = text;
    }

    // Boss health
    showBossHealth(boss) {
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
