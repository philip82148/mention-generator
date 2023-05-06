export async function fetchPageSource() {
  return new Promise((resolve, reject) => {
    // getPageSourceInjectionCode.jsのメッセージをlistenする
    let isFirst = true;
    chrome.runtime.onMessage.addListener((message) => {
      if (message.sender === "mention-generator" && isFirst) {
        isFirst = false;
        resolve(message.pageSource);
      }
    });

    // getPageSourceInjectionCode.js挿入
    chrome.tabs.query({ currentWindow: true, active: true }, (tabs) => {
      chrome.scripting.executeScript(
        {
          target: { tabId: tabs[0].id, allFrames: true },
          files: ["getPageSourceInjectionCode.js"],
        },
        () => {
          if (chrome.runtime.lastError)
            reject(chrome.runtime.lastError.message);
        }
      );
    });
  });
}
