import { useEffect, useRef, useState } from "react";
import { Box, Input, Text } from "@zenbu-labs/pixel";
import type { NodeHandle } from "@zenbu-labs/pixel";
import { DialogButton } from "./clear-data-dialog";
import { Icon } from "./icons";
import { Backdrop } from "./modals";
import type { Theme } from "./theme";
import type { BookmarkDialogView, BookmarkPickRow, ChromeActions, ChromeLayout } from "./types";

const COPY = {
  add: "Add bookmark",
  move: "Move bookmark",
  name: "Name",
  folder: "Folder",
  newFolder: "New folder",
  cancel: "Cancel",
  save: "Save",
};

export function BookmarkPicker({
  view,
  actions,
  layout,
  theme,
}: {
  view: BookmarkDialogView;
  actions: ChromeActions;
  layout: ChromeLayout;
  theme: Theme;
}) {
  const rem = layout.rem;
  const width = Math.min(rem * 26, layout.width - rem * 2);
  const rowH = Math.round(rem * 1.7);
  const listHeight = Math.min(rowH * 9, Math.max(rowH * 3, layout.height - layout.toolbarHeight - rem * 14));
  const selectedFolderDisabled = view.rows.find((row) => row.id === view.selected)?.disabled ?? false;
  const [name, setName] = useState(view.name);
  const nameInput = useRef<NodeHandle | null>(null);
  useEffect(() => {
    nameInput.current?.focus();
    nameInput.current?.selectAll();
  }, []);
  return (
    <>
      <Backdrop layout={layout} onClose={() => actions.bookmarkDialogAction("cancel", null)} />
      <Box
        style={{
          position: "absolute",
          inset: { top: layout.toolbarHeight + rem * 0.9, left: Math.round((layout.width - width) / 2) },
          width,
          flexDirection: "column",
          gap: rem * 0.8,
          padding: { left: rem * 1.2, right: rem * 1.2, top: rem * 1, bottom: rem * 1.1 },
          background: theme.overlay,
          cornerRadius: rem * 0.8,
          border: { width: 1, color: theme.fieldBorder },
        }}
        onClick={() => {}}
      >
        <Box style={{ alignItems: "center", gap: rem * 0.5 }}>
          <Text style={{ flexGrow: 1, flexBasis: 0, fontSize: rem * 1.15, color: theme.fg, wrap: false, selectable: false }}>
            {view.mode === "add" ? COPY.add : COPY.move}
          </Text>
          <Box
            style={{
              width: rem * 1.5,
              height: rem * 1.5,
              alignItems: "center",
              justifyContent: "center",
              cornerRadius: rem * 0.3,
              hoverBackground: theme.hover,
              flexShrink: 0,
            }}
            onClick={() => actions.bookmarkDialogAction("cancel", null)}
          >
            <Icon icon="close" size={rem * 1} color={theme.fg} />
          </Box>
        </Box>
        <Box style={{ flexDirection: "column", gap: rem * 0.3 }}>
          <Text style={{ fontSize: rem * 0.75, color: theme.muted, wrap: false, selectable: false }}>{COPY.name}</Text>
          <Box
            style={{
              height: rem * 2,
              alignItems: "center",
              padding: { left: rem * 0.6, right: rem * 0.6 },
              background: theme.field,
              cornerRadius: rem * 0.4,
              border: { width: 1, color: theme.fieldBorder },
            }}
          >
            <Input
              ref={nameInput}
              autoFocus
              value={name}
              style={{ flexGrow: 1, flexBasis: 0, wrap: false, fontSize: rem * 0.9 }}
              caretColor={theme.accent}
              selectionColor={theme.selection}
              onChange={(text) => {
                setName(text);
                actions.bookmarkDialogName(text);
              }}
              onSubmit={() => actions.bookmarkDialogAction("save", null)}
            />
          </Box>
          {view.url && (
            <Text style={{ fontSize: rem * 0.72, color: theme.muted, wrap: false, ellipsis: true, selectable: false }}>
              {view.url}
            </Text>
          )}
        </Box>
        <Box style={{ flexDirection: "column", gap: rem * 0.3 }}>
          <Text style={{ fontSize: rem * 0.75, color: theme.muted, wrap: false, selectable: false }}>{COPY.folder}</Text>
          <Box
            style={{
              height: listHeight,
              flexDirection: "column",
              overflow: "scroll",
              background: theme.field,
              cornerRadius: rem * 0.4,
              border: { width: 1, color: theme.fieldBorder },
              padding: rem * 0.2,
            }}
          >
            {view.rows.map((row) => (
              <FolderRow
                key={row.id ?? "root"}
                row={row}
                selected={row.id === view.selected}
                rowH={rowH}
                rem={rem}
                theme={theme}
                actions={actions}
              />
            ))}
          </Box>
        </Box>
        <Box style={{ alignItems: "center", gap: rem * 0.6 }}>
          <DialogButton
            label={COPY.newFolder}
            tone="neutral"
            enabled={!selectedFolderDisabled}
            rem={rem}
            theme={theme}
            onClick={() => actions.bookmarkDialogAction("new-folder", null)}
          />
          <Box style={{ flexGrow: 1, flexBasis: 0 }} />
          <DialogButton
            label={COPY.cancel}
            tone="neutral"
            enabled
            rem={rem}
            theme={theme}
            onClick={() => actions.bookmarkDialogAction("cancel", null)}
          />
          <DialogButton
            label={COPY.save}
            tone="neutral"
            enabled={view.canSave}
            rem={rem}
            theme={theme}
            onClick={() => actions.bookmarkDialogAction("save", null)}
          />
        </Box>
      </Box>
    </>
  );
}

function FolderRow({
  row,
  selected,
  rowH,
  rem,
  theme,
  actions,
}: {
  row: BookmarkPickRow;
  selected: boolean;
  rowH: number;
  rem: number;
  theme: Theme;
  actions: ChromeActions;
}) {
  const color = row.disabled ? theme.disabled : theme.fg;
  return (
    <Box
      style={{
        height: rowH,
        alignItems: "center",
        gap: rem * 0.3,
        padding: { left: rem * 0.3 + row.depth * rem * 0.9, right: rem * 0.4 },
        background: selected ? theme.selection : undefined,
        cornerRadius: rem * 0.3,
        flexShrink: 0,
      }}
    >
      {row.hasChildren ? (
        <Box
          style={{
            width: rem * 1.3,
            height: rem * 1.3,
            alignItems: "center",
            justifyContent: "center",
            cornerRadius: rem * 0.3,
            hoverBackground: theme.hover,
            flexShrink: 0,
          }}
          onClick={() => actions.bookmarkDialogAction("toggle", row.id)}
        >
          <Icon icon={row.expanded ? "down" : "forward"} size={rem * 0.8} color={theme.muted} />
        </Box>
      ) : (
        <Box style={{ width: rem * 1.3, height: rem * 1.3, flexShrink: 0 }} />
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
        }}
        onClick={row.disabled ? undefined : () => actions.bookmarkDialogAction("select", row.id)}
      >
        <Icon icon="folder" size={rem * 0.85} color={color} />
        <Text
          style={{
            flexGrow: 1,
            flexBasis: 0,
            minWidth: 0,
            fontSize: rem * 0.82,
            color,
            wrap: false,
            ellipsis: true,
            selectable: false,
          }}
        >
          {row.title}
        </Text>
      </Box>
    </Box>
  );
}
