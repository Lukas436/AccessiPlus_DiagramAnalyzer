let enabled = false;

chrome.action.onClicked.addListener((tab) => {
  enabled = !enabled;

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    args: [enabled],
    func: (isActive) => {
      window.dispatchEvent(new CustomEvent("toggle-snipping-mode", {
        detail: { active: isActive }
      }));
    }
  });
});
