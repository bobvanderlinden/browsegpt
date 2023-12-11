import { filter } from "../iterable";
import { annotateMetadata } from "../metadata";
import { getAriaInfo, getElement } from "./watch";
import { stringifyVDOM, toVDOM } from "../html/vdom";
import { stripNode } from "../html/strip";
import { delay } from "../async";

function getFocusableElements(): HTMLElement[] {
  let elements: Iterable<HTMLElement> = document.querySelectorAll(
    "a[href], button, input, [tabindex]"
  );
  elements = filter((e) => e.tabIndex >= 0, elements);
  elements = filter((e) => e.ariaHidden != "true" && !e.hidden, elements);
  return [...elements].sort((a, b) => b.tabIndex - a.tabIndex);
}

function focusElement(element: HTMLElement) {
  element.focus();
  element.scrollIntoView();
  lookIndicator(element);
}

function lookIndicator(element: HTMLElement) {
  const indicator = document.createElement("div");
  indicator.style.position = "absolute";
  indicator.style.top = `${element.offsetTop}px`;
  indicator.style.left = `${element.offsetLeft}px`;
  indicator.textContent = "👀";
  indicator.style.fontSize = "2em";
  indicator.style.zIndex = "99999";
  document.body.appendChild(indicator);
  const animation = indicator.animate([{ opacity: 1 }, { opacity: 0 }], {
    duration: 2000,
  });
  animation.onfinish = () => {
    indicator.remove();
  };
}

export const ping = async ({}) => {
  return "pong";
};
export const getState =
  /*annotateMetadata(
  {
    name: "getState",
    description: "Get the current state of the page",
    parameters: {
      type: "object",
      properties: {},
    },
  },*/
  async (arg) => {
    return {
      url: window.location.href,
      activeElement:
        document.activeElement && getAriaInfo(document.activeElement),
    };
  };
// );

export const getPageVDOM = async ({}) => {
  return toVDOM(document.documentElement);
};

const keys = {
  "\n": {
    keyCode: 13,
    key: "Enter",
    code: "Enter",
  },
};

