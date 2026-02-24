using UnityEngine;
using SuperRetroPlatformer.Core;

namespace SuperRetroPlatformer.Enemies
{
    /// <summary>
    /// 全敵の基底クラス。
    /// 詳細実装は Issue #5 で行う。
    /// </summary>
    [RequireComponent(typeof(Rigidbody2D))]
    [RequireComponent(typeof(Collider2D))]
    public abstract class EnemyBase : MonoBehaviour
    {
        [Header("Base Settings")]
        [SerializeField] protected float moveSpeed = 2f;
        [SerializeField] protected LayerMask groundLayer;
        [SerializeField] protected LayerMask wallLayer;

        protected Rigidbody2D Rb;
        protected SpriteRenderer SpriteRend;
        protected Animator Anim;
        protected bool IsDead;
        protected bool MovingRight = false;

        // TODO #5: ScriptableObject でパラメータ管理

        protected virtual void Awake()
        {
            Rb = GetComponent<Rigidbody2D>();
            SpriteRend = GetComponent<SpriteRenderer>();
            Anim = GetComponent<Animator>();
        }

        protected virtual void Update()
        {
            if (IsDead) return;
            Patrol();
        }

        protected virtual void Patrol()
        {
            float dir = MovingRight ? 1f : -1f;
            Rb.linearVelocity = new Vector2(dir * moveSpeed, Rb.linearVelocity.y);
            SpriteRend.flipX = MovingRight;

            // 壁・崖チェック → 折り返し
            // TODO #5: Raycast で壁・崖を検出して反転
        }

        protected virtual void Flip() => MovingRight = !MovingRight;

        /// <summary>プレイヤーに踏まれたとき。</summary>
        public virtual void OnStomped()
        {
            IsDead = true;
            ScoreManager.Instance?.AddStompScore();
            AudioManager.Instance?.PlayStomp();
            // TODO #5: 死亡アニメーション → Destroy
        }

        /// <summary>プレイヤーに横から触れたとき。</summary>
        public virtual void OnTouchPlayer(Characters.PlayerController player)
        {
            player.TakeDamage();
        }

        /// <summary>踏みつけ判定: プレイヤーが上から落ちてきたか。</summary>
        protected bool IsStompedByPlayer(Characters.PlayerController player)
        {
            // プレイヤーが下降中 かつ プレイヤーの足元が敵の頭より上にある
            return player.GetComponent<Rigidbody2D>().linearVelocity.y < -0.5f
                && player.transform.position.y > transform.position.y + 0.1f;
        }
    }
}
