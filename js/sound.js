// ============================================
// Ingoizer's World - Sound System (Web Audio API)
// ============================================

class SoundSystem {
    constructor() {
        this.ctx = null;
        this.enabled = true;
        this.masterVolume = 0.35;
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.initialized = true;
        } catch (e) {
            this.enabled = false;
        }
    }

    ensureContext() {
        if (!this.enabled) return false;
        if (!this.initialized) this.init();
        if (this.ctx && this.ctx.state === "suspended") {
            this.ctx.resume();
        }
        return this.initialized;
    }

    // Create a gain node with master volume applied
    createGain(volume) {
        const gain = this.ctx.createGain();
        gain.gain.value = volume * this.masterVolume;
        gain.connect(this.ctx.destination);
        return gain;
    }

    // --- SWORD / MELEE SOUNDS ---

    swordSlash() {
        if (!this.ensureContext()) return;
        const t = this.ctx.currentTime;

        // Noise burst for the "swoosh"
        const bufferSize = this.ctx.sampleRate * 0.15;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        // Bandpass filter for metallic swish
        const filter = this.ctx.createBiquadFilter();
        filter.type = "bandpass";
        filter.frequency.setValueAtTime(3000, t);
        filter.frequency.exponentialRampToValueAtTime(800, t + 0.15);
        filter.Q.value = 2;

        const gain = this.createGain(0.3);
        gain.gain.setValueAtTime(0.3 * this.masterVolume, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

        noise.connect(filter);
        filter.connect(gain);
        noise.start(t);
        noise.stop(t + 0.15);

        // Tonal component - metallic ring
        const osc = this.ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.setValueAtTime(800, t);
        osc.frequency.exponentialRampToValueAtTime(200, t + 0.1);
        const oscGain = this.createGain(0.1);
        oscGain.gain.setValueAtTime(0.1 * this.masterVolume, t);
        oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
        osc.connect(oscGain);
        osc.start(t);
        osc.stop(t + 0.1);
    }

    swordHit() {
        if (!this.ensureContext()) return;
        const t = this.ctx.currentTime;

        // Impact thud
        const osc = this.ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.setValueAtTime(200, t);
        osc.frequency.exponentialRampToValueAtTime(60, t + 0.1);
        const gain = this.createGain(0.4);
        gain.gain.setValueAtTime(0.4 * this.masterVolume, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
        osc.connect(gain);
        osc.start(t);
        osc.stop(t + 0.15);

        // Noise burst
        const bufSize = this.ctx.sampleRate * 0.08;
        const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < bufSize; i++) {
            d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufSize, 3);
        }
        const ns = this.ctx.createBufferSource();
        ns.buffer = buf;
        const nGain = this.createGain(0.25);
        nGain.gain.setValueAtTime(0.25 * this.masterVolume, t);
        nGain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
        ns.connect(nGain);
        ns.start(t);
        ns.stop(t + 0.08);
    }

    criticalHit() {
        if (!this.ensureContext()) return;
        const t = this.ctx.currentTime;

        // Higher pitched impact
        this.swordHit();

        // Extra metallic ring
        const osc = this.ctx.createOscillator();
        osc.type = "square";
        osc.frequency.setValueAtTime(1200, t);
        osc.frequency.exponentialRampToValueAtTime(400, t + 0.2);
        const gain = this.createGain(0.12);
        gain.gain.setValueAtTime(0.12 * this.masterVolume, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
        osc.connect(gain);
        osc.start(t);
        osc.stop(t + 0.2);
    }

    // --- ELEMENTAL SOUNDS ---

    fireBlast() {
        if (!this.ensureContext()) return;
        const t = this.ctx.currentTime;

        // Roaring noise
        const bufSize = this.ctx.sampleRate * 0.5;
        const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < bufSize; i++) {
            const env = Math.sin(i / bufSize * Math.PI) * (1 - i / bufSize * 0.5);
            d[i] = (Math.random() * 2 - 1) * env;
        }
        const ns = this.ctx.createBufferSource();
        ns.buffer = buf;

        const filter = this.ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(2000, t);
        filter.frequency.exponentialRampToValueAtTime(300, t + 0.5);

        const gain = this.createGain(0.3);
        gain.gain.setValueAtTime(0.05 * this.masterVolume, t);
        gain.gain.linearRampToValueAtTime(0.3 * this.masterVolume, t + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

        ns.connect(filter);
        filter.connect(gain);
        ns.start(t);
        ns.stop(t + 0.5);

        // Low rumble
        const osc = this.ctx.createOscillator();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(80, t);
        osc.frequency.exponentialRampToValueAtTime(40, t + 0.4);
        const oGain = this.createGain(0.15);
        oGain.gain.setValueAtTime(0.15 * this.masterVolume, t);
        oGain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
        osc.connect(oGain);
        osc.start(t);
        osc.stop(t + 0.4);
    }

    waterSplash() {
        if (!this.ensureContext()) return;
        const t = this.ctx.currentTime;

        // Bubbly noise
        const bufSize = this.ctx.sampleRate * 0.4;
        const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < bufSize; i++) {
            d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufSize, 1.5);
        }
        const ns = this.ctx.createBufferSource();
        ns.buffer = buf;

        const filter = this.ctx.createBiquadFilter();
        filter.type = "bandpass";
        filter.frequency.setValueAtTime(1500, t);
        filter.frequency.exponentialRampToValueAtTime(500, t + 0.4);
        filter.Q.value = 1;

        const gain = this.createGain(0.25);
        gain.gain.setValueAtTime(0.25 * this.masterVolume, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

        ns.connect(filter);
        filter.connect(gain);
        ns.start(t);
        ns.stop(t + 0.4);

        // Healing tone
        const osc = this.ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.setValueAtTime(523, t);        // C5
        const oGain = this.createGain(0.08);
        oGain.gain.setValueAtTime(0.08 * this.masterVolume, t);
        oGain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
        osc.connect(oGain);
        osc.start(t);
        osc.stop(t + 0.3);
    }

    iceFreeze() {
        if (!this.ensureContext()) return;
        const t = this.ctx.currentTime;

        // Crystalline shimmer
        const freqs = [2000, 3000, 4500];
        for (const f of freqs) {
            const osc = this.ctx.createOscillator();
            osc.type = "sine";
            osc.frequency.setValueAtTime(f, t);
            osc.frequency.exponentialRampToValueAtTime(f * 0.5, t + 0.4);
            const gain = this.createGain(0.06);
            gain.gain.setValueAtTime(0.06 * this.masterVolume, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
            osc.connect(gain);
            osc.start(t);
            osc.stop(t + 0.4);
        }

        // Cracking noise
        const bufSize = this.ctx.sampleRate * 0.2;
        const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < bufSize; i++) {
            d[i] = (Math.random() * 2 - 1) * (Math.random() < 0.1 ? 1 : 0.1) * (1 - i / bufSize);
        }
        const ns = this.ctx.createBufferSource();
        ns.buffer = buf;
        const nGain = this.createGain(0.2);
        nGain.gain.setValueAtTime(0.2 * this.masterVolume, t);
        nGain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
        ns.connect(nGain);
        ns.start(t);
        ns.stop(t + 0.2);
    }

    lightningStrike() {
        if (!this.ensureContext()) return;
        const t = this.ctx.currentTime;

        // Electric crackle
        const bufSize = this.ctx.sampleRate * 0.3;
        const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < bufSize; i++) {
            const burst = Math.random() < 0.05 ? 1 : 0;
            d[i] = (Math.random() * 2 - 1) * (0.3 + burst * 0.7) * (1 - i / bufSize);
        }
        const ns = this.ctx.createBufferSource();
        ns.buffer = buf;

        const filter = this.ctx.createBiquadFilter();
        filter.type = "highpass";
        filter.frequency.value = 1000;

        const gain = this.createGain(0.35);
        gain.gain.setValueAtTime(0.35 * this.masterVolume, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

        ns.connect(filter);
        filter.connect(gain);
        ns.start(t);
        ns.stop(t + 0.3);

        // Thunder boom
        const osc = this.ctx.createOscillator();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(100, t);
        osc.frequency.exponentialRampToValueAtTime(30, t + 0.3);
        const oGain = this.createGain(0.3);
        oGain.gain.setValueAtTime(0.3 * this.masterVolume, t);
        oGain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
        osc.connect(oGain);
        osc.start(t);
        osc.stop(t + 0.3);
    }

    // --- MONSTER SOUNDS ---

    monsterHit() {
        if (!this.ensureContext()) return;
        const t = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        osc.type = "square";
        osc.frequency.setValueAtTime(150, t);
        osc.frequency.exponentialRampToValueAtTime(50, t + 0.12);
        const gain = this.createGain(0.2);
        gain.gain.setValueAtTime(0.2 * this.masterVolume, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
        osc.connect(gain);
        osc.start(t);
        osc.stop(t + 0.12);
    }

    monsterAttack() {
        if (!this.ensureContext()) return;
        const t = this.ctx.currentTime;

        // Growl
        const osc = this.ctx.createOscillator();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(120, t);
        osc.frequency.linearRampToValueAtTime(180, t + 0.05);
        osc.frequency.exponentialRampToValueAtTime(60, t + 0.2);

        const filter = this.ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.value = 400;

        const gain = this.createGain(0.18);
        gain.gain.setValueAtTime(0.18 * this.masterVolume, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

        osc.connect(filter);
        filter.connect(gain);
        osc.start(t);
        osc.stop(t + 0.2);
    }

    monsterDeath() {
        if (!this.ensureContext()) return;
        const t = this.ctx.currentTime;

        // Descending squeal
        const osc = this.ctx.createOscillator();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(400, t);
        osc.frequency.exponentialRampToValueAtTime(40, t + 0.4);

        const filter = this.ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(800, t);
        filter.frequency.exponentialRampToValueAtTime(100, t + 0.4);

        const gain = this.createGain(0.2);
        gain.gain.setValueAtTime(0.2 * this.masterVolume, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

        osc.connect(filter);
        filter.connect(gain);
        osc.start(t);
        osc.stop(t + 0.4);
    }

    // --- BOSS SOUNDS ---

    bossRoar() {
        if (!this.ensureContext()) return;
        const t = this.ctx.currentTime;

        // Deep roar
        for (let i = 0; i < 3; i++) {
            const osc = this.ctx.createOscillator();
            osc.type = "sawtooth";
            osc.frequency.setValueAtTime(80 + i * 30, t);
            osc.frequency.linearRampToValueAtTime(200 + i * 20, t + 0.2);
            osc.frequency.exponentialRampToValueAtTime(30, t + 0.8);

            const gain = this.createGain(0.15);
            gain.gain.setValueAtTime(0.01, t);
            gain.gain.linearRampToValueAtTime(0.15 * this.masterVolume, t + 0.15);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);

            osc.connect(gain);
            osc.start(t);
            osc.stop(t + 0.8);
        }
    }

    bossCharge() {
        if (!this.ensureContext()) return;
        const t = this.ctx.currentTime;

        // Building rumble
        const osc = this.ctx.createOscillator();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(50, t);
        osc.frequency.linearRampToValueAtTime(200, t + 0.4);

        const gain = this.createGain(0.25);
        gain.gain.setValueAtTime(0.05 * this.masterVolume, t);
        gain.gain.linearRampToValueAtTime(0.25 * this.masterVolume, t + 0.3);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

        osc.connect(gain);
        osc.start(t);
        osc.stop(t + 0.5);
    }

    bossSpin() {
        if (!this.ensureContext()) return;
        const t = this.ctx.currentTime;

        // Whooshing spin
        const osc = this.ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.setValueAtTime(200, t);

        // LFO for wobble
        const lfo = this.ctx.createOscillator();
        lfo.frequency.value = 8;
        const lfoGain = this.ctx.createGain();
        lfoGain.gain.value = 150;
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);

        const gain = this.createGain(0.15);
        gain.gain.setValueAtTime(0.15 * this.masterVolume, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);

        osc.connect(gain);
        osc.start(t);
        lfo.start(t);
        osc.stop(t + 0.8);
        lfo.stop(t + 0.8);
    }

    bossProjectile() {
        if (!this.ensureContext()) return;
        const t = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.setValueAtTime(600, t);
        osc.frequency.exponentialRampToValueAtTime(150, t + 0.3);

        const gain = this.createGain(0.12);
        gain.gain.setValueAtTime(0.12 * this.masterVolume, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

        osc.connect(gain);
        osc.start(t);
        osc.stop(t + 0.3);
    }

    bossDefeat() {
        if (!this.ensureContext()) return;
        const t = this.ctx.currentTime;

        // Dramatic descending explosion
        for (let i = 0; i < 5; i++) {
            const delay = i * 0.15;
            const osc = this.ctx.createOscillator();
            osc.type = "sawtooth";
            osc.frequency.setValueAtTime(300 - i * 40, t + delay);
            osc.frequency.exponentialRampToValueAtTime(20, t + delay + 0.5);

            const gain = this.createGain(0.2);
            gain.gain.setValueAtTime(0.2 * this.masterVolume, t + delay);
            gain.gain.exponentialRampToValueAtTime(0.001, t + delay + 0.5);

            osc.connect(gain);
            osc.start(t + delay);
            osc.stop(t + delay + 0.5);
        }

        // Explosion noise
        const bufSize = this.ctx.sampleRate * 1.0;
        const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < bufSize; i++) {
            d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufSize, 2);
        }
        const ns = this.ctx.createBufferSource();
        ns.buffer = buf;
        const nGain = this.createGain(0.25);
        nGain.gain.setValueAtTime(0.25 * this.masterVolume, t);
        nGain.gain.exponentialRampToValueAtTime(0.001, t + 1.0);
        ns.connect(nGain);
        ns.start(t);
        ns.stop(t + 1.0);
    }

    // --- PLAYER SOUNDS ---

    playerHurt() {
        if (!this.ensureContext()) return;
        const t = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        osc.type = "square";
        osc.frequency.setValueAtTime(300, t);
        osc.frequency.exponentialRampToValueAtTime(100, t + 0.15);

        const gain = this.createGain(0.2);
        gain.gain.setValueAtTime(0.2 * this.masterVolume, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

        osc.connect(gain);
        osc.start(t);
        osc.stop(t + 0.15);
    }

    playerDeath() {
        if (!this.ensureContext()) return;
        const t = this.ctx.currentTime;

        // Sad descending tones
        const notes = [392, 349, 330, 262, 196]; // G4 F4 E4 C4 G3
        for (let i = 0; i < notes.length; i++) {
            const delay = i * 0.2;
            const osc = this.ctx.createOscillator();
            osc.type = "sine";
            osc.frequency.value = notes[i];
            const gain = this.createGain(0.15);
            gain.gain.setValueAtTime(0.15 * this.masterVolume, t + delay);
            gain.gain.exponentialRampToValueAtTime(0.001, t + delay + 0.25);
            osc.connect(gain);
            osc.start(t + delay);
            osc.stop(t + delay + 0.25);
        }
    }

    // --- UI / ITEM SOUNDS ---

    gemCollect() {
        if (!this.ensureContext()) return;
        const t = this.ctx.currentTime;

        // Magical ascending chime
        const notes = [523, 659, 784, 1047]; // C5 E5 G5 C6
        for (let i = 0; i < notes.length; i++) {
            const delay = i * 0.08;
            const osc = this.ctx.createOscillator();
            osc.type = "sine";
            osc.frequency.value = notes[i];
            const gain = this.createGain(0.12);
            gain.gain.setValueAtTime(0.12 * this.masterVolume, t + delay);
            gain.gain.exponentialRampToValueAtTime(0.001, t + delay + 0.3);
            osc.connect(gain);
            osc.start(t + delay);
            osc.stop(t + delay + 0.3);
        }
    }

    goldCollect() {
        if (!this.ensureContext()) return;
        const t = this.ctx.currentTime;

        // Coin clink
        const osc = this.ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.setValueAtTime(1800, t);
        osc.frequency.exponentialRampToValueAtTime(1200, t + 0.08);
        const gain = this.createGain(0.1);
        gain.gain.setValueAtTime(0.1 * this.masterVolume, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
        osc.connect(gain);
        osc.start(t);
        osc.stop(t + 0.08);
    }

    weaponPickup() {
        if (!this.ensureContext()) return;
        const t = this.ctx.currentTime;

        // Fanfare-like
        const notes = [392, 523, 659]; // G4 C5 E5
        for (let i = 0; i < notes.length; i++) {
            const delay = i * 0.1;
            const osc = this.ctx.createOscillator();
            osc.type = "triangle";
            osc.frequency.value = notes[i];
            const gain = this.createGain(0.12);
            gain.gain.setValueAtTime(0.12 * this.masterVolume, t + delay);
            gain.gain.exponentialRampToValueAtTime(0.001, t + delay + 0.25);
            osc.connect(gain);
            osc.start(t + delay);
            osc.stop(t + delay + 0.25);
        }
    }

    shopBuy() {
        if (!this.ensureContext()) return;
        const t = this.ctx.currentTime;

        // Register ding
        const osc = this.ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.value = 880;
        const gain = this.createGain(0.12);
        gain.gain.setValueAtTime(0.12 * this.masterVolume, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
        osc.connect(gain);
        osc.start(t);
        osc.stop(t + 0.2);

        // Second ding
        const osc2 = this.ctx.createOscillator();
        osc2.type = "sine";
        osc2.frequency.value = 1320;
        const gain2 = this.createGain(0.1);
        gain2.gain.setValueAtTime(0.1 * this.masterVolume, t + 0.1);
        gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
        osc2.connect(gain2);
        osc2.start(t + 0.1);
        osc2.stop(t + 0.3);
    }

    menuSelect() {
        if (!this.ensureContext()) return;
        const t = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.value = 660;
        const gain = this.createGain(0.08);
        gain.gain.setValueAtTime(0.08 * this.masterVolume, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
        osc.connect(gain);
        osc.start(t);
        osc.stop(t + 0.1);
    }

    dialogAdvance() {
        if (!this.ensureContext()) return;
        const t = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.value = 440;
        const gain = this.createGain(0.06);
        gain.gain.setValueAtTime(0.06 * this.masterVolume, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
        osc.connect(gain);
        osc.start(t);
        osc.stop(t + 0.06);
    }

    riddleCorrect() {
        if (!this.ensureContext()) return;
        const t = this.ctx.currentTime;

        // Triumphant chord
        const notes = [523, 659, 784]; // C E G
        for (const f of notes) {
            const osc = this.ctx.createOscillator();
            osc.type = "sine";
            osc.frequency.value = f;
            const gain = this.createGain(0.1);
            gain.gain.setValueAtTime(0.1 * this.masterVolume, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
            osc.connect(gain);
            osc.start(t);
            osc.stop(t + 0.5);
        }
    }

    riddleWrong() {
        if (!this.ensureContext()) return;
        const t = this.ctx.currentTime;

        // Buzzer
        const osc = this.ctx.createOscillator();
        osc.type = "square";
        osc.frequency.value = 100;
        const gain = this.createGain(0.15);
        gain.gain.setValueAtTime(0.15 * this.masterVolume, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
        osc.connect(gain);
        osc.start(t);
        osc.stop(t + 0.3);
    }

    excaliburReveal() {
        if (!this.ensureContext()) return;
        const t = this.ctx.currentTime;

        // Epic ascending fanfare
        const notes = [262, 330, 392, 523, 659, 784, 1047]; // C4 E4 G4 C5 E5 G5 C6
        for (let i = 0; i < notes.length; i++) {
            const delay = i * 0.12;
            const osc = this.ctx.createOscillator();
            osc.type = i < 4 ? "triangle" : "sine";
            osc.frequency.value = notes[i];
            const gain = this.createGain(0.12);
            gain.gain.setValueAtTime(0.12 * this.masterVolume, t + delay);
            gain.gain.exponentialRampToValueAtTime(0.001, t + delay + 0.5);
            osc.connect(gain);
            osc.start(t + delay);
            osc.stop(t + delay + 0.5);
        }

        // Shimmering tail
        const bufSize = this.ctx.sampleRate * 1.0;
        const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < bufSize; i++) {
            d[i] = Math.sin(i * 0.1) * Math.sin(i * 0.07) * (1 - i / bufSize) * 0.3;
        }
        const ns = this.ctx.createBufferSource();
        ns.buffer = buf;
        const filter = this.ctx.createBiquadFilter();
        filter.type = "bandpass";
        filter.frequency.value = 3000;
        filter.Q.value = 2;
        const nGain = this.createGain(0.15);
        nGain.gain.setValueAtTime(0.001, t);
        nGain.gain.linearRampToValueAtTime(0.15 * this.masterVolume, t + 0.5);
        nGain.gain.exponentialRampToValueAtTime(0.001, t + 1.5);
        ns.connect(filter);
        filter.connect(nGain);
        ns.start(t);
        ns.stop(t + 1.5);
    }

    // --- FOOTSTEPS ---

    footstep() {
        if (!this.ensureContext()) return;
        const t = this.ctx.currentTime;

        const bufSize = this.ctx.sampleRate * 0.04;
        const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < bufSize; i++) {
            d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufSize, 4);
        }
        const ns = this.ctx.createBufferSource();
        ns.buffer = buf;

        const filter = this.ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.value = 600 + Math.random() * 200;

        const gain = this.createGain(0.06);
        gain.gain.setValueAtTime(0.06 * this.masterVolume, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

        ns.connect(filter);
        filter.connect(gain);
        ns.start(t);
        ns.stop(t + 0.04);
    }

    // --- VICTORY ---

    victoryFanfare() {
        if (!this.ensureContext()) return;
        const t = this.ctx.currentTime;

        // Triumphant melody
        const melody = [
            { f: 392, d: 0.0 },  // G4
            { f: 440, d: 0.15 }, // A4
            { f: 523, d: 0.3 },  // C5
            { f: 523, d: 0.5 },  // C5
            { f: 659, d: 0.65 }, // E5
            { f: 784, d: 0.9 },  // G5
            { f: 1047, d: 1.2 }, // C6
        ];
        for (const note of melody) {
            const osc = this.ctx.createOscillator();
            osc.type = "triangle";
            osc.frequency.value = note.f;
            const gain = this.createGain(0.12);
            gain.gain.setValueAtTime(0.12 * this.masterVolume, t + note.d);
            gain.gain.exponentialRampToValueAtTime(0.001, t + note.d + 0.3);
            osc.connect(gain);
            osc.start(t + note.d);
            osc.stop(t + note.d + 0.3);
        }
    }
}
