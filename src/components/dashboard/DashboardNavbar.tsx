'use client';

import Link from 'next/link';
import { Search, Bell, Settings, Menu, Home } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface DashboardNavbarProps {
  userName?: string;
}

export function DashboardNavbar({ userName }: DashboardNavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Trees', href: '/dashboard/trees', icon: null },
    { name: 'Search', href: '/search', icon: null },
    { name: 'DNA', href: '/dna', icon: null },
    { name: 'Help', href: '/help', icon: null },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-background-dark border-b border-[#e7f1f3] dark:border-white/10">
      <div className="px-4 md:px-10 py-3">
        <div className="flex items-center justify-between">
          {/* Logo and Desktop Nav */}
          <div className="flex items-center gap-4 md:gap-8">
            {/* Logo */}
            <Link href="/dashboard" className="flex items-center gap-2 text-primary">
              <div className="w-8 h-8">
                <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M4 42.4379C4 42.4379 14.0962 36.0744 24 41.1692C35.0664 46.8624 44 42.2078 44 42.2078L44 7.01134C44 7.01134 35.068 11.6577 24.0031 5.96913C14.0971 0.876274 4 7.27094 4 7.27094L4 42.4379Z"
                    fill="currentColor"
                  />
                </svg>
              </div>
              <span className="text-xl font-black tracking-tight text-[#0d191b] dark:text-white">
                AncestryHub
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className={cn(
                    'text-sm font-medium transition-colors',
                    link.name === 'Dashboard'
                      ? 'text-primary border-b-2 border-primary pb-1'
                      : 'text-[#4c8d9a] hover:text-primary'
                  )}
                >
                  {link.name}
                </Link>
              ))}
            </nav>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-2 md:gap-4">
            {/* Search (desktop) */}
            <div className="hidden md:flex items-center bg-[#e7f1f3] dark:bg-white/10 rounded-xl h-10 px-3 min-w-[160px] max-w-[260px]">
              <Search className="w-5 h-5 text-[#4c8d9a]" />
              <input
                type="text"
                placeholder="Find ancestor..."
                className="flex-1 bg-transparent border-none outline-none px-3 text-sm text-[#0d191b] dark:text-white placeholder:text-[#4c8d9a]"
              />
            </div>

            {/* Icon Buttons */}
            <button className="hidden md:flex items-center justify-center w-10 h-10 rounded-xl bg-[#e7f1f3] dark:bg-white/10 text-[#0d191b] dark:text-white hover:bg-primary/20">
              <Bell className="w-5 h-5" />
            </button>
            <button className="hidden md:flex items-center justify-center w-10 h-10 rounded-xl bg-[#e7f1f3] dark:bg-white/10 text-[#0d191b] dark:text-white hover:bg-primary/20">
              <Settings className="w-5 h-5" />
            </button>

            {/* Profile Avatar */}
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-blue-500 ring-2 ring-primary/20" />

            {/* Mobile Menu Button */}
            <button
              className="lg:hidden flex items-center justify-center w-10 h-10 rounded-xl bg-[#e7f1f3] dark:bg-white/10"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              type="button"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <nav className="lg:hidden py-4 flex flex-col gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-[#4c8d9a] hover:bg-[#e7f1f3] dark:hover:bg-white/10"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.icon && <link.icon className="w-5 h-5" />}
                <span className="font-medium">{link.name}</span>
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}
