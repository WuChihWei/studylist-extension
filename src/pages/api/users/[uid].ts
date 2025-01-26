// 在後端 API 路由文件中 (例如 pages/api/users/[uid].ts)
import type { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '../../../lib/mongodb';
import User from '../../../models/User';
import { auth } from 'firebase-admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('API Route Handler Started');
  console.log('Request Method:', req.method);
  console.log('Request Query:', req.query);
  console.log('Environment Variables:', {
    MONGODB_URI: process.env.MONGODB_URI ? 'Set' : 'Not Set',
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID ? 'Set' : 'Not Set'
  });

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    console.log('Attempting to connect to MongoDB...');
    const connection = await connectDB();
    console.log('MongoDB Connection State:', connection.readyState);

    // 獲取用戶 ID
    const { uid } = req.query;
    console.log('Searching for user with UID:', uid);

    // 驗證 Firebase token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split('Bearer ')[1];
    try {
      await auth().verifyIdToken(token);
    } catch (error) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    // 查詢用戶數據
    const user = await User.findOne({ firebaseUID: uid });
    console.log('User search result:', user);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error('Detailed API Error:', error);
    console.error('Error Stack:', error instanceof Error ? error.stack : 'No stack trace');
    res.status(500).json({ message: 'Internal server error' });
  }
}