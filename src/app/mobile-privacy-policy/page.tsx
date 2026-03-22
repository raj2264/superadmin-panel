export default function MobilePrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">MySocietyDetails Mobile App Privacy Policy</h1>
        <p className="text-sm text-gray-600 mb-8">
          Applicable app package: <strong>com.anonymous.MySocietyApp</strong>
        </p>

        <div className="space-y-6 text-gray-700">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Introduction</h2>
            <p>
              MySocietyDetails ("we", "us", or "our") operates the MySocietyDetails mobile application.
              This page explains how we collect, use, and protect your personal data when you use the app.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Information We Collect</h2>
            <ul className="list-disc list-inside space-y-2">
              <li><strong>Account Data:</strong> Name, email, phone number, flat/unit details</li>
              <li><strong>Society Usage Data:</strong> Complaints, bookings, notices, and request activity</li>
              <li><strong>Payment Metadata:</strong> Transaction references from Razorpay (no full card storage)</li>
              <li><strong>Technical Data:</strong> Device type, app version, IP address, crash logs</li>
              <li><strong>Permission-based Data:</strong> Camera access only where required for app features</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Why We Use Data</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>Provide core society-management features</li>
              <li>Process requests, announcements, and community operations</li>
              <li>Enable secure payments and transaction tracking</li>
              <li>Improve performance, reliability, and fraud prevention</li>
              <li>Comply with legal and regulatory obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Data Sharing</h2>
            <p>
              We use trusted service providers such as Supabase (backend) and Razorpay (payments).
              These providers process data under their own policies and security controls.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Data Retention</h2>
            <p>
              We keep personal data only as long as needed for service delivery, records, and legal compliance.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Your Rights</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>Access your data</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion (subject to legal/operational requirements)</li>
              <li>Request restriction or objection to certain processing</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Security</h2>
            <p>
              We apply reasonable technical and organizational safeguards; however, no internet-based system can
              guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Policy Updates</h2>
            <p>
              We may update this policy from time to time. Material updates will be reflected on this page.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Contact</h2>
            <p>
              For privacy requests or questions, contact
              <a href="mailto:mysocietydetails7@gmail.com" className="text-blue-600 hover:underline ml-1">
                mysocietydetails7@gmail.com
              </a>
            </p>
          </section>

          <p className="text-sm text-gray-500 mt-8 pt-6 border-t">Last updated: March 22, 2026</p>
        </div>
      </div>
    </div>
  );
}