using UnityEngine;

namespace SuperRetroPlatformer.Characters
{
    /// <summary>
    /// キャラクターごとのデータを定義する ScriptableObject。
    /// Issue #2 でスプライトシートとアニメーションを追加する。
    /// </summary>
    [CreateAssetMenu(fileName = "CharacterData", menuName = "SuperRetroPlatformer/CharacterData")]
    public class CharacterData : ScriptableObject
    {
        [Header("Basic Info")]
        public string characterName;
        public Sprite iconSprite;       // キャラ選択UIに表示する顔アイコン

        [Header("Sprites - Normal (Small)")]
        public Sprite normalIdle;
        public Sprite normalRun1;
        public Sprite normalRun2;
        public Sprite normalRun3;
        public Sprite normalJump;
        public Sprite normalDead;

        [Header("Sprites - Super (Big)")]
        public Sprite superIdle;
        public Sprite superRun1;
        public Sprite superRun2;
        public Sprite superRun3;
        public Sprite superJump;
        public Sprite superDead;

        [Header("Color Tint (optional)")]
        public Color tintColor = Color.white;

        // TODO #2: AnimatorController をキャラごとに差し替える仕組みを追加
    }
}
