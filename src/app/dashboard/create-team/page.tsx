"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { generateTeamCode } from "@/lib/team-code";
import { Copy, Check, ArrowLeft, Loader2 } from "lucide-react";

export default function CreateTeamPage() {
  const router = useRouter();
  const [teamName, setTeamName] = useState("");
  const [loading, setLoading] = useState(false);
  const [createdTeam, setCreatedTeam] = useState<{ id: string; code: string; name: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim()) return;
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/auth");
        return;
      }

      let code = generateTeamCode();
      let attempts = 0;
      const maxAttempts = 10;

      while (attempts < maxAttempts) {
        const { data: existing } = await supabase
          .from("teams")
          .select("id")
          .eq("code", code)
          .single();

        if (!existing) break;
        code = generateTeamCode();
        attempts++;
      }

      const { data: team, error: teamError } = await supabase
        .from("teams")
        .insert({ name: teamName.trim(), code, created_by: user.id })
        .select("id, code, name")
        .single();

      if (teamError) throw teamError;

      const { error: memberError } = await supabase.from("team_members").insert({
        team_id: team.id,
        user_id: user.id,
        role: "owner",
      });

      if (memberError) throw memberError;

      setCreatedTeam(team);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : typeof err === "object" && err !== null && "message" in err
            ? String((err as { message: unknown }).message)
            : "Failed to create team";
      console.error("Create team error:", err);
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  const copyCode = () => {
    if (createdTeam?.code) {
      navigator.clipboard.writeText(createdTeam.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (createdTeam) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-primary-50/20 to-slate-100 dark:from-slate-900 p-4">
        <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold">Team Created!</h2>
            <p className="text-slate-500 mt-1">{createdTeam.name}</p>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">
            Share this code with your team members:
          </p>
          <div className="flex items-center gap-2 mb-6">
            <div className="flex-1 py-3 px-4 bg-slate-100 dark:bg-slate-700 rounded-lg font-mono text-xl font-bold text-center tracking-widest">
              {createdTeam.code}
            </div>
            <button
              onClick={copyCode}
              className="p-3 rounded-lg bg-primary-100 dark:bg-primary-900/30 hover:bg-primary-200 dark:hover:bg-primary-900/50 transition-colors"
            >
              {copied ? (
                <Check className="w-5 h-5 text-green-600" />
              ) : (
                <Copy className="w-5 h-5 text-primary-600" />
              )}
            </button>
          </div>
          <button
            onClick={() => router.push(`/team/${createdTeam.id}`)}
            className="w-full py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg"
          >
            Go to Team Dashboard
          </button>
        </div>
      </div>
    );
  }

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
          <h2 className="text-xl font-bold mb-6">Create a Team</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Team Name</label>
              <input
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="e.g. Marketing Team"
                required
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 text-slate-900 bg-white dark:text-slate-100 dark:bg-slate-700 placeholder:text-slate-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Create Team
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
