import React, { useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { auth } from '../../utils/firebase';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { saveToStudyList, getUserData, StudyMaterial } from '../../utils/api';
import LoginSignup from './LoginSignup';


interface Topic {
  _id?: string;
  name: string;
  categories: {
    webpage: StudyMaterial[];
    video: StudyMaterial[];
    book: StudyMaterial[];
    podcast: StudyMaterial[];
  };
  createdAt?: Date;
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
  const [currentTopic, setCurrentTopic] = useState<Topic | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [materialTitle, setMaterialTitle] = useState('');
  const [materialType, setMaterialType] = useState<'webpage' | 'video' | 'book' | 'podcast'>('webpage');
  const [currentUrl, setCurrentUrl] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [pageInfo, setPageInfo] = useState<{ title: string; url: string } | null>(null);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [topicName, setTopicName] = useState('Topic Name');
  const [currentPage, setCurrentPage] = useState<'main' | 'login' | 'register' | 'forgot-password'>('main');
  const [selectedTopicName, setSelectedTopicName] = useState<string>('');

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setUser(user);
      if (user) {
        const data = await getUserData(user.uid);
        setTopics(data.topics);
        if (data.topics && data.topics.length > 0) {
          const firstTopic = data.topics[0];
          setCurrentTopic(firstTopic);
          setSelectedTopicName(firstTopic.name);
          setTopicName(firstTopic.name);
        }
        setMaterials(data.materials || []);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (currentTopic) {
      setTopicName(currentTopic.name);
    }
  }, [currentTopic]);

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
    if (!user || !materialTitle || !currentUrl || !selectedTopicName) {
      console.log('Missing required data:', { 
        user: !!user, 
        materialTitle, 
        currentUrl, 
        selectedTopicName 
      });
      return;
    }

    // 從 topics 中找到選中主題的 ID
    const selectedTopic = topics.find(topic => topic.name === selectedTopicName);
    if (!selectedTopic || !selectedTopic._id) {
      console.error('Selected topic not found or missing ID');
      return;
    }

    const material = {
      type: materialType,
      title: materialTitle,
      url: currentUrl,
      rating: 5,
      completed: false,
      dateAdded: new Date().toISOString()
    };

    try {
      console.log('Creating material:', material);
      console.log('Selected topic:', selectedTopic);
      
      await saveToStudyList(material, selectedTopic._id);
      console.log('Material saved successfully');
      
      const updatedData = await getUserData(user.uid);
      setTopics(updatedData.topics);
      
      setMaterialTitle('');
      setCurrentUrl('');
    } catch (error) {
      console.error('Add material failed:', {
        error,
        stack: error instanceof Error ? error.stack : undefined,
        requestData: {
          material,
          topicId: selectedTopic._id,
          userId: user?.uid
        }
      });
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

  const handleTopicChange = (topic: Topic) => {
    setCurrentTopic(topic);
    setSelectedTopicName(topic.name);
    setTopicName(topic.name);
  };

  const renderContent = () => {
    switch (currentPage) {
      case 'login':
        return (
          <LoginSignup 
            onClose={() => setCurrentPage('main')}
            onRegisterClick={() => chrome.tabs.create({ url: 'http://localhost:3000/register' })}
            onForgotPasswordClick={() => chrome.tabs.create({ url: 'http://localhost:3000/forgot-password' })}
          />
        );
      default:
        return (
          <div className="popup-container">
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
                      <button onClick={() => setCurrentPage('login')}>
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

              <div className="topic-selector">
                <select 
                  value={selectedTopicName}
                  onChange={(e) => {
                    const selected = topics.find(t => t.name === e.target.value);
                    if (selected) {
                      handleTopicChange(selected);
                    }
                  }}
                >
                  {topics.map(topic => (
                    <option key={topic.name} value={topic.name}>
                      {topic.name}
                    </option>
                  ))}
                </select>
              </div>

              {['webpage', 'book', 'video', 'podcast'].map(type => {
                const materials = currentTopic?.categories[type as keyof typeof currentTopic.categories] || [];
                const typeCount = materials.length;
                
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
                        .sort((a, b) => {
                          const dateA = a.dateAdded || new Date(0).toISOString();
                          const dateB = b.dateAdded || new Date(0).toISOString();
                          return new Date(dateB).getTime() - new Date(dateA).getTime();
                        })
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
    }
  };

  return (
    <div>
      {renderContent()}
    </div>
  );
};

export default Popup; 