export const type = annotateMetadata(
  {
    name: "type",
    description:
      "Type into the element with the given selector. \\n is interpreted as the enter key.",
    parameters: {
      type: "object",
      properties: {
        selector: {
          type: "string",
          description: "The selector of the element to type into",
        },
        text: {
          type: "string",
          description: "The text to type",
        },
      },
      required: ["text"],
    },
  },
  async ({ selector, text }) => {
    const element = getElement(selector);
    focusElement(element);

    // Clear the element.
    if (element instanceof HTMLInputElement) {
      element.value = "";
    } else if (element instanceof HTMLTextAreaElement) {
      element.value = "";
    } else if (element instanceof HTMLSelectElement) {
      element.value = "";
    } else if (element.isContentEditable) {
      const range = document.getSelection()!;
      range.selectAllChildren(element);
      range.deleteFromDocument();
    }

    // Simulate typing the individual characters.
    for (const char of text) {
      const keyCode = char.charCodeAt(0);
      const key = char.toLowerCase();
      const code = `Key${key.toUpperCase()}`;
      const shiftKey = char !== key;
      const keyboardEventDict = {
        bubbles: true,
        cancelable: true,
        keyCode,
        key,
        code,
        shiftKey,
        ...keys[char],
      };
      element.dispatchEvent(
        new KeyboardEvent("keydown", {
          ...keyboardEventDict,
        })
      );
      element.dispatchEvent(
        new KeyboardEvent("keypress", {
          ...keyboardEventDict,
        })
      );
      if (char === "\n" && element instanceof HTMLInputElement) {
        const beforeinput = new InputEvent("beforeinput", {
          bubbles: true,
          cancelable: true,
          data: char,
          inputType: "insertLineBreak",
        });
        if (!beforeinput.defaultPrevented) {
          const form = element.closest("form");
          if (form) {
            form.querySelector("input[type=submit]")?.click();
          }
        }
      } else {
        const beforeinput = new InputEvent("beforeinput", {
          bubbles: true,
          cancelable: true,
          data: char,
          inputType: "insertText",
        });
        element.dispatchEvent(beforeinput);
        if (!beforeinput.defaultPrevented) {
          if (element instanceof HTMLInputElement) {
            element.value += char;
          } else if (element instanceof HTMLTextAreaElement) {
            element.value += char;
          } else if (element.isContentEditable) {
            window
              .getSelection()
              ?.getRangeAt(0)
              ?.insertNode(document.createTextNode(char));
          }
          element.dispatchEvent(
            new InputEvent("input", {
              bubbles: true,
              cancelable: false,
              data: char,
              inputType: "insertText",
            })
          );
        }
      }
      element.dispatchEvent(
        new KeyboardEvent("keyup", {
          ...keyboardEventDict,
        })
      );
      await delay(1);
    }
    element.dispatchEvent(
      new Event("change", {
        bubbles: true,
        cancelable: false,
      })
    );
    element.blur();
    element.dispatchEvent(
      new FocusEvent("blur", {
        bubbles: false,
        cancelable: false,
      })
    );
    element.dispatchEvent(
      new FocusEvent("focusout", {
        bubbles: true,
        cancelable: false,
      })
    );
  }
);
export const pressTab = annotateMetadata(
  {
    name: "pressTab",
    description: "Press the tab key, moving focus to the next element.",
    parameters: {
      type: "object",
      properties: {},
    },
  },
  async ({}) => {
    const focusableElements = getFocusableElements();
    const currentActiveElement = document.activeElement;
    const focusIndex = document.activeElement
      ? focusableElements.indexOf(document.activeElement)
      : -1;
    let nextFocusIndex = focusIndex;
    while (currentActiveElement === document.activeElement) {
      nextFocusIndex = (nextFocusIndex + 1) % focusableElements.length;
      const nextFocusElement = focusableElements[nextFocusIndex];
      console.log({
        focusIndex,
        nextFocusIndex,
        nextFocusElement,
        activeElement: document.activeElement,
        focusableElements,
      });
      nextFocusElement.scrollIntoView();
      nextFocusElement.focus({
        focusVisible: true,
        preventScroll: false,
      });
      if (currentActiveElement === document.activeElement) {
        console.debug("Focus failed");
      }
    }
  }
);
export const pressEnter = annotateMetadata(
  {
    name: "pressEnter",
    description: "Press the enter key in the element with the given selector",
    parameters: {
      type: "object",
      properties: {
        selector: {
          type: "string",
          description: "The selector of the element to type into",
        },
      },
    },
  },
  async ({ selector }) => {
    const element = getElement(selector);
    focusElement(element);
    element.dispatchEvent(
      new KeyboardEvent("keydown", {
        bubbles: true,
        cancelable: true,
        key: "Enter",
      })
    );
    element.dispatchEvent(
      new KeyboardEvent("keypress", {
        bubbles: true,
        cancelable: true,
        key: "Enter",
      })
    );
    element.dispatchEvent(
      new KeyboardEvent("keydown", {
        bubbles: true,
        cancelable: true,
        key: "Enter",
      })
    );
    element.closest("form")?.submit();
  }
);
// export const getPageHtml = annotateMetadata(
//   {
//     name: "getPageHtml",
//     description: "Returns the HTML on the page.",
//     parameters: {
//       type: "object",
//       properties: {},
//     },
//   },
//   async ({}): Promise<string> => {
//     const root = document.querySelector("main") ?? document.body;
//     const result = concatStrings(
//       map(
//         ({ item }) => item,
//         takeWhile(
//           ({ totalLength }) => totalLength < 2048,
//           scan(
//             ({ item, totalLength }, current) => ({
//               item: current,
//               totalLength: totalLength + current.length,
//             }),
//             { item: "", totalLength: 0 },
//             simplifyNode(root)
//           )
//         )
//       )
//     );
//     return result + "...";
//   }
// );
// export const lookAtNext = annotateMetadata(
//   {
//     name: "lookAtNext",
//     description: "Look at the next element",
//     parameters: {
//       type: "object",
//       properties: {},
//     },
//   },
//   async ({}) => {
//     lookAtNextAria();
//   }
// );
// export const lookAtSelector = annotateMetadata(
//   {
//     name: "lookAtSelector",
//     description:
//       "Look at the element matching the given selector. Use only when you know the selector of an element.",
//     parameters: {
//       type: "object",
//       properties: {
//         selector: {
//           type: "string",
//         },
//       },
//       required: ["selector"],
//     },
//   },
//   async ({ selector }) => {
//     lookAtElement(getElement(selector));
//   }
// );
// export const lookForward = annotateMetadata(
//   {
//     name: "lookForward",
//     description: "Look forward in the page",
//     parameters: {
//       type: "object",
//       properties: {},
//     },
//   },
//   async ({}) => {
//     return [...map(getAriaInfo, take(10, getNextAriaElements()))];
//   }
// );
// export const querySelectorAll = annotateMetadata(
//   {
//     name: "querySelectorAll",
//     description: "Query for elements matching the given selector",
//     parameters: {
//       type: "object",
//       properties: {
//         selector: {
//           type: "string",
//         },
//         limit: {
//           type: "number",
//         },
//       },
//       required: ["selector"],
//     },
//   },
//   async ({ selector, limit = 10 }) => {
//     const result = [...document.querySelectorAll(selector)];
//     return result.slice(0, limit).map((node) =>
//       compact({
//         name: aria.getName(node),
//         role: aria.getRole(node),
//         id: node.id,
//         className: node.className,
//         selector: getQuerySelector(node),
//       })
//     );
//   }
// );
export const click = annotateMetadata(
  {
    name: "click",
    description: "Click the element matching the given selector",
    parameters: {
      type: "object",
      properties: {
        selector: {
          type: "string",
        },
      },
    },
  },
  async ({ selector }) => {
    const element = getElement(selector);
    focusElement(element);
    element.click();
    if (element.type === "submit") {
      element.closest("form")?.submit();
    }
  }
);
export const submit = annotateMetadata(
  {
    name: "submit",
    description: "Submit the form containing element of the given selector",
    parameters: {
      type: "object",
      properties: {
        selector: {
          type: "string",
        },
      },
    },
  },
  async ({ selector }) => {
    const form = getElement(selector).closest("form");
    if (!form) {
      throw new Error("The element is not in a form.");
    }
    return form.submit();
  }
);

