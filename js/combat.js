// ============================================
// Ingoizer's World - Combat & Effects System
// ============================================

class CombatSystem {
    constructor() {
        this.particles = [];
        this.damageNumbers = [];
        this.elementEffects = [];
        this.arrowProjectiles = [];
    }

    // Check player attack hitting monsters
    checkPlayerAttack(player, monsters, boss) {
        if (!player.attacking) return [];

        const weapon = player.getWeapon();
        const attackAngle = player.attackAngle;
        const range = weapon.range;
        const hits = [];
        const enchantElement = player.enchantments[player.currentWeapon];

        // Check monsters
        for (const monster of monsters) {
            if (!monster.alive) continue;
            if (player.attackHitTargets && player.attackHitTargets.has(monster)) continue;
            const d = dist(player.x, player.y, monster.x, monster.y);
            if (d > range + monster.size) continue;

            // Angle check (arc attack)
            const angleToMonster = dirToAngle(monster.x - player.x, monster.y - player.y);
            let angleDiff = Math.abs(angleToMonster - attackAngle);
            if (angleDiff > Math.PI) angleDiff = Math.PI * 2 - angleDiff;
            if (angleDiff > Math.PI / 3) continue;

            if (player.attackHitTargets) player.attackHitTargets.add(monster);
            let damage = weapon.damage;

            // Critical hit
            let crit = false;
            if (Math.random() < 0.15) {
                damage = Math.floor(damage * 1.8);
                crit = true;
            }

            const killed = monster.takeDamage(damage, player.x, player.y);
            hits.push({ target: monster, damage, killed, crit });

            // Hit particles
            this.spawnHitParticles(monster.x, monster.y, "#ff4444", 5);

            // Enchantment hit effect
            if (enchantElement) {
                this.spawnEnchantHitEffect(enchantElement, player, monster);
            }

            // Damage number
            this.addDamageNumber(monster.x, monster.y, damage, crit);
        }

        // Check boss
        if (boss && boss.alive && boss.spawned && boss.spawnAnimation <= 0) {
            if (player.attackHitTargets && player.attackHitTargets.has(boss)) return hits;
            const d = dist(player.x, player.y, boss.x, boss.y);
            if (d <= range + boss.size) {
                const angleToTarget = dirToAngle(boss.x - player.x, boss.y - player.y);
                let angleDiff = Math.abs(angleToTarget - attackAngle);
                if (angleDiff > Math.PI) angleDiff = Math.PI * 2 - angleDiff;

                if (angleDiff <= Math.PI / 3) {
                    if (player.attackHitTargets) player.attackHitTargets.add(boss);
                    let damage = weapon.damage;
                    let crit = false;
                    if (Math.random() < 0.12) {
                        damage = Math.floor(damage * 1.6);
                        crit = true;
                    }

                    const killed = boss.takeDamage(damage, player.x, player.y);
                    hits.push({ target: boss, damage, killed, crit, isBoss: true });

                    this.spawnHitParticles(boss.x, boss.y, "#ff8800", 8);
                    this.addDamageNumber(boss.x, boss.y, damage, crit);

                    // Enchantment hit effect
                    if (enchantElement) {
                        this.spawnEnchantHitEffect(enchantElement, player, boss);
                    }
                }
            }
        }

        return hits;
    }

