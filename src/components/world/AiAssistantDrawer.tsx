import { FormEvent, useState } from 'react';
import { Bot, Lightbulb, Send, X } from 'lucide-react';
import { SCIENTIFIC_INVESTIGATIONS, WORLD_NODES } from '../../data/openWorldMissions';
import { TraineeProfile } from '../../types/game';
import { soundEngine } from '../../utils/sound';

interface ChatMessage {
  role: 'assistant' | 'user';
  text: string;
  source?: string;
}

interface AiAssistantDrawerProps {
  profile: TraineeProfile;
  activeInvestigationId: string | null;
  initialPromptNote?: string;
  onClose: () => void;
  onHintUsed: () => void;
}

export function AiAssistantDrawer({
  profile,
  activeInvestigationId,
  initialPromptNote,
  onClose,
  onHintUsed,
}: AiAssistantDrawerProps) {
  const activeInv =
    SCIENTIFIC_INVESTIGATIONS.find((i) => i.id === activeInvestigationId) ||
    SCIENTIFIC_INVESTIGATIONS.find(
      (i) => i.worldId === profile.openWorld.currentWorld && !profile.openWorld.solvedInvestigations.includes(i.id)
    ) ||
    SCIENTIFIC_INVESTIGATIONS[0];

  const [hintTier, setHintTier] = useState(1);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      role: 'assistant',
      text: initialPromptNote
        ? `Let's look closely at why that attempt didn't match the telemetry: ${initialPromptNote}`
        : `Hi ${profile.name}! I am ARIA, your AI Mission Assistant. Ask me any science question, or request a progressive hint for "${activeInv.title}".`,
      source: 'ARIA AI Assistant · Grounded in NASA Science',
    },
  ]);

  const collectedEvidence = WORLD_NODES.filter((n) =>
    profile.openWorld.discoveredNodes.includes(n.id)
  ).map((n) => `${n.title}: ${n.scientificDataReading}`);

  const sendQuery = async (questionText: string, tierOverride?: number, isHint = false) => {
    if (!questionText.trim() || loading) return;
    soundEngine.playClick();
    const usedTier = tierOverride ?? hintTier;
    if (isHint) {
      onHintUsed();
      setHintTier((t) => Math.min(3, t + 1));
    }

    setMessages((prev) => [...prev, { role: 'user', text: questionText }]);
    setLoading(true);

    try {
      const res = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: questionText,
          worldId: profile.openWorld.currentWorld,
          missionTitle: activeInv.title,
          missionProblem: activeInv.problemStatement,
          collectedEvidence,
          hintTier: usedTier,
          wrongAttemptReason: initialPromptNote || '',
        }),
      });
      const data = (await res.json()) as { reply?: string; sourceNote?: string };
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text:
            data.reply ||
            'Check your scanned sensor readings and compare them against normal safe spacecraft values!',
          source: data.sourceNote || 'NASA Science Reference',
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: 'Communication link experienced static, but remember: scan every glowing equipment beacon with [E] and match your solution to the exact physical measurement you recorded!',
          source: 'Local ARIA Science Backup',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const q = input.trim();
    if (!q) return;
    setInput('');
    sendQuery(q);
  };

  return (
    <aside
      aria-label="ARIA AI Mission Assistant"
      className="fixed right-3 bottom-3 top-16 z-40 flex w-[calc(100vw-24px)] max-w-md flex-col rounded-2xl border border-violet-500/40 bg-[#0C1222] text-slate-100 shadow-2xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/20 text-violet-300">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <div className="font-display text-sm font-bold text-white">ARIA Mission Assistant</div>
            <div className="font-mono text-[11px] text-violet-300">
              AI Science Tutor · Hint Level {hintTier}/3
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close AI Assistant"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 bg-[#080D1A] text-slate-300 hover:border-violet-400 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Quick Progressive Hint Actions */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 bg-[#080D1A] px-4 py-2.5">
        <button
          type="button"
          onClick={() =>
            sendQuery(`Give me a Level ${hintTier} hint for ${activeInv.title}`, hintTier, true)
          }
          className="inline-flex min-h-[34px] items-center gap-1.5 rounded-lg bg-violet-500/20 px-2.5 py-1 text-xs font-semibold text-violet-200 hover:bg-violet-500/35 whitespace-nowrap"
        >
          <Lightbulb className="h-3.5 w-3.5" />
          <span>Hint ({hintTier}/3)</span>
        </button>
        <button
          type="button"
          onClick={() => sendQuery('Help me interpret the sensor data I collected so far.')}
          className="inline-flex min-h-[34px] items-center rounded-lg border border-slate-800 bg-[#0C1222] px-2.5 py-1 text-xs font-medium text-slate-200 hover:border-cyan-400 whitespace-nowrap"
        >
          Interpret Data
        </button>
        <button
          type="button"
          onClick={() => sendQuery(`Why is gravity different on ${profile.openWorld.currentWorld}?`)}
          className="inline-flex min-h-[34px] items-center rounded-lg border border-slate-800 bg-[#0C1222] px-2.5 py-1 text-xs font-medium text-slate-200 hover:border-cyan-400 whitespace-nowrap"
        >
          Explain Gravity
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`rounded-xl p-3 text-xs leading-relaxed ${
              m.role === 'user'
                ? 'ml-8 border border-cyan-500/30 bg-cyan-500/15 text-cyan-50'
                : 'mr-4 border border-slate-800 bg-[#080D1A] text-slate-200'
            }`}
          >
            <p>{m.text}</p>
            {m.source && (
              <div className="mt-1.5 font-mono text-[10px] text-slate-400">{m.source}</div>
            )}
          </div>
        ))}
        {loading && (
          <div className="mr-8 rounded-xl border border-slate-800 bg-[#080D1A] p-3 text-xs text-violet-300">
            ARIA is analyzing NASA telemetry...
          </div>
        )}
      </div>

      {/* Chat Input */}
      <form onSubmit={handleSubmit} className="flex gap-2 border-t border-slate-800 bg-[#080D1A] p-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask ARIA a space or mission question..."
          className="min-h-[42px] flex-1 rounded-xl border border-slate-800 bg-[#060913] px-3 text-xs text-white placeholder:text-slate-500 focus:border-violet-400 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          aria-label="Send question"
          className="flex min-h-[42px] min-w-[42px] items-center justify-center rounded-xl bg-violet-500 text-white hover:bg-violet-400 disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </aside>
  );
}
