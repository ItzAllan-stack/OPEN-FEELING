import { useEffect, useState } from 'react';
import { ShieldCheck, Eye, Trash2 } from 'lucide-react';
import { AppShell } from '../components/AppShell.tsx';
import { useApp } from '../context/AppContext.tsx';
import {
  adminResolvePostOwner,
  deletePost,
  subscribeAllReports,
  updateReportStatus,
} from '../services/firestoreService.ts';
import { ModerationReport } from '../types/index.ts';
import { formatRelativeTime } from '../utils/date.ts';

export function ModerationPage() {
  const { isAdmin, posts, navigate, showToast } = useApp();
  const [reports, setReports] = useState<ModerationReport[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [resolvedOwners, setResolvedOwners] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isAdmin) return;
    const unsub = subscribeAllReports(setReports);
    return () => unsub();
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <AppShell>
        <div className="bg-[#F8F6F3] border border-[#EAE4DD] rounded-2xl p-8 text-center space-y-3">
          <h1 className="text-xl font-display text-[#29272B]">Moderator Access Only</h1>
          <p className="text-sm text-[#6B6770]">
            This dashboard is restricted to verified community moderators.
          </p>
          <button
            type="button"
            onClick={() => navigate('/home')}
            className="px-4 py-2 rounded-xl bg-[#29272B] text-[#FCFBFA] text-xs font-medium cursor-pointer"
          >
            Return Home
          </button>
        </div>
      </AppShell>
    );
  }

  const handleStatus = async (report: ModerationReport, status: ModerationReport['status']) => {
    try {
      await updateReportStatus(report.id, status, notes[report.id] ?? report.moderatorNote);
      showToast(`Report marked as ${status}.`, 'success');
    } catch {
      showToast('Could not update report status.', 'error');
    }
  };

  const handleInspectAnonymous = async (postId: string) => {
    try {
      const owner = await adminResolvePostOwner(postId);
      setResolvedOwners((prev) => ({
        ...prev,
        [postId]: owner || 'Public post / not anonymously masked',
      }));
    } catch {
      showToast('Could not inspect post ownership.', 'error');
    }
  };

  const handleRemovePost = async (report: ModerationReport) => {
    const postId = report.postId || report.targetId;
    const targetPost = posts.find((p) => p.id === postId);
    try {
      await deletePost(postId, targetPost?.visibility === 'anonymous');
      await updateReportStatus(report.id, 'resolved', 'Post removed by moderator.');
      showToast('Reported post removed and report resolved.', 'info');
    } catch {
      showToast('Could not remove post.', 'error');
    }
  };

  return (
    <AppShell>
      <div className="max-w-4xl space-y-6">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-6 h-6 text-[#9F4E65]" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-medium text-[#29272B]">
              Moderation Dashboard
            </h1>
            <p className="text-sm text-[#6B6770]">
              Review community reports safely and protect emotional well-being.
            </p>
          </div>
        </div>

        {reports.length === 0 ? (
          <div className="bg-[#F8F6F3] border border-[#EAE4DD] rounded-2xl p-8 text-center">
            <p className="text-sm text-[#6B6770]">No moderation reports in the queue.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => {
              const targetPost = posts.find(
                (p) => p.id === (report.postId || report.targetId)
              );
              return (
                <div
                  key={report.id}
                  className="bg-[#FCFBFA] border border-[#EAE4DD] rounded-2xl p-5 space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#6B6770]">
                    <span>
                      Target: <strong className="text-[#29272B]">{report.targetType}</strong> ({report.targetId})
                    </span>
                    <span className="tabular-nums">
                      {formatRelativeTime(report.createdAt)} · Status: <strong className="text-[#29272B] uppercase">{report.status}</strong>
                    </span>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-[#29272B]">{report.reason}</p>
                    {report.details && (
                      <p className="mt-1 text-xs text-[#6B6770]">{report.details}</p>
                    )}
                  </div>

                  {targetPost && (
                    <div className="p-3 rounded-xl bg-[#F8F6F3] border border-[#EAE4DD] text-xs text-[#29272B]">
                      <p className="font-medium">Reported content preview:</p>
                      <p className="mt-1 text-[#6B6770] line-clamp-3">{targetPost.content}</p>
                    </div>
                  )}

                  {resolvedOwners[report.postId || report.targetId] && (
                    <p className="text-xs text-[#9F4E65]">
                      Controlled safety lookup UID: {resolvedOwners[report.postId || report.targetId]}
                    </p>
                  )}

                  <input
                    type="text"
                    value={notes[report.id] ?? report.moderatorNote}
                    onChange={(e) =>
                      setNotes((prev) => ({ ...prev, [report.id]: e.target.value }))
                    }
                    placeholder="Moderator note..."
                    className="w-full px-3 py-2 rounded-xl bg-[#F8F6F3] border border-[#EAE4DD] text-xs text-[#29272B]"
                  />

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {report.targetType === 'post' && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleInspectAnonymous(report.postId || report.targetId)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F8F6F3] border border-[#EAE4DD] text-xs text-[#29272B] cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Verify Author UID</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemovePost(report)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#A84848] text-[#FCFBFA] text-xs cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove Post</span>
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => handleStatus(report, 'resolved')}
                      className="px-3 py-1.5 rounded-lg bg-[#29272B] text-[#FCFBFA] text-xs cursor-pointer"
                    >
                      Mark Resolved
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStatus(report, 'dismissed')}
                      className="px-3 py-1.5 rounded-lg bg-[#F8F6F3] border border-[#EAE4DD] text-xs text-[#6B6770] cursor-pointer"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
