/**
 * 【単体テスト】GameData 定数
 * 対象: CHARACTERS, TILE_SIZE, PLAYER_SIZE, GRAVITY, MAP_WIDTH, MAP_HEIGHT
 */
import { describe, test, expect } from 'vitest'
import {
  CHARACTERS,
  TILE_SIZE,
  PLAYER_SIZE,
  GRAVITY,
  MAP_WIDTH,
  MAP_HEIGHT,
} from '../../src/utils/GameData.js'

describe('Unit: GameData 定数', () => {

  // ─── CHARACTERS 配列 ──────────────────────────────
  describe('CHARACTERS', () => {
    test('3 キャラクター定義されている', () => {
      expect(CHARACTERS).toHaveLength(3)
    })

    test('各キャラに必須フィールドが揃っている', () => {
      for (const c of CHARACTERS) {
        expect(c).toHaveProperty('name')
        expect(c).toHaveProperty('stats')
        expect(c).toHaveProperty('tag')
        expect(c).toHaveProperty('color')
        expect(c.stats).toHaveProperty('speed')
        expect(c.stats).toHaveProperty('accel')
        expect(c.stats).toHaveProperty('jump')
        expect(c.stats).toHaveProperty('fallMulti')
      }
    })

    test('Donko が BALANCED タグを持つ', () => {
      const donko = CHARACTERS.find(c => c.name === 'Donko')
      expect(donko).toBeDefined()
      expect(donko.tag).toBe('BALANCED')
    })

    test('Poon が SPEED タグ・最大速度を持つ', () => {
      const poon = CHARACTERS.find(c => c.name === 'Poon')
      expect(poon).toBeDefined()
      expect(poon.tag).toBe('SPEED')
      // SPEED キャラは最も速い
      const maxSpeed = Math.max(...CHARACTERS.map(c => c.stats.speed))
      expect(poon.stats.speed).toBe(maxSpeed)
    })

    test('Emanuel が JUMPER タグ・最大ジャンプ力を持つ', () => {
      const ema = CHARACTERS.find(c => c.name === 'Emanuel')
      expect(ema).toBeDefined()
      expect(ema.tag).toBe('JUMPER')
      // JUMPER はジャンプ値が最も大きい（負の値なので最小）
      const maxJump = Math.min(...CHARACTERS.map(c => c.stats.jump))
      expect(ema.stats.jump).toBe(maxJump)
    })

    test('jump は全キャラ負の値（上方向）', () => {
      for (const c of CHARACTERS) {
        expect(c.stats.jump).toBeLessThan(0)
      }
    })

    test('fallMulti は全キャラ 1 以上（重力増幅）', () => {
      for (const c of CHARACTERS) {
        expect(c.stats.fallMulti).toBeGreaterThanOrEqual(1)
      }
    })

    test('speed と accel は全キャラ正の値', () => {
      for (const c of CHARACTERS) {
        expect(c.stats.speed).toBeGreaterThan(0)
        expect(c.stats.accel).toBeGreaterThan(0)
      }
    })

    test('キャラ名はすべて一意', () => {
      const names = CHARACTERS.map(c => c.name)
      expect(new Set(names).size).toBe(names.length)
    })

    test('tag はすべて一意', () => {
      const tags = CHARACTERS.map(c => c.tag)
      expect(new Set(tags).size).toBe(tags.length)
    })
  })

  // ─── マップ定数 ──────────────────────────────────
  describe('マップ・物理定数', () => {
    test('TILE_SIZE は 32', () => {
      expect(TILE_SIZE).toBe(32)
    })

    test('PLAYER_SIZE は 44 (TILE_SIZE より大きい)', () => {
      expect(PLAYER_SIZE).toBe(44)
      expect(PLAYER_SIZE).toBeGreaterThan(TILE_SIZE)
    })

    test('GRAVITY は正の値', () => {
      expect(GRAVITY).toBeGreaterThan(0)
    })

    test('MAP_WIDTH は 6400', () => {
      expect(MAP_WIDTH).toBe(6400)
    })

    test('MAP_HEIGHT は 800', () => {
      expect(MAP_HEIGHT).toBe(800)
    })

    test('MAP_WIDTH は MAP_HEIGHT より十分に大きい（横スクロール）', () => {
      expect(MAP_WIDTH).toBeGreaterThan(MAP_HEIGHT * 2)
    })
  })

  // ─── キャラクター index アクセス ───────────────────
  describe('インデックスアクセス', () => {
    test('CHARACTERS[0] が Donko（デフォルトキャラ）', () => {
      expect(CHARACTERS[0].name).toBe('Donko')
    })

    test('CHARACTERS[1] が Poon', () => {
      expect(CHARACTERS[1].name).toBe('Poon')
    })

    test('CHARACTERS[2] が Emanuel', () => {
      expect(CHARACTERS[2].name).toBe('Emanuel')
    })
  })
})
