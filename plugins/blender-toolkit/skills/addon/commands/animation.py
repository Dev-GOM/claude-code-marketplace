"""
Animation 관련 명령 핸들러
애니메이션 재생, NLA 트랙 관리
"""

import bpy
from typing import List
from ..utils.logger import get_logger

logger = get_logger(__name__)


def list_animations(armature_name: str) -> List[str]:
    """
    아마추어의 애니메이션 액션 목록

    Args:
        armature_name: 아마추어 이름

    Returns:
        액션 이름 리스트

    Raises:
        ValueError: 아마추어를 찾을 수 없는 경우
    """
    logger.debug(f"Listing animations for armature: {armature_name}")

    armature = bpy.data.objects.get(armature_name)
    if not armature:
        logger.error(f"Armature '{armature_name}' not found")
        raise ValueError(f"Armature '{armature_name}' not found")

    actions = []
    if armature.animation_data:
        for action in bpy.data.actions:
            if action.id_root == 'OBJECT':
                actions.append(action.name)

    logger.info(f"Found {len(actions)} animations for {armature_name}")
    return actions


def play_animation(armature_name: str, action_name: str, loop: bool = True) -> str:
    """
    애니메이션 재생

    Args:
        armature_name: 아마추어 이름
        action_name: 액션 이름
        loop: 루프 재생 여부

    Returns:
        결과 메시지

    Raises:
        ValueError: 아마추어 또는 액션을 찾을 수 없는 경우
    """
    logger.info(f"Playing animation: {action_name} on {armature_name}")

    armature = bpy.data.objects.get(armature_name)
    if not armature:
        logger.error(f"Armature '{armature_name}' not found")
        raise ValueError(f"Armature '{armature_name}' not found")

    action = bpy.data.actions.get(action_name)
    if not action:
        logger.error(f"Action '{action_name}' not found")
        raise ValueError(f"Action '{action_name}' not found")

    if not armature.animation_data:
        armature.animation_data_create()

    armature.animation_data.action = action
    bpy.context.scene.frame_set(int(action.frame_range[0]))
    bpy.ops.screen.animation_play()

    logger.info(f"Started playing {action_name}")
    return f"Playing {action_name}"


def stop_animation() -> str:
    """
    애니메이션 중지

    Returns:
        결과 메시지
    """
    logger.info("Stopping animation playback")
    bpy.ops.screen.animation_cancel()
    return "Animation stopped"


def add_to_nla(armature_name: str, action_name: str, track_name: str) -> str:
    """
    NLA 트랙에 애니메이션 추가

    Args:
        armature_name: 아마추어 이름
        action_name: 액션 이름
        track_name: 트랙 이름

    Returns:
        결과 메시지

    Raises:
        ValueError: 아마추어 또는 액션을 찾을 수 없는 경우
    """
    logger.info(f"Adding {action_name} to NLA track {track_name} on {armature_name}")

    armature = bpy.data.objects.get(armature_name)
    if not armature:
        logger.error(f"Armature '{armature_name}' not found")
        raise ValueError(f"Armature '{armature_name}' not found")

    action = bpy.data.actions.get(action_name)
    if not action:
        logger.error(f"Action '{action_name}' not found")
        raise ValueError(f"Action '{action_name}' not found")

    if not armature.animation_data:
        armature.animation_data_create()

    # NLA 트랙 생성 또는 찾기
    nla_tracks = armature.animation_data.nla_tracks
    track = nla_tracks.get(track_name)

    if not track:
        track = nla_tracks.new()
        track.name = track_name
        logger.debug(f"Created new NLA track: {track_name}")

    # 액션을 스트립으로 추가
    strip = track.strips.new(action.name, int(action.frame_range[0]), action)
    logger.info(f"Added strip {strip.name} to track {track_name}")

    return f"Added {action_name} to NLA track {track_name}"
