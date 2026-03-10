'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast, { Toaster } from 'react-hot-toast'
import { attendanceAPI, metadataAPI, studentAPI } from '@/lib/api'

type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED'

const statusColors: Record<string, string> = {
  PRESENT: 'bg-green-100 text-green-800',
  ABSENT: 'bg-red-100 text-red-800',
  LATE: 'bg-yellow-100 text-yellow-800',
  EXCUSED: 'bg-blue-100 text-blue-800',
}

export default function AttendancePage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'view' | 'mark'>('view')

  // View state
  const [loading, setLoading] = useState(true)
  const [attendance, setAttendance] = useState<any[]>([])
  const [filterClass, setFilterClass] = useState('')
  const [filterDate, setFilterDate] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  // Mark state
  const [classes, setClasses] = useState<any[]>([])
  const [markClass, setMarkClass] = useState('')
  const [markDate, setMarkDate] = useState(new Date().toISOString().split('T')[0])
  const [classStudents, setClassStudents] = useState<any[]>([])
  const [studentStatuses, setStudentStatuses] = useState<Record<string, AttendanceStatus>>({})
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [myChildren, setMyChildren] = useState<any[]>([])

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (!userData) { router.push('/auth/login'); return }
    const parsedUser = JSON.parse(userData)
    setUser(parsedUser)
    if (parsedUser.role === 'PARENT') {
      studentAPI.getAll({ parentUserId: parsedUser.id, limit: 20 }).then(res => {
        setMyChildren(res.data?.data?.students || [])
      }).catch(() => {})
    }
    fetchAttendance(
      parsedUser.role === 'STUDENT' && parsedUser.profile?.id
        ? { studentId: parsedUser.profile.id }
        : {}
    )
    fetchClasses()
  }, [router])

  const fetchAttendance = async (params?: any) => {
    setLoading(true)
    try {
      const response = await attendanceAPI.getAll({ page: 1, limit: 100, ...params })
      setAttendance(response.data?.data?.attendance || [])
    } catch {
      toast.error('Failed to load attendance records')
    } finally {
      setLoading(false)
    }
  }

  const fetchClasses = async () => {
    try {
      const res = await metadataAPI.getClasses()
      setClasses(res.data?.data?.classes || res.data?.classes || [])
    } catch { /* ignore */ }
  }

  const handleFilterApply = () => {
    const params: any = {}
    if (filterClass) params.classId = filterClass
    if (filterDate) params.date = filterDate
    if (filterStatus) params.status = filterStatus
    fetchAttendance(params)
  }

  const handleLoadStudents = async () => {
    if (!markClass) { toast.error('Please select a class'); return }
    setLoadingStudents(true)
    try {
      const res = await studentAPI.getByClass(markClass)
      const students = res.data?.data?.students || res.data?.students || []
      setClassStudents(students)
      const initial: Record<string, AttendanceStatus> = {}
      students.forEach((s: any) => { initial[s.id] = 'PRESENT' })
      setStudentStatuses(initial)
    } catch {
      toast.error('Failed to load students')
    } finally {
      setLoadingStudents(false)
    }
  }

  const handleBulkMark = async () => {
    if (!markClass || !markDate || classStudents.length === 0) {
      toast.error('Please select class, date and load students first')
      return
    }
    setSubmitting(true)
    try {
      const records = classStudents.map((s: any) => ({
        studentId: s.id,
        classId: markClass,
        date: markDate,
        status: studentStatuses[s.id] || 'PRESENT',
      }))
      await attendanceAPI.bulkMarkAttendance({ records })
      toast.success('Attendance marked successfully')
      setClassStudents([])
      setStudentStatuses({})
      setMarkClass('')
      fetchAttendance()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to mark attendance')
    } finally {
      setSubmitting(false)
    }
  }

  const presentCount = attendance.filter(r => r.status === 'PRESENT').length
  const absentCount = attendance.filter(r => r.status === 'ABSENT').length
  const lateCount = attendance.filter(r => r.status === 'LATE').length
  const attendancePct = attendance.length > 0
    ? Math.round(((presentCount + lateCount) / attendance.length) * 100)
    : 0

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <Toaster position="top-right" />
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
          <Link href="/dashboard" className="text-sm text-primary-600 hover:text-primary-700">
            ← Back to Dashboard
          </Link>
        </div>

        {/* Parent: My Children Banner */}
        {user?.role === 'PARENT' && (
          <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
            <p className="text-sm font-semibold text-blue-800 mb-2">My Children</p>
            {myChildren.length === 0 ? (
              <p className="text-sm text-blue-600">No children linked to your account yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {myChildren.map((child: any) => (
                  <Link
                    key={child.id}
                    href={`/students/${child.id}`}
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-blue-300 rounded-full text-sm text-blue-700 hover:bg-blue-100 transition-colors"
                  >
                    <span className="font-medium">{child.firstName} {child.lastName}</span>
                    <span className="text-xs text-blue-400">{child.class?.name}</span>
                    <span className="text-xs text-blue-500">→ View Profile</span>
                  </Link>
                ))}
              </div>
            )}
            <p className="text-xs text-blue-500 mt-2">Click a child to view their full attendance, results and fees.</p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card text-center">
            <p className="text-sm text-gray-500">Total Records</p>
            <p className="text-3xl font-bold text-gray-800">{attendance.length}</p>
          </div>
          <div className="card text-center">
            <p className="text-sm text-gray-500">Present</p>
            <p className="text-3xl font-bold text-green-600">{presentCount}</p>
          </div>
          <div className="card text-center">
            <p className="text-sm text-gray-500">Absent</p>
            <p className="text-3xl font-bold text-red-600">{absentCount}</p>
          </div>
          <div className="card text-center">
            <p className="text-sm text-gray-500">Attendance %</p>
            <p className="text-3xl font-bold text-primary-600">{attendancePct}%</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-200">
          {(['view', 'mark'] as const)
            .filter(tab => tab !== 'mark' || !['STUDENT', 'PARENT'].includes(user?.role))
            .map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors capitalize ${
                activeTab === tab
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'view' ? 'View Records' : 'Mark Attendance'}
            </button>
          ))}
        </div>

        {/* View Records Tab */}
        {activeTab === 'view' && (
          <div className="space-y-4">
            {/* Filters */}
            <div className="card">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">Filter Records</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <label className="label">Class</label>
                  <select className="input" value={filterClass} onChange={e => setFilterClass(e.target.value)}>
                    <option value="">All Classes</option>
                    {classes.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Date</label>
                  <input type="date" className="input" value={filterDate} onChange={e => setFilterDate(e.target.value)} />
                </div>
                <div>
                  <label className="label">Status</label>
                  <select className="input" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                    <option value="">All Statuses</option>
                    <option value="PRESENT">Present</option>
                    <option value="ABSENT">Absent</option>
                    <option value="LATE">Late</option>
                    <option value="EXCUSED">Excused</option>
                  </select>
                </div>
                <div className="flex items-end gap-2">
                  <button onClick={handleFilterApply} className="btn-primary flex-1">Apply</button>
                  <button onClick={() => { setFilterClass(''); setFilterDate(''); setFilterStatus(''); fetchAttendance() }} className="btn-secondary">Reset</button>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="card">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                  <span className="ml-3 text-gray-600">Loading records...</span>
                </div>
              ) : attendance.length === 0 ? (
                <p className="text-center text-gray-500 py-12">No attendance records found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        <th className="px-4 py-3">Student</th>
                        <th className="px-4 py-3">Class</th>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {attendance.map((record) => (
                        <tr key={record.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-900">
                            {record.student?.firstName || ''} {record.student?.lastName || ''}
                          </td>
                          <td className="px-4 py-3 text-gray-600">{record.class?.name || '-'}</td>
                          <td className="px-4 py-3 text-gray-600">
                            {record.date ? new Date(record.date).toLocaleDateString() : '-'}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[record.status] || 'bg-gray-100 text-gray-800'}`}>
                              {record.status || '-'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-500 text-xs">{record.remarks || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Mark Attendance Tab */}
        {activeTab === 'mark' && !['STUDENT', 'PARENT'].includes(user?.role) && (
          <div className="space-y-4">
            <div className="card">
              <h2 className="text-lg font-semibold mb-4">Select Class & Date</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="label">Class *</label>
                  <select className="input" value={markClass} onChange={e => { setMarkClass(e.target.value); setClassStudents([]) }}>
                    <option value="">Select Class</option>
                    {classes.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Date *</label>
                  <input type="date" className="input" value={markDate} onChange={e => setMarkDate(e.target.value)} />
                </div>
                <div className="flex items-end">
                  <button onClick={handleLoadStudents} disabled={loadingStudents || !markClass} className="btn-primary w-full disabled:opacity-50">
                    {loadingStudents ? 'Loading...' : 'Load Students'}
                  </button>
                </div>
              </div>
            </div>

            {classStudents.length > 0 && (
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Mark Attendance ({classStudents.length} students)</h2>
                  <div className="flex gap-2">
                    <button
                      className="text-xs px-3 py-1 rounded bg-green-100 text-green-700 hover:bg-green-200"
                      onClick={() => {
                        const all: Record<string, AttendanceStatus> = {}
                        classStudents.forEach((s: any) => { all[s.id] = 'PRESENT' })
                        setStudentStatuses(all)
                      }}
                    >
                      Mark All Present
                    </button>
                    <button
                      className="text-xs px-3 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200"
                      onClick={() => {
                        const all: Record<string, AttendanceStatus> = {}
                        classStudents.forEach((s: any) => { all[s.id] = 'ABSENT' })
                        setStudentStatuses(all)
                      }}
                    >
                      Mark All Absent
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        <th className="px-4 py-3">#</th>
                        <th className="px-4 py-3">Admission No</th>
                        <th className="px-4 py-3">Name</th>
                        <th className="px-4 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {classStudents.map((student: any, index: number) => (
                        <tr key={student.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-gray-500">{index + 1}</td>
                          <td className="px-4 py-3 text-gray-600">{student.admissionNo || '-'}</td>
                          <td className="px-4 py-3 font-medium text-gray-900">
                            {student.firstName || ''} {student.lastName || ''}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2 flex-wrap">
                              {(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'] as AttendanceStatus[]).map(s => (
                                <button
                                  key={s}
                                  onClick={() => setStudentStatuses(prev => ({ ...prev, [student.id]: s }))}
                                  className={`px-2 py-1 rounded text-xs font-medium border transition-colors ${
                                    studentStatuses[student.id] === s
                                      ? statusColors[s] + ' border-transparent'
                                      : 'bg-white text-gray-400 border-gray-300 hover:border-gray-400'
                                  }`}
                                >
                                  {s}
                                </button>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 flex justify-end">
                  <button onClick={handleBulkMark} disabled={submitting} className="btn-primary disabled:opacity-50 px-8">
                    {submitting ? 'Submitting...' : 'Submit Attendance'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
