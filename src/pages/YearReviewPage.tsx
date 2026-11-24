import React, { useEffect, useState } from 'react';
import { ArrowLeft, Hash, Heart, Lock, Sparkles } from 'lucide-react';
import { AppShell } from '../components/AppShell.tsx';
import { EMOTION_MAP } from '../constants/emotions.ts';
import { useApp } from '../context/AppContext.tsx';
import { subscribeYearReview } from '../services/firestoreService.ts';
import type { YearInReview } from '../types/index.ts';

interface YearReviewPageProps {
  year: number;
}

function formatWords(count: number): string {
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
  return String(count);
}

export function YearReviewPage({ year }: YearReviewPageProps) {
  const { publicUser, navigate } = useApp();
  const [summary, setSummary] = useState<YearInReview | null>(null);

  useEffect(() => {
    if (!publicUser) return;
    const unsub = subscribeYearReview(publicUser.uid, year, setSummary);
    return () => unsub();
  }, [publicUser, year]);

  if (!publicUser) {
    return (
      <AppShell>
        <div className="bg-[#F8F6F3] border border-[#EAE4DD] rounded-2xl p-8 text-center space-y-3">
          <Lock className="w-6 h-6 text-[#9F4E65] mx-auto" />
          <h1 className="text-2xl font-display text-[#29272B]">Year in Feelings</h1>
          <p className="text-sm text-[#77727A] max-w-md mx-auto">
            Your year in feelings is private to your account. Sign in to read your personal recap.
          </p>
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="px-5 py-2.5 rounded-xl bg-[#29272B] text-[#FCFBFA] text-xs font-medium cursor-pointer"
          >
            Sign In to Open Year in Feelings
          </button>
        </div>
      </AppShell>
    );
  }

  const topEmotions = summary?.topEmotions ?? [];
  const topTags = summary?.topTags ?? [];
  const dayActivity = summary?.dayOfWeekActivity ?? [];
  const maxDayCount = Math.max(1, ...dayActivity.map((d) => d.count));

  return (
    <AppShell>
      <div className="max-w-3xl space-y-8">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-medium text-[#9F4E65]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Your Year in Feelings · {year}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-medium text-[#29272B]">Year in Review</h1>
          <p className="text-sm text-[#77727A]">
            A gentle recap of the feelings you shared and the quiet reflections you kept.
          </p>
        </div>

        {summary && summary.postCount + summary.journalCount > 0 ? (
          <>
            <section className="bg-[#FCFBFA] border border-[#EAE4DD] rounded-2xl p-6 text-center space-y-3">
              <Heart className="w-5 h-5 text-[#E9A9B8] mx-auto" />
              <p className="font-display text-xl sm:text-2xl text-[#29272B]">“{summary.warmthPhrase}”</p>
            </section>

            <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-[#FCFBFA] border border-[#EAE4DD] rounded-2xl p-5 space-y-1">
                <p className="text-xs uppercase tracking-wide text-[#77727A]">Feelings shared</p>
                <p className="text-3xl font-display text-[#29272B]">{summary.postCount}</p>
                <p className="text-xs text-[#77727A]">published to the feeling feed</p>
              </div>
              <div className="bg-[#FCFBFA] border border-[#EAE4DD] rounded-2xl p-5 space-y-1">
                <p className="text-xs uppercase tracking-wide text-[#77727A]">Private reflections</p>
                <p className="text-3xl font-display text-[#29272B]">{summary.journalCount}</p>
                <p className="text-xs text-[#77727A]">kept in your personal space</p>
              </div>
              <div className="bg-[#FCFBFA] border border-[#EAE4DD] rounded-2xl p-5 space-y-1">
                <p className="text-xs uppercase tracking-wide text-[#77727A]">Words written</p>
                <p className="text-3xl font-display text-[#29272B]">{formatWords(summary.totalWords)}</p>
                <p className="text-xs text-[#77727A]">about feelings and feelings themselves</p>
              </div>
            </section>

            <section className="bg-[#FCFBFA] border border-[#EAE4DD] rounded-2xl p-5 sm:p-6 space-y-3">
              <h2 className="text-lg font-medium text-[#29272B]">Top emotions of {year}</h2>
              {topEmotions.length === 0 ? (
                <p className="text-sm text-[#77727A]">No emotion tags were recorded this year — quiet years still count.</p>
              ) : (
                <div className="flex flex-wrap items-center gap-1.5">
                  {topEmotions.map(({ emotion, count }) => {
                    const meta = EMOTION_MAP[emotion];
                    if (!meta) return null;
                    return (
                      <span
                        key={emotion}
                        className="inline-flex items-center gap-1.5 rounded-full border border-[#EAE4DD] bg-[#FCFBFA] px-3 py-1 text-xs"
                        style={{ color: meta.tintText }}
                      >
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: meta.dotColor }} />
                        {meta.label} · {count}
                      </span>
                    );
                  })}
                </div>
              )}
            </section>

            {topTags.length > 0 && (
              <section className="bg-[#FCFBFA] border border-[#EAE4DD] rounded-2xl p-5 sm:p-6 space-y-3">
                <h2 className="text-lg font-medium text-[#29272B]">Recurring themes</h2>
                <div className="flex flex-wrap items-center gap-2">
                  {topTags.map(({ tag, count }) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1.5 rounded-full bg-[#F8F6F3] border border-[#EAE4DD] px-3 py-1 text-xs text-[#77727A]"
                    >
                      <Hash className="w-3 h-3" />
                      {tag} · {count}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {dayActivity.length > 0 && (
              <section className="bg-[#FCFBFA] border border-[#EAE4DD] rounded-2xl p-5 sm:p-6 space-y-3">
                <h2 className="text-lg font-medium text-[#29272B]">When you felt things</h2>
                <div className="space-y-2.5">
                  {dayActivity.map(({ day, count }) => (
                    <div key={day} className="flex items-center gap-3">
                      <span className="w-24 text-sm text-[#29272B]/90">{day}</span>
                      <div className="flex-1 h-2 rounded-full bg-[#F8F6F3] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#E9A9B8]"
                          style={{ width: `${Math.max(4, (count / maxDayCount) * 100)}%` }}
                        />
                      </div>
                      <span className="w-8 text-right text-xs text-[#77727A] tabular-nums">{count}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        ) : !summary ? (
          <div className="bg-[#F8F6F3] border border-[#EAE4DD] rounded-2xl p-8 text-center">
            <p className="text-sm text-[#77727A]">Preparing your year in feelings...</p>
          </div>
        ) : (
          <div className="bg-[#F8F6F3] border border-[#EAE4DD] rounded-2xl p-8 text-center">
            <p className="text-sm text-[#77727A]">
              Nothing landed in {year} yet — your year in feelings is quiet, and quiet years still deserve a recap.
            </p>
          </div>
        )}

        <button
          type="button"
          onClick={() => navigate('/journal')}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#F8F6F3] border border-[#EAE4DD] text-xs text-[#6B6770] hover:text-[#29272B] cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to my personal space
        </button>
      </div>
    </AppShell>
  );
}
