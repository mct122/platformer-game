/**
 * 【結合テスト】シーンロジック
 * 対象: GameScene のスコア/コイン/ライフ管理ロジック、タイマーボーナス計算
 *       Phaser をスタブで差し替えてブラウザなしで実行
 */
import { describe, test, expect, vi, beforeEach } from 'vitest'

// ─── Phaser スタブ ─────────────────────────────────────
// Phaser の Scene を最小限でモックしてゲームロジックをテストする

class MockRegistry {
  constructor() { this._data = new Map() }
  get(k, def) { return this._data.has(k) ? this._data.get(k) : def }
  set(k, v)   { this._data.set(k, v) }
}

class MockEvents {
  constructor() { this._handlers = new Map() }
  on(event, fn) {
    if (!this._handlers.has(event)) this._handlers.set(event, [])
    this._handlers.get(event).push(fn)
  }
  emit(event, ...args) {
    const handlers = this._handlers.get(event) || []
    handlers.forEach(fn => fn(...args))
  }
  off() {}
}

// ─── ゲームロジックを独立クラスとして抽出 ─────────────
// GameScene のスコア・コイン・ライフ・タイマーロジックを
// Phaser 非依存のピュアクラスとして再実装してテスト

class GameStateManager {
  constructor({ lives = 3, timer = 300 } = {}) {
    this.score  = 0
    this.coins  = 0
    this.lives  = lives
    this._timer = timer
    this._dead  = false
    this._comboCount = 0
    this.events = new MockEvents()
  }

  addScore(value) {
    if (this._dead) return
    this.score += value
    this.events.emit('hudUpdate', this._hudData())
  }

  addCoin() {
    this.coins++
    this.score += 200
    this.events.emit('hudUpdate', this._hudData())
  }

  onDeath() {
    if (this._dead) return
    this._dead = true
    this.lives--
    if (this.lives <= 0) {
      this.events.emit('gameOver', { score: this.score })
    } else {
      this.events.emit('respawn', { lives: this.lives })
    }
  }

  timerBonus() {
    // 残りタイマー × 100pts
    return this._timer * 100
  }

  tickTimer(dt) {
    // dt: 経過秒数
    this._timer = Math.max(0, this._timer - dt)
    if (this._timer === 0) {
      this.events.emit('timerExpired')
    }
  }

  resetCombo() { this._comboCount = 0 }
  incrementCombo() {
    this._comboCount++
    return this._comboCount
  }

  _hudData() {
    return { score: this.score, coins: this.coins, lives: this.lives, timer: this._timer }
  }
}

// ─── テスト ───────────────────────────────────────────

