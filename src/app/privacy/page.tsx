export default function PrivacyPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12 text-gray-600 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">
        Privacy Policy (Demo Platform)
      </h1>
      <p className="text-sm">Last Updated: June 2026</p>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-gray-800">
          1. Educational & Testing Purpose
        </h2>
        <p className="text-sm leading-relaxed">
          This platform is an educational demonstration prototype. No actual
          commercial transactions, gas cylinder refilling, or real-world
          physical deliveries take place.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-gray-800">
          2. Information Collection & Safety
        </h2>
        <p className="text-sm leading-relaxed">
          We do not collect or request real-world sensitive data. Public
          registrations are disabled, and predefined testing credentials are
          provided. Any mock data, temporary browser cookies, or system tracking
          metrics used are purely for simulating user routing and session
          persistence within the testing sandbox.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-gray-800">
          3. Data Retention & Deletion
        </h2>
        <p className="text-sm leading-relaxed">
          All order transactions, coordinates, and simulated logs generated
          during testing are temporary and subject to automated database purges.
        </p>
      </section>
    </div>
  );
}
