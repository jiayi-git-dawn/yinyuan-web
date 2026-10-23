(() => {
  "use strict";
  const dialog = document.querySelector("#message-dialog");
  const guide = document.querySelector("#guide-dialog");
  const form = document.querySelector("#message-form");
  const input = document.querySelector("#message-body");
  const send = document.querySelector("#message-send");
  const status = document.querySelector("#message-status");
  const success = document.querySelector("#message-success");
  const DRAFT_KEY = "yinyuan.message-draft.v1";
  let submissionId = null;
  let submittedText = null;
  let sending = false;
  let completed = false;
  let returnToGuide = true;

  const syncViewport = () => window.dispatchEvent(new Event("yinyuan:panel-viewport"));
  // Separate tab-scoped draft; it never reads garden records or sends anything
  // until the visitor presses Send. Storage denial still leaves the DOM draft.
  try {
    const draft = JSON.parse(sessionStorage.getItem(DRAFT_KEY) || "null");
    if (typeof draft?.text === "string") input.value = draft.text;
    if (typeof draft?.submissionId === "string" && draft.text.trim() === draft.submittedText) {
      submissionId = draft.submissionId;
      submittedText = draft.submittedText;
    }
  } catch { /* Browser storage may be disabled. */ }
  const saveDraft = () => {
    try {
      if (input.value) sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ text: input.value, submissionId, submittedText }));
      else sessionStorage.removeItem(DRAFT_KEY);
    } catch { /* Closing the panel still preserves its current textarea. */ }
  };
  const render = () => {
    form.hidden = completed;
    success.hidden = !completed;
    input.readOnly = sending;
    send.disabled = sending;
    send.textContent = sending ? "正在发送…" : status.dataset.error === "send" ? "重试发送" : "发送口信";
    form.setAttribute("aria-busy", String(sending));
  };

  document.querySelector("#portrait-guide-link").addEventListener("click", () => document.querySelector("#guide-link").click());
  new MutationObserver(syncViewport).observe(document.body, { attributes: true, attributeFilter: ["class"] });

  document.querySelector("#open-message").addEventListener("click", () => {
    returnToGuide = true;
    guide.close();
    document.body.classList.remove("guide-is-open");
    document.body.classList.add("feedback-is-open");
    syncViewport();
    render();
    dialog.showModal();
    // Keep the keyboard closed until the visitor chooses to write.
    document.querySelector("#message-title").focus();
  });
  document.querySelector("#message-close").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  });
  dialog.addEventListener("close", () => {
    document.body.classList.remove("feedback-is-open");
    if (returnToGuide) {
      guide.showModal();
      document.body.classList.add("guide-is-open");
      document.querySelector("#open-message").focus();
    } else {
      document.querySelector("#guide-link").focus();
    }
    syncViewport();
  });
  input.addEventListener("input", () => {
    if (input.value.trim() !== submittedText) { submissionId = null; submittedText = null; }
    saveDraft();
    if (status.dataset.error === "blank") {
      status.textContent = "";
      delete status.dataset.error;
      input.removeAttribute("aria-invalid");
    }
  });
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (sending || completed) return;
    if (!input.value.trim()) {
      status.textContent = "写下一点内容，再发送吧。";
      status.dataset.error = "blank";
      input.setAttribute("aria-invalid", "true");
      input.focus();
      return;
    }
    if (input.value.trim().length > 6000) {
      status.textContent = "口信有些长，请留在 6000 字以内再发送。";
      return;
    }
    sending = true;
    status.textContent = "正在发送…";
    delete status.dataset.error;
    render();
    try {
      await deliverMessage(input.value.trim());
      completed = true;
      status.textContent = "";
      try { sessionStorage.removeItem(DRAFT_KEY); } catch { /* No stored draft. */ }
    } catch (error) {
      status.textContent = error.message === "RECEIVER_NOT_CONFIGURED"
        ? "收信通道还在准备中，口信暂时没能送出。你写的内容还在，也可以来「观园志」给我发私信。"
        : error.message === "MESSAGE_TOO_LONG" ? "口信有些长，请留在 6000 字以内再发送。"
        : "暂时没能送出，你写的内容还在，可以稍后再试。";
      status.dataset.error = "send";
    } finally {
      sending = false;
    }
    render();
    if (dialog.open && completed) document.querySelector("#message-return").focus();
  });
  async function deliverMessage(message) {
    if (location.protocol === "file:") throw new Error("RECEIVER_NOT_CONFIGURED");
    if (!submissionId || submittedText !== message) {
      submissionId = crypto.randomUUID();
      submittedText = message;
      saveDraft();
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        credentials: "omit",
        referrerPolicy: "no-referrer",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, submissionId }),
        signal: controller.signal,
      });
      let receipt;
      try { receipt = await response.json(); } catch { throw new Error("RECEIVER_NOT_CONFIGURED"); }
      if (!response.ok || receipt.ok !== true || receipt.receipt !== submissionId) {
        throw new Error(receipt.code || "DELIVERY_FAILED");
      }
    } finally {
      clearTimeout(timeout);
    }
  }
  document.querySelector("#message-return").addEventListener("click", () => {
    returnToGuide = false;
    dialog.close();
    completed = false;
    input.value = "";
    submissionId = null;
    submittedText = null;
    status.textContent = "";
    delete status.dataset.error;
    render();
  });
})();
