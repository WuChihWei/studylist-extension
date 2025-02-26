import axios, { InternalAxiosRequestConfig } from 'axios';
import { auth } from './firebase';
import { User, StudyMaterial } from '../models/User';

const API_URL = 'https://studylistserver-production.up.railway.app';
console.log('Using API URL:', API_URL);

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  try {
    console.log('Request interceptor started');
    const user = auth.currentUser;
    console.log('Current user:', user ? { uid: user.uid, email: user.email } : 'No user');
    
    if (user) {
      console.log('Getting token for user:', user.uid);
      const token = await user.getIdToken();
      console.log('Token received:', token.substring(0, 10) + '...');
      config.headers.set('Authorization', `Bearer ${token}`);
    }
    
    console.log('Final request config:', {
      url: `${config.baseURL}${config.url}`,  // 完整 URL
      method: config.method,
      headers: config.headers,
    });
    
    return config;
  } catch (error) {
    console.error('Error in request interceptor:', error);
    return Promise.reject(error);
  }
});

// Add response interceptor for debugging
api.interceptors.response.use(
  (response) => {
    console.log('Response received:', {
      status: response.status,
      url: response.config.url,
      data: response.data
    });
    return response;
  },
  (error) => {
    console.error('Response error:', {
      status: error.response?.status,
      url: error.config?.url,
      data: error.response?.data,
      message: error.message
    });
    return Promise.reject(error);
  }
);

export const getUserData = async (uid: string) => {
  try {
    console.log('=== getUserData Started ===');
    console.log('Fetching user data for UID:', uid);
    console.log('Current auth state:', auth.currentUser ? 'Logged in' : 'Not logged in');
    
    const response = await api.get(`/api/users/${uid}`);
    console.log('User data response:', {
      status: response.status,
      topics: response.data.topics?.length || 0,
      data: response.data
    });
    
    return response.data;
  } catch (error) {
    console.log('=== getUserData Error ===');
    if (axios.isAxiosError(error)) {
      console.error('API Error Details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers
        }
      });
    } else {
      console.error('Non-Axios Error:', error);
    }
    throw error;
  }
};

export const saveToStudyList = async (material: StudyMaterial, topicId: string) => {
  try {
    console.log('=== saveToStudyList Started ===');
    console.log('Input parameters:', { material, topicId });
    
    const user = auth.currentUser;
    console.log('Current user:', user ? { uid: user.uid } : 'No user');
    
    if (!user) throw new Error('No user logged in');

    const endpoint = `/api/users/${user.uid}/topics/${topicId}/materials`;
    console.log('Endpoint:', endpoint);
    
    const materialPayload = {
      type: material.type,
      title: material.title,
      url: material.url || '',
      rating: material.rating || 5,
      dateAdded: new Date().toISOString(),
      completed: false
    };

    console.log('Material payload:', materialPayload);
    
    const response = await api.post(endpoint, materialPayload);
    
    console.log('Save material response:', {
      status: response.status,
      data: response.data
    });
    
    return response.data;
  } catch (error) {
    console.log('=== saveToStudyList Error ===');
    console.error('Error saving material:', error);
    throw error;
  }
};

// 輔助函數：根據 ID 獲取 topic
const getUserTopic = async (uid: string, topicId: string) => {
  const user = auth.currentUser;
  if (!user) throw new Error('No user logged in');
  
  const response = await api.get(`/api/users/${uid}`);
  console.log('User data received:', response.data);
  return response.data.topics?.find((t: any) => t._id === topicId);
};

// 新增輔助函數來獲取 topic 資訊
const fetchTopicById = async (topicId: string) => {
  const user = auth.currentUser;
  if (!user) throw new Error('No user logged in');
  
  const response = await api.get(`/users/${user.uid}`);
  const topic = response.data.topics.find((t: any) => t._id === topicId);
  return topic;
};

export const updateProfile = async (data: { name: string; bio: string; photoURL?: string }) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('No user logged in');

    const response = await api.put(`/users/${user.uid}/profile`, data);
    return response.data;
  } catch (error) {
    console.error('Error updating profile:', error);
    throw error;
  }
};

export const updateTopicName = async (topicId: string, name: string) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('No user logged in');

    const response = await api.put(`/users/${user.uid}/topics/${topicId}`, { name });
    return response.data;
  } catch (error) {
    console.error('Error updating topic name:', error);
    throw error;
  }
};

export const addTopic = async (name: string) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('No user logged in');

    const response = await api.post(`/users/${user.uid}/topics`, { name });
    return response.data;
  } catch (error) {
    console.error('Error adding topic:', error);
    throw error;
  }
};

export const testBackendConnection = async () => {
  try {
    console.log('Testing backend connection...');
    const response = await api.get('/test');
    console.log('Backend response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Backend connection test failed:', error);
    throw error;
  }
};

