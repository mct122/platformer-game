using UnityEngine;
using SuperRetroPlatformer.Core;

namespace SuperRetroPlatformer.Blocks
{
    /// <summary>
    /// ?ブロック。下から叩くとアイテムが出現する。
    /// 詳細実装は Issue #6 で行う。
    /// </summary>
    public class QuestionBlock : MonoBehaviour
    {
        public enum BlockContent { Coin, Mushroom, Star }

        [Header("Content")]
        [SerializeField] private BlockContent content = BlockContent.Coin;
        [SerializeField] private GameObject coinPrefab;
        [SerializeField] private GameObject mushroomPrefab;

        [Header("Sprites")]
        [SerializeField] private Sprite activeSprite;
        [SerializeField] private Sprite usedSprite;

        private bool _isActive = true;
        private SpriteRenderer _sr;

        // TODO #6: DoTween or Animator でバンプアニメーション

        private void Awake()
        {
            _sr = GetComponent<SpriteRenderer>();
        }

        public void Hit()
        {
            if (!_isActive) return;
            _isActive = false;
            _sr.sprite = usedSprite;
            SpawnContent();
            AudioManager.Instance?.PlayBlockHit();
            // TODO #6: バンプアニメーション
        }

        private void SpawnContent()
        {
            switch (content)
            {
                case BlockContent.Coin:
                    ScoreManager.Instance?.AddCoin();
                    // TODO #6: コインポップアップ演出
                    break;
                case BlockContent.Mushroom:
                    if (mushroomPrefab != null)
                        Instantiate(mushroomPrefab, transform.position + Vector3.up, Quaternion.identity);
                    break;
            }
        }

        private void OnCollisionEnter2D(Collision2D col)
        {
            // 下から叩かれたか判定
            if (!_isActive) return;
            var player = col.gameObject.GetComponent<Characters.PlayerController>();
            if (player == null) return;

            // 衝突法線が下向き (プレイヤーがブロックの下から当たった)
            foreach (var contact in col.contacts)
            {
                if (contact.normal.y < -0.5f)
                {
                    Hit();
                    break;
                }
            }
        }
    }
}
