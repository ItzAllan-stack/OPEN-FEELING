import React, { useRef, useState } from 'react';
import { ArrowLeft, ImagePlus } from 'lucide-react';
import { AppShell } from '../components/AppShell.tsx';
import { Modal } from '../components/Modal.tsx';
import { CURATED_AVATARS } from '../constants/emotions.ts';
import { useApp } from '../context/AppContext.tsx';
import { updatePublicProfile } from '../services/firestoreService.ts';
import {
  compressGalleryImageToAvatar,
  isSafeAvatarUrl,
} from '../utils/date.ts';

const GALLERY_PERMISSION_KEY = 'open_feeling_gallery_permission';

export function EditProfilePage() {
  const { publicUser, refreshUserProfile, navigate, showToast } = useApp();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [displayName, setDisplayName] = useState(publicUser?.displayName || '');
  const [username, setUsername] = useState(publicUser?.username || '');
  const [bio, setBio] = useState(publicUser?.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(
    publicUser?.avatarUrl || CURATED_AVATARS[0]
  );
  const [isPrivateProfile, setIsPrivateProfile] = useState(
    Boolean(publicUser?.isPrivateProfile)
  );
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [permissionModalOpen, setPermissionModalOpen] = useState(false);
  const [galleryPermissionGranted, setGalleryPermissionGranted] = useState(() => {
    try {
      return localStorage.getItem(GALLERY_PERMISSION_KEY) === 'granted';
    } catch {
      return false;
    }
  });

  if (!publicUser) {
    return (
      <AppShell>
        <div className="bg-[#F8F6F3] border border-[#EAE4DD] rounded-2xl p-8 text-center">
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="px-4 py-2 rounded-xl bg-[#29272B] text-[#FCFBFA] text-xs font-medium cursor-pointer"
          >
            Sign In to Edit Profile
          </button>
        </div>
      </AppShell>
    );
  }

  const handleGalleryButtonClick = () => {
    if (galleryPermissionGranted) {
      fileInputRef.current?.click();
      return;
    }
    setPermissionModalOpen(true);
  };

  const handleAllowGalleryAccess = () => {
    setGalleryPermissionGranted(true);
    try {
      localStorage.setItem(GALLERY_PERMISSION_KEY, 'granted');
    } catch {
      // Ignore storage errors
    }
    setPermissionModalOpen(false);
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setUploadingPhoto(true);
    try {
      const compressedDataUrl = await compressGalleryImageToAvatar(file);
      setAvatarUrl(compressedDataUrl);
      showToast('Photo selected. Click Save Changes to update your profile.', 'success');
    } catch (err: unknown) {
      showToast(
        err instanceof Error ? err.message : 'Could not load photo from gallery.',
        'error'
      );
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (avatarUrl.trim() && !isSafeAvatarUrl(avatarUrl.trim())) {
      showToast(
        'Please select a photo from your gallery, choose an avatar, or provide a valid https:// image URL.',
        'error'
      );
      return;
    }

    setSaving(true);
    try {
      await updatePublicProfile(publicUser.uid, publicUser.username, {
        displayName,
        username,
        bio,
        avatarUrl,
        isPrivateProfile,
      });
      await refreshUserProfile();
      showToast('Profile updated.', 'success');
      navigate('/profile');
    } catch (err: unknown) {
      showToast(
        err instanceof Error ? err.message : 'Could not update profile.',
        'error'
      );
    } finally {
      setSaving(false);
    }
  };

  const isUploadedPhoto = avatarUrl.startsWith('data:image/');

  return (
    <AppShell>
      <div className="max-w-2xl space-y-6">
        <button
          type="button"
          onClick={() => navigate('/profile')}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#6B6770] hover:text-[#29272B] cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to profile</span>
        </button>

        <h1 className="text-2xl sm:text-3xl font-display font-medium text-[#29272B]">
          Edit Profile
        </h1>

        <form
          onSubmit={handleSave}
          className="bg-[#FCFBFA] border border-[#EAE4DD] rounded-2xl p-6 space-y-5"
        >
          <div className="space-y-3">
            <label className="block text-xs font-medium text-[#29272B]">
              Choose Profile Image
            </label>

            {/* Current Avatar Preview + Device Photo Gallery Upload */}
            <div className="flex flex-wrap items-center gap-4 p-3.5 rounded-xl bg-[#F8F6F3] border border-[#EAE4DD]">
              {avatarUrl && isSafeAvatarUrl(avatarUrl) ? (
                <img
                  src={avatarUrl}
                  alt={displayName || 'Current profile picture'}
                  referrerPolicy="no-referrer"
                  className="w-16 h-16 rounded-full object-cover bg-[#EEE8E1] border border-[#EAE4DD] shrink-0"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-[#F4DCE3] flex items-center justify-center text-xl font-display text-[#29272B] shrink-0">
                  {(displayName || publicUser.displayName).slice(0, 1).toUpperCase()}
                </div>
              )}

              <div className="flex-1 min-w-[200px] space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelected}
                    className="hidden"
                    aria-label="Select profile picture from device photo gallery"
                  />
                  <button
                    type="button"
                    onClick={handleGalleryButtonClick}
                    disabled={uploadingPhoto}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#29272B] text-[#FCFBFA] text-xs font-medium hover:bg-[#3E3B41] disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    <ImagePlus className="w-3.5 h-3.5" />
                    <span>
                      {uploadingPhoto ? 'Preparing photo...' : 'Upload from Photo Gallery'}
                    </span>
                  </button>

                  {isUploadedPhoto && (
                    <button
                      type="button"
                      onClick={() => setAvatarUrl(CURATED_AVATARS[0])}
                      className="px-2.5 py-1.5 rounded-lg text-xs text-[#6B6770] hover:text-[#29272B] cursor-pointer"
                    >
                      Remove photo
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-[#6B6770]">
                  {isUploadedPhoto
                    ? 'Photo selected from your device gallery.'
                    : 'Choose a photo from your device gallery, or pick an option below.'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {CURATED_AVATARS.map((url) => (
                <button
                  key={url}
                  type="button"
                  onClick={() => setAvatarUrl(url)}
                  className={`w-14 h-14 rounded-full overflow-hidden border-2 transition-all cursor-pointer ${
                    avatarUrl === url
                      ? 'border-[#29272B] scale-105'
                      : 'border-[#EAE4DD] opacity-80 hover:opacity-100'
                  }`}
                >
                  <img
                    src={url}
                    alt="Profile option"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
            <input
              type="text"
              value={isUploadedPhoto ? '' : avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder={
                isUploadedPhoto
                  ? 'Gallery photo selected (or paste an https:// image URL to replace)'
                  : 'Or paste an https:// image URL'
              }
              className="w-full px-3.5 py-2 rounded-xl bg-[#F8F6F3] border border-[#EAE4DD] text-xs text-[#29272B]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#29272B] mb-1">
                Display Name
              </label>
              <input
                type="text"
                required
                maxLength={80}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8F6F3] border border-[#EAE4DD] text-sm text-[#29272B]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#29272B] mb-1">
                Username
              </label>
              <input
                type="text"
                required
                minLength={3}
                maxLength={32}
                value={username}
                onChange={(e) =>
                  setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8F6F3] border border-[#EAE4DD] text-sm text-[#29272B]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#29272B] mb-1">
              Biography
            </label>
            <textarea
              rows={4}
              maxLength={400}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Share a little about yourself, what brings you comfort, or what you're navigating..."
              className="w-full p-3.5 rounded-xl bg-[#F8F6F3] border border-[#EAE4DD] text-sm text-[#29272B]"
            />
          </div>

          <label className="flex items-start gap-2.5 text-xs text-[#6B6770] cursor-pointer">
            <input
              type="checkbox"
              checked={isPrivateProfile}
              onChange={(e) => setIsPrivateProfile(e.target.checked)}
              className="mt-0.5 rounded border-[#D5CCC3]"
            />
            <span>
              Keep my profile page private (other users won&apos;t see your public posts list when visiting your profile).
            </span>
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => navigate('/profile')}
              className="px-4 py-2 rounded-xl text-sm text-[#6B6770] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || uploadingPhoto}
              className="px-5 py-2.5 rounded-xl bg-[#29272B] text-[#FCFBFA] text-sm font-medium disabled:opacity-50 cursor-pointer"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      <Modal
        open={permissionModalOpen}
        onClose={() => setPermissionModalOpen(false)}
        title="Allow Photo Gallery Access"
        subtitle="OPEN FEELING would like to access your device's photo gallery to select a profile picture."
        maxWidthClass="max-w-sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-[#6B6770] leading-relaxed">
            You can choose a single photo from your gallery to set as your profile picture. Your selection stays private until you save your profile.
          </p>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setPermissionModalOpen(false)}
              className="px-4 py-2 rounded-xl text-sm text-[#6B6770] hover:text-[#29272B] cursor-pointer"
            >
              Not Now
            </button>
            <button
              type="button"
              onClick={handleAllowGalleryAccess}
              className="px-4 py-2 rounded-xl bg-[#29272B] text-[#FCFBFA] text-sm font-medium cursor-pointer"
            >
              Allow &amp; Choose Photo
            </button>
          </div>
        </div>
      </Modal>
    </AppShell>
  );
}
