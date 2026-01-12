export class Background {
    constructor(game) {
        this.game = game;
        this.image = new Image();
        this.image.src = 'assets/sky.png';
        this.x = 0;
        this.speed = 20; // Slower than player
    }

    update(dt) {
        // Parallax based on player movement
        if (this.game.player && this.game.player.velX !== 0) {
            // Move background opposite to player direction, but slower
            this.x -= (this.game.player.velX * 0.2) * dt;
        }

        // Loop background
        if (this.image.width > 0) {
            if (this.x <= -this.image.width) this.x += this.image.width;
            if (this.x >= this.image.width) this.x -= this.image.width;
        }
    }

    draw(ctx) {
        if (!this.image.width) return;

        // Draw image twice to cover screen
        // Assumes image width is somewhat wide. If not, might need 3+ draws.
        // For simplicity, let's tile it horizontally based on canvas width

        let startX = this.x % this.image.width;
        // If startX is positive (player moved left), we need to draw leftward too? 
        // Just keeping it simple: tiling

        // Ensure x is within [-width, 0] to simplify
        if (startX > 0) startX -= this.image.width;

        let currentX = startX;
        while (currentX < ctx.canvas.width) {
            ctx.drawImage(this.image, currentX, 0, this.image.width, ctx.canvas.height); // Scale height to fit
            currentX += this.image.width;
        }
    }
}
