import { FormEvent, useState } from 'react';
import { ArrowLeft, Check, Rocket, ShieldCheck } from 'lucide-react';
import { ASTRONAUT_AVATARS } from '../data/nasaScienceData';
import { AvatarId } from '../types/game';

interface RegistrationScreenProps {
  onBack: () => void;
  onComplete: (name: string, avatarId: AvatarId) => void;
}

export function RegistrationScreen({ onBack, onComplete }: RegistrationScreenProps) {
  const [name, setName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState<AvatarId>('nova');
  const [error, setError] = useState('');
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});

  const activeAvatar =
    ASTRONAUT_AVATARS.find((a) => a.id === selectedAvatar) || ASTRONAUT_AVATARS[0];
  const displayCallsign = name.trim() || 'Astronaut Callsign';

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const cleaned = name.trim();
    if (cleaned.length < 2) {
      setError('Please enter an astronaut name (at least 2 letters).');
      return;
    }
    onComplete(cleaned, selectedAvatar);
  };

  return (
    <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-8 sm:px-6">
      <div className="w-full max-w-4xl">
        {/* Top Navigation Row */}
        <div className="mb-4 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex min-h-[40px] items-center gap-2 rounded-lg border border-slate-800 bg-[#0C1222] px-3.5 py-1.5 text-sm font-medium text-slate-300 transition-colors hover:border-cyan-400/60 hover:text-white whitespace-nowrap"
          >
            <ArrowLeft className="h-4 w-4 text-cyan-400" />
            <span>Back</span>
          </button>
          <span className="font-mono text-xs uppercase tracking-widest text-cyan-300">
            Cadet Flight Locker · Enrollment
          </span>
        </div>

        {/* Two-Column Split Panel */}
        <div className="grid grid-cols-1 overflow-hidden rounded-2xl border border-slate-800 bg-[#0C1222] shadow-2xl lg:grid-cols-12">
          {/* Left Column: Live Astronaut Flight Pass Preview */}
          <aside className="flex flex-col justify-between border-b border-slate-800 bg-[#080D1A] p-6 sm:p-8 lg:col-span-5 lg:border-r lg:border-b-0">
            <div>
              <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-slate-400">
                <span>Live Flight Pass</span>
                <span className="inline-flex items-center gap-1 text-emerald-400">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Cleared</span>
                </span>
              </div>

              <div className="mt-6 flex items-center gap-4">
                <div
                  className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-2 bg-slate-900"
                  style={{ borderColor: activeAvatar.accentColor }}
                >
                  {!brokenImages[activeAvatar.id] ? (
                    <img
                      src={activeAvatar.imageUrl}
                      alt={activeAvatar.name}
                      referrerPolicy="no-referrer"
                      onError={() =>
                        setBrokenImages((prev) => ({ ...prev, [activeAvatar.id]: true }))
                      }
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center font-display text-xl font-bold text-cyan-300">
                      {activeAvatar.name.slice(0, 2)}
                    </div>
                  )}
                </div>

                <div className="min-w-0">
                  <div className="font-mono text-[11px] uppercase tracking-wider text-cyan-300">
                    Level 1 · Space Cadet
                  </div>
                  <div className="mt-0.5 truncate font-display text-xl font-bold text-white">
                    {displayCallsign}
                  </div>
                  <div className="mt-0.5 text-xs text-slate-400">
                    {activeAvatar.name} · {activeAvatar.specialty}
                  </div>
                </div>
              </div>

              {/* Hairline-Divided Telemetry Assignment Specs */}
              <div className="mt-6 divide-y divide-slate-800/80 border-t border-b border-slate-800/80 text-xs">
                <div className="flex items-center justify-between py-2.5">
                  <span className="font-mono text-slate-400">Launch Site</span>
                  <span className="font-medium text-slate-100">Kennedy Space Center, Earth</span>
                </div>
                <div className="flex items-center justify-between py-2.5">
                  <span className="font-mono text-slate-400">Assigned Craft</span>
                  <span className="font-medium text-cyan-200">Orion Explorer</span>
                </div>
                <div className="flex items-center justify-between py-2.5">
                  <span className="font-mono text-slate-400">Suit Visor Accent</span>
                  <span className="inline-flex items-center gap-2 font-mono text-slate-200">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: activeAvatar.accentColor }}
                    />
                    <span>{activeAvatar.accentColor.toUpperCase()}</span>
                  </span>
                </div>
              </div>
            </div>

            <p className="mt-6 text-xs leading-relaxed text-slate-400">
              Your mission progress, 3D field samples, and earned badges are saved locally on this
              device.
            </p>
          </aside>

          {/* Right Column: Registration Form */}
          <div className="p-6 sm:p-8 lg:col-span-7">
            <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">
              Astronaut Registration
            </h1>
            <p className="mt-1.5 text-sm text-slate-300">
              Set your callsign and select your specialist suit to enter the 3D Space Academy.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-6">
              <div>
                <label
                  htmlFor="astronaut-name"
                  className="block font-mono text-xs uppercase tracking-wider text-slate-300"
                >
                  Astronaut Name
                </label>
                <input
                  id="astronaut-name"
                  type="text"
                  maxLength={24}
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="e.g. Maya, Leo, Sam"
                  autoFocus
                  className="mt-2 min-h-[48px] w-full rounded-xl border border-slate-700 bg-[#060913] px-4 py-3 text-base text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
                />
                {error && (
                  <p className="mt-2 text-xs font-medium text-rose-400" role="alert">
                    {error}
                  </p>
                )}
              </div>

              <div>
                <span className="block font-mono text-xs uppercase tracking-wider text-slate-300">
                  Select Specialist Suit
                </span>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  {ASTRONAUT_AVATARS.map((avatar) => {
                    const active = selectedAvatar === avatar.id;
                    return (
                      <button
                        key={avatar.id}
                        type="button"
                        onClick={() => setSelectedAvatar(avatar.id)}
                        aria-pressed={active}
                        className={`relative flex items-center gap-3 rounded-xl border p-3 text-left transition-colors duration-150 ${
                          active
                            ? 'border-cyan-400 bg-cyan-500/10'
                            : 'border-slate-800 bg-[#080D1A] hover:border-slate-600'
                        }`}
                      >
                        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-slate-700 bg-slate-900">
                          {!brokenImages[avatar.id] ? (
                            <img
                              src={avatar.imageUrl}
                              alt={avatar.name}
                              referrerPolicy="no-referrer"
                              onError={() =>
                                setBrokenImages((prev) => ({ ...prev, [avatar.id]: true }))
                              }
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center font-display text-sm font-bold text-cyan-300">
                              {avatar.name.slice(0, 2)}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-semibold text-white">
                            {avatar.name}
                          </div>
                          <div className="truncate text-xs text-slate-400">{avatar.specialty}</div>
                        </div>
                        {active && (
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan-400 text-slate-950">
                            <Check className="h-3 w-3 stroke-[3]" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-1">
                <button
                  type="submit"
                  className="inline-flex min-h-[50px] w-full items-center justify-center gap-2.5 rounded-xl bg-cyan-400 px-6 py-3 text-base font-bold text-slate-950 transition-transform duration-150 hover:bg-cyan-300 active:scale-[0.99] whitespace-nowrap"
                >
                  <Rocket className="h-5 w-5" />
                  <span>Launch 3D Space Academy</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
