using System;
using UnityEngine;

#if UNITY_EDITOR
using UnityEditor;
#endif

namespace UnityEditorToolkit.Runtime
{
    /// <summary>
    /// GameObject에 영구적인 GUID를 부여하는 컴포넌트
    /// instance_id는 세션마다 변경되므로 GUID를 사용하여 영구 식별
    /// </summary>
    [DisallowMultipleComponent]
    [ExecuteAlways]
    public class GameObjectGuid : MonoBehaviour
    {
        [SerializeField, HideInInspector]
        private string guid = string.Empty;

        /// <summary>
        /// GameObject의 고유 GUID
        /// </summary>
        public string Guid
        {
            get
            {
                if (string.IsNullOrEmpty(guid))
                {
                    GenerateGuid();
                }
                return guid;
            }
        }

        private void Awake()
        {
            // GUID가 없으면 생성
            if (string.IsNullOrEmpty(guid))
            {
                GenerateGuid();
            }
        }

        private void GenerateGuid()
        {
            guid = System.Guid.NewGuid().ToString();

#if UNITY_EDITOR
            // EditorOnly: 변경사항을 씬에 저장
            if (!Application.isPlaying)
            {
                EditorUtility.SetDirty(this);
            }
#endif

            Debug.Log($"[GameObjectGuid] Generated GUID for '{gameObject.name}': {guid}");
        }

        /// <summary>
        /// GUID 재생성 (에디터 전용)
        /// </summary>
        [ContextMenu("Regenerate GUID")]
        public void RegenerateGuid()
        {
#if UNITY_EDITOR
            if (EditorUtility.DisplayDialog(
                "Regenerate GUID",
                $"Are you sure you want to regenerate GUID for '{gameObject.name}'?\n\nThis will break database references!",
                "Yes", "Cancel"))
            {
                guid = string.Empty;
                GenerateGuid();
                Debug.LogWarning($"[GameObjectGuid] GUID regenerated for '{gameObject.name}'");
            }
#endif
        }

#if UNITY_EDITOR
        /// <summary>
        /// Inspector에서 GUID 표시 (읽기 전용)
        /// </summary>
        [CustomEditor(typeof(GameObjectGuid))]
        public class GameObjectGuidEditor : Editor
        {
            public override void OnInspectorGUI()
            {
                var guidComp = (GameObjectGuid)target;

                EditorGUILayout.HelpBox(
                    "This component assigns a persistent GUID to the GameObject.\n" +
                    "The GUID is used for database synchronization and remains constant across Unity sessions.",
                    MessageType.Info);

                EditorGUILayout.Space();

                GUI.enabled = false;
                EditorGUILayout.TextField("GUID", guidComp.Guid);
                GUI.enabled = true;

                EditorGUILayout.Space();

                if (GUILayout.Button("Regenerate GUID (⚠️ WARNING)"))
                {
                    guidComp.RegenerateGuid();
                }
            }
        }
#endif
    }
}
