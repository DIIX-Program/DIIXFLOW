'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [isRail, setIsRail] = useState(false);

  // Auto-collapse to rail if screen width is below 1280px on mount or resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1280) {
        setIsRail(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)] flex flex-col">
      <Sidebar isRail={isRail} onToggleRail={() => setIsRail(!isRail)} />
      <Topbar isRail={isRail} />

      <main
        className={`flex-1 pt-[56px] transition-all duration-200 ease-in-out ${
          isRail ? 'ml-[76px]' : 'ml-[240px]'
        }`}
      >
        <div className="p-6 md:p-8 max-w-[1520px] mx-auto w-full">{children}</div>
      </main>
    </div>
  );
}
