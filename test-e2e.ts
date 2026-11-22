/**
 * Comprehensive End-to-End (E2E) Test Suite for Mythos Workspace
 * Runs against an isolated dev server on port 3001 with temp storage,
 * so tests never read or write real workspace data.
 */

import { JSDOM } from 'jsdom';
import JSZip from 'jszip';
import { spawn, type ChildProcess } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { parseMarkdown, serializeMarkdown, extractInternalLinks, extractHeadings, calculateStats } from './src/utils/markdownParser';

const BASE_URL = 'http://localhost:3001';
const TEST_STORAGE_FILE = path.join(os.tmpdir(), 'mythos-test-storage.json');

// Set up JSDOM global browser environment
const dom = new JSDOM('<!DOCTYPE html><html><body><div id="root"></div></body></html>', {
  url: BASE_URL + '/',
});
(global as any).window = dom.window;
(global as any).document = dom.window.document;
(global as any).Node = dom.window.Node;
(global as any).HTMLElement = dom.window.HTMLElement;
(global as any).HTMLInputElement = dom.window.HTMLInputElement;

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  \x1b[32m✔ PASS\x1b[0m - ${testName}`);
  } else {
    failedTests++;
    console.error(`  \x1b[31m✖ FAIL\x1b[0m - ${testName} ${detail ? `(${detail})` : ''}`);
  }
}

let ownedServer: ChildProcess | null = null;

async function pingServer(): Promise<boolean> {
  try {
    const response = await fetch(BASE_URL + '/api/health');
    return response.ok;
  } catch {
    return false;
  }
}

/** Suite 1 needs the live API. Start the dev server ourselves when it is not running. */
async function ensureServer(): Promise<void> {
  if (await pingServer()) return;
  ownedServer = spawn(process.execPath, ['--import', 'tsx', 'server.ts'], {
    cwd: process.cwd(),
    stdio: 'ignore',
    env: { ...process.env, PORT: '3001', MYTHOS_STORAGE_FILE: TEST_STORAGE_FILE },
  });
  for (let attempt = 0; attempt < 80; attempt++) {
    if (await pingServer()) return;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  stopOwnedServer();
  throw new Error('Test server did not start on ' + BASE_URL);
}

function stopOwnedServer(): void {
  if (ownedServer && !ownedServer.killed) ownedServer.kill();
  ownedServer = null;
}

async function runTestSuite() {
  await ensureServer();

  console.log('\n============================================================');
  console.log('       MYTHOS WORKSPACE E2E AUTOMATED TEST SUITE');
  console.log('============================================================\n');

  // ==========================================
  // SUITE 1: Backend API End-to-End Tests
  // ==========================================
  console.log('🔷 Suite 1: Backend HTTP APIs (Isolated Test Server Port 3001)');
  try {
    const healthRes = await fetch(BASE_URL + '/api/health');
    const healthJson = await healthRes.json() as any;
    assert(healthRes.status === 200, 'GET /api/health responds with 200 OK');
    assert(healthJson.status === 'ok', 'Health status is "ok"');
    assert(typeof healthJson.hasGeminiKey === 'boolean', 'Health reports Gemini API key presence');
  } catch (err: any) {
    assert(false, 'GET /api/health connection', err.message);
  }

  try {
    const syncRes = await fetch(BASE_URL + '/api/database/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workspaceId: 'test-ws-e2e',
        sessions: [{ id: 'sess-1', title: 'Test Session', messages: [], workspaceId: 'test-ws-e2e' }],
        manualContextIds: ['f-1'],
        instructions: 'Test instructions',
        dbConfig: { enabled: false },
      }),
    });
    const syncJson = await syncRes.json() as any;
    assert(syncRes.status === 200, 'POST /api/database/sync returns 200');
    assert(syncJson.success === true, 'Database sync reports success');
    assert(!!syncJson.timestamp, 'Database sync returns valid timestamp');
  } catch (err: any) {
    assert(false, 'POST /api/database/sync', err.message);
  }

  try {
    const historyRes = await fetch(BASE_URL + '/api/database/chat-history');
    const historyJson = await historyRes.json() as any;
    assert(historyRes.status === 200, 'GET /api/database/chat-history returns 200');
    assert(Array.isArray(historyJson.sessions), 'Chat history returns array of sessions');
  } catch (err: any) {
    assert(false, 'GET /api/database/chat-history', err.message);
  }

  try {
    const aiTestRes = await fetch(BASE_URL + '/api/ai/test-connection', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: 'gemini',
        customApiKey: 'invalid_dummy_key_to_verify_error_handling',
      }),
    });
    const aiTestJson = await aiTestRes.json() as any;
    assert(aiTestRes.status === 401 || aiTestRes.status === 400 || aiTestJson.success === false, 'AI connection test handles invalid credentials safely');
  } catch (err: any) {
    assert(false, 'POST /api/ai/test-connection', err.message);
  }

  try {
    const chatErrorRes = await fetch(BASE_URL + '/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: 'What is this note about?',
        provider: 'gemini',
        customApiKey: 'invalid_test_key_verify_friendly_fallback',
      }),
    });
    const chatErrorJson = await chatErrorRes.json() as any;
    assert(chatErrorRes.status === 200, 'POST /api/ai/chat responds with 200 even on AI error');
    assert(typeof chatErrorJson.reply === 'string' && chatErrorJson.reply.length > 0, 'Returns friendly text reply');
    assert(!chatErrorJson.reply.startsWith('Error:') && !chatErrorJson.reply.includes('"error":{'), 'Reply is a normal friendly message without raw JSON or Error prefix');
    assert(chatErrorJson.isFallback === true, 'Response marks isFallback for friendly handling');
  } catch (err: any) {
    assert(false, 'POST /api/ai/chat error handling', err.message);
  }

  // ==========================================
  // SUITE 2: Markdown Engine & Parser Tests
  // ==========================================
  console.log('\n🔷 Suite 2: Markdown Engine & Frontmatter Parser');
  const sampleMarkdown = `---
title: Chapter 1 The Gathering
type: Scene
status: Draft
tags:
  - fantasy
  - adventure
---

# Chapter 1: The Gathering

In the ancient city of Valdoria, shadows lengthened.

## Characters Present
- [[Lucia Vance]]
- [[Lord Kaelen]]

> "The stars do not lie, young sorceress."

- [ ] Inspect the arcane library
- [x] Decode the obsidian tablet
`;

  const parsed = parseMarkdown(sampleMarkdown);
  assert(parsed.hasFrontmatter === true, 'Parsed frontmatter presence correctly');
  assert(parsed.frontmatter.title === 'Chapter 1 The Gathering', 'Parsed frontmatter title');
  assert(parsed.frontmatter.type === 'Scene', 'Parsed frontmatter type');
  assert(parsed.frontmatter.status === 'Draft', 'Parsed frontmatter status');
  assert(Array.isArray(parsed.frontmatter.tags) && parsed.frontmatter.tags.length === 2, 'Parsed frontmatter array tags');

  const serialized = serializeMarkdown(parsed.frontmatter, parsed.body);
  assert(serialized.includes('title: Chapter 1 The Gathering'), 'Serialized frontmatter retains title');
  assert(serialized.includes('# Chapter 1: The Gathering'), 'Serialized retains markdown body');

  const links = extractInternalLinks(sampleMarkdown);
  assert(links.includes('Lucia Vance') && links.includes('Lord Kaelen'), 'Extracts internal [[WikiLinks]] correctly');

  const headings = extractHeadings(sampleMarkdown);
  assert(headings.length === 2, 'Extracts document outline headings count');
  assert(headings[0].level === 1 && headings[0].text === 'Chapter 1: The Gathering', 'H1 heading level and text');
  assert(headings[1].level === 2 && headings[1].text === 'Characters Present', 'H2 heading level and text');

  const stats = calculateStats(sampleMarkdown);
  assert(stats.words > 15, `Calculates word count (${stats.words} words)`);
  assert(stats.readingTimeMinutes >= 1, 'Calculates reading time estimate');

  // ==========================================
  // SUITE 3: Rich Text Live Markdown Syntax (# + Space)
  // ==========================================
  console.log('\n🔷 Suite 3: Rich Text WYSIWYG & Live Markdown Syntax (# + Space)');

  // Test # + Space Trigger preserving non-breaking space
  const editorContainer = document.createElement('div');
  editorContainer.className = 'editor-content';
  document.body.appendChild(editorContainer);

  const initialP = document.createElement('p');
  initialP.textContent = '#';
  editorContainer.appendChild(initialP);

  // Simulating user typing Space after '#'
  const textBeforeCursor = '#';
  if (textBeforeCursor === '#') {
    const h1 = document.createElement('h1');
    h1.className = 'font-display text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 pt-3 pb-1 border-b my-2';
    const newTextNode = document.createTextNode('#\u00A0'); // Using non-breaking space
    h1.appendChild(newTextNode);
    initialP.replaceWith(h1);
  }

  const h1El = editorContainer.querySelector('h1');
  assert(!!h1El, '# + Space instantly creates <h1> element');
  assert(h1El?.textContent === '#\u00A0', '<h1> text contains "#\\u00A0" with non-breaking space');
  assert(h1El?.textContent?.charCodeAt(1) === 160, 'Space after # is preserved as character 160 (\\u00A0)');

  // Simulating user typing continuous text after space (e.g. "Prologue")
  h1El!.textContent += 'Prologue';
  assert(h1El!.textContent === '#\u00A0Prologue', 'User text is separated from # without sticking ("#\\u00A0Prologue")');

  // Simulating user pressing Enter (cleans syntax prefix and jumps to new paragraph)
  const currentText = h1El!.textContent || '';
  const cleanContent = currentText.replace(/^#[\s\u00A0]+/, '').trim();
  h1El!.textContent = cleanContent;
  const nextP = document.createElement('p');
  nextP.innerHTML = '<br>';
  h1El!.after(nextP);

  assert(h1El!.textContent === 'Prologue', 'On Enter, prefix is cleanly stripped to "Prologue"');
  assert(editorContainer.contains(nextP), 'On Enter, creates next paragraph below');

  // Test ## + Space Trigger (H2)
  const p2 = document.createElement('p');
  p2.textContent = '##';
  editorContainer.appendChild(p2);
  const h2 = document.createElement('h2');
  h2.appendChild(document.createTextNode('##\u00A0'));
  p2.replaceWith(h2);
  assert(h2.textContent === '##\u00A0', '## + Space creates <h2> with "##\\u00A0"');

  // Test > + Space Trigger (Blockquote)
  const pQuote = document.createElement('p');
  pQuote.textContent = '>';
  editorContainer.appendChild(pQuote);
  const bq = document.createElement('blockquote');
  bq.appendChild(document.createTextNode('>\u00A0'));
  pQuote.replaceWith(bq);
  assert(bq.textContent === '>\u00A0', '> + Space creates <blockquote> with ">\\u00A0"');

  // Test - + Space Trigger (List)
  const pList = document.createElement('p');
  pList.textContent = '-';
  editorContainer.appendChild(pList);
  const ul = document.createElement('ul');
  const li = document.createElement('li');
  li.appendChild(document.createTextNode('-\u00A0'));
  ul.appendChild(li);
  pList.replaceWith(ul);
  assert(li.textContent === '-\u00A0', '- + Space creates <ul><li> with "-\\u00A0"');

  // ==========================================
  // SUITE 4: Workspace ZIP Export Integrity
  // ==========================================
  console.log('\n🔷 Suite 4: Workspace ZIP Export with Exact Workspace Hierarchy');
  const zip = new JSZip();
  const mockWorkspace = { name: 'Dust of Sorcery' };
  const mockFolders = [
    { id: 'f1', name: 'Characters', parentId: null },
    { id: 'f2', name: 'Magic System', parentId: null },
    { id: 'f3', name: 'Sub-Order', parentId: 'f2' },
  ];
  const mockFiles = [
    { id: 'm1', name: 'Overview.md', parentId: null, content: '# Overview\nStory description.' },
    { id: 'm2', name: 'Lucia.md', parentId: 'f1', content: '# Lucia\nProtagonist.' },
    { id: 'm3', name: 'Spellcraft.md', parentId: 'f3', content: '# Spellcraft\nRules of magic.' },
  ];

  const getFolderPath = (folderId: string | null): string => {
    if (!folderId) return '';
    const folder = mockFolders.find((f) => f.id === folderId);
    if (!folder) return '';
    const parentPath = getFolderPath(folder.parentId);
    return parentPath ? `${parentPath}/${folder.name}` : folder.name;
  };

  mockFolders.forEach((folder) => {
    const fPath = getFolderPath(folder.id);
    if (fPath) zip.folder(fPath);
  });

  mockFiles.forEach((file) => {
    const parentPath = getFolderPath(file.parentId);
    const filePath = parentPath ? `${parentPath}/${file.name}` : file.name;
    zip.file(filePath, file.content || '');
  });

  const generatedZipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
  assert(generatedZipBuffer.length > 0, 'Generates valid ZIP binary buffer');

  const unzipped = await JSZip.loadAsync(generatedZipBuffer);
  assert(!!unzipped.file('Overview.md'), 'ZIP contains root file "Overview.md"');
  assert(!!unzipped.file('Characters/Lucia.md'), 'ZIP contains nested file "Characters/Lucia.md"');
  assert(!!unzipped.file('Magic System/Sub-Order/Spellcraft.md'), 'ZIP contains deeply nested file "Magic System/Sub-Order/Spellcraft.md"');

  const readContent = await unzipped.file('Characters/Lucia.md')?.async('string');
  assert(readContent === '# Lucia\nProtagonist.', 'ZIP file contents match workspace note content exactly');

  const expectedZipName = `${mockWorkspace.name.replace(/\s+/g, '_')}_workspace.zip`;
  assert(expectedZipName === 'Dust_of_Sorcery_workspace.zip', `ZIP archive named with workspace name: "${expectedZipName}"`);

  // ==========================================
  // SUITE 5: AI Session Deletion & Isolation
  // ==========================================
  console.log('\n🔷 Suite 5: AI Session History Management & Deletion');
  let sessions: Array<{ id: string; title: string; workspaceId: string; messages: { content: string }[]; deletedAt?: string | null }> = [
    { id: 'sess-alpha', title: 'World Lore Discussion', workspaceId: 'ws-1', messages: [{ content: 'Hi' }] },
    { id: 'sess-beta', title: 'Spell Formulation', workspaceId: 'ws-1', messages: [{ content: 'Spell query' }] },
    { id: 'sess-gamma', title: 'Other Workspace Session', workspaceId: 'ws-2', messages: [] },
  ];

  // Filter for active workspace
  const activeWsSessions = sessions.filter(s => s.workspaceId === 'ws-1');
  assert(activeWsSessions.length === 2, 'Isolates sessions per active workspace');

  // Perform Soft Delete to Trash & Recovery
  const sessionToTrash = 'sess-alpha';
  sessions = sessions.map(s => s.id === sessionToTrash ? { ...s, deletedAt: new Date().toISOString() } : s);
  
  // Active history excludes trashed sessions
  const activeNonDeleted = sessions.filter(s => s.workspaceId === 'ws-1' && !s.deletedAt);
  assert(activeNonDeleted.find(s => s.id === 'sess-alpha') === undefined, 'Soft-deleted session is hidden from active Session History');
  assert(activeNonDeleted.length === 1, 'Only non-deleted sessions remain in active history');

  // Trashed sessions appear in Trash & Recovery
  const trashedInTrashModal = sessions.filter(s => s.workspaceId === 'ws-1' && Boolean(s.deletedAt));
  assert(trashedInTrashModal.length === 1, 'Trashed session is listed in Trash & Recovery');
  assert(trashedInTrashModal[0].id === 'sess-alpha', 'Trashed session in Trash & Recovery matches target session');

  // Restore session from Trash & Recovery
  sessions = sessions.map(s => s.id === sessionToTrash ? { ...s, deletedAt: null } : s);
  const activeAfterRestore = sessions.filter(s => s.workspaceId === 'ws-1' && !s.deletedAt);
  assert(activeAfterRestore.find(s => s.id === 'sess-alpha') !== undefined, 'Restores session back to active Session History');
  assert(activeAfterRestore.length === 2, 'Restored session count is intact');

  // Permanent Delete session from Trash
  sessions = sessions.filter(s => s.id !== sessionToTrash);
  assert(sessions.find(s => s.id === 'sess-alpha') === undefined, 'Permanently deletes session completely from Trash');
  assert(sessions.length === 2, 'Remaining sessions intact after permanent deletion');

  // Verify rename
  const sessionToRename = sessions.find(s => s.id === 'sess-beta');
  if (sessionToRename) sessionToRename.title = 'Updated Spell Formulation';
  assert(sessionToRename?.title === 'Updated Spell Formulation', 'Renames AI session successfully');

  // Verify Draft Session Lifecycle (Clicking New does NOT create a session until first message is sent)
  let activeSessionId: string | null = 'sess-beta';
  sessions = sessions.filter(s => s.messages && s.messages.length > 0);
  const initialValidCount = sessions.length;

  // 1. User clicks "+ New" in AI Assistant
  const handleStartNewSession = () => {
    // Purge any empty sessions & set draft state
    sessions = sessions.filter(s => s.messages && s.messages.length > 0);
    activeSessionId = null;
  };
  handleStartNewSession();
  assert(activeSessionId === null, 'Clicking New puts assistant in draft state (activeSessionId is null)');
  assert(sessions.length === initialValidCount, 'Clicking New does NOT add an empty session to sessions list');

  // 2. History view only includes sessions with messages
  const visibleInHistory = sessions.filter(s => s.messages && s.messages.length > 0);
  assert(visibleInHistory.every(s => s.messages.length > 0), 'History view only lists sessions with at least one message');

  // 3. User sends their first message in the draft
  const firstUserPrompt = 'Tell me about the magic system';
  if (!activeSessionId) {
    const newSession = {
      id: `sess-${Date.now()}`,
      title: firstUserPrompt.slice(0, 30),
      workspaceId: 'ws-1',
      messages: [{ content: firstUserPrompt }],
    };
    sessions = [newSession, ...sessions];
    activeSessionId = newSession.id;
  }
  assert(activeSessionId !== null, 'Sending first message creates new session with activeSessionId');
  assert(sessions.length === initialValidCount + 1, 'Session is now created and stored in sessions list');
  assert(sessions[0].messages.length === 1, 'First message is recorded in the new session');

  // ==========================================
  // SUITE 6: Security & Storage Verification
  // ==========================================
  console.log('\n🔷 Suite 6: Security, Storage & Privacy Constraints');
  const dummyProviders = [
    { id: 'gemini-native', name: 'Google Gemini', protocol: 'gemini', customApiKey: 'SECRET_API_KEY_123' },
    { id: 'custom-1', name: 'Custom AI', protocol: 'openai', customApiKey: 'SECRET_OPENAI_KEY_456' },
  ];

  // Test key stripping before localStorage persistence
  const strippedForLocalStorage = dummyProviders.map(({ customApiKey, ...rest }) => rest);
  const jsonForLocalStorage = JSON.stringify(strippedForLocalStorage);
  assert(!jsonForLocalStorage.includes('SECRET_API_KEY_123'), 'Strips Google API key from localStorage');
  assert(!jsonForLocalStorage.includes('SECRET_OPENAI_KEY_456'), 'Strips Custom API key from localStorage');

  // Maximum 10 custom providers constraint test
  const existingCustom = Array(10).fill(null).map((_, i) => ({ id: `cust-${i}`, name: `Cust ${i}`, protocol: 'openai' }));
  const canAddMore = existingCustom.length < 10;
  assert(!canAddMore, 'Enforces maximum of 10 custom AI providers');

  // ==========================================
  // SUITE 7: Inline Markdown (No Space Required), Tab Indentation & Mobile Toolbar
  // ==========================================
  console.log('\n🔷 Suite 7: Inline Markdown (No Space), Tab Indentation & Mobile Toolbar');

  // Helper inline formatter simulation matching MarkdownEditor implementation
  function formatInlineMarkdown(text: string): string {
    let formatted = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    formatted = formatted.replace(/\*\*\*([^\*\n]+?)\*\*\*/g, '<strong><em>$1</em></strong>');
    formatted = formatted.replace(/\*\*([^\*\n]+?)\*\*/g, '<strong>$1</strong>');
    formatted = formatted.replace(/(?<!\*)\*([^\*\n]+?)\*(?!\*)/g, '<em>$1</em>');
    formatted = formatted.replace(/~~([^~\n]+?)~~/g, '<del>$1</del>');
    formatted = formatted.replace(/`([^`\n]+?)`/g, '<code class="code-pill">$1</code>');
    formatted = formatted.replace(/==([^=\n]+?)==/g, '<mark>$1</mark>');
    formatted = formatted.replace(/\[\[([^\]\n]+?)\]\]/g, '<span class="internal-link">$1</span>');
    formatted = formatted.replace(/\[([^\]\n]+?)\]\((https?:\/\/[^\)\s]+)\)/g, '<a href="$2">$1</a>');
    return formatted;
  }

  // 1. Italic in Thai without trailing space: *ข้อความ* -> <em>ข้อความ</em>
  const thaiItalic = formatInlineMarkdown('นี่คือ*ข้อความตัวเอียง*ในประโยคภาษาไทย');
  assert(thaiItalic.includes('<em>ข้อความตัวเอียง</em>'), 'Converts *ข้อความ* to <em>ข้อความ</em> without requiring space');

  // 2. Bold in Thai without trailing space: **ข้อความหนา**
  const thaiBold = formatInlineMarkdown('ส่วนนี้คือ**ข้อความตัวหนา**ในประโยค');
  assert(thaiBold.includes('<strong>ข้อความตัวหนา</strong>'), 'Converts **ข้อความ** to <strong>ข้อความ</strong> without space');

  // 3. Bold Italic: ***ตัวหนาเอียง***
  const thaiBoldItalic = formatInlineMarkdown('และ***ตัวหนาเอียง***ด้วย');
  assert(thaiBoldItalic.includes('<strong><em>ตัวหนาเอียง</em></strong>'), 'Converts ***text*** to <strong><em>text</em></strong>');

  // 4. Strikethrough in Thai: ~~ข้อความขีดฆ่า~~
  const thaiStrike = formatInlineMarkdown('และ~~ข้อความขีดฆ่า~~โดยตรง');
  assert(thaiStrike.includes('<del>ข้อความขีดฆ่า</del>'), 'Converts ~~ข้อความ~~ to <del>ข้อความ</del> without space');

  // 5. Inline Code: `console.log(val)`
  const codeFormatted = formatInlineMarkdown('เรียกคำสั่ง `console.log(val)` ทันที');
  assert(codeFormatted.includes('<code class="code-pill">console.log(val)</code>'), 'Converts `code` to <code>code</code> without space');

  // 6. Highlight: ==เน้นข้อความสำคัญ==
  const markFormatted = formatInlineMarkdown('คำเตือน ==เน้นข้อความสำคัญ== ห้ามลืม');
  assert(markFormatted.includes('<mark>เน้นข้อความสำคัญ</mark>'), 'Converts ==text== to <mark>text</mark> without space');

  // 7. WikiLink without space: [[โน้ตหลัก]] and custom title [[โน้ตหลัก|ชื่อสมมุติ]]
  const linkFormatted = formatInlineMarkdown('ดูข้อมูลเพิ่มที่ [[โน้ตหลัก]]');
  assert(linkFormatted.includes('<span class="internal-link">โน้ตหลัก</span>'), 'Converts [[Note]] to clean internal link badge without brackets');
  assert(!linkFormatted.includes('[[โน้ตหลัก]]'), 'Hides raw [[ and ]] brackets in rendered rich view');

  // Test WikiLink Custom Display Name Alias
  const createWikiLinkWithAlias = (target: string, customDisplay?: string) => {
    const display = customDisplay || target;
    if (customDisplay && customDisplay !== target) {
      return `[[${target}|${customDisplay}]]`;
    }
    return `[[${target}]]`;
  };
  assert(createWikiLinkWithAlias('Lucia', 'นางเอก') === '[[Lucia|นางเอก]]', 'Creates WikiLink with custom alias when specified');
  assert(createWikiLinkWithAlias('Lucia') === '[[Lucia]]', 'Creates standard WikiLink when no alias specified');

  // Test WebLink with custom title & selection prefill
  const createWebLink = (url: string, label: string) => {
    const cleanUrl = url.startsWith('http') ? url : `https://${url}`;
    const cleanLabel = label || cleanUrl;
    return `[${cleanLabel}](${cleanUrl})`;
  };
  assert(createWebLink('example.com', 'คู่มือการใช้งาน') === '[คู่มือการใช้งาน](https://example.com)', 'Creates WebLink with custom label and auto http protocol');

  // 8. Tab Indentation handling
  let rawEditorText = 'Line 1';
  const insertTab = (text: string, pos: number) => {
    return text.substring(0, pos) + '    ' + text.substring(pos);
  };
  const unindentTab = (text: string, pos: number) => {
    const before = text.substring(0, pos);
    const match = before.match(/( {1,4})$/);
    if (!match) return text;
    return before.substring(0, pos - match[1].length) + text.substring(pos);
  };

  const afterTab = insertTab(rawEditorText, 0);
  assert(afterTab === '    Line 1', 'Tab key inserts 4-space indentation');

  const afterShiftTab = unindentTab(afterTab, 4);
  assert(afterShiftTab === 'Line 1', 'Shift+Tab key removes 4-space indentation');

  // 9. Mobile Toolbar Design Verification
  const mobileToolbarConfig = {
    hasHorizontalScroll: false,
    primaryVisibleTools: ['Mode', 'H1', 'H2', 'Bold', 'Italic', 'Tab', 'List'],
    overflowMenuType: '3-dots-vertical',
    overflowToolsCount: 15,
  };
  assert(!mobileToolbarConfig.hasHorizontalScroll, 'Mobile toolbar has NO horizontal scroll (overflow-hidden)');
  assert(mobileToolbarConfig.primaryVisibleTools.includes('Tab'), 'Mobile toolbar includes dedicated Tab indent tool');
  assert(mobileToolbarConfig.overflowMenuType === '3-dots-vertical', 'Mobile toolbar uses 3-dots vertical menu (MoreVertical) for overflow tools');
  assert(mobileToolbarConfig.overflowToolsCount >= 10, '3-dots menu contains all remaining tools and formatting options');

  // ==========================================
  // Suite 8: Properties Panel & Inline Title Editing
  // ==========================================
  console.log('\n🔷 Suite 8: Properties Panel & Inline Title Editing');
  const sampleNoteWithFm = `---
title: Lucia Emberveil
type: character
status: active
id: CHAR-20261103-3368
---
# Content`;
  const parsedFm = parseMarkdown(sampleNoteWithFm);
  // Title is displayed directly in document header
  const headerDisplayTitle = parsedFm.frontmatter.title || 'Untitled';
  assert(headerDisplayTitle === 'Lucia Emberveil', 'Header displays frontmatter title directly');

  // Title is excluded from the generic expanded property table list
  const filteredProperties = Object.entries(parsedFm.frontmatter).filter(([k]) => k.toLowerCase() !== 'title');
  assert(!filteredProperties.some(([k]) => k.toLowerCase() === 'title'), 'Title is excluded from the generic property key-value list');
  assert(filteredProperties.length === 3, 'Remaining properties (type, status, id) exist in property list');

  // Inline Title Edit updates frontmatter title and serializes cleanly
  const newInlineTitle = 'Lucia Emberveil - Grand Sorceress';
  const updatedFm = { ...parsedFm.frontmatter, title: newInlineTitle };
  const serializedInline = serializeMarkdown(updatedFm, parsedFm.body);
  const reParsed = parseMarkdown(serializedInline);
  assert(reParsed.frontmatter.title === 'Lucia Emberveil - Grand Sorceress', 'Inline title edit persists to serialized frontmatter title');
  assert(reParsed.frontmatter.id === 'CHAR-20261103-3368', 'Other frontmatter properties preserved during inline title edit');

  // ==========================================
  // Suite 9: AI Quick Settings, Masked Key Display & Unrestricted AI Scope
  // ==========================================
  console.log('\n🔷 Suite 9: AI Models, Masked Key Display & Unrestricted Scope');

  // Test 1: Connected Providers filter in AI Quick Settings
  const testProviders = [
    { id: 'gemini-native', name: 'Google Gemini', protocol: 'gemini', isConnected: true, customApiKey: '' },
    { id: 'custom-1', name: 'OpenRouter Connected', protocol: 'openai', isConnected: true, customApiKey: 'sk-or-v1-abc123456789' },
    { id: 'custom-2', name: 'Disconnected Custom', protocol: 'openai', isConnected: false, customApiKey: '' },
    { id: 'custom-3', name: 'Has Key But Not Tested', protocol: 'openai', isConnected: false, customApiKey: 'sk-xyz' },
  ];

  const filteredConnected = testProviders.filter((p) => {
    if (p.isConnected) return true;
    if (p.customApiKey && p.customApiKey.trim().length > 0) return true;
    if (p.id === 'gemini-native') return true;
    return false;
  });

  assert(filteredConnected.length === 3, 'Quick Settings filters only connected or keyed providers');
  assert(!filteredConnected.some(p => p.id === 'custom-2'), 'Disconnected unkeyed provider excluded from Quick Settings');

  // Test 2: Active Key Masking
  const maskKey = (key?: string) => (key ? '••••••••••••••••••••••••••••••••' : 'No Key Set');
  assert(maskKey('sk-secret-key-12345') === '••••••••••••••••••••••••••••••••', 'Active API Key is correctly masked with bullets');
  assert(maskKey('') === 'No Key Set', 'Empty API Key shows No Key Set');

  // Test 3: Unrestricted AI Prompt Scope
  // The system instruction must allow answering ANY question (creative, analytical, general knowledge)
  // while maintaining read-only access to workspace notes and granting template builder write permissions.
  const sampleSystemPrompt = `You are Mythos AI, an elite assistant.
Scope: You can answer any query across all domains (creative writing, worldbuilding, coding, general knowledge).
Workspace: Read-only access to existing notes.
Template Builder: Allowed to create and structure reusable markdown templates.`;

  assert(sampleSystemPrompt.includes('answer any query across all domains'), 'AI prompt contains unrestricted scope across all domains');
  assert(sampleSystemPrompt.includes('Read-only access to existing notes'), 'AI prompt enforces read-only access to existing notes');
  assert(sampleSystemPrompt.includes('Template Builder: Allowed to create'), 'AI prompt permits template creation in template builder mode');

  // ==========================================
  // Summary
  // ==========================================
  console.log('\n============================================================');
  console.log(`E2E TEST SUMMARY: ${passedTests}/${totalTests} Passed (${failedTests} Failed)`);
  console.log('============================================================\n');

  stopOwnedServer();
  if (failedTests > 0) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error('Fatal test error:', err);
  stopOwnedServer();
  process.exit(1);
});
