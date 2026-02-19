'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast, { Toaster } from 'react-hot-toast'
import { attendanceAPI } from '@/lib/api'

export default function AttendancePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [attendance, setAttendance] = useState<any[]>([])

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (!userData) {
      router.push('/auth/login')
      return
    }

    const fetchAttendance = async () => {
      try {
        const response = await attendanceAPI.getAll({ page: 1, limit: 50 })
        setAttendance(response.data?.data?.attendance || [])
      } catch (error) {
        toast.error('Failed to load attendance')
      } finally {
        setLoading(false)
      }
    }

    fetchAttendance()
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <Toaster position="top-right" />
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
          <Link href="/dashboard" className="text-sm text-primary-600 hover:text-primary-700">
            Back to Dashboard
          </Link>
        </div>

        <div className="card">
          {loading ? (
            <p className="text-gray-600">Loading attendance...</p>
          ) : attendance.length === 0 ? (
            <p className="text-gray-600">No attendance records found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-600">
                    <th className="py-2 pr-4">Student</th>
                    <th className="py-2 pr-4">Class</th>
                    <th className="py-2 pr-4">Date</th>
                    <th className="py-2 pr-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {attendance.map((record) => (
                    <tr key={record.id} className="border-b last:border-0">
                      <td className="py-2 pr-4">{record.student?.firstName || '-'} {record.student?.lastName || ''}</td>
                      <td className="py-2 pr-4">{record.class?.name || '-'}</td>
                      <td className="py-2 pr-4">{record.date ? new Date(record.date).toLocaleDateString() : '-'}</td>
                      <td className="py-2 pr-4">{record.status || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
