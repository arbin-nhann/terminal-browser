const STYLE_ID = "terminal-browser-smart-invert";
const CSS =
  "html{filter:invert(1) hue-rotate(180deg)}" +
  "img,picture,video,canvas,iframe,svg,[style*='background-image']{filter:invert(1) hue-rotate(180deg)}";

export const SMART_INVERT_SCRIPT =
  `(() => {` +
  `const old = document.getElementById(${JSON.stringify(STYLE_ID)});` +
  `if (old) { old.remove(); return false; }` +
  `const style = document.createElement("style");` +
  `style.id = ${JSON.stringify(STYLE_ID)};` +
  `style.textContent = ${JSON.stringify(CSS)};` +
  `document.documentElement.appendChild(style);` +
  `return true;` +
  `})();`;
