"""Trae.ai platform plugin"""
from core.base_platform import BasePlatform, Account, AccountStatus, RegisterConfig
from core.base_mailbox import BaseMailbox
from core.registry import register


@register
class TraePlatform(BasePlatform):
    name = "trae"
    display_name = "Trae.ai"
    version = "1.0.0"

    def __init__(self, config: RegisterConfig = None, mailbox: BaseMailbox = None):
        super().__init__(config)
        self.mailbox = mailbox

    def register(self, email: str, password: str = None) -> Account:
        from platforms.trae.core import TraeRegister
        log = getattr(self, '_log_fn', print)

        mail_acct = self.mailbox.get_email() if self.mailbox else None
        email = email or (mail_acct.email if mail_acct else None)
        log(f"Email: {email}")
        before_ids = self.mailbox.get_current_ids(mail_acct) if mail_acct else set()

        def otp_cb():
            log("Waiting for verification code...")
            code = self.mailbox.wait_for_code(mail_acct, keyword="", before_ids=before_ids)
            if code: log(f"Verification code: {code}")
            return code

        with self._make_executor() as ex:
            reg = TraeRegister(executor=ex, log_fn=log)
            result = reg.register(
                email=email,
                password=password,
                otp_callback=otp_cb if self.mailbox else None,
            )

        return Account(
            platform="trae",
            email=result["email"],
            password=result["password"],
            user_id=result["user_id"],
            token=result["token"],
            region=result["region"],
            status=AccountStatus.REGISTERED,
            extra={"cashier_url": result["cashier_url"],
                   "ai_pay_host": result["ai_pay_host"]},
        )

    def check_valid(self, account: Account) -> bool:
        return bool(account.token)

    def get_platform_actions(self) -> list:
        """Return list of actions supported by the platform"""
        return [
            {"id": "switch_account", "label": "Switch to desktop app", "params": []},
            {"id": "get_user_info", "label": "Get user info", "params": []},
            {"id": "get_cashier_url", "label": "Get upgrade link", "params": []},
        ]

    def execute_action(self, action_id: str, account: Account, params: dict) -> dict:
        """Execute platform action"""
        if action_id == "switch_account":
            from platforms.trae.switch import switch_trae_account, restart_trae_ide
            
            token = account.token
            user_id = account.user_id or ""
            email = account.email or ""
            region = account.region or ""
            
            if not token:
                return {"ok": False, "error": "Account missing token"}
            
            ok, msg = switch_trae_account(token, user_id, email, region)
            if not ok:
                return {"ok": False, "error": msg}
            
            restart_ok, restart_msg = restart_trae_ide()
            return {
                "ok": True,
                "data": {
                    "message": f"{msg}。{restart_msg}" if restart_ok else msg,
                }
            }
        
        elif action_id == "get_user_info":
            from platforms.trae.switch import get_trae_user_info
            
            token = account.token
            if not token:
                return {"ok": False, "error": "Account missing token"}
            
            user_info = get_trae_user_info(token)
            if user_info:
                return {"ok": True, "data": user_info}
            return {"ok": False, "error": "Failed to get user info"}
        
        elif action_id == "get_cashier_url":
            from platforms.trae.core import TraeRegister
            with self._make_executor() as ex:
                reg = TraeRegister(executor=ex)
                # Re-login to refresh session, then get new token and cashier_url
                reg.step4_trae_login()
                token = reg.step5_get_token()
                if not token:
                    token = account.token
                cashier_url = reg.step7_create_order(token)
            if not cashier_url:
                return {"ok": False, "error": "Failed to get upgrade link, token may have expired, please re-register"}
            return {"ok": True, "data": {"cashier_url": cashier_url, "message": "Please open the upgrade link in your browser to complete Pro subscription"}}

        raise NotImplementedError(f"Unknown action: {action_id}")
