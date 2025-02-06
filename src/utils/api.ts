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
  rating: number;
  completed: boolean;
  dateAdded: string;
}

interface Topic {
  name: string;
  categories: {
    webpage: StudyMaterial[];
    video: StudyMaterial[];
    book: StudyMaterial[];
    podcast: StudyMaterial[];
  };
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
          bio: "Introduce yourself",
          topics: [{
            name: "Default Topic",
            categories: {
              webpage: [],
              video: [],
              book: [],
              podcast: []
            }
          }],
          contributions: []
        };
        const response = await api.post('/users', newUser);
        return response.data;
      }
    }
    throw error;
  }
};

export const saveToStudyList = async (material: StudyMaterial, topicId: string) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No user logged in');
    }

    const endpoint = `/users/${encodeURIComponent(user.uid)}/topics/${encodeURIComponent(topicId)}/materials`;
    
    const materialPayload = {
      type: material.type,
      title: material.title,
      url: material.url,
      rating: material.rating || 5,
      completed: material.completed || false,
      dateAdded: material.dateAdded
    };

    console.log('Request details:', {
      endpoint,
      materialPayload
    });
    
    const response = await api.post(endpoint, materialPayload);

    if (response.status !== 200) {
      throw new Error(`API Error: ${response.status}`);
    }
    
    return response.data;
  } catch (error) {
    console.error('API call details:', {
      error,
      endpoint: API_URL,
      material,
      topicId
    });
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

