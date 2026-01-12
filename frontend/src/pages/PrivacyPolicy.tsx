import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Shield, UserCircle, BarChart3, Trash2 } from "lucide-react";
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
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-10 h-10 text-indigo-600" />
            <h1 className="text-4xl font-bold text-slate-900">Privacy Policy</h1>
          </div>
          <p className="text-slate-500 mb-8">Last updated: January 2026</p>

          <div className="prose prose-slate max-w-none">
            {/* Introduction */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">1. Introduction</h2>
              <p className="text-slate-600 leading-relaxed">
                Welcome to TechMap ("we," "our," or "us"). We are committed to protecting your privacy 
                and personal information. This Privacy Policy explains how we collect, use, disclose, 
                and safeguard your information when you visit our website and use our services.
              </p>
            </section>

            {/* Google Login - IMPORTANT FOR GOOGLE OAUTH */}
            <section className="mb-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <UserCircle className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-semibold text-slate-900">2. Google Sign-In</h2>
              </div>
              <p className="text-slate-700 leading-relaxed">
                When you sign in to TechMap using your Google account, we collect the following 
                information from your Google profile:
              </p>
              <ul className="list-disc list-inside text-slate-700 space-y-2 ml-4 mt-4">
                <li><strong>Your name</strong> - to personalize your experience</li>
                <li><strong>Email address</strong> - to identify your account and communicate with you</li>
                <li><strong>Profile picture</strong> - to display in your account</li>
              </ul>
              <p className="text-slate-700 leading-relaxed mt-4">
                This information is used solely for identifying you within our system and personalizing 
                your experience. We do not share this information with third parties for marketing purposes, 
                and we do not access any other data from your Google account.
              </p>
            </section>

            {/* PostHog Analytics - IMPORTANT FOR POSTHOG */}
            <section className="mb-8 bg-purple-50 border border-purple-200 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <BarChart3 className="w-6 h-6 text-purple-600" />
                <h2 className="text-2xl font-semibold text-slate-900">3. Analytics & Service Improvement (PostHog)</h2>
              </div>
              <p className="text-slate-700 leading-relaxed">
                We use PostHog, an analytics platform, to understand how users interact with our website. 
                This helps us identify issues, fix bugs, and improve your user experience.
              </p>
              <p className="text-slate-700 leading-relaxed mt-4">
                <strong>PostHog may collect:</strong>
              </p>
              <ul className="list-disc list-inside text-slate-700 space-y-2 ml-4 mt-2">
                <li>Page views and navigation patterns</li>
                <li>Click events and mouse movements</li>
                <li>Session recordings (visual replay of your interactions)</li>
                <li>Device and browser information</li>
                <li>IP address (anonymized)</li>
              </ul>
              <p className="text-slate-700 leading-relaxed mt-4">
                This data is used exclusively for improving our platform and is not sold or shared 
                with third parties for advertising purposes.
              </p>
            </section>

            {/* Data Deletion - IMPORTANT FOR GDPR & GOOGLE */}
            <section className="mb-8 bg-red-50 border border-red-200 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Trash2 className="w-6 h-6 text-red-600" />
                <h2 className="text-2xl font-semibold text-slate-900">4. Data Deletion</h2>
              </div>
              <p className="text-slate-700 leading-relaxed">
                You have the right to request deletion of your account and all associated personal data 
                at any time. To request data deletion, please send an email to:
              </p>
              <p className="mt-4">
                <a 
                  href="mailto:privacy@techmap.co.il" 
                  className="text-lg font-semibold text-red-600 hover:text-red-700 underline"
                >
                  privacy@techmap.co.il
                </a>
              </p>
              <p className="text-slate-700 leading-relaxed mt-4">
                Upon receiving your request, we will delete your account and all personal information 
                within 30 days. This includes your name, email address, profile picture, saved jobs, 
                and any other data associated with your account.
              </p>
            </section>

            {/* Information We Collect */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">5. Other Information We Collect</h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                In addition to the above, we may collect:
              </p>
              <ul className="list-disc list-inside text-slate-600 space-y-2 ml-4">
                <li><strong>Usage Data:</strong> Information about how you interact with our website, including pages visited and features used.</li>
                <li><strong>Device Information:</strong> Browser type, operating system, and device identifiers.</li>
                <li><strong>Saved Preferences:</strong> Job listings you save and search preferences.</li>
              </ul>
            </section>

            {/* How We Use Your Information */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">6. How We Use Your Information</h2>
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

            {/* Information Sharing */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">7. Information Sharing</h2>
              <p className="text-slate-600 leading-relaxed">
                We do not sell your personal information. We may share your information only in the 
                following circumstances:
              </p>
              <ul className="list-disc list-inside text-slate-600 space-y-2 ml-4 mt-4">
                <li>With your consent</li>
                <li>To comply with legal obligations</li>
                <li>To protect our rights and safety</li>
                <li>With service providers who assist in operating our platform (such as PostHog for analytics)</li>
              </ul>
            </section>

            {/* Data Security */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">8. Data Security</h2>
              <p className="text-slate-600 leading-relaxed">
                We implement appropriate technical and organizational security measures to protect 
                your personal information against unauthorized access, alteration, disclosure, or 
                destruction. However, no method of transmission over the Internet is 100% secure.
              </p>
            </section>

            {/* Cookies and Tracking */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">9. Cookies and Tracking</h2>
              <p className="text-slate-600 leading-relaxed">
                We use cookies and similar tracking technologies to enhance your experience, 
                analyze usage, and maintain your session. You can control cookies 
                through your browser settings, but this may affect the functionality of our service.
              </p>
            </section>

            {/* Your Rights */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">10. Your Rights</h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                Depending on your location, you may have the right to:
              </p>
              <ul className="list-disc list-inside text-slate-600 space-y-2 ml-4">
                <li>Access the personal information we hold about you</li>
                <li>Request correction of inaccurate information</li>
                <li>Request deletion of your personal information</li>
                <li>Object to or restrict processing of your data</li>
                <li>Data portability</li>
                <li>Withdraw consent at any time</li>
              </ul>
            </section>

            {/* Third-Party Services */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">11. Third-Party Services</h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                We use the following third-party services:
              </p>
              <ul className="list-disc list-inside text-slate-600 space-y-2 ml-4">
                <li><strong>Google OAuth:</strong> For secure sign-in authentication</li>
                <li><strong>PostHog:</strong> For analytics and product improvement</li>
                <li><strong>Supabase:</strong> For database and authentication services</li>
              </ul>
              <p className="text-slate-600 leading-relaxed mt-4">
                Each of these services has their own privacy policies. We encourage you to review them.
              </p>
            </section>

            {/* Changes to This Policy */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">12. Changes to This Policy</h2>
              <p className="text-slate-600 leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of any 
                changes by posting the new Privacy Policy on this page and updating the 
                "Last updated" date.
              </p>
            </section>

            {/* Contact Us */}
            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">13. Contact Us</h2>
              <p className="text-slate-600 leading-relaxed">
                If you have any questions about this Privacy Policy, our privacy practices, 
                or wish to exercise any of your rights, please contact us at:
              </p>
              <p className="mt-4">
                <a 
                  href="mailto:privacy@techmap.co.il" 
                  className="text-indigo-600 hover:text-indigo-700 underline font-medium"
                >
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
