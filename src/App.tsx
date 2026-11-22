import React from 'react';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import { Header } from './components/Header.tsx';
import { MobileNavigation } from './components/MobileNavigation.tsx';
import { ToastContainer } from './components/Toast.tsx';
import { AppProvider, useApp } from './context/AppContext.tsx';
import { AuthPage } from './pages/AuthPage.tsx';
import { CommunitiesPage } from './pages/CommunitiesPage.tsx';
import { CommunityDetailsPage } from './pages/CommunityDetailsPage.tsx';
import { CreatePostPage } from './pages/CreatePostPage.tsx';
import { EditProfilePage } from './pages/EditProfilePage.tsx';
import { ExplorePage } from './pages/ExplorePage.tsx';
import { GuidelinesPage } from './pages/GuidelinesPage.tsx';
import { HomeFeedPage } from './pages/HomeFeedPage.tsx';
import { LandingPage } from './pages/LandingPage.tsx';
import { ModerationPage } from './pages/ModerationPage.tsx';
import { NotificationsPage } from './pages/NotificationsPage.tsx';
import { PersonalJournalPage } from './pages/PersonalJournalPage.tsx';
import { PostDetailsPage } from './pages/PostDetailsPage.tsx';
import { PrivacySettingsPage } from './pages/PrivacySettingsPage.tsx';
import { ProfilePage } from './pages/ProfilePage.tsx';
import { SavedPostsPage } from './pages/SavedPostsPage.tsx';
import { SettingsPage } from './pages/SettingsPage.tsx';

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

    return <LandingPage />;
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FCFBFA] text-[#29272B]">
      <Header />
      <div className="flex-1">{renderPage()}</div>
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
