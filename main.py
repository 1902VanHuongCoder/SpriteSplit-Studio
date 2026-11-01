import os
import sys
import time
import threading
import webbrowser
import multiprocessing
import uvicorn
import webview

multiprocessing.freeze_support()

PORT = 8765

def run_api_server():
    from server import app
    uvicorn.run(app, host="127.0.0.1", port=PORT, log_level="warning")

def get_icon_path():
    """Tìm đường dẫn file icon.ico phù hợp khi chạy trực tiếp hoặc đóng gói PyInstaller."""
    if getattr(sys, "frozen", False):
        exe_dir = os.path.dirname(sys.executable)
        res_dir = getattr(sys, "_MEIPASS", os.path.join(exe_dir, "_internal"))
        for p in [os.path.join(res_dir, "icon.ico"), os.path.join(exe_dir, "icon.ico"), os.path.join(res_dir, "static", "favicon.ico")]:
            if os.path.exists(p):
                return p
    else:
        base_dir = os.path.dirname(os.path.abspath(__file__))
        for p in [os.path.join(base_dir, "icon.ico"), os.path.join(base_dir, "static", "favicon.ico")]:
            if os.path.exists(p):
                return p
    return None

def main():
    server_thread = threading.Thread(target=run_api_server, daemon=True)
    server_thread.start()
    
    time.sleep(1.2)
    url = f"http://127.0.0.1:{PORT}"

    # Kiểm tra xem người dùng có muốn mở trình duyệt hay dùng pywebview Desktop
    use_browser = "--browser" in sys.argv
    icon_file = get_icon_path()

    if use_browser:
        print(f"Opening browser at {url}...")
        webbrowser.open(url)
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            print("Exiting...")
            sys.exit(0)
    else:
        # Mở ứng dụng Desktop bằng pywebview (Edge WebView2 native)
        try:
            print("Launching SpriteSplit Studio Desktop Window with custom icon...")
            window = webview.create_window(
                title="SpriteSplit Studio - Tách bộ phận nhân vật 2D sang PNG & PSD",
                url=url,
                width=1320,
                height=860,
                min_size=(1024, 700),
                resizable=True,
                confirm_close=False,
                text_select=True
            )
            webview.start(icon=icon_file)
        except Exception as e:
            print(f"pywebview notice: {e}. Falling back to default browser...")
            webbrowser.open(url)
            try:
                while True:
                    time.sleep(1)
            except KeyboardInterrupt:
                sys.exit(0)

if __name__ == "__main__":
    main()
