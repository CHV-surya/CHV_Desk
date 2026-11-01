import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, User, AlertCircle, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/common/Button';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, currentUser, isAdmin, isManager } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Auto redirect if already logged in
  useEffect(() => {
    if (currentUser) {
      if (isAdmin) {
        navigate('/admin', { replace: true });
      } else if (isManager) {
        navigate('/manager/dashboard', { replace: true });
      } else {
        navigate('/employee/dashboard', { replace: true });
      }
    }
  }, [currentUser, isAdmin, isManager, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const result = await login(username, password);
      setIsLoading(false);
      if (!result.success) {
        setError(result.message || 'Invalid username or password.');
      }
    } catch (err: any) {
      setIsLoading(false);
      setError(err?.message || 'Login failed. Please check backend connection.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 font-sans relative overflow-hidden"
      style={{
        background: 'linear-gradient(145deg, #0B132B 0%, #142653 35%, #1e3a7a 65%, #172554 100%)',
      }}
    >
      {/* Ambient gradient orbs */}
      <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full opacity-15"
        style={{ background: 'radial-gradient(circle, #2563EB 0%, transparent 70%)' }}
      />
      <div className="absolute bottom-[-15%] left-[-10%] w-[500px] h-[500px] rounded-full opacity-10"
        style={{ background: 'radial-gradient(circle, #8B5CF6 0%, transparent 70%)' }}
      />

      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-lg mb-4 font-extrabold text-2xl tracking-wider">
            W
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight flex items-center justify-center gap-2.5">
            WorkTrack
            <span className="text-xs font-mono uppercase bg-blue-500/25 text-blue-300 border border-blue-400/30 px-2 py-0.5 rounded-md font-bold tracking-wider">
              ENTERPRISE
            </span>
          </h1>
          <p className="text-sm sm:text-base text-blue-200/80 mt-2 font-medium">
            Employee Activity & Operations Management System
          </p>
        </div>

        {/* Login Form Container - Glassmorphism */}
        <div className="rounded-3xl p-6 sm:p-8 shadow-2xl"
          style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.8)',
            boxShadow: '0 25px 60px -12px rgba(11, 19, 43, 0.4)',
          }}
        >
          <div className="mb-5 pb-4 border-b border-slate-100">
            <h2 className="text-base font-extrabold text-slate-900 uppercase tracking-wider">
              Workspace Authentication
            </h2>
            <p className="text-xs sm:text-[13px] text-slate-500 mt-1 font-medium">
              Enter credentials or select a demonstration account below
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm flex items-center gap-2.5 font-medium animate-in fade-in">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username Input */}
            <div>
              <label className="block text-xs sm:text-[13px] font-bold text-slate-700 mb-1.5">
                Username
              </label>
              <div className="relative flex items-center">
                <User className="w-4.5 h-4.5 text-slate-400 absolute left-3.5 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  className="w-full pl-11 pr-3 py-2.5 bg-slate-50/70 hover:bg-slate-50 focus:bg-white text-sm sm:text-[15px] text-slate-900 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-xs sm:text-[13px] font-bold text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative flex items-center">
                <Lock className="w-4.5 h-4.5 text-slate-400 absolute left-3.5 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full pl-11 pr-11 py-2.5 bg-slate-50/70 hover:bg-slate-50 focus:bg-white text-sm sm:text-[15px] text-slate-900 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 p-1 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4.5 h-4.5" />
                  ) : (
                    <Eye className="w-4.5 h-4.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isLoading}
                className="w-full justify-center shadow-md font-bold h-11.5 rounded-xl text-sm sm:text-base cursor-pointer"
                icon={<ArrowRight className="w-4.5 h-4.5" />}
                iconPosition="right"
              >
                Sign In to Platform
              </Button>
            </div>
          </form>
        </div>

        {/* Footer info */}
        <div className="text-center mt-6 text-xs text-blue-300/60 font-mono font-medium">
          WorkTrack Enterprise • Secure Access
        </div>
      </div>
    </div>
  );
};
