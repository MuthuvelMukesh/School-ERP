'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast, { Toaster } from 'react-hot-toast'
import { examAPI } from '@/lib/api'

export default function ExamsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [schedules, setSchedules] = useState<any[]>([])
  const [results, setResults] = useState<any[]>([])

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (!userData) {
      router.push('/auth/login')
      return
    }

    const fetchExamData = async () => {
      try {
        const [schedulesRes, resultsRes] = await Promise.all([
          examAPI.getAllSchedules(),
          examAPI.getAllResults()
        ])
        setSchedules(schedulesRes.data?.data?.schedules || [])
        setResults(resultsRes.data?.data?.results || [])
      } catch (error) {
        toast.error('Failed to load exam data')
      } finally {
        setLoading(false)
      }
    }

    fetchExamData()
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <Toaster position="top-right" />
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Examinations</h1>
          <Link href="/dashboard" className="text-sm text-primary-600 hover:text-primary-700">
            Back to Dashboard
          </Link>
        </div>

        {loading ? (
          <div className="card">
            <p className="text-gray-600">Loading exam data...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="card"><p className="text-sm text-gray-500">Exam Schedules</p><p className="text-2xl font-semibold">{schedules.length}</p></div>
              <div className="card"><p className="text-sm text-gray-500">Exam Results</p><p className="text-2xl font-semibold">{results.length}</p></div>
            </div>

            <div className="card">
              <h2 className="text-lg font-semibold mb-3">Upcoming Schedules</h2>
              {schedules.length === 0 ? (
                <p className="text-gray-600">No exam schedules found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-gray-600">
                        <th className="py-2 pr-4">Exam</th>
                        <th className="py-2 pr-4">Class</th>
                        <th className="py-2 pr-4">Subject</th>
                        <th className="py-2 pr-4">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {schedules.map((schedule) => (
                        <tr key={schedule.id} className="border-b last:border-0">
                          <td className="py-2 pr-4">{schedule.name || schedule.examType || '-'}</td>
                          <td className="py-2 pr-4">{schedule.class?.name || '-'}</td>
                          <td className="py-2 pr-4">{schedule.subject?.name || '-'}</td>
                          <td className="py-2 pr-4">{schedule.examDate ? new Date(schedule.examDate).toLocaleDateString() : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
