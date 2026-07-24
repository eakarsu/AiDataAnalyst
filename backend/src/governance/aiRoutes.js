import express from 'express';
import { requireRoles } from './auth.js';

const REQUIRED_BASE_URL = 'https://openrouter.ai/api/v1';

function assertAIConfiguration(env) {
  if (!env.OPENROUTER_API_KEY) throw new Error('OPENROUTER_API_KEY is required');
  if (!env.OPENROUTER_MODEL) throw new Error('OPENROUTER_MODEL is required');
  if (env.OPENROUTER_BASE_URL !== REQUIRED_BASE_URL) throw new Error('OPENROUTER_BASE_URL must use the configured OpenRouter API');
}

async function requestAnalysis(env, question) {
  assertAIConfiguration(env);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), Number(env.OPENROUTER_TIMEOUT_MS || 120000));
  try {
    const response = await fetch(`${REQUIRED_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': env.CLIENT_URL,
        'X-Title': 'AI Data Analyst',
      },
      body: JSON.stringify({
        model: env.OPENROUTER_MODEL,
        messages: [
          { role: 'system', content: 'You are a careful business data analyst. Provide a concise, actionable analysis. Clearly distinguish observations, assumptions, and recommended next steps.' },
          { role: 'user', content: question },
        ],
        temperature: 0.2,
        max_tokens: 700,
      }),
      signal: controller.signal,
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) throw new Error(`OpenRouter request failed with status ${response.status}`);
    const content = payload?.choices?.[0]?.message?.content?.trim();
    if (!content) throw new Error('OpenRouter returned no analysis content');
    return { content, receiptId: payload.id || null, usage: payload.usage || {} };
  } finally {
    clearTimeout(timer);
  }
}

export function createAIRouter(pool, env = process.env) {
  const router = express.Router();
  router.post('/analysis', requireRoles('owner', 'analyst'), async (req, res, next) => {
    try {
      const question = typeof req.body?.question === 'string' ? req.body.question.trim() : '';
      if (question.length < 10 || question.length > 5000) return res.status(400).json({ error: 'question_length_invalid' });
      const result = await requestAnalysis(env, question);
      const stored = await pool.query(
        `INSERT INTO analyst_ai_results(tenant_id,user_id,question,model,provider_receipt_id,result,usage)
         VALUES($1,$2,$3,$4,$5,$6,$7::jsonb) RETURNING id,created_at`,
        [req.auth.tenantId, req.auth.userId, question, env.OPENROUTER_MODEL, result.receiptId, result.content, JSON.stringify(result.usage)],
      );
      return res.status(200).json({ id: stored.rows[0].id, analysis: result.content, model: env.OPENROUTER_MODEL, createdAt: stored.rows[0].created_at });
    } catch (error) {
      return next(error);
    }
  });
  return router;
}
