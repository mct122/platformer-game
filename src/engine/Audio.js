export class Audio {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.muted = false;
        this.sounds = {};

        // Master Gain
        this.masterGain = this.ctx.createGain();
        this.masterGain.connect(this.ctx.destination);
        this.masterGain.gain.value = 0.3; // Default volume

        // BGM State
        this.bgmOscillators = [];
        this.isPlayingBGM = false;
        this.tempo = 120;
        this.noteTime = 60 / this.tempo / 4; // 16th notes
        this.nextNoteTime = 0;
        this.currentNote = 0;
        this.timerID = null;

        // Simple Pattern (C Majorish)
        // Notes: Frequency or MIDI note number. 0 = rest
        // C4=261.6, E4=329.6, G4=392.0, A4=440.0, B4=493.9, C5=523.3
        this.melody = [
            261.6, 261.6, 0, 261.6, 0, 207.6, 261.6, 0, // C C C Ab C
            311.1, 0, 0, 0, 0, 0, 0, 0,     // Eb (high)

            261.6, 261.6, 0, 261.6, 0, 207.6, 261.6, 0,
            293.7, 0, 0, 0, 0, 0, 0, 0      // D
        ];

        this.bass = [
            130.8, 0, 130.8, 0, 130.8, 0, 130.8, 0, // C3
            155.6, 0, 155.6, 0, 155.6, 0, 155.6, 0  // Eb3
        ];
    }

    toggleMute() {
        this.muted = !this.muted;
        if (this.muted) {
            this.masterGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.1);
        } else {
            this.masterGain.gain.setTargetAtTime(0.3, this.ctx.currentTime, 0.1);
            if (this.ctx.state === 'suspended') this.ctx.resume();
        }
        return this.muted;
    }

    startBGM() {
        if (this.isPlayingBGM) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();
        this.isPlayingBGM = true;
        this.currentNote = 0;
        this.nextNoteTime = this.ctx.currentTime;
        this.scheduler();
    }

    stopBGM() {
        this.isPlayingBGM = false;
        window.clearTimeout(this.timerID);
    }

    scheduler() {
        if (!this.isPlayingBGM) return;

        // Lookahead
        while (this.nextNoteTime < this.ctx.currentTime + 0.1) {
            this.playStep(this.nextNoteTime);

            this.nextNoteTime += this.noteTime;
            this.currentNote++;
        }

        this.timerID = window.setTimeout(this.scheduler.bind(this), 25);
    }

    playStep(time) {
        // Logic to loop melody
        const melodyNote = this.melody[this.currentNote % this.melody.length];
        const bassNote = this.bass[this.currentNote % this.bass.length];

        if (melodyNote > 0) {
            this.playTone(melodyNote, time, 0.1, 'square', 0.1);
        }

        if (bassNote > 0) {
            this.playTone(bassNote, time, 0.1, 'triangle', 0.2);
        }
    }

    playTone(freq, time, duration, type, vol) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, time);

        gain.gain.setValueAtTime(vol, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + duration);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(time);
        osc.stop(time + duration);
    }

    play(name) {
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
        this.playSynth(name);
    }

    playSynth(type) {
        // SFX
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.connect(gain);
        gain.connect(this.masterGain);

        const now = this.ctx.currentTime;

        if (type === 'jump') {
            osc.type = 'square';
            osc.frequency.setValueAtTime(150, now);
            osc.frequency.exponentialRampToValueAtTime(600, now + 0.1);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
            osc.start(now);
            osc.stop(now + 0.1);
        } else if (type === 'coin') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(1200, now);
            osc.frequency.setValueAtTime(1600, now + 0.05); // Coin double ping
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
            osc.start(now);
            osc.stop(now + 0.3);
        } else if (type === 'death') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(400, now);
            osc.frequency.linearRampToValueAtTime(100, now + 0.5); // Descending
            gain.gain.setValueAtTime(0.3, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.5);
            osc.start(now);
            osc.stop(now + 0.5);
        }
    }
}
