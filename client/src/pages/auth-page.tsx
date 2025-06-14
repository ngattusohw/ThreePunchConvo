import React, { useEffect } from "react";
import { useLocation } from "wouter";
import { GiBoxingGlove } from "react-icons/gi";
import { SignIn, useAuth } from "@clerk/clerk-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function AuthPage() {
  const { isSignedIn, isLoaded } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect if already logged in
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      setLocation("/");
    }
  }, [isSignedIn, isLoaded, setLocation]);

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="border-ufc-blue h-12 w-12 animate-spin rounded-full border-b-2 border-t-2"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Left side - Auth form */}
      <div className="flex w-full items-center justify-center p-4 md:w-1/2 md:p-8">
        <SignIn forceRedirectUrl="/" />
      </div>

      {/* Right side - Hero section */}
      <div className="flex w-full flex-col justify-center bg-gradient-to-tr from-primary/80 to-primary p-4 text-white md:w-1/2 md:p-8">
        <div className="mx-auto max-w-xl space-y-6">
          <div className="mb-6 flex items-center gap-3">
            <GiBoxingGlove className="h-10 w-10" />
            <h1 className="text-4xl font-bold">3 Punch Convo</h1>
          </div>

          <h2 className="text-3xl font-bold">Your Ultimate MMA Community</h2>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-white/20 p-2">
                <svg
                  className="h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-semibold">
                  Engage in Lively Discussions
                </h3>
                <p>
                  Join forums dedicated to UFC, Bellator, ONE FC, and more.
                  Debate with fellow fans about fights, fighters, and events.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="rounded-full bg-white/20 p-2">
                <svg
                  className="h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-semibold">
                  Stay Updated with Events
                </h3>
                <p>
                  Access upcoming fight schedules, event details, and fighter
                  stats. Never miss a match with our comprehensive calendar.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="rounded-full bg-white/20 p-2">
                <svg
                  className="h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-semibold">
                  Earn Community Recognition
                </h3>
                <p>
                  Build your reputation as an MMA expert. Earn points, climb the
                  ranks, and gain status in our fan community.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
