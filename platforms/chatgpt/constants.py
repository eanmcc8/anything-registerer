"""
常量定义
"""

import random
from datetime import datetime
from enum import Enum
from typing import Dict, List, Tuple


# ============================================================================
# Enum types
# ============================================================================

class AccountStatus(str, Enum):
    """账户状态"""
    ACTIVE = "active"
    EXPIRED = "expired"
    BANNED = "banned"
    FAILED = "failed"


class TaskStatus(str, Enum):
    """任务状态"""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class EmailServiceType(str, Enum):
    """邮箱服务类型"""
    TEMPMAIL = "tempmail"
    OUTLOOK = "outlook"
    CUSTOM_DOMAIN = "custom_domain"
    TEMP_MAIL = "temp_mail"


# ============================================================================
# Application constants
# ============================================================================

APP_NAME = "OpenAI/Codex CLI 自动注册系统"
APP_VERSION = "2.0.0"
APP_DESCRIPTION = "自动注册 OpenAI/Codex CLI 账号的系统"

# ============================================================================
# OpenAI OAuth related constants
# ============================================================================

# OAuth parameters
OAUTH_CLIENT_ID = "app_EMoamEEZ73f0CkXaXp7hrann"
OAUTH_AUTH_URL = "https://auth.openai.com/oauth/authorize"
OAUTH_TOKEN_URL = "https://auth.openai.com/oauth/token"
OAUTH_REDIRECT_URI = "http://localhost:1455/auth/callback"
OAUTH_SCOPE = "openid email profile offline_access"

# OpenAI API endpoints
OPENAI_API_ENDPOINTS = {
    "sentinel": "https://sentinel.openai.com/backend-api/sentinel/req",
    "signup": "https://auth.openai.com/api/accounts/authorize/continue",
    "register": "https://auth.openai.com/api/accounts/user/register",
    "send_otp": "https://auth.openai.com/api/accounts/email-otp/send",
    "validate_otp": "https://auth.openai.com/api/accounts/email-otp/validate",
    "create_account": "https://auth.openai.com/api/accounts/create_account",
    "select_workspace": "https://auth.openai.com/api/accounts/workspace/select",
}

# OpenAI page types (used to determine account status)
OPENAI_PAGE_TYPES = {
    "EMAIL_OTP_VERIFICATION": "email_otp_verification",  # 已注册账号，需要 OTP 验证
    "PASSWORD_REGISTRATION": "password",  # 新账号，需要设置密码
}

# ============================================================================
# Email service related constants
# ============================================================================

# Tempmail.lol API endpoints
TEMPMAIL_API_ENDPOINTS = {
    "create_inbox": "/inbox/create",
    "get_inbox": "/inbox",
}

# Custom domain email API endpoints
CUSTOM_DOMAIN_API_ENDPOINTS = {
    "get_config": "/api/config",
    "create_email": "/api/emails/generate",
    "list_emails": "/api/emails",
    "get_email_messages": "/api/emails/{emailId}",
    "delete_email": "/api/emails/{emailId}",
    "get_message": "/api/emails/{emailId}/{messageId}",
}

# Email service default configurations
EMAIL_SERVICE_DEFAULTS = {
    "tempmail": {
        "base_url": "https://api.tempmail.lol/v2",
        "timeout": 30,
        "max_retries": 3,
    },
    "outlook": {
        "imap_server": "outlook.office365.com",
        "imap_port": 993,
        "smtp_server": "smtp.office365.com",
        "smtp_port": 587,
        "timeout": 30,
    },
    "custom_domain": {
        "base_url": "",  # Requires user configuration
        "api_key_header": "X-API-Key",
        "timeout": 30,
        "max_retries": 3,
    }
}

# ============================================================================
# Registration process related constants
# ============================================================================

# OTP related
OTP_CODE_PATTERN = r"(?<!\d)(\d{6})(?!\d)"
OTP_MAX_ATTEMPTS = 40  # 最大轮询次数

# OTP extraction regex (enhanced)
# Simple match: any 6-digit number
OTP_CODE_SIMPLE_PATTERN = r"(?<!\d)(\d{6})(?!\d)"
# Semantic match: OTP with context (e.g., "code is 123456", "验证码 123456")
OTP_CODE_SEMANTIC_PATTERN = r'(?:code\s+is|验证码[是为]?\s*[:：]?\s*)(\d{6})'

