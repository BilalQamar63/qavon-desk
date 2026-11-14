import React, { useState } from 'react';
import { AlertCircle, ArrowRight, Lock, Mail, User as UserIcon, Building2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { Avatar } from '../shared/Avatar.tsx';

const DEMO_ACCOUNTS = [
  {
    id: 'usr-1',
    name: 'Sarah Jenkins',
    email: 'sarah.jenkins@acme.io',
    roleLabel: 'Owner · VP of Global Sales',
  },
  {
    id: 'usr-2',
    name: 'David Vance',
    email: 'david.vance@acme.io',
    roleLabel: 'Admin · Sales Operations Lead',
  },
  {
    id: 'usr-3',
    name: 'Elena Rostova',
    email: 'elena.rostova@acme.io',
    roleLabel: 'Sales Rep · Senior Account Executive',
  },
];

export const AuthView: React.FC = () => {
  const { login, register, switchRole, demoMode } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState(demoMode ? 'sarah.jenkins@acme.io' : '');
  const [password, setPassword] = useState(demoMode ? 'password123' : '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Email and password are required.');
      return;
    }
    if (mode === 'signup' && !name.trim()) {
      setError('Full name is required to create an account.');
      return;
    }
    if (mode === 'signup' && password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    try {
      setLoading(true);
      if (mode === 'signin') {
        await login(email.trim(), password);
      } else {
        await register(name.trim(), email.trim(), password, companyName.trim() || undefined);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoAccess = async (userId: string) => {
    setError('');
    try {
      setLoading(true);
      await switchRole(userId);
    } catch (err: any) {
      setError(err.message || 'Failed to enter demo workspace.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F0] flex flex-col justify-center items-center p-4 sm:p-6">
      <div className="w-full max-w-md space-y-5">
        {/* Brand Wordmark */}
        <div className="flex items-center justify-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#181A1F] text-[#F0A818] flex items-center justify-center font-bold font-display text-base border border-[#2A2D36]">
            Q
          </div>
          <div>
            <h1 className="text-lg font-bold font-display text-[#181A1F] tracking-tight leading-none">
              Qavon Desk
            </h1>
            <p className="text-xs text-[#66625A] mt-0.5">B2B Sales & Pipeline Workspace</p>
          </div>
        </div>

        {/* Auth Card */}
        <div className="bg-white rounded-xl border border-[#EAE4D7] p-6 sm:p-7 space-y-5">
          {/* Segmented Mode Switcher */}
          <div className="grid grid-cols-2 p-1 bg-[#EFEAE0] rounded-lg text-xs font-medium">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setError('');
              }}
              className={`py-1.5 rounded-md transition-colors ${
                mode === 'signin'
                  ? 'bg-white text-[#181A1F] shadow-2xs font-semibold'
                  : 'text-[#66625A] hover:text-[#181A1F]'
              }`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setError('');
                setEmail('');
                setPassword('');
              }}
              className={`py-1.5 rounded-md transition-colors ${
                mode === 'signup'
                  ? 'bg-white text-[#181A1F] shadow-2xs font-semibold'
                  : 'text-[#66625A] hover:text-[#181A1F]'
              }`}
            >
              Create account
            </button>
          </div>

          <div>
            <h2 className="text-base font-semibold font-display text-[#181A1F]">
              {mode === 'signin' ? 'Sign in to your workspace' : 'Create your Qavon Desk workspace'}
            </h2>
            <p className="text-xs text-[#66625A] mt-1">
              {mode === 'signin'
                ? 'Access leads, deals, pipeline forecasts, and team activity.'
                : 'Launch an isolated organization workspace with full owner permissions.'}
            </p>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-lg border border-rose-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === 'signup' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-[#181A1F] mb-1">Full Name</label>
                  <div className="relative">
                    <UserIcon className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#66625A]" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Alex Morgan"
                      className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-[#EAE4D7] rounded-lg focus:outline-hidden focus:border-[#F0A818]"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#181A1F] mb-1">
                    Workspace / Company Name (Optional)
                  </label>
                  <div className="relative">
                    <Building2 className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#66625A]" />
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Northstar Ventures"
                      className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-[#EAE4D7] rounded-lg focus:outline-hidden focus:border-[#F0A818]"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-medium text-[#181A1F] mb-1">Work Email</label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#66625A]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-[#EAE4D7] rounded-lg focus:outline-hidden focus:border-[#F0A818]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#181A1F] mb-1">Password</label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#66625A]" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === 'signup' ? 'Minimum 8 characters' : '••••••••'}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-[#EAE4D7] rounded-lg focus:outline-hidden focus:border-[#F0A818]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 text-xs font-semibold text-[#181A1F] bg-[#F0A818] hover:bg-[#D9930C] rounded-lg transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <span>{loading ? 'Authenticating...' : mode === 'signin' ? 'Sign in' : 'Create account'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Demo Workspace Personas */}
          {demoMode && (
            <div className="pt-4 border-t border-[#EAE4D7] space-y-2.5">
              <div className="flex items-center justify-between text-[11px] text-[#66625A]">
                <span className="font-medium">Quick workspace access</span>
                <span className="font-mono">password123</span>
              </div>
              <div className="divide-y divide-[#EAE4D7] border border-[#EAE4D7] rounded-lg overflow-hidden">
                {DEMO_ACCOUNTS.map((acct) => (
                  <button
                    key={acct.id}
                    type="button"
                    disabled={loading}
                    onClick={() => handleDemoAccess(acct.id)}
                    className="w-full px-3 py-2 bg-white hover:bg-[#FAF7F0] transition-colors flex items-center justify-between gap-2 text-left"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar name={acct.name} size="sm" />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-[#181A1F] truncate">{acct.name}</p>
                        <p className="text-[11px] text-[#66625A] truncate">{acct.roleLabel}</p>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-[#66625A] shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
