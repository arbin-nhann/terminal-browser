const STYLE_ID = "terminal-browser-smart-invert";
const KEEP_ATTRIBUTE = "data-terminal-browser-keep";
const MEDIA = "img,picture,video,canvas,iframe,[style*='background-image']";
const CONTRAST = 0.8;
const INVERT = "invert(1) hue-rotate(180deg)";
const INVERSE_CONTRAST = Number((1 / CONTRAST).toFixed(5));
const CSS =
  `html{filter:${INVERT} contrast(${CONTRAST})}` +
  `${MEDIA}{filter:${INVERT} contrast(${INVERSE_CONTRAST})}` +
  `[${KEEP_ATTRIBUTE}]{filter:${INVERT} contrast(${INVERSE_CONTRAST})}` +
  `[${KEEP_ATTRIBUTE}] :is(${MEDIA}){filter:none}`;

export const SMART_INVERT_SCRIPT = `(() => {
  const STYLE_ID = ${JSON.stringify(STYLE_ID)};
  const KEEP = ${JSON.stringify(KEEP_ATTRIBUTE)};
  const old = document.getElementById(STYLE_ID);
  if (old) {
    old.remove();
    document.querySelectorAll("[" + KEEP + "]").forEach((el) => el.removeAttribute(KEEP));
    return false;
  }
  const luminance = (color) => {
    const parts = (color || "").match(/[\\d.]+/g);
    if (!parts || parts.length < 3) return null;
    if (parts.length > 3 && Number(parts[3]) < 0.9) return null;
    const [r, g, b] = parts.map(Number);
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  };
  const background = (el) => luminance(getComputedStyle(el).backgroundColor);
  const pageLight = (background(document.body) ?? background(document.documentElement) ?? 1) > 0.5;
  if (pageLight) {
    const mark = (parent) => {
      for (const child of parent.children) {
        const lum = background(child);
        const box = child.getBoundingClientRect();
        const covering = box.width * box.height > innerWidth * innerHeight * 0.5;
        if (lum !== null && lum < 0.35 && !covering && !child.matches(${JSON.stringify(MEDIA)})) {
          child.setAttribute(KEEP, "");
        } else {
          mark(child);
        }
      }
    };
    mark(document.body);
  }
  const transparent = (el) => {
    const parts = (getComputedStyle(el).backgroundColor || "").match(/[\\d.]+/g) || [];
    return parts.length < 4 || Number(parts[3]) === 0;
  };
  const rootBackground = transparent(document.documentElement) && transparent(document.body)
    ? "html{background-color:#fff}"
    : "";
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = ${JSON.stringify(CSS)} + rootBackground;
  document.documentElement.appendChild(style);
  return true;
})();`;
