import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import pg from 'pg';
const { Pool } = pg;

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

app.use(express.json({ limit: '10mb' }));

// Shared Gemini client initialization
const apiKey = process.env.GEMINI_API_KEY || '';
let aiClient: any = null;

if (apiKey) {
  aiClient = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Model Resolver ensuring valid active Gemini models
function resolveGeminiModel(requestedModel?: string): string {
  if (!requestedModel || !requestedModel.trim()) return 'gemini-3.8-flash';
  return requestedModel.trim();
}

// Automatic retry with exponential backoff and jitter for transient errors (503 High Demand, 429 Quota, network issues)
async function callWithRetry<T>(
  operation: (attempt: number) => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelayMs?: number;
    backoffFactor?: number;
    label?: string;
  } = {}
): Promise<T> {
  const { maxRetries = 3, initialDelayMs = 1000, backoffFactor = 2, label = 'AI Operation' } = options;
  let lastError: any = null;

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      return await operation(attempt);
    } catch (err: any) {
      lastError = err;
      const errMsg = err?.message || String(err || '');

      const isRetryable =
        errMsg.includes('503') ||
        errMsg.includes('high demand') ||
        errMsg.includes('UNAVAILABLE') ||
        errMsg.includes('temporarily unavailable') ||
        errMsg.includes('429') ||
        errMsg.includes('RESOURCE_EXHAUSTED') ||
        errMsg.includes('quota') ||
        errMsg.includes('ECONNRESET') ||
        errMsg.includes('ETIMEDOUT') ||
        errMsg.includes('fetch failed') ||
        errMsg.includes('502') ||
        errMsg.includes('504');

      if (attempt <= maxRetries && isRetryable) {
        const delay = Math.round(initialDelayMs * Math.pow(backoffFactor, attempt - 1) + Math.random() * 300);
        console.warn(`[${label} Retry] Attempt ${attempt} failed (${errMsg.slice(0, 100)}). Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        break;
      }
    }
  }

  throw lastError;
}

// Formats any error into a polite, natural conversational message for the user
function formatFriendlyErrorMessage(error: any): string {
  if (!error) {
    return 'ขออภัยครับ ขณะนี้ระบบไม่สามารถประมวลผลคำตอบได้ชั่วคราว กรุณาลองใหม่อีกครั้งในอีกสักครู่ครับ';
  }

  const raw = typeof error?.message === 'string' ? error.message : JSON.stringify(error || '');

  if (raw.includes('503') || raw.includes('high demand') || raw.includes('UNAVAILABLE') || raw.includes('temporarily unavailable')) {
    return 'ขณะนี้ระบบ AI มีผู้ใช้งานหนาแน่นชั่วคราว ระบบได้พยายามส่งคำขอซ้ำให้อัตโนมัติแล้วแต่ยังไม่สำเร็จ กรุณารอสักครู่แล้วลองส่งคำถามใหม่อีกครั้งนะครับ';
  }

  if (raw.includes('429') || raw.includes('RESOURCE_EXHAUSTED') || raw.includes('quota')) {
    return 'ขณะนี้ปริมาณการใช้งานเกินโควตาชั่วคราว กรุณารอประมาณ 1-2 นาทีแล้วลองส่งคำถามใหม่อีกครั้งครับ';
  }

  if (raw.includes('401') || raw.includes('403') || raw.includes('API_KEY_INVALID') || raw.includes('PERMISSION_DENIED') || raw.includes('No Gemini API Key provided')) {
    return 'ไม่สามารถเชื่อมต่อกับบริการ AI ได้ เนื่องจากยังไม่ได้ตั้งค่า API Key หรือ API Key ไม่ถูกต้อง กรุณาตรวจสอบการตั้งค่าในเมนู AI Settings ครับ';
  }

  if (raw.includes('404') || raw.includes('NOT_FOUND')) {
    return 'โมเดล AI ที่ระบุไม่พร้อมใช้งานในขณะนี้ ระบบแนะนำให้เลือกโมเดล gemini-3.8-flash ในการตั้งค่าครับ';
  }

  if (raw.includes('Failed to fetch') || raw.includes('ECONNRESET') || raw.includes('ETIMEDOUT') || raw.includes('NetworkError') || raw.includes('Network Error')) {
    return 'การเชื่อมต่อไปยังระบบ AI ขัดข้องชั่วคราว กรุณาตรวจสอบสัญญาณอินเทอร์เน็ตแล้วลองใหม่อีกครั้งครับ';
  }

  return 'ขออภัยครับ ขณะนี้ระบบไม่สามารถประมวลผลคำตอบได้ชั่วคราว กรุณาลองส่งคำถามใหม่อีกครั้งในอีกสักครู่ครับ';
}

// Local JSON Storage State
const LOCAL_DB_FILE = path.join(__dirname, 'mythos_storage.json');
let cachedDatabaseState: any = {
  sessions: [],
  contexts: {},
  lastSyncedAt: null,
};

if (fs.existsSync(LOCAL_DB_FILE)) {
  try {
    const data = fs.readFileSync(LOCAL_DB_FILE, 'utf-8');
    cachedDatabaseState = JSON.parse(data);
  } catch (e) {
    console.error('Failed to load local storage:', e);
  }
}

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    hasGeminiKey: Boolean(apiKey),
    timestamp: new Date().toISOString(),
  });
});

// Test AI Provider Connection & Dynamic Model Fetching
app.post('/api/ai/test-connection', async (req, res) => {
  try {
    const { provider, model, customApiKey, baseUrl } = req.body;

    if (provider === 'gemini') {
      const activeKey = customApiKey || apiKey;
      if (!activeKey) {
        return res.status(400).json({ success: false, message: 'No Gemini API Key provided.' });
      }

      const activeClient = new GoogleGenAI({
        apiKey: activeKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      let availableModels: string[] = [
        'gemini-3.8-flash',
        'gemini-3.8-pro',
        'gemini-2.5-flash',
        'gemini-2.5-pro',
        'gemini-2.5-flash-lite',
        'gemini-1.5-flash',
        'gemini-1.5-pro',
        'gemini-flash-latest',
        'gemini-pro-latest',
      ];

      // Dynamically query Google Gemini models list endpoint if key works
      try {
        const gRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${activeKey}`);
        if (gRes.ok) {
          const gData: any = await gRes.json();
          if (Array.isArray(gData.models)) {
            const fetchedNames = gData.models
              .filter((m: any) => m.name && m.supportedGenerationMethods?.includes('generateContent'))
              .map((m: any) => m.name.replace(/^models\//, ''));
            if (fetchedNames.length > 0) {
              const combined = Array.from(new Set([...fetchedNames, ...availableModels]));
              availableModels = combined;
            }
          }
        }
      } catch (gErr) {
        console.warn('Failed to query Google Gemini models API:', gErr);
      }

      const targetModel = resolveGeminiModel(model);

      try {
        await callWithRetry(
          async () => {
            return await activeClient.models.generateContent({
              model: targetModel,
              contents: [{ role: 'user', parts: [{ text: 'ping' }] }],
            });
          },
          { label: `Test Connection (${targetModel})`, maxRetries: 2, initialDelayMs: 400 }
        );
      } catch (e: any) {
        return res.status(401).json({ success: false, message: `Invalid API Key or Model: ${e.message}` });
      }

      return res.json({ success: true, message: 'Connected to Google Gemini successfully.', models: availableModels });
    } else {
      // OpenAI / OpenRouter / DeepSeek / Custom Router Provider
      const targetUrl = baseUrl ? baseUrl.replace(/\/$/, '') : 'https://api.openai.com/v1';
      const key = customApiKey || '';
      let models: string[] = [];

      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        if (key) {
          headers['Authorization'] = `Bearer ${key}`;
        }
        if (targetUrl.includes('openrouter')) {
          headers['HTTP-Referer'] = 'https://mythos.app';
          headers['X-Title'] = 'Mythos Workspace';
        }

        const modelsRes = await fetch(`${targetUrl}/models`, { headers });
        if (modelsRes.ok) {
          const data: any = await modelsRes.json();
          const rawList = Array.isArray(data.data)
            ? data.data
            : Array.isArray(data.models)
            ? data.models
            : Array.isArray(data)
            ? data
            : [];

          models = rawList
            .map((m: any) => (typeof m === 'string' ? m : m.id || m.name))
            .filter(Boolean)
            .slice(0, 100);
        }
      } catch (e) {
        console.warn('Failed to fetch models from provider /models endpoint:', e);
      }

      const testModel = model || (models.length > 0 ? models[0] : 'gpt-4o-mini');
      const testHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (key) {
        testHeaders['Authorization'] = `Bearer ${key}`;
      }
      if (targetUrl.includes('openrouter')) {
        testHeaders['HTTP-Referer'] = 'https://mythos.app';
        testHeaders['X-Title'] = 'Mythos Workspace';
      }

      const testRes = await fetch(`${targetUrl}/chat/completions`, {
        method: 'POST',
        headers: testHeaders,
        body: JSON.stringify({
          model: testModel,
          messages: [{ role: 'user', content: 'ping' }],
          max_tokens: 5,
        }),
      });

      if (!testRes.ok) {
        const errText = await testRes.text();
        return res.status(testRes.status).json({ success: false, message: `Provider error: ${errText}` });
      }

      if (models.length === 0) {
        models = [testModel, 'gpt-4o', 'gpt-4o-mini', 'claude-3-5-sonnet-20241022', 'deepseek-chat'];
      }

      return res.json({
        success: true,
        message: 'Connected to provider successfully.',
        models,
      });
    }
  } catch (error: any) {
    console.error('Test connection error:', error);
    return res.status(500).json({ success: false, message: error?.message || 'Connection failed' });
  }
});

