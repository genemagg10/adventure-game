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
        this.mana = PLAYER_DEFAULTS.maxMana;
        this.maxMana = PLAYER_DEFAULTS.maxMana;
        this.speed = PLAYER_DEFAULTS.speed;
        this.gold = 50;
        this.blueGems = 0;
        this.totalGemsNeeded = 5;

        // Weapons
        this.weapons = ["rusty_sword"];
        this.currentWeapon = "rusty_sword";

        // Elements
        this.elements = {};
        this.activeElement = null;
        this.elementUnlockOrder = ["fire", "water", "ice", "lightning"];
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
        this.potions = [];
        this.shieldActive = false;
        this.shieldHits = 0;

        // Element cooldown
        this.elementCooldown = 0;

        // Animation
        this.walkFrame = 0;
        this.walkTimer = 0;
        this.flashTimer = 0;

        // Stats
        this.monstersKilled = 0;
    }

    getWeapon() {
        return WEAPONS[this.currentWeapon];
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

        // Clamp to world bounds
        this.x = clamp(this.x, this.size, WORLD_W * TILE_SIZE - this.size);
        this.y = clamp(this.y, this.size, WORLD_H * TILE_SIZE - this.size);

        // Mana regeneration
        this.mana = Math.min(this.maxMana, this.mana + PLAYER_DEFAULTS.manaRegen * dt);

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
        return true;
    }

    useElement() {
        if (!this.activeElement) return null;
        const elem = ELEMENTS[this.activeElement];
        if (this.mana < elem.manaCost) return null;
        if (this.elementCooldown > 0) return null;

        this.mana -= elem.manaCost;
        this.elementCooldown = 800;
        return this.activeElement;
    }

    takeDamage(amount, fromX, fromY) {
        if (this.invincible) return false;

        // Shield check
        if (this.shieldActive) {
            this.shieldHits--;
            if (this.shieldHits <= 0) this.shieldActive = false;
            return false;
        }

        this.hp -= amount;
        this.invincible = true;
        this.invincibleTimer = PLAYER_DEFAULTS.iframes;
        this.flashTimer = 200;

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

        // Attack swoosh
        if (this.attacking) {
            ctx.strokeStyle = this.activeElement ? ELEMENTS[this.activeElement].color : "rgba(255,255,255,0.4)";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(sx, sy, weapon.range, angle - 0.8, angle + 0.8);
            ctx.stroke();
        }
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
            gem: false,
        };

        if (this.weaponDrop && Math.random() < 0.3) {
            drops.weapon = this.weaponDrop;
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
        this.hp = BOSS.hp;
        this.maxHp = BOSS.hp;
        this.damage = BOSS.damage;
        this.size = BOSS.size;
        this.speed = BOSS.speed;
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
        for (let i = BOSS.phases.length - 1; i >= 0; i--) {
            if (hpPercent <= BOSS.phases[i].hpThreshold) {
                return BOSS.phases[i];
            }
        }
        return BOSS.phases[0];
    }

    spawn() {
        this.spawned = true;
        this.spawnAnimation = 2000;
    }

    update(dt, player, world) {
        if (!this.alive || !this.spawned) return null;

        // Spawn animation
        if (this.spawnAnimation > 0) {
            this.spawnAnimation -= dt;
            return null;
        }

        const phase = this.getCurrentPhase();
        const distToPlayer = dist(this.x, this.y, player.x, player.y);
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
            this.x += this.chargeDir.x * spd * 4;
            this.y += this.chargeDir.y * spd * 4;

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

        // Chase player
        const norm = normalize(player.x - this.x, player.y - this.y);
        this.x += norm.x * spd;
        this.y += norm.y * spd;
        this.facing = norm;

        // Walk animation
        this.walkTimer += dt;
        if (this.walkTimer > 180) {
            this.walkFrame = (this.walkFrame + 1) % 4;
            this.walkTimer = 0;
        }

        // Knockback
        this.x += this.knockbackVx;
        this.y += this.knockbackVy;
        this.knockbackVx *= 0.9;
        this.knockbackVy *= 0.9;
        if (Math.abs(this.knockbackVx) < 0.1) this.knockbackVx = 0;
        if (Math.abs(this.knockbackVy) < 0.1) this.knockbackVy = 0;

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
        ctx.fillStyle = BOSS.color;
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
