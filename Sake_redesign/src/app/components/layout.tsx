import React, { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router';
import {
  Library,
  Search,
  ListOrdered,
  Trash2,
  Settings,
  Menu,
  X,
  BookOpen,
  LogOut,
  Link as LinkIcon,
  Archive,
  BarChart3,
} from 'lucide-react';
import { Toaster } from 'sonner';

const navItems = [
  { to: '/', label: 'Library', icon: Library },
  { to: '/search', label: 'Search', icon: Search },
  { to: '/queue', label: 'Queue', icon: ListOrdered },
  { to: '/stats', label: 'Stats', icon: BarChart3 },
  { to: '/archived', label: 'Archived', icon: Archive },
  { to: '/trash', label: 'Trash', icon: Trash2 },
];

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#1a1d27',
            border: '1px solid rgba(255,255,255,0.08)',
            color: '#e8e6e3',
          },
        }}
      />

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border flex flex-col transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-5 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-primary" />
            </div>
            <span className="text-foreground tracking-tight">Z-DL</span>
          </div>
          <button
            className="lg:hidden ml-auto text-muted-foreground hover:text-foreground cursor-pointer"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
                }`
              }
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Bottom section */}
        <div className="p-3 border-t border-sidebar-border space-y-1">
          <NavLink
            to="/connect"
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
              }`
            }
          >
            <LinkIcon className="w-4 h-4" />
            Z-Library
          </NavLink>
          <button className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground w-full transition-all cursor-pointer">
            <Settings className="w-4 h-4" />
            Settings
          </button>
        </div>

        {/* User */}
        <div className="p-3 border-t border-sidebar-border">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs text-primary">
              JD
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground truncate">John Doe</p>
              <p className="text-xs text-muted-foreground truncate">
                john@example.com
              </p>
            </div>
            <button className="text-muted-foreground hover:text-foreground cursor-pointer">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 flex items-center px-4 lg:px-6 border-b border-border shrink-0">
          <button
            className="lg:hidden mr-3 text-muted-foreground hover:text-foreground cursor-pointer"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="text-foreground capitalize">
              {location.pathname === '/'
                ? 'Library'
                : location.pathname.slice(1).replace(/-/g, ' ')}
            </span>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}