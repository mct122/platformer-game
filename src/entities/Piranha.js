export class Piranha {
    constructor(game, x, y) {
        this.game = game;
        this.x = x;
        this.y = y; // Should be ground - height
        this.width = 32;
        this.height = 48;

        this.image = new Image();
        this.image.src = '/assets/piranha.png';

        this.timer = 0;
        this.isUp = true;
    }

    update(dt) {
        // Move up and down?
        this.timer += dt;
        if (this.timer > 2) {
            this.timer = 0;
            this.isUp = !this.isUp;
        }

        if (this.checkCollision(this.game.player)) {
            // Always hurts
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
        if (this.isUp) {
            ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
        } else {
            // Draw pipe stub? Or just hide
        }
    }
}
