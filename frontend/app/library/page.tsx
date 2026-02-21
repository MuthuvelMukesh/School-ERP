'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast, { Toaster } from 'react-hot-toast'
import { BookOpen, Plus, Search, RotateCcw, AlertTriangle, Settings, BarChart3, X } from 'lucide-react'
import { libraryAPI } from '@/lib/api'

export default function LibraryPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'books' | 'overdue' | 'stats' | 'settings'>('books')

  // Books state
  const [books, setBooks] = useState<any[]>([])
  const [bookSearch, setBookSearch] = useState('')
  const [bookCategory, setBookCategory] = useState('')
  const [bookPage, setBookPage] = useState(1)
  const [bookTotal, setBookTotal] = useState(0)

  // Overdue
  const [overdueBooks, setOverdueBooks] = useState<any[]>([])

  // Stats
  const [stats, setStats] = useState<any>(null)
  const [mostBorrowed, setMostBorrowed] = useState<any[]>([])

  // Settings
  const [settings, setSettings] = useState<any>(null)
  const [settingsForm, setSettingsForm] = useState<any>({})

  // Add Book Modal
  const [showAddBook, setShowAddBook] = useState(false)
  const [bookForm, setBookForm] = useState({ title: '', author: '', isbn: '', category: '', publisher: '', edition: '', description: '', totalCopies: 1, costPrice: 0 })
  const [saving, setSaving] = useState(false)

  // Issue / Return Modal
  const [showIssue, setShowIssue] = useState(false)
  const [issueForm, setIssueForm] = useState({ bookId: '', memberId: '' })
  const [showReturn, setShowReturn] = useState(false)
  const [returnForm, setReturnForm] = useState({ borrowRecordId: '' })

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (!userData) { router.push('/auth/login'); return }
    setUser(JSON.parse(userData))
    fetchBooks()
  }, [router])

  const fetchBooks = async (page = 1, search = bookSearch, category = bookCategory) => {
    setLoading(true)
    try {
      const res = await libraryAPI.getAllBooks({ page, limit: 20, search, category: category || undefined })
      setBooks(res.data?.data?.books || [])
      setBookTotal(res.data?.data?.pagination?.total || 0)
      setBookPage(page)
    } catch { toast.error('Failed to load books') }
    finally { setLoading(false) }
  }

  const fetchOverdue = async () => {
    try {
      const res = await libraryAPI.getOverdueBooks()
      setOverdueBooks(res.data?.data?.overdueBooks || res.data?.data || [])
    } catch { toast.error('Failed to load overdue books') }
  }

  const fetchStats = async () => {
    try {
      const [statsRes, borrowedRes] = await Promise.all([
        libraryAPI.getStats(),
        libraryAPI.getMostBorrowed({ limit: 10 })
      ])
      setStats(statsRes.data?.data || statsRes.data)
      setMostBorrowed(borrowedRes.data?.data?.books || borrowedRes.data?.data || [])
    } catch { toast.error('Failed to load stats') }
  }

  const fetchSettings = async () => {
    try {
      const res = await libraryAPI.getSettings()
      const s = res.data?.data?.settings || res.data?.data || {}
      setSettings(s)
      setSettingsForm(s)
    } catch { toast.error('Failed to load settings') }
  }

  const handleTabChange = (t: typeof tab) => {
    setTab(t)
    if (t === 'overdue') fetchOverdue()
    if (t === 'stats') fetchStats()
    if (t === 'settings') fetchSettings()
  }

  const handleAddBook = async () => {
    if (!bookForm.title || !bookForm.author) { toast.error('Title and author required'); return }
    setSaving(true)
    try {
      await libraryAPI.addBook({ ...bookForm, totalCopies: Number(bookForm.totalCopies), costPrice: Number(bookForm.costPrice) })
      toast.success('Book added')
      setShowAddBook(false)
      setBookForm({ title: '', author: '', isbn: '', category: '', publisher: '', edition: '', description: '', totalCopies: 1, costPrice: 0 })
      fetchBooks()
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed to add book') }
    finally { setSaving(false) }
  }

  const handleDeleteBook = async (bookId: string) => {
    if (!confirm('Delete this book?')) return
    try {
      await libraryAPI.deleteBook(bookId)
      toast.success('Book deleted')
      fetchBooks()
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed to delete book') }
  }

  const handleIssueBook = async () => {
    if (!issueForm.bookId || !issueForm.memberId) { toast.error('Book ID and Member ID required'); return }
    setSaving(true)
    try {
      await libraryAPI.issueBook(issueForm)
      toast.success('Book issued successfully')
      setShowIssue(false)
      setIssueForm({ bookId: '', memberId: '' })
      fetchBooks()
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed to issue book') }
    finally { setSaving(false) }
  }

  const handleReturnBook = async () => {
    if (!returnForm.borrowRecordId) { toast.error('Borrow Record ID required'); return }
    setSaving(true)
    try {
      await libraryAPI.returnBook(returnForm)
      toast.success('Book returned successfully')
      setShowReturn(false)
      setReturnForm({ borrowRecordId: '' })
      fetchBooks()
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed to return book') }
    finally { setSaving(false) }
  }

  const handleSaveSettings = async () => {
    setSaving(true)
    try {
      await libraryAPI.updateSettings(settingsForm)
      toast.success('Settings updated')
      fetchSettings()
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed to save settings') }
    finally { setSaving(false) }
  }

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'PRINCIPAL' || user?.role === 'LIBRARIAN'

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <Toaster position="top-right" />
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen className="w-7 h-7 text-primary-600" />
            <h1 className="text-2xl font-bold text-gray-900">Library Management</h1>
          </div>
          <Link href="/dashboard" className="text-sm text-primary-600 hover:text-primary-700">Back to Dashboard</Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b pb-2">
          {(['books', 'overdue', 'stats', 'settings'] as const).map(t => (
            <button key={t} onClick={() => handleTabChange(t)}
              className={`px-4 py-2 rounded-t-lg text-sm font-medium capitalize ${tab === t ? 'bg-white border border-b-0 text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}>
              {t === 'overdue' ? 'Overdue' : t === 'stats' ? 'Reports' : t}
            </button>
          ))}
        </div>

        {/* Books Tab */}
        {tab === 'books' && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3 items-center">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input className="input pl-10" placeholder="Search books..." value={bookSearch}
                  onChange={e => setBookSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetchBooks(1, bookSearch, bookCategory)} />
              </div>
              <input className="input w-48" placeholder="Category filter" value={bookCategory}
                onChange={e => setBookCategory(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetchBooks(1, bookSearch, bookCategory)} />
              <button className="btn-secondary text-sm" onClick={() => fetchBooks(1, bookSearch, bookCategory)}>Filter</button>
              {isAdmin && (
                <>
                  <button className="btn-primary text-sm flex items-center gap-1" onClick={() => setShowAddBook(true)}>
                    <Plus className="w-4 h-4" /> Add Book
                  </button>
                  <button className="btn-primary text-sm flex items-center gap-1" onClick={() => setShowIssue(true)}>
                    Issue Book
                  </button>
                  <button className="btn-secondary text-sm flex items-center gap-1" onClick={() => setShowReturn(true)}>
                    <RotateCcw className="w-4 h-4" /> Return Book
                  </button>
                </>
              )}
            </div>

            <div className="card">
              {loading ? <p className="text-gray-600">Loading books...</p> : books.length === 0 ? (
                <p className="text-gray-600">No books found.</p>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="border-b text-left text-gray-600">
                          <th className="py-2 pr-4">Title</th>
                          <th className="py-2 pr-4">Author</th>
                          <th className="py-2 pr-4">ISBN</th>
                          <th className="py-2 pr-4">Category</th>
                          <th className="py-2 pr-4">Copies</th>
                          <th className="py-2 pr-4">Available</th>
                          {isAdmin && <th className="py-2">Actions</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {books.map(book => (
                          <tr key={book.id} className="border-b last:border-0">
                            <td className="py-2 pr-4 font-medium">{book.title}</td>
                            <td className="py-2 pr-4">{book.author}</td>
                            <td className="py-2 pr-4">{book.isbn || '-'}</td>
                            <td className="py-2 pr-4">{book.category || '-'}</td>
                            <td className="py-2 pr-4">{book.totalCopies ?? book._count?.copies ?? '-'}</td>
                            <td className="py-2 pr-4">{book.availableCopies ?? '-'}</td>
                            {isAdmin && (
                              <td className="py-2">
                                <button className="text-red-600 hover:underline text-xs" onClick={() => handleDeleteBook(book.id)}>Delete</button>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex justify-between items-center mt-4 text-sm text-gray-500">
                    <span>Total: {bookTotal}</span>
                    <div className="flex gap-2">
                      <button disabled={bookPage <= 1} className="btn-secondary text-xs" onClick={() => fetchBooks(bookPage - 1)}>Prev</button>
                      <span>Page {bookPage}</span>
                      <button className="btn-secondary text-xs" onClick={() => fetchBooks(bookPage + 1)}>Next</button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Overdue Tab */}
        {tab === 'overdue' && (
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <h2 className="text-lg font-semibold">Overdue Books</h2>
            </div>
            {overdueBooks.length === 0 ? (
              <p className="text-gray-600">No overdue books.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-gray-600">
                      <th className="py-2 pr-4">Book</th>
                      <th className="py-2 pr-4">Student/Member</th>
                      <th className="py-2 pr-4">Due Date</th>
                      <th className="py-2 pr-4">Days Overdue</th>
                      <th className="py-2 pr-4">Fine</th>
                    </tr>
                  </thead>
                  <tbody>
                    {overdueBooks.map((r: any, i: number) => (
                      <tr key={r.id || i} className="border-b last:border-0">
                        <td className="py-2 pr-4">{r.book?.title || r.bookTitle || '-'}</td>
                        <td className="py-2 pr-4">{r.memberName || r.student?.firstName || '-'}</td>
                        <td className="py-2 pr-4">{r.dueDate ? new Date(r.dueDate).toLocaleDateString() : '-'}</td>
                        <td className="py-2 pr-4 text-red-600 font-medium">{r.daysOverdue || '-'}</td>
                        <td className="py-2 pr-4">₹{r.fine ?? r.fineAmount ?? 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Stats/Reports Tab */}
        {tab === 'stats' && (
          <div className="space-y-6">
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="card text-center"><p className="text-sm text-gray-500">Total Books</p><p className="text-2xl font-bold">{stats.totalBooks ?? 0}</p></div>
                <div className="card text-center"><p className="text-sm text-gray-500">Total Copies</p><p className="text-2xl font-bold">{stats.totalCopies ?? 0}</p></div>
                <div className="card text-center"><p className="text-sm text-gray-500">Issued</p><p className="text-2xl font-bold">{stats.issuedCopies ?? stats.borrowedBooks ?? 0}</p></div>
                <div className="card text-center"><p className="text-sm text-gray-500">Overdue</p><p className="text-2xl font-bold text-red-600">{stats.overdue ?? stats.overdueBooks ?? 0}</p></div>
              </div>
            )}
            <div className="card">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-5 h-5 text-primary-600" />
                <h2 className="text-lg font-semibold">Most Borrowed Books</h2>
              </div>
              {mostBorrowed.length === 0 ? <p className="text-gray-600">No data.</p> : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead><tr className="border-b text-left text-gray-600"><th className="py-2 pr-4">#</th><th className="py-2 pr-4">Title</th><th className="py-2 pr-4">Author</th><th className="py-2 pr-4">Times Borrowed</th></tr></thead>
                    <tbody>{mostBorrowed.map((b: any, i: number) => (
                      <tr key={b.id || i} className="border-b last:border-0">
                        <td className="py-2 pr-4">{i+1}</td>
                        <td className="py-2 pr-4 font-medium">{b.title}</td>
                        <td className="py-2 pr-4">{b.author}</td>
                        <td className="py-2 pr-4">{b.borrowCount ?? b._count?.borrowRecords ?? 0}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {tab === 'settings' && (
          <div className="card max-w-lg">
            <div className="flex items-center gap-2 mb-4">
              <Settings className="w-5 h-5 text-primary-600" />
              <h2 className="text-lg font-semibold">Library Settings</h2>
            </div>
            <div className="space-y-4">
              {[
                { label: 'Issue Limit', key: 'issueLimit', type: 'number' },
                { label: 'Issue Period (days)', key: 'issuePeriodDays', type: 'number' },
                { label: 'Fine Per Day (₹)', key: 'finePerDay', type: 'number' },
                { label: 'Max Fine Limit (₹)', key: 'maxFineLimit', type: 'number' },
                { label: 'Hold Request Expiry (days)', key: 'holdRequestExpiryDays', type: 'number' },
              ].map(f => (
                <div key={f.key}>
                  <label className="label">{f.label}</label>
                  <input className="input" type={f.type} value={settingsForm[f.key] ?? ''}
                    onChange={e => setSettingsForm({ ...settingsForm, [f.key]: Number(e.target.value) })} />
                </div>
              ))}
              <button className="btn-primary w-full" onClick={handleSaveSettings} disabled={saving}>
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        )}

        {/* Add Book Modal */}
        {showAddBook && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Add New Book</h3>
                <button onClick={() => setShowAddBook(false)}><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-3">
                {[
                  { label: 'Title *', key: 'title' },
                  { label: 'Author *', key: 'author' },
                  { label: 'ISBN', key: 'isbn' },
                  { label: 'Category', key: 'category' },
                  { label: 'Publisher', key: 'publisher' },
                  { label: 'Edition', key: 'edition' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="label">{f.label}</label>
                    <input className="input" value={(bookForm as any)[f.key]}
                      onChange={e => setBookForm({ ...bookForm, [f.key]: e.target.value })} />
                  </div>
                ))}
                <div>
                  <label className="label">Description</label>
                  <textarea className="input" rows={2} value={bookForm.description}
                    onChange={e => setBookForm({ ...bookForm, description: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Total Copies</label>
                    <input className="input" type="number" min="1" value={bookForm.totalCopies}
                      onChange={e => setBookForm({ ...bookForm, totalCopies: parseInt(e.target.value) || 1 })} />
                  </div>
                  <div>
                    <label className="label">Cost Price</label>
                    <input className="input" type="number" min="0" value={bookForm.costPrice}
                      onChange={e => setBookForm({ ...bookForm, costPrice: parseFloat(e.target.value) || 0 })} />
                  </div>
                </div>
                <button className="btn-primary w-full" onClick={handleAddBook} disabled={saving}>
                  {saving ? 'Adding...' : 'Add Book'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Issue Book Modal */}
        {showIssue && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Issue Book</h3>
                <button onClick={() => setShowIssue(false)}><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-3">
                <div><label className="label">Book ID</label><input className="input" value={issueForm.bookId}
                  onChange={e => setIssueForm({ ...issueForm, bookId: e.target.value })} /></div>
                <div><label className="label">Member ID (Student/Staff)</label><input className="input" value={issueForm.memberId}
                  onChange={e => setIssueForm({ ...issueForm, memberId: e.target.value })} /></div>
                <button className="btn-primary w-full" onClick={handleIssueBook} disabled={saving}>
                  {saving ? 'Issuing...' : 'Issue Book'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Return Book Modal */}
        {showReturn && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Return Book</h3>
                <button onClick={() => setShowReturn(false)}><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-3">
                <div><label className="label">Borrow Record ID</label><input className="input" value={returnForm.borrowRecordId}
                  onChange={e => setReturnForm({ borrowRecordId: e.target.value })} /></div>
                <button className="btn-primary w-full" onClick={handleReturnBook} disabled={saving}>
                  {saving ? 'Returning...' : 'Return Book'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
