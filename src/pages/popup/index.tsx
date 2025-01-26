import React from 'react';
import { createRoot } from 'react-dom/client';
import Popup from './Popup';

const init = () => {
  const container = document.getElementById('root');
  if (!container) {
    console.error('Root element not found');
    return;
  }

  try {
    const root = createRoot(container);
    root.render(
      <React.StrictMode>
        <Popup />
      </React.StrictMode>
    );
  } catch (error) {
    console.error('Failed to render app:', error);
  }
};

init(); 