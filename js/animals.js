// ============================================
// Ingoizer's World - Animal Companions
// ============================================
//
// Harmless critters roam each biome. Feed one an apple and it becomes a
// companion that follows you and fights whatever threatens you - until it dies.

class Animal {
    constructor(type, x, y) {
        const def = ANIMAL_TYPES[type];
        this.type = type;
        this.name = def.name;
        this.icon = def.icon;
        this.color = def.color;
        this.accent = def.accent;
        this.flavor = def.flavor;

        this.x = x;
        this.y = y;
        this.homeX = x;
        this.homeY = y;

        this.hp = def.hp;
        this.maxHp = def.hp;
        this.damage = def.damage;
        this.speed = def.speed;
        this.size = def.size;

        this.tamed = false;
        this.alive = true;
        this.deathTimer = 0;
        this.followIndex = 0;

        // AI / animation state
        this.facing = { x: 0, y: 1 };
        this.state = "idle";
        this.stateTimer = randFloat(500, 2500);
        this.wanderTarget = null;
        this.curious = false;
        this.walkFrame = 0;
        this.walkTimer = 0;
        this.hopPhase = Math.random() * Math.PI * 2;
        this.flashTimer = 0;
        this.tameGlow = 0;

        // Combat
        this.attacking = false;
        this.attackTimer = 0;
        this.lastAttackTime = 0;
        this.lastHurtTime = 0;
        this.target = null;
        this.knockbackVx = 0;
        this.knockbackVy = 0;
        this.stuckTimer = 0;
    }

    // Feed an apple: the animal joins the pack for good.
    tame(followIndex) {
        this.tamed = true;
        this.followIndex = followIndex;
        this.tameGlow = 1600;
        this.state = "follow";
        this.wanderTarget = null;
        this.curious = false;
    }

    // Hostiles the companion is willing to pick a fight with: alive, actually
    // present (bosses spawn in with an animation), and near the player.
    isEngageable(hostile, player) {
        if (!hostile || !hostile.alive) return false;
        if (hostile.spawned === false) return false;
        if (hostile.spawnAnimation > 0) return false;
        return dist(hostile.x, hostile.y, player.x, player.y) < ANIMAL_CONFIG.aggroRange;
    }

    findTarget(player, hostiles) {
        let best = null;
        let bestDist = Infinity;
        for (const h of hostiles) {
            if (!this.isEngageable(h, player)) continue;
            const d = dist(this.x, this.y, h.x, h.y);
            if (d < bestDist) {
                bestDist = d;
                best = h;
            }
        }
        return best;
    }

    // Returns an array of hit results ({ target, damage, killed, isBoss }) so the
    // game can hand kills to onEntityKilled, matching the player's attack flow.
    update(dt, player, world, hostiles, combat) {
        if (!this.alive) {
            this.deathTimer -= dt;
            return [];
        }

        if (this.flashTimer > 0) this.flashTimer -= dt;
        if (this.tameGlow > 0) this.tameGlow -= dt;
        if (this.attacking) {
            this.attackTimer -= dt;
            if (this.attackTimer <= 0) this.attacking = false;
        }

        const hits = [];
        let moveX = 0, moveY = 0;

        if (this.tamed) {
            const move = this.updateCompanion(dt, player, hostiles, combat, hits);
            moveX = move.x;
            moveY = move.y;
        } else {
            const move = this.updateWild(dt, player);
            moveX = move.x;
            moveY = move.y;
        }

        // Knockback decay
        moveX += this.knockbackVx;
        moveY += this.knockbackVy;
        this.knockbackVx *= 0.85;
        this.knockbackVy *= 0.85;
        if (Math.abs(this.knockbackVx) < 0.1) this.knockbackVx = 0;
        if (Math.abs(this.knockbackVy) < 0.1) this.knockbackVy = 0;

        // Move, going around whatever is in the way rather than into it.
        const beforeX = this.x, beforeY = this.y;
        this.stepWithSteering(world, moveX, moveY);
        const gained = dist(beforeX, beforeY, this.x, this.y);

        // A companion that is trying to walk and getting nowhere has found a
        // piece of landscape it cannot solve. Give it a moment, then let it
        // scamper up rather than losing it behind a hedge for ever.
        if (this.tamed) {
            const trying = Math.abs(moveX) + Math.abs(moveY) > 0.35;
            this.stuckTimer = trying && gained < 0.2 ? this.stuckTimer + dt : 0;
            const behind = dist(this.x, this.y, player.x, player.y);
            const lost = behind > ANIMAL_CONFIG.recallRange;
            const wedged = this.stuckTimer > ANIMAL_CONFIG.unstickTime &&
                behind > ANIMAL_CONFIG.followDistance * 1.8;
            if (lost || wedged) this.scamperTo(player, world);
        }

        // Hop / walk animation
        if (Math.abs(moveX) > 0.1 || Math.abs(moveY) > 0.1) {
            this.walkTimer += dt;
            if (this.walkTimer > 140) {
                this.walkFrame = (this.walkFrame + 1) % 4;
                this.walkTimer = 0;
            }
            this.facing = normalize(moveX, moveY);
        }
        this.hopPhase += dt * 0.006;

        return hits;
    }

