import * as messageHandlers from "./message-handlers";
import {
  createReceiveProxy,
  initChromeRuntimeReceiver,
} from "../message-proxy";
import { init as initWatch } from "./watch";

initWatch();
initChromeRuntimeReceiver(messageHandlers);
