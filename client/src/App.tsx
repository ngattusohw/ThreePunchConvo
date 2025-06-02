import React, { useEffect, useState, useMemo } from "react";
import { Switch, Route } from "wouter";
import {loadStripe} from '@stripe/stripe-js';
import {
  CheckoutProvider,
} from '@stripe/react-stripe-js';
import { Toaster } from "@/components/ui/toaster";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
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
import { queryClient, apiRequest } from "@/lib/queryClient";
import CheckoutForm from "./components/payment/CheckoutForm";
import { Return } from "./components/payment/Return";
import { ForumSkeleton } from "./components/skeletons/ForumSkeleton";

function App() {
  const { isSignedIn, user, isLoaded } = useUser();
  const { userId } = useAuth();
  const [localUserChecked, setLocalUserChecked] = useState(false);
  const [isLoadingClientSecret, setIsLoadingClientSecret] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  // Add a debug state
  const [debugInfo, setDebugInfo] = useState<{loading: boolean, error: string | null}>({
    loading: true,
    error: null
  });

  // TODO test key
  const stripePromise = useMemo(() => 
    loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || ''),
    [] // Only create once
  );

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
          const response = await apiRequest("POST", `/api/users/clerk/${user?.id}`, {
            firstName: user?.firstName,
            lastName: user?.lastName,
            email: user?.emailAddresses[0]?.emailAddress,
            profileImageUrl: user?.imageUrl,
            username: user?.username
          });
          
          if (!response.ok) {
            throw new Error(`Failed to check/create user: ${response.statusText}`);
          }
          
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

  // Fetch client secret only when user is loaded and signed in
  useEffect(() => {
    const fetchClientSecret = async () => {
      if (isLoaded && isSignedIn && user?.id && user?.emailAddresses[0]?.emailAddress) {
        setIsLoadingClientSecret(true);
        console.log("Fetching client secret");
        
        try {
          const response = await apiRequest("POST", '/create-checkout-session', {
            email: user.emailAddresses[0].emailAddress,
            clerkUserId: user.id
          });
          
          if (!response.ok) {
            throw new Error(`HTTP error ${response.status}`);
          }
          
          const data = await response.json();
          console.log("Received client secret:", data.clientSecret ? "Valid secret" : "No secret");
          if (!data.clientSecret) {
            throw new Error("No client secret received from server");
          }
          setClientSecret(data.clientSecret);
          setDebugInfo(prev => ({ ...prev, loading: false }));
        } catch (err) {
          console.error("Error fetching client secret:", err);
          setClientSecret(null);
          setDebugInfo(prev => ({ 
            loading: false, 
            error: err instanceof Error ? err.message : String(err) 
          }));
        } finally {
          setIsLoadingClientSecret(false);
        }
      }
    };
    
    // Only fetch client secret if user is signed in
    if (isLoaded && isSignedIn) {
      fetchClientSecret();
    } else {
      // Reset loading state when not signed in
      setIsLoadingClientSecret(false);
      setDebugInfo(prev => ({ ...prev, loading: false }));
    }
  }, [isLoaded, isSignedIn, user?.id, user?.emailAddresses]);

  const stripeAppearance = {
    theme: 'night' as const,
  };

  // Determine if we should show loading state
  const isLoadingApp = isLoadingClientSecret && isSignedIn;

  return (
    <div>
      <div className="flex flex-col min-h-screen bg-ufc-black text-light-gray">
        <Header />
        <main className="flex-grow">
          <ErrorBoundary fallback={
            <div className="p-4 bg-red-800 text-white m-4">
              <h2 className="text-xl font-bold">Rendering Error</h2>
              <p>There was an error rendering the components</p>
              <p className="text-sm mt-2">Client Secret: {clientSecret ? "Available" : "Not available"}</p>
              <p className="text-sm">Loading: {isLoadingClientSecret ? "Yes" : "No"}</p>
            </div>
          }>
            {isLoadingApp ? (
              <ForumSkeleton />
            ) : (
              <Switch>
                {/* Public Routes - Always accessible */}
                <Route path="/" component={Home} />
                <Route path="/forum" component={Forum} />
                <Route path="/auth" component={AuthPage} />
                <Route path="/login" component={AuthPage} />
                <Route path="/register" component={AuthPage} />
                <Route path="/schedule" component={Schedule} />
                <Route path="/rankings" component={Rankings} />
                
                {/* Protected Routes - Need auth but not checkout */}
                <ProtectedRoute path="/forum/:categoryId" component={Forum} />
                <ProtectedRoute path="/thread/:threadId" component={Thread} />
                <ProtectedRoute path="/user/:username" component={UserProfile} />
                
                {/* Checkout Routes - Need auth AND checkout provider */}
                {isSignedIn && clientSecret ? (
                  <>
                    <Route path="/checkout">
                      <CheckoutProvider
                        stripe={stripePromise}
                        options={{
                          fetchClientSecret: () => {
                            console.log("fetchClientSecret called", { isLoadingClientSecret, clientSecret });
                            return Promise.resolve(clientSecret || "");
                          },
                          elementsOptions: { appearance: stripeAppearance },
                        }}
                      >
                        <CheckoutForm />
                      </CheckoutProvider>
                    </Route>
                    <Route path="/return">
                      <CheckoutProvider
                        stripe={stripePromise}
                        options={{
                          fetchClientSecret: () => {
                            return Promise.resolve(clientSecret || "");
                          },
                          elementsOptions: { appearance: stripeAppearance },
                        }}
                      >
                        <Return />
                      </CheckoutProvider>
                    </Route>
                  </>
                ) : isSignedIn && debugInfo.error ? (
                  <Route path={["/checkout", "/return"]}>
                    <div className="container mx-auto px-4 mt-4">
                      <div className="bg-red-800 text-white p-4 rounded-lg">
                        <h2 className="text-xl font-bold mb-2">Payment Setup Error</h2>
                        <p>{debugInfo.error}</p>
                      </div>
                    </div>
                  </Route>
                ) : null}
                
                {/* 404 Route */}
                <Route component={NotFound} />
              </Switch>
            )}
            {!isLoadingApp && debugInfo.error && !isSignedIn && (
              <div className="container mx-auto px-4 mt-4">
                <div className="bg-yellow-800 text-white p-4 rounded-lg">
                  <h2 className="text-xl font-bold mb-2">Payment Features Unavailable</h2>
                  <p>Please sign in to access checkout features.</p>
                </div>
              </div>
            )}
          </ErrorBoundary>
        </main>
        <Footer />
      </div>
      <Toaster />
    </div>
  );
}

export default App;
