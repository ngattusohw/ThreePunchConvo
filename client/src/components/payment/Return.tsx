import React, { useState, useEffect } from "react";
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
  const [customerEmail, setCustomerEmail] = useState("");
  const [, setLocation] = useLocation();

  useEffect(() => {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const sessionId = urlParams.get("session_id");

    fetch(`/session-status?session_id=${sessionId}`)
      .then((res) => res.json())
      .then((data) => {
        setStatus(data.status);
        setCustomerEmail(data.customer_email);
      })
      .catch((err) => {
        console.error("Error fetching client secret:", err);
        return null; // TODO reroute to error page
      });
  }, []);

  if (status === "open") {
    setLocation("/checkout");
    return null;
  }

  if (status === "complete") {
    return (
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
          className="bg-ufc-blue hover:bg-ufc-blue-dark mt-2 flex w-full items-center justify-center rounded-lg px-6 py-3 text-base font-semibold text-white shadow-md transition"
          onClick={() => (window.location.href = "/forum")}
        >
          Go to Forum
        </button>
      </div>
    );
  }

  return null;
};
