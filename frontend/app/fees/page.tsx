'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast, { Toaster } from 'react-hot-toast'
import { feeAPI, metadataAPI, studentAPI } from '@/lib/api'

export default function FeesPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'structures' | 'payments' | 'defaulters'>('structures')
  const [loading, setLoading] = useState(true)
  const [structures, setStructures] = useState<any[]>([])
  const [payments, setPayments] = useState<any[]>([])
  const [defaulters, setDefaulters] = useState<any[]>([])
  const [classes, setClasses] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])

  // Structure modal
  const [showStructureModal, setShowStructureModal] = useState(false)
  const [structureForm, setStructureForm] = useState({
    name: '', feeType: 'TUITION', classId: '', amount: '',
    academicYear: '', term: '', dueDate: '', description: ''
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
    const userData = localStorage.getItem('user')
    if (!userData) { router.push('/auth/login'); return }
    fetchAll()
  }, [router])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [structuresRes, paymentsRes, defaultersRes, classesRes, studentsRes] = await Promise.all([
        feeAPI.getAllStructures(),
        feeAPI.getAllPayments({ page: 1, limit: 100 }),
        feeAPI.getDefaulters(),
        metadataAPI.getClasses(),
        studentAPI.getAll({ page: 1, limit: 200 }),
      ])
      setStructures(structuresRes.data?.data?.structures || [])
      setPayments(paymentsRes.data?.data?.payments || [])
      setDefaulters(defaultersRes.data?.data?.defaulters || [])
      setClasses(classesRes.data?.data?.classes || classesRes.data?.classes || [])
      setStudents(studentsRes.data?.data?.students || [])
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
      await feeAPI.createStructure({ ...structureForm, amount: Number(structureForm.amount) })
      toast.success('Fee structure created')
      setShowStructureModal(false)
      setStructureForm({ name: '', feeType: 'TUITION', classId: '', amount: '', academicYear: '', term: '', dueDate: '', description: '' })
      fetchAll()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to create fee structure')
    } finally {
      setSubmittingStructure(false)
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
    DD: 'bg-purple-100 text-purple-800',
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

        {/* Stats */}
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

        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-200">
          {(['structures', 'payments', 'defaulters'] as const).map(tab => (
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
          ))}
        </div>

        {/* Fee Structures Tab */}
        {activeTab === 'structures' && (
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Fee Structures</h2>
              <button onClick={() => setShowStructureModal(true)} className="btn-primary text-sm">+ Add Structure</button>
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
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Class</th>
                      <th className="px-4 py-3">Amount</th>
                      <th className="px-4 py-3">Academic Year</th>
                      <th className="px-4 py-3">Due Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {structures.map(s => (
                      <tr key={s.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{s.name}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
                            {s.feeType || '-'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{s.class?.name || 'All'}</td>
                        <td className="px-4 py-3 font-semibold text-green-700">₹{(s.amount || 0).toLocaleString()}</td>
                        <td className="px-4 py-3 text-gray-600">{s.academicYear || '-'}</td>
                        <td className="px-4 py-3 text-gray-600">{s.dueDate ? new Date(s.dueDate).toLocaleDateString() : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Payments Tab */}
        {activeTab === 'payments' && (
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Payment Records</h2>
              <button onClick={() => setShowPaymentModal(true)} className="btn-primary text-sm">+ Record Payment</button>
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
                  <label className="label">Fee Type</label>
                  <select className="input" value={structureForm.feeType} onChange={e => setStructureForm(f => ({ ...f, feeType: e.target.value }))}>
                    <option value="TUITION">Tuition</option>
                    <option value="HOSTEL">Hostel</option>
                    <option value="TRANSPORT">Transport</option>
                    <option value="LIBRARY">Library</option>
                    <option value="SPORTS">Sports</option>
                    <option value="EXAM">Exam</option>
                    <option value="MISCELLANEOUS">Miscellaneous</option>
                  </select>
                </div>
                <div>
                  <label className="label">Class</label>
                  <select className="input" value={structureForm.classId} onChange={e => setStructureForm(f => ({ ...f, classId: e.target.value }))}>
                    <option value="">All Classes</option>
                    {classes.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Amount (₹) *</label>
                  <input type="number" className="input" placeholder="0" required value={structureForm.amount} onChange={e => setStructureForm(f => ({ ...f, amount: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Academic Year</label>
                  <input className="input" placeholder="2025-2026" value={structureForm.academicYear} onChange={e => setStructureForm(f => ({ ...f, academicYear: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Term</label>
                  <select className="input" value={structureForm.term} onChange={e => setStructureForm(f => ({ ...f, term: e.target.value }))}>
                    <option value="">None</option>
                    <option value="TERM1">Term 1</option>
                    <option value="TERM2">Term 2</option>
                    <option value="TERM3">Term 3</option>
                    <option value="ANNUAL">Annual</option>
                  </select>
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
                  <option value="DD">Demand Draft</option>
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
