'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import toast, { Toaster } from 'react-hot-toast'
import { studentAPI } from '@/lib/api'

type Tab = 'overview' | 'attendance' | 'exams' | 'fees'

const statusColors: Record<string, string> = {
  PRESENT: 'bg-green-100 text-green-800',
  ABSENT: 'bg-red-100 text-red-800',
  LATE: 'bg-yellow-100 text-yellow-800',
  EXCUSED: 'bg-blue-100 text-blue-800',
}

const gradeColor = (marks: number, total: number) => {
  const pct = total > 0 ? (marks / total) * 100 : 0
  if (pct >= 90) return 'text-green-700 font-bold'
  if (pct >= 75) return 'text-blue-700 font-semibold'
  if (pct >= 60) return 'text-yellow-700'
  return 'text-red-600 font-semibold'
}

export default function StudentDetailPage() {
  const router = useRouter()
  const params = useParams()
  const studentId = params.id as string

  const [student, setStudent] = useState<any>(null)
  const [attendance, setAttendance] = useState<any[]>([])
  const [results, setResults] = useState<any[]>([])
  const [fees, setFees] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [tabLoading, setTabLoading] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (!userData) { router.push('/auth/login'); return }
    setUser(JSON.parse(userData))
    fetchStudent()
  }, [studentId])

  const fetchStudent = async () => {
    setLoading(true)
    try {
      const res = await studentAPI.getById(studentId)
      setStudent(res.data?.data?.student || res.data?.student)
    } catch {
      toast.error('Student not found')
      router.push('/students')
    } finally {
      setLoading(false)
    }
  }

  const fetchTab = async (tab: Tab) => {
    setActiveTab(tab)
    if (tab === 'overview') return
    setTabLoading(true)
    try {
      if (tab === 'attendance' && attendance.length === 0) {
        const res = await studentAPI.getAttendance(studentId, { limit: 100 })
        setAttendance(res.data?.data?.attendance || [])
      }
      if (tab === 'exams' && results.length === 0) {
        const res = await studentAPI.getResults(studentId)
        setResults(res.data?.data?.results || [])
      }
      if (tab === 'fees' && fees.length === 0) {
        const res = await studentAPI.getFees(studentId)
        setFees(res.data?.data?.fees || res.data?.data?.payments || [])
      }
    } catch {
      toast.error(`Failed to load ${tab} data`)
    } finally {
      setTabLoading(false)
    }
  }

  const attendanceStats = {
    total: attendance.length,
    present: attendance.filter(a => a.status === 'PRESENT').length,
    absent: attendance.filter(a => a.status === 'ABSENT').length,
    late: attendance.filter(a => a.status === 'LATE').length,
  }
  const attendancePct = attendanceStats.total > 0
    ? Math.round((attendanceStats.present / attendanceStats.total) * 100)
    : null

  const totalFeesDue = fees.reduce((sum, f) => sum + (f.dueAmount || 0), 0)
  const totalFeesPaid = fees.reduce((sum, f) => sum + (f.amount || 0), 0)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-3 text-gray-500">Loading student...</p>
        </div>
      </div>
    )
  }

  if (!student) return null

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <Toaster position="top-right" />
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <Link href="/students" className="text-sm text-primary-600 hover:underline">← Back to Students</Link>
            <h1 className="text-2xl font-bold text-gray-900 mt-1">
              {student.firstName} {student.lastName}
            </h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-sm text-gray-500 font-mono">{student.admissionNo}</span>
              <span className="text-sm text-gray-500">{student.class?.name || 'No class'}</span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${student.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                {student.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
          {['ADMIN', 'PRINCIPAL'].includes(user?.role) && (
            <Link href={`/students`} className="btn-secondary text-sm">Edit Student</Link>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-gray-200">
          {(['overview', 'attendance', 'exams', 'fees'] as Tab[]).map(tab => (
            <button
              key={tab}
              onClick={() => fetchTab(tab)}
              className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors capitalize ${
                activeTab === tab
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab spinner */}
        {tabLoading && (
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
            Loading...
          </div>
        )}

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Personal Info */}
            <div className="card space-y-3">
              <h2 className="text-base font-semibold text-gray-800 border-b pb-2">Personal Information</h2>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-500">Full Name</dt>
                  <dd className="font-medium text-gray-900">{student.firstName} {student.lastName}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Admission No</dt>
                  <dd className="font-mono text-gray-900">{student.admissionNo || '—'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Class</dt>
                  <dd className="text-gray-900">{student.class?.name || '—'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Gender</dt>
                  <dd className="text-gray-900">{student.gender || '—'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Date of Birth</dt>
                  <dd className="text-gray-900">
                    {student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : '—'}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Blood Group</dt>
                  <dd className="text-gray-900">{student.bloodGroup || '—'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Phone</dt>
                  <dd className="text-gray-900">{student.phone || '—'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Email</dt>
                  <dd className="text-gray-900">{student.user?.email || '—'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Admission Date</dt>
                  <dd className="text-gray-900">
                    {student.admissionDate ? new Date(student.admissionDate).toLocaleDateString() : '—'}
                  </dd>
                </div>
                {student.address && (
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Address</dt>
                    <dd className="text-gray-900 text-right max-w-[60%]">{student.address}</dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Guardian Info */}
            <div className="space-y-4">
              <div className="card space-y-3">
                <h2 className="text-base font-semibold text-gray-800 border-b pb-2">Guardian Information</h2>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Name</dt>
                    <dd className="font-medium text-gray-900">{student.guardianName || '—'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Relation</dt>
                    <dd className="text-gray-900">{student.guardianRelation || '—'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Phone</dt>
                    <dd className="text-gray-900">{student.guardianPhone || '—'}</dd>
                  </div>
                  {student.parent && (
                    <>
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Parent Account</dt>
                        <dd className="text-gray-900">{student.parent.firstName} {student.parent.lastName}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Parent Phone</dt>
                        <dd className="text-gray-900">{student.parent.phone || '—'}</dd>
                      </div>
                    </>
                  )}
                </dl>
              </div>

              {/* Quick stats */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => fetchTab('attendance')}
                  className="card text-center hover:shadow-md transition-shadow cursor-pointer"
                >
                  <p className="text-2xl font-bold text-primary-600">
                    {attendancePct !== null ? `${attendancePct}%` : '—'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Attendance</p>
                </button>
                <button
                  onClick={() => fetchTab('exams')}
                  className="card text-center hover:shadow-md transition-shadow cursor-pointer"
                >
                  <p className="text-2xl font-bold text-primary-600">{results.length || '—'}</p>
                  <p className="text-xs text-gray-500 mt-1">Exam Results</p>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ATTENDANCE TAB */}
        {activeTab === 'attendance' && !tabLoading && (
          <div className="space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Total Days', value: attendanceStats.total, color: 'text-gray-800' },
                { label: 'Present', value: attendanceStats.present, color: 'text-green-600' },
                { label: 'Absent', value: attendanceStats.absent, color: 'text-red-600' },
                { label: 'Late', value: attendanceStats.late, color: 'text-yellow-600' },
              ].map(s => (
                <div key={s.label} className="card text-center py-3">
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-gray-500 mt-1">{s.label}</p>
                </div>
              ))}
            </div>
            {attendancePct !== null && (
              <div className="card">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-600 font-medium">Overall Attendance</span>
                  <span className={`font-bold ${attendancePct >= 75 ? 'text-green-600' : 'text-red-600'}`}>{attendancePct}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${attendancePct >= 75 ? 'bg-green-500' : 'bg-red-500'}`}
                    style={{ width: `${attendancePct}%` }}
                  />
                </div>
                {attendancePct < 75 && (
                  <p className="text-xs text-red-600 mt-1">⚠ Below minimum 75% attendance requirement</p>
                )}
              </div>
            )}

            {/* Records table */}
            <div className="card">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Attendance Records</h3>
              {attendance.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No attendance records found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Subject / Period</th>
                        <th className="px-4 py-3">Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {attendance.map((a: any) => (
                        <tr key={a.id} className="hover:bg-gray-50">
                          <td className="px-4 py-2 text-gray-700">{new Date(a.date).toLocaleDateString()}</td>
                          <td className="px-4 py-2">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[a.status] || 'bg-gray-100 text-gray-800'}`}>
                              {a.status}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-gray-600">{a.subject?.name || a.period || '—'}</td>
                          <td className="px-4 py-2 text-gray-500 text-xs">{a.remarks || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* EXAMS TAB */}
        {activeTab === 'exams' && !tabLoading && (
          <div className="card">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Exam Results</h3>
            {results.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No exam results found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      <th className="px-4 py-3">Exam</th>
                      <th className="px-4 py-3">Subject</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Marks</th>
                      <th className="px-4 py-3">Grade</th>
                      <th className="px-4 py-3">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {results.map((r: any) => (
                      <tr key={r.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2 font-medium text-gray-900">{r.examSchedule?.name || '—'}</td>
                        <td className="px-4 py-2 text-gray-600">{r.subject?.name || '—'}</td>
                        <td className="px-4 py-2 text-gray-500 text-xs">
                          {r.examSchedule?.examDate ? new Date(r.examSchedule.examDate).toLocaleDateString() : '—'}
                        </td>
                        <td className={`px-4 py-2 ${gradeColor(r.marksObtained, r.totalMarks || r.examSchedule?.totalMarks || 100)}`}>
                          {r.marksObtained} / {r.totalMarks || r.examSchedule?.totalMarks || '?'}
                        </td>
                        <td className="px-4 py-2">
                          {r.grade && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-indigo-100 text-indigo-800">{r.grade}</span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-gray-500 text-xs">{r.remarks || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* FEES TAB */}
        {activeTab === 'fees' && !tabLoading && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="card text-center">
                <p className="text-2xl font-bold text-green-600">₹{totalFeesPaid.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">Total Paid</p>
              </div>
              <div className="card text-center">
                <p className={`text-2xl font-bold ${totalFeesDue > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                  ₹{totalFeesDue.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">Outstanding</p>
              </div>
            </div>
            <div className="card">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Fee Records</h3>
              {fees.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No fee records found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        <th className="px-4 py-3">Fee Name</th>
                        <th className="px-4 py-3">Amount</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Payment Date</th>
                        <th className="px-4 py-3">Mode</th>
                        <th className="px-4 py-3">Receipt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {fees.map((f: any) => (
                        <tr key={f.id} className="hover:bg-gray-50">
                          <td className="px-4 py-2 font-medium text-gray-900">{f.feeStructure?.name || f.feeName || '—'}</td>
                          <td className="px-4 py-2 font-semibold text-green-700">₹{(f.amount || 0).toLocaleString()}</td>
                          <td className="px-4 py-2">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              f.status === 'PAID' ? 'bg-green-100 text-green-800' :
                              f.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                              f.status === 'OVERDUE' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {f.status || 'PAID'}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-gray-500 text-xs">
                            {f.paymentDate ? new Date(f.paymentDate).toLocaleDateString() : '—'}
                          </td>
                          <td className="px-4 py-2 text-gray-600">{f.paymentMode || '—'}</td>
                          <td className="px-4 py-2 text-gray-500 text-xs font-mono">{f.receiptNo || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
