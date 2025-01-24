// Create a connection with the background script
const port = chrome.runtime.connect({ name: 'studylist-port' });

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'GET_PAGE_INFO') {
    sendResponse({
      url: window.location.href,
      title: document.title
    });
  }
  return true;
}); 