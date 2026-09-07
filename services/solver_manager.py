"""Turnstile Solver process management - automatically started when backend launches"""
import subprocess
import sys
import os
import time
import threading
import requests

SOLVER_PORT = 8889
SOLVER_URL = f"http://localhost:{SOLVER_PORT}"
_proc: subprocess.Popen = None
_lock = threading.Lock()


def is_running() -> bool:
    try:
        r = requests.get(f"{SOLVER_URL}/", timeout=2)
        return r.status_code < 500
    except Exception:
        return False


def start():
    global _proc
    with _lock:
        if is_running():
            print("[Solver] already running")
            return
        solver_script = os.path.join(
            os.path.dirname(__file__), "turnstile_solver", "start.py"
        )
        _proc = subprocess.Popen(
            [sys.executable, solver_script,
             "--browser_type", "camoufox"],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        # Wait for service to be ready (up to 30s)
        for _ in range(30):
            time.sleep(1)
            if is_running():
                print(f"[Solver] started PID={_proc.pid}")
                return
        print("[Solver] start timeout")


def stop():
    global _proc
    with _lock:
        if _proc and _proc.poll() is None:
            _proc.terminate()
            _proc.wait(timeout=5)
            print("[Solver] stopped")
            _proc = None


def start_async():
    """Start in background thread without blocking main process"""
    t = threading.Thread(target=start, daemon=True)
    t.start()
