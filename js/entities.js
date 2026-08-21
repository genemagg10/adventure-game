// ============================================
// Ingoizer's World - Entities (Player, Monsters, Boss)
// ============================================

class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.size = PLAYER_DEFAULTS.size;
        this.hp = PLAYER_DEFAULTS.maxHp;
        this.maxHp = PLAYER_DEFAULTS.maxHp;
        this.speed = PLAYER_DEFAULTS.speed;
        this.gold = 50;
        this.blueGems = 0;
        this.totalGemsNeeded = 5;

        // Weapons
        this.weapons = ["rusty_sword"];
        this.currentWeapon = "rusty_sword";

        // Armor
        this.armors = ["cloth_tunic"];
        this.currentArmor = "cloth_tunic";

        // Bows & Arrows
        this.bows = ["rusty_bow"];
        this.currentBow = "rusty_bow";
        this.arrows = 5;
        this.lastShootTime = 0;
        this.shooting = false;
        this.shootTimer = 0;

        // Elements
        this.elements = {};
        this.activeElement = null;
        this.elementUnlockOrder = ["fire", "water", "ice", "lightning", "earth"];
        this.nextElementIndex = 0;

        // Combat state
        this.facing = { x: 0, y: 1 }; // facing down initially
        this.attacking = false;
        this.attackTimer = 0;
        this.attackAngle = 0;
        this.lastAttackTime = 0;
        this.invincible = false;
        this.invincibleTimer = 0;
        this.knockbackVx = 0;
        this.knockbackVy = 0;

        // Items
        this.shieldActive = false;
        this.shieldHits = 0;
        this.hasSheath = false; // Jewel-encrusted sheath of Excalibur

        // Merlin quest items
        this.hasMerlinWand = false;
        this.hasMallet = false;
        this.malletUsedWeapon = false;
        this.malletUsedArmor = false;
        this.enchantments = {}; // weaponId/bowId -> element name
        this.armorEnchantment = null; // element name for current armor enchantment
        this.armorEnchantedId = null; // which armor piece is enchanted

        // Element cooldown
        this.elementCooldown = 0;

        // Animation
        this.walkFrame = 0;
        this.walkTimer = 0;
        this.flashTimer = 0;

        // Green gems & charm
        this.greenGemAttack = false;
        this.greenGemDefense = false;
        this.hasMagicCharm = false;
        this.hasDarkCrest = false;
        this.hasGauntlet = false; // Cave boss drop: +4 damage all weapons

        // Purple gems from caves
        this.purpleGemHealth = false;  // +30 max HP
        this.purpleGemAttack = false;  // +6 damage
        this.purpleGemArmor = false;   // +5 defense

        // Rainbow gem from the hidden base (+4 to everything)
        this.hasRainbowGem = false;

        // Zeus's lightning bolts - every arrow becomes a bolt (+4 bow damage)
        this.hasZeusBolts = false;

        // The seed left in the Worldtree's ashes. Carried until it is planted,
        // and recoverable again from any sapling that failed to take root.
        this.hasWorldtreeSeed = false;

        // Health potion inventory
        this.healthPotions = 0;        // regular potions (heal 40)
        this.greaterHealthPotions = 0; // greater potions (heal 80)

        // Apples - spent to tame wild animals
        this.apples = 2;

        // Stats
        this.monstersKilled = 0;
    }

    getWeapon() {
        const weapon = WEAPONS[this.currentWeapon];
        let dmg = weapon.damage;
        if (this.hasSheath) dmg += SHEATH_DAMAGE_BONUS;
        if (this.enchantments[this.currentWeapon]) dmg += ENCHANT_DAMAGE_BONUS;
        if (this.greenGemAttack) dmg += GREEN_GEM_ATTACK.bonus;
        if (this.hasMagicCharm) dmg += MAGIC_CHARM.damageBonus;
        if (this.hasGauntlet) dmg += CAVE_GAUNTLET.damageBonus;
        if (this.purpleGemAttack) dmg += PURPLE_GEMS.attack.bonus;
        if (this.hasRainbowGem) dmg += RAINBOW_GEM.bonus;
        if (dmg !== weapon.damage) return { ...weapon, damage: dmg };
        return weapon;
    }

    equipWeapon(weaponId) {
        if (this.weapons.includes(weaponId)) {
            this.currentWeapon = weaponId;
            return true;
        }
        return false;
    }

    addWeapon(weaponId) {
        if (!this.weapons.includes(weaponId)) {
            this.weapons.push(weaponId);
            return true;
        }
        return false;
    }

    getBow() {
        const bow = BOWS[this.currentBow];
        let dmg = bow.damage;
        if (this.hasSheath) dmg += SHEATH_DAMAGE_BONUS;
        if (this.enchantments[this.currentBow]) dmg += ENCHANT_DAMAGE_BONUS;
        if (this.greenGemAttack) dmg += GREEN_GEM_ATTACK.bonus;
        if (this.hasMagicCharm) dmg += MAGIC_CHARM.damageBonus;
        if (this.hasGauntlet) dmg += CAVE_GAUNTLET.damageBonus;
        if (this.hasRainbowGem) dmg += RAINBOW_GEM.bonus;
        // Zeus's bolts replace arrows entirely once he falls
        if (this.hasZeusBolts) dmg += ZEUS_BOLT.damageBonus;
        if (dmg !== bow.damage) return { ...bow, damage: dmg };
        return bow;
    }

    addBow(bowId) {
        if (!this.bows.includes(bowId)) {
            this.bows.push(bowId);
            return true;
        }
        return false;
    }

    equipBow(bowId) {
        if (this.bows.includes(bowId)) {
            this.currentBow = bowId;
            return true;
        }
        return false;
    }

    getArmor() {
        const armor = ARMOR[this.currentArmor];
        let def = armor.defense;
        if (this.greenGemDefense) def += GREEN_GEM_DEFENSE.bonus;
        if (this.purpleGemArmor) def += PURPLE_GEMS.armor.bonus;
        if (this.hasRainbowGem) def += RAINBOW_GEM.bonus;
        const hasEnchant = this.armorEnchantedId === this.currentArmor && this.armorEnchantment;
        if (def !== armor.defense || hasEnchant) {
            return { ...armor, defense: def, enchantment: hasEnchant ? this.armorEnchantment : undefined };
        }
        return armor;
    }

    addArmor(armorId) {
        if (!this.armors.includes(armorId)) {
            this.armors.push(armorId);
            return true;
        }
        return false;
    }

    equipArmor(armorId) {
        if (this.armors.includes(armorId)) {
            this.currentArmor = armorId;
            return true;
        }
        return false;
    }

    shootArrow() {
        if (this.arrows <= 0) return null;
        const now = Date.now();
        const bow = this.getBow();
        const cooldown = PLAYER_DEFAULTS.attackCooldown / bow.speed;
        if (now - this.lastShootTime < cooldown) return null;

        this.arrows--;
        this.lastShootTime = now;
        this.shooting = true;
        this.shootTimer = 150;

        const isFireArrow = this.activeElement === "fire" && this.elements.fire;
        const fireDamage = isFireArrow ? Math.floor(ELEMENTS.fire.damage * 0.5) : 0;
        const bowEnchant = this.enchantments[this.currentBow] || null;

        return {
            x: this.x + this.facing.x * 10,
            y: this.y + this.facing.y * 10,
            vx: this.facing.x * bow.projectileSpeed,
            vy: this.facing.y * bow.projectileSpeed,
            damage: bow.damage + fireDamage,
            range: bow.range,
            distTraveled: 0,
            isFireArrow: isFireArrow,
            isZeusBolt: !!this.hasZeusBolts,
            bowEnchant: bowEnchant,
        };
    }

    unlockElement() {
        if (this.nextElementIndex < this.elementUnlockOrder.length) {
            const elem = this.elementUnlockOrder[this.nextElementIndex];
            this.elements[elem] = true;
            this.nextElementIndex++;
            return elem;
        }
        return null;
    }

    collectGem() {
        this.blueGems++;
        // Each gem unlocks an element
        const elem = this.unlockElement();
        return elem;
    }

    update(dt, keys, world) {
        // Movement
        let dx = 0, dy = 0;
        if (keys.up) dy -= 1;
        if (keys.down) dy += 1;
        if (keys.left) dx -= 1;
        if (keys.right) dx += 1;

        if (dx !== 0 || dy !== 0) {
            const norm = normalize(dx, dy);
            dx = norm.x;
            dy = norm.y;
            this.facing = { x: dx, y: dy };

            // Walk animation
            this.walkTimer += dt;
            if (this.walkTimer > 110) {
                this.walkFrame = (this.walkFrame + 1) % 4;
                this.walkTimer = 0;
            }
        } else {
            // Settle onto the standing pose instead of freezing mid-stride
            this.walkFrame = 0;
            this.walkTimer = 0;
        }

        // Apply movement with knockback
        let moveX = dx * this.speed + this.knockbackVx;
        let moveY = dy * this.speed + this.knockbackVy;

        // Decay knockback
        this.knockbackVx *= 0.85;
        this.knockbackVy *= 0.85;
        if (Math.abs(this.knockbackVx) < 0.1) this.knockbackVx = 0;
        if (Math.abs(this.knockbackVy) < 0.1) this.knockbackVy = 0;

        // Collision detection
        const newX = this.x + moveX;
        const newY = this.y + moveY;

        // Check tile collisions
        if (!this.checkCollision(newX, this.y, world)) {
            this.x = newX;
        }
        if (!this.checkCollision(this.x, newY, world)) {
            this.y = newY;
        }

        // Clamp to world bounds (works for both surface and cave)
        const worldWidth = world.tiles[0] ? world.tiles[0].length : WORLD_W;
        const worldHeight = world.tiles.length || WORLD_H;
        this.x = clamp(this.x, this.size, worldWidth * TILE_SIZE - this.size);
        this.y = clamp(this.y, this.size, worldHeight * TILE_SIZE - this.size);

        // Invincibility timer
        if (this.invincible) {
            this.invincibleTimer -= dt;
            if (this.invincibleTimer <= 0) {
                this.invincible = false;
            }
        }

        // Attack timer
        if (this.attacking) {
            this.attackTimer -= dt;
            if (this.attackTimer <= 0) {
                this.attacking = false;
            }
        }

        // Shoot timer
        if (this.shooting) {
            this.shootTimer -= dt;
            if (this.shootTimer <= 0) {
                this.shooting = false;
            }
        }

        // Element cooldown
        if (this.elementCooldown > 0) {
            this.elementCooldown -= dt;
        }

        // Flash timer (damage flash)
        if (this.flashTimer > 0) {
            this.flashTimer -= dt;
        }
    }

    checkCollision(nx, ny, world) {
        const margin = this.size * 0.7;
        const corners = [
            worldToTile(nx - margin, ny - margin),
            worldToTile(nx + margin, ny - margin),
            worldToTile(nx - margin, ny + margin),
            worldToTile(nx + margin, ny + margin),
        ];
        for (const c of corners) {
            if (world.isSolid(c.x, c.y)) return true;
        }
        return false;
    }

    attack() {
        const now = Date.now();
        const weapon = this.getWeapon();
        const cooldown = PLAYER_DEFAULTS.attackCooldown / weapon.speed;
        if (now - this.lastAttackTime < cooldown) return false;

        this.attacking = true;
        this.attackTimer = 200;
        this.attackAngle = dirToAngle(this.facing.x, this.facing.y);
        this.lastAttackTime = now;
        this.attackHitTargets = new Set();
        return true;
    }

    useElement() {
        if (!this.activeElement) return null;
        const elem = ELEMENTS[this.activeElement];
        if (this.elementCooldown > 0) return null;

        this.elementCooldown = elem.cooldown || 1500;
        return this.activeElement;
    }

    useHealthPotion() {
        // Use greater potions first if available
        if (this.greaterHealthPotions > 0) {
            if (this.hp >= this.maxHp) return null;
            this.greaterHealthPotions--;
            const healed = Math.min(80, this.maxHp - this.hp);
            this.hp = Math.min(this.maxHp, this.hp + 80);
            return { type: "greater", healed };
        }
        if (this.healthPotions > 0) {
            if (this.hp >= this.maxHp) return null;
            this.healthPotions--;
            const healed = Math.min(40, this.maxHp - this.hp);
            this.hp = Math.min(this.maxHp, this.hp + 40);
            return { type: "regular", healed };
        }
        return null;
    }

    addApples(count) {
        if (this.apples >= APPLE_ITEM.maxStack) return false;
        this.apples = Math.min(APPLE_ITEM.maxStack, this.apples + count);
        return true;
    }

    addHealthPotion(type) {
        const total = this.healthPotions + this.greaterHealthPotions;
        if (total >= HEALTH_POTION.maxStack) return false;
        if (type === "greater") {
            this.greaterHealthPotions++;
        } else {
            this.healthPotions++;
        }
        return true;
    }

    takeDamage(amount, fromX, fromY) {
        if (this.invincible) return false;

        // Shield check
        if (this.shieldActive) {
            this.shieldHits--;
            if (this.shieldHits <= 0) this.shieldActive = false;
            return false;
        }

        // Armor damage reduction
        const armor = this.getArmor();
        const reduced = Math.max(1, amount - armor.defense);
        this.hp -= reduced;
        this.invincible = true;
        this.invincibleTimer = PLAYER_DEFAULTS.iframes;
        this.flashTimer = 200;

        // Track armor enchantment trigger for visual effects
        this.lastHitArmorEnchant = armor.enchantment || null;
        this.lastHitFromX = fromX;
        this.lastHitFromY = fromY;

        // Knockback
        if (fromX !== undefined && fromY !== undefined) {
            const norm = normalize(this.x - fromX, this.y - fromY);
            this.knockbackVx = norm.x * 6;
            this.knockbackVy = norm.y * 6;
        }

        return true;
    }

    heal(amount) {
        this.hp = Math.min(this.maxHp, this.hp + amount);
    }

    render(ctx, camera, time) {
        const sx = Math.round(this.x - camera.x);
        const sy = Math.round(this.y - camera.y);

        // Skip rendering if invincible flash
        if (this.invincible && Math.floor(time / 80) % 2 === 0) return;

        ctx.save();

        // Shield aura
        if (this.shieldActive) {
            ctx.strokeStyle = "rgba(100, 200, 255, 0.5)";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(sx, sy, this.size + 6, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Shadow
        ctx.fillStyle = "rgba(0,0,0,0.3)";
        ctx.beginPath();
        ctx.ellipse(sx, sy + this.size + 2, this.size * 0.8, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Ingoizer pixel sprite. The body lifts a pixel on the stride frames
        // so the walk reads as a step rather than a slide.
        const dir = IngoizerSprite.dirFor(this.facing);
        const bobY = (this.walkFrame === 1 || this.walkFrame === 3) ? -1 : 0;
        const facingAway = dir === "up";

        // Gear that sits on his back goes behind him unless we're looking at
        // his back, and the sword goes behind him when he faces away.
        if (facingAway) {
            this.renderWeapon(ctx, sx, sy + bobY, time);
        } else {
            this.renderQuiver(ctx, sx, sy + bobY, dir);
        }

        IngoizerSprite.draw(ctx, dir, this.walkFrame, sx, sy + bobY);

        if (facingAway) {
            this.renderQuiver(ctx, sx, sy + bobY, dir);
        } else {
            this.renderWeapon(ctx, sx, sy + bobY, time);
        }

        // Render bow when shooting
        if (this.shooting) {
            this.renderBowShot(ctx, sx, sy + bobY);
        }

        // Active element glow
        if (this.activeElement) {
            const elem = ELEMENTS[this.activeElement];
            ctx.strokeStyle = elem.color;
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.4 + Math.sin(time * 0.005) * 0.2;
            ctx.beginPath();
            ctx.arc(sx, sy, this.size + 4, 0, Math.PI * 2);
            ctx.stroke();
            ctx.globalAlpha = 1;
        }

        // Enchanted armor subtle glow
        if (this.armorEnchantedId === this.currentArmor && this.armorEnchantment) {
            const armorElem = ELEMENTS[this.armorEnchantment];
            ctx.strokeStyle = armorElem.color;
            ctx.lineWidth = 1;
            ctx.globalAlpha = 0.2 + Math.sin(time * 0.004) * 0.1;
            ctx.beginPath();
            ctx.arc(sx, sy + 2, this.size + 8, 0, Math.PI * 2);
            ctx.stroke();
            ctx.globalAlpha = 1;
        }

        ctx.restore();
    }

    renderWeapon(ctx, sx, sy, time) {
        const weapon = this.getWeapon();
        const angle = this.attacking
            ? this.attackAngle + Math.sin((200 - this.attackTimer) / 200 * Math.PI) * 1.5 - 0.75
            : dirToAngle(this.facing.x, this.facing.y) + 0.6;

        // Grip sits at the sprite's gauntlets. Keeping it inside the sprite's
        // silhouette stops the blade drifting off his hands mid-swing.
        const handY = sy + 1;
        // Carried at the side at rest; the full reach only shows on the swing,
        // where it matches the arc the hitbox actually covers.
        const weaponLen = weapon.range * (this.attacking ? 0.8 : 0.5);
        const wx = sx + Math.cos(angle) * 9;
        const wy = handY + Math.sin(angle) * 9;
        const ex = wx + Math.cos(angle) * weaponLen;
        const ey = wy + Math.sin(angle) * weaponLen;

        // Weapon handle
        ctx.strokeStyle = "#8a6a3a";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(wx, wy);
        ctx.lineTo(ex, ey);
        ctx.stroke();

        // Weapon blade/head
        ctx.strokeStyle = this.currentWeapon === "excalibur" ? "#ffd700" :
                          this.currentWeapon === "dark_blade" ? "#6644aa" : "#ccccdd";
        ctx.lineWidth = this.attacking ? 4 : 3;
        ctx.beginPath();
        const midX = wx + Math.cos(angle) * weaponLen * 0.4;
        const midY = wy + Math.sin(angle) * weaponLen * 0.4;
        ctx.moveTo(midX, midY);
        ctx.lineTo(ex, ey);
        ctx.stroke();

        // Enchantment glow on weapon blade
        if (this.enchantments[this.currentWeapon]) {
            const enchElem = ELEMENTS[this.enchantments[this.currentWeapon]];
            ctx.strokeStyle = enchElem.color;
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.5 + Math.sin(time * 0.006) * 0.2;
            ctx.beginPath();
            ctx.moveTo(midX, midY);
            ctx.lineTo(ex, ey);
            ctx.stroke();
            ctx.globalAlpha = 1;
        }

        // Attack swoosh
        if (this.attacking) {
            ctx.strokeStyle = this.activeElement ? ELEMENTS[this.activeElement].color : "rgba(255,255,255,0.4)";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(sx, sy, weapon.range, angle - 0.8, angle + 0.8);
            ctx.stroke();
        }
    }

    renderQuiver(ctx, sx, sy, dir) {
        // Slung across his back: centred when we're looking at his back, and
        // on whichever side is turned away from us otherwise.
        const qx = dir === "up" ? sx - 2
                 : dir === "right" ? sx - 12
                 : sx + 7;
        const top = sy - 11;

        // Leather quiver body
        ctx.fillStyle = "#6b431f";
        ctx.fillRect(qx, top, 5, 15);
        ctx.fillStyle = "#3a2410";      // shaded edge
        ctx.fillRect(qx, top, 1, 15);
        ctx.fillStyle = "#2a1a0c";      // rounded base
        ctx.fillRect(qx, top + 14, 5, 1);
        ctx.fillStyle = "#8a5a2a";      // mouth rim and binding straps
        ctx.fillRect(qx, top, 5, 2);
        ctx.fillRect(qx, top + 8, 5, 1);

        // Arrows, up to three, rising out of the mouth past his shoulder
        const showArrows = Math.min(3, this.arrows);
        for (let i = 0; i < showArrows; i++) {
            const ax = qx + i * 2;
            ctx.fillStyle = "#d2d2e0";  // shaft
            ctx.fillRect(ax, top - 7, 1, 8);
            ctx.fillStyle = "#cc4444";  // fletching
            ctx.fillRect(ax, top - 7, 1, 3);
        }
    }

    renderBowShot(ctx, sx, sy) {
        const angle = dirToAngle(this.facing.x, this.facing.y);
        const progress = 1 - this.shootTimer / 150;

        // Bow (curved arc)
        ctx.save();
        ctx.translate(sx + Math.cos(angle) * 11, sy + 2 + Math.sin(angle) * 11);
        ctx.rotate(angle);

        // Bow limb
        ctx.strokeStyle = "#8B4513";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 10, -Math.PI * 0.5, Math.PI * 0.5);
        ctx.stroke();

        // Bowstring
        const stringPull = (1 - progress) * 5;
        ctx.strokeStyle = "#ccc";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, -10);
        ctx.lineTo(-stringPull, 0);
        ctx.lineTo(0, 10);
        ctx.stroke();

        ctx.restore();
    }
}

