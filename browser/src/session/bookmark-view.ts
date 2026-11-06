import type { BookmarkNode } from "shared";

import type { BookmarkPickRow, BookmarkRowView } from "../ui/types";

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

export function bookmarkFolderRows(
  tree: BookmarkNode[],
  collapsed: ReadonlySet<string>,
  disabled: ReadonlySet<string>,
): BookmarkPickRow[] {
  const rows: BookmarkPickRow[] = [{ id: null, title: "Bookmarks", depth: 0, expanded: true, hasChildren: true, disabled: false }];
  const walk = (nodes: BookmarkNode[], depth: number) => {
    for (const node of nodes) {
      if (node.kind !== "folder") continue;
      const expanded = !collapsed.has(node.id);
      rows.push({
        id: node.id,
        title: node.title,
        depth,
        expanded,
        hasChildren: node.children.some((child) => child.kind === "folder"),
        disabled: disabled.has(node.id),
      });
      if (expanded) walk(node.children, depth + 1);
    }
  };
  walk(tree, 1);
  return rows;
}
