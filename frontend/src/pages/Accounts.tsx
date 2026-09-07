import { useEffect, useState, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { apiFetch, API_BASE } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { RefreshCw, Copy, ExternalLink, PlusCircle, Download, Upload, Plus, X } from 'lucide-react'

const STATUS_VARIANT: Record<string, any> = {
  registered: 'default', trial: 'success', subscribed: 'success',
  expired: 'warning', invalid: 'danger',
}
const PLATFORMS = [
  { key: 'trae', label: 'Trae.ai' },
  { key: 'tavily', label: 'Tavily' },
  { key: 'cursor', label: 'Cursor' },
  { key: 'kiro', label: 'Kiro' },
  { key: 'chatgpt', label: 'ChatGPT' },
  { key: 'openblocklabs', label: 'OpenBlockLabs' },
]

// ── SSE Log Panel ──────────────────────────────────────────
function LogPanel({ taskId, onDone }: { taskId: string; onDone: () => void }) {
  const [lines, setLines] = useState<string[]>([])
  const [done, setDone] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!taskId) return
    const es = new EventSource(`${API_BASE}/tasks/${taskId}/logs/stream`)
    es.onmessage = (e) => {
      const d = JSON.parse(e.data)
      if (d.line) setLines(prev => [...prev, d.line])
      if (d.done) { setDone(true); es.close(); onDone() }
    }
    es.onerror = () => es.close()
    return () => es.close()
  }, [taskId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [lines])

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto bg-black/40 rounded-lg p-3 font-mono text-xs space-y-0.5 min-h-[200px] max-h-[400px]">
        {lines.length === 0 && <div className="text-[var(--text-muted)]">Waiting for logs...</div>}
        {lines.map((l, i) => (
          <div key={i} className={`leading-5 ${l.includes('✓') || l.includes('成功') ? 'text-emerald-400' :
              l.includes('✗') || l.includes('失败') || l.includes('错误') ? 'text-red-400' :
                'text-[var(--text-secondary)]'
            }`}>{l}</div>
        ))}
        <div ref={bottomRef} />
      </div>
      {done && <div className="text-xs text-emerald-400 mt-2">Registration complete</div>}
    </div>
  )
}

