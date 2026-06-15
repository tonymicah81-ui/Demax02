export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 px-6 py-16 max-w-3xl mx-auto">
      <h1 className="text-3xl font-black dark:text-white mb-2">Privacy Policy</h1>
      <p className="text-sm text-gray-400 mb-8">Last updated: {new Date().getFullYear()}</p>
      <div className="prose prose-sm dark:prose-invert max-w-none text-gray-600 dark:text-gray-400 space-y-4">
        <p>Your privacy is important to us. This policy explains how we collect, use, and protect your information.</p>
        <h2 className="text-base font-bold dark:text-white">Information We Collect</h2>
        <p>We collect information you provide directly, such as your name, email address, and phone number when you create an account.</p>
        <h2 className="text-base font-bold dark:text-white">How We Use Your Information</h2>
        <p>We use your information to provide, maintain, and improve our services, and to communicate with you.</p>
        <h2 className="text-base font-bold dark:text-white">Data Security</h2>
        <p>We implement appropriate security measures to protect your personal information.</p>
        {/* ── Add full privacy content here ─────────────────────────── */}
      </div>
    </div>
  );
}
