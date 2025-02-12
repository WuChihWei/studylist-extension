import type { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '../../../../../../lib/mongodb';
import User from '../../../../../../models/User';
import { auth } from 'firebase-admin';
import { ObjectId } from 'mongodb';

interface StudyMaterial {
  type: 'webpage' | 'video' | 'book' | 'podcast';
  title: string;
  url: string;
  rating?: number;
  completed?: boolean;
  dateAdded: Date;
}

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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 添加 CORS 頭
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  // 處理 OPTIONS 請求
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  console.log('Materials API Handler Started');
  console.log('Request Method:', req.method);
  console.log('Request Query:', req.query);
  console.log('Request Body:', req.body);

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    console.log('Connecting to MongoDB...');
    await connectDB();
    console.log('MongoDB connected successfully');
    
    const { uid, topicId } = req.query;
    const material = req.body;
    
    console.log('Request parameters:', { uid, topicId, material });

    // 驗證 token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split('Bearer ')[1];
    try {
      await auth().verifyIdToken(token);
      console.log('Token verified successfully');
    } catch (error) {
      console.error('Token verification failed:', error);
      return res.status(401).json({ message: 'Invalid token' });
    }

    // 查找用戶
    console.log('Finding user with firebaseUID:', uid);
    const user = await User.findOne({ firebaseUID: uid });
    if (!user) {
      console.error('User not found:', uid);
      return res.status(404).json({ message: 'User not found' });
    }
    console.log('User found:', { id: user._id, topics: user.topics.length });
    
    console.log('Looking for topic:', topicId);
    console.log('Available topics:', user.topics.map((t: Topic) => ({ 
      id: t._id?.toString(),
      name: t.name 
    })));

    // 在用戶的 topics 陣列中查找主題
    const existingTopicIndex = user.topics.findIndex(
      (topic: Topic) => topic._id?.toString() === topicId
    );

    if (existingTopicIndex === -1) {
      return res.status(404).json({ message: 'Topic not found' });
    }

    try {
      const materialType = material.type as 'webpage' | 'video' | 'book' | 'podcast';
      const newMaterial: StudyMaterial = {
        type: materialType,
        title: material.title || '',
        url: material.url || '',
        rating: Number(material.rating) || 5,
        completed: false,
        dateAdded: new Date()
      };

      // 確保類別陣列存在
      if (!user.topics[existingTopicIndex].categories[materialType]) {
        user.topics[existingTopicIndex].categories[materialType] = [];
      }

      // 添加新材料
      user.topics[existingTopicIndex].categories[materialType].push(newMaterial);
      
      // 標記陣列為已修改
      user.markModified('topics');
      
      // 保存更新
      await user.save();
      console.log('Material added successfully');
      
      return res.status(200).json(user.topics);
    } catch (error) {
      console.error('Error adding material:', error);
      throw error;
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
  }
} 