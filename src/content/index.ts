import * as messageHandlers from "./message-handlers";
import {
  createReceiveProxy,
  initChromeRuntimeReceiver,
} from "../message-proxy";

if (!window.__browsegpt_content_init) {
  window.__browsegpt_content_init = true;
  // initWatch();
  initChromeRuntimeReceiver(messageHandlers);
}
