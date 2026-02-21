'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast, { Toaster } from 'react-hot-toast'
import { Building2, Plus, Users, AlertCircle, FileText, Calendar, Settings, X, BedDouble } from 'lucide-react'
import { hostelAPI } from '@/lib/api'

export default function HostelPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'hostels' | 'complaints' | 'leaves' | 'visitors' | 'reports' | 'settings'>('hostels')

  // Hostels
  const [hostels, setHostels] = useState<any[]>([])
  const [showAddHostel, setShowAddHostel] = useState(false)
  const [hostelForm, setHostelForm] = useState({ name: '', type: 'BOYS', capacity: 100, address: '', contactNo: '' })

  // Selected hostel detail
  const [selectedHostel, setSelectedHostel] = useState<any>(null)
  const [hostelRooms, setHostelRooms] = useState<any[]>([])
  const [hostelStudents, setHostelStudents] = useState<any[]>([])

  // Rooms
  const [showAddRoom, setShowAddRoom] = useState(false)
  const [roomForm, setRoomForm] = useState({ hostelId: '', roomNumber: '', floor: 1, capacity: 4, type: 'DOUBLE', rentAmount: 0 })

  // Student allocation
  const [showAllocate, setShowAllocate] = useState(false)
  const [allocateForm, setAllocateForm] = useState({ studentId: '', hostelId: '', roomId: '', bedId: '', checkInDate: '', depositAmount: 0, monthlyFee: 0, emergencyContact: '' })

  // Complaints
  const [complaints, setComplaints] = useState<any[]>([])
  const [showAddComplaint, setShowAddComplaint] = useState(false)
  const [complaintForm, setComplaintForm] = useState({ studentId: '', hostelId: '', category: '', subject: '', description: '', priority: 'MEDIUM' })

  // Leaves
  const [leaves, setLeaves] = useState<any[]>([])
  const [showAddLeave, setShowAddLeave] = useState(false)
  const [leaveForm, setLeaveForm] = useState({ studentId: '', hostelId: '', leaveFrom: '', leaveTo: '', reason: '', destination: '', contactNo: '' })

  // Visitors
  const [visitors, setVisitors] = useState<any[]>([])
  const [showAddVisitor, setShowAddVisitor] = useState(false)
  const [visitorForm, setVisitorForm] = useState({ studentId: '', visitorName: '', relation: '', contactNo: '', purpose: '', visitDate: '' })

  // Reports
  const [summary, setSummary] = useState<any>(null)

  // Settings
  const [settings, setSettings] = useState<any>(null)
  const [settingsForm, setSettingsForm] = useState<any>({})

  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (!userData) { router.push('/auth/login'); return }
    setUser(JSON.parse(userData))
    fetchHostels()
  }, [router])

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'PRINCIPAL'

  const fetchHostels = async () => {
    setLoading(true)
    try {
      const res = await hostelAPI.getAllHostels()
      setHostels(res.data?.data?.hostels || [])
    } catch { toast.error('Failed to load hostels') }
    finally { setLoading(false) }
  }

  const fetchHostelDetail = async (hostelId: string) => {
    try {
      const [roomsRes, studentsRes] = await Promise.all([
        hostelAPI.getRoomsByHostel(hostelId),
        hostelAPI.getHostelStudents(hostelId)
      ])
      setHostelRooms(roomsRes.data?.data?.rooms || [])
      setHostelStudents(studentsRes.data?.data?.students || [])
    } catch { toast.error('Failed to load hostel details') }
  }

  const fetchComplaints = async () => {
    try {
      const res = await hostelAPI.getComplaints()
      setComplaints(res.data?.data?.complaints || [])
    } catch { toast.error('Failed to load complaints') }
  }

  const fetchLeaves = async () => {
    try {
      const res = await hostelAPI.getLeaveRequests()
      setLeaves(res.data?.data?.leaves || [])
    } catch { toast.error('Failed to load leaves') }
  }

  const fetchVisitors = async (hostelId?: string) => {
    try {
      if (hostelId) {
        const res = await hostelAPI.getVisitorsByHostel(hostelId)
        setVisitors(res.data?.data?.visitors || [])
      } else if (hostels.length > 0) {
        const res = await hostelAPI.getVisitorsByHostel(hostels[0].id)
        setVisitors(res.data?.data?.visitors || [])
      }
    } catch { toast.error('Failed to load visitors') }
  }

  const fetchSummary = async () => {
    try {
      const res = await hostelAPI.getSummary()
      setSummary(res.data?.data || res.data)
    } catch { toast.error('Failed to load summary') }
  }

  const fetchSettings = async () => {
    try {
      const res = await hostelAPI.getSettings()
      const s = res.data?.data?.settings || res.data?.data || {}
      setSettings(s)
      setSettingsForm(s)
    } catch { toast.error('Failed to load settings') }
  }

  const handleTabChange = (t: typeof tab) => {
    setTab(t)
    if (t === 'hostels') fetchHostels()
    if (t === 'complaints') fetchComplaints()
    if (t === 'leaves') fetchLeaves()
    if (t === 'visitors') fetchVisitors()
    if (t === 'reports') fetchSummary()
    if (t === 'settings') fetchSettings()
  }

  const selectHostel = (h: any) => {
    setSelectedHostel(h)
    fetchHostelDetail(h.id)
    setRoomForm(f => ({ ...f, hostelId: h.id }))
    setAllocateForm(f => ({ ...f, hostelId: h.id }))
  }

  // CRUD handlers
  const handleAddHostel = async () => {
    if (!hostelForm.name) { toast.error('Name required'); return }
    setSaving(true)
    try {
      await hostelAPI.addHostel({ ...hostelForm, capacity: Number(hostelForm.capacity) })
      toast.success('Hostel added')
      setShowAddHostel(false)
      setHostelForm({ name: '', type: 'BOYS', capacity: 100, address: '', contactNo: '' })
      fetchHostels()
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed') }
    finally { setSaving(false) }
  }

  const handleDeleteHostel = async (id: string) => {
    if (!confirm('Delete this hostel?')) return
    try { await hostelAPI.deleteHostel(id); toast.success('Deleted'); fetchHostels(); setSelectedHostel(null) }
    catch (err: any) { toast.error(err.response?.data?.message || 'Failed') }
  }

  const handleAddRoom = async () => {
    if (!roomForm.roomNumber || !roomForm.hostelId) { toast.error('Room number required'); return }
    setSaving(true)
    try {
      await hostelAPI.addRoom({ ...roomForm, floor: Number(roomForm.floor), capacity: Number(roomForm.capacity), rentAmount: Number(roomForm.rentAmount) })
      toast.success('Room added')
      setShowAddRoom(false)
      setRoomForm({ hostelId: selectedHostel?.id || '', roomNumber: '', floor: 1, capacity: 4, type: 'DOUBLE', rentAmount: 0 })
      if (selectedHostel) fetchHostelDetail(selectedHostel.id)
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed') }
    finally { setSaving(false) }
  }

  const handleAllocateStudent = async () => {
    if (!allocateForm.studentId || !allocateForm.hostelId || !allocateForm.roomId || !allocateForm.bedId) {
      toast.error('All fields required'); return
    }
    setSaving(true)
    try {
      await hostelAPI.allocateStudent({ ...allocateForm, depositAmount: Number(allocateForm.depositAmount), monthlyFee: Number(allocateForm.monthlyFee) })
      toast.success('Student allocated')
      setShowAllocate(false)
      if (selectedHostel) fetchHostelDetail(selectedHostel.id)
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed') }
    finally { setSaving(false) }
  }

  const handleAddComplaint = async () => {
    if (!complaintForm.subject || !complaintForm.hostelId) { toast.error('Subject and hostel required'); return }
    setSaving(true)
    try {
      await hostelAPI.registerComplaint(complaintForm)
      toast.success('Complaint registered')
      setShowAddComplaint(false)
      setComplaintForm({ studentId: '', hostelId: '', category: '', subject: '', description: '', priority: 'MEDIUM' })
      fetchComplaints()
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed') }
    finally { setSaving(false) }
  }

  const handleResolveComplaint = async (id: string) => {
    const resolution = prompt('Enter resolution:')
    if (!resolution) return
    try {
      await hostelAPI.resolveComplaint(id, { resolution })
      toast.success('Complaint resolved')
      fetchComplaints()
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed') }
  }

  const handleAddLeave = async () => {
    if (!leaveForm.studentId || !leaveForm.hostelId || !leaveForm.leaveFrom || !leaveForm.leaveTo) {
      toast.error('All required fields needed'); return
    }
    setSaving(true)
    try {
      await hostelAPI.applyLeave(leaveForm)
      toast.success('Leave applied')
      setShowAddLeave(false)
      setLeaveForm({ studentId: '', hostelId: '', leaveFrom: '', leaveTo: '', reason: '', destination: '', contactNo: '' })
      fetchLeaves()
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed') }
    finally { setSaving(false) }
  }

  const handleApproveLeave = async (id: string) => {
    try { await hostelAPI.approveLeave(id); toast.success('Approved'); fetchLeaves() }
    catch (err: any) { toast.error(err.response?.data?.message || 'Failed') }
  }

  const handleRejectLeave = async (id: string) => {
    const remarks = prompt('Rejection reason:')
    if (!remarks) return
    try { await hostelAPI.rejectLeave(id, { remarks }); toast.success('Rejected'); fetchLeaves() }
    catch (err: any) { toast.error(err.response?.data?.message || 'Failed') }
  }

  const handleAddVisitor = async () => {
    if (!visitorForm.studentId || !visitorForm.visitorName) { toast.error('Student and visitor name required'); return }
    setSaving(true)
    try {
      await hostelAPI.registerVisitor(visitorForm)
      toast.success('Visitor registered')
      setShowAddVisitor(false)
      setVisitorForm({ studentId: '', visitorName: '', relation: '', contactNo: '', purpose: '', visitDate: '' })
      fetchVisitors()
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed') }
    finally { setSaving(false) }
  }

  const handleApproveVisitor = async (id: string) => {
    try { await hostelAPI.approveVisitor(id); toast.success('Approved'); fetchVisitors() }
    catch (err: any) { toast.error(err.response?.data?.message || 'Failed') }
  }

  const handleSaveSettings = async () => {
    setSaving(true)
    try { await hostelAPI.updateSettings(settingsForm); toast.success('Settings saved') }
    catch (err: any) { toast.error(err.response?.data?.message || 'Failed') }
    finally { setSaving(false) }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <Toaster position="top-right" />
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Building2 className="w-7 h-7 text-primary-600" />
            <h1 className="text-2xl font-bold text-gray-900">Hostel Management</h1>
          </div>
          <Link href="/dashboard" className="text-sm text-primary-600 hover:text-primary-700">Back to Dashboard</Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b pb-2 flex-wrap">
          {(['hostels', 'complaints', 'leaves', 'visitors', 'reports', 'settings'] as const).map(t => (
            <button key={t} onClick={() => handleTabChange(t)}
              className={`px-4 py-2 rounded-t-lg text-sm font-medium capitalize ${tab === t ? 'bg-white border border-b-0 text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}>
              {t}
            </button>
          ))}
        </div>

        {/* Hostels Tab */}
        {tab === 'hostels' && (
          <div className="space-y-4">
            {isAdmin && (
              <div className="flex gap-2">
                <button className="btn-primary text-sm flex items-center gap-1" onClick={() => setShowAddHostel(true)}><Plus className="w-4 h-4" /> Add Hostel</button>
                {selectedHostel && <button className="btn-primary text-sm flex items-center gap-1" onClick={() => { setRoomForm(f => ({...f, hostelId: selectedHostel.id})); setShowAddRoom(true) }}><Plus className="w-4 h-4" /> Add Room</button>}
                {selectedHostel && <button className="btn-secondary text-sm flex items-center gap-1" onClick={() => { setAllocateForm(f => ({...f, hostelId: selectedHostel.id})); setShowAllocate(true) }}><Users className="w-4 h-4" /> Allocate Student</button>}
              </div>
            )}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Hostel list */}
              <div className="card">
                <h2 className="text-lg font-semibold mb-3">Hostels</h2>
                {loading ? <p className="text-gray-600">Loading...</p> : hostels.length === 0 ? <p className="text-gray-600">No hostels.</p> : (
                  <div className="space-y-2">
                    {hostels.map(h => (
                      <div key={h.id} className={`p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${selectedHostel?.id === h.id ? 'border-primary-500 bg-primary-50' : ''}`}
                        onClick={() => selectHostel(h)}>
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{h.name}</span>
                          <span className={`text-xs px-2 py-0.5 rounded ${h.type === 'BOYS' ? 'bg-blue-100 text-blue-800' : h.type === 'GIRLS' ? 'bg-pink-100 text-pink-800' : 'bg-purple-100 text-purple-800'}`}>{h.type}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Capacity: {h.capacity} | {h.address || 'No address'}</p>
                        {isAdmin && <button className="text-red-500 text-xs mt-1" onClick={(e) => { e.stopPropagation(); handleDeleteHostel(h.id) }}>Delete</button>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Rooms */}
              <div className="card">
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2"><BedDouble className="w-5 h-5" /> Rooms {selectedHostel ? `- ${selectedHostel.name}` : ''}</h2>
                {!selectedHostel ? <p className="text-gray-500 text-sm">Select a hostel.</p> : hostelRooms.length === 0 ? <p className="text-gray-500 text-sm">No rooms.</p> : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {hostelRooms.map(r => (
                      <div key={r.id} className="p-2 border rounded text-sm">
                        <div className="flex justify-between">
                          <span className="font-medium">Room {r.roomNumber}</span>
                          <span className="text-xs text-gray-500">{r.type} | Floor: {r.floor}</span>
                        </div>
                        <p className="text-xs text-gray-500">Capacity: {r.capacity} | Rent: ₹{r.rentAmount}</p>
                        <p className="text-xs text-gray-500">Beds: {r.beds?.length || 0} | Occupied: {r.beds?.filter((b: any) => b.status === 'OCCUPIED').length || 0}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Students */}
              <div className="card">
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2"><Users className="w-5 h-5" /> Students</h2>
                {!selectedHostel ? <p className="text-gray-500 text-sm">Select a hostel.</p> : hostelStudents.length === 0 ? <p className="text-gray-500 text-sm">No students.</p> : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {hostelStudents.map((s: any) => (
                      <div key={s.id} className="p-2 border rounded text-sm">
                        <span className="font-medium">{s.student?.firstName || s.firstName || '-'} {s.student?.lastName || s.lastName || ''}</span>
                        <p className="text-xs text-gray-500">Room: {s.room?.roomNumber || s.roomNumber || '-'} | Fee: ₹{s.monthlyFee || 0}</p>
                        <p className="text-xs text-gray-500">Check-in: {s.checkInDate ? new Date(s.checkInDate).toLocaleDateString() : '-'}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Complaints Tab */}
        {tab === 'complaints' && (
          <div className="space-y-4">
            <button className="btn-primary text-sm flex items-center gap-1" onClick={() => setShowAddComplaint(true)}><AlertCircle className="w-4 h-4" /> Register Complaint</button>
            <div className="card">
              <h2 className="text-lg font-semibold mb-3">Complaints</h2>
              {complaints.length === 0 ? <p className="text-gray-600">No complaints.</p> : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead><tr className="border-b text-left text-gray-600"><th className="py-2 pr-4">Subject</th><th className="py-2 pr-4">Category</th><th className="py-2 pr-4">Priority</th><th className="py-2 pr-4">Status</th><th className="py-2 pr-4">Date</th>{isAdmin && <th className="py-2">Actions</th>}</tr></thead>
                    <tbody>{complaints.map(c => (
                      <tr key={c.id} className="border-b last:border-0">
                        <td className="py-2 pr-4 font-medium">{c.subject}</td>
                        <td className="py-2 pr-4">{c.category || '-'}</td>
                        <td className="py-2 pr-4"><span className={`px-2 py-0.5 rounded text-xs ${c.priority === 'HIGH' || c.priority === 'URGENT' ? 'bg-red-100 text-red-800' : c.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>{c.priority}</span></td>
                        <td className="py-2 pr-4"><span className={`px-2 py-0.5 rounded text-xs ${c.status === 'RESOLVED' || c.status === 'CLOSED' ? 'bg-green-100 text-green-800' : c.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}`}>{c.status}</span></td>
                        <td className="py-2 pr-4">{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '-'}</td>
                        {isAdmin && <td className="py-2">{c.status !== 'RESOLVED' && c.status !== 'CLOSED' && <button className="text-primary-600 text-xs hover:underline" onClick={() => handleResolveComplaint(c.id)}>Resolve</button>}</td>}
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Leaves Tab */}
        {tab === 'leaves' && (
          <div className="space-y-4">
            <button className="btn-primary text-sm flex items-center gap-1" onClick={() => setShowAddLeave(true)}><Calendar className="w-4 h-4" /> Apply Leave</button>
            <div className="card">
              <h2 className="text-lg font-semibold mb-3">Leave Requests</h2>
              {leaves.length === 0 ? <p className="text-gray-600">No leave requests.</p> : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead><tr className="border-b text-left text-gray-600"><th className="py-2 pr-4">Student</th><th className="py-2 pr-4">From</th><th className="py-2 pr-4">To</th><th className="py-2 pr-4">Reason</th><th className="py-2 pr-4">Status</th>{isAdmin && <th className="py-2">Actions</th>}</tr></thead>
                    <tbody>{leaves.map(l => (
                      <tr key={l.id} className="border-b last:border-0">
                        <td className="py-2 pr-4">{l.student?.firstName || '-'} {l.student?.lastName || ''}</td>
                        <td className="py-2 pr-4">{l.leaveFrom ? new Date(l.leaveFrom).toLocaleDateString() : '-'}</td>
                        <td className="py-2 pr-4">{l.leaveTo ? new Date(l.leaveTo).toLocaleDateString() : '-'}</td>
                        <td className="py-2 pr-4">{l.reason || '-'}</td>
                        <td className="py-2 pr-4"><span className={`px-2 py-0.5 rounded text-xs ${l.status === 'APPROVED' ? 'bg-green-100 text-green-800' : l.status === 'REJECTED' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>{l.status}</span></td>
                        {isAdmin && <td className="py-2 space-x-2">{l.status === 'PENDING' && (<><button className="text-green-600 text-xs hover:underline" onClick={() => handleApproveLeave(l.id)}>Approve</button><button className="text-red-600 text-xs hover:underline" onClick={() => handleRejectLeave(l.id)}>Reject</button></>)}</td>}
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Visitors Tab */}
        {tab === 'visitors' && (
          <div className="space-y-4">
            <button className="btn-primary text-sm flex items-center gap-1" onClick={() => setShowAddVisitor(true)}><Users className="w-4 h-4" /> Register Visitor</button>
            <div className="card">
              <h2 className="text-lg font-semibold mb-3">Recent Visitors</h2>
              {visitors.length === 0 ? <p className="text-gray-600">No visitors.</p> : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead><tr className="border-b text-left text-gray-600"><th className="py-2 pr-4">Visitor</th><th className="py-2 pr-4">Student</th><th className="py-2 pr-4">Relation</th><th className="py-2 pr-4">Purpose</th><th className="py-2 pr-4">Date</th><th className="py-2 pr-4">Status</th>{isAdmin && <th className="py-2">Actions</th>}</tr></thead>
                    <tbody>{visitors.map(v => (
                      <tr key={v.id} className="border-b last:border-0">
                        <td className="py-2 pr-4 font-medium">{v.visitorName}</td>
                        <td className="py-2 pr-4">{v.student?.firstName || '-'}</td>
                        <td className="py-2 pr-4">{v.relation || '-'}</td>
                        <td className="py-2 pr-4">{v.purpose || '-'}</td>
                        <td className="py-2 pr-4">{v.visitDate ? new Date(v.visitDate).toLocaleDateString() : '-'}</td>
                        <td className="py-2 pr-4"><span className={`px-2 py-0.5 rounded text-xs ${v.approved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{v.approved ? 'Approved' : 'Pending'}</span></td>
                        {isAdmin && <td className="py-2">{!v.approved && <button className="text-green-600 text-xs hover:underline" onClick={() => handleApproveVisitor(v.id)}>Approve</button>}</td>}
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Reports Tab */}
        {tab === 'reports' && summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="card text-center"><p className="text-sm text-gray-500">Total Hostels</p><p className="text-2xl font-bold">{summary.totalHostels ?? 0}</p></div>
            <div className="card text-center"><p className="text-sm text-gray-500">Total Rooms</p><p className="text-2xl font-bold">{summary.totalRooms ?? 0}</p></div>
            <div className="card text-center"><p className="text-sm text-gray-500">Total Students</p><p className="text-2xl font-bold">{summary.totalStudents ?? 0}</p></div>
            <div className="card text-center"><p className="text-sm text-gray-500">Occupancy Rate</p><p className="text-2xl font-bold">{summary.occupancyRate ?? summary.occupancyPercentage ?? '-'}%</p></div>
            <div className="card text-center"><p className="text-sm text-gray-500">Vacant Beds</p><p className="text-2xl font-bold text-green-600">{summary.vacantBeds ?? 0}</p></div>
            <div className="card text-center"><p className="text-sm text-gray-500">Open Complaints</p><p className="text-2xl font-bold text-orange-600">{summary.openComplaints ?? 0}</p></div>
            <div className="card text-center"><p className="text-sm text-gray-500">Pending Leaves</p><p className="text-2xl font-bold text-blue-600">{summary.pendingLeaves ?? 0}</p></div>
            <div className="card text-center"><p className="text-sm text-gray-500">Today's Visitors</p><p className="text-2xl font-bold">{summary.todayVisitors ?? 0}</p></div>
          </div>
        )}

        {/* Settings Tab */}
        {tab === 'settings' && (
          <div className="card max-w-lg">
            <div className="flex items-center gap-2 mb-4"><Settings className="w-5 h-5 text-primary-600" /><h2 className="text-lg font-semibold">Hostel Settings</h2></div>
            <div className="space-y-4">
              {[
                { label: 'Default Monthly Fee (₹)', key: 'defaultMonthlyFee', type: 'number' },
                { label: 'Default Deposit (₹)', key: 'defaultDepositAmount', type: 'number' },
                { label: 'Visitor Time From', key: 'visitorTimeFrom', type: 'time' },
                { label: 'Visitor Time To', key: 'visitorTimeTo', type: 'time' },
              ].map(f => (
                <div key={f.key}>
                  <label className="label">{f.label}</label>
                  <input className="input" type={f.type} value={settingsForm[f.key] ?? ''}
                    onChange={e => setSettingsForm({ ...settingsForm, [f.key]: f.type === 'number' ? Number(e.target.value) : e.target.value })} />
                </div>
              ))}
              <button className="btn-primary w-full" disabled={saving} onClick={handleSaveSettings}>{saving ? 'Saving...' : 'Save Settings'}</button>
            </div>
          </div>
        )}

        {/* Add Hostel Modal */}
        {showAddHostel && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-semibold">Add Hostel</h3><button onClick={() => setShowAddHostel(false)}><X className="w-5 h-5" /></button></div>
              <div className="space-y-3">
                <div><label className="label">Name *</label><input className="input" value={hostelForm.name} onChange={e => setHostelForm({...hostelForm, name: e.target.value})} /></div>
                <div><label className="label">Type</label><select className="input" value={hostelForm.type} onChange={e => setHostelForm({...hostelForm, type: e.target.value})}><option value="BOYS">Boys</option><option value="GIRLS">Girls</option><option value="CO_ED">Co-Ed</option></select></div>
                <div><label className="label">Capacity</label><input className="input" type="number" value={hostelForm.capacity} onChange={e => setHostelForm({...hostelForm, capacity: parseInt(e.target.value)||100})} /></div>
                <div><label className="label">Address</label><input className="input" value={hostelForm.address} onChange={e => setHostelForm({...hostelForm, address: e.target.value})} /></div>
                <div><label className="label">Contact No</label><input className="input" value={hostelForm.contactNo} onChange={e => setHostelForm({...hostelForm, contactNo: e.target.value})} /></div>
                <button className="btn-primary w-full" onClick={handleAddHostel} disabled={saving}>{saving ? 'Adding...' : 'Add Hostel'}</button>
              </div>
            </div>
          </div>
        )}

        {/* Add Room Modal */}
        {showAddRoom && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-semibold">Add Room</h3><button onClick={() => setShowAddRoom(false)}><X className="w-5 h-5" /></button></div>
              <div className="space-y-3">
                <div><label className="label">Room Number *</label><input className="input" value={roomForm.roomNumber} onChange={e => setRoomForm({...roomForm, roomNumber: e.target.value})} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="label">Floor</label><input className="input" type="number" value={roomForm.floor} onChange={e => setRoomForm({...roomForm, floor: parseInt(e.target.value)||1})} /></div>
                  <div><label className="label">Capacity</label><input className="input" type="number" value={roomForm.capacity} onChange={e => setRoomForm({...roomForm, capacity: parseInt(e.target.value)||4})} /></div>
                </div>
                <div><label className="label">Type</label><select className="input" value={roomForm.type} onChange={e => setRoomForm({...roomForm, type: e.target.value})}><option value="SINGLE">Single</option><option value="DOUBLE">Double</option><option value="TRIPLE">Triple</option><option value="DORMITORY">Dormitory</option></select></div>
                <div><label className="label">Rent Amount (₹)</label><input className="input" type="number" value={roomForm.rentAmount} onChange={e => setRoomForm({...roomForm, rentAmount: parseFloat(e.target.value)||0})} /></div>
                <button className="btn-primary w-full" onClick={handleAddRoom} disabled={saving}>{saving ? 'Adding...' : 'Add Room'}</button>
              </div>
            </div>
          </div>
        )}

        {/* Allocate Student Modal */}
        {showAllocate && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-semibold">Allocate Student</h3><button onClick={() => setShowAllocate(false)}><X className="w-5 h-5" /></button></div>
              <div className="space-y-3">
                <div><label className="label">Student ID *</label><input className="input" value={allocateForm.studentId} onChange={e => setAllocateForm({...allocateForm, studentId: e.target.value})} /></div>
                <div><label className="label">Room *</label>
                  <select className="input" value={allocateForm.roomId} onChange={e => setAllocateForm({...allocateForm, roomId: e.target.value})}>
                    <option value="">Select room</option>
                    {hostelRooms.map(r => <option key={r.id} value={r.id}>Room {r.roomNumber} ({r.type})</option>)}
                  </select>
                </div>
                <div><label className="label">Bed ID *</label><input className="input" value={allocateForm.bedId} onChange={e => setAllocateForm({...allocateForm, bedId: e.target.value})} placeholder="Enter bed ID" /></div>
                <div><label className="label">Check-in Date</label><input className="input" type="date" value={allocateForm.checkInDate} onChange={e => setAllocateForm({...allocateForm, checkInDate: e.target.value})} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="label">Deposit (₹)</label><input className="input" type="number" value={allocateForm.depositAmount} onChange={e => setAllocateForm({...allocateForm, depositAmount: parseFloat(e.target.value)||0})} /></div>
                  <div><label className="label">Monthly Fee (₹)</label><input className="input" type="number" value={allocateForm.monthlyFee} onChange={e => setAllocateForm({...allocateForm, monthlyFee: parseFloat(e.target.value)||0})} /></div>
                </div>
                <div><label className="label">Emergency Contact</label><input className="input" value={allocateForm.emergencyContact} onChange={e => setAllocateForm({...allocateForm, emergencyContact: e.target.value})} /></div>
                <button className="btn-primary w-full" onClick={handleAllocateStudent} disabled={saving}>{saving ? 'Allocating...' : 'Allocate Student'}</button>
              </div>
            </div>
          </div>
        )}

        {/* Add Complaint Modal */}
        {showAddComplaint && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-semibold">Register Complaint</h3><button onClick={() => setShowAddComplaint(false)}><X className="w-5 h-5" /></button></div>
              <div className="space-y-3">
                <div><label className="label">Student ID</label><input className="input" value={complaintForm.studentId} onChange={e => setComplaintForm({...complaintForm, studentId: e.target.value})} /></div>
                <div><label className="label">Hostel *</label><select className="input" value={complaintForm.hostelId} onChange={e => setComplaintForm({...complaintForm, hostelId: e.target.value})}><option value="">Select</option>{hostels.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}</select></div>
                <div><label className="label">Category</label><input className="input" placeholder="e.g. Plumbing, Electrical" value={complaintForm.category} onChange={e => setComplaintForm({...complaintForm, category: e.target.value})} /></div>
                <div><label className="label">Subject *</label><input className="input" value={complaintForm.subject} onChange={e => setComplaintForm({...complaintForm, subject: e.target.value})} /></div>
                <div><label className="label">Description</label><textarea className="input" rows={2} value={complaintForm.description} onChange={e => setComplaintForm({...complaintForm, description: e.target.value})} /></div>
                <div><label className="label">Priority</label><select className="input" value={complaintForm.priority} onChange={e => setComplaintForm({...complaintForm, priority: e.target.value})}><option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option><option value="URGENT">Urgent</option></select></div>
                <button className="btn-primary w-full" onClick={handleAddComplaint} disabled={saving}>{saving ? 'Submitting...' : 'Submit Complaint'}</button>
              </div>
            </div>
          </div>
        )}

        {/* Apply Leave Modal */}
        {showAddLeave && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-semibold">Apply Leave</h3><button onClick={() => setShowAddLeave(false)}><X className="w-5 h-5" /></button></div>
              <div className="space-y-3">
                <div><label className="label">Student ID *</label><input className="input" value={leaveForm.studentId} onChange={e => setLeaveForm({...leaveForm, studentId: e.target.value})} /></div>
                <div><label className="label">Hostel *</label><select className="input" value={leaveForm.hostelId} onChange={e => setLeaveForm({...leaveForm, hostelId: e.target.value})}><option value="">Select</option>{hostels.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}</select></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="label">From *</label><input className="input" type="date" value={leaveForm.leaveFrom} onChange={e => setLeaveForm({...leaveForm, leaveFrom: e.target.value})} /></div>
                  <div><label className="label">To *</label><input className="input" type="date" value={leaveForm.leaveTo} onChange={e => setLeaveForm({...leaveForm, leaveTo: e.target.value})} /></div>
                </div>
                <div><label className="label">Reason</label><textarea className="input" rows={2} value={leaveForm.reason} onChange={e => setLeaveForm({...leaveForm, reason: e.target.value})} /></div>
                <div><label className="label">Destination</label><input className="input" value={leaveForm.destination} onChange={e => setLeaveForm({...leaveForm, destination: e.target.value})} /></div>
                <div><label className="label">Contact No *</label><input className="input" value={leaveForm.contactNo} onChange={e => setLeaveForm({...leaveForm, contactNo: e.target.value})} /></div>
                <button className="btn-primary w-full" onClick={handleAddLeave} disabled={saving}>{saving ? 'Applying...' : 'Apply Leave'}</button>
              </div>
            </div>
          </div>
        )}

        {/* Add Visitor Modal */}
        {showAddVisitor && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-semibold">Register Visitor</h3><button onClick={() => setShowAddVisitor(false)}><X className="w-5 h-5" /></button></div>
              <div className="space-y-3">
                <div><label className="label">Student ID *</label><input className="input" value={visitorForm.studentId} onChange={e => setVisitorForm({...visitorForm, studentId: e.target.value})} /></div>
                <div><label className="label">Visitor Name *</label><input className="input" value={visitorForm.visitorName} onChange={e => setVisitorForm({...visitorForm, visitorName: e.target.value})} /></div>
                <div><label className="label">Relation</label><input className="input" value={visitorForm.relation} onChange={e => setVisitorForm({...visitorForm, relation: e.target.value})} /></div>
                <div><label className="label">Contact No</label><input className="input" value={visitorForm.contactNo} onChange={e => setVisitorForm({...visitorForm, contactNo: e.target.value})} /></div>
                <div><label className="label">Purpose</label><input className="input" value={visitorForm.purpose} onChange={e => setVisitorForm({...visitorForm, purpose: e.target.value})} /></div>
                <div><label className="label">Visit Date</label><input className="input" type="date" value={visitorForm.visitDate} onChange={e => setVisitorForm({...visitorForm, visitDate: e.target.value})} /></div>
                <button className="btn-primary w-full" onClick={handleAddVisitor} disabled={saving}>{saving ? 'Registering...' : 'Register Visitor'}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
