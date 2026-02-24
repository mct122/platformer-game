/**
 * Koopa Class
 * 
 * カメの敵キャラです。
 * 踏むと甲羅になり、蹴ることができる動作を持ちます。
 */
export class Koopa {
    constructor(game, x, y) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 55; // Taller than goomba, slightly larger
        this.speed = 30; // Slower
        this.velX = -this.speed;
        this.velY = 0;

        this.image = new Image();
        this.image.onload = () => { this.loaded = true; };
        this.image.onerror = () => { console.error(`Failed to load image: ${this.image.src}`); this.loaded = false; };
        this.image.src = 'assets/koopa.png';
        this.loaded = false;

        this.state = 'walking'; // walking, shell_still, shell_moving
        this.markedForDeletion = false;
    }

    /**
     * 状態を更新します
     * 移動、重力、衝突判定、プレイヤーとの相互作用（踏む、蹴る）を処理します。
     * @param {number} dt - デルタタイム
     */
    update(dt) {
        this.velY += 1500 * dt; // 重力
        this.y += this.velY * dt;

        // 地面との衝突
        if (this.y > this.game.groundY - this.height) {
            this.y = this.game.groundY - this.height;
            this.velY = 0;
        }

        if (this.state === 'walking') {
            this.x += this.velX * dt;
            if (this.x < 0 || this.x > 20000) this.velX *= -1; // 単純なワールド境界
        } else if (this.state === 'shell_moving') {
            this.x += this.velX * dt;
        }

        // プレイヤーとの衝突判定
        if (this.checkCollision(this.game.player)) {
            const player = this.game.player;
            // 踏みつけロジック: プレイヤーが落下中で敵より上にいる
            if (player.velY > 0 && player.y + player.height < this.y + this.height * 0.5) {
                player.velY = -300; // バウンス
                player.y = this.y - player.height; // めり込み防止のために上にスナップ

                if (this.state === 'walking') {
                    this.state = 'shell_still';
                    this.height = 32; // しゃがむ
                    this.y = this.game.groundY - 32; // 位置合わせのために地面に強制移動
                    this.velX = 0;
                } else if (this.state === 'shell_still') {
                    this.state = 'shell_moving';
                    // プレイヤーから離れる方向に蹴る
                    this.velX = (player.x < this.x) ? 400 : -400;
                    // 即時の再衝突を防ぐ
                    this.x += (this.velX > 0) ? 10 : -10;
                } else if (this.state === 'shell_moving') {
                    this.state = 'shell_still';
                    this.velX = 0;
                }
                this.game.audio.play('coin');
            } else {
                // 踏みつけ以外
                if (this.state === 'shell_still') {
                    // 蹴る
                    this.state = 'shell_moving';
                    this.velX = (player.x < this.x) ? 400 : -400;
                    this.game.audio.play('coin');
                } else {
                    // 側面/下からの接触でのみダメージ
                    player.takeDamage();
                }
            }
        }
    }

    checkCollision(rect) {
        return (
            this.x < rect.x + rect.width &&
            this.x + this.width > rect.x &&
            this.y < rect.y + rect.height &&
            this.y + this.height > rect.y
        );
    }

    draw(ctx) {
        if (!this.loaded) return;

        ctx.save();
        ctx.translate(this.x, this.y);

        // 切り抜き風の円形クリップ
        ctx.beginPath();
        // 高さ != 幅の場合中心調整 (Koopaは高さ48)
        // 縦方向を中心に合わせる
        const radius = Math.min(this.width, this.height) / 2;
        ctx.arc(this.width / 2, this.height / 2, radius, 0, Math.PI * 2);
        ctx.clip();


        ctx.drawImage(this.image, 0, 0, this.width, this.height);
        ctx.restore();
    }
}
