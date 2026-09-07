import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/utils'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, CheckCircle, Clock, XCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

const PLATFORM_COLORS: Record<string, string> = {
  trae: 'text-blue-400',
  tavily: 'text-purple-400',
  cursor: 'text-emerald-400',
}

const STATUS_VARIANT: Record<string, any> = {
  registered: 'default',
  trial: 'success',
  subscribed: 'success',
  expired: 'warning',
  invalid: 'danger',
}

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const data = await apiFetch('/accounts/stats')
      setStats(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const statCards = [
    { label: 'Total Accounts', value: stats?.total ?? '-', icon: Users, color: 'text-[var(--text-accent)]' },
    { label: 'Trial', value: stats?.by_status?.trial ?? 0, icon: Clock, color: 'text-amber-400' },
    { label: 'Subscribed', value: stats?.by_status?.subscribed ?? 0, icon: CheckCircle, color: 'text-emerald-400' },
    { label: 'Expired/Invalid', value: (stats?.by_status?.expired ?? 0) + (stats?.by_status?.invalid ?? 0), icon: XCircle, color: 'text-red-400' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Dashboard</h1>
          <p className="text-[var(--text-muted)] text-sm mt-1">Accounts Overview</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[var(--text-muted)]">{label}</p>
                <p className="text-3xl font-bold text-[var(--text-primary)] mt-1">{value}</p>
              </div>
              <Icon className={`h-8 w-8 ${color} opacity-80`} />
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Platform distribution */}
        <Card>
          <CardHeader><CardTitle>Platform Distribution</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {stats ? Object.entries(stats.by_platform || {}).map(([platform, count]: any) => (
              <div key={platform} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium ${PLATFORM_COLORS[platform] || 'text-[var(--text-secondary)]'}`}>
                    {platform}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-32 h-2 bg-[var(--bg-hover)] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full"
                      style={{ width: `${Math.round((count / stats.total) * 100)}%` }}
                    />
                  </div>
                  <span className="text-sm text-[var(--text-muted)] w-8 text-right">{count}</span>
                </div>
              </div>
            )) : <p className="text-[var(--text-muted)] text-sm">Loading...</p>}
          </CardContent>
        </Card>

        {/* Status distribution */}
        <Card>
          <CardHeader><CardTitle>Status Distribution</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {stats ? Object.entries(stats.by_status || {}).map(([status, count]: any) => (
              <div key={status} className="flex items-center justify-between">
                <Badge variant={STATUS_VARIANT[status] || 'secondary'}>{status}</Badge>
                <span className="text-sm text-[var(--text-muted)]">{count}</span>
              </div>
            )) : <p className="text-[var(--text-muted)] text-sm">Loading...</p>}
            {stats && Object.keys(stats.by_status || {}).length === 0 && (
              <p className="text-[var(--text-muted)] text-sm">No data</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
