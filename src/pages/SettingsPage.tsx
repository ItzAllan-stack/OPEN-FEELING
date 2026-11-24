import { useState } from 'react';
import { AppShell } from '../components/AppShell.tsx';
import { Modal } from '../components/Modal.tsx';
import { useApp } from '../context/AppContext.tsx';
import { updatePrivatePreferences } from '../services/firestoreService.ts';

export function SettingsPage() {
  const {
    firebaseUser,
    publicUser,
    privateUser,
    sakuraEnabled,
    setSakuraLocal,
    refreshUserProfile,
    resendVerificationEmail,
    deleteAccount,
    navigate,
    showToast,
  } = useApp();

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (!publicUser || !privateUser) {
    return (
      <AppShell>
        <div className="bg-[#F8F6F3] border border-[#EAE4DD] rounded-2xl p-8 text-center space-y-3">
          <h1 className="text-xl font-display text-[#29272B]">Sign in to manage settings</h1>
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

  const updatePref = async (key: keyof typeof privateUser, val: boolean) => {
    try {
      await updatePrivatePreferences(publicUser.uid, { [key]: val });
      if (key === 'sakuraEnabled') setSakuraLocal(val);
      await refreshUserProfile();
      showToast('Preference saved.', 'success');
    } catch {
      showToast('Could not save preference.', 'error');
    }
  };

  return (
    <AppShell>
      <div className="max-w-2xl space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-display font-medium text-[#29272B]">
            Settings
          </h1>
          <p className="text-sm text-[#6B6770]">
            Manage your comfort preferences, notifications, and account details.
          </p>
        </div>

        {/* Account Summary */}
        <section className="bg-[#FCFBFA] border border-[#EAE4DD] rounded-2xl p-6 space-y-3">
          <h2 className="text-base font-medium text-[#29272B]">Account</h2>
          <div className="text-sm text-[#6B6770] space-y-1">
            <p>
              Email: <span className="text-[#29272B]">{privateUser.email || firebaseUser?.email}</span>
            </p>
            <p>
              Verification:{' '}
              <span className="text-[#29272B]">
                {firebaseUser?.emailVerified ? 'Verified' : 'Pending verification'}
              </span>
              {!firebaseUser?.emailVerified && (
                <button
                  type="button"
                  onClick={resendVerificationEmail}
                  className="ml-2 text-xs text-[#9F4E65] underline cursor-pointer"
                >
                  Send verification email
                </button>
              )}
            </p>
          </div>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => navigate('/privacy')}
              className="text-xs font-medium text-[#9F4E65] hover:underline cursor-pointer"
            >
              Open Privacy &amp; Safety Settings &rarr;
            </button>
          </div>
        </section>

        {/* Visual Comfort */}
        <section className="bg-[#FCFBFA] border border-[#EAE4DD] rounded-2xl p-6 space-y-4">
          <h2 className="text-base font-medium text-[#29272B]">Visual Atmosphere</h2>
          <label className="flex items-center justify-between gap-4 cursor-pointer">
            <div>
              <p className="text-sm text-[#29272B]">Cherry blossom hero petals</p>
              <p className="text-xs text-[#6B6770]">
                Subtle slow-drifting petals on the landing hero. Respects system reduced motion automatically.
              </p>
            </div>
            <input
              type="checkbox"
              checked={sakuraEnabled}
              onChange={(e) => updatePref('sakuraEnabled', e.target.checked)}
              className="w-4 h-4 accent-[#9F4E65]"
            />
          </label>
        </section>

        {/* Notification Preferences */}
        <section className="bg-[#FCFBFA] border border-[#EAE4DD] rounded-2xl p-6 space-y-4">
          <h2 className="text-base font-medium text-[#29272B]">Notification Preferences</h2>
          {[
            { key: 'notifyReactions' as const, label: 'Supportive reactions on my posts' },
            { key: 'notifyComments' as const, label: 'Comments and replies' },
            { key: 'notifyFollows' as const, label: 'New followers' },
            { key: 'notifyCommunity' as const, label: 'Community & safety updates' },
          ].map((pref) => (
            <label key={pref.key} className="flex items-center justify-between gap-4 cursor-pointer">
              <span className="text-sm text-[#29272B]">{pref.label}</span>
              <input
                type="checkbox"
                checked={Boolean(privateUser[pref.key])}
                onChange={(e) => updatePref(pref.key, e.target.checked)}
                className="w-4 h-4 accent-[#9F4E65]"
              />
            </label>
          ))}
        </section>

        {/* Account Deletion */}
        <section className="bg-[#FDF7F7] border border-[#E5B8B8] rounded-2xl p-6 space-y-3">
          <h2 className="text-base font-medium text-[#8C3737]">Delete Account</h2>
          <p className="text-xs text-[#6B6770] leading-relaxed">
            Permanently remove your profile, username reservation, and private settings from OPEN FEELING.
          </p>
          <button
            type="button"
            onClick={() => setDeleteConfirmOpen(true)}
            className="px-4 py-2 rounded-xl bg-[#A84848] text-[#FCFBFA] text-xs font-medium cursor-pointer"
          >
            Delete My Account
          </button>
        </section>
      </div>

      <Modal
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        title="Delete your account?"
        subtitle="This action cannot be undone."
        maxWidthClass="max-w-sm"
      >
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={() => setDeleteConfirmOpen(false)}
            className="px-4 py-2 rounded-xl text-sm text-[#6B6770] cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={deleting}
            onClick={async () => {
              setDeleting(true);
              try {
                await deleteAccount();
              } finally {
                setDeleting(false);
              }
            }}
            className="px-4 py-2 rounded-xl bg-[#A84848] text-[#FCFBFA] text-sm font-medium cursor-pointer"
          >
            {deleting ? 'Deleting...' : 'Confirm Delete'}
          </button>
        </div>
      </Modal>
    </AppShell>
  );
}
