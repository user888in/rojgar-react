import { useEffect, useMemo, useRef, useState } from 'react';
import { API_BASE_URL } from '../../config/api';
import { useAuth } from '../../context/AuthContext';
import RecruiterModal from './RecruiterModal';

const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];

const RecruiterCompanyModal = ({ open, onClose }) => {
  const { getAuthHeaders } = useAuth();
  const fileInputRef = useRef(null);

  const [company, setCompany] = useState({
    name: '--',
    description: '',
    logoUrl: null,
  });
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [fileName, setFileName] = useState('Click to upload logo');
  const [alert, setAlert] = useState(null);
  const [saving, setSaving] = useState(false);

  const descCount = company.description.length;
  const descCounterClass = useMemo(() => {
    if (descCount >= 900) return 'rs-co-char-counter over';
    if (descCount >= 765) return 'rs-co-char-counter warn';
    return 'rs-co-char-counter';
  }, [descCount]);

  useEffect(() => {
    if (!open) return;

    const loadCompany = async () => {
      setAlert(null);
      setLogoFile(null);
      setLogoPreview(null);
      setFileName('Click to upload logo');
      if (fileInputRef.current) fileInputRef.current.value = '';

      try {
        const res = await fetch(`${API_BASE_URL}/auth/recruiter/my-company`, {
          headers: getAuthHeaders(),
        });
        if (!res.ok) throw new Error('Failed to load company data.');
        const data = await res.json();
        setCompany({
          name: data.companyName || '--',
          description: data.description || '',
          logoUrl: data.companyLogo || null,
        });
        setFileName(data.companyLogo ? 'Current logo - click to replace' : 'Click to upload logo');
      } catch (error) {
        setAlert({ type: 'error', message: 'Could not load company data. Please try again.' });
      }
    };

    loadCompany();
  }, [open, getAuthHeaders]);

  const handleLogoChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      setAlert({ type: 'error', message: 'Invalid file type. Please use PNG, JPG, WEBP or SVG.' });
      event.target.value = '';
      return;
    }

    if (file.size > MAX_BYTES) {
      setAlert({ type: 'error', message: 'File too large. Maximum size is 2 MB.' });
      event.target.value = '';
      return;
    }

    setLogoFile(file);
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      setLogoPreview(e.target?.result || null);
      setAlert(null);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setAlert(null);
    setSaving(true);

    try {
      const formData = new FormData();
      formData.append(
        'data',
        new Blob([JSON.stringify({ description: company.description.trim() })], {
          type: 'application/json',
        }),
        'data.json'
      );

      if (logoFile) {
        formData.append('logo', logoFile);
      }

      const headers = getAuthHeaders();
      delete headers['Content-Type'];

      const res = await fetch(`${API_BASE_URL}/auth/recruiter/my-company`, {
        method: 'PUT',
        headers,
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to update company info.');
      }

      const data = await res.json().catch(() => null);
      if (data?.companyLogo) {
        setCompany((prev) => ({ ...prev, logoUrl: data.companyLogo }));
        setLogoPreview(null);
        setLogoFile(null);
        setFileName('Current logo - click to replace');
      }

      setAlert({ type: 'success', message: 'Company profile updated successfully!' });
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      setAlert({ type: 'error', message: error.message || 'Failed to update company info.' });
    } finally {
      setSaving(false);
    }
  };

  const logoSrc = logoPreview || company.logoUrl;

  return (
    <RecruiterModal open={open} onClose={onClose} labelledBy="recruiter-company-title">
      <div className="rs-profile-modal-content">
        <div className="rs-pm-header">
          <div className="rs-pm-header-left">
            <div className="rs-co-modal-logo">
              {logoSrc ? <img src={logoSrc} alt="Logo" /> : <i className="bi bi-building" />}
            </div>
            <div>
              <p className="rs-pm-header-name" id="recruiter-company-title">{company.name || 'My Company'}</p>
              <span className="rs-pm-header-badge">
                <i className="bi bi-building" style={{ marginRight: 4 }} />COMPANY
              </span>
            </div>
          </div>
          <button className="rs-pm-close-btn" onClick={onClose} type="button" aria-label="Close">
            <i className="bi bi-x" />
          </button>
        </div>

        <div className="rs-pm-body">
          <div className={`rs-pm-alert ${alert ? alert.type : 'hidden'}`}>
            <i className={`bi ${alert?.type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-circle-fill'}`} />
            <span>{alert?.message}</span>
          </div>

          <div className="rs-pm-form-group">
            <label className="rs-pm-label">Company Logo</label>
            <div className="rs-co-logo-zone">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                onChange={handleLogoChange}
              />
              <div className="rs-co-logo-preview">
                {logoSrc ? <img src={logoSrc} alt="Preview" /> : <i className="bi bi-building" />}
              </div>
              <div className="rs-co-logo-info">
                <p>{fileName}</p>
                <small>PNG, JPG, WEBP or SVG - Max 2 MB - Recommended 200x200 px</small>
              </div>
              <div className="rs-co-logo-upload-btn">
                <i className="bi bi-upload" /> Upload
              </div>
            </div>
          </div>

          <div className="rs-pm-form-group">
            <label className="rs-pm-label">Company Name</label>
            <div className="rs-co-locked-field">
              <div className="rs-co-lock-icon"><i className="bi bi-lock-fill" /></div>
              <span>{company.name || '--'}</span>
              <span className="rs-co-lock-badge"><i className="bi bi-shield-check" /> Fixed</span>
            </div>
            <p className="rs-pm-helper">
              <i className="bi bi-info-circle" style={{ marginRight: 6 }} />Company name is set during registration and cannot be changed.
            </p>
          </div>

          <div className="rs-pm-form-group">
            <label className="rs-pm-label">Company Description</label>
            <textarea
              className="rs-pm-textarea"
              value={company.description}
              onChange={(event) => setCompany((prev) => ({ ...prev, description: event.target.value }))}
              placeholder="Tell candidates about your company, culture, and mission..."
              maxLength={900}
            />
            <div className={descCounterClass}>{descCount} / 900</div>
          </div>

          <div className="rs-pm-footer">
            <button className="rs-pm-btn ghost" onClick={onClose} type="button">Cancel</button>
            <button className="rs-pm-btn primary" onClick={handleSave} type="button" disabled={saving}>
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </div>
      </div>
    </RecruiterModal>
  );
};

export default RecruiterCompanyModal;
