import React, { useState } from 'react';
import {
  Bookmark,
  MessageCircle,
  Share2,
  Flag,
  Trash2,
  Lock,
  EyeOff,
} from 'lucide-react';
import { EMOTION_MAP } from '../constants/emotions.ts';
import { useApp } from '../context/AppContext.tsx';
import {
  deletePost,
  submitReport,
  toggleSavePost,
} from '../services/firestoreService.ts';
import { Post } from '../types/index.ts';
import { formatRelativeTime, isSafeAvatarUrl, isSafeImageUrl } from '../utils/date.ts';
import { renderInline } from '../utils/inlineMarkdown.tsx';
import { Modal } from './Modal.tsx';
import { ReactionBar } from './ReactionBar.tsx';

interface PostCardProps {
  post: Post;
  showFullContent?: boolean;
}

export function PostCard({ post, showFullContent = false }: PostCardProps) {
  const {
    publicUser,
    isAdmin,
    savedPostIds,
    ownedAnonymousIds,
    navigate,
    showToast,
  } = useApp();

  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('Harassment or unkindness');
  const [reportDetails, setReportDetails] = useState('');
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  const isSaved = savedPostIds.includes(post.id);
  const emotionMeta = post.emotion ? EMOTION_MAP[post.emotion] : null;
  const isAnon = post.visibility === 'anonymous';
  const isPrivate = post.visibility === 'private';

  const isOwner =
    Boolean(publicUser) &&
    (post.authorUid === publicUser?.uid ||
      (isAnon && ownedAnonymousIds.includes(post.id)));

  const handleBookmark = async () => {
    if (!publicUser) {
      showToast('Sign in to save posts to your collection.', 'info');
      navigate('/login');
      return;
    }
    if (post.isStarterSample) {
      showToast('Starter community stories are always available in Explore.', 'info');
      return;
    }
    try {
      await toggleSavePost(publicUser.uid, post.id, isSaved);
      showToast(
        isSaved ? 'Removed from Saved Posts.' : 'Saved to your reading collection.',
        'success'
      );
    } catch {
      showToast('Could not update bookmark.', 'error');
    }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/post/${post.id}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      showToast('Post link copied to clipboard.', 'success');
    } catch {
      showToast('Share link ready in your address bar.', 'info');
    }
  };

  const handleDelete = async () => {
    try {
      await deletePost(post.id, isAnon);
      setConfirmDeleteOpen(false);
      showToast('Post deleted.', 'info');
      if (showFullContent) navigate('/home');
    } catch {
      showToast('Could not delete post.', 'error');
    }
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicUser) {
      navigate('/login');
      return;
    }
    try {
      await submitReport({
        reporterUid: publicUser.uid,
        targetType: 'post',
        targetId: post.id,
        postId: post.id,
        reason: reportReason,
        details: reportDetails,
      });
      setReportOpen(false);
      setReportDetails('');
      showToast('Report received. Thank you for looking out for the community.', 'success');
    } catch {
      showToast('Could not submit report.', 'error');
    }
  };

  const canOpenProfile = !isAnon && !post.isStarterSample && post.authorUid !== 'anonymous';

  return (
    <article className="bg-[#FCFBFA] border border-[#EAE4DD] rounded-2xl p-6 space-y-4 transition-colors hover:border-[#DFD6CD]">
      {/* Header row */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          {isAnon ? (
            <div className="w-10 h-10 rounded-full bg-[#E9E5F2] flex items-center justify-center shrink-0">
              <EyeOff className="w-4 h-4 text-[#514766]" />
            </div>
          ) : post.authorAvatar && isSafeAvatarUrl(post.authorAvatar) ? (
            <img
              src={post.authorAvatar}
              alt={post.authorName}
              referrerPolicy="no-referrer"
              loading="lazy"
              width="40"
              height="40"
              className="w-10 h-10 rounded-full object-cover bg-[#EEE8E1] shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-[#EEE8E1] flex items-center justify-center text-sm font-medium text-[#29272B] shrink-0">
              {post.authorName.slice(0, 1).toUpperCase()}
            </div>
          )}

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 text-sm">
              {canOpenProfile ? (
                <button
                  type="button"
                  onClick={() => navigate(`/profile/${post.authorUid}`)}
                  className="font-semibold text-[#29272B] hover:underline cursor-pointer truncate"
                >
                  {post.authorName}
                </button>
              ) : (
                <span className="font-semibold text-[#29272B]">
                  {isAnon ? 'Anonymous' : post.authorName}
                </span>
              )}

              {!isAnon && (
                <span className="text-xs text-[#6B6770]">
                  @{post.authorUsername}
                </span>
              )}

              {isPrivate && (
                <span className="inline-flex items-center gap-1 text-xs text-[#6B6770]">
                  <span aria-hidden="true">·</span>
                  <Lock className="w-3 h-3" />
                  <span>Only you</span>
                </span>
              )}
            </div>

            {/* Clean unboxed metadata row */}
            <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-[#6B6770]">
              <span className="tabular-nums">{formatRelativeTime(post.createdAt)}</span>
              {emotionMeta && (
                <>
                  <span aria-hidden="true">·</span>
                  <span
                    className="inline-flex items-center gap-1.5 font-medium"
                    style={{ color: emotionMeta.tintText }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: emotionMeta.dotColor }}
                      aria-hidden="true"
                    />
                    {emotionMeta.label}
                  </span>
                </>
              )}
              {post.communityName && (
                <>
                  <span aria-hidden="true">·</span>
                  <button
                    type="button"
                    onClick={() => navigate(`/community/${post.communityId}`)}
                    className="hover:text-[#29272B] hover:underline cursor-pointer"
                  >
                    {post.communityName}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {(isOwner || isAdmin) && !post.isStarterSample && (
          <button
            type="button"
            onClick={() => setConfirmDeleteOpen(true)}
            aria-label="Delete post"
            className="p-2 rounded-lg text-[#6B6770] hover:text-[#A84848] hover:bg-[#FDF5F5] transition-colors cursor-pointer shrink-0"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Post Body */}
      <div className="space-y-2.5">
        {post.title && (
          <h3 className="text-lg font-display font-medium text-[#29272B] leading-snug">
            <button
              type="button"
              onClick={() => navigate(`/post/${post.id}`)}
              className="text-left hover:text-[#9F4E65] transition-colors cursor-pointer"
            >
              {post.title}
            </button>
          </h3>
        )}

        <p
          className={`text-[15px] text-[#29272B]/90 leading-[1.65] whitespace-pre-wrap ${
            !showFullContent && post.content.length > 360 ? 'line-clamp-5' : ''
          }`}
        >
          {renderInline(post.content)}
        </p>

        {!showFullContent && post.content.length > 360 && (
          <button
            type="button"
            onClick={() => navigate(`/post/${post.id}`)}
            className="text-xs font-medium text-[#9F4E65] hover:underline cursor-pointer"
          >
            Read full reflection
          </button>
        )}

        {post.imageUrl && isSafeImageUrl(post.imageUrl) && !imageFailed && (
          <div className="pt-1">
            <img
              src={post.imageUrl}
              alt={post.title || 'Shared visual reflection'}
              referrerPolicy="no-referrer"
              onError={() => setImageFailed(true)}
              className="w-full max-h-80 object-cover rounded-xl border border-[#EAE4DD]"
            />
          </div>
        )}

        {post.tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-[#6B6770]">
            {post.tags.map((tag, i) => (
              <React.Fragment key={tag}>
                {i > 0 && <span aria-hidden="true">·</span>}
                <span>#{tag}</span>
              </React.Fragment>
            ))}
          </div>
        )}
      </div>

      {/* Meaningful Reactions */}
      <div className="pt-2">
        <ReactionBar post={post} compact={!showFullContent} />
      </div>

      {/* Footer Actions */}
      <div className="pt-3 border-t border-[#EAE4DD]/80 flex flex-wrap items-center justify-between gap-3 text-xs text-[#6B6770]">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate(`/post/${post.id}`)}
            className="inline-flex items-center gap-1.5 hover:text-[#29272B] transition-colors cursor-pointer whitespace-nowrap"
          >
            <MessageCircle className="w-4 h-4" />
            <span className="tabular-nums">
              {post.commentsCount} {post.commentsCount === 1 ? 'Comment' : 'Comments'}
            </span>
          </button>

          <button
            type="button"
            onClick={handleBookmark}
            className={`inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
              isSaved ? 'text-[#9F4E65] font-medium' : 'hover:text-[#29272B]'
            }`}
          >
            <Bookmark className="w-4 h-4" />
            <span>{isSaved ? 'Saved' : 'Save'}</span>
          </button>

          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 hover:text-[#29272B] transition-colors cursor-pointer whitespace-nowrap"
          >
            <Share2 className="w-4 h-4" />
            <span>Share</span>
          </button>
        </div>

        {!isOwner && !post.isStarterSample && (
          <button
            type="button"
            onClick={() => {
              if (!publicUser) {
                navigate('/login');
                return;
              }
              setReportOpen(true);
            }}
            className="inline-flex items-center gap-1 hover:text-[#29272B] transition-colors cursor-pointer whitespace-nowrap"
          >
            <Flag className="w-3.5 h-3.5" />
            <span>Report</span>
          </button>
        )}
      </div>

      <Modal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        title="Report Post"
        subtitle="Reports are reviewed privately by moderators."
      >
        <form onSubmit={handleReportSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#29272B] mb-1.5">
              Reason
            </label>
            <select
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#F8F6F3] border border-[#EAE4DD] text-sm text-[#29272B]"
            >
              <option>Harassment or unkindness</option>
              <option>Spam or promotional content</option>
              <option>Sharing someone else’s private info</option>
              <option>Severe distress or safety concern</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#29272B] mb-1.5">
              Details (optional)
            </label>
            <textarea
              value={reportDetails}
              onChange={(e) => setReportDetails(e.target.value)}
              rows={3}
              maxLength={1000}
              className="w-full p-3 rounded-xl bg-[#F8F6F3] border border-[#EAE4DD] text-sm text-[#29272B]"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setReportOpen(false)}
              className="px-4 py-2 rounded-xl text-sm text-[#6B6770] hover:text-[#29272B] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-[#9F4E65] text-[#FCFBFA] text-sm font-medium cursor-pointer"
            >
              Submit Report
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        title="Delete this post?"
        subtitle="This removes your post permanently."
        maxWidthClass="max-w-sm"
      >
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={() => setConfirmDeleteOpen(false)}
            className="px-4 py-2 rounded-xl text-sm text-[#6B6770] hover:text-[#29272B] cursor-pointer"
          >
            Keep Post
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="px-4 py-2 rounded-xl bg-[#A84848] text-[#FCFBFA] text-sm font-medium cursor-pointer"
          >
            Delete
          </button>
        </div>
      </Modal>
    </article>
  );
}
