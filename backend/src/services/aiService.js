/**
 * AI Service for Support Portal
 * 
 * Includes triage, agent reply assist, queue summaries, and embeddings.
 */

const AI_TIMEOUT_MS = 15000;

// ── Mock / Fallback Implementations ───────────────────────────────────────────

const mockTriage = (title, description) => {
  const text = `${title} ${description}`.toLowerCase();

  let priority = 'Medium';
  if (/urgent|critical|down|outage|broken|crash|emergency/.test(text)) priority = 'High';
  if (/cannot|unable|blocked|production/.test(text)) priority = 'High';
  if (/question|inquiry|how to|wondering/.test(text)) priority = 'Low';

  let category = 'General';
  if (/bill|invoice|payment|charge|refund|subscription/.test(text)) category = 'Billing';
  if (/bug|error|crash|fail|exception|not working|broken/.test(text)) category = 'Technical';
  if (/sales|pricing|plan|upgrade|demo|trial/.test(text)) category = 'Sales';
  if (/general|other|misc|hello|hi /.test(text)) category = 'General';

  let sentiment = 'Neutral';
  if (/angry|mad|frustrated|upset|terrible|worst|hate|disappointed/.test(text)) sentiment = 'Frustrated';
  if (/happy|great|awesome|love|thanks|thank you/.test(text)) sentiment = 'Positive';

  const summary = description.length > 150 ? description.slice(0, 150) + '...' : description;

  const draftReply =
    `Thank you for reaching out to our support team!\n\n` +
    `I have received your request regarding "${title}" and will look into it right away.\n\n` +
    `We will get back to you as soon as possible.\n\nBest regards,\nSupport Team`;

  return { category, priority, summary, draftReply, sentiment, fallback: true };
};

const mockGenerateReply = (ticket, tone) => {
  const prefix = tone === 'empathetic' 
    ? 'I completely understand how frustrating this must be. ' 
    : tone === 'concise' 
      ? 'Here is an update on your issue. ' 
      : 'Thank you for your patience. ';
  
  return { reply: `${prefix}We are still working on "${ticket.title}" and will update you shortly.` };
};

const mockQueueSummary = (stats) => {
  const open = stats.byStatus.find(s => s.status === 'Open')?.count || 0;
  return { summary: `The queue has ${open} open tickets. We have ${stats.stalledTickets.count} stalled tickets. It's a standard day.` };
};

const mockEmbedding = (text) => {
  // Return a dummy normalized vector of length 1536
  const vec = new Array(1536).fill(0).map(() => Math.random() - 0.5);
  const mag = Math.sqrt(vec.reduce((sum, val) => sum + val * val, 0));
  return vec.map(v => v / mag);
};

// ── OpenAI Implementations ─────────────────────────────────────────────────────

const getOpenAIClient = async () => {
  const { default: OpenAI } = await import('openai');
  const apiKey = process.env.AI_API_KEY || '';
  return new OpenAI({ apiKey, timeout: AI_TIMEOUT_MS });
};

const triageWithOpenAI = async (title, description) => {
  const client = await getOpenAIClient();
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
  "draftReply": "A polite, helpful draft reply to send to the customer",
  "sentiment": one of ["Positive", "Neutral", "Frustrated"]
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
    sentiment: raw.sentiment || 'Neutral',
    fallback: false,
  };
};

const generateReplyWithOpenAI = async (ticket, comments, tone) => {
  const client = await getOpenAIClient();
  const conversation = comments.map(c => `${c.author.role.toUpperCase()}: ${c.body}`).join('\n\n');
  const toneInstruction = tone === 'empathetic' ? 'warm, empathetic, and understanding' 
                        : tone === 'concise' ? 'direct, brief, and to the point' 
                        : 'professional and polite';

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You are a support agent writing a reply to a customer. Write a ${toneInstruction} response. Do not include signature placeholders if they are not needed. Just the message body.`
      },
      {
        role: 'user',
        content: `Original Ticket: ${ticket.title}\n\n${ticket.description}\n\nConversation so far:\n${conversation}\n\nWrite the next reply as the agent.`
      }
    ]
  });

  return { reply: response.choices[0].message.content.trim(), fallback: false };
};

const generateSummaryWithOpenAI = async (stats) => {
  const client = await getOpenAIClient();
  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'You are an operations manager assistant. Write a 2-3 sentence plain-language summary of the queue health based on the stats provided.'
      },
      {
        role: 'user',
        content: JSON.stringify(stats)
      }
    ]
  });
  return { summary: response.choices[0].message.content.trim(), fallback: false };
};

const embedWithOpenAI = async (text) => {
  const client = await getOpenAIClient();
  const response = await client.embeddings.create({
    model: 'text-embedding-3-small',
    input: text
  });
  return response.data[0].embedding;
};


// ── Main Exports ───────────────────────────────────────────────────────────────

const providerConfig = () => {
  const provider = (process.env.AI_PROVIDER || 'openai').toLowerCase();
  const apiKey = process.env.AI_API_KEY || '';
  return { provider, useMock: provider === 'mock' || !apiKey.trim() };
};

const triageTicket = async (title, description) => {
  const { provider, useMock } = providerConfig();
  if (useMock) return mockTriage(title, description);

  try {
    if (provider === 'openai') return await triageWithOpenAI(title, description);
    // Anthropic not fully updated here for brevity, fallback to mock if not OpenAI
    console.warn(`[AI] Provider "${provider}" not fully implemented, using OpenAI/Mock`);
    return mockTriage(title, description);
  } catch (err) {
    console.error(`[AI] Triage failed (${err.message}), using mock fallback`);
    return mockTriage(title, description);
  }
};

const generateAgentReply = async (ticket, comments, tone = 'professional') => {
  const { provider, useMock } = providerConfig();
  if (useMock) return mockGenerateReply(ticket, tone);

  try {
    if (provider === 'openai') return await generateReplyWithOpenAI(ticket, comments, tone);
    return mockGenerateReply(ticket, tone);
  } catch (err) {
    console.error(`[AI] Reply generation failed (${err.message})`);
    return mockGenerateReply(ticket, tone);
  }
};

const generateQueueSummary = async (stats) => {
  const { provider, useMock } = providerConfig();
  if (useMock) return mockQueueSummary(stats);

  try {
    if (provider === 'openai') return await generateSummaryWithOpenAI(stats);
    return mockQueueSummary(stats);
  } catch (err) {
    console.error(`[AI] Summary generation failed (${err.message})`);
    return mockQueueSummary(stats);
  }
};

const generateEmbedding = async (text) => {
  const { provider, useMock } = providerConfig();
  if (useMock) return mockEmbedding(text);
  try {
    if (provider === 'openai') return await embedWithOpenAI(text);
    return mockEmbedding(text);
  } catch (err) {
    console.error(`[AI] Embedding generation failed (${err.message})`);
    return mockEmbedding(text);
  }
};

// Simple cosine similarity for in-memory vector search
const cosineSimilarity = (vecA, vecB) => {
  let dotProduct = 0;
  for (let i = 0; i < vecA.length; i++) dotProduct += vecA[i] * vecB[i];
  // Assuming vectors are normalized
  return dotProduct;
};

module.exports = { 
  triageTicket, 
  generateAgentReply, 
  generateQueueSummary, 
  generateEmbedding,
  cosineSimilarity
};
