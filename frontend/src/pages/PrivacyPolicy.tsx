import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <Button asChild variant="ghost" className="mb-8 text-slate-600 hover:text-slate-900">
          <Link to={createPageUrl("Home")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </Button>

        <article className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 md:p-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Privacy Policy</h1>
          <p className="text-slate-500 mb-8">Last updated: January 2026</p>

          <div className="prose prose-slate max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">1. Introduction</h2>
              <p className="text-slate-600 leading-relaxed">
                Welcome to TechMap ("we," "our," or "us"). We are committed to protecting your privacy 
                and personal information. This Privacy Policy explains how we collect, use, disclose, 
                and safeguard your information when you visit our website and use our services.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">2. Information We Collect</h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                We may collect information about you in various ways:
              </p>
              <ul className="list-disc list-inside text-slate-600 space-y-2 ml-4">
                <li><strong>Personal Data:</strong> Name, email address, and profile information when you create an account or sign in with Google.</li>
                <li><strong>Usage Data:</strong> Information about how you interact with our website, including pages visited and features used.</li>
                <li><strong>Device Information:</strong> Browser type, operating system, and device identifiers.</li>
                <li><strong>Saved Preferences:</strong> Job listings you save and search preferences.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">3. How We Use Your Information</h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                We use the information we collect to:
              </p>
              <ul className="list-disc list-inside text-slate-600 space-y-2 ml-4">
                <li>Provide, maintain, and improve our services</li>
                <li>Personalize your experience and show relevant job listings</li>
                <li>Save your job preferences and bookmarks</li>
                <li>Communicate with you about updates and new features</li>
                <li>Analyze usage patterns to improve our platform</li>
                <li>Protect against fraudulent or unauthorized activity</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">4. Information Sharing</h2>
              <p className="text-slate-600 leading-relaxed">
                We do not sell your personal information. We may share your information only in the 
                following circumstances:
              </p>
              <ul className="list-disc list-inside text-slate-600 space-y-2 ml-4 mt-4">
                <li>With your consent</li>
                <li>To comply with legal obligations</li>
                <li>To protect our rights and safety</li>
                <li>With service providers who assist in operating our platform</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">5. Data Security</h2>
              <p className="text-slate-600 leading-relaxed">
                We implement appropriate technical and organizational security measures to protect 
                your personal information against unauthorized access, alteration, disclosure, or 
                destruction. However, no method of transmission over the Internet is 100% secure.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">6. Cookies and Tracking</h2>
              <p className="text-slate-600 leading-relaxed">
                We use cookies and similar tracking technologies to enhance your experience, 
                analyze usage, and assist in our marketing efforts. You can control cookies 
                through your browser settings.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">7. Your Rights</h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                Depending on your location, you may have the right to:
              </p>
              <ul className="list-disc list-inside text-slate-600 space-y-2 ml-4">
                <li>Access the personal information we hold about you</li>
                <li>Request correction of inaccurate information</li>
                <li>Request deletion of your personal information</li>
                <li>Object to or restrict processing of your data</li>
                <li>Data portability</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">8. Third-Party Services</h2>
              <p className="text-slate-600 leading-relaxed">
                Our website may contain links to third-party websites or services. We are not 
                responsible for the privacy practices of these third parties. We encourage you 
                to read their privacy policies.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">9. Changes to This Policy</h2>
              <p className="text-slate-600 leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of any 
                changes by posting the new Privacy Policy on this page and updating the 
                "Last updated" date.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">10. Contact Us</h2>
              <p className="text-slate-600 leading-relaxed">
                If you have any questions about this Privacy Policy or our privacy practices, 
                please contact us at{" "}
                <a href="mailto:privacy@techmap.co.il" className="text-indigo-600 hover:text-indigo-700 underline">
                  privacy@techmap.co.il
                </a>
              </p>
            </section>
          </div>
        </article>
      </div>
    </div>
  );
}
