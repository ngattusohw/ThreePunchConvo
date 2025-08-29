import React from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { SignUp } from "@clerk/clerk-react";
import { dark } from "@clerk/themes";
import { fetchFighterInvitation } from "@/api/queries/admin";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Star, Users, Zap } from "lucide-react";

export default function FighterSignup() {
  const [location] = useLocation();
  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const token = urlParams.get('token');
  
  const { data: invitation, isLoading, error } = useQuery({
    queryKey: ['fighter-invitation', token],
    queryFn: () => fetchFighterInvitation(token!),
    enabled: !!token,
    retry: false, // Don't retry on invalid tokens
  });

  if (!token) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <Card className="bg-slate-800 border-slate-700 text-white max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="text-red-500 mb-4">
              <Shield className="h-12 w-12 mx-auto" />
            </div>
            <h2 className="text-xl font-bold mb-2">Invalid Invitation</h2>
            <p className="text-slate-400 mb-6">
              This invitation link is invalid or missing a token.
            </p>
            <Button 
              onClick={() => window.location.href = '/auth'}
              className="w-full"
            >
              Go to Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className='border-ufc-blue h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 mx-auto mb-4'></div>
          <p className="text-white">Verifying invitation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <Card className="bg-slate-800 border-slate-700 text-white max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="text-red-500 mb-4">
              <Shield className="h-12 w-12 mx-auto" />
            </div>
            <h2 className="text-xl font-bold mb-2">Invalid or Expired Invitation</h2>
            <p className="text-slate-400 mb-6">
              This fighter invitation is invalid, expired, or has already been used.
            </p>
            <Button 
              onClick={() => window.location.href = '/auth'}
              className="w-full"
            >
              Go to Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          
          {/* Left Side - Invitation Details & Benefits */}
          <div className="space-y-8">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center bg-red-600/10 border border-red-600/20 rounded-full px-4 py-2 mb-6">
                <Star className="h-4 w-4 text-red-500 mr-2" />
                <span className="text-red-400 text-sm font-medium">Exclusive Fighter Invitation</span>
              </div>
              
              <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4">
                Welcome to 3PunchConvo
              </h1>
              <p className="text-xl text-slate-300 mb-6">
                You've been invited to join as a verified fighter
              </p>
            </div>

            {/* Invitation Details */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Shield className="h-5 w-5 text-red-500 mr-2" />
                  Your Invitation Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <span className="text-slate-400">Email:</span>
                  <span className="text-white ml-2 font-medium">{invitation.email}</span>
                </div>
                {invitation.fighterName && (
                  <div>
                    <span className="text-slate-400">Fighter Name:</span>
                    <span className="text-white ml-2 font-medium">{invitation.fighterName}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Fighter Benefits */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-white">Fighter Benefits:</h3>
              <div className="grid gap-3">
                {[
                  {
                    icon: Shield,
                    title: "Verified Fighter Badge",
                    description: "Stand out with official fighter verification"
                  },
                  {
                    icon: Users,
                    title: "Direct Fan Engagement",
                    description: "Connect directly with your fanbase"
                  },
                  {
                    icon: Zap,
                    title: "Premium Platform Access",
                    description: "Full access to all platform features"
                  },
                  {
                    icon: Star,
                    title: "Fighter-Only Features",
                    description: "Exclusive tools built for fighters"
                  }
                ].map((benefit, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="bg-red-600/10 p-2 rounded-lg">
                      <benefit.icon className="h-4 w-4 text-red-500" />
                    </div>
                    <div>
                      <h4 className="text-white font-medium">{benefit.title}</h4>
                      <p className="text-slate-400 text-sm">{benefit.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Side - Clerk SignUp */}
          <div className="flex justify-center">
            <div className="w-full max-w-md">
              <SignUp
                appearance={{
                  baseTheme: dark,
                  variables: {
                    colorPrimary: "#dc2626", // Red color for fighter theme
                    colorBackground: "#1e293b", // slate-800
                    colorInputBackground: "#334155", // slate-700
                    colorInputText: "#ffffff",
                    colorText: "#ffffff",
                  },
                  elements: {
                    rootBox: "w-full",
                    card: "bg-slate-800 border-slate-700 shadow-xl",
                    headerTitle: "text-white",
                    headerSubtitle: "text-slate-400",
                    socialButtonsIconButton: "border-slate-600 hover:bg-slate-700",
                    dividerLine: "bg-slate-600",
                    dividerText: "text-slate-400",
                    formFieldInput: "bg-slate-700 border-slate-600 text-white",
                    formFieldLabel: "text-slate-300",
                    footerActionLink: "text-red-400 hover:text-red-300",
                  },
                }}
                forceRedirectUrl={`/complete-fighter-signup?token=${token}`}
                signInUrl="/auth"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 