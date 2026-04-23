import { useCallback, useEffect, useMemo, useState } from 'react';
import { API_BASE_URL } from '../../config/api';
import { useAuth } from '../../context/AuthContext';
import '../../styles/recruiter-feedback.css';

const FB_EDIT_DAYS = 30;

const RATING_HINTS = {
  0: 'Tap to rate',
  1: '1/5 - Poor',
  2: '2/5 - Fair',
  3: '3/5 - Good',
  4: '4/5 - Great',
  5: '5/5 - Excellent',
};

const getDaysPassed = (dateValue) => {
  if (!dateValue) return 0;
  const createdAt = new Date(dateValue).getTime();
  if (Number.isNaN(createdAt)) return 0;
  return Math.floor((Date.now() - createdAt) / 86400000);
};

const renderStars = (rating) =>
  Array.from({ length: 5 }, (_, idx) => (
    <span key={`locked-star-${idx}`} className={idx < rating ? 'text-amber-500' : 'text-slate-300'}>
      ★
    </span>
  ));

const RecruiterFeedback = () => {
  const { getAuthHeaders } = useAuth();

  const [view, setView] = useState('loading');
  const [existingFeedbackId, setExistingFeedbackId] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [daysLeft, setDaysLeft] = useState(FB_EDIT_DAYS);

  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [rating, setRating] = useState(0);

  const [lockedFeedback, setLockedFeedback] = useState(null);

  const [inlineAlert, setInlineAlert] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);

  const [modal, setModal] = useState({
    open: false,
    type: 'success',
    title: '',
    message: '',
  });

  const charWarn = message.length > 450;

  const cardTitle = isEditMode ? 'Edit Your Feedback' : 'Feedback Form';
  const submitText = submitLoading
    ? isEditMode
      ? 'Updating...'
      : 'Submitting...'
    : isEditMode
      ? 'Update Feedback'
      : 'Submit Feedback';

  const starHint = useMemo(() => RATING_HINTS[rating] || RATING_HINTS[0], [rating]);

  const clearForm = () => {
    setSubject('');
    setMessage('');
    setRating(0);
  };

  const showModal = useCallback((type, title, msg) => {
    setModal({
      open: true,
      type,
      title,
      message: msg,
    });
  }, []);

  const hideModal = useCallback(() => {
    setModal((prev) => ({ ...prev, open: false }));
  }, []);

  const showFreshForm = useCallback(() => {
    setView('form');
    setExistingFeedbackId(null);
    setIsEditMode(false);
    setDaysLeft(FB_EDIT_DAYS);
    clearForm();
  }, []);

  const showEditForm = useCallback((feedback, leftDays) => {
    setView('form');
    setIsEditMode(true);
    setSubject(feedback?.subject || '');
    setMessage(feedback?.message || '');
    setRating(feedback?.rating || 0);
    setDaysLeft(leftDays);
  }, []);

  const showLockedState = useCallback((feedback, passedDays) => {
    setLockedFeedback({
      ...feedback,
      passedDays,
    });
    setView('locked');
  }, []);

  const loadFeedbackState = useCallback(async () => {
    setView('loading');
    setInlineAlert('');

    try {
      const res = await fetch(`${API_BASE_URL}/feedback/myfeedback`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (res.status === 404 || res.status === 204) {
        showFreshForm();
        return;
      }

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      const existing = Array.isArray(data) ? data[0] : data;

      if (!existing || !existing.feedbackId) {
        showFreshForm();
        return;
      }

      setExistingFeedbackId(existing.feedbackId);

      const passedDays = getDaysPassed(existing.createdAt);
      const leftDays = FB_EDIT_DAYS - passedDays;

      if (leftDays <= 0) {
        showLockedState(existing, passedDays);
      } else {
        showEditForm(existing, leftDays);
      }
    } catch (error) {
      console.warn('Feedback fetch error:', error);
      showFreshForm();
    }
  }, [getAuthHeaders, showEditForm, showFreshForm, showLockedState]);

  useEffect(() => {
    loadFeedbackState();
  }, [loadFeedbackState]);

  useEffect(() => {
    if (!inlineAlert) return undefined;
    const timer = setTimeout(() => setInlineAlert(''), 4000);
    return () => clearTimeout(timer);
  }, [inlineAlert]);

  useEffect(() => {
    if (!modal.open) return undefined;
    const onEsc = (event) => {
      if (event.key === 'Escape') hideModal();
    };
    document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  }, [modal.open, hideModal]);

  const handleSubmit = async () => {
    const trimmedSubject = subject.trim();
    const trimmedMessage = message.trim();

    if (!trimmedSubject) {
      setInlineAlert('Please enter a subject.');
      return;
    }
    if (!trimmedMessage) {
      setInlineAlert('Please write a message.');
      return;
    }
    if (!rating) {
      setInlineAlert('Please select a star rating.');
      return;
    }

    const payload = {
      subject: trimmedSubject,
      message: trimmedMessage,
      rating,
    };

    setSubmitLoading(true);

    try {
      const isUpdating = isEditMode && existingFeedbackId;
      const endpoint = isUpdating
        ? `${API_BASE_URL}/feedback/update/${existingFeedbackId}`
        : `${API_BASE_URL}/feedback/submit`;
      const method = isUpdating ? 'PUT' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.message || `Server error (${res.status})`);
      }

      const saved = await res.json().catch(() => ({}));
      if (!isUpdating && saved?.feedbackId) {
        setExistingFeedbackId(saved.feedbackId);
      }

      setIsEditMode(true);
      setDaysLeft(FB_EDIT_DAYS);
      setView('success');
      showModal(
        'success',
        'Feedback Received!',
        'Thank you! Your feedback helps us make RojgarShine better for everyone.'
      );
    } catch (error) {
      showModal(
        'error',
        'Submission Failed',
        error?.message || 'Something went wrong. Please try again.'
      );
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="content">
      <div className="mx-auto w-full max-w-3xl">
        <section className="rfb-hero relative overflow-hidden rounded-[14px] bg-gradient-to-br from-[#0b2239] via-[#1a3a5c] to-[#0d4a4a] px-8 py-7 text-white">
          <h4 className="relative m-0 text-[1.3rem] font-extrabold">
            <i className="bi bi-chat-heart-fill mr-2" />
            Share Your Feedback
          </h4>
          <p className="relative mb-0 mt-1 text-[13.5px] text-white/60">
            Tell us about your experience with RojgarShine. Your voice helps us improve the platform for recruiters
            like you.
          </p>
        </section>

        <section className="mt-6 overflow-hidden rounded-[14px] border border-[#e8ecf1] bg-white shadow-[0_4px_20px_rgba(11,34,57,0.08)]">
          <header className="flex items-center gap-2.5 border-b border-slate-100 px-6 py-[18px]">
            <i className={`bi ${isEditMode ? 'bi-pencil-square' : 'bi-chat-square-text'} text-[16px] text-teal-600`} />
            <span className="text-sm font-bold text-slate-900">{cardTitle}</span>
          </header>

          {view === 'loading' && (
            <div className="flex items-center justify-center gap-3 px-5 py-14 text-[13.5px] text-slate-500">
              <span className="inline-block h-4 w-4 rounded-full border-2 border-slate-200 border-t-teal-600 animate-spin" />
              Loading your feedback...
            </div>
          )}

          {view === 'success' && (
            <div className="px-6 py-12 text-center">
              <i className="bi bi-check-circle-fill text-[44px] text-green-500" />
              <h5 className="mb-2 mt-3 text-[1.1rem] font-bold text-slate-900">Thank you for your feedback!</h5>
              <p className="mb-6 text-[13.5px] text-slate-500">
                We really appreciate you taking the time to share your thoughts.
              </p>
              <button
                type="button"
                onClick={loadFeedbackState}
                className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-6 py-2.5 text-[13.5px] font-semibold text-slate-800 transition hover:bg-slate-200"
              >
                <i className="bi bi-pencil-square" />
                Edit My Feedback
              </button>
            </div>
          )}

          {view === 'locked' && lockedFeedback && (
            <div className="px-6 py-11 text-center">
              <i className="bi bi-lock-fill text-[44px] text-slate-400" />
              <h5 className="mb-2 mt-3 text-base font-bold text-slate-900">Feedback Locked</h5>
              <p className="mb-5 text-[13.5px] text-slate-500">
                Your feedback was submitted {lockedFeedback.passedDays} day{lockedFeedback.passedDays !== 1 ? 's' : ''}{' '}
                ago. The {FB_EDIT_DAYS}-day edit window has closed.
              </p>
              <div className="rounded-xl border border-[#e8ecf1] border-l-[3px] border-l-slate-400 bg-slate-50 p-4 text-left">
                <div className="mb-1.5 text-sm font-bold text-slate-900">{lockedFeedback.subject || '-'}</div>
                <div className="mb-2.5 flex items-center gap-2 text-base">
                  {renderStars(lockedFeedback.rating || 0)}
                  <strong className="text-sm text-slate-800">{lockedFeedback.rating || 0}/5</strong>
                </div>
                <div className="whitespace-pre-wrap text-[13.5px] leading-relaxed text-slate-500">
                  {lockedFeedback.message || '-'}
                </div>
              </div>
            </div>
          )}

          {view === 'form' && (
            <div className="px-6 py-6">
              {isEditMode && (
                <div className="mb-4 flex items-start gap-2.5 rounded-[10px] border border-teal-200 bg-teal-50 px-3.5 py-3">
                  <i className="bi bi-info-circle-fill mt-0.5 text-[15px] text-teal-600" />
                  <div>
                    <strong className="block text-[13px] text-teal-700">Editing your feedback</strong>
                    <span className="text-xs text-slate-500">
                      {daysLeft} day{daysLeft !== 1 ? 's' : ''} left to edit
                    </span>
                  </div>
                </div>
              )}

              {!!inlineAlert && (
                <div className="rfb-alert-in mb-4 flex items-center gap-2 rounded-[10px] border border-red-200 bg-red-50 px-4 py-3 text-[13.5px] font-medium text-red-600">
                  <i className="bi bi-exclamation-circle-fill" />
                  <span>{inlineAlert}</span>
                </div>
              )}

              <div className="mb-[18px]">
                <label htmlFor="rfb_subject" className="mb-2 block text-[11px] font-bold uppercase tracking-[0.9px] text-slate-400">
                  Subject
                </label>
                <input
                  id="rfb_subject"
                  type="text"
                  value={subject}
                  maxLength={100}
                  onChange={(event) => setSubject(event.target.value)}
                  placeholder="e.g. Great candidate discovery tools"
                  className="w-full rounded-[10px] border-[1.5px] border-[#e8ecf1] px-4 py-[11px] text-sm text-slate-900 outline-none transition focus:border-teal-600 focus:shadow-[0_0_0_3px_rgba(13,148,136,0.1)]"
                />
              </div>

              <div className="mb-[18px]">
                <label htmlFor="rfb_message" className="mb-2 block text-[11px] font-bold uppercase tracking-[0.9px] text-slate-400">
                  Message
                </label>
                <textarea
                  id="rfb_message"
                  value={message}
                  maxLength={500}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="Share your thoughts, suggestions, or experience as a recruiter..."
                  className="min-h-[108px] w-full resize-y rounded-[10px] border-[1.5px] border-[#e8ecf1] px-4 py-[11px] text-sm text-slate-900 outline-none transition focus:border-teal-600 focus:shadow-[0_0_0_3px_rgba(13,148,136,0.1)]"
                />
                <div className={`mt-1 text-right text-[11.5px] ${charWarn ? 'text-amber-500' : 'text-slate-400'}`}>
                  {message.length} / 500
                </div>
              </div>

              <div className="mb-[18px]">
                <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.9px] text-slate-400">Overall Rating</label>
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }, (_, idx) => {
                    const value = idx + 1;
                    const lit = value <= rating;
                    return (
                      <button
                        key={`rate-${value}`}
                        type="button"
                        onClick={() => setRating(value)}
                        className={`rfb-star-btn text-[28px] leading-none ${lit ? 'is-lit' : ''}`}
                        aria-label={`Rate ${value} star${value !== 1 ? 's' : ''}`}
                      >
                        ★
                      </button>
                    );
                  })}
                  <span className="ml-1.5 text-xs text-slate-400">{starHint}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitLoading}
                className={`inline-flex items-center gap-2 rounded-full px-7 py-3 text-sm font-semibold text-white transition ${
                  submitLoading
                    ? 'cursor-not-allowed bg-teal-700/60'
                    : 'bg-teal-600 hover:-translate-y-0.5 hover:bg-teal-700'
                }`}
              >
                <i className={`bi ${isEditMode ? 'bi-floppy-fill' : 'bi-send-fill'}`} />
                <span>{submitText}</span>
                {submitLoading && (
                  <span className="inline-block h-[15px] w-[15px] rounded-full border-2 border-white/35 border-t-white animate-spin" />
                )}
              </button>
            </div>
          )}
        </section>
      </div>

      {modal.open && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-[rgba(9,29,51,0.55)] p-5 backdrop-blur-[4px]"
          onClick={(event) => {
            if (event.target === event.currentTarget) hideModal();
          }}
          role="presentation"
        >
          <div className="rfb-modal-in w-full max-w-[420px] rounded-[20px] bg-white px-10 pb-9 pt-11 text-center shadow-[0_32px_80px_rgba(9,29,51,0.22)]">
            <div
              className={`mx-auto mb-[22px] flex h-[68px] w-[68px] items-center justify-center rounded-full text-[1.7rem] ${
                modal.type === 'success' ? 'bg-teal-50 text-teal-600' : 'bg-red-50 text-red-500'
              }`}
            >
              <i className={`bi ${modal.type === 'success' ? 'bi-check-lg' : 'bi-exclamation-triangle'}`} />
            </div>
            <h5 className="mb-2.5 text-[1.25rem] font-bold text-[#0b2239]">{modal.title}</h5>
            <p className="mb-7 text-[0.9rem] leading-[1.7] text-slate-500">{modal.message}</p>
            <button
              type="button"
              onClick={hideModal}
              className={`inline-flex items-center gap-2 rounded-full px-7 py-3 text-[0.88rem] font-bold text-white transition ${
                modal.type === 'success' ? 'bg-teal-600 hover:bg-teal-700' : 'bg-red-500 hover:bg-red-600'
              }`}
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecruiterFeedback;
