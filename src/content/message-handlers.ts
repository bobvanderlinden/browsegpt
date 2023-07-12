import { isAriaFocusable } from "../aria";
import * as aria from "aria-api";
import {
  concatStrings,
  filter,
  flatMap,
  flow,
  map,
  mapFilter,
  scan,
  take,
  takeWhile,
} from "../iterable";
import { annotateMetadata } from "../metadata";
import { getActiveElement, getAriaInfo, getElement } from "./watch";
import { stringifyVDOM, toVDOM } from "../html/vdom";
import { stripNode } from "../html/strip";

function getFocusableElements(): HTMLElement[] {
  let elements: Iterable<HTMLElement> = document.querySelectorAll(
    "a[href], button, input, [tabindex]"
  );
  elements = filter((e) => e.tabIndex >= 0, elements);
  elements = filter((e) => e.ariaHidden != "true" && !e.hidden, elements);
  return [...elements].sort((a, b) => b.tabIndex - a.tabIndex);
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
export const type = annotateMetadata(
  {
    name: "type",
    description: "Type into the element with the given selector",
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
    element.focus();
    element.value = text;
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
    element.focus();
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
export const focusElement = annotateMetadata(
  {
    name: "focusElement",
    description: "Focus the element matching the given selector",
    parameters: {
      type: "object",
      properties: {
        selector: {
          type: "string",
        },
      },
      required: ["selector"],
    },
  },
  async ({ selector }) => {
    getElement(selector).focus();
  }
);
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
    getElement(selector).click();
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
      throw new Error(
        "The focused element is not in a form. Use 'pressTab' to navigate to an element that is inside a form."
      );
    }
    return form.submit();
  }
);

export const querySelectorAll = annotateMetadata(
  {
    name: "querySelectorAll",
    description: "Query for elements matching the given selector",
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
        stripNode(toVDOM(node)).map((vdomNode) => stringifyVDOM(vdomNode))
      )
      .join("\n");
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
