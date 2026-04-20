import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { API_BASE_URL } from '../config/api';

const PAGE_SIZE = 9;
const STAR_CHAR = '\u2605';

const ROLE_OPTIONS = [
	{ label: 'All', value: '', icon: 'bi-grid-fill' },
	{ label: 'Job Seekers', value: 'JOB_SEEKER', icon: 'bi-person-fill' },
	{ label: 'Recruiters', value: 'RECRUITER', icon: 'bi-building-fill' },
];

const RATING_OPTIONS = [
	{ label: 'Any Rating', value: '' },
	{ label: '5 stars', value: '5' },
	{ label: '4+ stars', value: '4' },
	{ label: '3+ stars', value: '3' },
	{ label: '2+ stars', value: '2' },
];

const formatCount = (value) => {
	const num = Number(value);
	if (!Number.isFinite(num)) return '...';
	return num;
};

const formatAvgRating = (value) => {
	if (value === null || value === undefined || value === '') return '...';
	return value;
};

const initials = (name) => {
	if (!name) return '?';
	return name
		.trim()
		.split(/\s+/)
		.map((part) => part[0])
		.join('')
		.slice(0, 2)
		.toUpperCase();
};

const timeAgo = (dateStr) => {
	if (!dateStr) return '';
	const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
	if (days <= 0) return 'Today';
	if (days === 1) return 'Yesterday';
	if (days < 30) return `${days}d ago`;
	if (days < 365) return `${Math.floor(days / 30)}mo ago`;
	return `${Math.floor(days / 365)}y ago`;
};

const formatDate = (dateStr) => {
	if (!dateStr) return '-';
	return new Date(dateStr).toLocaleDateString('en-IN', {
		day: 'numeric',
		month: 'short',
		year: 'numeric',
	});
};

const buildPageRange = (current, total) => {
	const delta = 2;
	const range = [];
	const out = [];
	let last;

	for (let i = 1; i <= total; i += 1) {
		if (i === 1 || i === total || (i >= current - delta && i <= current + delta)) {
			range.push(i);
		}
	}

	range.forEach((page) => {
		if (last) {
			if (page - last === 2) out.push(last + 1);
			else if (page - last !== 1) out.push('...');
		}
		out.push(page);
		last = page;
	});

	return out;
};

