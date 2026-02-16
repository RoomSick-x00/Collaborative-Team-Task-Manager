"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function JoinTeamPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedCode = code.trim().toUpperCase();
    if (!trimmedCode || trimmedCode.length < 4) {
      setError("Please enter a valid team code");
      return;
    }
    if (!displayName.trim()) {
      setError("Please enter your name");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/auth");
        return;
      }

      const { data: teamData, error: teamError } = await supabase
        .rpc("get_team_by_code", { team_code: trimmedCode });

      const team = Array.isArray(teamData) && teamData.length > 0 ? teamData[0] : null;

      if (teamError || !team) {
        setError("Invalid team code. Please check and try again.");
        setLoading(false);
        return;
      }

      const { error: memberError } = await supabase.from("team_members").insert({
        team_id: team.id,
        user_id: user.id,
        role: "member",
        display_name: displayName.trim(),
      });

      if (memberError) {
        if (memberError.code === "23505") {
          setError("You are already a member of this team.");
        } else {
          throw memberError;
        }
        setLoading(false);
        return;
      }

      router.push(`/team/${team.id}`);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to join team");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-primary-50/20 to-slate-100 dark:from-slate-900 p-4">
      <div className="w-full max-w-md">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-600 hover:text-primary-600 mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8">
          <h2 className="text-xl font-bold mb-6">Join a Team</h2>
          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Your name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Jane"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 text-slate-900 bg-white dark:text-slate-100 dark:bg-slate-700 placeholder:text-slate-500 mb-4"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Team Code</label>
              <input
                type="text"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase());
                  setError("");
                }}
                placeholder="e.g. ABC123"
                maxLength={8}
                className="w-full px-4 py-3 border rounded-lg font-mono text-lg tracking-widest text-center uppercase focus:ring-2 focus:ring-primary-500 text-slate-900 bg-white dark:text-slate-100 dark:bg-slate-700 placeholder:text-slate-500"
              />
              <p className="text-xs text-slate-500 mt-1">
                Ask your team lead for the 6-character code
              </p>
            </div>
            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Join Team
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
