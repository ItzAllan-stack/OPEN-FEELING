import React, { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { AppShell } from '../components/AppShell.tsx';
import { CommunityCard } from '../components/CommunityCard.tsx';
import { Modal } from '../components/Modal.tsx';
import { SearchBar } from '../components/SearchBar.tsx';
import { useApp } from '../context/AppContext.tsx';
import { createCommunity } from '../services/firestoreService.ts';

export function CommunitiesPage() {
  const { publicUser, communities, joinedCommunityIds, navigate, showToast } = useApp();
  const [view, setView] = useState<'all' | 'joined'>('all');
  const [sort, setSort] = useState<'popular' | 'newest' | 'name'>('popular');
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [rulesText, setRulesText] = useState('Listen gently without judgement.\nRespect personal privacy.');
  const [submitting, setSubmitting] = useState(false);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return communities
      .filter((community) => view === 'all' || joinedCommunityIds.includes(community.id))
      .filter((community) =>
        !query ||
        community.name.toLowerCase().includes(query) ||
        community.description.toLowerCase().includes(query)
      )
      .sort((a, b) => {
        if (sort === 'name') return a.name.localeCompare(b.name);
        if (sort === 'newest') return b.createdAt.getTime() - a.createdAt.getTime();
        return b.memberCount - a.memberCount;
      });
  }, [communities, joinedCommunityIds, search, sort, view]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicUser) {
      navigate('/login');
      return;
    }
    if (!name.trim() || !description.trim()) return;

    setSubmitting(true);
    try {
      const id = await createCommunity({
        uid: publicUser.uid,
        name,
        description,
        rules: rulesText.split('\n'),
      });
      setCreateOpen(false);
      setName('');
      setDescription('');
      showToast('Community space created.', 'success');
      navigate(`/community/${id}`);
    } catch {
      showToast('Could not create community space.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-display font-medium text-[#29272B]">
              Community Spaces
            </h1>
            <p className="text-sm text-[#6B6770]">
              Topic-based circles for shared experiences, quiet encouragement, and honest conversation.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              if (!publicUser) {
                showToast('Sign in to start a community space.', 'info');
                navigate('/login');
                return;
              }
              setCreateOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#9F4E65] text-[#FCFBFA] text-xs font-medium hover:bg-[#8A4358] transition-colors whitespace-nowrap shrink-0 cursor-pointer self-start"
          >
            <Plus className="w-4 h-4" />
            <span>New Community</span>
          </button>
        </div>

        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search community spaces..."
        />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1 rounded-xl border border-[#EAE4DD] bg-[#F8F6F3] p-1">
            {(['all', 'joined'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setView(tab)}
                aria-pressed={view === tab}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize ${view === tab ? 'bg-[#FCFBFA] text-[#29272B] shadow-sm' : 'text-[#6B6770]'}`}
              >
                {tab === 'all' ? 'Discover' : 'Joined'}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 text-xs text-[#6B6770]">
            Sort by
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as typeof sort)}
              className="rounded-lg border border-[#EAE4DD] bg-[#FCFBFA] px-2.5 py-2 text-[#29272B]"
            >
              <option value="popular">Most members</option>
              <option value="newest">Recently created</option>
              <option value="name">Name</option>
            </select>
          </label>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-[#EAE4DD] bg-[#F8F6F3] p-8 text-center">
            <p className="text-sm text-[#6B6770]">
              {view === 'joined'
                ? 'You have not joined any community spaces yet.'
                : 'No community spaces match your search.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((community) => (
              <CommunityCard key={community.id} community={community} />
            ))}
          </div>
        )}
      </div>

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Start a Community Space"
        subtitle="Create a gentle space centered around a shared life experience."
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#29272B] mb-1">
              Community Name
            </label>
            <input
              type="text"
              required
              maxLength={80}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Creative Beginnings"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8F6F3] border border-[#EAE4DD] text-sm text-[#29272B]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#29272B] mb-1">
              Description
            </label>
            <textarea
              required
              rows={3}
              maxLength={500}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe who this space is for and what people can share here..."
              className="w-full p-3 rounded-xl bg-[#F8F6F3] border border-[#EAE4DD] text-sm text-[#29272B]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#29272B] mb-1">
              Community Rules (one per line)
            </label>
            <textarea
              rows={3}
              value={rulesText}
              onChange={(e) => setRulesText(e.target.value)}
              className="w-full p-3 rounded-xl bg-[#F8F6F3] border border-[#EAE4DD] text-sm text-[#29272B]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setCreateOpen(false)}
              className="px-4 py-2 rounded-xl text-sm text-[#6B6770] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-xl bg-[#9F4E65] text-[#FCFBFA] text-sm font-medium cursor-pointer"
            >
              {submitting ? 'Creating...' : 'Create Space'}
            </button>
          </div>
        </form>
      </Modal>
    </AppShell>
  );
}
