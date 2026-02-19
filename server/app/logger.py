import logging
import os

# 로그 디렉토리 생성
log_dir = r"C:\Users\A\.gemini\antigravity\scratch\nomad-base\server\logs"
if not os.path.exists(log_dir):
    os.makedirs(log_dir)

def get_logger(name):
    """
    파일 기반 로깅을 설정하는 함수.
    한글 로그 메시지와 파일 기록을 우선함.
    """
    logger = logging.getLogger(name)
    logger.setLevel(logging.INFO)
    
    # 중복 핸들러 방지
    if logger.handlers:
        return logger

    # 파일 핸들러 설정
    log_file = os.path.join(log_dir, "nomad_base.log")
    file_handler = logging.FileHandler(log_file, encoding='utf-8')
    
    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    file_handler.setFormatter(formatter)
    logger.addHandler(file_handler)
    
    # 콘솔 출력 병행
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)
    
    return logger
