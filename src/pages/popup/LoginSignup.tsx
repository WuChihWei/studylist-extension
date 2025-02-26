import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../utils/firebase';

interface LoginSignupProps {
  onClose: () => void;
  onRegisterClick: () => void;
  onForgotPasswordClick: () => void;
}

interface User {
  email: string;
  uid: string;
}

const LoginSignup: React.FC<LoginSignupProps> = ({ 
  onClose, 
  onRegisterClick, 
  onForgotPasswordClick 
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [user, setUser] = useState<User | null>(null);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // 使用 Firebase Auth 進行登入
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const token = await userCredential.user.getIdToken();
      
      // 儲存 token 到 chrome.storage
      chrome.storage.local.set({
        authToken: token,
        user: {
          email: userCredential.user.email,
          uid: userCredential.user.uid
        }
      });
      
      onClose();
    } catch (error: any) {
      setError(error.message);
    }
  };

  return (
    <div className="login-signup-container">
      <h1>Log In or Sign up to continue</h1>
      <p>Start now!</p>
      
      {/* <button 
        className="social-login-button google"
        onClick={handleGoogleLogin}
      >
        <img src="google-icon.png" alt="Google" />
        Log In With Google
      </button> */}

      {/* <div className="divider">
        <span>or</span>
      </div> */}

      <form onSubmit={handleEmailLogin}>
        <input
          type="email"
          placeholder="Email Address"
          className="login-input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          className="login-input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && <div className="error-message">{error}</div>}

        <button type="submit" className="login-button">
          Login
        </button>
      </form>

      <button 
        className="register-button"
        onClick={onRegisterClick}
      >
        Register
      </button>

      <a 
        href="#" 
        className="forgot-password"
        onClick={(e) => {
          e.preventDefault();
          onForgotPasswordClick();
        }}
      >
        Forgot Password
      </a>
    </div>
  );
};

export default LoginSignup;