// ── Registration Modal ────────────────────────────────────────────────
function RegisterModal({ platform, onClose, onDone }: { platform: string; onClose: () => void; onDone: () => void }) {
  const [regCount, setRegCount] = useState(1)
  const [concurrency, setConcurrency] = useState(1)
  const [taskId, setTaskId] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [starting, setStarting] = useState(false)

  const start = async () => {
    setStarting(true)
    try {
      const cfg = await apiFetch('/config')
      const res = await apiFetch('/tasks/register', {
        method: 'POST',
        body: JSON.stringify({
          platform, count: regCount, concurrency,
          executor_type: cfg.default_executor || 'protocol',
          captcha_solver: cfg.default_captcha_solver || 'yescaptcha',
          proxy: null,
          extra: {
            mail_provider: cfg.mail_provider || 'laoudo',
            laoudo_auth: cfg.laoudo_auth, laoudo_email: cfg.laoudo_email,
            laoudo_account_id: cfg.laoudo_account_id, yescaptcha_key: cfg.yescaptcha_key,
            duckmail_address: cfg.duckmail_address, duckmail_password: cfg.duckmail_password,
            duckmail_api_url: cfg.duckmail_api_url, duckmail_provider_url: cfg.duckmail_provider_url,
            duckmail_bearer: cfg.duckmail_bearer,
            cfworker_api_url: cfg.cfworker_api_url, cfworker_admin_token: cfg.cfworker_admin_token,
            cfworker_domain: cfg.cfworker_domain, cfworker_fingerprint: cfg.cfworker_fingerprint,
          },
        }),
      })
      setTaskId(res.task_id)
    } finally { setStarting(false) }
  }

  const handleDone = () => { setDone(true); onDone() }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={!taskId ? onClose : undefined}>
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl w-full max-w-lg shadow-2xl flex flex-col"
        onClick={e => e.stopPropagation()} style={{ maxHeight: '80vh' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">Register {PLATFORMS.find(p => p.key === platform)?.label}</h2>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"><X className="h-4 w-4" /></button>
        </div>
        <div className="px-6 py-4 flex-1 overflow-y-auto flex flex-col gap-4">
          {!taskId ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[var(--text-muted)] block mb-1">Registration Count</label>
                  <input type="number" min={1} max={99} value={regCount}
                    onChange={e => setRegCount(Number(e.target.value))}
                    className="w-full bg-[var(--bg-hover)] border border-[var(--border)] text-[var(--text-primary)] rounded-md px-3 py-1.5 text-sm text-center" />
                </div>
                <div>
                  <label className="text-xs text-[var(--text-muted)] block mb-1">Concurrency</label>
                  <input type="number" min={1} max={5} value={concurrency}
                    onChange={e => setConcurrency(Number(e.target.value))}
                    className="w-full bg-[var(--bg-hover)] border border-[var(--border)] text-[var(--text-primary)] rounded-md px-3 py-1.5 text-sm text-center" />
                </div>
              </div>
              <Button onClick={start} disabled={starting} className="w-full">
                {starting ? 'Starting...' : 'Start Registration'}
              </Button>
            </div>
          ) : (
            <LogPanel taskId={taskId} onDone={handleDone} />
          )}
        </div>
        <div className="px-6 py-3 border-t border-[var(--border)] flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>
            {done ? 'Close' : 'Cancel'}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── Add Account Modal ─────────────────────────────────────────
function AddModal({ platform, onClose, onDone }: { platform: string; onClose: () => void; onDone: () => void }) {
  const [form, setForm] = useState({ email: '', password: '', status: 'registered', token: '', cashier_url: '' })
  const [saving, setSaving] = useState(false)
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const save = async () => {
    setSaving(true)
    try {
      await apiFetch('/accounts', {
        method: 'POST',
        body: JSON.stringify({ ...form, platform }),
      })
      onDone()
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl w-full max-w-md shadow-2xl"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">Manually Add Account</h2>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"><X className="h-4 w-4" /></button>
        </div>
        <div className="px-6 py-4 space-y-3">
          {[['email', 'Email', 'text'], ['password', 'Password', 'text'], ['token', 'Token', 'text'], ['cashier_url', 'Trial Link', 'text']].map(([k, l, t]) => (
            <div key={k}>
              <label className="text-xs text-[var(--text-muted)] block mb-1">{l}</label>
              <input type={t} value={(form as any)[k]} onChange={e => set(k, e.target.value)}
                className="w-full bg-[var(--bg-hover)] border border-[var(--border)] text-[var(--text-primary)] rounded-md px-3 py-2 text-sm" />
            </div>
          ))}
          <div>
            <label className="text-xs text-[var(--text-muted)] block mb-1">Status</label>
            <select value={form.status} onChange={e => set('status', e.target.value)}
              className="w-full bg-[var(--bg-hover)] border border-[var(--border)] text-[var(--text-primary)] rounded-md px-3 py-2 text-sm">
              <option value="registered">Registered</option>
              <option value="trial">Trial</option>
              <option value="subscribed">Subscribed</option>
            </select>
          </div>
        </div>
        <div className="flex gap-3 px-6 py-4 border-t border-[var(--border)]">
          <Button onClick={save} disabled={saving} className="flex-1">{saving ? 'Saving...' : 'Save'}</Button>
          <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
        </div>
      </div>
    </div>
  )
}
// ── Row Action Menu ─────────────────────────────────────────────
function ActionMenu({ acc, onDetail, onDelete }: { acc: any; onDetail: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false)
  const [actions, setActions] = useState<any[]>([])
  const [running, setRunning] = useState<string | null>(null)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    apiFetch(`/actions/${acc.platform}`).then(d => setActions(d.actions || [])).catch(() => { })
  }, [acc.platform])
  useEffect(() => {
    if (toast) { const t = setTimeout(() => setToast(null), 4000); return () => clearTimeout(t) }
  }, [toast])
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div className="relative flex items-center gap-2">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2.5 rounded-lg shadow-lg text-sm font-medium animate-in fade-in slide-in-from-top-2 ${toast.type === 'success' ? 'bg-emerald-500/90 text-white' : 'bg-red-500/90 text-white'
          }`} onClick={() => setToast(null)}>
          {toast.type === 'success' ? '✓ ' : '✗ '}{toast.text}
        </div>
      )}
      <button onClick={onDetail} className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]">Details</button>
      <button onClick={() => { if (confirm(`Confirm delete ${acc.email}?`)) apiFetch(`/accounts/${acc.id}`, { method: 'DELETE' }).then(onDelete) }}
        className="text-xs text-red-400 hover:text-red-300">Delete</button>
      {actions.length > 0 && (
        <div className="relative" ref={menuRef}>
          <button onClick={() => setOpen(o => !o)}
            className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]">More ▾</button>
          {open && (
            <div className="absolute right-0 top-5 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg shadow-lg z-20 min-w-[120px] py-1">
              {actions.map(a => (
                <button key={a.id}
                  onClick={() => {
                    setOpen(false)
                    setRunning(a.id)
                    apiFetch(`/actions/${acc.platform}/${acc.id}/${a.id}`, { method: 'POST', body: JSON.stringify({ params: {} }) })
                      .then(r => {
                        setRunning(null)
                        if (!r.ok) { setToast({ type: 'error', text: r.error || 'Action failed' }); return }
                        const data = r.data || {}
                        if (data.url || data.checkout_url || data.cashier_url) { window.open(data.url || data.checkout_url || data.cashier_url, '_blank') }
                        else { setToast({ type: 'success', text: data.message || 'Action successful' }) }
                      }).catch(() => { setRunning(null); setToast({ type: 'error', text: 'Request failed' }) })
                  }}
                  disabled={!!running}
                  className="w-full text-left px-3 py-1.5 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] disabled:opacity-50">
                  {running === a.id ? 'Running...' : a.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Account Detail Modal ───────────────────────────────────────────
function DetailModal({ acc, onClose, onSave }: { acc: any; onClose: () => void; onSave: () => void }) {
  const [form, setForm] = useState({ status: acc.status, token: acc.token || '', cashier_url: acc.cashier_url || '' })
  const [saving, setSaving] = useState(false)
  const extra: Record<string, string> = (() => { try { return typeof acc.extra_json === 'string' ? JSON.parse(acc.extra_json) : (acc.extra_json || {}) } catch { return {} } })()
  const copyText = (text: string) => navigator.clipboard.writeText(text)
  const extraTokenKeys = ['accessToken', 'refreshToken', 'sessionToken', 'clientId', 'clientSecret'].filter(k => extra[k])

  const save = async () => {
    setSaving(true)
    try {
      await apiFetch(`/accounts/${acc.id}`, { method: 'PATCH', body: JSON.stringify(form) })
      onSave()
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl w-full max-w-lg shadow-2xl overflow-y-auto" style={{ maxHeight: '90vh' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <div>
            <h2 className="text-base font-semibold text-[var(--text-primary)]">Account Details</h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">{acc.email}</p>
          </div>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"><X className="h-4 w-4" /></button>
        </div>
        <div className="px-6 py-4 space-y-3">
          <div>
            <label className="text-xs text-[var(--text-muted)] block mb-1">Status</label>
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
              className="w-full bg-[var(--bg-hover)] border border-[var(--border)] text-[var(--text-primary)] rounded-md px-3 py-2 text-sm">
              {['registered', 'trial', 'subscribed', 'expired', 'invalid'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          {extraTokenKeys.length > 0 && (
            <div className="space-y-2">
              <label className="text-xs text-[var(--text-muted)] block">Tokens</label>
              {extraTokenKeys.map(k => (
                <div key={k}>
                  <div className="text-xs text-[var(--text-muted)] mb-0.5">{k}</div>
                  <div className="flex items-start gap-1">
                    <div className="flex-1 bg-[var(--bg-hover)] border border-[var(--border)] rounded-md px-2 py-1.5 text-xs font-mono text-[var(--text-secondary)] break-all select-all">{extra[k]}</div>
                    <button onClick={() => copyText(extra[k])} className="mt-1 shrink-0 text-[var(--text-muted)] hover:text-[var(--text-secondary)]"><Copy className="h-3 w-3" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div>
            <label className="text-xs text-[var(--text-muted)] block mb-1">Token</label>
            <textarea value={form.token} onChange={e => setForm(f => ({ ...f, token: e.target.value }))}
              rows={2} className="w-full bg-[var(--bg-hover)] border border-[var(--border)] text-[var(--text-primary)] rounded-md px-3 py-2 text-xs font-mono resize-none" />
          </div>
        </div>
        <div className="flex gap-3 px-6 py-4 border-t border-[var(--border)]">
          <Button onClick={save} disabled={saving} className="flex-1">{saving ? 'Saving...' : 'Save'}</Button>
          <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
        </div>
      </div>
    </div>
  )
}

// ── Import Modal ────────────────────────────────────────────────
function ImportModal({ platform, onClose, onDone }: { platform: string; onClose: () => void; onDone: () => void }) {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const submit = async () => {
    setLoading(true)
    try {
      const lines = text.trim().split('\n').filter(Boolean)
      const res = await apiFetch('/accounts/import', { method: 'POST', body: JSON.stringify({ platform, lines }) })
      setResult(`Imported ${res.created} accounts`); onDone()
    } catch (e: any) { setResult(`Failed: ${e.message}`) } finally { setLoading(false) }
  }
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl w-[480px] p-6" onClick={e => e.stopPropagation()}>
        <h2 className="text-base font-semibold text-[var(--text-primary)] mb-2">Batch Import</h2>
        <p className="text-xs text-[var(--text-muted)] mb-3">Per line format: <code className="bg-[var(--bg-hover)] px-1 rounded">email password [cashier_url]</code></p>
        <textarea value={text} onChange={e => setText(e.target.value)} rows={8}
          className="w-full bg-[var(--bg-hover)] border border-[var(--border)] text-[var(--text-primary)] rounded-md px-3 py-2 text-xs font-mono resize-none mb-3" />
        {result && <p className="text-sm text-emerald-400 mb-3">{result}</p>}
        <div className="flex gap-2">
          <Button onClick={submit} disabled={loading} className="flex-1">{loading ? 'Importing...' : 'Import'}</Button>
          <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
        </div>
      </div>
    </div>
  )
}


// ── Main ────────────────────────────────────────────────────
export default function Accounts() {
  const { platform } = useParams<{ platform: string }>()
  const [tab, setTab] = useState(platform || 'trae')
  useEffect(() => { if (platform) { setTab(platform) } }, [platform])

  const [accounts, setAccounts] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [detail, setDetail] = useState<any | null>(null)
  const [showImport, setShowImport] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [showRegister, setShowRegister] = useState(false)

  const load = async (p = tab, s = search, fs = filterStatus) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ platform: p, page: '1', page_size: '100' })
      if (s) params.set('email', s)
      if (fs) params.set('status', fs)
      const data = await apiFetch(`/accounts?${params}`)
      setAccounts(data.items); setTotal(data.total)
    } finally { setLoading(false) }
  }

  useEffect(() => { load(tab, search, filterStatus) }, [tab, search, filterStatus])

  const exportCsv = () => {
    const header = 'email,password,status,region,cashier_url,created_at'
    const rows = accounts.map(a => [a.email, a.password, a.status, a.region, a.cashier_url, a.created_at].join(','))
    const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url
    a.download = `${tab}_accounts.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  const copy = (text: string) => {
    if (navigator.clipboard) { navigator.clipboard.writeText(text) }
    else { const el = document.createElement('textarea'); el.value = text; document.body.appendChild(el); el.select(); document.execCommand('copy'); document.body.removeChild(el) }
  }

  return (
    <div className="flex flex-col gap-4">
      {detail && <DetailModal acc={detail} onClose={() => setDetail(null)} onSave={() => { setDetail(null); load() }} />}
      {showImport && <ImportModal platform={tab} onClose={() => setShowImport(false)} onDone={() => { setShowImport(false); load() }} />}
      {showAdd && <AddModal platform={tab} onClose={() => setShowAdd(false)} onDone={() => { setShowAdd(false); load() }} />}
      {showRegister && <RegisterModal platform={tab} onClose={() => setShowRegister(false)} onDone={() => load()} />}

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        {/* Left: Search and filter */}
        <div className="flex items-center gap-2">
          <input type="text" placeholder="Search email..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="bg-[var(--bg-hover)] border border-[var(--border)] text-[var(--text-primary)] rounded-md px-3 py-1.5 text-sm w-44" />
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="bg-[var(--bg-hover)] border border-[var(--border)] text-[var(--text-primary)] rounded-md px-2 py-1.5 text-sm">
            <option value="">All Statuses</option>
            <option value="registered">Registered</option>
            <option value="trial">Trial</option>
            <option value="subscribed">Subscribed</option>
            <option value="expired">Expired</option>
            <option value="invalid">Invalid</option>
          </select>
          <span className="text-xs text-[var(--text-muted)]">{total} accounts</span>
        </div>
        {/* Right: Action buttons */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowImport(true)}><Upload className="h-4 w-4 mr-1" />Import</Button>
          <Button variant="outline" size="sm" onClick={exportCsv} disabled={accounts.length === 0}><Download className="h-4 w-4 mr-1" />Export</Button>
          <Button variant="outline" size="sm" onClick={() => setShowAdd(true)}><Plus className="h-4 w-4 mr-1" />Add</Button>
          <Button variant="outline" size="sm" onClick={() => setShowRegister(true)}><PlusCircle className="h-4 w-4 mr-1" />Register</Button>
          <Button variant="outline" size="sm" onClick={() => load()} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Account table */}
      <Card>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-[var(--text-muted)] text-xs">
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Password</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Region</th>
              <th className="px-4 py-3 text-left">Trial Link</th>
              <th className="px-4 py-3 text-left">Registered At</th>
              <th className="px-4 py-3 text-left"></th>
            </tr>
          </thead>
          <tbody>
            {accounts.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-[var(--text-muted)]">No accounts</td></tr>
            )}
            {accounts.map(acc => (
              <tr key={acc.id} className="border-b border-[var(--border)]/50 hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
                onClick={() => setDetail(acc)}>
                <td className="px-4 py-3 font-mono text-xs">
                  <div className="flex items-center gap-1">
                    {acc.email}
                    <button onClick={e => { e.stopPropagation(); copy(acc.email) }} className="text-[var(--text-muted)] hover:text-[var(--text-secondary)]"><Copy className="h-3 w-3" /></button>
                  </div>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-[var(--text-muted)]">
                  <div className="flex items-center gap-1">
                    <span className="blur-sm hover:blur-none transition-all cursor-default">{acc.password}</span>
                    <button onClick={e => { e.stopPropagation(); copy(acc.password) }} className="text-[var(--text-muted)] hover:text-[var(--text-secondary)]"><Copy className="h-3 w-3" /></button>
                  </div>
                </td>
                <td className="px-4 py-3"><Badge variant={STATUS_VARIANT[acc.status] || 'secondary'}>{acc.status}</Badge></td>
                <td className="px-4 py-3 text-[var(--text-muted)] text-xs">{acc.region || '-'}</td>
                <td className="px-4 py-3">
                  {acc.cashier_url ? (
                    <div className="flex items-center gap-1">
                      <button onClick={e => { e.stopPropagation(); copy(acc.cashier_url) }} className="text-[var(--text-muted)] hover:text-[var(--text-secondary)]"><Copy className="h-3 w-3" /></button>
                      <a href={acc.cashier_url} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} className="text-[var(--text-muted)] hover:text-[var(--text-accent)]"><ExternalLink className="h-3 w-3" /></a>
                    </div>
                  ) : <span className="text-[var(--text-muted)] text-xs">-</span>}
                </td>
                <td className="px-4 py-3 text-[var(--text-muted)] text-xs">{acc.created_at ? new Date(acc.created_at).toLocaleDateString() : '-'}</td>
                <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                  <ActionMenu acc={acc} onDetail={() => setDetail(acc)} onDelete={() => load()} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}