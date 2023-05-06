chrome.runtime.sendMessage({
  sender: "mention-generator",
  pageSource: document.documentElement.outerHTML,
});
