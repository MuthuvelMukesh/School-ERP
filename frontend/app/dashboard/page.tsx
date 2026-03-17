'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard,
  Users,
  UserCog,
  DollarSign,
  Calendar,
  ClipboardList,
  GraduationCap,
  BookOpen,
  Bell,
  Shield,
  ArrowUpDown,
  LogOut,
  Menu,
  X,
  Library,
  Bus,
  Building2,
  CreditCard,
  Activity,
  FolderOpen,
} from 'lucide-react'
import { dashboardAPI } from '@/lib/api'
import toast, { Toaster } from 'react-hot-toast'

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [stats, setStats] = useState<any>(null)
  const [recentActivities, setRecentActivities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (!userData) {
      router.push('/auth/login')
      return
    }

    const parsed = JSON.parse(userData)
    setUser(parsed)
    fetchStats()
    if (['ADMIN', 'PRINCIPAL'].includes(parsed.role)) {
      fetchRecentActivities()
    }
  }, [router])

  const fetchStats = async () => {
    try {
      const response = await dashboardAPI.getStats()
      setStats(response.data.data.stats)
    } catch (error) {
      toast.error('Failed to fetch dashboard stats')
    } finally {
      setLoading(false)
    }
  }

  const fetchRecentActivities = async () => {
    try {
      const response = await dashboardAPI.getRecentActivities()
      setRecentActivities(response.data.data.activities || [])
    } catch (error) {
      // non-critical, silently ignore
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/auth/login')
  }

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard', roles: ['ADMIN', 'PRINCIPAL', 'TEACHER', 'STUDENT', 'ACCOUNTANT', 'PARENT', 'LIBRARIAN', 'TRANSPORT_STAFF'] },
    { icon: Users, label: 'Students', href: '/students', roles: ['ADMIN', 'PRINCIPAL', 'TEACHER'] },
    { icon: UserCog, label: 'Staff', href: '/staff', roles: ['ADMIN', 'PRINCIPAL', 'TEACHER'] },
    { icon: DollarSign, label: 'Fees', href: '/fees', roles: ['ADMIN', 'PRINCIPAL', 'ACCOUNTANT', 'STUDENT', 'PARENT'] },
    { icon: CreditCard, label: 'Payments', href: '/payments', roles: ['ADMIN', 'PRINCIPAL', 'ACCOUNTANT'] },
    { icon: Calendar, label: 'Attendance', href: '/attendance', roles: ['ADMIN', 'PRINCIPAL', 'TEACHER', 'STUDENT', 'PARENT'] },
    { icon: ClipboardList, label: 'Timetable', href: '/timetable', roles: ['ADMIN', 'PRINCIPAL', 'TEACHER', 'STUDENT', 'PARENT'] },
    { icon: GraduationCap, label: 'Examinations', href: '/exams', roles: ['ADMIN', 'PRINCIPAL', 'TEACHER', 'STUDENT', 'PARENT'] },
    { icon: BookOpen, label: 'LMS', href: '/lms', roles: ['ADMIN', 'PRINCIPAL', 'TEACHER', 'STUDENT'] },
    { icon: Library, label: 'Library', href: '/library', roles: ['ADMIN', 'PRINCIPAL', 'LIBRARIAN', 'TEACHER', 'STUDENT'] },
    { icon: Bus, label: 'Transport', href: '/transport', roles: ['ADMIN', 'PRINCIPAL', 'TRANSPORT_STAFF', 'TEACHER', 'STUDENT', 'PARENT'] },
    { icon: Building2, label: 'Hostel', href: '/hostel', roles: ['ADMIN', 'PRINCIPAL', 'TEACHER', 'STUDENT', 'PARENT'] },
    { icon: Bell, label: 'Notifications', href: '/notifications', roles: ['ADMIN', 'PRINCIPAL', 'TEACHER', 'STUDENT', 'ACCOUNTANT', 'PARENT', 'LIBRARIAN', 'TRANSPORT_STAFF'] },
    { icon: Activity, label: 'Activity Logs', href: '/activities', roles: ['ADMIN', 'PRINCIPAL'] },
    { icon: FolderOpen, label: 'Files', href: '/files', roles: ['ADMIN', 'PRINCIPAL', 'TEACHER'] },
    { icon: ArrowUpDown, label: 'Student Progression', href: '/students/progression', roles: ['ADMIN', 'PRINCIPAL'] },
    { icon: Shield, label: 'Permission Matrix', href: '/permissions', roles: ['ADMIN'] },
  ].filter(item => !user || item.roles.includes(user.role))

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold text-primary-600">School ERP</h2>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden">
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="p-4">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-primary-50 text-gray-700 hover:text-primary-600 transition-colors mb-1"
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t">
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-red-50 text-gray-700 hover:text-red-600 transition-colors w-full"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'ml-0'}`}>
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="flex items-center justify-between p-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-gray-600 hover:text-gray-900"
            >
              <Menu className="w-6 h-6" />
            </button>

            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {user?.profile?.firstName || user?.name || 'User'}</span>
              <Link href="/profile" title="My Profile" className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center hover:bg-primary-200 transition-colors">
                <span className="text-primary-600 font-medium">
                  {user?.profile?.firstName?.charAt(0) || user?.name?.charAt(0) || 'U'}
                </span>
              </Link>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>

          {/* Stats Grid — admin/teacher/accountant view */}
          {!['STUDENT', 'PARENT'].includes(user?.role) && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Total Students</p>
                  <h3 className="text-3xl font-bold mt-2">{stats?.students?.total || 0}</h3>
                </div>
                <Users className="w-12 h-12 text-blue-200" />
              </div>
            </div>

            <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Total Staff</p>
                  <h3 className="text-3xl font-bold mt-2">{stats?.staff?.total || 0}</h3>
                </div>
                <UserCog className="w-12 h-12 text-green-200" />
              </div>
            </div>

            <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Total Classes</p>
                  <h3 className="text-3xl font-bold mt-2">{stats?.classes?.total || 0}</h3>
                </div>
                <GraduationCap className="w-12 h-12 text-purple-200" />
              </div>
            </div>

            <div className="card bg-gradient-to-br from-orange-500 to-orange-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm">Fee Collected</p>
                  <h3 className="text-3xl font-bold mt-2">₹{stats?.finance?.collected?.toLocaleString() || 0}</h3>
                </div>
                <DollarSign className="w-12 h-12 text-orange-200" />
              </div>
            </div>
          </div>
          )}

          {/* Student / Parent — simple card navigation grid */}
          {['STUDENT', 'PARENT'].includes(user?.role) && (
            <div className="card">
              <p className="text-sm text-gray-500 mb-4">
                {user?.role === 'PARENT' ? 'What would you like to check today?' : 'What would you like to do today?'}
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { href: '/attendance', icon: Calendar, label: 'My Attendance', color: 'from-blue-500 to-blue-600', desc: 'View your attendance records' },
                  { href: '/timetable', icon: ClipboardList, label: 'Timetable', color: 'from-purple-500 to-purple-600', desc: 'Check your class schedule' },
                  { href: '/exams', icon: GraduationCap, label: 'Exam Results', color: 'from-green-500 to-green-600', desc: 'See your marks & grades' },
                  { href: '/fees', icon: DollarSign, label: 'Fees', color: 'from-orange-500 to-orange-600', desc: 'Check your fee status' },
                  ...(user?.role === 'STUDENT' ? [{ href: '/lms', icon: BookOpen, label: 'Lessons & Notes', color: 'from-teal-500 to-teal-600', desc: 'Study materials & assignments' }] : []),
                  ...(user?.role === 'STUDENT' ? [{ href: '/library', icon: Library, label: 'Library', color: 'from-indigo-500 to-indigo-600', desc: 'Browse books & catalog' }] : []),
                  { href: '/notifications', icon: Bell, label: 'Notifications', color: 'from-pink-500 to-pink-600', desc: 'School announcements' },
                ].map(({ href, icon: Icon, label, color, desc }) => (
                  <Link
                    key={href}
                    href={href}
                    className={`card bg-gradient-to-br ${color} text-white hover:scale-[1.02] transition-transform cursor-pointer`}
                  >
                    <Icon className="w-8 h-8 mb-3 opacity-90" />
                    <p className="font-semibold text-base">{label}</p>
                    <p className="text-xs mt-1 opacity-75">{desc}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions + Recent Activities — admin/teacher/accountant only */}
          {!['STUDENT', 'PARENT'].includes(user?.role) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="card">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h2>
                <div className="space-y-2">
                  {['ADMIN', 'PRINCIPAL', 'TEACHER'].includes(user?.role) && (
                    <Link href="/students" className="block p-3 rounded-lg hover:bg-gray-50 border border-gray-200 transition-colors">
                      <div className="flex items-center space-x-3">
                        <Users className="w-5 h-5 text-primary-600" />
                        <span className="font-medium">Manage Students</span>
                      </div>
                    </Link>
                  )}
                  {['ADMIN', 'PRINCIPAL', 'TEACHER'].includes(user?.role) && (
                    <Link href="/attendance" className="block p-3 rounded-lg hover:bg-gray-50 border border-gray-200 transition-colors">
                      <div className="flex items-center space-x-3">
                        <Calendar className="w-5 h-5 text-primary-600" />
                        <span className="font-medium">Mark Attendance</span>
                      </div>
                    </Link>
                  )}
                  {['ADMIN', 'PRINCIPAL', 'ACCOUNTANT'].includes(user?.role) && (
                    <Link href="/fees" className="block p-3 rounded-lg hover:bg-gray-50 border border-gray-200 transition-colors">
                      <div className="flex items-center space-x-3">
                        <DollarSign className="w-5 h-5 text-primary-600" />
                        <span className="font-medium">Collect Fees</span>
                      </div>
                    </Link>
                  )}
                  {['ADMIN', 'PRINCIPAL'].includes(user?.role) && (
                    <Link href="/students/progression" className="block p-3 rounded-lg hover:bg-gray-50 border border-gray-200 transition-colors">
                      <div className="flex items-center space-x-3">
                        <ArrowUpDown className="w-5 h-5 text-primary-600" />
                        <span className="font-medium">Promote or Transfer Students</span>
                      </div>
                    </Link>
                  )}
                </div>
              </div>

              <div className="card">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Activities</h2>
                <div className="space-y-3">
                  {recentActivities.length === 0 ? (
                    <p className="text-gray-500 text-sm">No recent activities</p>
                  ) : (
                    recentActivities.slice(0, 8).map((activity: any) => (
                      <div key={activity.id} className="flex items-start space-x-3 p-2 rounded-lg hover:bg-gray-50">
                        <div className="w-2 h-2 rounded-full bg-primary-400 mt-2 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-700 truncate">{activity.description || activity.action}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {activity.module || 'System'} &middot;{' '}
                            {new Date(activity.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
