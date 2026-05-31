'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  BarChart3, LayoutDashboard, Upload, PlusCircle, Settings,
  FileText, Menu, X, Moon, Sun, ChevronDown, LogOut,
  User, Shield, Database, ChevronRight, Table2, Users2
} from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/data-entry', label: 'Add Data', icon: PlusCircle },
  { href: '/upload', label: 'Import Excel', icon: Upload },
  { href: '/reports', label: 'Reports', icon: FileText },
]

const manageItems = [
  { href: '/manage/inventory', label: 'Inventory Records', icon: Table2 },
  { href: '/manage/users', label: 'User Management', icon: Users2 },
  { href: '/manage/database', label: 'Database Tools', icon: Database },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [profileOpen, setProfileOpen] = useState(false)
  const [manageOpen, setManageOpen] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase.from('profiles').select('*').eq('id', user.id).single()
          .then(({ data }) => { if (data) setProfile(data) })
      }
    })
  }, [])

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
  }, [darkMode])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : (profile?.email || 'U').slice(0, 2).toUpperCase()

  const isAdmin = profile?.role === 'admin'
  const isManager = profile?.role === 'admin' || profile?.role === 'manager'

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--background)' }}>
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-60 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-700 transform transition-transform duration-200 lg:relative lg:translate-x-0 flex flex-col ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-4 py-4 border-b border-gray-100 dark:border-slate-700">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#0B2E6D' }}>
            <BarChart3 size={16} className="text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight">Monthly Meeting</p>
            <p className="text-xs text-gray-500 leading-tight">Inventory Dashboard</p>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden ml-auto text-gray-400 flex-shrink-0">
            <X size={16} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {/* Main nav */}
          <p className="px-2 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Main</p>
          {navItems.map(({ href, label, icon: Icon }) => (
            (!isManager && href === '/data-entry') ? null :
            (!isManager && href === '/upload') ? null :
            <Link key={href} href={href}
              className={`sidebar-link ${isActive(href) ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}>
              <Icon size={16} /><span>{label}</span>
            </Link>
          ))}

          {/* Manage section - admin/manager only */}
          {isManager && (
            <>
              <div className="pt-3 pb-1">
                <button onClick={() => setManageOpen(!manageOpen)}
                  className="flex items-center justify-between w-full px-2 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider hover:text-gray-600 transition">
                  <span>Manage</span>
                  <ChevronRight size={12} className={`transition-transform ${manageOpen ? 'rotate-90' : ''}`} />
                </button>
              </div>
              {manageOpen && manageItems.map(({ href, label, icon: Icon }) => (
                (!isAdmin && href === '/manage/users') ? null :
                (!isAdmin && href === '/manage/database') ? null :
                <Link key={href} href={href}
                  className={`sidebar-link ${isActive(href) ? 'active' : ''}`}
                  onClick={() => setSidebarOpen(false)}>
                  <Icon size={16} /><span>{label}</span>
                </Link>
              ))}
            </>
          )}

          {/* Settings */}
          <div className="pt-3 pb-1">
            <p className="px-2 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Account</p>
          </div>
          <Link href="/settings" className={`sidebar-link ${isActive('/settings') ? 'active' : ''}`} onClick={() => setSidebarOpen(false)}>
            <Settings size={16} /><span>Settings</span>
          </Link>
          {isAdmin && (
            <Link href="/admin" className={`sidebar-link ${isActive('/admin') ? 'active' : ''}`} onClick={() => setSidebarOpen(false)}>
              <Shield size={16} /><span>Admin Panel</span>
            </Link>
          )}
        </nav>

        {/* User profile at bottom */}
        <div className="p-2 border-t border-gray-100 dark:border-slate-700">
          <div className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 cursor-pointer" onClick={handleLogout}>
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: '#0B2E6D' }}>
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{profile?.full_name || 'User'}</p>
              <p className="text-xs text-gray-500 capitalize">{profile?.role || 'viewer'}</p>
            </div>
            <LogOut size={13} className="text-gray-400 flex-shrink-0" />
          </div>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/30 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 px-4 py-3 flex items-center gap-3 z-30 flex-shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-500 hover:text-gray-700">
            <Menu size={20} />
          </button>
          <div className="flex-1">
            <h1 className="text-sm font-bold text-gray-900 dark:text-white hidden sm:block">Monthly Review Meeting</h1>
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 dark:text-gray-400 transition">
              {darkMode ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <div className="relative">
              <button onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: '#0B2E6D' }}>
                  {initials}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-semibold text-gray-900 dark:text-white leading-tight">{profile?.full_name || 'User'}</p>
                  <p className="text-xs text-gray-500 capitalize leading-tight">{profile?.role}</p>
                </div>
                <ChevronDown size={13} className="text-gray-400 hidden sm:block" />
              </button>
              {profileOpen && (
                <div className="absolute right-0 mt-1.5 w-44 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-100 dark:border-slate-700 py-1 z-50">
                  <Link href="/settings" onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700">
                    <User size={13} /> My Profile
                  </Link>
                  {isAdmin && (
                    <Link href="/admin" onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700">
                      <Shield size={13} /> Admin Panel
                    </Link>
                  )}
                  <hr className="my-1 border-gray-100 dark:border-slate-700" />
                  <button onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                    <LogOut size={13} /> Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