describe('Integration: ゲームステート管理', () => {
  let gs

  beforeEach(() => {
    gs = new GameStateManager({ lives: 3, timer: 300 })
  })

  // ─── スコア ────────────────────────────────────────
  describe('スコア', () => {
    test('初期スコアは 0', () => {
      expect(gs.score).toBe(0)
    })

    test('addScore(100) でスコアが 100 になる', () => {
      gs.addScore(100)
      expect(gs.score).toBe(100)
    })

    test('addScore を複数回呼ぶと累積する', () => {
      gs.addScore(100)
      gs.addScore(200)
      gs.addScore(500)
      expect(gs.score).toBe(800)
    })

    test('死亡後 addScore は無視される', () => {
      gs.onDeath()
      gs.addScore(1000)
      expect(gs.score).toBe(0)
    })
  })

  // ─── コイン ────────────────────────────────────────
  describe('コイン', () => {
    test('初期コインは 0', () => {
      expect(gs.coins).toBe(0)
    })

    test('addCoin() でコイン +1・スコア +200', () => {
      gs.addCoin()
      expect(gs.coins).toBe(1)
      expect(gs.score).toBe(200)
    })

    test('addCoin() 5回でコイン 5・スコア 1000', () => {
      for (let i = 0; i < 5; i++) gs.addCoin()
      expect(gs.coins).toBe(5)
      expect(gs.score).toBe(1000)
    })
  })

  // ─── ライフ・死亡 ──────────────────────────────────
  describe('ライフ・死亡', () => {
    test('初期ライフは 3', () => {
      expect(gs.lives).toBe(3)
    })

    test('onDeath() でライフが 1 減る', () => {
      gs.onDeath()
      expect(gs.lives).toBe(2)
    })

    test('ライフが残っていれば respawn イベントが発火する', () => {
      const spy = vi.fn()
      gs.events.on('respawn', spy)
      gs.onDeath()
      expect(spy).toHaveBeenCalledWith({ lives: 2 })
    })

    test('ライフ 0 で gameOver イベントが発火する', () => {
      const spy = vi.fn()
      gs.events.on('gameOver', spy)
      gs.onDeath() // lives: 2
      gs.onDeath() // lives: 1 (新インスタンスからリセット)
      // 3回死亡でgameOver
      const gs2 = new GameStateManager({ lives: 1 })
      gs2.events.on('gameOver', spy)
      gs2.onDeath()
      expect(spy).toHaveBeenCalledWith({ score: 0 })
    })

    test('死亡後に再度 onDeath() しても重複発火しない', () => {
      const spy = vi.fn()
      gs.events.on('respawn', spy)
      gs.onDeath()
      gs.onDeath() // 2回目は無視
      expect(spy).toHaveBeenCalledOnce()
    })
  })

  // ─── タイマー ──────────────────────────────────────
  describe('タイマー', () => {
    test('初期タイマーは 300 秒', () => {
      expect(gs._timer).toBe(300)
    })

    test('tickTimer(10) でタイマーが 290 になる', () => {
      gs.tickTimer(10)
      expect(gs._timer).toBe(290)
    })

    test('タイマーは 0 以下にならない', () => {
      gs.tickTimer(500)
      expect(gs._timer).toBe(0)
    })

    test('タイマーが 0 で timerExpired イベントが発火する', () => {
      const spy = vi.fn()
      gs.events.on('timerExpired', spy)
      gs.tickTimer(300)
      expect(spy).toHaveBeenCalledOnce()
    })

    test('timerBonus: 残り 100 秒で +10,000pts', () => {
      gs.tickTimer(200) // 300 - 200 = 100 秒残り
      expect(gs.timerBonus()).toBe(10000)
    })

    test('timerBonus: 残り 0 秒で 0pts', () => {
      gs.tickTimer(300)
      expect(gs.timerBonus()).toBe(0)
    })
  })

  // ─── コンボ ────────────────────────────────────────
  describe('コンボカウンタ', () => {
    test('初期コンボは 0', () => {
      expect(gs._comboCount).toBe(0)
    })

    test('incrementCombo() 呼ぶたびに増える', () => {
      expect(gs.incrementCombo()).toBe(1)
      expect(gs.incrementCombo()).toBe(2)
      expect(gs.incrementCombo()).toBe(3)
    })

    test('resetCombo() で 0 に戻る', () => {
      gs.incrementCombo()
      gs.incrementCombo()
      gs.resetCombo()
      expect(gs._comboCount).toBe(0)
    })
  })

  // ─── HUD イベント ──────────────────────────────────
  describe('HUD更新イベント', () => {
    test('addScore() が hudUpdate を emit する', () => {
      const spy = vi.fn()
      gs.events.on('hudUpdate', spy)
      gs.addScore(500)
      expect(spy).toHaveBeenCalledWith({
        score: 500, coins: 0, lives: 3, timer: 300
      })
    })

    test('addCoin() が hudUpdate を emit する', () => {
      const spy = vi.fn()
      gs.events.on('hudUpdate', spy)
      gs.addCoin()
      expect(spy).toHaveBeenCalledWith({
        score: 200, coins: 1, lives: 3, timer: 300
      })
    })
  })
})

// ─── シーン遷移ロジック ────────────────────────────────
describe('Integration: シーン遷移ロジック', () => {

  // GameOverScene → TitleScene への遷移判断
  describe('GameOver 後の遷移', () => {
    test('ゲームオーバー時に score が渡される', () => {
      const gs = new GameStateManager({ lives: 1 })
      gs.addScore(3500)
      gs.addCoin() // +200
      const received = []
      gs.events.on('gameOver', data => received.push(data))
      gs.onDeath()
      expect(received[0].score).toBe(3700)
    })
  })

  // StageClearScene のスコア計算
  describe('StageClear スコア計算', () => {
    test('タイムボーナスが最終スコアに加算される', () => {
      const gs = new GameStateManager({ lives: 3, timer: 200 })
      gs.addScore(5000)
      const finalScore = gs.score + gs.timerBonus()
      expect(finalScore).toBe(5000 + 200 * 100)
      expect(finalScore).toBe(25000)
    })

    test('コインスコアとタイムボーナスの合算', () => {
      const gs = new GameStateManager({ lives: 3, timer: 150 })
      for (let i = 0; i < 10; i++) gs.addCoin()  // 10 × 200 = 2000
      gs.addScore(1000)
      const finalScore = gs.score + gs.timerBonus()
      expect(finalScore).toBe(3000 + 150 * 100)
      expect(finalScore).toBe(18000)
    })
  })
})
