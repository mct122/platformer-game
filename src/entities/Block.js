import { Item } from './Item.js';

export class Block {
    constructor(game, x, y, itemType) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.width = 32;
        this.height = 32;
        this.itemType = itemType; // 'mushroom', 'flower', 'coin'
        this.active = true;
        this.bumpY = 0;
        this.bumpTimer = 0;

        // Visuals: just a yellow rect for now? Or generate asset later
        // Let's use drawing for now
    }

    update(dt) {
        if (this.bumpTimer > 0) {
            this.bumpTimer += dt;
            // Up and down animation
            if (this.bumpTimer < 0.1) this.bumpY -= 100 * dt;
            else if (this.bumpTimer < 0.2) this.bumpY += 100 * dt;
            else {
                this.bumpTimer = 0;
                this.bumpY = 0;
            }
        }

        // Collision Detection from Bottom
        const p = this.game.player;
        if (this.checkCollision(p)) {
            // Check if player hit form bottom
            // Center X check
            if (p.x + p.width > this.x + 5 && p.x < this.x + this.width - 5) {
                if (p.velY < 0 && p.y > this.y + this.height - 10) {
                    // Hit!
                    p.velY = 0; // Stop player head
                    p.y = this.y + this.height;
                    this.hit();
                }
            } else {
                // Side/Top collision -> solid block
                // (Simplified AABB resolve)
                // This might be tricky without full physics engine
                // For now, let's just do simple floor for top
                if (p.y + p.height <= this.y + 10 && p.velY >= 0) {
                    p.isGrounded = true;
                    p.velY = 0;
                    p.y = this.y - p.height;
                }
            }
        }
    }

    hit() {
        if (!this.active) return;
        this.active = false;
        this.bumpTimer = 0.001;

        // Spawn Item
        if (this.itemType) {
            const item = new Item(this.game, this.x, this.y, this.itemType);
            this.game.items.push(item);
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
        ctx.save();
        ctx.fillStyle = this.active ? '#FFD700' : '#8B4513'; // Gold vs Brown
        ctx.translate(this.x, this.y + this.bumpY);
        ctx.fillRect(0, 0, this.width, this.height);

        // ? Mark
        if (this.active) {
            ctx.fillStyle = 'black';
            ctx.font = '20px monospace';
            ctx.fillText('?', 8, 22);
        }

        ctx.strokeStyle = 'black';
        ctx.strokeRect(0, 0, this.width, this.height);
        ctx.restore();
    }
}
