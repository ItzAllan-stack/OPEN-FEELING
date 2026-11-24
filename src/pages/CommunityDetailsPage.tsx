import { ArrowLeft, Shield } from 'lucide-react';
import { AppShell } from '../components/AppShell.tsx';
import { PostCard } from '../components/PostCard.tsx';
import { PostComposer } from '../components/PostComposer.tsx';
import { useApp } from '../context/AppContext.tsx';
import { toggleCommunityMembership } from '../services/firestoreService.ts';

interface CommunityDetailsPageProps {
  communityId: string;
}

export function CommunityDetailsPage({ communityId }: CommunityDetailsPageProps) {
  const {
    publicUser,
    isAdmin,
    communities,
    joinedCommunityIds,
    posts,
    navigate,
    showToast,
  } = useApp();

  const community = communities.find((c) => c.id === communityId);
  const isMember = joinedCommunityIds.includes(communityId);
  const communityPosts = posts.filter((p) => p.communityId === communityId);

  if (!community) {
    return (
      <AppShell>
        <div className="bg-[#F8F6F3] border border-[#EAE4DD] rounded-2xl p-8 text-center space-y-3">
          <h1 className="text-xl font-display text-[#29272B]">Community not found</h1>
          <button
            type="button"
            onClick={() => navigate('/communities')}
            className="px-4 py-2 rounded-xl bg-[#29272B] text-[#FCFBFA] text-xs font-medium cursor-pointer"
          >
            Browse All Communities
          </button>
        </div>
      </AppShell>
    );
  }

  const handleToggleJoin = async () => {
    if (!publicUser) {
      showToast('Sign in to join this community.', 'info');
      navigate('/login');
      return;
    }
    try {
      await toggleCommunityMembership(community, publicUser.uid, isMember);
      showToast(
        isMember ? `Left ${community.name}.` : `Joined ${community.name}.`,
        'success'
      );
    } catch {
      showToast('Could not update membership.', 'error');
    }
  };

  const canModerate = isAdmin || (publicUser && community.createdByUid === publicUser.uid);

  const rightSidebar = (
    <div className="space-y-5">
      <div className="bg-[#FCFBFA] border border-[#EAE4DD] rounded-2xl p-5 space-y-3">
        <h3 className="text-sm font-medium text-[#29272B]">Community Rules</h3>
        <ol className="space-y-2 text-xs text-[#6B6770] list-decimal pl-4 leading-relaxed">
          {community.rules.map((rule, i) => (
            <li key={i}>{rule}</li>
          ))}
        </ol>
      </div>

      {canModerate && (
        <div className="bg-[#F8F6F3] border border-[#EAE4DD] rounded-2xl p-5 space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-medium text-[#29272B]">
            <Shield className="w-4 h-4 text-[#9F4E65]" />
            <span>Community Moderation</span>
          </div>
          <p className="text-xs text-[#6B6770] leading-relaxed">
            Use the Report action on any post or visit the Moderation Dashboard to review flagged content in this space.
          </p>
          {isAdmin && (
            <button
              type="button"
              onClick={() => navigate('/moderation')}
              className="text-xs font-medium text-[#9F4E65] hover:underline cursor-pointer"
            >
              Open Moderation Dashboard
            </button>
          )}
        </div>
      )}
    </div>
  );

  return (
    <AppShell rightSidebar={rightSidebar}>
      <div className="space-y-6">
        <button
          type="button"
          onClick={() => navigate('/communities')}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#6B6770] hover:text-[#29272B] cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>All communities</span>
        </button>

        {/* Community Banner */}
        <div className="bg-[#FCFBFA] border border-[#EAE4DD] rounded-2xl p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-1.5">
              <h1 className="text-2xl sm:text-3xl font-display font-medium text-[#29272B]">
                {community.name}
              </h1>
              <p className="text-sm text-[#6B6770] leading-relaxed max-w-2xl">
                {community.description}
              </p>
              <p className="text-xs text-[#6B6770] tabular-nums pt-1">
                {community.memberCount} members · {communityPosts.length} stories shared
              </p>
            </div>

            <button
              type="button"
              onClick={handleToggleJoin}
              className={`px-5 py-2.5 rounded-xl text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                isMember
                  ? 'bg-[#F8F6F3] border border-[#EAE4DD] text-[#29272B]'
                  : 'bg-[#29272B] text-[#FCFBFA] hover:bg-[#3E3B41]'
              }`}
            >
              {isMember ? 'Joined' : 'Join Community'}
            </button>
          </div>
        </div>

        <PostComposer defaultCommunityId={community.id} compact />

        {communityPosts.length === 0 ? (
          <div className="bg-[#F8F6F3] border border-[#EAE4DD] rounded-2xl p-8 text-center space-y-2">
            <p className="text-base font-display text-[#29272B]">
              Be the first to share in {community.name}
            </p>
            <p className="text-sm text-[#6B6770]">
              Your reflection can help open a warm conversation here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {communityPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