    // Use elemental power
    useElement(player, elementName, monsters, boss) {
        const elem = ELEMENTS[elementName];
        const results = [];

        switch (elementName) {
            case "fire":
                // Fire blast - damage in a cone
                this.spawnElementEffect(player.x + player.facing.x * 40, player.y + player.facing.y * 40,
                    "fire", 1000);
                for (const m of monsters) {
                    if (!m.alive) continue;
                    const d = dist(player.x, player.y, m.x, m.y);
                    if (d < 100) {
                        const angleToM = dirToAngle(m.x - player.x, m.y - player.y);
                        const facingAngle = dirToAngle(player.facing.x, player.facing.y);
                        let diff = Math.abs(angleToM - facingAngle);
                        if (diff > Math.PI) diff = Math.PI * 2 - diff;
                        if (diff < Math.PI / 2.5) {
                            const killed = m.takeDamage(elem.damage, player.x, player.y);
                            results.push({ target: m, damage: elem.damage, killed });
                            this.addDamageNumber(m.x, m.y, elem.damage, false);
                            this.spawnHitParticles(m.x, m.y, "#ff4400", 8);
                        }
                    }
                }
                if (boss && boss.alive && dist(player.x, player.y, boss.x, boss.y) < 100) {
                    const killed = boss.takeDamage(elem.damage, player.x, player.y);
                    results.push({ target: boss, damage: elem.damage, killed, isBoss: true });
                    this.addDamageNumber(boss.x, boss.y, elem.damage, false);
                }
                break;

            case "water":
                // Water heal + damage ring
                player.heal(elem.heal);
                this.spawnElementEffect(player.x, player.y, "water", 800);
                this.addDamageNumber(player.x, player.y, elem.heal, false, true);
                for (const m of monsters) {
                    if (!m.alive) continue;
                    if (dist(player.x, player.y, m.x, m.y) < 80) {
                        const killed = m.takeDamage(elem.damage, player.x, player.y);
                        results.push({ target: m, damage: elem.damage, killed });
                        this.addDamageNumber(m.x, m.y, elem.damage, false);
                    }
                }
                if (boss && boss.alive && dist(player.x, player.y, boss.x, boss.y) < 80) {
                    boss.takeDamage(elem.damage, player.x, player.y);
                    this.addDamageNumber(boss.x, boss.y, elem.damage, false);
                }
                break;

            case "ice":
                // Ice wave - damages and slows
                this.spawnElementEffect(player.x + player.facing.x * 50, player.y + player.facing.y * 50,
                    "ice", 1200);
                for (const m of monsters) {
                    if (!m.alive) continue;
                    if (dist(player.x, player.y, m.x, m.y) < 120) {
                        const killed = m.takeDamage(elem.damage, player.x, player.y);
                        m.slowTimer = elem.slowDuration;
                        results.push({ target: m, damage: elem.damage, killed });
                        this.addDamageNumber(m.x, m.y, elem.damage, false);
                        this.spawnHitParticles(m.x, m.y, "#88ddff", 6);
                    }
                }
                if (boss && boss.alive && dist(player.x, player.y, boss.x, boss.y) < 120) {
                    boss.takeDamage(elem.damage, player.x, player.y);
                    this.addDamageNumber(boss.x, boss.y, elem.damage, false);
                }
                break;

            case "lightning":
                // Lightning bolt - high damage single target (closest enemy)
                let closest = null;
                let closestDist = 200;
                for (const m of monsters) {
                    if (!m.alive) continue;
                    const d = dist(player.x, player.y, m.x, m.y);
                    if (d < closestDist) {
                        closestDist = d;
                        closest = m;
                    }
                }
                if (boss && boss.alive) {
                    const d = dist(player.x, player.y, boss.x, boss.y);
                    if (d < closestDist) {
                        closest = boss;
                        closestDist = d;
                    }
                }
                if (closest) {
                    this.spawnLightningBolt(player.x, player.y, closest.x, closest.y);
                    const killed = closest.takeDamage(elem.damage, player.x, player.y);
                    results.push({ target: closest, damage: elem.damage, killed, isBoss: closest === boss });
                    this.addDamageNumber(closest.x, closest.y, elem.damage, true);
                    this.spawnHitParticles(closest.x, closest.y, "#ffee00", 10);
                }
                this.spawnElementEffect(player.x, player.y, "lightning", 600);
                break;
        }

        return results;
    }

