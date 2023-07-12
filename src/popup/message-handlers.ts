import { updateMessages } from "./messages";

export const setMessages = async ({ messages }) => {
  updateMessages(messages);
};
