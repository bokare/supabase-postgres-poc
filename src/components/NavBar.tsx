"use client";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function NavBar() {
  const [authed, setAuthed] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      console.log("auth data", data);
      setAuthed(!!data.session);
      if (data.session?.user?.email) {
        setUserEmail(data.session.user.email);
      }
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log("session", session);
      setAuthed(!!session);
      if (session?.user?.email) {
        setUserEmail(session.user.email);
      } else {
        setUserEmail(null);
      }
    });
    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <nav className="border-b border-gray-700/50 bg-gray-900/95 backdrop-blur-md shadow-xl">
      <div className="container mx-auto flex items-center justify-between px-6 py-4">
        <Link href="/" className="group flex items-center space-x-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
            <span className="text-lg font-bold text-white">T</span>
          </div>
          <span className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">
            TaskFlow
          </span>
        </Link>

        <div className="flex items-center space-x-4">
          {!authed && (
            <>
              <Link
                href="/login"
                className="rounded-lg border border-gray-600 px-4 py-2 text-sm font-medium text-gray-300 transition-all duration-200 hover:border-gray-500 hover:bg-gray-800 hover:text-white"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2 text-sm font-medium text-white shadow-lg transition-all duration-200 hover:from-blue-700 hover:to-purple-700 hover:shadow-blue-500/25"
              >
                Get Started
              </Link>
            </>
          )}
          {authed && (
            <>
              {/* User Email Display */}
              {userEmail && (
                <div className="hidden sm:flex items-center space-x-2 rounded-lg bg-gray-800/50 px-3 py-2 text-sm text-gray-300">
                  <svg
                    className="h-4 w-4 text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  <span className="truncate max-w-32">{userEmail}</span>
                </div>
              )}

              <Link
                href="/dashboard"
                className="flex items-center space-x-2 rounded-lg border border-gray-600 px-4 py-2 text-sm font-medium text-gray-300 transition-all duration-200 hover:border-gray-500 hover:bg-gray-800 hover:text-white"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z"
                  />
                </svg>
                <span>Dashboard</span>
              </Link>
              <Link
                href="/todos"
                className="flex items-center space-x-2 rounded-lg border border-gray-600 px-4 py-2 text-sm font-medium text-gray-300 transition-all duration-200 hover:border-gray-500 hover:bg-gray-800 hover:text-white"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                <span>My Tasks</span>
              </Link>
              <button
                onClick={logout}
                className="flex items-center space-x-2 rounded-lg border border-gray-600 px-4 py-2 text-sm font-medium text-gray-300 transition-all duration-200 hover:border-red-500 hover:bg-red-900/20 hover:text-red-400"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                <span>Sign Out</span>
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
