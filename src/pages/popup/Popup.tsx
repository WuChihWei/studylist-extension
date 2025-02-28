import React, { useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { auth } from '../../utils/firebase';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { fetchUserData, saveToStudyList } from '../../utils/api';
import LoginSignup from './LoginSignup';
import { HiOutlineMicrophone } from "react-icons/hi";
import { FiBook, FiVideo, FiLogOut, FiShield, FiLogIn } from "react-icons/fi";
import { MdWeb } from "react-icons/md";
import { BsThreeDots } from "react-icons/bs";
import { BiCategory } from "react-icons/bi";
import { CgHome } from "react-icons/cg";
import { User as UserModel, Topic, StudyMaterial } from '../../models/User';
import { ENDPOINTS } from '../../config/endpoints';
import PrivacyPolicy from './PrivacyPolicy';

const getMaterialTypeFromUrl = (url: string): 'webpage' | 'video' | 'book' | 'podcast' => {
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    return 'video';
  } else if (url.includes('medium.com')) {
    return 'book';
  }
  return 'webpage';
};

// Material type icons mapping
const materialTypeIcons = {
  webpage: <MdWeb />,
  video: <FiVideo />,
  book: <FiBook />,
  podcast: <HiOutlineMicrophone />
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
  const [currentPage, setCurrentPage] = useState<'main' | 'login' | 'register' | 'forgot-password' | 'privacy-policy'>('main');
  const [selectedTopicName, setSelectedTopicName] = useState<string>('');
  const [showNavDropdown, setShowNavDropdown] = useState(false);

  const addMaterial = saveToStudyList;

  useEffect(() => {
    // 從 chrome.storage 獲取用戶信息
    chrome.storage.local.get(['user'], async (result) => {
      if (result.user) {
        setUser(result.user);
        
        // 載入用戶數據
        try {
          const data = await fetchUserData(result.user.uid);
          setTopics(data.topics);
        } catch (error) {
          console.error('Error loading user data:', error instanceof Error ? error.message : error);
          // 如果是認證錯誤，清除登入狀態
          if (error instanceof Error && error.message.includes('401')) {
            chrome.storage.local.remove(['authToken', 'user'], () => {
              setUser(null);
              setTopics([]);
            });
          }
        }
      }
    });
  }, []);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setUser(user);
      if (user) {
        try {
          const data = await fetchUserData(user.uid);
          if (data && data.topics) {
            setTopics(data.topics);
            if (data.topics.length > 0) {
              const firstTopic = data.topics[0];
              setCurrentTopic(firstTopic);
              setSelectedTopicName(firstTopic.name);
              setTopicName(firstTopic.name);
            }
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          // Handle error appropriately (maybe show an error message to user)
        }
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
    window.open(`${ENDPOINTS.WEBSITE_BASE}/profile`, '_blank');
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
      dateAdded: new Date()
    };

    try {
      const success = await addMaterial(material, selectedTopic._id);
      if (success) {
        // 清空輸入欄位
        setMaterialTitle('');
        setCurrentUrl('');
        
        // 立即重新獲取最新數據
        if (user) {
          const data = await fetchUserData(user.uid);
          setTopics(data.topics);
          
          // 更新當前主題
          const updatedCurrentTopic = data.topics.find((t: Topic) => t._id === selectedTopic._id);
          if (updatedCurrentTopic) {
            setCurrentTopic(updatedCurrentTopic);
          }
        }
      }
    } catch (error) {
      console.error('Add material failed:', error);
    }
  };

  const handleLogout = async () => {
    try {
      // 先登出 Firebase
      await signOut(auth);
      
      // 清除本地存儲的 token
      chrome.storage.local.remove(['authToken', 'user'], () => {
        setUser(null);  // 清除用戶狀態
        setTopics([]); // 清除主題列表
        setCurrentTopic(null); // 清除當前主題
        setShowDropdown(false);
      });
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

  const handleTopicChange = (topic: Topic) => {
    setCurrentTopic(topic);
    setSelectedTopicName(topic.name);
    setTopicName(topic.name);
  };

  const handlePrivacyPolicyClick = () => {
    setCurrentPage('privacy-policy');
  };

  const renderContent = () => {
    switch (currentPage) {
      case 'privacy-policy':
        return <PrivacyPolicy onBack={() => setCurrentPage('main')} />;
      case 'login':
        return (
          <LoginSignup 
            onClose={() => setCurrentPage('main')}
            onRegisterClick={() => chrome.tabs.create({ url: `${ENDPOINTS.WEBSITE_BASE}/signup` })}
            onForgotPasswordClick={() => chrome.tabs.create({ url: `${ENDPOINTS.WEBSITE_BASE}/forgot-password` })}
          />
        );
      default:
        return (
          <div className="popup-container">
            <div className="navbar">
              <CgHome className="home-icon" onClick={handleHomeClick} />
              <div className="nav-dropdown-container">
                <BsThreeDots 
                  className="menu-icon" 
                  onClick={() => setShowNavDropdown(!showNavDropdown)}
                />
                {showNavDropdown && (
                  <div className="nav-dropdown">
                    {user ? (
                      <>
                        <button onClick={handleLogout}>
                          <FiLogOut className="dropdown-icon" />
                          Logout
                        </button>
                        <button onClick={handlePrivacyPolicyClick}>
                          <FiShield className="dropdown-icon" />
                          Privacy Policy
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => setCurrentPage('login')}>
                          <FiLogIn className="dropdown-icon" />
                          Login
                        </button>
                        <button onClick={handlePrivacyPolicyClick}>
                          <FiShield className="dropdown-icon" />
                          Privacy Policy
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="section">
              <div className="topic-container">
                <div className="topic-left" onClick={() => setShowDropdown(!showDropdown)}>
                  <h1 className="topic-title">{topicName}</h1>
                  <div className={`dropdown-icon ${showDropdown ? 'open' : ''}`}>
                    ▼
                  </div>
                </div>
                <button className="edit-button">Edit</button>
                
                {showDropdown && (
                  <div className="topic-dropdown-overlay">
                    <div className="topic-dropdown">
                      {topics.map(topic => (
                        <div 
                          key={topic.name} 
                          className={`topic-option ${selectedTopicName === topic.name ? 'selected' : ''}`}
                          onClick={() => {
                            handleTopicChange(topic);
                            setShowDropdown(false);
                          }}
                        >
                          {topic.name}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="material-input-wrapper">
                <button 
                  className="add-icon-button"
                  onClick={handleAddMaterial}
                  style={{ opacity: user ? 1 : 0.5, cursor: user ? 'pointer' : 'not-allowed' }}
                >
                  +
                </button>
                <input
                  className="material-title-input"
                  placeholder="Material Title"
                  value={materialTitle}
                  onChange={(e) => setMaterialTitle(e.target.value)}
                />
                <div 
                  className="material-type-selector"
                  onClick={() => setShowTypeDropdown(!showTypeDropdown)}
                >
                  {materialTypeIcons[materialType]}
                  {showTypeDropdown && (
                    <div className="type-dropdown">
                      <div onClick={() => handleTypeSelect('webpage')}>{materialTypeIcons.webpage}</div>
                      <div onClick={() => handleTypeSelect('book')}>{materialTypeIcons.book}</div>
                      <div onClick={() => handleTypeSelect('video')}>{materialTypeIcons.video}</div>
                      <div onClick={() => handleTypeSelect('podcast')}>{materialTypeIcons.podcast}</div>
                    </div>
                  )}
                </div>
              </div>

              {['webpage', 'book', 'video', 'podcast'].map(type => {
                const materials = currentTopic?.categories[type as keyof typeof currentTopic.categories] || [];
                const typeCount = materials.length;
                
                return (
                  <div key={type} className="material-section">
                    <div className="material-type-header">
                      {materialTypeIcons[type as keyof typeof materialTypeIcons]}
                      <span className="material-type-name">
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </span>
                      <span className="material-count">({typeCount})</span>
                    </div>
                    <div className="material-list">
                      {materials
                        .sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime())
                        .map((material, index) => (
                          <div key={index} className="material-card">
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