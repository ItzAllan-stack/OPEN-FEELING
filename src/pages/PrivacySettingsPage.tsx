import React from 'react';
import { AppShell } from '../components/AppShell.tsx';
import { useApp } from '../context/AppContext.tsx';
import {
  toggleBlockOrMute,
  updatePrivatePreferences,
  updatePublicProfile,
} from '../services/firestoreService.ts';
import { PostVisibility } from '../types/index.ts';

export function PrivacySettingsPage() {
  const {
    publicUser,
    privateUser,
    blockedEntries,
    refreshUserProfile,
    navigate,
    showToast,
  } = useApp();

  if (!publicUser || !privateUser) {
    return (
      <AppShell>
        <div className="max-w-2xl space-y-6">
          <h1 className="text-2xl sm:text-3xl font-display font-medium text-[#29272B]">
            Privacy &amp; Safety Architecture
          </h1>
          <div className="bg-[#FCFBFA] border border-[#EAE4DD] rounded-2xl p-6 space-y-3 text-sm text-[#6B6770] leading-relaxed">
            <p>
              At <strong className="text-[#29272B]">OPEN FEELING</strong>, privacy is enforced at the database layer:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Anonymous posts strip your name, username, and UID from the public document.</li>
              <li>Private posts and My Personal Space journal entries can only be read by you.</li>
              <li>Email addresses and notification preferences are stored in an isolated private record.</li>
            </ul>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="mt-2 px-4 py-2 rounded-xl bg-[#9F4E65] text-[#FCFBFA] text-xs font-medium cursor-pointer"
            >
              Sign In to Manage Your Privacy
            </button>
          </div>
        </div>
      </AppShell>
    );
  }

  const handleDefaultVisibility = async (val: PostVisibility) => {
    try {
      await updatePrivatePreferences(publicUser.uid, { defaultVisibility: val });
      await refreshUserProfile();
      showToast('Default post visibility updated.', 'success');
    } catch {
      showToast('Could not update privacy setting.', 'error');
    }
  };

  const handleProfilePrivacy = async (isPrivate: boolean) => {
    try {
      await updatePublicProfile(publicUser.uid, publicUser.username, {
        displayName: publicUser.displayName,
        username: publicUser.username,
        bio: publicUser.bio,
        avatarUrl: publicUser.avatarUrl,
        isPrivateProfile: isPrivate,
      });
      await refreshUserProfile();
      showToast('Profile privacy updated.', 'success');
    } catch {
      showToast('Could not update profile privacy.', 'error');
    }
  };

  return (
    <AppShell>
      <div className="max-w-2xl space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-display font-medium text-[#29272B]">
            Privacy Settings
          </h1>
          <p className="text-sm text-[#6B6770]">
            Control how your identity appears and manage blocked or muted accounts.
          </p>
        </div>

        <section className="bg-[#FCFBFA] border border-[#EAE4DD] rounded-2xl p-6 space-y-4">
          <h2 className="text-base font-medium text-[#29272B]">Default Post Visibility</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {(['public', 'anonymous', 'private'] as PostVisibility[]).map((vis) => (
              <button
                key={vis}
                type="button"
                onClick={() => handleDefaultVisibility(vis)}
                className={`px-3.5 py-2.5 rounded-xl border text-xs font-medium capitalize cursor-pointer ${
                  privateUser.defaultVisibility === vis
                    ? 'bg-[#F4DCE3]/50 border-[#9F4E65] text-[#29272B]'
                    : 'bg-[#F8F6F3] border-[#EAE4DD] text-[#6B6770]'
                }`}
              >
                {vis}
              </button>
            ))}
          </div>

          <label className="flex items-start gap-2.5 pt-2 text-xs text-[#6B6770] cursor-pointer">
            <input
              type="checkbox"
              checked={publicUser.isPrivateProfile}
              onChange={(e) => handleProfilePrivacy(e.target.checked)}
              className="mt-0.5 accent-[#9F4E65]"
            />
            <span>
              Hide my public posts list when others open my profile page.
            </span>
          </label>
        </section>

        <section className="bg-[#FCFBFA] border border-[#EAE4DD] rounded-2xl p-6 space-y-3">
          <h2 className="text-base font-medium text-[#29272B]">About Anonymous Expression</h2>
          <p className="text-xs text-[#6B6770] leading-relaxed">
            When you publish anonymously, OPEN FEELING removes your display name, username, and profile link from public post documents. Ownership is stored separately so you can still delete your own posts and authorized moderators can investigate reported safety issues under controlled permissions. Platform anonymity does not guarantee absolute anonymity.
          </p>
        </section>

        <section className="bg-[#FCFBFA] border border-[#EAE4DD] rounded-2xl p-6 space-y-3">
          <h2 className="text-base font-medium text-[#29272B]">
            Blocked &amp; Muted Accounts ({blockedEntries.length})
          </h2>
          {blockedEntries.length === 0 ? (
            <p className="text-xs text-[#6B6770]">You have not blocked or muted anyone.</p>
          ) : (
            <div className="space-y-2">
              {blockedEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-[#F8F6F3] border border-[#EAE4DD] text-xs"
                >
                  <span className="text-[#29272B]">
                    Account {entry.blockedUid.slice(0, 10)}... ({entry.mode})
                  </span>
                  <button
                    type="button"
                    onClick={async () => {
                      await toggleBlockOrMute(
                        publicUser.uid,
                        entry.blockedUid,
                        entry.mode,
                        true
                      );
                      showToast('Removed restriction.', 'info');
                    }}
                    className="text-[#9F4E65] font-medium hover:underline cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
