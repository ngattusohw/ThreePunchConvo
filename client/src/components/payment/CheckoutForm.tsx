import React, { useState, useEffect, useRef } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { CheckoutProvider, PaymentElement, useCheckout } from "@stripe/react-stripe-js";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@clerk/clerk-react";
import { apiRequest } from "@/lib/queryClient";

// Load Stripe outside of component to avoid recreating on every render
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "");

const stripeAppearance = {
  theme: "night" as const,
};

// Inner component that uses checkout (must be inside CheckoutProvider)
const CheckoutFormInner = ({ subscriptionType, onPlanChange }: { 
  subscriptionType: 'monthly' | 'yearly',
  onPlanChange: (plan: 'monthly' | 'yearly') => void 
}) => {
  const checkout = useCheckout();
  const { toast } = useToast();
  const { user } = useUser();

  const [isLoading, setIsLoading] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);
  const [appliedPromoCode, setAppliedPromoCode] = useState("");

  const getPlanDetails = () => {
    if (subscriptionType === 'yearly') {
      return {
        name: 'Yearly Subscription',
        price: '$49.99/year',
        savings: 'Save $10 compared to monthly!',
        billing: 'Billed annually'
      };
    }
    return {
      name: 'Monthly Subscription',
      price: '$4.99/month',
      savings: null,
      billing: 'Billed monthly'
    };
  };

  const planDetails = getPlanDetails();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkout) return;
    
    setIsLoading(true);

    const confirmResult = await checkout.confirm();

    if (confirmResult.type === "error") {
      toast({
        title: "Payment Error",
        description: confirmResult.error.message,
        variant: "destructive",
      });
    }

    setIsLoading(false);
  };

  const handleApplyPromoCode = async () => {
    if (!promoCode.trim() || !checkout) {
      toast({
        title: "Invalid Promo Code",
        description: "Please enter a promo code",
        variant: "destructive",
      });
      return;
    }

    setIsApplyingPromo(true);

    try {
      const result = await checkout.applyPromotionCode(promoCode);

      if (result.type === "success") {
        setAppliedPromoCode(promoCode);
        setPromoCode("");

        toast({
          title: "Promo Code Applied!",
          description: "Your discount has been applied to your subscription",
          variant: "default",
        });
      } else {
        let errorMessage = "The promo code you entered is not valid";

        if (result.type === "error") {
          errorMessage = result.error.message || errorMessage;
        }

        toast({
          title: "Invalid Promo Code",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error(error);

      toast({
        title: "Error",
        description: "Failed to apply promo code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsApplyingPromo(false);
    }
  };

  const handleRemovePromoCode = async () => {
    if (!checkout) return;
    
    try {
      const result = await checkout.removePromotionCode();

      if (result.type === "success") {
        setAppliedPromoCode("");
        toast({
          title: "Promo Code Removed",
          description: "The promo code has been removed from your subscription",
          variant: "default",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to remove promo code. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove promo code. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className='mx-auto my-5 flex max-w-md flex-col rounded-xl border border-gray-800 bg-gray-900 p-8 shadow-2xl relative'>
      {/* Custom Loading Overlay */}
      {isLoading && (
        <div className='absolute inset-0 bg-gray-900/95 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center z-50'>
          <div className='text-center'>
            <h3 className='text-xl font-bold text-white mb-2'>Processing Your Subscription</h3>
            <p className='text-gray-300 text-sm mb-4'>
              Securing your payment and setting up your account...
            </p>
            
            <div className='flex justify-center space-x-2'>
              <div className='w-2 h-2 bg-ufc-blue rounded-full animate-bounce'></div>
              <div className='w-2 h-2 bg-ufc-blue rounded-full animate-bounce' style={{animationDelay: '0.1s'}}></div>
              <div className='w-2 h-2 bg-ufc-blue rounded-full animate-bounce' style={{animationDelay: '0.2s'}}></div>
            </div>
            
            <div className='mt-6 p-4 bg-gray-800/50 rounded-lg border border-gray-700'>
              <div className='flex items-center justify-center text-sm text-gray-400'>
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  className='h-4 w-4 mr-2 text-green-400'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'
                  />
                </svg>
                <span>Your payment is secure and encrypted</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <h4 className='mb-6 text-2xl font-bold text-white'>
          Complete Your Subscription
        </h4>

        {/* Plan Selection Switcher */}
        <div className='mb-6 rounded-xl border border-gray-700 bg-gray-800/30 p-6'>
          <h5 className='mb-4 font-medium text-white'>Subscription Plan</h5>
          <div className='grid grid-cols-2 gap-3'>
            <button
              type='button'
              onClick={() => onPlanChange('monthly')}
              className={`rounded-lg p-3 text-sm transition ${
                subscriptionType === 'monthly'
                  ? 'bg-ufc-blue text-black font-medium'
                  : 'border border-gray-600 text-white hover:bg-gray-700'
              }`}
              disabled={isLoading}
            >
              <div className='text-center'>
                <div className='font-medium'>Monthly</div>
                <div className='text-xs opacity-80'>$4.99/month</div>
              </div>
            </button>
            <button
              type='button'
              onClick={() => onPlanChange('yearly')}
              className={`rounded-lg p-3 text-sm transition relative ${
                subscriptionType === 'yearly'
                  ? 'bg-ufc-blue text-black font-medium'
                  : 'border border-gray-600 text-white hover:bg-gray-700'
              }`}
              disabled={isLoading}
            >
              <div className='text-center'>
                <div className='font-medium'>Yearly</div>
                <div className='text-xs opacity-80'>$49.99/year</div>
              </div>
              <div className='absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full'>
                Save $10
              </div>
            </button>
          </div>
        </div>

        {/* Subscription Details */}
        <div className='mb-8 rounded-xl border border-gray-700 bg-gradient-to-br from-gray-800 to-gray-900 p-6 shadow-md'>
          <div className='mb-4 flex items-center justify-between'>
            <h5 className='text-xl font-bold text-white'>
              {planDetails.name}
            </h5>
            <span className='bg-ufc-blue/20 text-ufc-blue rounded-full px-3 py-1 text-sm font-medium'>
              {subscriptionType === 'yearly' ? 'Yearly' : 'Monthly'}
            </span>
          </div>

          {planDetails.savings && (
            <div className='mb-4 rounded-lg bg-green-900/20 border border-green-700 p-3'>
              <p className='text-green-400 text-sm font-medium'>{planDetails.savings}</p>
            </div>
          )}

          <div className='mb-5 space-y-4'>
            <div className='flex items-start'>
              <div className='text-ufc-blue mr-3 mt-1'>
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  className='h-5 w-5'
                  viewBox='0 0 20 20'
                  fill='currentColor'
                >
                  <path
                    fillRule='evenodd'
                    d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                    clipRule='evenodd'
                  />
                </svg>
              </div>
              <p className='text-gray-200'>Create and publish your own posts</p>
            </div>
            <div className='flex items-start'>
              <div className='text-ufc-blue mr-3 mt-1'>
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  className='h-5 w-5'
                  viewBox='0 0 20 20'
                  fill='currentColor'
                >
                  <path
                    fillRule='evenodd'
                    d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                    clipRule='evenodd'
                  />
                </svg>
              </div>
              <p className='text-gray-200'>Reply to other community posts</p>
            </div>
            <div className='flex items-start'>
              <div className='text-ufc-blue mr-3 mt-1'>
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  className='h-5 w-5'
                  viewBox='0 0 20 20'
                  fill='currentColor'
                >
                  <path
                    fillRule='evenodd'
                    d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                    clipRule='evenodd'
                  />
                </svg>
              </div>
              <p className='text-gray-200'>
                Exclusive access to fighter content
              </p>
            </div>
          </div>

          <div className='flex items-center justify-between border-t border-gray-700 pt-4'>
            <span className='text-sm text-gray-400'>{planDetails.billing}</span>
            <span className='text-xl font-bold text-white'>
              {planDetails.price}
            </span>
          </div>
        </div>

        {/* Promo Code Section */}
        <div className='mb-6 rounded-xl border border-gray-700 bg-gray-800/30 p-6'>
          <h5 className='mb-4 font-medium text-white'>Promo Code</h5>

          {appliedPromoCode ? (
            <div className='flex flex-col gap-4'>
              <div className='flex items-center justify-between rounded-lg border border-green-700 bg-green-900/20 p-4'>
                <div className='flex items-center'>
                  <svg
                    xmlns='http://www.w3.org/2000/svg'
                    className='mr-2 h-5 w-5 text-green-400'
                    viewBox='0 0 20 20'
                    fill='currentColor'
                  >
                    <path
                      fillRule='evenodd'
                      d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                      clipRule='evenodd'
                    />
                  </svg>
                  <span className='font-medium text-green-400'>
                    {appliedPromoCode}
                  </span>
                  <span className='ml-2 text-sm text-green-300'>Applied</span>
                </div>
                <button
                  type='button'
                  onClick={handleRemovePromoCode}
                  className='text-sm font-medium text-red-400 hover:text-red-300'
                  disabled={isLoading}
                >
                  Remove
                </button>
              </div>
              <div className='flex items-center justify-center rounded-lg border border-amber-600 bg-gradient-to-r from-amber-900/30 to-yellow-900/30 p-4'>
                <div className='flex items-center'>
                  <svg
                    xmlns='http://www.w3.org/2000/svg'
                    className='mr-2 h-5 w-5 flex-shrink-0 text-amber-400'
                    viewBox='0 0 20 20'
                    fill='currentColor'
                  >
                    <path
                      fillRule='evenodd'
                      d='M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                      clipRule='evenodd'
                    />
                  </svg>
                  <span className='text-sm font-bold text-amber-300'>
                    Valid for a whole FREE YEAR. Your card will only start being
                    charged after the end of the free period. You can
                    cancel at any time.
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className='flex gap-3'>
              <input
                type='text'
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                placeholder='Enter promo code'
                className='focus:border-ufc-blue focus:ring-ufc-blue flex-1 rounded-lg border border-gray-600 bg-gray-700 px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-1'
                disabled={isApplyingPromo || isLoading}
              />
              <button
                type='button'
                onClick={handleApplyPromoCode}
                disabled={isApplyingPromo || !promoCode.trim() || isLoading}
                className='bg-ufc-blue hover:bg-ufc-blue/90 rounded-lg px-4 py-3 text-sm font-medium text-white transition duration-200 disabled:cursor-not-allowed disabled:bg-gray-600'
              >
                {isApplyingPromo ? (
                  <div className='h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent'></div>
                ) : (
                  "Apply"
                )}
              </button>
            </div>
          )}
        </div>

        {/* User email */}
        <div className='mb-6 flex items-center rounded-lg border border-gray-700 bg-gray-800/50 p-4'>
          <svg
            xmlns='http://www.w3.org/2000/svg'
            className='mr-3 h-5 w-5 text-gray-400'
            viewBox='0 0 20 20'
            fill='currentColor'
          >
            <path d='M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z' />
            <path d='M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z' />
          </svg>
          <p className='text-sm text-gray-300'>
            We'll send subscription details and receipts to{" "}
            <span className='font-medium text-white'>
              {user?.emailAddresses[0]?.emailAddress}
            </span>
          </p>
        </div>

        {/* Payment Element */}
        <div className='mb-6 rounded-xl border border-gray-700 bg-gray-800/30 p-6'>
          <h5 className='mb-4 font-medium text-white'>Payment Details</h5>
          <PaymentElement id='payment-element' />
        </div>

        {/* Submit Button */}
        <button
          disabled={isLoading}
          id='submit'
          className='bg-ufc-blue hover:bg-ufc-blue/90 flex w-full items-center justify-center rounded-lg px-6 py-3 text-base font-semibold text-white shadow-md transition duration-200 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed'
        >
          {isLoading ? (
            <>
              <div className='mr-3 h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent'></div>
              <span>Processing...</span>
            </>
          ) : (
            <span>
              Start Subscription • {checkout?.total?.total?.amount}
            </span>
          )}
        </button>

        <p className='mt-4 text-center text-xs text-gray-500'>
          By subscribing, you agree to our Terms of Service and Privacy Policy
        </p>
      </form>
    </div>
  );
};

// Main wrapper component that handles session creation
const CheckoutForm = () => {
  const { user, isLoaded: isUserLoaded, isSignedIn } = useUser();

  const getInitialSubscriptionType = (): 'monthly' | 'yearly' => {
    const urlParams = new URLSearchParams(window.location.search);
    const plan = urlParams.get('plan');
    if (plan === 'yearly' || plan === 'monthly') {
      console.log("SET SUBSCRIPTION plan: ", plan);
      return plan;
    }
    return 'monthly';
  };

  const [subscriptionType, setSubscriptionType] = useState<'monthly' | 'yearly'>(getInitialSubscriptionType());
  const [isCreatingSession, setIsCreatingSession] = useState(true);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [sessionError, setSessionError] = useState<string | null>(null);
  
  // Add ref to prevent concurrent requests
  const createSessionPromise = useRef<Promise<void> | null>(null);

  // Create checkout session when component mounts or plan changes
  useEffect(() => {
    const createCheckoutSession = async () => {
      // Prevent concurrent requests
      if (createSessionPromise.current) {
        console.log("🔄 Session creation already in progress, waiting...");
        await createSessionPromise.current;
        return;
      }

      if (!isUserLoaded || !isSignedIn || !user?.id || !user?.emailAddresses?.[0]?.emailAddress) {
        if (isUserLoaded && !isSignedIn) {
          setSessionError("Please sign in to access checkout");
          setIsCreatingSession(false);
        }
        return;
      }

      setIsCreatingSession(true);
      setSessionError(null);

      // Create and store the promise
      createSessionPromise.current = (async () => {
        try {
          console.log("🚀 Creating checkout session for user:", user.id, "plan:", subscriptionType);

          // First, check subscription status
          const statusResponse = await apiRequest(
            "GET", 
            `/check-subscription-status?clerkUserId=${user.id}`
          );

          if (!statusResponse.ok) {
            throw new Error(`Status check failed: ${statusResponse.status}`);
          }

          const statusData = await statusResponse.json();
          console.log("📊 Subscription status check result:", statusData);

          // If user already has an active subscription, show message
          if (statusData.hasActiveSubscription) {
            console.log("✅ User already has active subscription");
            setSessionError("You already have an active subscription");
            setIsCreatingSession(false);
            return;
          }

          // Create new checkout session
          console.log("🆕 Creating NEW checkout session for plan:", subscriptionType);
          
          const requestBody = {
            email: user.emailAddresses[0].emailAddress,
            clerkUserId: user.id,
            plan: subscriptionType,
          };
          
          console.log("📤 Sending request body:", requestBody);

          const response = await apiRequest("POST", "/create-checkout-session", requestBody);

          if (!response.ok) {
            const errorData = await response.json();
            console.error("❌ Checkout session creation failed:", errorData);
            
            if (response.status === 400) {
              if (errorData.error?.message?.includes("already has an active subscription")) {
                setSessionError("You already have an active subscription");
                setIsCreatingSession(false);
                return;
              }
            }
            throw new Error(`HTTP error ${response.status}: ${JSON.stringify(errorData)}`);
          }

          const data = await response.json();
          console.log("✅ Checkout session created successfully:", {
            hasClientSecret: !!data.clientSecret,
            isExisting: data.isExisting,
            sessionId: data.sessionId,
            plan: subscriptionType
          });

          if (!data.clientSecret) {
            throw new Error("No client secret received from server");
          }

          setClientSecret(data.clientSecret);
          setIsCreatingSession(false);

        } catch (err) {
          console.error("💥 Error creating checkout session:", err);
          const errorMessage = err instanceof Error ? err.message : String(err);
          setSessionError(errorMessage);
          setIsCreatingSession(false);
        }
      })();

      await createSessionPromise.current;
      createSessionPromise.current = null; // Clear the promise
    };

    createCheckoutSession();
  }, [
    isUserLoaded, 
    isSignedIn, 
    user?.id, 
    subscriptionType
  ]);

  const handlePlanChange = (newPlan: 'monthly' | 'yearly') => {
    console.log("🔄 Plan change requested:", subscriptionType, "→", newPlan);
    
    if (newPlan === subscriptionType) {
      console.log("⏭️ Same plan selected, ignoring");
      return;
    }
    
    // Clear the existing client secret to force a new session
    setClientSecret(null);
    setSessionError(null);
    setIsCreatingSession(true);
    
    setSubscriptionType(newPlan);
    console.log("✅ Plan changed to:", newPlan);
  };

  // Show loading state while creating session
  if (isCreatingSession) {
    return (
      <div className='mx-auto my-5 flex max-w-md flex-col rounded-xl border border-gray-800 bg-gray-900 p-8 shadow-2xl'>
        <div className='text-center'>
          <h3 className='text-xl font-bold text-white mb-4'>Setting Up Your Checkout</h3>
          <div className='flex justify-center space-x-2 mb-4'>
            <div className='w-2 h-2 bg-ufc-blue rounded-full animate-bounce'></div>
            <div className='w-2 h-2 bg-ufc-blue rounded-full animate-bounce' style={{animationDelay: '0.1s'}}></div>
            <div className='w-2 h-2 bg-ufc-blue rounded-full animate-bounce' style={{animationDelay: '0.2s'}}></div>
          </div>
          <p className='text-gray-300 text-sm'>
            Preparing your secure payment session...
          </p>
        </div>
      </div>
    );
  }

  // Show error state
  if (sessionError) {
    return (
      <div className='mx-auto my-5 flex max-w-md flex-col rounded-xl border border-gray-800 bg-gray-900 p-8 shadow-2xl'>
        <div className={`rounded-lg p-4 text-white ${
          sessionError.includes("already have an active subscription") 
            ? "bg-blue-800" 
            : sessionError.includes("pending checkout session")
            ? "bg-yellow-800"
            : "bg-red-800"
        }`}>
          <h2 className='mb-2 text-xl font-bold'>
            {sessionError.includes("already have an active subscription") 
              ? "Subscription Active" 
              : sessionError.includes("pending checkout session")
              ? "Checkout In Progress"
              : sessionError.includes("Please sign in")
              ? "Sign In Required"
              : "Payment Setup Error"}
          </h2>
          <p>{sessionError}</p>
          {sessionError.includes("already have an active subscription") && (
            <p className="mt-2 text-sm">
              You can manage your subscription in your account settings.
            </p>
          )}
          {sessionError.includes("pending checkout session") && (
            <div className="mt-4">
              <p className="text-sm mb-2">
                Please complete your existing checkout or wait for it to expire.
              </p>
              <button 
                onClick={() => {
                  setSessionError(null);
                  setClientSecret(null);
                  setIsCreatingSession(true);
                }}
                className="bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded text-sm"
              >
                Try Again
              </button>
            </div>
          )}
          {sessionError.includes("Please sign in") && (
            <div className="mt-4">
              <a href="/auth" className="bg-ufc-blue hover:bg-ufc-blue/90 px-4 py-2 rounded text-sm inline-block">
                Sign In
              </a>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Render checkout form with provider
  if (clientSecret) {
    return (
      <CheckoutProvider
        stripe={stripePromise}
        options={{
          fetchClientSecret: () => Promise.resolve(clientSecret),
          elementsOptions: { appearance: stripeAppearance },
        }}
      >
        <CheckoutFormInner 
          subscriptionType={subscriptionType} 
          onPlanChange={handlePlanChange} 
        />
      </CheckoutProvider>
    );
  }

  // Fallback loading state
  return (
    <div className='mx-auto my-5 flex max-w-md flex-col rounded-xl border border-gray-800 bg-gray-900 p-8 shadow-2xl'>
      <div className='text-center'>
        <h3 className='text-xl font-bold text-white mb-4'>Loading...</h3>
      </div>
    </div>
  );
};

export default CheckoutForm;
