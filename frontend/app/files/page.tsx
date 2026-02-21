'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast, { Toaster } from 'react-hot-toast'
import { FileText, Upload, Download, Trash2, HardDrive, FolderOpen } from 'lucide-react'
import { fileAPI } from '@/lib/api'

export default function FilesPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [tab, setTab] = useState<'upload' | 'stats'>('upload')
  const [uploading, setUploading] = useState(false)
  const [stats, setStats] = useState<any>(null)

  // Upload form
  const [uploadType, setUploadType] = useState<'student' | 'staff'>('student')
  const [entityId, setEntityId] = useState('')
  const [docType, setDocType] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  // Recent files (from stats)
  const [files, setFiles] = useState<any[]>([])

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (!userData) { router.push('/auth/login'); return }
    setUser(JSON.parse(userData))
    fetchStats()
  }, [router])

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'PRINCIPAL'

  const fetchStats = async () => {
    try {
      const res = await fileAPI.getStats()
      const data = res.data?.data || res.data
      setStats(data)
      setFiles(data?.recentFiles || data?.files || [])
    } catch { /* stats may not be available for all roles */ }
  }

  const handleUpload = async () => {
    if (!fileRef.current?.files?.length) { toast.error('Select a file'); return }
    if (!entityId) { toast.error(`Enter ${uploadType} ID`); return }
    if (!docType) { toast.error('Enter document type'); return }

    const formData = new FormData()
    formData.append('file', fileRef.current.files[0])
    formData.append(uploadType === 'student' ? 'studentId' : 'staffId', entityId)
    formData.append('documentType', docType)

    setUploading(true)
    try {
      const fn = uploadType === 'student' ? fileAPI.uploadStudentDoc : fileAPI.uploadStaffDoc
      await fn(formData)
      toast.success('File uploaded successfully')
      setEntityId('')
      setDocType('')
      if (fileRef.current) fileRef.current.value = ''
      fetchStats()
    } catch (err: any) { toast.error(err.response?.data?.message || 'Upload failed') }
    finally { setUploading(false) }
  }

  const handleDownload = async (filePath: string) => {
    try {
      const res = await fileAPI.download(filePath)
      const blob = new Blob([res.data])
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filePath.split('/').pop() || 'file'
      a.click()
      URL.revokeObjectURL(url)
    } catch { toast.error('Download failed') }
  }

  const handleDelete = async (filePath: string) => {
    if (!confirm('Delete this file permanently?')) return
    try {
      await fileAPI.delete(filePath)
      toast.success('File deleted')
      fetchStats()
    } catch (err: any) { toast.error(err.response?.data?.message || 'Delete failed') }
  }

  const handleCleanup = async () => {
    if (!confirm('Remove orphaned/temporary files?')) return
    try {
      await fileAPI.cleanup()
      toast.success('Cleanup completed')
      fetchStats()
    } catch (err: any) { toast.error(err.response?.data?.message || 'Cleanup failed') }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <Toaster position="top-right" />
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FolderOpen className="w-7 h-7 text-primary-600" />
            <h1 className="text-2xl font-bold text-gray-900">File Management</h1>
          </div>
          <Link href="/dashboard" className="text-sm text-primary-600 hover:text-primary-700">Back to Dashboard</Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b pb-2">
          {(['upload', 'stats'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-t-lg text-sm font-medium capitalize ${tab === t ? 'bg-white border border-b-0 text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}>
              {t === 'upload' ? 'Upload & Browse' : 'Storage Stats'}
            </button>
          ))}
        </div>

        {/* Upload & Browse Tab */}
        {tab === 'upload' && (
          <div className="space-y-6">
            {/* Upload Form */}
            <div className="card">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Upload className="w-5 h-5" /> Upload Document</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Upload Type</label>
                  <select className="input" value={uploadType} onChange={e => setUploadType(e.target.value as any)}>
                    <option value="student">Student Document</option>
                    <option value="staff">Staff Document</option>
                  </select>
                </div>
                <div>
                  <label className="label">{uploadType === 'student' ? 'Student' : 'Staff'} ID</label>
                  <input className="input" placeholder={`Enter ${uploadType} ID`} value={entityId}
                    onChange={e => setEntityId(e.target.value)} />
                </div>
                <div>
                  <label className="label">Document Type</label>
                  <select className="input" value={docType} onChange={e => setDocType(e.target.value)}>
                    <option value="">Select type</option>
                    <option value="ID_PROOF">ID Proof</option>
                    <option value="BIRTH_CERTIFICATE">Birth Certificate</option>
                    <option value="TRANSFER_CERTIFICATE">Transfer Certificate</option>
                    <option value="MARKSHEET">Marksheet</option>
                    <option value="PHOTO">Photo</option>
                    <option value="MEDICAL_RECORD">Medical Record</option>
                    <option value="ADDRESS_PROOF">Address Proof</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label className="label">File</label>
                  <input ref={fileRef} type="file" className="input" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" />
                </div>
              </div>
              <button className="btn-primary mt-4 flex items-center gap-2" onClick={handleUpload} disabled={uploading}>
                <Upload className="w-4 h-4" /> {uploading ? 'Uploading...' : 'Upload'}
              </button>
              <p className="text-xs text-gray-400 mt-2">Supported: PDF, JPG, PNG, DOC, DOCX (max 10MB)</p>
            </div>

            {/* Recent Files */}
            <div className="card">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2"><FileText className="w-5 h-5" /> Recent Files</h2>
                {isAdmin && (
                  <button className="btn-secondary text-xs text-red-600 flex items-center gap-1" onClick={handleCleanup}>
                    <Trash2 className="w-3 h-3" /> Cleanup
                  </button>
                )}
              </div>
              {files.length === 0 ? (
                <p className="text-gray-500 text-sm">No files found. Upload your first document above.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-gray-600">
                        <th className="py-2 pr-4">Name</th>
                        <th className="py-2 pr-4">Type</th>
                        <th className="py-2 pr-4">Size</th>
                        <th className="py-2 pr-4">Uploaded</th>
                        <th className="py-2 pr-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {files.map((f: any, i: number) => (
                        <tr key={i} className="border-b last:border-0 hover:bg-gray-50">
                          <td className="py-2 pr-4 font-mono text-xs">{f.name || f.fileName || f.filePath?.split('/').pop() || '-'}</td>
                          <td className="py-2 pr-4"><span className="px-2 py-0.5 rounded bg-gray-100 text-xs">{f.documentType || f.type || '-'}</span></td>
                          <td className="py-2 pr-4 text-xs">{f.size ? `${(f.size / 1024).toFixed(1)} KB` : '-'}</td>
                          <td className="py-2 pr-4 text-xs">{f.createdAt ? new Date(f.createdAt).toLocaleDateString() : '-'}</td>
                          <td className="py-2 pr-4 flex gap-2">
                            <button className="text-primary-600 hover:text-primary-800" onClick={() => handleDownload(f.filePath || f.path)}>
                              <Download className="w-4 h-4" />
                            </button>
                            {isAdmin && (
                              <button className="text-red-500 hover:text-red-700" onClick={() => handleDelete(f.filePath || f.path)}>
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Storage Stats Tab */}
        {tab === 'stats' && (
          <div className="card">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><HardDrive className="w-5 h-5" /> Storage Overview</h2>
            {stats ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg text-center">
                  <p className="text-xs text-blue-600">Total Files</p>
                  <p className="text-2xl font-bold text-blue-800">{stats.totalFiles ?? stats.count ?? 0}</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg text-center">
                  <p className="text-xs text-green-600">Student Documents</p>
                  <p className="text-2xl font-bold text-green-800">{stats.studentFiles ?? stats.studentDocs ?? 0}</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg text-center">
                  <p className="text-xs text-purple-600">Staff Documents</p>
                  <p className="text-2xl font-bold text-purple-800">{stats.staffFiles ?? stats.staffDocs ?? 0}</p>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg text-center">
                  <p className="text-xs text-orange-600">Storage Used</p>
                  <p className="text-2xl font-bold text-orange-800">{stats.totalSize ? `${(stats.totalSize / (1024 * 1024)).toFixed(1)} MB` : stats.storageUsed || '0 MB'}</p>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">Storage statistics not available.</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
