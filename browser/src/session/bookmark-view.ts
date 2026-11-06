import type { BookmarkNode } from "shared";

import type { BookmarkRowView } from "../ui/types";

export function bookmarkRowViews(tree: BookmarkNode[], collapsed: ReadonlySet<string>): BookmarkRowView[] {
  const rows: BookmarkRowView[] = [];
  const walk = (nodes: BookmarkNode[], depth: number) => {
    for (const node of nodes) {
      const expanded = node.kind === "folder" && !collapsed.has(node.id);
      rows.push({ id: node.id, kind: node.kind, title: node.title, depth, expanded });
      if (node.kind === "folder" && expanded) walk(node.children, depth + 1);
    }
  };
  walk(tree, 0);
  return rows;
}
