import { useState } from 'react';
import { Link, useNavigate, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Building2, Bookmark, LogIn, LogOut, User, MapPin, Briefcase } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function LayoutHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const [query, setQuery] = useState("");
  const { user, isAuthenticated, isLoading, login, logout } = useAuth();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`${createPageUrl("Jobs")}?search=${encodeURIComponent(query)}`);
    }
  };

  const handleLogin = () => {
    login(window.location.href);
  };

  const handleLogout = async () => {
    await logout();
    navigate(createPageUrl("Home"));
  };

  const isActive = (path: string) => location.pathname.includes(path);

  return (
    <header className="bg-white border-b border-warm-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <Link to={createPageUrl("Home")} className="flex items-center gap-2 font-bold text-xl text-warm-900 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-iris-600 flex items-center justify-center text-white text-sm font-bold">
            TM
          </div>
          <span className="hidden sm:inline">TechMap</span>
        </Link>

        <form onSubmit={handleSearch} className="flex-1 max-w-xl relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search jobs..."
            className="pl-9 bg-warm-50 border-warm-200 focus:bg-white w-full rounded-lg"
          />
        </form>

        <nav className="flex items-center gap-1 shrink-0">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className={isActive("jobs") && !isActive("saved") ? "text-iris-600 bg-iris-50" : "text-warm-600"}
          >
            <Link to={createPageUrl("Jobs")}>
              <Briefcase className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Jobs</span>
            </Link>
          </Button>
          <Button
            asChild
            variant="ghost"
            size="sm"
            className={isActive("companies") ? "text-iris-600 bg-iris-50" : "text-warm-600"}
          >
            <Link to={createPageUrl("Companies")}>
              <Building2 className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Companies</span>
            </Link>
          </Button>
          <Button
            asChild
            variant="ghost"
            size="sm"
            className={isActive("saved") ? "text-iris-600 bg-iris-50" : "text-warm-600"}
          >
            <Link to={createPageUrl("SavedJobs")}>
              <Bookmark className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Saved</span>
            </Link>
          </Button>
          <Button
            asChild
            variant="ghost"
            size="sm"
            className={isActive("map") ? "text-iris-600 bg-iris-50" : "text-warm-600"}
          >
            <Link to={createPageUrl("Map")}>
              <MapPin className="w-4 h-4 mr-2" />
              <span className="hidden md:inline">Map</span>
            </Link>
          </Button>

          {/* Auth buttons */}
          <div className="ml-2 pl-2 border-l border-warm-200">
            {isLoading ? (
              <div className="w-8 h-8 rounded-full bg-warm-100 animate-pulse" />
            ) : isAuthenticated && user ? (
              <div className="flex items-center gap-2">
                <div className="hidden md:flex items-center gap-2">
                  {user.picture ? (
                    <img
                      src={user.picture}
                      alt={user.name}
                      className="w-8 h-8 rounded-full border border-warm-200"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-iris-100 flex items-center justify-center">
                      <User className="w-4 h-4 text-iris-600" />
                    </div>
                  )}
                  <span className="text-sm text-warm-700 max-w-[100px] truncate">
                    {user.name?.split(' ')[0]}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="text-warm-600 hover:text-red-600"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline ml-2">Logout</span>
                </Button>
              </div>
            ) : (
              <Button
                variant="default"
                size="sm"
                onClick={handleLogin}
                className="bg-iris-600 hover:bg-iris-700"
              >
                <LogIn className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Sign in</span>
              </Button>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
