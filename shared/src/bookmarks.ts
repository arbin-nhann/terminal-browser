import crypto from "node:crypto";

import { z } from "zod";

export interface BookmarkItem {
  id: string;
  kind: "bookmark";
  title: string;
  url: string;
}

export interface BookmarkFolder {
  id: string;
  kind: "folder";
  title: string;
  children: BookmarkNode[];
}

export type BookmarkNode = BookmarkItem | BookmarkFolder;

export const bookmarkNodeSchema: z.ZodType<BookmarkNode> = z.lazy(() =>
  z.discriminatedUnion("kind", [
    z.object({ id: z.string(), kind: z.literal("bookmark"), title: z.string(), url: z.string() }),
    z.object({
      id: z.string(),
      kind: z.literal("folder"),
      title: z.string(),
      children: z.array(bookmarkNodeSchema),
    }),
  ]),
);

export const bookmarkTreeSchema = z.array(bookmarkNodeSchema);

export function newBookmarkId(): string {
  return crypto.randomUUID();
}

export function addBookmarkNode(
  tree: BookmarkNode[],
  folderId: string | null,
  node: BookmarkNode,
): BookmarkNode[] {
  if (folderId === null) return [...tree, node];
  return tree.map((entry) => {
    if (entry.kind !== "folder") return entry;
    if (entry.id === folderId) return { ...entry, children: [...entry.children, node] };
    return { ...entry, children: addBookmarkNode(entry.children, folderId, node) };
  });
}

export function removeBookmarkNode(tree: BookmarkNode[], id: string): BookmarkNode[] {
  return tree
    .filter((entry) => entry.id !== id)
    .map((entry) =>
      entry.kind === "folder" ? { ...entry, children: removeBookmarkNode(entry.children, id) } : entry,
    );
}

export function findBookmarkNode(tree: BookmarkNode[], id: string): BookmarkNode | null {
  for (const entry of tree) {
    if (entry.id === id) return entry;
    if (entry.kind !== "folder") continue;
    const found = findBookmarkNode(entry.children, id);
    if (found) return found;
  }
  return null;
}

export function bookmarksInFolder(tree: BookmarkNode[], folderId: string): BookmarkItem[] {
  const folder = findBookmarkNode(tree, folderId);
  if (!folder || folder.kind !== "folder") return [];
  return collectBookmarks(folder.children);
}

function collectBookmarks(nodes: BookmarkNode[]): BookmarkItem[] {
  return nodes.flatMap((node) => (node.kind === "bookmark" ? [node] : collectBookmarks(node.children)));
}

export function containsBookmarkUrl(tree: BookmarkNode[], url: string): boolean {
  return findBookmarkByUrl(tree, url) !== null;
}

export function findBookmarkByUrl(tree: BookmarkNode[], url: string): BookmarkItem | null {
  return collectBookmarks(tree).find((item) => item.url === url) ?? null;
}

export function bookmarkParentId(tree: BookmarkNode[], id: string, parent: string | null = null): string | null {
  for (const entry of tree) {
    if (entry.id === id) return parent;
    if (entry.kind !== "folder") continue;
    const inside = bookmarkParentId(entry.children, id, entry.id);
    if (inside !== null) return inside;
  }
  return null;
}

export function bookmarkSubtreeIds(tree: BookmarkNode[], id: string): Set<string> {
  const node = findBookmarkNode(tree, id);
  const ids = new Set<string>();
  const visit = (entry: BookmarkNode) => {
    ids.add(entry.id);
    if (entry.kind === "folder") entry.children.forEach(visit);
  };
  if (node) visit(node);
  return ids;
}

export function moveBookmarkNode(tree: BookmarkNode[], id: string, folderId: string | null): BookmarkNode[] {
  const node = findBookmarkNode(tree, id);
  if (!node) return tree;
  if (folderId !== null && bookmarkSubtreeIds(tree, id).has(folderId)) return tree;
  return addBookmarkNode(removeBookmarkNode(tree, id), folderId, node);
}
