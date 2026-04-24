import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatRequestBody {
  messages: ChatMessage[];
  context?: string; // optional match/team context
}

// Pattern-matched local assistant. Hooks into Groq if GROQ_API_KEY is set.
// No external API key required for the basic flow — user always gets a useful answer.

const TIPS_HINTS: Array<{ patterns: RegExp[]; reply: string }> = [
  {
    patterns: [/over\s*2\.?5/i, /goals\s*over/i],
    reply: "Over 2.5 goals tends to land when both teams have averaged 1.5+ goals/game over their last 5 outings, plus an aggressive xG profile. Check the H2H tab for goals trends and the live odds tab for the current line.",
  },
  {
    patterns: [/btts|both teams to score/i],
    reply: "BTTS is best when both teams score in 60%+ of recent matches AND concede in most. Look at the form badges and recent results — if both have 3+ wins with goals, BTTS Yes is solid value at 1.70+.",
  },
  {
    patterns: [/asian handicap|handicap|spread/i],
    reply: "For handicap bets, focus on the favorite's recent winning margin. A -1 line works well when the favorite has won by 2+ in 60%+ of recent games. The Odds tab shows live spread movement.",
  },
  {
    patterns: [/\b(prediction|who will win|pick)\b/i],
    reply: "I lean on three signals: implied probabilities from live odds, last-5 form, and head-to-head. The AI Prediction widget on the match page combines all three — start there for the system's pick.",
  },
  {
    patterns: [/value bet|value/i],
    reply: "Value = your estimated probability > implied probability from odds. If you think a team has a 50% chance and the odds give 2.20 (45% implied), that's value. The Odds tab compares multiple bookmakers so you can find the best line.",
  },
  {
    patterns: [/bankroll|stake|how much/i],
    reply: "Pro tipsters typically stake 1–3% of bankroll per pick (flat staking) and never chase losses. Confidence-based staking can scale up to 5% for HIGH confidence picks. Whatever you do — set a daily loss limit.",
  },
  {
    patterns: [/responsible|gambling problem|addict|help/i],
    reply: "If betting feels like more than entertainment, please pause. UK: GamCare 0808 8020 133. US: 1-800-GAMBLER. Internationally: BeGambleAware.org. We support deposit limits and cooling-off — take care of yourself first.",
  },
  {
    patterns: [/tipster|follow|premium/i],
    reply: "The Tipsters page ranks by ROI, win-rate and streak. Premium tipsters share unit confidence + full reasoning. Free tier still gets 1–2 daily picks from each. Click any tipster card for their full record.",
  },
  {
    patterns: [/odds explained|decimal|fractional|american/i],
    reply: "Decimal (2.50) = total return per unit including stake. Fractional (3/2) = profit per unit (so 3/2 = 2.50 decimal). American (+150 / -200) = profit on $100 (positive) or stake to win $100 (negative). You can switch formats in your Settings.",
  },
  {
    patterns: [/live|in[- ]?play/i],
    reply: "For live bets, watch momentum (xG live, shots on target, possession), red cards/injuries and tactical changes. The Odds tab updates in real time and lineups load from the Lineups tab.",
  },
];

const FALLBACK = "I'm here to help with picks, market analysis, betting strategy and odds. Try asking about over/under goals, BTTS, value bets, bankroll, or what makes a good pick. The match page also has an AI Prediction widget with the system's auto-pick.";

function localReply(userText: string, context?: string): string {
  for (const hint of TIPS_HINTS) {
    if (hint.patterns.some((p) => p.test(userText))) {
      return context ? `${hint.reply}\n\n📋 Context: ${context}` : hint.reply;
    }
  }
  // Greeting?
  if (/^\s*(hi|hello|hey|sup|yo)\b/i.test(userText)) {
    return "Hey 👋 I'm Betcheza AI — your betting copilot. I can help with picks, market analysis, value spotting, bankroll tips and explain anything on the app. What would you like help with?";
  }
  if (/^\s*(thanks|thank you|cheers)/i.test(userText)) {
    return "Anytime — bet smart, bet small. Good luck out there.";
  }
  return FALLBACK;
}

async function tryGroq(messages: ChatMessage[], context?: string): Promise<string | null> {
  const key = process.env.GROQ_API_KEY;
  if (!key) return null;
  try {
    const sys = `You are Betcheza AI, a helpful, concise sports betting assistant for the Betcheza tipster app. Give actionable tips. Always remind users to bet responsibly when relevant. Keep replies to 2-4 sentences unless the user asks for detail.${context ? `\n\nMatch context: ${context}` : ''}`;
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: sys },
          ...messages.slice(-8),
        ],
        temperature: 0.6,
        max_tokens: 320,
      }),
    });
    if (!res.ok) return null;
    const j = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
    return j.choices?.[0]?.message?.content?.trim() || null;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ChatRequestBody;
    const lastUser = [...(body.messages || [])].reverse().find((m) => m.role === 'user');
    if (!lastUser) {
      return NextResponse.json({ reply: 'Ask me anything about a match, market, or strategy!' });
    }

    // Try AI first if configured
    const aiReply = await tryGroq(body.messages, body.context);
    const reply = aiReply || localReply(lastUser.content, body.context);

    return NextResponse.json({
      reply,
      source: aiReply ? 'groq' : 'rules',
    });
  } catch (e) {
    return NextResponse.json(
      { reply: "I had a hiccup — try again in a moment. In the meantime check the AI Prediction widget on the match page." },
      { status: 200 } // soft-fail so chat keeps working
    );
  }
}
