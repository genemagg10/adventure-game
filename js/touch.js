// ============================================
// Ingoizer's World - Touch Controls for Mobile
// ============================================

class TouchControls {
    constructor(game) {
        this.game = game;
        this.active = false;
        this.container = document.getElementById("game-container");

        // Virtual joystick state
        this.joystick = {
            active: false,
            touchId: null,
            originX: 0,
            originY: 0,
            currentX: 0,
            currentY: 0,
            dx: 0,
            dy: 0,
            radius: 60,
        };

        // Track button presses for just-pressed detection
        this.buttonStates = {};

        this.detect();
    }

    detect() {
        // Show touch controls if touch device or narrow screen
        const isTouch = ("ontouchstart" in window) || navigator.maxTouchPoints > 0;
        const isNarrow = window.innerWidth <= 900;
        if (isTouch || isNarrow) {
            this.enable();
        }
        // Also enable on resize to narrow
        window.addEventListener("resize", () => {
            const narrow = window.innerWidth <= 900;
            const touch = ("ontouchstart" in window) || navigator.maxTouchPoints > 0;
            if ((narrow || touch) && !this.active) this.enable();
            // Pause/resume game based on portrait/landscape orientation
            this.checkOrientation();
        });
        // Initial orientation check
        this.checkOrientation();
    }

    checkOrientation() {
        const isTouch = ("ontouchstart" in window) || navigator.maxTouchPoints > 0;
        const isNarrow = window.innerWidth <= 900;
        if (!isTouch && !isNarrow) return; // Only apply to mobile/touch devices

        const isPortrait = window.innerHeight > window.innerWidth;
        if (isPortrait && this.game.state === "playing" && !this.game.paused) {
            this.game.paused = true;
            this._pausedByOrientation = true;
        } else if (!isPortrait && this._pausedByOrientation) {
            this.game.paused = false;
            this._pausedByOrientation = false;
        }
    }

    enable() {
        if (this.active) return;
        this.active = true;
        document.body.classList.add("touch-mode");

        // Lock viewport - prevent any page scrolling, bouncing, or zooming.
        // Anything that can genuinely scroll keeps its drag: the old hard-coded
        // allow-list named panels that no longer exist, which left the whole
        // inventory unscrollable on touch.
        document.addEventListener("touchmove", (e) => {
            if (TouchControls.scrollableAncestor(e.target)) return;
            e.preventDefault();
        }, { passive: false });

        this.createUI();
        this.bindEvents();
    }

    createUI() {
        // Touch controls overlay (positioned over the game canvas)
        const overlay = document.createElement("div");
        overlay.id = "touch-controls";
        overlay.innerHTML = `
            <div id="touch-joystick-zone">
                <div id="touch-joystick-base">
                    <div id="touch-joystick-knob"></div>
                </div>
            </div>
            <div id="touch-buttons-right-wrapper">
                <button class="touch-btn touch-btn-potion" data-action="potion" aria-label="Use health potion">🧪</button>
                <div id="touch-buttons-right">
                    <button class="touch-btn touch-btn-attack" data-action="attack" aria-label="Attack">⚔️</button>
                    <button class="touch-btn touch-btn-shoot" data-action="shoot" aria-label="Shoot arrow">🏹</button>
                    <button class="touch-btn touch-btn-element" data-action="element" aria-label="Use elemental power">✨</button>
                    <button class="touch-btn touch-btn-interact" data-action="interact" aria-label="Interact">✋</button>
                </div>
            </div>
            <div id="touch-buttons-top">
                <button class="touch-btn-small" data-action="inventory" aria-label="Open inventory" title="Inventory">🎒</button>
                <button class="touch-btn-small" data-action="pause" aria-label="Open menu" title="Menu">☰</button>
            </div>
        `;
        this.container.appendChild(overlay);

        // Make element slots tappable on mobile
        const elemSlots = document.querySelectorAll(".element-slot");
        elemSlots.forEach(slot => {
            slot.style.pointerEvents = "auto";
            slot.style.cursor = "pointer";
        });

        this.joystickBase = document.getElementById("touch-joystick-base");
        this.joystickKnob = document.getElementById("touch-joystick-knob");

        // The five faces that change with what you carry and what you stand
        // next to. Each caches what was last written to it so the per-frame
        // sync only touches the DOM when something has actually changed.
        this.faces = {};
        for (const action of ["potion", "attack", "shoot", "element", "interact"]) {
            const el = overlay.querySelector(`[data-action="${action}"]`);
            if (el) this.faces[action] = { el, icon: el.textContent, label: el.getAttribute("aria-label"), idle: null };
        }
    }

    // Paint one button: its symbol, its spoken label, and whether it is dimmed
    // for having nothing to do. Writes only what changed.
    setFace(action, icon, label, idle) {
        const face = this.faces[action];
        if (!face) return;
        if (face.icon !== icon) {
            face.icon = icon;
            face.el.textContent = icon;
        }
        if (face.label !== label) {
            face.label = label;
            face.el.setAttribute("aria-label", label);
        }
        if (face.idle !== idle) {
            face.idle = idle;
            face.el.classList.toggle("touch-btn-idle", idle);
        }
    }

