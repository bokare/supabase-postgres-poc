"use client";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

type Todo = {
  id: string;
  user_id: string;
  task: string;
  is_complete: boolean;
  created_at?: string;
};

export default function TodosPage() {
  const router = useRouter();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  const { pendingTodos, completedTodos, totalCount } = useMemo(() => {
    const pending = todos.filter((t) => !t.is_complete);
    const completed = todos.filter((t) => t.is_complete);
    return {
      pendingTodos: pending,
      completedTodos: completed,
      totalCount: todos.length,
    };
  }, [todos]);

  const fetchTodos = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.replace("/login");
      return;
    }
    const { data, error } = await supabase
      .from("todos")
      .select("id, user_id, task, is_complete")
      .order("id", { ascending: false });
    if (error) setError(error.message);
    setTodos(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchTodos();
    const channel = supabase
      .channel("todos-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "todos" },
        fetchTodos
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const addTodo = async () => {
    setError(null);
    const trimmed = title.trim();
    if (!trimmed) return;
    setAdding(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return router.replace("/login");
    const res = await supabase
      .from("todos")
      .insert({ task: trimmed, user_id: user.id }) // if pass other user's id here it cross check with RLS policy that this user id is same as logged in user id or not, if not then it will throw error
      .select("*")
      .single();
    if (!res.error && res.data) {
      setTodos((prev) => [res.data as Todo, ...prev]);
    } else if (res.error) {
      setError(res.error.message);
    }
    setTitle("");
    setAdding(false);
  };

  const toggleTodo = async (todo: Todo) => {
    setError(null);
    const previous = todos;
    setTodos((curr) =>
      curr.map((t) =>
        t.id === todo.id ? { ...t, is_complete: !t.is_complete } : t
      )
    );
    const { error, data } = await supabase
      .from("todos")
      .update({ is_complete: !todo.is_complete })
      .eq("id", todo.id);

    console.log("toggle data", data);
    console.log("toggle error", error);
    if (error) {
      setError(error.message);
      setTodos(previous);
    }
  };

  const deleteTodo = async (id: string) => {
    setError(null);
    const previous = todos;
    setTodos((curr) => curr.filter((t) => t.id !== id));
    const { error } = await supabase.from("todos").delete().eq("id", id);
    if (error) {
      setError(error.message);
      setTodos(previous);
    }
  };

  const startEdit = (todo: Todo) => {
    setEditingId(todo.id);
    setEditText(todo.task);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText("");
  };

  const saveEdit = async (id: string) => {
    const trimmed = editText.trim();
    if (!trimmed) return;

    setError(null);
    const previous = todos;
    setTodos((curr) =>
      curr.map((t) => (t.id === id ? { ...t, task: trimmed } : t))
    );

    const { error } = await supabase
      .from("todos")
      .update({ task: trimmed })
      .eq("id", id);

    if (error) {
      setError(error.message);
      setTodos(previous);
    } else {
      setEditingId(null);
      setEditText("");
    }
  };

  if (loading)
    return (
      <div className="mx-auto max-w-4xl rounded-xl bg-gray-800 p-8 text-center shadow-2xl">
        <div className="flex items-center justify-center space-x-2">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
          <span className="text-gray-300">Loading your tasks...</span>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white">Your Tasks</h1>
            <p className="mt-2 text-gray-400">Stay organized and productive</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="rounded-full bg-blue-600/20 px-4 py-2 backdrop-blur-sm">
              <span className="text-sm font-medium text-blue-300">
                {totalCount} {totalCount === 1 ? "task" : "tasks"}
              </span>
            </div>
          </div>
        </div>

        <div className="mb-6 rounded-xl bg-gray-800/50 p-6 backdrop-blur-sm shadow-xl">
          <div className="flex gap-3">
            <input
              placeholder="What needs to be done?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !adding && title.trim()) addTodo();
              }}
              className="flex-1 rounded-lg border border-gray-600 bg-gray-700/50 px-4 py-3 text-white placeholder-gray-400 backdrop-blur-sm transition-all duration-200 focus:border-blue-500 focus:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            <button
              onClick={addTodo}
              disabled={adding || !title.trim()}
              className={`rounded-lg px-6 py-3 font-medium text-white transition-all duration-200 ${
                adding || !title.trim()
                  ? "cursor-not-allowed bg-gray-600 text-gray-400"
                  : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 hover:shadow-lg hover:shadow-blue-500/25"
              }`}
            >
              {adding ? (
                <div className="flex items-center space-x-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  <span>Adding...</span>
                </div>
              ) : (
                "Add Task"
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-900/20 border border-red-500/30 p-4 backdrop-blur-sm">
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}
        {totalCount === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-600 bg-gray-800/30 p-12 text-center backdrop-blur-sm">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-sm">
              <span className="text-4xl">📝</span>
            </div>
            <h3 className="text-xl font-semibold text-white">No tasks yet</h3>
            <p className="mt-2 text-gray-400">
              Add your first task above to get started and stay productive.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {pendingTodos.length > 0 && (
              <section>
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                    <h2 className="text-lg font-semibold text-white">
                      In Progress
                    </h2>
                  </div>
                  <span className="rounded-full bg-blue-600/20 px-3 py-1 text-xs font-medium text-blue-300">
                    {pendingTodos.length}
                  </span>
                </div>
                <div className="space-y-2 rounded-xl bg-gray-800/50 p-1 backdrop-blur-sm shadow-xl">
                  {pendingTodos.map((t) => {
                    const displayTitle = t.task ?? "(Untitled)";
                    const isEditing = editingId === t.id;
                    return (
                      <div
                        key={t.id}
                        className="group rounded-lg bg-gray-700/30 p-4 transition-all duration-200 hover:bg-gray-700/50"
                      >
                        <div className="flex items-center gap-4">
                          <input
                            aria-label="Mark todo complete"
                            type="checkbox"
                            checked={t.is_complete}
                            onChange={() => toggleTodo(t)}
                            className="h-5 w-5 rounded border-gray-500 bg-gray-600 text-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:ring-offset-0"
                          />
                          {isEditing ? (
                            <div className="flex flex-1 items-center gap-3">
                              <input
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") saveEdit(t.id);
                                  if (e.key === "Escape") cancelEdit();
                                }}
                                className="flex-1 rounded-lg border border-gray-500 bg-gray-600 px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                autoFocus
                              />
                              <button
                                onClick={() => saveEdit(t.id)}
                                className="rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700"
                              >
                                Save
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="rounded-lg bg-gray-500 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-600"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <>
                              <span
                                className="flex-1 cursor-pointer text-gray-200 transition-colors hover:text-blue-400"
                                onClick={() => startEdit(t)}
                              >
                                {displayTitle}
                              </span>
                              <div className="flex items-center space-x-2 opacity-0 transition-opacity group-hover:opacity-100">
                                <button
                                  className="rounded-lg bg-gray-600 px-3 py-1.5 text-sm text-gray-300 transition-colors hover:bg-gray-500 hover:text-white"
                                  onClick={() => startEdit(t)}
                                >
                                  Edit
                                </button>
                                <button
                                  className="rounded-lg bg-red-600/20 px-3 py-1.5 text-sm text-red-400 transition-colors hover:bg-red-600/30 hover:text-red-300"
                                  onClick={() => deleteTodo(t.id)}
                                >
                                  Delete
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
            {completedTodos.length > 0 && (
              <section>
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    <h2 className="text-lg font-semibold text-white">
                      Completed
                    </h2>
                  </div>
                  <span className="rounded-full bg-green-600/20 px-3 py-1 text-xs font-medium text-green-300">
                    {completedTodos.length}
                  </span>
                </div>
                <div className="space-y-2 rounded-xl bg-gray-800/50 p-1 backdrop-blur-sm shadow-xl">
                  {completedTodos.map((t) => {
                    const displayTitle = t.task ?? "(Untitled)";
                    const isEditing = editingId === t.id;
                    return (
                      <div
                        key={t.id}
                        className="group rounded-lg bg-gray-700/20 p-4 transition-all duration-200 hover:bg-gray-700/30"
                      >
                        <div className="flex items-center gap-4">
                          <input
                            aria-label="Mark todo incomplete"
                            type="checkbox"
                            checked={t.is_complete}
                            onChange={() => toggleTodo(t)}
                            className="h-5 w-5 rounded border-gray-500 bg-gray-600 text-green-500 focus:ring-2 focus:ring-green-500/20 focus:ring-offset-0"
                          />
                          {isEditing ? (
                            <div className="flex flex-1 items-center gap-3">
                              <input
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") saveEdit(t.id);
                                  if (e.key === "Escape") cancelEdit();
                                }}
                                className="flex-1 rounded-lg border border-gray-500 bg-gray-600 px-3 py-2 text-white placeholder-gray-400 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20"
                                autoFocus
                              />
                              <button
                                onClick={() => saveEdit(t.id)}
                                className="rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700"
                              >
                                Save
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="rounded-lg bg-gray-500 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-600"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <>
                              <span
                                className="flex-1 cursor-pointer text-gray-500 line-through transition-colors hover:text-green-400"
                                onClick={() => startEdit(t)}
                              >
                                {displayTitle}
                              </span>
                              <div className="flex items-center space-x-2 opacity-0 transition-opacity group-hover:opacity-100">
                                <button
                                  className="rounded-lg bg-gray-600 px-3 py-1.5 text-sm text-gray-300 transition-colors hover:bg-gray-500 hover:text-white"
                                  onClick={() => startEdit(t)}
                                >
                                  Edit
                                </button>
                                <button
                                  className="rounded-lg bg-red-600/20 px-3 py-1.5 text-sm text-red-400 transition-colors hover:bg-red-600/30 hover:text-red-300"
                                  onClick={() => deleteTodo(t.id)}
                                >
                                  Delete
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
