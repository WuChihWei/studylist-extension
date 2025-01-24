import React, { useEffect, useState } from 'react';
import { User, GoogleAuthProvider } from 'firebase/auth';
import { auth, provider } from '../../utils/firebase';
import { signInWithPopup } from 'firebase/auth';
import { saveToStudyList } from '../../utils/api';

interface PageInfo {
  url: string;
  title: string;
}

const Popup: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [pageInfo, setPageInfo] = useState<PageInfo | null>(null);

  useEffect(() => {
    // Check authentication status
    auth.onAuthStateChanged((user: User | null) => {
      setUser(user);
    });

    // Get current page info
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs: chrome.tabs.Tab[]) => {
      if (tabs[0]?.url) {
        setPageInfo({
          url: tabs[0].url,
          title: tabs[0].title || ''
        });
      }
    });
  }, []);

  const handleSignIn = async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Error signing in:', error);
    }
  };

  const handleSave = async () => {
    if (!user || !pageInfo) return;

    try {
      await saveToStudyList({
        type: 'webpage',
        title: pageInfo.title,
        url: pageInfo.url,
        userId: user.uid
      });
      window.close();
    } catch (error) {
      console.error('Error saving to StudyList:', error);
    }
  };

  if (!user) {
    return (
      <div className="p-4">
        <h2>Please sign in to StudyList</h2>
        <button onClick={handleSignIn}>
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2>Save to StudyList</h2>
      {pageInfo && (
        <div>
          <p>{pageInfo.title}</p>
          <button onClick={handleSave}>
            Save
          </button>
        </div>
      )}
    </div>
  );
};

export default Popup; 