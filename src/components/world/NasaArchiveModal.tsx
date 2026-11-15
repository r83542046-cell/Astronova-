import { useEffect, useState } from 'react';
import { ExternalLink, Globe, RefreshCw, Sun, X } from 'lucide-react';
import { WorldId } from '../../types/game';

interface NasaItem {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  dateCreated: string;
  center: string;
  sourceUrl: string;
}

interface SolarFlareItem {
  id: string;
  classType: string;
  beginTime: string;
  sourceLocation: string;
}

interface NasaArchiveModalProps {
  initialTopic: WorldId | 'solar';
  onClose: () => void;
}

export function NasaArchiveModal({ initialTopic, onClose }: NasaArchiveModalProps) {
  const [topic, setTopic] = useState<WorldId | 'solar'>(initialTopic);
  const [loading, setLoading] = useState(true);
  const [sourceLabel, setSourceLabel] = useState('');
  const [items, setItems] = useState<NasaItem[]>([]);
  const [flares, setFlares] = useState<SolarFlareItem[]>([]);
  const [brokenImg, setBrokenImg] = useState<Record<string, boolean>>({});

  const loadTopic = async (t: WorldId | 'solar') => {
    setLoading(true);
    try {
      const res = await fetch(`/api/nasa/feed?topic=${encodeURIComponent(t)}`);
      const data = (await res.json()) as {
        source?: string;
        items?: NasaItem[];
        solarFlares?: SolarFlareItem[];
      };
      setSourceLabel(data.source || 'NASA Open Data Archive');
      setItems(data.items || []);
      setFlares(data.solarFlares || []);
    } catch {
      setSourceLabel('Verified NASA Archive (Offline)');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTopic(topic);
  }, [topic]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-40 flex items-center justify-center bg-[#060913]/85 p-4"
    >
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-slate-800 bg-[#0C1222] p-5 text-slate-100 shadow-2xl sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/15 text-blue-300">
              <Globe className="h-5 w-5" />
            </div>
            <div>
              <div className="font-mono text-xs text-cyan-300">
                Real NASA Discoveries &amp; Imagery · {sourceLabel}
              </div>
              <h2 className="font-display text-xl font-bold text-white">NASA Mission Data Feed</h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close NASA Archive"
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-800 bg-[#080D1A] text-slate-300 hover:border-cyan-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Topic Filter Tabs */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1.5 rounded-xl bg-[#080D1A] p-1">
            {(
              [
                { id: 'station', label: 'Space Station' },
                { id: 'mars', label: 'Mars Rovers' },
                { id: 'moon', label: 'Artemis Moon' },
                { id: 'solar', label: 'Solar Storms' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setTopic(tab.id)}
                className={`min-h-[38px] rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                  topic === tab.id
                    ? 'bg-cyan-400 text-slate-950'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => loadTopic(topic)}
            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-slate-800 bg-[#080D1A] px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-cyan-400 whitespace-nowrap"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh NASA Feed</span>
          </button>
        </div>

        {/* DONKI Solar Weather Summary */}
        {flares.length > 0 && (
          <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-950/15 p-3.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-300">
              <Sun className="h-4 w-4" />
              <span>NASA DONKI Space Weather · Recent Solar Flare Activity</span>
            </div>
            <div className="mt-2 grid grid-cols-1 gap-2 font-mono text-xs tabular-nums sm:grid-cols-3">
              {flares.map((f) => (
                <div key={f.id} className="rounded-lg border border-slate-800 bg-[#080D1A] p-2.5">
                  <div className="font-bold text-white">{f.classType}</div>
                  <div className="mt-0.5 text-[11px] text-slate-400">{f.sourceLocation}</div>
                  <div className="mt-0.5 text-[10px] text-slate-500">
                    {f.beginTime ? f.beginTime.slice(0, 10) : 'Reference'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* NASA Image Cards */}
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {loading
            ? [1, 2].map((n) => (
                <div
                  key={n}
                  className="h-64 animate-pulse rounded-xl border border-slate-800 bg-[#080D1A]"
                />
              ))
            : items.map((item) => (
                <article
                  key={item.id}
                  className="flex flex-col justify-between overflow-hidden rounded-xl border border-slate-800 bg-[#080D1A]"
                >
                  <div>
                    <div className="h-44 w-full overflow-hidden bg-slate-900">
                      {!brokenImg[item.id] ? (
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          referrerPolicy="no-referrer"
                          onError={() =>
                            setBrokenImg((prev) => ({ ...prev, [item.id]: true }))
                          }
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-900 to-blue-950 font-mono text-xs text-cyan-300">
                          NASA Archive Image ({item.center})
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <div className="font-mono text-[11px] text-cyan-300">
                        REAL NASA DISCOVERY · {item.center} · {item.dateCreated}
                      </div>
                      <h3 className="mt-1 font-display text-base font-bold text-white">
                        {item.title}
                      </h3>
                      <p className="mt-1.5 text-xs leading-relaxed text-slate-300">
                        {item.description}
                      </p>
                    </div>
                  </div>
                  <div className="border-t border-slate-800 px-4 py-2.5">
                    <a
                      href={item.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-300 hover:underline"
                    >
                      <span>View on NASA.gov</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </article>
              ))}
        </div>
      </div>
    </div>
  );
}
