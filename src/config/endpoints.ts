export const ENDPOINTS = {
    API_BASE: process.env.REACT_APP_API_URL || 'https://studylistserver-production.up.railway.app',
    AUTH_BASE: 'https://identitytoolkit.googleapis.com/v1',
    WEBSITE_BASE: process.env.REACT_APP_WEBSITE_URL || 'https://studylist-coral.vercel.app',
    PATHS: {
      SIGNUP: '/signup',
      LOGIN: '/login',
      FORGOT_PASSWORD: '/forgot-password'
    }
  };