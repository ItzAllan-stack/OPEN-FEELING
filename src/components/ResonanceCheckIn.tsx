import React, { useEffect, useState } from 'react';
import { Modal } from './Modal.tsx';
import { EmotionSelector } from './EmotionSelector.tsx';
import { useApp } from '../context/AppContext.tsx';
import {
  createResonance,
  sendResonanceCare,
  subscribeActiveResonances,
  subscribeActiveResonanceCare,
} from '../services/firestoreService.ts';
import type { ResonanceCareNote, ResonanceCheckIn, ResonanceEmotion } from '../types/index.ts';
import { EmotionId } from '../types/index.ts';
import { RESONANCE_CARE_MAX_LENGTH } from '../constants/resonance.ts';

interface ResonanceCheckInProps {
  open: boolean;
  onClose: () => void;
}

export function ResonanceCheckIn({ open, onClose }: ResonanceCheckInProps) {
  const { showToast } = useApp();
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionId>('');
  const [careMessage, setCareMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [allResonances, setAllResonances] = useState<ResonanceCheckIn[]>([]);
  const [careNotes, setCareNotes] = useState<ResonanceCareNote[]>([]);
  const [careLoading, setCareLoading] = useState(true);
  const [resonancesLoading, setResonancesLoading] = useState(true);

  // Reset to a clean slate whenever the modal closes.
  useEffect(() => {
    if (!open) {
      setSelectedEmotion('');
      setCareMessage('');
      setAllResonances([]);
      setCareNotes([]);
      setCareLoading(true);
      setResonancesLoading(true);
      setSubmitting(false);
    }
  }, [open]);

  // Live feed of active check-ins (still inside their 24h window).
  useEffect(() => {
    if (!open) return;
    const unsub = subscribeActiveResonances((resonances) => {
      setAllResonances(resonances);
      setResonancesLoading(false);
    });
    const unsubCare = subscribeActiveResonanceCare((notes) => {
      setCareNotes(notes.slice(0, 6));
      setCareLoading(false);
    });
    return () => {
      unsub();
      unsubCare();
    };
  }, [open]);

  const countForSelected = selectedEmotion
    ? allResonances.filter((r) => r.emotion === selectedEmotion).length
    : allResonances.length;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedEmotion) return;
    setSubmitting(true);
    try {
      await createResonance({ emotion: selectedEmotion });
      const message = careMessage.trim();
      if (message) {
        await sendResonanceCare({ emotion: selectedEmotion, message });
      }
      showToast('Checked in. You are not alone.', 'success');
      onClose();
    } catch {
      showToast("Couldn't check in just yet. Try again.", 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="How are you feeling right now?"
      subtitle="Anonymous and gone in 24 hours. No profile, no record — just this moment."
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <p className="text-sm font-medium text-[#29272B] mb-2">
            Pick what feels closest:
          </p>
          <EmotionSelector
            value={selectedEmotion}
            onChange={setSelectedEmotion}
            allowClear={false}
          />
        </div>

        {selectedEmotion && (
          <div className="bg-[#F8F6F3] border border-[#EAE4DD] rounded-xl p-4">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-xs font-medium text-[#77727A]">
                Feeling this right now
              </span>
              <span className="text-sm font-medium text-[#29272B]">
                {resonancesLoading ? '—' : countForSelected}
              </span>
            </div>
            <p className="text-sm text-[#77727A]">
              {resonancesLoading
                ? 'Checking who else feels this...'
                : countForSelected === 0
                  ? "You're naming this feeling first — someone else will see it soon."
                  : countForSelected === 1
                    ? 'One other person feels this right now.'
                    : `${countForSelected} other people feel this right now.`}
            </p>
            <p className="text-[11px] text-[#77727A] mt-3">
              Everything here is anonymous and expires after 24 hours.
            </p>
          </div>
        )}

        <div>
          <p className="text-sm font-medium text-[#29272B] mb-2">
            Send a kind line (optional)
          </p>
          <textarea
            value={careMessage}
            onChange={(e) => setCareMessage(e.target.value)}
            maxLength={RESONANCE_CARE_MAX_LENGTH}
            rows={3}
            placeholder="A short line to go with this feeling..."
            aria-label="Care note"
            className="w-full p-3 rounded-xl bg-[#F8F6F3] border border-[#EAE4DD] text-sm text-[#29272B] placeholder:text-[#77727A] focus:outline-none focus:border-[#E9A9B8]"
          />
          <div className="flex justify-end mt-1">
            <span className="text-[11px] text-[#77727A]">
              {careMessage.length}/{RESONANCE_CARE_MAX_LENGTH}
            </span>
          </div>
        </div>

        {!careLoading && (
          <div className="pt-3 border-t border-[#EAE4DD]">
            <p className="text-xs font-medium text-[#77727A] mb-2 uppercase tracking-wider">
              kind words right now
            </p>
            <div className="space-y-2">
              {careNotes.length > 0 ? (
                careNotes.map((note) => (
                  <div key={note.id} className="text-sm text-[#77727A] italic">
                    '{note.message}'
                  </div>
                ))
              ) : (
                <div className="text-sm text-[#77727A] italic py-2">
                  No kind words yet — be the first to share one below.
                </div>
              )}
            </div>
          </div>
        )}

        <div className="pt-2 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm text-[#77727A] hover:text-[#29272B] transition-colors"
          >
            Not now
          </button>
          <button
            type="submit"
            disabled={!selectedEmotion || submitting}
            className={`px-5 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              submitting
                ? 'bg-[#F4DCE3] text-[#9F4E65]'
                : 'bg-[#29272B] text-[#FCFBFA] hover:bg-[#1a191c]'
            }`}
          >
            {submitting ? 'Sharing...' : 'Check in'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
