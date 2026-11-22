import React, { useState } from 'react';
import { Globe, EyeOff, Lock, Image as ImageIcon } from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { createPost } from '../services/firestoreService.ts';
import { EmotionId, PostVisibility } from '../types/index.ts';
import { isSafeImageUrl } from '../utils/date.ts';
import { EmotionSelector } from './EmotionSelector.tsx';

interface PostComposerProps {
  defaultCommunityId?: string;
  onPublished?: (postId: string) => void;
  compact?: boolean;
}

export function PostComposer({
  defaultCommunityId = '',
  onPublished,
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
    const parsedTags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

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
      setTitle('');
      setContent('');
      setEmotion('');
      setTagsInput('');
      setImageUrl('');
      showToast(
        visibility === 'private'
          ? 'Saved privately so only you can see it.'
          : visibility === 'anonymous'
            ? 'Shared anonymously with the community.'
            : 'Shared with OPEN FELLING.',
        'success'
      );
      if (onPublished) onPublished(postId);
    } catch {
      showToast('Could not publish your post. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
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

      <textarea
        value={content}
        onFocus={() => setShowExtras(true)}
        onChange={(e) => setContent(e.target.value)}
        rows={compact && !showExtras ? 3 : 5}
        maxLength={4000}
        placeholder="Express freely without judgement..."
        aria-label="Share what you feel"
        className="w-full p-4 rounded-xl bg-[#F8F6F3] border border-[#EAE4DD] text-[15px] text-[#29272B] leading-relaxed placeholder:text-[#77727A] focus:outline-none focus:border-[#E9A9B8] focus:bg-[#FCFBFA] transition-colors"
      />

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

      <div className="flex items-center justify-between gap-4 pt-2">
        <span className="text-xs text-[#77727A] tabular-nums">
          {content.length}/4000
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
