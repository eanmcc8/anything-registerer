"""Platform plugin base class"""
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Optional
from enum import Enum
import time


class AccountStatus(str, Enum):
    REGISTERED   = "registered"
    TRIAL        = "trial"
    SUBSCRIBED   = "subscribed"
    EXPIRED      = "expired"
    INVALID      = "invalid"


@dataclass
class Account:
    platform: str
    email: str
    password: str
    user_id: str = ""
    region: str = ""
    token: str = ""
    status: AccountStatus = AccountStatus.REGISTERED
    trial_end_time: int = 0       # unix timestamp
    extra: dict = field(default_factory=dict)  # Platform-specific custom fields
    created_at: int = field(default_factory=lambda: int(time.time()))


@dataclass
class RegisterConfig:
    """Registration task configuration"""
    executor_type: str = "protocol"   # protocol | headless | headed
    captcha_solver: str = "yescaptcha"  # yescaptcha | 2captcha | manual
    proxy: Optional[str] = None
    extra: dict = field(default_factory=dict)


class BasePlatform(ABC):
    # Subclasses must define
    name: str = ""
    display_name: str = ""
    version: str = "1.0.0"
    # Executor types declared by subclasses; unsupported types fall back to protocol
    supported_executors: list = ["protocol", "headless", "headed"]

    def __init__(self, config: RegisterConfig = None):
        self.config = config or RegisterConfig()
        if self.config.executor_type not in self.supported_executors:
            raise NotImplementedError(
                f"{self.display_name} does not support '{self.config.executor_type}' executor, "
                f"currently supported: {self.supported_executors}"
            )

    @abstractmethod
    def register(self, email: str, password: str = None) -> Account:
        """Execute registration flow, return Account"""
        ...

    @abstractmethod
    def check_valid(self, account: Account) -> bool:
        """Check if account is valid"""
        ...

    def get_trial_url(self, account: Account) -> Optional[str]:
        """Generate trial activation link (optional implementation)"""
        return None

    def get_platform_actions(self) -> list:
        """
        Return list of extra actions supported by the platform, each item format:
        {"id": str, "label": str, "params": [{"key": str, "label": str, "type": str}]}
        """
        return []

    def execute_action(self, action_id: str, account: Account, params: dict) -> dict:
        """
        Execute platform-specific action, return {"ok": bool, "data": any, "error": str}
        """
        raise NotImplementedError(f"Platform {self.name} does not support action: {action_id}")

    def get_quota(self, account: Account) -> dict:
        """Query account quota (optional implementation)"""
        return {}

    def _make_executor(self):
        """Create executor from config"""
        from .executors.protocol import ProtocolExecutor
        t = self.config.executor_type
        if t == "protocol":
            return ProtocolExecutor(proxy=self.config.proxy)
        elif t == "headless":
            from .executors.playwright import PlaywrightExecutor
            return PlaywrightExecutor(proxy=self.config.proxy, headless=True)
        elif t == "headed":
            from .executors.playwright import PlaywrightExecutor
            return PlaywrightExecutor(proxy=self.config.proxy, headless=False)
        raise ValueError(f"Unknown executor type: {t}")

    def _make_captcha(self, **kwargs):
        """Create captcha solver from config"""
        from .base_captcha import YesCaptcha, ManualCaptcha, LocalSolverCaptcha
        t = self.config.captcha_solver
        if t == "yescaptcha":
            key = kwargs.get("key") or self.config.extra.get("yescaptcha_key", "")
            return YesCaptcha(key)
        elif t == "manual":
            return ManualCaptcha()
        elif t == "local_solver":
            url = self.config.extra.get("solver_url", "http://localhost:8888")
            return LocalSolverCaptcha(url)
        raise ValueError(f"Unknown captcha solver: {t}")
