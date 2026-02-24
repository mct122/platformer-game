/**
 * Web Audio API を使った効果音・BGM 合成マネージャー
 * 外部ファイル不要でブラウザ上で音を生成する
 */
export class AudioManager {
  constructor() {
    this.ctx = new (window.AudioContext || window.webkitAudioContext)()
    this.master = this.ctx.createGain()
    this.master.gain.value = 0.4
    this.master.connect(this.ctx.destination)
    this.muted = false
    this._bgmNodes = []
    this._bgmRunning = false
    this._bgmNote = 0
    this._bgmTimer = null
    this._tempo = 140
    this._noteLen = 60 / this._tempo / 4

    // マリオ風メロディ (周波数 Hz, 0=休符)
    this._melody = [
      329.6, 329.6, 0, 329.6, 0, 261.6, 329.6, 0,
      392.0, 0, 0, 0, 196.0, 0, 0, 0,
      261.6, 0, 0, 196.0, 0, 0, 164.8, 0,
      220.0, 0, 246.9, 0, 233.1, 0, 220.0, 0,
      196.0, 329.6, 392.0, 440.0, 0, 349.2, 392.0, 0,
      329.6, 0, 261.6, 293.7, 246.9, 0, 0, 0
    ]
    this._bass = [
      130.8, 0, 130.8, 0, 130.8, 0, 130.8, 0,
      155.6, 0, 155.6, 0, 155.6, 0, 155.6, 0,
      130.8, 0, 130.8, 0, 146.8, 0, 146.8, 0,
      130.8, 0, 130.8, 0, 130.8, 0, 130.8, 0,
      196.0, 0, 196.0, 0, 174.6, 0, 196.0, 0,
      130.8, 0, 130.8, 0, 130.8, 0, 130.8, 0
    ]
  }

  resume() {
    if (this.ctx.state === 'suspended') this.ctx.resume()
  }

  toggleMute() {
    this.muted = !this.muted
    this.master.gain.setTargetAtTime(this.muted ? 0 : 0.4, this.ctx.currentTime, 0.1)
    return this.muted
  }

  _tone(freq, time, dur, type = 'square', vol = 0.15) {
    if (!freq) return
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, time)
    gain.gain.setValueAtTime(vol, time)
    gain.gain.exponentialRampToValueAtTime(0.001, time + dur)
    osc.connect(gain)
    gain.connect(this.master)
    osc.start(time)
    osc.stop(time + dur)
  }

  startBGM() {
    if (this._bgmRunning) return
    this.resume()
    this._bgmRunning = true
    this._bgmNote = 0
    this._nextBeat = this.ctx.currentTime
    this._scheduleBGM()
  }

  stopBGM() {
    this._bgmRunning = false
    clearTimeout(this._bgmTimer)
  }

  _scheduleBGM() {
    if (!this._bgmRunning) return
    while (this._nextBeat < this.ctx.currentTime + 0.15) {
      const i = this._bgmNote % this._melody.length
      this._tone(this._melody[i], this._nextBeat, this._noteLen * 0.8, 'square', 0.08)
      this._tone(this._bass[i % this._bass.length], this._nextBeat, this._noteLen * 0.9, 'triangle', 0.12)
      this._nextBeat += this._noteLen
      this._bgmNote++
    }
    this._bgmTimer = setTimeout(() => this._scheduleBGM(), 25)
  }

  play(name) {
    this.resume()
    const t = this.ctx.currentTime
    switch (name) {
      case 'jump':
        this._tone(150, t, 0.05, 'square', 0.2)
        this._tone(400, t + 0.05, 0.08, 'square', 0.15)
        break
      case 'stomp':
        this._tone(300, t, 0.04, 'square', 0.2)
        this._tone(150, t + 0.04, 0.06, 'square', 0.15)
        break
      case 'coin':
        this._tone(1200, t, 0.06, 'sine', 0.2)
        this._tone(1600, t + 0.06, 0.1, 'sine', 0.15)
        break
      case 'powerup':
        [261.6, 329.6, 392.0, 523.3].forEach((f, i) => {
          this._tone(f, t + i * 0.08, 0.1, 'square', 0.15)
        })
        break
      case 'damage':
        this._tone(440, t, 0.05, 'sawtooth', 0.2)
        this._tone(220, t + 0.05, 0.1, 'sawtooth', 0.15)
        break
      case 'death':
        this._tone(440, t, 0.08, 'sawtooth', 0.25)
        this._tone(300, t + 0.08, 0.08, 'sawtooth', 0.2)
        this._tone(200, t + 0.16, 0.1, 'sawtooth', 0.15)
        this._tone(100, t + 0.26, 0.2, 'sawtooth', 0.1)
        break
      case 'block':
        this._tone(220, t, 0.05, 'square', 0.2)
        break
      case 'clear':
        [523.3, 659.3, 783.9, 1046.5].forEach((f, i) => {
          this._tone(f, t + i * 0.1, 0.15, 'sine', 0.18)
        })
        break
    }
  }
}
