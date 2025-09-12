import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900 dark:text-white mb-4">
          <span className="text-blue-600">Q</span>uickQuiz
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
          AI-powered quiz platform for modern learning
        </p>
        <div className="space-x-4">
          <a
            href="/admin"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Admin Panel
          </a>
          <a
            href="/quiz"
            className="inline-block px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Take Quiz
          </a>
        </div>
      </div>
    </div>
  );
}
