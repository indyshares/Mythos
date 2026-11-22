import type { Workspace, Folder, FileItem, WorkspaceInstructions } from '../types';

// Mythos starts empty. No seeded workspaces, folders, files or instructions.
export const INITIAL_WORKSPACES: Workspace[] = [];
export const INITIAL_FOLDERS: Folder[] = [];
export const INITIAL_FILES: FileItem[] = [];
export const INITIAL_INSTRUCTIONS: Record<string, WorkspaceInstructions> = {};
