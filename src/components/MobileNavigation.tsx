import { Home, Compass, PenLine, Bell, User } from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';

export function MobileNavigation() {
  const { currentPath, navigate, unreadNotificationsCount, firebaseUser, needsOnboarding } = useApp();

  if (!firebaseUser || needsOnboarding) return null;

  const tabs = [
    { path: '/home', label: 'Home', icon: Home },
    { path: '/explore', label: 'Explore', icon: Compass },
    { path: '/create', label: 'Create', icon: PenLine },
    {
      path: '/notifications',
      label: 'Alerts',
      icon: Bell,
      badge: unreadNotificationsCount,
    },
    { path: '/profile', label: 'Profile', icon: User },
  ];

  return (
    <nav
      aria-label="Mobile bottom navigation"
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-[#FCFBFA]/95 backdrop-blur-sm border-t border-[#EAE4DD] h-16 px-2 flex items-center justify-around"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const active = currentPath === tab.path;
        return (
          <button
            key={tab.path}
            type="button"
            onClick={() => navigate(tab.path)}
            className={`relative flex flex-col items-center justify-center min-w-[56px] min-h-[44px] rounded-xl px-2 py-1 text-[11px] font-medium transition-colors cursor-pointer ${
              active ? 'text-[#9F4E65]' : 'text-[#6B6770] hover:text-[#29272B]'
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="mt-0.5 whitespace-nowrap">{tab.label}</span>
            {typeof tab.badge === 'number' && tab.badge > 0 && (
              <span className="absolute top-1 right-2.5 text-[10px] font-bold text-[#9F4E65] tabular-nums">
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
