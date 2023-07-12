export function onDomLoaded(fn) {
  if (!("document" in globalThis)) {
    return;
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", fn);
  } else {
    fn();
  }
}
