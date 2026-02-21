'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast, { Toaster } from 'react-hot-toast'
import { Bus, Plus, MapPin, Wrench, Users, Settings, X, BarChart3 } from 'lucide-react'
import { transportAPI } from '@/lib/api'

export default function TransportPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'vehicles' | 'routes' | 'maintenance' | 'reports' | 'settings'>('vehicles')

  // Vehicles
  const [vehicles, setVehicles] = useState<any[]>([])
  const [showAddVehicle, setShowAddVehicle] = useState(false)
  const [vehicleForm, setVehicleForm] = useState({ registrationNo: '', model: '', capacity: 40, serviceDate: '', fuelType: 'DIESEL', averageMileage: 0 })

  // Routes
  const [routes, setRoutes] = useState<any[]>([])
  const [showAddRoute, setShowAddRoute] = useState(false)
  const [routeForm, setRouteForm] = useState({ name: '', vehicleId: '', monthlyFee: 0, estimatedDuration: '', notes: '' })

  // Route detail + stops
  const [selectedRoute, setSelectedRoute] = useState<any>(null)
  const [routeStops, setRouteStops] = useState<any[]>([])
  const [showAddStop, setShowAddStop] = useState(false)
  const [stopForm, setStopForm] = useState({ stopName: '', location: '', stopOrder: 1, latitude: '', longitude: '', arrivalTime: '' })

  // Student enrollment
  const [showEnroll, setShowEnroll] = useState(false)
  const [enrollForm, setEnrollForm] = useState({ studentId: '', routeId: '', pickupStop: '', dropoffStop: '' })

  // Maintenance
  const [dueMaintenance, setDueMaintenance] = useState<any[]>([])
  const [showAddMaintenance, setShowAddMaintenance] = useState(false)
  const [maintenanceForm, setMaintenanceForm] = useState({ vehicleId: '', description: '', cost: 0, nextServiceDate: '' })

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
    fetchVehicles()
  }, [router])

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'PRINCIPAL' || user?.role === 'TRANSPORT_STAFF'

  const fetchVehicles = async () => {
    setLoading(true)
    try {
      const res = await transportAPI.getAllVehicles()
      setVehicles(res.data?.data?.vehicles || [])
    } catch { toast.error('Failed to load vehicles') }
    finally { setLoading(false) }
  }

  const fetchRoutes = async () => {
    try {
      const res = await transportAPI.getAllRoutes()
      setRoutes(res.data?.data?.routes || [])
    } catch { toast.error('Failed to load routes') }
  }

  const fetchMaintenance = async () => {
    try {
      const res = await transportAPI.getDueMaintenance()
      setDueMaintenance(res.data?.data?.vehicles || res.data?.data || [])
    } catch { toast.error('Failed to load maintenance data') }
  }

  const fetchSummary = async () => {
    try {
      const res = await transportAPI.getSummary()
      setSummary(res.data?.data || res.data)
    } catch { toast.error('Failed to load summary') }
  }

  const fetchSettings = async () => {
    try {
      const res = await transportAPI.getSettings()
      const s = res.data?.data?.settings || res.data?.data || {}
      setSettings(s)
      setSettingsForm(s)
    } catch { toast.error('Failed to load settings') }
  }

  const handleTabChange = (t: typeof tab) => {
    setTab(t)
    if (t === 'vehicles') fetchVehicles()
    if (t === 'routes') fetchRoutes()
    if (t === 'maintenance') fetchMaintenance()
    if (t === 'reports') fetchSummary()
    if (t === 'settings') fetchSettings()
  }

  const handleAddVehicle = async () => {
    if (!vehicleForm.registrationNo || !vehicleForm.model) { toast.error('Registration No and Model required'); return }
    setSaving(true)
    try {
      await transportAPI.addVehicle({ ...vehicleForm, capacity: Number(vehicleForm.capacity), averageMileage: Number(vehicleForm.averageMileage) })
      toast.success('Vehicle added')
      setShowAddVehicle(false)
      setVehicleForm({ registrationNo: '', model: '', capacity: 40, serviceDate: '', fuelType: 'DIESEL', averageMileage: 0 })
      fetchVehicles()
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed to add vehicle') }
    finally { setSaving(false) }
  }

  const handleAddRoute = async () => {
    if (!routeForm.name || !routeForm.vehicleId) { toast.error('Name and Vehicle required'); return }
    setSaving(true)
    try {
      await transportAPI.createRoute({ ...routeForm, monthlyFee: Number(routeForm.monthlyFee) })
      toast.success('Route created')
      setShowAddRoute(false)
      setRouteForm({ name: '', vehicleId: '', monthlyFee: 0, estimatedDuration: '', notes: '' })
      fetchRoutes()
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed to create route') }
    finally { setSaving(false) }
  }

  const handleViewRouteStops = async (route: any) => {
    setSelectedRoute(route)
    try {
      const res = await transportAPI.getRouteStops(route.id)
      setRouteStops(res.data?.data?.stops || [])
    } catch { toast.error('Failed to load stops') }
  }

  const handleAddStop = async () => {
    if (!selectedRoute || !stopForm.stopName) return
    setSaving(true)
    try {
      await transportAPI.addBusStop(selectedRoute.id, { ...stopForm, stopOrder: Number(stopForm.stopOrder) })
      toast.success('Stop added')
      setShowAddStop(false)
      setStopForm({ stopName: '', location: '', stopOrder: 1, latitude: '', longitude: '', arrivalTime: '' })
      handleViewRouteStops(selectedRoute)
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed to add stop') }
    finally { setSaving(false) }
  }

  const handleDeleteStop = async (stopId: string) => {
    if (!confirm('Delete this stop?')) return
    try {
      await transportAPI.deleteBusStop(stopId)
      toast.success('Stop deleted')
      if (selectedRoute) handleViewRouteStops(selectedRoute)
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed to delete stop') }
  }

  const handleEnrollStudent = async () => {
    if (!enrollForm.studentId || !enrollForm.routeId) { toast.error('Student ID and Route required'); return }
    setSaving(true)
    try {
      await transportAPI.enrollStudent(enrollForm)
      toast.success('Student enrolled')
      setShowEnroll(false)
      setEnrollForm({ studentId: '', routeId: '', pickupStop: '', dropoffStop: '' })
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed to enroll') }
    finally { setSaving(false) }
  }

  const handleAddMaintenance = async () => {
    if (!maintenanceForm.vehicleId || !maintenanceForm.description) { toast.error('Vehicle and description required'); return }
    setSaving(true)
    try {
      await transportAPI.addMaintenance(maintenanceForm.vehicleId, {
        description: maintenanceForm.description,
        cost: Number(maintenanceForm.cost),
        nextServiceDate: maintenanceForm.nextServiceDate || undefined
      })
      toast.success('Maintenance record added')
      setShowAddMaintenance(false)
      setMaintenanceForm({ vehicleId: '', description: '', cost: 0, nextServiceDate: '' })
      fetchMaintenance()
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed to add record') }
    finally { setSaving(false) }
  }

  const handleSaveSettings = async () => {
    setSaving(true)
    try {
      await transportAPI.updateSettings(settingsForm)
      toast.success('Settings saved')
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed to save') }
    finally { setSaving(false) }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <Toaster position="top-right" />
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bus className="w-7 h-7 text-primary-600" />
            <h1 className="text-2xl font-bold text-gray-900">Transport Management</h1>
          </div>
          <Link href="/dashboard" className="text-sm text-primary-600 hover:text-primary-700">Back to Dashboard</Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b pb-2">
          {(['vehicles', 'routes', 'maintenance', 'reports', 'settings'] as const).map(t => (
            <button key={t} onClick={() => handleTabChange(t)}
              className={`px-4 py-2 rounded-t-lg text-sm font-medium capitalize ${tab === t ? 'bg-white border border-b-0 text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}>
              {t}
            </button>
          ))}
        </div>

        {/* Vehicles Tab */}
        {tab === 'vehicles' && (
          <div className="space-y-4">
            {isAdmin && (
              <div className="flex gap-2">
                <button className="btn-primary text-sm flex items-center gap-1" onClick={() => setShowAddVehicle(true)}>
                  <Plus className="w-4 h-4" /> Add Vehicle
                </button>
                <button className="btn-secondary text-sm flex items-center gap-1" onClick={() => setShowEnroll(true)}>
                  <Users className="w-4 h-4" /> Enroll Student
                </button>
              </div>
            )}
            <div className="card">
              {loading ? <p className="text-gray-600">Loading...</p> : vehicles.length === 0 ? (
                <p className="text-gray-600">No vehicles found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-gray-600">
                        <th className="py-2 pr-4">Reg No</th>
                        <th className="py-2 pr-4">Model</th>
                        <th className="py-2 pr-4">Capacity</th>
                        <th className="py-2 pr-4">Fuel</th>
                        <th className="py-2 pr-4">Condition</th>
                        <th className="py-2 pr-4">Driver</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vehicles.map(v => (
                        <tr key={v.id} className="border-b last:border-0">
                          <td className="py-2 pr-4 font-medium">{v.registrationNo}</td>
                          <td className="py-2 pr-4">{v.model}</td>
                          <td className="py-2 pr-4">{v.capacity}</td>
                          <td className="py-2 pr-4">{v.fuelType}</td>
                          <td className="py-2 pr-4">
                            <span className={`px-2 py-0.5 rounded text-xs ${v.condition === 'EXCELLENT' || v.condition === 'GOOD' ? 'bg-green-100 text-green-800' : v.condition === 'POOR' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>{v.condition}</span>
                          </td>
                          <td className="py-2 pr-4">{v.driver?.firstName ? `${v.driver.firstName} ${v.driver.lastName || ''}` : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Routes Tab */}
        {tab === 'routes' && (
          <div className="space-y-4">
            {isAdmin && (
              <button className="btn-primary text-sm flex items-center gap-1" onClick={() => setShowAddRoute(true)}>
                <Plus className="w-4 h-4" /> Add Route
              </button>
            )}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="card">
                <h2 className="text-lg font-semibold mb-3">All Routes</h2>
                {routes.length === 0 ? <p className="text-gray-600">No routes found.</p> : (
                  <div className="space-y-2">
                    {routes.map(r => (
                      <div key={r.id} className={`p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${selectedRoute?.id === r.id ? 'border-primary-500 bg-primary-50' : ''}`}
                        onClick={() => handleViewRouteStops(r)}>
                        <div className="flex justify-between">
                          <span className="font-medium">{r.name}</span>
                          <span className="text-sm text-gray-500">₹{r.monthlyFee}/mo</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{r.vehicle?.registrationNo || 'No vehicle'} | {r.estimatedDuration || '-'}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="card">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <MapPin className="w-5 h-5" /> Stops {selectedRoute ? `- ${selectedRoute.name}` : ''}
                  </h2>
                  {selectedRoute && isAdmin && (
                    <button className="btn-primary text-xs" onClick={() => setShowAddStop(true)}>Add Stop</button>
                  )}
                </div>
                {!selectedRoute ? <p className="text-gray-500 text-sm">Select a route to view stops.</p> : routeStops.length === 0 ? (
                  <p className="text-gray-500 text-sm">No stops added yet.</p>
                ) : (
                  <div className="space-y-2">
                    {routeStops.sort((a: any, b: any) => a.stopOrder - b.stopOrder).map((s: any) => (
                      <div key={s.id} className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <span className="text-xs bg-gray-200 rounded px-1.5 py-0.5 mr-2">{s.stopOrder}</span>
                          <span className="font-medium text-sm">{s.stopName}</span>
                          <span className="text-xs text-gray-500 ml-2">{s.location || ''} {s.arrivalTime ? `• ${s.arrivalTime}` : ''}</span>
                        </div>
                        {isAdmin && <button className="text-red-500 text-xs" onClick={() => handleDeleteStop(s.id)}>Delete</button>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Maintenance Tab */}
        {tab === 'maintenance' && (
          <div className="space-y-4">
            {isAdmin && (
              <button className="btn-primary text-sm flex items-center gap-1" onClick={() => setShowAddMaintenance(true)}>
                <Wrench className="w-4 h-4" /> Add Maintenance Record
              </button>
            )}
            <div className="card">
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2"><Wrench className="w-5 h-5 text-orange-500" /> Vehicles Due for Maintenance</h2>
              {dueMaintenance.length === 0 ? <p className="text-gray-600">No vehicles due for maintenance.</p> : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead><tr className="border-b text-left text-gray-600"><th className="py-2 pr-4">Vehicle</th><th className="py-2 pr-4">Last Service</th><th className="py-2 pr-4">Next Service</th><th className="py-2 pr-4">Condition</th></tr></thead>
                    <tbody>{dueMaintenance.map((v: any) => (
                      <tr key={v.id} className="border-b last:border-0">
                        <td className="py-2 pr-4">{v.registrationNo} ({v.model})</td>
                        <td className="py-2 pr-4">{v.serviceDate ? new Date(v.serviceDate).toLocaleDateString() : '-'}</td>
                        <td className="py-2 pr-4">{v.maintenanceDate ? new Date(v.maintenanceDate).toLocaleDateString() : '-'}</td>
                        <td className="py-2 pr-4">{v.condition}</td>
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
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="card text-center"><p className="text-sm text-gray-500">Total Vehicles</p><p className="text-2xl font-bold">{summary.totalVehicles ?? 0}</p></div>
              <div className="card text-center"><p className="text-sm text-gray-500">Total Routes</p><p className="text-2xl font-bold">{summary.totalRoutes ?? 0}</p></div>
              <div className="card text-center"><p className="text-sm text-gray-500">Students Enrolled</p><p className="text-2xl font-bold">{summary.totalStudentsEnrolled ?? summary.totalStudents ?? 0}</p></div>
              <div className="card text-center"><p className="text-sm text-gray-500">Total Capacity</p><p className="text-2xl font-bold">{summary.totalCapacity ?? 0}</p></div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {tab === 'settings' && (
          <div className="card max-w-lg">
            <div className="flex items-center gap-2 mb-4"><Settings className="w-5 h-5 text-primary-600" /><h2 className="text-lg font-semibold">Transport Settings</h2></div>
            <div className="space-y-4">
              {[
                { label: 'Default Monthly Fee (₹)', key: 'defaultMonthlyFee', type: 'number' },
                { label: 'Late Fee Percentage (%)', key: 'lateFeePercentage', type: 'number' },
                { label: 'Max Students Per Vehicle', key: 'maxStudentsPerVehicle', type: 'number' },
                { label: 'Maintenance Check Interval (days)', key: 'maintenanceCheckInterval', type: 'number' },
              ].map(f => (
                <div key={f.key}>
                  <label className="label">{f.label}</label>
                  <input className="input" type={f.type} value={settingsForm[f.key] ?? ''}
                    onChange={e => setSettingsForm({ ...settingsForm, [f.key]: Number(e.target.value) })} />
                </div>
              ))}
              <button className="btn-primary w-full" disabled={saving} onClick={handleSaveSettings}>
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        )}

        {/* Add Vehicle Modal */}
        {showAddVehicle && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-semibold">Add Vehicle</h3><button onClick={() => setShowAddVehicle(false)}><X className="w-5 h-5" /></button></div>
              <div className="space-y-3">
                <div><label className="label">Registration No *</label><input className="input" value={vehicleForm.registrationNo} onChange={e => setVehicleForm({...vehicleForm, registrationNo: e.target.value})} /></div>
                <div><label className="label">Model *</label><input className="input" value={vehicleForm.model} onChange={e => setVehicleForm({...vehicleForm, model: e.target.value})} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="label">Capacity</label><input className="input" type="number" value={vehicleForm.capacity} onChange={e => setVehicleForm({...vehicleForm, capacity: parseInt(e.target.value)||40})} /></div>
                  <div><label className="label">Fuel Type</label>
                    <select className="input" value={vehicleForm.fuelType} onChange={e => setVehicleForm({...vehicleForm, fuelType: e.target.value})}>
                      <option value="DIESEL">Diesel</option><option value="PETROL">Petrol</option><option value="CNG">CNG</option><option value="ELECTRIC">Electric</option>
                    </select>
                  </div>
                </div>
                <div><label className="label">Service Date</label><input className="input" type="date" value={vehicleForm.serviceDate} onChange={e => setVehicleForm({...vehicleForm, serviceDate: e.target.value})} /></div>
                <button className="btn-primary w-full" onClick={handleAddVehicle} disabled={saving}>{saving ? 'Adding...' : 'Add Vehicle'}</button>
              </div>
            </div>
          </div>
        )}

        {/* Add Route Modal */}
        {showAddRoute && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg">
              <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-semibold">Create Route</h3><button onClick={() => setShowAddRoute(false)}><X className="w-5 h-5" /></button></div>
              <div className="space-y-3">
                <div><label className="label">Route Name *</label><input className="input" value={routeForm.name} onChange={e => setRouteForm({...routeForm, name: e.target.value})} /></div>
                <div><label className="label">Vehicle *</label>
                  <select className="input" value={routeForm.vehicleId} onChange={e => setRouteForm({...routeForm, vehicleId: e.target.value})}>
                    <option value="">Select vehicle</option>
                    {vehicles.map(v => <option key={v.id} value={v.id}>{v.registrationNo} - {v.model}</option>)}
                  </select>
                </div>
                <div><label className="label">Monthly Fee (₹)</label><input className="input" type="number" value={routeForm.monthlyFee} onChange={e => setRouteForm({...routeForm, monthlyFee: parseFloat(e.target.value)||0})} /></div>
                <div><label className="label">Estimated Duration</label><input className="input" placeholder="e.g. 45 mins" value={routeForm.estimatedDuration} onChange={e => setRouteForm({...routeForm, estimatedDuration: e.target.value})} /></div>
                <button className="btn-primary w-full" onClick={handleAddRoute} disabled={saving}>{saving ? 'Creating...' : 'Create Route'}</button>
              </div>
            </div>
          </div>
        )}

        {/* Add Stop Modal */}
        {showAddStop && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-semibold">Add Bus Stop</h3><button onClick={() => setShowAddStop(false)}><X className="w-5 h-5" /></button></div>
              <div className="space-y-3">
                <div><label className="label">Stop Name *</label><input className="input" value={stopForm.stopName} onChange={e => setStopForm({...stopForm, stopName: e.target.value})} /></div>
                <div><label className="label">Location</label><input className="input" value={stopForm.location} onChange={e => setStopForm({...stopForm, location: e.target.value})} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="label">Order</label><input className="input" type="number" value={stopForm.stopOrder} onChange={e => setStopForm({...stopForm, stopOrder: parseInt(e.target.value)||1})} /></div>
                  <div><label className="label">Arrival Time</label><input className="input" type="time" value={stopForm.arrivalTime} onChange={e => setStopForm({...stopForm, arrivalTime: e.target.value})} /></div>
                </div>
                <button className="btn-primary w-full" onClick={handleAddStop} disabled={saving}>{saving ? 'Adding...' : 'Add Stop'}</button>
              </div>
            </div>
          </div>
        )}

        {/* Enroll Student Modal */}
        {showEnroll && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-semibold">Enroll Student</h3><button onClick={() => setShowEnroll(false)}><X className="w-5 h-5" /></button></div>
              <div className="space-y-3">
                <div><label className="label">Student ID *</label><input className="input" value={enrollForm.studentId} onChange={e => setEnrollForm({...enrollForm, studentId: e.target.value})} /></div>
                <div><label className="label">Route *</label>
                  <select className="input" value={enrollForm.routeId} onChange={e => setEnrollForm({...enrollForm, routeId: e.target.value})}>
                    <option value="">Select route</option>
                    {routes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
                <div><label className="label">Pickup Stop</label><input className="input" value={enrollForm.pickupStop} onChange={e => setEnrollForm({...enrollForm, pickupStop: e.target.value})} /></div>
                <div><label className="label">Dropoff Stop</label><input className="input" value={enrollForm.dropoffStop} onChange={e => setEnrollForm({...enrollForm, dropoffStop: e.target.value})} /></div>
                <button className="btn-primary w-full" onClick={handleEnrollStudent} disabled={saving}>{saving ? 'Enrolling...' : 'Enroll Student'}</button>
              </div>
            </div>
          </div>
        )}

        {/* Add Maintenance Modal */}
        {showAddMaintenance && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-semibold">Add Maintenance Record</h3><button onClick={() => setShowAddMaintenance(false)}><X className="w-5 h-5" /></button></div>
              <div className="space-y-3">
                <div><label className="label">Vehicle *</label>
                  <select className="input" value={maintenanceForm.vehicleId} onChange={e => setMaintenanceForm({...maintenanceForm, vehicleId: e.target.value})}>
                    <option value="">Select vehicle</option>
                    {vehicles.map(v => <option key={v.id} value={v.id}>{v.registrationNo} - {v.model}</option>)}
                  </select>
                </div>
                <div><label className="label">Description *</label><textarea className="input" rows={2} value={maintenanceForm.description} onChange={e => setMaintenanceForm({...maintenanceForm, description: e.target.value})} /></div>
                <div><label className="label">Cost (₹)</label><input className="input" type="number" value={maintenanceForm.cost} onChange={e => setMaintenanceForm({...maintenanceForm, cost: parseFloat(e.target.value)||0})} /></div>
                <div><label className="label">Next Service Date</label><input className="input" type="date" value={maintenanceForm.nextServiceDate} onChange={e => setMaintenanceForm({...maintenanceForm, nextServiceDate: e.target.value})} /></div>
                <button className="btn-primary w-full" onClick={handleAddMaintenance} disabled={saving}>{saving ? 'Saving...' : 'Add Record'}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
