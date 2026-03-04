'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast, { Toaster } from 'react-hot-toast'
import { examAPI, metadataAPI, studentAPI } from '@/lib/api'

export default function ExamsPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'schedules' | 'results'>('schedules')
  const [loading, setLoading] = useState(true)
  const [schedules, setSchedules] = useState<any[]>([])
  const [results, setResults] = useState<any[]>([])
  const [classes, setClasses] = useState<any[]>([])
  const [subjects, setSubjects] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])

  // Schedule modal
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [scheduleForm, setScheduleForm] = useState({
    name: '', examType: 'WRITTEN', classId: '', subjectId: '',
    examDate: '', startTime: '', endTime: '', totalMarks: '', passingMarks: '', venue: ''
  })
  const [submittingSchedule, setSubmittingSchedule] = useState(false)

  // Result modal
  const [showResultModal, setShowResultModal] = useState(false)
  const [resultForm, setResultForm] = useState({
    examScheduleId: '', studentId: '', subjectId: '',
    marksObtained: '', totalMarks: '', grade: '', remarks: ''
  })
  const [submittingResult, setSubmittingResult] = useState(false)

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (!userData) { router.push('/auth/login'); return }
    fetchAll()
  }, [router])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [schedulesRes, resultsRes, classesRes, subjectsRes, studentsRes] = await Promise.all([
        examAPI.getAllSchedules(),
        examAPI.getAllResults(),
        metadataAPI.getClasses(),
        metadataAPI.getSubjects(),
        studentAPI.getAll({ page: 1, limit: 200 }),
      ])
      setSchedules(schedulesRes.data?.data?.schedules || [])
      setResults(resultsRes.data?.data?.results || [])
      setClasses(classesRes.data?.data?.classes || classesRes.data?.classes || [])
      setSubjects(subjectsRes.data?.data?.subjects || subjectsRes.data?.subjects || [])
      setStudents(studentsRes.data?.data?.students || [])
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
        ...scheduleForm,
        totalMarks: Number(scheduleForm.totalMarks),
        passingMarks: Number(scheduleForm.passingMarks),
      })
      toast.success('Exam schedule created')
      setShowScheduleModal(false)
      setScheduleForm({ name: '', examType: 'WRITTEN', classId: '', subjectId: '', examDate: '', startTime: '', endTime: '', totalMarks: '', passingMarks: '', venue: '' })
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
        ...resultForm,
        marksObtained: Number(resultForm.marksObtained),
        totalMarks: Number(resultForm.totalMarks),
      })
      toast.success('Exam result recorded')
      setShowResultModal(false)
      setResultForm({ examScheduleId: '', studentId: '', subjectId: '', marksObtained: '', totalMarks: '', grade: '', remarks: '' })
      fetchAll()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to record result')
    } finally {
      setSubmittingResult(false)
    }
  }

  const upcomingCount = schedules.filter(s => new Date(s.examDate) >= new Date()).length

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
              <button onClick={() => setShowScheduleModal(true)} className="btn-primary text-sm">
                + Add Schedule
              </button>
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
                      <th className="px-4 py-3">Subject</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Time</th>
                      <th className="px-4 py-3">Max Marks</th>
                      <th className="px-4 py-3">Venue</th>
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
                        <td className="px-4 py-3 text-gray-600">{schedule.subject?.name || '-'}</td>
                        <td className="px-4 py-3 text-gray-600">
                          {schedule.examDate ? new Date(schedule.examDate).toLocaleDateString() : '-'}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {schedule.startTime && schedule.endTime ? `${schedule.startTime} – ${schedule.endTime}` : '-'}
                        </td>
                        <td className="px-4 py-3 text-gray-600">{schedule.totalMarks ?? '-'}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{schedule.venue || '-'}</td>
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
              <button onClick={() => setShowResultModal(true)} className="btn-primary text-sm">
                + Record Result
              </button>
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
                      <th className="px-4 py-3">Student</th>
                      <th className="px-4 py-3">Exam</th>
                      <th className="px-4 py-3">Subject</th>
                      <th className="px-4 py-3">Marks</th>
                      <th className="px-4 py-3">Grade</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {results.map(result => {
                      const pct = result.totalMarks > 0 ? Math.round((result.marksObtained / result.totalMarks) * 100) : 0
                      const passed = pct >= (result.passingMarks ? (result.passingMarks / result.totalMarks) * 100 : 35)
                      return (
                        <tr key={result.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-900">
                            {result.student?.firstName || ''} {result.student?.lastName || ''}
                          </td>
                          <td className="px-4 py-3 text-gray-600">{result.examSchedule?.name || '-'}</td>
                          <td className="px-4 py-3 text-gray-600">{result.subject?.name || result.examSchedule?.subject?.name || '-'}</td>
                          <td className="px-4 py-3 text-gray-600">
                            {result.marksObtained ?? '-'} / {result.totalMarks ?? '-'}
                            {result.totalMarks > 0 && <span className="ml-1 text-xs text-gray-400">({pct}%)</span>}
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-blue-100 text-blue-800">
                              {result.grade || '-'}
                            </span>
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
                    <option value="WRITTEN">Written</option>
                    <option value="ORAL">Oral</option>
                    <option value="PRACTICAL">Practical</option>
                    <option value="INTERNAL">Internal</option>
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
                  <label className="label">Subject *</label>
                  <select className="input" required value={scheduleForm.subjectId} onChange={e => setScheduleForm(f => ({ ...f, subjectId: e.target.value }))}>
                    <option value="">Select Subject</option>
                    {subjects.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Exam Date *</label>
                  <input type="date" className="input" required value={scheduleForm.examDate} onChange={e => setScheduleForm(f => ({ ...f, examDate: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Start Time</label>
                  <input type="time" className="input" value={scheduleForm.startTime} onChange={e => setScheduleForm(f => ({ ...f, startTime: e.target.value }))} />
                </div>
                <div>
                  <label className="label">End Time</label>
                  <input type="time" className="input" value={scheduleForm.endTime} onChange={e => setScheduleForm(f => ({ ...f, endTime: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Total Marks *</label>
                  <input type="number" className="input" placeholder="100" required value={scheduleForm.totalMarks} onChange={e => setScheduleForm(f => ({ ...f, totalMarks: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Passing Marks</label>
                  <input type="number" className="input" placeholder="35" value={scheduleForm.passingMarks} onChange={e => setScheduleForm(f => ({ ...f, passingMarks: e.target.value }))} />
                </div>
                <div className="col-span-2">
                  <label className="label">Venue</label>
                  <input className="input" placeholder="e.g. Hall A" value={scheduleForm.venue} onChange={e => setScheduleForm(f => ({ ...f, venue: e.target.value }))} />
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
                <select className="input" value={resultForm.subjectId} onChange={e => setResultForm(f => ({ ...f, subjectId: e.target.value }))}>
                  <option value="">Select Subject</option>
                  {subjects.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Marks Obtained *</label>
                  <input type="number" className="input" required value={resultForm.marksObtained} onChange={e => setResultForm(f => ({ ...f, marksObtained: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Total Marks *</label>
                  <input type="number" className="input" required value={resultForm.totalMarks} onChange={e => setResultForm(f => ({ ...f, totalMarks: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="label">Grade</label>
                <select className="input" value={resultForm.grade} onChange={e => setResultForm(f => ({ ...f, grade: e.target.value }))}>
                  <option value="">Auto-calculate</option>
                  {['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F'].map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
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
