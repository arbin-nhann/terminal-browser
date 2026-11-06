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
  return collectBookmarks(tree).some((item) => item.url === url);
}
