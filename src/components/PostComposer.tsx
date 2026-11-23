import React, { useRef, useState } from 'react';
import {
  Globe,
  EyeOff,
  Lock,
  Image as ImageIcon,
  Bold,
  Italic,
  Sparkles,
  Hash,
  Eye,
  Clock,
} from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { createPost, savePostDraft } from '../services/firestoreService.ts';
import { EmotionId, PostVisibility } from '../types/index.ts';
import { isSafeImageUrl } from '../utils/date.ts';
import { renderInline } from '../utils/inlineMarkdown.tsx';
import { EmotionSelector } from './EmotionSelector.tsx';

const EMOJI_PALETTE: string[] = [
  '🌟',
  '❤️',
  '🫶',
  '🌸',
  '📖',
  '🌈',
  '☕',
  '🌙',
  '💭',
  '✨',
  '💬',
  '🤍',
];

function ToolbarButton({
  onClick,
  'aria-label': label,
  pressed,
  children,
}: {
  onClick: () => void;
  'aria-label': string;
  pressed?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={pressed}
      className={`rounded-xl border p-2 transition-colors cursor-pointer ${
        pressed
          ? 'border-[#29272B] bg-[#F4DCE3]/45 text-[#9F4E65]'
          : 'border-[#EAE4DD] bg-[#FCFBFA] text-[#29272B]/70 hover:border-[#D5CCC3] hover:bg-[#F8F6F3] hover:text-[#29272B]'
      }`}
    >
      {children}
    </button>
  );
}

interface PostComposerProps {
  defaultCommunityId?: string;
  onPublished?: (postId: string) => void;
  onDraftSaved?: () => void;
  compact?: boolean;
}

