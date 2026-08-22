'use client';

import { usePathname } from 'next/navigation';
import { TransitionLink } from '@/components/shared/transition-link';
import { Separator } from '@/components/ui/separator';

const footerLinks = {
  company: [
    { label: 'About', href: '/#why-nr' },
    { label: 'Services', href: '/#services' },
    { label: 'Locations', href: '/#locations' },
    { label: 'Contact', href: '/#locations' },
  ],
  fleet: [
    { label: 'All Vehicles', href: '/fleet' },
    { label: 'Sedans', href: '/fleet' },
    { label: 'SUVs', href: '/fleet' },
    { label: 'Premium', href: '/fleet' },
    { label: 'Luxury', href: '/fleet' },
  ],
  support: [
    { label: 'Booking Help', href: '/#booking' },
    { label: 'Why NR Car Hire', href: '/#why-nr' },
    { label: 'Rental Locations', href: '/#locations' },
    { label: 'Our Services', href: '/#services' },
  ],
};

export function Footer() {
  const pathname = usePathname();
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  return (
    <footer className="bg-midnight text-white" role="contentinfo">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <TransitionLink href="/" aria-label="NR Car Hire home">
              <span className="text-xl font-display font-extrabold tracking-tight">
                NR<span className="text-gold"> Car Hire</span>
              </span>
            </TransitionLink>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-gray-400">
              Premium vehicle hire across Australia. Quality vehicles, transparent pricing, and
              reliable service.
            </p>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
              Company
            </h3>
            <ul className="mt-4 space-y-3" role="list">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <TransitionLink
                    href={link.href}
                    className="text-sm text-gray-300 transition-colors duration-200 hover:text-gold"
                  >
                    {link.label}
                  </TransitionLink>
                </li>
              ))}
            </ul>
          </div>

          {/* Fleet */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400">Fleet</h3>
            <ul className="mt-4 space-y-3" role="list">
              {footerLinks.fleet.map((link) => (
                <li key={link.label}>
                  <TransitionLink
                    href={link.href}
                    className="text-sm text-gray-300 transition-colors duration-200 hover:text-gold"
                  >
                    {link.label}
                  </TransitionLink>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
              Support
            </h3>
            <ul className="mt-4 space-y-3" role="list">
              {footerLinks.support.map((link) => (
                <li key={link.label}>
                  <TransitionLink
                    href={link.href}
                    className="text-sm text-gray-300 transition-colors duration-200 hover:text-gold"
                  >
                    {link.label}
                  </TransitionLink>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <Separator className="my-10 bg-white/10" />

        {/* Bottom */}
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} NR Car Hire. All rights reserved.
          </p>
          <p className="text-sm text-gray-500">ABN pending &middot; Australia</p>
        </div>
      </div>
    </footer>
  );
}
