import { getName, getRole, getDescription } from "aria-api";

function isElementNode(node: Node): node is Element {
  return node.nodeType === Node.ELEMENT_NODE;
}

function isTextNode(node: Node): node is Text {
  return node.nodeType === Node.TEXT_NODE;
}

export function isAriaHidden(node: Node) {
  if (!isElementNode(node)) {
    return false;
  }
  if (node.ariaHidden === "true") {
    return true;
  }
  if (node.matches("noscript")) {
    return true;
  }
  if (node.matches("details:not([open]) > :not(summary)")) {
    return true;
  }
  if (node.offsetParent === null) {
    return true;
  }
  var style = window.getComputedStyle(node);
  if (style.visibility === "hidden") {
    return true;
  }
  return false;
}

export function isAriaFocusable(element: Element) {
  if (!(element instanceof HTMLElement)) {
    return false;
  }
  if (element.tabIndex === -1) {
    return false;
  }
  if (element.getAttribute("aria-hidden-focus") === "true") {
    return false;
  }
  return "focus" in element;
}

export function buildAriaTree(node: Node) {
  if (isTextNode(node)) {
    if (!node.nodeValue) {
      return [];
    }

    return [
      {
        role: "StaticText",
        name: node.textContent,
        node,
        children: [],
      },
    ];
  }

  if (!isElementNode(node)) {
    return [];
  }

  if (node.tagName === "BODY") {
    return [
      {
        role: "RootWebArea",
        name: document.title,
        description: undefined,
        node: document.body,
        children: [...node.children].flatMap((child) => buildAriaTree(child)),
      },
    ];
  }

  const role = getRole(node);
  if (!role || isAriaHidden(node)) {
    // Ignore this node and replace it with its children.
    return [...node.children].flatMap((child) => buildAriaTree(child));
  }
  return [
    {
      role,
      name: getName(node),
      description: getDescription(node),
      node,
      children: [...node.children].flatMap((child) => buildAriaTree(child)),
    },
  ];
}

function indent(str) {
  return str
    .split("\n")
    .map((line) => "  " + line)
    .join("\n");
}

export function stringifyAriaTree({ role, name, description, children }) {
  return [
    `${role} ${name} ${description}`,
    ...children.map(stringifyAriaTree).map(indent),
  ].join("\n");
}

export function printAriaTree({ role, name, description, node, children }) {
  console.groupCollapsed(role, name, description, node);
  for (const child of children) {
    printAriaTree(child);
  }
  console.groupEnd();
}
