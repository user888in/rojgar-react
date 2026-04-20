import { useCallback, useEffect, useMemo, useState } from 'react'
import BlogFilterBar from '../components/blog/BlogFilterBar'
import BlogHero from '../components/blog/BlogHero'
import BlogMain from '../components/blog/BlogMain'
import { API_BASE_URL } from '../config/api'

const Blog = () => {
  const [allPosts, setAllPosts] = useState([])
  const [filteredPosts, setFilteredPosts] = useState([])
  const [categories, setCategories] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [currentCat, setCurrentCat] = useState('all')
  const [currentCatId, setCurrentCatId] = useState(null)
  const [currentSort, setCurrentSort] = useState('newest')
  const [totalPages, setTotalPages] = useState(1)
  const [totalElements, setTotalElements] = useState(0)
  const [displayTotal, setDisplayTotal] = useState(0)
  const [displayPages, setDisplayPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const PER_PAGE = 6

  const categoryCount = useMemo(() => categories.length, [categories])

  const applyLocalFilters = useCallback(
    ({ page, query, catId } = {}) => {
      const nextPage = page ?? currentPage
      const nextQuery = query ?? searchQuery
      const nextCatId = catId ?? currentCatId

      let posts = [...allPosts]

      if (nextCatId !== null) {
        posts = posts.filter(
          (post) => String(post.categoryId) === String(nextCatId)
        )
      }

      if (nextQuery) {
        const q = nextQuery.toLowerCase()
        posts = posts.filter(
          (post) =>
            (post.title || '').toLowerCase().includes(q) ||
            (post.description || '').toLowerCase().includes(q) ||
            (post.categoryName || '').toLowerCase().includes(q)
        )
      }

      if (nextQuery || nextCatId !== null) {
        const total = posts.length
        const pages = Math.ceil(total / PER_PAGE) || 1
        const start = (nextPage - 1) * PER_PAGE
        setFilteredPosts(posts.slice(start, start + PER_PAGE))
        setDisplayTotal(total)
        setDisplayPages(pages)
        return
      }

      setFilteredPosts(posts)
      setDisplayTotal(totalElements)
      setDisplayPages(totalPages)
    },
    [allPosts, currentPage, searchQuery, currentCatId, totalElements, totalPages]
  )

  const runSearch = () => {
    setCurrentPage(1)
    applyLocalFilters({ page: 1, query: searchQuery })
  }

  const handleCategoryChange = (catId) => {
    const nextCat = String(catId)
    const nextCatId = catId === 'all' ? null : catId
    setCurrentCat(nextCat)
    setCurrentCatId(nextCatId)
    setCurrentPage(1)
    setSearchQuery('')
    applyLocalFilters({ page: 1, query: '', catId: nextCatId })
  }

  const handleSortChange = (sort) => {
    setCurrentSort(sort)
    setCurrentPage(1)
  }

  const handlePageChange = (page) => {
    if (page < 1 || page > displayPages) return
    setCurrentPage(page)
  }

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/public/blog-categories`)
        if (!res.ok) throw new Error('Failed to load categories')
        const data = await res.json()
        setCategories(Array.isArray(data) ? data : [])
      } catch {
        setCategories([])
      }
    }

    loadCategories()
  }, [])

  useEffect(() => {
    const loadPosts = async () => {
      setLoading(true)
      let url = `${API_BASE_URL}/public/blogs?page=${currentPage - 1}&size=${PER_PAGE}&sort=createdAt,${currentSort === 'newest' ? 'desc' : 'asc'}`
      if (currentCatId) url += `&categoryId=${currentCatId}`

      try {
        const res = await fetch(url)
        if (!res.ok) throw new Error('Failed to load posts')
        const data = await res.json()
        if (data.content !== undefined) {
          const published = data.content.filter((post) => post.status === 'PUBLISHED')
          setAllPosts(published)
          setTotalPages(data.totalPages || 1)
          setTotalElements(data.totalElements || published.length)
        } else {
          const list = (Array.isArray(data) ? data : []).filter(
            (post) => post.status === 'PUBLISHED'
          )
          setAllPosts(list)
          setTotalPages(1)
          setTotalElements(list.length)
        }
      } catch {
        setAllPosts([])
        setTotalPages(1)
        setTotalElements(0)
      } finally {
        setLoading(false)
      }
    }

    loadPosts()
  }, [currentPage, currentSort, currentCatId])

  useEffect(() => {
    applyLocalFilters()
  }, [applyLocalFilters])

  useEffect(() => {
    const nodes = document.querySelectorAll('.fade-up')
    if (!nodes.length) return
    if (!('IntersectionObserver' in window)) {
      nodes.forEach((node) => node.classList.add('visible'))
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.08 }
    )

    nodes.forEach((node) => observer.observe(node))
    return () => observer.disconnect()
  }, [filteredPosts, loading])

  return (
    <div>
      <BlogHero
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        onSearch={runSearch}
        articleCount={totalElements}
        categoryCount={categoryCount}
      />
      <BlogFilterBar
        categories={categories}
        currentCat={currentCat}
        currentSort={currentSort}
        onCategoryChange={handleCategoryChange}
        onSortChange={handleSortChange}
      />
      <BlogMain
        loading={loading}
        posts={filteredPosts}
        articleCount={displayTotal}
        currentPage={currentPage}
        totalPages={displayPages}
        showFeatured={currentPage === 1 && filteredPosts.length > 0}
        featuredPost={filteredPosts[0]}
        onPageChange={handlePageChange}
        trendingPosts={allPosts}
        categories={categories}
        currentCat={currentCat}
        onCategoryChange={handleCategoryChange}
      />
    </div>
  )
}

export default Blog
