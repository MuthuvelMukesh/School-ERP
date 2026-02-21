'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast, { Toaster } from 'react-hot-toast'
import { CreditCard, CheckCircle, XCircle, RefreshCw, Search, X } from 'lucide-react'
import { paymentAPI, feeAPI } from '@/lib/api'

export default function PaymentsPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'pay' | 'history' | 'report'>('pay')

  // Gateway status
  const [gatewayActive, setGatewayActive] = useState(false)
  const [gatewayMessage, setGatewayMessage] = useState('')

  // Payment form
  const [payForm, setPayForm] = useState({ feeId: '', studentId: '', amount: 0 })
  const [paying, setPaying] = useState(false)

  // History
  const [history, setHistory] = useState<any[]>([])
  const [historyStudentId, setHistoryStudentId] = useState('')

  // Report
  const [report, setReport] = useState<any>(null)

  // Refund modal
  const [showRefund, setShowRefund] = useState(false)
  const [refundForm, setRefundForm] = useState({ paymentId: '', feeId: '', amount: 0, reason: '' })
  const [refunding, setRefunding] = useState(false)

  // Fee structures for lookup
  const [feeStructures, setFeeStructures] = useState<any[]>([])

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (!userData) { router.push('/auth/login'); return }
    const parsed = JSON.parse(userData)
    setUser(parsed)
    if (parsed.role === 'STUDENT' && parsed.profile?.id) {
      setPayForm(f => ({ ...f, studentId: parsed.profile.id }))
      setHistoryStudentId(parsed.profile.id)
    }
    checkGateway()
    loadFeeStructures()
  }, [router])

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'PRINCIPAL' || user?.role === 'ACCOUNTANT'

  const checkGateway = async () => {
    try {
      const res = await paymentAPI.getStatus()
      const data = res.data?.data || res.data
      setGatewayActive(data?.active || data?.configured || false)
      setGatewayMessage(data?.message || '')
    } catch {
      setGatewayActive(false)
      setGatewayMessage('Payment gateway not configured')
    } finally {
      setLoading(false)
    }
  }

  const loadFeeStructures = async () => {
    try {
      const res = await feeAPI.getAllStructures()
      setFeeStructures(res.data?.data?.structures || [])
    } catch { /* ignore */ }
  }

  const handleCreateOrder = async () => {
    if (!payForm.feeId || !payForm.studentId || !payForm.amount) {
      toast.error('Fee ID, Student ID, and Amount are required')
      return
    }
    setPaying(true)
    try {
      const res = await paymentAPI.createOrder({
        feeId: payForm.feeId,
        studentId: payForm.studentId,
        amount: Number(payForm.amount)
      })
      const order = res.data?.data?.order || res.data?.data

      if (order && typeof window !== 'undefined' && (window as any).Razorpay) {
        const options = {
          key: order.key || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: order.amount,
          currency: order.currency || 'INR',
          name: 'School ERP',
          description: 'Fee Payment',
          order_id: order.id,
          handler: async (response: any) => {
            try {
              await paymentAPI.verifyPayment({
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
                feeId: payForm.feeId
              })
              toast.success('Payment verified successfully!')
              setPayForm({ feeId: '', studentId: user?.role === 'STUDENT' ? user?.profile?.id || '' : '', amount: 0 })
            } catch {
              toast.error('Payment verification failed')
            }
          },
          prefill: { email: user?.email || '' },
          theme: { color: '#4F46E5' }
        }
        const rzp = new (window as any).Razorpay(options)
        rzp.open()
      } else {
        toast.success('Payment order created! Order ID: ' + (order?.id || 'N/A'))
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create payment order')
    } finally {
      setPaying(false)
    }
  }

  const fetchHistory = async (studentId?: string) => {
    const sid = studentId || historyStudentId
    if (!sid) { toast.error('Enter Student ID'); return }
    try {
      const res = await paymentAPI.getHistory(sid)
      setHistory(res.data?.data?.payments || res.data?.data?.history || [])
    } catch { toast.error('Failed to load history') }
  }

  const fetchReport = async () => {
    try {
      const res = await paymentAPI.getReport()
      setReport(res.data?.data || res.data)
    } catch { toast.error('Failed to load report') }
  }

  const handleRefund = async () => {
    if (!refundForm.paymentId || !refundForm.feeId) { toast.error('Payment ID and Fee ID required'); return }
    setRefunding(true)
    try {
      await paymentAPI.refund({
        paymentId: refundForm.paymentId,
        feeId: refundForm.feeId,
        amount: refundForm.amount || undefined,
        reason: refundForm.reason || undefined
      })
      toast.success('Refund processed')
      setShowRefund(false)
      setRefundForm({ paymentId: '', feeId: '', amount: 0, reason: '' })
    } catch (err: any) { toast.error(err.response?.data?.message || 'Refund failed') }
    finally { setRefunding(false) }
  }

  const handleTabChange = (t: typeof tab) => {
    setTab(t)
    if (t === 'history' && historyStudentId) fetchHistory()
    if (t === 'report') fetchReport()
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <Toaster position="top-right" />
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CreditCard className="w-7 h-7 text-primary-600" />
            <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
          </div>
          <Link href="/dashboard" className="text-sm text-primary-600 hover:text-primary-700">Back to Dashboard</Link>
        </div>

        {/* Gateway status */}
        <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${gatewayActive ? 'bg-green-50 text-green-800' : 'bg-yellow-50 text-yellow-800'}`}>
          {gatewayActive ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          {gatewayActive ? 'Payment gateway is active' : (gatewayMessage || 'Payment gateway not configured. Configure Razorpay keys in .env to enable online payments.')}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b pb-2">
          {(['pay', 'history', 'report'] as const).map(t => (
            <button key={t} onClick={() => handleTabChange(t)}
              className={`px-4 py-2 rounded-t-lg text-sm font-medium capitalize ${tab === t ? 'bg-white border border-b-0 text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}>
              {t === 'pay' ? 'Make Payment' : t === 'history' ? 'Payment History' : 'Report'}
            </button>
          ))}
        </div>

        {/* Pay Tab */}
        {tab === 'pay' && (
          <div className="card max-w-lg">
            <h2 className="text-lg font-semibold mb-4">Create Payment Order</h2>
            <div className="space-y-4">
              <div>
                <label className="label">Student ID</label>
                <input className="input" value={payForm.studentId}
                  onChange={e => setPayForm({ ...payForm, studentId: e.target.value })}
                  disabled={user?.role === 'STUDENT'} />
              </div>
              <div>
                <label className="label">Fee Structure</label>
                <select className="input" value={payForm.feeId}
                  onChange={e => {
                    const sel = feeStructures.find(f => f.id === e.target.value)
                    setPayForm({ ...payForm, feeId: e.target.value, amount: sel?.amount || payForm.amount })
                  }}>
                  <option value="">Select fee</option>
                  {feeStructures.map(f => (
                    <option key={f.id} value={f.id}>{f.feeType || f.name || f.id} - ₹{f.amount}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Amount (₹)</label>
                <input className="input" type="number" value={payForm.amount}
                  onChange={e => setPayForm({ ...payForm, amount: parseFloat(e.target.value) || 0 })} />
              </div>
              <button className="btn-primary w-full" onClick={handleCreateOrder} disabled={paying || !gatewayActive}>
                {paying ? 'Processing...' : gatewayActive ? 'Pay Now' : 'Gateway Not Active'}
              </button>
            </div>
          </div>
        )}

        {/* History Tab */}
        {tab === 'history' && (
          <div className="space-y-4">
            <div className="flex gap-2 items-center">
              <input className="input flex-1" placeholder="Enter Student ID" value={historyStudentId}
                onChange={e => setHistoryStudentId(e.target.value)} />
              <button className="btn-primary text-sm" onClick={() => fetchHistory()}>
                <Search className="w-4 h-4" />
              </button>
              {isAdmin && (
                <button className="btn-secondary text-sm flex items-center gap-1" onClick={() => setShowRefund(true)}>
                  <RefreshCw className="w-4 h-4" /> Refund
                </button>
              )}
            </div>
            <div className="card">
              {history.length === 0 ? <p className="text-gray-600">No payment history. Enter a Student ID to search.</p> : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead><tr className="border-b text-left text-gray-600"><th className="py-2 pr-4">Date</th><th className="py-2 pr-4">Amount</th><th className="py-2 pr-4">Status</th><th className="py-2 pr-4">Payment ID</th><th className="py-2 pr-4">Method</th></tr></thead>
                    <tbody>{history.map((p: any, i: number) => (
                      <tr key={p.id || i} className="border-b last:border-0">
                        <td className="py-2 pr-4">{p.createdAt ? new Date(p.createdAt).toLocaleDateString() : p.paymentDate ? new Date(p.paymentDate).toLocaleDateString() : '-'}</td>
                        <td className="py-2 pr-4 font-medium">₹{p.amount ?? 0}</td>
                        <td className="py-2 pr-4"><span className={`px-2 py-0.5 rounded text-xs ${p.status === 'PAID' || p.status === 'captured' ? 'bg-green-100 text-green-800' : p.status === 'REFUNDED' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}`}>{p.status}</span></td>
                        <td className="py-2 pr-4 text-xs font-mono">{p.razorpayPaymentId || p.paymentId || p.id || '-'}</td>
                        <td className="py-2 pr-4">{p.paymentMode || p.method || '-'}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Report Tab */}
        {tab === 'report' && (
          <div className="space-y-4">
            {report && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="card text-center"><p className="text-sm text-gray-500">Total Collected</p><p className="text-2xl font-bold text-green-600">₹{report.totalCollected ?? report.totalAmount ?? 0}</p></div>
                  <div className="card text-center"><p className="text-sm text-gray-500">Total Transactions</p><p className="text-2xl font-bold">{report.totalTransactions ?? report.count ?? 0}</p></div>
                  <div className="card text-center"><p className="text-sm text-gray-500">Refunds</p><p className="text-2xl font-bold text-blue-600">₹{report.totalRefunds ?? 0}</p></div>
                  <div className="card text-center"><p className="text-sm text-gray-500">Pending</p><p className="text-2xl font-bold text-orange-600">₹{report.totalPending ?? 0}</p></div>
                </div>
                {report.recentPayments && (
                  <div className="card">
                    <h3 className="text-lg font-semibold mb-3">Recent Payments</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead><tr className="border-b text-left text-gray-600"><th className="py-2 pr-4">Student</th><th className="py-2 pr-4">Amount</th><th className="py-2 pr-4">Date</th><th className="py-2 pr-4">Status</th></tr></thead>
                        <tbody>{report.recentPayments.map((p: any, i: number) => (
                          <tr key={i} className="border-b last:border-0">
                            <td className="py-2 pr-4">{p.studentName || p.student?.firstName || '-'}</td>
                            <td className="py-2 pr-4">₹{p.amount}</td>
                            <td className="py-2 pr-4">{p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '-'}</td>
                            <td className="py-2 pr-4">{p.status}</td>
                          </tr>
                        ))}</tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Refund Modal */}
        {showRefund && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-semibold">Process Refund</h3><button onClick={() => setShowRefund(false)}><X className="w-5 h-5" /></button></div>
              <div className="space-y-3">
                <div><label className="label">Razorpay Payment ID *</label><input className="input" value={refundForm.paymentId} onChange={e => setRefundForm({...refundForm, paymentId: e.target.value})} /></div>
                <div><label className="label">Fee ID *</label><input className="input" value={refundForm.feeId} onChange={e => setRefundForm({...refundForm, feeId: e.target.value})} /></div>
                <div><label className="label">Amount (₹, leave 0 for full refund)</label><input className="input" type="number" value={refundForm.amount} onChange={e => setRefundForm({...refundForm, amount: parseFloat(e.target.value)||0})} /></div>
                <div><label className="label">Reason</label><textarea className="input" rows={2} value={refundForm.reason} onChange={e => setRefundForm({...refundForm, reason: e.target.value})} /></div>
                <button className="btn-primary w-full" onClick={handleRefund} disabled={refunding}>{refunding ? 'Processing...' : 'Process Refund'}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
