"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { CheckSquare, Users } from "lucide-react";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.replace("/dashboard");
      }
    };
    checkAuth();
  }, [router]);

  const handleGetStarted = () => {
    router.push("/auth");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-primary-50/30 to-slate-100 dark:from-slate-900 dark:via-primary-900/20 dark:to-slate-900">
      <div className="container mx-auto px-4 py-16">
        <div className="flex flex-col items-center justify-center min-h-[80vh] text-center">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-4 rounded-2xl bg-primary-500 text-white shadow-lg shadow-primary-500/30">
              <CheckSquare className="w-12 h-12" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
              Team Task Manager
            </h1>
          </div>
          <p className="text-lg md:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mb-4">
            Collaborate with your team in real-time. Create teams, share tasks, and get things done together.
          </p>
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-12">
            <Users className="w-5 h-5" />
            <span>Multiple people can add & manage tasks together</span>
          </div>
          <button
            onClick={handleGetStarted}
            className="px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl shadow-lg shadow-primary-500/25 transition-all hover:scale-105 active:scale-100"
          >
            Get Started
          </button>
        </div>
      </div>
    </div>
  );
}
