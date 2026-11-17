import React, { useState } from 'react';
import { AlertCircle, ArrowRight, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';

export const AcceptInviteView: React.FC = () => {
  const { acceptInvitation } = useAuth();
  const token = new URLSearchParams(window.location.search).get('token') || '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [accepted, setAccepted] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (!token) {
      setError('This invitation link is missing its token.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      await acceptInvitation(token, password);
      setAccepted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept invitation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F0] flex flex-col justify-center items-center p-4 sm:p-6">
      <div className="w-full max-w-md space-y-5">
        <div className="flex items-center justify-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#181A1F] text-[#F0A818] flex items-center justify-center font-bold font-display text-base border border-[#2A2D36]">
            Q
          </div>
          <div>
            <h1 className="text-lg font-bold font-display text-[#181A1F] tracking-tight leading-none">
              Qavon Desk
            </h1>
            <p className="text-xs text-[#66625A] mt-0.5">Team invitation</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#EAE4D7] p-6 sm:p-7 space-y-5">
          <div>
            <h2 className="text-base font-semibold font-display text-[#181A1F]">
              {accepted ? 'Your account is ready' : 'Set your password'}
            </h2>
            <p className="text-xs text-[#66625A] mt-1">
              {accepted
                ? 'Your invitation has been accepted. Continue to your workspace.'
                : 'Choose a password to join your Qavon Desk workspace.'}
            </p>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-lg border border-rose-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {accepted ? (
            <button
              type="button"
              onClick={() => window.location.replace('/')}
              className="w-full py-2.5 px-4 text-xs font-semibold text-[#181A1F] bg-[#F0A818] hover:bg-[#D9930C] rounded-lg transition-colors flex items-center justify-center gap-1.5"
            >
              <span>Continue to workspace</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : token ? (
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-[#181A1F] mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#66625A]" />
                  <input
                    type="password"
                    required
                    minLength={8}
                    maxLength={200}
                    autoComplete="new-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="At least 8 characters"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-[#EAE4D7] rounded-lg focus:outline-hidden focus:border-[#F0A818]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#181A1F] mb-1">
                  Confirm password
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#66625A]" />
                  <input
                    type="password"
                    required
                    minLength={8}
                    maxLength={200}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="Enter your password again"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-[#EAE4D7] rounded-lg focus:outline-hidden focus:border-[#F0A818]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !token}
                className="w-full py-2.5 px-4 text-xs font-semibold text-[#181A1F] bg-[#F0A818] hover:bg-[#D9930C] rounded-lg transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <span>{loading ? 'Setting password...' : 'Accept invitation'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          ) : (
            <p className="text-xs text-rose-700">This invitation link is missing its token.</p>
          )}
        </div>
      </div>
    </div>
  );
};
