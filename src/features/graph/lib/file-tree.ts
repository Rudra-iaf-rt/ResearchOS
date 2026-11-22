import type { Folder, ResearchFile } from "@/types";

export interface FileTreeFolder {
  id: string;
  name: string;
  parentId: string | null;
  projectId: string | null;
  folders: FileTreeFolder[];
  files: ResearchFile[];
  /** Total bytes of all files in this folder and its descendants. */
  size: number;
  fileCount: number;
}

export interface FileTreeData {
  roots: FileTreeFolder[];
  unfiled: ResearchFile[];
}

const byName = <T extends { name: string }>(a: T, b: T) => a.name.localeCompare(b.name);

function createsCycle(folderById: Map<string, Folder>, folder: Folder): boolean {
  let cursor = folder.parentId ? folderById.get(folder.parentId) : null;
  const seen = new Set<string>();
  while (cursor) {
    if (cursor.id === folder.id) return true;
    if (seen.has(cursor.id)) return true;
    seen.add(cursor.id);
    cursor = cursor.parentId ? folderById.get(cursor.parentId) : null;
  }
  return false;
}

function rollUp(node: FileTreeFolder): { size: number; fileCount: number } {
  let size = node.files.reduce((sum, file) => sum + file.size, 0);
  let fileCount = node.files.length;
  node.folders.forEach((child) => {
    const totals = rollUp(child);
    size += totals.size;
    fileCount += totals.fileCount;
  });
  node.size = size;
  node.fileCount = fileCount;
  return { size, fileCount };
}

/**
 * Build a folder tree from flat records. Folders with a missing or cyclic
 * parent are promoted to roots so nothing disappears from the file manager.
 */
export function buildFileTree(folders: Folder[], files: ResearchFile[]): FileTreeData {
  const folderById = new Map(folders.map((folder) => [folder.id, folder]));
  const nodes = new Map<string, FileTreeFolder>();
  folders.forEach((folder) => {
    nodes.set(folder.id, {
      id: folder.id,
      name: folder.name,
      parentId: folder.parentId,
      projectId: folder.projectId ?? null,
      folders: [],
      files: [],
      size: 0,
      fileCount: 0,
    });
  });

  const roots: FileTreeFolder[] = [];
  folders.forEach((folder) => {
    const node = nodes.get(folder.id);
    if (!node) return;
    const parent = folder.parentId ? nodes.get(folder.parentId) : undefined;
    if (!parent || parent.id === folder.id || createsCycle(folderById, folder)) {
      roots.push(node);
    } else {
      parent.folders.push(node);
    }
  });

  const unfiled: ResearchFile[] = [];
  files.forEach((file) => {
    if (!file.folderId) {
      unfiled.push(file);
      return;
    }
    const folder = nodes.get(file.folderId);
    if (!folder) unfiled.push(file);
    else folder.files.push(file);
  });

  const sortFolder = (node: FileTreeFolder) => {
    node.folders.sort(byName);
    node.files.sort(byName);
    node.folders.forEach(sortFolder);
  };
  roots.sort(byName);
  roots.forEach((root) => {
    sortFolder(root);
    rollUp(root);
  });
  unfiled.sort(byName);

  return { roots, unfiled };
}

function folderChain(folders: Folder[], folderId: string): Folder[] {
  const byId = new Map(folders.map((folder) => [folder.id, folder]));
  const chain: Folder[] = [];
  let cursor = byId.get(folderId);
  const seen = new Set<string>();
  while (cursor && !seen.has(cursor.id)) {
    seen.add(cursor.id);
    chain.unshift(cursor);
    cursor = cursor.parentId ? byId.get(cursor.parentId) : undefined;
  }
  return chain;
}

/** A folder may not move into itself or any of its descendants. */
export function canMoveFolder(
  folders: Folder[],
  folderId: string,
  targetParentId: string | null,
): boolean {
  const folder = folders.find((item) => item.id === folderId);
  if (!folder) return false;
  if (!targetParentId) return true;
  if (targetParentId === folderId) return false;
  const target = folders.find((item) => item.id === targetParentId);
  if (!target) return false;
  return !folderChain(folders, targetParentId).some((item) => item.id === folderId);
}

export function folderBreadcrumb(folders: Folder[], folderId: string | null): Folder[] {
  if (!folderId) return [];
  return folderChain(folders, folderId);
}

export function folderDescendantIds(folders: Folder[], folderId: string): Set<string> {
  const ids = new Set<string>();
  const children = folders.filter((folder) => folder.parentId === folderId);
  children.forEach((child) => {
    ids.add(child.id);
    folderDescendantIds(folders, child.id).forEach((id) => ids.add(id));
  });
  return ids;
}
