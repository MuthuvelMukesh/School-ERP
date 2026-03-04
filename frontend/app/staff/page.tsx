'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast, { Toaster } from 'react-hot-toast'
import { staffAPI } from '@/lib/api'

export default function StaffPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'list' | 'leaves'>('list')
  const [loading, setLoading] = useState(true)
  const [staff, setStaff] = useState<any[]>([])
  const [leaves, setLeaves] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all')

  // Add Staff Modal
  const [showAddModal, setShowAddModal] = useState(false)
  const [staffForm, setStaffForm] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    employeeId: '', designation: '', department: '',
    joinDate: '', salary: '', role: 'TEACHER'
  })
  const [submittingStaff, setSubmittingStaff] = useState(false)

  // Apply Leave Modal
  const [showLeaveModal, setShowLeaveModal] = useState(false)
  const [leaveForm, setLeaveForm] = useState({
    staffId: '', leaveType: 'SICK', fromDate: '', toDate: '', reason: ''
  })
  const [submittingLeave, setSubmittingLeave] = useState(false)

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (!userData) { router.push('/auth/login'); return }
    fetchStaff()
  }, [router])

  const fetchStaff = async () => {
    setLoading(true)
    try {
      const response = await staffAPI.getAll({ page: 1, limit: 200 })
      const staffList = response.data?.data?.staff || []
      setStaff(staffList)

      // Fetch leaves for all staff
      const allLeaves: any[] = []
      await Promise.allSettled(
        staffList.slice(0, 20).map(async (s: any) => {
          try {
            const lRes = await staffAPI.getLeaves(s.id)
            const lv = lRes.data?.data?.leaves || []
            lv.forEach((l: any) => allLeaves.push({ ...l, staffName: `${s.firstName} ${s.lastName}`, staffId: s.id }))
          } catch {}
        })
      )
      setLeaves(allLeaves)
    } catch {
      toast.error('Failed to load staff')
    } finally {
      setLoading(false)
    }
  }

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmittingStaff(true)
    try {
      await staffAPI.create({ ...staffForm, salary: staffForm.salary ? Number(staffForm.salary) : undefined })
      toast.success('Staff member added successfully')
      setShowAddModal(false)
      setStaffForm({ firstName: '', lastName: '', email: '', phone: '', employeeId: '', designation: '', department: '', joinDate: '', salary: '', role: 'TEACHER' })
      fetchStaff()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to add staff')
    } finally {
      setSubmittingStaff(false)
    }
  }

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmittingLeave(true)
    try {
      await staffAPI.applyLeave(leaveForm.staffId, {
        leaveType: leaveForm.leaveType,
        fromDate: leaveForm.fromDate,
        toDate: leaveForm.toDate,
        reason: leaveForm.reason,
      })
      toast.success('Leave application submitted')
      setShowLeaveModal(false)
      setLeaveForm({ staffId: '', leaveType: 'SICK', fromDate: '', toDate: '', reason: '' })
      fetchStaff()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to apply leave')
    } finally {
      setSubmittingLeave(false)
    }
  }

  const handleLeaveStatus = async (leaveId: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      await staffAPI.updateLeaveStatus(leaveId, { status })
      toast.success(`Leave ${status.toLowerCase()}`)
      setLeaves(prev => prev.map(l => l.id === leaveId ? { ...l, status } : l))
    } catch {
      toast.error('Failed to update leave status')
    }
  }

  const filteredStaff = staff.filter(s => {
    const matchesSearch = !searchQuery ||
      `${s.firstName} ${s.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.employeeId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.designation || '').toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = filterActive === 'all' ||
      (filterActive === 'active' ? s.isActive : !s.isActive)
    return matchesSearch && matchesFilter
  })

  const activeCount = staff.filter(s => s.isActive).length

  const leaveStatusColor: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    APPROVED: 'bg-green-100 text-green-800',
    REJECTED: 'bg-red-100 text-red-800',
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <Toaster position="top-right" />
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Staff Management</h1>
          <Link href="/dashboard" className="text-sm text-primary-600 hover:text-primary-700">
            ← Back to Dashboard
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card text-center">
            <p className="text-sm text-gray-500">Total Staff</p>
            <p className="text-3xl font-bold text-gray-800">{staff.length}</p>
          </div>
          <div className="card text-center">
            <p className="text-sm text-gray-500">Active</p>
            <p className="text-3xl font-bold text-green-600">{activeCount}</p>
          </div>
          <div className="card text-center">
            <p className="text-sm text-gray-500">Leave Requests</p>
            <p className="text-3xl font-bold text-yellow-600">{leaves.filter(l => l.status === 'PENDING').length}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-200">
          {(['list', 'leaves'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'list' ? 'Staff List' : 'Leave Management'}
              {tab === 'leaves' && leaves.filter(l => l.status === 'PENDING').length > 0 && (
                <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  {leaves.filter(l => l.status === 'PENDING').length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Staff List Tab */}
        {activeTab === 'list' && (
          <div className="space-y-4">
            <div className="card">
              <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
                <div className="flex gap-3 flex-1">
                  <input
                    type="text"
                    className="input max-w-xs"
                    placeholder="Search name, ID, designation..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                  <select className="input max-w-xs" value={filterActive} onChange={e => setFilterActive(e.target.value as any)}>
                    <option value="all">All Staff</option>
                    <option value="active">Active Only</option>
                    <option value="inactive">Inactive Only</option>
                  </select>
                </div>
                <button onClick={() => setShowAddModal(true)} className="btn-primary text-sm whitespace-nowrap">
                  + Add Staff
                </button>
              </div>
            </div>

            <div className="card">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                  <span className="ml-3 text-gray-600">Loading staff...</span>
                </div>
              ) : filteredStaff.length === 0 ? (
                <p className="text-center text-gray-500 py-12">No staff found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        <th className="px-4 py-3">Name</th>
                        <th className="px-4 py-3">Employee ID</th>
                        <th className="px-4 py-3">Designation</th>
                        <th className="px-4 py-3">Department</th>
                        <th className="px-4 py-3">Email</th>
                        <th className="px-4 py-3">Phone</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Joined</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredStaff.map(member => (
                        <tr key={member.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-900">
                            {`${member.firstName || ''} ${member.lastName || ''}`.trim() || '-'}
                          </td>
                          <td className="px-4 py-3 text-gray-600 font-mono text-xs">{member.employeeId || '-'}</td>
                          <td className="px-4 py-3 text-gray-600">{member.designation || '-'}</td>
                          <td className="px-4 py-3 text-gray-600">{member.department || '-'}</td>
                          <td className="px-4 py-3 text-gray-500 text-xs">{member.email || '-'}</td>
                          <td className="px-4 py-3 text-gray-600">{member.phone || '-'}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${member.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                              {member.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-500 text-xs">
                            {member.joinDate ? new Date(member.joinDate).toLocaleDateString() : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="text-xs text-gray-400 mt-3">Showing {filteredStaff.length} of {staff.length} staff members</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Leave Management Tab */}
        {activeTab === 'leaves' && (
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Leave Requests</h2>
              <button onClick={() => setShowLeaveModal(true)} className="btn-primary text-sm">+ Apply Leave</button>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : leaves.length === 0 ? (
              <p className="text-center text-gray-500 py-12">No leave requests found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      <th className="px-4 py-3">Staff</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">From</th>
                      <th className="px-4 py-3">To</th>
                      <th className="px-4 py-3">Reason</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {leaves.map((leave, idx) => (
                      <tr key={leave.id || idx} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{leave.staffName || leave.staff?.firstName + ' ' + leave.staff?.lastName || '-'}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            {leave.leaveType || '-'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{leave.fromDate ? new Date(leave.fromDate).toLocaleDateString() : '-'}</td>
                        <td className="px-4 py-3 text-gray-600">{leave.toDate ? new Date(leave.toDate).toLocaleDateString() : '-'}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs max-w-xs truncate">{leave.reason || '-'}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${leaveStatusColor[leave.status] || 'bg-gray-100 text-gray-800'}`}>
                            {leave.status || 'PENDING'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {(!leave.status || leave.status === 'PENDING') && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleLeaveStatus(leave.id, 'APPROVED')}
                                className="text-xs px-2 py-1 rounded bg-green-100 text-green-700 hover:bg-green-200"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleLeaveStatus(leave.id, 'REJECTED')}
                                className="text-xs px-2 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-semibold">Add Staff Member</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>
            <form onSubmit={handleAddStaff} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">First Name *</label>
                  <input className="input" required value={staffForm.firstName} onChange={e => setStaffForm(f => ({ ...f, firstName: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Last Name *</label>
                  <input className="input" required value={staffForm.lastName} onChange={e => setStaffForm(f => ({ ...f, lastName: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Email *</label>
                  <input type="email" className="input" required value={staffForm.email} onChange={e => setStaffForm(f => ({ ...f, email: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Phone</label>
                  <input type="tel" className="input" value={staffForm.phone} onChange={e => setStaffForm(f => ({ ...f, phone: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Employee ID *</label>
                  <input className="input" required value={staffForm.employeeId} onChange={e => setStaffForm(f => ({ ...f, employeeId: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Role</label>
                  <select className="input" value={staffForm.role} onChange={e => setStaffForm(f => ({ ...f, role: e.target.value }))}>
                    <option value="TEACHER">Teacher</option>
                    <option value="ADMIN">Admin</option>
                    <option value="ACCOUNTANT">Accountant</option>
                    <option value="LIBRARIAN">Librarian</option>
                    <option value="SUPPORT">Support</option>
                  </select>
                </div>
                <div>
                  <label className="label">Designation</label>
                  <input className="input" placeholder="e.g. Senior Teacher" value={staffForm.designation} onChange={e => setStaffForm(f => ({ ...f, designation: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Department</label>
                  <input className="input" placeholder="e.g. Mathematics" value={staffForm.department} onChange={e => setStaffForm(f => ({ ...f, department: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Join Date</label>
                  <input type="date" className="input" value={staffForm.joinDate} onChange={e => setStaffForm(f => ({ ...f, joinDate: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Salary</label>
                  <input type="number" className="input" placeholder="Monthly salary" value={staffForm.salary} onChange={e => setStaffForm(f => ({ ...f, salary: e.target.value }))} />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={submittingStaff} className="btn-primary disabled:opacity-50">
                  {submittingStaff ? 'Adding...' : 'Add Staff'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Apply Leave Modal */}
      {showLeaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-semibold">Apply for Leave</h2>
              <button onClick={() => setShowLeaveModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>
            <form onSubmit={handleApplyLeave} className="p-6 space-y-4">
              <div>
                <label className="label">Staff Member *</label>
                <select className="input" required value={leaveForm.staffId} onChange={e => setLeaveForm(f => ({ ...f, staffId: e.target.value }))}>
                  <option value="">Select Staff</option>
                  {staff.map(s => <option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.employeeId})</option>)}
                </select>
              </div>
              <div>
                <label className="label">Leave Type</label>
                <select className="input" value={leaveForm.leaveType} onChange={e => setLeaveForm(f => ({ ...f, leaveType: e.target.value }))}>
                  <option value="SICK">Sick Leave</option>
                  <option value="CASUAL">Casual Leave</option>
                  <option value="EARNED">Earned Leave</option>
                  <option value="MATERNITY">Maternity Leave</option>
                  <option value="PATERNITY">Paternity Leave</option>
                  <option value="UNPAID">Unpaid Leave</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">From Date *</label>
                  <input type="date" className="input" required value={leaveForm.fromDate} onChange={e => setLeaveForm(f => ({ ...f, fromDate: e.target.value }))} />
                </div>
                <div>
                  <label className="label">To Date *</label>
                  <input type="date" className="input" required value={leaveForm.toDate} onChange={e => setLeaveForm(f => ({ ...f, toDate: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="label">Reason *</label>
                <textarea className="input" rows={3} required value={leaveForm.reason} onChange={e => setLeaveForm(f => ({ ...f, reason: e.target.value }))} />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowLeaveModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={submittingLeave} className="btn-primary disabled:opacity-50">
                  {submittingLeave ? 'Submitting...' : 'Submit Leave'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}