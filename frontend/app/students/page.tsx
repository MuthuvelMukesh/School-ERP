'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast, { Toaster } from 'react-hot-toast'
import { studentAPI } from '@/lib/api'

export default function StudentsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [students, setStudents] = useState<any[]>([])

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (!userData) {
      router.push('/auth/login')
      return
    }

    const fetchStudents = async () => {
      try {
        const response = await studentAPI.getAll({ page: 1, limit: 50 })
        setStudents(response.data?.data?.students || [])
      } catch (error) {
        toast.error('Failed to load students')
      } finally {
        setLoading(false)
      }
    }

    fetchStudents()
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <Toaster position="top-right" />
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Students</h1>
          <div className="flex items-center gap-4">
            <Link href="/students/progression" className="text-sm text-primary-600 hover:text-primary-700">
              Promotion & Transfer
            </Link>
            <Link href="/dashboard" className="text-sm text-primary-600 hover:text-primary-700">
              Back to Dashboard
            </Link>
          </div>
        </div>

        <div className="card">
          {loading ? (
            <p className="text-gray-600">Loading students...</p>
          ) : students.length === 0 ? (
            <p className="text-gray-600">No students found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-600">
                    <th className="py-2 pr-4">Admission No</th>
                    <th className="py-2 pr-4">Name</th>
                    <th className="py-2 pr-4">Class</th>
                    <th className="py-2 pr-4">Phone</th>
                    <th className="py-2 pr-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr key={student.id} className="border-b last:border-0">
                      <td className="py-2 pr-4">{student.admissionNo || '-'}</td>
                      <td className="py-2 pr-4">{`${student.firstName || ''} ${student.lastName || ''}`.trim() || '-'}</td>
                      <td className="py-2 pr-4">{student.class?.name || '-'}</td>
                      <td className="py-2 pr-4">{student.phone || '-'}</td>
                      <td className="py-2 pr-4">{student.isActive ? 'Active' : 'Inactive'}</td>
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
