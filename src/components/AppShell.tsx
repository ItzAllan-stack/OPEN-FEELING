import React from 'react';
import { Sidebar } from './Sidebar.tsx';

interface AppShellProps {
  children: React.ReactNode;
  rightSidebar?: React.ReactNode;
}

export function AppShell({ children, rightSidebar }: AppShellProps) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-24 lg:pb-14">
      <div className="flex items-start gap-8">
        <Sidebar />
        <main className="flex-1 min-w-0">{children}</main>
        {rightSidebar && (
          <aside className="hidden xl:block w-80 shrink-0 sticky top-20 self-start space-y-5">
            {rightSidebar}
          </aside>
        )}
      </div>
    </div>
  );
}
