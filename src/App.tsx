import React from 'react';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import { Header } from './components/Header.tsx';
import { MobileNavigation } from './components/MobileNavigation.tsx';
import { ToastContainer } from './components/Toast.tsx';
import { AppProvider, useApp } from './context/AppContext.tsx';

// Pages are loaded on demand; each page module exports its component by name.
const AuthPage = React.lazy(() => import('./pages/AuthPage.tsx').then((m) => ({ default: m.AuthPage })));
const CommunitiesPage = React.lazy(() => import('./pages/CommunitiesPage.tsx').then((m) => ({ default: m.CommunitiesPage })));
const CommunityDetailsPage = React.lazy(() => import('./pages/CommunityDetailsPage.tsx').then((m) => ({ default: m.CommunityDetailsPage })));
const CreatePostPage = React.lazy(() => import('./pages/CreatePostPage.tsx').then((m) => ({ default: m.CreatePostPage })));
const EditProfilePage = React.lazy(() => import('./pages/EditProfilePage.tsx').then((m) => ({ default: m.EditProfilePage })));
const ExplorePage = React.lazy(() => import('./pages/ExplorePage.tsx').then((m) => ({ default: m.ExplorePage })));
const GuidelinesPage = React.lazy(() => import('./pages/GuidelinesPage.tsx').then((m) => ({ default: m.GuidelinesPage })));
const HomeFeedPage = React.lazy(() => import('./pages/HomeFeedPage.tsx').then((m) => ({ default: m.HomeFeedPage })));
const LandingPage = React.lazy(() => import('./pages/LandingPage.tsx').then((m) => ({ default: m.LandingPage })));
const ModerationPage = React.lazy(() => import('./pages/ModerationPage.tsx').then((m) => ({ default: m.ModerationPage })));
const NotificationsPage = React.lazy(() => import('./pages/NotificationsPage.tsx').then((m) => ({ default: m.NotificationsPage })));
const PersonalJournalPage = React.lazy(() => import('./pages/PersonalJournalPage.tsx').then((m) => ({ default: m.PersonalJournalPage })));
const PostDetailsPage = React.lazy(() => import('./pages/PostDetailsPage.tsx').then((m) => ({ default: m.PostDetailsPage })));
const PrivacySettingsPage = React.lazy(() => import('./pages/PrivacySettingsPage.tsx').then((m) => ({ default: m.PrivacySettingsPage })));
const ProfilePage = React.lazy(() => import('./pages/ProfilePage.tsx').then((m) => ({ default: m.ProfilePage })));
const SavedPostsPage = React.lazy(() => import('./pages/SavedPostsPage.tsx').then((m) => ({ default: m.SavedPostsPage })));
const SettingsPage = React.lazy(() => import('./pages/SettingsPage.tsx').then((m) => ({ default: m.SettingsPage })));

function NotFoundPage() {
  const { navigate } = useApp();
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 p-6 text-center">
      <p className="font-display text-5xl text-[#E9A9B8]">404</p>
      <p className="text-sm text-[#77727A]">We couldn't find that page. Let's get you back to a quieter place.</p>
      <button
        type="button"
        onClick={() => navigate('/')}
        className="rounded-full bg-[#9F4E65] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#8A4358] cursor-pointer"
      >
        Back home
      </button>
    </div>
  );
}

function AppRouter() {
  const { currentPath, authLoading, firebaseUser, needsOnboarding } = useApp();

  const renderPage = () => {
    if (authLoading) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center p-6">
          <p className="text-sm text-[#77727A]">Preparing your space...</p>
        </div>
      );
    }

    if (firebaseUser && needsOnboarding && currentPath !== '/guidelines' && currentPath !== '/privacy') {
      return <AuthPage initialMode="onboarding" />;
    }

    if (currentPath === '/' || currentPath === '') return <LandingPage />;
    if (currentPath === '/signup') return <AuthPage initialMode="signup" />;
    if (currentPath === '/login') return <AuthPage initialMode="login" />;
    if (currentPath === '/forgot-password') return <AuthPage initialMode="forgot" />;
    if (currentPath === '/home') return <HomeFeedPage />;
    if (currentPath === '/explore') return <ExplorePage />;
    if (currentPath === '/create') return <CreatePostPage />;
    if (currentPath.startsWith('/post/')) {
      return <PostDetailsPage postId={currentPath.slice('/post/'.length)} />;
    }
    if (currentPath === '/communities') return <CommunitiesPage />;
    if (currentPath.startsWith('/community/')) {
      return <CommunityDetailsPage communityId={currentPath.slice('/community/'.length)} />;
    }
    if (currentPath === '/notifications') return <NotificationsPage />;
    if (currentPath === '/profile/edit') return <EditProfilePage />;
    if (currentPath === '/profile') return <ProfilePage />;
    if (currentPath.startsWith('/profile/')) {
      return <ProfilePage uid={currentPath.slice('/profile/'.length)} />;
    }
    if (currentPath === '/saved') return <SavedPostsPage />;
    if (currentPath === '/journal') return <PersonalJournalPage />;
    if (currentPath === '/settings') return <SettingsPage />;
    if (currentPath === '/privacy') return <PrivacySettingsPage />;
    if (currentPath === '/guidelines') return <GuidelinesPage />;
    if (currentPath === '/moderation') return <ModerationPage />;

    return <NotFoundPage />;
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FCFBFA] text-[#29272B]">
      <Header />
      <div className="flex-1">
        <React.Suspense
          fallback={
            <div className="min-h-[60vh] flex items-center justify-center p-6">
              <p className="text-sm text-[#77727A]">Opening your space...</p>
            </div>
          }
        >
          {renderPage()}
        </React.Suspense>
      </div>
      <MobileNavigation />
      <ToastContainer />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <AppRouter />
      </AppProvider>
    </ErrorBoundary>
  );
}
