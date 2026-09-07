import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Save, Eye, EyeOff, Mail, Shield, Cpu, RefreshCw, CheckCircle, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

const SELECT_FIELDS: Record<string, { label: string; value: string }[]> = {
  mail_provider: [
    { label: 'Laoudo (fixed mailbox)', value: 'laoudo' },
    { label: 'TempMail.lol (auto-generate)', value: 'tempmail_lol' },
    { label: 'DuckMail (auto-generate)', value: 'duckmail' },
    { label: 'MoeMail (sall.cc)', value: 'moemail' },
    { label: 'Freemail (self-hosted CF Worker)', value: 'freemail' },
    { label: 'CF Worker (custom domain)', value: 'cfworker' },
  ],
  default_executor: [
    { label: 'API protocol (no browser)', value: 'protocol' },
    { label: 'Headless browser', value: 'headless' },
    { label: 'Headed browser (debug)', value: 'headed' },
  ],
  default_captcha_solver: [
    { label: 'YesCaptcha', value: 'yescaptcha' },
    { label: '2Captcha', value: '2captcha' },
    { label: 'Local Solver (Camoufox)', value: 'local_solver' },
    { label: 'Manual', value: 'manual' },
  ],
}

const TABS = [
  {
    id: 'register', label: 'Registration Settings', icon: Cpu,
    sections: [{
      section: 'Default Registration Method',
      desc: 'Controls how registration tasks are executed',
      items: [
        { key: 'default_executor', label: 'Executor Type' },
      ],
    }],
  },
  {
    id: 'mailbox', label: 'Mailbox Service', icon: Mail,
    sections: [{
      section: 'Default Mailbox Service',
      desc: 'Select the email type used during registration',
      items: [
        { key: 'mail_provider', label: 'Mailbox Service' },
      ],
    }, {
      section: 'Laoudo',
      desc: 'Fixed mailbox, manually configured',
      items: [
        { key: 'laoudo_email', label: 'Email Address', placeholder: 'xxx@laoudo.com' },
        { key: 'laoudo_account_id', label: 'Account ID', placeholder: '563' },
        { key: 'laoudo_auth', label: 'JWT Token', placeholder: 'eyJ...', secret: true },
      ],
    }, {
      section: 'Freemail',
      desc: 'Self-hosted email based on Cloudflare Worker, supports admin token or account password authentication',
      items: [
        { key: 'freemail_api_url', label: 'API URL', placeholder: 'https://mail.example.com' },
        { key: 'freemail_admin_token', label: 'Admin Token', secret: true },
        { key: 'freemail_username', label: 'Username (optional)', placeholder: '' },
        { key: 'freemail_password', label: 'Password (optional)', secret: true },
      ],
    }, {
      section: 'MoeMail',
      desc: 'Auto-register accounts and generate temporary emails, no configuration needed by default',
      items: [
        { key: 'moemail_api_url', label: 'API URL', placeholder: 'https://sall.cc' },
      ],
    }, {
      section: 'TempMail.lol',
      desc: 'Auto-generate email, no configuration needed, requires proxy access (CN IPs blocked)',
      items: [],
    }, {
      section: 'DuckMail',
      desc: 'Auto-generate email, randomly create accounts (no configuration needed by default)',
      items: [
        { key: 'duckmail_api_url', label: 'Web URL', placeholder: 'https://www.duckmail.sbs' },
        { key: 'duckmail_provider_url', label: 'Provider URL', placeholder: 'https://api.duckmail.sbs' },
        { key: 'duckmail_bearer', label: 'Bearer Token', placeholder: 'kevin273945', secret: true },
      ],
    }, {
      section: 'CF Worker Self-hosted Email',
      desc: 'Self-hosted temporary email service based on Cloudflare Worker',
      items: [
        { key: 'cfworker_api_url', label: 'API URL', placeholder: 'https://apimail.example.com' },
        { key: 'cfworker_admin_token', label: 'Admin Token', secret: true },
        { key: 'cfworker_domain', label: 'Email Domain', placeholder: 'example.com' },
        { key: 'cfworker_fingerprint', label: 'Fingerprint', placeholder: '6703363b...' },
      ],
    }],
  },
  {
    id: 'captcha', label: 'Captcha', icon: Shield,
    sections: [{
      section: 'Captcha Service',
      desc: 'Used to bypass human verification on registration pages',
      items: [
        { key: 'default_captcha_solver', label: 'Default Service' },
        { key: 'yescaptcha_key', label: 'YesCaptcha Key', secret: true },
        { key: 'twocaptcha_key', label: '2Captcha Key', secret: true },
      ],
    }],
  },
  {
    id: 'chatgpt', label: 'ChatGPT', icon: Shield,
    sections: [{
      section: 'CPA Panel',
      desc: 'Automatically upload to CPA management platform after registration',
      items: [
        { key: 'cpa_api_url', label: 'API URL', placeholder: 'https://your-cpa.example.com' },
        { key: 'cpa_api_key', label: 'API Key', secret: true },
      ],
    }, {
      section: 'Team Manager',
      desc: 'Upload to self-hosted Team Manager system',
      items: [
        { key: 'team_manager_url', label: 'API URL', placeholder: 'https://your-tm.example.com' },
        { key: 'team_manager_key', label: 'API Key', secret: true },
      ],
    }],
  },
]

