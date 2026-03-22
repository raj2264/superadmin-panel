export default function DeleteAccountPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Delete Your Account - My Society Details</h1>

        <div className="space-y-6 text-gray-700">
          <section>
            <p className="mb-4">To request deletion of your account and associated data:</p>
            <ul className="list-disc list-inside space-y-2">
              <li>
                Send an email to:{' '}
                <a href="mailto:mysocietydetails7@gmail.com" className="text-blue-600 hover:underline">
                  mysocietydetails7@gmail.com
                </a>
              </li>
              <li>Use subject: "Delete My Account"</li>
              <li>Include your registered email or phone number</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">What will be deleted:</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>Your profile information</li>
              <li>Login credentials</li>
              <li>Society association</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">What may be retained:</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>Billing records (if required for legal compliance)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Retention period:</h2>
            <p>Data will be deleted within 7-15 working days after verification.</p>
          </section>
        </div>
      </div>
    </div>
  );
}