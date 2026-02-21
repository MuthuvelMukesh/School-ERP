'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast, { Toaster } from 'react-hot-toast'
import { Bell, Send, Plus, X } from 'lucide-react'
import { notificationAPI } from '@/lib/api'

export default function NotificationsPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [notifications, setNotifications] = useState<any[]>([])
  const [showSend, setShowSend] = useState(false)
  const [sending, setSending] = useState(false)
  const [form, setForm] = useState({ title: '', message: '', type: 'IN_APP', recipients: '' })

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (!userData) {
      router.push('/auth/login')
      return
    }
    setUser(JSON.parse(userData))
    fetchNotifications()
  }, [router])

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'PRINCIPAL' || user?.role === 'TEACHER'

  const fetchNotifications = async () => {
    try {
      const response = await notificationAPI.getAll({ page: 1, limit: 50 })
      setNotifications(response.data?.data?.notifications || [])
    } catch (error) {
      toast.error('Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }

  const handleSend = async () => {
    if (!form.title || !form.message) { toast.error('Title and message required'); return }
    setSending(true)
    try {
      const recipients = form.recipients ? form.recipients.split(',').map(r => r.trim()).filter(Boolean) : []
      await notificationAPI.send({
        title: form.title,
        message: form.message,
        type: form.type,
        recipients: recipients.length > 0 ? recipients : undefined
      })
      toast.success(`Notification sent${form.type === 'EMAIL' ? ' (email will be delivered)' : ''}!`)
      setShowSend(false)
      setForm({ title: '', message: '', type: 'IN_APP', recipients: '' })
      fetchNotifications()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send notification')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <Toaster position="top-right" />
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell className="w-7 h-7 text-primary-600" />
            <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          </div>
          <div className="flex items-center gap-3">
            {isAdmin && (
              <button className="btn-primary text-sm flex items-center gap-1" onClick={() => setShowSend(true)}>
                <Send className="w-4 h-4" /> Send Notification
              </button>
            )}
            <Link href="/dashboard" className="text-sm text-primary-600 hover:text-primary-700">
              Back to Dashboard
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="card text-center">
            <p className="text-sm text-gray-500">Total</p>
            <p className="text-2xl font-semibold">{notifications.length}</p>
          </div>
          <div className="card text-center">
            <p className="text-sm text-gray-500">Email</p>
            <p className="text-2xl font-semibold">{notifications.filter(n => n.type === 'EMAIL').length}</p>
          </div>
          <div className="card text-center">
            <p className="text-sm text-gray-500">In-App / SMS</p>
            <p className="text-2xl font-semibold">{notifications.filter(n => n.type !== 'EMAIL').length}</p>
          </div>
        </div>

        <div className="card">
          {loading ? (
            <p className="text-gray-600">Loading notifications...</p>
          ) : notifications.length === 0 ? (
            <p className="text-gray-600">No notifications found.</p>
          ) : (
            <div className="space-y-3">
              {notifications.map((item) => (
                <div key={item.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{item.title || 'Untitled'}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded ${item.type === 'EMAIL' ? 'bg-blue-100 text-blue-800' : item.type === 'SMS' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {item.type || 'IN_APP'}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">{item.sentAt ? new Date(item.sentAt).toLocaleString() : item.createdAt ? new Date(item.createdAt).toLocaleString() : '-'}</span>
                  </div>
                  <p className="text-sm text-gray-700 mt-2">{item.message || '-'}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Send Notification Modal */}
        {showSend && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Send Notification</h3>
                <button onClick={() => setShowSend(false)}><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="label">Title *</label>
                  <input className="input" value={form.title}
                    onChange={e => setForm({ ...form, title: e.target.value })} />
                </div>
                <div>
                  <label className="label">Message *</label>
                  <textarea className="input" rows={4} value={form.message}
                    onChange={e => setForm({ ...form, message: e.target.value })} />
                </div>
                <div>
                  <label className="label">Type</label>
                  <select className="input" value={form.type}
                    onChange={e => setForm({ ...form, type: e.target.value })}>
                    <option value="IN_APP">In-App</option>
                    <option value="EMAIL">Email (sends via SMTP)</option>
                    <option value="SMS">SMS</option>
                  </select>
                  {form.type === 'EMAIL' && (
                    <p className="text-xs text-gray-500 mt-1">Requires SMTP configuration in backend .env (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS)</p>
                  )}
                </div>
                <div>
                  <label className="label">Recipients (comma-separated user IDs, leave empty for all)</label>
                  <input className="input" placeholder="user-id-1, user-id-2" value={form.recipients}
                    onChange={e => setForm({ ...form, recipients: e.target.value })} />
                </div>
                <button className="btn-primary w-full" onClick={handleSend} disabled={sending}>
                  {sending ? 'Sending...' : 'Send Notification'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
