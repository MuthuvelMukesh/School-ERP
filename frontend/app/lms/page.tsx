'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast, { Toaster } from 'react-hot-toast'
import { BookOpen, UploadCloud, Trash2 } from 'lucide-react'
import { lmsAPI, metadataAPI } from '@/lib/api'

const buildFileUrl = (path: string) => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'
  const baseUrl = apiUrl.replace(/\/api$/, '')
  const cleanPath = path.startsWith('/') ? path.slice(1) : path
  return `${baseUrl}/uploads/${cleanPath}`
}

export default function LmsPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [items, setItems] = useState<any[]>([])
  const [selectedContentId, setSelectedContentId] = useState<string>('')
  const [classOptions, setClassOptions] = useState<any[]>([])
  const [subjectOptions, setSubjectOptions] = useState<any[]>([])
  const [submissionsByContent, setSubmissionsByContent] = useState<Record<string, any[]>>({})
  const [grading, setGrading] = useState<Record<string, { grade: string; feedback: string }>>({})
  const [mySubmissionByContent, setMySubmissionByContent] = useState<Record<string, any | null>>({})
  const [analyticsByContent, setAnalyticsByContent] = useState<Record<string, any>>({})

  const [filters, setFilters] = useState({
    classId: '',
    subjectId: '',
    teacherId: '',
    type: '',
    visibility: '',
    q: ''
  })

  const [form, setForm] = useState({
    title: '',
    description: '',
    type: 'LESSON_NOTE',
    visibility: 'DRAFT',
    classId: '',
    subjectId: '',
    teacherId: '',
    dueDate: '',
    totalMarks: '',
    instructions: ''
  })

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (!userData) {
      router.push('/auth/login')
      return
    }

    const parsed = JSON.parse(userData)
    setUser(parsed)

    if (parsed?.role === 'TEACHER') {
      setForm((prev) => ({
        ...prev,
        teacherId: parsed?.profile?.id || ''
      }))
      setFilters((prev) => ({
        ...prev,
        teacherId: parsed?.profile?.id || ''
      }))
    }

    if (parsed?.role === 'STUDENT') {
      setFilters((prev) => ({
        ...prev,
        classId: parsed?.profile?.classId || ''
      }))
    }

    const initializePage = async () => {
      try {
        const classesResponse = await metadataAPI.getClasses()
        setClassOptions(classesResponse.data.data.classes || [])

        const subjectParams: Record<string, string> = {}
        if (parsed?.role === 'TEACHER') {
          subjectParams.teacherId = parsed?.profile?.id || ''
        }
        if (parsed?.role === 'STUDENT') {
          subjectParams.classId = parsed?.profile?.classId || ''
        }

        const subjectsResponse = await metadataAPI.getSubjects(subjectParams)
        setSubjectOptions(subjectsResponse.data.data.subjects || [])
      } catch (error) {
        toast.error('Failed to load class/subject data')
      }

      try {
        setLoading(true)
        const initialFilters = {
          classId: parsed?.role === 'STUDENT' ? parsed?.profile?.classId || '' : '',
          subjectId: '',
          teacherId: parsed?.role === 'TEACHER' ? parsed?.profile?.id || '' : '',
          type: '',
          visibility: '',
          q: ''
        }
        const response = await lmsAPI.getAll(initialFilters)
        setItems(response.data.data.items || [])
      } catch (error) {
        toast.error('Failed to fetch LMS content')
      } finally {
        setLoading(false)
      }
    }

    initializePage()
  }, [router])

  const fetchMetadata = async (currentUser: any) => {
    try {
      const classesResponse = await metadataAPI.getClasses()
      setClassOptions(classesResponse.data.data.classes || [])

      const subjectParams: Record<string, string> = {}
      if (currentUser?.role === 'TEACHER') {
        subjectParams.teacherId = currentUser?.profile?.id || ''
      }
      if (currentUser?.role === 'STUDENT') {
        subjectParams.classId = currentUser?.profile?.classId || ''
      }

      const subjectsResponse = await metadataAPI.getSubjects(subjectParams)
      setSubjectOptions(subjectsResponse.data.data.subjects || [])
    } catch (error) {
      toast.error('Failed to load class/subject data')
    }
  }

  const fetchContent = async (override?: Record<string, string>) => {
    try {
      setLoading(true)
      const params = { ...filters, ...override }
      const response = await lmsAPI.getAll(params)
      setItems(response.data.data.items || [])
    } catch (error) {
      toast.error('Failed to fetch LMS content')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!form.title || !form.classId || !form.subjectId || !form.teacherId) {
      toast.error('Please fill all required fields')
      return
    }

    try {
      setSaving(true)
      const payload = {
        ...form,
        totalMarks: form.totalMarks ? Number(form.totalMarks) : undefined,
        dueDate: form.dueDate || undefined
      }

      const response = await lmsAPI.create(payload)
      const content = response.data.data.content

      toast.success('LMS content created')
      setSelectedContentId(content.id)
      setForm((prev) => ({
        ...prev,
        title: '',
        description: '',
        dueDate: '',
        totalMarks: '',
        instructions: ''
      }))
      fetchContent()
    } catch (error) {
      toast.error('Failed to create LMS content')
    } finally {
      setSaving(false)
    }
  }

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    if (!selectedContentId) {
      toast.error('Select LMS content before uploading')
      return
    }

    try {
      const formData = new FormData()
      Array.from(files).forEach((file) => {
        formData.append('files', file)
      })

      await lmsAPI.uploadAttachments(selectedContentId, formData)
      toast.success('Attachments uploaded')
      fetchContent()
    } catch (error) {
      toast.error('Failed to upload attachments')
    } finally {
      event.target.value = ''
    }
  }

  const handleAssignmentSubmit = async (contentId: string, files: FileList | null) => {
    if (!files || files.length === 0) {
      toast.error('Select files to submit')
      return
    }

    try {
      const formData = new FormData()
      Array.from(files).forEach((file) => {
        formData.append('files', file)
      })

      await lmsAPI.createSubmission(contentId, formData)
      toast.success('Assignment submitted')
      fetchContent()
    } catch (error) {
      toast.error('Failed to submit assignment')
    }
  }

  const handleDeleteContent = async (id: string) => {
    try {
      await lmsAPI.delete(id)
      toast.success('LMS content deleted')
      if (selectedContentId === id) {
        setSelectedContentId('')
      }
      fetchContent()
    } catch (error) {
      toast.error('Failed to delete LMS content')
    }
  }

  const handleDeleteAttachment = async (contentId: string, attachmentId: string) => {
    try {
      await lmsAPI.deleteAttachment(contentId, attachmentId)
      toast.success('Attachment deleted')
      fetchContent()
    } catch (error) {
      toast.error('Failed to delete attachment')
    }
  }

  const handleLoadSubmissions = async (contentId: string) => {
    try {
      const response = await lmsAPI.getSubmissions(contentId)
      setSubmissionsByContent((prev) => ({
        ...prev,
        [contentId]: response.data.data.submissions || []
      }))
    } catch (error) {
      toast.error('Failed to load submissions')
    }
  }

  const handleGrade = async (contentId: string, submissionId: string) => {
    const payload = grading[submissionId]
    try {
      await lmsAPI.gradeSubmission(contentId, submissionId, {
        grade: payload?.grade || null,
        feedback: payload?.feedback || null
      })
      toast.success('Submission graded')
      handleLoadSubmissions(contentId)
    } catch (error) {
      toast.error('Failed to grade submission')
    }
  }

  const handleLoadMySubmission = async (contentId: string) => {
    try {
      const response = await lmsAPI.getMySubmission(contentId)
      setMySubmissionByContent((prev) => ({
        ...prev,
        [contentId]: response.data.data.submission || null
      }))
    } catch (error) {
      toast.error('Failed to load submission details')
    }
  }

  const handleLoadAnalytics = async (contentId: string) => {
    try {
      const response = await lmsAPI.getAnalytics(contentId)
      setAnalyticsByContent((prev) => ({
        ...prev,
        [contentId]: response.data.data.analytics
      }))
    } catch (error) {
      toast.error('Failed to load analytics')
    }
  }

  const renderDueDate = (dueDate?: string | null) => {
    if (!dueDate) return null
    const due = new Date(dueDate)
    const today = new Date()
    const diffMs = due.getTime() - today.getTime()
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
    const label = diffDays < 0 ? `Overdue by ${Math.abs(diffDays)} day(s)` : `Due in ${diffDays} day(s)`
    return (
      <span className={`text-xs ${diffDays < 0 ? 'text-red-600' : 'text-amber-600'}`}>
        {label}
      </span>
    )
  }

  const selectedContent = useMemo(
    () => items.find((item) => item.id === selectedContentId),
    [items, selectedContentId]
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />

      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <BookOpen className="w-6 h-6 text-primary-600" />
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Learning Management System</h1>
              <p className="text-sm text-gray-500">Digital repository for lessons, videos, and assignments</p>
            </div>
          </div>
          <Link href="/dashboard" className="text-sm text-primary-600 hover:text-primary-700">
            Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {user?.role !== 'STUDENT' && user?.role !== 'PARENT' && (
          <section className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Create LMS Content</h2>
            <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Title *</label>
                <input
                  value={form.title}
                  onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2"
                  placeholder="Lesson title"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Type *</label>
                <select
                  value={form.type}
                  onChange={(event) => setForm((prev) => ({ ...prev, type: event.target.value }))}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2"
                >
                  <option value="LESSON_NOTE">Lesson Note</option>
                  <option value="VIDEO_LECTURE">Video Lecture</option>
                  <option value="ASSIGNMENT">Assignment</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Visibility *</label>
                <select
                  value={form.visibility}
                  onChange={(event) => setForm((prev) => ({ ...prev, visibility: event.target.value }))}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2"
                >
                  <option value="DRAFT">Draft</option>
                  <option value="PUBLISHED">Published</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Class *</label>
                <select
                  value={form.classId}
                  onChange={async (event) => {
                    const classId = event.target.value
                    setForm((prev) => ({ ...prev, classId }))
                    if (classId) {
                      const subjectsResponse = await metadataAPI.getSubjects({ classId })
                      setSubjectOptions(subjectsResponse.data.data.subjects || [])
                    }
                  }}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2"
                  required
                >
                  <option value="">Select class</option>
                  {classOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name} {option.section ? `(${option.section})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Subject *</label>
                <select
                  value={form.subjectId}
                  onChange={(event) => setForm((prev) => ({ ...prev, subjectId: event.target.value }))}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2"
                  required
                >
                  <option value="">Select subject</option>
                  {subjectOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name} ({option.code})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Teacher ID *</label>
                <input
                  value={form.teacherId}
                  onChange={(event) => setForm((prev) => ({ ...prev, teacherId: event.target.value }))}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2"
                  placeholder="Teacher ID"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Due Date</label>
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={(event) => setForm((prev) => ({ ...prev, dueDate: event.target.value }))}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Total Marks</label>
                <input
                  type="number"
                  value={form.totalMarks}
                  onChange={(event) => setForm((prev) => ({ ...prev, totalMarks: event.target.value }))}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2"
                  min="0"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={form.description}
                  onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2"
                  rows={3}
                  placeholder="Brief description"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Instructions</label>
                <textarea
                  value={form.instructions}
                  onChange={(event) => setForm((prev) => ({ ...prev, instructions: event.target.value }))}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2"
                  rows={3}
                  placeholder="Assignment or lesson instructions"
                />
              </div>
              <div className="md:col-span-2 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-60"
                >
                  {saving ? 'Saving...' : 'Create Content'}
                </button>
              </div>
            </form>
          </section>
        )}

        <section className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">LMS Repository</h2>
              <p className="text-sm text-gray-500">Search and manage uploaded materials</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <select
                value={filters.classId}
                onChange={async (event) => {
                  const classId = event.target.value
                  setFilters((prev) => ({ ...prev, classId }))
                  if (classId) {
                    const subjectsResponse = await metadataAPI.getSubjects({ classId })
                    setSubjectOptions(subjectsResponse.data.data.subjects || [])
                  }
                }}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
              >
                <option value="">All classes</option>
                {classOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name} {option.section ? `(${option.section})` : ''}
                  </option>
                ))}
              </select>
              <select
                value={filters.subjectId}
                onChange={(event) => setFilters((prev) => ({ ...prev, subjectId: event.target.value }))}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
              >
                <option value="">All subjects</option>
                {subjectOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
              <input
                value={filters.q}
                onChange={(event) => setFilters((prev) => ({ ...prev, q: event.target.value }))}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
                placeholder="Search"
              />
              <select
                value={filters.type}
                onChange={(event) => setFilters((prev) => ({ ...prev, type: event.target.value }))}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
              >
                <option value="">All types</option>
                <option value="LESSON_NOTE">Lesson Notes</option>
                <option value="VIDEO_LECTURE">Video Lectures</option>
                <option value="ASSIGNMENT">Assignments</option>
              </select>
              <select
                value={filters.visibility}
                onChange={(event) => setFilters((prev) => ({ ...prev, visibility: event.target.value }))}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
              >
                <option value="">All visibility</option>
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
                <option value="ARCHIVED">Archived</option>
              </select>
              <button
                onClick={() => fetchContent()}
                className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm"
              >
                Apply
              </button>
            </div>
          </div>

          {loading ? (
            <div className="py-6 text-center text-gray-500">Loading content...</div>
          ) : (
            <div className="space-y-4">
              {items.length === 0 && (
                <div className="text-center text-gray-500 py-6">No content found.</div>
              )}
              {items.map((item) => (
                <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold text-gray-900">{item.title}</h3>
                      <p className="text-sm text-gray-500">
                        {item.type} • {item.visibility}
                        {item.dueDate && (
                          <span className="ml-2">• {new Date(item.dueDate).toLocaleDateString()}</span>
                        )}
                      </p>
                      {renderDueDate(item.dueDate)}
                      {item.description && (
                        <p className="text-sm text-gray-600 mt-2">{item.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedContentId(item.id)}
                        className={`px-3 py-1 rounded-lg text-sm ${selectedContentId === item.id ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                      >
                        {selectedContentId === item.id ? 'Selected' : 'Select'}
                      </button>
                      {user?.role !== 'STUDENT' && user?.role !== 'PARENT' && item.type === 'ASSIGNMENT' && (
                        <button
                          onClick={() => handleLoadSubmissions(item.id)}
                          className="px-3 py-1 rounded-lg text-sm bg-gray-900 text-white"
                        >
                          View Submissions
                        </button>
                      )}
                      {user?.role !== 'STUDENT' && user?.role !== 'PARENT' && item.type === 'ASSIGNMENT' && (
                        <button
                          onClick={() => handleLoadAnalytics(item.id)}
                          className="px-3 py-1 rounded-lg text-sm bg-primary-50 text-primary-600"
                        >
                          View Analytics
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteContent(item.id)}
                        className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100"
                        title="Delete content"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Attachments</p>
                    {item.attachments?.length ? (
                      <ul className="space-y-2">
                        {item.attachments.map((file: any) => (
                          <li key={file.id} className="flex items-center justify-between gap-2">
                            <a
                              href={buildFileUrl(file.path)}
                              target="_blank"
                              rel="noreferrer"
                              className="text-sm text-primary-600 hover:underline"
                            >
                              {file.originalName}
                            </a>
                            <button
                              onClick={() => handleDeleteAttachment(item.id, file.id)}
                              className="text-xs text-red-600 hover:text-red-700"
                            >
                              Remove
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-500">No attachments yet.</p>
                    )}
                  </div>

                  {user?.role === 'STUDENT' && item.type === 'ASSIGNMENT' && (
                    <div className="mt-4 border-t pt-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">Submit Assignment</p>
                      <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-primary-300 text-primary-600 cursor-pointer">
                        <UploadCloud className="w-4 h-4" />
                        <span className="text-sm">Upload submission</span>
                        <input
                          type="file"
                          multiple
                          className="hidden"
                          onChange={(event) => handleAssignmentSubmit(item.id, event.target.files)}
                        />
                      </label>
                      <div className="mt-3">
                        <button
                          onClick={() => handleLoadMySubmission(item.id)}
                          className="text-xs text-primary-600 hover:underline"
                        >
                          View my submission status
                        </button>
                        {mySubmissionByContent[item.id] && (
                          <div className="mt-2 text-xs text-gray-600">
                            <p>Status: {mySubmissionByContent[item.id].status}</p>
                            {mySubmissionByContent[item.id].grade !== null && (
                              <p>Grade: {mySubmissionByContent[item.id].grade}</p>
                            )}
                            {mySubmissionByContent[item.id].feedback && (
                              <p>Feedback: {mySubmissionByContent[item.id].feedback}</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {user?.role !== 'STUDENT' && user?.role !== 'PARENT' && item.type === 'ASSIGNMENT' && submissionsByContent[item.id] && (
                    <div className="mt-4 border-t pt-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">Submissions</p>
                      {submissionsByContent[item.id].length === 0 && (
                        <p className="text-sm text-gray-500">No submissions yet.</p>
                      )}
                      <div className="space-y-4">
                        {submissionsByContent[item.id].map((submission) => (
                          <div key={submission.id} className="rounded-lg border border-gray-200 p-3">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                              <div>
                                <p className="text-sm font-semibold text-gray-900">
                                  {submission.student?.firstName} {submission.student?.lastName}
                                </p>
                                <p className="text-xs text-gray-500">Status: {submission.status}</p>
                              </div>
                              <div className="text-xs text-gray-500">
                                Submitted: {new Date(submission.submittedAt).toLocaleDateString()}
                              </div>
                            </div>

                            <div className="mt-3">
                              {submission.attachments?.length ? (
                                <ul className="space-y-1">
                                  {submission.attachments.map((file: any) => (
                                    <li key={file.id}>
                                      <a
                                        href={buildFileUrl(file.path)}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-xs text-primary-600 hover:underline"
                                      >
                                        {file.originalName}
                                      </a>
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="text-xs text-gray-500">No attachments.</p>
                              )}
                            </div>

                            <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2">
                              <input
                                type="number"
                                min="0"
                                placeholder="Grade"
                                value={grading[submission.id]?.grade || ''}
                                onChange={(event) =>
                                  setGrading((prev) => ({
                                    ...prev,
                                    [submission.id]: {
                                      grade: event.target.value,
                                      feedback: prev[submission.id]?.feedback || ''
                                    }
                                  }))
                                }
                                className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
                              />
                              <input
                                type="text"
                                placeholder="Feedback"
                                value={grading[submission.id]?.feedback || ''}
                                onChange={(event) =>
                                  setGrading((prev) => ({
                                    ...prev,
                                    [submission.id]: {
                                      grade: prev[submission.id]?.grade || '',
                                      feedback: event.target.value
                                    }
                                  }))
                                }
                                className="rounded-lg border border-gray-200 px-3 py-2 text-sm md:col-span-2"
                              />
                            </div>
                            <div className="mt-2 flex justify-end">
                              <button
                                onClick={() => handleGrade(item.id, submission.id)}
                                className="px-3 py-1 rounded-lg text-sm bg-primary-600 text-white"
                              >
                                Save Grade
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {user?.role !== 'STUDENT' && user?.role !== 'PARENT' && item.type === 'ASSIGNMENT' && analyticsByContent[item.id] && (
                    <div className="mt-4 border-t pt-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">Analytics</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="rounded-lg bg-gray-50 p-3">
                          <p className="text-xs text-gray-500">Total</p>
                          <p className="text-sm font-semibold text-gray-900">{analyticsByContent[item.id].totalSubmissions}</p>
                        </div>
                        <div className="rounded-lg bg-gray-50 p-3">
                          <p className="text-xs text-gray-500">Graded</p>
                          <p className="text-sm font-semibold text-gray-900">{analyticsByContent[item.id].gradedSubmissions}</p>
                        </div>
                        <div className="rounded-lg bg-gray-50 p-3">
                          <p className="text-xs text-gray-500">Late</p>
                          <p className="text-sm font-semibold text-gray-900">{analyticsByContent[item.id].lateSubmissions}</p>
                        </div>
                        <div className="rounded-lg bg-gray-50 p-3">
                          <p className="text-xs text-gray-500">Avg Grade</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {Number(analyticsByContent[item.id].averageGrade || 0).toFixed(1)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
        {user?.role !== 'STUDENT' && user?.role !== 'PARENT' && (
          <section className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Upload Attachments</h2>
            <p className="text-sm text-gray-500 mb-4">
              Upload multimedia notes, videos, or assignments to the selected content.
            </p>
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-1">
                <select
                  value={selectedContentId}
                  onChange={(event) => setSelectedContentId(event.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2"
                >
                  <option value="">Select content</option>
                  {items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.title}
                    </option>
                  ))}
                </select>
              </div>
              <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-dashed border-primary-300 text-primary-600 cursor-pointer">
                <UploadCloud className="w-4 h-4" />
                <span className="text-sm">Upload files</span>
                <input type="file" multiple className="hidden" onChange={handleUpload} />
              </label>
            </div>
            {selectedContent && (
              <p className="mt-3 text-sm text-gray-600">
                Selected: <span className="font-medium text-gray-900">{selectedContent.title}</span>
              </p>
            )}
          </section>
        )}
      </main>
    </div>
  )
}
