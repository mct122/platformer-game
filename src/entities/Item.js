/**
 * Item Class
 * 
 * キノコなどのアイテムクラスです。
 * スポーン動作、重力、プレイヤーによる取得処理を持ちます。
 */
export class Item {
    constructor(game, x, y, type) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.width = 32;
        this.height = 32;
        this.type = type; // 'mushroom', 'flower'
        this.velX = 50;
        this.velY = -200; // 飛び出す
        this.isSpawning = true;
        this.spawnY = y - 32;

        this.image = new Image();
        this.image.onload = () => { this.loaded = true; };
        this.image.onerror = () => { console.error(`Failed to load image: ${this.image.src}`); this.loaded = false; };
        this.image.src = type === 'mushroom' ? 'assets/mushroom.png' : 'assets/flower.png';
        this.loaded = false;

        this.markedForDeletion = false;
    }

    /**
     * 状態を更新します
     * 出現時のアニメーション、その後の重力、プレイヤーとの接触判定を行います。
     * @param {number} dt - デルタタイム
     */
    update(dt) {
        if (this.isSpawning) {
            this.y -= 50 * dt;
            if (this.y < this.spawnY) {
                this.y = this.spawnY;
                this.isSpawning = false;
                this.velY = 0;
            }
            return;
        }

        // 通常の重力と移動を適用
        this.velY += 1500 * dt;
        this.x += this.velX * dt;

        // 地面との衝突
        if (this.y > this.game.groundY - this.height) {
            this.y = this.game.groundY - this.height;
            this.velY = 0;
        }

        // 壁/境界での跳ね返り
        if (this.x < 0 || this.x > 20000) this.velX *= -1;

        // 取得処理
        if (this.checkCollision(this.game.player)) {
            if (this.type === 'mushroom') this.game.player.grow();
            // フラワーのロジックは削除
            this.markedForDeletion = true;
            this.game.audio.play('coin'); // パワーアップ音であるべき
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
        ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
    }
}
