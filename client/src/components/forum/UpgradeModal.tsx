import React from "react";

interface UpgradeModalProps {
    setShowUpgradeModal: (show: boolean) => void;
}

export default function UpgradeModal({
    setShowUpgradeModal
}: UpgradeModalProps) {
  const handleUpgrade = () => {
    // Keep the modal open until we navigate to avoid 404 flash
    // Use setTimeout to let the current event loop complete before navigation
    setTimeout(() => {
      window.location.href = "/checkout";
    }, 100);
  };

  // Handle modal backdrop click to prevent accidental closure
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    console.log('Backdrop clicked');
    // Only close if clicking on the backdrop itself, not on child elements
    if (e.target === e.currentTarget) {
      console.log('Closing modal via backdrop click');

      setShowUpgradeModal(false);
    }
  }; 
  return (
    <div 
        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
        onClick={handleBackdropClick}
    >
        <div className="bg-dark-gray w-full max-w-md rounded-lg p-6">
            <div className="mb-6 text-center">
                <div className="bg-ufc-blue mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
                    <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8 text-black"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                    </svg>
                </div>
                <h3 className="mb-2 text-xl font-bold text-white">
                    Upgrade Required
                </h3>
                <p className="text-gray-300">
                    Creating new posts is only available for paid members. Upgrade
                    your plan to start sharing content!
                </p>
            </div>

            <div className="flex flex-col space-y-3">
                <button
                    onClick={handleUpgrade}
                    className="bg-ufc-blue hover:bg-ufc-blue-dark w-full rounded-lg py-2 font-medium text-black transition"
                >
                    Upgrade Now
                </button>
                <button
                    onClick={() => setShowUpgradeModal(false)}
                    className="w-full rounded-lg border border-gray-600 bg-transparent py-2 font-medium text-white transition hover:bg-gray-800"
                >
                    Maybe Later
                </button>
            </div>
        </div>
    </div>
  );
}