export function PostComposer({
  defaultCommunityId = '',
  onPublished,
  onDraftSaved,
  compact = false,
}: PostComposerProps) {
  const { publicUser, privateUser, communities, navigate, showToast } = useApp();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [emotion, setEmotion] = useState<EmotionId>('');
  const [tagsInput, setTagsInput] = useState('');
  const [communityId, setCommunityId] = useState(defaultCommunityId);
  const [visibility, setVisibility] = useState<PostVisibility>(
    privateUser?.defaultVisibility || 'public'
  );
  const [imageUrl, setImageUrl] = useState('');
  const [showExtras, setShowExtras] = useState(!compact);
  const [submitting, setSubmitting] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const scheduleId = React.useId();
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduledFor, setScheduledFor] = useState('');

  const resetComposer = () => {
    setTitle('');
    setContent('');
    setEmotion('');
    setTagsInput('');
    setImageUrl('');
    setScheduledFor('');
    setScheduleOpen(false);
  };

  const draftPayload = (tags: string[]) => {
    const selectedCommunity = communities.find((c) => c.id === communityId);
    return {
      uid: publicUser!.uid,
      title,
      content,
      emotion,
      tags,
      visibility,
      communityId: selectedCommunity?.id || '',
      communityName: selectedCommunity?.name || '',
      imageUrl: imageUrl.trim(),
      scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
    };
  };

  const saveDraftWithTags = async (tags: string[]) => {
    setSubmitting(true);
    try {
      await savePostDraft(draftPayload(tags));
      const when = scheduledFor ? new Date(scheduledFor) : null;
      showToast(
        when && when.getTime() > Date.now()
          ? 'Draft saved — it will publish when due, next time you open this space.'
          : 'Draft saved. Publish it any time.',
        'success'
      );
      resetComposer();
      onDraftSaved?.();
    } catch {
      showToast('Could not save your draft. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveDraft = () => {
    if (!publicUser) {
      showToast('Please sign in to save a draft.', 'info');
      navigate('/login');
      return;
    }
    if (!content.trim()) {
      showToast('Write a few words before saving a draft.', 'info');
      return;
    }
    const when = scheduledFor ? new Date(scheduledFor) : null;
    if (when && Number.isNaN(when.getTime())) {
      showToast('Please choose a valid date and time.', 'error');
      return;
    }
    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    void saveDraftWithTags(tags);
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicUser) {
      showToast('Please sign in to share your feelings.', 'info');
      navigate('/login');
      return;
    }
    if (!content.trim()) {
      showToast('Write a few words about what you are feeling first.', 'info');
      return;
    }
    if (imageUrl.trim() && !isSafeImageUrl(imageUrl.trim())) {
      showToast('Please use a valid https:// image URL or leave it blank.', 'error');
      return;
    }

    const selectedCommunity = communities.find((c) => c.id === communityId);
    const baseTags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    const inlineTags = Array.from(
      new Set((content.match(/#[A-Za-z0-9_]{2,32}/g) || []).map((tag) => tag.slice(1)))
    ).filter((tag) => tag.length >= 3);
    const parsedTags = [...new Set([...baseTags, ...inlineTags])].slice(0, 5);

    const when = scheduledFor ? new Date(scheduledFor) : null;
    if (when && Number.isNaN(when.getTime())) {
      showToast('Please choose a valid date and time.', 'error');
      return;
    }
    if (when && when.getTime() > Date.now()) {
      await saveDraftWithTags(parsedTags);
      return;
    }

    setSubmitting(true);
    try {
      const postId = await createPost({
        user: publicUser,
        title,
        content,
        emotion,
        tags: parsedTags,
        visibility,
        communityId: selectedCommunity?.id || '',
        communityName: selectedCommunity?.name || '',
        imageUrl: imageUrl.trim(),
      });
      resetComposer();
      showToast(
        visibility === 'private'
          ? 'Saved privately so only you can see it.'
          : visibility === 'anonymous'
            ? 'Shared anonymously with the community.'
            : 'Shared with OPEN FEELING.',
        'success'
      );
      if (onPublished) onPublished(postId);
    } catch {
      showToast('Could not publish your post. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const insertAtCursor = (text: string) => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const next = content.slice(0, start) + text + content.slice(end);
    setContent(next);
    const cursor = start + text.length;
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(cursor, cursor);
    }, 0);
  };

  const applyInline = (open: string, close: string) => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = content.slice(start, end);
    const insertion = selected ? open + selected + close : open;
    const tailStart = selected ? end : start;
    const next = content.slice(0, start) + insertion + content.slice(tailStart);
    setContent(next);
    const cursor = start + insertion.length;
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(cursor, cursor);
    }, 0);
  };

  return (
    <form
      ref={formRef}
      onSubmit={handlePublish}
      className="bg-[#FCFBFA] border border-[#EAE4DD] rounded-2xl p-6 space-y-4"
    >
      <div>
        <h2 className="text-xl font-display font-medium text-[#29272B]">
          What&apos;s on your mind today?
        </h2>
        <p className="mt-1 text-sm text-[#77727A]">
          You don&apos;t have to keep everything inside. Write whatever you feel.
        </p>
      </div>

      {showExtras && (
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={140}
          placeholder="Optional title (e.g., Quiet thoughts tonight)"
          aria-label="Optional post title"
          className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8F6F3] border border-[#EAE4DD] text-sm text-[#29272B] placeholder:text-[#77727A] focus:outline-none focus:border-[#E9A9B8] focus:bg-[#FCFBFA]"
        />
      )}

      {/* Formatting toolbar */}
      <div
        className="flex flex-wrap items-center gap-1.5 rounded-xl border border-[#EAE4DD] bg-[#FCFBFA] px-2 py-1.5"
        role="toolbar"
        aria-label="Post formatting"
      >
        <ToolbarButton onClick={() => applyInline('**', '**')} aria-label="Bold">
          <Bold className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => applyInline('*', '*')} aria-label="Italic">
          <Italic className="w-4 h-4" />
        </ToolbarButton>
        <div className="relative">
          <ToolbarButton
            onClick={() => setPickerOpen((v) => !v)}
            aria-label="Insert emoji"
            aria-pressed={pickerOpen}
          >
            <Sparkles className="w-4 h-4" />
          </ToolbarButton>
          {pickerOpen && (
            <div
              className="absolute top-full left-0 z-20 mt-1 grid grid-cols-6 gap-1 rounded-xl border border-[#EAE4DD] bg-[#FCFBFA] p-2 shadow-sm"
              role="listbox"
              aria-label="Insert emoji"
            >
              {EMOJI_PALETTE.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    insertAtCursor(emoji);
                    setPickerOpen(false);
                  }}
                  aria-label={emoji}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-lg leading-none cursor-pointer"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>
        <ToolbarButton onClick={() => insertAtCursor('#')} aria-label="Add hashtag">
          <Hash className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => setShowPreview((v) => !v)}
          aria-label="Toggle preview"
          aria-pressed={showPreview}
        >
          <Eye className="w-4 h-4" />
        </ToolbarButton>
      </div>

      <textarea
        ref={textareaRef}
        value={content}
        onFocus={() => setShowExtras(true)}
        onChange={(e) => setContent(e.target.value)}
        rows={compact && !showExtras ? 3 : 5}
        maxLength={4000}
        placeholder="Express freely without judgement..."
        aria-label="Share what you feel"
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            formRef.current?.requestSubmit();
          }
        }}
        className="w-full p-4 rounded-xl bg-[#F8F6F3] border border-[#EAE4DD] text-[15px] text-[#29272B] leading-relaxed placeholder:text-[#77727A] focus:outline-none focus:border-[#E9A9B8] focus:bg-[#FCFBFA] transition-colors"
      />

      {showPreview && (
        <div
          className="rounded-xl border border-[#EAE4DD] bg-[#FCFBFA] p-4 text-[15px] text-[#29272B]/90 leading-[1.65] whitespace-pre-wrap"
          role="region"
          aria-label="Post preview"
        >
          {content ? (
            renderInline(content)
          ) : (
            <span className="text-[#77727A]">Nothing to preview yet…</span>
          )}
        </div>
      )}

      {showExtras && (
        <div className="space-y-4 pt-1">
          <div>
            <p className="text-xs font-medium text-[#77727A] mb-2">
              How does this feel? (Optional)
            </p>
            <EmotionSelector value={emotion} onChange={setEmotion} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#77727A] mb-1.5">
                Community Space (Optional)
              </label>
              <select
                value={communityId}
                onChange={(e) => setCommunityId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#F8F6F3] border border-[#EAE4DD] text-sm text-[#29272B] focus:outline-none focus:border-[#E9A9B8]"
              >
                <option value="">General Community Feed</option>
                {communities.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#77727A] mb-1.5">
                Tags (Optional, comma-separated)
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="healing, gratitude, late-night"
                className="w-full px-3 py-2.5 rounded-xl bg-[#F8F6F3] border border-[#EAE4DD] text-sm text-[#29272B] placeholder:text-[#77727A] focus:outline-none focus:border-[#E9A9B8]"
              />
            </div>
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-[#77727A] mb-1.5">
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Optional Image URL (https://)</span>
            </label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2 rounded-xl bg-[#F8F6F3] border border-[#EAE4DD] text-sm text-[#29272B] placeholder:text-[#77727A] focus:outline-none focus:border-[#E9A9B8]"
            />
          </div>

          {/* 3-Tier Privacy & Identity Selector */}
          <div className="pt-2 border-t border-[#EAE4DD] space-y-2.5">
            <p className="text-xs font-medium text-[#29272B]">
              Choose who can see this and how you appear:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                {
                  id: 'public' as PostVisibility,
                  label: 'Public',
                  desc: 'Visible to everyone with your profile.',
                  icon: Globe,
                },
                {
                  id: 'anonymous' as PostVisibility,
                  label: 'Anonymous',
                  desc: 'Hides your identity from the community.',
                  icon: EyeOff,
                },
                {
                  id: 'private' as PostVisibility,
                  label: 'Private',
                  desc: 'Visible only to you.',
                  icon: Lock,
                },
              ].map((opt) => {
                const Icon = opt.icon;
                const active = visibility === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setVisibility(opt.id)}
                    aria-pressed={active}
                    className={`p-3 rounded-xl border text-left transition-colors cursor-pointer ${
                      active
                        ? 'bg-[#F4DCE3]/45 border-[#29272B]'
                        : 'bg-[#F8F6F3] border-[#EAE4DD] hover:border-[#D5CCC3]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-[#29272B]">
                      <Icon className="w-3.5 h-3.5" />
                      <span>{opt.label}</span>
                    </div>
                    <p className="mt-1 text-[11px] text-[#77727A] leading-snug">
                      {opt.desc}
                    </p>
                  </button>
                );
              })}
            </div>
            {visibility === 'anonymous' && (
              <p className="text-[11px] text-[#77727A] leading-relaxed">
                Your profile name and username are removed from the public post document on the server. Note: moderators may review reported content for safety, so platform anonymity does not guarantee absolute anonymity.
              </p>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 pt-1">
        <button
          type="button"
          onClick={() => setScheduleOpen((v) => !v)}
          aria-pressed={scheduleOpen}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#F8F6F3] border border-[#EAE4DD] text-xs text-[#77727A] hover:text-[#29272B] cursor-pointer"
        >
          <Clock className="w-3.5 h-3.5" />
          {scheduleOpen ? 'Hide schedule' : 'Schedule'}
        </button>
        <button
          type="button"
          onClick={handleSaveDraft}
          disabled={submitting || !content.trim()}
          className="px-3 py-2 rounded-xl bg-[#F8F6F3] border border-[#EAE4DD] text-xs text-[#77727A] hover:text-[#29272B] disabled:opacity-50 cursor-pointer"
        >
          Save as draft
        </button>
      </div>

      {scheduleOpen && (
        <div className="space-y-1.5">
          <label htmlFor={scheduleId} className="block text-xs font-medium text-[#77727A]">
            Publish automatically when you next open this page (optional)
          </label>
          <input
            id={scheduleId}
            type="datetime-local"
            value={scheduledFor}
            onChange={(e) => setScheduledFor(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 rounded-xl bg-[#F8F6F3] border border-[#EAE4DD] text-sm text-[#29272B] focus:outline-none focus:border-[#E9A9B8]"
          />
        </div>
      )}

      <div className="flex items-center justify-between gap-4 pt-2">
        <span className="text-xs text-[#77727A] tabular-nums">
          {content.length}/4000 · Enter to publish, Shift+Enter for a new line
        </span>
        <button
          type="submit"
          disabled={submitting || !content.trim()}
          className="px-5 py-2.5 rounded-xl bg-[#29272B] text-[#FCFBFA] text-sm font-medium hover:bg-[#3E3B41] disabled:opacity-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          {submitting
            ? 'Publishing...'
            : visibility === 'private'
              ? 'Save Privately'
              : visibility === 'anonymous'
                ? 'Share Anonymously'
                : 'Publish Feelings'}
        </button>
      </div>
    </form>
  );
}
