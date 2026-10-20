// ============================================================================
// DARK AUDIO SYNTHESIS ENGINE (Web Audio API)
// Atmospheric Sub-Bass Drone, Geiger Ticks, Tannhaus Clock Clicks & Chimes
// ============================================================================

class DarkAudioEngine {
    constructor() {
        this.ctx = null;
        this.isMuted = true; // start muted per browser policy, toggleable in UI
        this.isInitialized = false;
        
        // Drone nodes
        this.droneGain = null;
        this.osc1 = null;
        this.osc2 = null;
        this.droneFilter = null;
        this.lfo = null;
    }

    init() {
        if (this.isInitialized) return;
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
            this.isInitialized = true;
            this.setupDrone();
        } catch (e) {
            console.warn("Web Audio API not supported or blocked", e);
        }
    }

    setupDrone() {
        if (!this.ctx) return;

        // Master Gain for Drone
        this.droneGain = this.ctx.createGain();
        this.droneGain.gain.setValueAtTime(0, this.ctx.currentTime);

        // Low pass filter for dark, muffled, deep cave resonance
        this.droneFilter = this.ctx.createBiquadFilter();
        this.droneFilter.type = 'lowpass';
        this.droneFilter.frequency.setValueAtTime(110, this.ctx.currentTime);
        this.droneFilter.Q.setValueAtTime(3.5, this.ctx.currentTime);

        // Oscillator 1 - Deep Sub Bass (55 Hz - A1)
        this.osc1 = this.ctx.createOscillator();
        this.osc1.type = 'sawtooth';
        this.osc1.frequency.setValueAtTime(55, this.ctx.currentTime);

        // Oscillator 2 - Detuned Sub Bass (54.4 Hz for beating pulse)
        this.osc2 = this.ctx.createOscillator();
        this.osc2.type = 'sine';
        this.osc2.frequency.setValueAtTime(54.4, this.ctx.currentTime);

        // LFO to slowly breathe the filter frequency (0.1 Hz)
        this.lfo = this.ctx.createOscillator();
        this.lfo.frequency.setValueAtTime(0.08, this.ctx.currentTime);
        const lfoGain = this.ctx.createGain();
        lfoGain.gain.setValueAtTime(35, this.ctx.currentTime);
        this.lfo.connect(lfoGain);
        lfoGain.connect(this.droneFilter.frequency);

        // Connect chain
        this.osc1.connect(this.droneFilter);
        this.osc2.connect(this.droneFilter);
        this.droneFilter.connect(this.droneGain);
        this.droneGain.connect(this.ctx.destination);

        this.osc1.start();
        this.osc2.start();
        this.lfo.start();
    }

    toggleMute() {
        if (!this.isInitialized) {
            this.init();
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }

        this.isMuted = !this.isMuted;

        if (this.droneGain) {
            const targetGain = this.isMuted ? 0 : 0.08;
            this.droneGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.4);
        }

        return !this.isMuted;
    }

    // Mechanical Tannhaus clockwork click
    playClick() {
        if (this.isMuted || !this.ctx) return;
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(1200, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.03);

            gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.03);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start();
            osc.stop(this.ctx.currentTime + 0.035);
        } catch (e) {}
    }

    // Subtle Geiger counter crackle for anomaly/timeline scrubbing
    playGeiger() {
        if (this.isMuted || !this.ctx) return;
        try {
            const bufferSize = this.ctx.sampleRate * 0.015;
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }

            const noise = this.ctx.createBufferSource();
            noise.buffer = buffer;

            const filter = this.ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(2400 + Math.random() * 800, this.ctx.currentTime);
            filter.Q.setValueAtTime(6.0, this.ctx.currentTime);

            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.015);

            noise.connect(filter);
            filter.connect(gain);
            gain.connect(this.ctx.destination);
            noise.start();
        } catch (e) {}
    }

    // Eerie harmonic chime on cycle shift
    playCycleChime(colorTone = 440) {
        if (this.isMuted || !this.ctx) return;
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(colorTone, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(colorTone * 1.5, this.ctx.currentTime + 0.6);

            gain.gain.setValueAtTime(0.07, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.8);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start();
            osc.stop(this.ctx.currentTime + 0.85);
        } catch (e) {}
    }

    // Typewriter mechanical tap for chatbot responses
    playTypewriter() {
        if (this.isMuted || !this.ctx) return;
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(600 + Math.random() * 300, this.ctx.currentTime);

            gain.gain.setValueAtTime(0.015, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.018);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start();
            osc.stop(this.ctx.currentTime + 0.02);
        } catch (e) {}
    }
}

window.darkAudio = new DarkAudioEngine();
