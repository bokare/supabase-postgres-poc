export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-12">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-500 to-purple-600 mb-6">
            <span className="text-3xl font-bold text-white">T</span>
          </div>
          <h1 className="text-5xl font-bold text-white mb-4">
            Welcome to{" "}
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              TaskFlow
            </span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            A modern, professional task management application built with
            Next.js and Supabase. Stay organized, boost productivity, and
            achieve your goals.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="rounded-2xl bg-gray-800/50 p-6 backdrop-blur-sm border border-gray-700/50 hover:bg-gray-800/70 transition-all duration-200">
            <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Smart Organization
            </h3>
            <p className="text-gray-400">
              Organize your tasks with intelligent categorization and priority
              management.
            </p>
          </div>

          <div className="rounded-2xl bg-gray-800/50 p-6 backdrop-blur-sm border border-gray-700/50 hover:bg-gray-800/70 transition-all duration-200">
            <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-purple-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Real-time Sync
            </h3>
            <p className="text-gray-400">
              Your tasks sync instantly across all devices with real-time
              updates.
            </p>
          </div>

          <div className="rounded-2xl bg-gray-800/50 p-6 backdrop-blur-sm border border-gray-700/50 hover:bg-gray-800/70 transition-all duration-200">
            <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Secure & Private
            </h3>
            <p className="text-gray-400">
              Enterprise-grade security keeps your data safe and private.
            </p>
          </div>
        </div>

        <div className="text-center">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/signup"
              className="rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-4 font-medium text-white shadow-lg transition-all duration-200 hover:from-blue-700 hover:to-purple-700 hover:shadow-blue-500/25"
            >
              Get Started Free
            </a>
            <a
              href="/login"
              className="rounded-lg border border-gray-600 px-8 py-4 font-medium text-gray-300 transition-all duration-200 hover:border-gray-500 hover:bg-gray-800 hover:text-white"
            >
              Sign In
            </a>
          </div>
          <p className="mt-6 text-sm text-gray-500">
            Already have an account?{" "}
            <a
              href="/todos"
              className="text-blue-400 hover:text-blue-300 transition-colors"
            >
              Go to your tasks
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
