// Create a connection with the background script
const port = chrome.runtime.connect({ name: 'studylist-port' });

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'GET_PAGE_INFO') {
    console.log('Content script: Received request for page info');
    
    // 立即發送回應
    sendResponse({
      url: window.location.href,
      title: document.title || window.location.href
    });
    
    // 如果標題稍後才加載，再次發送更新
    if (!document.title) {
      const observer = new MutationObserver((mutations) => {
        if (document.title) {
          chrome.runtime.sendMessage({
            type: 'TITLE_UPDATED',
            data: {
              url: window.location.href,
              title: document.title
            }
          });
          observer.disconnect();
        }
      });
      
      observer.observe(document.querySelector('title') || document.documentElement, {
        subtree: true,
        characterData: true,
        childList: true
      });
    }
  }
  return true;
}); 