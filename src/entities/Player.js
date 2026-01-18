export class Player {
    constructor(game, charConfig) {
        this.game = game;
        this.charConfig = charConfig;
        // Unified size 40x40
        this.width = 40;
        this.height = 40;
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
        // Start normal
        this.updateImageSource();
        this.loaded = false;

        // Animation state
        this.frameX = 0;
        this.frameY = 0;
        this.maxFrame = 3;
        this.fps = 10;
        this.frameTimer = 0;
        this.frameInterval = 1000 / this.fps;

        this.facingRight = true;

        this.powerState = 'small'; // small (normal), big (super) -- Fire removed
        this.invulnerable = false;
        this.invulnerableTimer = 0;
    }

    updateImageSource() {
        if (!this.charConfig) return;
        const type = this.powerState === 'big' ? 'super' : 'normal';
        this.image.src = `${this.charConfig.path}/${type}.${this.charConfig.ext}`;
    }

    grow() {
        if (this.powerState === 'small') {
            this.powerState = 'big';
            this.updateImageSource();
            // Size increase handled by generic setting, but maybe slightly larger visual?
            // User requested unified size, so hitbox stays logic, visuals update.
            // Let's keep hitbox consistent 40x40 but maybe big is just "super" image.
        }
    }

    powerUpFire() {
        // Removed as requested, just grow
        this.grow();
    }

    takeDamage() {
        if (this.invulnerable || this.isDead) return;

        if (this.powerState === 'big') {
            this.powerState = 'small';
            this.updateImageSource();
            this.invulnerable = true;
            this.invulnerableTimer = 2;
            this.game.audio.play('coin'); // shrink sound placeholder
        } else {
            // Die
            this.die();
        }
    }

    die() {
        this.isDead = true;
        this.game.audio.play('death');
        this.velY = -500; // Hop up
        // Disable collision for player so they fall through floor
    }

    update(dt) {
        if (this.invulnerable) {
            this.invulnerableTimer -= dt;
            if (this.invulnerableTimer <= 0) {
                this.invulnerable = false;
            }
        }

        if (this.isDead) {
            // Death animation: Apply gravity, move Y, ignore input/collision except falling off screen
            this.velY += this.gravity * dt;
            this.y += this.velY * dt;
            if (this.y > this.game.canvas.height + 100) {
                // Trigger Game Over state interaction
                this.game.state = 3; // GAME_OVER
            }
            return;
        }

        // Movement with Inertia
        if (this.game.input.state.left) {
            if (this.velX > 0) this.velX -= this.friction * 2 * dt; // Quick turn
            this.velX -= this.acceleration * dt;
            this.facingRight = false;
        } else if (this.game.input.state.right) {
            if (this.velX < 0) this.velX += this.friction * 2 * dt; // Quick turn
            this.velX += this.acceleration * dt;
            this.facingRight = true;
        } else {
            // Friction
            if (Math.abs(this.velX) > 10) {
                this.velX -= Math.sign(this.velX) * this.friction * dt;
            } else {
                this.velX = 0;
            }
        }

        // Clamp Speed
        if (Math.abs(this.velX) > this.maxSpeed) {
            this.velX = Math.sign(this.velX) * this.maxSpeed;
        }

        // Jump
        if (this.game.input.state.jump) {
            if (this.isGrounded) {
                this.velY = this.jumpForce;
                this.isGrounded = false;
                this.game.audio.play('jump');
            }
        } else {
            // Variable Jump Height: cut velocity if released early
            if (this.velY < -100 && !this.isGrounded) {
                this.velY *= 0.5; // Dampen upward velocity
            }
        }

        // Apply Gravity
        this.velY += this.gravity * dt;

        // Apply Velocity
        this.x += this.velX * dt;
        this.y += this.velY * dt;

        // Simple Floor Collision
        if (this.y > this.game.groundY - this.height) {
            this.y = this.game.groundY - this.height;
            this.velY = 0;
            this.isGrounded = true;
        }

        // Block Collisions
        if (this.game.blocks) {
            this.game.blocks.forEach(block => {
                // Simple AABB for "riding"
                // Check if player is falling onto the block
                if (this.velY >= 0) {
                    // Check X overlap
                    if (this.x + this.width > block.x && this.x < block.x + block.width) {
                        // Check Y overlap: Player bottom should be slightly above or within block top
                        const pBottom = this.y + this.height;
                        // Allow small margin
                        if (pBottom >= block.y && pBottom <= block.y + 20) { // 20px threshold
                            // Snap to top
                            this.y = block.y - this.height;
                            this.velY = 0;
                            this.isGrounded = true;
                        }
                    }
                }
            });
        }

        // Animation Logic
        if (Math.abs(this.velX) > 10) {
            // Running
            this.frameTimer += dt * 1000;
            if (this.frameTimer > this.frameInterval) {
                this.frameTimer = 0;
                this.frameX++;
                if (this.frameX > this.maxFrame) this.frameX = 1; // Loop frames 1-3
            }
        } else {
            // Idle
            this.frameX = 0;
        }

        // Jump frame
        if (!this.isGrounded) {
            this.frameX = 3; // Assume last frame is jump
        }
    }

    draw(ctx) {
        if (!this.loaded || !this.image.complete || this.image.naturalWidth === 0) return;

        // Flip sprite if facing left
        ctx.save();
        if (!this.loaded) return;

        if (!this.facingRight) {
            ctx.translate(this.x + this.width, this.y);
            ctx.scale(-1, 1);
            if (this.isDead) ctx.rotate(Math.PI); // Upside down dead
            ctx.drawImage(this.image,
                this.frameX * 32, 0, 32, 32, // Source 
                0, 0, this.width, this.height // Destination
            );
        } else {
            if (this.isDead) { // Manual transform for right facing dead
                ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
                ctx.rotate(Math.PI);
                ctx.drawImage(this.image,
                    this.frameX * 32, 0, 32, 32,
                    -this.width / 2, -this.height / 2, this.width, this.height
                );
            } else {
                ctx.drawImage(this.image,
                    this.frameX * 32, 0, 32, 32,
                    this.x, this.y, this.width, this.height
                );
            }
        }
        ctx.restore();
    }
}