// AI Knowledge Assistant Query Route (Optimized & Unscoped)
app.post('/api/ai/chat', async (req, res) => {
  try {
    const {
      workspaceId,
      workspaceName,
      question,
      chatHistory = [],
      workspaceInstructions = '',
      manualContextFiles = [],
      focusedFiles = [],
      conciseness = 'balanced',
      allFiles = [],
      provider = 'gemini',
      model = 'gemini-3.8-flash',
      customApiKey = '',
      baseUrl = '',
    } = req.body;

    if (!question || typeof question !== 'string') {
      return res.status(400).json({ error: 'Question is required' });
    }

    // Workspace notes overview summary
    const structureSummary = allFiles && allFiles.length > 0
      ? `WORKSPACE NOTES MAP (${allFiles.length} files):\n` + allFiles.slice(0, 25).map((f: any) => `- [${f.name}]`).join('\n')
      : 'No files in workspace yet.';

    // Score and attach only relevant notes to keep token count low and TTFT extremely fast
    const scoredFiles = allFiles.map((file: any) => {
      let score = 0;
      const fileNameLower = (file.name || '').toLowerCase().replace(/\.md$/, '');
      const isFocused = focusedFiles.some((f: any) => f.id === file.id);
      const isManual = manualContextFiles.some((f: any) => f.id === file.id);

      if (isFocused) score += 2000;
      if (isManual) score += 800;
      if (fileNameLower && question.toLowerCase().includes(fileNameLower)) score += 300;

      return { ...file, score, isPrimaryFocus: isFocused };
    }).filter((f: any) => f.score > 0).sort((a: any, b: any) => b.score - a.score).slice(0, 6);

    const relevantNotesContext = scoredFiles.length > 0
      ? `\nRELEVANT WORKSPACE NOTES:\n${scoredFiles.map((f: any) => `--- NOTE: ${f.name} ---\n${f.content.slice(0, 3500)}`).join('\n\n')}\n`
      : '';

    // Unrestricted system prompt: free to answer ANY topic, with read-only workspace integration & template builder support
    const systemPrompt = `You are Mythos AI, an unrestricted, highly capable writing and knowledge assistant for workspace "${workspaceName || 'Untitled'}".
You have broad intelligence across all domains: fiction writing, worldbuilding, deep analysis, coding, brainstorming, translation, and general knowledge.
You have direct read access to this workspace's notes and templates.

GUIDELINES & PERMISSIONS:
1. UNRESTRICTED KNOWLEDGE: You can answer ANY question freely (creative, philosophical, technical, general facts). You are NOT restricted to only discussing the workspace.
2. WORKSPACE INTEGRATION: When the user asks about their notes, characters, chapters, or lore, draw from the workspace context and cite referenced notes like [Note.md].
3. READ-ONLY NOTE ACCESS: You can read and search notes, but you CANNOT modify or delete actual workspace notes.
4. TEMPLATE BUILDER: You have full permission to format, design, and create note templates when in Template Builder mode or when requested.
5. CONCISENESS: Preference is ${conciseness}.

${structureSummary}
${relevantNotesContext}
CUSTOM WORKSPACE INSTRUCTIONS:
${workspaceInstructions || 'None provided.'}`;

    let assistantReply = '';
    const citations = scoredFiles.map((f: any) => ({ fileId: f.id, fileName: f.name, filePath: f.path || f.name }));

    if (provider === 'gemini') {
      const activeKey = customApiKey || apiKey;
      if (!activeKey) {
        throw new Error('No Gemini API Key provided');
      }

      const activeClient = new GoogleGenAI({
        apiKey: activeKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const chosenModel = resolveGeminiModel(model);

      const contents = chatHistory.slice(-8).map((m: any) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));
      contents.push({ role: 'user', parts: [{ text: question }] });

      // Run with fast retry and native systemInstruction config for low TTFT
      const response = await callWithRetry(
        async () => {
          return await activeClient.models.generateContent({
            model: chosenModel,
            contents,
            config: {
              systemInstruction: systemPrompt,
              temperature: 0.7,
            },
          });
        },
        { label: `Gemini (${chosenModel})`, maxRetries: 2, initialDelayMs: 400 }
      );

      assistantReply = response.text || 'No response.';
    } else {
      const targetUrl = baseUrl ? `${baseUrl.replace(/\/$/, '')}/chat/completions` : 'https://api.openai.com/v1/chat/completions';
      
      const openAiRes = await callWithRetry(
        async () => {
          const res = await fetch(targetUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${customApiKey}` },
            body: JSON.stringify({
              model: model || 'gpt-4o-mini',
              messages: [
                { role: 'system', content: systemPrompt },
                ...chatHistory.slice(-8),
                { role: 'user', content: question },
              ],
              temperature: 0.7,
            }),
          });
          if (!res.ok) {
            const errText = await res.text();
            throw new Error(`HTTP ${res.status}: ${errText}`);
          }
          return res;
        },
        { label: 'External AI Provider', maxRetries: 2, initialDelayMs: 400 }
      );

      const json: any = await openAiRes.json();
      assistantReply = json.choices?.[0]?.message?.content || 'No response.';
    }

    return res.json({ reply: assistantReply, citations });
  } catch (error: any) {
    console.error('Chat error handled gracefully:', error);
    // Return friendly, polite conversational message instead of a raw error object
    const friendlyReply = formatFriendlyErrorMessage(error);
    return res.json({ reply: friendlyReply, citations: [], isFallback: true });
  }
});

// UNIFIED DATABASE SYNC
app.post('/api/database/sync', async (req, res) => {
  try {
    const { workspaceId, sessions = [], manualContextIds = [], instructions = '', dbConfig } = req.body;
    const timestamp = new Date().toISOString();

    // Always update local JSON as fallback
    cachedDatabaseState.sessions = sessions;
    if (workspaceId) {
      cachedDatabaseState.contexts[workspaceId] = { manualContextIds, instructions, updatedAt: timestamp };
    }
    fs.writeFileSync(LOCAL_DB_FILE, JSON.stringify(cachedDatabaseState, null, 2), 'utf-8');

    if (!dbConfig?.enabled) {
      return res.json({ success: true, message: 'Saved to local JSON storage.', timestamp });
    }

    const { type } = dbConfig;

    if (type === 'cloudflare-d1') {
      const { accountId, databaseId, apiToken } = dbConfig;
      const cfUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`;
      
      const queries = [
        { sql: "CREATE TABLE IF NOT EXISTS chat_contexts (workspace_id TEXT PRIMARY KEY, manual_context_ids TEXT, instructions TEXT, updated_at TEXT);" },
        { 
          sql: "INSERT OR REPLACE INTO chat_contexts (workspace_id, manual_context_ids, instructions, updated_at) VALUES (?, ?, ?, ?)",
          params: [workspaceId, JSON.stringify(manualContextIds), instructions, timestamp]
        }
      ];

      for (const q of queries) {
        const cfRes = await fetch(cfUrl, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${apiToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(q),
        });
        if (!cfRes.ok) {
           const err = await cfRes.text();
           throw new Error(`Cloudflare API Error: ${err}`);
        }
      }
      return res.json({ success: true, message: 'Synced to Cloudflare D1.', timestamp });
    }

    if (type === 'supabase' || type === 'local-postgres') {
      const pool = new Pool({ connectionString: dbConfig.connectionString });
      try {
        await pool.query(`CREATE TABLE IF NOT EXISTS chat_contexts (workspace_id TEXT PRIMARY KEY, manual_context_ids TEXT, instructions TEXT, updated_at TEXT)`);
        if (workspaceId) {
          await pool.query(
            `INSERT INTO chat_contexts (workspace_id, manual_context_ids, instructions, updated_at) VALUES ($1, $2, $3, $4) 
             ON CONFLICT (workspace_id) DO UPDATE SET manual_context_ids = $2, instructions = $3, updated_at = $4`,
            [workspaceId, JSON.stringify(manualContextIds), instructions, timestamp]
          );
        }
        return res.json({ success: true, message: 'Synced to PostgreSQL.', timestamp });
      } finally {
        await pool.end();
      }
    }

    if (type === 'local-sqlite') {
      const sqlite3 = (await import('sqlite3')).default;
      const dbPath = dbConfig.filePath || './mythos_database.sqlite';
      
      return new Promise((resolve) => {
        const db = new sqlite3.Database(dbPath, async (err) => {
          if (err) {
            res.status(500).json({ success: false, message: `SQLite Error: ${err.message}` });
            resolve();
            return;
          }

          db.serialize(() => {
            db.run(`CREATE TABLE IF NOT EXISTS chat_contexts (workspace_id TEXT PRIMARY KEY, manual_context_ids TEXT, instructions TEXT, updated_at TEXT);`);
            
            if (workspaceId) {
              const stmt = db.prepare(`INSERT OR REPLACE INTO chat_contexts (workspace_id, manual_context_ids, instructions, updated_at) VALUES (?, ?, ?, ?)`);
              stmt.run(workspaceId, JSON.stringify(manualContextIds), instructions, timestamp, (runErr: any) => {
                if (runErr) {
                  res.status(500).json({ success: false, message: `SQLite Insert Error: ${runErr.message}` });
                } else {
                  res.json({ success: true, message: 'Synced to local SQLite.', timestamp });
                }
                resolve();
              });
              stmt.finalize();
            } else {
              res.json({ success: true, message: 'SQLite Schema Ready.', timestamp });
              resolve();
            }
          });

          db.close();
        });
      });
    }

    return res.json({ success: true, message: 'Storage updated.', timestamp });
  } catch (err: any) {
    console.error('Sync error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Fetch chat history from DB
app.get('/api/database/chat-history', (_req, res) => {
  return res.json({
    success: true,
    sessions: cachedDatabaseState.sessions || [],
    contexts: cachedDatabaseState.contexts || {},
    lastSyncedAt: cachedDatabaseState.lastSyncedAt,
  });
});

// Vite middleware or static files
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Mythos server running at http://0.0.0.0:${port}`);
  });
}

startServer();
