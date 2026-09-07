"""Scheduled task scheduler - account validity checks, trial expiry reminders"""
from datetime import datetime, timezone
from sqlmodel import Session, select
from .db import engine, AccountModel
from .registry import get, load_all
from .base_platform import Account, AccountStatus, RegisterConfig
import threading
import time


class Scheduler:
    def __init__(self):
        self._running = False
        self._thread: threading.Thread = None

    def start(self):
        if self._running:
            return
        self._running = True
        self._thread = threading.Thread(target=self._loop, daemon=True)
        self._thread.start()
        print("[Scheduler] started")

    def stop(self):
        self._running = False

    def _loop(self):
        while self._running:
            try:
                self.check_trial_expiry()
            except Exception as e:
                print(f"[Scheduler] Error: {e}")
            # Check hourly
            time.sleep(3600)

    def check_trial_expiry(self):
        """Check trial expiry accounts and update status"""
        now = int(datetime.now(timezone.utc).timestamp())
        with Session(engine) as s:
            accounts = s.exec(
                select(AccountModel).where(AccountModel.status == "trial")
            ).all()
            updated = 0
            for acc in accounts:
                if acc.trial_end_time and acc.trial_end_time < now:
                    acc.status = AccountStatus.EXPIRED.value
                    acc.updated_at = datetime.utcnow()
                    s.add(acc)
                    updated += 1
            s.commit()
            if updated:
                print(f"[Scheduler] {updated} trial accounts expired")

    def check_accounts_valid(self, platform: str = None, limit: int = 50):
        """Batch check account validity"""
        load_all()
        with Session(engine) as s:
            q = select(AccountModel).where(
                AccountModel.status.in_(["registered", "trial", "subscribed"])
            )
            if platform:
                q = q.where(AccountModel.platform == platform)
            accounts = s.exec(q.limit(limit)).all()

        results = {"valid": 0, "invalid": 0, "error": 0}
        for acc in accounts:
            try:
                PlatformCls = get(acc.platform)
                plugin = PlatformCls(config=RegisterConfig())
                import json
                account_obj = Account(
                    platform=acc.platform,
                    email=acc.email,
                    password=acc.password,
                    user_id=acc.user_id,
                    region=acc.region,
                    token=acc.token,
                    extra=json.loads(acc.extra_json or "{}"),
                )
                valid = plugin.check_valid(account_obj)
                with Session(engine) as s:
                    a = s.get(AccountModel, acc.id)
                    if a:
                        a.status = acc.status if valid else AccountStatus.INVALID.value
                        a.updated_at = datetime.utcnow()
                        s.add(a)
                        s.commit()
                if valid:
                    results["valid"] += 1
                else:
                    results["invalid"] += 1
            except Exception:
                results["error"] += 1
        return results


scheduler = Scheduler()
