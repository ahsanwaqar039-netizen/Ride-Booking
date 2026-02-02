'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, User, Lock, ArrowRight, Car, Shield } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import api from '@/lib/api';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Rider');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/register', { username, password, role });
      toast.success('Registration successful! Please login.');
      router.push('/auth/login');
    } catch (error: any) {
      toast.error(error.response?.data || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="premium-card glass auth-box"
      >
        <div className="brand">
          <div className="logo-icon grad-primary">
            <UserPlus size={32} color="#000" />
          </div>
          <h1>Join DriveFlow</h1>
          <p>Create your account today</p>
        </div>

        <form onSubmit={handleRegister} className="auth-form">
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

          <div className="role-selector">
            <p>I want to be a:</p>
            <div className="role-options">
              <button
                type="button"
                className={`role-btn ${role === 'Rider' ? 'active' : ''}`}
                onClick={() => setRole('Rider')}
              >
                <User size={18} /> Rider
              </button>
              <button
                type="button"
                className={`role-btn ${role === 'Driver' ? 'active' : ''}`}
                onClick={() => setRole('Driver')}
              >
                <Car size={18} /> Driver
              </button>
            </div>
          </div>

          <button type="submit" className="premium-button w-full" disabled={loading}>
            {loading ? 'Creating account...' : (
              <>
                Sign Up <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link href="/auth/login" className="link-text">Login</Link>
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
          max-width: 440px;
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
        .role-selector {
          text-align: left;
          margin-top: 8px;
        }
        .role-selector p {
          font-size: 0.9rem;
          color: var(--muted);
          margin-bottom: 12px;
        }
        .role-options {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        .role-btn {
          background: var(--secondary);
          color: white;
          padding: 12px;
          border-radius: 12px;
          border: 1px solid var(--glass-border);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s ease;
        }
        .role-btn.active {
          background: rgba(193, 255, 0, 0.1);
          border-color: var(--primary);
          color: var(--primary);
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
