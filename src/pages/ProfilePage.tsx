import React, { useEffect, useState } from 'react';
import { Ban, Flag, Pencil, VolumeX } from 'lucide-react';
import { AppShell } from '../components/AppShell.tsx';
import { Modal } from '../components/Modal.tsx';
import { PostCard } from '../components/PostCard.tsx';
import { ProfileCard } from '../components/ProfileCard.tsx';
import { useApp } from '../context/AppContext.tsx';
import {
  getPublicUser,
  submitReport,
  toggleBlockOrMute,
  toggleFollowUser,
} from '../services/firestoreService.ts';
import { PublicUser } from '../types/index.ts';

interface ProfilePageProps {
  uid?: string;
}

export function ProfilePage({ uid }: ProfilePageProps) {
  const {
    publicUser,
    posts,
    ownedAnonymousIds,
    followingUids,
    blockedEntries,
    navigate,
    showToast,
  } = useApp();

  const targetUid = uid || publicUser?.uid || '';
  const isOwnProfile = Boolean(publicUser && targetUid === publicUser.uid);

  const [profile, setProfile] = useState<PublicUser | null>(
    isOwnProfile ? publicUser : null
  );
  const [loading, setLoading] = useState(!isOwnProfile);
  const [tab, setTab] = useState<'public' | 'private' | 'anonymous'>('public');

  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('Harassment or unkindness');
  const [reportDetails, setReportDetails] = useState('');

  useEffect(() => {
    if (isOwnProfile) {
      setProfile(publicUser);
      setLoading(false);
      return;
    }
    if (!targetUid) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    getPublicUser(targetUid)
      .then((res) => {
        if (!cancelled) {
          setProfile(res);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [targetUid, isOwnProfile, publicUser]);

  if (!targetUid) {
    return (
      <AppShell>
        <div className="bg-[#F8F6F3] border border-[#EAE4DD] rounded-2xl p-8 text-center space-y-3">
          <h1 className="text-xl font-display text-[#29272B]">Sign in to view your profile</h1>
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="px-4 py-2 rounded-xl bg-[#29272B] text-[#FCFBFA] text-xs font-medium cursor-pointer"
          >
            Sign In
          </button>
        </div>
      </AppShell>
    );
  }

  if (loading) {
    return (
      <AppShell>
        <div className="h-40 rounded-2xl bg-[#F8F6F3] border border-[#EAE4DD] animate-pulse" />
      </AppShell>
    );
  }

  if (!profile) {
    return (
      <AppShell>
        <div className="bg-[#F8F6F3] border border-[#EAE4DD] rounded-2xl p-8 text-center space-y-3">
          <h1 className="text-xl font-display text-[#29272B]">Profile not found</h1>
          <button
            type="button"
            onClick={() => navigate('/explore')}
            className="px-4 py-2 rounded-xl bg-[#29272B] text-[#FCFBFA] text-xs font-medium cursor-pointer"
          >
            Explore Community
          </button>
        </div>
      </AppShell>
    );
  }

  const isFollowing = followingUids.includes(profile.uid);
  const isBlocked = blockedEntries.some(
    (e) => e.blockedUid === profile.uid && e.mode === 'block'
  );
  const isMuted = blockedEntries.some(
    (e) => e.blockedUid === profile.uid && e.mode === 'mute'
  );

  // Never link anonymous posts or private posts on another person's profile!
  const publicPosts = posts.filter(
    (p) => p.visibility === 'public' && p.authorUid === profile.uid
  );
  const myPrivatePosts = isOwnProfile
    ? posts.filter((p) => p.visibility === 'private' && p.authorUid === profile.uid)
    : [];
  const myAnonymousPosts = isOwnProfile
    ? posts.filter(
        (p) => p.visibility === 'anonymous' && ownedAnonymousIds.includes(p.id)
      )
    : [];

  const visiblePosts =
    tab === 'private'
      ? myPrivatePosts
      : tab === 'anonymous'
        ? myAnonymousPosts
        : publicPosts;

  const handleFollow = async () => {
    if (!publicUser) {
      navigate('/login');
      return;
    }
    try {
      await toggleFollowUser({
        actor: publicUser,
        targetUser: profile,
        isFollowing,
      });
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              followersCount: Math.max(
                0,
                prev.followersCount + (isFollowing ? -1 : 1)
              ),
            }
          : prev
      );
      showToast(
        isFollowing
          ? `Unfollowed ${profile.displayName}.`
          : `Following ${profile.displayName}.`,
        'success'
      );
    } catch {
      showToast('Could not update follow status.', 'error');
    }
  };

  const handleBlockMute = async (mode: 'block' | 'mute') => {
    if (!publicUser) {
      navigate('/login');
      return;
    }
    const currentlyActive = mode === 'block' ? isBlocked : isMuted;
    try {
      await toggleBlockOrMute(publicUser.uid, profile.uid, mode, currentlyActive);
      showToast(
        currentlyActive
          ? `Removed ${mode} for ${profile.displayName}.`
          : `${profile.displayName} has been ${mode === 'block' ? 'blocked' : 'muted'}.`,
        'info'
      );
    } catch {
      showToast('Could not update safety setting.', 'error');
    }
  };

  const handleReportUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicUser) return;
    try {
      await submitReport({
        reporterUid: publicUser.uid,
        targetType: 'user',
        targetId: profile.uid,
        reason: reportReason,
        details: reportDetails,
      });
      setReportOpen(false);
      setReportDetails('');
      showToast('User report submitted for review.', 'success');
    } catch {
      showToast('Could not submit report.', 'error');
    }
  };

  return (
    <AppShell>
      <div className="max-w-3xl space-y-6">
        <ProfileCard
          user={profile}
          actionSlot={
            isOwnProfile ? (
              <button
                type="button"
                onClick={() => navigate('/profile/edit')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#F8F6F3] border border-[#EAE4DD] text-xs font-medium text-[#29272B] hover:bg-[#EEE8E1] cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>Edit Profile</span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleFollow}
                  className={`px-4 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                    isFollowing
                      ? 'bg-[#F8F6F3] border border-[#EAE4DD] text-[#29272B]'
                      : 'bg-[#29272B] text-[#FCFBFA] hover:bg-[#3E3B41]'
                  }`}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
                <button
                  type="button"
                  onClick={() => handleBlockMute('mute')}
                  title="Mute user"
                  className="p-2 rounded-xl bg-[#F8F6F3] border border-[#EAE4DD] text-[#6B6770] hover:text-[#29272B] cursor-pointer"
                >
                  <VolumeX className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleBlockMute('block')}
                  title="Block user"
                  className="p-2 rounded-xl bg-[#F8F6F3] border border-[#EAE4DD] text-[#6B6770] hover:text-[#A84848] cursor-pointer"
                >
                  <Ban className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setReportOpen(true)}
                  title="Report user"
                  className="p-2 rounded-xl bg-[#F8F6F3] border border-[#EAE4DD] text-[#6B6770] hover:text-[#29272B] cursor-pointer"
                >
                  <Flag className="w-4 h-4" />
                </button>
              </>
            )
          }
        />

        {profile.isPrivateProfile && !isOwnProfile ? (
          <div className="bg-[#F8F6F3] border border-[#EAE4DD] rounded-2xl p-8 text-center">
            <p className="text-sm text-[#77727A]">
              {profile.displayName} keeps their profile reflections private.
            </p>
          </div>
        ) : (
          <>
            {isOwnProfile && (
              <div className="flex items-center gap-1 p-1 bg-[#F8F6F3] border border-[#EAE4DD] rounded-xl w-fit">
                {[
                  { id: 'public', label: `Public (${publicPosts.length})` },
                  { id: 'anonymous', label: `My Anonymous (${myAnonymousPosts.length})` },
                  { id: 'private', label: `Only Me (${myPrivatePosts.length})` },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTab(t.id as typeof tab)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${
                      tab === t.id
                        ? 'bg-[#FCFBFA] text-[#29272B] border border-[#EAE4DD]'
                        : 'text-[#77727A]'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            )}

            {visiblePosts.length === 0 ? (
              <div className="bg-[#F8F6F3] border border-[#EAE4DD] rounded-2xl p-8 text-center space-y-2">
                <p className="text-base font-display text-[#29272B]">
                  No stories in this view yet
                </p>
                {isOwnProfile && (
                  <button
                    type="button"
                    onClick={() => navigate('/create')}
                    className="mt-2 px-4 py-2 rounded-xl bg-[#29272B] text-[#FCFBFA] text-xs font-medium cursor-pointer"
                  >
                    Share a Reflection
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {visiblePosts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <Modal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        title={`Report @${profile.username}`}
        subtitle="Reports are reviewed privately by moderators."
      >
        <form onSubmit={handleReportUser} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#29272B] mb-1">
              Reason
            </label>
            <select
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#F8F6F3] border border-[#EAE4DD] text-sm"
            >
              <option>Harassment or unkindness</option>
              <option>Spam account</option>
              <option>Impersonation or privacy violation</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#29272B] mb-1">
              Details
            </label>
            <textarea
              rows={3}
              value={reportDetails}
              onChange={(e) => setReportDetails(e.target.value)}
              className="w-full p-3 rounded-xl bg-[#F8F6F3] border border-[#EAE4DD] text-sm"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setReportOpen(false)}
              className="px-4 py-2 rounded-xl text-sm text-[#77727A] cursor-pointer"
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
    </AppShell>
  );
}
