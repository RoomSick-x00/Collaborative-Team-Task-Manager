"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/database";
import {
  Plus,
  Trash2,
  ArrowLeft,
  Loader2,
  Circle,
  CheckCircle2,
  Clock,
} from "lucide-react";

type Task = Database["public"]["Tables"]["tasks"]["Row"];
type TaskStatus = Task["status"];

export default function TeamPage() {
  const router = useRouter();
  const params = useParams();
  const teamId = params.teamId as string;

  const [team, setTeam] = useState<{ id: string; name: string; code: string } | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [addTaskTitle, setAddTaskTitle] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/auth");
        return;
      }

      const { data: teamData, error: teamErr } = await supabase
        .from("teams")
        .select("id, name, code")
        .eq("id", teamId)
        .single();

      if (teamErr || !teamData) {
        router.replace("/dashboard");
        return;
      }

      const { data: member } = await supabase
        .from("team_members")
        .select("id")
        .eq("team_id", teamId)
        .eq("user_id", user.id)
        .single();

      if (!member) {
        router.replace("/dashboard");
        return;
      }

      setTeam(teamData);

      const { data: tasksData } = await supabase
        .from("tasks")
        .select("*")
        .eq("team_id", teamId)
        .order("created_at", { ascending: false });
      setTasks(tasksData ?? []);

      setLoading(false);
    };
    init();
  }, [teamId, router]);

  useEffect(() => {
    if (!teamId) return;

    const channel = supabase
      .channel(`tasks-${teamId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks", filter: `team_id=eq.${teamId}` },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setTasks((prev) => [payload.new as Task, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            setTasks((prev) =>
              prev.map((t) => (t.id === payload.new.id ? (payload.new as Task) : t))
            );
          } else if (payload.eventType === "DELETE") {
            setTasks((prev) => prev.filter((t) => t.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [teamId]);

  const addTask = async () => {
    const title = addTaskTitle.trim();
    if (!title || !teamId) return;

    setAdding(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("tasks").insert({
      team_id: teamId,
      title,
      status: "todo",
      created_by: user.id,
    });

    if (!error) setAddTaskTitle("");
    setAdding(false);
  };

  const updateTaskStatus = async (taskId: string, status: TaskStatus) => {
    await supabase
      .from("tasks")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", taskId);
  };

  const deleteTask = async (taskId: string) => {
    if (!confirm("Delete this task?")) return;
    await supabase.from("tasks").delete().eq("id", taskId);
  };

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case "done":
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case "in_progress":
        return <Clock className="w-5 h-5 text-amber-500" />;
      default:
        return <Circle className="w-5 h-5 text-slate-300" />;
    }
  };

  if (loading || !team) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  const todoTasks = tasks.filter((t) => t.status === "todo");
  const inProgressTasks = tasks.filter((t) => t.status === "in_progress");
  const doneTasks = tasks.filter((t) => t.status === "done");

  const TaskCard = ({ task }: { task: Task }) => (
    <div className="group flex items-center gap-3 p-4 bg-white dark:bg-slate-800 rounded-xl border dark:border-slate-700 hover:shadow-md transition-shadow">
      <button
        onClick={() =>
          updateTaskStatus(
            task.id,
            task.status === "done" ? "todo" : task.status === "todo" ? "in_progress" : "done"
          )
        }
        className="flex-shrink-0"
      >
        {getStatusIcon(task.status)}
      </button>
      <div className="flex-1 min-w-0">
        <p
          className={`font-medium truncate ${
            task.status === "done" ? "line-through text-slate-500" : ""
          }`}
        >
          {task.title}
        </p>
        {task.description && (
          <p className="text-sm text-slate-500 truncate">{task.description}</p>
        )}
      </div>
      <button
        onClick={() => deleteTask(task.id)}
        className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-red-500 transition-opacity"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-primary-50/20 to-slate-100 dark:from-slate-900">
      <header className="border-b bg-white/80 dark:bg-slate-800/80 backdrop-blur sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/dashboard")}
              className="flex items-center gap-2 text-slate-600 hover:text-primary-600"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <h1 className="text-xl font-bold">{team.name}</h1>
            <span className="text-sm text-slate-500 font-mono px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded">
              {team.code}
            </span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex gap-3">
          <input
            type="text"
            value={addTaskTitle}
            onChange={(e) => setAddTaskTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTask()}
            placeholder="Add a new task..."
            className="flex-1 px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary-500"
          />
          <button
            onClick={addTask}
            disabled={adding || !addTaskTitle.trim()}
            className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl flex items-center gap-2 disabled:opacity-50"
          >
            {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Add
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Circle className="w-4 h-4" /> To Do ({todoTasks.length})
            </h3>
            <div className="space-y-2">
              {todoTasks.map((t) => (
                <TaskCard key={t.id} task={t} />
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4" /> In Progress ({inProgressTasks.length})
            </h3>
            <div className="space-y-2">
              {inProgressTasks.map((t) => (
                <TaskCard key={t.id} task={t} />
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Done ({doneTasks.length})
            </h3>
            <div className="space-y-2">
              {doneTasks.map((t) => (
                <TaskCard key={t.id} task={t} />
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
