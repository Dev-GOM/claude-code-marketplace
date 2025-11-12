# websocket-sharp DLL Installation

Unity Editor Toolkit requires websocket-sharp for WebSocket communication.

## Installation Steps

### Step 1: Download websocket-sharp

**Option A: Download Pre-built DLL (Recommended)**

1. Go to: https://github.com/sta/websocket-sharp/releases
2. Download the latest release (e.g., `websocket-sharp.zip` or `websocket-sharp.dll`)
3. Extract if needed

**Direct Download Link:**
- Latest stable: https://github.com/sta/websocket-sharp/releases/download/1.0.3-rc11/websocket-sharp.dll

**Option B: Build from Source**

```bash
git clone https://github.com/sta/websocket-sharp.git
cd websocket-sharp/websocket-sharp
# Build with your C# compiler or Visual Studio
```

### Step 2: Add DLL to Unity Project

**Copy the DLL to this exact location:**

```
Packages/com.devgom.unity-editor-toolkit/ThirdParty/websocket-sharp/websocket-sharp.dll
```

**Full Path Examples:**

**Windows:**
```
D:\YourUnityProject\Packages\com.devgom.unity-editor-toolkit\ThirdParty\websocket-sharp\websocket-sharp.dll
```

**macOS/Linux:**
```
/Users/YourName/UnityProjects/YourProject/Packages/com.devgom.unity-editor-toolkit/ThirdParty/websocket-sharp/websocket-sharp.dll
```

### Step 3: Configure Import Settings in Unity

1. Unity will automatically detect the DLL
2. Select `websocket-sharp.dll` in Project window
3. In Inspector, verify settings:
   - **Any Platform**: ✓ Checked
   - **Editor**: ✓ Include
   - **Standalone**: ✗ Exclude (Editor only)

4. Click **Apply**

### Step 4: Verify Installation

**Method 1: Check Console**

After adding the DLL, Unity should not show any import errors. Check Console (Ctrl+Shift+C) for:
- ✓ No "missing assembly" warnings
- ✓ No websocket-sharp related errors

**Method 2: Test Server**

1. Create GameObject → Add `UnityEditorServer` component
2. Enter Play Mode
3. Console should show: `✓ Unity Editor Server started on ws://127.0.0.1:9500`

## Troubleshooting

### Error: "Assembly 'websocket-sharp' not found"

**Solution:**
- Verify DLL is in correct location: `ThirdParty/websocket-sharp/websocket-sharp.dll`
- Restart Unity Editor
- Reimport package: Right-click package → Reimport

### Error: "Could not load file or assembly"

**Solution:**
- Check DLL platform settings (Any Platform should be checked)
- Try different websocket-sharp version
- Ensure you're using .NET Framework 4.x (not .NET Standard)

### DLL Not Appearing in Project Window

**Solution:**
1. Close Unity
2. Delete `Library/` folder in your project
3. Reopen Unity (will reimport all assets)

### Unity 2020.3+ Compatibility

websocket-sharp 1.0.3-rc11 is compatible with:
- Unity 2020.3 LTS
- Unity 2021.3 LTS
- Unity 2022.3 LTS
- Unity 6 (2023.2+)

## Alternative: NuGet for Unity

If you have NuGet for Unity installed:

1. Install NuGet for Unity: https://github.com/GlitchEnzo/NuGetForUnity
2. Open NuGet window: `NuGet → Manage NuGet Packages`
3. Search: "websocket-sharp"
4. Click **Install**

**Advantages:**
- Automatic dependency management
- Easy updates
- No manual DLL copying

**Disadvantages:**
- Requires additional package (NuGet for Unity)
- Slightly larger project size

## File Structure After Installation

```
Packages/com.devgom.unity-editor-toolkit/
├── ThirdParty/
│   └── websocket-sharp/
│       ├── websocket-sharp.dll          ← You add this
│       ├── websocket-sharp.dll.meta     ← Unity creates this
│       └── README.md                    ← This file
├── Runtime/
├── Editor/
└── ...
```

## Verification Checklist

- [ ] DLL downloaded from official source
- [ ] DLL placed in `ThirdParty/websocket-sharp/` folder
- [ ] Unity detected and imported DLL (no Console errors)
- [ ] Import settings configured (Any Platform, Editor only)
- [ ] Test server starts successfully in Play Mode
- [ ] No assembly resolution errors in Console

## License Note

websocket-sharp is licensed under the MIT License.

**websocket-sharp License:**
```
MIT License

Copyright (c) 2010-2021 sta.blockhead

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```

## Support

For issues with:
- **websocket-sharp**: https://github.com/sta/websocket-sharp/issues
- **Unity Editor Toolkit**: https://github.com/Dev-GOM/claude-code-marketplace/issues
