import { useEffect, useState } from 'react';
import { Rocket, UserPlus, Volume2, VolumeX } from 'lucide-react';
import heroBackdrop from '../assets/images/hero_academy_backdrop_1794674549062.jpg';
import { TraineeProfile } from '../types/game';

interface WelcomeScreenProps {
  existingProfile: TraineeProfile | null;
  isMuted: boolean;
  onToggleMute: () => void;
  onStartNew: () => void;
  onResume: () => void;
}

export function WelcomeScreen({
  existingProfile,
  isMuted,
  onToggleMute,
  onStartNew,
  onResume,
}: WelcomeScreenProps) {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (existingProfile) {
          onResume();
        } else {
          onStartNew();
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [existingProfile, onResume, onStartNew]);

  return (
    <div className="relative flex min-h-screen w-full flex-col justify-between overflow-hidden bg-[#060913]">
      {/* Full-viewport atmospheric backdrop */}
      {!imgError ? (
        <img
          src={heroBackdrop}
          alt="Orbital Space Station above Earth"
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
          className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center opacity-85"
        />
      ) : (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#060913] via-[#0F1E3D] to-[#1E1B4B]"
        />
      )}

      {/* Measured obsidian contrast scrim preserving right-side station art */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#060913] via-[#060913]/88 to-[#060913]/25"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#060913] via-transparent to-[#060913]/65"
      />

      {/* Top minimal utility bar */}
      <header className="relative z-10 flex items-center justify-between px-6 py-5 sm:px-10">
        <div className="flex items-center gap-3">
          <svg
            width="36"
            height="36"
            viewBox="0 0 40 40"
            fill="none"
            aria-hidden="true"
            className="shrink-0"
          >
            <circle cx="20" cy="20" r="18" stroke="#22D3EE" strokeWidth="1.75" fill="#080D1A" />
            <path d="M20 7L24.5 23L20 20.5L15.5 23L20 7Z" fill="#22D3EE" />
            <ellipse
              cx="20"
              cy="22"
              rx="13"
              ry="4.5"
              transform="rotate(-18 20 22)"
              stroke="#8B5CF6"
              strokeWidth="1.5"
            />
            <circle cx="20" cy="30" r="2" fill="#F59E0B" />
          </svg>
          <div>
            <span className="font-display text-base font-bold tracking-wide text-white whitespace-nowrap">
              Junior Astronaut Academy
            </span>
            <span className="hidden sm:inline-block ml-3 font-mono text-[11px] text-slate-400">
              ASTRONOVA PROGRAM
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onToggleMute}
          aria-label={isMuted ? 'Unmute audio' : 'Mute audio'}
          className="inline-flex min-h-[42px] items-center gap-2 rounded-lg border border-slate-800 bg-[#0C1222]/90 px-3.5 py-2 text-xs font-medium text-slate-200 transition-colors hover:border-cyan-400/60 hover:text-white whitespace-nowrap shrink-0"
        >
          {isMuted ? (
            <VolumeX className="h-4 w-4 text-slate-400" />
          ) : (
            <Volume2 className="h-4 w-4 text-cyan-400" />
          )}
          <span>{isMuted ? 'Sound Off' : 'Sound On'}</span>
        </button>
      </header>

      {/* Main Title Lockup over calm left negative space */}
      <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 items-center px-6 py-8 sm:px-10">
        <div className="max-w-xl">
          <p className="mb-3 font-mono text-xs uppercase tracking-widest text-cyan-300">
            3D Open-World Space Simulation · 10 Worlds · Ages 8–15
          </p>

          <h1
            className="font-display text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl leading-[1.06]"
            style={{ textWrap: 'balance' }}
          >
            Explore Space Like a Real Astronaut
          </h1>

          <p className="mt-5 max-w-lg text-base leading-relaxed text-slate-300 sm:text-lg">
            Walk planetary terrain, pilot spacecraft through gas giants, solve real NASA science
            mysteries with ARIA AI, and master orbital flight and robotic simulators.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            {existingProfile ? (
              <>
                <button
                  type="button"
                  onClick={onResume}
                  className="inline-flex min-h-[48px] items-center gap-2.5 rounded-xl bg-cyan-400 px-6 py-3 text-base font-bold text-slate-950 transition-transform duration-150 hover:bg-cyan-300 active:scale-[0.98] whitespace-nowrap"
                >
                  <Rocket className="h-5 w-5" />
                  <span>Resume Training ({existingProfile.name})</span>
                </button>
                <button
                  type="button"
                  onClick={onStartNew}
                  className="inline-flex min-h-[48px] items-center gap-2 rounded-xl border border-slate-700 bg-[#0C1222]/90 px-5 py-3 text-sm font-semibold text-slate-100 transition-colors hover:border-cyan-400/60 hover:text-white whitespace-nowrap"
                >
                  <UserPlus className="h-4 w-4 text-cyan-400" />
                  <span>New Trainee</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={onStartNew}
                className="inline-flex min-h-[50px] items-center gap-2.5 rounded-xl bg-cyan-400 px-7 py-3.5 text-base font-bold text-slate-950 transition-transform duration-150 hover:bg-cyan-300 active:scale-[0.98] whitespace-nowrap"
              >
                <Rocket className="h-5 w-5" />
                <span>Start Training</span>
              </button>
            )}
          </div>
        </div>
      </main>

      {/* Hairline-divided capability strip + control hint footer */}
      <footer className="relative z-10 mx-auto w-full max-w-6xl px-6 pb-6 sm:px-10">
        <div className="grid grid-cols-1 gap-4 border-t border-slate-800/80 pt-4 sm:grid-cols-3">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-wider text-cyan-300">
              10 Worlds
            </div>
            <div className="mt-0.5 text-xs text-slate-300">
              Solid rocky terrain &amp; atmospheric gas giant flight
            </div>
          </div>
          <div>
            <div className="font-mono text-[11px] uppercase tracking-wider text-amber-300">
              6×6 Rover &amp; Craft
            </div>
            <div className="mt-0.5 text-xs text-slate-300">
              Drive surface rovers &amp; pilot 3D orbital spacecraft
            </div>
          </div>
          <div>
            <div className="font-mono text-[11px] uppercase tracking-wider text-emerald-300">
              NASA Science &amp; ARIA
            </div>
            <div className="mt-0.5 text-xs text-slate-300">
              Verified orbital telemetry &amp; adaptive science mentor
            </div>
          </div>
        </div>

        <p className="mt-4 text-[11px] font-mono text-slate-400">
          Enter / Space Start · Mouse, Keyboard, or Touch Controls · Local Profile Saved
        </p>
      </footer>
    </div>
  );
}
