'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast, { Toaster } from 'react-hot-toast'
import { feeAPI } from '@/lib/api'

export default function FeesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [structures, setStructures] = useState<any[]>([])
  const [payments, setPayments] = useState<any[]>([])
  const [defaulters, setDefaulters] = useState<any[]>([])

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (!userData) {
      router.push('/auth/login')
      return
    }

    const fetchFees = async () => {
      try {
        const [structuresRes, paymentsRes, defaultersRes] = await Promise.all([
          feeAPI.getAllStructures(),
          feeAPI.getAllPayments({ page: 1, limit: 20 }),
          feeAPI.getDefaulters()
        ])

        setStructures(structuresRes.data?.data?.structures || [])
        setPayments(paymentsRes.data?.data?.payments || [])
        setDefaulters(defaultersRes.data?.data?.defaulters || [])
      } catch (error) {
        toast.error('Failed to load fee data')
      } finally {
        setLoading(false)
      }
    }

    fetchFees()
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <Toaster position="top-right" />
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Fees</h1>
          <Link href="/dashboard" className="text-sm text-primary-600 hover:text-primary-700">
            Back to Dashboard
          </Link>
        </div>

        {loading ? (
          <div className="card">
            <p className="text-gray-600">Loading fee data...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="card"><p className="text-sm text-gray-500">Fee Structures</p><p className="text-2xl font-semibold">{structures.length}</p></div>
              <div className="card"><p className="text-sm text-gray-500">Recent Payments</p><p className="text-2xl font-semibold">{payments.length}</p></div>
              <div className="card"><p className="text-sm text-gray-500">Defaulters</p><p className="text-2xl font-semibold">{defaulters.length}</p></div>
            </div>

            <div className="card">
              <h2 className="text-lg font-semibold mb-3">Recent Payments</h2>
              {payments.length === 0 ? (
                <p className="text-gray-600">No payments found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-gray-600">
                        <th className="py-2 pr-4">Student</th>
                        <th className="py-2 pr-4">Amount</th>
                        <th className="py-2 pr-4">Date</th>
                        <th className="py-2 pr-4">Mode</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((payment) => (
                        <tr key={payment.id} className="border-b last:border-0">
                          <td className="py-2 pr-4">{payment.student?.firstName || '-'} {payment.student?.lastName || ''}</td>
                          <td className="py-2 pr-4">{payment.amount ?? '-'}</td>
                          <td className="py-2 pr-4">{payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString() : '-'}</td>
                          <td className="py-2 pr-4">{payment.paymentMode || '-'}</td>
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
