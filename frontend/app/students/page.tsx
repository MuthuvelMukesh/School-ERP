'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast, { Toaster } from 'react-hot-toast'
import { studentAPI, metadataAPI } from '@/lib/api'

export default function StudentsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [students, setStudents] = useState<any[]>([])
  const [classes, setClasses] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterClass, setFilterClass] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalStudents, setTotalStudents] = useState(0)
  const pageSize = 20

  // Add Student Modal
  const [showAddModal, setShowAddModal] = useState(false)
  const [studentForm, setStudentForm] = useState({
    firstName: '', lastName: '', admissionNo: '', email: '',
    phone: '', dateOfBirth: '', gender: 'MALE', classId: '',
    guardianName: '', guardianPhone: '', guardianRelation: '',
    address: '', bloodGroup: '', admissionDate: new Date().toISOString().split('T')[0]
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (!userData) { router.push('/auth/login'); return }
    fetchClasses()
    fetchStudents(1)
  }, [router])

  const fetchClasses = async () => {
    try {
      const res = await metadataAPI.getClasses()
      setClasses(res.data?.data?.classes || res.data?.classes || [])
    } catch {}
  }

  const fetchStudents = async (page: number, classId?: string) => {
    setLoading(true)
    try {
      const params: any = { page, limit: pageSize }
      if (classId || filterClass) params.classId = classId || filterClass
      const response = await studentAPI.getAll(params)
      setStudents(response.data?.data?.students || [])
      setTotalStudents(response.data?.data?.total || response.data?.data?.students?.length || 0)
      setCurrentPage(page)
    } catch {
      toast.error('Failed to load students')
    } finally {
      setLoading(false)
    }
  }

  const handleFilterApply = () => {
    fetchStudents(1, filterClass)
  }

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await studentAPI.create(studentForm)
      toast.success('Student added successfully')
      setShowAddModal(false)
      setStudentForm({
        firstName: '', lastName: '', admissionNo: '', email: '',
        phone: '', dateOfBirth: '', gender: 'MALE', classId: '',
        guardianName: '', guardianPhone: '', guardianRelation: '',
        address: '', bloodGroup: '', admissionDate: new Date().toISOString().split('T')[0]
      })
      fetchStudents(1)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to add student')
    } finally {
      setSubmitting(false)
    }
  }

  const filteredStudents = students.filter(s => {
    const matchesSearch = !searchQuery ||
      `${s.firstName} ${s.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.admissionNo || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.phone || '').includes(searchQuery)
    const matchesStatus = filterStatus === 'all' ||
      (filterStatus === 'active' ? s.isActive : !s.isActive)
    return matchesSearch && matchesStatus
  })

  const activeCount = students.filter(s => s.isActive).length
  const classCount = new Set(students.filter(s => s.classId).map(s => s.classId)).size

  const totalPages = Math.ceil(totalStudents / pageSize)

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <Toaster position="top-right" />
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Students</h1>
          <div className="flex items-center gap-4">
            <Link href="/students/progression" className="text-sm text-primary-600 hover:text-primary-700">
              Promotion & Transfer
            </Link>
            <Link href="/dashboard" className="text-sm text-primary-600 hover:text-primary-700">
              ← Back to Dashboard
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card text-center">
            <p className="text-sm text-gray-500">Total Students</p>
            <p className="text-3xl font-bold text-gray-800">{totalStudents || students.length}</p>
          </div>
          <div className="card text-center">
            <p className="text-sm text-gray-500">Active</p>
            <p className="text-3xl font-bold text-green-600">{activeCount}</p>
          </div>
          <div className="card text-center">
            <p className="text-sm text-gray-500">Classes</p>
            <p className="text-3xl font-bold text-primary-600">{classCount || classes.length}</p>
          </div>
        </div>

        {/* Filters & Actions */}
        <div className="card">
          <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
            <div className="flex flex-wrap gap-3 flex-1">
              <input
                type="text"
                className="input"
                placeholder="Search name, admission no..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ maxWidth: 240 }}
              />
              <select className="input" style={{ maxWidth: 180 }} value={filterClass} onChange={e => setFilterClass(e.target.value)}>
                <option value="">All Classes</option>
                {classes.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <select className="input" style={{ maxWidth: 150 }} value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)}>
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <button onClick={handleFilterApply} className="btn-primary text-sm">Apply</button>
              <button onClick={() => { setFilterClass(''); setFilterStatus('all'); setSearchQuery(''); fetchStudents(1) }} className="btn-secondary text-sm">Reset</button>
            </div>
            <button onClick={() => setShowAddModal(true)} className="btn-primary text-sm whitespace-nowrap">
              + Add Student
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="card">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <span className="ml-3 text-gray-600">Loading students...</span>
            </div>
          ) : filteredStudents.length === 0 ? (
            <p className="text-center text-gray-500 py-12">No students found.</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      <th className="px-4 py-3">Admission No</th>
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Class</th>
                      <th className="px-4 py-3">Gender</th>
                      <th className="px-4 py-3">Date of Birth</th>
                      <th className="px-4 py-3">Phone</th>
                      <th className="px-4 py-3">Guardian</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredStudents.map(student => (
                      <tr key={student.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-mono text-xs text-gray-600">{student.admissionNo || '-'}</td>
                        <td className="px-4 py-3 font-medium">
                          <Link href={`/students/${student.id}`} className="text-primary-600 hover:underline">
                            {`${student.firstName || ''} ${student.lastName || ''}`.trim() || '-'}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{student.class?.name || '-'}</td>
                        <td className="px-4 py-3 text-gray-600">{student.gender || '-'}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">
                          {student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : '-'}
                        </td>
                        <td className="px-4 py-3 text-gray-600">{student.phone || '-'}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">
                          {student.guardianName || '-'}
                          {student.guardianPhone && <span className="ml-1 text-gray-400">({student.guardianPhone})</span>}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${student.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                            {student.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-xs text-gray-500">
                    Page {currentPage} of {totalPages} — {totalStudents} total students
                  </p>
                  <div className="flex gap-2">
                    <button
                      disabled={currentPage === 1}
                      onClick={() => fetchStudents(currentPage - 1, filterClass)}
                      className="px-3 py-1 text-sm rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-50"
                    >
                      ← Prev
                    </button>
                    <button
                      disabled={currentPage === totalPages}
                      onClick={() => fetchStudents(currentPage + 1, filterClass)}
                      className="px-3 py-1 text-sm rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-50"
                    >
                      Next →
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Add Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-semibold">Add New Student</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>
            <form onSubmit={handleAddStudent} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">First Name *</label>
                  <input className="input" required value={studentForm.firstName} onChange={e => setStudentForm(f => ({ ...f, firstName: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Last Name *</label>
                  <input className="input" required value={studentForm.lastName} onChange={e => setStudentForm(f => ({ ...f, lastName: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Admission No *</label>
                  <input className="input" required value={studentForm.admissionNo} onChange={e => setStudentForm(f => ({ ...f, admissionNo: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Class *</label>
                  <select className="input" required value={studentForm.classId} onChange={e => setStudentForm(f => ({ ...f, classId: e.target.value }))}>
                    <option value="">Select Class</option>
                    {classes.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Date of Birth</label>
                  <input type="date" className="input" value={studentForm.dateOfBirth} onChange={e => setStudentForm(f => ({ ...f, dateOfBirth: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Gender</label>
                  <select className="input" value={studentForm.gender} onChange={e => setStudentForm(f => ({ ...f, gender: e.target.value }))}>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label className="label">Blood Group</label>
                  <select className="input" value={studentForm.bloodGroup} onChange={e => setStudentForm(f => ({ ...f, bloodGroup: e.target.value }))}>
                    <option value="">Not Specified</option>
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Admission Date</label>
                  <input type="date" className="input" value={studentForm.admissionDate} onChange={e => setStudentForm(f => ({ ...f, admissionDate: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Email</label>
                  <input type="email" className="input" value={studentForm.email} onChange={e => setStudentForm(f => ({ ...f, email: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Phone</label>
                  <input type="tel" className="input" value={studentForm.phone} onChange={e => setStudentForm(f => ({ ...f, phone: e.target.value }))} />
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Guardian Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Guardian Name *</label>
                    <input className="input" required value={studentForm.guardianName} onChange={e => setStudentForm(f => ({ ...f, guardianName: e.target.value }))} />
                  </div>
                  <div>
                    <label className="label">Relation</label>
                    <select className="input" value={studentForm.guardianRelation} onChange={e => setStudentForm(f => ({ ...f, guardianRelation: e.target.value }))}>
                      <option value="">Select</option>
                      <option value="FATHER">Father</option>
                      <option value="MOTHER">Mother</option>
                      <option value="GUARDIAN">Guardian</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Guardian Phone</label>
                    <input type="tel" className="input" value={studentForm.guardianPhone} onChange={e => setStudentForm(f => ({ ...f, guardianPhone: e.target.value }))} />
                  </div>
                  <div className="col-span-2">
                    <label className="label">Address</label>
                    <textarea className="input" rows={2} value={studentForm.address} onChange={e => setStudentForm(f => ({ ...f, address: e.target.value }))} />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={submitting} className="btn-primary disabled:opacity-50">
                  {submitting ? 'Adding...' : 'Add Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
