import mongoose from 'mongoose';

declare global {
  var mongoose: {
    conn: mongoose.Connection | null;
    promise: Promise<mongoose.Connection> | null;
  } | undefined;
}

const MONGODB_URI = process.env.MONGODB_URI as string;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

console.log('MongoDB URI:', MONGODB_URI);

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (!cached) {
    throw new Error('MongoDB cache not initialized');
  }

  if (cached.conn) {
    console.log('Using cached MongoDB connection');
    return cached.conn;
  }

  if (!cached.promise) {
    console.log('Attempting to connect to MongoDB...');
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log('Successfully connected to MongoDB');
      return mongoose.connection;
    });
  }

  try {
    cached.conn = await cached.promise;
    console.log('MongoDB connection established');
    return cached.conn;
  } catch (e) {
    console.error('MongoDB connection error:', e);
    cached.promise = null;
    throw e;
  }
}

export default connectDB;