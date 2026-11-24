import React from 'react';
import { AppShell } from '../components/AppShell.tsx';

export function GuidelinesPage() {
  return (
    <AppShell>
      <div className="max-w-3xl space-y-8">
        <div className="space-y-2">
          <p className="text-xs font-medium text-[#9F4E65]">OPEN FEELING Standards</p>
          <h1 className="text-2xl sm:text-3xl font-display font-medium text-[#29272B]">
            Community Guidelines &amp; Emotional Safety
          </h1>
          <p className="text-sm text-[#6B6770] leading-relaxed">
            OPEN FEELING exists so people can express what they truly feel without fear of judgement, ridicule, or popularity contests.
          </p>
        </div>

        <div className="bg-[#FCFBFA] border border-[#EAE4DD] rounded-2xl p-6 space-y-5 text-sm text-[#29272B]/90 leading-relaxed">
          <section className="space-y-1.5">
            <h2 className="text-lg font-display font-medium text-[#29272B]">
              1. Listen before advising
            </h2>
            <p className="text-[#6B6770]">
              Sometimes people do not want a checklist or correction—they simply need to know someone heard them. Offer warmth, empathy, and patience.
            </p>
          </section>

          <section className="space-y-1.5 pt-4 border-t border-[#EAE4DD]">
            <h2 className="text-lg font-display font-medium text-[#29272B]">
              2. Zero judgement, harassment, or shaming
            </h2>
            <p className="text-[#6B6770]">
              Mockery, hate speech, bullying, doxxing, or dismissing someone else&apos;s pain will result in content removal and account restrictions.
            </p>
          </section>

          <section className="space-y-1.5 pt-4 border-t border-[#EAE4DD]">
            <h2 className="text-lg font-display font-medium text-[#29272B]">
              3. Honest boundaries on anonymity
            </h2>
            <p className="text-[#6B6770]">
              Anonymous posts hide your profile from the public community. However, ownership records are securely retained so moderators can respond to safety reports. Platform anonymity does not guarantee absolute anonymity.
            </p>
          </section>

          <section className="space-y-1.5 pt-4 border-t border-[#EAE4DD]">
            <h2 className="text-lg font-display font-medium text-[#29272B]">
              4. Serious distress &amp; professional care
            </h2>
            <p className="text-[#6B6770]">
              OPEN FEELING is a peer community for emotional expression—not a medical service, therapy provider, or crisis hotline. If you or someone you know is in immediate danger or experiencing overwhelming distress, please reach out to local emergency services or a qualified mental health professional right away (for example, call or text 988 in the US/Canada, or contact your local crisis helpline).
            </p>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
