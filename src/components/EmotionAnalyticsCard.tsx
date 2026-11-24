import { useMemo } from 'react';
import type { PrivateJournalEntry } from '../types/index.ts';
import { getEmotionStats } from '../utils/emotionStats.ts';

interface EmotionAnalyticsCardProps {
  entries: PrivateJournalEntry[];
}

export function EmotionAnalyticsCard({ entries }: EmotionAnalyticsCardProps) {
  const stats = useMemo(() => getEmotionStats(entries), [entries]);

  if (entries.length === 0) {
    return (
      <section className="bg-[#FCFBFA] border border-[#EAE4DD] rounded-2xl p-5 sm:p-6 space-y-2">
        <h2 className="text-lg font-medium text-[#29272B]">Insights</h2>
        <p className="text-sm text-[#6B6770]">
          Write a few reflections to see your emotion timeline and favorite words here.
        </p>
      </section>
    );
  }

  const maxWordCount = stats.wordCloud.length ? stats.wordCloud[0].count : 1;
  const daysLabel = stats.dayOrder.length;

  return (
    <section className="bg-[#FCFBFA] border border-[#EAE4DD] rounded-2xl p-5 sm:p-6 space-y-4">
      <h2 className="text-lg font-medium text-[#29272B]">Insights</h2>

      <div className="space-y-1.5">
        <p className="text-xs font-medium uppercase tracking-wide text-[#6B6770]">Emotion mix</p>
        <div className="flex flex-wrap items-center gap-1.5">
          {stats.topEmotions.length === 0 ? (
            <p className="text-xs text-[#6B6770]">No emotion tags on your entries yet.</p>
          ) : (
            stats.topEmotions.map((item) => (
              <span
                key={item.meta.id}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#EAE4DD] bg-[#FCFBFA] px-3 py-1 text-xs"
                style={{ color: item.meta.tintText }}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: item.meta.dotColor }}
                  aria-hidden="true"
                />
                {item.meta.label} · {item.count}
              </span>
            ))
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <p className="text-xs font-medium uppercase tracking-wide text-[#6B6770]">
          Mood timeline · last {daysLabel} days
        </p>
        <div className="flex h-7 items-end gap-px overflow-hidden rounded-lg border border-[#EAE4DD] bg-[#F8F6F3] px-1">
          {stats.dayOrder.map((day) => {
            const meta = stats.dayEmotionMap[day];
            const height = meta ? '18px' : '8px';
            return (
              <span
                key={day}
                title={meta ? `${day}: ${meta.label}` : `${day}: No reflection`}
                style={{
                  height,
                  backgroundColor: meta ? meta.dotColor : '#E9E5F2',
                  opacity: meta ? 1 : 0.6,
                }}
                className="flex-1 rounded-[2px] transition-colors"
              />
            );
          })}
        </div>
      </div>

      <div className="space-y-1.5">
        <p className="text-xs font-medium uppercase tracking-wide text-[#6B6770]">Most written words</p>
        {stats.wordCloud.length === 0 ? (
          <p className="text-xs text-[#6B6770]">No countable words in your entries yet.</p>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            {stats.wordCloud.map((word) => {
              const size = Math.round(10 + (word.count / maxWordCount) * 16);
              return (
                <span
                  key={word.word}
                  style={{ fontSize: `${size}px` }}
                  className="text-[#29272B]/90 leading-none whitespace-nowrap"
                >
                  {word.word}
                </span>
              );
            })}
          </div>
        )}
      </div>

      <p className="text-xs text-[#6B6770]">
        {stats.totalWords} words written in {stats.totalEntries} entr{stats.totalEntries === 1 ? 'y' : 'ies'}
      </p>
    </section>
  );
}
