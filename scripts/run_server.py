import http.server
import socketserver
import socket
import os

# 게임 디렉토리로 이동 (스크립트가 scripts 폴터 내에 있다고 가정)
os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

PORT = 8080

def get_local_ip():
    """현재 PC의 로컬 네트워크 IP 주소를 가져옵니다."""
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        # 연결되지 않아도 되며, 로컬 IP를 확인하기 위한 가장 일반적인 방법
        s.connect(('8.8.8.8', 1))
        ip = s.getsockname()[0]
    except Exception:
        ip = '127.0.0.1'
    finally:
        s.close()
    return ip

Handler = http.server.SimpleHTTPRequestHandler

print("=" * 50)
print("🚀 노마드 베이스 - 모바일 접속 서버 가동 중")
print("=" * 50)
print(f"현재 PC 주소: {get_local_ip()}")
print(f"모바일 브라우저 주소창에 아래 주소를 입력하세요:")
print(f"\n👉 http://{get_local_ip()}:{PORT}\n")
print("-" * 50)
print("⚠️ 주의: 스마트폰과 PC가 같은 Wi-Fi에 연결되어 있어야 합니다.")
print("⚠️ 서버를 종료하려면 이 창에서 Ctrl+C를 누르세요.")
print("=" * 50)

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    httpd.serve_forever()
