import type { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '../../../lib/mongodb';
import User from '../../../models/User';
import { auth } from 'firebase-admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await connectDB();

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

    const { email, name, firebaseUID, materials } = req.body;
    
    const existingUser = await User.findOne({ firebaseUID });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = new User({
      email,
      name,
      firebaseUID,
      materials: materials || []
    });

    await user.save();
    res.status(201).json(user);
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}