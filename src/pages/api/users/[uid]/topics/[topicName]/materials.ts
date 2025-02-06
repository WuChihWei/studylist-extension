import type { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '../../../../../../lib/mongodb';
import User from '../../../../../../models/User';
import { auth } from 'firebase-admin';

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
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    console.log('Connecting to MongoDB...');
    await connectDB();
    console.log('MongoDB connected successfully');
    
    const { uid, topicName } = req.query;
    const material = req.body;
    
    console.log('Request parameters:', { uid, topicName, material });

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

    // 解碼主題名稱
    const decodedTopicName = decodeURIComponent(topicName as string);
    console.log('Decoded topic name:', decodedTopicName);
    
    // 在用戶的 topics 陣列中查找主題
    const existingTopicIndex = user.topics.findIndex((topic: Topic) => topic.name === decodedTopicName);

    if (existingTopicIndex !== -1) {
      // 如果主題存在
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
    } else {
      // 如果主題不存在，創建新主題
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

        const newTopic: Topic = {
          name: decodedTopicName,
          categories: {
            webpage: [],
            video: [],
            book: [],
            podcast: []
          },
          createdAt: new Date()
        };

        // 確保類別陣列已初始化
        if (!newTopic.categories[materialType]) {
          newTopic.categories[materialType] = [];
        }

        // 添加新材料
        newTopic.categories[materialType].push(newMaterial);
        user.topics.push(newTopic);
        
        // 標記陣列為已修改
        user.markModified('topics');
        
        await user.save();
        console.log('New topic created with material');
        
        return res.status(200).json(user.topics);
      } catch (error) {
        console.error('Error creating new topic:', error);
        throw error;
      }
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