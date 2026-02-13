"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import { PlusCircle, LogIn, LogOut } from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace("/auth");
        return;
      }
      setUser(session.user);
    };
    getSession();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    setLoading(false);
    return () => subscription.unsubscribe();
  }, [router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace("/");
    router.refresh();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-slate-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-primary-50/20 to-slate-100 dark:from-slate-900 dark:via-primary-900/10 dark:to-slate-900">
      <header className="border-b bg-white/80 dark:bg-slate-800/80 backdrop-blur sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold">Team Task Manager</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-600 dark:text-slate-300 truncate max-w-[180px]">
              {user?.email}
            </span>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1 text-sm text-slate-600 hover:text-red-600"
            >
              <LogOut className="w-4 h-4" /> Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold mb-8">Choose an option</h2>
        <div className="grid md:grid-cols-2 gap-6 max-w-3xl">
          <button
            onClick={() => router.push("/dashboard/create-team")}
            className="flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-primary-200 dark:border-primary-800 bg-white dark:bg-slate-800 hover:border-primary-500 hover:shadow-lg transition-all group"
          >
            <PlusCircle className="w-16 h-16 text-primary-500 mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-lg font-semibold mb-2">Create a Team</h3>
            <p className="text-sm text-slate-500 text-center">
              Start a new team and get a shareable code for others to join
            </p>
          </button>
          <button
            onClick={() => router.push("/dashboard/join-team")}
            className="flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-primary-200 dark:border-primary-800 bg-white dark:bg-slate-800 hover:border-primary-500 hover:shadow-lg transition-all group"
          >
            <LogIn className="w-16 h-16 text-primary-500 mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-lg font-semibold mb-2">Join a Team</h3>
            <p className="text-sm text-slate-500 text-center">
              Enter the team code to join an existing team and collaborate
            </p>
          </button>
        </div>
      </main>
    </div>
  );
}
