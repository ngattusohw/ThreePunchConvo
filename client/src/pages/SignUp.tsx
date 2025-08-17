import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, X } from "lucide-react";
import { useAuth } from "@clerk/clerk-react";
import { Link } from "wouter";

const SignUp = () => {
  const { isSignedIn } = useAuth();

  const pricingTiers = [
    {
      name: "Free",
      price: "$0",
      period: "",
      badge: null,
      features: [
        { name: "Can scroll forums and view posts", included: true },
        { name: "Can view ranked/top users", included: true },
        { name: "Can like member posts", included: true },
        { name: "Accumulate fight cred", included: false },
        { name: "See pro fighter posts", included: false },
        { name: "Reply to Pro Fighter posts", included: false },
        { name: "Vote in robbery insurance polls", included: false },
      ],
      buttonText: "Start Free",
      buttonVariant: "outline" as const,
    },
    {
      name: "Premium Monthly",
      price: "$4.99",
      period: "per month",
      badge: "Most Popular",
      badgeColor: "bg-ufc-blue",
      features: [
        { name: "Everything in Free", included: true },
        { name: "See pro fighter posts", included: true },
        { name: "Reply to Pro Fighter posts", included: true },
        { name: "Accumulate fight cred", included: true },
        { name: "Early access to new features", included: true },
        { name: "Vote in robbery insurance polls", included: true },
        { name: "Support active fighters", included: true },
      ],
      buttonText: "Choose Monthly",
      buttonVariant: "primary" as const,
    },
    {
      name: "Premium Yearly",
      price: "$49.99",
      period: "per year",
      badge: "MOST VALUE",
      badgeColor: "bg-green-500",
      features: [
        { name: "Everything in Free", included: true },
        { name: "See pro fighter posts", included: true },
        { name: "Reply to Pro Fighter posts", included: true },
        { name: "Accumulate fight cred", included: true },
        { name: "Early access to new features", included: true },
        { name: "Vote in robbery insurance polls", included: true },
        { name: "Support active fighters", included: true },
      ],
      buttonText: "Choose Yearly",
      buttonVariant: "primary" as const,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-900 py-16 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-ufc-blue mb-4">
            Choose Your 3PunchConvo Plan Below:
          </h1>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {pricingTiers.map((tier, index) => (
            <Card
              key={tier.name}
              className={`bg-slate-800 border-slate-700 text-white relative ${
                tier.badge ? "border-ufc-blue shadow-lg shadow-ufc-blue/20" : ""
              }`}
            >
              {tier.badge && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span
                    className={`${tier.badgeColor} text-white px-4 py-2 rounded-full text-sm font-bold`}
                  >
                    {tier.badge}
                  </span>
                </div>
              )}
              
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl font-bold text-white mb-2">
                  {tier.name}
                </CardTitle>
                {tier.subtitle && (
                  <p className="text-slate-400 text-sm mb-4">{tier.subtitle}</p>
                )}
                <div className="mb-6">
                  <span className="text-4xl font-bold text-ufc-blue">
                    {tier.price}
                  </span>
                  {tier.period && (
                    <span className="text-slate-400 ml-2">{tier.period}</span>
                  )}
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                {/* Features List */}
                <div className="space-y-4 mb-8">
                  {tier.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-center gap-3">
                      {feature.included ? (
                        <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                      ) : (
                        <X className="h-5 w-5 text-red-500 flex-shrink-0" />
                      )}
                      <span className="text-sm text-slate-300">
                        {feature.name}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Action Button */}
                <div className="mt-auto">
                  {isSignedIn ? (
                    <Link href="/checkout">
                      <button
                        className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors ${
                          tier.buttonVariant === "primary"
                            ? "bg-ufc-blue hover:bg-ufc-blue/90 text-black"
                            : "border border-slate-600 text-white hover:bg-slate-700"
                        }`}
                      >
                        {tier.buttonText}
                      </button>
                    </Link>
                  ) : (
                    <Link href="/auth">
                      <button
                        className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors ${
                          tier.buttonVariant === "primary"
                            ? "bg-ufc-blue hover:bg-ufc-blue/90 text-black"
                            : "border border-slate-600 text-white hover:bg-slate-700"
                        }`}
                      >
                        Sign Up to Get Started
                      </button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Additional Info */}
        <div className="text-center mt-16">
          <p className="text-slate-400 text-sm">
            All plans include access to the 3PunchConvo community forum
          </p>
          <p className="text-slate-400 text-sm mt-2">
            Cancel anytime • No hidden fees • 7-day money back guarantee
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUp; 