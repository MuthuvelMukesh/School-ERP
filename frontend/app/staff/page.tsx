'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast, { Toaster } from 'react-hot-toast'
import { staffAPI } from '@/lib/api'

export default function StaffPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [staff, setStaff] = useState<any[]>([])

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (!userData) {
      router.push('/auth/login')
      return
    }

    const fetchStaff = async () => {
      try {
        const response = await staffAPI.getAll({ page: 1, limit: 50 })
        setStaff(response.data?.data?.staff || [])
      } catch (error) {
        toast.error('Failed to load staff')
      } finally {
        setLoading(false)
      }
    }

    fetchStaff()
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <Toaster position="top-right" />
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Staff</h1>
          <Link href="/dashboard" className="text-sm text-primary-600 hover:text-primary-700">
            Back to Dashboard
          </Link>
        </div>

        <div className="card">
          {loading ? (
            <p className="text-gray-600">Loading staff...</p>
          ) : staff.length === 0 ? (
            <p className="text-gray-600">No staff found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-600">
                    <th className="py-2 pr-4">Name</th>
                    <th className="py-2 pr-4">Employee ID</th>
                    <th className="py-2 pr-4">Designation</th>
                    <th className="py-2 pr-4">Phone</th>
                    <th className="py-2 pr-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {staff.map((member) => (
                    <tr key={member.id} className="border-b last:border-0">
                      <td className="py-2 pr-4">{`${member.firstName || ''} ${member.lastName || ''}`.trim() || '-'}</td>
                      <td className="py-2 pr-4">{member.employeeId || '-'}</td>
                      <td className="py-2 pr-4">{member.designation || '-'}</td>
                      <td className="py-2 pr-4">{member.phone || '-'}</td>
                      <td className="py-2 pr-4">{member.isActive ? 'Active' : 'Inactive'}</td>
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
