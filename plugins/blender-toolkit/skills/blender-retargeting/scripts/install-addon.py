#!/usr/bin/env python3
"""
Blender Toolkit Addon Auto-Installer
Blender를 백그라운드에서 실행하여 애드온을 자동으로 설치/활성화합니다.
"""

import bpy
import sys
import os
from pathlib import Path

def install_addon():
    """애드온 설치 및 활성화"""

    # 애드온 경로 (이 스크립트의 부모 디렉토리)
    script_dir = Path(__file__).parent.absolute()
    addon_dir = script_dir.parent / "addon"
    addon_init = addon_dir / "__init__.py"

    if not addon_init.exists():
        print(f"❌ Error: Addon not found at {addon_init}")
        sys.exit(1)

    print(f"📦 Installing Blender Toolkit addon from: {addon_dir}")

    try:
        # 애드온이 이미 설치되어 있으면 먼저 제거
        addon_name = "blender_toolkit_websocket"
        if addon_name in bpy.context.preferences.addons:
            print(f"🔄 Removing existing addon: {addon_name}")
            bpy.ops.preferences.addon_disable(module=addon_name)
            bpy.ops.preferences.addon_remove(module=addon_name)

        # 애드온 디렉토리를 Blender scripts path에 추가
        scripts_path = bpy.utils.user_resource('SCRIPTS', path="addons")

        # 심볼릭 링크 또는 복사 방식으로 설치
        import shutil
        target_path = Path(scripts_path) / "blender_toolkit_websocket"

        if target_path.exists():
            print(f"🔄 Removing existing installation at {target_path}")
            shutil.rmtree(target_path)

        print(f"📋 Copying addon to: {target_path}")
        shutil.copytree(addon_dir, target_path)

        # 애드온 활성화
        print(f"✅ Enabling addon: {addon_name}")
        bpy.ops.preferences.addon_enable(module=addon_name)

        # User preferences 저장
        bpy.ops.wm.save_userpref()

        print("✅ Addon installed and enabled successfully!")
        print("\n📝 Next steps:")
        print("   1. Start Blender normally")
        print("   2. The WebSocket server will auto-start on port 9400")
        print("   3. Use CLI: node dist/cli/cli.js <command>")

        return 0

    except Exception as e:
        print(f"❌ Error installing addon: {e}")
        import traceback
        traceback.print_exc()
        return 1

if __name__ == "__main__":
    exit_code = install_addon()
    sys.exit(exit_code)
