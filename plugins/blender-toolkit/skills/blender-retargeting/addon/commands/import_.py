"""
Import 관련 명령 핸들러
FBX, DAE 파일 임포트
"""

import bpy
import os
from ..utils.logger import get_logger
from ..utils.security import validate_file_path

logger = get_logger(__name__)


def import_fbx(filepath: str) -> str:
    """
    FBX 파일 임포트

    Args:
        filepath: FBX 파일 경로

    Returns:
        결과 메시지

    Raises:
        RuntimeError: 임포트 실패
        ValueError: 잘못된 파일 경로
    """
    logger.info(f"Importing FBX file: {filepath}")

    # 경로 보안 검증 (path traversal 방지)
    try:
        # 사용자 홈 디렉토리 또는 현재 작업 디렉토리 내로 제한
        allowed_root = os.path.expanduser("~")
        validated_path = validate_file_path(filepath, allowed_root)
    except ValueError as e:
        logger.error(f"Invalid file path: {e}")
        raise ValueError(f"Invalid file path: {e}")

    try:
        bpy.ops.import_scene.fbx(filepath=validated_path)
        logger.info(f"FBX import successful: {validated_path}")
        return f"Imported {validated_path}"
    except Exception as e:
        logger.error(f"FBX import failed: {e}", exc_info=True)
        raise RuntimeError(f"Failed to import FBX: {str(e)}")


def import_dae(filepath: str) -> str:
    """
    DAE (Collada) 파일 임포트

    Args:
        filepath: DAE 파일 경로

    Returns:
        결과 메시지

    Raises:
        RuntimeError: 임포트 실패
        ValueError: 잘못된 파일 경로
    """
    logger.info(f"Importing DAE file: {filepath}")

    # 경로 보안 검증 (path traversal 방지)
    try:
        # 사용자 홈 디렉토리 또는 현재 작업 디렉토리 내로 제한
        allowed_root = os.path.expanduser("~")
        validated_path = validate_file_path(filepath, allowed_root)
    except ValueError as e:
        logger.error(f"Invalid file path: {e}")
        raise ValueError(f"Invalid file path: {e}")

    try:
        bpy.ops.wm.collada_import(filepath=validated_path)
        logger.info(f"DAE import successful: {validated_path}")
        return f"Imported {validated_path}"
    except Exception as e:
        logger.error(f"DAE import failed: {e}", exc_info=True)
        raise RuntimeError(f"Failed to import DAE: {str(e)}")
