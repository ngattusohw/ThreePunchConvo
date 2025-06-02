import React, { useState } from "react";
import {
  PaymentElement,
  useCheckout,
} from '@stripe/react-stripe-js';
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
    if (confirmResult.type === 'error') {
      toast({
        title: "Payment Error",
        description: confirmResult.error.message,
        variant: "destructive"
      });
    }

    setIsLoading(false);
  };

  return (
    <div className="flex flex-col p-6 max-w-md mx-auto">
      <form onSubmit={handleSubmit}>
        <h4 className="text-lg font-semibold mb-4 text-white">Payment</h4>
        <p className="text-gray-300 mb-4">
          Your payment is being processed using the email: {user?.emailAddresses[0]?.emailAddress}
        </p>
        <PaymentElement id="payment-element" />
        <button 
          disabled={isLoading}
          id="submit"
          className="bg-ufc-blue hover:bg-ufc-blue-dark text-black font-medium px-4 py-2 rounded-lg text-sm flex-shrink-0 flex items-center transition whitespace-nowrap mt-6"
        >
          {isLoading ? (
            <div className="spinner"></div>
          ) : (
            `Pay ${checkout.total.total.amount} now`
          )}
        </button>
      </form>
    </div>
  );
}

export default CheckoutForm;