# OpenAI verification email senders
OPENAI_EMAIL_SENDERS = [
    "noreply@openai.com",
    "no-reply@openai.com",
    "@openai.com",     # Exact domain match
    ".openai.com",     # Subdomain match (e.g., otp@tm1.openai.com)
]

# OpenAI verification email keywords
OPENAI_VERIFICATION_KEYWORDS = [
    "verify your email",
    "verification code",
    "验证码",
    "your openai code",
    "code is",
    "one-time code",
]

# Password generation
PASSWORD_CHARSET = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
DEFAULT_PASSWORD_LENGTH = 12

# User info generation (for registration)

# Common English first names
FIRST_NAMES = [
    "James", "John", "Robert", "Michael", "William", "David", "Richard", "Joseph", "Thomas", "Charles",
    "Emma", "Olivia", "Ava", "Isabella", "Sophia", "Mia", "Charlotte", "Amelia", "Harper", "Evelyn",
    "Alex", "Jordan", "Taylor", "Morgan", "Casey", "Riley", "Jamie", "Avery", "Quinn", "Skyler",
    "Liam", "Noah", "Ethan", "Lucas", "Mason", "Oliver", "Elijah", "Aiden", "Henry", "Sebastian",
    "Grace", "Lily", "Chloe", "Zoey", "Nora", "Aria", "Hazel", "Aurora", "Stella", "Ivy"
]

def generate_random_user_info() -> dict:
    """
    生成随机用户信息

    Returns:
        包含 name 和 birthdate 的字典
    """
    # Randomly select name
    name = random.choice(FIRST_NAMES)

    # Generate random birthday (age 18-45)
    current_year = datetime.now().year
    birth_year = random.randint(current_year - 45, current_year - 18)
    birth_month = random.randint(1, 12)
    # Determine days based on month
    if birth_month in [1, 3, 5, 7, 8, 10, 12]:
        birth_day = random.randint(1, 31)
    elif birth_month in [4, 6, 9, 11]:
        birth_day = random.randint(1, 30)
    else:
        # February, simplified handling
        birth_day = random.randint(1, 28)

    birthdate = f"{birth_year}-{birth_month:02d}-{birth_day:02d}"

    return {
        "name": name,
        "birthdate": birthdate
    }

# Default values kept for compatibility
DEFAULT_USER_INFO = {
    "name": "Neo",
    "birthdate": "2000-02-20",
}

# ============================================================================
# Proxy related constants
# ============================================================================

PROXY_TYPES = ["http", "socks5", "socks5h"]
DEFAULT_PROXY_CONFIG = {
    "enabled": False,
    "type": "http",
    "host": "127.0.0.1",
    "port": 7890,
}

# ============================================================================
# Database related constants
# ============================================================================

# Database table names
DB_TABLE_NAMES = {
    "accounts": "accounts",
    "email_services": "email_services",
    "registration_tasks": "registration_tasks",
    "settings": "settings",
}

# Default settings
DEFAULT_SETTINGS = [
    # (key, value, description, category)
    ("system.name", APP_NAME, "系统名称", "general"),
    ("system.version", APP_VERSION, "系统版本", "general"),
    ("logs.retention_days", "30", "日志保留天数", "general"),
    ("openai.client_id", OAUTH_CLIENT_ID, "OpenAI OAuth Client ID", "openai"),
    ("openai.auth_url", OAUTH_AUTH_URL, "OpenAI 认证地址", "openai"),
    ("openai.token_url", OAUTH_TOKEN_URL, "OpenAI Token 地址", "openai"),
    ("openai.redirect_uri", OAUTH_REDIRECT_URI, "OpenAI 回调地址", "openai"),
    ("openai.scope", OAUTH_SCOPE, "OpenAI 权限范围", "openai"),
    ("proxy.enabled", "false", "是否启用代理", "proxy"),
    ("proxy.type", "http", "代理类型 (http/socks5)", "proxy"),
    ("proxy.host", "127.0.0.1", "代理主机", "proxy"),
    ("proxy.port", "7890", "代理端口", "proxy"),
    ("registration.max_retries", "3", "最大重试次数", "registration"),
    ("registration.timeout", "120", "超时时间（秒）", "registration"),
    ("registration.default_password_length", "12", "默认密码长度", "registration"),
    ("webui.host", "0.0.0.0", "Web UI 监听主机", "webui"),
    ("webui.port", "8000", "Web UI 监听端口", "webui"),
    ("webui.debug", "true", "调试模式", "webui"),
]