    // Called once a frame: the buttons wear the sword, bow, power and apple
    // they will actually use, so nothing has to be read to be understood.
    syncButtons() {
        if (!this.active || !this.faces) return;
        const player = this.game.player;
        if (!player) return;

        const potions = player.healthPotions + player.greaterHealthPotions;
        this.setFace("potion", HEALTH_POTION.icon,
            potions > 0 ? `Use health potion (${potions})` : "No health potions",
            potions === 0);

        const weapon = WEAPONS[player.currentWeapon];
        if (weapon) this.setFace("attack", weapon.icon, `Attack with ${weapon.name}`, false);

        const bow = BOWS[player.currentBow];
        if (bow) {
            this.setFace("shoot", bow.icon,
                player.arrows > 0 ? `Shoot ${bow.name} (${player.arrows} arrows)` : "No arrows",
                player.arrows <= 0);
        }

        const element = player.activeElement ? ELEMENTS[player.activeElement] : null;
        this.setFace("element", element ? element.icon : "✨",
            element ? `Use ${element.name} power` : "No power selected",
            !element);

        const act = this.game.interactContext();
        this.setFace("interact", act ? act.icon : "✋",
            act ? act.short : "Nothing to interact with",
            !act);
    }

    bindEvents() {
        // Prevent default touch behaviors on the game container
        this.container.addEventListener("touchstart", (e) => {
            // Don't prevent on UI overlays (shop items, riddle choices, menus, etc.)
            if (this.isOnUIOverlay(e.target)) return;
            e.preventDefault();
        }, { passive: false });

        this.container.addEventListener("touchmove", (e) => {
            if (this.isOnUIOverlay(e.target)) return;
            e.preventDefault();
        }, { passive: false });

        // Joystick zone
        const jZone = document.getElementById("touch-joystick-zone");
        jZone.addEventListener("touchstart", (e) => this.onJoystickStart(e), { passive: false });
        jZone.addEventListener("touchmove", (e) => this.onJoystickMove(e), { passive: false });
        jZone.addEventListener("touchend", (e) => this.onJoystickEnd(e), { passive: false });
        jZone.addEventListener("touchcancel", (e) => this.onJoystickEnd(e), { passive: false });

        // Action buttons
        const buttons = document.querySelectorAll(".touch-btn, .touch-btn-small");
        buttons.forEach(btn => {
            const action = btn.dataset.action;
            btn.addEventListener("touchstart", (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.onButtonPress(action);
            }, { passive: false });
            btn.addEventListener("touchend", (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.onButtonRelease(action);
            }, { passive: false });
        });

        // Element slot taps
        const elemSlots = document.querySelectorAll(".element-slot");
        elemSlots.forEach(slot => {
            slot.addEventListener("touchstart", (e) => {
                e.stopPropagation();
                const elemMap = {
                    "elem-fire": "elem1",
                    "elem-water": "elem2",
                    "elem-ice": "elem3",
                    "elem-lightning": "elem4",
                    "elem-earth": "elem5",
                };
                const action = elemMap[slot.id];
                if (action) {
                    this.game.keyJustPressed[action] = true;
                    this.game.sound.ensureContext();
                }
            }, { passive: false });
        });

        // Dialog box tap to advance
        const dialogBox = document.getElementById("dialog-box");
        dialogBox.addEventListener("touchstart", (e) => {
            e.stopPropagation();
            if (this.game.ui.dialogActive) {
                this.game.sound.dialogAdvance();
                this.game.ui.advanceDialog();
            }
        }, { passive: false });

        // The X is the only way out of an overlay, so it acts on the touch
        // itself rather than waiting for the click the browser synthesises
        // afterwards - that click is easy for anything else to swallow.
        const closers = [
            ["inv-close", () => { if (this.game.ui.isInventoryOpen()) this.game.ui.closeInventory(); }],
            ["shop-close", () => { if (this.game.ui.isShopOpen()) this.game.ui.closeShop(); }],
            ["map-close", () => { if (this.game.ui.isMapOpen()) this.game.ui.toggleMap(); }],
            ["about-close", () => { if (this.game.ui.isAboutOpen()) this.game.ui.closeAbout(); }],
        ];
        for (const [id, close] of closers) {
            const btn = document.getElementById(id);
            if (!btn) continue;
            // Closing happens the moment the finger lands. Waiting for touchend
            // loses every touch the browser cancels first - a drift past the
            // slop threshold, a second finger, or one of the phone's own edge
            // swipes, which is exactly where these buttons sit. preventDefault
            // also cancels the click the browser would synthesise afterwards,
            // and stopPropagation keeps the map overlay's tap-to-close out of
            // it. touchend and touchcancel are harmless second chances: each
            // closer checks whether its screen is still open.
            const act = (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.game.sound.ensureContext();
                close();
            };
            btn.addEventListener("touchstart", act, { passive: false });
            btn.addEventListener("touchend", act, { passive: false });
            btn.addEventListener("touchcancel", act, { passive: false });
        }

        // The minimap is the map button. Tapping it opens the full world map,
        // which keeps a control off the playfield entirely.
        const minimap = document.getElementById("minimap-container");
        if (minimap) {
            minimap.addEventListener("touchstart", (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (this.game.state !== "playing") return;
                this.onButtonPress("map");
            }, { passive: false });
            minimap.addEventListener("touchend", (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.onButtonRelease("map");
            }, { passive: false });
        }

        // Map overlay tap to close
        const mapOverlay = document.getElementById("map-overlay");
        mapOverlay.addEventListener("touchstart", (e) => {
            e.stopPropagation();
            if (this.game.ui.isMapOpen()) {
                this.game.ui.toggleMap();
            }
        }, { passive: false });
    }

