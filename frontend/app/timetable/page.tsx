'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast, { Toaster } from 'react-hot-toast'
import { timetableAPI } from '@/lib/api'

export default function TimetablePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [timetables, setTimetables] = useState<any[]>([])

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (!userData) {
      router.push('/auth/login')
      return
    }

    const fetchTimetable = async () => {
      try {
        const response = await timetableAPI.getAll()
        setTimetables(response.data?.data?.timetables || [])
      } catch (error) {
        toast.error('Failed to load timetable')
      } finally {
        setLoading(false)
      }
    }

    fetchTimetable()
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <Toaster position="top-right" />
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Timetable</h1>
          <Link href="/dashboard" className="text-sm text-primary-600 hover:text-primary-700">
            Back to Dashboard
          </Link>
        </div>

        <div className="card">
          {loading ? (
            <p className="text-gray-600">Loading timetable...</p>
          ) : timetables.length === 0 ? (
            <p className="text-gray-600">No timetable entries found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-600">
                    <th className="py-2 pr-4">Class</th>
                    <th className="py-2 pr-4">Subject</th>
                    <th className="py-2 pr-4">Teacher</th>
                    <th className="py-2 pr-4">Day</th>
                    <th className="py-2 pr-4">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {timetables.map((entry) => (
                    <tr key={entry.id} className="border-b last:border-0">
                      <td className="py-2 pr-4">{entry.class?.name || '-'}</td>
                      <td className="py-2 pr-4">{entry.subject?.name || '-'}</td>
                      <td className="py-2 pr-4">{entry.teacher ? `${entry.teacher.firstName || ''} ${entry.teacher.lastName || ''}`.trim() : '-'}</td>
                      <td className="py-2 pr-4">{entry.dayOfWeek || '-'}</td>
                      <td className="py-2 pr-4">{entry.startTime || '-'} - {entry.endTime || '-'}</td>
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
