import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 home-hero">
      <Compass className="w-14 h-14 rounded-2xl bg-iris-50 p-3 text-primary mb-5" />
      <h1 className="text-3xl font-bold text-warm-800 mb-2">Page not found</h1>
      <p className="text-warm-500 mb-6">The page you're looking for doesn't exist or has moved.</p>
      <Button asChild className="bg-action hover:bg-action-hover text-action-foreground">
        <Link to="/jobs">Browse jobs</Link>
      </Button>
    </div>
  );
}
