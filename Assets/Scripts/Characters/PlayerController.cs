using UnityEngine;
using UnityEngine.InputSystem;
using SuperRetroPlatformer.Core;

namespace SuperRetroPlatformer.Characters
{
    /// <summary>
    /// プレイヤーの移動・ジャンプ・パワー状態・ダメージ処理。
    /// Rigidbody2D + New Input System ベース。
    /// 詳細実装は Issue #3 (物理) および Issue #2 (キャラクター) で行う。
    /// </summary>
    [RequireComponent(typeof(Rigidbody2D))]
    [RequireComponent(typeof(CapsuleCollider2D))]
    public class PlayerController : MonoBehaviour
    {
        // ---- Inspector ----
        [Header("Movement")]
        [SerializeField] private float maxSpeed = 8f;
        [SerializeField] private float acceleration = 50f;
        [SerializeField] private float deceleration = 80f;

        [Header("Jump")]
        [SerializeField] private float jumpForce = 16f;
        [SerializeField] private float coyoteTime = 0.12f;     // 崖端猶予
        [SerializeField] private float jumpBufferTime = 0.1f;  // 先行入力猶予
        [SerializeField] private float fallMultiplier = 2.5f;  // 下降を重くする
        [SerializeField] private float lowJumpMultiplier = 2f; // 早離しで低くなる

        [Header("Ground Check")]
        [SerializeField] private Transform groundCheck;
        [SerializeField] private LayerMask groundLayer;
        [SerializeField] private float groundCheckRadius = 0.1f;

        [Header("Power State")]
        public PowerState CurrentPower { get; private set; } = PowerState.Small;

        public enum PowerState { Small, Big }

        // ---- References ----
        private Rigidbody2D _rb;
        private Animator _animator;
        private SpriteRenderer _spriteRenderer;

        // ---- State ----
        private Vector2 _moveInput;
        private bool _isGrounded;
        private bool _jumpPressed;
        private float _coyoteTimer;
        private float _jumpBufferTimer;
        private bool _isInvulnerable;
        private float _invulnerableTimer;
        private bool _isDead;

        // TODO #2: CharacterData ScriptableObject からスプライトを切り替え
        // TODO #3: PhysicsMaterial2D で摩擦調整
        // TODO #10: Mobile タッチ入力の対応

        private void Awake()
        {
            _rb = GetComponent<Rigidbody2D>();
            _animator = GetComponent<Animator>();
            _spriteRenderer = GetComponent<SpriteRenderer>();
        }

        private void Update()
        {
            // タイマー更新
            _coyoteTimer -= Time.deltaTime;
            _jumpBufferTimer -= Time.deltaTime;
            if (_isInvulnerable)
            {
                _invulnerableTimer -= Time.deltaTime;
                if (_invulnerableTimer <= 0) _isInvulnerable = false;
            }

            UpdateAnimator();
        }

        private void FixedUpdate()
        {
            if (_isDead) return;

            CheckGround();
            ApplyMovement();
            ApplyJump();
            ApplyFallPhysics();
        }

        // ---- Input System Callbacks ----
        public void OnMove(InputAction.CallbackContext ctx)
        {
            _moveInput = ctx.ReadValue<Vector2>();
        }

        public void OnJump(InputAction.CallbackContext ctx)
        {
            if (ctx.started)
            {
                _jumpPressed = true;
                _jumpBufferTimer = jumpBufferTime;
            }
            if (ctx.canceled) _jumpPressed = false;
        }

        // ---- Physics ----
        private void CheckGround()
        {
            bool wasGrounded = _isGrounded;
            _isGrounded = Physics2D.OverlapCircle(groundCheck.position, groundCheckRadius, groundLayer);

            if (_isGrounded)
            {
                _coyoteTimer = coyoteTime;
                ScoreManager.Instance?.ResetStompCombo();
            }
        }

        private void ApplyMovement()
        {
            float targetSpeed = _moveInput.x * maxSpeed;
            float speedDiff = targetSpeed - _rb.linearVelocity.x;
            float accelRate = Mathf.Abs(targetSpeed) > 0.1f ? acceleration : deceleration;
            float force = speedDiff * accelRate;
            _rb.AddForce(Vector2.right * force, ForceMode2D.Force);

            // スプライト反転
            if (_moveInput.x != 0)
                _spriteRenderer.flipX = _moveInput.x < 0;
        }

        private void ApplyJump()
        {
            bool canJump = _coyoteTimer > 0 && _jumpBufferTimer > 0;
            if (canJump)
            {
                _rb.linearVelocity = new Vector2(_rb.linearVelocity.x, jumpForce);
                _coyoteTimer = 0;
                _jumpBufferTimer = 0;
                AudioManager.Instance?.PlayJump();
            }
        }

        private void ApplyFallPhysics()
        {
            if (_rb.linearVelocity.y < 0)
            {
                // 落下を重くする
                _rb.linearVelocity += Vector2.up * Physics2D.gravity.y * (fallMultiplier - 1) * Time.fixedDeltaTime;
            }
            else if (_rb.linearVelocity.y > 0 && !_jumpPressed)
            {
                // 早離しで低くなる（可変ジャンプ）
                _rb.linearVelocity += Vector2.up * Physics2D.gravity.y * (lowJumpMultiplier - 1) * Time.fixedDeltaTime;
            }
        }

        // ---- Power / Damage ----
        public void Grow()
        {
            if (CurrentPower == PowerState.Big) return;
            CurrentPower = PowerState.Big;
            AudioManager.Instance?.PlayPowerUp();
            // TODO #2: スーパー画像に切り替え
        }

        public void TakeDamage()
        {
            if (_isInvulnerable || _isDead) return;

            if (CurrentPower == PowerState.Big)
            {
                CurrentPower = PowerState.Small;
                _isInvulnerable = true;
                _invulnerableTimer = 2f;
                AudioManager.Instance?.PlayDamage();
                // TODO #2: 通常画像に切り替え + 点滅演出
            }
            else
            {
                Die();
            }
        }

        private void Die()
        {
            _isDead = true;
            _rb.linearVelocity = new Vector2(0, 10f);
            _rb.gravityScale = 2f;
            GetComponent<Collider2D>().enabled = false;
            AudioManager.Instance?.PlayDeath();
            ScoreManager.Instance?.LoseLife();
            // TODO #9: 死亡アニメーション → ゲームオーバー遷移
        }

        // ---- Animator ----
        private void UpdateAnimator()
        {
            if (_animator == null) return;
            // TODO #2: Animator パラメータを実装
            // _animator.SetFloat("Speed", Mathf.Abs(_rb.linearVelocity.x));
            // _animator.SetBool("IsGrounded", _isGrounded);
            // _animator.SetBool("IsDead", _isDead);
        }
    }
}
