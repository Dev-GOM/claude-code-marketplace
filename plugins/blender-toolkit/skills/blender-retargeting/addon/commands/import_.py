"""
Import 관련 명령 핸들러
FBX, DAE 파일 임포트
"""

import bpy
from ..utils.logger import get_logger

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
    """
    logger.info(f"Importing FBX file: {filepath}")

    try:
        bpy.ops.import_scene.fbx(filepath=filepath)
        logger.info(f"FBX import successful: {filepath}")
        return f"Imported {filepath}"
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
    """
    logger.info(f"Importing DAE file: {filepath}")

    try:
        bpy.ops.wm.collada_import(filepath=filepath)
        logger.info(f"DAE import successful: {filepath}")
        return f"Imported {filepath}"
    except Exception as e:
        logger.error(f"DAE import failed: {e}", exc_info=True)
        raise RuntimeError(f"Failed to import DAE: {str(e)}")