export const querySelectorAll = annotateMetadata(
  {
    name: "querySelectorAll",
    description: "Query for multiple elements matching the given selector",
    parameters: {
      type: "object",
      properties: {
        selector: {
          type: "string",
        },
      },
    },
  },
  async ({ selector }) => {
    return [...document.querySelectorAll(selector)]
      .map((node) =>
        stripNode(toVDOM(node))
          .map((vdomNode) => stringifyVDOM(vdomNode))
          .join("")
      )
      .join("\n");
  }
);

export const querySelector = annotateMetadata(
  {
    name: "querySelectorAll",
    description: "Query for single element matching the given selector",
    parameters: {
      type: "object",
      properties: {
        selector: {
          type: "string",
        },
      },
    },
  },
  async ({ selector }) => {
    const element = document.querySelector(selector);
    if (!element) {
      throw new Error(`No element matching selector found.`);
    }
    return stripNode(toVDOM(element))
      .map((vdomNode) => stringifyVDOM(vdomNode))
      .join("");
  }
);

// export const getInnerText = annotateMetadata(
//   {
//     name: "getInnerText",
//     description: "Get the inner text of the element being watched",
//     parameters: {
//       type: "object",
//       properties: {
//         selector: {
//           type: "string",
//         },
//       },
//       required: ["selector"],
//     },
//   },
//   async ({ selector }) => {
//     return getElement(selector).innerText;
//   }
// );
// export const getInnerHtml = annotateMetadata(
//   {
//     name: "getInnerHtml",
//     description: "Get the inner HTML of the element being watched",
//     parameters: {
//       type: "object",
//       properties: {
//         selector: {
//           type: "string",
//         },
//       },
//       required: ["selector"],
//     },
//   },
//   async ({ selector }) => {
//     return getElement(selector).innerHTML;
//   }
// );
