// Listen for extension installation or update
chrome.runtime.onInstalled.addListener(() => {
  console.log('StudyList Extension installed/updated');
});

// Keep service worker alive
chrome.runtime.onConnect.addListener(() => {
  console.log('Port connected');
}); 