    // One axis-separated step, the same rule the player and the monsters use.
    // Returns how much ground it actually gained.
    tryStep(world, moveX, moveY) {
        const fromX = this.x, fromY = this.y;
        const tileX = worldToTile(this.x + moveX, this.y);
        if (!world.isSolid(tileX.x, tileX.y)) this.x += moveX;
        const tileY = worldToTile(this.x, this.y + moveY);
        if (!world.isSolid(tileY.x, tileY.y)) this.y += moveY;
        return dist(fromX, fromY, this.x, this.y);
    }

    // Walking straight at a tree used to stop an animal dead and leave it
    // pressed against the trunk for good. When the heading it wants is refused,
    // sweep outward from it - alternating sides, so the detour taken is the
    // shallowest one that works.
    //
    // Candidates are scored by ground gained *towards where it was going*, not
    // by how far it moved: squeezing sideways past a trunk counts for something
    // and wandering off at a right angle does not.
    stepWithSteering(world, moveX, moveY) {
        const wanted = Math.hypot(moveX, moveY);
        if (wanted < 0.01) return;

        const fromX = this.x, fromY = this.y;
        const ux = moveX / wanted, uy = moveY / wanted;
        const enough = wanted * 0.7;

        // The heading it actually wants, first.
        this.tryStep(world, moveX, moveY);
        let best = { x: this.x, y: this.y, score: (this.x - fromX) * ux + (this.y - fromY) * uy };
        if (best.score >= enough) return;

        const base = Math.atan2(moveY, moveX);
        for (const spread of ANIMAL_STEER_ANGLES) {
            for (const side of [1, -1]) {
                this.x = fromX;
                this.y = fromY;
                const a = base + spread * side;
                this.tryStep(world, Math.cos(a) * wanted, Math.sin(a) * wanted);
                const score = (this.x - fromX) * ux + (this.y - fromY) * uy;
                if (score > best.score) best = { x: this.x, y: this.y, score };
                if (best.score >= enough) break;
            }
            if (best.score >= enough) break;
        }

        this.x = best.x;
        this.y = best.y;
    }

    // Give up on the landscape and reappear at the player's heel, on the first
    // clear ground going round them.
    scamperTo(player, world) {
        for (let i = 0; i < 14; i++) {
            const a = (i / 7) * Math.PI + i * 0.37;
            const r = 24 + (i % 3) * 11;
            const nx = player.x + Math.cos(a) * r;
            const ny = player.y + Math.sin(a) * r;
            const t = worldToTile(nx, ny);
            if (world.isSolid(t.x, t.y)) continue;
            this.x = nx;
            this.y = ny;
            break;
        }
        this.stuckTimer = 0;
        this.knockbackVx = 0;
        this.knockbackVy = 0;
        this.tameGlow = 420;   // a small puff, so it reads as arriving
    }

