import React, { useEffect, useState, useRef } from "react";
import { Switch, Route, useLocation } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import Forum from "@/pages/Forum";
import Rankings from "@/pages/Rankings";
import UserProfile from "@/pages/UserProfile";
import Admin from "@/pages/Admin";
import Thread from "@/pages/Thread";
import AuthPage from "@/pages/AuthPage";
import NotFound from "@/pages/NotFound";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { ProtectedRoute } from "@/lib/protected-route";
import { AdminRoute } from "@/lib/admin-route";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { getSubscriptionStatus } from "@/lib/utils";
import CheckoutForm from "./components/payment/CheckoutForm";
import { Return } from "./components/payment/Return";
import { ForumSkeleton } from "./components/skeletons/ForumSkeleton";
import { useMemoizedUser } from "@/hooks/useMemoizedUser";
import { useAuth } from "@clerk/clerk-react";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import SignUp from "./pages/SignUp";
import FighterSignup from "@/pages/FighterSignup";
import CompleteFighterSignup from "@/pages/CompleteFighterSignup";

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
  const [localUser, setLocalUser] = useState<any | null>(null);
  // Add an initialLoadComplete state to track when the app is ready to render
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  // Add refs to track if operations have been performed
  const userCheckPerformed = useRef(false);
  const subscriptionCheckPerformed = useRef(false);

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

  // Check for user subscriptions - KEEP THIS LOGIC BUT FIX THE CONDITIONS
  useEffect(() => {
    const checkUserSubscriptions = async () => {
      // Skip if already performed or conditions aren't met
      if (
        subscriptionCheckPerformed.current ||
        !localUserChecked
      ) {
        return;
      }

      // If no local user (shouldn't happen but handle it)
      if (!localUser) {
        console.log("No local user, setting initial load complete");
        setInitialLoadComplete(true);
        subscriptionCheckPerformed.current = true;
        return;
      }

      // If user doesn't have a Stripe ID yet (new user), skip subscription check but mark as complete
      if (!localUser.stripeId) {
        console.log("New user without Stripe ID, setting initial load complete");
        setInitialLoadComplete(true);
        subscriptionCheckPerformed.current = true;
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

        // Get subscription status using the utility function
        const status = getSubscriptionStatus(subscriptionsData);

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

    // Run the subscription check if local user check is complete
    if (localUserChecked) {
      checkUserSubscriptions();
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

  // Simplified loading logic - we only wait for initial user/subscription checks
  const isLoadingApp = !initialLoadComplete;

  console.log("isSignedIn: ", isSignedIn);
  console.log("initialLoadComplete: ", initialLoadComplete);
  console.log("localUserChecked: ", localUserChecked);
  console.log("localUser: ", localUser);
  
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
              </div>
            }
          >
            {isLoadingApp ? (
              <ForumSkeleton />
            ) : (
              <Switch>
                {/* Public Routes - Always accessible */}
                <Route path='/auth' component={AuthPage} />
                <Route path='/login' component={AuthPage} />
                <Route path='/register' component={AuthPage} />
                <Route path='/privacy' component={PrivacyPolicy} />
                <Route path='/terms' component={TermsOfService} />
                
                {/* Protected Routes - Need auth but not checkout */}
                <ProtectedRoute path='/rankings' component={Rankings} />
                <ProtectedRoute path='/' component={Forum} />
                <ProtectedRoute path='/forum' component={Forum} />
                <ProtectedRoute path='/forum/:categoryId' component={Forum} />
                <ProtectedRoute path='/thread/:threadId' component={Thread} />
                <ProtectedRoute
                  path='/user/:username'
                  component={UserProfile}
                />
                <ProtectedRoute path='/return' component={Return} />
                <ProtectedRoute path='/signup' component={SignUp} />
                <Route path="/fighter-signup" component={FighterSignup} />
                <Route path="/complete-fighter-signup" component={CompleteFighterSignup} />

                {/* Admin Routes - Need auth and admin role */}
                <AdminRoute path='/admin' component={Admin} />

                {/* Checkout Routes - Now simplified with dynamic session creation */}
                <ProtectedRoute path='/checkout' component={CheckoutForm} />

                {/* 404 Route */}
                <ProtectedRoute path='*' component={NotFound} />
              </Switch>
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