class Monster {
    constructor(type, x, y) {
        this.type = type;
        const def = MONSTER_TYPES[type];
        this.name = def.name;
        this.x = x;
        this.y = y;
        this.hp = def.hp;
        this.maxHp = def.hp;
        this.damage = def.damage;
        this.speed = def.speed;
        this.xp = def.xp;
        this.goldDrop = def.goldDrop;
        this.color = def.color;
        this.size = def.size;
        this.weaponDrop = def.weaponDrop;
        this.armorDrop = def.armorDrop || null;
        this.gemDrop = def.gemDrop;
        this.gemChance = def.gemChance || 0;

        this.alive = true;
        this.aggroRange = 150;
        this.attackRange = 30;
        this.attackCooldown = 1500;
        this.lastAttackTime = 0;
        this.facing = { x: 0, y: 1 };

        // AI state
        this.state = "idle"; // idle, patrol, chase, attack
        this.patrolTarget = null;
        this.patrolTimer = 0;
        this.stateTimer = 0;
        this.homeX = x;
        this.homeY = y;
        this.leashRange = 300;

        // Visual
        this.flashTimer = 0;
        this.walkFrame = 0;
        this.walkTimer = 0;
        this.deathTimer = 0;

        // Knockback
        this.knockbackVx = 0;
        this.knockbackVy = 0;

        // Slow effect
        this.slowTimer = 0;
        this.slowFactor = 1;
    }

    update(dt, player, world) {
        if (!this.alive) {
            this.deathTimer -= dt;
            return;
        }

        const distToPlayer = dist(this.x, this.y, player.x, player.y);
        const distToHome = dist(this.x, this.y, this.homeX, this.homeY);

        // Slow effect
        if (this.slowTimer > 0) {
            this.slowTimer -= dt;
            this.slowFactor = 0.4;
        } else {
            this.slowFactor = 1;
        }

        // AI state machine
        if (distToPlayer < this.aggroRange) {
            this.state = "chase";
        } else if (distToHome > this.leashRange) {
            this.state = "return";
        } else if (this.state === "chase") {
            this.state = "idle";
        }

        let moveX = 0, moveY = 0;
        const spd = this.speed * this.slowFactor;

        switch (this.state) {
            case "idle":
                this.stateTimer -= dt;
                if (this.stateTimer <= 0) {
                    this.state = "patrol";
                    this.patrolTarget = {
                        x: this.homeX + randFloat(-100, 100),
                        y: this.homeY + randFloat(-100, 100),
                    };
                    this.stateTimer = randFloat(2000, 5000);
                }
                break;

            case "patrol":
                if (this.patrolTarget) {
                    const norm = normalize(this.patrolTarget.x - this.x, this.patrolTarget.y - this.y);
                    moveX = norm.x * spd * 0.5;
                    moveY = norm.y * spd * 0.5;
                    if (dist(this.x, this.y, this.patrolTarget.x, this.patrolTarget.y) < 10) {
                        this.state = "idle";
                        this.stateTimer = randFloat(1000, 3000);
                    }
                }
                break;

            case "chase": {
                const norm = normalize(player.x - this.x, player.y - this.y);
                moveX = norm.x * spd;
                moveY = norm.y * spd;
                this.facing = norm;

                // Attack
                if (distToPlayer < this.attackRange) {
                    const now = Date.now();
                    if (now - this.lastAttackTime > this.attackCooldown) {
                        this.lastAttackTime = now;
                        if (player.takeDamage(this.damage, this.x, this.y)) {
                            return { type: "playerHit", damage: this.damage };
                        }
                    }
                }
                break;
            }

            case "return": {
                const norm = normalize(this.homeX - this.x, this.homeY - this.y);
                moveX = norm.x * spd;
                moveY = norm.y * spd;
                if (distToHome < 20) {
                    this.state = "idle";
                    this.stateTimer = 2000;
                }
                break;
            }
        }

        // Apply knockback
        moveX += this.knockbackVx;
        moveY += this.knockbackVy;
        this.knockbackVx *= 0.85;
        this.knockbackVy *= 0.85;
        if (Math.abs(this.knockbackVx) < 0.1) this.knockbackVx = 0;
        if (Math.abs(this.knockbackVy) < 0.1) this.knockbackVy = 0;

        // Move with collision
        const newX = this.x + moveX;
        const newY = this.y + moveY;
        const tile1 = worldToTile(newX, this.y);
        const tile2 = worldToTile(this.x, newY);
        if (!world.isSolid(tile1.x, tile1.y)) this.x = newX;
        if (!world.isSolid(tile2.x, tile2.y)) this.y = newY;

        // Walk animation
        if (Math.abs(moveX) > 0.1 || Math.abs(moveY) > 0.1) {
            this.walkTimer += dt;
            if (this.walkTimer > 200) {
                this.walkFrame = (this.walkFrame + 1) % 4;
                this.walkTimer = 0;
            }
            this.facing = normalize(moveX, moveY);
        }

        // Flash timer
        if (this.flashTimer > 0) this.flashTimer -= dt;

        return null;
    }

