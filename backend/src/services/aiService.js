/**
 * AI Triage Service
 *
 * Calls OpenAI or Anthropic to classify a ticket and suggest a draft reply.
 * Falls back to a deterministic mock response if:
 *   - No AI_API_KEY is configured
 *   - The real call fails (network error, quota, etc.)
 *   - AI_PROVIDER is set to "mock"
 *
 * Returns:
 * {
 *   category: string,
 *   priority: "Low"|"Medium"|"High"|"Critical",
 *   summary: string,
 *   draftReply: string,
 *   fallback: boolean,
 * }
 */

const AI_TIMEOUT_MS = 15000;

// ── Mock / Fallback Implementation ───────────────────────────────────────────

/**
 * Deterministic fallback that never throws.
 * Keywords in the title/description drive category and priority heuristics.
 */
const mockTriage = (title, description) => {
  const text = `${title} ${description}`.toLowerCase();

  // Priority heuristics
  let priority = 'Medium';
  if (/urgent|critical|down|outage|broken|crash|emergency/.test(text)) priority = 'High';
  if (/cannot|unable|blocked|production/.test(text)) priority = 'High';
  if (/question|inquiry|how to|wondering/.test(text)) priority = 'Low';

  // Category heuristics
  let category = 'General';
  if (/bill|invoice|payment|charge|refund|subscription/.test(text)) category = 'Billing';
  if (/bug|error|crash|fail|exception|not working|broken/.test(text)) category = 'Technical';
  if (/sales|pricing|plan|upgrade|demo|trial/.test(text)) category = 'Sales';
  if (/general|other|misc|hello|hi /.test(text)) category = 'General';

  const summary = description.length > 150 ? description.slice(0, 150) + '...' : description;

  const draftReply =
    `Thank you for reaching out to our support team!\n\n` +
    `I have received your request regarding "${title}" and will look into it right away.\n\n` +
    `We will get back to you as soon as possible.\n\nBest regards,\nSupport Team`;

  return { category, priority, summary, draftReply, fallback: true };
};

// ── OpenAI Implementation ─────────────────────────────────────────────────────

const triageWithOpenAI = async (title, description, apiKey) => {
  const { default: OpenAI } = await import('openai');
  const client = new OpenAI({ apiKey, timeout: AI_TIMEOUT_MS });

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `You are a customer support triage assistant. Analyze the support ticket and respond with a JSON object containing exactly these fields:
{
  "category": one of ["General","Technical","Billing","Sales","Other"],
  "priority": one of ["Low","Medium","High","Critical"],
  "summary": "1-2 sentence summary of the issue",
  "draftReply": "A polite, helpful draft reply to send to the customer"
}`,
      },
      {
        role: 'user',
        content: `Ticket Title: ${title}\n\nTicket Description: ${description}`,
      },
    ],
  });

  const raw = JSON.parse(response.choices[0].message.content);
  return {
    category: raw.category || 'General',
    priority: raw.priority || 'Medium',
    summary: raw.summary || '',
    draftReply: raw.draftReply || '',
    fallback: false,
  };
};

// ── Anthropic Implementation ──────────────────────────────────────────────────

const triageWithAnthropic = async (title, description, apiKey) => {
  const Anthropic = (await import('@anthropic-ai/sdk')).default;
  const client = new Anthropic({ apiKey, timeout: AI_TIMEOUT_MS });

  const message = await client.messages.create({
    model: 'claude-3-haiku-20240307',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `You are a customer support triage assistant. Analyze this support ticket and respond with ONLY a valid JSON object (no markdown, no explanation) containing exactly these fields:
{
  "category": one of ["General","Technical","Billing","Sales","Other"],
  "priority": one of ["Low","Medium","High","Critical"],
  "summary": "1-2 sentence summary",
  "draftReply": "polite draft reply to customer"
}

Ticket Title: ${title}
Ticket Description: ${description}`,
      },
    ],
  });

  const raw = JSON.parse(message.content[0].text);
  return {
    category: raw.category || 'General',
    priority: raw.priority || 'Medium',
    summary: raw.summary || '',
    draftReply: raw.draftReply || '',
    fallback: false,
  };
};

// ── Main Export ───────────────────────────────────────────────────────────────

/**
 * Triage a ticket using the configured AI provider.
 * NEVER throws — always returns a valid suggestion object.
 */
const triageTicket = async (title, description) => {
  const provider = (process.env.AI_PROVIDER || 'openai').toLowerCase();
  const apiKey = process.env.AI_API_KEY || '';

  // Use mock if explicitly requested or no API key
  if (provider === 'mock' || !apiKey.trim()) {
    return mockTriage(title, description);
  }

  try {
    if (provider === 'openai') {
      return await triageWithOpenAI(title, description, apiKey);
    }
    if (provider === 'anthropic') {
      return await triageWithAnthropic(title, description, apiKey);
    }
    // Unknown provider → fallback
    console.warn(`[AI] Unknown provider "${provider}", using mock fallback`);
    return mockTriage(title, description);
  } catch (err) {
    console.error(`[AI] Triage failed (${err.message}), using mock fallback`);
    return mockTriage(title, description);
  }
};

module.exports = { triageTicket, mockTriage };
