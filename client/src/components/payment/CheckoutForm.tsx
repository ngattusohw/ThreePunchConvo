import React, { useState } from "react";
import {
  PaymentElement,
  useCheckout,
} from '@stripe/react-stripe-js';
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@clerk/clerk-react";

const validateEmail = async (email, checkout) => {
  const updateResult = await checkout.updateEmail(email);
  const isValid = updateResult.type !== "error";

  return { isValid, message: !isValid ? updateResult.error.message : null };
}

const EmailInput = ({ email, setEmail, error, setError }) => {
  const checkout = useCheckout();

  const handleBlur = async () => {
    if (!email) {
      return;
    }

    const { isValid, message } = await validateEmail(email, checkout);
    if (!isValid) {
      setError(message);
    }
  };

  const handleChange = (e) => {
    setError(null);
    setEmail(e.target.value);
  };

  return (
    <>
      <div className="mb-4">
        <label htmlFor="email-checkout" className="block text-gray-300 mb-2 font-medium">Email</label>
        <input 
          type="text" 
          id="email-checkout" 
          placeholder={"you@example.com"}
          value={email}
          onChange={handleChange}
          onBlur={handleBlur}
          className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white w-full focus:outline-none focus:ring-1 focus:ring-ufc-blue"
        />
      </div>
      {error && <div id="email-errors">{error}</div>}
    </>
  );
};

const CheckoutForm = () => {
  const checkout = useCheckout();
  const { toast } = useToast();
  const { user } = useUser();

  const [email, setEmail] = useState(user?.emailAddresses[0]?.emailAddress ? user?.emailAddresses[0]?.emailAddress : '');
  const [emailError, setEmailError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setIsLoading(true);

    const { isValid, message } = await validateEmail(email, checkout);
    if (!isValid) {
      setEmailError(message);
      toast({
        title: "Error",
        description: message,
        variant: "destructive"
      });
      setIsLoading(false);
      return;
    }

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
        <EmailInput
          email={email}
          setEmail={setEmail}
          error={emailError}
          setError={setEmailError}
        />
        <h4>Payment</h4>
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