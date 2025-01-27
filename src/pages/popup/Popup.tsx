import React, { useEffect, useState } from 'react';
import { User, signOut } from 'firebase/auth';
import { auth } from '../../utils/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { saveToStudyList, getUserData, StudyMaterial } from '../../utils/api';

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
  const [newMaterialTitle, setNewMaterialTitle] = useState('');
  const [newMaterialType, setNewMaterialType] = useState<'webpage' | 'video' | 'book' | 'podcast'>('webpage');

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      console.log('Auth state changed:', user?.uid);
      if (user) {
        setUser(user);
        localStorage.setItem('isLoggedIn', 'true');
        try {
          console.log('Attempting to fetch user data...');
          const data = await getUserData(user.uid);
          console.log('Received user data:', data);
          setUserData(data);
        } catch (error) {
          console.error('Error in useEffect:', error);
        }
      } else {
        const isLoggedIn = localStorage.getItem('isLoggedIn');
        if (!isLoggedIn) {
          setUser(null);
          setUserData(null);
        }
      }
    });

    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      if (!tabs[0]?.id) {
        setError('No active tab found');
        return;
      }

      try {
        console.log('Sending message to content script...');
        const response = await chrome.tabs.sendMessage(tabs[0].id, { type: 'GET_PAGE_INFO' });
        console.log('Response from content script:', response);
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
      const material: StudyMaterial = {
        type: 'webpage' as const,
        title: `Website: ${pageInfo.title}`,
        url: pageInfo.url,
        userId: user.uid
      };
      
      await saveToStudyList(material);
      setError('Successfully saved to StudyList!');
      setTimeout(() => setError(null), 2000);
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
      localStorage.removeItem('isLoggedIn');
      setUser(null);
      setUserData(null);
      setPageInfo(null);
      setError(null);
    } catch (error) {
      console.error('Error signing out:', error);
      setError('Failed to log out. Please try again.');
    }
  };

  const handleAddMaterial = async () => {
    if (!user || !newMaterialTitle) return;

    try {
      setLoading(true);
      const material: StudyMaterial = {
        type: newMaterialType,
        title: newMaterialTitle,
        url: '',
        userId: user.uid,
        dateAdded: new Date().toISOString()
      };
      
      console.log('Saving material:', material);
      const result = await saveToStudyList(material);
      console.log('Save result:', result);
      
      setNewMaterialTitle('');
      const updatedData = await getUserData(user.uid);
      setUserData(updatedData);
      setError('Successfully added material!');
      setTimeout(() => setError(null), 2000);
    } catch (error: any) {
      console.error('Error adding material:', error);
      setError(error.message || 'Failed to add material. Please try again.');
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

  console.log('Current pageInfo:', pageInfo);

  return (
    <div className="p-4">
      <div className='flex'>
        <h3>Welcome, {userData?.name}</h3>
        <button onClick={handleLogout} className="p-2 bg-red-500 text-white rounded">
          Logout
        </button>
      </div>
      {error && (
        <div className="mt-2 p-2 bg-red-100 text-red-600 rounded">
          {error}
        </div>
      )}
      <div className="mt-4">
        <h3>Import Material</h3>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Material Title"
            className="flex-1 p-2 border rounded"
            value={newMaterialTitle}
            onChange={(e) => setNewMaterialTitle(e.target.value)}
          />
          <select
            className="p-2 border rounded"
            value={newMaterialType}
            onChange={(e) => setNewMaterialType(e.target.value as StudyMaterial['type'])}
          >
            <option value="webpage">Webpage</option>
            <option value="book">Book</option>
            <option value="video">Video</option>
            <option value="podcast">Podcast</option>
          </select>
          <button
            className="p-2 bg-green-500 text-white rounded"
            onClick={handleAddMaterial}
            disabled={loading || !newMaterialTitle}
          >
            Add Material
          </button>
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
        {pageInfo && (
          <div>
            <p>{pageInfo.title}</p>
            <button className="p-2 bg-green-500 text-white rounded" onClick={handleSave}>
              Save
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Popup; 