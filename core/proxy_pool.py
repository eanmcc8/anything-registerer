"""Proxy pool - reads proxies from database, supports round-robin and region selection"""
from typing import Optional
from sqlmodel import Session, select
from .db import ProxyModel, engine
import time


class ProxyPool:
    def get_next(self, region: str = "") -> Optional[str]:
        """Round-robin select an available proxy by success rate"""
        with Session(engine) as s:
            q = select(ProxyModel).where(ProxyModel.is_active == True)
            if region:
                q = q.where(ProxyModel.region == region)
            proxies = s.exec(q).all()
            if not proxies:
                return None
            # Sort by success rate, highest first
            proxies.sort(
                key=lambda p: p.success_count / max(p.success_count + p.fail_count, 1),
                reverse=True
            )
            return proxies[0].url

    def report_success(self, url: str) -> None:
        with Session(engine) as s:
            p = s.exec(select(ProxyModel).where(ProxyModel.url == url)).first()
            if p:
                p.success_count += 1
                p.last_checked = __import__('datetime').datetime.utcnow()
                s.add(p)
                s.commit()

    def report_fail(self, url: str) -> None:
        with Session(engine) as s:
            p = s.exec(select(ProxyModel).where(ProxyModel.url == url)).first()
            if p:
                p.fail_count += 1
                p.last_checked = __import__('datetime').datetime.utcnow()
                # Auto-disable after consecutive failures
                if p.fail_count > 0 and p.success_count == 0 and p.fail_count >= 5:
                    p.is_active = False
                s.add(p)
                s.commit()

    def check_all(self) -> dict:
        """Check availability of all proxies"""
        import requests
        with Session(engine) as s:
            proxies = s.exec(select(ProxyModel)).all()
        results = {"ok": 0, "fail": 0}
        for p in proxies:
            try:
                r = requests.get("https://httpbin.org/ip",
                                 proxies={"http": p.url, "https": p.url},
                                 timeout=8)
                if r.status_code == 200:
                    self.report_success(p.url)
                    results["ok"] += 1
                    continue
            except Exception:
                pass
            self.report_fail(p.url)
            results["fail"] += 1
        return results


proxy_pool = ProxyPool()
