import axios, { InternalAxiosRequestConfig } from 'axios';
import { auth } from './firebase';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

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
  }
  return config;
});

interface StudyMaterial {
  type: 'webpage' | 'video' | 'book' | 'podcast';
  title: string;
  url: string;
  userId: string;
}

export const saveToStudyList = async (material: StudyMaterial) => {
  try {
    const response = await api.post('/materials', material);
    return response.data;
  } catch (error) {
    console.error('Error saving to StudyList:', error);
    throw error;
  }
}; 