import { useEffect, useRef, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { AppShell } from '../components/AppShell.tsx';
import { PostComposer } from '../components/PostComposer.tsx';
import { useApp } from '../context/AppContext.tsx';
import {
  deletePostDraft,
  publishPostDraft,
  subscribePostDrafts,
} from '../services/firestoreService.ts';
import { PostDraft } from '../types/index.ts';

export function CreatePostPage() {
  const { navigate, publicUser, showToast } = useApp();
  const [drafts, setDrafts] = useState<PostDraft[]>([]);
  const publishingRef = useRef(false);

  useEffect(() => {
    if (!publicUser) return;
    const unsub = subscribePostDrafts(publicUser.uid, (items) => {
      setDrafts(items);
      const due = items.filter((d) => d.scheduledFor && d.scheduledFor.getTime() <= Date.now());
      if (due.length === 0 || publishingRef.current) return;
      publishingRef.current = true;
      void (async () => {
        try {
          for (const draft of due) {
            try {
              await publishPostDraft(draft, publicUser);
              showToast('A scheduled reflection was published.', 'success');
            } catch {
              showToast('A scheduled draft could not be published.', 'error');
            }
          }
        } finally {
          publishingRef.current = false;
        }
      })();
    });
    return () => unsub();
  }, [publicUser, showToast]);

  const handlePublishNow = async (draft: PostDraft) => {
    if (!publicUser) return;
    try {
      const postId = await publishPostDraft(draft, publicUser);
      showToast('Draft published.', 'success');
      navigate(`/post/${postId}`);
    } catch {
      showToast('Could not publish this draft.', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deletePostDraft(id);
      showToast('Draft deleted.', 'info');
    } catch {
      showToast('Could not delete this draft.', 'error');
    }
  };

  return (
    <AppShell>
      <div className="max-w-2xl space-y-6">
        <button
          type="button"
          onClick={() => navigate('/home')}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#6B6770] hover:text-[#29272B] cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to feed</span>
        </button>

        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-display font-medium text-[#29272B]">
            Express Your Feelings
          </h1>
          <p className="text-sm text-[#6B6770]">
            Whether you want to be heard publicly, stay anonymous, or keep a reflection strictly private—this space is yours.
          </p>
        </div>

        {drafts.length > 0 && (
          <section className="bg-[#FCFBFA] border border-[#EAE4DD] rounded-2xl p-5 sm:p-6 space-y-3">
            <h2 className="text-base font-medium text-[#29272B]">Your drafts ({drafts.length})</h2>
            <div className="space-y-2">
              {drafts.map((draft) => (
                <article
                  key={draft.id}
                  className="rounded-xl border border-[#EAE4DD] bg-[#F8F6F3] p-3.5 space-y-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs text-[#6B6770]">
                      {draft.scheduledFor
                        ? `Scheduled for ${draft.scheduledFor.toLocaleString()}`
                        : 'No publish date'}
                    </p>
                    <span className="text-[11px] text-[#6B6770]">{draft.visibility}</span>
                  </div>
                  <p className="text-sm text-[#29272B]/90 whitespace-pre-wrap line-clamp-3">
                    {draft.title && <span className="font-medium">{draft.title} — </span>}
                    {draft.content}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handlePublishNow(draft)}
                      className="px-3 py-1.5 rounded-lg bg-[#9F4E65] text-[#FCFBFA] text-xs cursor-pointer"
                    >
                      Publish now
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(draft.id)}
                      className="px-3 py-1.5 rounded-lg border border-[#EAE4DD] text-xs text-[#6B6770] hover:text-[#A84848] cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        <PostComposer onPublished={(postId) => navigate(`/post/${postId}`)} />
      </div>
    </AppShell>
  );
}
