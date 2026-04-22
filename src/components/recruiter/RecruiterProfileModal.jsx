import { useEffect, useMemo, useState } from 'react';
import { API_BASE_URL } from '../../config/api';
import { useAuth } from '../../context/AuthContext';
import RecruiterModal from './RecruiterModal';

const toInitials = (name) => {
  if (!name) return 'R';
  const parts = name.trim().split(' ').filter(Boolean);
  const letters = parts.length > 1 ? parts[0][0] + parts[1][0] : parts[0][0];
  return letters.toUpperCase();
};

const RecruiterProfileModal = ({ open, onClose }) => {
  const { user, getAuthHeaders, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('editProfile');
  const [profile, setProfile] = useState({ username: '', email: '', fullName: '' });
  const [alerts, setAlerts] = useState({ edit: null, change: null, forgot: null });
  const [saving, setSaving] = useState(false);
  const [changing, setChanging] = useState(false);
  const [sending, setSending] = useState(false);

  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const resetAlerts = () => setAlerts({ edit: null, change: null, forgot: null });

  const strength = useMemo(() => {
    if (!newPw) return null;
    const hasLen = newPw.length >= 8;
    const hasUpper = /[A-Z]/.test(newPw);
    const hasNum = /[0-9]/.test(newPw);
    const hasSpecial = /[^A-Za-z0-9]/.test(newPw);
    const score = [hasLen, hasUpper, hasNum, hasSpecial].filter(Boolean).length;
    const level = score <= 2 ? 'weak' : score === 3 ? 'medium' : 'strong';
    return { hasLen, hasUpper, hasNum, hasSpecial, score, level };
  }, [newPw]);

  const strengthLabel = strength
    ? strength.level.charAt(0).toUpperCase() + strength.level.slice(1)
    : '';

  useEffect(() => {
    if (!open) return;
    setActiveTab('editProfile');
    resetAlerts();
    setCurrentPw('');
    setNewPw('');
    setConfirmPw('');
    setShowCurrent(false);
    setShowNew(false);
    setShowConfirm(false);

    const loadProfile = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: getAuthHeaders(),
        });
        if (!res.ok) throw new Error('Failed to load profile.');
        const data = await res.json();
        setProfile({
          username: data.username || data.fullName || user?.username || '',
          email: data.email || user?.email || '',
          fullName: data.fullName || data.username || user?.fullName || '',
        });
      } catch {
        setProfile({
          username: user?.username || user?.fullName || '',
          email: user?.email || '',
          fullName: user?.fullName || user?.username || '',
        });
      }
    };

    loadProfile();
  }, [open, getAuthHeaders, user]);

  const displayName = profile.fullName || profile.username || 'Recruiter';
  const initials = toInitials(displayName);

  const handleSaveProfile = async () => {
    resetAlerts();
    if (!profile.username.trim()) {
      setAlerts((prev) => ({ ...prev, edit: { type: 'error', message: 'Username cannot be empty.' } }));
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/update-profile`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ username: profile.username.trim() }),
      });
      if (!res.ok) throw new Error('Failed to update profile.');

      setAlerts((prev) => ({ ...prev, edit: { type: 'success', message: 'Profile updated successfully!' } }));
      updateUser({ username: profile.username.trim() });
    } catch (error) {
      setAlerts((prev) => ({
        ...prev,
        edit: { type: 'error', message: error.message || 'Update failed.' },
      }));
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    resetAlerts();
    if (!currentPw || !newPw || !confirmPw) {
      setAlerts((prev) => ({ ...prev, change: { type: 'error', message: 'Please fill in all fields.' } }));
      return;
    }
    if (newPw !== confirmPw) {
      setAlerts((prev) => ({ ...prev, change: { type: 'error', message: 'Passwords do not match.' } }));
      return;
    }
    if (newPw.length < 8) {
      setAlerts((prev) => ({ ...prev, change: { type: 'error', message: 'Minimum 8 characters required.' } }));
      return;
    }

    setChanging(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/change-password`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to update password.');
      }

      setAlerts((prev) => ({ ...prev, change: { type: 'success', message: 'Password changed successfully!' } }));
      setCurrentPw('');
      setNewPw('');
      setConfirmPw('');
    } catch (error) {
      setAlerts((prev) => ({
        ...prev,
        change: { type: 'error', message: error.message || 'Failed to update password.' },
      }));
    } finally {
      setChanging(false);
    }
  };

  const handleForgotPassword = async () => {
    resetAlerts();
    if (!profile.email) {
      setAlerts((prev) => ({ ...prev, change: { type: 'error', message: 'Email not found.' } }));
      return;
    }

    setSending(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: profile.email }),
      });
      if (!res.ok) throw new Error('Failed to send reset email.');

      setAlerts((prev) => ({
        ...prev,
        forgot: { type: 'info', message: `Reset link sent to ${profile.email}. Check your inbox.` },
      }));
    } catch (error) {
      setAlerts((prev) => ({
        ...prev,
        change: { type: 'error', message: error.message || 'Failed to send reset email.' },
      }));
    } finally {
      setSending(false);
    }
  };

  return (
    <RecruiterModal open={open} onClose={onClose} labelledBy="recruiter-profile-title">
      <div className="rs-profile-modal-content">
        <div className="rs-pm-header">
          <div className="rs-pm-header-left">
            <div className="rs-pm-big-avatar">{initials}</div>
            <div>
              <p className="rs-pm-header-name" id="recruiter-profile-title">{displayName}</p>
              <p className="rs-pm-header-email">{profile.email || '--'}</p>
              <span className="rs-pm-header-badge">RECRUITER</span>
            </div>
          </div>
          <button className="rs-pm-close-btn" onClick={onClose} type="button" aria-label="Close">
            <i className="bi bi-x" />
          </button>
        </div>

        <div className="rs-pm-tabs">
          <button
            className={`rs-pm-tab ${activeTab === 'editProfile' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('editProfile');
              resetAlerts();
            }}
            type="button"
          >
            <i className="bi bi-pencil-square" /> Edit Profile
          </button>
          <button
            className={`rs-pm-tab ${activeTab === 'changePassword' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('changePassword');
              resetAlerts();
            }}
            type="button"
          >
            <i className="bi bi-shield-lock" /> Change Password
          </button>
        </div>

        {activeTab === 'editProfile' && (
          <div className="rs-pm-body">
            <div className={`rs-pm-alert ${alerts.edit ? alerts.edit.type : 'hidden'}`}>
              <i className={`bi ${alerts.edit?.type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-circle-fill'}`} />
              <span>{alerts.edit?.message}</span>
            </div>

            <div className="rs-pm-form-row">
              <div className="rs-pm-form-group">
                <label className="rs-pm-label">Username</label>
                <input
                  className="rs-pm-input"
                  type="text"
                  value={profile.username}
                  onChange={(event) => setProfile((prev) => ({ ...prev, username: event.target.value }))}
                  placeholder="username"
                />
              </div>
              <div className="rs-pm-form-group">
                <label className="rs-pm-label">Email Address</label>
                <input className="rs-pm-input" type="email" value={profile.email} disabled />
                <p className="rs-pm-helper">
                  <i className="bi bi-lock" style={{ marginRight: 6 }} />Email cannot be changed
                </p>
              </div>
            </div>

            <div className="rs-pm-footer">
              <button className="rs-pm-btn ghost" onClick={onClose} type="button">Cancel</button>
              <button className="rs-pm-btn primary" onClick={handleSaveProfile} type="button" disabled={saving}>
                <span>{saving ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </div>
        )}

        {activeTab === 'changePassword' && (
          <div className="rs-pm-body">
            <div className={`rs-pm-alert ${alerts.change ? alerts.change.type : 'hidden'}`}>
              <i className={`bi ${alerts.change?.type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-circle-fill'}`} />
              <span>{alerts.change?.message}</span>
            </div>

            <div className={`rs-pm-alert ${alerts.forgot ? alerts.forgot.type : 'hidden'}`}>
              <i className="bi bi-envelope-check-fill" />
              <span>{alerts.forgot?.message}</span>
            </div>

            <div className="rs-forgot-card">
              <div className="rs-forgot-card-left">
                <div className="rs-forgot-icon"><i className="bi bi-key-fill" /></div>
                <div>
                  <p>Forgot your password?</p>
                  <small>We will send a reset link to your email.</small>
                </div>
              </div>
              <button
                className="rs-forgot-btn"
                onClick={handleForgotPassword}
                type="button"
                disabled={sending}
              >
                <i className="bi bi-send" />
                <span>{sending ? 'Sending...' : 'Send Link'}</span>
              </button>
            </div>

            <div className="rs-pm-form-group">
              <label className="rs-pm-label">Current Password</label>
              <div className="rs-pm-input-group">
                <input
                  className="rs-pm-input"
                  type={showCurrent ? 'text' : 'password'}
                  value={currentPw}
                  onChange={(event) => setCurrentPw(event.target.value)}
                  placeholder="Current password"
                />
                <button
                  className="rs-pm-eye-btn"
                  onClick={() => setShowCurrent((prev) => !prev)}
                  type="button"
                >
                  <i className={`bi ${showCurrent ? 'bi-eye-slash' : 'bi-eye'}`} />
                </button>
              </div>
            </div>

            <div className="rs-pm-form-group">
              <label className="rs-pm-label">New Password</label>
              <div className="rs-pm-input-group">
                <input
                  className="rs-pm-input"
                  type={showNew ? 'text' : 'password'}
                  value={newPw}
                  onChange={(event) => setNewPw(event.target.value)}
                  placeholder="At least 8 characters"
                />
                <button
                  className="rs-pm-eye-btn"
                  onClick={() => setShowNew((prev) => !prev)}
                  type="button"
                >
                  <i className={`bi ${showNew ? 'bi-eye-slash' : 'bi-eye'}`} />
                </button>
              </div>

              {strength && (
                <div className="rs-pw-strength-wrap">
                  <div className="rs-pw-bars">
                    <div className={`rs-pw-bar ${strength.level === 'weak' || strength.level === 'medium' || strength.level === 'strong' ? strength.level : ''}`} />
                    <div className={`rs-pw-bar ${strength.level === 'medium' || strength.level === 'strong' ? strength.level : ''}`} />
                    <div className={`rs-pw-bar ${strength.level === 'strong' ? strength.level : ''}`} />
                  </div>
                  <span className={`rs-pw-label ${strength.level}`}>{strengthLabel}</span>
                </div>
              )}

              <div className="rs-pw-req">
                <div className="rs-pw-req-title">Password requirements</div>
                <ul className="rs-pw-req-list">
                  <li className={`rs-pw-req-item ${strength?.hasLen ? 'met' : ''}`}>
                    <i className={`bi ${strength?.hasLen ? 'bi-check-circle-fill' : 'bi-circle'}`} /> At least 8 characters
                  </li>
                  <li className={`rs-pw-req-item ${strength?.hasUpper ? 'met' : ''}`}>
                    <i className={`bi ${strength?.hasUpper ? 'bi-check-circle-fill' : 'bi-circle'}`} /> One uppercase letter (A-Z)
                  </li>
                  <li className={`rs-pw-req-item ${strength?.hasNum ? 'met' : ''}`}>
                    <i className={`bi ${strength?.hasNum ? 'bi-check-circle-fill' : 'bi-circle'}`} /> One number (0-9)
                  </li>
                  <li className={`rs-pw-req-item ${strength?.hasSpecial ? 'met' : ''}`}>
                    <i className={`bi ${strength?.hasSpecial ? 'bi-check-circle-fill' : 'bi-circle'}`} /> One special character (!@#$...)
                  </li>
                </ul>
              </div>
            </div>

            <div className="rs-pm-form-group">
              <label className="rs-pm-label">Confirm New Password</label>
              <div className="rs-pm-input-group">
                <input
                  className="rs-pm-input"
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPw}
                  onChange={(event) => setConfirmPw(event.target.value)}
                  placeholder="Re-enter new password"
                />
                <button
                  className="rs-pm-eye-btn"
                  onClick={() => setShowConfirm((prev) => !prev)}
                  type="button"
                >
                  <i className={`bi ${showConfirm ? 'bi-eye-slash' : 'bi-eye'}`} />
                </button>
              </div>
            </div>

            <div className="rs-pm-footer">
              <button className="rs-pm-btn ghost" onClick={onClose} type="button">Cancel</button>
              <button
                className="rs-pm-btn primary"
                onClick={handleChangePassword}
                type="button"
                disabled={changing}
              >
                <span>{changing ? 'Updating...' : 'Update Password'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </RecruiterModal>
  );
};

export default RecruiterProfileModal;
