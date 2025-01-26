import React, { useEffect, useState } from 'react';
import { User, signOut } from 'firebase/auth';
import { auth } from '../../utils/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { saveToStudyList, getUserData } from '../../utils/api';

interface PageInfo {
  url: string;
  title: string;
}

interface UserData {
  name: string;
  email: string;
  materials: {
    type: string;
    title: string;
    rating?: number;
  }[];
}

const Popup: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [pageInfo, setPageInfo] = useState<PageInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      console.log('Auth state changed:', user?.uid);
      if (user) {
        setUser(user);
        try {
          console.log('Attempting to fetch user data...');
          const data = await getUserData(user.uid);
          console.log('Received user data:', data);
          setUserData(data);
        } catch (error) {
          console.error('Error in useEffect:', error);
        }
      } else {
        setUser(null);
        setUserData(null);
      }
    });

    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      if (!tabs[0]?.id) {
        setError('No active tab found');
        return;
      }
      
      try {
        const response = await chrome.tabs.sendMessage(tabs[0].id, { type: 'GET_PAGE_INFO' });
        if (response) {
          setPageInfo(response);
        } else {
          setError('No response from content script');
        }
      } catch (error) {
        console.error('Error getting page info:', error);
        setError('Could not get page information. Please refresh the page and try again.');
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('Error signing in:', error);
      setError('Invalid email or password');
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

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setUserData(null);
      setPageInfo(null);
      setError(null);
    } catch (error) {
      console.error('Error signing out:', error);
      setError('Failed to log out. Please try again.');
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
      <div style={{
        padding: '20px',
        minWidth: '300px',
        minHeight: '200px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <h2 style={{
          fontSize: '18px',
          fontWeight: '600',
          margin: '0 0 16px 0'
        }}>Sign in to StudyList</h2>
        <form onSubmit={handleSignIn} style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2>Welcome, {userData?.name}</h2>
      <button onClick={handleLogout} className="p-2 bg-red-500 text-white rounded">
        Logout
      </button>
      <div className="mt-4">
        <h3>Import Material</h3>
        <div className="flex gap-2">
          <input type="text" placeholder="Material Title" className="flex-1 p-2 border rounded" />
          <select className="p-2 border rounded">
            <option value="book">Book</option>
            <option value="video">Video</option>
            <option value="podcast">Podcast</option>
          </select>
          <button className="p-2 bg-green-500 text-white rounded">Add Material</button>
        </div>
      </div>
      <div className="mt-4">
        <h3>Your Materials</h3>
        {userData?.materials.map((material, index) => (
          <div key={index} className="p-2 border rounded mb-2">
            <p>{material.title}</p>
            <p>Type: {material.type}</p>
            {material.rating && <p>Rating: {material.rating}</p>}
          </div>
        ))}
      </div>
      <div className="mt-4">
        <h3>Save to StudyList</h3>
        {pageInfo && (
          <div>
            <p>{pageInfo.title}</p>
            <button onClick={handleSave}>
              Save
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Popup; 