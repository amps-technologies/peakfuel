export default function TermsPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12 text-gray-600 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">
        Terms of Service (Demo Platform)
      </h1>
      <p className="text-sm">Last Updated: June 2026</p>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-gray-800">
          1. Acceptance of Terms
        </h2>
        <p className="text-sm leading-relaxed">
          By exploring this web platform, you acknowledge that you are
          interacting with a software prototype simulation. You agree not to
          treat any pricing, layout configurations, or scheduling timelines as
          true market offerings.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-gray-800">
          2. Prohibited Use
        </h2>
        <p className="text-sm leading-relaxed">
          Users are strictly prohibited from attempting to bypass system API
          configurations, executing malicious database injections, or inputting
          actual personal information into any text fields or forms.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-gray-800">
          3. Limitation of Liability
        </h2>
        <p className="text-sm leading-relaxed">
          This demo software is provided &quot;as is&quot; without warranties of
          any kind. The creators are not liable for any temporary browser
          caching issues, network interruptions, or software malfunctions during
          your evaluation.
        </p>
      </section>
    </div>
  );
}
