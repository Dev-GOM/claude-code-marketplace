"""
Python Logging Configuration
Blender addon용 로깅 시스템
"""

import logging
import os
from pathlib import Path
from datetime import datetime


# 로그 디렉토리 경로
def get_log_dir() -> Path:
    """로그 디렉토리 경로 가져오기"""
    # CLAUDE_PROJECT_DIR 환경변수 또는 현재 작업 디렉토리 사용
    project_dir = os.environ.get('CLAUDE_PROJECT_DIR', os.getcwd())
    log_dir = Path(project_dir) / '.blender-toolkit' / 'logs'

    # 디렉토리 생성
    log_dir.mkdir(parents=True, exist_ok=True)

    return log_dir


# 로그 포맷 정의
LOG_FORMAT = '[%(asctime)s] [%(levelname)-8s] [%(name)s] %(message)s'
DATE_FORMAT = '%Y-%m-%d %H:%M:%S'

# 전역 로거 설정 완료 여부
_logger_initialized = False


def setup_logging(level: int = logging.INFO) -> None:
    """
    전역 로깅 설정 초기화

    Args:
        level: 로그 레벨 (logging.DEBUG, INFO, WARNING, ERROR)
    """
    global _logger_initialized

    if _logger_initialized:
        return

    # 로그 디렉토리
    log_dir = get_log_dir()

    # 루트 로거 설정
    root_logger = logging.getLogger('blender_toolkit')
    root_logger.setLevel(level)

    # 기존 핸들러 제거 (중복 방지)
    root_logger.handlers.clear()

    # 파일 핸들러 (모든 로그)
    file_handler = logging.FileHandler(
        log_dir / 'blender-addon.log',
        mode='a',
        encoding='utf-8'
    )
    file_handler.setLevel(level)
    file_handler.setFormatter(logging.Formatter(LOG_FORMAT, DATE_FORMAT))

    # 파일 핸들러 (에러만)
    error_handler = logging.FileHandler(
        log_dir / 'error.log',
        mode='a',
        encoding='utf-8'
    )
    error_handler.setLevel(logging.ERROR)
    error_handler.setFormatter(logging.Formatter(LOG_FORMAT, DATE_FORMAT))

    # 콘솔 핸들러 (개발 모드)
    if os.environ.get('DEBUG'):
        console_handler = logging.StreamHandler()
        console_handler.setLevel(logging.DEBUG)
        console_handler.setFormatter(
            logging.Formatter('[%(levelname)-8s] %(message)s')
        )
        root_logger.addHandler(console_handler)

    # 핸들러 추가
    root_logger.addHandler(file_handler)
    root_logger.addHandler(error_handler)

    _logger_initialized = True

    # 초기화 메시지
    root_logger.info('=' * 70)
    root_logger.info(f'Blender Toolkit Logger initialized')
    root_logger.info(f'Log directory: {log_dir}')
    root_logger.info(f'Log level: {logging.getLevelName(level)}')
    root_logger.info('=' * 70)


def get_logger(name: str = None) -> logging.Logger:
    """
    모듈별 로거 가져오기

    Args:
        name: 로거 이름 (보통 __name__ 사용)

    Returns:
        Logger 인스턴스

    Example:
        ```python
        from .utils.logger import get_logger

        logger = get_logger(__name__)
        logger.info("Hello, world!")
        logger.error("An error occurred", exc_info=True)
        ```
    """
    # 로깅 시스템이 초기화되지 않았으면 초기화
    if not _logger_initialized:
        # DEBUG 환경변수가 있으면 DEBUG 레벨 사용
        level = logging.DEBUG if os.environ.get('DEBUG') else logging.INFO
        setup_logging(level)

    # 모듈별 로거 반환
    logger_name = f'blender_toolkit.{name}' if name else 'blender_toolkit'
    return logging.getLogger(logger_name)


# 편의 함수들
def log_function_call(logger: logging.Logger):
    """
    함수 호출 로깅 데코레이터

    Example:
        ```python
        @log_function_call(logger)
        def my_function(arg1, arg2):
            return arg1 + arg2
        ```
    """
    def decorator(func):
        def wrapper(*args, **kwargs):
            logger.debug(f'Calling {func.__name__}() with args={args}, kwargs={kwargs}')
            try:
                result = func(*args, **kwargs)
                logger.debug(f'{func.__name__}() returned: {result}')
                return result
            except Exception as e:
                logger.error(f'{func.__name__}() raised {type(e).__name__}: {e}', exc_info=True)
                raise
        return wrapper
    return decorator


def log_error(logger: logging.Logger, error: Exception, context: str = None):
    """
    에러 로깅 헬퍼

    Args:
        logger: Logger 인스턴스
        error: Exception 객체
        context: 에러 발생 컨텍스트 설명
    """
    message = f'{type(error).__name__}: {error}'
    if context:
        message = f'{context} - {message}'

    logger.error(message, exc_info=True)
