import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  deleteUser,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  User,
} from 'firebase/auth';
import { CURATED_AVATARS, EMOTION_MAP, type EmotionMeta } from '../constants/emotions.ts';
import { STARTER_COMMUNITIES, STARTER_POSTS } from '../data/starterData.ts';
import { auth, googleAuthProvider } from '../lib/firebase.ts';
import { SAMPLE_CONTENT_ENABLED } from '../lib/features.ts';
import { getAmbientColor } from '../utils/ambientColor.ts';
import {
  checkIsAdmin,
  createUserProfile,
  deleteUserAccountData,
  getPrivateUser,
  getPublicUser,
  seedStarterCommunitiesIfNeeded,
  subscribeBlockedUsers,
  subscribeCommunities,
  subscribeFollowingUids,
  subscribeNotifications,
  subscribeOwnedAnonymousPostIds,
  subscribePublicPosts,
  subscribeSavedPostIds,
  subscribeUserMemberships,
  subscribeUserPrivatePosts,
} from '../services/firestoreService.ts';
import {
  AppNotification,
  BlockedUserEntry,
  Community,
  Post,
  PrivateUser,
  PublicUser,
  ToastMessage,
  ToastTone,
} from '../types/index.ts';

interface AppContextValue {
  firebaseUser: User | null;
  authLoading: boolean;
  needsOnboarding: boolean;
  publicUser: PublicUser | null;
  privateUser: PrivateUser | null;
  isAdmin: boolean;
  ambientColor: string | null;
  sakuraEnabled: boolean;
  setSakuraLocal: (enabled: boolean) => void;
  currentPath: string;
  navigate: (path: string) => void;
  posts: Post[];
  postsLoading: boolean;
  ownedAnonymousIds: string[];
  communities: Community[];
  joinedCommunityIds: string[];
  savedPostIds: string[];
  followingUids: string[];
  notifications: AppNotification[];
  unreadNotificationsCount: number;
  blockedEntries: BlockedUserEntry[];
  toasts: ToastMessage[];
  showToast: (message: string, tone?: ToastTone) => void;
  dismissToast: (id: string) => void;
  signInWithGoogle: () => Promise<void>;
  signUpWithEmail: (params: {
    email: string;
    password: string;
    displayName: string;
    username: string;
  }) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  completeOnboarding: (displayName: string, username: string) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [publicUser, setPublicUser] = useState<PublicUser | null>(null);
  const [privateUser, setPrivateUser] = useState<PrivateUser | null>(null);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [isAdminRegistry, setIsAdminRegistry] = useState(false);

  const [currentPath, setCurrentPath] = useState<string>(() => {
    return window.location.pathname || '/';
  });

