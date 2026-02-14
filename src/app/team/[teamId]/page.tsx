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
  Copy,
  Check,
  ChevronDown,
  ListTodo,
} from "lucide-react";

type Task = Database["public"]["Tables"]["tasks"]["Row"];
type TaskStatus = Task["status"];

const STATUS_OPTIONS: { value: TaskStatus; label: string; icon: React.ReactNode }[] = [
  { value: "todo", label: "To Do", icon: <Circle className="w-4 h-4" /> },
  { value: "in_progress", label: "In Progress", icon: <Clock className="w-4 h-4" /> },
  { value: "done", label: "Done", icon: <CheckCircle2 className="w-4 h-4" /> },
];

export default function TeamPage() {
  const router = useRouter();
  const params = useParams();
  const teamId = params.teamId as string;

  const [team, setTeam] = useState<{ id: string; name: string; code: string } | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [addTaskTitle, setAddTaskTitle] = useState("");
  const [adding, setAdding] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [openStatusMenu, setOpenStatusMenu] = useState<string | null>(null);

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

      const { data: tasksData, error: tasksErr } = await supabase
        .from("tasks")
        .select("*")
        .eq("team_id", teamId)
        .order("created_at", { ascending: false });
      if (tasksErr) console.error("Tasks fetch error:", tasksErr);
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

    const { data: newTask, error } = await supabase
      .from("tasks")
      // @ts-expect-error Supabase generated types may not match schema
      .insert({
        team_id: teamId,
        title,
        status: "todo",
        created_by: user.id,
      })
      .select()
      .single();

    if (!error && newTask) {
      setAddTaskTitle("");
      setTasks((prev) => [newTask as Task, ...prev]);
    }
    setAdding(false);
  };

  const updateTaskStatus = async (taskId: string, status: TaskStatus) => {
    setOpenStatusMenu(null);
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status } : t))
    );
    await supabase
      .from("tasks")
      // @ts-expect-error Supabase generated types may not match schema
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", taskId);
  };

  const deleteTask = async (taskId: string) => {
    if (!confirm("Delete this task?")) return;
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    await supabase.from("tasks").delete().eq("id", taskId);
  };

  const copyTeamCode = () => {
    if (team?.code) {
      navigator.clipboard.writeText(team.code);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    }
  };

  const getStatusConfig = (status: TaskStatus) =>
    STATUS_OPTIONS.find((s) => s.value === status) ?? STATUS_OPTIONS[0];

  if (loading || !team) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-slate-50 via-primary-50/20 to-slate-100 dark:from-slate-900">
        <Loader2 className="w-10 h-10 animate-spin text-primary-500" />
        <p className="text-slate-500">Loading team...</p>
      </div>
    );
  }

  const todoTasks = tasks.filter((t) => t.status === "todo");
  const inProgressTasks = tasks.filter((t) => t.status === "in_progress");
  const doneTasks = tasks.filter((t) => t.status === "done");

  const EmptyColumn = ({ message }: { message: string }) => (
    <div className="min-h-[120px] flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-600 bg-slate-50/50 dark:bg-slate-800/30 py-8 px-4">
      <ListTodo className="w-8 h-8 text-slate-400 mb-2" />
      <p className="text-sm text-slate-500 text-center">{message}</p>
    </div>
  );

  const TaskCard = ({ task }: { task: Task }) => {
    const statusConfig = getStatusConfig(task.status);
    const isMenuOpen = openStatusMenu === task.id;

    return (
      <div className="group flex items-center gap-3 p-4 bg-white dark:bg-slate-800 rounded-xl border dark:border-slate-700 hover:shadow-md transition-shadow">
        <div className="relative flex-shrink-0">
          <button
            onClick={() => setOpenStatusMenu(isMenuOpen ? null : task.id)}
            className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-left min-w-[100px]"
            aria-haspopup="listbox"
          >
            <span className="text-slate-500">
              {task.status === "done" ? (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              ) : task.status === "in_progress" ? (
                <Clock className="w-5 h-5 text-amber-500" />
              ) : (
                <Circle className="w-5 h-5 text-slate-300" />
              )}
            </span>
            <span className="text-xs text-slate-500 truncate">{statusConfig.label}</span>
            <ChevronDown
              className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform ${isMenuOpen ? "rotate-180" : ""}`}
            />
          </button>
          {isMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setOpenStatusMenu(null)}
                aria-hidden="true"
              />
              <ul
                className="absolute left-0 top-full mt-1 z-20 w-40 py-1 rounded-lg bg-white dark:bg-slate-800 border dark:border-slate-700 shadow-lg"
                role="listbox"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <li key={opt.value}>
                    <button
                      onClick={() => updateTaskStatus(task.id, opt.value)}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 ${
                        task.status === opt.value ? "text-primary-600 font-medium" : ""
                      }`}
                    >
                      {opt.icon}
                      {opt.label}
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
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
          className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          title="Delete task"
          aria-label="Delete task"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    );
  };

  const Column = ({
    title,
    icon,
    tasks: colTasks,
    emptyMessage,
  }: {
    title: string;
    icon: React.ReactNode;
    tasks: Task[];
    emptyMessage: string;
  }) => (
    <div className="flex flex-col min-w-0">
      <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2 sticky top-0 py-1 bg-inherit">
        {icon} {title} ({colTasks.length})
      </h3>
      <div className="space-y-2 min-h-[120px]">
        {colTasks.length === 0 ? (
          <EmptyColumn message={emptyMessage} />
        ) : (
          colTasks.map((t) => <TaskCard key={t.id} task={t} />)
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-primary-50/20 to-slate-100 dark:from-slate-900">
      <header className="border-b bg-white/80 dark:bg-slate-800/80 backdrop-blur sticky top-0 z-30">
        <div className="container mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-wrap">
            <button
              onClick={() => router.push("/dashboard")}
              className="flex items-center gap-2 text-slate-600 hover:text-primary-600 dark:text-slate-400 dark:hover:text-primary-400"
            >
              <ArrowLeft className="w-4 h-4" /> Dashboard
            </button>
            <h1 className="text-xl font-bold truncate">{team.name}</h1>
            <button
              onClick={copyTeamCode}
              className="flex items-center gap-2 text-sm font-mono px-3 py-1.5 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              title="Copy team code"
            >
              {team.code}
              {codeCopied ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <Copy className="w-4 h-4 text-slate-500" />
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 md:py-8">
        <div className="mb-6 md:mb-8 flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={addTaskTitle}
            onChange={(e) => setAddTaskTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTask()}
            placeholder="Add a new task..."
            className="flex-1 px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-slate-900 bg-white dark:text-slate-100 dark:bg-slate-700 placeholder:text-slate-500"
          />
          <button
            onClick={addTask}
            disabled={adding || !addTaskTitle.trim()}
            className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 shrink-0"
          >
            {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Add Task
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 overflow-x-auto pb-4">
          <Column
            title="To Do"
            icon={<Circle className="w-4 h-4" />}
            tasks={todoTasks}
            emptyMessage="No tasks yet. Add one above!"
          />
          <Column
            title="In Progress"
            icon={<Clock className="w-4 h-4" />}
            tasks={inProgressTasks}
            emptyMessage="No tasks in progress"
          />
          <Column
            title="Done"
            icon={<CheckCircle2 className="w-4 h-4" />}
            tasks={doneTasks}
            emptyMessage="Completed tasks appear here"
          />
        </div>
      </main>
    </div>
  );
}
