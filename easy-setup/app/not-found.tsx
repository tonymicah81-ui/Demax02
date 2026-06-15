import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center p-6 bg-gray-50 dark:bg-gray-950">
      <div className="text-8xl font-black text-[var(--color-primary)] mb-4">404</div>
      <h1 className="text-2xl font-bold dark:text-white mb-2">Page not found</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-sm">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link href="/" className="px-6 py-3 bg-[var(--color-primary)] text-white rounded-xl font-semibold hover:opacity-90 transition-opacity">
        Go home
      </Link>
    </div>
  );
}
