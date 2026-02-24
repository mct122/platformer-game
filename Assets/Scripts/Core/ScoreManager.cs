using UnityEngine;

namespace SuperRetroPlatformer.Core
{
    /// <summary>
    /// スコア・コイン・残機・タイマーを管理するシングルトン。
    /// </summary>
    public class ScoreManager : MonoBehaviour
    {
        public static ScoreManager Instance { get; private set; }

        [Header("Game Values")]
        public int Score { get; private set; }
        public int Coins { get; private set; }
        public int Lives { get; private set; } = 3;
        public float TimeRemaining { get; private set; } = 400f;

        [Header("Stomp Combo")]
        private int _stompCombo = 0;
        private static readonly int[] StompScores = { 100, 200, 400, 800, 1000 };

        private const string HighScoreKey = "HighScore";
        private bool _timerRunning = false;

        // TODO #11: UI への通知 (UnityEvent or delegate)

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
            DontDestroyOnLoad(gameObject);
        }

        private void Update()
        {
            if (!_timerRunning) return;
            TimeRemaining -= Time.deltaTime;
            if (TimeRemaining <= 0)
            {
                TimeRemaining = 0;
                GameManager.Instance?.GameOver();
            }
        }

        public void StartTimer() => _timerRunning = true;
        public void StopTimer()  => _timerRunning = false;

        public void AddCoin()
        {
            Coins++;
            AddScore(200);
            AudioManager.Instance?.PlayCoin();
            if (Coins >= 100)
            {
                Coins -= 100;
                AddLife();
            }
        }

        public void AddLife()
        {
            Lives++;
            Debug.Log($"[Score] Life +1 → {Lives}");
        }

        public void LoseLife()
        {
            Lives--;
            ResetStompCombo();
            if (Lives <= 0)
            {
                GameManager.Instance?.GameOver();
            }
            else
            {
                // TODO: リスポーン処理
                Debug.Log($"[Score] Life lost → {Lives} remaining");
            }
        }

        /// <summary>踏みつけのコンボスコア加算。連続踏みで倍増。</summary>
        public void AddStompScore()
        {
            int idx = Mathf.Min(_stompCombo, StompScores.Length - 1);
            AddScore(StompScores[idx]);
            _stompCombo++;
        }

        public void ResetStompCombo() => _stompCombo = 0;

        public void AddScore(int amount)
        {
            Score += amount;
            Debug.Log($"[Score] +{amount} → {Score}");
        }

        /// <summary>ステージクリア時のタイムボーナス (残り時間 × 50点)</summary>
        public void AddTimeBonus()
        {
            int bonus = (int)(TimeRemaining) * 50;
            AddScore(bonus);
        }

        public int GetHighScore() => PlayerPrefs.GetInt(HighScoreKey, 0);

        public void SaveHighScore()
        {
            if (Score > GetHighScore())
                PlayerPrefs.SetInt(HighScoreKey, Score);
        }

        public void ResetForNewGame()
        {
            Score = 0;
            Coins = 0;
            Lives = 3;
            TimeRemaining = 400f;
            _stompCombo = 0;
        }
    }
}