    spawnHitParticles(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: randFloat(-3, 3),
                vy: randFloat(-3, 3),
                life: randFloat(200, 500),
                maxLife: 500,
                size: randFloat(2, 5),
                color: color,
            });
        }
    }

    spawnElementEffect(x, y, element, duration) {
        this.elementEffects.push({
            x, y, element, duration, maxDuration: duration, time: 0,
        });
    }

    spawnLightningBolt(x1, y1, x2, y2) {
        // Create a jagged lightning path
        const segments = [];
        const steps = 8;
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            segments.push({
                x: lerp(x1, x2, t) + (i > 0 && i < steps ? randFloat(-15, 15) : 0),
                y: lerp(y1, y2, t) + (i > 0 && i < steps ? randFloat(-15, 15) : 0),
            });
        }
        this.elementEffects.push({
            x: x1, y: y1, element: "lightning_bolt", duration: 400, maxDuration: 400,
            segments: segments,
        });
    }

    // Spawn enchantment visual effect when an enchanted weapon/bow hits a target
    spawnEnchantHitEffect(element, source, target) {
        const elem = ELEMENTS[element];
        switch (element) {
            case "fire":
                this.spawnElementEffect(target.x, target.y, "fire", 500);
                this.spawnHitParticles(target.x, target.y, "#ff4400", 6);
                break;
            case "water":
                this.spawnElementEffect(target.x, target.y, "water", 500);
                this.spawnHitParticles(target.x, target.y, "#2288ff", 6);
                break;
            case "ice":
                this.spawnElementEffect(target.x, target.y, "ice", 600);
                this.spawnHitParticles(target.x, target.y, "#88ddff", 6);
                // Apply slow to target if it has a slowTimer
                if (target.slowTimer !== undefined) {
                    target.slowTimer = 1500;
                }
                break;
            case "lightning":
                this.spawnLightningBolt(source.x, source.y, target.x, target.y);
                this.spawnHitParticles(target.x, target.y, "#ffee00", 8);
                break;
        }
    }

    // Spawn defensive visual effect when enchanted armor blocks damage
    spawnArmorDefenseEffect(element, player, fromX, fromY) {
        switch (element) {
            case "fire":
                // Fire burst radiating outward from player
                this.spawnElementEffect(player.x, player.y, "enchant_fire_shield", 600);
                this.spawnHitParticles(player.x, player.y, "#ff4400", 8);
                break;
            case "water":
                // Water shield ripple around player
                this.spawnElementEffect(player.x, player.y, "enchant_water_shield", 600);
                this.spawnHitParticles(player.x, player.y, "#2288ff", 8);
                break;
            case "ice":
                // Ice barrier frost effect
                this.spawnElementEffect(player.x, player.y, "enchant_ice_shield", 700);
                this.spawnHitParticles(player.x, player.y, "#88ddff", 8);
                break;
            case "lightning":
                // Lightning discharge toward attacker
                if (fromX !== undefined && fromY !== undefined) {
                    this.spawnLightningBolt(player.x, player.y, fromX, fromY);
                }
                this.spawnElementEffect(player.x, player.y, "enchant_lightning_shield", 500);
                this.spawnHitParticles(player.x, player.y, "#ffee00", 8);
                break;
        }
    }

    // Arrow projectile system
    addArrow(arrowData) {
        this.arrowProjectiles.push(arrowData);
    }

    updateArrows(dt, monsters, boss, world) {
        const hits = [];
        for (let i = this.arrowProjectiles.length - 1; i >= 0; i--) {
            const a = this.arrowProjectiles[i];
            const moveX = a.vx * dt * 0.1;
            const moveY = a.vy * dt * 0.1;
            a.x += moveX;
            a.y += moveY;
            a.distTraveled += Math.sqrt(moveX * moveX + moveY * moveY);

            // Fire arrow trail particles
            if (a.isFireArrow) {
                this.particles.push({
                    x: a.x, y: a.y,
                    vx: randFloat(-0.5, 0.5), vy: randFloat(-1, 0),
                    life: 200, maxLife: 200, size: randFloat(2, 4),
                    color: choose(["#ff4400", "#ff8800", "#ffaa00"]),
                });
            }

            // Remove if past range
            if (a.distTraveled >= a.range) {
                this.arrowProjectiles.splice(i, 1);
                continue;
            }

            // Fire arrow hitting a tree - set it on fire
            if (a.isFireArrow && world) {
                const tile = worldToTile(a.x, a.y);
                if (tile.x >= 0 && tile.x < WORLD_W && tile.y >= 0 && tile.y < WORLD_H) {
                    if (world.tiles[tile.y][tile.x] === TILE.TREE) {
                        // Check if the tree is adjacent to water
                        let touchingWater = false;
                        for (let dy = -1; dy <= 1; dy++) {
                            for (let dx = -1; dx <= 1; dx++) {
                                if (dx === 0 && dy === 0) continue;
                                const nx = tile.x + dx;
                                const ny = tile.y + dy;
                                if (nx >= 0 && nx < WORLD_W && ny >= 0 && ny < WORLD_H) {
                                    if (world.tiles[ny][nx] === TILE.WATER) {
                                        touchingWater = true;
                                        break;
                                    }
                                }
                            }
                            if (touchingWater) break;
                        }

                        if (!touchingWater) {
                            world.tiles[tile.y][tile.x] = TILE.BURNING_TREE;
                            if (!world.burningTrees) world.burningTrees = {};
                            world.burningTrees[`${tile.x},${tile.y}`] = { timer: 8000 };
                            this.spawnHitParticles(a.x, a.y, "#ff4400", 10);
                        }

                        this.arrowProjectiles.splice(i, 1);
                        continue;
                    }
                }
            }

            let removed = false;

            // Check monster collision
            for (const m of monsters) {
                if (!m.alive) continue;
                if (dist(a.x, a.y, m.x, m.y) < m.size + 4) {
                    let damage = a.damage;
                    let crit = false;
                    if (Math.random() < 0.15) {
                        damage = Math.floor(damage * 1.8);
                        crit = true;
                    }
                    const killed = m.takeDamage(damage, a.x, a.y);
                    this.spawnHitParticles(m.x, m.y, a.isFireArrow ? "#ff6600" : "#ff4444", 5);
                    this.addDamageNumber(m.x, m.y, damage, crit);
                    if (a.isFireArrow) {
                        this.spawnElementEffect(m.x, m.y, "fire", 500);
                    }
                    // Bow enchantment hit effect
                    if (a.bowEnchant) {
                        this.spawnEnchantHitEffect(a.bowEnchant, { x: a.x, y: a.y }, m);
                    }
                    hits.push({ target: m, damage, killed, crit });
                    this.arrowProjectiles.splice(i, 1);
                    removed = true;
                    break;
                }
            }

            if (removed) continue;

            // Check boss collision
            if (boss && boss.alive && boss.spawned && boss.spawnAnimation <= 0) {
                if (dist(a.x, a.y, boss.x, boss.y) < boss.size + 4) {
                    let damage = a.damage;
                    let crit = false;
                    if (Math.random() < 0.12) {
                        damage = Math.floor(damage * 1.6);
                        crit = true;
                    }
                    const killed = boss.takeDamage(damage, a.x, a.y);
                    this.spawnHitParticles(boss.x, boss.y, a.isFireArrow ? "#ff6600" : "#ff8800", 8);
                    this.addDamageNumber(boss.x, boss.y, damage, crit);
                    if (a.isFireArrow) {
                        this.spawnElementEffect(boss.x, boss.y, "fire", 500);
                    }
                    // Bow enchantment hit effect
                    if (a.bowEnchant) {
                        this.spawnEnchantHitEffect(a.bowEnchant, { x: a.x, y: a.y }, boss);
                    }
                    hits.push({ target: boss, damage, killed, crit, isBoss: true });
                    this.arrowProjectiles.splice(i, 1);
                }
            }
        }
        return hits;
    }

    renderArrows(ctx, camera) {
        for (const a of this.arrowProjectiles) {
            const sx = a.x - camera.x;
            const sy = a.y - camera.y;
            const angle = Math.atan2(a.vy, a.vx);

            ctx.save();
            ctx.translate(sx, sy);
            ctx.rotate(angle);

            // Arrow shaft
            ctx.strokeStyle = a.isFireArrow ? "#ff6600" : "#8B4513";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-10, 0);
            ctx.lineTo(6, 0);
            ctx.stroke();

            // Arrow head
            ctx.fillStyle = a.isFireArrow ? "#ff4400" : "#aaaacc";
            ctx.beginPath();
            ctx.moveTo(10, 0);
            ctx.lineTo(5, -3);
            ctx.lineTo(5, 3);
            ctx.closePath();
            ctx.fill();

            // Fletching
            ctx.fillStyle = a.isFireArrow ? "#ffaa00" : "#654321";
            ctx.beginPath();
            ctx.moveTo(-10, 0);
            ctx.lineTo(-7, -3);
            ctx.lineTo(-7, 0);
            ctx.closePath();
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(-10, 0);
            ctx.lineTo(-7, 3);
            ctx.lineTo(-7, 0);
            ctx.closePath();
            ctx.fill();

            // Fire glow
            if (a.isFireArrow) {
                ctx.shadowColor = "#ff4400";
                ctx.shadowBlur = 8;
                ctx.fillStyle = "rgba(255, 100, 0, 0.4)";
                ctx.beginPath();
                ctx.arc(4, 0, 5, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
            }

            ctx.restore();
        }
    }

    addDamageNumber(x, y, amount, crit, isHeal) {
        this.damageNumbers.push({
            x: x + randFloat(-10, 10),
            y: y - 20,
            amount: Math.floor(amount),
            life: 800,
            crit: crit,
            isHeal: isHeal || false,
            vy: -1.5,
        });
    }

    update(dt) {
        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.05; // gravity
            p.life -= dt;
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }

        // Update damage numbers
        for (let i = this.damageNumbers.length - 1; i >= 0; i--) {
            const d = this.damageNumbers[i];
            d.y += d.vy;
            d.life -= dt;
            if (d.life <= 0) {
                this.damageNumbers.splice(i, 1);
            }
        }

        // Update element effects
        for (let i = this.elementEffects.length - 1; i >= 0; i--) {
            const e = this.elementEffects[i];
            e.time += dt;
            e.duration -= dt;
            if (e.duration <= 0) {
                this.elementEffects.splice(i, 1);
            }
        }
    }

    render(ctx, camera, time) {
        // Render arrow projectiles
        this.renderArrows(ctx, camera);

        // Render element effects
        for (const e of this.elementEffects) {
            const sx = e.x - camera.x;
            const sy = e.y - camera.y;
            const progress = 1 - e.duration / e.maxDuration;

            switch (e.element) {
                case "fire": {
                    const radius = 60 * progress;
                    const gradient = ctx.createRadialGradient(sx, sy, 0, sx, sy, radius);
                    gradient.addColorStop(0, "rgba(255, 100, 0, 0.6)");
                    gradient.addColorStop(0.5, "rgba(255, 50, 0, 0.3)");
                    gradient.addColorStop(1, "rgba(255, 0, 0, 0)");
                    ctx.fillStyle = gradient;
                    ctx.beginPath();
                    ctx.arc(sx, sy, radius, 0, Math.PI * 2);
                    ctx.fill();

                    // Fire particles
                    for (let i = 0; i < 3; i++) {
                        const a = Math.random() * Math.PI * 2;
                        const r = Math.random() * radius;
                        ctx.fillStyle = `rgba(255, ${150 + Math.random() * 100}, 0, ${0.7 - progress * 0.5})`;
                        ctx.beginPath();
                        ctx.arc(sx + Math.cos(a) * r, sy + Math.sin(a) * r, 3 + Math.random() * 4, 0, Math.PI * 2);
                        ctx.fill();
                    }
                    break;
                }

                case "water": {
                    const radius = 70 * Math.min(progress * 2, 1);
                    ctx.strokeStyle = `rgba(34, 136, 255, ${0.7 - progress * 0.5})`;
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.arc(sx, sy, radius, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.arc(sx, sy, radius * 0.6, 0, Math.PI * 2);
                    ctx.stroke();
                    break;
                }

                case "ice": {
                    const radius = 80 * Math.min(progress * 2, 1);
                    // Frost circle
                    ctx.fillStyle = `rgba(136, 221, 255, ${0.3 - progress * 0.2})`;
                    ctx.beginPath();
                    ctx.arc(sx, sy, radius, 0, Math.PI * 2);
                    ctx.fill();
                    // Ice crystals
                    for (let i = 0; i < 6; i++) {
                        const a = (i / 6) * Math.PI * 2 + time * 0.002;
                        const cr = radius * 0.8;
                        ctx.strokeStyle = `rgba(200, 240, 255, ${0.6 - progress * 0.4})`;
                        ctx.lineWidth = 2;
                        ctx.beginPath();
                        ctx.moveTo(sx, sy);
                        ctx.lineTo(sx + Math.cos(a) * cr, sy + Math.sin(a) * cr);
                        ctx.stroke();
                    }
                    break;
                }

                case "lightning": {
                    // Flash
                    ctx.fillStyle = `rgba(255, 238, 0, ${0.3 - progress * 0.3})`;
                    ctx.beginPath();
                    ctx.arc(sx, sy, 30, 0, Math.PI * 2);
                    ctx.fill();
                    break;
                }

                case "enchant_fire_shield": {
                    // Fire shield burst radiating outward
                    const fRadius = 30 + 20 * progress;
                    const fAlpha = 0.6 - progress * 0.6;
                    ctx.strokeStyle = `rgba(255, 68, 0, ${fAlpha})`;
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.arc(sx, sy, fRadius, 0, Math.PI * 2);
                    ctx.stroke();
                    // Inner fire glow
                    const fGradient = ctx.createRadialGradient(sx, sy, 0, sx, sy, fRadius * 0.6);
                    fGradient.addColorStop(0, `rgba(255, 100, 0, ${fAlpha * 0.5})`);
                    fGradient.addColorStop(1, "rgba(255, 50, 0, 0)");
                    ctx.fillStyle = fGradient;
                    ctx.beginPath();
                    ctx.arc(sx, sy, fRadius * 0.6, 0, Math.PI * 2);
                    ctx.fill();
                    // Fire wisps
                    for (let i = 0; i < 4; i++) {
                        const a = (i / 4) * Math.PI * 2 + time * 0.008;
                        const wr = fRadius * 0.8;
                        ctx.fillStyle = `rgba(255, ${150 + Math.random() * 100}, 0, ${fAlpha})`;
                        ctx.beginPath();
                        ctx.arc(sx + Math.cos(a) * wr, sy + Math.sin(a) * wr, 3, 0, Math.PI * 2);
                        ctx.fill();
                    }
                    break;
                }

                case "enchant_water_shield": {
                    // Water shield ripple
                    const wRadius = 25 + 25 * progress;
                    const wAlpha = 0.7 - progress * 0.7;
                    ctx.strokeStyle = `rgba(34, 136, 255, ${wAlpha})`;
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.arc(sx, sy, wRadius, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.strokeStyle = `rgba(68, 170, 255, ${wAlpha * 0.6})`;
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.arc(sx, sy, wRadius * 0.6, 0, Math.PI * 2);
                    ctx.stroke();
                    // Water droplets
                    for (let i = 0; i < 6; i++) {
                        const a = (i / 6) * Math.PI * 2 + time * 0.003;
                        ctx.fillStyle = `rgba(100, 200, 255, ${wAlpha * 0.8})`;
                        ctx.beginPath();
                        ctx.arc(sx + Math.cos(a) * wRadius * 0.8, sy + Math.sin(a) * wRadius * 0.8, 2, 0, Math.PI * 2);
                        ctx.fill();
                    }
                    break;
                }

                case "enchant_ice_shield": {
                    // Ice barrier with frost crystals
                    const iRadius = 28 + 18 * progress;
                    const iAlpha = 0.6 - progress * 0.5;
                    // Frost circle
                    ctx.fillStyle = `rgba(136, 221, 255, ${iAlpha * 0.3})`;
                    ctx.beginPath();
                    ctx.arc(sx, sy, iRadius, 0, Math.PI * 2);
                    ctx.fill();
                    // Ice crystal spikes radiating outward
                    for (let i = 0; i < 8; i++) {
                        const a = (i / 8) * Math.PI * 2 + time * 0.002;
                        const innerR = iRadius * 0.5;
                        const outerR = iRadius;
                        ctx.strokeStyle = `rgba(200, 240, 255, ${iAlpha})`;
                        ctx.lineWidth = 2;
                        ctx.beginPath();
                        ctx.moveTo(sx + Math.cos(a) * innerR, sy + Math.sin(a) * innerR);
                        ctx.lineTo(sx + Math.cos(a) * outerR, sy + Math.sin(a) * outerR);
                        ctx.stroke();
                    }
                    // Outer ring
                    ctx.strokeStyle = `rgba(200, 240, 255, ${iAlpha * 0.5})`;
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.arc(sx, sy, iRadius, 0, Math.PI * 2);
                    ctx.stroke();
                    break;
                }

                case "enchant_lightning_shield": {
                    // Lightning discharge flash
                    const lRadius = 25 + 15 * progress;
                    const lAlpha = 0.5 - progress * 0.5;
                    ctx.fillStyle = `rgba(255, 238, 0, ${lAlpha * 0.4})`;
                    ctx.beginPath();
                    ctx.arc(sx, sy, lRadius, 0, Math.PI * 2);
                    ctx.fill();
                    // Electric arcs around player
                    ctx.strokeStyle = `rgba(255, 238, 0, ${lAlpha})`;
                    ctx.lineWidth = 2;
                    ctx.shadowColor = "#ffee00";
                    ctx.shadowBlur = 6;
                    for (let i = 0; i < 4; i++) {
                        const a1 = Math.random() * Math.PI * 2;
                        const a2 = a1 + randFloat(0.3, 0.8);
                        const r1 = lRadius * 0.6;
                        const r2 = lRadius;
                        ctx.beginPath();
                        ctx.moveTo(sx + Math.cos(a1) * r1, sy + Math.sin(a1) * r1);
                        ctx.lineTo(sx + Math.cos((a1 + a2) / 2) * r2 + randFloat(-5, 5),
                                   sy + Math.sin((a1 + a2) / 2) * r2 + randFloat(-5, 5));
                        ctx.lineTo(sx + Math.cos(a2) * r1, sy + Math.sin(a2) * r1);
                        ctx.stroke();
                    }
                    ctx.shadowBlur = 0;
                    break;
                }

                case "lightning_bolt": {
                    if (e.segments) {
                        ctx.strokeStyle = `rgba(255, 238, 0, ${1 - progress})`;
                        ctx.lineWidth = 3;
                        ctx.shadowColor = "#ffee00";
                        ctx.shadowBlur = 10;
                        ctx.beginPath();
                        ctx.moveTo(e.segments[0].x - camera.x, e.segments[0].y - camera.y);
                        for (let i = 1; i < e.segments.length; i++) {
                            ctx.lineTo(e.segments[i].x - camera.x, e.segments[i].y - camera.y);
                        }
                        ctx.stroke();
                        ctx.shadowBlur = 0;

                        // Glow
                        ctx.strokeStyle = `rgba(255, 255, 200, ${0.5 - progress * 0.5})`;
                        ctx.lineWidth = 8;
                        ctx.beginPath();
                        ctx.moveTo(e.segments[0].x - camera.x, e.segments[0].y - camera.y);
                        for (let i = 1; i < e.segments.length; i++) {
                            ctx.lineTo(e.segments[i].x - camera.x, e.segments[i].y - camera.y);
                        }
                        ctx.stroke();
                    }
                    break;
                }
            }
        }

        // Render particles
        for (const p of this.particles) {
            const sx = p.x - camera.x;
            const sy = p.y - camera.y;
            ctx.globalAlpha = p.life / p.maxLife;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(sx, sy, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;

        // Render damage numbers
        for (const d of this.damageNumbers) {
            const sx = d.x - camera.x;
            const sy = d.y - camera.y;
            ctx.globalAlpha = Math.min(1, d.life / 300);
            ctx.font = d.crit ? "bold 20px monospace" : "bold 16px monospace";
            ctx.textAlign = "center";
            ctx.fillStyle = d.isHeal ? "#4caf50" : (d.crit ? "#ffd700" : "#ff4444");
            ctx.strokeStyle = "#000";
            ctx.lineWidth = 3;
            const text = d.isHeal ? `+${d.amount}` : `-${d.amount}`;
            ctx.strokeText(text, sx, sy);
            ctx.fillText(text, sx, sy);
        }
        ctx.globalAlpha = 1;
    }
}