    // Walk up from a touch target looking for a region that both allows and
    // needs scrolling. Used to decide whether a drag belongs to the page lock
    // or to a panel of items.
    static scrollableAncestor(target) {
        let el = target instanceof Element ? target : null;
        while (el && el !== document.body) {
            const style = window.getComputedStyle(el);
            const overflowY = style.overflowY;
            if ((overflowY === "auto" || overflowY === "scroll") && el.scrollHeight > el.clientHeight + 1) return el;
            const overflowX = style.overflowX;
            if ((overflowX === "auto" || overflowX === "scroll") && el.scrollWidth > el.clientWidth + 1) return el;
            el = el.parentElement;
        }
        return null;
    }

    isOnUIOverlay(target) {
        // Check if the touch target is within a UI overlay that should handle its own events
        const overlayIds = ["shop-overlay", "inventory-overlay", "riddle-overlay",
                           "map-overlay", "title-screen", "character-screen", "controls-screen",
                           "game-over-screen", "lore-overlay", "enchant-overlay",
                           "pause-overlay", "slots-overlay"];
        for (const id of overlayIds) {
            const el = document.getElementById(id);
            if (el && !el.classList.contains("hidden") && el.contains(target)) {
                return true;
            }
        }
        // Also allow menu buttons through
        if (target.classList.contains("menu-btn") || target.classList.contains("shop-item") ||
            target.classList.contains("riddle-choice") || target.classList.contains("inv-item") ||
            target.classList.contains("lore-nav-btn") || target.closest(".save-slot")) {
            return true;
        }
        return false;
    }

    onJoystickStart(e) {
        e.preventDefault();
        if (this.joystick.active) return;
        const touch = e.changedTouches[0];
        const rect = e.currentTarget.getBoundingClientRect();
        this.joystick.active = true;
        this.joystick.touchId = touch.identifier;
        this.joystick.originX = touch.clientX - rect.left;
        this.joystick.originY = touch.clientY - rect.top;
        this.joystick.currentX = this.joystick.originX;
        this.joystick.currentY = this.joystick.originY;

        // Move joystick base to touch point
        this.joystickBase.style.left = (this.joystick.originX - 60) + "px";
        this.joystickBase.style.top = (this.joystick.originY - 60) + "px";
        this.joystickBase.style.transform = "none";
        this.joystickBase.style.opacity = "1";

        this.game.sound.ensureContext();
    }

    onJoystickMove(e) {
        e.preventDefault();
        if (!this.joystick.active) return;
        for (const touch of e.changedTouches) {
            if (touch.identifier === this.joystick.touchId) {
                const rect = e.currentTarget.getBoundingClientRect();
                this.joystick.currentX = touch.clientX - rect.left;
                this.joystick.currentY = touch.clientY - rect.top;

                let dx = this.joystick.currentX - this.joystick.originX;
                let dy = this.joystick.currentY - this.joystick.originY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const maxDist = this.joystick.radius;

                if (dist > maxDist) {
                    dx = (dx / dist) * maxDist;
                    dy = (dy / dist) * maxDist;
                }

                this.joystick.dx = dx / maxDist;
                this.joystick.dy = dy / maxDist;

                // Move knob visually
                this.joystickKnob.style.transform = `translate(${dx}px, ${dy}px)`;
                break;
            }
        }
    }

    onJoystickEnd(e) {
        e.preventDefault();
        for (const touch of e.changedTouches) {
            if (touch.identifier === this.joystick.touchId) {
                this.joystick.active = false;
                this.joystick.touchId = null;
                this.joystick.dx = 0;
                this.joystick.dy = 0;

                this.joystickKnob.style.transform = "translate(0px, 0px)";
                this.joystickBase.style.opacity = "0.5";
                break;
            }
        }
    }

    onButtonPress(action) {
        this.game.sound.ensureContext();
        this.game.keyJustPressed[action] = true;
        this.game.keys[action] = true;
        this.buttonStates[action] = true;
    }

    onButtonRelease(action) {
        this.game.keys[action] = false;
        this.buttonStates[action] = false;
    }

    // Called each frame by the game to apply joystick to movement keys
    applyInput() {
        if (!this.active) return;

        const deadzone = 0.2;
        const dx = this.joystick.dx;
        const dy = this.joystick.dy;

        // Map joystick to directional keys
        this.game.keys.left = dx < -deadzone;
        this.game.keys.right = dx > deadzone;
        this.game.keys.up = dy < -deadzone;
        this.game.keys.down = dy > deadzone;
    }
}
