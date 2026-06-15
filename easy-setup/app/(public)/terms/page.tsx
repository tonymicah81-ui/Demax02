export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 px-6 py-16 max-w-3xl mx-auto">
      <h1 className="text-3xl font-black dark:text-white mb-2">Terms of Service</h1>
      <p className="text-sm text-gray-400 mb-8">Last updated: {new Date().getFullYear()}</p>
      <div className="prose prose-sm dark:prose-invert max-w-none text-gray-600 dark:text-gray-400 space-y-4">
        <p>By using this platform, you agree to these terms. Please read them carefully.</p>
        <h2 className="text-base font-bold dark:text-white">1. Use of Service</h2>
        <p>You may use this service only for lawful purposes and in accordance with these terms.</p>
        <h2 className="text-base font-bold dark:text-white">2. Account Responsibility</h2>
        <p>You are responsible for maintaining the security of your account and any activity that occurs under it.</p>
        <h2 className="text-base font-bold dark:text-white">3. Changes to Terms</h2>
        <p>We may update these terms from time to time. Continued use of the service constitutes acceptance of any changes.</p>
        {/* ── Add full terms content here ─────────────────────────── */}
      </div>
    </div>
  );
}
