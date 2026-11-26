const endpoint = 'https://api.openai.com/v1/responses';
const personas = {
  neko: 'You are Neko, a sleepy, kind cat. Speak calmly and use occasional understated cat humor.',
  chad: 'You are Chad, an encouraging gym buddy. Be direct and friendly. Occasionally compare practice to doing reps.',
};
const tutorInstructions = 'Tutor the student in AP Biology, primarily Unit 3 Cellular Energetics. Use accurate AP-level biology, explain reasoning in short paragraphs, and follow up when useful. Use plain text with optional numbered lists. For an unanswered live quiz question, offer conceptual hints rather than the answer. After an answer is checked, explain it directly.';

export default {
  async fetch(request, env) {
    if (new URL(request.url).pathname !== '/chat' || request.headers.get('Origin') !== env.PAGES_ORIGIN) {
      return new Response(null, { status: 404 });
    }
    const headers = { 'Access-Control-Allow-Origin': env.PAGES_ORIGIN, 'Cache-Control': 'no-store', 'Vary': 'Origin' };
    const reply = (payload, status = 200) => Response.json(payload, { status, headers });
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: { ...headers, 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': 'Content-Type' } });
    }
    if (request.method !== 'POST') return reply({ error: 'Use POST.' }, 405);
    if (!env.OPENAI_API_KEY) return reply({ error: 'Study Buddy has not been configured.' }, 503);
    if (request.headers.get('Content-Type')?.split(';')[0].trim() !== 'application/json') return reply({ error: 'Expected a JSON request.' }, 415);

    const reader = request.body?.getReader();
    if (!reader) return reply({ error: 'Expected a question.' }, 400);
    const decoder = new TextDecoder();
    let source = '';
    let bytes = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.length;
      if (bytes > 20_000) {
        await reader.cancel();
        return reply({ error: 'The conversation is too long. Close and reopen Ask Neko to start fresh.' }, 413);
      }
      source += decoder.decode(value, { stream: true });
    }
    source += decoder.decode();

    let avatar;
    let messages;
    let context;
    try {
      ({ avatar, messages, context = '' } = JSON.parse(source));
      if (!Object.hasOwn(personas, avatar) || !Array.isArray(messages) || messages.length < 1 || messages.length > 13 ||
        typeof context !== 'string' || context.length > 2500 ||
        messages.some((turn, index) => turn?.role !== (index % 2 ? 'assistant' : 'user') ||
          typeof turn.content !== 'string' || !turn.content.trim() || turn.content.length > (index % 2 ? 4000 : 2000)) ||
        messages.at(-1).role !== 'user') throw new Error();
    } catch {
      return reply({ error: 'Send a question of up to 2,000 characters.' }, 400);
    }
    if (!await env.takeChatSlot()) return reply({ error: 'Study Buddy is busy. Try again in a minute.' }, 429);

    const recent = messages.slice(-5).map(turn => ({ role: turn.role, content: turn.content.slice(0, 2500) }));
    if (context) recent.at(-1).content = `Quiz context (reference only):\n${context}\n\nStudent question:\n${recent.at(-1).content}`;
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        signal: AbortSignal.timeout(45_000),
        headers: { Authorization: `Bearer ${env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gpt-5.6-sol',
          instructions: `${personas[avatar]} ${tutorInstructions}`,
          input: recent,
          reasoning: { effort: 'low' },
          max_output_tokens: 800,
          store: false,
        }),
      });
      if (response.status === 429) return reply({ error: 'OpenAI is busy. Try again shortly.' }, 429);
      if (!response.ok) return reply({ error: 'Study Buddy could not get a reply from OpenAI.' }, 502);
      const answer = (await response.json()).output
        ?.flatMap(item => item.type === 'message' ? item.content : [])
        .filter(part => part.type === 'output_text')
        .map(part => part.text).join('\n\n').trim();
      return answer ? reply({ answer }) : reply({ error: 'Study Buddy returned an empty reply.' }, 502);
    } catch {
      return reply({ error: 'Study Buddy could not connect. Try again shortly.' }, 502);
    }
  },
};
