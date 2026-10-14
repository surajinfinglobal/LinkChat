import { useState,useEffect  } from 'react';
import { Lock, Eye, EyeOff, Laptop, Smartphone, Monitor, Tablet, Loader2, Check, QrCode,KeyRound,Mail,ShieldCheck,ArrowLeft } from 'lucide-react';

import { Card, CardHeader, SettingRow, Divider, PageHeader } from '../components/Primitives';
import Toggle from '../components/Toggle';
import ConfirmModal from '../components/ConfirmModal';
import api from "../../services/api";

const DEVICE_ICONS = {
  Desktop: Monitor,
  "Mobile device": Smartphone,
  Tablet,
};

const formatLastActive = (date) => {
  if (!date) return "Unknown activity";

  const timestamp = new Date(date).getTime();

  if (Number.isNaN(timestamp)) return "Unknown activity";

  const diff = Math.max(0, Date.now() - timestamp);
  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;

  return new Date(date).toLocaleDateString();
};

export default function SecuritySection() {
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [pwErrors, setPwErrors] = useState({});
  const [pwSaving, setPwSaving] = useState(false);
  const [pwSaved, setPwSaved] = useState(false);
  const [show, setShow] = useState({ current: false, next: false, confirm: false });

  // Forgot password
const [resetStep, setResetStep] = useState(null);
// null | 'email' | 'otp' | 'password' | 'success'

const [resetEmail, setResetEmail] = useState('');
const [resetOtp, setResetOtp] = useState('');
const [resetPassword, setResetPassword] = useState('');
const [resetConfirm, setResetConfirm] = useState('');

const [resetLoading, setResetLoading] = useState(false);
const [resetError, setResetError] = useState('');
const [resetSuccess, setResetSuccess] = useState('');
const [resetShowPassword, setResetShowPassword] = useState(false);
const [resetShowConfirm, setResetShowConfirm] = useState(false);

  const [twoFA, setTwoFA] = useState(false);
  const [twoFAStep, setTwoFAStep] = useState(null); // null | 'setup'
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState('');

  const [sessions, setSessions] = useState([]);
  const [sessionsError, setSessionsError] = useState("");
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [revokeTarget, setRevokeTarget] = useState(null);
  const [revoking, setRevoking] = useState(false);
  const [revokeError, setRevokeError] = useState('');


  
  const updatePw = (field) => (e) => setPwForm((f) => ({ ...f, [field]: e.target.value }));

  const handlePwSubmit = async (e) => {
  e.preventDefault();

  const next = {};

  if (!pwForm.current) {
    next.current = "Enter your current password";
  }

  if (!pwForm.next || pwForm.next.length < 8) {
    next.next = "New password must be at least 8 characters";
  }

  if (pwForm.confirm !== pwForm.next) {
    next.confirm = "Passwords do not match";
  }

  setPwErrors(next);

  if (Object.keys(next).length) return;

  setPwSaving(true);
  setPwSaved(false);

  try {
    await api.put("/auth/change-password", {
      currentPassword: pwForm.current,
      newPassword: pwForm.next,
    });

    setPwSaved(true);
    setPwForm({
      current: "",
      next: "",
      confirm: "",
    });
    setPwErrors({});

    setTimeout(() => setPwSaved(false), 2500);
  } catch (error) {
    const message =
      error.response?.data?.message ||
      "Failed to change password. Please try again.";

    setPwErrors((prev) => ({
      ...prev,
      current: message,
    }));
  } finally {
    setPwSaving(false);
  }
};

useEffect(() => {
  const fetchSessions = async () => {
    try {
      const response = await api.get("/users/sessions");
      setSessions(response.data.sessions || []);
    } catch (error) {
      setSessionsError(
        error.response?.data?.message || "Failed to load sessions"
      );
    } finally {
      setSessionsLoading(false);
    }
  };

  fetchSessions();
}, []);

const startForgotPassword = () => {
  setResetStep('email');
  setResetError('');
  setResetSuccess('');
};

const handleSendResetOtp = async (e) => {
  e.preventDefault();

  if (!resetEmail.trim()) {
    setResetError('Enter your email address');
    return;
  }

  setResetLoading(true);
  setResetError('');
  setResetSuccess('');

  try {
    const response = await api.post('/auth/forgot-password', {
      email: resetEmail.trim().toLowerCase(),
    });

    setResetStep('otp');
    setResetSuccess(
      response.data?.message || 'If an account exists, an OTP has been sent.'
    );
  } catch (error) {
    setResetError(
      error.response?.data?.message ||
        'Failed to send OTP. Please try again.'
    );
  } finally {
    setResetLoading(false);
  }
};

const handleVerifyResetOtp = async (e) => {
  e.preventDefault();

  if (!/^\d{6}$/.test(resetOtp)) {
    setResetError('Enter the 6-digit OTP');
    return;
  }

  setResetLoading(true);
  setResetError('');
  setResetSuccess('');

  try {
    await api.post('/auth/verify-reset-otp', {
      email: resetEmail.trim().toLowerCase(),
      otp: resetOtp,
    });

    setResetStep('password');
    setResetSuccess('OTP verified successfully.');
  } catch (error) {
    setResetError(
      error.response?.data?.message ||
        'Invalid OTP. Please try again.'
    );
  } finally {
    setResetLoading(false);
  }
};

const handleResetPassword = async (e) => {
  e.preventDefault();

  if (!resetPassword || resetPassword.length < 8) {
    setResetError('Password must be at least 8 characters');
    return;
  }

  if (resetConfirm !== resetPassword) {
    setResetError('Passwords do not match');
    return;
  }

  setResetLoading(true);
  setResetError('');
  setResetSuccess('');

  try {
    await api.post('/auth/reset-password', {
      email: resetEmail.trim().toLowerCase(),
      otp: resetOtp,
      newPassword: resetPassword,
    });

    setResetStep('success');
    setResetPassword('');
    setResetConfirm('');
    setResetSuccess('Your password has been reset successfully.');
  } catch (error) {
    setResetError(
      error.response?.data?.message ||
        'Failed to reset password. Please try again.'
    );
  } finally {
    setResetLoading(false);
  }
};

const cancelResetPassword = () => {
  setResetStep(null);
  setResetEmail('');
  setResetOtp('');
  setResetPassword('');
  setResetConfirm('');
  setResetError('');
  setResetSuccess('');
};

  const handleToggle2FA = (val) => {
    if (val) setTwoFAStep('setup');
    else {
      setTwoFA(false);
      setTwoFAStep(null);
    }
  };

  const handleVerifyCode = () => {
    if (!/^\d{6}$/.test(code)) {
      setCodeError('Enter the 6-digit code from your authenticator app');
      return;
    }
    setTwoFA(true);
    setTwoFAStep(null);
    setCode('');
    setCodeError('');
  };

  const confirmRevoke = async () => {
    setRevoking(true);
    setRevokeError('');

    try {
      await api.delete(`/users/sessions/${revokeTarget.id}`);
      setSessions((s) => s.filter((sess) => sess.id !== revokeTarget.id));
      setRevokeTarget(null);
    } catch (error) {
      setRevokeError(
        error.response?.data?.message || 'Failed to revoke session. Please try again.'
      );
    } finally {
      setRevoking(false);
    }
  };

  return (
    <div>
      <PageHeader title="Security" description="Keep your account safe and control where you're signed in." />

      <div className="space-y-5">
        <Card>
          <CardHeader title="Change password" />
          <form onSubmit={handlePwSubmit} className="px-5 sm:px-6 py-5 space-y-4" noValidate>
            <PwField label="Current password" value={pwForm.current} onChange={updatePw('current')} error={pwErrors.current} visible={show.current} onToggleVisible={() => setShow((s) => ({ ...s, current: !s.current }))} />
            <PwField label="New password" value={pwForm.next} onChange={updatePw('next')} error={pwErrors.next} visible={show.next} onToggleVisible={() => setShow((s) => ({ ...s, next: !s.next }))} />
            <PwField label="Confirm new password" value={pwForm.confirm} onChange={updatePw('confirm')} error={pwErrors.confirm} visible={show.confirm} onToggleVisible={() => setShow((s) => ({ ...s, confirm: !s.confirm }))} />

            <div className="flex items-center gap-3 pt-1">
              <button
                type="submit"
                disabled={pwSaving}
                className="h-10 px-5 rounded-xl bg-accent-gradient text-base-950 text-sm font-semibold shadow-glow-accent hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-70 flex items-center gap-2"
              >
                {pwSaving && <Loader2 size={15} className="animate-spin" />}
                {pwSaving ? 'Updating…' : 'Update password'}
              </button>
              {pwSaved && (
                <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-400 animate-fade-in">
                  <Check size={14} /> Password updated
                </span>
              )}
            </div>
          </form>
        </Card>

        <Card>
          <CardHeader
    title="Forgot password"
    description="Reset your password if you don't remember your current password."
  />

  <div className="px-5 sm:px-6 py-5">
    {!resetStep && (
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent-cyan/10 border border-accent-cyan/20 grid place-items-center shrink-0">
            <KeyRound size={18} className="text-accent-cyan" />
          </div>

          <div>
            <p className="text-sm font-medium text-base-100">
              Don't remember your current password?
            </p>
            <p className="text-xs text-base-400 mt-1">
              We'll send a 6-digit OTP to your registered email address.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={startForgotPassword}
          className="h-10 px-4 rounded-xl bg-base-800 border border-base-600 text-sm font-medium text-base-100 hover:bg-base-700 transition-all"
        >
          Reset password
        </button>
      </div>
    )}

    {resetStep === 'email' && (
      <form onSubmit={handleSendResetOtp} className="space-y-4">
        <ResetHeader
          icon={<Mail size={18} />}
          title="Enter your email"
          description="Enter the email address associated with your LinkChat account."
        />

        <div>
          <label className="block text-xs font-medium text-base-300 mb-1.5">
            Email address
          </label>

          <input
            type="email"
            value={resetEmail}
            onChange={(e) => {
              setResetEmail(e.target.value);
              setResetError('');
            }}
            placeholder="you@example.com"
            autoComplete="email"
            className={`w-full h-11 px-3.5 rounded-xl bg-base-800/60 border text-sm text-base-100 placeholder:text-base-500 outline-none transition-all ${
              resetError
                ? 'border-rose-500/60'
                : 'border-base-600/80 focus:border-accent-cyan/50 focus:ring-2 focus:ring-accent-cyan/20'
            }`}
          />

          {resetError && (
            <p className="mt-1.5 text-xs text-rose-400">
              {resetError}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={resetLoading}
            className="h-10 px-5 rounded-xl bg-accent-gradient text-base-950 text-sm font-semibold shadow-glow-accent hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-70 flex items-center gap-2"
          >
            {resetLoading && (
              <Loader2 size={15} className="animate-spin" />
            )}
            {resetLoading ? 'Sending…' : 'Send OTP'}
          </button>

          <button
            type="button"
            onClick={cancelResetPassword}
            className="h-10 px-4 rounded-xl text-sm text-base-400 hover:text-base-100 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    )}

    {resetStep === 'otp' && (
      <form onSubmit={handleVerifyResetOtp} className="space-y-4">
        <ResetHeader
          icon={<ShieldCheck size={18} />}
          title="Verify OTP"
          description={`Enter the 6-digit code sent to ${resetEmail}.`}
        />

        {resetSuccess && (
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-3 text-xs text-emerald-400">
            {resetSuccess}
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-base-300 mb-1.5">
            6-digit OTP
          </label>

          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={resetOtp}
            onChange={(e) => {
              setResetOtp(
                e.target.value.replace(/\D/g, '').slice(0, 6)
              );
              setResetError('');
            }}
            placeholder="000000"
            className={`w-full h-11 px-3.5 rounded-xl bg-base-800/60 border text-sm tracking-[0.35em] text-base-100 placeholder:text-base-500 outline-none transition-all ${
              resetError
                ? 'border-rose-500/60'
                : 'border-base-600/80 focus:border-accent-cyan/50 focus:ring-2 focus:ring-accent-cyan/20'
            }`}
          />

          {resetError && (
            <p className="mt-1.5 text-xs text-rose-400">
              {resetError}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={resetLoading}
            className="h-10 px-5 rounded-xl bg-accent-gradient text-base-950 text-sm font-semibold shadow-glow-accent hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-70 flex items-center gap-2"
          >
            {resetLoading && (
              <Loader2 size={15} className="animate-spin" />
            )}
            {resetLoading ? 'Verifying…' : 'Verify OTP'}
          </button>

          <button
            type="button"
            onClick={() => {
              setResetStep('email');
              setResetOtp('');
              setResetError('');
              setResetSuccess('');
            }}
            className="h-10 px-3 rounded-xl text-sm text-base-400 hover:text-base-100 flex items-center gap-1.5"
          >
            <ArrowLeft size={14} />
            Back
          </button>
        </div>
      </form>
    )}

    {resetStep === 'password' && (
      <form onSubmit={handleResetPassword} className="space-y-4">
        <ResetHeader
          icon={<KeyRound size={18} />}
          title="Create a new password"
          description="Choose a strong password with at least 8 characters."
        />

        {resetSuccess && (
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-3 text-xs text-emerald-400">
            {resetSuccess}
          </div>
        )}

        <PwField
          label="New password"
          value={resetPassword}
          onChange={(e) => {
            setResetPassword(e.target.value);
            setResetError('');
          }}
          visible={resetShowPassword}
          onToggleVisible={() =>
            setResetShowPassword((v) => !v)
          }
        />

        <PwField
          label="Confirm new password"
          value={resetConfirm}
          onChange={(e) => {
            setResetConfirm(e.target.value);
            setResetError('');
          }}
          visible={resetShowConfirm}
          onToggleVisible={() =>
            setResetShowConfirm((v) => !v)
          }
        />

        {resetError && (
          <p className="text-xs text-rose-400">
            {resetError}
          </p>
        )}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={resetLoading}
            className="h-10 px-5 rounded-xl bg-accent-gradient text-base-950 text-sm font-semibold shadow-glow-accent hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-70 flex items-center gap-2"
          >
            {resetLoading && (
              <Loader2 size={15} className="animate-spin" />
            )}
            {resetLoading ? 'Resetting…' : 'Reset password'}
          </button>
        </div>
      </form>
    )}

    {resetStep === 'success' && (
      <div className="flex flex-col items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 grid place-items-center">
          <Check size={24} className="text-emerald-400" />
        </div>

        <div>
          <h3 className="text-sm font-semibold text-base-100">
            Password reset successfully
          </h3>

          <p className="text-xs text-base-400 mt-1">
            Your new password is now active. You can use it the next time
            you sign in.
          </p>
        </div>

        <button
          type="button"
          onClick={cancelResetPassword}
          className="h-10 px-5 rounded-xl bg-accent-gradient text-base-950 text-sm font-semibold shadow-glow-accent hover:brightness-110 transition-all"
        >
          Done
        </button>
      </div>
    )}
  </div>
          
          <CardHeader title="Two-factor authentication" />
          <SettingRow
            label="Authenticator app 2FA"
            description={twoFA ? 'Enabled — your account is protected with an extra step' : 'Add an extra layer of security to your account'}
            control={<Toggle checked={twoFA} onChange={handleToggle2FA} />}
          />
          {twoFAStep === 'setup' && (
            <div className="px-5 sm:px-6 pb-5 animate-fade-in">
              <Divider />
              <div className="pt-4 flex flex-col sm:flex-row gap-4 items-start">
                <div className="w-32 h-32 shrink-0 rounded-xl bg-base-800 border border-base-600 grid place-items-center mx-auto sm:mx-0">
                  <QrCode size={64} className="text-base-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-base-400 leading-relaxed">
                    Scan this QR code with your authenticator app (like Google Authenticator or Authy), then enter the 6-digit code it generates.
                  </p>
                  <div className="flex items-center gap-2 mt-3">
                    <input
                      value={code}
                      onChange={(e) => {
                        setCode(e.target.value.replace(/\D/g, '').slice(0, 6));
                        setCodeError('');
                      }}
                      placeholder="000000"
                      className={`w-32 h-10 px-3 rounded-xl bg-base-900/60 border text-sm tracking-[0.3em] text-base-100 outline-none transition-all ${
                        codeError ? 'border-rose-500/60' : 'border-base-600/80 focus:border-accent-cyan/50 focus:ring-2 focus:ring-accent-cyan/20'
                      }`}
                    />
                    <button
                      onClick={handleVerifyCode}
                      className="h-10 px-4 rounded-xl bg-accent-gradient text-base-950 text-sm font-semibold hover:brightness-110 active:scale-[0.98] transition-all"
                    >
                      Verify
                    </button>
                  </div>
                  {codeError && <p className="mt-1.5 text-xs text-rose-400">{codeError}</p>}
                </div>
              </div>
            </div>
          )}
        </Card>

        
<Card>
  <CardHeader
    title="Active sessions"
    description="Devices currently signed in to your account."
  />

  <div className="px-2 sm:px-3 pb-3 pt-2 space-y-1">
    {sessionsLoading ? (
      <p className="px-3 py-6 text-center text-sm text-base-400">
        Loading sessions...
      </p>
    ) : sessionsError ? (
      <p className="px-3 py-6 text-center text-sm text-rose-400">
        {sessionsError}
      </p>
    ) : sessions.length === 0 ? (
      <p className="px-3 py-6 text-center text-sm text-base-400">
        No active sessions found.
      </p>
    ) : (
      sessions.map((s) => {
        const Icon = DEVICE_ICONS[s.device] || Laptop;

        return (
          <div
            key={s.id}
            className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-base-800/50 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-base-800 border border-base-700 grid place-items-center shrink-0">
              <Icon size={17} className="text-base-300" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-base-100 truncate">
                  {s.browser} on {s.os}
                </p>

                {s.current && (
                  <span className="shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400">
                    This device
                  </span>
                )}
              </div>

              <p className="text-xs text-base-400 truncate">
                {s.device} · {s.ipAddress || "IP unavailable"} · Last active{" "}
                {formatLastActive(s.lastActiveAt)}
              </p>

              <p className="text-xs text-base-500 mt-1">
                Login:{" "}
                {s.loginAt
                  ? new Date(s.loginAt).toLocaleString()
                  : "Unknown"}
              </p>
            </div>

            {!s.current && (
              <button
                onClick={() => {
                  setRevokeError('');
                  setRevokeTarget(s);
                }}
                className="shrink-0 text-xs font-medium text-rose-400 hover:text-rose-300 px-2.5 py-1.5 rounded-lg hover:bg-rose-500/10 transition-colors"
              >
                Revoke
              </button>
            )}
          </div>
        );
      })
    )}
  </div>
</Card>
      </div>

      <ConfirmModal
        open={!!revokeTarget}
        title="Revoke this session?"
        description={revokeTarget ? `${revokeTarget.device} will be signed out immediately.` : ''}
        error={revokeError}
        confirmLabel="Revoke session"
        loading={revoking}
        onConfirm={confirmRevoke}
        onCancel={() => {
          setRevokeTarget(null);
          setRevokeError('');
        }}
      />
    </div>
  );
}

function ResetHeader({ icon, title, description }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-10 h-10 rounded-xl bg-accent-cyan/10 border border-accent-cyan/20 grid place-items-center shrink-0 text-accent-cyan">
        {icon}
      </div>

      <div>
        <h3 className="text-sm font-semibold text-base-100">
          {title}
        </h3>

        <p className="text-xs text-base-400 mt-1 leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}

function PwField({ label, error, visible, onToggleVisible, ...rest }) {
  return (
    <div>
      <label className="block text-xs font-medium text-base-300 mb-1.5">{label}</label>
      <div className="relative">
        <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base-400" />
        <input
          type={visible ? 'text' : 'password'}
          {...rest}
          className={`w-full h-11 pl-10 pr-10 rounded-xl bg-base-800/60 border text-sm text-base-100 placeholder:text-base-500 outline-none transition-all ${
            error ? 'border-rose-500/60' : 'border-base-600/80 focus:border-accent-cyan/50 focus:ring-2 focus:ring-accent-cyan/20'
          }`}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={onToggleVisible}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 w-7 h-7 grid place-items-center rounded-lg text-base-400 hover:text-base-100 hover:bg-base-700"
        >
          {visible ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
      {error && <p className="mt-1.5 text-xs text-rose-400">{error}</p>}
    </div>
  );
}
