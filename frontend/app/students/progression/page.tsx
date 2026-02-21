'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast, { Toaster } from 'react-hot-toast'
import { metadataAPI, studentAPI } from '@/lib/api'

export default function StudentProgressionPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [students, setStudents] = useState<any[]>([])
  const [classes, setClasses] = useState<any[]>([])

  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([])
  const [promoteClassId, setPromoteClassId] = useState('')
  const [historyStudentId, setHistoryStudentId] = useState('')
  const [history, setHistory] = useState<{ promotions: any[]; transfers: any[] }>({ promotions: [], transfers: [] })

  const [transferForm, setTransferForm] = useState({
    studentId: '',
    transferType: 'INTERNAL',
    toClassId: '',
    toSchoolName: '',
    toSchoolAddress: '',
    transferDate: '',
    reason: '',
    remarks: ''
  })

  const fetchData = useCallback(async () => {
    try {
      const [studentsRes, classesRes] = await Promise.all([
        studentAPI.getAll({ page: 1, limit: 200 }),
        metadataAPI.getClasses()
      ])

      const studentList = studentsRes.data?.data?.students || []
      setStudents(studentList)
      setClasses(classesRes.data?.data?.classes || [])
      if (studentList.length > 0 && !historyStudentId) {
        setHistoryStudentId(studentList[0].id)
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load progression data')
    } finally {
      setLoading(false)
    }
  }, [historyStudentId])

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (!userData) {
      router.push('/auth/login')
      return
    }

    const user = JSON.parse(userData)
    if (!['ADMIN', 'PRINCIPAL'].includes(user?.role)) {
      toast.error('Access denied')
      router.push('/dashboard')
      return
    }

    fetchData()
  }, [router, fetchData])

  const handleToggleStudent = (studentId: string) => {
    setSelectedStudentIds((prev) => (
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId]
    ))
  }

  const handlePromote = async () => {
    if (selectedStudentIds.length === 0 || !promoteClassId) {
      toast.error('Select students and target class')
      return
    }

    try {
      await studentAPI.promote({
        studentIds: selectedStudentIds,
        toClassId: promoteClassId
      })
      toast.success('Promotion completed')
      setSelectedStudentIds([])
      fetchData()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Promotion failed')
    }
  }

  const handleDetain = async () => {
    if (selectedStudentIds.length === 0) {
      toast.error('Select students to detain')
      return
    }

    try {
      await studentAPI.detain({
        studentIds: selectedStudentIds
      })
      toast.success('Detention recorded')
      setSelectedStudentIds([])
      fetchData()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Detention failed')
    }
  }

  const handleTransfer = async (event: React.FormEvent) => {
    event.preventDefault()
    try {
      await studentAPI.transfer({
        studentId: transferForm.studentId,
        transferType: transferForm.transferType as 'INTERNAL' | 'EXTERNAL',
        toClassId: transferForm.transferType === 'INTERNAL' ? transferForm.toClassId : undefined,
        toSchoolName: transferForm.transferType === 'EXTERNAL' ? transferForm.toSchoolName : undefined,
        toSchoolAddress: transferForm.transferType === 'EXTERNAL' ? transferForm.toSchoolAddress : undefined,
        transferDate: transferForm.transferDate || undefined,
        reason: transferForm.reason || undefined,
        remarks: transferForm.remarks || undefined
      })
      toast.success('Transfer completed')
      setTransferForm({
        studentId: '',
        transferType: 'INTERNAL',
        toClassId: '',
        toSchoolName: '',
        toSchoolAddress: '',
        transferDate: '',
        reason: '',
        remarks: ''
      })
      fetchData()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Transfer failed')
    }
  }

  const handleLoadHistory = async () => {
    if (!historyStudentId) {
      toast.error('Select student to view history')
      return
    }

    try {
      const response = await studentAPI.getProgressHistory(historyStudentId)
      setHistory({
        promotions: response.data?.data?.promotions || [],
        transfers: response.data?.data?.transfers || []
      })
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load history')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <Toaster position="top-right" />
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Student Promotion & Transfer</h1>
          <Link href="/dashboard" className="text-sm text-primary-600 hover:text-primary-700">
            Back to Dashboard
          </Link>
        </div>

        {loading ? (
          <div className="card"><p className="text-gray-600">Loading student progression data...</p></div>
        ) : (
          <>
            <div className="card space-y-4">
              <h2 className="text-lg font-semibold">Promotion / Detention</h2>
              <div className="flex flex-wrap gap-3 items-center">
                <select className="input max-w-sm" value={promoteClassId} onChange={(e) => setPromoteClassId(e.target.value)}>
                  <option value="">Select target class</option>
                  {classes.map((item) => (
                    <option key={item.id} value={item.id}>{item.name}{item.section ? ` - ${item.section}` : ''}</option>
                  ))}
                </select>
                <button className="btn-primary" onClick={handlePromote}>Promote Selected</button>
                <button className="btn-secondary" onClick={handleDetain}>Detain Selected</button>
              </div>

              {students.length === 0 ? (
                <p className="text-sm text-gray-600">No students found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-gray-600">
                        <th className="py-2 pr-4">Select</th>
                        <th className="py-2 pr-4">Admission No</th>
                        <th className="py-2 pr-4">Name</th>
                        <th className="py-2 pr-4">Class</th>
                        <th className="py-2 pr-4">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((student) => (
                        <tr key={student.id} className="border-b last:border-0">
                          <td className="py-2 pr-4">
                            <input type="checkbox" checked={selectedStudentIds.includes(student.id)} onChange={() => handleToggleStudent(student.id)} />
                          </td>
                          <td className="py-2 pr-4">{student.admissionNo}</td>
                          <td className="py-2 pr-4">{student.firstName} {student.lastName}</td>
                          <td className="py-2 pr-4">{student.class?.name || '-'}</td>
                          <td className="py-2 pr-4">{student.isActive ? 'Active' : 'Inactive'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <div className="card">
                <h2 className="text-lg font-semibold mb-4">Transfer Student</h2>
                <form onSubmit={handleTransfer} className="space-y-3">
                  <select className="input" value={transferForm.studentId} onChange={(e) => setTransferForm((prev) => ({ ...prev, studentId: e.target.value }))} required>
                    <option value="">Select student</option>
                    {students.map((student) => (
                      <option key={student.id} value={student.id}>{student.admissionNo} - {student.firstName} {student.lastName}</option>
                    ))}
                  </select>

                  <select className="input" value={transferForm.transferType} onChange={(e) => setTransferForm((prev) => ({ ...prev, transferType: e.target.value }))}>
                    <option value="INTERNAL">INTERNAL</option>
                    <option value="EXTERNAL">EXTERNAL</option>
                  </select>

                  {transferForm.transferType === 'INTERNAL' ? (
                    <select className="input" value={transferForm.toClassId} onChange={(e) => setTransferForm((prev) => ({ ...prev, toClassId: e.target.value }))} required>
                      <option value="">Select target class</option>
                      {classes.map((item) => (
                        <option key={item.id} value={item.id}>{item.name}{item.section ? ` - ${item.section}` : ''}</option>
                      ))}
                    </select>
                  ) : (
                    <>
                      <input className="input" placeholder="Target school name" value={transferForm.toSchoolName} onChange={(e) => setTransferForm((prev) => ({ ...prev, toSchoolName: e.target.value }))} required />
                      <input className="input" placeholder="Target school address" value={transferForm.toSchoolAddress} onChange={(e) => setTransferForm((prev) => ({ ...prev, toSchoolAddress: e.target.value }))} required />
                    </>
                  )}

                  <input className="input" type="date" value={transferForm.transferDate} onChange={(e) => setTransferForm((prev) => ({ ...prev, transferDate: e.target.value }))} />
                  <input className="input" placeholder="Reason (optional)" value={transferForm.reason} onChange={(e) => setTransferForm((prev) => ({ ...prev, reason: e.target.value }))} />
                  <input className="input" placeholder="Remarks (optional)" value={transferForm.remarks} onChange={(e) => setTransferForm((prev) => ({ ...prev, remarks: e.target.value }))} />

                  <button className="btn-primary" type="submit">Submit Transfer</button>
                </form>
              </div>

              <div className="card">
                <h2 className="text-lg font-semibold mb-4">Progress History</h2>
                <div className="flex gap-3 mb-4">
                  <select className="input" value={historyStudentId} onChange={(e) => setHistoryStudentId(e.target.value)}>
                    <option value="">Select student</option>
                    {students.map((student) => (
                      <option key={student.id} value={student.id}>{student.admissionNo} - {student.firstName} {student.lastName}</option>
                    ))}
                  </select>
                  <button className="btn-secondary" onClick={handleLoadHistory}>Load</button>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2">Promotions / Detentions</h3>
                    {history.promotions.length === 0 ? (
                      <p className="text-sm text-gray-600">No records.</p>
                    ) : (
                      <div className="space-y-2 text-sm">
                        {history.promotions.map((item) => (
                          <div key={item.id} className="border rounded px-3 py-2">
                            <p className="font-medium">{item.status}</p>
                            <p className="text-gray-600">{item.fromClass?.name || '-'} → {item.toClass?.name || '-'}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="font-medium mb-2">Transfers</h3>
                    {history.transfers.length === 0 ? (
                      <p className="text-sm text-gray-600">No records.</p>
                    ) : (
                      <div className="space-y-2 text-sm">
                        {history.transfers.map((item) => (
                          <div key={item.id} className="border rounded px-3 py-2">
                            <p className="font-medium">{item.transferType}</p>
                            <p className="text-gray-600">
                              {item.transferType === 'INTERNAL'
                                ? `${item.fromClass?.name || '-'} → ${item.toClass?.name || '-'}`
                                : `${item.fromClass?.name || '-'} → ${item.toSchoolName || '-'}`}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
