import React from 'react';
import { Heart, MessageCircle, UserPlus, Users, ShieldAlert } from 'lucide-react';
import { AppNotification } from '../types/index.ts';
import { formatRelativeTime } from '../utils/date.ts';

interface NotificationItemProps {
  item: AppNotification;
  onMarkRead: (id: string) => void;
  onOpen: (item: AppNotification) => void;
}

export function NotificationItem({
  item,
  onMarkRead,
  onOpen,
}: NotificationItemProps) {
  const Icon =
    item.type === 'reaction'
      ? Heart
      : item.type === 'follow'
        ? UserPlus
        : item.type === 'community'
          ? Users
          : item.type === 'safety'
            ? ShieldAlert
            : MessageCircle;

  return (
    <div
      className={`flex items-start justify-between gap-4 p-4 rounded-xl border transition-colors ${
        item.isRead
          ? 'bg-[#FCFBFA] border-[#EAE4DD]'
          : 'bg-[#F4DCE3]/25 border-[#E9A9B8]/60'
      }`}
    >
      <button
        type="button"
        onClick={() => onOpen(item)}
        className="flex items-start gap-3 text-left flex-1 min-w-0 cursor-pointer"
      >
        <div className="w-9 h-9 rounded-full bg-[#F8F6F3] border border-[#EAE4DD] flex items-center justify-center shrink-0 mt-0.5">
          <Icon className="w-4 h-4 text-[#9F4E65]" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm text-[#29272B] leading-snug">{item.message}</p>
          <p className="mt-1 text-xs text-[#77727A] tabular-nums">
            {formatRelativeTime(item.createdAt)}
            {!item.isRead && ' · Unread'}
          </p>
        </div>
      </button>

      {!item.isRead && (
        <button
          type="button"
          onClick={() => onMarkRead(item.id)}
          className="text-xs font-medium text-[#9F4E65] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
        >
          Mark read
        </button>
      )}
    </div>
  );
}
