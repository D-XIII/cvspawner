'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { motion } from 'framer-motion'
import { FileText, Briefcase, GraduationCap, Wrench, User, Sparkles, Send, LogOut } from 'lucide-react'

const navItems = [
  { href: '/', label: 'Home', icon: Sparkles },
  { href: '/profile', label: 'Profile', icon: User },
  { href: '/experiences', label: 'Experiences', icon: Briefcase },
  { href: '/formations', label: 'Formations', icon: GraduationCap },
  { href: '/skills', label: 'Skills', icon: Wrench },
  { href: '/applications', label: 'Applications', icon: Send },
  { href: '/generator', label: 'Generate CV', icon: FileText },
]

export default function Navbar() {
  const pathname = usePathname()
  const { data: session } = useSession()

  const visibleNavItems = session ? navItems : navItems.filter(item => item.href === '/')

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold gradient-text">CVSpawner</span>
          </Link>

          {session && (
            <div className="hidden md:flex items-center gap-1">
              {visibleNavItems.map((item) => {
                const isActive = pathname === item.href
                const Icon = item.icon

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2
                      ${isActive
                        ? 'text-foreground'
                        : 'text-muted hover:text-foreground hover:bg-card'
                      }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                    {isActive && (
                      <motion.div
                        layoutId="navbar-indicator"
                        className="absolute inset-0 bg-card border border-border rounded-lg -z-10"
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                  </Link>
                )
              })}
            </div>
          )}

          {/* User menu / Auth buttons */}
          <div className="flex items-center gap-3">
            {session?.user ? (
              <>
                <span className="hidden md:block text-sm text-muted">
                  {session.user.name || session.user.email}
                </span>
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="p-2 text-muted hover:text-foreground hover:bg-card rounded-lg transition-colors"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/signin"
                  className="text-sm text-muted hover:text-foreground transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/signup"
                  className="px-4 py-2 bg-primary hover:bg-primary-hover rounded-lg text-white text-sm font-medium transition-colors"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile navigation - only when authenticated */}
      {session && (
        <div className="md:hidden border-t border-border bg-background/95 backdrop-blur-lg">
          <div className="flex overflow-x-auto py-2 px-4 gap-2 no-scrollbar">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-colors
                    ${isActive
                      ? 'bg-card text-foreground border border-border'
                      : 'text-muted hover:text-foreground'
                    }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </motion.nav>
  )
}
