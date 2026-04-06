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

        // Health potion inventory
        this.healthPotions = 0;        // regular potions (heal 40)
        this.greaterHealthPotions = 0; // greater potions (heal 80)

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
        if (this.hasGauntlet) dmg += 4;
        if (this.purpleGemAttack) dmg += PURPLE_GEMS.attack.bonus;
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
            if (this.walkTimer > 150) {
                this.walkFrame = (this.walkFrame + 1) % 4;
                this.walkTimer = 0;
            }
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
        const sx = this.x - camera.x;
        const sy = this.y - camera.y;

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

        // Body - knight in armor
        const bobY = Math.sin(this.walkFrame * Math.PI / 2) * 2;

        // Shadow
        ctx.fillStyle = "rgba(0,0,0,0.3)";
        ctx.beginPath();
        ctx.ellipse(sx, sy + this.size + 2, this.size * 0.8, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Legs
        const legSpread = Math.sin(this.walkFrame * Math.PI / 2) * 3;
        ctx.fillStyle = "#2266aa";
        ctx.fillRect(sx - 5 - legSpread, sy + 4, 4, 10);
        ctx.fillRect(sx + 1 + legSpread, sy + 4, 4, 10);

        // Body armor
        ctx.fillStyle = COLORS.player;
        ctx.fillRect(sx - 8, sy - 6 + bobY, 16, 14);

        // Armor detail
        ctx.fillStyle = "#4499dd";
        ctx.fillRect(sx - 6, sy - 4 + bobY, 12, 10);

        // Belt
        ctx.fillStyle = "#8b6914";
        ctx.fillRect(sx - 8, sy + 4 + bobY, 16, 3);

        // Head
        ctx.fillStyle = "#ffcc88";
        ctx.beginPath();
        ctx.arc(sx, sy - 10 + bobY, 7, 0, Math.PI * 2);
        ctx.fill();

        // Helmet
        ctx.fillStyle = "#aaaacc";
        ctx.beginPath();
        ctx.arc(sx, sy - 12 + bobY, 7, Math.PI, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(sx - 7, sy - 12 + bobY, 14, 3);

        // Eyes
        ctx.fillStyle = "#333";
        if (this.facing.x >= 0) {
            ctx.fillRect(sx + 1, sy - 11 + bobY, 2, 2);
            ctx.fillRect(sx - 4, sy - 11 + bobY, 2, 2);
        } else {
            ctx.fillRect(sx - 3, sy - 11 + bobY, 2, 2);
            ctx.fillRect(sx + 2, sy - 11 + bobY, 2, 2);
        }

        // Render weapon
        this.renderWeapon(ctx, sx, sy + bobY, time);

        // Render quiver on back
        this.renderQuiver(ctx, sx, sy + bobY);

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
            : dirToAngle(this.facing.x, this.facing.y);

        const weaponLen = weapon.range * 0.8;
        const wx = sx + Math.cos(angle) * 12;
        const wy = sy - 2 + Math.sin(angle) * 12;
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

    renderQuiver(ctx, sx, sy) {
        // Quiver on back (right side)
        ctx.fillStyle = "#654321";
        ctx.fillRect(sx + 7, sy - 10, 3, 14);

        // Arrow tips sticking out of quiver
        if (this.arrows > 0) {
            const showArrows = Math.min(3, this.arrows);
            ctx.fillStyle = "#aaaacc";
            for (let i = 0; i < showArrows; i++) {
                ctx.fillRect(sx + 6 + i * 2, sy - 13, 1, 4);
            }
            // Fletching
            ctx.fillStyle = "#cc4444";
            for (let i = 0; i < showArrows; i++) {
                ctx.fillRect(sx + 6 + i * 2, sy - 13, 1, 1);
            }
        }
    }

    renderBowShot(ctx, sx, sy) {
        const angle = dirToAngle(this.facing.x, this.facing.y);
        const progress = 1 - this.shootTimer / 150;

        // Bow (curved arc)
        ctx.save();
        ctx.translate(sx + Math.cos(angle) * 10, sy - 2 + Math.sin(angle) * 10);
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

        // Health bar
        if (this.hp < this.maxHp) {
            const barW = this.size * 2;
            const barH = 3;
            const barX = sx - barW / 2;
            const barY = sy - this.size - 10;
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
