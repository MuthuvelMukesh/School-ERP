'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast, { Toaster } from 'react-hot-toast'
import { permissionAPI } from '@/lib/api'

const roles = ['ADMIN', 'PRINCIPAL', 'TEACHER', 'STUDENT', 'PARENT', 'ACCOUNTANT', 'LIBRARIAN', 'TRANSPORT_STAFF']

export default function PermissionsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [permissions, setPermissions] = useState<any[]>([])
  const [hierarchy, setHierarchy] = useState<any[]>([])
  const [selectedRole, setSelectedRole] = useState('TEACHER')
  const [selectedPermission, setSelectedPermission] = useState('')

  const [newPermission, setNewPermission] = useState({
    key: '',
    name: '',
    module: '',
    description: ''
  })

  const [hierarchyForm, setHierarchyForm] = useState({
    parentRole: 'ADMIN',
    childRole: 'PRINCIPAL'
  })

  const fetchData = useCallback(async () => {
    try {
      const [permissionsRes, hierarchyRes] = await Promise.all([
        permissionAPI.getAll(),
        permissionAPI.getHierarchy()
      ])

      const allPermissions = permissionsRes.data?.data?.permissions || []
      setPermissions(allPermissions)
      setHierarchy(hierarchyRes.data?.data?.hierarchy || [])
      if (!selectedPermission && allPermissions.length > 0) {
        setSelectedPermission(allPermissions[0].key)
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load permissions data')
    } finally {
      setLoading(false)
    }
  }, [selectedPermission])

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

  const handleInitialize = async () => {
    try {
      await permissionAPI.initialize()
      toast.success('Default permissions initialized')
      fetchData()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to initialize permissions')
    }
  }

  const handleCreatePermission = async (event: React.FormEvent) => {
    event.preventDefault()
    try {
      await permissionAPI.create(newPermission)
      toast.success('Permission created')
      setNewPermission({ key: '', name: '', module: '', description: '' })
      fetchData()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create permission')
    }
  }

  const handleGrantRolePermission = async () => {
    if (!selectedPermission) {
      toast.error('Select a permission first')
      return
    }

    try {
      await permissionAPI.setRolePermissions({
        role: selectedRole,
        permissions: [{ key: selectedPermission, allowed: true }]
      })
      toast.success('Role permission updated')
      fetchData()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update role permission')
    }
  }

  const handleCreateHierarchy = async (event: React.FormEvent) => {
    event.preventDefault()
    try {
      await permissionAPI.setHierarchy(hierarchyForm)
      toast.success('Role hierarchy updated')
      fetchData()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update hierarchy')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <Toaster position="top-right" />
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Permission Matrix</h1>
          <Link href="/dashboard" className="text-sm text-primary-600 hover:text-primary-700">
            Back to Dashboard
          </Link>
        </div>

        <div className="card flex flex-wrap items-center gap-3">
          <button className="btn-primary" onClick={handleInitialize}>Initialize Defaults</button>
          <p className="text-sm text-gray-600">Use this once to seed standard system permissions.</p>
        </div>

        {loading ? (
          <div className="card">
            <p className="text-gray-600">Loading permission matrix...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="card">
                <h2 className="text-lg font-semibold mb-4">Create Custom Permission</h2>
                <form onSubmit={handleCreatePermission} className="space-y-3">
                  <input className="input" placeholder="Key (e.g. reports.export)" value={newPermission.key} onChange={(e) => setNewPermission((prev) => ({ ...prev, key: e.target.value }))} required />
                  <input className="input" placeholder="Name" value={newPermission.name} onChange={(e) => setNewPermission((prev) => ({ ...prev, name: e.target.value }))} required />
                  <input className="input" placeholder="Module" value={newPermission.module} onChange={(e) => setNewPermission((prev) => ({ ...prev, module: e.target.value }))} required />
                  <input className="input" placeholder="Description (optional)" value={newPermission.description} onChange={(e) => setNewPermission((prev) => ({ ...prev, description: e.target.value }))} />
                  <button className="btn-primary" type="submit">Create Permission</button>
                </form>
              </div>

              <div className="card">
                <h2 className="text-lg font-semibold mb-4">Assign Permission to Role</h2>
                <div className="space-y-3">
                  <select className="input" value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)}>
                    {roles.map((role) => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                  <select className="input" value={selectedPermission} onChange={(e) => setSelectedPermission(e.target.value)}>
                    {permissions.map((permission) => (
                      <option key={permission.key} value={permission.key}>{permission.key}</option>
                    ))}
                  </select>
                  <button className="btn-primary" onClick={handleGrantRolePermission}>Grant Permission</button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="card">
                <h2 className="text-lg font-semibold mb-4">Role Hierarchy</h2>
                <form onSubmit={handleCreateHierarchy} className="space-y-3 mb-4">
                  <select className="input" value={hierarchyForm.parentRole} onChange={(e) => setHierarchyForm((prev) => ({ ...prev, parentRole: e.target.value }))}>
                    {roles.map((role) => (
                      <option key={`parent-${role}`} value={role}>{role}</option>
                    ))}
                  </select>
                  <select className="input" value={hierarchyForm.childRole} onChange={(e) => setHierarchyForm((prev) => ({ ...prev, childRole: e.target.value }))}>
                    {roles.map((role) => (
                      <option key={`child-${role}`} value={role}>{role}</option>
                    ))}
                  </select>
                  <button className="btn-primary" type="submit">Add Hierarchy Mapping</button>
                </form>

                {hierarchy.length === 0 ? (
                  <p className="text-sm text-gray-600">No hierarchy mappings found.</p>
                ) : (
                  <div className="space-y-2 text-sm">
                    {hierarchy.map((item) => (
                      <div key={item.id} className="border rounded px-3 py-2">
                        {item.parentRole} → {item.childRole}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="card">
                <h2 className="text-lg font-semibold mb-4">Available Permissions</h2>
                {permissions.length === 0 ? (
                  <p className="text-sm text-gray-600">No permissions available.</p>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto text-sm">
                    {permissions.map((permission) => (
                      <div key={permission.id} className="border rounded px-3 py-2">
                        <p className="font-medium">{permission.key}</p>
                        <p className="text-gray-600">{permission.name} • {permission.module}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
