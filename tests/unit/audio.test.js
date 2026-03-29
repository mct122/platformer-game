/**
 * 【単体テスト】AudioManager
 * 対象: startBGM/stopBGM, toggleMute, play() SE名一覧, _tone 呼び出し検証
 */
import { describe, test, expect, vi, beforeEach } from 'vitest'

// ─── Web Audio API モック ─────────────────────────────
class MockGain {
  constructor() {
    this.gain = {
      value: 0.4,
      setValueAtTime: vi.fn(),
      setTargetAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
    }
  }
  connect = vi.fn()
}

class MockOscillator {
  constructor() {
    this.type = 'sine'
    this.frequency = {
      setValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
    }
  }
  connect = vi.fn()
  start   = vi.fn()
  stop    = vi.fn()
}

class MockBufferSource {
  constructor() { this.buffer = null }
  connect = vi.fn()
  start   = vi.fn()
}

class MockAudioContext {
  constructor() {
    this.state       = 'running'
    this.currentTime = 0
    this.sampleRate  = 44100
    this.destination = {}
  }
  createGain()         { return new MockGain() }
  createOscillator()   { return new MockOscillator() }
  createBuffer(ch, len) { return { getChannelData: () => new Float32Array(len) } }
  createBufferSource() { return new MockBufferSource() }
  resume  = vi.fn()
  suspend = vi.fn()
}

// Phaser が依存する window グローバルをセット
beforeEach(() => {
  vi.stubGlobal('AudioContext', MockAudioContext)
  vi.stubGlobal('window', { AudioContext: MockAudioContext })
})

// AudioManager を動的 import（モック設定後）
async function getAudioManager() {
  // ESM cache を避けるためクエリ付き import
  const mod = await import('../../src/utils/AudioManager.js?t=' + Date.now())
  return mod.AudioManager
}

describe('Unit: AudioManager', () => {

  // ─── コンストラクタ ────────────────────────────────
  describe('コンストラクタ', () => {
    test('インスタンス生成できる', async () => {
      const AudioManager = await getAudioManager()
      const am = new AudioManager()
      expect(am).toBeTruthy()
    })

    test('初期 muted は false', async () => {
      const AudioManager = await getAudioManager()
      const am = new AudioManager()
      expect(am.muted).toBe(false)
    })

    test('_bgmRunning は初期 false', async () => {
      const AudioManager = await getAudioManager()
      const am = new AudioManager()
      expect(am._bgmRunning).toBe(false)
    })

    test('_melody は 48 音符で構成される', async () => {
      const AudioManager = await getAudioManager()
      const am = new AudioManager()
      expect(am._melody).toHaveLength(48)
    })

    test('_bass は 48 音符で構成される', async () => {
      const AudioManager = await getAudioManager()
      const am = new AudioManager()
      expect(am._bass).toHaveLength(48)
    })
  })

  // ─── toggleMute ───────────────────────────────────
  describe('toggleMute()', () => {
    test('1回呼ぶと muted = true になる', async () => {
      const AudioManager = await getAudioManager()
      const am = new AudioManager()
      const result = am.toggleMute()
      expect(result).toBe(true)
      expect(am.muted).toBe(true)
    })

    test('2回呼ぶと muted = false に戻る', async () => {
      const AudioManager = await getAudioManager()
      const am = new AudioManager()
      am.toggleMute()
      const result = am.toggleMute()
      expect(result).toBe(false)
      expect(am.muted).toBe(false)
    })

    test('返り値は現在の muted 状態', async () => {
      const AudioManager = await getAudioManager()
      const am = new AudioManager()
      expect(am.toggleMute()).toBe(true)
      expect(am.toggleMute()).toBe(false)
      expect(am.toggleMute()).toBe(true)
    })
  })

  // ─── startBGM / stopBGM ───────────────────────────
  describe('startBGM() / stopBGM()', () => {
    test('startBGM() で _bgmRunning = true になる', async () => {
      const AudioManager = await getAudioManager()
      const am = new AudioManager()
      am.startBGM()
      expect(am._bgmRunning).toBe(true)
    })

    test('stopBGM() で _bgmRunning = false になる', async () => {
      const AudioManager = await getAudioManager()
      const am = new AudioManager()
      am.startBGM()
      am.stopBGM()
      expect(am._bgmRunning).toBe(false)
    })

    test('startBGM() を2回呼んでも重複開始しない', async () => {
      const AudioManager = await getAudioManager()
      const am = new AudioManager()
      am.startBGM()
      const note1 = am._bgmNote
      am.startBGM() // 2回目は何もしない
      expect(am._bgmNote).toBe(note1)
    })

    test('startBGM() 後 stopBGM() → 再 startBGM() できる', async () => {
      const AudioManager = await getAudioManager()
      const am = new AudioManager()
      am.startBGM()
      am.stopBGM()
      am.startBGM()
      expect(am._bgmRunning).toBe(true)
    })
  })

  // ─── play() SE 呼び出し ───────────────────────────
  describe('play() — SE 再生', () => {
    const SE_NAMES = [
      'jump', 'stomp', 'coin', 'powerup',
      'damage', 'death', 'block', 'clear',
      'shell', 'combo', 'fall',
    ]

    test.each(SE_NAMES)('play("%s") がエラーなく実行できる', async (name) => {
      const AudioManager = await getAudioManager()
      const am = new AudioManager()
      expect(() => am.play(name)).not.toThrow()
    })

    test('未知のSE名を渡してもクラッシュしない', async () => {
      const AudioManager = await getAudioManager()
      const am = new AudioManager()
      expect(() => am.play('unknownSE')).not.toThrow()
    })
  })

  // ─── _tone() 内部ロジック ─────────────────────────
  describe('_tone() 内部メソッド', () => {
    test('freq=0 のとき何も生成しない（休符）', async () => {
      const AudioManager = await getAudioManager()
      const am = new AudioManager()
      const spy = vi.spyOn(am.ctx, 'createOscillator')
      am._tone(0, 0, 0.1)
      expect(spy).not.toHaveBeenCalled()
    })

    test('freq > 0 のとき Oscillator が生成される', async () => {
      const AudioManager = await getAudioManager()
      const am = new AudioManager()
      const spy = vi.spyOn(am.ctx, 'createOscillator')
      am._tone(440, 0, 0.1)
      expect(spy).toHaveBeenCalledOnce()
    })
  })
})
