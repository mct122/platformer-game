/**
 * Input Class
 * 
 * キーボードおよびタッチ入力を管理するクラスです。
 */
export class Input {
    constructor() {
        this.keys = {
            ArrowLeft: false,
            ArrowRight: false,
            ArrowUp: false, // ジャンプ
            Space: false,   // ジャンプ
            KeyA: false,    // 左移動
            KeyD: false     // 右移動
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
        // タッチ操作のセットアップ
        // index.html または Game.js で生成されたUI要素に対してイベントリスナーを設定します。
    }

    attachTouchControls(leftBtn, rightBtn, jumpBtn) {
        const handleTouch = (btn, key, active) => {
            btn.addEventListener('touchstart', (e) => { e.preventDefault(); this.keys[key] = true; this.updateState(); });
            btn.addEventListener('touchend', (e) => { e.preventDefault(); this.keys[key] = false; this.updateState(); });
            // PCでのテスト用マウスイベント
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
