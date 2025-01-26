import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  name: String,
  firebaseUID: {
    type: String,
    required: true,
    unique: true,
  },
  materials: [{
    type: {
      type: String,
      enum: ['webpage', 'video', 'book', 'podcast'],
    },
    title: String,
    url: String,
    rating: Number,
  }],
});

export default mongoose.models.User || mongoose.model('User', userSchema);