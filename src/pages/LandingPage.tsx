import React from 'react';
import { EyeOff, HeartHandshake, Lock, MessageSquareHeart, ShieldCheck, Sparkles } from 'lucide-react';
import { BrandLogo } from '../components/BrandLogo.tsx';
import { PostCard } from '../components/PostCard.tsx';
import { SakuraPetals } from '../components/SakuraPetals.tsx';
import { useApp } from '../context/AppContext.tsx';

export function LandingPage() {
  const {
    firebaseUser,
    publicUser,
    posts,
    sakuraEnabled,
    setSakuraLocal,
    navigate,
  } = useApp();

  const featuredPosts = posts.filter((p) => p.visibility !== 'private').slice(0, 2);

  return (
    <div className="bg-[#FCFBFA] text-[#29272B]">
      {/* Hero Section with subtle optional cherry blossom petals */}
      <section className="relative overflow-hidden border-b border-[#EAE4DD]">
        <SakuraPetals enabled={sakuraEnabled} />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-14 sm:py-20 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
            <div className="lg:col-span-7 flex flex-col justify-center space-y-6">
              <p className="text-xs font-medium tracking-wide text-[#9F4E65]">
                Express Freely. Feel Lighter.
              </p>

              <h1
                className="font-display font-medium text-[#29272B] tracking-tight leading-[1.1] text-balance"
                style={{ fontSize: 'clamp(2.25rem, 4.2vw, 3.75rem)' }}
              >
                Your Feelings Deserve to Be Heard.
              </h1>

              <p className="text-base sm:text-lg text-[#77727A] leading-relaxed max-w-xl">
                Sometimes we have so much to say but nowhere to say it. OPEN FELLING gives you a space to express your thoughts, share your experiences, and connect with people who understand. No judgement. Just a place to be yourself.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() =>
                    navigate(firebaseUser && publicUser ? '/create' : '/signup')
                  }
                  className="px-6 py-3 rounded-xl bg-[#29272B] text-[#FCFBFA] text-sm font-medium hover:bg-[#3E3B41] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Share Your Feelings
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/explore')}
                  className="px-6 py-3 rounded-xl bg-[#F8F6F3] border border-[#EAE4DD] text-[#29272B] text-sm font-medium hover:bg-[#EEE8E1] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Explore Community
                </button>
              </div>

              <div className="pt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[#77727A]">
                <span>Public or Anonymous</span>
                <span aria-hidden="true">·</span>
                <span>Private Personal Space</span>
                <span aria-hidden="true">·</span>
                <button
                  type="button"
                  onClick={() => setSakuraLocal(!sakuraEnabled)}
                  className="underline underline-offset-4 hover:text-[#29272B] cursor-pointer"
                >
                  {sakuraEnabled ? 'Pause drifting petals' : 'Show gentle petals'}
                </button>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="h-full min-h-[300px] lg:min-h-[420px] rounded-2xl overflow-hidden border border-[#EAE4DD] bg-[#F8F6F3]">
                <img
                  src="/src/assets/images/hero_open_felling_1795329057276.jpg"
                  alt="Quiet sunlit reading nook with open journal and warm tea"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Philosophy Quote */}
      <section className="border-b border-[#EAE4DD] bg-[#F8F6F3]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 text-center space-y-3">
          <p className="font-display italic text-xl sm:text-2xl text-[#29272B] leading-relaxed text-balance">
            &ldquo;Sometimes people don&apos;t need advice. Sometimes they simply need a place to express what they feel and someone willing to listen.&rdquo;
          </p>
          <p className="text-xs text-[#77727A]">The central philosophy of OPEN FELLING</p>
        </div>
      </section>

      {/* 1. How OPEN FELLING Works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20 border-b border-[#EAE4DD]">
        <div className="max-w-2xl space-y-2 mb-10">
          <h2 className="text-2xl sm:text-3xl font-display font-medium text-[#29272B]">
            How OPEN FELLING Works
          </h2>
          <p className="text-sm sm:text-base text-[#77727A]">
            Designed for honesty and warmth—never for chasing popularity or follower metrics.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-2">
            <p className="text-xs font-medium text-[#9F4E65]">01. Express freely</p>
            <h3 className="text-lg font-display font-medium text-[#29272B]">
              Write what is really on your heart
            </h3>
            <p className="text-sm text-[#77727A] leading-relaxed">
              Share happiness, loneliness, late-night worries, love, memories, or everyday thoughts in your own words.
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-medium text-[#9F4E65]">02. Choose your comfort</p>
            <h3 className="text-lg font-display font-medium text-[#29272B]">
              Public, Anonymous, or Private
            </h3>
            <p className="text-sm text-[#77727A] leading-relaxed">
              Publish openly with your profile, hide your identity behind Anonymous, or keep entries strictly inside My Personal Space.
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-medium text-[#9F4E65]">03. Feel lighter</p>
            <h3 className="text-lg font-display font-medium text-[#29272B]">
              Gentle listening over loud metrics
            </h3>
            <p className="text-sm text-[#77727A] leading-relaxed">
              Receive thoughtful reactions like &ldquo;I Understand&rdquo; and &ldquo;You&apos;re Not Alone&rdquo; from people who genuinely relate.
            </p>
          </div>
        </div>
      </section>

      {/* 2. Share What You Feel & 3. Read Other People's Stories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20 border-b border-[#EAE4DD]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-5 space-y-6">
            <div className="space-y-3">
              <h2 className="text-2xl sm:text-3xl font-display font-medium text-[#29272B]">
                Share What You Feel. Read Stories That Resonate.
              </h2>
              <p className="text-sm sm:text-base text-[#77727A] leading-relaxed">
                Every emotion has room here—from peaceful mornings and quiet gratitude to uncertainty and heavy nights. Reading someone else&apos;s honest reflection often reminds us that our feelings make sense.
              </p>
            </div>

            <div className="rounded-2xl overflow-hidden border border-[#EAE4DD] bg-[#F8F6F3]">
              <img
                src="/src/assets/images/story_journal_calm_1795329057247.jpg"
                alt="Open cream notebook and brass pen on linen cloth"
                referrerPolicy="no-referrer"
                className="w-full aspect-[4/3] object-cover"
              />
            </div>

            <button
              type="button"
              onClick={() => navigate('/explore')}
              className="text-sm font-medium text-[#9F4E65] hover:underline cursor-pointer"
            >
              Read more stories in Explore &rarr;
            </button>
          </div>

          <div className="lg:col-span-7 space-y-4">
            {featuredPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </div>
      </section>

      {/* 4. Connect Through Experiences, 5. Express Without Judgement, 6. Your Privacy Matters */}
      <section className="bg-[#F8F6F3] border-b border-[#EAE4DD]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#FCFBFA] border border-[#EAE4DD] rounded-2xl p-6 space-y-3">
            <MessageSquareHeart className="w-5 h-5 text-[#9F4E65]" />
            <h3 className="text-lg font-display font-medium text-[#29272B]">
              Connect Through Experiences
            </h3>
            <p className="text-sm text-[#77727A] leading-relaxed">
              Join topic-based spaces like Student Life, Late Night Thoughts, Personal Growth, and Relationships to meet people walking similar roads.
            </p>
          </div>

          <div className="bg-[#FCFBFA] border border-[#EAE4DD] rounded-2xl p-6 space-y-3">
            <HeartHandshake className="w-5 h-5 text-[#9F4E65]" />
            <h3 className="text-lg font-display font-medium text-[#29272B]">
              Express Without Judgement
            </h3>
            <p className="text-sm text-[#77727A] leading-relaxed">
              No leaderboards, no viral clout, and no pressure to perform perfection. Just sincere human empathy and respectful guidelines.
            </p>
          </div>

          <div className="bg-[#FCFBFA] border border-[#EAE4DD] rounded-2xl p-6 space-y-3">
            <ShieldCheck className="w-5 h-5 text-[#9F4E65]" />
            <h3 className="text-lg font-display font-medium text-[#29272B]">
              Your Privacy Matters
            </h3>
            <p className="text-sm text-[#77727A] leading-relaxed">
              Anonymous posts isolate your public identity at the database level, and My Personal Space keeps private journal entries strictly visible only to you.
            </p>
          </div>
        </div>
      </section>

      {/* 7. Join the Community */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <div className="bg-[#EEE8E1]/65 border border-[#EAE4DD] rounded-2xl p-8 sm:p-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-4">
            <h2 className="text-2xl sm:text-3xl font-display font-medium text-[#29272B] text-balance">
              Every feeling deserves a space. Take a breath and share when you&apos;re ready.
            </h2>
            <p className="text-sm sm:text-base text-[#77727A] leading-relaxed">
              Create your profile in under a minute, or keep a quiet private reflection space just for yourself.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => navigate(firebaseUser && publicUser ? '/home' : '/signup')}
                className="px-5 py-2.5 rounded-xl bg-[#29272B] text-[#FCFBFA] text-sm font-medium hover:bg-[#3E3B41] transition-colors cursor-pointer"
              >
                {firebaseUser && publicUser ? 'Open My Dashboard' : 'Join the Community'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/guidelines')}
                className="px-5 py-2.5 rounded-xl bg-[#FCFBFA] border border-[#EAE4DD] text-[#29272B] text-sm font-medium hover:bg-[#F8F6F3] transition-colors cursor-pointer"
              >
                Read Community Guidelines
              </button>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="rounded-2xl overflow-hidden border border-[#EAE4DD] bg-[#FCFBFA]">
              <img
                src="/src/assets/images/story_community_warmth_1795329056419.jpg"
                alt="Two stoneware mugs on a warm sunlit wooden table"
                referrerPolicy="no-referrer"
                className="w-full aspect-[4/3] object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Quiet Footer */}
      <footer className="border-t border-[#EAE4DD] bg-[#FCFBFA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-1">
            <BrandLogo size="sm" onClick={() => navigate('/')} />
            <p className="text-xs text-[#77727A]">
              Express Freely. Feel Lighter.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs text-[#77727A]">
            <button type="button" onClick={() => navigate('/explore')} className="hover:text-[#29272B] cursor-pointer">
              Explore
            </button>
            <button type="button" onClick={() => navigate('/communities')} className="hover:text-[#29272B] cursor-pointer">
              Communities
            </button>
            <button type="button" onClick={() => navigate('/guidelines')} className="hover:text-[#29272B] cursor-pointer">
              Community Guidelines
            </button>
            <button type="button" onClick={() => navigate('/privacy')} className="hover:text-[#29272B] cursor-pointer">
              Privacy
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Keep unused icon imports cleanly omitted — notice EyeOff, Lock, Sparkles aren't needed here; let's keep imports minimal!
void EyeOff;
void Lock;
void Sparkles;
