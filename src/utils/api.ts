import axios, { InternalAxiosRequestConfig } from 'axios';
import { auth } from './firebase';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.set('Authorization', `Bearer ${token}`);
    console.log('Request headers:', config.headers);
  } else {
    console.log('No user found when making request');
  }
  return config;
});

export interface StudyMaterial {
    type: 'webpage' | 'video' | 'book' | 'podcast';
    title: string;
    url: string;
    userId: string;
    dateAdded?: string;
  }

export const getUserData = async (uid: string) => {
  try {
    console.log('Attempting to connect to backend at:', API_URL);
    console.log('Fetching user data for UID:', uid);
    const response = await api.get(`/users/${uid}`);
    console.log('Backend response:', response.data);
    return response.data;
  } catch (error: unknown) {
    console.error('Backend connection details:', {
      url: API_URL,
      error: (error as Error).message,
      response: (error as any).response?.data
    });
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      console.log('User not found, creating new user...');
      const user = auth.currentUser;
      if (user) {
        const newUser = {
          email: user.email,
          name: user.displayName,
          firebaseUID: user.uid,
          materials: []
        };
        const response = await api.post('/users', newUser);
        return response.data;
      }
    }
    throw error;
  }
};

export const saveToStudyList = async (material: StudyMaterial) => {
  try {
    console.log('Attempting to save material...');
    const user = auth.currentUser;
    if (!user) throw new Error('No user logged in');

    const token = await user.getIdToken();
    console.log('Auth token available:', !!token);
    
    const materialData = {
      type: material.type,
      title: material.title,
      url: material.url || '',
      rating: 5, // 預設評分
      dateAdded: material.dateAdded || new Date().toISOString()
    };

    console.log('Sending material data:', materialData);
    
    const response = await api.post(`/users/${user.uid}/materials`, materialData);
    console.log('Save response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error saving to StudyList:', error);
    if (axios.isAxiosError(error)) {
      console.error('Response data:', error.response?.data);
      console.error('Response status:', error.response?.status);
      console.error('Request URL:', error.config?.url);
      console.error('Request data:', error.config?.data);
    }
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

