import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TermsOfService() {
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
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Terms of Service</h1>
          <p className="text-slate-500 mb-8">Last updated: January 2026</p>

          <div className="prose prose-slate max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">1. Acceptance of Terms</h2>
              <p className="text-slate-600 leading-relaxed">
                By accessing and using TechMap ("the Service"), you accept and agree to be bound by 
                these Terms of Service. If you do not agree to these terms, please do not use our Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">2. Description of Service</h2>
              <p className="text-slate-600 leading-relaxed">
                TechMap is a job board platform that aggregates and displays tech job listings from 
                companies in Israel. We provide tools to search, filter, and save job listings, 
                as well as information about tech companies.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">3. User Accounts</h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                When you create an account with us, you must:
              </p>
              <ul className="list-disc list-inside text-slate-600 space-y-2 ml-4">
                <li>Provide accurate and complete information</li>
                <li>Maintain the security of your account credentials</li>
                <li>Notify us immediately of any unauthorized access</li>
                <li>Be responsible for all activities under your account</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">4. Acceptable Use</h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                You agree not to:
              </p>
              <ul className="list-disc list-inside text-slate-600 space-y-2 ml-4">
                <li>Use the Service for any unlawful purpose</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Scrape, harvest, or collect data without permission</li>
                <li>Interfere with or disrupt the Service</li>
                <li>Impersonate any person or entity</li>
                <li>Post false, misleading, or spam content</li>
                <li>Use automated systems without our written consent</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">5. Job Listings</h2>
              <p className="text-slate-600 leading-relaxed">
                Job listings displayed on TechMap are sourced from third-party companies and career 
                pages. We do not guarantee the accuracy, completeness, or availability of any job 
                listing. We are not responsible for the hiring decisions of any company, nor do we 
                guarantee employment outcomes.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">6. Company Submissions</h2>
              <p className="text-slate-600 leading-relaxed">
                If you submit information about a company, you represent that the information is 
                accurate and that you have the right to submit such information. We reserve the 
                right to review, modify, or remove any submitted content at our discretion.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">7. Intellectual Property</h2>
              <p className="text-slate-600 leading-relaxed">
                The Service and its original content, features, and functionality are owned by 
                TechMap and are protected by international copyright, trademark, and other 
                intellectual property laws. You may not copy, modify, or distribute our content 
                without permission.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">8. Disclaimer of Warranties</h2>
              <p className="text-slate-600 leading-relaxed">
                THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, 
                EITHER EXPRESS OR IMPLIED. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, 
                SECURE, OR ERROR-FREE.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">9. Limitation of Liability</h2>
              <p className="text-slate-600 leading-relaxed">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, TECHMAP SHALL NOT BE LIABLE FOR ANY 
                INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS 
                OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">10. Indemnification</h2>
              <p className="text-slate-600 leading-relaxed">
                You agree to indemnify and hold harmless TechMap and its officers, directors, 
                employees, and agents from any claims, damages, losses, or expenses arising from 
                your use of the Service or violation of these Terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">11. Termination</h2>
              <p className="text-slate-600 leading-relaxed">
                We may terminate or suspend your account and access to the Service immediately, 
                without prior notice, for conduct that we believe violates these Terms or is 
                harmful to other users, us, or third parties.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">12. Governing Law</h2>
              <p className="text-slate-600 leading-relaxed">
                These Terms shall be governed by and construed in accordance with the laws of 
                the State of Israel, without regard to its conflict of law provisions. Any 
                disputes shall be resolved in the courts of Tel Aviv, Israel.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">13. Changes to Terms</h2>
              <p className="text-slate-600 leading-relaxed">
                We reserve the right to modify these Terms at any time. We will notify users of 
                any material changes by posting the new Terms on this page. Your continued use 
                of the Service after changes constitutes acceptance of the new Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">14. Contact Us</h2>
              <p className="text-slate-600 leading-relaxed">
                If you have any questions about these Terms of Service, please contact us at{" "}
                <a href="mailto:legal@techmap.co.il" className="text-indigo-600 hover:text-indigo-700 underline">
                  legal@techmap.co.il
                </a>
              </p>
            </section>
          </div>
        </article>
      </div>
    </div>
  );
}
