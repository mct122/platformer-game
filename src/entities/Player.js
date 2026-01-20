/**
 * Player Class
 * 
 * プレイヤーキャラクターのクラスです。
 * 移動、ジャンプ、ダメージ処理、アニメーション描画などを担当します。
 */
export class Player {
    constructor(game, charConfig) {
        this.game = game;
        this.charConfig = charConfig;
        // 統一サイズ（少し大きめ）
        this.width = 50;
        this.height = 50;
        this.x = 100;
        this.y = 100;

        this.velX = 0;
        this.velY = 0;
        this.maxSpeed = 250;
        this.acceleration = 800;
        this.friction = 600;
        this.jumpForce = -600;
        this.gravity = 1500;

        this.isGrounded = false;

        this.image = new Image();
        this.image.onload = () => {
            this.loaded = true;
        };
        this.image.onerror = () => {
            console.error(`Failed to load image: ${this.image.src}`);
            this.loaded = false;
        };
        // 通常状態で開始
        this.updateImageSource();
        this.loaded = false;

        // アニメーション状態
        this.frameX = 0;
        this.frameY = 0;
        this.maxFrame = 3;
        this.fps = 10;
        this.frameTimer = 0;
        this.frameInterval = 1000 / this.fps;

        this.facingRight = true;

        this.powerState = 'small'; // small (通常), big (スーパー) -- ファイアは削除
        this.invulnerable = false;
        this.invulnerableTimer = 0;
    }

    /**
     * 画像ソースを更新します
     * 現在の状態 (normal/super) とキャラクター設定に基づいて画像を読み込みます。
     */
    updateImageSource() {
        if (!this.charConfig) return;
        const type = this.powerState === 'big' ? 'super' : 'normal';
        // 新しい設定構造を使用
        if (this.charConfig.assets) {
            this.image.src = `${this.charConfig.folder}/${this.charConfig.assets[type]}`;
        } else {
            // 必要に応じて古い設定へのフォールバック（Game.jsが更新されていれば発生しないはず）
            this.image.src = `${this.charConfig.path}/${type}.${this.charConfig.ext}`;
        }
    }

    /**
     * プレイヤーを巨大化させます (スーパー状態)
     * キノコ取得時などに呼び出されます。
     */
    grow() {
        if (this.powerState === 'small') {
            this.powerState = 'big';
            this.updateImageSource();
            // サイズ増加は一般的な設定で処理されるが、視覚的に少し大きくするかもしれない
            // ユーザーが統一サイズを求めたため、当たり判定ロジックは維持し、見た目のみ更新。
            // 当たり判定は40x40のままだが、big状態はスーパー画像になる。
        }
    }

    powerUpFire() {
        // リクエストにより削除、巨大化のみ
        this.grow();
    }

    /**
     * ダメージ処理
     * 無敵時間でなければ、状態をダウンさせるか死亡処理を行います。
     */
    takeDamage() {
        if (this.invulnerable || this.isDead) return;

        if (this.powerState === 'big') {
            this.powerState = 'small';
            this.updateImageSource();
            this.invulnerable = true;
            this.invulnerableTimer = 2;
            this.game.audio.play('coin'); // 縮小音のプレースホルダー
        } else {
            // 死亡
            this.die();
        }
    }

    die() {
        this.isDead = true;
        this.game.audio.play('death');
        this.velY = -500; // 跳ね上がる
        // プレイヤーの衝突判定を無効化し、床を通り抜けるようにする
    }

