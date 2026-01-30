'use client';

import Link from 'next/link';
import { Search, Bell, Settings, Menu, Home, X } from 'lucide-react';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface DashboardNavbarProps {
  userName?: string;
}

export function DashboardNavbar({ userName }: DashboardNavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Close mobile menu on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [mobileMenuOpen]);

  const navLinks = useMemo(() => [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Trees', href: '/dashboard/trees', icon: null },
    { name: 'Search', href: '/search', icon: null },
    { name: 'Settings', href: '/dashboard/settings', icon: null },
  ], []);

  const toggleMobileMenu = useCallback(() => {
    setMobileMenuOpen((prev) => !prev);
  }, []);

  const closeMobileMenu = useCallback(() => {
    setMobileMenuOpen(false);
  }, []);

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
            <nav className="hidden lg:flex items-center gap-6" aria-label="Main navigation">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={cn(
                      'text-sm font-medium transition-colors',
                      isActive
                        ? 'text-primary border-b-2 border-primary pb-0.5'
                        : 'text-[#4c8d9a] hover:text-primary'
                    )}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-2 md:gap-4">
            {/* Search - decorative, functional link to search */}
            <Link
              href="/search"
              className="hidden md:flex items-center bg-[#e7f1f3] dark:bg-white/10 rounded-xl h-10 px-3 min-w-[160px] max-w-[260px] hover:bg-[#e7f1f3] dark:hover:bg-white/20 transition-colors"
              aria-label="Search"
            >
              <Search className="w-5 h-5 text-[#4c8d9a]" />
              <span className="px-3 text-sm text-[#4c8d9a]">Find ancestor...</span>
            </Link>

            {/* Notifications */}
            <button
              className="hidden md:flex items-center justify-center w-10 h-10 rounded-xl bg-[#e7f1f3] dark:bg-white/10 text-[#0d191b] dark:text-white hover:bg-primary/10 dark:hover:bg-primary/20 hover:text-primary transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
            </button>

            {/* Settings */}
            <button
              className="hidden md:flex items-center justify-center w-10 h-10 rounded-xl bg-[#e7f1f3] dark:bg-white/10 text-[#0d191b] dark:text-white hover:bg-primary/10 dark:hover:bg-primary/20 hover:text-primary transition-colors"
              aria-label="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>

            {/* Profile Avatar */}
            <Link
              href="/dashboard/settings"
              className="hidden md:block w-10 h-10 rounded-full bg-gradient-to-br from-primary to-blue-500 ring-2 ring-primary/20 hover:ring-primary/40 transition-all"
              aria-label="Profile settings"
            >
              <span className="sr-only">Profile</span>
            </Link>

            {/* Mobile Menu Button */}
            <button
              className="lg:hidden flex items-center justify-center w-10 h-10 rounded-xl bg-[#e7f1f3] dark:bg-white/10 text-[#0d191b] dark:text-white hover:bg-primary/10 dark:hover:bg-primary/20 transition-colors"
              onClick={toggleMobileMenu}
              type="button"
              aria-label="Toggle menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <nav className="lg:hidden py-4 flex flex-col gap-2">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={closeMobileMenu}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-[#4c8d9a] hover:bg-[#e7f1f3] dark:hover:bg-white/10'
                  )}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {link.icon && <link.icon className="w-5 h-5" />}
                  <span>{link.name}</span>
                </Link>
              );
            })}
            </nav>
          )}
      </div>
    </header>
  );
}
