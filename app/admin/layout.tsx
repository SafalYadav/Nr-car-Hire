'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Car,
  CalendarRange,
  BookmarkCheck,
  Tag,
  DollarSign,
  PackagePlus,
  MapPin,
  CreditCard,
  History,
  ExternalLink,
  ChevronRight,
  Menu,
  X,
} from 'lucide-react';

const navigationItems = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Vehicles', href: '/admin/vehicles', icon: Car },
  { name: 'Inventory & Holds', href: '/admin/inventory', icon: CalendarRange },
  { name: 'Bookings', href: '/admin/bookings', icon: BookmarkCheck },
  { name: 'Pricing Controls', href: '/admin/pricing', icon: DollarSign },
  { name: 'Discounts & Promos', href: '/admin/discounts', icon: Tag },
  { name: 'Optional Extras', href: '/admin/extras', icon: PackagePlus },
  { name: 'Locations & Hubs', href: '/admin/locations', icon: MapPin },
  { name: 'Payments & Refunds', href: '/admin/payments', icon: CreditCard },
  { name: 'Audit Logs', href: '/admin/audit-logs', icon: History },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col lg:flex-row antialiased">
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between bg-slate-950 border-b border-slate-800 p-4 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-gold flex items-center justify-center text-slate-950 font-bold text-xs">
            NR
          </div>
          <span className="font-display font-bold text-sm text-white">Admin Command Centre</span>
        </div>
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-2 rounded-lg bg-slate-800 text-slate-300"
        >
          {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-950 border-r border-slate-800 flex flex-col transition-transform duration-200 lg:static lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-gold via-amber-500 to-amber-600 flex items-center justify-center text-slate-950 font-extrabold text-sm shadow-md shadow-gold/20">
              NR
            </div>
            <div>
              <h2 className="font-display font-bold text-sm tracking-wide text-white">
                NR Car Hire
              </h2>
              <p className="text-[10px] uppercase font-semibold text-gold tracking-widest">
                Command Centre
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navigationItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsMobileOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-gold text-slate-950 font-bold shadow-md shadow-gold/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer info & live links */}
        <div className="p-4 border-t border-slate-800/80 space-y-2 text-xs">
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-[11px] font-semibold border border-emerald-500/20">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Admin Mode (RBAC Active)</span>
          </div>

          <Link
            href="/"
            target="_blank"
            className="flex items-center justify-between px-2 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 text-[11px] transition-colors"
          >
            <span>Customer Website</span>
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-900">
        {/* Admin Top Header */}
        <header className="hidden lg:flex items-center justify-between px-8 py-4 bg-slate-950/60 backdrop-blur-md border-b border-slate-800/80 sticky top-0 z-30">
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span>Admin</span>
            <ChevronRight className="h-3.5 w-3.5 text-slate-600" />
            <span className="text-white font-semibold capitalize">
              {pathname.replace('/admin', '').replace('/', '') || 'Executive Dashboard'}
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <span className="font-mono text-[11px] bg-slate-800 text-gold px-2.5 py-1 rounded-md border border-slate-700">
              API Key: nr-car-hire-admin-secret-2024
            </span>
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-full bg-gold/20 text-gold font-bold flex items-center justify-center text-xs">
                A
              </div>
              <span className="text-slate-300 font-medium">Administrator</span>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
