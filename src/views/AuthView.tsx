import React, { useState } from 'react';
import { Milk, Leaf, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useApp } from '../context/AppContext';

const AuthView = () => {
  const { signInWithEmail, signUpWithEmail } = useApp();
  const [isLoading, setIsLoading] = useState(false);

  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [farmName, setFarmName] = useState('');
  const [phone, setPhone] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    try {
      if (authMode === 'signin') {
        await signInWithEmail(email, password);
      } else if (authMode === 'signup') {
        if (!name || !farmName || !phone) {
          setErrorMsg('Please fill in all fields.');
          setIsLoading(false);
          return;
        }
        await signUpWithEmail(email, password, { name, farmName, phone });
      }
    } catch (err: any) {
      const msg = err?.message?.includes('Failed to fetch') || err?.name === 'TypeError'
        ? 'Could not connect to the server. Please check your connection and try again.'
        : (err?.message || `Failed to ${authMode === 'signin' ? 'sign in' : 'register'}.`);
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-800 flex flex-col">
      {/* Header Section */}
      <div className="bg-linear-to-b from-brand-900 to-brand-700 flex flex-col items-center pt-20 pb-16 px-6">
        <div className="w-18 h-18 bg-white/10 border border-white/20 rounded-[28px] flex items-center justify-center mb-5 backdrop-blur-sm shadow-inner">
          <Milk className="text-white w-9 h-9" strokeWidth={1.5} />
        </div>
        <h1 className="text-4xl font-serif font-bold text-white mb-2 tracking-tight">DairyFlow</h1>
        <div className="flex items-center gap-1.5 text-white/80 text-sm font-medium">
          <Leaf size={14} />
          <span>Smart Farm Management</span>
        </div>
      </div>

      {/* Main Form Card */}
      <div className="bg-cream-50 rounded-t-[2.5rem] px-6 pt-8 pb-12 -mt-8 flex-1 flex flex-col shadow-[0_-8px_30px_rgba(0,0,0,0.12)]">
        <div className="max-w-md w-full mx-auto space-y-6">

          {errorMsg && (
            <div className="w-full bg-red-50 text-red-600 p-3 rounded-[20px] text-sm font-medium text-center border border-red-100">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="w-full bg-brand-50 text-brand-600 p-3 rounded-[20px] text-sm font-medium text-center border border-brand-100">
              {successMsg}
            </div>
          )}

          {/* Toggle */}
          <div className="bg-white p-1 rounded-[20px] flex shadow-sm border border-cream-200">
            <button
              onClick={() => { setAuthMode('signin'); setErrorMsg(''); }}
              className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all ${authMode === 'signin' ? 'bg-brand-600 shadow-md shadow-brand-600/20 text-white' : 'text-brand-900/70 hover:text-brand-900'}`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setAuthMode('signup'); setErrorMsg(''); }}
              className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all ${authMode === 'signup' ? 'bg-brand-600 shadow-md shadow-brand-600/20 text-white' : 'text-brand-900/70 hover:text-brand-900'}`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-4">
            {authMode === 'signup' && (
              <>
                <div>
                  <label className="block text-[10px] font-bold text-brand-900/70 uppercase tracking-widest mb-1.5">Your Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-white border border-cream-200 px-4 py-3.5 rounded-[20px] text-brand-900 font-medium placeholder:text-brand-900/30 focus:outline-none focus:ring-2 focus:ring-brand-600/30 focus:border-brand-600 transition-all"
                    placeholder="Anand Shinde"
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-brand-900/70 uppercase tracking-widest mb-1.5">Farm Name</label>
                  <input
                    type="text"
                    value={farmName}
                    onChange={(e) => setFarmName(e.target.value)}
                    className="w-full bg-white border border-cream-200 px-4 py-3.5 rounded-[20px] text-brand-900 font-medium placeholder:text-brand-900/30 focus:outline-none focus:ring-2 focus:ring-brand-600/30 focus:border-brand-600 transition-all"
                    placeholder="Green Pastures Dairy"
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-brand-900/70 uppercase tracking-widest mb-1.5">Phone Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-white border border-cream-200 px-4 py-3.5 rounded-[20px] text-brand-900 font-medium placeholder:text-brand-900/30 focus:outline-none focus:ring-2 focus:ring-brand-600/30 focus:border-brand-600 transition-all"
                    placeholder="+91 98765 43210"
                    disabled={isLoading}
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-[10px] font-bold text-brand-900/70 uppercase tracking-widest mb-1.5">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white border border-cream-200 px-4 py-3.5 rounded-[20px] text-brand-900 font-medium placeholder:text-brand-900/30 focus:outline-none focus:ring-2 focus:ring-brand-600/30 focus:border-brand-600 transition-all"
                placeholder="anand@greenpastures.farm"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-brand-900/70 uppercase tracking-widest mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white border border-cream-200 px-4 pr-12 py-3.5 rounded-[20px] text-brand-900 font-medium placeholder:text-brand-900/30 focus:outline-none focus:ring-2 focus:ring-brand-600/30 focus:border-brand-600 transition-all"
                  placeholder="••••••••"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-900/60 hover:text-brand-900 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-brand-600 text-white font-bold py-4 rounded-[20px] shadow-lg shadow-brand-600/20 hover:bg-brand-600/90 transition-all active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2 mt-6"
            >
              {isLoading ? 'Processing...' : (authMode === 'signin' ? 'Sign In' : 'Register')}
              {!isLoading && authMode === 'signin' && <ArrowRight size={18} />}
            </button>
          </form>

          <div className="pt-4 flex items-center justify-center">
            {authMode === 'signin' && (
              <p className="text-[11px] font-medium text-brand-900/60">
                Trusted by 2,400+ dairy farmers across Maharashtra
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthView;
