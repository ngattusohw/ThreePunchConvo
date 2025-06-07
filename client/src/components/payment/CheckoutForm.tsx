import React, { useState } from "react";
import { PaymentElement, useCheckout } from "@stripe/react-stripe-js";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@clerk/clerk-react";

const CheckoutForm = () => {
  const checkout = useCheckout();
  const { toast } = useToast();
  const { user } = useUser();

  const [isLoading, setIsLoading] = useState(false);

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

  return (
    <div className="mx-auto my-5 flex max-w-md flex-col rounded-xl border border-gray-800 bg-gray-900 p-8 shadow-2xl">
      <form onSubmit={handleSubmit}>
        <h4 className="mb-6 text-2xl font-bold text-white">
          Complete Your Subscription
        </h4>

        {/* Subscription Details */}
        <div className="mb-8 rounded-xl border border-gray-700 bg-gradient-to-br from-gray-800 to-gray-900 p-6 shadow-md">
          <div className="mb-4 flex items-center justify-between">
            <h5 className="text-xl font-bold text-white">
              3 Punch Subscription
            </h5>
            <span className="bg-ufc-blue/20 text-ufc-blue rounded-full px-3 py-1 text-sm font-medium">
              Monthly
            </span>
          </div>

          <div className="mb-5 space-y-4">
            <div className="flex items-start">
              <div className="text-ufc-blue mr-3 mt-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <p className="text-gray-200">Create and publish your own posts</p>
            </div>
            <div className="flex items-start">
              <div className="text-ufc-blue mr-3 mt-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <p className="text-gray-200">Reply to other community posts</p>
            </div>
            <div className="flex items-start">
              <div className="text-ufc-blue mr-3 mt-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <p className="text-gray-200">
                Exclusive access to fighter content
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-gray-700 pt-4">
            <span className="text-sm text-gray-400">Billed monthly</span>
            <span className="text-xl font-bold text-white">
              {checkout?.total?.total?.amount}/mo
            </span>
          </div>
        </div>

        {/* User email */}
        <div className="mb-6 flex items-center rounded-lg border border-gray-700 bg-gray-800/50 p-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="mr-3 h-5 w-5 text-gray-400"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
          </svg>
          <p className="text-sm text-gray-300">
            We'll send subscription details and receipts to{" "}
            <span className="font-medium text-white">
              {user?.emailAddresses[0]?.emailAddress}
            </span>
          </p>
        </div>

        {/* Payment Element */}
        <div className="mb-6 rounded-xl border border-gray-700 bg-gray-800/30 p-6">
          <h5 className="mb-4 font-medium text-white">Payment Details</h5>
          <PaymentElement id="payment-element" />
        </div>

        {/* Submit Button */}
        <button
          disabled={isLoading}
          id="submit"
          className="bg-ufc-blue hover:bg-ufc-blue/90 flex w-full items-center justify-center rounded-lg px-6 py-3 text-base font-semibold text-white shadow-md transition duration-200 hover:shadow-lg"
        >
          {isLoading ? (
            <div className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
          ) : (
            <>
              <span>
                Start Subscription • {checkout?.total?.total?.amount}/month
              </span>
            </>
          )}
        </button>

        <p className="mt-4 text-center text-xs text-gray-500">
          By subscribing, you agree to our Terms of Service and Privacy Policy
        </p>
      </form>
    </div>
  );
};

export default CheckoutForm;
