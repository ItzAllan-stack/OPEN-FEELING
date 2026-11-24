import {
  Home,
  Compass,
  PenLine,
  Users,
  Bell,
  Bookmark,
  BookLock,
  User,
  Settings,
  ShieldCheck,
  LogOut,
} from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';

export function Sidebar() {
  const {
    publicUser,
    isAdmin,
    currentPath,
    navigate,
    unreadNotificationsCount,
    logout,
  } = useApp();

  const items = [
    { path: '/home', label: 'Home', icon: Home },
    { path: '/explore', label: 'Explore', icon: Compass },
    { path: '/create', label: 'Create Post', icon: PenLine },
    { path: '/communities', label: 'Communities', icon: Users },
    {
      path: '/notifications',
      label: 'Notifications',
      icon: Bell,
      count: unreadNotificationsCount,
    },
    { path: '/saved', label: 'Saved Posts', icon: Bookmark },
    { path: '/journal', label: 'Personal Space', icon: BookLock },
    { path: '/profile', label: 'My Profile', icon: User },
    { path: '/settings', label: 'Settings', icon: Settings },
  ];

  if (isAdmin) {
    items.push({ path: '/moderation', label: 'Moderation', icon: ShieldCheck });
  }

  return (
    <aside
      aria-label="Workspace navigation"
      className="hidden lg:flex flex-col w-60 shrink-0 sticky top-20 self-start max-h-[calc(100vh-6rem)] justify-between py-2"
    >
      <div className="space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          const active =
            currentPath === item.path ||
            (item.path === '/communities' && currentPath.startsWith('/community/')) ||
            (item.path === '/profile' && currentPath === '/profile/edit');

          return (
            <button
              key={item.path}
              type="button"
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
                active
                  ? 'bg-[#F4DCE3]/65 text-[#29272B]'
                  : 'text-[#6B6770] hover:text-[#29272B] hover:bg-[#F8F6F3]'
              }`}
            >
              <span className="flex items-center gap-3 min-w-0">
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    active ? 'text-[#9F4E65]' : 'text-[#6B6770]'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </span>
              {typeof item.count === 'number' && item.count > 0 && (
                <span className="text-xs tabular-nums font-semibold text-[#9F4E65]">
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {publicUser && (
        <div className="pt-6 mt-6 border-t border-[#EAE4DD] space-y-2">
          <div className="px-3.5 py-2">
            <p className="text-sm font-medium text-[#29272B] truncate">
              {publicUser.displayName}
            </p>
            <p className="text-xs text-[#6B6770] truncate">
              @{publicUser.username}
            </p>
          </div>
          <button
            type="button"
            onClick={logout}
            className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-sm text-[#6B6770] hover:text-[#29272B] hover:bg-[#F8F6F3] transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </aside>
  );
}
