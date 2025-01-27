// import type { NextApiRequest, NextApiResponse } from 'next';
// import connectDB from '../../lib/mongodb';
// import User from '../../models/User';
// import { auth } from 'firebase-admin';

// export default async function handler(req: NextApiRequest, res: NextApiResponse) {
//   console.log('Materials API Route Handler Started');
//   console.log('Request Method:', req.method);
//   console.log('Request Body:', req.body);

//   if (req.method !== 'POST') {
//     return res.status(405).json({ message: 'Method not allowed' });
//   }

//   try {
//     await connectDB();

//     // 驗證 Firebase token
//     const authHeader = req.headers.authorization;
//     if (!authHeader || !authHeader.startsWith('Bearer ')) {
//       return res.status(401).json({ message: 'No token provided' });
//     }

//     const token = authHeader.split('Bearer ')[1];
//     const decodedToken = await auth().verifyIdToken(token);
//     const uid = decodedToken.uid;

//     console.log('Verified UID:', uid);
//     console.log('Adding material for user:', uid);

//     // 更新用戶的材料列表
//     const updatedUser = await User.findOneAndUpdate(
//       { firebaseUID: uid },
//       { $push: { materials: req.body } },
//       { new: true }
//     );

//     if (!updatedUser) {
//       console.log('User not found:', uid);
//       return res.status(404).json({ message: 'User not found' });
//     }

//     console.log('Successfully added material');
//     res.status(200).json(updatedUser);
//   } catch (error) {
//     console.error('Error in materials API:', error);
//     res.status(500).json({ message: 'Internal server error', error: error.message });
//   }
// }