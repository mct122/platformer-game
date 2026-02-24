using UnityEngine;
using UnityEngine.SceneManagement;

namespace SuperRetroPlatformer.Core
{
    /// <summary>
    /// ゲーム全体の状態を管理するシングルトン。
    /// シーン間で永続し、状態遷移・リセットを一元管理する。
    /// </summary>
    public class GameManager : MonoBehaviour
    {
        public static GameManager Instance { get; private set; }

        public enum GameState
        {
            Title,
            CharacterSelect,
            Playing,
            Paused,
            GameOver,
            StageClear
        }

        [Header("State")]
        public GameState CurrentState { get; private set; } = GameState.Title;

        [Header("Character")]
        public int SelectedCharacterIndex { get; private set; } = 0;

        // TODO #9: UI Manager との連携
        // TODO #11: ScoreManager との連携

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

        public void SetState(GameState newState)
        {
            CurrentState = newState;
            Debug.Log($"[GameManager] State -> {newState}");
            // TODO #9: 各状態に対応したUIを表示
        }

        public void SelectCharacter(int index)
        {
            SelectedCharacterIndex = index;
            Debug.Log($"[GameManager] Character selected: {index}");
        }

        public void StartGame()
        {
            SetState(GameState.Playing);
            SceneManager.LoadScene("World1-1"); // TODO #4: シーン名を定数管理
        }

        public void GameOver()
        {
            SetState(GameState.GameOver);
            // TODO #9: ゲームオーバー画面を表示、残機確認
        }

        public void StageClear()
        {
            SetState(GameState.StageClear);
            // TODO #9: クリア演出
        }

        public void ReturnToTitle()
        {
            SetState(GameState.Title);
            SceneManager.LoadScene("Title");
        }

        public void PauseGame()
        {
            if (CurrentState != GameState.Playing) return;
            Time.timeScale = 0f;
            SetState(GameState.Paused);
        }

        public void ResumeGame()
        {
            if (CurrentState != GameState.Paused) return;
            Time.timeScale = 1f;
            SetState(GameState.Playing);
        }
    }
}