  const [firestorePublicPosts, setFirestorePublicPosts] = useState<Post[]>([]);
  const [userPrivatePosts, setUserPrivatePosts] = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [ownedAnonymousIds, setOwnedAnonymousIds] = useState<string[]>([]);
  const [communities, setCommunities] = useState<Community[]>(
    SAMPLE_CONTENT_ENABLED ? STARTER_COMMUNITIES : []
  );
  const [joinedCommunityIds, setJoinedCommunityIds] = useState<string[]>([]);
  const [savedPostIds, setSavedPostIds] = useState<string[]>([]);
  const [followingUids, setFollowingUids] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [blockedEntries, setBlockedEntries] = useState<BlockedUserEntry[]>([]);
  const [sakuraLocalOverride, setSakuraLocalOverride] = useState<boolean>(true);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((message: string, tone: ToastTone = 'info') => {
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev, { id, message, tone }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4200);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const navigate = useCallback((path: string) => {
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
    }
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const onPop = () => setCurrentPath(window.location.pathname || '/');
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const loadProfiles = useCallback(async (user: User) => {
    const [pub, priv, registryAdmin] = await Promise.all([
      getPublicUser(user.uid),
      getPrivateUser(user.uid),
      checkIsAdmin(user.uid),
    ]);
    setPublicUser(pub);
    setPrivateUser(priv);
    setIsAdminRegistry(registryAdmin);
    setNeedsOnboarding(!pub);
    if (pub) {
      seedStarterCommunitiesIfNeeded(user.uid);
    }
  }, []);

  const refreshUserProfile = useCallback(async () => {
    if (!firebaseUser) return;
    await loadProfiles(firebaseUser);
  }, [firebaseUser, loadProfiles]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        try {
          await loadProfiles(user);
        } catch (err) {
          console.error('Error loading user profile:', err);
        }
      } else {
        setPublicUser(null);
        setPrivateUser(null);
        setIsAdminRegistry(false);
        setNeedsOnboarding(false);
        setUserPrivatePosts([]);
        setOwnedAnonymousIds([]);
        setJoinedCommunityIds([]);
        setSavedPostIds([]);
        setFollowingUids([]);
        setNotifications([]);
        setBlockedEntries([]);
      }
      setAuthLoading(false);
    });
    return () => unsub();
  }, [loadProfiles]);

  // Public feed & communities subscriptions (available to visitors too)
  useEffect(() => {
    setPostsLoading(true);
    const unsubPosts = subscribePublicPosts(
      (items) => {
        setFirestorePublicPosts(items);
        setPostsLoading(false);
      },
      () => {
        setPostsLoading(false);
      }
    );
    const unsubCommunities = subscribeCommunities((items) => {
      setCommunities(items);
    });
    return () => {
      unsubPosts();
      unsubCommunities();
    };
  }, []);

  // Authenticated user subscriptions
  useEffect(() => {
    if (!firebaseUser || !publicUser) return;
    const uid = firebaseUser.uid;
    const unsubs = [
      subscribeUserPrivatePosts(uid, setUserPrivatePosts),
      subscribeOwnedAnonymousPostIds(uid, setOwnedAnonymousIds),
      subscribeUserMemberships(uid, setJoinedCommunityIds),
      subscribeSavedPostIds(uid, setSavedPostIds),
      subscribeFollowingUids(uid, setFollowingUids),
      subscribeNotifications(uid, setNotifications),
      subscribeBlockedUsers(uid, setBlockedEntries),
    ];
    return () => unsubs.forEach((u) => u());
  }, [firebaseUser, publicUser]);

  const blockedSet = useMemo(() => {
    return new Set(blockedEntries.map((e) => e.blockedUid));
  }, [blockedEntries]);

  const posts = useMemo(() => {
    const map = new Map<string, Post>();
    for (const p of firestorePublicPosts) {
      if (!blockedSet.has(p.authorUid)) {
        map.set(p.id, p);
      }
    }
    for (const p of userPrivatePosts) {
      map.set(p.id, p);
    }
    if (map.size === 0) {
      return SAMPLE_CONTENT_ENABLED ? STARTER_POSTS : [];
    }
    return Array.from(map.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }, [firestorePublicPosts, userPrivatePosts, blockedSet]);

  // Ambient mood: blend a soft tint from the emotions in the signed-in user's
  // own recent reflections, so the whole app background shifts gently with mood.
  const recentAuthoredEmotions = useMemo(() => {
    const uid = privateUser?.uid;
    if (!uid) return [];
    return posts
      .filter((p) => p.authorUid === uid)
      .slice(0, 12)
      .map((p) => EMOTION_MAP[p.emotion])
      .filter((m): m is EmotionMeta => Boolean(m));
  }, [posts, privateUser]);

  const ambientColor = useMemo(() => getAmbientColor(recentAuthoredEmotions), [recentAuthoredEmotions]);

  const isAdmin = useMemo(() => {
    if (!firebaseUser) return false;
    // The admins registry (admins/{uid}) is the single source of admin
    // rights - mirroring the security rules. Verified email is required to
    // match isAdmin() in firestore.rules.
    return Boolean(firebaseUser.emailVerified) && isAdminRegistry;
  }, [firebaseUser, isAdminRegistry]);

  const sakuraEnabled = privateUser ? privateUser.sakuraEnabled : sakuraLocalOverride;

  const unreadNotificationsCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications]
  );

  const signInWithGoogle = useCallback(async () => {
    const cred = await signInWithPopup(auth, googleAuthProvider);
    const pub = await getPublicUser(cred.user.uid);
    if (!pub) {
      setNeedsOnboarding(true);
      showToast('Welcome to OPEN FEELING. Please finish choosing your username.', 'info');
    } else {
      showToast(`Welcome back, ${pub.displayName}.`, 'success');
      navigate('/home');
    }
  }, [navigate, showToast]);

  const signUpWithEmail = useCallback(
    async (params: {
      email: string;
      password: string;
      displayName: string;
      username: string;
    }) => {
      const cred = await createUserWithEmailAndPassword(auth, params.email, params.password);
      try {
        await sendEmailVerification(cred.user);
      } catch {
        // Verification email best-effort
      }
      const { publicUser: pub, privateUser: priv } = await createUserProfile({
        uid: cred.user.uid,
        email: params.email,
        displayName: params.displayName,
        username: params.username,
        avatarUrl: CURATED_AVATARS[0],
      });
      setPublicUser(pub);
      setPrivateUser(priv);
      setNeedsOnboarding(false);
      showToast('Account created. Welcome to OPEN FEELING.', 'success');
      navigate('/home');
    },
    [navigate, showToast]
  );

  const signInWithEmail = useCallback(
    async (email: string, password: string) => {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      await loadProfiles(cred.user);
      showToast('Welcome back to OPEN FEELING.', 'success');
      navigate('/home');
    },
    [loadProfiles, navigate, showToast]
  );

  const completeOnboarding = useCallback(
    async (displayName: string, username: string) => {
      if (!firebaseUser) throw new Error('Not signed in.');
      const avatar = CURATED_AVATARS[0];
      const { publicUser: pub, privateUser: priv } = await createUserProfile({
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName,
        username,
        avatarUrl: avatar,
      });
      setPublicUser(pub);
      setPrivateUser(priv);
      setNeedsOnboarding(false);
      showToast('Your OPEN FEELING space is ready.', 'success');
      navigate('/home');
    },
    [firebaseUser, navigate, showToast]
  );

  const requestPasswordReset = useCallback(async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  }, []);

  const resendVerificationEmail = useCallback(async () => {
    if (!firebaseUser) return;
    await sendEmailVerification(firebaseUser);
    showToast('Verification link sent to your email.', 'success');
  }, [firebaseUser, showToast]);

  const logout = useCallback(async () => {
    await signOut(auth);
    showToast('You have signed out safely.', 'info');
    navigate('/');
  }, [navigate, showToast]);

  const deleteAccount = useCallback(async () => {
    if (!firebaseUser || !publicUser) return;
    await deleteUserAccountData(firebaseUser.uid, publicUser.username);
    try {
      await deleteUser(firebaseUser);
    } catch {
      await signOut(auth);
    }
    showToast('Your account and profile have been deleted.', 'info');
    navigate('/');
  }, [firebaseUser, publicUser, navigate, showToast]);

  const value: AppContextValue = {
    firebaseUser,
    authLoading,
    needsOnboarding,
    publicUser,
    privateUser,
    isAdmin,
    ambientColor,
    sakuraEnabled,
    setSakuraLocal: setSakuraLocalOverride,
    currentPath,
    navigate,
    posts,
    postsLoading,
    ownedAnonymousIds,
    communities,
    joinedCommunityIds,
    savedPostIds,
    followingUids,
    notifications,
    unreadNotificationsCount,
    blockedEntries,
    toasts,
    showToast,
    dismissToast,
    signInWithGoogle,
    signUpWithEmail,
    signInWithEmail,
    completeOnboarding,
    requestPasswordReset,
    resendVerificationEmail,
    logout,
    deleteAccount,
    refreshUserProfile,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
