import React, { useEffect, useState } from "react";
import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import Home from "@/pages/Home";
import Forum from "@/pages/Forum";
import Schedule from "@/pages/Schedule";
import Rankings from "@/pages/Rankings";
import UserProfile from "@/pages/UserProfile";
import Thread from "@/pages/Thread";
import AuthPage from "@/pages/auth-page";
import NotFound from "@/pages/not-found";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { ProtectedRoute } from "@/lib/protected-route";
import { useUser, useAuth } from "@clerk/clerk-react";
import { queryClient } from "@/lib/queryClient";

function App() {
  const { isSignedIn, user, isLoaded } = useUser();
  const { userId } = useAuth();
  const [localUserChecked, setLocalUserChecked] = useState(false);

  // Clear React Query cache when auth state changes (on logout)
  useEffect(() => {
    if (isLoaded && !isSignedIn && !userId) {
      // User has logged out, clear all queries from cache
      queryClient.clear();
      console.log("Auth state changed: user logged out, cleared query cache");
    }
  }, [isLoaded, isSignedIn, userId]);

  useEffect(() => {
    const checkOrCreateUser = async () => {
      if (isLoaded && isSignedIn && user) {
        console.log("Clerk user logged in:", user);
        console.log("app profile: ", user?.imageUrl);

        try {
          // Check if user exists in our database, creates one if not
          const response = await fetch(`/api/users/clerk/${user?.id}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              firstName: user?.firstName,
              lastName: user?.lastName,
              email: user?.emailAddresses[0]?.emailAddress,
              profileImageUrl: user?.imageUrl,
              username: user?.username
            })
          });
          const data = await response.json();
          
          if (data.created) {
            console.log("Created new local user for Clerk user:", data.user);
          } else {
            console.log("Found existing local user:", data.user);
          }
          
          setLocalUserChecked(true);
        } catch (error) {
          console.error("Error checking/creating user:", error);
        }
      }
    };
    
    checkOrCreateUser();
  }, [isLoaded, isSignedIn, user]);

  return (
    <div>
      <div className="flex flex-col min-h-screen bg-ufc-black text-light-gray">
        <Header />
        <main className="flex-grow">
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/forum" component={Forum} />
            <Route path="/auth" component={AuthPage} />
            <Route path="/login" component={AuthPage} />
            <Route path="/register" component={AuthPage} />
            <Route path="/schedule" component={Schedule} />
            <Route path="/rankings" component={Rankings} />
            {/* Protected Routes */}
            <ProtectedRoute path="/forum" component={Forum} />
            <ProtectedRoute path="/forum/:categoryId" component={Forum} />
            <ProtectedRoute path="/thread/:threadId" component={Thread} />
            <ProtectedRoute path="/user/:username" component={UserProfile} />
            <Route component={NotFound} />
          </Switch>
        </main>
        <Footer />
      </div>
      <Toaster />
    </div>
  );
}

export default App;
