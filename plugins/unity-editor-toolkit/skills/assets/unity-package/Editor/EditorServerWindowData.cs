using System;
using System.Runtime.CompilerServices;
using Unity.Properties;
using UnityEngine.UIElements;

namespace UnityEditorToolkit.Editor
{
    /// <summary>
    /// EditorServerWindow의 데이터 바인딩을 위한 데이터 소스 클래스
    /// INotifyBindablePropertyChanged를 구현하여 UI 자동 업데이트
    /// </summary>
    public class EditorServerWindowData : INotifyBindablePropertyChanged
    {
        #region INotifyBindablePropertyChanged
        public event EventHandler<BindablePropertyChangedEventArgs> propertyChanged;

        private void Notify([CallerMemberName] string propertyName = "")
        {
            propertyChanged?.Invoke(this, new BindablePropertyChangedEventArgs(propertyName));
        }
        #endregion

        #region Server Status Data
        private bool serverIsRunning = false;
        private int serverPort = 9500;
        private int connectedClients = 0;
        private bool autoStart = false;

        [CreateProperty]
        public bool ServerIsRunning
        {
            get => serverIsRunning;
            set
            {
                if (serverIsRunning == value) return;
                serverIsRunning = value;
                Notify();
                Notify(nameof(ServerStatusText));
                Notify(nameof(ServerStatusIndicatorClass));
            }
        }

        [CreateProperty]
        public string ServerStatusText => ServerIsRunning ? "▶️ Running ✓" : "⏹️ Stopped";

        [CreateProperty]
        public string ServerStatusIndicatorClass => ServerIsRunning
            ? "status-indicator status-running"
            : "status-indicator status-stopped";

        [CreateProperty]
        public int ServerPort
        {
            get => serverPort;
            set
            {
                if (serverPort == value) return;
                serverPort = value;
                Notify();
                Notify(nameof(ServerPortText));
            }
        }

        [CreateProperty]
        public string ServerPortText => ServerPort.ToString();

        [CreateProperty]
        public int ConnectedClients
        {
            get => connectedClients;
            set
            {
                if (connectedClients == value) return;
                connectedClients = value;
                Notify();
                Notify(nameof(ConnectedClientsText));
            }
        }

        [CreateProperty]
        public string ConnectedClientsText => ConnectedClients.ToString();

        [CreateProperty]
        public bool AutoStart
        {
            get => autoStart;
            set
            {
                if (autoStart == value) return;
                autoStart = value;
                Notify();
            }
        }
        #endregion

        #region CLI Status Data
        private bool hasNodeJS = false;
        private string packageVersion = "Unknown";
        private string cliVersion = "❌ Not Installed";

        [CreateProperty]
        public bool HasNodeJS
        {
            get => hasNodeJS;
            set
            {
                if (hasNodeJS == value) return;
                hasNodeJS = value;
                Notify();
            }
        }

        [CreateProperty]
        public string PackageVersion
        {
            get => packageVersion;
            set
            {
                if (packageVersion == value) return;
                packageVersion = value;
                Notify();
            }
        }

        [CreateProperty]
        public string CLIVersion
        {
            get => cliVersion;
            set
            {
                if (cliVersion == value) return;
                cliVersion = value;
                Notify();
            }
        }
        #endregion

        #region Database Status Data
        private bool dbIsConnected = false;
        private bool dbFileExists = false;
        private bool dbIsSyncing = false;
        private int dbUndoCount = 0;
        private int dbRedoCount = 0;

        [CreateProperty]
        public bool DbIsConnected
        {
            get => dbIsConnected;
            set
            {
                if (dbIsConnected == value) return;
                dbIsConnected = value;
                Notify();
                Notify(nameof(DbStatusText));
                Notify(nameof(DbStatusIndicatorClass));
            }
        }

        [CreateProperty]
        public string DbStatusText => DbIsConnected ? "✅ Connected" : "❌ Not Connected";

        [CreateProperty]
        public string DbStatusIndicatorClass => DbIsConnected
            ? "status-indicator status-running"
            : "status-indicator status-stopped";

        [CreateProperty]
        public bool DbFileExists
        {
            get => dbFileExists;
            set
            {
                if (dbFileExists == value) return;
                dbFileExists = value;
                Notify();
                Notify(nameof(DbFileExistsText));
            }
        }

        [CreateProperty]
        public string DbFileExistsText => DbFileExists ? "✅ Created" : "❌ Not Created";

        [CreateProperty]
        public bool DbIsSyncing
        {
            get => dbIsSyncing;
            set
            {
                if (dbIsSyncing == value) return;
                dbIsSyncing = value;
                Notify();
                Notify(nameof(DbSyncStatusText));
            }
        }

        [CreateProperty]
        public string DbSyncStatusText => DbIsSyncing ? "✅ Running" : "⏹️ Not Running";

        [CreateProperty]
        public int DbUndoCount
        {
            get => dbUndoCount;
            set
            {
                if (dbUndoCount == value) return;
                dbUndoCount = value;
                Notify();
                Notify(nameof(DbUndoCountText));
            }
        }

        [CreateProperty]
        public string DbUndoCountText => $"🔢 {DbUndoCount}";

        [CreateProperty]
        public int DbRedoCount
        {
            get => dbRedoCount;
            set
            {
                if (dbRedoCount == value) return;
                dbRedoCount = value;
                Notify();
                Notify(nameof(DbRedoCountText));
            }
        }

        [CreateProperty]
        public string DbRedoCountText => $"🔢 {DbRedoCount}";
        #endregion
    }
}
