'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast, { Toaster } from 'react-hot-toast'
import { notificationAPI } from '@/lib/api'

export default function NotificationsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [notifications, setNotifications] = useState<any[]>([])

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (!userData) {
      router.push('/auth/login')
      return
    }

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

    fetchNotifications()
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <Toaster position="top-right" />
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <Link href="/dashboard" className="text-sm text-primary-600 hover:text-primary-700">
            Back to Dashboard
          </Link>
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
                    <h3 className="font-semibold text-gray-900">{item.title || 'Untitled'}</h3>
                    <span className="text-xs text-gray-500">{item.createdAt ? new Date(item.createdAt).toLocaleString() : '-'}</span>
                  </div>
                  <p className="text-sm text-gray-700 mt-2">{item.message || '-'}</p>
                  <p className="text-xs text-gray-500 mt-2">Type: {item.type || '-'}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
