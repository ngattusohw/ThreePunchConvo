import React, { useEffect, useState, useMemo, useRef } from "react";
import { Switch, Route, useLocation } from "wouter";
import { loadStripe } from "@stripe/stripe-js";
import { CheckoutProvider } from "@stripe/react-stripe-js";
import { Toaster } from "@/components/ui/toaster";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import Forum from "@/pages/Forum";
import Rankings from "@/pages/Rankings";
import UserProfile from "@/pages/UserProfile";
import Thread from "@/pages/Thread";
import AuthPage from "@/pages/AuthPage";
import NotFound from "@/pages/NotFound";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { ProtectedRoute } from "@/lib/protected-route";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { getSubscriptionStatus } from "@/lib/utils";
import CheckoutForm from "./components/payment/CheckoutForm";
import { Return } from "./components/payment/Return";
import { ForumSkeleton } from "./components/skeletons/ForumSkeleton";
import { useMemoizedUser } from "@/hooks/useMemoizedUser";
import { useAuth } from "@clerk/clerk-react";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";

function App() {
  const { getToken } = useAuth();
  const [location] = useLocation();

  const {
    user,
    isSignedIn,
    isLoaded: isUserLoaded,
    userId,
  } = useMemoizedUser();
  const [localUserChecked, setLocalUserChecked] = useState(false);
  const [isLoadingClientSecret, setIsLoadingClientSecret] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [subscriptions, setSubscriptions] = useState<any[] | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string>("");
  const [localUser, setLocalUser] = useState<any | null>(null);
  // Add a debug state
  const [debugInfo, setDebugInfo] = useState<{
    loading: boolean;
    error: string | null;
  }>({
    loading: true,
    error: null,
  });
  // Add an initialLoadComplete state to track when the app is ready to render
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  // Add refs to track if operations have been performed
  const userCheckPerformed = useRef(false);
  const subscriptionCheckPerformed = useRef(false);
  const clientSecretFetched = useRef(false);

  // TODO test key
  const stripePromise = useMemo(
    // @ts-ignore - ignoring the env property error
    () => loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || ""),
    [], // Only create once
  );

  useEffect(() => {
    getToken();
  }, []);

  // Clear React Query cache when auth state changes (on logout)
  useEffect(() => {
    if (isUserLoaded && !isSignedIn && !userId) {
      // User has logged out, clear all queries from cache
      queryClient.clear();
      console.log("Auth state changed: user logged out, cleared query cache");
      // Since we're logged out, we can consider initial load complete
      if (!initialLoadComplete) setInitialLoadComplete(true);
    }
  }, [isUserLoaded, isSignedIn, userId, initialLoadComplete]);

  useEffect(() => {
    const checkOrCreateUser = async () => {
      // Skip if already performed or conditions aren't met
      if (userCheckPerformed.current || !isUserLoaded || !isSignedIn || !user) {
        if (isUserLoaded && !isSignedIn) {
          setLocalUserChecked(true);
        }
        return;
      }

      console.log("Clerk user logged in:", user);
      console.log("app profile: ", user?.imageUrl);

      try {
        // Check if user exists in our database, creates one if not
        const response = await apiRequest(
          "POST",
          `/api/users/clerk/${user?.id}`,
          {
            firstName: user?.firstName,
            lastName: user?.lastName,
            email: user?.emailAddress,
            profileImageUrl: user?.imageUrl,
            username: user?.username,
          },
        );

        if (!response.ok) {
          throw new Error(
            `Failed to check/create user: ${response.statusText}`,
          );
        }

        const data = await response.json();

        setLocalUser(data.user);
        setLocalUserChecked(true);
        userCheckPerformed.current = true;
      } catch (error) {
        console.error("Error checking/creating user:", error);
        // Even if there was an error, we should mark local user check as complete
        setLocalUserChecked(true);
        userCheckPerformed.current = true;
      }
    };

    checkOrCreateUser();
  }, [
    isUserLoaded,
    isSignedIn,
    user?.id,
    user?.firstName,
    user?.lastName,
    user?.emailAddress,
    user?.imageUrl,
    user?.username,
  ]);

  // Check for user subscriptions
  useEffect(() => {
    const checkUserSubscriptions = async () => {
      // Skip if already performed or conditions aren't met
      if (
        subscriptionCheckPerformed.current ||
        !localUser?.stripeId ||
        !localUserChecked
      ) {
        if (localUserChecked && !localUser && isUserLoaded)
          setInitialLoadComplete(true);
        return;
      }

      try {
        console.log(
          "Checking subscriptions for user with Stripe ID:",
          localUser.stripeId,
        );
        const response = await apiRequest(
          "GET",
          `/get-subscriptions?customerId=${localUser.stripeId}&status=active`,
        );

        if (!response.ok) {
          throw new Error(
            `Failed to fetch subscriptions: ${response.statusText}`,
          );
        }

        const data = await response.json();
        const subscriptionsData = data.subscriptions || [];

        setSubscriptions(subscriptionsData);

        // Get subscription status using the utility function
        const status = getSubscriptionStatus(subscriptionsData);
        setSubscriptionStatus(status);

        // Update the user's plan type in the database if needed
        if (user?.id && status) {
          // Status will be 'BASIC', 'PRO', or empty string
          const planType = status || "FREE";
          await updateUserPlanType(user.id, planType);
        }

        if (subscriptionsData && subscriptionsData.length > 0) {
          console.log("User has active subscriptions:", subscriptionsData);
          console.log("Subscription status:", status);
        } else {
          console.log("User has no active subscriptions");

          // If no active subscriptions, downgrade to FREE plan if user is logged in
          if (user?.id) {
            await updateUserPlanType(user.id, "FREE");
          }
        }

        subscriptionCheckPerformed.current = true;
      } catch (error) {
        console.error("Error checking subscriptions:", error);
        subscriptionCheckPerformed.current = true;
      } finally {
        // Mark the initial load as complete when subscription check is done
        if (!initialLoadComplete) setInitialLoadComplete(true);
      }
    };

    if (localUserChecked && localUser) {
      checkUserSubscriptions();
    } else if (localUserChecked && !localUser && isUserLoaded) {
      // If local user check is complete but no local user and user is loaded, we can consider initial load complete
      if (!initialLoadComplete) setInitialLoadComplete(true);
    }
  }, [
    localUser,
    localUserChecked,
    user?.id,
    isUserLoaded,
    initialLoadComplete,
  ]);

  // Function to update user's plan type in the database
  const updateUserPlanType = async (clerkUserId: string, planType: string) => {
    try {
      console.log(`Updating plan type for user ${clerkUserId} to ${planType}`);
      const response = await apiRequest("POST", "/api/users/update-plan", {
        clerkUserId,
        planType,
      });

      if (!response.ok) {
        throw new Error(`Failed to update plan type: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.updated) {
        console.log(
          `Plan type updated from ${data.previousPlan} to ${data.newPlan}`,
        );

        // Only update local user state if the plan actually changed
        if (localUser && data.user && data.previousPlan !== data.newPlan) {
          setLocalUser({
            ...localUser,
            planType: data.newPlan,
          });
        }
      } else {
        console.log(`Plan type already up to date: ${data.planType}`);
      }

      return data;
    } catch (error) {
      console.error("Error updating plan type:", error);
      return null;
    }
  };

  // Fetch client secret only when user is loaded and signed in
  useEffect(() => {
    const fetchClientSecret = async () => {
      // Skip if already performed or conditions aren't met
      if (
        clientSecretFetched.current ||
        !isUserLoaded ||
        !isSignedIn ||
        !user?.id ||
        !user?.emailAddress
      ) {
        if (isUserLoaded && !isSignedIn) {
          setIsLoadingClientSecret(false);
          setDebugInfo((prev) => ({ ...prev, loading: false }));
          if (!initialLoadComplete) setInitialLoadComplete(true);
        }
        return;
      }

      setIsLoadingClientSecret(true);
      console.log("Fetching client secret");

      try {
        const response = await apiRequest("POST", "/create-checkout-session", {
          email: user.emailAddress,
          clerkUserId: user.id,
        });

        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}`);
        }

        const data = await response.json();
        console.log(
          "Received client secret:",
          data.clientSecret ? "Valid secret" : "No secret",
        );
        if (!data.clientSecret) {
          throw new Error("No client secret received from server");
        }
        setClientSecret(data.clientSecret);
        setDebugInfo((prev) => ({ ...prev, loading: false }));
        clientSecretFetched.current = true;
      } catch (err) {
        console.error("Error fetching client secret:", err);
        setClientSecret(null);
        setDebugInfo((prev) => ({
          loading: false,
          error: err instanceof Error ? err.message : String(err),
        }));
        clientSecretFetched.current = true;
      } finally {
        setIsLoadingClientSecret(false);
        // Ensure initial load is marked as complete after client secret is loaded (or failed)
        if (!initialLoadComplete) setInitialLoadComplete(true);
      }
    };

    // Only fetch client secret if user is signed in
    if (isUserLoaded && isSignedIn) {
      fetchClientSecret();
    } else if (isUserLoaded && !isSignedIn) {
      // Reset loading state when not signed in
      setIsLoadingClientSecret(false);
      setDebugInfo((prev) => ({ ...prev, loading: false }));
      // Mark initial load as complete for non-signed in users
      if (!initialLoadComplete) setInitialLoadComplete(true);
    }
  }, [
    isUserLoaded,
    isSignedIn,
    user?.id,
    user?.emailAddress,
    initialLoadComplete,
  ]);

  const stripeAppearance = {
    theme: "night" as const,
  };

  // Determine if we should show loading state - now we use the initialLoadComplete flag
  const isLoadingApp =
    !initialLoadComplete || (isLoadingClientSecret && isSignedIn);

  // If we're going to checkout but clientSecret is still loading, show skeleton
  const isCheckoutLoading =
    window.location.pathname === "/checkout" &&
    ((isSignedIn && (!clientSecret || isLoadingClientSecret)) ||
      !isUserLoaded ||
      !initialLoadComplete);

  return (
    <div>
      <div className='bg-ufc-black text-light-gray flex min-h-screen flex-col'>
        {location !== "/auth" &&
          location !== "/login" &&
          location !== "/register" && <Header />}
        <main className='flex-grow'>
          <ErrorBoundary
            fallback={
              <div className='m-4 bg-red-800 p-4 text-white'>
                <h2 className='text-xl font-bold'>Rendering Error</h2>
                <p>There was an error rendering the components</p>
                <p className='mt-2 text-sm'>
                  Client Secret: {clientSecret ? "Available" : "Not available"}
                </p>
                <p className='text-sm'>
                  Loading: {isLoadingClientSecret ? "Yes" : "No"}
                </p>
              </div>
            }
          >
            {isLoadingApp || isCheckoutLoading ? (
              <ForumSkeleton />
            ) : (
              <Switch>
                {/* Public Routes - Always accessible */}
                <ProtectedRoute path='/' component={Forum} />
                <ProtectedRoute path='/forum' component={Forum} />
                <Route path='/auth' component={AuthPage} />
                <Route path='/login' component={AuthPage} />
                <Route path='/register' component={AuthPage} />
                <Route path='/privacy' component={PrivacyPolicy} />
                <Route path='/terms' component={TermsOfService} />
                {/* <Route path="/schedule" component={Schedule} /> */}
                <ProtectedRoute path='/rankings' component={Rankings} />

                {/* Protected Routes - Need auth but not checkout */}
                <ProtectedRoute path='/forum/:categoryId' component={Forum} />
                <ProtectedRoute path='/thread/:threadId' component={Thread} />
                <ProtectedRoute
                  path='/user/:username'
                  component={UserProfile}
                />

                {/* Checkout Routes - Need auth AND checkout provider */}
                {isSignedIn && clientSecret ? (
                  <>
                    <Route path='/checkout'>
                      <CheckoutProvider
                        stripe={stripePromise}
                        options={{
                          fetchClientSecret: () => {
                            console.log("fetchClientSecret called", {
                              isLoadingClientSecret,
                              clientSecret,
                            });
                            return Promise.resolve(clientSecret || "");
                          },
                          elementsOptions: { appearance: stripeAppearance },
                        }}
                      >
                        <CheckoutForm />
                      </CheckoutProvider>
                    </Route>
                    <Route path='/return'>
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
                  <Route path='/checkout'>
                    <div className='container mx-auto mt-4 px-4'>
                      <div className='rounded-lg bg-red-800 p-4 text-white'>
                        <h2 className='mb-2 text-xl font-bold'>
                          Payment Setup Error
                        </h2>
                        <p>{debugInfo.error}</p>
                      </div>
                    </div>
                  </Route>
                ) : null}

                {/* 404 Route */}
                <ProtectedRoute path='*' component={NotFound} />
              </Switch>
            )}
            {!isLoadingApp && debugInfo.error && !isSignedIn && (
              <div className='container mx-auto mt-4 px-4'>
                <div className='rounded-lg bg-yellow-800 p-4 text-white'>
                  <h2 className='mb-2 text-xl font-bold'>
                    Payment Features Unavailable
                  </h2>
                  <p>Please sign in to access checkout features.</p>
                </div>
              </div>
            )}
          </ErrorBoundary>
        </main>
        {location !== "/auth" &&
          location !== "/login" &&
          location !== "/register" && <Footer />}
      </div>
      <Toaster />
    </div>
  );
}

export default App;
