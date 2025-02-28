import { ENDPOINTS } from '../config/endpoints';

// 監聽安裝事件
chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed');
});

// 監聽連接事件
chrome.runtime.onConnect.addListener((port) => {
  console.log('Port connected:', port.name);
  
  port.onDisconnect.addListener(() => {
    if (chrome.runtime.lastError) {
      console.error('Connection error:', chrome.runtime.lastError);
    }
    console.log('Port disconnected:', port.name);
  });
});

// 全局錯誤處理
window.onerror = function(
  event: Event | string,
  source?: string,
  lineno?: number,
  colno?: number,
  error?: Error
) {
  // 移除敏感資訊
  const sanitizedError = {
    type: error?.name || 'Error',
    message: error?.message || 'An unknown error occurred',
    location: source ? `${source.split('/').pop()}:${lineno}:${colno}` : 'unknown'
  };
  
  console.error('Extension error:', sanitizedError);
  
  // 向用戶顯示友善的錯誤訊息
  chrome.runtime.sendMessage({
    type: 'SHOW_ERROR',
    error: 'Something went wrong. Please try again later.'
  });
};

// 未處理的 Promise 錯誤
window.onunhandledrejection = (event: PromiseRejectionEvent) => {
  console.error('Unhandled promise rejection:', event.reason);
};