    /**
     * プレイヤーの状態を更新します (1フレーム毎)
     * 移動、ジャンプ、重力、衝突判定を行います。
     * @param {number} dt - デルタタイム
     */
    update(dt) {
        if (this.invulnerable) {
            this.invulnerableTimer -= dt;
            if (this.invulnerableTimer <= 0) {
                this.invulnerable = false;
            }
        }

        if (this.isDead) {
            // 死亡アニメーション: 重力を適用、Y座標移動、画面外落下以外の入力/衝突を無視
            this.velY += this.gravity * dt;
            this.y += this.velY * dt;
            if (this.y > this.game.canvas.height + 100) {
                // ゲームオーバー状態のトリガー
                this.game.state = 3; // GAME_OVER
            }
            return;
        }

        // 慣性付き移動
        if (this.game.input.state.left) {
            if (this.velX > 0) this.velX -= this.friction * 2 * dt; // クイックターン
            this.velX -= this.acceleration * dt;
            this.facingRight = false;
        } else if (this.game.input.state.right) {
            if (this.velX < 0) this.velX += this.friction * 2 * dt; // クイックターン
            this.velX += this.acceleration * dt;
            this.facingRight = true;
        } else {
            // 摩擦
            if (Math.abs(this.velX) > 10) {
                this.velX -= Math.sign(this.velX) * this.friction * dt;
            } else {
                this.velX = 0;
            }
        }

        // 速度制限
        if (Math.abs(this.velX) > this.maxSpeed) {
            this.velX = Math.sign(this.velX) * this.maxSpeed;
        }

        // ジャンプ
        if (this.game.input.state.jump) {
            if (this.isGrounded) {
                this.velY = this.jumpForce;
                this.isGrounded = false;
                this.game.audio.play('jump');
            }
        } else {
            // 可変ジャンプ: 早期に離すと上昇速度カット
            if (this.velY < -100 && !this.isGrounded) {
                this.velY *= 0.5; // 上昇速度を減衰
            }
        }

        // 重力適用
        this.velY += this.gravity * dt;

        // 速度適用
        this.x += this.velX * dt;
        this.y += this.velY * dt;

        // 単純な床判定
        if (this.y > this.game.groundY - this.height) {
            this.y = this.game.groundY - this.height;
            this.velY = 0;
            this.isGrounded = true;
        }

        // ブロック衝突
        if (this.game.blocks) {
            this.game.blocks.forEach(block => {
                // 乗るための単純なAABB
                // プレイヤーがブロックの上に落ちてきているか確認
                if (this.velY >= 0) {
                    // X軸の重なり
                    if (this.x + this.width > block.x && this.x < block.x + block.width) {
                        // Y軸の重なり: プレイヤーの下部がブロック上部付近にあるか
                        const pBottom = this.y + this.height;
                        // 少しの猶予を許容
                        if (pBottom >= block.y && pBottom <= block.y + 20) { // 20pxの閾値
                            // 上部にスナップ
                            this.y = block.y - this.height;
                            this.velY = 0;
                            this.isGrounded = true;
                        }
                    }
                }
            });
        }

        // アニメーションロジック
        if (Math.abs(this.velX) > 10) {
            // 走行中
            this.frameTimer += dt * 1000;
            if (this.frameTimer > this.frameInterval) {
                this.frameTimer = 0;
                this.frameX++;
                if (this.frameX > this.maxFrame) this.frameX = 1; // 1-3をループ
            }
        } else {
            // 待機中
            this.frameX = 0;
        }

        // ジャンプフレーム
        if (!this.isGrounded) {
            this.frameX = 3; // 最後のフレームをジャンプとする
        }
    }

    /**
     * プレイヤーを描画します
     * 向きに合わせて反転、死亡時の回転、円形のクリッピング処理を行います。
     * @param {CanvasRenderingContext2D} ctx - 描画コンテキスト
     */
    draw(ctx) {
        if (!this.loaded || !this.image.complete || this.image.naturalWidth === 0) return;

        // 左向きならスプライトを反転
        ctx.save();
        if (!this.loaded) return;

        if (!this.facingRight) {
            ctx.translate(this.x + this.width, this.y);
            ctx.scale(-1, 1);
            if (this.isDead) ctx.rotate(Math.PI);

            // 切り抜き風の円形クリップ
            ctx.beginPath();
            // 正方形の中心
            ctx.arc(this.width / 2, this.height / 2, this.width / 2, 0, Math.PI * 2);
            ctx.clip();

            ctx.drawImage(this.image, 0, 0, this.width, this.height);

        } else {
            if (this.isDead) {
                ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
                ctx.rotate(Math.PI);

                // 円形クリップ
                ctx.beginPath();
                ctx.arc(0, 0, this.width / 2, 0, Math.PI * 2);
                ctx.clip();

                ctx.drawImage(this.image, -this.width / 2, -this.height / 2, this.width, this.height);
            } else {
                // x, y 相対での円形クリップ
                // 保存/復元、またはパス作成が必要
                // 変換していないのでパス確認は容易
                // しかし通常は描画位置にtranslateして論理的な0,0を再利用する方が簡単
                ctx.save(); // クリップ用のネスト保存
                ctx.translate(this.x, this.y);
                ctx.beginPath();
                ctx.arc(this.width / 2, this.height / 2, this.width / 2, 0, Math.PI * 2);
                ctx.clip();
                ctx.drawImage(this.image, 0, 0, this.width, this.height);
                ctx.restore();
            }
        }
        ctx.restore();
    }
}
