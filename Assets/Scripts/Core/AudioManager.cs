using UnityEngine;
using System.Collections.Generic;

namespace SuperRetroPlatformer.Core
{
    /// <summary>
    /// BGM・SEの再生を一元管理するシングルトン。
    /// AudioMixer の BGM / SFX チャンネルを制御する。
    /// </summary>
    public class AudioManager : MonoBehaviour
    {
        public static AudioManager Instance { get; private set; }

        [Header("Audio Sources")]
        [SerializeField] private AudioSource bgmSource;
        [SerializeField] private AudioSource sfxSource;

        [Header("BGM Clips")]
        [SerializeField] private AudioClip bgmTitle;
        [SerializeField] private AudioClip bgmWorld1;
        [SerializeField] private AudioClip bgmGameOver;

        [Header("SFX Clips")]
        [SerializeField] private AudioClip sfxJump;
        [SerializeField] private AudioClip sfxStomp;
        [SerializeField] private AudioClip sfxCoin;
        [SerializeField] private AudioClip sfxPowerUp;
        [SerializeField] private AudioClip sfxDamage;
        [SerializeField] private AudioClip sfxDeath;
        [SerializeField] private AudioClip sfxBlockHit;
        [SerializeField] private AudioClip sfxGoal;

        // TODO #8: AudioMixer でBGM/SFX個別ボリューム調整
        // TODO #8: PlayerPrefs でボリューム設定を保存

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

        public void PlayBGM(AudioClip clip)
        {
            if (bgmSource.clip == clip && bgmSource.isPlaying) return;
            bgmSource.clip = clip;
            bgmSource.loop = true;
            bgmSource.Play();
        }

        public void StopBGM() => bgmSource.Stop();

        public void PlaySFX(AudioClip clip)
        {
            if (clip == null) return;
            sfxSource.PlayOneShot(clip);
        }

        // 便利メソッド群
        public void PlayJump()    => PlaySFX(sfxJump);
        public void PlayStomp()   => PlaySFX(sfxStomp);
        public void PlayCoin()    => PlaySFX(sfxCoin);
        public void PlayPowerUp() => PlaySFX(sfxPowerUp);
        public void PlayDamage()  => PlaySFX(sfxDamage);
        public void PlayDeath()   => PlaySFX(sfxDeath);
        public void PlayBlockHit()=> PlaySFX(sfxBlockHit);
        public void PlayGoal()    => PlaySFX(sfxGoal);

        public void PlayTitleBGM() => PlayBGM(bgmTitle);
        public void PlayWorld1BGM() => PlayBGM(bgmWorld1);
        public void PlayGameOverBGM() => PlayBGM(bgmGameOver);
    }
}
