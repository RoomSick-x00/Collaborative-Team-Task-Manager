"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import { PlusCircle, LogIn, LogOut, Users, ChevronRight, Loader2 } from "lucide-react";

type Team = { id: string; name: string; code: string };

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace("/auth");
        return;
      }
      setUser(session.user);

      const { data: members } = await supabase
        .from("team_members")
        .select("team_id")
        .eq("user_id", session.user.id);

      if (members && members.length > 0) {
        const teamIds = members.map((m) => m.team_id);
        const { data: teamsData } = await supabase
          .from("teams")
          .select("id, name, code")
          .in("id", teamIds);
        setTeams(teamsData ?? []);
      } else {
        setTeams([]);
      }
      setLoading(false);
    };
    loadData();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, [router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace("/");
    router.refresh();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-primary-50/20 to-slate-100 dark:from-slate-900">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
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
              className="flex items-center gap-1 text-sm text-slate-600 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400"
            >
              <LogOut className="w-4 h-4" /> Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {teams.length > 0 && (
          <section className="mb-12">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" /> My Teams
            </h2>
            <ul className="space-y-2">
              {teams.map((team) => (
                <li
                  key={team.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-slate-800 border dark:border-slate-700 hover:shadow-md transition-shadow group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                      <Users className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <p className="font-medium">{team.name}</p>
                      <p className="text-sm text-slate-500 font-mono">{team.code}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => router.push(`/team/${team.id}`)}
                    className="flex items-center gap-1 text-primary-600 hover:text-primary-700 font-medium text-sm"
                  >
                    Open <ChevronRight className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        <h2 className="text-lg font-semibold mb-4">
          {teams.length > 0 ? "Create or join another team" : "Get started"}
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          <button
            onClick={() => router.push("/dashboard/create-team")}
            className="flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-primary-200 dark:border-primary-800 bg-white dark:bg-slate-800 hover:border-primary-500 hover:shadow-lg transition-all group text-left"
          >
            <PlusCircle className="w-12 h-12 text-primary-500 mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-lg font-semibold mb-2">Create a Team</h3>
            <p className="text-sm text-slate-500 text-center">
              Start a new team and get a shareable code for others to join
            </p>
          </button>
          <button
            onClick={() => router.push("/dashboard/join-team")}
            className="flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-primary-200 dark:border-primary-800 bg-white dark:bg-slate-800 hover:border-primary-500 hover:shadow-lg transition-all group text-left"
          >
            <LogIn className="w-12 h-12 text-primary-500 mb-4 group-hover:scale-110 transition-transform" />
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
