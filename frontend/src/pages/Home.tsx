import { useState } from 'react';
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Briefcase, 
  MapPin, 
  Building2, 
  Search, 
  ArrowRight,
  Cpu,
  Shield,
  Gamepad2,
  HeartPulse,
  Coins,
  Rocket,
  Plus,
  Bookmark,
  LogIn,
  LogOut,
  User
} from "lucide-react";
import { motion } from "framer-motion";
import AddCompanyModal from "@/components/AddCompanyModal";
import { useAuth } from "@/hooks/useAuth";

const categories = [
  { name: "AI/ML", icon: Cpu, color: "from-violet-500 to-purple-600" },
  { name: "Cybersecurity", icon: Shield, color: "from-emerald-500 to-teal-600" },
  { name: "Gaming", icon: Gamepad2, color: "from-pink-500 to-rose-600" },
  { name: "Health", icon: HeartPulse, color: "from-red-500 to-orange-600" },
  { name: "Fintech", icon: Coins, color: "from-amber-500 to-yellow-600" },
  { name: "Aerospace", icon: Rocket, color: "from-blue-500 to-cyan-600" },
];

const stats = [
  { label: "Active Jobs", value: "2,500+", icon: Briefcase },
  { label: "Tech Companies", value: "500+", icon: Building2 },
  { label: "Cities Covered", value: "50+", icon: MapPin },
];

export default function Home() {
  const navigate = useNavigate();
  const [showAddCompany, setShowAddCompany] = useState(false);
  const { user, isAuthenticated, isLoading, login, logout } = useAuth();

  const handleCategoryClick = (categoryName: string) => {
    navigate(`${createPageUrl("Jobs")}?category=${encodeURIComponent(categoryName)}`);
  };

  const handleLogin = () => {
    login(window.location.href);
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800" />
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        </div>

        {/* Header inside Hero */}
        <header className="relative z-10">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <Link to={createPageUrl("Home")} className="flex items-center gap-2 font-bold text-xl text-white">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-sm font-bold">
                TM
              </div>
              <span className="hidden sm:inline">TechMap</span>
            </Link>

            <nav className="flex items-center gap-2">
              <Button asChild variant="ghost" size="sm" className="text-white/80 hover:text-white hover:bg-white/10">
                <Link to={createPageUrl("Companies")}>
                  <Building2 className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Companies</span>
                </Link>
              </Button>
              <Button asChild variant="ghost" size="sm" className="text-white/80 hover:text-white hover:bg-white/10">
                <Link to={createPageUrl("SavedJobs")}>
                  <Bookmark className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Saved</span>
                </Link>
              </Button>

              <div className="ml-2 pl-2 border-l border-white/20">
                {isLoading ? (
                  <div className="w-8 h-8 rounded-full bg-white/20 animate-pulse" />
                ) : isAuthenticated && user ? (
                  <div className="flex items-center gap-2">
                    <div className="hidden md:flex items-center gap-2">
                      {user.picture ? (
                        <img 
                          src={user.picture} 
                          alt={user.name}
                          className="w-8 h-8 rounded-full border-2 border-white/30"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                          <User className="w-4 h-4 text-white" />
                        </div>
                      )}
                      <span className="text-sm text-white/90 max-w-[100px] truncate">
                        {user.name?.split(' ')[0]}
                      </span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={handleLogout}
                      className="text-white/80 hover:text-white hover:bg-white/10"
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
                    className="bg-white text-indigo-700 hover:bg-indigo-50"
                  >
                    <LogIn className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Sign in</span>
                  </Button>
                )}
              </div>
            </nav>
          </div>
        </header>
        
        <div className="relative max-w-7xl mx-auto px-4 py-16 md:py-28">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-white/90 text-sm mb-8">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              Updated daily with new opportunities
            </div>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
              Find Your Dream Job in
              <br />
              <span className="bg-gradient-to-r from-cyan-300 to-indigo-300 bg-clip-text text-transparent">
                Israeli Tech
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-indigo-100 max-w-2xl mx-auto mb-10">
              Discover opportunities at Israel's leading startups and tech giants. 
              All in one place, updated in real-time.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                asChild 
                size="lg" 
                className="bg-white text-indigo-700 hover:bg-indigo-50 text-lg px-8 py-6 rounded-xl shadow-xl shadow-black/20"
              >
                <Link to={createPageUrl("Jobs")}>
                  <Search className="w-5 h-5 mr-2" />
                  Explore Jobs
                </Link>
              </Button>
              <Button 
                asChild 
                size="lg" 
                className="bg-white/10 border-2 border-white/30 text-white hover:bg-white/20 text-lg px-8 py-6 rounded-xl backdrop-blur-sm"
              >
                <Link to={createPageUrl("Map")}>
                  <MapPin className="w-5 h-5 mr-2" />
                  View Map
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
      
      {/* Stats Section */}
      <div className="max-w-7xl mx-auto px-4 -mt-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <Card className="bg-white shadow-xl border-0">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="p-3 bg-indigo-100 rounded-xl">
                    <stat.icon className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
                    <p className="text-slate-500">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
      
      {/* Categories Section */}
      <div className="max-w-7xl mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            Browse by Industry
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            From AI and Cybersecurity to Gaming and Fintech — find your niche
          </p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((category, index) => (
            <motion.div
              key={category.name}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Card 
                className="group cursor-pointer hover:shadow-xl transition-all duration-300 overflow-hidden border-0 bg-white"
                onClick={() => handleCategoryClick(category.name)}
              >
                <CardContent className="p-6 text-center">
                  <div className={`w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${category.color} flex items-center justify-center transform group-hover:scale-110 transition-transform`}>
                    <category.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                    {category.name}
                  </h3>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
        
        <div className="text-center mt-8">
          <Button asChild variant="outline" size="lg" className="gap-2">
            <Link to={createPageUrl("Jobs")}>
              View All Categories
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </div>
      
      {/* CTA Section */}
      <div className="bg-slate-900 py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Find Your Next Opportunity?
          </h2>
          <p className="text-lg text-slate-300 mb-8 max-w-2xl mx-auto">
            Join thousands of tech professionals who use our platform to discover 
            their dream jobs at Israel's most innovative companies.
          </p>
          <Button 
            asChild 
            size="lg" 
            className="bg-indigo-600 hover:bg-indigo-700 text-lg px-8 py-6 rounded-xl"
          >
            <Link to={createPageUrl("Jobs")}>
              Start Searching Now
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </Button>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="bg-slate-950 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center space-y-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddCompany(true)}
            className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Your Company
          </Button>
        </div>
      </footer>

      <AddCompanyModal open={showAddCompany} onOpenChange={setShowAddCompany} />
    </div>
  );
}
