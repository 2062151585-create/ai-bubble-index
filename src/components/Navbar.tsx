import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router'
import { cn } from '@/lib/utils'

const navLinks = [
  { path: '/', label: '首页仪表盘' },
  { path: '/index-detail', label: '指数详情' },
  { path: '/history', label: '历史数据' },
  { path: '/scenarios', label: '情景预测' },
  { path: '/advisory', label: '投资建议' },
  { path: '/about', label: '关于方法论' },
]

export default function Navbar() {
  const location = useLocation()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <nav
      className={cn(
        'fixed top-0 left-0 right-0 z-50 h-16 flex items-center transition-all duration-300',
        scrolled ? 'glass-navbar' : 'bg-transparent'
      )}
    >
      <div className="w-full max-w-[1400px] mx-auto px-4 md:px-6 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <span className="font-display text-xl font-bold text-text-primary tracking-tight">
            AI-BWI
          </span>
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-warning-amber opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-warning-amber" />
          </span>
        </Link>

        {/* Nav Links */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={cn(
                'nav-link-indicator px-3 py-2 text-sm font-medium transition-colors duration-200',
                location.pathname === link.path
                  ? 'text-cyan-accent'
                  : 'text-text-secondary hover:text-text-primary'
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Mobile menu button */}
        <MobileMenu />
      </div>
    </nav>
  )
}

function MobileMenu() {
  const [open, setOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    setOpen(false)
  }, [location.pathname])

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen(!open)}
        className="p-2 text-text-secondary hover:text-text-primary"
        aria-label="Toggle menu"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {open ? (
            <>
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </>
          ) : (
            <>
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </>
          )}
        </svg>
      </button>

      {open && (
        <div className="absolute top-16 left-0 right-0 glass-navbar border-t border-white/5 py-4 px-4">
          <div className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={cn(
                  'px-4 py-3 text-sm font-medium rounded-lg transition-colors',
                  location.pathname === link.path
                    ? 'text-cyan-accent bg-cyan-accent/10'
                    : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
