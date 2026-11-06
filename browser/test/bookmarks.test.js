const assert = require("node:assert/strict");
const { test } = require("node:test");

const {
  addBookmarkNode,
  bookmarksInFolder,
  containsBookmarkUrl,
  findBookmarkNode,
  removeBookmarkNode,
} = require("shared");
const { bookmarkRowViews } = require("../dist/session/bookmark-view.js");

const item = (id, url) => ({ id, kind: "bookmark", title: id, url });
const folder = (id, children = []) => ({ id, kind: "folder", title: id, children });

test("adding to root and into a nested folder keeps the tree shape", () => {
  let tree = addBookmarkNode([], null, folder("work"));
  tree = addBookmarkNode(tree, "work", folder("inner"));
  tree = addBookmarkNode(tree, "inner", item("a", "https://a.test/"));
  tree = addBookmarkNode(tree, null, item("root", "https://root.test/"));
  assert.equal(tree.length, 2);
  assert.deepEqual(
    bookmarksInFolder(tree, "work").map((entry) => entry.url),
    ["https://a.test/"],
  );
  assert.equal(findBookmarkNode(tree, "a").url, "https://a.test/");
});

test("opening a folder collects every bookmark beneath it, in order", () => {
  const tree = [
    folder("f", [item("1", "https://1.test/"), folder("g", [item("2", "https://2.test/")]), item("3", "https://3.test/")]),
  ];
  assert.deepEqual(
    bookmarksInFolder(tree, "f").map((entry) => entry.url),
    ["https://1.test/", "https://2.test/", "https://3.test/"],
  );
  assert.deepEqual(bookmarksInFolder(tree, "missing"), []);
});

test("removing a folder removes everything inside it", () => {
  const tree = [folder("f", [item("1", "https://1.test/")]), item("2", "https://2.test/")];
  const next = removeBookmarkNode(tree, "f");
  assert.deepEqual(next, [item("2", "https://2.test/")]);
});

test("duplicate detection looks through every folder", () => {
  const tree = [folder("f", [folder("g", [item("1", "https://1.test/")])])];
  assert.equal(containsBookmarkUrl(tree, "https://1.test/"), true);
  assert.equal(containsBookmarkUrl(tree, "https://2.test/"), false);
});

test("row views flatten the tree and hide children of collapsed folders", () => {
  const tree = [folder("f", [item("1", "https://1.test/"), folder("g", [item("2", "https://2.test/")])]), item("3", "https://3.test/")];
  const open = bookmarkRowViews(tree, new Set());
  assert.deepEqual(
    open.map((row) => [row.id, row.depth, row.expanded]),
    [["f", 0, true], ["1", 1, false], ["g", 1, true], ["2", 2, false], ["3", 0, false]],
  );
  const collapsed = bookmarkRowViews(tree, new Set(["f"]));
  assert.deepEqual(collapsed.map((row) => row.id), ["f", "3"]);
});

test("moving an item into another folder removes it from its old place", () => {
  const tree = [folder("a", [item("1", "https://1.test/")]), folder("b")];
  const next = require("shared").moveBookmarkNode(tree, "1", "b");
  assert.deepEqual(bookmarksInFolder(next, "a"), []);
  assert.deepEqual(bookmarksInFolder(next, "b").map((entry) => entry.id), ["1"]);
});

test("a folder cannot be moved into itself or one of its descendants", () => {
  const { moveBookmarkNode } = require("shared");
  const tree = [folder("f", [folder("g")])];
  assert.deepEqual(moveBookmarkNode(tree, "f", "g"), tree);
  assert.deepEqual(moveBookmarkNode(tree, "f", "f"), tree);
});

test("parent lookup returns null for root items and the folder otherwise", () => {
  const { bookmarkParentId } = require("shared");
  const tree = [item("root", "https://r.test/"), folder("f", [item("1", "https://1.test/")])];
  assert.equal(bookmarkParentId(tree, "root"), null);
  assert.equal(bookmarkParentId(tree, "1"), "f");
});

test("folder picker rows put the root first and disable the excluded folders", () => {
  const { bookmarkFolderRows } = require("../dist/session/bookmark-view.js");
  const tree = [folder("a", [folder("b")]), folder("c")];
  const rows = bookmarkFolderRows(tree, new Set(), new Set(["a", "b"]));
  assert.deepEqual(rows.map((row) => [row.id, row.depth, row.disabled]), [
    [null, 0, false],
    ["a", 1, true],
    ["b", 2, true],
    ["c", 1, false],
  ]);
});

test("renaming changes only the chosen node and keeps the tree shape", () => {
  const { renameBookmarkNode } = require("shared");
  const tree = [folder("f", [item("1", "https://1.test/")]), item("2", "https://2.test/")];
  const next = renameBookmarkNode(tree, "f", "Work");
  assert.equal(next[0].title, "Work");
  assert.equal(next[0].children[0].title, "1");
  assert.equal(next[1].title, "2");
});

test("the smart invert script parses as a page script", () => {
  const { SMART_INVERT_SCRIPT } = require("../dist/session/smart-invert.js");
  assert.doesNotThrow(() => new Function(SMART_INVERT_SCRIPT));
});
