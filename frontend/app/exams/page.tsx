'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast, { Toaster } from 'react-hot-toast'
import { examAPI, metadataAPI, studentAPI } from '@/lib/api'
import { useAuth } from '@/lib/useAuth'

export default function ExamsPage() {
  const router = useRouter()
  const { ready } = useAuth({ roles: ['ADMIN', 'PRINCIPAL', 'TEACHER', 'STUDENT', 'PARENT'] })
  const [activeTab, setActiveTab] = useState<'schedules' | 'results'>('schedules')
  const [loading, setLoading] = useState(true)
  const [schedules, setSchedules] = useState<any[]>([])
  const [results, setResults] = useState<any[]>([])
  const [classes, setClasses] = useState<any[]>([])
  const [subjects, setSubjects] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [academicYears, setAcademicYears] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)
  const [myChildren, setMyChildren] = useState<any[]>([])
  const [selectedChildId, setSelectedChildId] = useState('')

  // Schedule modal
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [scheduleForm, setScheduleForm] = useState({
    name: '',
    examType: 'UNIT_TEST',
    classId: '',
    academicYearId: '',
    startDate: '',
    endDate: '',
    totalMarks: '100',
    passingMarks: '35',
  })
  const [submittingSchedule, setSubmittingSchedule] = useState(false)

  // Result modal
  const [showResultModal, setShowResultModal] = useState(false)
  const [resultForm, setResultForm] = useState({
    examScheduleId: '', studentId: '', subjectId: '',
    marksObtained: '', remarks: ''
  })
  const [submittingResult, setSubmittingResult] = useState(false)

  useEffect(() => {
    if (!ready) return
    const userData = localStorage.getItem('user')
    if (!userData) { router.push('/auth/login'); return }
    const parsedUser = JSON.parse(userData)
    setUser(parsedUser)
    if (parsedUser.role === 'PARENT') {
      studentAPI.getAll({ parentUserId: parsedUser.id, limit: 20 }).then(res => {
        const kids = res.data?.data?.students || []
        setMyChildren(kids)
        if (!selectedChildId && kids.length > 0) setSelectedChildId(kids[0].id)
      }).catch(() => {})
    }
    fetchAll(parsedUser)
  }, [ready, router])

  useEffect(() => {
    if (user?.role === 'PARENT' && selectedChildId) {
      fetchAll(user)
    }
  }, [user?.role, selectedChildId])

  const fetchAll = async (currentUser?: any) => {
    setLoading(true)
    const u = currentUser ?? user
    try {
      const [schedulesRes, classesRes, subjectsRes, ayRes] = await Promise.all([
        examAPI.getAllSchedules(),
        metadataAPI.getClasses(),
        metadataAPI.getSubjects(),
        metadataAPI.getAcademicYears(),
      ])
      setSchedules(schedulesRes.data?.data?.schedules || [])
      setClasses(classesRes.data?.data?.classes || classesRes.data?.classes || [])
      setSubjects(subjectsRes.data?.data?.subjects || subjectsRes.data?.subjects || [])
      setAcademicYears(ayRes.data?.data?.academicYears || [])

      if (u?.role === 'STUDENT' && u?.profile?.id) {
        const resultsRes = await examAPI.getStudentResults(u.profile.id)
        setResults(resultsRes.data?.data?.results || [])
        setStudents([])
      } else if (u?.role === 'PARENT') {
        if (selectedChildId) {
          const resultsRes = await examAPI.getStudentResults(selectedChildId)
          setResults(resultsRes.data?.data?.results || [])
        } else {
          setResults([])
        }
        setStudents([])
      } else {
        const resultsRes = await examAPI.getAllResults()
        setResults(resultsRes.data?.data?.results || [])
        if (['ADMIN', 'TEACHER'].includes(u?.role)) {
          const studentsRes = await studentAPI.getAll({ page: 1, limit: 200 })
          setStudents(studentsRes.data?.data?.students || [])
        } else {
          setStudents([])
        }
      }
    } catch {
      toast.error('Failed to load exam data')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmittingSchedule(true)
    try {
      await examAPI.createSchedule({
        name: scheduleForm.name,
        examType: scheduleForm.examType,
        classId: scheduleForm.classId,
        academicYearId: scheduleForm.academicYearId,
        startDate: scheduleForm.startDate,
        endDate: scheduleForm.endDate,
        totalMarks: Number(scheduleForm.totalMarks),
        passingMarks: Number(scheduleForm.passingMarks),
      })
      toast.success('Exam schedule created')
      setShowScheduleModal(false)
      setScheduleForm({ name: '', examType: 'UNIT_TEST', classId: '', academicYearId: '', startDate: '', endDate: '', totalMarks: '100', passingMarks: '35' })
      fetchAll()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to create schedule')
    } finally {
      setSubmittingSchedule(false)
    }
  }

  const handleCreateResult = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmittingResult(true)
    try {
      await examAPI.createResult({
        examScheduleId: resultForm.examScheduleId,
        studentId: resultForm.studentId,
        subjectId: resultForm.subjectId,
        marksObtained: Number(resultForm.marksObtained),
        remarks: resultForm.remarks || undefined,
      })
      toast.success('Exam result recorded')
      setShowResultModal(false)
      setResultForm({ examScheduleId: '', studentId: '', subjectId: '', marksObtained: '', remarks: '' })
      fetchAll()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to record result')
    } finally {
      setSubmittingResult(false)
    }
  }

  const upcomingCount = schedules.filter(s => s.startDate && new Date(s.startDate) >= new Date()).length

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <Toaster position="top-right" />
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Examinations</h1>
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
                  <Link href={`/students/${selectedChildId}`} className="btn-secondary text-sm whitespace-nowrap">
                    View Student Profile
                  </Link>
                )}
              </div>
            )}
            <p className="text-xs text-blue-500 mt-2">Results list updates based on the selected child.</p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card text-center">
            <p className="text-sm text-gray-500">Total Schedules</p>
            <p className="text-3xl font-bold text-gray-800">{schedules.length}</p>
          </div>
          <div className="card text-center">
            <p className="text-sm text-gray-500">Upcoming Exams</p>
            <p className="text-3xl font-bold text-primary-600">{upcomingCount}</p>
          </div>
          <div className="card text-center">
            <p className="text-sm text-gray-500">Results Recorded</p>
            <p className="text-3xl font-bold text-green-600">{results.length}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-200">
          {(['schedules', 'results'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors capitalize ${
                activeTab === tab
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'schedules' ? 'Exam Schedules' : 'Results'}
            </button>
          ))}
        </div>

        {/* Schedules Tab */}
        {activeTab === 'schedules' && (
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Exam Schedules</h2>
              {['ADMIN', 'PRINCIPAL'].includes(user?.role) && (
                <button onClick={() => setShowScheduleModal(true)} className="btn-primary text-sm">
                  + Add Schedule
                </button>
              )}
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                <span className="ml-3 text-gray-600">Loading...</span>
              </div>
            ) : schedules.length === 0 ? (
              <p className="text-center text-gray-500 py-12">No exam schedules found. Add one to get started.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      <th className="px-4 py-3">Exam Name</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Class</th>
                      <th className="px-4 py-3">Academic Year</th>
                      <th className="px-4 py-3">Start</th>
                      <th className="px-4 py-3">End</th>
                      <th className="px-4 py-3">Marks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {schedules.map(schedule => (
                      <tr key={schedule.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{schedule.name || '-'}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                            {schedule.examType || '-'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{schedule.class?.name || '-'}</td>
                        <td className="px-4 py-3 text-gray-600">{schedule.academicYear?.name || schedule.academicYear?.year || '-'}</td>
                        <td className="px-4 py-3 text-gray-600">{schedule.startDate ? new Date(schedule.startDate).toLocaleDateString() : '-'}</td>
                        <td className="px-4 py-3 text-gray-600">{schedule.endDate ? new Date(schedule.endDate).toLocaleDateString() : '-'}</td>
                        <td className="px-4 py-3 text-gray-600">{schedule.totalMarks ?? '-'} / {schedule.passingMarks ?? '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Results Tab */}
        {activeTab === 'results' && (
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Exam Results</h2>
              {['ADMIN', 'TEACHER'].includes(user?.role) && (
                <button onClick={() => setShowResultModal(true)} className="btn-primary text-sm">
                  + Record Result
                </button>
              )}
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : results.length === 0 ? (
              <p className="text-center text-gray-500 py-12">No results recorded yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {!['STUDENT', 'PARENT'].includes(user?.role) && <th className="px-4 py-3">Student</th>}
                      <th className="px-4 py-3">Exam</th>
                      <th className="px-4 py-3">Subject</th>
                      <th className="px-4 py-3">Marks</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {results.map(result => {
                      const totalMarks = result.examSchedule?.totalMarks ?? 0
                      const passingMarks = result.examSchedule?.passingMarks ?? 0
                      const pct = totalMarks > 0 ? Math.round((result.marksObtained / totalMarks) * 100) : 0
                      const passed = typeof result.marksObtained === 'number'
                        ? result.marksObtained >= passingMarks
                        : false
                      return (
                        <tr key={result.id} className="hover:bg-gray-50">
                          {!['STUDENT', 'PARENT'].includes(user?.role) && (
                            <td className="px-4 py-3 font-medium text-gray-900">
                              {result.student?.firstName || ''} {result.student?.lastName || ''}
                            </td>
                          )}
                          <td className="px-4 py-3 text-gray-600">{result.examSchedule?.name || '-'}</td>
                          <td className="px-4 py-3 text-gray-600">{result.subject?.name || '-'}</td>
                          <td className="px-4 py-3 text-gray-600">
                            {result.marksObtained ?? '-'} / {totalMarks || '-'}
                            {totalMarks > 0 && <span className="ml-1 text-xs text-gray-400">({pct}%)</span>}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {passed ? 'PASS' : 'FAIL'}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-semibold">Add Exam Schedule</h2>
              <button onClick={() => setShowScheduleModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>
            <form onSubmit={handleCreateSchedule} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="label">Exam Name *</label>
                  <input className="input" placeholder="e.g. Mid-term 2026" required value={scheduleForm.name} onChange={e => setScheduleForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Exam Type</label>
                  <select className="input" value={scheduleForm.examType} onChange={e => setScheduleForm(f => ({ ...f, examType: e.target.value }))}>
                    <option value="UNIT_TEST">Unit Test</option>
                    <option value="QUARTERLY">Quarterly</option>
                    <option value="HALF_YEARLY">Half Yearly</option>
                    <option value="ANNUAL">Annual</option>
                    <option value="MODEL_EXAM">Model Exam</option>
                  </select>
                </div>
                <div>
                  <label className="label">Class *</label>
                  <select className="input" required value={scheduleForm.classId} onChange={e => setScheduleForm(f => ({ ...f, classId: e.target.value }))}>
                    <option value="">Select Class</option>
                    {classes.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Academic Year *</label>
                  <select className="input" required value={scheduleForm.academicYearId} onChange={e => setScheduleForm(f => ({ ...f, academicYearId: e.target.value }))}>
                    <option value="">Select Year</option>
                    {academicYears.map((ay: any) => (
                      <option key={ay.id} value={ay.id}>{ay.name || ay.year}{ay.isCurrent ? ' (Current)' : ''}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Start Date *</label>
                  <input type="date" className="input" required value={scheduleForm.startDate} onChange={e => setScheduleForm(f => ({ ...f, startDate: e.target.value }))} />
                </div>
                <div>
                  <label className="label">End Date *</label>
                  <input type="date" className="input" required value={scheduleForm.endDate} onChange={e => setScheduleForm(f => ({ ...f, endDate: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Total Marks *</label>
                  <input type="number" className="input" placeholder="100" required value={scheduleForm.totalMarks} onChange={e => setScheduleForm(f => ({ ...f, totalMarks: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Passing Marks</label>
                  <input type="number" className="input" placeholder="35" value={scheduleForm.passingMarks} onChange={e => setScheduleForm(f => ({ ...f, passingMarks: e.target.value }))} />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowScheduleModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={submittingSchedule} className="btn-primary disabled:opacity-50">
                  {submittingSchedule ? 'Creating...' : 'Create Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Result Modal */}
      {showResultModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-semibold">Record Exam Result</h2>
              <button onClick={() => setShowResultModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>
            <form onSubmit={handleCreateResult} className="p-6 space-y-4">
              <div>
                <label className="label">Exam Schedule *</label>
                <select className="input" required value={resultForm.examScheduleId} onChange={e => setResultForm(f => ({ ...f, examScheduleId: e.target.value }))}>
                  <option value="">Select Exam</option>
                  {schedules.map((s: any) => <option key={s.id} value={s.id}>{s.name} – {s.class?.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Student *</label>
                <select className="input" required value={resultForm.studentId} onChange={e => setResultForm(f => ({ ...f, studentId: e.target.value }))}>
                  <option value="">Select Student</option>
                  {students.map((s: any) => <option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.admissionNo})</option>)}
                </select>
              </div>
              <div>
                <label className="label">Subject</label>
                <select className="input" required value={resultForm.subjectId} onChange={e => setResultForm(f => ({ ...f, subjectId: e.target.value }))}>
                  <option value="">Select Subject</option>
                  {subjects.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Marks Obtained *</label>
                <input type="number" className="input" required value={resultForm.marksObtained} onChange={e => setResultForm(f => ({ ...f, marksObtained: e.target.value }))} />
              </div>
              <div>
                <label className="label">Remarks</label>
                <textarea className="input" rows={2} value={resultForm.remarks} onChange={e => setResultForm(f => ({ ...f, remarks: e.target.value }))} />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowResultModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={submittingResult} className="btn-primary disabled:opacity-50">
                  {submittingResult ? 'Saving...' : 'Save Result'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
