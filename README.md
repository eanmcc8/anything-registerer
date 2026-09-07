# Any Auto Register

> ⚠️ **Disclaimer**: This project is for learning and research purposes only, and may not be used for any commercial purposes. Users are solely responsible for any consequences arising from the use of this project.

Multi-platform account auto-registration and management system, with plugin extensibility and built-in Web UI.

## Features

- **Multi-platform support**: Trae.ai, Tavily, Cursor, Kiro, ChatGPT, OpenBlockLabs, with custom plugin extension support
- **Multiple mailbox services**: MoeMail (self-hosted), Laoudo, DuckMail, Cloudflare Worker self-hosted email
- **Multiple execution modes**: API protocol (no browser), headless browser (coming soon), headed browser (coming soon) (supported per platform as needed)
- **Captcha services**: YesCaptcha, 2Captcha, local Solver (Camoufox)
- **Proxy pool management**: automatic rotation, success rate statistics, automatic disabling of failed proxies
- **Concurrent registration**: configurable concurrency
- **Real-time logs**: SSE pushes registration logs to the frontend in real time
- **Platform extended actions**: each platform can define custom actions (e.g. Kiro account switching, Trae Pro upgrade link generation)

## Tech Stack

| Layer | Technology |
|------|------|
| Backend | FastAPI + SQLite (SQLModel) |
| Frontend | React + TypeScript + Vite + TailwindCSS |
| HTTP | curl_cffi (browser fingerprint spoofing) |
| Browser Automation | Playwright / Camoufox |

## Quick Start

### Requirements

- Python 3.11+
- Node.js 18+

### Installation

#### macOS / Linux

```bash
# Clone repository
git clone <repo_url>
cd account_manager

# Create virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install backend dependencies
pip install -r requirements.txt

# Build frontend
cd frontend
npm install
npm run build
cd ..
```

#### Windows

```bat
:: Clone repository
git clone <repo_url>
cd account_manager

:: Create virtual environment
python -m venv .venv
.venv\Scripts\activate

:: Install backend dependencies
pip install -r requirements.txt

:: Build frontend
cd frontend
npm install
npm run build
cd ..
```

### Install Browsers (optional, required for headless/headed modes)

```bash
# Playwright browsers
python3 -m playwright install chromium

# Camoufox (for local Turnstile Solver)
python3 -m camoufox fetch
```

### Start

#### macOS / Linux

```bash
.venv/bin/python3 -m uvicorn main:app --port 8000
```

#### Windows

```bat
.venv\Scripts\python -m uvicorn main:app --port 8000
```

Open browser and visit `http://localhost:5173`

### Development Mode (frontend hot reload)

```bash
cd frontend
npm run dev
# Visit http://localhost:5173
```

## Mailbox Service Configuration

A mailbox service is required during registration to receive verification codes.

### MoeMail (Recommended)

A temporary email service self-hosted based on the open-source project [cloudflare_temp_email](https://github.com/dreamhunter2333/cloudflare_temp_email). No configuration is required; the system automatically registers temporary accounts and generates email addresses.

On the registration page, select **MoeMail** and fill in your deployed instance address (public instance is used by default).

### Laoudo

Uses a fixed self-owned domain email with the highest stability, suitable for long-term use.

| Parameter | Description |
|------|------|
| Email Address | Full email address, e.g. `user@example.com` |
| Account ID | Email account ID (view in Laoudo panel) |
| JWT Token | Authentication token obtained from browser cookies or API after login |

### Cloudflare Worker Self-hosted Email

An email service self-hosted and deployed based on [cloudflare_temp_email](https://github.com/dreamhunter2333/cloudflare_temp_email), fully under your control.

**Deployment steps**: refer to the project documentation to deploy Cloudflare Worker + D1 database + Email Routing.

| Parameter | Description |
|------|------|
| API URL | Worker backend API address, e.g. `https://api.your-domain.com` |
| Admin Token | Admin password, configured in Worker environment variable `ADMIN_PASSWORDS` |
| Domain | Receiving email domain, e.g. `your-domain.com` (MX record must point to Cloudflare) |
| Fingerprint | Optional, fill in when Worker enables fingerprint verification |

### DuckMail

Public temporary email service, no configuration needed, ready to use. A proxy may be required in some regions.

## Captcha Service Configuration

| Service | Description |
|------|------|
| YesCaptcha | Requires Client Key, obtain from [yescaptcha.com](https://yescaptcha.com) |
| Local Solver | Uses Camoufox for local decoding, run `python3 -m camoufox fetch` first |

## 项目结构

```
account_manager/
├── main.py                 # FastAPI 入口
├── api/                    # HTTP 接口层
│   ├── accounts.py         # 账号 CRUD
│   ├── tasks.py            # 注册任务（SSE 日志）
│   ├── actions.py          # 平台操作（通用接口）
│   ├── config.py           # 全局配置持久化
│   └── proxies.py          # 代理管理
├── core/                   # 基础设施层
│   ├── base_platform.py    # 平台基类
│   ├── base_mailbox.py     # 邮箱服务基类 + 工厂方法
│   ├── base_captcha.py     # 验证码服务基类
│   ├── db.py               # 数据模型
│   ├── proxy_pool.py       # 代理池
│   ├── registry.py         # 平台插件注册表
│   └── scheduler.py        # 定时任务
├── platforms/              # 平台插件层
│   └── {platform}/
│       ├── plugin.py       # 平台适配层
│       ├── core.py         # 注册协议核心逻辑
│       └── switch.py       # 账号切换逻辑
├── services/               # 后台服务
│   ├── solver_manager.py   # Turnstile Solver 进程管理
│   └── turnstile_solver/   # 本地 Camoufox Solver
└── frontend/               # React 前端
```

## Plugin Development

To add a new platform, create a new directory under `platforms/` and implement `plugin.py`:

```python
from core.base_platform import BasePlatform, Account, AccountStatus, RegisterConfig
from core.registry import register

@register
class MyPlatform(BasePlatform):
    name = "myplatform"
    display_name = "My Platform"
    version = "1.0.0"
    supported_executors = ["protocol"]

    def register(self, email: str, password: str = None) -> Account:
        # Use self.mailbox.get_email() to get email
        # Use self.mailbox.wait_for_code() to receive verification code
        ...

    def check_valid(self, account: Account) -> bool:
        ...
```

## License

MIT License — for learning and research only, commercial use prohibited.
