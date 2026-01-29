export function loadPreference(key) {
  return new Promise((resolve) => {
    chrome.storage.local.get([key], (result) => {
      resolve(result[key]);
    });
  });
}

export function savePreference(key, value) {
  chrome.storage.local.set({ [key]: value });
}
