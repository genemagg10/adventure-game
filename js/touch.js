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
            radius: 50,
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
        });
    }

    enable() {
        if (this.active) return;
        this.active = true;
        document.body.classList.add("touch-mode");
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
            <div id="touch-buttons-right">
                <button class="touch-btn touch-btn-attack" data-action="attack">ATK</button>
                <button class="touch-btn touch-btn-shoot" data-action="shoot">BOW</button>
                <button class="touch-btn touch-btn-element" data-action="element">PWR</button>
                <button class="touch-btn touch-btn-interact" data-action="interact">ACT</button>
            </div>
            <div id="touch-buttons-top">
                <button class="touch-btn-small" data-action="map">MAP</button>
                <button class="touch-btn-small" data-action="inventory">INV</button>
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

        // Map overlay tap to close
        const mapOverlay = document.getElementById("map-overlay");
        mapOverlay.addEventListener("touchstart", (e) => {
            e.stopPropagation();
            if (this.game.ui.isMapOpen()) {
                this.game.ui.toggleMap();
            }
        }, { passive: false });
    }

    isOnUIOverlay(target) {
        // Check if the touch target is within a UI overlay that should handle its own events
        const overlayIds = ["shop-overlay", "inventory-overlay", "riddle-overlay",
                           "map-overlay", "title-screen", "controls-screen",
                           "game-over-screen"];
        for (const id of overlayIds) {
            const el = document.getElementById(id);
            if (el && !el.classList.contains("hidden") && el.contains(target)) {
                return true;
            }
        }
        // Also allow menu buttons through
        if (target.classList.contains("menu-btn") || target.classList.contains("shop-item") ||
            target.classList.contains("riddle-choice") || target.classList.contains("inv-item")) {
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
        this.joystickBase.style.left = (this.joystick.originX - 50) + "px";
        this.joystickBase.style.top = (this.joystick.originY - 50) + "px";
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
