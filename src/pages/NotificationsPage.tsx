import React, { useState } from 'react';
import { Bell, CheckCheck, Settings } from 'lucide-react';
import { AppShell } from '../components/AppShell.tsx';
import { NotificationItem } from '../components/NotificationItem.tsx';
import { useApp } from '../context/AppContext.tsx';
import {
  markAllNotificationsRead,
  markNotificationRead,
} from '../services/firestoreService.ts';
import { AppNotification } from '../types/index.ts';

export function NotificationsPage() {
  const {
    publicUser,
    notifications,
    unreadNotificationsCount,
    navigate,
    showToast,
  } = useApp();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  if (!publicUser) {
    return (
      <AppShell>
        <div className="bg-[#F8F6F3] border border-[#EAE4DD] rounded-2xl p-8 text-center space-y-3">
          <h1 className="text-xl font-display text-[#29272B]">Sign in to see notifications</h1>
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="px-4 py-2 rounded-xl bg-[#29272B] text-[#FCFBFA] text-xs font-medium cursor-pointer"
          >
            Sign In
          </button>
        </div>
      </AppShell>
    );
  }

  const visible =
    filter === 'unread' ? notifications.filter((n) => !n.isRead) : notifications;

  const handleOpen = async (item: AppNotification) => {
    if (!item.isRead) {
      await markNotificationRead(item.id);
    }
    if (item.postId) {
      navigate(`/post/${item.postId}`);
    } else if (item.type === 'follow') {
      navigate(`/profile/${item.actorUid}`);
    }
  };

  return (
    <AppShell>
      <div className="max-w-3xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-display font-medium text-[#29272B]">
              Notifications
            </h1>
            <p className="text-sm text-[#77727A] tabular-nums">
              {unreadNotificationsCount} unread updates
            </p>
          </div>

          <div className="flex items-center gap-2">
            {unreadNotificationsCount > 0 && (
              <button
                type="button"
                onClick={async () => {
                  await markAllNotificationsRead(notifications);
                  showToast('All notifications marked as read.', 'success');
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#F8F6F3] border border-[#EAE4DD] text-xs font-medium text-[#29272B] hover:bg-[#EEE8E1] cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all read</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => navigate('/settings')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#FCFBFA] border border-[#EAE4DD] text-xs font-medium text-[#77727A] hover:text-[#29272B] cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Preferences</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1 p-1 bg-[#F8F6F3] border border-[#EAE4DD] rounded-xl w-fit">
          {(['all', 'unread'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setFilter(tab)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium capitalize cursor-pointer ${
                filter === tab
                  ? 'bg-[#FCFBFA] text-[#29272B] border border-[#EAE4DD]'
                  : 'text-[#77727A]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {visible.length === 0 ? (
          <div className="bg-[#F8F6F3] border border-[#EAE4DD] rounded-2xl p-8 text-center space-y-2">
            <Bell className="w-6 h-6 text-[#77727A] mx-auto" />
            <p className="text-base font-display text-[#29272B]">All quiet here</p>
            <p className="text-sm text-[#77727A]">
              When someone sends warmth, replies, or follows your reflections, you will see it here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {visible.map((item) => (
              <NotificationItem
                key={item.id}
                item={item}
                onMarkRead={markNotificationRead}
                onOpen={handleOpen}
              />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
