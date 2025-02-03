import React, { useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { auth } from '../../utils/firebase';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { saveToStudyList, getUserData } from '../../utils/api';
import LoginSignup from './LoginSignup';

interface Material {
  type: 'webpage' | 'video' | 'book' | 'podcast';
  title: string;
  url: string;
  userId: string;
  dateAdded: string;
}

const getMaterialTypeFromUrl = (url: string): 'webpage' | 'video' | 'book' | 'podcast' => {
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    return 'video';
  } else if (url.includes('medium.com')) {
    return 'book';
  }
  return 'webpage';
};

const Popup: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [materialTitle, setMaterialTitle] = useState('');
  const [materialType, setMaterialType] = useState<'webpage' | 'video' | 'book'  | 'podcast'>('webpage');
  const [materials, setMaterials] = useState<Material[]>([]);
  const [currentUrl, setCurrentUrl] = useState('');
  const [pageInfo, setPageInfo] = useState<{ title: string; url: string } | null>(null);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [topicName, setTopicName] = useState('Topic Name');

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setUser(user);
      if (user) {
        const data = await getUserData(user.uid);
        setMaterials(data.materials || []);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const getCurrentPageInfo = () => {
      console.log('Getting current page info...');
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        console.log('Current tab:', tabs[0]?.url);
        if (tabs[0]?.id) {
          try {
            chrome.tabs.sendMessage(
              tabs[0].id,
              { type: 'GET_PAGE_INFO' },
              (response) => {
                if (chrome.runtime.lastError) {
                  console.log('Chrome runtime error:', chrome.runtime.lastError);
                  // 如果出錯，至少設置 URL
                  if (tabs[0]?.url) {
                    setCurrentUrl(tabs[0].url);
                    setMaterialType(getMaterialTypeFromUrl(tabs[0].url));
                    // 從 URL 中提取標題
                    const urlTitle = tabs[0].title || tabs[0].url.split('/').pop() || '';
                    setMaterialTitle(urlTitle);
                  }
                  return;
                }
                
                if (response) {
                  console.log('Received page info:', response);
                  setPageInfo(response);
                  setMaterialTitle(response.title || '');
                  setCurrentUrl(response.url);
                  setMaterialType(getMaterialTypeFromUrl(response.url));
                }
              }
            );
          } catch (error) {
            console.error('Error sending message:', error);
          }
        }
      });
    };

    // 初始調用
    getCurrentPageInfo();

    // 監聽標籤頁更新
    const tabUpdateListener = (tabId: number, changeInfo: chrome.tabs.TabChangeInfo, tab: chrome.tabs.Tab) => {
      console.log('Tab updated:', { tabId, changeInfo, url: tab.url });
      if (changeInfo.status === 'complete' || changeInfo.title) {
        getCurrentPageInfo();
      }
    };

    // 添加標籤頁更新監聽器
    chrome.tabs.onUpdated.addListener(tabUpdateListener);
    
    // 監聽標籤頁切換
    chrome.tabs.onActivated.addListener(getCurrentPageInfo);

    return () => {
      chrome.tabs.onUpdated.removeListener(tabUpdateListener);
      chrome.tabs.onActivated.removeListener(getCurrentPageInfo);
    };
  }, []);

  const handleHomeClick = () => {
    window.open('http://localhost:3000/profile', '_blank');
  };

  const handleAddMaterial = async () => {
    if (!user || !materialTitle || !currentUrl) return;
    
    try {
      const material = {
        type: materialType,
        title: materialTitle,
        url: currentUrl,
        userId: user.uid,
        dateAdded: new Date().toISOString()
      };
      
      await saveToStudyList(material);
      const updatedData = await getUserData(user.uid);
      setMaterials(updatedData.materials.map((m: Material) => ({
        ...m,
        url: m.url || ''
      })));
      
      // Reset form
      setMaterialTitle('');
      setCurrentUrl('');
    } catch (error) {
      console.error('Error adding material:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setShowDropdown(false);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleTitleClick = (url: string) => {
    // Open the URL in a new tab
    chrome.tabs.create({ url: url });
  };

  const handleTypeSelect = (type: 'webpage' | 'video' | 'book' | 'podcast') => {
    setMaterialType(type);
    setShowTypeDropdown(false);
  };

  const getMaterialIcon = (type: string) => {
    switch(type) {
      case 'webpage': return '🌐';
      case 'book': return '📖';
      case 'video': return '📹';
      case 'podcast': return '🎧';
      default: return '🌐';
    }
  };

  return (
    <div>
      <div className="navbar">
        <div onClick={handleHomeClick} style={{cursor: 'pointer'}}>
          <svg className="home-icon" viewBox="0 0 24 24">
            <path fill="currentColor" d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
          </svg>
        </div>
        <div onClick={() => setShowDropdown(!showDropdown)} style={{position: 'relative'}}>
          <svg className="menu-icon" viewBox="0 0 24 24">
            <path fill="currentColor" d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
          </svg>
          {showDropdown && (
            <div className="dropdown">
              {user ? (
                <button onClick={handleLogout}>Logout</button>
              ) : (
                <button onClick={() => window.open('http://localhost:3001/login', '_blank')}>
                  Login
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="section">
        <div className="topic-header">
          <div className="topic-name">
            <h1>{topicName}</h1>
            <span className="dropdown-arrow">▼</span>
          </div>
          <button className="edit-button">Edit</button>
        </div>
        <div className="add-material-container">
          <div className="input-group">
            <div className="title-input-container">
              <div 
                className="plus-icon" 
                onClick={handleAddMaterial}
                style={{ cursor: user ? 'pointer' : 'not-allowed', opacity: user ? 1 : 0.5 }}
              >
                +
              </div>
              <input
                className="material-input"
                placeholder="Material Title"
                value={materialTitle}
                onChange={(e) => setMaterialTitle(e.target.value)}
              />
              <div className="material-type-selector">
                <div 
                  className="globe-icon" 
                  onClick={() => setShowTypeDropdown(!showTypeDropdown)}
                >
                  {getMaterialIcon(materialType)}
                </div>
                {showTypeDropdown && (
                  <div className="type-dropdown">
                    <div onClick={() => handleTypeSelect('webpage')}>🌐</div>
                    <div onClick={() => handleTypeSelect('book')}>📖</div>
                    <div onClick={() => handleTypeSelect('video')}>📹 </div>
                    <div onClick={() => handleTypeSelect('podcast')}>🎧</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {['webpage', 'book', 'video', 'podcast'].map(type => {
          const typeCount = materials.filter(m => m.type === type).length;
          return (
            <div key={type}>
              <div className="section-title">
                <span className="title-with-icon">
                  {getMaterialIcon(type)} {type.charAt(0).toUpperCase() + type.slice(1)}
                </span>
                <span className="material-count">({typeCount})</span>
              </div>
              <div className="material-list">
                {materials
                  .filter(m => m.type === type)
                  .sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime())
                  .map((material, index) => (
                    <div key={index} className="material-item">
                      <span 
                        className="material-link"
                        onClick={() => handleTitleClick(material.url)}
                        title={material.url}
                      >
                        {material.title}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Popup; 