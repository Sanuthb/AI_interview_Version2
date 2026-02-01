"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";
import {
  ArrowRight,
  Sparkles,
  LayoutDashboard,
  User,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { useAuth } from "@/lib/contexts/auth-context";
import { toast } from "sonner";

export default function HomePage() {
  const { user } = useAuth();
  return (
    <div className="relative min-h-screen flex flex-col items-center overflow-hidden bg-background selection:bg-primary/20">
      {/* Background Gradients */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/20 rounded-full blur-[120px] animate-pulse delay-1000" />
      </div>

      {/* Navbar Placeholder (Optional) */}
      <nav className="w-full max-w-7xl mx-auto p-6 flex justify-between items-center z-50">
        <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
          <div className="size-8 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/20">
            <Zap className="h-5 w-5 text-primary" />
          </div>
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-500">
            Placement AI
          </span>
        </div>
        <div className="flex gap-4 items-center">
          <ModeToggle />
          <Link href="/login">
            <Button
              variant="ghost"
              className="hover:bg-primary/10 hover:text-primary transition-all duration-200 hover:scale-105 border border-border/50 hover:border-primary/30"
            >
              Sign In
            </Button>
          </Link>
          <Link href="/admin-login">
            <Button
              variant="ghost"
              className="hover:bg-blue-600/10 hover:text-blue-600 transition-all duration-200 hover:scale-105 border border-border/50 hover:border-blue-600/30"
            >
              Admin Login
            </Button>
          </Link>
          <Link
            href={user?.role === "admin" || user?.role === "super_admin" ? "/admin" : "/candidate/dashboard"}
          >
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-primary/35 hover:scale-105 transition-all duration-200 font-semibold">
              Get Started
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center py-12 lg:py-0">
        <div className="space-y-8 z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/50 border border-secondary text-secondary-foreground text-sm backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5 fill-primary text-primary" />
            <span>Next-Gen Interview Intelligence</span>
          </div>

          <h1 className="text-5xl lg:text-7xl font-bold tracking-tight leading-tight">
            Master Your <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-500 to-blue-500">
              Dream Job
            </span>
          </h1>

          <p className="text-lg text-muted-foreground leading-relaxed max-w-xl">
            Experience the future of recruitment with our AI-powered interview
            platform. Real-time feedback, voice interaction, and automated
            scoring to boost your placement success.
          </p>

          <div className="flex flex-wrap gap-4 pt-4">
            <Link
              href={user?.role === "admin" || user?.role === "super_admin" ? "/" : "/candidate/dashboard"}
              onClick={(e) => {
                if (user?.role === "admin" || user?.role === "super_admin") {
                  e.preventDefault();
                  toast("You admin user not allowed to access start interview");
                }
              }}
            >
              <Button
                size="lg"
                className="h-12 px-8 text-base bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 shadow-xl shadow-primary/20 border-none"
              >
                Start Interview
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/admin-login">
              <Button
                size="lg"
                variant="outline"
                className="h-12 px-8 text-base border-primary/20 hover:bg-primary/5 hover:border-primary/50 text-foreground transition-all"
              >
                Admin Portal
              </Button>
            </Link>
          </div>

          <div className="flex items-center gap-6 pt-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-green-500" />
              <span>Secure & Private</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              <span>Instant AI Feedback</span>
            </div>
          </div>
        </div>

        {/* Hero Visual / Cards */}
        <div className="relative hidden lg:block h-[600px] w-full perspective-1000">
          {/* Decorative Elements */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[80px]" />

          {/* Floating Cards Effect */}
          <div className="absolute top-20 right-10 w-72 bg-card/50 backdrop-blur-xl border border-white/10 p-6 rounded-2xl shadow-2xl animate-float">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <User className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold">Candidate Portal</h3>
                <p className="text-xs text-muted-foreground">Track Progress</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                <div className="h-full w-[70%] bg-blue-500 rounded-full" />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Profile Completion</span>
                <span>70%</span>
              </div>
            </div>
          </div>

          <div className="absolute bottom-32 left-10 w-80 bg-card/60 backdrop-blur-xl border border-white/10 p-6 rounded-2xl shadow-2xl animate-float-delayed">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-primary/20 rounded-lg">
                <LayoutDashboard className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Admin Dashboard</h3>
                <p className="text-xs text-muted-foreground">
                  Manage Interviews
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl font-bold">124</span>
              <span className="text-xs text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">
                +12%
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Active Candidates this week
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