    takeDamage(amount, fromX, fromY) {
        this.hp -= amount;
        this.flashTimer = 150;

        // Knockback
        if (fromX !== undefined) {
            const norm = normalize(this.x - fromX, this.y - fromY);
            this.knockbackVx = norm.x * 5;
            this.knockbackVy = norm.y * 5;
        }

        if (this.hp <= 0) {
            this.alive = false;
            this.deathTimer = 500;
            return true; // died
        }
        return false;
    }

    getDrops() {
        const drops = {
            gold: randInt(this.goldDrop[0], this.goldDrop[1]),
            weapon: null,
            armor: null,
            gem: false,
        };

        const weaponChance = this.weaponDropChance || 0.3;
        if (this.weaponDrop && Math.random() < weaponChance) {
            drops.weapon = this.weaponDrop;
        }

        const armorChance = this.armorDropChance || 0.3;
        if (this.armorDrop && Math.random() < armorChance) {
            drops.armor = this.armorDrop;
        }

        if (this.gemDrop && Math.random() < this.gemChance) {
            drops.gem = true;
        }

        return drops;
    }

    render(ctx, camera, time) {
        const sx = this.x - camera.x;
        const sy = this.y - camera.y;

        if (sx < -50 || sx > CANVAS_W + 50 || sy < -50 || sy > CANVAS_H + 50) return;

        if (!this.alive) {
            if (this.deathTimer > 0) {
                ctx.globalAlpha = this.deathTimer / 500;
                this.renderBody(ctx, sx, sy, time);
                ctx.globalAlpha = 1;
            }
            return;
        }

        // Damage flash
        if (this.flashTimer > 0 && Math.floor(time / 60) % 2 === 0) {
            ctx.save();
            ctx.globalCompositeOperation = "lighter";
            this.renderBody(ctx, sx, sy, time);
            ctx.restore();
            return;
        }

        this.renderBody(ctx, sx, sy, time);

        // Health bar - use the authored silhouette height, not the collision radius.
        if (this.hp < this.maxHp) {
            const barW = this.size * 2;
            const barH = 3;
            const barX = sx - barW / 2;
            const spriteTop = typeof MonsterSprite !== "undefined" ? MonsterSprite.getTop(this) : -this.size;
            const barY = sy + spriteTop - 8;
            ctx.fillStyle = "#333";
            ctx.fillRect(barX, barY, barW, barH);
            ctx.fillStyle = "#ff4444";
            ctx.fillRect(barX, barY, barW * (this.hp / this.maxHp), barH);
        }

        // Slow indicator
        if (this.slowTimer > 0) {
            ctx.fillStyle = "rgba(136, 221, 255, 0.4)";
            ctx.beginPath();
            ctx.arc(sx, sy, this.size + 3, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    renderBody(ctx, sx, sy, time) {
        if (typeof MonsterSprite !== "undefined" && MonsterSprite.draw(ctx, this, sx, sy, time)) return;

        const bob = Math.sin(this.walkFrame * Math.PI / 2) * 1.5;

        // Shadow
        ctx.fillStyle = "rgba(0,0,0,0.3)";
        ctx.beginPath();
        ctx.ellipse(sx, sy + this.size + 2, this.size * 0.7, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Body
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(sx, sy + bob, this.size, 0, Math.PI * 2);
        ctx.fill();

        // Outline
        ctx.strokeStyle = "rgba(0,0,0,0.4)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(sx, sy + bob, this.size, 0, Math.PI * 2);
        ctx.stroke();

        // Eyes
        const eyeOffX = this.facing.x * 3;
        const eyeOffY = this.facing.y * 2;
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(sx - 3 + eyeOffX, sy - 3 + bob + eyeOffY, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(sx + 3 + eyeOffX, sy - 3 + bob + eyeOffY, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#000";
        ctx.beginPath();
        ctx.arc(sx - 3 + eyeOffX * 1.2, sy - 3 + bob + eyeOffY * 1.2, 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(sx + 3 + eyeOffX * 1.2, sy - 3 + bob + eyeOffY * 1.2, 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Type-specific details
        this.renderTypeDetails(ctx, sx, sy + bob);
    }

    renderTypeDetails(ctx, sx, sy) {
        switch (this.type) {
            case "skeleton":
                // Helmet
                ctx.fillStyle = "#aaa";
                ctx.beginPath();
                ctx.arc(sx, sy - this.size + 2, 6, Math.PI, 0);
                ctx.fill();
                break;
            case "troll":
                // Horns
                ctx.fillStyle = "#886644";
                ctx.beginPath();
                ctx.moveTo(sx - 8, sy - this.size + 2);
                ctx.lineTo(sx - 12, sy - this.size - 8);
                ctx.lineTo(sx - 4, sy - this.size + 2);
                ctx.fill();
                ctx.beginPath();
                ctx.moveTo(sx + 8, sy - this.size + 2);
                ctx.lineTo(sx + 12, sy - this.size - 8);
                ctx.lineTo(sx + 4, sy - this.size + 2);
                ctx.fill();
                break;
            case "wolf":
                // Ears
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.moveTo(sx - 8, sy - this.size);
                ctx.lineTo(sx - 5, sy - this.size - 8);
                ctx.lineTo(sx - 2, sy - this.size);
                ctx.fill();
                ctx.beginPath();
                ctx.moveTo(sx + 2, sy - this.size);
                ctx.lineTo(sx + 5, sy - this.size - 8);
                ctx.lineTo(sx + 8, sy - this.size);
                ctx.fill();
                break;
            case "dragon_whelp":
                // Wings
                ctx.fillStyle = "#dd5533";
                ctx.beginPath();
                ctx.moveTo(sx - this.size, sy);
                ctx.lineTo(sx - this.size - 10, sy - 10);
                ctx.lineTo(sx - this.size + 2, sy - 5);
                ctx.fill();
                ctx.beginPath();
                ctx.moveTo(sx + this.size, sy);
                ctx.lineTo(sx + this.size + 10, sy - 10);
                ctx.lineTo(sx + this.size - 2, sy - 5);
                ctx.fill();
                break;
            case "wraith":
                // Ghostly trail
                ctx.fillStyle = "rgba(68, 68, 170, 0.3)";
                ctx.beginPath();
                ctx.arc(sx, sy + 5, this.size + 5, 0, Math.PI * 2);
                ctx.fill();
                break;

            // --- Cloudlands keepers ---
            case "storm_harpy": {
                // Swept-back stormy wings
                ctx.fillStyle = "#6f88bd";
                for (const dir of [-1, 1]) {
                    ctx.beginPath();
                    ctx.moveTo(sx + dir * this.size * 0.6, sy - 2);
                    ctx.lineTo(sx + dir * (this.size + 16), sy - 14);
                    ctx.lineTo(sx + dir * (this.size + 10), sy + 4);
                    ctx.fill();
                }
                // Beak
                ctx.fillStyle = "#e8c24a";
                ctx.beginPath();
                ctx.moveTo(sx, sy - 1);
                ctx.lineTo(sx + this.facing.x * 10, sy + this.facing.y * 10 + 2);
                ctx.lineTo(sx, sy + 4);
                ctx.fill();
                break;
            }
            case "thunder_wisp": {
                // Crackling arcs of static
                ctx.strokeStyle = "rgba(255, 240, 140, 0.85)";
                ctx.lineWidth = 1.5;
                for (let i = 0; i < 4; i++) {
                    const a = Math.random() * Math.PI * 2;
                    ctx.beginPath();
                    ctx.moveTo(sx, sy);
                    ctx.lineTo(sx + Math.cos(a) * (this.size + 8), sy + Math.sin(a) * (this.size + 8));
                    ctx.stroke();
                }
                break;
            }
            case "golden_griffin": {
                // Great wings and a tufted lion tail
                ctx.fillStyle = "#f2cd6a";
                for (const dir of [-1, 1]) {
                    ctx.beginPath();
                    ctx.moveTo(sx + dir * this.size * 0.5, sy - 4);
                    ctx.lineTo(sx + dir * (this.size + 20), sy - 18);
                    ctx.lineTo(sx + dir * (this.size + 6), sy + 6);
                    ctx.fill();
                }
                ctx.strokeStyle = "#b8892c";
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(sx - this.size * 0.6, sy + this.size * 0.6);
                ctx.lineTo(sx - this.size - 10, sy + this.size);
                ctx.stroke();
                break;
            }
            case "cloud_giant": {
                // Billowing cloud shoulders
                ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
                for (const [ox, oy, r] of [[-this.size * 0.8, -this.size * 0.5, 10], [this.size * 0.8, -this.size * 0.5, 10], [0, -this.size, 12]]) {
                    ctx.beginPath();
                    ctx.arc(sx + ox, sy + oy, r, 0, Math.PI * 2);
                    ctx.fill();
                }
                break;
            }
            case "bronze_talos": {
                // Riveted bronze plating
                ctx.strokeStyle = "#7d5a22";
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(sx - this.size, sy - 4);
                ctx.lineTo(sx + this.size, sy - 4);
                ctx.moveTo(sx - this.size, sy + 6);
                ctx.lineTo(sx + this.size, sy + 6);
                ctx.stroke();
                ctx.fillStyle = "#e0b45c";
                for (let i = -1; i <= 1; i++) {
                    ctx.beginPath();
                    ctx.arc(sx + i * 8, sy + 1, 1.8, 0, Math.PI * 2);
                    ctx.fill();
                }
                break;
            }
        }
    }
}

class Boss {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.spawnX = x;
        this.spawnY = y;
        this.leashRadius = 400;
        this.hp = BOSS.hp;
        this.maxHp = BOSS.hp;
        this.damage = BOSS.damage;
        this.size = BOSS.size;
        this.baseSpeed = BOSS.speed;
        this.speed = BOSS.speed;
        this.color = BOSS.color;
        this.phases = BOSS.phases;
        this.alive = true;
        this.spawned = false;

        this.phase = 0;
        this.state = "idle";
        this.lastAttackTime = 0;
        this.facing = { x: 0, y: 1 };

        // Charge attack
        this.charging = false;
        this.chargeDir = { x: 0, y: 0 };
        this.chargeTimer = 0;
        this.chargeWindup = 0;

        // Spin attack
        this.spinning = false;
        this.spinAngle = 0;
        this.spinTimer = 0;

        // Visual
        this.flashTimer = 0;
        this.walkFrame = 0;
        this.walkTimer = 0;
        this.deathTimer = 0;
        this.spawnAnimation = 0;

        // Knockback
        this.knockbackVx = 0;
        this.knockbackVy = 0;

        // Projectiles
        this.projectiles = [];
    }

    getCurrentPhase() {
        const hpPercent = this.hp / this.maxHp;
        for (let i = this.phases.length - 1; i >= 0; i--) {
            if (hpPercent <= this.phases[i].hpThreshold) {
                return this.phases[i];
            }
        }
        return this.phases[0];
    }

    spawn() {
        this.spawned = true;
        this.spawnAnimation = 2000;
    }

    tryMove(dx, dy, world) {
        const newX = this.x + dx;
        const newY = this.y + dy;
        const tileX = worldToTile(newX, this.y);
        const tileY = worldToTile(this.x, newY);
        if (!world.isSolid(tileX.x, tileX.y)) this.x = newX;
        if (!world.isSolid(tileY.x, tileY.y)) this.y = newY;
    }

    update(dt, player, world) {
        if (!this.alive) {
            if (this.deathTimer > 0) this.deathTimer -= dt;
            return null;
        }
        if (!this.spawned) return null;

        // Spawn animation
        if (this.spawnAnimation > 0) {
            this.spawnAnimation -= dt;
            return null;
        }

        const phase = this.getCurrentPhase();
        const distToPlayer = dist(this.x, this.y, player.x, player.y);
        const distToSpawn = dist(this.x, this.y, this.spawnX, this.spawnY);
        const now = Date.now();
        const spd = this.speed * phase.speed;

        // Update projectiles
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];
            p.x += p.vx * dt * 0.1;
            p.y += p.vy * dt * 0.1;
            p.life -= dt;
            if (p.life <= 0) {
                this.projectiles.splice(i, 1);
                continue;
            }
            // Hit player
            if (circleOverlap(p.x, p.y, 8, player.x, player.y, player.size)) {
                if (player.takeDamage(15, p.x, p.y)) {
                    this.projectiles.splice(i, 1);
                }
            }
        }

        // Charge attack
        if (this.charging) {
            this.chargeTimer -= dt;
            this.tryMove(this.chargeDir.x * spd * 4, this.chargeDir.y * spd * 4, world);

            if (distToPlayer < this.size + player.size) {
                player.takeDamage(this.damage * 1.5, this.x, this.y);
            }

            if (this.chargeTimer <= 0) {
                this.charging = false;
            }
            return null;
        }

        // Charge windup
        if (this.chargeWindup > 0) {
            this.chargeWindup -= dt;
            if (this.chargeWindup <= 0) {
                this.charging = true;
                this.chargeTimer = 600;
                this.chargeDir = normalize(player.x - this.x, player.y - this.y);
            }
            return null;
        }

        // Spin attack
        if (this.spinning) {
            this.spinTimer -= dt;
            this.spinAngle += dt * 0.02;
            // Damage nearby
            if (distToPlayer < this.size + 40) {
                player.takeDamage(this.damage * 0.5, this.x, this.y);
            }
            if (this.spinTimer <= 0) {
                this.spinning = false;
            }
            return null;
        }

        // Leash: if too far from spawn, walk back instead of chasing
        let chaseTarget = player;
        if (distToSpawn > this.leashRadius) {
            chaseTarget = { x: this.spawnX, y: this.spawnY };
        }

        // Chase player (or return to spawn)
        const norm = normalize(chaseTarget.x - this.x, chaseTarget.y - this.y);
        this.tryMove(norm.x * spd, norm.y * spd, world);
        this.facing = norm;

        // Walk animation
        this.walkTimer += dt;
        if (this.walkTimer > 180) {
            this.walkFrame = (this.walkFrame + 1) % 4;
            this.walkTimer = 0;
        }

        // Knockback with wall collision
        if (this.knockbackVx !== 0 || this.knockbackVy !== 0) {
            this.tryMove(this.knockbackVx, this.knockbackVy, world);
            this.knockbackVx *= 0.9;
            this.knockbackVy *= 0.9;
            if (Math.abs(this.knockbackVx) < 0.1) this.knockbackVx = 0;
            if (Math.abs(this.knockbackVy) < 0.1) this.knockbackVy = 0;
        }

        // Attack patterns based on phase
        if (now - this.lastAttackTime > phase.attackRate) {
            this.lastAttackTime = now;

            switch (phase.pattern) {
                case "chase":
                    if (distToPlayer < this.size + player.size + 10) {
                        player.takeDamage(this.damage, this.x, this.y);
                    }
                    break;
                case "charge":
                    if (Math.random() < 0.4) {
                        this.chargeWindup = 800;
                    } else if (distToPlayer < 50) {
                        player.takeDamage(this.damage, this.x, this.y);
                    }
                    break;
                case "spin":
                    if (Math.random() < 0.3) {
                        this.spinning = true;
                        this.spinTimer = 1500;
                        this.spinAngle = 0;
                    } else if (Math.random() < 0.3) {
                        this.chargeWindup = 600;
                    } else {
                        // Dark projectile
                        this.fireProjectile(player);
                    }
                    break;
                case "frenzy":
                    if (Math.random() < 0.25) {
                        this.spinning = true;
                        this.spinTimer = 2000;
                    } else if (Math.random() < 0.3) {
                        this.chargeWindup = 400;
                    } else {
                        this.fireProjectile(player);
                        this.fireProjectile(player, 0.3);
                        this.fireProjectile(player, -0.3);
                    }
                    break;
            }
        }

        if (this.flashTimer > 0) this.flashTimer -= dt;

        return null;
    }

    fireProjectile(player, angleOffset = 0) {
        const angle = dirToAngle(player.x - this.x, player.y - this.y) + angleOffset;
        this.projectiles.push({
            x: this.x,
            y: this.y,
            vx: Math.cos(angle) * 3,
            vy: Math.sin(angle) * 3,
            life: 3000,
        });
    }

    takeDamage(amount, fromX, fromY) {
        this.hp -= amount;
        this.flashTimer = 150;

        if (fromX !== undefined) {
            const norm = normalize(this.x - fromX, this.y - fromY);
            this.knockbackVx = norm.x * 3;
            this.knockbackVy = norm.y * 3;
        }

        if (this.hp <= 0) {
            this.alive = false;
            this.deathTimer = 3000;
            return true;
        }
        return false;
    }

    render(ctx, camera, time) {
        const sx = this.x - camera.x;
        const sy = this.y - camera.y;

        if (!this.spawned) return;

        // Spawn animation
        if (this.spawnAnimation > 0) {
            const progress = 1 - this.spawnAnimation / 2000;
            ctx.save();
            ctx.globalAlpha = progress;

            // Dark energy vortex
            ctx.strokeStyle = "#880000";
            ctx.lineWidth = 3;
            for (let i = 0; i < 5; i++) {
                const a = time * 0.005 + i * Math.PI * 0.4;
                const r = (1 - progress) * 100 + 20;
                ctx.beginPath();
                ctx.arc(sx + Math.cos(a) * r, sy + Math.sin(a) * r, 5, 0, Math.PI * 2);
                ctx.stroke();
            }

            this.renderBossBody(ctx, sx, sy, time);
            ctx.restore();
            return;
        }

        // Death animation
        if (!this.alive) {
            if (this.deathTimer > 0) {
                ctx.save();
                ctx.globalAlpha = this.deathTimer / 3000;
                // Explosion particles
                for (let i = 0; i < 8; i++) {
                    const a = (i / 8) * Math.PI * 2 + time * 0.003;
                    const r = (1 - this.deathTimer / 3000) * 80;
                    ctx.fillStyle = i % 2 === 0 ? "#ff4400" : "#ffaa00";
                    ctx.beginPath();
                    ctx.arc(sx + Math.cos(a) * r, sy + Math.sin(a) * r, 8, 0, Math.PI * 2);
                    ctx.fill();
                }
                this.renderBossBody(ctx, sx, sy, time);
                ctx.restore();
            }
            return;
        }

        // Damage flash
        if (this.flashTimer > 0 && Math.floor(time / 60) % 2 === 0) {
            ctx.save();
            ctx.globalCompositeOperation = "lighter";
            this.renderBossBody(ctx, sx, sy, time);
            ctx.restore();
            return;
        }

        // Charge windup indicator
        if (this.chargeWindup > 0) {
            ctx.strokeStyle = "#ff0000";
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            const norm = normalize(this.facing.x, this.facing.y);
            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.lineTo(sx + norm.x * 200, sy + norm.y * 200);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        this.renderBossBody(ctx, sx, sy, time);

        // Spin attack visual
        if (this.spinning) {
            ctx.strokeStyle = "#880000";
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(sx, sy, this.size + 35, this.spinAngle, this.spinAngle + Math.PI * 1.5);
            ctx.stroke();
        }

        // Render projectiles
        for (const p of this.projectiles) {
            const px = p.x - camera.x;
            const py = p.y - camera.y;
            ctx.fillStyle = "#880044";
            ctx.beginPath();
            ctx.arc(px, py, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "#ff0044";
            ctx.beginPath();
            ctx.arc(px, py, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    renderBossBody(ctx, sx, sy, time) {
        if (typeof BossSprite !== "undefined" && BossSprite.draw(ctx, this, sx, sy, time)) return;

        const bob = Math.sin(this.walkFrame * Math.PI / 2) * 2;

        // Shadow
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.beginPath();
        ctx.ellipse(sx, sy + this.size + 4, this.size * 0.9, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Legs (black armor)
        const legSpread = Math.sin(this.walkFrame * Math.PI / 2) * 4;
        ctx.fillStyle = "#1a1a2a";
        ctx.fillRect(sx - 8 - legSpread, sy + 6, 6, 16);
        ctx.fillRect(sx + 2 + legSpread, sy + 6, 6, 16);

        // Body - black armor
        ctx.fillStyle = this.color;
        ctx.fillRect(sx - 14, sy - 10 + bob, 28, 22);

        // Armor plates
        ctx.fillStyle = "#222233";
        ctx.fillRect(sx - 12, sy - 8 + bob, 24, 18);

        // Armor trim
        ctx.strokeStyle = "#880000";
        ctx.lineWidth = 1;
        ctx.strokeRect(sx - 12, sy - 8 + bob, 24, 18);

        // Chest emblem
        ctx.fillStyle = "#880000";
        ctx.beginPath();
        ctx.moveTo(sx, sy - 6 + bob);
        ctx.lineTo(sx + 5, sy + 2 + bob);
        ctx.lineTo(sx, sy + 6 + bob);
        ctx.lineTo(sx - 5, sy + 2 + bob);
        ctx.closePath();
        ctx.fill();

        // Cape
        ctx.fillStyle = "#440000";
        const capeWave = Math.sin(time * 0.003) * 3;
        ctx.beginPath();
        ctx.moveTo(sx - 12, sy - 8 + bob);
        ctx.lineTo(sx - 16 + capeWave, sy + 20);
        ctx.lineTo(sx + 16 - capeWave, sy + 20);
        ctx.lineTo(sx + 12, sy - 8 + bob);
        ctx.fill();

        // Shoulders
        ctx.fillStyle = "#1a1a2a";
        ctx.beginPath();
        ctx.ellipse(sx - 14, sy - 6 + bob, 8, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(sx + 14, sy - 6 + bob, 8, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Shoulder spikes
        ctx.fillStyle = "#333344";
        ctx.beginPath();
        ctx.moveTo(sx - 18, sy - 8 + bob);
        ctx.lineTo(sx - 20, sy - 18 + bob);
        ctx.lineTo(sx - 14, sy - 8 + bob);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(sx + 18, sy - 8 + bob);
        ctx.lineTo(sx + 20, sy - 18 + bob);
        ctx.lineTo(sx + 14, sy - 8 + bob);
        ctx.fill();

        // Helmet
        ctx.fillStyle = "#111122";
        ctx.beginPath();
        ctx.arc(sx, sy - 16 + bob, 11, 0, Math.PI * 2);
        ctx.fill();

        // Visor
        ctx.fillStyle = "#0a0a15";
        ctx.fillRect(sx - 8, sy - 18 + bob, 16, 6);

        // Glowing red eyes
        ctx.fillStyle = "#ff0000";
        ctx.shadowColor = "#ff0000";
        ctx.shadowBlur = 8;
        ctx.fillRect(sx - 5, sy - 16 + bob, 3, 2);
        ctx.fillRect(sx + 2, sy - 16 + bob, 3, 2);
        ctx.shadowBlur = 0;

        // Helmet crest
        ctx.fillStyle = "#880000";
        ctx.beginPath();
        ctx.moveTo(sx, sy - 27 + bob);
        ctx.lineTo(sx - 3, sy - 16 + bob);
        ctx.lineTo(sx + 3, sy - 16 + bob);
        ctx.fill();

        // Dark sword
        const swordAngle = this.charging ?
            dirToAngle(this.chargeDir.x, this.chargeDir.y) :
            dirToAngle(this.facing.x, this.facing.y);

        const swx = sx + Math.cos(swordAngle) * 16;
        const swy = sy - 4 + bob + Math.sin(swordAngle) * 16;
        const sex = swx + Math.cos(swordAngle) * 30;
        const sey = swy + Math.sin(swordAngle) * 30;

        ctx.strokeStyle = "#333";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(swx, swy);
        ctx.lineTo(sex, sey);
        ctx.stroke();

        ctx.strokeStyle = "#660022";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(swx + Math.cos(swordAngle) * 8, swy + Math.sin(swordAngle) * 8);
        ctx.lineTo(sex, sey);
        ctx.stroke();

        // Dark aura
        const auraPhase = Math.sin(time * 0.003);
        ctx.strokeStyle = `rgba(136, 0, 0, ${0.2 + auraPhase * 0.1})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(sx, sy + bob, this.size + 10 + auraPhase * 5, 0, Math.PI * 2);
        ctx.stroke();
    }
}

class GreenKnight {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.spawnX = x;
        this.spawnY = y;
        this.leashRadius = 500;
        this.hp = GREEN_KNIGHT.hp;
        this.maxHp = GREEN_KNIGHT.hp;
        this.damage = GREEN_KNIGHT.damage;
        this.size = GREEN_KNIGHT.size;
        this.speed = GREEN_KNIGHT.speed;
        this.alive = true;
        this.spawned = false;

        this.phase = 0;
        this.state = "idle";
        this.lastAttackTime = 0;
        this.facing = { x: 0, y: 1 };

        // Charge attack
        this.charging = false;
        this.chargeDir = { x: 0, y: 0 };
        this.chargeTimer = 0;
        this.chargeWindup = 0;

        // Spin attack
        this.spinning = false;
        this.spinAngle = 0;
        this.spinTimer = 0;

        // Visual
        this.flashTimer = 0;
        this.walkFrame = 0;
        this.walkTimer = 0;
        this.deathTimer = 0;
        this.spawnAnimation = 0;

        // Knockback
        this.knockbackVx = 0;
        this.knockbackVy = 0;

        // Projectiles (poison orbs)
        this.projectiles = [];
    }

    getCurrentPhase() {
        const hpPercent = this.hp / this.maxHp;
        for (let i = GREEN_KNIGHT.phases.length - 1; i >= 0; i--) {
            if (hpPercent <= GREEN_KNIGHT.phases[i].hpThreshold) {
                return GREEN_KNIGHT.phases[i];
            }
        }
        return GREEN_KNIGHT.phases[0];
    }

    spawn() {
        this.spawned = true;
        this.spawnAnimation = 2000;
    }

    tryMove(dx, dy, world) {
        const newX = this.x + dx;
        const newY = this.y + dy;
        const tileX = worldToTile(newX, this.y);
        const tileY = worldToTile(this.x, newY);
        if (!world.isSolid(tileX.x, tileX.y)) this.x = newX;
        if (!world.isSolid(tileY.x, tileY.y)) this.y = newY;
    }

    update(dt, player, world) {
        if (!this.alive) {
            if (this.deathTimer > 0) this.deathTimer -= dt;
            return null;
        }
        if (!this.spawned) return null;

        if (this.spawnAnimation > 0) {
            this.spawnAnimation -= dt;
            return null;
        }

        const phase = this.getCurrentPhase();
        const distToPlayer = dist(this.x, this.y, player.x, player.y);
        const distToSpawn = dist(this.x, this.y, this.spawnX, this.spawnY);
        const now = Date.now();
        const spd = this.speed * phase.speed;

        // Update projectiles
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];
            p.x += p.vx * dt * 0.1;
            p.y += p.vy * dt * 0.1;
            p.life -= dt;
            if (p.life <= 0) {
                this.projectiles.splice(i, 1);
                continue;
            }
            if (circleOverlap(p.x, p.y, 8, player.x, player.y, player.size)) {
                if (player.takeDamage(18, p.x, p.y)) {
                    this.projectiles.splice(i, 1);
                }
            }
        }

        // Charge attack
        if (this.charging) {
            this.chargeTimer -= dt;
            this.tryMove(this.chargeDir.x * spd * 4, this.chargeDir.y * spd * 4, world);
            if (distToPlayer < this.size + player.size) {
                player.takeDamage(this.damage * 1.5, this.x, this.y);
            }
            if (this.chargeTimer <= 0) this.charging = false;
            return null;
        }

        if (this.chargeWindup > 0) {
            this.chargeWindup -= dt;
            if (this.chargeWindup <= 0) {
                this.charging = true;
                this.chargeTimer = 600;
                this.chargeDir = normalize(player.x - this.x, player.y - this.y);
            }
            return null;
        }

        // Spin attack
        if (this.spinning) {
            this.spinTimer -= dt;
            this.spinAngle += dt * 0.02;
            if (distToPlayer < this.size + 40) {
                player.takeDamage(this.damage * 0.5, this.x, this.y);
            }
            if (this.spinTimer <= 0) this.spinning = false;
            return null;
        }

        // Leash: if too far from spawn, walk back instead of chasing
        let chaseTarget = player;
        if (distToSpawn > this.leashRadius) {
            chaseTarget = { x: this.spawnX, y: this.spawnY };
        }

        // Chase player (or return to spawn)
        const norm = normalize(chaseTarget.x - this.x, chaseTarget.y - this.y);
        this.tryMove(norm.x * spd, norm.y * spd, world);
        this.facing = norm;

        this.walkTimer += dt;
        if (this.walkTimer > 180) {
            this.walkFrame = (this.walkFrame + 1) % 4;
            this.walkTimer = 0;
        }

        // Knockback with wall collision
        if (this.knockbackVx !== 0 || this.knockbackVy !== 0) {
            this.tryMove(this.knockbackVx, this.knockbackVy, world);
            this.knockbackVx *= 0.9;
            this.knockbackVy *= 0.9;
            if (Math.abs(this.knockbackVx) < 0.1) this.knockbackVx = 0;
            if (Math.abs(this.knockbackVy) < 0.1) this.knockbackVy = 0;
        }

        // Attack patterns
        if (now - this.lastAttackTime > phase.attackRate) {
            this.lastAttackTime = now;

            switch (phase.pattern) {
                case "chase":
                    if (distToPlayer < this.size + player.size + 10) {
                        player.takeDamage(this.damage, this.x, this.y);
                    }
                    break;
                case "charge":
                    if (Math.random() < 0.4) {
                        this.chargeWindup = 700;
                    } else if (distToPlayer < 50) {
                        player.takeDamage(this.damage, this.x, this.y);
                    }
                    break;
                case "poison":
                    if (Math.random() < 0.35) {
                        this.spinning = true;
                        this.spinTimer = 1500;
                        this.spinAngle = 0;
                    } else if (Math.random() < 0.4) {
                        // Poison spread - 5 projectiles in a fan
                        for (let i = -2; i <= 2; i++) {
                            this.fireProjectile(player, i * 0.25);
                        }
                    } else {
                        this.chargeWindup = 500;
                    }
                    break;
                case "frenzy":
                    if (Math.random() < 0.25) {
                        this.spinning = true;
                        this.spinTimer = 2000;
                    } else if (Math.random() < 0.3) {
                        this.chargeWindup = 350;
                    } else {
                        // Poison barrage - 8 projectiles in all directions
                        for (let i = 0; i < 8; i++) {
                            const angle = (i / 8) * Math.PI * 2;
                            this.projectiles.push({
                                x: this.x, y: this.y,
                                vx: Math.cos(angle) * 2.5,
                                vy: Math.sin(angle) * 2.5,
                                life: 3000,
                            });
                        }
                    }
                    break;
            }
        }

        if (this.flashTimer > 0) this.flashTimer -= dt;
        return null;
    }

    fireProjectile(player, angleOffset = 0) {
        const angle = dirToAngle(player.x - this.x, player.y - this.y) + angleOffset;
        this.projectiles.push({
            x: this.x, y: this.y,
            vx: Math.cos(angle) * 3,
            vy: Math.sin(angle) * 3,
            life: 3000,
        });
    }

    takeDamage(amount, fromX, fromY) {
        this.hp -= amount;
        this.flashTimer = 150;
        if (fromX !== undefined) {
            const norm = normalize(this.x - fromX, this.y - fromY);
            this.knockbackVx = norm.x * 3;
            this.knockbackVy = norm.y * 3;
        }
        if (this.hp <= 0) {
            this.alive = false;
            this.deathTimer = 3000;
            return true;
        }
        return false;
    }

    render(ctx, camera, time) {
        const sx = this.x - camera.x;
        const sy = this.y - camera.y;

        if (!this.spawned) return;

        // Spawn animation
        if (this.spawnAnimation > 0) {
            const progress = 1 - this.spawnAnimation / 2000;
            ctx.save();
            ctx.globalAlpha = progress;
            // Green energy vortex
            ctx.strokeStyle = "#00aa00";
            ctx.lineWidth = 3;
            for (let i = 0; i < 5; i++) {
                const a = time * 0.005 + i * Math.PI * 0.4;
                const r = (1 - progress) * 100 + 20;
                ctx.beginPath();
                ctx.arc(sx + Math.cos(a) * r, sy + Math.sin(a) * r, 5, 0, Math.PI * 2);
                ctx.stroke();
            }
            this.renderBody(ctx, sx, sy, time);
            ctx.restore();
            return;
        }

        // Death animation
        if (!this.alive) {
            if (this.deathTimer > 0) {
                ctx.save();
                ctx.globalAlpha = this.deathTimer / 3000;
                for (let i = 0; i < 8; i++) {
                    const a = (i / 8) * Math.PI * 2 + time * 0.003;
                    const r = (1 - this.deathTimer / 3000) * 80;
                    ctx.fillStyle = i % 2 === 0 ? "#00aa00" : "#88ff44";
                    ctx.beginPath();
                    ctx.arc(sx + Math.cos(a) * r, sy + Math.sin(a) * r, 8, 0, Math.PI * 2);
                    ctx.fill();
                }
                this.renderBody(ctx, sx, sy, time);
                ctx.restore();
            }
            return;
        }

        if (this.flashTimer > 0 && Math.floor(time / 60) % 2 === 0) {
            ctx.save();
            ctx.globalCompositeOperation = "lighter";
            this.renderBody(ctx, sx, sy, time);
            ctx.restore();
            return;
        }

        // Charge windup indicator
        if (this.chargeWindup > 0) {
            ctx.strokeStyle = "#00ff00";
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            const n = normalize(this.facing.x, this.facing.y);
            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.lineTo(sx + n.x * 200, sy + n.y * 200);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        this.renderBody(ctx, sx, sy, time);

        // Spin attack visual
        if (this.spinning) {
            ctx.strokeStyle = "#00aa00";
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(sx, sy, this.size + 35, this.spinAngle, this.spinAngle + Math.PI * 1.5);
            ctx.stroke();
        }

        // Render projectiles (poison orbs)
        for (const p of this.projectiles) {
            const px = p.x - camera.x;
            const py = p.y - camera.y;
            ctx.fillStyle = "#005500";
            ctx.beginPath();
            ctx.arc(px, py, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "#44ff44";
            ctx.beginPath();
            ctx.arc(px, py, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    renderBody(ctx, sx, sy, time) {
        if (typeof BossSprite !== "undefined") {
            BossSprite.drawGreenKnight(ctx, this, sx, sy, time);
            return;
        }

        const bob = Math.sin(this.walkFrame * Math.PI / 2) * 2;

        // Shadow
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.beginPath();
        ctx.ellipse(sx, sy + this.size + 4, this.size * 0.9, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Legs
        const legSpread = Math.sin(this.walkFrame * Math.PI / 2) * 4;
        ctx.fillStyle = "#0a2a0a";
        ctx.fillRect(sx - 8 - legSpread, sy + 6, 6, 16);
        ctx.fillRect(sx + 2 + legSpread, sy + 6, 6, 16);

        // Body - green armor
        ctx.fillStyle = GREEN_KNIGHT.color;
        ctx.fillRect(sx - 14, sy - 10 + bob, 28, 22);

        // Armor plates
        ctx.fillStyle = "#0a4a0a";
        ctx.fillRect(sx - 12, sy - 8 + bob, 24, 18);

        // Armor trim
        ctx.strokeStyle = "#44ff44";
        ctx.lineWidth = 1;
        ctx.strokeRect(sx - 12, sy - 8 + bob, 24, 18);

        // Chest emblem (leaf/vine pattern)
        ctx.fillStyle = "#22aa22";
        ctx.beginPath();
        ctx.moveTo(sx, sy - 6 + bob);
        ctx.lineTo(sx + 5, sy + 2 + bob);
        ctx.lineTo(sx, sy + 6 + bob);
        ctx.lineTo(sx - 5, sy + 2 + bob);
        ctx.closePath();
        ctx.fill();

        // Cape
        ctx.fillStyle = "#004400";
        const capeWave = Math.sin(time * 0.003) * 3;
        ctx.beginPath();
        ctx.moveTo(sx - 12, sy - 8 + bob);
        ctx.lineTo(sx - 16 + capeWave, sy + 20);
        ctx.lineTo(sx + 16 - capeWave, sy + 20);
        ctx.lineTo(sx + 12, sy - 8 + bob);
        ctx.fill();

        // Shoulders
        ctx.fillStyle = "#0a3a0a";
        ctx.beginPath();
        ctx.ellipse(sx - 14, sy - 6 + bob, 8, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(sx + 14, sy - 6 + bob, 8, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Shoulder spikes (vine-like)
        ctx.fillStyle = "#1a5a1a";
        ctx.beginPath();
        ctx.moveTo(sx - 18, sy - 8 + bob);
        ctx.lineTo(sx - 20, sy - 18 + bob);
        ctx.lineTo(sx - 14, sy - 8 + bob);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(sx + 18, sy - 8 + bob);
        ctx.lineTo(sx + 20, sy - 18 + bob);
        ctx.lineTo(sx + 14, sy - 8 + bob);
        ctx.fill();

        // Helmet
        ctx.fillStyle = "#0a3a0a";
        ctx.beginPath();
        ctx.arc(sx, sy - 16 + bob, 11, 0, Math.PI * 2);
        ctx.fill();

        // Visor
        ctx.fillStyle = "#051a05";
        ctx.fillRect(sx - 8, sy - 18 + bob, 16, 6);

        // Glowing green eyes
        ctx.fillStyle = "#00ff00";
        ctx.shadowColor = "#00ff00";
        ctx.shadowBlur = 8;
        ctx.fillRect(sx - 5, sy - 16 + bob, 3, 2);
        ctx.fillRect(sx + 2, sy - 16 + bob, 3, 2);
        ctx.shadowBlur = 0;

        // Helmet crest
        ctx.fillStyle = "#22aa22";
        ctx.beginPath();
        ctx.moveTo(sx, sy - 27 + bob);
        ctx.lineTo(sx - 3, sy - 16 + bob);
        ctx.lineTo(sx + 3, sy - 16 + bob);
        ctx.fill();

        // Green sword
        const swordAngle = this.charging ?
            dirToAngle(this.chargeDir.x, this.chargeDir.y) :
            dirToAngle(this.facing.x, this.facing.y);

        const swx = sx + Math.cos(swordAngle) * 16;
        const swy = sy - 4 + bob + Math.sin(swordAngle) * 16;
        const sex = swx + Math.cos(swordAngle) * 30;
        const sey = swy + Math.sin(swordAngle) * 30;

        ctx.strokeStyle = "#333";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(swx, swy);
        ctx.lineTo(sex, sey);
        ctx.stroke();

        ctx.strokeStyle = "#006622";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(swx + Math.cos(swordAngle) * 8, swy + Math.sin(swordAngle) * 8);
        ctx.lineTo(sex, sey);
        ctx.stroke();

        // Green aura
        const auraPhase = Math.sin(time * 0.003);
        ctx.strokeStyle = `rgba(0, 170, 0, ${0.2 + auraPhase * 0.1})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(sx, sy + bob, this.size + 10 + auraPhase * 5, 0, Math.PI * 2);
        ctx.stroke();
    }
}

// ============================================
// The Olympian - Zeus and the twelve faces he wears
// ============================================
//
// Summoned as Zeus. Every landed hit turns him into the next Olympian, and
// while he is wearing a god's face he cannot be killed - the damage is only
// banked as "wrath". Once all twelve have shown themselves he returns to Zeus
// in his true form, carrying the banked wrath as missing health, and *that*
// Zeus can be brought down.

class OlympianBoss {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.spawnX = x;
        this.spawnY = y;
        this.leashRadius = 420;

        // Cycle state
        this.formIndex = 0;              // index into OLYMPIANS
        this.formsCycled = 0;            // transformations completed
        this.cycleComplete = false;
        this.bankedDamage = 0;
        this.morphTimer = 0;             // invulnerable while transforming

        // Health bar doubles as the cycle tracker until Zeus returns
        this.maxHp = OLYMPIANS.length;
        this.hp = OLYMPIANS.length;

        this.damage = ZEUS_BOSS.damage;
        this.size = 26;
        this.speed = 1.15;
        this.alive = true;
        this.spawned = false;
        this.spawnAnimation = 0;
        this.deathTimer = 0;
        this.flashTimer = 0;

        this.facing = { x: 0, y: 1 };
        this.lastAttackTime = 0;
        this.walkFrame = 0;
        this.walkTimer = 0;

        // Attack machinery
        this.projectiles = [];
        this.shockwaves = [];
        this.strikes = [];
        this.spiralShots = 0;
        this.spiralTimer = 0;
        this.spiralAngle = 0;

        this.charging = false;
        this.chargeDir = { x: 0, y: 0 };
        this.chargeTimer = 0;
        this.chargeWindup = 0;
        this.spinning = false;   // kept for parity with the other bosses
        this.spinTimer = 0;
        this.spinAngle = 0;

        this.knockbackVx = 0;
        this.knockbackVy = 0;

        // Drained by the game loop for sounds, dialog and notifications
        this.pendingEvents = [];
    }

    get god() {
        return OLYMPIANS[this.formIndex];
    }

    get displayName() {
        if (this.cycleComplete) return `${ZEUS_BOSS.name}  —  TRUE FORM`;
        const g = this.god;
        return `${g.emblem} ${g.name}, ${g.title}  —  Form ${this.formsCycled + 1}/${OLYMPIANS.length}`;
    }

    spawn() {
        this.spawned = true;
        this.spawnAnimation = 2200;
    }

    getCurrentPhase() {
        const pct = this.hp / this.maxHp;
        for (let i = ZEUS_BOSS.phases.length - 1; i >= 0; i--) {
            if (pct <= ZEUS_BOSS.phases[i].hpThreshold) return ZEUS_BOSS.phases[i];
        }
        return ZEUS_BOSS.phases[0];
    }

    tryMove(dx, dy, world) {
        const nx = this.x + dx;
        const ny = this.y + dy;
        const tileX = worldToTile(nx, this.y);
        const tileY = worldToTile(this.x, ny);
        if (!world.isSolid(tileX.x, tileX.y)) this.x = nx;
        if (!world.isSolid(tileY.x, tileY.y)) this.y = ny;
    }

    takeDamage(amount, fromX, fromY) {
        if (!this.spawned || !this.alive || this.spawnAnimation > 0) return false;
        this.flashTimer = 150;

        // While he wears a god's face, hits only strip the mask.
        if (!this.cycleComplete) {
            if (this.morphTimer > 0) return false;
            this.bankedDamage += amount;
            this.advanceForm();
            return false;
        }

        this.hp -= amount;
        if (fromX !== undefined) {
            const norm = normalize(this.x - fromX, this.y - fromY);
            this.knockbackVx = norm.x * 2.5;
            this.knockbackVy = norm.y * 2.5;
        }
        if (this.hp <= 0) {
            this.hp = 0;
            this.alive = false;
            this.deathTimer = 4000;
            // Nothing he threw survives him
            this.projectiles = [];
            this.shockwaves = [];
            this.strikes = [];
            this.spiralShots = 0;
            this.charging = false;
            this.chargeWindup = 0;
            return true;
        }
        return false;
    }

    advanceForm() {
        this.formsCycled++;
        this.formIndex = this.formsCycled % OLYMPIANS.length;
        this.morphTimer = OLYMPIAN_CYCLE.morphTime;
        // Clear the sky between forms so the player gets a breath - the AoE
        // arrays matter most, since they would otherwise land while he is
        // untouchable mid-transformation.
        this.projectiles = [];
        this.shockwaves = [];
        this.strikes = [];
        this.charging = false;
        this.chargeWindup = 0;
        this.spiralShots = 0;

        if (this.formsCycled >= OLYMPIANS.length) {
            this.enterTrueForm();
            return;
        }

        this.hp = OLYMPIANS.length - this.formsCycled;
        this.pendingEvents.push({ type: "morph", god: this.god });
    }

    enterTrueForm() {
        this.cycleComplete = true;
        this.formIndex = 0; // Zeus
        this.maxHp = ZEUS_BOSS.hp;
        const cap = ZEUS_BOSS.hp * OLYMPIAN_CYCLE.bankedDamageCap;
        const banked = Math.floor(Math.min(this.bankedDamage, cap));
        this.hp = Math.max(1, ZEUS_BOSS.hp - banked);
        this.size = ZEUS_BOSS.size;
        this.speed = ZEUS_BOSS.speed;
        this.morphTimer = OLYMPIAN_CYCLE.returnPause;
        this.shockwaves = [];
        this.strikes = [];
        this.pendingEvents.push({ type: "trueForm", banked });
    }

    update(dt, player, world) {
        if (!this.alive) {
            if (this.deathTimer > 0) this.deathTimer -= dt;
            return null;
        }
        if (!this.spawned) return null;

        if (this.spawnAnimation > 0) {
            this.spawnAnimation -= dt;
            return null;
        }

        if (this.flashTimer > 0) this.flashTimer -= dt;

        this.updateAttacks(dt, player, world);

        // Transformations freeze him in place, hovering and untouchable
        if (this.morphTimer > 0) {
            this.morphTimer -= dt;
            if (this.morphTimer <= 0 && !this.cycleComplete) {
                this.useSignatureMove(player, world);
                this.lastAttackTime = Date.now();
            }
            return null;
        }

        const god = this.god;
        const phase = this.cycleComplete ? this.getCurrentPhase() : null;
        const spd = this.speed * (this.cycleComplete ? phase.speed : god.speed);
        const distToPlayer = dist(this.x, this.y, player.x, player.y);
        const distToSpawn = dist(this.x, this.y, this.spawnX, this.spawnY);
        const now = Date.now();

        // Charge (Ares, and Zeus in his later phases)
        if (this.charging) {
            this.chargeTimer -= dt;
            this.tryMove(this.chargeDir.x * spd * 4.2, this.chargeDir.y * spd * 4.2, world);
            if (distToPlayer < this.size + player.size) {
                player.takeDamage(OLYMPIAN_DAMAGE.charge, this.x, this.y);
            }
            if (this.chargeTimer <= 0) this.charging = false;
            return null;
        }
        if (this.chargeWindup > 0) {
            this.chargeWindup -= dt;
            if (this.chargeWindup <= 0) {
                this.charging = true;
                this.chargeTimer = 620;
                this.chargeDir = normalize(player.x - this.x, player.y - this.y);
            }
            return null;
        }

        // Safety net - if he ever ends up inside solid ground, ease him back
        // toward his spawn rather than letting tryMove() lock him in place.
        const ownTile = worldToTile(this.x, this.y);
        if (world.isSolid(ownTile.x, ownTile.y)) {
            const home = normalize(this.spawnX - this.x, this.spawnY - this.y);
            this.x += home.x * 4;
            this.y += home.y * 4;
            return null;
        }

        // Drift toward the player, keeping a little distance so he stays readable
        let target = player;
        if (distToSpawn > this.leashRadius) target = { x: this.spawnX, y: this.spawnY };
        const norm = normalize(target.x - this.x, target.y - this.y);
        this.facing = norm;
        const approach = (target === player && distToPlayer < 90) ? -0.45 : 1;
        this.tryMove(norm.x * spd * approach, norm.y * spd * approach, world);

        this.walkTimer += dt;
        if (this.walkTimer > 170) {
            this.walkFrame = (this.walkFrame + 1) % 4;
            this.walkTimer = 0;
        }

        if (this.knockbackVx !== 0 || this.knockbackVy !== 0) {
            this.tryMove(this.knockbackVx, this.knockbackVy, world);
            this.knockbackVx *= 0.9;
            this.knockbackVy *= 0.9;
            if (Math.abs(this.knockbackVx) < 0.1) this.knockbackVx = 0;
            if (Math.abs(this.knockbackVy) < 0.1) this.knockbackVy = 0;
        }

        // Melee smite for anyone who hugs him
        if (distToPlayer < this.size + player.size + 6 && now - this.lastAttackTime > 900) {
            this.lastAttackTime = now;
            player.takeDamage(this.damage, this.x, this.y);
            return null;
        }

        const rate = this.cycleComplete ? phase.attackRate : OLYMPIAN_CYCLE.attackRate;
        if (now - this.lastAttackTime > rate) {
            this.lastAttackTime = now;
            if (this.cycleComplete) {
                this.useZeusPattern(phase.pattern, player, world);
            } else {
                this.useSignatureMove(player, world);
            }
        }

        return null;
    }

    // --- Attack construction helpers -------------------------------------

    addProjectile(angle, speed, opts = {}) {
        const g = this.god;
        this.projectiles.push({
            x: opts.x !== undefined ? opts.x : this.x,
            y: opts.y !== undefined ? opts.y : this.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: opts.life || 3200,
            maxLife: opts.life || 3200,
            size: opts.size || 7,
            color: opts.color || g.color,
            accent: opts.accent || g.accent,
            damage: opts.damage || OLYMPIAN_DAMAGE.projectile,
            homing: opts.homing || 0,
            shape: opts.shape || "orb",
        });
    }

    addShockwave(opts = {}) {
        const g = this.god;
        this.shockwaves.push({
            x: opts.x !== undefined ? opts.x : this.x,
            y: opts.y !== undefined ? opts.y : this.y,
            radius: opts.radius || 20,
            maxRadius: opts.maxRadius || 230,
            speed: opts.speed || 0.34,
            thickness: opts.thickness || 20,
            color: opts.color || g.aura,
            damage: opts.damage || OLYMPIAN_DAMAGE.shockwave,
            hitPlayer: false,
        });
    }

    addStrike(x, y, opts = {}) {
        const g = this.god;
        this.strikes.push({
            x, y,
            warn: opts.warn || 700,
            timer: opts.warn || 700,
            radius: opts.radius || 46,
            color: opts.color || g.aura,
            damage: opts.damage || OLYMPIAN_DAMAGE.strike,
            kind: opts.kind || "bolt",
            detonated: false,
            fade: 260,
        });
    }

    // --- The twelve signature moves --------------------------------------

    useSignatureMove(player, world) {
        const g = this.god;
        const toPlayer = dirToAngle(player.x - this.x, player.y - this.y);

        switch (g.move) {
            case "bolts": // Zeus - forked lightning called down on the player
                for (let i = 0; i < 3; i++) {
                    this.addStrike(
                        player.x + randFloat(-70, 70),
                        player.y + randFloat(-70, 70),
                        { warn: 620 + i * 120, color: g.aura }
                    );
                }
                break;

            case "orbit": // Hera - a ring of peacock orbs that blooms outward
                for (let i = 0; i < 8; i++) {
                    const a = (i / 8) * Math.PI * 2 + this.spiralAngle;
                    this.addProjectile(a, 2.1, { size: 8, life: 3600, shape: "eye" });
                }
                this.spiralAngle += 0.4;
                break;

            case "wave": // Poseidon - rolling tidal shockwaves
                this.addShockwave({ maxRadius: 250, speed: 0.32 });
                this.addShockwave({ maxRadius: 190, speed: 0.24, radius: -60 });
                break;

            case "thorns": // Demeter - a creeping line of bramble bursts
                for (let i = 1; i <= 5; i++) {
                    const t = i / 5;
                    this.addStrike(
                        lerp(this.x, player.x, t) + randFloat(-16, 16),
                        lerp(this.y, player.y, t) + randFloat(-16, 16),
                        { warn: 260 + i * 130, radius: 40, kind: "thorn" }
                    );
                }
                break;

            case "spears": // Athena - fast piercing spears
                for (let i = -1; i <= 1; i++) {
                    this.addProjectile(toPlayer + i * 0.16, 5.6, {
                        size: 6, life: 2200, shape: "spear",
                    });
                }
                break;

            case "sunburst": // Apollo - a full radial burst of sunlight
                for (let i = 0; i < 14; i++) {
                    this.addProjectile((i / 14) * Math.PI * 2, 2.9, { size: 7, shape: "sun" });
                }
                break;

            case "volley": // Artemis - a tight, very fast arrow volley
                for (let i = -2; i <= 2; i++) {
                    this.addProjectile(toPlayer + i * 0.1, 6.6, {
                        size: 5, life: 2000, shape: "arrow",
                    });
                }
                break;

            case "warcharge": // Ares - a headlong armoured charge
                this.chargeWindup = 520;
                break;

            case "charm": // Aphrodite - slow homing hearts that hunt you down
                for (let i = 0; i < 6; i++) {
                    this.addProjectile((i / 6) * Math.PI * 2, 1.5, {
                        size: 8, life: 5200, homing: 0.055, shape: "heart",
                    });
                }
                break;

            case "embers": // Hephaestus - forge bombs lobbed around the player
                for (let i = 0; i < 4; i++) {
                    this.addStrike(
                        player.x + randFloat(-110, 110),
                        player.y + randFloat(-110, 110),
                        { warn: 780, radius: 54, kind: "ember" }
                    );
                }
                break;

            case "blink": { // Hermes - flickers behind you and detonates
                // Only ever land on solid cloud; blinking into the open sky
                // would strand him where tryMove() can never dig him out.
                let a = Math.random() * Math.PI * 2;
                for (let attempt = 0; attempt < 8; attempt++) {
                    const cand = a + attempt * (Math.PI / 4);
                    const bx = player.x + Math.cos(cand) * 86;
                    const by = player.y + Math.sin(cand) * 86;
                    const t = worldToTile(bx, by);
                    if (!world || !world.isSolid(t.x, t.y)) {
                        this.x = bx;
                        this.y = by;
                        a = cand;
                        break;
                    }
                }
                for (let i = 0; i < 6; i++) {
                    this.addProjectile((i / 6) * Math.PI * 2 + a, 3.6, { size: 6, shape: "wing" });
                }
                break;
            }

            case "spiral": // Dionysus - a lazy, inescapable spiral of vine-orbs
                this.spiralShots = 14;
                this.spiralTimer = 0;
                break;
        }
    }

    // --- Zeus's true-form patterns ---------------------------------------

    useZeusPattern(pattern, player, world) {
        const toPlayer = dirToAngle(player.x - this.x, player.y - this.y);
        const boltOpts = { color: "#ffee88", damage: OLYMPIAN_DAMAGE.zeusBolt };

        switch (pattern) {
            case "storm":
                if (Math.random() < 0.5) {
                    for (let i = 0; i < 3; i++) {
                        this.addStrike(player.x + randFloat(-80, 80), player.y + randFloat(-80, 80),
                            { warn: 640, ...boltOpts });
                    }
                } else {
                    for (let i = -1; i <= 1; i++) {
                        this.addProjectile(toPlayer + i * 0.18, 5.2, { size: 7, shape: "bolt", color: "#ffee88" });
                    }
                }
                break;

            case "tempest":
                if (Math.random() < 0.4) {
                    this.addShockwave({ maxRadius: 260, speed: 0.36, color: "#fff3b0" });
                } else {
                    for (let i = 0; i < 4; i++) {
                        this.addStrike(player.x + randFloat(-100, 100), player.y + randFloat(-100, 100),
                            { warn: 560, ...boltOpts });
                    }
                    for (let i = 0; i < 8; i++) {
                        this.addProjectile((i / 8) * Math.PI * 2, 3.2, { size: 6, shape: "bolt", color: "#ffee88" });
                    }
                }
                break;

            case "wrath":
                if (Math.random() < 0.32) {
                    this.chargeWindup = 420;
                } else if (Math.random() < 0.5) {
                    for (let i = 0; i < 5; i++) {
                        this.addStrike(player.x + randFloat(-120, 120), player.y + randFloat(-120, 120),
                            { warn: 500, ...boltOpts });
                    }
                } else {
                    this.spiralShots = 16;
                    this.spiralTimer = 0;
                    this.addShockwave({ maxRadius: 240, speed: 0.34, color: "#fff3b0" });
                }
                break;

            case "cataclysm":
                this.addShockwave({ maxRadius: 300, speed: 0.42, color: "#fff3b0" });
                for (let i = 0; i < 6; i++) {
                    this.addStrike(player.x + randFloat(-150, 150), player.y + randFloat(-150, 150),
                        { warn: 460, ...boltOpts });
                }
                for (let i = 0; i < 12; i++) {
                    this.addProjectile((i / 12) * Math.PI * 2 + this.spiralAngle, 3.6,
                        { size: 6, shape: "bolt", color: "#ffee88" });
                }
                this.spiralAngle += 0.5;
                if (Math.random() < 0.35) this.chargeWindup = 380;
                break;
        }
    }

    // --- Attack simulation ------------------------------------------------

    updateAttacks(dt, player, world) {
        // Trailing spiral shots
        if (this.spiralShots > 0) {
            this.spiralTimer -= dt;
            if (this.spiralTimer <= 0) {
                this.spiralTimer = 85;
                this.spiralShots--;
                this.spiralAngle += 0.55;
                this.addProjectile(this.spiralAngle, 3.0, { size: 7, shape: "vine" });
                this.addProjectile(this.spiralAngle + Math.PI, 3.0, { size: 7, shape: "vine" });
            }
        }

        // Projectiles
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];
            if (p.homing) {
                const want = normalize(player.x - p.x, player.y - p.y);
                const sp = Math.sqrt(p.vx * p.vx + p.vy * p.vy) || 1;
                p.vx = lerp(p.vx, want.x * sp, p.homing);
                p.vy = lerp(p.vy, want.y * sp, p.homing);
            }
            p.x += p.vx * dt * 0.1;
            p.y += p.vy * dt * 0.1;
            p.life -= dt;
            if (p.life <= 0) { this.projectiles.splice(i, 1); continue; }
            // Divine attacks stop at the temple pillars and the open sky
            const tile = worldToTile(p.x, p.y);
            if (world && world.isSolid(tile.x, tile.y)) { this.projectiles.splice(i, 1); continue; }
            if (circleOverlap(p.x, p.y, p.size + 2, player.x, player.y, player.size)) {
                if (player.takeDamage(p.damage, p.x, p.y)) {
                    this.projectiles.splice(i, 1);
                }
            }
        }

        // Shockwaves
        for (let i = this.shockwaves.length - 1; i >= 0; i--) {
            const w = this.shockwaves[i];
            w.radius += w.speed * dt;
            if (w.radius > w.maxRadius) { this.shockwaves.splice(i, 1); continue; }
            if (w.radius <= 0 || w.hitPlayer) continue;
            const d = dist(w.x, w.y, player.x, player.y);
            if (Math.abs(d - w.radius) < w.thickness) {
                if (player.takeDamage(w.damage, w.x, w.y)) w.hitPlayer = true;
            }
        }

        // Telegraphed ground strikes
        for (let i = this.strikes.length - 1; i >= 0; i--) {
            const s = this.strikes[i];
            if (!s.detonated) {
                s.timer -= dt;
                if (s.timer <= 0) {
                    s.detonated = true;
                    if (dist(s.x, s.y, player.x, player.y) < s.radius) {
                        player.takeDamage(s.damage, s.x, s.y);
                    }
                }
            } else {
                s.fade -= dt;
                if (s.fade <= 0) this.strikes.splice(i, 1);
            }
        }
    }

    // --- Rendering --------------------------------------------------------

    render(ctx, camera, time) {
        if (!this.spawned) return;
        const sx = this.x - camera.x;
        const sy = this.y - camera.y;

        this.renderStrikes(ctx, camera);
        this.renderShockwaves(ctx, camera);

        if (this.spawnAnimation > 0) {
            const progress = 1 - this.spawnAnimation / 2200;
            ctx.save();
            ctx.globalAlpha = progress;
            // Column of light punching down through the clouds
            const beam = ctx.createLinearGradient(sx, sy - 300, sx, sy + 20);
            beam.addColorStop(0, "rgba(255, 250, 200, 0)");
            beam.addColorStop(1, `rgba(255, 245, 170, ${0.5 * progress})`);
            ctx.fillStyle = beam;
            ctx.fillRect(sx - 46, sy - 300, 92, 320);
            ctx.strokeStyle = "#fff3b0";
            ctx.lineWidth = 3;
            for (let i = 0; i < 6; i++) {
                const a = time * 0.006 + i * Math.PI / 3;
                const r = (1 - progress) * 130 + 24;
                ctx.beginPath();
                ctx.arc(sx + Math.cos(a) * r, sy + Math.sin(a) * r, 6, 0, Math.PI * 2);
                ctx.stroke();
            }
            this.renderGodBody(ctx, sx, sy, time);
            ctx.restore();
            this.renderProjectiles(ctx, camera, time);
            return;
        }

        if (!this.alive) {
            if (this.deathTimer > 0) {
                const t = this.deathTimer / 4000;
                ctx.save();
                ctx.globalAlpha = t;
                for (let i = 0; i < 14; i++) {
                    const a = (i / 14) * Math.PI * 2 + time * 0.003;
                    const r = (1 - t) * 140;
                    ctx.fillStyle = i % 2 === 0 ? "#fff3b0" : "#ffd23f";
                    ctx.beginPath();
                    ctx.arc(sx + Math.cos(a) * r, sy + Math.sin(a) * r, 9, 0, Math.PI * 2);
                    ctx.fill();
                }
                this.renderGodBody(ctx, sx, sy, time);
                ctx.restore();
            }
            this.renderProjectiles(ctx, camera, time);
            return;
        }

        // Charge telegraph
        if (this.chargeWindup > 0) {
            ctx.save();
            ctx.strokeStyle = this.god.aura;
            ctx.lineWidth = 3;
            ctx.setLineDash([6, 6]);
            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.lineTo(sx + this.facing.x * 260, sy + this.facing.y * 260);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.restore();
        }

        // Transformation burst
        if (this.morphTimer > 0) {
            const total = this.cycleComplete ? OLYMPIAN_CYCLE.returnPause : OLYMPIAN_CYCLE.morphTime;
            const p = 1 - this.morphTimer / total;
            ctx.save();
            for (let i = 0; i < 3; i++) {
                const r = 20 + p * (90 + i * 34);
                ctx.strokeStyle = `rgba(255, 255, 255, ${Math.max(0, 0.75 - p - i * 0.15)})`;
                ctx.lineWidth = 4 - i;
                ctx.beginPath();
                ctx.arc(sx, sy, r, 0, Math.PI * 2);
                ctx.stroke();
            }
            ctx.restore();
        }

        if (this.flashTimer > 0 && Math.floor(time / 60) % 2 === 0) {
            ctx.save();
            ctx.globalCompositeOperation = "lighter";
            this.renderGodBody(ctx, sx, sy, time);
            ctx.restore();
        } else {
            this.renderGodBody(ctx, sx, sy, time);
        }

        this.renderProjectiles(ctx, camera, time);

        // Name plate so the player can read the god at a glance
        const g = this.god;
        ctx.save();
        ctx.textAlign = "center";
        ctx.shadowColor = "#000";
        ctx.shadowBlur = 4;
        ctx.fillStyle = this.cycleComplete ? "#fff3b0" : g.accent;
        ctx.font = "bold 12px monospace";
        ctx.fillText(this.cycleComplete ? "ZEUS" : `${g.emblem} ${g.name}`, sx, sy - this.size - 30);
        if (!this.cycleComplete) {
            ctx.fillStyle = "rgba(255,255,255,0.75)";
            ctx.font = "9px monospace";
            ctx.fillText(`${this.formsCycled + 1} / ${OLYMPIANS.length}`, sx, sy - this.size - 18);
        }
        ctx.restore();
    }

    renderGodBody(ctx, sx, sy, time) {
        const g = this.god;
        const final = this.cycleComplete;
        const bob = Math.sin(time * 0.002) * 3 + Math.sin(this.walkFrame * Math.PI / 2) * 1.5;
        const s = final ? 1.28 : 1;

        ctx.save();

        // Divine aura
        const auraR = (this.size + 22) * s + Math.sin(time * 0.004) * 5;
        const aura = ctx.createRadialGradient(sx, sy + bob, 0, sx, sy + bob, auraR);
        aura.addColorStop(0, this.hexA(g.aura, final ? 0.42 : 0.3));
        aura.addColorStop(1, this.hexA(g.aura, 0));
        ctx.fillStyle = aura;
        ctx.beginPath();
        ctx.arc(sx, sy + bob, auraR, 0, Math.PI * 2);
        ctx.fill();

        // Shadow on the marble
        ctx.fillStyle = "rgba(40, 40, 70, 0.35)";
        ctx.beginPath();
        ctx.ellipse(sx, sy + this.size + 6, this.size * 0.85, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Flowing robe
        const sway = Math.sin(time * 0.003) * 4;
        ctx.fillStyle = g.robe;
        ctx.beginPath();
        ctx.moveTo(sx - 15 * s, sy - 8 * s + bob);
        ctx.lineTo(sx - 21 * s + sway, sy + 26 * s);
        ctx.lineTo(sx + 21 * s - sway, sy + 26 * s);
        ctx.lineTo(sx + 15 * s, sy - 8 * s + bob);
        ctx.closePath();
        ctx.fill();

        // Chiton highlight
        ctx.fillStyle = g.color;
        ctx.beginPath();
        ctx.moveTo(sx - 11 * s, sy - 8 * s + bob);
        ctx.lineTo(sx - 14 * s + sway * 0.5, sy + 22 * s);
        ctx.lineTo(sx + 14 * s - sway * 0.5, sy + 22 * s);
        ctx.lineTo(sx + 11 * s, sy - 8 * s + bob);
        ctx.closePath();
        ctx.fill();

        // Gold sash
        ctx.fillStyle = g.accent;
        ctx.fillRect(sx - 13 * s, sy + 2 * s + bob, 26 * s, 3);

        // Arms
        ctx.fillStyle = g.color;
        ctx.fillRect(sx - 20 * s, sy - 6 * s + bob, 6 * s, 16 * s);
        ctx.fillRect(sx + 14 * s, sy - 6 * s + bob, 6 * s, 16 * s);

        // Head
        ctx.fillStyle = "#ffe2c0";
        ctx.beginPath();
        ctx.arc(sx, sy - 18 * s + bob, 9 * s, 0, Math.PI * 2);
        ctx.fill();

        // Hair / beard in the god's own colour
        ctx.fillStyle = g.robe;
        ctx.beginPath();
        ctx.arc(sx, sy - 21 * s + bob, 9 * s, Math.PI, Math.PI * 2);
        ctx.fill();
        if (final || g.key === "zeus" || g.key === "poseidon" || g.key === "hephaestus") {
            ctx.fillStyle = "#f2f2f2";
            ctx.beginPath();
            ctx.moveTo(sx - 7 * s, sy - 15 * s + bob);
            ctx.lineTo(sx, sy - 2 * s + bob);
            ctx.lineTo(sx + 7 * s, sy - 15 * s + bob);
            ctx.fill();
        }

        // Glowing eyes
        ctx.fillStyle = g.accent;
        ctx.shadowColor = g.aura;
        ctx.shadowBlur = 8;
        ctx.fillRect(sx - 5 * s, sy - 19 * s + bob, 3 * s, 2 * s);
        ctx.fillRect(sx + 2 * s, sy - 19 * s + bob, 3 * s, 2 * s);
        ctx.shadowBlur = 0;

        // Laurel crown (a jagged lightning crown for the true Zeus)
        if (final) {
            ctx.strokeStyle = "#fff3b0";
            ctx.lineWidth = 2.5;
            ctx.shadowColor = "#ffee88";
            ctx.shadowBlur = 12;
            for (let i = -2; i <= 2; i++) {
                const bx = sx + i * 7 * s;
                ctx.beginPath();
                ctx.moveTo(bx, sy - 26 * s + bob);
                ctx.lineTo(bx + 3, sy - 34 * s + bob);
                ctx.lineTo(bx - 2, sy - 33 * s + bob);
                ctx.lineTo(bx + 2, sy - 42 * s + bob);
                ctx.stroke();
            }
            ctx.shadowBlur = 0;
        } else {
            ctx.strokeStyle = "#cdb15a";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(sx, sy - 20 * s + bob, 11 * s, Math.PI * 1.15, Math.PI * 1.85);
            ctx.stroke();
        }

        // The god's emblem, held aloft
        ctx.font = `${Math.round(17 * s)}px serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.globalAlpha = 0.95;
        ctx.fillText(final ? "⚡" : g.emblem, sx + 24 * s, sy - 14 * s + bob + Math.sin(time * 0.004) * 2);
        ctx.globalAlpha = 1;
        ctx.textBaseline = "alphabetic";

        ctx.restore();
    }

    renderProjectiles(ctx, camera, time) {
        for (const p of this.projectiles) {
            const px = p.x - camera.x;
            const py = p.y - camera.y;
            if (px < -40 || px > CANVAS_W + 40 || py < -40 || py > CANVAS_H + 40) continue;
            ctx.save();
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 10;

            switch (p.shape) {
                case "spear":
                case "arrow": {
                    const a = Math.atan2(p.vy, p.vx);
                    ctx.translate(px, py);
                    ctx.rotate(a);
                    ctx.fillStyle = p.color;
                    ctx.fillRect(-p.size * 2, -1.5, p.size * 3, 3);
                    ctx.fillStyle = p.accent;
                    ctx.beginPath();
                    ctx.moveTo(p.size * 1.6, 0);
                    ctx.lineTo(p.size * 0.4, -p.size * 0.6);
                    ctx.lineTo(p.size * 0.4, p.size * 0.6);
                    ctx.closePath();
                    ctx.fill();
                    break;
                }
                case "bolt": {
                    const a = Math.atan2(p.vy, p.vx);
                    ctx.translate(px, py);
                    ctx.rotate(a);
                    ctx.strokeStyle = p.accent || "#fff3b0";
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.moveTo(-p.size, -p.size * 0.5);
                    ctx.lineTo(0, 0);
                    ctx.lineTo(-p.size * 0.4, p.size * 0.4);
                    ctx.lineTo(p.size, -p.size * 0.2);
                    ctx.stroke();
                    break;
                }
                case "heart": {
                    ctx.fillStyle = p.color;
                    ctx.font = `${p.size * 2.4}px serif`;
                    ctx.textAlign = "center";
                    ctx.textBaseline = "middle";
                    ctx.fillText("❤", px, py);
                    ctx.textBaseline = "alphabetic";
                    break;
                }
                default: {
                    ctx.fillStyle = p.color;
                    ctx.beginPath();
                    ctx.arc(px, py, p.size, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = p.accent;
                    ctx.beginPath();
                    ctx.arc(px - p.size * 0.25, py - p.size * 0.25, p.size * 0.45, 0, Math.PI * 2);
                    ctx.fill();
                    break;
                }
            }
            ctx.restore();
        }
    }

    renderShockwaves(ctx, camera) {
        for (const w of this.shockwaves) {
            if (w.radius <= 0) continue;
            const sx = w.x - camera.x;
            const sy = w.y - camera.y;
            const fade = 1 - w.radius / w.maxRadius;
            ctx.save();
            ctx.strokeStyle = this.hexA(w.color, 0.15 + fade * 0.6);
            ctx.lineWidth = w.thickness * 0.9;
            ctx.beginPath();
            ctx.arc(sx, sy, w.radius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.strokeStyle = `rgba(255,255,255,${fade * 0.55})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(sx, sy, w.radius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }
    }

    renderStrikes(ctx, camera) {
        for (const s of this.strikes) {
            const sx = s.x - camera.x;
            const sy = s.y - camera.y;
            if (sx < -80 || sx > CANVAS_W + 80 || sy < -80 || sy > CANVAS_H + 80) continue;
            ctx.save();
            if (!s.detonated) {
                const charge = 1 - s.timer / s.warn;
                // Warning ring on the ground
                ctx.strokeStyle = this.hexA(s.color, 0.35 + charge * 0.5);
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(sx, sy, s.radius, 0, Math.PI * 2);
                ctx.stroke();
                ctx.fillStyle = this.hexA(s.color, 0.1 + charge * 0.22);
                ctx.beginPath();
                ctx.arc(sx, sy, s.radius * charge, 0, Math.PI * 2);
                ctx.fill();
            } else {
                const f = Math.max(0, s.fade / 260);
                if (s.kind === "bolt") {
                    // Jagged bolt slamming down from off-screen
                    ctx.strokeStyle = `rgba(255, 245, 170, ${f})`;
                    ctx.shadowColor = "#ffee88";
                    ctx.shadowBlur = 16;
                    ctx.lineWidth = 5;
                    ctx.beginPath();
                    ctx.moveTo(sx, sy - 400);
                    for (let i = 1; i <= 8; i++) {
                        ctx.lineTo(sx + Math.sin(i * 2.7 + s.x) * 14, sy - 400 + (400 / 8) * i);
                    }
                    ctx.stroke();
                    ctx.shadowBlur = 0;
                }
                ctx.fillStyle = this.hexA(s.color, f * 0.8);
                ctx.beginPath();
                ctx.arc(sx, sy, s.radius * (1 + (1 - f) * 0.25), 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = `rgba(255,255,255,${f})`;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(sx, sy, s.radius * (1 + (1 - f) * 0.25), 0, Math.PI * 2);
                ctx.stroke();
            }
            ctx.restore();
        }
    }

    hexA(hex, alpha) {
        const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        if (!m) return `rgba(255,255,255,${alpha})`;
        return `rgba(${parseInt(m[1], 16)}, ${parseInt(m[2], 16)}, ${parseInt(m[3], 16)}, ${alpha})`;
    }
}
