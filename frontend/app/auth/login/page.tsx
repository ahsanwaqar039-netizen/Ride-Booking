'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { LogIn, User, Lock, ArrowRight, Car } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import api from '@/lib/api';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.post('/auth/login', { username, password });
      const data = response.data;
      const token = data.token || data.Token;
      const role = data.role || data.Role;
      const id = data.id || data.Id;
      const loggedUsername = data.username || data.Username || username;

      if (token) localStorage.setItem('token', token);
      if (role) localStorage.setItem('role', role);
      if (id !== undefined && id !== null) localStorage.setItem('userId', id.toString());
      localStorage.setItem('username', loggedUsername);

      toast.success(`Welcome back, ${username}!`);
      router.push('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="premium-card glass auth-box"
      >
        <div className="brand">
          <div className="logo-icon grad-primary">
            <Car size={32} color="#000" />
          </div>
          <h1>DriveFlow</h1>
          <p>Login to your account</p>
        </div>

        <form onSubmit={handleLogin} className="auth-form">
          <div className="input-group">
            <User size={18} className="input-icon" />
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <Lock size={18} className="input-icon" />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="premium-button w-full" disabled={loading}>
            {loading ? 'Logging in...' : (
              <>
                Login <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <p className="auth-footer">
          Don't have an account? <Link href="/auth/register" className="link-text">Sign Up</Link>
        </p>
      </motion.div>

      <style jsx>{`
        .auth-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: radial-gradient(circle at center, #1a1a1a 0%, #050505 100%);
        }
        .auth-box {
          width: 100%;
          max-width: 400px;
          padding: 40px;
          text-align: center;
        }
        .brand {
          margin-bottom: 32px;
        }
        .logo-icon {
          width: 64px;
          height: 64px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
        }
        .brand h1 {
          font-size: 2rem;
          margin-bottom: 8px;
        }
        .brand p {
          color: var(--muted);
        }
        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .input-group {
          position: relative;
        }
        .input-icon {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--muted);
        }
        .input-group input {
          width: 100%;
          padding-left: 48px;
        }
        .w-full {
          width: 100%;
        }
        .auth-footer {
          margin-top: 24px;
          color: var(--muted);
          font-size: 0.9rem;
        }
        .link-text {
          color: var(--primary);
          font-weight: 600;
        }
      `}</style>
    </div>
  );
}