const Feedback = () => {
	const [filters, setFilters] = useState({ role: '', rating: '', search: '' });
	const [page, setPage] = useState(1);
	const [items, setItems] = useState([]);
	const [totalPages, setTotalPages] = useState(1);
	const [totalElements, setTotalElements] = useState(0);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [searchInput, setSearchInput] = useState('');
	const searchTimerRef = useRef(null);

	const [heroStats, setHeroStats] = useState({
		total: '...',
		avg: '...',
		seekers: '...',
		recruiters: '...',
	});

	const [modalOpen, setModalOpen] = useState(false);
	const [detailLoading, setDetailLoading] = useState(false);
	const [detailError, setDetailError] = useState('');
	const [detailData, setDetailData] = useState(null);

	const pageRange = useMemo(
		() => buildPageRange(page, totalPages),
		[page, totalPages]
	);

	const closeModal = useCallback(() => {
		setModalOpen(false);
		setDetailLoading(false);
		setDetailError('');
		setDetailData(null);
	}, []);

	const loadFeedback = useCallback(async () => {
		setLoading(true);
		setError('');

		try {
			const params = new URLSearchParams();
			if (filters.role) params.set('role', filters.role);
			if (filters.rating) params.set('rating', filters.rating);
			if (filters.search) params.set('search', filters.search);
			params.set('page', String(page - 1));
			params.set('size', String(PAGE_SIZE));

			const res = await fetch(`${API_BASE_URL}/public/feedback?${params.toString()}`);
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			const data = await res.json();

			let list = [];
			let total = 0;
			let pages = 1;

			if (Array.isArray(data)) {
				list = data;
				total = data.length;
				pages = 1;
			} else {
				list = data.content || [];
				total = data.totalElements ?? list.length;
				pages = data.totalPages ?? 1;
			}

			setItems(list);
			setTotalElements(total);
			setTotalPages(pages);
		} catch (err) {
			setItems([]);
			setTotalElements(0);
			setTotalPages(1);
			setError(err?.message || 'Failed to load reviews');
		} finally {
			setLoading(false);
		}
	}, [filters, page]);

	const loadHeroStats = useCallback(async () => {
		try {
			const [statsRes, feedRes] = await Promise.all([
				fetch(`${API_BASE_URL}/public/feedback-stats/ratings`),
				fetch(`${API_BASE_URL}/public/feedback?page=0&size=1`),
			]);

			if (statsRes.ok) {
				const stats = await statsRes.json();
				setHeroStats((prev) => ({
					...prev,
					avg: formatAvgRating(stats.overallAvgRating),
				}));
			}

			if (feedRes.ok) {
				const data = await feedRes.json();
				setHeroStats((prev) => ({
					...prev,
					total: formatCount(data.totalElements),
				}));
			}

			const [seekerRes, recruiterRes] = await Promise.all([
				fetch(`${API_BASE_URL}/public/feedback?role=JOB_SEEKER&page=0&size=1`),
				fetch(`${API_BASE_URL}/public/feedback?role=RECRUITER&page=0&size=1`),
			]);

			if (seekerRes.ok) {
				const data = await seekerRes.json();
				setHeroStats((prev) => ({
					...prev,
					seekers: formatCount(data.totalElements),
				}));
			}

			if (recruiterRes.ok) {
				const data = await recruiterRes.json();
				setHeroStats((prev) => ({
					...prev,
					recruiters: formatCount(data.totalElements),
				}));
			}
		} catch (err) {
			console.error('Hero stats error:', err);
		}
	}, []);

	useEffect(() => {
		loadFeedback();
	}, [loadFeedback]);

	useEffect(() => {
		loadHeroStats();
	}, [loadHeroStats]);

	useEffect(() => {
		if (searchTimerRef.current) clearTimeout(searchTimerRef.current);

		searchTimerRef.current = setTimeout(() => {
			const trimmed = searchInput.trim();
			setPage(1);
			setFilters((prev) => {
				if (prev.search === trimmed) return prev;
				return { ...prev, search: trimmed };
			});
		}, 300);

		return () => clearTimeout(searchTimerRef.current);
	}, [searchInput]);

	useEffect(() => {
		if (!modalOpen) return undefined;
		const handler = (event) => {
			if (event.key === 'Escape') closeModal();
		};
		document.addEventListener('keydown', handler);
		return () => document.removeEventListener('keydown', handler);
	}, [modalOpen, closeModal]);

	useEffect(() => {
		document.body.style.overflow = modalOpen ? 'hidden' : '';
		return () => {
			document.body.style.overflow = '';
		};
	}, [modalOpen]);

	const handleRoleChange = (role) => {
		setFilters((prev) => ({ ...prev, role }));
		setPage(1);
	};

	const handleRatingChange = (value) => {
		setFilters((prev) => ({ ...prev, rating: value }));
		setPage(1);
	};

	const handlePageChange = (nextPage) => {
		if (nextPage < 1 || nextPage > totalPages) return;
		setPage(nextPage);
		const bodySection = document.querySelector('.fb-body');
		if (bodySection) {
			window.scrollTo({
				top: bodySection.offsetTop - 80,
				behavior: 'smooth',
			});
		}
	};

	const openDetail = async (id) => {
		setModalOpen(true);
		setDetailLoading(true);
		setDetailError('');
		setDetailData(null);

		try {
			const res = await fetch(`${API_BASE_URL}/public/feedback/${id}`);
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			const data = await res.json();
			setDetailData(data);
		} catch (err) {
			setDetailError(err?.message || 'Failed to load review');
		} finally {
			setDetailLoading(false);
		}
	};

	const handleBackdropClick = (event) => {
		if (event.target.id === 'fbModalBackdrop') closeModal();
	};

	const renderStars = (rating, className = '') => {
		const count = Math.max(0, Math.min(5, Math.floor(Number(rating) || 0)));
		return (
			<span className={className}>
				{Array.from({ length: 5 }, (_, idx) => (
					<span
						key={`${className}-${idx}`}
						className={idx < count ? 'star-filled' : 'star-empty'}
					>
						{STAR_CHAR}
					</span>
				))}
			</span>
		);
	};

	const renderAvatar = (img, name, className = 'fb-avatar') => {
		if (img) {
			return (
				<div className={className}>
					<img
						src={img}
						alt={name || ''}
						onError={(event) => {
							event.currentTarget.style.display = 'none';
						}}
					/>
				</div>
			);
		}
		return <div className={className}>{initials(name)}</div>;
	};

	const renderRolePill = (role) => {
		if (role === 'JOB_SEEKER') {
			return (
				<span className="fb-role-pill seeker">
					<i className="bi bi-person-fill"></i> Job Seeker
				</span>
			);
		}
		if (role === 'RECRUITER') {
			return (
				<span className="fb-role-pill recruiter">
					<i className="bi bi-building-fill"></i> Recruiter
				</span>
			);
		}
		return null;
	};

	const renderSkeletons = () =>
		Array.from({ length: PAGE_SIZE }, (_, idx) => (
			<div key={`skel-${idx}`} className="fb-skeleton">
				<div className="fb-skeleton-head">
					<div className="skel fb-skeleton-av"></div>
					<div className="fb-skeleton-lines">
						<div className="skel" style={{ height: '13px', width: '60%' }}></div>
						<div className="skel" style={{ height: '11px', width: '40%' }}></div>
					</div>
				</div>
				<div className="skel" style={{ height: '13px', width: '50%' }}></div>
				<div className="skel" style={{ height: '11px' }}></div>
				<div className="skel" style={{ height: '11px', width: '80%' }}></div>
				<div className="skel" style={{ height: '11px', width: '65%' }}></div>
			</div>
		));

	return (
		<div>
			<section className="fb-hero">
				<div className="container mx-auto px-6 fb-hero-inner">
					<div className="fb-eyebrow">
						<i className="bi bi-chat-heart-fill"></i> Community Reviews
					</div>
					<h1>
						What People Say About <span>RojgarShine</span>
					</h1>
					<p>
						Real experiences from job seekers and recruiters who found success
						on our platform.
					</p>
					<div className="fb-stat-pills">
						<div className="fb-stat-pill">
							<i className="bi bi-chat-dots-fill"></i>
							<strong>{heroStats.total}</strong> total reviews
						</div>
						<div className="fb-stat-pill">
							<i className="bi bi-star-fill"></i>
							<strong>{heroStats.avg}</strong> average rating
						</div>
						<div className="fb-stat-pill">
							<i className="bi bi-people-fill"></i>
							<strong>{heroStats.seekers}</strong> job seekers
						</div>
						<div className="fb-stat-pill">
							<i className="bi bi-building-fill"></i>
							<strong>{heroStats.recruiters}</strong> recruiters
						</div>
					</div>
				</div>
			</section>

			<div className="container mx-auto px-6">
				<div className="fb-filter-card">
					<div className="fb-filter-row">
						<span className="fb-filter-label">Filter by</span>
						<div className="fb-filter-group">
							{ROLE_OPTIONS.map((role) => (
								<button
									key={role.label}
									type="button"
									className={`fb-chip-btn ${filters.role === role.value ? 'active' : ''}`}
									onClick={() => handleRoleChange(role.value)}
								>
									<i className={`bi ${role.icon}`}></i> {role.label}
								</button>
							))}
						</div>
						<div className="fb-divider"></div>
						<select
							className="fb-sort-select"
							value={filters.rating}
							onChange={(event) => handleRatingChange(event.target.value)}
						>
							{RATING_OPTIONS.map((opt) => (
								<option key={opt.value} value={opt.value}>
									{opt.label}
								</option>
							))}
						</select>
						<div className="fb-divider"></div>
						<div className="fb-search">
							<i className="bi bi-search fb-search-icon"></i>
							<input
								type="text"
								className="fb-search-input"
								placeholder="Search name, subject or message..."
								value={searchInput}
								onChange={(event) => setSearchInput(event.target.value)}
							/>
						</div>
						<span className="fb-total-badge">
							Showing <strong>{totalElements}</strong> reviews
						</span>
					</div>
				</div>
			</div>

			<section className="fb-body">
				<div className="container mx-auto px-6">
					<div className="fb-grid">
						{loading && renderSkeletons()}
						{!loading && error && (
							<div className="fb-empty">
								<div className="fb-empty-icon">
									<i className="bi bi-exclamation-circle"></i>
								</div>
								<h5>Failed to load reviews</h5>
								<p>
									Please try refreshing.
									<br />
									<small style={{ color: '#ef4444' }}>{error}</small>
								</p>
							</div>
						)}
						{!loading && !error && items.length === 0 && (
							<div className="fb-empty">
								<div className="fb-empty-icon">
									<i className="bi bi-chat-slash"></i>
								</div>
								<h5>No reviews found</h5>
								<p>Try changing the filters or search term.</p>
							</div>
						)}
						{!loading && !error &&
							items.map((item, idx) => {
								const feedbackId = item.feedbackId ?? item.id ?? idx;
								const isTop =
									idx === 0 &&
									page === 1 &&
									!filters.role &&
									!filters.rating &&
									!filters.search;

								return (
									<div
										key={feedbackId}
										className={`fb-card${isTop ? ' top-rated' : ''}`}
										onClick={() => openDetail(feedbackId)}
										role="button"
										tabIndex={0}
										onKeyDown={(event) => {
											if (event.key === 'Enter') openDetail(feedbackId);
										}}
									>
										<div className="fb-card-head">
											{renderAvatar(item.profileImage, item.fullName)}
											<div className="fb-card-user">
												<strong>{item.fullName || 'Anonymous'}</strong>
												<span>
													{item.companyName ||
														(item.role === 'JOB_SEEKER'
															? 'Job Seeker'
															: item.role === 'RECRUITER'
															? 'Recruiter'
															: '')}
												</span>
											</div>
											{renderRolePill(item.role)}
										</div>
										<div className="fb-stars">{renderStars(item.rating || 0)}</div>
										{item.subject ? (
											<div className="fb-subject">{item.subject}</div>
										) : null}
										<p className="fb-msg-preview">{item.message || '-'}</p>
										<div className="fb-card-footer">
											<span className="fb-date">
												<i className="bi bi-clock"></i> {timeAgo(item.createdAt)}
											</span>
											<button
												type="button"
												className="fb-read-btn"
												onClick={(event) => {
													event.stopPropagation();
													openDetail(feedbackId);
												}}
											>
												Read more <i className="bi bi-arrow-right"></i>
											</button>
										</div>
									</div>
								);
							})}
					</div>
					{totalPages > 1 && (
						<div className="fb-pagination">
							<button
								type="button"
								className="pg-btn"
								disabled={page === 1}
								onClick={() => handlePageChange(page - 1)}
							>
								<i className="bi bi-chevron-left"></i>
							</button>
							<span className="pg-info">
								Page {page} of {totalPages}
							</span>
							{pageRange.map((p, idx) =>
								p === '...' ? (
									<button key={`gap-${idx}`} className="pg-btn" type="button" disabled>
										...
									</button>
								) : (
									<button
										key={`page-${p}`}
										type="button"
										className={`pg-btn${p === page ? ' active' : ''}`}
										onClick={() => handlePageChange(p)}
									>
										{p}
									</button>
								)
							)}
							<button
								type="button"
								className="pg-btn"
								disabled={page >= totalPages}
								onClick={() => handlePageChange(page + 1)}
							>
								<i className="bi bi-chevron-right"></i>
							</button>
						</div>
					)}
				</div>
			</section>

			<div
				id="fbModalBackdrop"
				className={`fb-modal-backdrop${modalOpen ? ' open' : ''}`}
				onClick={handleBackdropClick}
			>
				<div className="fb-modal" role="dialog" aria-modal="true">
					{detailLoading && (
						<div className="fb-modal-loader">
							<div className="spin"></div>
							Loading review...
						</div>
					)}

					{!detailLoading && detailError && (
						<>
							<div className="fb-modal-header">
								<button type="button" className="fb-modal-close" onClick={closeModal}>
									<i className="bi bi-x"></i>
								</button>
								<div className="fb-modal-user">
									<div className="fb-modal-user-name" style={{ color: '#fff' }}>
										Error
									</div>
								</div>
							</div>
							<div className="fb-modal-body">
								<div className="fb-empty">
									<div className="fb-empty-icon">
										<i className="bi bi-exclamation-circle"></i>
									</div>
									<p>
										Failed to load review.
										<br />
										<small style={{ color: '#ef4444' }}>{detailError}</small>
									</p>
								</div>
							</div>
						</>
					)}

					{!detailLoading && !detailError && detailData && (
						<>
							<div className="fb-modal-header">
								<button type="button" className="fb-modal-close" onClick={closeModal}>
									<i className="bi bi-x"></i>
								</button>
								<div className="fb-modal-user">
									{renderAvatar(detailData.profileImage, detailData.fullName, 'fb-modal-av')}
									<div>
										<div className="fb-modal-user-name">
											{detailData.fullName || 'Anonymous'}
										</div>
										<div className="fb-modal-user-meta">
											{renderRolePill(detailData.role)}
											{detailData.companyName ? (
												<span style={{ fontSize: '.72rem', color: 'rgba(255,255,255,.5)' }}>
													<i className="bi bi-building mr-1"></i>
													{detailData.companyName}
												</span>
											) : null}
										</div>
									</div>
								</div>
							</div>
							<div className="fb-modal-body">
								<div className="fb-modal-stars">
									{renderStars(detailData.rating || 0, 'stars-big')}
									<span className="rating-num">{detailData.rating || 0}</span>
									<span className="rating-out">/ 5</span>
								</div>
								{detailData.subject ? (
									<div className="fb-modal-section">
										<div className="fb-modal-section-label">
											<i className="bi bi-tag-fill mr-1"></i>Subject
										</div>
										<div className="fb-modal-section-value">{detailData.subject}</div>
									</div>
								) : null}
								<div className="fb-modal-section">
									<div className="fb-modal-section-label">
										<i className="bi bi-chat-text-fill mr-1"></i>Message
									</div>
									<div className="fb-modal-section-value msg-full">
										{detailData.message || '-'}
									</div>
								</div>
								<div className="fb-modal-divider"></div>
								<div className="fb-modal-meta-row">
									{detailData.email ? (
										<div className="fb-modal-meta-item">
											<i className="bi bi-envelope-fill"></i>
											{detailData.email}
										</div>
									) : null}
									<div className="fb-modal-meta-item">
										<i className="bi bi-calendar-fill"></i>
										{formatDate(detailData.createdAt)}
									</div>
									<div className="fb-modal-meta-item">
										<i className="bi bi-clock-fill"></i>
										{timeAgo(detailData.createdAt)}
									</div>
								</div>
							</div>
						</>
					)}
				</div>
			</div>
		</div>
	);
};

export default Feedback;
