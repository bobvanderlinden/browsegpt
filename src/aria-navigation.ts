import { isAriaHidden } from "./aria";

function getNextAriaSibling(element: Element): Element | null {
  let currentElement: Element | null = element.nextElementSibling;
  while (currentElement && isAriaHidden(currentElement)) {
    currentElement = currentElement.nextElementSibling;
  }
  return currentElement;
}

export function getNextAriaElement(element: Element): Element | null {
  function getNextAriaInParent(element: Element) {
    if (!element.parentElement) {
      return null;
    }
    if (element.parentElement.ariaHidden) {
      return getNextAriaInParent(element.parentElement);
    }
    return (
      getNextAriaSibling(element) ?? getNextAriaInParent(element.parentElement)
    );
  }

  // Support for aria-flowto
  const ariaFlowto = element.getAttribute("aria-flowto");
  if (ariaFlowto) {
    return document.getElementById(ariaFlowto);
  }

  return (
    (element.ariaHidden ? null : element.children?.[0]) ??
    getNextAriaSibling(element) ??
    getNextAriaInParent(element)
  );
}