function Field({ field, form, setForm, showSecret, setShowSecret }: any) {
  const { key, label, placeholder, secret } = field
  const options = SELECT_FIELDS[key]
  return (
    <div className="grid grid-cols-3 gap-4 items-center py-3 border-b border-white/5 last:border-0">
      <label className="text-sm text-[var(--text-secondary)] font-medium">{label}</label>
      <div className="col-span-2 relative">
        {options ? (
          <select
            value={form[key] || options[0].value}
            onChange={e => setForm((f: any) => ({ ...f, [key]: e.target.value }))}
            className="w-full bg-[var(--bg-base)] border border-[var(--border)] text-[var(--text-primary)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 appearance-none"
          >
            {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        ) : (
          <>
            <input
              type={secret && !showSecret[key] ? 'password' : 'text'}
              value={form[key] || ''}
              onChange={e => setForm((f: any) => ({ ...f, [key]: e.target.value }))}
              placeholder={placeholder}
              className="w-full bg-[var(--bg-base)] border border-[var(--border)] text-[var(--text-primary)] rounded-lg px-3 py-2 text-sm pr-10 focus:outline-none focus:border-indigo-500 placeholder:text-[var(--text-muted)]"
            />
            {secret && (
              <button
                onClick={() => setShowSecret((s: any) => ({ ...s, [key]: !s[key] }))}
                className="absolute right-3 top-2.5 text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
              >
                {showSecret[key] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState('register')
  const [form, setForm] = useState<Record<string, string>>({})
  const [showSecret, setShowSecret] = useState<Record<string, boolean>>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [solverRunning, setSolverRunning] = useState<boolean | null>(null)

  useEffect(() => { apiFetch('/config').then(setForm) }, [])

  const checkSolver = async () => {
    try { const d = await apiFetch('/solver/status'); setSolverRunning(d.running) }
    catch { setSolverRunning(false) }
  }
  const restartSolver = async () => {
    await apiFetch('/solver/restart', { method: 'POST' })
    setSolverRunning(null)
    setTimeout(checkSolver, 4000)
  }
  useEffect(() => { checkSolver() }, [])

  const save = async () => {
    setSaving(true)
    try {
      await apiFetch('/config', { method: 'PUT', body: JSON.stringify({ data: form }) })
      setSaved(true); setTimeout(() => setSaved(false), 2000)
    } finally { setSaving(false) }
  }

  const tab = TABS.find(t => t.id === activeTab)!

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Global Configuration</h1>
        <p className="text-[var(--text-muted)] text-sm mt-1">Settings are persisted and automatically used by registration tasks</p>
      </div>

      <div className="flex gap-6">
        {/* Left nav */}
        <div className="w-44 shrink-0 space-y-1">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={cn(
                'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
                activeTab === id
                  ? 'bg-indigo-600/20 text-[var(--text-accent)] font-medium'
                  : 'text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'
              )}>
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}

          {/* Solver status */}
          <div className="mt-4 pt-4 border-t border-[var(--border)]">
            <p className="text-xs text-[var(--text-muted)] px-3 mb-2">Turnstile Solver</p>
            <div className="px-3 flex items-center gap-2">
              {solverRunning === null
                ? <RefreshCw className="h-3 w-3 animate-spin text-[var(--text-muted)]" />
                : solverRunning
                  ? <CheckCircle className="h-3 w-3 text-emerald-400" />
                  : <XCircle className="h-3 w-3 text-red-400" />}
              <span className={cn('text-xs', solverRunning ? 'text-emerald-400' : 'text-[var(--text-muted)]')}>
                {solverRunning === null ? 'Checking' : solverRunning ? 'Running' : 'Stopped'}
              </span>
            </div>
            <button onClick={restartSolver}
              className="mt-2 w-full text-xs px-3 py-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-lg text-left">
              Restart Solver
            </button>
          </div>
        </div>

        {/* Right content */}
        <div className="flex-1 space-y-4">
          {tab.sections.map(({ section, desc, items }) => (
            <div key={section} className="bg-white/[0.03] border border-[var(--border)] rounded-xl p-5">
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">{section}</h3>
                {desc && <p className="text-xs text-[var(--text-muted)] mt-0.5">{desc}</p>}
              </div>
              {items.map((field: any) => (
                <Field key={field.key} field={field} form={form} setForm={setForm}
                  showSecret={showSecret} setShowSecret={setShowSecret} />
              ))}
            </div>
          ))}

          <Button onClick={save} disabled={saving} className="w-full">
            <Save className="h-4 w-4 mr-2" />
            {saved ? 'Saved ✓' : saving ? 'Saving...' : 'Save Configuration'}
          </Button>
        </div>
      </div>
    </div>
  )
}
