/**
 * Piranha Class
 * 
 * 土管から出現するパックンフラワーのような敵クラスです。
 * 定期的に上下移動します。
 */
export class Piranha {
    constructor(game, x, y) {
        this.game = game;
        this.x = x;
        this.y = y; // Should be ground - height
        this.width = 32;
        this.height = 48;

        this.image = new Image();
        this.image.onload = () => { this.loaded = true; };
        this.image.onerror = () => { console.error(`Failed to load image: ${this.image.src}`); this.loaded = false; };
        this.image.src = 'assets/piranha.png';
        this.loaded = false;

        this.timer = 0;
        this.isUp = true;
    }

    update(dt) {
        // 上下移動のロジック
        this.timer += dt;
        if (this.timer > 2) {
            this.timer = 0;
            this.isUp = !this.isUp;
        }

        if (this.checkCollision(this.game.player)) {
            // 常にダメージを与える
            this.game.player.takeDamage();
        }
    }

    checkCollision(rect) {
        if (!this.isUp) return false;
        return (
            this.x < rect.x + rect.width &&
            this.x + this.width > rect.x &&
            this.y < rect.y + rect.height &&
            this.y + this.height > rect.y
        );
    }

    draw(ctx) {
        if (!this.loaded) return;
        if (this.isUp) {
            ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
        } else {
            // 土管を描画するか、隠しておく
        }
    }
}
