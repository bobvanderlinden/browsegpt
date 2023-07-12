import { isAriaHidden } from "../aria";
import { getNextAriaElement } from "../aria-navigation";
import { onDomLoaded } from "../dom";
import { first, iterate } from "../iterable";
import { compactObject } from "../object";
import * as aria from "aria-api";

let watching: Element | null = null;

export function init() {
  lookAtElement(
    document.activeElement === document.body ? null : document.activeElement
  );

  window.addEventListener(
    "focus",
    function (event: FocusEvent) {
      if (event.target && event.target instanceof Element) {
        console.log("focus", event);
        lookAtElement(event.target);
      }
    },
    true
  );
}

export function lookAtElement(element: Element | null) {
  if (element === watching) {
    return;
  }
  if (watching) {
    watching.classList.remove("__browsegpt_watching");
  }
  watching = element;

  console.log("watching", element);

  if (watching) {
    if (
      watching instanceof HTMLElement &&
      "focus" in watching &&
      document.activeElement !== watching
    ) {
      watching.focus();
    }
    watching.classList.add("__browsegpt_watching");
  }
}

export function getNextAriaElements() {
  return iterate(getNextAriaElement, watching ?? document.body);
}

export function lookAtNextAria() {
  return lookAtElement(first(getNextAriaElements()));
}

export function getWatchingInfo() {
  if (!watching) {
    return null;
  }
  return getAriaInfo(watching);
}
export function getAriaInfo(element: Element) {
  return compactObject({
    selector: getQuerySelector(element),
    ariaLabel: aria.getName(element),
    ariaRole: aria.getRole(element),
    value: element instanceof HTMLInputElement ? element.value : undefined,
    tagName: element.tagName,
    name: element?.name || null,
    placeholder:
      element?.ariaPlaceholder ?? element?.getAttribute("placeholder"),
  });
}

export function getWatching(): Element {
  if (!watching) {
    throw new Error("No element is being watched");
  }
  return watching;
}

export function getActiveElement() {
  if (!document.activeElement) {
    throw new Error(
      "There is no element focused. Use 'pressTab' to focus the first element"
    );
  }
  return document.activeElement;
}

export function getElement(selector) {
  // Workaround querySelector not able to use numbers as ids.
  selector = selector.replace(/#(\d+)$/g, "[id='$1']"); // "input#123" -> "input[id='123']

  const element = document.querySelector(selector);
  if (!element) {
    throw new Error(
      `No element found for selector ${selector}. Only use selectors that are known to exist!`
    );
  }
  return element;
}

function getQuerySelector(element) {
  const path: string[] = [];
  while (element && element.tagName) {
    const tagName = element.tagName.toLowerCase();
    if (element.id) {
      path.unshift(`${tagName}#${element.id}`);
      break;
    }
    const index = [...element.parentNode.children].indexOf(element);
    path.unshift(`${tagName}:nth-child(${index + 1})`);
    element = element.parentNode;
  }
  return path.join(" > ");
}

function isInViewport(element) {
  if (!element.offsetParent) {
    return false;
  }
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <=
      (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

function isClickable(element) {
  return element.onclick || element.href || element.tagName === "BUTTON";
}

function getNextNode(node: Node) {
  function walkUp(node: Node) {
    while (node.parentNode) {
      node = node.parentNode;
      if (node.nextSibling) {
        return node.nextSibling;
      }
    }
    return null;
  }
  return node.childNodes?.[0] ?? node.nextSibling ?? walkUp(node);
}

function* nextNodes(node: Node) {
  if (!node) {
    return;
  }
  while ((node = getNextNode(node))) {
    yield node;
  }
}

function* nextHTMLElements(element: HTMLElement): Iterable<HTMLElement> {
  for (const node of nextNodes(element)) {
    if (node instanceof HTMLElement) {
      yield node;
    }
  }
}

function isAriaFocusable(element: Element) {
  if (!(element instanceof HTMLElement)) {
    return false;
  }
  if (isAriaHidden(element)) {
    return false;
  }
  if ("disabled" in element && !element.disabled) {
    return false;
  }
  if (element.tabIndex !== -1) {
    return false;
  }
  return true;
}

function getBooleanAttribute(element: Element, attribute: string) {
  const value = element.getAttribute(attribute);
  return value !== null && value != "false";
}