# ============================================================================
# Web UI related constants
# ============================================================================

# WebSocket events
WEBSOCKET_EVENTS = {
    "CONNECT": "connect",
    "DISCONNECT": "disconnect",
    "LOG": "log",
    "STATUS": "status",
    "ERROR": "error",
    "COMPLETE": "complete",
}

# API response status codes
API_STATUS_CODES = {
    "SUCCESS": 200,
    "CREATED": 201,
    "BAD_REQUEST": 400,
    "UNAUTHORIZED": 401,
    "FORBIDDEN": 403,
    "NOT_FOUND": 404,
    "CONFLICT": 409,
    "INTERNAL_ERROR": 500,
}

# Pagination
DEFAULT_PAGE_SIZE = 20
MAX_PAGE_SIZE = 100

# ============================================================================
# Error messages
# ============================================================================

ERROR_MESSAGES = {
    # Common errors
    "DATABASE_ERROR": "数据库操作失败",
    "CONFIG_ERROR": "配置错误",
    "NETWORK_ERROR": "网络连接失败",
    "TIMEOUT": "操作超时",
    "VALIDATION_ERROR": "参数验证失败",

    # Email service errors
    "EMAIL_SERVICE_UNAVAILABLE": "邮箱服务不可用",
    "EMAIL_CREATION_FAILED": "创建邮箱失败",
    "OTP_NOT_RECEIVED": "未收到验证码",
    "OTP_INVALID": "验证码无效",

    # OpenAI related errors
    "OPENAI_AUTH_FAILED": "OpenAI 认证失败",
    "OPENAI_RATE_LIMIT": "OpenAI 接口限流",
    "OPENAI_CAPTCHA": "遇到验证码",

    # Proxy errors
    "PROXY_FAILED": "代理连接失败",
    "PROXY_AUTH_FAILED": "代理认证失败",

    # Account errors
    "ACCOUNT_NOT_FOUND": "账户不存在",
    "ACCOUNT_ALREADY_EXISTS": "账户已存在",
    "ACCOUNT_INVALID": "账户无效",

    # Task errors
    "TASK_NOT_FOUND": "任务不存在",
    "TASK_ALREADY_RUNNING": "任务已在运行中",
    "TASK_CANCELLED": "任务已取消",
}

# ============================================================================
# Regular expressions
# ============================================================================

REGEX_PATTERNS = {
    "EMAIL": r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$",
    "URL": r"https?://(?:[-\w.]|(?:%[\da-fA-F]{2}))+",
    "IP_ADDRESS": r"\b(?:\d{1,3}\.){3}\d{1,3}\b",
    "OTP_CODE": OTP_CODE_PATTERN,
}

# ============================================================================
# Time constants
# ============================================================================

TIME_CONSTANTS = {
    "SECOND": 1,
    "MINUTE": 60,
    "HOUR": 3600,
    "DAY": 86400,
    "WEEK": 604800,
}


# ============================================================================
# Microsoft/Outlook related constants
# ============================================================================

# Microsoft OAuth2 Token endpoints
MICROSOFT_TOKEN_ENDPOINTS = {
    # Legacy IMAP endpoint
    "LIVE": "https://login.live.com/oauth20_token.srf",
     # New IMAP endpoint (requires specific scope)
    "CONSUMERS": "https://login.microsoftonline.com/consumers/oauth2/v2.0/token",
     # Endpoint for Graph API
    "COMMON": "https://login.microsoftonline.com/common/oauth2/v2.0/token",
}

# IMAP server configurations
OUTLOOK_IMAP_SERVERS = {
    "OLD": "outlook.office365.com",  # Legacy IMAP
    "NEW": "outlook.live.com",       # New IMAP
}

# Microsoft OAuth2 Scopes
MICROSOFT_SCOPES = {
    # 旧版 IMAP 不需要特定 scope
    "IMAP_OLD": "",
    # Scope required for new IMAP
    "IMAP_NEW": "https://outlook.office.com/IMAP.AccessAsUser.All offline_access",
    # Scope required for Graph API
    "GRAPH_API": "https://graph.microsoft.com/.default",
}

# Outlook provider default priority
OUTLOOK_PROVIDER_PRIORITY = ["imap_new", "imap_old", "graph_api"]