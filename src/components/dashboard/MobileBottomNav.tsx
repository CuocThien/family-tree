'use client';

import Link from 'next/link';
import { Home, Search, User } from 'lucide-react';
import { usePathname } from 'next/navigation';

interface MobileBottomNavProps {
  className?: string;
}

export function MobileBottomNav({ className = '' }: MobileBottomNavProps) {
  const pathname = usePathname();

  const navItems = [
    { name: 'Home', href: '/dashboard', icon: Home },
    { name: 'Trees', href: '/dashboard/trees', icon: null },
    { name: 'Search', href: '/search', icon: Search },
    { name: 'Profile', href: '/dashboard/settings', icon: User },
  ];

  return (
    <div className={`lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-background-dark border-t border-[#e7f1f3] dark:border-white/10 px-4 py-2 flex justify-around items-center z-50 ${className}`}>
      {navItems.map((item) => {
        const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href));

        return (
          <Link
            key={item.name}
            href={item.href}
            className={`flex flex-col items-center gap-1 ${
              isActive ? 'text-primary' : 'text-[#4c8d9a]'
            }`}
          >
            {item.icon ? (
              <item.icon className="w-6 h-6" />
            ) : (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L12 12M12 12L8 16M12 12L16 16M12 12L5 22M12 12L19 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
            <span className="text-[10px] font-medium">{item.name}</span>
          </Link>
        );
      })}
    </div>
  );
}

MobileBottomNav.displayName = 'MobileBottomNav';
