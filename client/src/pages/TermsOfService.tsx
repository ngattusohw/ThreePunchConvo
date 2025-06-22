import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import {
  Users,
  MessageSquare,
  Trophy,
  Target,
  Zap,
  Shield,
  Quote,
  Check,
  X,
} from "lucide-react";
import logoImage from "@/assets/3PC-Logo-FullColor-RGB.png";
import { SignIn, useAuth } from "@clerk/clerk-react";
import { Link, useLocation } from "wouter";
import { dark } from "@clerk/themes";

export default function TermsOfService() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-gray-900 text-white">
      {/* Terms of Service Content */}
      <section className="bg-gray-800/50 px-4 py-20">
        <div className="container mx-auto max-w-4xl">
          {/* Header */}
          <div className="mb-16 text-center">
            <h1 className="mb-4 text-3xl font-bold md:text-4xl">
              3PunchConvo Terms of Use
            </h1>
            <p className="text-gray-400">
              <strong>Effective Date:</strong> 6/18/25
            </p>
          </div>

          {/* Terms Content */}
          <div className="prose prose-invert max-w-none space-y-8">
            {/* Introduction */}
            <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-8">
              <p className="leading-relaxed text-gray-300">
                Welcome to 3PunchConvo, operated by 3PunchConvo, Inc.
                ("Company," "we," "us," or "our"). These Terms of Use ("Terms")
                govern your access to and use of the 3PunchConvo platform,
                including our website, services, and features (collectively, the
                "Service").
              </p>
              <p className="mt-4 leading-relaxed text-gray-300">
                By using 3PunchConvo, you agree to be bound by these Terms. If
                you do not agree, please do not use our Service.
              </p>
            </div>

            {/* Section 1: Definitions */}
            <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-8">
              <h2 className="mb-6 text-2xl font-bold text-cyan-400">
                1. Definitions
              </h2>
              <p className="mb-4 text-gray-300">
                For the purposes of these Terms of Use:
              </p>
              <ul className="space-y-3 text-gray-300">
                <li>
                  <strong>"Company," "we," "us," or "our"</strong> refers to
                  3PunchConvo, Inc.
                </li>
                <li>
                  <strong>"Platform"</strong> refers to the 3PunchConvo website,
                  mobile experiences, and any related services or features we
                  provide.
                </li>
                <li>
                  <strong>"User," "you," or "your"</strong> means any person who
                  creates an account, accesses, or interacts with the Platform.
                </li>
                <li>
                  <strong>"Content"</strong> means any text, images, video,
                  posts, messages, or other materials shared or submitted by
                  users on the Platform.
                </li>
                <li>
                  <strong>"Service"</strong> refers to all features,
                  functionalities, and experiences available on the Platform.
                </li>
                <li>
                  <strong>"Verified Fighter Account"</strong> refers to an
                  account belonging to a professional combat sports athlete who
                  has been officially verified by 3PunchConvo.
                </li>
                <li>
                  <strong>"Fight Cred"</strong> refers to a non-monetary
                  recognition system that reflects a user's contributions and
                  engagement on the Platform.
                </li>
                <li>
                  <strong>"Stripe"</strong> refers to our third-party payment
                  processor.
                </li>
                <li>
                  <strong>"Klaviyo"</strong> refers to our email and marketing
                  automation platform.
                </li>
              </ul>
            </div>

            {/* Section 2: Eligibility */}
            <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-8">
              <h2 className="mb-6 text-2xl font-bold text-cyan-400">
                2. Eligibility
              </h2>
              <p className="text-gray-300">
                You must be at least 13 years old to use our platform. If you
                are under the age of 18, you must have parental or legal
                guardian permission.
              </p>
            </div>

            {/* Section 3: Account Registration */}
            <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-8">
              <h2 className="mb-6 text-2xl font-bold text-cyan-400">
                3. Account Registration
              </h2>
              <p className="text-gray-300">
                You are responsible for maintaining the confidentiality of your
                login credentials and for any activity that occurs under your
                account.
              </p>
            </div>

            {/* Section 4: Platform Use and User Content */}
            <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-8">
              <h2 className="mb-6 text-2xl font-bold text-cyan-400">
                4. Platform Use and User Content
              </h2>
              <p className="mb-4 text-gray-300">
                You are solely responsible for the content you post on the
                platform, including forum posts, replies, images, and other
                media. By posting on 3PunchConvo, you grant us a non-exclusive,
                royalty-free, worldwide license to use, display, reproduce, and
                distribute your content for promotional and operational
                purposes, including across social media and marketing materials.
              </p>
              <p className="text-gray-300">
                By posting or uploading content to the platform, you acknowledge
                that it may be publicly visible and may be featured across our
                services, social media, promotional campaigns, and editorial
                content. You represent that you have the necessary rights to
                share any content you post, and that it does not infringe on any
                third-party rights.
              </p>
            </div>

            {/* Section 5: Code of Conduct */}
            <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-8">
              <h2 className="mb-6 text-2xl font-bold text-cyan-400">
                5. Code of Conduct
              </h2>
              <p className="mb-6 text-gray-300">
                3PunchConvo is a space for passionate, respectful conversation
                about combat sports. We're here to build a community. By using
                the platform, you agree to uphold the following standards:
              </p>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-lg border border-green-700 bg-green-900/20 p-6">
                  <h3 className="mb-4 flex items-center text-lg font-semibold text-green-400">
                    <Check className="mr-2 h-5 w-5" />
                    What's Cool:
                  </h3>
                  <ul className="space-y-2 text-sm text-gray-300">
                    <li>
                      • Sharing insights, stories, and experiences that elevate
                      the fight game
                    </li>
                    <li>• Healthy debate, not personal attacks</li>
                    <li>• Using your voice to contribute, not dominate</li>
                    <li>
                      • Following the spirit of martial arts: discipline,
                      respect and growth
                    </li>
                    <li>• Respecting all users - fans and fighters alike</li>
                  </ul>
                </div>

                <div className="rounded-lg border border-red-700 bg-red-900/20 p-6">
                  <h3 className="mb-4 flex items-center text-lg font-semibold text-red-400">
                    <X className="mr-2 h-5 w-5" />
                    What's Not Cool:
                  </h3>
                  <ul className="space-y-2 text-sm text-gray-300">
                    <li>• Harassment, hate speech, or threatening behavior</li>
                    <li>
                      • Bigotry of any kind (racism, sexism, homophobia, etc.)
                    </li>
                    <li>
                      • Spam, self-promotion, or repetitive off-topic posts
                    </li>
                    <li>• Impersonating fighters, users, or moderators</li>
                  </ul>
                </div>
              </div>

              <p className="mt-6 text-gray-300">
                Violating the Code of Conduct may result in the removal of
                content, temporary suspension, or permanent account bans. We
                reserve the right to take any of these actions at any time, at
                our sole discretion.
              </p>
              <p className="mt-4 font-semibold text-cyan-400">
                Don't be a jerk. Let's keep 3PC a space where real fans & real
                fighters want to show up.
              </p>
            </div>

            {/* Section 6: Prohibited Conduct */}
            <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-8">
              <h2 className="mb-6 text-2xl font-bold text-cyan-400">
                6. Prohibited Conduct
              </h2>
              <p className="mb-4 text-gray-300">You agree not to:</p>
              <ul className="space-y-2 text-gray-300">
                <li>
                  • Post or share hate speech, bigotry, threats, or harassment
                </li>
                <li>• Use the Service for illegal purposes</li>
                <li>• Impersonate any person or entity</li>
                <li>• Attempt to disrupt or harm the platform or its users</li>
                <li>• Spam, self-promotion, or repetitive off-topic posts</li>
              </ul>
              <p className="mt-4 text-gray-300">
                We reserve the right to moderate and remove any content or
                accounts that violate these rules.
              </p>
            </div>

            {/* Section 7: Subscriptions and Payments */}
            <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-8">
              <h2 className="mb-6 text-2xl font-bold text-cyan-400">
                7. Subscriptions and Payments
              </h2>
              <p className="text-gray-300">
                We use Stripe to process payments securely. By subscribing, you
                agree to the pricing and billing terms presented to you at the
                time of purchase. Subscription plans may renew automatically
                unless canceled prior to the renewal date.
              </p>
            </div>

            {/* Section 8: Email Communication */}
            <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-8">
              <h2 className="mb-6 text-2xl font-bold text-cyan-400">
                8. Email Communication
              </h2>
              <p className="text-gray-300">
                We use Klaviyo to manage our email marketing. By creating an
                account or subscribing, you consent to receive occasional
                updates, marketing communications, and community announcements.
                You may opt out at any time.
              </p>
            </div>

            {/* Section 9: Fighter Revenue Sharing */}
            <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-8">
              <h2 className="mb-6 text-2xl font-bold text-cyan-400">
                9. Fighter Revenue Sharing
              </h2>
              <p className="text-gray-300">
                Verified fighter accounts may participate in our revenue-sharing
                model. Payouts are based on a formula determined by the Company
                and may change over time. Fighters must maintain good standing
                and meet minimum engagement requirements to be eligible.
              </p>
            </div>

            {/* Section 10: Intellectual Property */}
            <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-8">
              <h2 className="mb-6 text-2xl font-bold text-cyan-400">
                10. Intellectual Property
              </h2>
              <p className="text-gray-300">
                All content and branding on 3PunchConvo not posted by users
                (including logos, design elements, and platform features) are
                the exclusive property of the Company.
              </p>
            </div>

            {/* Section 11: Termination */}
            <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-8">
              <h2 className="mb-6 text-2xl font-bold text-cyan-400">
                11. Termination
              </h2>
              <p className="text-gray-300">
                We reserve the right to suspend or terminate your account at any
                time for any reason, including violations of these Terms.
              </p>
            </div>

            {/* Section 12: Disclaimers */}
            <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-8">
              <h2 className="mb-6 text-2xl font-bold text-cyan-400">
                12. Disclaimers
              </h2>
              <p className="text-gray-300">
                The platform is provided "as is" without warranties of any kind.
                We do not guarantee uninterrupted service or error-free
                performance.
              </p>
            </div>

            {/* Section 13: Limitation of Liability */}
            <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-8">
              <h2 className="mb-6 text-2xl font-bold text-cyan-400">
                13. Limitation of Liability
              </h2>
              <p className="text-gray-300">
                To the fullest extent permitted by law, we shall not be liable
                for any indirect, incidental, special, or consequential damages
                resulting from your use of the Service.
              </p>
            </div>

            {/* Section 14: Governing Law */}
            <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-8">
              <h2 className="mb-6 text-2xl font-bold text-cyan-400">
                14. Governing Law
              </h2>
              <p className="text-gray-300">
                These Terms are governed by the laws of the State of Delaware,
                without regard to conflict of law principles.
              </p>
            </div>

            {/* Section 15: Bans and Refund Policy */}
            <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-8">
              <h2 className="mb-6 text-2xl font-bold text-cyan-400">
                15. Bans and Refund Policy
              </h2>
              <p className="mb-4 text-gray-300">
                We reserve the right to ban or suspend users who engage in
                hostile, abusive, or disruptive behavior, as determined at our
                sole discretion. If your account is banned while you have an
                active paid subscription:
              </p>
              <ul className="space-y-2 text-gray-300">
                <li>
                  • Monthly subscribers will receive a full refund of their most
                  recent monthly payment.
                </li>
                <li>
                  • Annual subscribers will receive a prorated refund based on
                  the unused portion of their subscription, including the
                  current month and any remaining full months in the billing
                  period.
                </li>
                <li>
                  • In both cases, your subscription will be canceled
                  immediately following the account ban.
                </li>
              </ul>
            </div>

            {/* Section 16: User Rankings and Recognition */}
            <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-8">
              <h2 className="mb-6 text-2xl font-bold text-cyan-400">
                16. User Rankings and Recognition
              </h2>
              <p className="text-gray-300">
                As part of our community engagement features, users may earn
                "Fight Cred" or other recognition based on their platform
                activity. These rankings are for entertainment and engagement
                purposes only and have no monetary value unless explicitly
                stated. We reserve the right to modify, reset, or discontinue
                the ranking system at any time.
              </p>
            </div>

            {/* Section 17: Changes to the Terms */}
            <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-8">
              <h2 className="mb-6 text-2xl font-bold text-cyan-400">
                17. Changes to the Terms
              </h2>
              <p className="text-gray-300">
                We may update these Terms from time to time. We will notify
                users of any material changes. Continued use of the platform
                after changes are made constitutes your acceptance of the new
                Terms.
              </p>
            </div>

            {/* Section 18: International Use */}
            <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-8">
              <h2 className="mb-6 text-2xl font-bold text-cyan-400">
                18. International Use
              </h2>
              <p className="text-gray-300">
                Our Service is operated from the United States and may not be
                subject to the laws of your jurisdiction. If you access the
                Service from outside the U.S., you do so at your own risk and
                are responsible for compliance with any local laws. You agree
                that any data you provide may be transferred to and processed in
                the United States.
              </p>
            </div>

            {/* Section 19: Indemnification */}
            <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-8">
              <h2 className="mb-6 text-2xl font-bold text-cyan-400">
                19. Indemnification
              </h2>
              <p className="text-gray-300">
                You agree to indemnify and hold harmless 3PunchConvo, Inc., its
                affiliates, officers, directors, and employees from and against
                any claims, liabilities, damages, losses, and expenses
                (including legal fees) arising out of or in any way connected
                with your use of the Service, your content, and your violation
                of these Terms.
              </p>
            </div>

            {/* Section 20: Contact Us */}
            <div
              className="rounded-lg border border-gray-700 bg-gray-800/50 p-8"
              id="contact-us"
            >
              <h2 className="mb-6 text-2xl font-bold text-cyan-400">
                20. Contact Us
              </h2>
              <p className="mb-4 text-gray-300">
                If you have questions about these Terms, please contact us at:
              </p>
              <div className="text-gray-300">
                <p>
                  <strong>3PunchConvo, Inc.</strong>
                </p>
                <p>416 Market St, Suite 207, Lewisburg PA 17837</p>
                <p>
                  Email:{" "}
                  <a
                    href="mailto:support@3punchconvo.com"
                    className="text-cyan-400 hover:text-cyan-300"
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
