'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast, { Toaster } from 'react-hot-toast'
import { timetableAPI, metadataAPI, staffAPI } from '@/lib/api'

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']
const DAY_SHORT: Record<string, string> = {
  MONDAY: 'Mon', TUESDAY: 'Tue', WEDNESDAY: 'Wed',
  THURSDAY: 'Thu', FRIDAY: 'Fri', SATURDAY: 'Sat'
}

const PERIOD_COLORS = [
  'bg-blue-50 border-blue-200 text-blue-900',
  'bg-green-50 border-green-200 text-green-900',
  'bg-purple-50 border-purple-200 text-purple-900',
  'bg-yellow-50 border-yellow-200 text-yellow-900',
  'bg-pink-50 border-pink-200 text-pink-900',
  'bg-indigo-50 border-indigo-200 text-indigo-900',
]

export default function TimetablePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [timetables, setTimetables] = useState<any[]>([])
  const [filtered, setFiltered] = useState<any[]>([])
  const [classes, setClasses] = useState<any[]>([])
  const [subjects, setSubjects] = useState<any[]>([])
  const [staff, setStaff] = useState<any[]>([])
  const [selectedClass, setSelectedClass] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Add Slot Modal
  const [showAddModal, setShowAddModal] = useState(false)
  const [slotForm, setSlotForm] = useState({
    classId: '', subjectId: '', teacherId: '',
    dayOfWeek: 'MONDAY', startTime: '', endTime: '', room: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (!userData) { router.push('/auth/login'); return }
    const parsedUser = JSON.parse(userData)
    setUser(parsedUser)
    if (parsedUser.role === 'STUDENT' && parsedUser.profile?.classId) {
      setSelectedClass(parsedUser.profile.classId)
    }
    fetchAll()
  }, [router])

  useEffect(() => {
    if (selectedClass) {
      setFiltered(timetables.filter(t => t.classId === selectedClass || t.class?.id === selectedClass))
    } else {
      setFiltered(timetables)
    }
  }, [selectedClass, timetables])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [ttRes, classesRes, subjectsRes, staffRes] = await Promise.all([
        timetableAPI.getAll(),
        metadataAPI.getClasses(),
        metadataAPI.getSubjects(),
        staffAPI.getAll({ page: 1, limit: 200 }),
      ])
      setTimetables(ttRes.data?.data?.timetables || [])
      setClasses(classesRes.data?.data?.classes || classesRes.data?.classes || [])
      setSubjects(subjectsRes.data?.data?.subjects || subjectsRes.data?.subjects || [])
      setStaff(staffRes.data?.data?.staff || [])
    } catch {
      toast.error('Failed to load timetable')
    } finally {
      setLoading(false)
    }
  }

  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await timetableAPI.create(slotForm)
      toast.success('Timetable slot added')
      setShowAddModal(false)
      setSlotForm({ classId: '', subjectId: '', teacherId: '', dayOfWeek: 'MONDAY', startTime: '', endTime: '', room: '' })
      fetchAll()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to add slot')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this timetable slot?')) return
    setDeletingId(id)
    try {
      await timetableAPI.delete(id)
      toast.success('Slot deleted')
      setTimetables(prev => prev.filter(t => t.id !== id))
    } catch {
      toast.error('Failed to delete slot')
    } finally {
      setDeletingId(null)
    }
  }

  // Build grid: day → sorted slots
  const gridByDay: Record<string, any[]> = {}
  DAYS.forEach(d => {
    gridByDay[d] = filtered
      .filter(t => t.dayOfWeek === d)
      .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''))
  })

  const classCount = new Set(timetables.map(t => t.classId || t.class?.id).filter(Boolean)).size
  const subjectCount = new Set(timetables.map(t => t.subjectId || t.subject?.id).filter(Boolean)).size

  const canEdit = ['ADMIN', 'PRINCIPAL', 'TEACHER'].includes(user?.role)

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <Toaster position="top-right" />
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Timetable</h1>
          <Link href="/dashboard" className="text-sm text-primary-600 hover:text-primary-700">
            ← Back to Dashboard
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card text-center">
            <p className="text-sm text-gray-500">Total Periods</p>
            <p className="text-3xl font-bold text-gray-800">{timetables.length}</p>
          </div>
          <div className="card text-center">
            <p className="text-sm text-gray-500">Classes</p>
            <p className="text-3xl font-bold text-primary-600">{classCount}</p>
          </div>
          <div className="card text-center">
            <p className="text-sm text-gray-500">Subjects</p>
            <p className="text-3xl font-bold text-green-600">{subjectCount}</p>
          </div>
        </div>

        {/* Toolbar */}
        <div className="card">
          <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
            <div className="flex gap-3 flex-wrap items-center">
              <div>
                <label className="text-xs font-medium text-gray-600 mr-2">Filter by Class:</label>
                <select
                  className="input"
                  style={{ maxWidth: 220 }}
                  value={selectedClass}
                  onChange={e => setSelectedClass(e.target.value)}
                >
                  <option value="">All Classes</option>
                  {classes.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="flex rounded-lg overflow-hidden border border-gray-300">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-2 text-sm font-medium transition-colors ${viewMode === 'grid' ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                  Grid View
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-2 text-sm font-medium transition-colors ${viewMode === 'list' ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                  List View
                </button>
              </div>
            </div>
            {canEdit && (
              <button onClick={() => setShowAddModal(true)} className="btn-primary text-sm whitespace-nowrap">
                + Add Period
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="card flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <span className="ml-3 text-gray-600">Loading timetable...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="card text-center py-16">
            <p className="text-gray-500">No timetable entries found.</p>
            {canEdit && <button onClick={() => setShowAddModal(true)} className="btn-primary text-sm mt-4">Add First Period</button>}
          </div>
        ) : viewMode === 'grid' ? (
          /* Grid View */
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {DAYS.slice(0, selectedClass ? 6 : 5).map(day => (
              <div key={day} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="bg-primary-600 text-white text-center py-2 text-sm font-semibold">
                  {DAY_SHORT[day]}
                </div>
                <div className="p-2 space-y-2 min-h-[120px]">
                  {gridByDay[day].length === 0 ? (
                    <p className="text-center text-gray-400 text-xs py-4">No periods</p>
                  ) : (
                    gridByDay[day].map((slot, idx) => (
                      <div
                        key={slot.id}
                        className={`p-2 rounded border text-xs ${PERIOD_COLORS[idx % PERIOD_COLORS.length]}`}
                      >
                        <p className="font-semibold truncate">{slot.subject?.name || '-'}</p>
                        <p className="text-xs opacity-75">{slot.startTime || ''} – {slot.endTime || ''}</p>
                        <p className="text-xs opacity-60 truncate">
                          {slot.teacher ? `${slot.teacher.firstName || ''} ${slot.teacher.lastName || ''}`.trim() : '-'}
                        </p>
                        {slot.room && <p className="text-xs opacity-50">Room: {slot.room}</p>}
                        {canEdit && (
                          <button
                            onClick={() => handleDelete(slot.id)}
                            disabled={deletingId === slot.id}
                            className="mt-1 text-xs text-red-500 hover:text-red-700 disabled:opacity-40"
                          >
                            {deletingId === slot.id ? '...' : '✕ Remove'}
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* List View */
          <div className="card">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <th className="px-4 py-3">Day</th>
                    <th className="px-4 py-3">Class</th>
                    <th className="px-4 py-3">Subject</th>
                    <th className="px-4 py-3">Teacher</th>
                    <th className="px-4 py-3">Time</th>
                    <th className="px-4 py-3">Room</th>
                    {canEdit && <th className="px-4 py-3">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {[...filtered].sort((a, b) => {
                    const dayOrder = DAYS.indexOf(a.dayOfWeek) - DAYS.indexOf(b.dayOfWeek)
                    if (dayOrder !== 0) return dayOrder
                    return (a.startTime || '').localeCompare(b.startTime || '')
                  }).map(entry => (
                    <tr key={entry.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-100 text-primary-800">
                          {DAY_SHORT[entry.dayOfWeek] || entry.dayOfWeek || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{entry.class?.name || '-'}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">{entry.subject?.name || '-'}</td>
                      <td className="px-4 py-3 text-gray-600">
                        {entry.teacher ? `${entry.teacher.firstName || ''} ${entry.teacher.lastName || ''}`.trim() : '-'}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {entry.startTime && entry.endTime ? `${entry.startTime} – ${entry.endTime}` : '-'}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{entry.room || '-'}</td>
                      {canEdit && (
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleDelete(entry.id)}
                            disabled={deletingId === entry.id}
                            className="text-xs text-red-600 hover:text-red-800 disabled:opacity-40"
                          >
                            {deletingId === entry.id ? 'Deleting...' : 'Delete'}
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Add Period Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-semibold">Add Timetable Period</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>
            <form onSubmit={handleAddSlot} className="p-6 space-y-4">
              <div>
                <label className="label">Class *</label>
                <select className="input" required value={slotForm.classId} onChange={e => setSlotForm(f => ({ ...f, classId: e.target.value }))}>
                  <option value="">Select Class</option>
                  {classes.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Subject *</label>
                <select className="input" required value={slotForm.subjectId} onChange={e => setSlotForm(f => ({ ...f, subjectId: e.target.value }))}>
                  <option value="">Select Subject</option>
                  {subjects.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Teacher</label>
                <select className="input" value={slotForm.teacherId} onChange={e => setSlotForm(f => ({ ...f, teacherId: e.target.value }))}>
                  <option value="">Select Teacher (optional)</option>
                  {staff.map((s: any) => (
                    <option key={s.id} value={s.id}>
                      {s.firstName} {s.lastName} — {s.designation || s.role || ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Day of Week *</label>
                <select className="input" required value={slotForm.dayOfWeek} onChange={e => setSlotForm(f => ({ ...f, dayOfWeek: e.target.value }))}>
                  {DAYS.map(d => <option key={d} value={d}>{d.charAt(0) + d.slice(1).toLowerCase()}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Start Time *</label>
                  <input type="time" className="input" required value={slotForm.startTime} onChange={e => setSlotForm(f => ({ ...f, startTime: e.target.value }))} />
                </div>
                <div>
                  <label className="label">End Time *</label>
                  <input type="time" className="input" required value={slotForm.endTime} onChange={e => setSlotForm(f => ({ ...f, endTime: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="label">Room / Venue</label>
                <input className="input" placeholder="e.g. Room 101" value={slotForm.room} onChange={e => setSlotForm(f => ({ ...f, room: e.target.value }))} />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={submitting} className="btn-primary disabled:opacity-50">
                  {submitting ? 'Adding...' : 'Add Period'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
