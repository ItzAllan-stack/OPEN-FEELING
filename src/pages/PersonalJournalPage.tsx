import React, { useEffect, useMemo, useState } from 'react';
import { Lock, Pencil, Plus, Trash2 } from 'lucide-react';
import { AppShell } from '../components/AppShell.tsx';
import { EmotionAnalyticsCard } from '../components/EmotionAnalyticsCard.tsx';
import { EmotionSelector } from '../components/EmotionSelector.tsx';
import { Modal } from '../components/Modal.tsx';
import { SearchBar } from '../components/SearchBar.tsx';
import { EMOTION_MAP } from '../constants/emotions.ts';
import { randomJournalPrompt, todayJournalPrompt } from '../constants/journalPrompts.ts';
import { useApp } from '../context/AppContext.tsx';
import {
  createJournalEntry,
  deleteJournalEntry,
  subscribePrivateJournal,
  updateJournalEntry,
} from '../services/firestoreService.ts';
import { EmotionId, PrivateJournalEntry } from '../types/index.ts';
import { getTodayIsoDate } from '../utils/date.ts';
import { computeJournalStreak } from '../utils/journal.ts';

export function PersonalJournalPage() {
  const { publicUser, navigate, showToast } = useApp();
  const [entries, setEntries] = useState<PrivateJournalEntry[]>([]);
  const [search, setSearch] = useState('');
  const [promptOverride, setPromptOverride] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [emotion, setEmotion] = useState<EmotionId>('');
  const [entryDate, setEntryDate] = useState(getTodayIsoDate());
  const [editingEntry, setEditingEntry] = useState<PrivateJournalEntry | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!publicUser) return;
    const unsub = subscribePrivateJournal(publicUser.uid, setEntries);
    return () => unsub();
  }, [publicUser]);

  const filtered = useMemo(() => {
    if (!search.trim()) return entries;
    const q = search.trim().toLowerCase();
    return entries.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        e.content.toLowerCase().includes(q) ||
        e.emotion.toLowerCase().includes(q) ||
        e.entryDate.includes(q)
    );
  }, [entries, search]);

  const streak = useMemo(() => computeJournalStreak(entries), [entries]);
  const journalPrompt = promptOverride ?? todayJournalPrompt();

  useEffect(() => {
    if (!publicUser || entries.length === 0) return;
    const sortedDates = entries
      .map((e) => e.entryDate || e.createdAt.toISOString().slice(0, 10))
      .sort()
      .reverse();
    const lastDate = sortedDates[0];
    if (!lastDate) return;
    const today = getTodayIsoDate();
    const daysSinceLast = Math.floor(
      (Date.parse(`${today}T00:00:00Z`) - Date.parse(`${lastDate}T00:00:00Z`)) / 86_400_000
    );
    if (daysSinceLast >= 7) {
      showToast('We noticed you took a break — no pressure. Ready to write?', 'info');
    }
  }, [entries, publicUser, showToast]);

  if (!publicUser) {
    return (
      <AppShell>
        <div className="bg-[#F8F6F3] border border-[#EAE4DD] rounded-2xl p-8 text-center space-y-3">
          <Lock className="w-6 h-6 text-[#9F4E65] mx-auto" />
          <h1 className="text-2xl font-display text-[#29272B]">My Personal Space</h1>
          <p className="text-sm text-[#77727A] max-w-md mx-auto">
            A private personal journal protected by strict owner-only access rules. Sign in to write thoughts just for yourself.
          </p>
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="px-5 py-2.5 rounded-xl bg-[#29272B] text-[#FCFBFA] text-xs font-medium cursor-pointer"
          >
            Sign In to Open Journal
          </button>
        </div>
      </AppShell>
    );
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setSaving(true);
    try {
      if (editingEntry) {
        await updateJournalEntry(editingEntry.id, {
          title,
          content,
          emotion,
          entryDate,
        });
        setEditingEntry(null);
        showToast('Journal reflection updated.', 'success');
      } else {
        await createJournalEntry({
          uid: publicUser.uid,
          title,
          content,
          emotion,
          entryDate,
        });
        showToast('Saved privately in My Personal Space.', 'success');
      }
      setTitle('');
      setContent('');
      setEmotion('');
      setEntryDate(getTodayIsoDate());
    } catch {
      showToast('Could not save journal entry.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (entry: PrivateJournalEntry) => {
    setEditingEntry(entry);
    setTitle(entry.title);
    setContent(entry.content);
    setEmotion(entry.emotion);
    setEntryDate(entry.entryDate);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteJournalEntry(id);
      if (editingEntry?.id === id) {
        setEditingEntry(null);
        setTitle('');
        setContent('');
      }
      showToast('Journal entry deleted.', 'info');
    } catch {
      showToast('Could not delete entry.', 'error');
    }
  };

  return (
    <AppShell>
      <div className="max-w-3xl space-y-8">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-medium text-[#9F4E65]">
            <Lock className="w-3.5 h-3.5" />
            <span>Strictly Private · Visible Only to You</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-medium text-[#29272B]">
            My Personal Space
          </h1>
          <p className="text-sm text-[#77727A]">
            Write thoughts you are not ready—or never want—to publish. Every entry is locked to your account.
          </p>
        </div>

        {/* Streak & Gentle Prompt */}
        <section className="bg-[#FCFBFA] border border-[#EAE4DD] rounded-2xl p-5 sm:p-6 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-medium text-[#29272B]">Streak</h2>
            <p className="text-xs text-[#77727A] tabular-nums">
              {streak === 0
                ? 'Fresh start — a quiet beginning can be today.'
                : `${streak} ${streak === 1 ? 'day' : 'days'} in a row`}
            </p>
          </div>
          <p className="text-sm text-[#29272B]/90 leading-relaxed">
            Today&apos;s gentle prompt:{' '}
            <span className="font-medium text-[#29272B]">{journalPrompt}</span>
          </p>
          <div>
            <button
              type="button"
              onClick={() => setPromptOverride(randomJournalPrompt())}
              className="px-3.5 py-1.5 rounded-xl bg-[#F8F6F3] border border-[#EAE4DD] text-xs text-[#77727A] cursor-pointer"
            >
              Another prompt
            </button>
          </div>
        </section>

        <EmotionAnalyticsCard entries={entries} />

        {/* Journal Composer */}
        <form
          onSubmit={handleSave}
          className="bg-[#FCFBFA] border border-[#EAE4DD] rounded-2xl p-6 space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-medium text-[#29272B]">
              {editingEntry ? 'Editing Reflection' : 'New Private Reflection'}
            </h2>
            <input
              type="date"
              value={entryDate}
              onChange={(e) => setEntryDate(e.target.value)}
              aria-label="Reflection date"
              className="px-3 py-1.5 rounded-xl bg-[#F8F6F3] border border-[#EAE4DD] text-xs text-[#29272B] tabular-nums"
            />
          </div>

          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={140}
            placeholder="Optional title for this entry..."
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8F6F3] border border-[#EAE4DD] text-sm text-[#29272B] focus:outline-none focus:border-[#E9A9B8]"
          />

          <textarea
            required
            rows={6}
            maxLength={8000}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="This page is only for you. Write honestly..."
            className="w-full p-4 rounded-xl bg-[#F8F6F3] border border-[#EAE4DD] text-[15px] leading-relaxed text-[#29272B] focus:outline-none focus:border-[#E9A9B8]"
          />

          <div className="space-y-2">
            <p className="text-xs text-[#77727A]">Optional emotion tag</p>
            <EmotionSelector value={emotion} onChange={setEmotion} />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            {editingEntry && (
              <button
                type="button"
                onClick={() => {
                  setEditingEntry(null);
                  setTitle('');
                  setContent('');
                  setEmotion('');
                }}
                className="px-4 py-2 rounded-xl text-xs font-medium text-[#77727A] cursor-pointer"
              >
                Cancel Edit
              </button>
            )}
            <button
              type="submit"
              disabled={saving || !content.trim()}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#29272B] text-[#FCFBFA] text-sm font-medium disabled:opacity-50 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{saving ? 'Saving...' : editingEntry ? 'Update Entry' : 'Save Privately'}</span>
            </button>
          </div>
        </form>

        {/* Previous Reflections */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-xl font-display font-medium text-[#29272B]">
              Previous Reflections ({entries.length})
            </h2>
            <div className="sm:w-64">
              <SearchBar
                value={search}
                onChange={setSearch}
                placeholder="Search your journal..."
              />
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="bg-[#F8F6F3] border border-[#EAE4DD] rounded-2xl p-8 text-center">
              <p className="text-sm text-[#77727A]">
                {entries.length === 0
                  ? 'Your personal space is ready whenever you want to write your first private reflection.'
                  : 'No journal entries match your search.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((entry) => {
                const em = entry.emotion ? EMOTION_MAP[entry.emotion] : null;
                return (
                  <article
                    key={entry.id}
                    className="bg-[#FCFBFA] border border-[#EAE4DD] rounded-2xl p-5 space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-[#77727A]">
                          <span className="tabular-nums font-medium">{entry.entryDate}</span>
                          {em && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span style={{ color: em.tintText }}>{em.label}</span>
                            </>
                          )}
                        </div>
                        {entry.title && (
                          <h3 className="mt-1 text-base font-display font-medium text-[#29272B]">
                            {entry.title}
                          </h3>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => startEdit(entry)}
                          aria-label="Edit journal entry"
                          className="p-1.5 rounded-lg text-[#77727A] hover:text-[#29272B] hover:bg-[#F8F6F3] cursor-pointer"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(entry.id)}
                          aria-label="Delete journal entry"
                          className="p-1.5 rounded-lg text-[#77727A] hover:text-[#A84848] hover:bg-[#FDF5F5] cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <p className="text-sm text-[#29272B]/90 leading-relaxed whitespace-pre-wrap">
                      {entry.content}
                    </p>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Unused Modal import check */}
      {false && <Modal open={false} onClose={() => {}} title="" children={null} />}
    </AppShell>
  );
}
