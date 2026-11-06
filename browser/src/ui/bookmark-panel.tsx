import { Box, Text } from "@zenbu-labs/pixel";
import { Icon } from "./icons";
import type { IconName } from "./icons";
import type { Theme } from "./theme";
import type { BookmarkPanelView, BookmarkRowView, ChromeActions, ChromeLayout } from "./types";

export function BookmarkPanel({
  view,
  actions,
  layout,
  theme,
}: {
  view: BookmarkPanelView;
  actions: ChromeActions;
  layout: ChromeLayout;
  theme: Theme;
}) {
  const rem = layout.rem;
  const rowH = Math.round(rem * 1.7);
  const menuPad = Math.round(rem * 0.25);
  const width = Math.round(rem * 17);
  const listRows = Math.max(1, view.rows.length);
  const contentHeight = (2 + listRows) * rowH + menuPad * 4 + 1;
  const height = Math.min(contentHeight, Math.max(rowH * 4, layout.height - view.y - 8));
  const x = Math.max(2, Math.min(view.x, layout.width - width - 4));
  const y = Math.max(2, Math.min(view.y, layout.height - height - 4));
  return (
    <>
      <Box
        style={{ position: "absolute", inset: { top: 0, left: 0 }, width: layout.width, height: layout.height }}
        onClick={() => actions.pageMenuClose()}
      />
      <Box
        style={{
          position: "absolute",
          inset: { top: y, left: x },
          width,
          height,
          flexDirection: "column",
          padding: menuPad,
          background: theme.overlay,
          cornerRadius: rem * 0.45,
          border: { width: 1, color: theme.fieldBorder },
          overflow: "hidden",
        }}
      >
        <PanelRow
          label="Bookmark this page"
          shortcut={view.shortcut}
          rowH={rowH}
          rem={rem}
          theme={theme}
          onClick={() => actions.bookmarkAction("add-page", null)}
        />
        <PanelRow
          label="New folder"
          rowH={rowH}
          rem={rem}
          theme={theme}
          onClick={() => actions.bookmarkAction("add-folder", null)}
        />
        <Box style={{ height: 1, margin: { top: menuPad, bottom: menuPad }, background: theme.hairline, flexShrink: 0 }} />
        <Box style={{ flexDirection: "column", flexGrow: 1, flexBasis: 0, overflow: "scroll" }}>
          {view.rows.length === 0 ? (
            <Box style={{ height: rowH, alignItems: "center", padding: { left: rem * 0.4 } }}>
              <Text style={{ fontSize: rem * 0.82, color: theme.muted, wrap: false, selectable: false }}>
                No bookmarks yet
              </Text>
            </Box>
          ) : (
            view.rows.map((row) => <BookmarkRowItem key={row.id} row={row} rowH={rowH} rem={rem} theme={theme} actions={actions} />)
          )}
        </Box>
      </Box>
    </>
  );
}

function PanelRow({
  label,
  shortcut,
  rowH,
  rem,
  theme,
  onClick,
}: {
  label: string;
  shortcut?: string;
  rowH: number;
  rem: number;
  theme: Theme;
  onClick(): void;
}) {
  return (
    <Box
      style={{
        height: rowH,
        alignItems: "center",
        gap: rem * 0.45,
        padding: { left: rem * 0.4, right: rem * 0.6 },
        hoverBackground: theme.hover,
        cornerRadius: rem * 0.3,
        flexShrink: 0,
      }}
      onClick={onClick}
    >
      <Text style={{ flexGrow: 1, flexBasis: 0, fontSize: rem * 0.82, color: theme.fg, wrap: false, selectable: false }}>
        {label}
      </Text>
      {shortcut && (
        <Text style={{ fontSize: rem * 0.72, color: theme.muted, wrap: false, selectable: false }}>{shortcut}</Text>
      )}
    </Box>
  );
}

function BookmarkRowItem({
  row,
  rowH,
  rem,
  theme,
  actions,
}: {
  row: BookmarkRowView;
  rowH: number;
  rem: number;
  theme: Theme;
  actions: ChromeActions;
}) {
  const folder = row.kind === "folder";
  const indent = rem * 0.4 + row.depth * rem * 0.9;
  return (
    <Box
      style={{
        height: rowH,
        alignItems: "center",
        gap: rem * 0.3,
        padding: { left: indent, right: rem * 0.3 },
        cornerRadius: rem * 0.3,
        flexShrink: 0,
      }}
    >
      {folder ? (
        <IconButton
          icon={row.expanded ? "down" : "forward"}
          size={rem * 1.4}
          iconSize={rem * 0.8}
          rem={rem}
          theme={theme}
          onClick={() => actions.bookmarkAction("toggle", row.id)}
        />
      ) : (
        <Box style={{ width: rem * 1.4, height: rem * 1.4, flexShrink: 0 }} />
      )}
      <Box
        style={{
          flexGrow: 1,
          flexBasis: 0,
          minWidth: 0,
          height: rowH,
          flexDirection: "row",
          alignItems: "center",
          gap: rem * 0.4,
          hoverBackground: theme.hover,
          cornerRadius: rem * 0.3,
        }}
        onClick={() => actions.bookmarkAction(folder ? "open-folder" : "open", row.id)}
      >
        <Icon icon={folder ? "folder" : "bookmark"} size={rem * 0.85} color={theme.muted} />
        <Text
          style={{
            flexGrow: 1,
            flexBasis: 0,
            minWidth: 0,
            fontSize: rem * 0.82,
            color: theme.fg,
            wrap: false,
            ellipsis: true,
            selectable: false,
          }}
        >
          {row.title}
        </Text>
      </Box>
      {folder && (
        <>
          <IconButton
            icon="plus"
            size={rem * 1.4}
            iconSize={rem * 0.8}
            rem={rem}
            theme={theme}
            onClick={() => actions.bookmarkAction("add-page", row.id)}
          />
          <IconButton
            icon="folder"
            size={rem * 1.4}
            iconSize={rem * 0.85}
            rem={rem}
            theme={theme}
            onClick={() => actions.bookmarkAction("add-folder", row.id)}
          />
        </>
      )}
      <IconButton
        icon="move"
        size={rem * 1.4}
        iconSize={rem * 0.8}
        rem={rem}
        theme={theme}
        onClick={() => actions.bookmarkAction("move", row.id)}
      />
      <IconButton
        icon="close"
        size={rem * 1.4}
        iconSize={rem * 0.8}
        rem={rem}
        theme={theme}
        onClick={() => actions.bookmarkAction("remove", row.id)}
      />
    </Box>
  );
}

function IconButton({
  icon,
  size,
  iconSize,
  rem,
  theme,
  onClick,
}: {
  icon: IconName;
  size: number;
  iconSize: number;
  rem: number;
  theme: Theme;
  onClick(): void;
}) {
  return (
    <Box
      style={{
        width: size,
        height: size,
        alignItems: "center",
        justifyContent: "center",
        cornerRadius: rem * 0.3,
        hoverBackground: theme.hover,
        flexShrink: 0,
      }}
      onClick={onClick}
    >
      <Icon icon={icon} size={iconSize} color={theme.muted} />
    </Box>
  );
}