    updateCompanion(dt, player, hostiles, combat, hits) {
        const distToPlayer = dist(this.x, this.y, player.x, player.y);

        // Stay close: if the fight dragged us too far from the player, break off.
        let target = distToPlayer > ANIMAL_CONFIG.leashRange ? null : this.findTarget(player, hostiles);
        this.target = target;

        if (target) {
            const reach = ANIMAL_CONFIG.attackRange + target.size;
            const d = dist(this.x, this.y, target.x, target.y);
            this.facing = normalize(target.x - this.x, target.y - this.y);

            if (d > reach) {
                return { x: this.facing.x * this.speed, y: this.facing.y * this.speed };
            }

            const now = Date.now();
            if (now - this.lastAttackTime > ANIMAL_CONFIG.attackCooldown) {
                this.lastAttackTime = now;
                this.attacking = true;
                this.attackTimer = 200;
                const killed = target.takeDamage(this.damage, this.x, this.y);
                if (combat) {
                    combat.spawnHitParticles(target.x, target.y, this.accent, 4);
                    combat.addDamageNumber(target.x, target.y, this.damage, false);
                }
                // The caller tags bosses - it knows which entity is which realm's
                // boss, and there is more than one boss class in the game.
                hits.push({ target, damage: this.damage, killed });
            }

            // Standing toe to toe with a monster hurts.
            this.takeContactDamage(hostiles, player);
            return { x: 0, y: 0 };
        }

        this.takeContactDamage(hostiles, player);

        // No target: trail the player in a loose fan behind them.
        const slotOffset = (this.followIndex - (ANIMAL_CONFIG.maxCompanions - 1) / 2) * 0.55;
        const behindAngle = dirToAngle(-player.facing.x, -player.facing.y) + slotOffset;
        const spotX = player.x + Math.cos(behindAngle) * ANIMAL_CONFIG.followDistance;
        const spotY = player.y + Math.sin(behindAngle) * ANIMAL_CONFIG.followDistance;
        const dSpot = dist(this.x, this.y, spotX, spotY);

        if (dSpot < 8) return { x: 0, y: 0 };

        // A companion has to be able to out-walk the player or it can never
        // close a gap, and half the roster is slower on its feet than Ingoizer
        // is - a toad or a turtle fell behind once and stayed behind for the
        // rest of the game. A trailing animal borrows its pace from him rather
        // than using its own; its own speed still decides how it hunts and
        // wanders, which is where the difference belongs.
        const pace = player.speed || PLAYER_DEFAULTS.speed;
        let spd = this.speed;
        if (distToPlayer > ANIMAL_CONFIG.sprintRange) {
            spd = Math.max(this.speed * ANIMAL_CONFIG.sprintSelf, pace * ANIMAL_CONFIG.sprintFloor);
        }
        if (distToPlayer > ANIMAL_CONFIG.aggroRange) {
            spd = Math.max(this.speed * ANIMAL_CONFIG.dashSelf, pace * ANIMAL_CONFIG.dashFloor);
        }

        const norm = normalize(spotX - this.x, spotY - this.y);
        const step = Math.min(spd, dSpot);
        return { x: norm.x * step, y: norm.y * step };
    }

    takeContactDamage(hostiles, player) {
        const now = Date.now();
        if (now - this.lastHurtTime < ANIMAL_CONFIG.hurtCooldown) return;

        for (const h of hostiles) {
            if (!this.isEngageable(h, player)) continue;
            if (dist(this.x, this.y, h.x, h.y) > this.size + h.size + 4) continue;
            this.lastHurtTime = now;
            this.takeDamage(h.damage, h.x, h.y);
            return;
        }
    }

