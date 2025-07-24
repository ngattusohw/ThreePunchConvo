import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";

const CheckCircleSVG = ({ className = "" }) => (
  <svg
    className={className}
    fill="currentColor"
    viewBox="0 0 20 20"
    height="1em"
    width="1em"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fillRule="evenodd"
      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
      clipRule="evenodd"
    />
  </svg>
);

export const Return = () => {
  const [status, setStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showStickyButton, setShowStickyButton] = useState(false);
  const [, setLocation] = useLocation();
  const originalButtonRef = useRef(null);

  useEffect(() => {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const sessionId = urlParams.get("session_id");

    fetch(`/session-status?session_id=${sessionId}`)
      .then((res) => res.json())
      .then((data) => {
        setStatus(data.status);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching client secret:", err);
        setIsLoading(false);
        return null; // TODO reroute to error page
      });
  }, []);

  // Intersection Observer to track original button visibility
  useEffect(() => {
    if (!originalButtonRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Show sticky button when original button is NOT in view
        setShowStickyButton(!entry.isIntersecting);
      },
      {
        threshold: 0.1, // Trigger when 10% of the button is visible
        rootMargin: "0px 0px -50px 0px" // Add some margin to trigger slightly before it's fully hidden
      }
    );

    observer.observe(originalButtonRef.current);

    return () => {
      observer.disconnect();
    };
  }, [status]); // Re-run when status changes to ensure we observe the right element

  const handleGoToForum = () => {
    window.location.href = "/forum";
  };

  // Show loading spinner while fetching status
  if (isLoading) {
    return (
      <div className="mx-auto my-10 flex max-w-md flex-col items-center justify-center rounded-xl border border-gray-800 bg-gradient-to-br from-gray-900 to-gray-800 p-8 shadow-2xl">
        <div className='border-ufc-blue mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-t-2'></div>
        <p className="text-gray-300 mt-4 text-center">Loading...</p>
      </div>
    );
  }

  if (status === "open") {
    setLocation("/checkout");
    return null;
  }

  if (status === "complete") {
    return (
      <>
        <div className="mx-auto my-10 flex max-w-md flex-col rounded-xl border border-gray-800 bg-gradient-to-br from-gray-900 to-gray-800 p-8 shadow-2xl">
          <div className="flex flex-col items-center">
            <CheckCircleSVG className="h-16 w-16 text-green-400 mb-4" />
            <h2 className="text-3xl font-bold text-white mb-2">Thank you for subscribing!</h2>
            <p className="text-lg text-gray-300 mb-6 text-center">
              Your <span className="font-semibold text-ufc-blue">3 Punch Subscription</span> is now active.
            </p>
          </div>
          <div className="mb-8 rounded-xl border border-gray-700 bg-gradient-to-br from-gray-800 to-gray-900 p-6 shadow-md">
            <div className="mb-4 flex items-center justify-between">
              <h5 className="text-xl font-bold text-white">3 Punch Subscription</h5>
              <span className="bg-ufc-blue/20 text-ufc-blue rounded-full px-3 py-1 text-sm font-medium">
                Monthly
              </span>
            </div>
            <div className="mb-5 space-y-4">
              <div className="flex items-center">
                <span className="text-ufc-blue mr-3">
                  <CheckCircleSVG className="h-5 w-5" />
                </span>
                <p className="text-gray-200">Create and publish your own posts</p>
              </div>
              <div className="flex items-center">
                <span className="text-ufc-blue mr-3">
                  <CheckCircleSVG className="h-5 w-5" />
                </span>
                <p className="text-gray-200">Reply to other community posts</p>
              </div>
              <div className="flex items-center">
                <span className="text-ufc-blue mr-3 ">
                  <CheckCircleSVG className="h-5 w-5" />
                </span>
                <p className="text-gray-200">Exclusive access to fighter content</p>
              </div>
            </div>
          </div>

          <p className="text-center text-gray-400 mb-4">
            If you have any questions, please email{" "}
            <a href="mailto:3punchconvo@gmail.com" className="text-ufc-blue underline">
              3punchconvo@gmail.com
            </a>
            .
          </p>
          <button
            ref={originalButtonRef}
            className="bg-ufc-blue hover:bg-ufc-blue-dark mt-2 flex w-full items-center justify-center rounded-lg px-6 py-3 text-base font-semibold text-white shadow-md transition"
            onClick={handleGoToForum}
          >
            Go to Forum
          </button>
        </div>

        {/* Sticky Go to Forum Button - only show when original is not visible */}
        {showStickyButton && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-8">
            <button
              className="w-full bg-ufc-blue hover:bg-ufc-blue-dark flex items-center justify-center rounded-lg px-6 py-3 text-base font-semibold text-white shadow-md transition animate-in fade-in slide-in-from-bottom-4"
              onClick={handleGoToForum}
            >
              Go to Forum
            </button>
          </div>
        )}
      </>
    );
  }

  return null;
};
