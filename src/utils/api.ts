import axios from 'axios';
import { ENDPOINTS } from '../config/endpoints';
import { auth } from './firebase';
import { User, StudyMaterial } from '../models/User';

const api = axios.create({
  baseURL: ENDPOINTS.API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for Firebase token
api.interceptors.request.use(async (config) => {
  try {
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  } catch (error) {
    console.error('Error in request interceptor:', error);
    return Promise.reject(error);
  }
});

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Response error:', error.response || error);
    return Promise.reject(error);
  }
);

async function getAuthToken(): Promise<string | null> {
  return new Promise((resolve) => {
    chrome.storage.local.get(['authToken'], (result) => {
      resolve(result.authToken || null);
    });
  });
}

export const fetchUserData = async (uid: string) => {
  try {
    const response = await api.get(`/api/users/${uid}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching user data:', error);
    throw error;
  }
};

export const saveToStudyList = async (material: StudyMaterial, topicId: string) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('No user logged in');

    const response = await api.post(
      `/api/users/${user.uid}/topics/${topicId}/materials`,
      material
    );
    return response.data;
  } catch (error) {
    console.error('Error saving material:', error);
    return false;
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

