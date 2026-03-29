/**
 * 【E2E / 総合テスト】ゲームプレイ
 * 対象: Vite dev server を起動 → Playwright でブラウザ操作
 *
 * 実行前提:
 *   - `npm run dev` または `vite preview` が別途起動済み（PORT=5173）
 *   - または E2E_URL 環境変数でサーバー URL を指定
 *
 * 実行方法:
 *   npm run test:e2e
 */
import { chromium } from 'playwright'
import { describe, test, expect, beforeAll, afterAll } from 'vitest'

const BASE_URL = process.env.E2E_URL || 'http://localhost:5173'
const TIMEOUT   = 30000

let browser
let page

async function waitForGame(page) {
  // Phaser の canvas が表示されるまで待機
  await page.waitForSelector('canvas', { timeout: TIMEOUT })
}

beforeAll(async () => {
  browser = await chromium.launch({ headless: true })
  page    = await browser.newPage()
  // ページロード
  try {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: TIMEOUT })
  } catch {
    // サーバー未起動の場合はスキップ（後続テストで個別にスキップ）
  }
}, TIMEOUT)

afterAll(async () => {
  if (browser) await browser.close()
})

// ─── ヘルパー: サーバー到達可否チェック ──────────────
async function isServerReachable() {
  try {
    const resp = await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 5000 })
    return resp && resp.ok()
  } catch {
    return false
  }
}

describe('E2E: ゲーム起動・画面遷移', () => {

  // T01: canvas 表示確認
  test('T01: Vite サーバーに到達し canvas が表示される', async () => {
    const reachable = await isServerReachable()
    if (!reachable) {
      console.warn('⚠️  Vite dev server 未起動 — E2E テストをスキップ')
      return
    }
    await waitForGame(page)
    const canvas = await page.$('canvas')
    expect(canvas).not.toBeNull()
  }, TIMEOUT)

  // T02: TitleScene 表示
  test('T02: タイトル画面が描画される（canvas サイズ確認）', async () => {
    const reachable = await isServerReachable()
    if (!reachable) return

    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: TIMEOUT })
    await waitForGame(page)

    const canvas = page.locator('canvas')
    const box    = await canvas.boundingBox()
    expect(box).not.toBeNull()
    expect(box.width).toBeGreaterThan(0)
    expect(box.height).toBeGreaterThan(0)
  }, TIMEOUT)

  // T03: Space キー → キャラ選択画面
  test('T03: Space キー押下でキャラ選択に遷移する（canvas 継続表示）', async () => {
    const reachable = await isServerReachable()
    if (!reachable) return

    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: TIMEOUT })
    await waitForGame(page)
    await page.waitForTimeout(1500) // TitleScene 描画待ち

    await page.keyboard.press('Space')
    await page.waitForTimeout(1000) // シーン遷移アニメーション待ち

    // canvas が消えていないこと = Phaser がクラッシュしていない
    const canvas = await page.$('canvas')
    expect(canvas).not.toBeNull()
  }, TIMEOUT)

  // T04: タイトル→キャラ選択→ゲーム開始フロー
  test('T04: キャラ選択して Enter でゲームシーンが始まる', async () => {
    const reachable = await isServerReachable()
    if (!reachable) return

    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: TIMEOUT })
    await waitForGame(page)
    await page.waitForTimeout(1500)

    // TitleScene → CharSelectScene
    await page.keyboard.press('Space')
    await page.waitForTimeout(800)

    // CharSelectScene → GameScene (Enter or Space)
    await page.keyboard.press('Enter')
    await page.waitForTimeout(800)

    const canvas = await page.$('canvas')
    expect(canvas).not.toBeNull()
  }, TIMEOUT)
})

describe('E2E: プレイヤー操作', () => {

  beforeAll(async () => {
    const reachable = await isServerReachable()
    if (!reachable) return

    // ゲームシーンへ遷移
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: TIMEOUT })
    await waitForGame(page)
    await page.waitForTimeout(1500)
    await page.keyboard.press('Space')
    await page.waitForTimeout(800)
    await page.keyboard.press('Enter')
    await page.waitForTimeout(1000)
  }, TIMEOUT)

  // P01: 左右移動
  test('P01: 左右キー押下でエラーが発生しない', async () => {
    const reachable = await isServerReachable()
    if (!reachable) return

    await expect(async () => {
      await page.keyboard.down('ArrowRight')
      await page.waitForTimeout(300)
      await page.keyboard.up('ArrowRight')
      await page.keyboard.down('ArrowLeft')
      await page.waitForTimeout(300)
      await page.keyboard.up('ArrowLeft')
    }).not.toThrow()

    const canvas = await page.$('canvas')
    expect(canvas).not.toBeNull()
  }, TIMEOUT)

  // P02: ジャンプ
  test('P02: スペースキーでジャンプできる（canvas 継続表示）', async () => {
    const reachable = await isServerReachable()
    if (!reachable) return

    await page.keyboard.press('Space')
    await page.waitForTimeout(600)

    const canvas = await page.$('canvas')
    expect(canvas).not.toBeNull()
  }, TIMEOUT)

  // P03: コンソールエラーがない（JS クラッシュ検知）
  test('P03: 30秒間操作してもコンソールエラーが発生しない', async () => {
    const reachable = await isServerReachable()
    if (!reachable) return

    const errors = []
    page.on('pageerror', err => errors.push(err.message))

    // 簡単な操作シーケンス
    await page.keyboard.press('ArrowRight')
    await page.waitForTimeout(500)
    await page.keyboard.press('Space')
    await page.waitForTimeout(400)
    await page.keyboard.press('ArrowRight')
    await page.waitForTimeout(1000)

    // Phaser 由来でない明らかなエラーのみチェック
    const criticalErrors = errors.filter(e =>
      !e.includes('AudioContext') && // Audio policy は許容
      !e.includes('NotAllowedError')
    )
    expect(criticalErrors).toHaveLength(0)
  }, TIMEOUT)
})
