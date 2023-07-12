import { onDomLoaded } from "../dom";
import { chatCompletionRequest } from "../openai";

onDomLoaded(async () => {
  const openaiApiKeyInput = document.querySelector(
    "#openai-api-key"
  )! as HTMLInputElement;
  const saveButton = document.querySelector("#save")! as HTMLButtonElement;
  const status = document.querySelector("#status")! as HTMLButtonElement;

  async function restore() {
    const { openaiApiKey } = await chrome.storage.sync.get({
      openaiApiKey: "",
    });
    openaiApiKeyInput.value = openaiApiKey;
  }

  async function checkOpenaiApiKey(key) {
    try {
      const response = await chatCompletionRequest(
        {
          model: "gpt-3.5-turbo",
          temperature: 0,
          messages: [
            {
              role: "user",
              content: `Say: "Success!"`,
            },
          ],
        },
        key
      );
      return response?.choices?.[0]?.message?.content === "Success!";
    } catch (e) {
      return false;
    }
  }

  async function save() {
    const newOpenaiApiKey = openaiApiKeyInput.value;
    if (await checkOpenaiApiKey(newOpenaiApiKey)) {
      await chrome.storage.sync.set({
        openaiApiKey: openaiApiKeyInput.value,
      });
      status.textContent = "✅ Options saved.";
    } else {
      status.textContent = "❌ Invalid OpenAI API key.";
    }
  }

  await restore();

  saveButton.addEventListener("click", save);
});
