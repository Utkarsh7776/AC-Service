'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Wind,
  LayoutDashboard,
  Users,
  Building2,
  ClipboardEdit,
  Clock,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react';

export default function Sidebar({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Fetch current user details
  const fetchUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      setUser(data.user || null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, [pathname]);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // If user is loading, show clean loader
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-brand flex items-center justify-center animate-pulse shadow-md">
            <Wind className="w-5 h-5 text-white" />
          </div>
          <p className="text-xs font-semibold text-slate-500">Loading portal...</p>
        </div>
      </div>
    );
  }

  // If not logged in, render children directly (e.g. login/auth prompts)
  if (!user) {
    return <>{children}</>;
  }

  // Navigation Links definition
  const adminLinks = [
    {
      href: '/dashboard',
      label: 'Operations Dashboard',
      icon: LayoutDashboard,
      exact: true,
      badge: 'Live',
    },
    {
      href: '/dashboard/technicians',
      label: 'Technicians',
      icon: Users,
    },
    {
      href: '/dashboard/clients',
      label: 'Clients & Branches',
      icon: Building2,
    },
  ];

  const technicianLinks = [
    {
      href: '/technician',
      label: 'Log Service Visit',
      icon: ClipboardEdit,
      exact: true,
      badge: 'Entry',
    },
    {
      href: '/technician/my-visits',
      label: 'My Service Visits',
      icon: Clock,
    },
  ];

  const navItems = user.role === 'admin' ? adminLinks : technicianLinks;

  const renderNavLinks = () => (
    <div className="space-y-1.5">
      <div className="px-3 pb-2 text-[10px] font-bold tracking-wider uppercase text-slate-400">
        {user.role === 'admin' ? 'Admin Controls' : 'Technician Tasks'}
      </div>
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={`group relative flex items-center justify-between px-3.5 py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              isActive
                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md shadow-blue-500/25 font-bold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <Icon
                className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                  isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-400'
                }`}
              />
              <span className="truncate">{item.label}</span>
            </div>

            {item.badge && (
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                }`}
              >
                {item.badge}
              </span>
            )}
          </Link>
        );
      })}

      {/* Admin quick jump to technician logging flow */}
      {user.role === 'admin' && (
        <div className="pt-4 mt-4 border-t border-slate-800/80">
          <div className="px-3 pb-2 text-[10px] font-bold tracking-wider uppercase text-slate-400">
            Field Shortcut
          </div>
          <Link
            href="/technician"
            onClick={() => setMobileOpen(false)}
            className={`group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              pathname === '/technician'
                ? 'bg-blue-600 text-white font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center gap-3">
              <ClipboardEdit className="w-4 h-4 text-slate-400 group-hover:text-blue-400" />
              <span>Technician Portal</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 opacity-60" />
          </Link>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-800">
      {/* ── DESKTOP SIDEBAR ── */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 xl:w-72 bg-slate-900 text-white shrink-0 sticky top-0 h-screen border-r border-slate-800 z-30">
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center text-white shadow-lg shadow-blue-500/25 shrink-0">
            <Wind className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h1 className="font-extrabold text-sm tracking-tight text-white truncate leading-tight">
              NextGenWebtech
            </h1>
            <p className="text-[10px] text-blue-300 font-medium tracking-wide flex items-center gap-1 mt-0.5">
              <span>Solutions</span>
              <span className="w-1 h-1 rounded-full bg-cyan-400"></span>
              <span className="text-slate-400">Field Service</span>
            </p>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3.5 py-5 scrollbar-thin scrollbar-thumb-slate-800">
          {renderNavLinks()}
        </div>

        {/* User Card & Logout Footer */}
        <div className="p-3.5 border-t border-slate-800/80 bg-slate-950/40">
          {/* User Profile Card */}
          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center gap-3 mb-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white font-bold text-sm shadow shrink-0">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-white truncate">{user.name}</span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] font-mono text-slate-400 truncate">@{user.loginId}</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  {user.role}
                </span>
              </div>
            </div>
          </div>

          {/* Logout Button */}
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold text-rose-300 hover:text-white bg-rose-500/10 hover:bg-rose-600 border border-rose-500/20 hover:border-rose-600 transition-all shadow-sm"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ── MOBILE DRAWER OVERLAY & SIDEBAR ── */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm transition-opacity animate-fade-in"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`lg:hidden fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 text-white flex flex-col shadow-2xl transition-transform duration-300 ease-in-out border-r border-slate-800 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center text-white shadow-sm">
              <Wind className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-xs text-white">NextGenWebtech Solutions</span>
              <p className="text-[10px] text-blue-300">Field Service</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Nav Items */}
        <div className="flex-1 overflow-y-auto px-3.5 py-4">
          {renderNavLinks()}
        </div>

        {/* Drawer User Card & Logout */}
        <div className="p-3.5 border-t border-slate-800 bg-slate-950/40">
          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center gap-3 mb-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white font-bold text-sm shadow shrink-0">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-xs font-bold text-white truncate block">{user.name}</span>
              <span className="text-[10px] text-slate-400 block truncate">@{user.loginId}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold text-rose-300 hover:text-white bg-rose-500/10 hover:bg-rose-600 border border-rose-500/20 transition-all shadow-sm"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT CONTAINER (SINGLE INSTANCE) ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Top Bar (only visible on small screens) */}
        <header className="lg:hidden sticky top-0 z-40 bg-slate-900 border-b border-slate-800 px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between text-white shadow-md">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="p-1.5 -ml-1 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
              aria-label="Open sidebar menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center text-white shadow-sm shrink-0">
                <Wind className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-xs sm:text-sm text-white truncate tracking-tight">
                NextGenWebtech Solutions
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 ml-2">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
              {user.role}
            </span>
          </div>
        </header>

        {/* Content body */}
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
