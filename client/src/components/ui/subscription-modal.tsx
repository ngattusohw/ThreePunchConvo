import { useState } from "react";
import { CreditCard, Crown, X } from "lucide-react";
import { useUserProfile } from "@/api/hooks/useUserProfile";
import { useStripePlans } from "@/api/hooks/useStripePlans";
import { createCustomerPortalSession } from "@/api/queries/user";
import { useToast } from "@/hooks/use-toast";

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  username?: string;
}

export function SubscriptionModal({
  isOpen,
  onClose,
  username,
}: SubscriptionModalProps) {
  const { user: currentUser, isPlanLoading } = useUserProfile(username);
  const { plans, isLoading: isPlansLoading } = useStripePlans();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) {
    return null;
  }

  const currentPlan = currentUser?.planType || "FREE";
  const hasSubscription = currentPlan !== "FREE";
  const currentPlanPrice = plans.find((plan) =>
    plan.name.toUpperCase().includes(currentUser?.planType || "FREE"),
  )?.price;

  const handleManageBilling = async () => {
    if (!currentUser?.stripeId) {
      toast({
        title: "Error",
        description: "Unable to access billing. Please contact support.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const portalUrl = await createCustomerPortalSession(currentUser.stripeId);
      window.location.href = portalUrl;
    } catch (error) {
      console.error("Error creating portal session:", error);
      toast({
        title: "Error",
        description: "Failed to open billing portal. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50'>
      <div className='bg-ufc-black mx-4 w-full max-w-md rounded-lg border border-gray-700 p-6'>
        <div className='mb-4 flex items-center justify-between'>
          <div className='flex items-center space-x-3'>
            <CreditCard className='h-6 w-6 text-blue-500' />
            <h2 className='text-xl font-semibold text-white'>
              {hasSubscription ? "Manage Subscription" : "Upgrade Plan"}
            </h2>
          </div>
          <button onClick={onClose} className='text-gray-400 hover:text-white'>
            <X className='h-5 w-5' />
          </button>
        </div>

        {isPlanLoading || isPlansLoading ? (
          <div className='mb-6'>
            <div className='animate-pulse space-y-3'>
              <div className='h-4 rounded bg-gray-700'></div>
              <div className='h-4 w-3/4 rounded bg-gray-700'></div>
            </div>
          </div>
        ) : hasSubscription ? (
          <>
            <div className='mb-4 rounded-lg border border-blue-800 bg-blue-900/20 p-4'>
              <div className='mb-2 flex items-center space-x-2'>
                <Crown className='h-5 w-5 text-yellow-400' />
                <p className='text-sm font-medium text-blue-300'>
                  Current Plan: {currentPlan}
                </p>
              </div>
              <p className='text-sm text-blue-300'>
                You currently have an active subscription. Manage your billing
                and subscription settings here.
              </p>
            </div>

            {/* Plan Details Section */}
            <div className='mb-6 space-y-4'>
              <div className='rounded-lg border border-gray-700 bg-gray-800/50 p-4'>
                <h3 className='mb-3 text-lg font-semibold text-white'>
                  Plan Details
                </h3>

                <div className='space-y-3'>
                  <div className='flex items-center justify-between'>
                    <span className='text-gray-400'>Plan Type:</span>
                    <span className='font-medium text-white'>
                      {currentPlan}
                    </span>
                  </div>

                  <div className='flex items-center justify-between'>
                    <span className='text-gray-400'>Status:</span>
                    <span className='flex items-center font-medium text-green-400'>
                      <div className='mr-2 h-2 w-2 rounded-full bg-green-400'></div>
                      Active
                    </span>
                  </div>

                  <div className='flex items-center justify-between'>
                    <span className='text-gray-400'>Billing Cycle:</span>
                    <span className='text-white'>Monthly</span>
                  </div>

                  {currentPlanPrice && (
                    <div className='flex items-center justify-between'>
                      <span className='text-gray-400'>Price:</span>
                      <span className='text-white'>
                        ${currentPlanPrice / 100}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className='flex space-x-3'>
              <button
                onClick={onClose}
                className='flex-1 rounded bg-gray-600 px-4 py-2 text-white hover:bg-gray-700'
              >
                Close
              </button>
              <button
                onClick={handleManageBilling}
                disabled={isLoading}
                className='flex-1 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50'
              >
                {isLoading ? (
                  <div className='flex items-center justify-center'>
                    <div className='mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent'></div>
                    Opening...
                  </div>
                ) : (
                  "Manage Billing"
                )}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className='mb-4 rounded-lg border border-gray-800 bg-gray-900/20 p-4'>
              <p className='text-sm text-gray-300'>
                You are currently on the FREE plan. Upgrade to unlock premium
                features and enhance your experience.
              </p>
            </div>

            {/* Current Plan Details Section */}
            <div className='mb-6 space-y-4'>
              <div className='rounded-lg border border-gray-700 bg-gray-800/50 p-4'>
                <h3 className='mb-3 text-lg font-semibold text-white'>
                  Current Plan Details
                </h3>

                <div className='space-y-3'>
                  <div className='flex items-center justify-between'>
                    <span className='text-gray-400'>Plan Type:</span>
                    <span className='font-medium text-white'>FREE</span>
                  </div>

                  <div className='flex items-center justify-between'>
                    <span className='text-gray-400'>Status:</span>
                    <span className='flex items-center font-medium text-gray-400'>
                      <div className='mr-2 h-2 w-2 rounded-full bg-gray-400'></div>
                      Active
                    </span>
                  </div>

                  <div className='flex items-center justify-between'>
                    <span className='text-gray-400'>Price:</span>
                    <span className='text-white'>$0.00/month</span>
                  </div>
                </div>
              </div>

              <div className='rounded-lg border border-yellow-800 bg-yellow-900/20 p-4'>
                <h3 className='mb-3 text-lg font-semibold text-yellow-300'>
                  Upgrade to Unlock
                </h3>

                <ul className='space-y-2 text-sm'>
                  <li className='flex items-center text-yellow-300'>
                    <div className='mr-3 h-2 w-2 rounded-full bg-yellow-500'></div>
                    Reply to Pro Fighter posts
                  </li>
                  <li className='flex items-center text-yellow-300'>
                    <div className='mr-3 h-2 w-2 rounded-full bg-yellow-500'></div>
                    Accumulate fight cred
                  </li>
                  <li className='flex items-center text-yellow-300'>
                    <div className='mr-3 h-2 w-2 rounded-full bg-yellow-500'></div>
                    Early access to new features
                  </li>
                  <li className='flex items-center text-yellow-300'>
                    <div className='mr-3 h-2 w-2 rounded-full bg-yellow-500'></div>
                    Vote in robbery insurance polls
                  </li>
                  <li className='flex items-center text-yellow-300'>
                    <div className='mr-3 h-2 w-2 rounded-full bg-yellow-500'></div>
                    Support active fighters
                  </li>
                </ul>
              </div>
            </div>

            <div className='flex space-x-3'>
              <button
                onClick={onClose}
                className='flex-1 rounded bg-gray-600 px-4 py-2 text-white hover:bg-gray-700'
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  window.location.href = "/checkout";
                }}
                className='flex-1 rounded bg-yellow-600 px-4 py-2 text-white hover:bg-yellow-700'
              >
                Upgrade Now
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
