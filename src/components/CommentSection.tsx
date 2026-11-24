import React, { useEffect, useState } from 'react';
import { MessageCircle, Reply, Pencil, Trash2, Flag } from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import {
  addComment,
  deleteComment,
  editComment,
  submitReport,
  subscribePostComments,
} from '../services/firestoreService.ts';
import { CommentItem, Post } from '../types/index.ts';
import { formatRelativeTime, isSafeAvatarUrl } from '../utils/date.ts';
import { Modal } from './Modal.tsx';

interface CommentSectionProps {
  post: Post;
}

export function CommentSection({ post }: CommentSectionProps) {
  const { publicUser, isAdmin, ownedAnonymousIds, navigate, showToast } = useApp();
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [replyingTo, setReplyingTo] = useState<CommentItem | null>(null);
  const [replyText, setReplyText] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  const [reportingComment, setReportingComment] = useState<CommentItem | null>(null);
  const [reportReason, setReportReason] = useState('Harassment or unkindness');
  const [reportDetails, setReportDetails] = useState('');

  useEffect(() => {
    if (post.isStarterSample) return;
    const unsub = subscribePostComments(post.id, setComments);
    return () => unsub();
  }, [post.id, post.isStarterSample]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicUser) {
      showToast('Please sign in to leave a supportive comment.', 'info');
      navigate('/login');
      return;
    }
    if (post.isStarterSample) {
      showToast('Share a new post to start live community discussions.', 'info');
      return;
    }
    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      await addComment({
        post,
        author: publicUser,
        content: newComment,
      });
      setNewComment('');
      showToast('Your words of support have been shared.', 'success');
    } catch {
      showToast('Could not post your comment.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicUser || !replyingTo || !replyText.trim()) return;
    setSubmitting(true);
    try {
      await addComment({
        post,
        author: publicUser,
        content: replyText,
        parentCommentId: replyingTo.id,
        replyToUid: replyingTo.authorUid,
      });
      setReplyText('');
      setReplyingTo(null);
      showToast('Reply added.', 'success');
    } catch {
      showToast('Could not post reply.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveEdit = async (commentId: string) => {
    if (!editText.trim()) return;
    try {
      await editComment(post.id, commentId, editText);
      setEditingId(null);
      setEditText('');
      showToast('Comment updated.', 'success');
    } catch {
      showToast('Could not update comment.', 'error');
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      await deleteComment(post, commentId);
      showToast('Comment removed.', 'info');
    } catch {
      showToast('Could not remove comment.', 'error');
    }
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicUser || !reportingComment) return;
    try {
      await submitReport({
        reporterUid: publicUser.uid,
        targetType: 'comment',
        targetId: reportingComment.id,
        postId: post.id,
        reason: reportReason,
        details: reportDetails,
      });
      setReportingComment(null);
      setReportDetails('');
      showToast('Thank you. Our moderation team will review this report.', 'success');
    } catch {
      showToast('Could not submit report.', 'error');
    }
  };

  const topLevel = comments.filter((c) => !c.parentCommentId);
  const repliesByParent = comments.reduce<Record<string, CommentItem[]>>((acc, c) => {
    if (c.parentCommentId) {
      if (!acc[c.parentCommentId]) acc[c.parentCommentId] = [];
      acc[c.parentCommentId].push(c);
    }
    return acc;
  }, {});

  const isPostOwner =
    Boolean(publicUser) &&
    (post.authorUid === publicUser?.uid || ownedAnonymousIds.includes(post.id));

  const renderComment = (comment: CommentItem, isReply = false) => {
    const canEdit = publicUser?.uid === comment.authorUid;
    const canDelete = canEdit || isPostOwner || isAdmin;
    const replies = repliesByParent[comment.id] || [];

    return (
      <div
        key={comment.id}
        className={`${isReply ? 'ml-6 sm:ml-10 pt-3 border-t border-[#EAE4DD]/70' : 'py-4 border-b border-[#EAE4DD] last:border-b-0'}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            {comment.authorAvatar && isSafeAvatarUrl(comment.authorAvatar) ? (
              <img
                src={comment.authorAvatar}
                alt={comment.authorName}
                referrerPolicy="no-referrer"
                className="w-7 h-7 rounded-full object-cover bg-[#EEE8E1] shrink-0"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-[#EEE8E1] flex items-center justify-center text-xs font-medium text-[#29272B] shrink-0">
                {comment.authorName.slice(0, 1).toUpperCase()}
              </div>
            )}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => navigate(`/profile/${comment.authorUid}`)}
                className="font-medium text-[#29272B] hover:underline cursor-pointer"
              >
                {comment.authorName}
              </button>
              <span className="text-[#6B6770]">@{comment.authorUsername}</span>
              <span aria-hidden="true" className="text-[#6B6770]">·</span>
              <span className="text-[#6B6770] tabular-nums">
                {formatRelativeTime(comment.createdAt)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {!isReply && publicUser && (
              <button
                type="button"
                onClick={() => {
                  setReplyingTo(comment);
                  setReplyText('');
                }}
                aria-label="Reply to comment"
                className="p-1.5 rounded-lg text-[#6B6770] hover:text-[#29272B] hover:bg-[#F8F6F3] cursor-pointer"
              >
                <Reply className="w-3.5 h-3.5" />
              </button>
            )}
            {canEdit && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(comment.id);
                  setEditText(comment.content);
                }}
                aria-label="Edit comment"
                className="p-1.5 rounded-lg text-[#6B6770] hover:text-[#29272B] hover:bg-[#F8F6F3] cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            )}
            {canDelete && (
              <button
                type="button"
                onClick={() => handleDelete(comment.id)}
                aria-label="Delete comment"
                className="p-1.5 rounded-lg text-[#6B6770] hover:text-[#A84848] hover:bg-[#FDF5F5] cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
            {publicUser && publicUser.uid !== comment.authorUid && (
              <button
                type="button"
                onClick={() => setReportingComment(comment)}
                aria-label="Report comment"
                className="p-1.5 rounded-lg text-[#6B6770] hover:text-[#29272B] hover:bg-[#F8F6F3] cursor-pointer"
              >
                <Flag className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {editingId === comment.id ? (
          <div className="mt-2.5 space-y-2">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              rows={2}
              maxLength={1500}
              className="w-full p-3 rounded-xl bg-[#F8F6F3] border border-[#EAE4DD] text-sm text-[#29272B] focus:outline-none focus:border-[#E9A9B8]"
            />
            <div className="flex items-center gap-2 justify-end">
              <button
                type="button"
                onClick={() => setEditingId(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#6B6770] hover:text-[#29272B] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSaveEdit(comment.id)}
                className="px-3.5 py-1.5 rounded-lg bg-[#29272B] text-[#FCFBFA] text-xs font-medium cursor-pointer"
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <p className="mt-2 text-sm text-[#29272B] leading-relaxed whitespace-pre-wrap">
            {comment.content}
          </p>
        )}

        {replyingTo?.id === comment.id && (
          <form onSubmit={handleSubmitReply} className="mt-3 ml-6 space-y-2">
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder={`Reply kindly to ${comment.authorName}...`}
              rows={2}
              maxLength={1500}
              className="w-full p-3 rounded-xl bg-[#F8F6F3] border border-[#EAE4DD] text-sm text-[#29272B] focus:outline-none focus:border-[#E9A9B8]"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setReplyingTo(null)}
                className="px-3 py-1.5 rounded-lg text-xs text-[#6B6770] hover:text-[#29272B] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !replyText.trim()}
                className="px-3.5 py-1.5 rounded-lg bg-[#29272B] text-[#FCFBFA] text-xs font-medium disabled:opacity-50 cursor-pointer"
              >
                Post Reply
              </button>
            </div>
          </form>
        )}

        {replies.length > 0 && (
          <div className="mt-3 space-y-3">
            {replies.map((reply) => renderComment(reply, true))}
          </div>
        )}
      </div>
    );
  };

  return (
    <section aria-label="Supportive comments" className="pt-6 border-t border-[#EAE4DD]">
      <div className="flex items-center gap-2 mb-4">
        <MessageCircle className="w-4 h-4 text-[#6B6770]" />
        <h3 className="text-base font-medium text-[#29272B]">
          Supportive Listening ({comments.length})
        </h3>
      </div>

      <form onSubmit={handleSubmitComment} className="mb-6 space-y-3">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder={
            publicUser
              ? 'Offer a warm, non-judgemental word of listening...'
              : 'Sign in to leave a supportive note...'
          }
          rows={3}
          maxLength={1500}
          className="w-full p-3.5 rounded-xl bg-[#F8F6F3] border border-[#EAE4DD] text-sm text-[#29272B] placeholder:text-[#6B6770] focus:outline-none focus:border-[#E9A9B8] focus:bg-[#FCFBFA] transition-colors"
        />
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs text-[#6B6770]">
            Remember: sometimes listening matters more than fixing.
          </p>
          <button
            type="submit"
            disabled={submitting || !newComment.trim()}
            className="px-4 py-2 rounded-xl bg-[#29272B] text-[#FCFBFA] text-xs font-medium hover:bg-[#3E3B41] disabled:opacity-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {submitting ? 'Sharing...' : 'Share Support'}
          </button>
        </div>
      </form>

      {topLevel.length === 0 ? (
        <p className="text-sm text-[#6B6770] py-4">
          No comments yet. Be the first to offer a gentle word.
        </p>
      ) : (
        <div>{topLevel.map((c) => renderComment(c))}</div>
      )}

      <Modal
        open={Boolean(reportingComment)}
        onClose={() => setReportingComment(null)}
        title="Report Comment"
        subtitle="Help us keep OPEN FEELING gentle and safe."
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
              <option>Judgemental or shaming language</option>
              <option>Spam or promotional content</option>
              <option>Safety concern or distress</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#29272B] mb-1.5">
              Additional context (optional)
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
              onClick={() => setReportingComment(null)}
              className="px-4 py-2 rounded-xl text-sm text-[#6B6770] hover:text-[#29272B] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-[#29272B] text-[#FCFBFA] text-sm font-medium cursor-pointer"
            >
              Submit Report
            </button>
          </div>
        </form>
      </Modal>
    </section>
  );
}
