'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast, { Toaster } from 'react-hot-toast'
import { Activity, Search, Download, Trash2, BarChart3 } from 'lucide-react'
import { activityAPI } from '@/lib/api'

export default function ActivitiesPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'logs' | 'stats'>('logs')
  const [activities, setActivities] = useState<any[]>([])
  const [pagination, setPagination] = useState<any>({})
  const [filters, setFilters] = useState({ page: 1, limit: 30, userId: '', action: '', module: '', startDate: '', endDate: '' })

  // Stats
  const [userSummary, setUserSummary] = useState<any>(null)
  const [moduleStats, setModuleStats] = useState<any>(null)
  const [statsUserId, setStatsUserId] = useState('')
  const [statsModule, setStatsModule] = useState('')

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (!userData) { router.push('/auth/login'); return }
    setUser(JSON.parse(userData))
    fetchActivities()
  }, [router])

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'PRINCIPAL'

  const fetchActivities = async (params?: any) => {
    setLoading(true)
    try {
      const p = params || filters
      const cleanParams: any = { page: p.page, limit: p.limit }
      if (p.userId) cleanParams.userId = p.userId
      if (p.action) cleanParams.action = p.action
      if (p.module) cleanParams.module = p.module
      if (p.startDate) cleanParams.startDate = p.startDate
      if (p.endDate) cleanParams.endDate = p.endDate
      const res = await activityAPI.getAll(cleanParams)
      setActivities(res.data?.data?.activities || [])
      setPagination(res.data?.data?.pagination || {})
    } catch { toast.error('Failed to load activities') }
    finally { setLoading(false) }
  }

  const handleFilter = () => {
    setFilters(f => ({ ...f, page: 1 }))
    fetchActivities({ ...filters, page: 1 })
  }

  const handlePageChange = (page: number) => {
    setFilters(f => ({ ...f, page }))
    fetchActivities({ ...filters, page })
  }

  const handleExport = async () => {
    try {
      const res = await activityAPI.exportCsv()
      const blob = new Blob([res.data], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'activities_export.csv'
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Exported successfully')
    } catch { toast.error('Export failed') }
  }

  const handleCleanup = async () => {
    if (!confirm('Delete activities older than 90 days?')) return
    try {
      await activityAPI.cleanup()
      toast.success('Old activities cleaned up')
      fetchActivities()
    } catch (err: any) { toast.error(err.response?.data?.message || 'Cleanup failed') }
  }

  const fetchUserSummary = async () => {
    if (!statsUserId) { toast.error('Enter user ID'); return }
    try {
      const res = await activityAPI.getUserSummary(statsUserId)
      setUserSummary(res.data?.data || res.data)
    } catch { toast.error('Failed to load user summary') }
  }

  const fetchModuleStats = async () => {
    if (!statsModule) { toast.error('Enter module name'); return }
    try {
      const res = await activityAPI.getModuleStats(statsModule)
      setModuleStats(res.data?.data || res.data)
    } catch { toast.error('Failed to load module stats') }
  }

  const handleTabChange = (t: typeof tab) => {
    setTab(t)
    if (t === 'logs') fetchActivities()
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <Toaster position="top-right" />
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Activity className="w-7 h-7 text-primary-600" />
            <h1 className="text-2xl font-bold text-gray-900">Activity Logs</h1>
          </div>
          <Link href="/dashboard" className="text-sm text-primary-600 hover:text-primary-700">Back to Dashboard</Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b pb-2">
          {(['logs', 'stats'] as const).map(t => (
            <button key={t} onClick={() => handleTabChange(t)}
              className={`px-4 py-2 rounded-t-lg text-sm font-medium capitalize ${tab === t ? 'bg-white border border-b-0 text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}>
              {t === 'logs' ? 'Activity Logs' : 'Statistics'}
            </button>
          ))}
        </div>

        {/* Logs Tab */}
        {tab === 'logs' && (
          <div className="space-y-4">
            {/* Filters */}
            <div className="card">
              <div className="flex flex-wrap gap-3 items-end">
                <div>
                  <label className="label">User ID</label>
                  <input className="input w-48" placeholder="Filter by user" value={filters.userId}
                    onChange={e => setFilters({ ...filters, userId: e.target.value })} />
                </div>
                <div>
                  <label className="label">Action</label>
                  <input className="input w-36" placeholder="e.g. CREATE" value={filters.action}
                    onChange={e => setFilters({ ...filters, action: e.target.value })} />
                </div>
                <div>
                  <label className="label">Module</label>
                  <input className="input w-36" placeholder="e.g. STUDENT" value={filters.module}
                    onChange={e => setFilters({ ...filters, module: e.target.value })} />
                </div>
                <div>
                  <label className="label">From</label>
                  <input className="input w-40" type="date" value={filters.startDate}
                    onChange={e => setFilters({ ...filters, startDate: e.target.value })} />
                </div>
                <div>
                  <label className="label">To</label>
                  <input className="input w-40" type="date" value={filters.endDate}
                    onChange={e => setFilters({ ...filters, endDate: e.target.value })} />
                </div>
                <button className="btn-primary text-sm flex items-center gap-1" onClick={handleFilter}>
                  <Search className="w-4 h-4" /> Filter
                </button>
                {isAdmin && (
                  <>
                    <button className="btn-secondary text-sm flex items-center gap-1" onClick={handleExport}>
                      <Download className="w-4 h-4" /> Export CSV
                    </button>
                    <button className="btn-secondary text-sm flex items-center gap-1 text-red-600" onClick={handleCleanup}>
                      <Trash2 className="w-4 h-4" /> Cleanup
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Activity list */}
            <div className="card">
              {loading ? <p className="text-gray-600">Loading...</p> : activities.length === 0 ? (
                <p className="text-gray-600">No activities found.</p>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="border-b text-left text-gray-600">
                          <th className="py-2 pr-4">Time</th>
                          <th className="py-2 pr-4">User</th>
                          <th className="py-2 pr-4">Action</th>
                          <th className="py-2 pr-4">Module</th>
                          <th className="py-2 pr-4">Resource</th>
                          <th className="py-2 pr-4">IP</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activities.map(a => (
                          <tr key={a.id} className="border-b last:border-0 hover:bg-gray-50">
                            <td className="py-2 pr-4 text-xs">{a.createdAt ? new Date(a.createdAt).toLocaleString() : '-'}</td>
                            <td className="py-2 pr-4">{a.user?.email || a.userId || '-'}</td>
                            <td className="py-2 pr-4">
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                a.action?.includes('CREATE') || a.action?.includes('ADD') ? 'bg-green-100 text-green-800' :
                                a.action?.includes('DELETE') || a.action?.includes('REMOVE') ? 'bg-red-100 text-red-800' :
                                a.action?.includes('UPDATE') || a.action?.includes('EDIT') ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>{a.action}</span>
                            </td>
                            <td className="py-2 pr-4">{a.module || a.type || '-'}</td>
                            <td className="py-2 pr-4 text-xs font-mono">{a.resourceId || a.description || '-'}</td>
                            <td className="py-2 pr-4 text-xs">{a.ipAddress || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex justify-between items-center mt-4 text-sm text-gray-500">
                    <span>Total: {pagination.total || activities.length}</span>
                    <div className="flex gap-2">
                      <button disabled={filters.page <= 1} className="btn-secondary text-xs" onClick={() => handlePageChange(filters.page - 1)}>Prev</button>
                      <span>Page {filters.page} {pagination.totalPages ? `of ${pagination.totalPages}` : ''}</span>
                      <button className="btn-secondary text-xs" onClick={() => handlePageChange(filters.page + 1)}>Next</button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Stats Tab */}
        {tab === 'stats' && (
          <div className="space-y-6">
            {/* User Summary */}
            <div className="card">
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2"><BarChart3 className="w-5 h-5" /> User Activity Summary</h2>
              <div className="flex gap-2 mb-4">
                <input className="input flex-1" placeholder="Enter User ID" value={statsUserId}
                  onChange={e => setStatsUserId(e.target.value)} />
                <button className="btn-primary text-sm" onClick={fetchUserSummary}>Lookup</button>
              </div>
              {userSummary && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="p-3 bg-gray-50 rounded text-center"><p className="text-xs text-gray-500">Total Actions</p><p className="text-xl font-bold">{userSummary.totalActions ?? userSummary.total ?? 0}</p></div>
                  <div className="p-3 bg-gray-50 rounded text-center"><p className="text-xs text-gray-500">Today</p><p className="text-xl font-bold">{userSummary.todayActions ?? userSummary.today ?? 0}</p></div>
                  <div className="p-3 bg-gray-50 rounded text-center"><p className="text-xs text-gray-500">This Week</p><p className="text-xl font-bold">{userSummary.weekActions ?? userSummary.thisWeek ?? 0}</p></div>
                  <div className="p-3 bg-gray-50 rounded text-center"><p className="text-xs text-gray-500">This Month</p><p className="text-xl font-bold">{userSummary.monthActions ?? userSummary.thisMonth ?? 0}</p></div>
                </div>
              )}
            </div>

            {/* Module Stats */}
            <div className="card">
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2"><BarChart3 className="w-5 h-5" /> Module Statistics</h2>
              <div className="flex gap-2 mb-4">
                <select className="input flex-1" value={statsModule} onChange={e => setStatsModule(e.target.value)}>
                  <option value="">Select module</option>
                  {['AUTH', 'STUDENT', 'STAFF', 'FEE', 'ATTENDANCE', 'EXAM', 'LMS', 'LIBRARY', 'TRANSPORT', 'HOSTEL', 'PAYMENT', 'NOTIFICATION'].map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                <button className="btn-primary text-sm" onClick={fetchModuleStats}>Lookup</button>
              </div>
              {moduleStats && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="p-3 bg-gray-50 rounded text-center"><p className="text-xs text-gray-500">Total Activities</p><p className="text-xl font-bold">{moduleStats.totalActivities ?? moduleStats.total ?? 0}</p></div>
                  <div className="p-3 bg-gray-50 rounded text-center"><p className="text-xs text-gray-500">Unique Users</p><p className="text-xl font-bold">{moduleStats.uniqueUsers ?? 0}</p></div>
                  <div className="p-3 bg-gray-50 rounded text-center"><p className="text-xs text-gray-500">Last Activity</p><p className="text-sm font-medium">{moduleStats.lastActivity ? new Date(moduleStats.lastActivity).toLocaleDateString() : '-'}</p></div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
