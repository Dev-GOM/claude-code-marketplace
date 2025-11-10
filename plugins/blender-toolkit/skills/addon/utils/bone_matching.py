"""
Fuzzy Bone Matching Utilities
본 이름 유사도 기반 자동 매칭 알고리즘
"""

import re
from difflib import SequenceMatcher
from typing import Any, Dict, List, Optional, Tuple, Union


def normalize_bone_name(name: str) -> str:
    """
    본 이름 정규화
    - 소문자 변환
    - 특수문자를 언더스코어로 변환
    - 연속된 언더스코어 제거
    - 양쪽 공백 제거

    Examples:
        "Left_Arm" -> "left_arm"
        "left-arm" -> "left_arm"
        "LeftArm" -> "leftarm"
        "Left Arm" -> "left_arm"
    """
    # 소문자 변환
    normalized = name.lower()

    # 특수문자를 언더스코어로 변환 (알파벳, 숫자, 점만 유지)
    normalized = re.sub(r'[^a-z0-9.]', '_', normalized)

    # 연속된 언더스코어를 하나로
    normalized = re.sub(r'_+', '_', normalized)

    # 양쪽 언더스코어 제거
    normalized = normalized.strip('_')

    return normalized


def calculate_similarity(name1: str, name2: str) -> float:
    """
    두 본 이름 간 유사도 계산 (0.0 ~ 1.0)

    알고리즘:
    1. 정규화된 이름으로 SequenceMatcher 사용 (기본 점수)
    2. 부분 문자열 매칭 보너스
    3. 접두사/접미사 매칭 보너스
    4. 단어 포함 보너스

    Args:
        name1: 첫 번째 본 이름
        name2: 두 번째 본 이름

    Returns:
        유사도 점수 (0.0 = 전혀 다름, 1.0 = 완전 일치)
    """
    # 정규화
    norm1 = normalize_bone_name(name1)
    norm2 = normalize_bone_name(name2)

    # 완전 일치
    if norm1 == norm2:
        return 1.0

    # SequenceMatcher로 기본 유사도 계산
    base_score = SequenceMatcher(None, norm1, norm2).ratio()

    # 보너스 점수 계산
    bonus = 0.0

    # 1. 부분 문자열 매칭 보너스 (한쪽이 다른 쪽에 포함)
    if norm1 in norm2 or norm2 in norm1:
        bonus += 0.15

    # 2. 접두사 매칭 보너스 (left, right 등)
    common_prefixes = ['left', 'right', 'up', 'low', 'upper', 'lower']
    for prefix in common_prefixes:
        if norm1.startswith(prefix) and norm2.startswith(prefix):
            bonus += 0.1
            break

    # 3. 접미사 매칭 보너스 (l, r 등)
    underscore_l_match = norm1.endswith('_l') and norm2.endswith('_l')
    underscore_r_match = norm1.endswith('_r') and norm2.endswith('_r')
    dot_l_match = norm1.endswith('.l') and norm2.endswith('.l')
    dot_r_match = norm1.endswith('.r') and norm2.endswith('.r')

    if underscore_l_match or underscore_r_match or dot_l_match or dot_r_match:
        bonus += 0.1

    # 4. 숫자 매칭 보너스 (Spine1, Spine2 등)
    digits1 = re.findall(r'\d+', norm1)
    digits2 = re.findall(r'\d+', norm2)
    if digits1 and digits2 and digits1 == digits2:
        bonus += 0.1

    # 5. 단어 포함 보너스 (arm, hand, leg, foot 등)
    keywords = ['arm', 'hand', 'leg', 'foot', 'finger', 'thumb', 'index',
                'middle', 'ring', 'pinky', 'shoulder', 'elbow', 'wrist',
                'hip', 'knee', 'ankle', 'toe', 'spine', 'neck', 'head']

    for keyword in keywords:
        if keyword in norm1 and keyword in norm2:
            bonus += 0.05
            break

    # 최종 점수 (최대 1.0)
    final_score = min(base_score + bonus, 1.0)

    return final_score


