'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Calendar, Settings } from 'lucide-react';

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div className="text-xl font-semibold">Roster Planner</div>
          <div className="flex space-x-6">
            <Link
              href="/"
              className={`${
                pathname === '/' ? 'text-blue-600' : ''
              } hover:text-blue-500 flex items-center`}
            >
              <Calendar className="w-4 h-4 mr-2" />
              Schedule
            </Link>
            <Link
              href="/admin"
              className={`${
                pathname === '/admin' ? 'text-blue-600' : ''
              } hover:text-blue-500 flex items-center`}
            >
              <Settings className="w-4 h-4 mr-2" />
              Admin
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
