export type NoteType =
  | 'character'
  | 'worldbuilding'
  | 'location'
  | 'event'
  | 'journal'
  | 'writing-log'
  | 'idea'
  | 'quest'
  | 'promise'
  | 'general';

export interface FrontmatterProperties {
  id?: string;
  title?: string;
  type?: NoteType | string;
  status?: string;
  tags?: string[];
  related?: string[];
  story_date?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

export interface Workspace {
  id: string;
  name: string;
  description: string;
  icon: string;
  createdAt: string;
  updatedAt: string;
}

export interface Folder {
  id: string;
  workspaceId: string;
  parentId: string | null; // null = Root '/'
  name: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface FileItem {
  id: string;
  workspaceId: string;
  parentId: string | null; // null = Root '/'
  name: string; // e.g. "Lucia.md"
  extension: string;
  content: string;
  size: number;
  version: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  frontmatter?: FrontmatterProperties;
}

export interface FileVersion {
  id: string;
  fileId: string;
  version: number;
  content: string;
  timestamp: string;
  summary?: string;
}

export interface FileOperation {
  id: string;
  workspaceId: string;
  operationType: 'move' | 'rename' | 'delete' | 'restore';
  targetIds: string[];
  previousState: any;
  newState: any;
  timestamp: string;
}

export interface NoteTemplate {
  id: string;
  name: string;
  category: string; // Dynamic categories allowed
  description: string;
  icon: string;
  defaultFilename: string;
  templateContent: string;
  isCustom?: boolean;
}

export interface SourceCitation {
  fileId: string;
  fileName: string;
  filePath: string;
  snippets: string[];
}

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  citations?: SourceCitation[];
  editedAt?: string;
  model?: string;
  isCompactedSummary?: boolean;
}

export interface AISession {
  id: string;
  workspaceId: string;
  title: string;
  agentMode?: 'ask' | 'build';
  messages: AIMessage[];
  contextLimit?: number; // token limit, default 100,000
  tokenUsage?: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export type DatabaseType = 'cloudflare-d1' | 'supabase' | 'local-sqlite' | 'local-postgres' | 'local-server';

export interface DatabaseConfig {
  type: DatabaseType;
  enabled: boolean;
  accountId?: string;
  databaseId?: string;
  apiToken?: string;
  connectionString?: string;
  host?: string;
  port?: number;
  user?: string;
  password?: string;
  databaseName?: string;
  filePath?: string;
  lastSyncedAt?: string;
  status: 'idle' | 'connected' | 'error' | 'syncing';
  errorMessage?: string;
}

export type AIProviderId = 
  | 'gemini' 
  | 'opencode' 
  | 'openrouter' 
  | 'anthropic' 
  | 'openai' 
  | 'deepseek' 
  | 'groq' 
  | 'custom';

export interface AIProviderConfig {
  id: string;
  name: string;
  protocol: 'gemini' | 'openai';
  baseUrl?: string;
  customApiKey?: string;
  defaultModel: string;
  availableModels?: string[];
  isDefault?: boolean;
  isConnected?: boolean;
}

export interface WorkspaceInstructions {
  workspaceId: string;
  content: string;
  updatedAt: string;
}

export interface TabItem {
  fileId: string;
  isPinned?: boolean;
}

export type ActiveView = 'editor' | 'timeline' | 'graph' | 'trash' | 'templates' | 'ai' | 'sessions';


export type ResponseConciseness = 'detailed' | 'concise' | 'balanced';

