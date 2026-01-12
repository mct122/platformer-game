export class Input {
    constructor() {
        this.keys = {
            ArrowLeft: false,
            ArrowRight: false,
            ArrowUp: false, // Jump
            Space: false,   // Jump
            KeyA: false,    // Left
            KeyD: false     // Right
        };

        this.state = {
            left: false,
            right: false,
            jump: false,
            attack: false
        };

        this.setupKeyboard();
        this.setupTouch();
    }

    setupKeyboard() {
        window.addEventListener('keydown', (e) => {
            if (this.keys.hasOwnProperty(e.code)) {
                this.keys[e.code] = true;
                this.updateState();
            }
        });

        window.addEventListener('keyup', (e) => {
            if (this.keys.hasOwnProperty(e.code)) {
                this.keys[e.code] = false;
                this.updateState();
            }
        });
    }

    setupTouch() {
        // These IDs should match what we put in index.html later if we generate DOM there
        // For now, let's assume methods will be called by UI elements or we bind to selectors

        // We'll create the UI elements in Game.js or here? 
        // Let's assume Game.js creates the DOM or we just attach to existing IDs if they existed.
        // But index.html is empty. We should inject controls.

        // Actually, style.css had .controls classes. We need to inject that HTML.
    }

    attachTouchControls(leftBtn, rightBtn, jumpBtn) {
        const handleTouch = (btn, key, active) => {
            btn.addEventListener('touchstart', (e) => { e.preventDefault(); this.keys[key] = true; this.updateState(); });
            btn.addEventListener('touchend', (e) => { e.preventDefault(); this.keys[key] = false; this.updateState(); });
            // Mouse fallback for testing
            btn.addEventListener('mousedown', (e) => { this.keys[key] = true; this.updateState(); });
            btn.addEventListener('mouseup', (e) => { this.keys[key] = false; this.updateState(); });
            btn.addEventListener('mouseleave', (e) => { this.keys[key] = false; this.updateState(); });
        };

        if (leftBtn) handleTouch(leftBtn, 'ArrowLeft', true);
        if (rightBtn) handleTouch(rightBtn, 'ArrowRight', true);
        if (jumpBtn) handleTouch(jumpBtn, 'ArrowUp', true);
    }

    updateState() {
        this.state.left = this.keys.ArrowLeft || this.keys.KeyA;
        this.state.right = this.keys.ArrowRight || this.keys.KeyD;
        this.state.jump = this.keys.ArrowUp || this.keys.Space;
    }
}
