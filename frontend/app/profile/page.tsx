'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast, { Toaster } from 'react-hot-toast'
import { authAPI } from '@/lib/api'

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrator',
  PRINCIPAL: 'Principal',
  TEACHER: 'Teacher',
  STUDENT: 'Student',
  PARENT: 'Parent',
  ACCOUNTANT: 'Accountant',
  LIBRARIAN: 'Librarian',
  TRANSPORT_STAFF: 'Transport Staff',
}

const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'bg-red-100 text-red-800',
  PRINCIPAL: 'bg-purple-100 text-purple-800',
  TEACHER: 'bg-blue-100 text-blue-800',
  STUDENT: 'bg-green-100 text-green-800',
  PARENT: 'bg-yellow-100 text-yellow-800',
  ACCOUNTANT: 'bg-indigo-100 text-indigo-800',
  LIBRARIAN: 'bg-teal-100 text-teal-800',
  TRANSPORT_STAFF: 'bg-orange-100 text-orange-800',
}

export default function ProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [editMode, setEditMode] = useState(false)
  const [saving, setSaving] = useState(false)
  const [profileForm, setProfileForm] = useState({
    name: '', firstName: '', lastName: '', phone: '', address: '',
  })
  // Password change
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [changingPw, setChangingPw] = useState(false)
  const [showPwSection, setShowPwSection] = useState(false)

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (!userData) { router.push('/auth/login'); return }
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    setLoading(true)
    try {
      const res = await authAPI.getMe()
      const user = res.data?.data?.user || res.data?.user
      setProfile(user)
      // Populate form
      const sub = user.student || user.staff || user.parent || {}
      setProfileForm({
        name: user.name || '',
        firstName: sub.firstName || '',
        lastName: sub.lastName || '',
        phone: sub.phone || '',
        address: sub.address || '',
      })
    } catch {
      toast.error('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await authAPI.updateProfile(profileForm)
      toast.success('Profile updated')
      // Update localStorage user name
      const stored = JSON.parse(localStorage.getItem('user') || '{}')
      stored.name = profileForm.name
      localStorage.setItem('user', JSON.stringify(stored))
      setEditMode(false)
      fetchProfile()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      toast.error('New passwords do not match')
      return
    }
    if (pwForm.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    setChangingPw(true)
    try {
      await authAPI.changePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword })
      toast.success('Password changed successfully')
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setShowPwSection(false)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to change password')
    } finally {
      setChangingPw(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-3 text-gray-500">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!profile) return null

  const sub = profile.student || profile.staff || profile.parent || {}

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <Toaster position="top-right" />
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <Link href="/dashboard" className="text-sm text-primary-600 hover:underline">← Back to Dashboard</Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">My Profile</h1>
        </div>

        {/* Identity card */}
        <div className="card flex items-center gap-5">
          <div className="h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center text-2xl font-bold text-primary-600 flex-shrink-0">
            {(profile.name || profile.email || 'U')[0].toUpperCase()}
          </div>
          <div>
            <p className="text-xl font-semibold text-gray-900">{profile.name || '—'}</p>
            <p className="text-sm text-gray-500">{profile.email}</p>
            <span className={`inline-flex items-center mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[profile.role] || 'bg-gray-100 text-gray-800'}`}>
              {ROLE_LABELS[profile.role] || profile.role}
            </span>
          </div>
          <button
            onClick={() => setEditMode(e => !e)}
            className="ml-auto btn-secondary text-sm"
          >
            {editMode ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>

        {/* Profile info / edit form */}
        {editMode ? (
          <div className="card">
            <h2 className="text-base font-semibold text-gray-800 mb-4">Edit Profile</h2>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="label">Display Name</label>
                <input
                  className="input"
                  value={profileForm.name}
                  onChange={e => setProfileForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Your display name"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">First Name</label>
                  <input
                    className="input"
                    value={profileForm.firstName}
                    onChange={e => setProfileForm(f => ({ ...f, firstName: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="label">Last Name</label>
                  <input
                    className="input"
                    value={profileForm.lastName}
                    onChange={e => setProfileForm(f => ({ ...f, lastName: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <label className="label">Phone</label>
                <input
                  className="input"
                  value={profileForm.phone}
                  onChange={e => setProfileForm(f => ({ ...f, phone: e.target.value }))}
                  type="tel"
                />
              </div>
              <div>
                <label className="label">Address</label>
                <textarea
                  className="input"
                  rows={2}
                  value={profileForm.address}
                  onChange={e => setProfileForm(f => ({ ...f, address: e.target.value }))}
                />
              </div>
              <div className="flex gap-3">
                <button type="submit" className="btn-primary text-sm" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button type="button" className="btn-secondary text-sm" onClick={() => setEditMode(false)}>Cancel</button>
              </div>
            </form>
          </div>
        ) : (
          <div className="card space-y-3">
            <h2 className="text-base font-semibold text-gray-800 border-b pb-2">Profile Details</h2>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              {[
                { label: 'First Name', value: sub.firstName },
                { label: 'Last Name', value: sub.lastName },
                { label: 'Phone', value: sub.phone },
                { label: 'Email', value: profile.email },
                ...(sub.address ? [{ label: 'Address', value: sub.address }] : []),
                ...(sub.department ? [{ label: 'Department', value: sub.department }] : []),
                ...(sub.designation ? [{ label: 'Designation', value: sub.designation }] : []),
                ...(sub.admissionNo ? [{ label: 'Admission No', value: sub.admissionNo }] : []),
                ...(sub.class?.name ? [{ label: 'Class', value: sub.class.name }] : []),
              ].map(item => (
                <div key={item.label}>
                  <dt className="text-gray-500">{item.label}</dt>
                  <dd className="font-medium text-gray-900">{item.value || '—'}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        {/* Change Password */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-gray-800">Security</h2>
            <button
              onClick={() => setShowPwSection(s => !s)}
              className="btn-secondary text-sm"
            >
              {showPwSection ? 'Cancel' : 'Change Password'}
            </button>
          </div>
          {!showPwSection && (
            <p className="text-sm text-gray-500">Update your password to keep your account secure.</p>
          )}
          {showPwSection && (
            <form onSubmit={handleChangePassword} className="space-y-4 mt-2">
              <div>
                <label className="label">Current Password</label>
                <input
                  type="password"
                  className="input"
                  required
                  value={pwForm.currentPassword}
                  onChange={e => setPwForm(f => ({ ...f, currentPassword: e.target.value }))}
                />
              </div>
              <div>
                <label className="label">New Password</label>
                <input
                  type="password"
                  className="input"
                  required
                  minLength={6}
                  value={pwForm.newPassword}
                  onChange={e => setPwForm(f => ({ ...f, newPassword: e.target.value }))}
                />
              </div>
              <div>
                <label className="label">Confirm New Password</label>
                <input
                  type="password"
                  className="input"
                  required
                  value={pwForm.confirmPassword}
                  onChange={e => setPwForm(f => ({ ...f, confirmPassword: e.target.value }))}
                />
              </div>
              <button type="submit" className="btn-primary text-sm" disabled={changingPw}>
                {changingPw ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          )}
        </div>

        {/* Account info (read-only) */}
        <div className="card space-y-2">
          <h2 className="text-base font-semibold text-gray-800 border-b pb-2">Account</h2>
          <dl className="text-sm space-y-2">
            <div className="flex justify-between">
              <dt className="text-gray-500">Account Status</dt>
              <dd>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${profile.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {profile.isActive ? 'Active' : 'Inactive'}
                </span>
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Member Since</dt>
              <dd className="text-gray-700">
                {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
              </dd>
            </div>
          </dl>
        </div>

      </div>
    </div>
  )
}
