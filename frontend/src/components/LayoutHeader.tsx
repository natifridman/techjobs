import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Building2, Bookmark, LogIn, LogOut, User, MapPin, Briefcase, Menu, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";

interface LayoutHeaderProps {
  variant?: 'light' | 'dark';
}

export default function LayoutHeader({ variant = 'light' }: LayoutHeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, isAuthenticated, isLoading, login, logout } = useAuth();

  const isDark = variant === 'dark';

  // Handle Escape key to close mobile menu
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isMobileMenuOpen]);

  const handleLogin = () => {
    login(window.location.href);
  };

  const handleLogout = async () => {
    await logout();
    navigate(createPageUrl("Home"));
  };

  const isActive = (path: string) => location.pathname.includes(path);

  const navLinks = [
    { path: "Jobs", icon: Briefcase, label: "Jobs", checkActive: () => isActive("jobs") && !isActive("saved") },
    { path: "Companies", icon: Building2, label: "Companies", checkActive: () => isActive("companies") },
    { path: "SavedJobs", icon: Bookmark, label: "Saved", checkActive: () => isActive("saved") },
    { path: "Map", icon: MapPin, label: "Map", checkActive: () => isActive("map") },
  ];

  // Style configurations based on variant
  const styles = {
    header: isDark
      ? "bg-transparent"
      : "bg-white border-b border-warm-200",
    logo: isDark
      ? "text-white"
      : "text-warm-900",
    navButton: (active: boolean) => isDark
      ? active
        ? "text-white bg-white/20"
        : "text-white/80 hover:text-white hover:bg-white/10"
      : active
        ? "text-iris-600 bg-iris-50"
        : "text-warm-600 hover:text-warm-900 hover:bg-warm-100",
    divider: isDark
      ? "border-white/20"
      : "border-warm-200",
    userText: isDark
      ? "text-white/90"
      : "text-warm-700",
    userIcon: isDark
      ? "bg-white/20 text-white"
      : "bg-iris-100 text-iris-600",
    userImage: isDark
      ? "border-white/30"
      : "border-warm-200",
    logoutButton: isDark
      ? "text-white/80 hover:text-white hover:bg-white/10"
      : "text-warm-600 hover:text-red-600",
    loginButton: isDark
      ? "bg-white text-iris-700 hover:bg-iris-50"
      : "bg-iris-600 hover:bg-iris-700 text-white",
    mobileMenuButton: isDark
      ? "text-white hover:bg-white/10"
      : "text-warm-600 hover:bg-warm-100",
  };

  return (
    <>
      <header className={`${styles.header} sticky top-0 z-50`}>
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link to={createPageUrl("Home")} className={`flex items-center gap-2 font-bold text-xl ${styles.logo} shrink-0`}>
            <img src="/techjobsil-logo-64.png" alt="TechJobsIL" className="w-8 h-8" />
            <span className="hidden sm:inline">TechJobsIL</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 shrink-0">
            {navLinks.map(({ path, icon: Icon, label, checkActive }) => (
              <Button
                key={path}
                asChild
                variant="ghost"
                size="sm"
                className={styles.navButton(checkActive())}
              >
                <Link to={createPageUrl(path)}>
                  <Icon className="w-4 h-4 mr-2" />
                  <span>{label}</span>
                </Link>
              </Button>
            ))}

            {/* Auth buttons */}
            <div className={`ml-2 pl-2 border-l ${styles.divider}`}>
              {isLoading ? (
                <div className={`w-8 h-8 rounded-full ${isDark ? 'bg-white/20' : 'bg-warm-100'} animate-pulse`} />
              ) : isAuthenticated && user ? (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2">
                    {user.picture ? (
                      <img
                        src={user.picture}
                        alt={user.name}
                        className={`w-8 h-8 rounded-full border ${styles.userImage}`}
                      />
                    ) : (
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${styles.userIcon}`}>
                        <User className="w-4 h-4" />
                      </div>
                    )}
                    <span className={`text-sm max-w-[100px] truncate hidden lg:inline ${styles.userText}`}>
                      {user.name?.split(' ')[0]}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    className={styles.logoutButton}
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden lg:inline ml-2">Logout</span>
                  </Button>
                </div>
              ) : (
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleLogin}
                  className={styles.loginButton}
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  <span>Sign in</span>
                </Button>
              )}
            </div>
          </nav>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className={`md:hidden ${styles.mobileMenuButton}`}
            onClick={() => setIsMobileMenuOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="w-6 h-6" />
          </Button>
        </div>
      </header>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50 md:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed inset-y-0 right-0 w-80 max-w-[85vw] bg-white z-50 shadow-2xl md:hidden"
            >
              <div className="flex flex-col h-full">
                {/* Drawer Header */}
                <div className="flex items-center justify-between p-4 border-b border-warm-200">
                  <Link
                    to={createPageUrl("Home")}
                    className="flex items-center gap-2 font-bold text-xl text-warm-900"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <img src="/techjobsil-logo-64.png" alt="TechJobsIL" className="w-8 h-8" />
                    <span>TechJobsIL</span>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsMobileMenuOpen(false)}
                    aria-label="Close menu"
                  >
                    <X className="w-6 h-6" />
                  </Button>
                </div>

                {/* Mobile Navigation Links */}
                <nav className="flex-1 p-4 space-y-2">
                  {navLinks.map(({ path, icon: Icon, label, checkActive }) => (
                    <Link
                      key={path}
                      to={createPageUrl(path)}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-colors ${
                        checkActive()
                          ? "bg-iris-50 text-iris-600"
                          : "text-warm-600 hover:bg-warm-100"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      {label}
                    </Link>
                  ))}
                </nav>

                {/* Mobile Auth Section */}
                <div className="p-4 border-t border-warm-200">
                  {isLoading ? (
                    <div className="h-12 bg-warm-100 rounded-xl animate-pulse" />
                  ) : isAuthenticated && user ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 px-4 py-3 bg-warm-50 rounded-xl">
                        {user.picture ? (
                          <img
                            src={user.picture}
                            alt={user.name}
                            className="w-10 h-10 rounded-full border border-warm-200"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-iris-100 flex items-center justify-center">
                            <User className="w-5 h-5 text-iris-600" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-warm-900 truncate">{user.name}</p>
                          <p className="text-sm text-warm-500 truncate">{user.email}</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        className="w-full justify-center text-warm-600 hover:text-red-600 hover:border-red-200"
                        onClick={() => {
                          handleLogout();
                          setIsMobileMenuOpen(false);
                        }}
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Sign Out
                      </Button>
                    </div>
                  ) : (
                    <Button
                      className="w-full bg-iris-600 hover:bg-iris-700 text-white py-3"
                      onClick={() => {
                        handleLogin();
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      <LogIn className="w-4 h-4 mr-2" />
                      Sign in with Google
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
