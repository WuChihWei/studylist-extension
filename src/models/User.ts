import mongoose from 'mongoose';

interface StudyMaterial {
  type: 'webpage' | 'video' | 'book' | 'podcast';
  title: string;
  url: string;
  rating?: number;
  completed?: boolean;
  dateAdded: Date;
  topicName?: string;
}

interface Categories {
  webpage: StudyMaterial[];
  video: StudyMaterial[];
  book: StudyMaterial[];
  podcast: StudyMaterial[];
}

interface Topic {
  _id?: string;
  name: string;
  categories: Categories;
  createdAt?: Date;
}

interface User {
  firebaseUID: string;
  name: string;
  email: string;
  bio: string;
  topics: Topic[];
  createdAt?: Date;
}

export type { User, Topic, Categories, StudyMaterial };

const materialSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['webpage', 'book', 'video', 'podcast'],
    required: true
  },
  title: String,
  url: String,
  rating: Number,
  completed: {
    type: Boolean,
    default: false
  },
  dateAdded: {
    type: Date,
    default: Date.now
  }
});

const categorySchema = new mongoose.Schema({
  webpage: [materialSchema],
  video: [materialSchema],
  book: [materialSchema],
  podcast: [materialSchema]
});

const topicSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  categories: categorySchema,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const userSchema = new mongoose.Schema({
  firebaseUID: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  bio: {
    type: String,
    default: "Introduce yourself"
  },
  topics: [topicSchema],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.models.User || mongoose.model('User', userSchema);