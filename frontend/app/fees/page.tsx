'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast, { Toaster } from 'react-hot-toast'
import { feeAPI, metadataAPI, studentAPI } from '@/lib/api'
import { useAuth } from '@/lib/useAuth'

export default function FeesPage() {
  const router = useRouter()
  const { ready } = useAuth({ roles: ['ADMIN', 'PRINCIPAL', 'ACCOUNTANT', 'STUDENT', 'PARENT'] })
  const [activeTab, setActiveTab] = useState<'myFees' | 'structures' | 'payments' | 'defaulters'>('structures')
  const [loading, setLoading] = useState(true)
  const [structures, setStructures] = useState<any[]>([])
  const [payments, setPayments] = useState<any[]>([])
  const [defaulters, setDefaulters] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [academicYears, setAcademicYears] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)
  const [myChildren, setMyChildren] = useState<any[]>([])
  const [selectedChildId, setSelectedChildId] = useState('')
  const [feeSummary, setFeeSummary] = useState<{ totalPaid: number; totalPending: number; totalPayments: number } | null>(null)

  // Structure modal
  const [showStructureModal, setShowStructureModal] = useState(false)
  const [structureForm, setStructureForm] = useState({
    academicYearId: '',
    name: '',
    amount: '',
    dueDate: '',
    description: '',
    isOptional: false,
  })
  const [submittingStructure, setSubmittingStructure] = useState(false)

  // Payment modal
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentForm, setPaymentForm] = useState({
    studentId: '', feeStructureId: '', amount: '',
    paymentMode: 'CASH', transactionId: '', paymentDate: new Date().toISOString().split('T')[0], remarks: ''
  })
  const [submittingPayment, setSubmittingPayment] = useState(false)

  useEffect(() => {
    if (!ready) return
    const userData = localStorage.getItem('user')
    if (!userData) { router.push('/auth/login'); return }
    const parsedUser = JSON.parse(userData)
    setUser(parsedUser)
  }, [ready, router])

  useEffect(() => {
    if (!user) return
    if (['STUDENT', 'PARENT'].includes(user.role)) setActiveTab('myFees')
    fetchAll(user)
  }, [user?.id, user?.role, selectedChildId])

  const fetchAll = async (currentUser?: any) => {
    setLoading(true)
    const u = currentUser ?? user
    try {
      if (u?.role === 'STUDENT' && u?.profile?.id) {
        const res = await feeAPI.getStudentFees(u.profile.id)
        setPayments(res.data?.data?.payments || [])
        setFeeSummary(res.data?.data?.summary || null)
        setStructures([])
        setDefaulters([])
        setStudents([])
        setAcademicYears([])
      } else if (u?.role === 'PARENT') {
        const kidsRes = await studentAPI.getAll({ parentUserId: u.id, limit: 50 })
        const kids = kidsRes.data?.data?.students || []
        setMyChildren(kids)
        const effectiveStudentId = selectedChildId || kids[0]?.id
        if (!selectedChildId && effectiveStudentId) setSelectedChildId(effectiveStudentId)

        if (effectiveStudentId) {
          const feesRes = await feeAPI.getStudentFees(effectiveStudentId)
          setPayments(feesRes.data?.data?.payments || [])
          setFeeSummary(feesRes.data?.data?.summary || null)
        } else {
          setPayments([])
          setFeeSummary(null)
        }
        setStructures([])
        setDefaulters([])
        setStudents([])
        setAcademicYears([])
      } else {
        const [structuresRes, paymentsRes, defaultersRes, studentsRes, ayRes] = await Promise.all([
          feeAPI.getAllStructures(),
          feeAPI.getAllPayments({ page: 1, limit: 100 }),
          feeAPI.getDefaulters(),
          studentAPI.getAll({ page: 1, limit: 200 }),
          metadataAPI.getAcademicYears(),
        ])
        setStructures(structuresRes.data?.data?.structures || [])
        setPayments(paymentsRes.data?.data?.payments || [])
        setDefaulters(defaultersRes.data?.data?.defaulters || [])
        setStudents(studentsRes.data?.data?.students || [])
        setAcademicYears(ayRes.data?.data?.academicYears || [])
        setFeeSummary(null)
      }
    } catch {
      toast.error('Failed to load fee data')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateStructure = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmittingStructure(true)
    try {
      await feeAPI.createStructure({
        academicYearId: structureForm.academicYearId,
        name: structureForm.name,
        amount: Number(structureForm.amount),
        dueDate: structureForm.dueDate || undefined,
        description: structureForm.description || undefined,
        isOptional: !!structureForm.isOptional,
      })
      toast.success('Fee structure created')
      setShowStructureModal(false)
      setStructureForm({ academicYearId: '', name: '', amount: '', dueDate: '', description: '', isOptional: false })
      fetchAll()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to create fee structure')
    } finally {
      setSubmittingStructure(false)
    }
  }

  const handleVoidPayment = async (paymentId: string) => {
    if (!window.confirm('Void this payment? This will permanently remove the record.')) return
    try {
      await feeAPI.deletePayment(paymentId)
      toast.success('Payment voided successfully')
      fetchAll()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to void payment')
    }
  }

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmittingPayment(true)
    try {
      await feeAPI.createPayment({ ...paymentForm, amount: Number(paymentForm.amount) })
      toast.success('Payment recorded successfully')
      setShowPaymentModal(false)
      setPaymentForm({ studentId: '', feeStructureId: '', amount: '', paymentMode: 'CASH', transactionId: '', paymentDate: new Date().toISOString().split('T')[0], remarks: '' })
      fetchAll()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to record payment')
    } finally {
      setSubmittingPayment(false)
    }
  }

  const totalCollected = payments.reduce((sum, p) => sum + (p.amount || 0), 0)

  const paymentModeColor: Record<string, string> = {
    CASH: 'bg-green-100 text-green-800',
    ONLINE: 'bg-blue-100 text-blue-800',
    CHEQUE: 'bg-yellow-100 text-yellow-800',
    CARD: 'bg-purple-100 text-purple-800',
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <Toaster position="top-right" />
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Fee Management</h1>
          <Link href="/dashboard" className="text-sm text-primary-600 hover:text-primary-700">
            ← Back to Dashboard
          </Link>
        </div>

        {/* Parent: My Children Banner */}
        {user?.role === 'PARENT' && (
          <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
            <p className="text-sm font-semibold text-blue-800 mb-2">My Children&apos;s Fees</p>
            {myChildren.length === 0 ? (
              <p className="text-sm text-blue-600">No children linked to your account yet.</p>
            ) : (
              <div className="flex flex-col md:flex-row gap-3 md:items-center">
                <div className="flex-1">
                  <label className="label">Select Child</label>
                  <select className="input" value={selectedChildId} onChange={e => setSelectedChildId(e.target.value)}>
                    {myChildren.map((child: any) => (
                      <option key={child.id} value={child.id}>
                        {child.firstName} {child.lastName} {child.class?.name ? `(${child.class.name})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                {selectedChildId && (
                  <Link
                    href={`/students/${selectedChildId}`}
                    className="btn-secondary text-sm whitespace-nowrap"
                  >
                    View Student Profile
                  </Link>
                )}
              </div>
            )}
          </div>
        )}

        {/* Stats */}
        {['STUDENT', 'PARENT'].includes(user?.role) ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card text-center">
              <p className="text-sm text-gray-500">Total Paid</p>
              <p className="text-3xl font-bold text-green-600">₹{(feeSummary?.totalPaid || 0).toLocaleString()}</p>
            </div>
            <div className="card text-center">
              <p className="text-sm text-gray-500">Total Pending</p>
              <p className="text-3xl font-bold text-red-600">₹{(feeSummary?.totalPending || 0).toLocaleString()}</p>
            </div>
            <div className="card text-center">
              <p className="text-sm text-gray-500">Payments</p>
              <p className="text-3xl font-bold text-primary-600">{feeSummary?.totalPayments ?? payments.length}</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="card text-center">
              <p className="text-sm text-gray-500">Fee Structures</p>
              <p className="text-3xl font-bold text-gray-800">{structures.length}</p>
            </div>
            <div className="card text-center">
              <p className="text-sm text-gray-500">Total Collected</p>
              <p className="text-3xl font-bold text-green-600">₹{totalCollected.toLocaleString()}</p>
            </div>
            <div className="card text-center">
              <p className="text-sm text-gray-500">Total Payments</p>
              <p className="text-3xl font-bold text-primary-600">{payments.length}</p>
            </div>
            <div className="card text-center">
              <p className="text-sm text-gray-500">Defaulters</p>
              <p className="text-3xl font-bold text-red-600">{defaulters.length}</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-200">
          {['STUDENT', 'PARENT'].includes(user?.role) ? (
            <button
              onClick={() => setActiveTab('myFees')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'myFees'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              My Fees
            </button>
          ) : (
            (['structures', 'payments', 'defaulters'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors capitalize ${
                  activeTab === tab
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab === 'structures' ? 'Fee Structures' : tab === 'payments' ? 'Payments' : 'Defaulters'}
                {tab === 'defaulters' && defaulters.length > 0 && (
                  <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">{defaulters.length}</span>
                )}
              </button>
            ))
          )}
        </div>

        {/* My Fees Tab (Student/Parent) */}
        {activeTab === 'myFees' && ['STUDENT', 'PARENT'].includes(user?.role) && (
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Fee Payments</h2>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : payments.length === 0 ? (
              <p className="text-center text-gray-500 py-12">No fee payments found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      <th className="px-4 py-3">Fee</th>
                      <th className="px-4 py-3">Amount</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Mode</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {payments.map(p => (
                      <tr key={p.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{p.feeStructure?.name || '-'}</td>
                        <td className="px-4 py-3 font-semibold text-green-700">₹{(p.amount || 0).toLocaleString()}</td>
                        <td className="px-4 py-3 text-gray-600">{p.status || '-'}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${paymentModeColor[p.paymentMode] || 'bg-gray-100 text-gray-800'}`}>
                            {p.paymentMode || '-'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{p.paymentDate ? new Date(p.paymentDate).toLocaleDateString() : '-'}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{p.receiptNo || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Fee Structures Tab */}
        {activeTab === 'structures' && !['STUDENT', 'PARENT'].includes(user?.role) && (
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Fee Structures</h2>
              {!['STUDENT', 'PARENT'].includes(user?.role) && (
                <button onClick={() => setShowStructureModal(true)} className="btn-primary text-sm">+ Add Structure</button>
              )}
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : structures.length === 0 ? (
              <p className="text-center text-gray-500 py-12">No fee structures defined. Add one to get started.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Amount</th>
                      <th className="px-4 py-3">Academic Year</th>
                      <th className="px-4 py-3">Due Date</th>
                      <th className="px-4 py-3">Optional</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {structures.map(s => (
                      <tr key={s.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{s.name}</td>
                        <td className="px-4 py-3 font-semibold text-green-700">₹{(s.amount || 0).toLocaleString()}</td>
                        <td className="px-4 py-3 text-gray-600">{s.academicYear?.name || s.academicYear?.year || '-'}</td>
                        <td className="px-4 py-3 text-gray-600">{s.dueDate ? new Date(s.dueDate).toLocaleDateString() : '-'}</td>
                        <td className="px-4 py-3 text-gray-600">{s.isOptional ? 'Yes' : 'No'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Payments Tab */}
        {activeTab === 'payments' && !['STUDENT', 'PARENT'].includes(user?.role) && (
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Payment Records</h2>
              {!['STUDENT', 'PARENT'].includes(user?.role) && (
                <button onClick={() => setShowPaymentModal(true)} className="btn-primary text-sm">+ Record Payment</button>
              )}
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : payments.length === 0 ? (
              <p className="text-center text-gray-500 py-12">No payment records found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      <th className="px-4 py-3">Student</th>
                      <th className="px-4 py-3">Fee Structure</th>
                      <th className="px-4 py-3">Amount</th>
                      <th className="px-4 py-3">Mode</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Transaction ID</th>
                      {['ADMIN', 'ACCOUNTANT'].includes(user?.role) && <th className="px-4 py-3">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {payments.map(p => (
                      <tr key={p.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">
                          {p.student?.firstName || ''} {p.student?.lastName || ''}
                          {p.student?.admissionNo && <span className="ml-1 text-xs text-gray-400">({p.student.admissionNo})</span>}
                        </td>
                        <td className="px-4 py-3 text-gray-600">{p.feeStructure?.name || '-'}</td>
                        <td className="px-4 py-3 font-semibold text-green-700">₹{(p.amount || 0).toLocaleString()}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${paymentModeColor[p.paymentMode] || 'bg-gray-100 text-gray-800'}`}>
                            {p.paymentMode || '-'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{p.paymentDate ? new Date(p.paymentDate).toLocaleDateString() : '-'}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{p.transactionId || '-'}</td>
                        {['ADMIN', 'ACCOUNTANT'].includes(user?.role) && (
                          <td className="px-4 py-3">
                            <button
                              onClick={() => handleVoidPayment(p.id)}
                              className="text-xs text-red-600 hover:text-red-800 font-medium border border-red-200 rounded px-2 py-0.5 hover:bg-red-50"
                            >
                              Void
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Defaulters Tab */}
        {activeTab === 'defaulters' && (
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-red-700">Fee Defaulters</h2>
              <span className="text-sm text-gray-500">{defaulters.length} student(s) have pending fees</span>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : defaulters.length === 0 ? (
              <p className="text-center text-gray-500 py-12">No defaulters found. All fees are up to date!</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      <th className="px-4 py-3">Student</th>
                      <th className="px-4 py-3">Admission No</th>
                      <th className="px-4 py-3">Class</th>
                      <th className="px-4 py-3">Fee Name</th>
                      <th className="px-4 py-3">Due Amount</th>
                      <th className="px-4 py-3">Due Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {defaulters.map((d, idx) => (
                      <tr key={d.id || idx} className="hover:bg-red-50">
                        <td className="px-4 py-3 font-medium text-gray-900">
                          {d.student?.firstName || d.firstName || ''} {d.student?.lastName || d.lastName || ''}
                        </td>
                        <td className="px-4 py-3 text-gray-600">{d.student?.admissionNo || d.admissionNo || '-'}</td>
                        <td className="px-4 py-3 text-gray-600">{d.student?.class?.name || d.class?.name || '-'}</td>
                        <td className="px-4 py-3 text-gray-600">{d.feeStructure?.name || d.feeName || '-'}</td>
                        <td className="px-4 py-3 font-semibold text-red-600">₹{(d.dueAmount || d.amount || 0).toLocaleString()}</td>
                        <td className="px-4 py-3 text-gray-600">{d.dueDate ? new Date(d.dueDate).toLocaleDateString() : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Fee Structure Modal */}
      {showStructureModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-semibold">Add Fee Structure</h2>
              <button onClick={() => setShowStructureModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>
            <form onSubmit={handleCreateStructure} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="label">Fee Name *</label>
                  <input className="input" placeholder="e.g. Annual Tuition Fee" required value={structureForm.name} onChange={e => setStructureForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Academic Year *</label>
                  <select
                    className="input"
                    required
                    value={structureForm.academicYearId}
                    onChange={e => setStructureForm(f => ({ ...f, academicYearId: e.target.value }))}
                  >
                    <option value="">Select Year</option>
                    {academicYears.map((ay: any) => (
                      <option key={ay.id} value={ay.id}>
                        {ay.name || ay.year}{ay.isCurrent ? ' (Current)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Amount (₹) *</label>
                  <input type="number" className="input" placeholder="0" required value={structureForm.amount} onChange={e => setStructureForm(f => ({ ...f, amount: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Optional</label>
                  <div className="flex items-center gap-2 h-10">
                    <input
                      id="isOptional"
                      type="checkbox"
                      checked={!!structureForm.isOptional}
                      onChange={e => setStructureForm(f => ({ ...f, isOptional: e.target.checked }))}
                    />
                    <label htmlFor="isOptional" className="text-sm text-gray-700">Optional fee</label>
                  </div>
                </div>
                <div>
                  <label className="label">Due Date</label>
                  <input type="date" className="input" value={structureForm.dueDate} onChange={e => setStructureForm(f => ({ ...f, dueDate: e.target.value }))} />
                </div>
                <div className="col-span-2">
                  <label className="label">Description</label>
                  <textarea className="input" rows={2} value={structureForm.description} onChange={e => setStructureForm(f => ({ ...f, description: e.target.value }))} />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowStructureModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={submittingStructure} className="btn-primary disabled:opacity-50">
                  {submittingStructure ? 'Creating...' : 'Create Structure'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-semibold">Record Payment</h2>
              <button onClick={() => setShowPaymentModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>
            <form onSubmit={handleRecordPayment} className="p-6 space-y-4">
              <div>
                <label className="label">Student *</label>
                <select className="input" required value={paymentForm.studentId} onChange={e => setPaymentForm(f => ({ ...f, studentId: e.target.value }))}>
                  <option value="">Select Student</option>
                  {students.map((s: any) => <option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.admissionNo})</option>)}
                </select>
              </div>
              <div>
                <label className="label">Fee Structure</label>
                <select className="input" value={paymentForm.feeStructureId} onChange={e => setPaymentForm(f => ({ ...f, feeStructureId: e.target.value }))}>
                  <option value="">Select Fee Structure</option>
                  {structures.map((s: any) => <option key={s.id} value={s.id}>{s.name} (₹{s.amount})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Amount (₹) *</label>
                  <input type="number" className="input" required value={paymentForm.amount} onChange={e => setPaymentForm(f => ({ ...f, amount: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Payment Date</label>
                  <input type="date" className="input" value={paymentForm.paymentDate} onChange={e => setPaymentForm(f => ({ ...f, paymentDate: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="label">Payment Mode</label>
                <select className="input" value={paymentForm.paymentMode} onChange={e => setPaymentForm(f => ({ ...f, paymentMode: e.target.value }))}>
                  <option value="CASH">Cash</option>
                  <option value="ONLINE">Online</option>
                  <option value="CHEQUE">Cheque</option>
                  <option value="CARD">Card</option>
                </select>
              </div>
              <div>
                <label className="label">Transaction / Receipt ID</label>
                <input className="input" placeholder="Optional" value={paymentForm.transactionId} onChange={e => setPaymentForm(f => ({ ...f, transactionId: e.target.value }))} />
              </div>
              <div>
                <label className="label">Remarks</label>
                <textarea className="input" rows={2} value={paymentForm.remarks} onChange={e => setPaymentForm(f => ({ ...f, remarks: e.target.value }))} />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowPaymentModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={submittingPayment} className="btn-primary disabled:opacity-50">
                  {submittingPayment ? 'Saving...' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