def find_best_match(
    source_bone: str,
    target_bones: List[str],
    threshold: float = 0.6,
    return_score: bool = False
) -> Union[Optional[str], Tuple[Optional[str], float]]:
    """
    타겟 본 리스트에서 가장 유사한 본 찾기

    Args:
        source_bone: 매칭할 소스 본 이름
        target_bones: 타겟 본 이름 리스트
        threshold: 최소 유사도 임계값 (0.0 ~ 1.0)
        return_score: True면 (본_이름, 점수) 튜플 반환

    Returns:
        가장 유사한 타겟 본 이름, 또는 None (임계값 미만)
        return_score=True면 (본_이름, 점수) 튜플
    """
    best_match = None
    best_score = 0.0

    for target_bone in target_bones:
        score = calculate_similarity(source_bone, target_bone)

        if score > best_score and score >= threshold:
            best_score = score
            best_match = target_bone

    if return_score:
        return (best_match, best_score)

    return best_match


def fuzzy_match_bones(
    source_bones: List[str],
    target_bones: List[str],
    known_aliases: Dict[str, List[str]] = None,
    threshold: float = 0.6,
    prefer_exact: bool = True
) -> Dict[str, str]:
    """
    Fuzzy matching을 사용한 전체 본 매핑

    알고리즘:
    1. 정확한 매칭 우선 (known_aliases 사용)
    2. Fuzzy matching으로 나머지 매칭
    3. 임계값 이상인 것만 포함

    Args:
        source_bones: 소스 본 이름 리스트
        target_bones: 타겟 본 이름 리스트
        known_aliases: 알려진 별칭 딕셔너리 {source: [target_alias1, ...]}
        threshold: 최소 유사도 임계값
        prefer_exact: True면 정확한 매칭 우선

    Returns:
        본 매핑 딕셔너리 {source_bone: target_bone}
    """
    bone_map = {}
    target_bone_names_lower = [b.lower() for b in target_bones]
    matched_targets = set()  # 중복 매칭 방지

    # 1단계: 정확한 매칭 (known_aliases 사용)
    if prefer_exact and known_aliases:
        for source_bone in source_bones:
            if source_bone not in known_aliases:
                continue

            # 별칭 리스트에서 타겟에 있는 것 찾기
            for alias in known_aliases[source_bone]:
                alias_lower = alias.lower()
                if alias_lower in target_bone_names_lower:
                    idx = target_bone_names_lower.index(alias_lower)
                    actual_name = target_bones[idx]

                    # 이미 매칭된 타겟이 아니면 추가
                    if actual_name not in matched_targets:
                        bone_map[source_bone] = actual_name
                        matched_targets.add(actual_name)
                        break

    # 2단계: Fuzzy matching으로 나머지 매칭
    for source_bone in source_bones:
        # 이미 매칭된 소스 본은 건너뛰기
        if source_bone in bone_map:
            continue

        # 아직 매칭되지 않은 타겟 본들만 대상으로
        available_targets = [t for t in target_bones if t not in matched_targets]

        if not available_targets:
            continue

        # 가장 유사한 타겟 찾기
        best_match, _ = find_best_match(
            source_bone,
            available_targets,
            threshold=threshold,
            return_score=True
        )

        if best_match:
            bone_map[source_bone] = best_match
            matched_targets.add(best_match)

    return bone_map


def get_match_quality_report(bone_map: Dict[str, str]) -> Dict[str, Any]:
    """
    본 매핑 품질 보고서 생성

    Args:
        bone_map: 본 매핑 딕셔너리

    Returns:
        품질 보고서 딕셔너리
    """
    if not bone_map:
        return {
            'total_mappings': 0,
            'quality': 'none',
            'summary': 'No bone mappings found'
        }

    total = len(bone_map)

    # 주요 본 체크 (최소한 있어야 하는 본들)
    critical_bones = ['Hips', 'Spine', 'Head', 'LeftArm', 'RightArm',
                      'LeftLeg', 'RightLeg', 'LeftHand', 'RightHand']
    critical_mapped = sum(1 for bone in critical_bones if bone in bone_map)

    # 품질 평가
    if critical_mapped >= 8:
        quality = 'excellent'
    elif critical_mapped >= 6:
        quality = 'good'
    elif critical_mapped >= 4:
        quality = 'fair'
    else:
        quality = 'poor'

    return {
        'total_mappings': total,
        'critical_bones_mapped': f'{critical_mapped}/{len(critical_bones)}',
        'quality': quality,
        'summary': f'{total} bones mapped, {critical_mapped}/{len(critical_bones)} critical bones'
    }
