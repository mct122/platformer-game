/**
 * Enemy Class
 * 
 * 基本的な敵キャラクター（クリボーなど）のクラスです。
 * 徘徊移動し、踏むと倒せる動作を持ちます。
 */
export class Enemy {
    constructor(game, x, y) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 40;
        this.speed = 50;
        this.velX = this.speed;

        this.image = new Image();
        this.image.onload = () => { this.loaded = true; };
        this.image.onerror = () => { console.error(`Failed to load image: ${this.image.src}`); this.loaded = false; };
        this.image.src = 'assets/enemy.png';
        this.loaded = false;

        this.markedForDeletion = false;
        this.isDead = false;
        this.deathTimer = 0;
    }

    update(dt) {
        if (this.isDead) {
            this.deathTimer += dt;
            if (this.deathTimer > 0.5) {
                this.markedForDeletion = true;
            }
            return;
        }

        this.x += this.velX * dt;

        // 簡易的なパトロール動作
        if (this.x > this.game.canvas.width - 50) this.velX = -this.speed;
        if (this.x < 0) this.velX = this.speed;

        // プレイヤーとの衝突判定
        if (this.checkCollision(this.game.player)) {
            if (this.game.player.velY > 0 && this.game.player.y < this.y) {
                // 踏みつけ成功
                this.squash();
                this.game.player.velY = -300; // Bounce
                this.game.audio.play('coin');
            } else {
                this.game.player.x = 100;
                this.game.player.y = 100;
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

    squash() {
        this.isDead = true;
        this.height = 16; // 潰れた見た目
        this.y += 16; // 床に接するように位置調整
    }

    draw(ctx) {
        if (!this.loaded) return;
        if (this.isDead) {
            ctx.globalAlpha = 1 - (this.deathTimer * 2); // Fade out
        }

        ctx.save();
        ctx.translate(this.x, this.y);

        // 円形のクリッピング
        ctx.beginPath();
        ctx.arc(this.width / 2, this.height / 2, this.width / 2, 0, Math.PI * 2);
        ctx.clip();

        ctx.drawImage(this.image, 0, 0, this.width, this.height);
        ctx.restore();

        ctx.globalAlpha = 1.0;
    }
}
