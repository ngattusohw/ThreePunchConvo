import React from "react";

export default function PrivacyPolicy() {
  return (
    <div className='min-h-screen overflow-x-hidden bg-gray-900 text-white'>
      {/* Privacy Policy Content */}
      <section className='bg-gray-800/50 px-4 py-20'>
        <div className='container mx-auto max-w-4xl'>
          {/* Header */}
          <div className='mb-16 text-center'>
            <h1 className='mb-4 text-3xl font-bold md:text-4xl'>
              3PunchConvo Privacy Policy
            </h1>
            <p className='text-gray-400'>
              <strong>Effective Date:</strong> 6/18/25
            </p>
          </div>

          {/* Privacy Policy Content */}
          <div className='prose prose-invert max-w-none space-y-8'>
            {/* Introduction */}
            <div className='rounded-lg border border-gray-700 bg-gray-800/50 p-8'>
              <p className='leading-relaxed text-gray-300'>
                3PunchConvo, Inc. ("Company", "we", "us", or "our") respects
                your privacy and is committed to protecting it through this
                Privacy Policy. This Policy outlines the types of personal
                information we may collect from you, how we use it, and your
                rights in relation to that information.
              </p>
            </div>

            {/* Section 1: Definitions */}
            <div className='rounded-lg border border-gray-700 bg-gray-800/50 p-8'>
              <h2 className='mb-6 text-2xl font-bold text-cyan-400'>
                1. Definitions
              </h2>
              <p className='mb-4 text-gray-300'>
                For the purposes of this Privacy Policy:
              </p>
              <ul className='space-y-3 text-gray-300'>
                <li>
                  <strong>"Platform"</strong> refers to the 3PunchConvo website,
                  mobile experiences, and any related services offered by
                  3PunchConvo, Inc.
                </li>
                <li>
                  <strong>"User", "you", or "your"</strong> refers to any person
                  who accesses or uses the Platform.
                </li>
                <li>
                  <strong>"Personal Information"</strong> means any data that
                  identifies or can be used to identify an individual, directly
                  or indirectly.
                </li>
                <li>
                  <strong>"Processing"</strong> means any operation performed on
                  Personal Information, whether by automated means or otherwise,
                  such as collection, recording, organization, storage,
                  adaptation, retrieval, use, disclosure, or deletion.
                </li>
                <li>
                  <strong>"Stripe"</strong> refers to our third-party payment
                  processor, which handles all transactions on our behalf.
                </li>
                <li>
                  <strong>"Klaviyo"</strong> refers to our third-party email and
                  marketing automation provider used to manage communications
                  and campaigns.
                </li>
                <li>
                  <strong>"Content"</strong> refers to any text, images, videos,
                  posts, or other materials submitted by users to the Platform.
                </li>
                <li>
                  <strong>"Cookies"</strong> are small pieces of data stored on
                  your device that help improve user experience and track
                  Platform usage.
                </li>
                <li>
                  <strong>"GDPR"</strong> refers to the General Data Protection
                  Regulation (EU) 2016/679.
                </li>
                <li>
                  <strong>"CalOPPA"</strong> refers to the California Online
                  Privacy Protection Act.
                </li>
              </ul>
            </div>

            {/* Section 2: Information We Collect */}
            <div className='rounded-lg border border-gray-700 bg-gray-800/50 p-8'>
              <h2 className='mb-6 text-2xl font-bold text-cyan-400'>
                2. Information We Collect
              </h2>
              <p className='mb-4 text-gray-300'>
                We collect information directly and indirectly when you interact
                with our platform, including:
              </p>
              <ul className='space-y-3 text-gray-300'>
                <li>
                  <strong>Personal Information:</strong> Name, email address,
                  username, profile information, payment data (handled by
                  Stripe).
                </li>
                <li>
                  <strong>Technical Data:</strong> IP address, device type,
                  browser type, referring URLs, and usage statistics.
                </li>
                <li>
                  <strong>Engagement Data:</strong> Forum posts, poll responses,
                  interaction activity.
                </li>
                <li>
                  <strong>Marketing Data:</strong> Your subscription preferences
                  and communications, collected via Klaviyo.
                </li>
              </ul>
            </div>

            {/* Section 3: How We Use Your Information */}
            <div className='rounded-lg border border-gray-700 bg-gray-800/50 p-8'>
              <h2 className='mb-6 text-2xl font-bold text-cyan-400'>
                3. How We Use Your Information
              </h2>
              <p className='mb-4 text-gray-300'>
                We may use your information for:
              </p>
              <ul className='space-y-2 text-gray-300'>
                <li>• Creating and managing your user account</li>
                <li>• Enabling forum interactions and social features</li>
                <li>• Processing payments and subscriptions via Stripe</li>
                <li>
                  • Sending emails and promotional updates through Klaviyo
                </li>
                <li>
                  • Improving our platform functionality, user experience, and
                  customer service
                </li>
                <li>• Complying with legal obligations</li>
              </ul>
            </div>

            {/* Section 4: How We Share Your Information */}
            <div className='rounded-lg border border-gray-700 bg-gray-800/50 p-8'>
              <h2 className='mb-6 text-2xl font-bold text-cyan-400'>
                4. How We Share Your Information
              </h2>
              <p className='mb-4 text-gray-300'>
                We do not sell your personal data. We may share it with trusted
                third parties under contract with us, including:
              </p>
              <ul className='space-y-2 text-gray-300'>
                <li>• Stripe for secure payment processing</li>
                <li>• Klaviyo for email marketing and automation</li>
                <li>
                  • Web hosting, analytics, and operational service providers
                </li>
                <li>
                  • Legal or governmental authorities when required by law
                </li>
              </ul>
            </div>

            {/* Section 5: Cookies & Tracking Technologies */}
            <div className='rounded-lg border border-gray-700 bg-gray-800/50 p-8'>
              <h2 className='mb-6 text-2xl font-bold text-cyan-400'>
                5. Cookies & Tracking Technologies
              </h2>
              <p className='text-gray-300'>
                We use cookies and similar technologies to enhance your
                experience, analyze site usage, and deliver targeted content.
                You can manage cookie preferences in your browser settings.
              </p>
            </div>

            {/* Section 6: Your Privacy Rights */}
            <div className='rounded-lg border border-gray-700 bg-gray-800/50 p-8'>
              <h2 className='mb-6 text-2xl font-bold text-cyan-400'>
                6. Your Privacy Rights
              </h2>

              <div className='space-y-6'>
                <div className='rounded-lg border border-blue-700 bg-blue-900/20 p-6'>
                  <h3 className='mb-4 text-lg font-semibold text-blue-400'>
                    If You Are in the United States (CalOPPA):
                  </h3>
                  <ul className='space-y-2 text-sm text-gray-300'>
                    <li>
                      • You have the right to know what personal information we
                      collect and how we use it.
                    </li>
                    <li>
                      • You can request to review or correct your personal data
                      by contacting us.
                    </li>
                    <li>
                      • Our website does not currently respond to Do Not Track
                      (DNT) signals.
                    </li>
                  </ul>
                </div>

                <div className='rounded-lg border border-green-700 bg-green-900/20 p-6'>
                  <h3 className='mb-4 text-lg font-semibold text-green-400'>
                    If You Are in the European Union or United Kingdom (GDPR):
                  </h3>
                  <p className='mb-3 text-gray-300'>You have the right to:</p>
                  <ul className='mb-4 space-y-2 text-sm text-gray-300'>
                    <li>• Access, correct, or delete your personal data</li>
                    <li>• Withdraw consent at any time</li>
                    <li>• Object to or restrict processing</li>
                    <li>• Receive a copy of your data in a portable format</li>
                    <li>
                      • File a complaint with your local data protection
                      authority
                    </li>
                  </ul>
                  <p className='text-sm text-gray-300'>
                    We process your personal data under the following legal
                    bases: your consent, the performance of a contract,
                    compliance with legal obligations, and our legitimate
                    interests. Your data may be transferred outside the EEA/UK
                    (e.g., to the U.S.) with appropriate safeguards in place. To
                    exercise your rights or for more information, contact us at{" "}
                    <a
                      href='mailto:support@3punchconvo.com'
                      className='text-green-400 hover:text-green-300'
                    >
                      support@3punchconvo.com
                    </a>
                    .
                  </p>
                </div>
              </div>
            </div>

            {/* Section 7: Data Retention */}
            <div className='rounded-lg border border-gray-700 bg-gray-800/50 p-8'>
              <h2 className='mb-6 text-2xl font-bold text-cyan-400'>
                7. Data Retention
              </h2>
              <p className='text-gray-300'>
                We retain your data only as long as necessary for legitimate
                business purposes or to comply with legal requirements. You may
                request deletion at any time.
              </p>
            </div>

            {/* Section 8: International Data Transfers */}
            <div className='rounded-lg border border-gray-700 bg-gray-800/50 p-8'>
              <h2 className='mb-6 text-2xl font-bold text-cyan-400'>
                8. International Data Transfers
              </h2>
              <p className='text-gray-300'>
                By using our platform, you consent to the transfer of your data
                to servers in the United States, where privacy laws may differ
                from those in your country of residence.
              </p>
            </div>

            {/* Section 9: Children's Privacy */}
            <div className='rounded-lg border border-gray-700 bg-gray-800/50 p-8'>
              <h2 className='mb-6 text-2xl font-bold text-cyan-400'>
                9. Children's Privacy
              </h2>
              <p className='text-gray-300'>
                3PunchConvo is not intended for users under the age of 13 (or 16
                in the EU). We do not knowingly collect personal data from
                children.
              </p>
            </div>

            {/* Section 10: Data Security */}
            <div className='rounded-lg border border-gray-700 bg-gray-800/50 p-8'>
              <h2 className='mb-6 text-2xl font-bold text-cyan-400'>
                10. Data Security
              </h2>
              <p className='text-gray-300'>
                We take reasonable administrative, technical, and physical
                measures to protect your information from loss, theft, misuse,
                or unauthorized access.
              </p>
            </div>

            {/* Section 11: User Content and Public Visibility */}
            <div className='rounded-lg border border-gray-700 bg-gray-800/50 p-8'>
              <h2 className='mb-6 text-2xl font-bold text-cyan-400'>
                11. User Content and Public Visibility
              </h2>
              <p className='mb-4 text-gray-300'>
                When you post content on 3PunchConvo — including forum comments,
                replies, media uploads, and other interactions — you understand
                that this content is publicly visible to other users of the
                platform. By submitting content, you grant 3PunchConvo, Inc. a
                non-exclusive, royalty-free, worldwide license to use,
                reproduce, modify, distribute, and publicly display your content
                in connection with the operation, promotion, and improvement of
                the platform.
              </p>
              <p className='mb-4 text-gray-300'>
                This includes, but is not limited to, use of content in:
              </p>
              <ul className='mb-4 space-y-2 text-gray-300'>
                <li>• Marketing materials</li>
                <li>• Social media posts</li>
                <li>• Promotional videos or campaigns</li>
                <li>• Editorial or community highlights</li>
              </ul>
              <p className='font-semibold text-cyan-400'>
                Please do not post any information that you wish to remain
                confidential or do not want others to view publicly.
              </p>
            </div>

            {/* Section 12: Changes to This Policy */}
            <div className='rounded-lg border border-gray-700 bg-gray-800/50 p-8'>
              <h2 className='mb-6 text-2xl font-bold text-cyan-400'>
                12. Changes to This Policy
              </h2>
              <p className='text-gray-300'>
                We may update this Privacy Policy from time to time. Changes
                will be posted to this page with an updated effective date.
              </p>
            </div>

            {/* Section 13: Links to Other Websites */}
            <div className='rounded-lg border border-gray-700 bg-gray-800/50 p-8'>
              <h2 className='mb-6 text-2xl font-bold text-cyan-400'>
                13. Links to Other Websites
              </h2>
              <p className='text-gray-300'>
                Our Service may contain links to other websites that are not
                operated by Us. If you click on a third party link, you will be
                directed to that third party's site. We strongly advise you to
                review the Privacy Policy of every site that you visit.
              </p>
              <p className='mt-4 text-gray-300'>
                We have no control over and assume no responsibility for the
                content, privacy policies or practices of any third party sites
                or services.
              </p>
            </div>

            {/* Section 14: Contact Us */}
            <div className='rounded-lg border border-gray-700 bg-gray-800/50 p-8'>
              <h2 className='mb-6 text-2xl font-bold text-cyan-400'>
                14. Contact Us
              </h2>
              <p className='mb-4 text-gray-300'>
                If you have questions about this Privacy Policy or wish to
                exercise your rights, please contact:
              </p>
              <div className='text-gray-300'>
                <p>
                  <strong>3PunchConvo, Inc.</strong>
                </p>
                <p>416 Market St, Suite 207, Lewisburg PA 17837</p>
                <p>
                  Email:{" "}
                  <a
                    href='mailto:support@3punchconvo.com'
                    className='text-cyan-400 hover:text-cyan-300'
                  >
                    support@3punchconvo.com
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
