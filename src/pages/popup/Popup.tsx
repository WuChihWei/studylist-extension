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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check authentication status
    const unsubscribe = auth.onAuthStateChanged((user: User | null) => {
      setUser(user);
    });

    // Get current page info
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      if (tabs[0]?.id) {
        try {
          const response = await chrome.tabs.sendMessage(tabs[0].id, { type: 'GET_PAGE_INFO' });
          setPageInfo(response);
        } catch (error) {
          console.error('Error getting page info:', error);
          setError('Could not get page information. Please refresh the page and try again.');
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSignIn = async () => {
    try {
      setLoading(true);
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Error signing in:', error);
      setError('Failed to sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user || !pageInfo) return;

    try {
      setLoading(true);
      await saveToStudyList({
        type: 'webpage',
        title: pageInfo.title,
        url: pageInfo.url,
        userId: user.uid
      });
      window.close();
    } catch (error) {
      console.error('Error saving to StudyList:', error);
      setError('Failed to save to StudyList. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4">
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <p className="text-red-500">{error}</p>
        <button onClick={() => setError(null)}>Try Again</button>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-4">
        <h2>Please sign in to StudyList</h2>
        <button onClick={handleSignIn}>
          Sign In with Google
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