    updateWild(dt, player) {
        const distToPlayer = dist(this.x, this.y, player.x, player.y);
        this.curious = distToPlayer < 90 && player.apples > 0;

        // Skittish around empty-handed adventurers, curious about apples.
        if (this.curious) {
            if (distToPlayer < 70) {
                this.facing = normalize(player.x - this.x, player.y - this.y);
                return { x: 0, y: 0 };
            }
        } else if (distToPlayer < ANIMAL_CONFIG.skittishRange) {
            const away = normalize(this.x - player.x, this.y - player.y);
            this.facing = away;
            return { x: away.x * this.speed * 0.7, y: away.y * this.speed * 0.7 };
        }

        // Gentle wandering around the spot where it was born.
        switch (this.state) {
            case "wander": {
                if (!this.wanderTarget) {
                    this.state = "idle";
                    this.stateTimer = randFloat(800, 2600);
                    break;
                }
                const norm = normalize(this.wanderTarget.x - this.x, this.wanderTarget.y - this.y);
                if (dist(this.x, this.y, this.wanderTarget.x, this.wanderTarget.y) < 10) {
                    this.state = "idle";
                    this.stateTimer = randFloat(800, 2600);
                    this.wanderTarget = null;
                    break;
                }
                return { x: norm.x * this.speed * 0.45, y: norm.y * this.speed * 0.45 };
            }
            default:
                this.stateTimer -= dt;
                if (this.stateTimer <= 0) {
                    this.state = "wander";
                    this.wanderTarget = {
                        x: this.homeX + randFloat(-90, 90),
                        y: this.homeY + randFloat(-90, 90),
                    };
                }
                break;
        }

        return { x: 0, y: 0 };
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
            this.hp = 0;
            this.alive = false;
            this.deathTimer = ANIMAL_CONFIG.deathFadeTime;
            return true;
        }
        return false;
    }

    // ----- Rendering -----

    render(ctx, camera, time) {
        const sx = this.x - camera.x;
        const sy = this.y - camera.y;
        if (sx < -40 || sx > CANVAS_W + 40 || sy < -40 || sy > CANVAS_H + 40) return;

        ctx.save();

        if (!this.alive) {
            ctx.globalAlpha = Math.max(0, this.deathTimer / ANIMAL_CONFIG.deathFadeTime);
            this.renderBody(ctx, sx, sy, time);
            ctx.restore();
            return;
        }

        // Damage flash
        if (this.flashTimer > 0 && Math.floor(time / 60) % 2 === 0) {
            ctx.globalCompositeOperation = "lighter";
        }

        this.renderBody(ctx, sx, sy, time);
        ctx.globalCompositeOperation = "source-over";

        // Freshly tamed sparkle
        if (this.tameGlow > 0) {
            ctx.globalAlpha = Math.min(1, this.tameGlow / 1600);
            ctx.fillStyle = "#ff6688";
            ctx.font = "12px monospace";
            ctx.textAlign = "center";
            ctx.fillText("♥", sx, sy - this.size - 12 - Math.sin(time * 0.006) * 2);
            ctx.globalAlpha = 1;
        }

        // Curious critters show an apple thought bubble
        if (!this.tamed && this.curious) {
            this.renderThoughtApple(ctx, sx, sy - this.size - 14, time);
        }

        // Health bar once hurt
        if (this.hp < this.maxHp) {
            const barW = this.size * 2;
            const barX = sx - barW / 2;
            const barY = sy - this.size - 9;
            ctx.fillStyle = "#333";
            ctx.fillRect(barX, barY, barW, 3);
            ctx.fillStyle = this.tamed ? "#66dd66" : "#ff4444";
            ctx.fillRect(barX, barY, barW * (this.hp / this.maxHp), 3);
        }

        ctx.restore();
    }

    renderThoughtApple(ctx, sx, sy, time) {
        const bob = Math.sin(time * 0.005) * 2;
        ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
        ctx.beginPath();
        ctx.arc(sx, sy + bob, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#d63b2f";
        ctx.beginPath();
        ctx.arc(sx, sy + bob + 1, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#6a4a2a";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(sx, sy + bob - 3);
        ctx.lineTo(sx + 1, sy + bob - 6);
        ctx.stroke();
        ctx.fillStyle = "#4a8a2a";
        ctx.beginPath();
        ctx.ellipse(sx + 3, sy + bob - 5, 2.5, 1.5, -0.5, 0, Math.PI * 2);
        ctx.fill();
    }

    renderBody(ctx, sx, sy, time) {
        // Lunge forward mid-attack
        const lunge = this.attacking ? Math.sin((200 - this.attackTimer) / 200 * Math.PI) * 5 : 0;
        const bx = sx + this.facing.x * lunge;
        const by = sy + this.facing.y * lunge;

        // Shadow stays on the ground
        ctx.fillStyle = "rgba(0,0,0,0.28)";
        ctx.beginPath();
        ctx.ellipse(bx, sy + this.size * 0.85, this.size * 0.75, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Tamed companions wear a small collar glow underfoot
        if (this.tamed) {
            ctx.strokeStyle = "rgba(120, 230, 160, 0.35)";
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.ellipse(bx, sy + this.size * 0.85, this.size * 0.9, 4, 0, 0, Math.PI * 2);
            ctx.stroke();
        }

        const faceRight = this.facing.x >= 0;
        switch (this.type) {
            case "rabbit": this.renderRabbit(ctx, bx, by, faceRight, time); break;
            case "fox": this.renderFox(ctx, bx, by, faceRight, time); break;
            case "toad": this.renderToad(ctx, bx, by, faceRight, time); break;
            case "owl": this.renderOwl(ctx, bx, by, faceRight, time); break;
            case "turtle": this.renderTurtle(ctx, bx, by, faceRight, time); break;
        }
    }

    // Small vertical hop used by the ground critters
    hopOffset(amount) {
        const moving = this.walkTimer > 0 || this.state === "wander" || this.tamed;
        if (!moving) return 0;
        return -Math.abs(Math.sin(this.hopPhase * 2)) * amount;
    }

    renderRabbit(ctx, sx, sy, faceRight, time) {
        const hop = this.hopOffset(3);
        const dir = faceRight ? 1 : -1;
        const y = sy + hop;

        // Ears
        ctx.fillStyle = this.color;
        for (const ex of [-3, 3]) {
            ctx.save();
            ctx.translate(sx + ex + dir * 2, y - 8);
            ctx.rotate(ex * 0.06);
            ctx.beginPath();
            ctx.ellipse(0, 0, 2, 7, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "#e8a0a8";
            ctx.beginPath();
            ctx.ellipse(0, 1, 1, 4.5, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = this.color;
            ctx.restore();
        }

        // Tail puff
        ctx.fillStyle = this.accent;
        ctx.beginPath();
        ctx.arc(sx - dir * 9.5, y + 1, 3.2, 0, Math.PI * 2);
        ctx.fill();

        // Body + head
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.ellipse(sx, y + 2, 8, 6.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(sx + dir * 4, y - 3, 5, 0, Math.PI * 2);
        ctx.fill();

        // Face
        ctx.fillStyle = "#2a2a2a";
        ctx.beginPath();
        ctx.arc(sx + dir * 6, y - 4, 1.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#e8a0a8";
        ctx.beginPath();
        ctx.arc(sx + dir * 8.5, y - 2, 1.2, 0, Math.PI * 2);
        ctx.fill();
    }

    renderFox(ctx, sx, sy, faceRight, time) {
        const hop = this.hopOffset(2);
        const dir = faceRight ? 1 : -1;
        const y = sy + hop;

        // Bushy tail with a white tip
        ctx.fillStyle = this.color;
        ctx.save();
        ctx.translate(sx - dir * 9, y + 1);
        ctx.rotate(dir * (-0.5 + Math.sin(time * 0.004) * 0.15));
        ctx.beginPath();
        ctx.ellipse(-dir * 5, 0, 6.5, 3.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = this.accent;
        ctx.beginPath();
        ctx.arc(-dir * 10, 0, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Body
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.ellipse(sx, y + 2, 9, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Legs
        ctx.fillStyle = "#5a3a24";
        ctx.fillRect(sx - dir * 3, y + 6, 2.5, 5);
        ctx.fillRect(sx + dir * 4, y + 6, 2.5, 5);

        // Head
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(sx + dir * 6, y - 3, 5.5, 0, Math.PI * 2);
        ctx.fill();

        // Pointed ears
        for (const ex of [-2.5, 3]) {
            ctx.beginPath();
            ctx.moveTo(sx + dir * 6 + ex, y - 6);
            ctx.lineTo(sx + dir * 6 + ex + dir * 1.5, y - 12);
            ctx.lineTo(sx + dir * 6 + ex + dir * 3.5, y - 6);
            ctx.fill();
        }

        // Snout + eye
        ctx.fillStyle = this.accent;
        ctx.beginPath();
        ctx.ellipse(sx + dir * 10, y - 1.5, 3, 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#2a2a2a";
        ctx.beginPath();
        ctx.arc(sx + dir * 12.5, y - 1.5, 1, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(sx + dir * 7.5, y - 4, 1.2, 0, Math.PI * 2);
        ctx.fill();
    }

    renderToad(ctx, sx, sy, faceRight, time) {
        const hop = this.hopOffset(4);
        const dir = faceRight ? 1 : -1;
        const y = sy + hop;

        // Squat body
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.ellipse(sx, y + 3, 10, 6.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Belly
        ctx.fillStyle = this.accent;
        ctx.beginPath();
        ctx.ellipse(sx, y + 5.5, 6, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Back spots
        ctx.fillStyle = "rgba(30, 70, 25, 0.55)";
        ctx.beginPath();
        ctx.arc(sx - 4, y + 1, 1.6, 0, Math.PI * 2);
        ctx.arc(sx + 3, y + 2, 1.3, 0, Math.PI * 2);
        ctx.fill();

        // Webbed feet
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.ellipse(sx - 8, y + 8, 3.5, 2, 0.3, 0, Math.PI * 2);
        ctx.ellipse(sx + 8, y + 8, 3.5, 2, -0.3, 0, Math.PI * 2);
        ctx.fill();

        // Bulging eyes
        for (const ex of [-4, 4]) {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(sx + ex, y - 4, 3.4, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "#f6f0d8";
            ctx.beginPath();
            ctx.arc(sx + ex, y - 4.5, 2.4, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "#1a1a1a";
            ctx.beginPath();
            ctx.arc(sx + ex + dir * 0.8, y - 4.5, 1.2, 0, Math.PI * 2);
            ctx.fill();
        }

        // Wide grin
        ctx.strokeStyle = "rgba(30, 60, 25, 0.7)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(sx, y + 1, 5, 0.15 * Math.PI, 0.85 * Math.PI);
        ctx.stroke();
    }

    renderOwl(ctx, sx, sy, faceRight, time) {
        const float = Math.sin(time * 0.004 + this.hopPhase) * 2;
        const dir = faceRight ? 1 : -1;
        const y = sy + float;

        // Wings flare when attacking
        const flap = this.attacking ? 4 : Math.sin(time * 0.006) * 1.2;
        ctx.fillStyle = "#7a5f3c";
        ctx.beginPath();
        ctx.ellipse(sx - 9, y - flap, 4, 7, -0.4, 0, Math.PI * 2);
        ctx.ellipse(sx + 9, y - flap, 4, 7, 0.4, 0, Math.PI * 2);
        ctx.fill();

        // Body
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.ellipse(sx, y, 9, 11, 0, 0, Math.PI * 2);
        ctx.fill();

        // Speckled chest
        ctx.fillStyle = this.accent;
        ctx.beginPath();
        ctx.ellipse(sx, y + 3, 5.5, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "rgba(120, 95, 60, 0.5)";
        ctx.beginPath();
        ctx.arc(sx - 1.5, y + 2, 1, 0, Math.PI * 2);
        ctx.arc(sx + 2, y + 5, 1, 0, Math.PI * 2);
        ctx.fill();

        // Ear tufts
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(sx - 7, y - 8);
        ctx.lineTo(sx - 8, y - 14);
        ctx.lineTo(sx - 3, y - 9);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(sx + 7, y - 8);
        ctx.lineTo(sx + 8, y - 14);
        ctx.lineTo(sx + 3, y - 9);
        ctx.fill();

        // Big eyes
        for (const ex of [-3.5, 3.5]) {
            ctx.fillStyle = "#f6f0d8";
            ctx.beginPath();
            ctx.arc(sx + ex, y - 4, 3.4, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "#1a1a1a";
            ctx.beginPath();
            ctx.arc(sx + ex + dir * 0.7, y - 4, 1.7, 0, Math.PI * 2);
            ctx.fill();
        }

        // Beak
        ctx.fillStyle = "#e0a33a";
        ctx.beginPath();
        ctx.moveTo(sx - 2, y - 1);
        ctx.lineTo(sx + 2, y - 1);
        ctx.lineTo(sx, y + 2.5);
        ctx.fill();

        // Talons
        ctx.fillStyle = "#e0a33a";
        ctx.fillRect(sx - 4, y + 10, 3, 2);
        ctx.fillRect(sx + 1, y + 10, 3, 2);
    }

    renderTurtle(ctx, sx, sy, faceRight, time) {
        const sway = Math.sin(this.hopPhase * 1.5) * 1;
        const dir = faceRight ? 1 : -1;
        const y = sy + sway;

        // Stubby legs
        ctx.fillStyle = "#6ab98a";
        ctx.beginPath();
        ctx.ellipse(sx - 8, y + 6, 3.5, 2.5, 0.3, 0, Math.PI * 2);
        ctx.ellipse(sx + 8, y + 6, 3.5, 2.5, -0.3, 0, Math.PI * 2);
        ctx.fill();

        // Head
        ctx.fillStyle = "#6ab98a";
        ctx.beginPath();
        ctx.ellipse(sx + dir * 11, y + 1, 4.5, 3.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#1a1a1a";
        ctx.beginPath();
        ctx.arc(sx + dir * 12.5, y, 1.1, 0, Math.PI * 2);
        ctx.fill();

        // Shell dome
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.ellipse(sx, y, 11, 9, 0, Math.PI, 0);
        ctx.fill();
        ctx.fillStyle = this.accent;
        ctx.beginPath();
        ctx.ellipse(sx, y, 11, 3, 0, 0, Math.PI);
        ctx.fill();

        // Shell plates
        ctx.strokeStyle = "rgba(20, 60, 45, 0.6)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(sx, y, 5.5, Math.PI, 0);
        ctx.stroke();
        for (const px of [-6, 0, 6]) {
            ctx.beginPath();
            ctx.moveTo(sx + px * 0.55, y - 5);
            ctx.lineTo(sx + px, y);
            ctx.stroke();
        }
    }
}
