"""Captcha solver base class"""
from abc import ABC, abstractmethod


class BaseCaptcha(ABC):
    @abstractmethod
    def solve_turnstile(self, page_url: str, site_key: str) -> str:
        """Return Turnstile token"""
        ...

    @abstractmethod
    def solve_image(self, image_b64: str) -> str:
        """Return image captcha text"""
        ...


class YesCaptcha(BaseCaptcha):
    def __init__(self, client_key: str):
        self.client_key = client_key
        self.api = "https://api.yescaptcha.com"

    def solve_turnstile(self, page_url: str, site_key: str) -> str:
        import requests, time, urllib3
        urllib3.disable_warnings()
        r = requests.post(f"{self.api}/createTask", json={
            "clientKey": self.client_key,
            "task": {"type": "TurnstileTaskProxyless",
                     "websiteURL": page_url, "websiteKey": site_key}
        }, timeout=30, verify=False)
        task_id = r.json().get("taskId")
        if not task_id:
            raise RuntimeError(f"YesCaptcha task creation failed: {r.text}")
        for _ in range(60):
            time.sleep(3)
            d = requests.post(f"{self.api}/getTaskResult", json={
                "clientKey": self.client_key, "taskId": task_id
            }, timeout=30, verify=False).json()
            if d.get("status") == "ready":
                return d["solution"]["token"]
            if d.get("errorId", 0) != 0:
                raise RuntimeError(f"YesCaptcha error: {d}")
            raise TimeoutError("YesCaptcha Turnstile timeout")

    def solve_image(self, image_b64: str) -> str:
        raise NotImplementedError


class ManualCaptcha(BaseCaptcha):
    """Manual captcha, blocking and waiting for user input"""
    def solve_turnstile(self, page_url: str, site_key: str) -> str:
        return input(f"Please manually obtain Turnstile token ({page_url}): ").strip()

    def solve_image(self, image_b64: str) -> str:
        return input("Please enter image captcha: ").strip()


class LocalSolverCaptcha(BaseCaptcha):
    """Call local api_solver service to solve Turnstile (Camoufox/patchright)"""

    def __init__(self, solver_url: str = "http://localhost:8888"):
        self.solver_url = solver_url.rstrip("/")

    def solve_turnstile(self, page_url: str, site_key: str) -> str:
        import requests, time
        # Submit task
        r = requests.get(
            f"{self.solver_url}/turnstile",
            params={"url": page_url, "sitekey": site_key},
            timeout=15,
        )
        r.raise_for_status()
        task_id = r.json().get("taskId")
        if not task_id:
            raise RuntimeError(f"LocalSolver did not return taskId: {r.text}")
        # Poll for results
        for _ in range(60):
            time.sleep(2)
            res = requests.get(
                f"{self.solver_url}/result",
                params={"id": task_id},
                timeout=10,
            )
            if res.status_code == 200:
                data = res.json()
                status = data.get("status")
                if status == "ready":
                    token = data.get("solution", {}).get("token")
                    if token:
                        return token
                elif status == "CAPTCHA_FAIL":
                    raise RuntimeError("LocalSolver Turnstile failed")
        raise TimeoutError("LocalSolver Turnstile timeout")

    def solve_image(self, image_b64: str) -> str:
        raise NotImplementedError

    @staticmethod
    def start_solver(headless: bool = True, browser_type: str = "camoufox",
                     port: int = 8888) -> None:
        """Start local solver service in background thread"""
        import subprocess, sys, os
        solver_path = os.path.join(
            os.path.dirname(__file__), "..", "services", "turnstile_solver", "api_solver.py"
        )
        cmd = [
            sys.executable, solver_path,
            "--port", str(port),
            "--browser", browser_type,
        ]
        if headless:
            cmd.append("--headless")
        subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        # Wait for service to start
        import time, requests
        for _ in range(20):
            time.sleep(1)
            try:
                requests.get(f"http://localhost:{port}/", timeout=2)
                return
            except Exception:
                pass
        raise RuntimeError("LocalSolver startup timeout")
