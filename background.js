// Service Worker para abrir a página fullscreen quando o usuário clicar no ícone
chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.create({
    url: chrome.runtime.getURL('viewer.html')
  });
});
