import React, { useState, useEffect } from "react";
import { PaymentElement, useCheckout } from "@stripe/react-stripe-js";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@clerk/clerk-react";

const CheckoutForm = () => {
  const checkout = useCheckout();
  const { toast } = useToast();
  const { user } = useUser();

  const [isLoading, setIsLoading] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);
  const [appliedPromoCode, setAppliedPromoCode] = useState("");
  const [subscriptionType, setSubscriptionType] = useState<'monthly' | 'yearly'>('monthly');

  // Get subscription type from URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const plan = urlParams.get('plan');
    if (plan === 'yearly' || plan === 'monthly') {
      setSubscriptionType(plan);
    }
  }, []);

  const handlePlanChange = (newPlan: 'monthly' | 'yearly') => {
    // Update URL and reload to get new checkout session
    const url = new URL(window.location.href);
    url.searchParams.set('plan', newPlan);
    window.location.href = url.toString();
  };

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const confirmResult = await checkout.confirm();

    // This point will only be reached if there is an immediate error when
    // confirming the payment. Otherwise, your customer will be redirected to
    // your `return_url`. For some payment methods like iDEAL, your customer will
    // be redirected to an intermediate site first to authorize the payment, then
    // redirected to the `return_url`.
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
    if (!promoCode.trim()) {
      toast({
        title: "Invalid Promo Code",
        description: "Please enter a promo code",
        variant: "destructive",
      });
      return;
    }

    setIsApplyingPromo(true);

    try {
      // Apply promo code using Stripe's checkout
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
        // Handle different error types
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
    try {
      // Remove promo code using Stripe's checkout
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
            
            {/* Loading Text */}
            <h3 className='text-xl font-bold text-white mb-2'>Processing Your Subscription</h3>
            <p className='text-gray-300 text-sm mb-4'>
              Securing your payment and setting up your account...
            </p>
            
            {/* Progress Dots */}
            <div className='flex justify-center space-x-2'>
              <div className='w-2 h-2 bg-ufc-blue rounded-full animate-bounce'></div>
              <div className='w-2 h-2 bg-ufc-blue rounded-full animate-bounce' style={{animationDelay: '0.1s'}}></div>
              <div className='w-2 h-2 bg-ufc-blue rounded-full animate-bounce' style={{animationDelay: '0.2s'}}></div>
            </div>
            
            {/* Additional Info */}
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
              onClick={() => handlePlanChange('monthly')}
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
              onClick={() => handlePlanChange('yearly')}
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
                    charged $4.99/month after the end of the free period. You can
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
              Start Subscription • {planDetails.price}
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

export default CheckoutForm;
