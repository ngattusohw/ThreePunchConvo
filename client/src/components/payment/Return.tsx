import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";

export const Return = () => {
  const [status, setStatus] = useState(null);
  const [customerEmail, setCustomerEmail] = useState('');
  const [, setLocation] = useLocation();

  useEffect(() => {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const sessionId = urlParams.get('session_id');

    fetch(`/session-status?session_id=${sessionId}`)
      .then((res) => res.json())
      .then((data) => {
        setStatus(data.status);
        setCustomerEmail(data.customer_email);
      })
      .catch(err => {
        console.error("Error fetching client secret:", err);
        return null; // TODO reroute to error page
      });
  }, []);

  if (status === 'open') {
    setLocation("/checkout");
    return null;
  }

  if (status === 'complete') {
    return (
      <div className="flex flex-col p-6 max-w-md mx-auto">
        <section id="success">
          {/* TODO change  */}
          <p className="text-white">
            We appreciate your business! A confirmation email will be sent to {customerEmail}. 
            <br /><br />
            If you have any questions, please email <a href="mailto:orders@example.com">orders@example.com</a>.
          </p>
        </section>
        <div>
          <button 
            className="bg-ufc-blue hover:bg-ufc-blue-dark text-black font-medium px-4 py-2 rounded-lg text-sm flex-shrink-0 flex items-center transition whitespace-nowrap mt-6"
            onClick={() => setLocation("/forum")}
          >
          Return to Home 
          </button>
        </div>
      </div>
    )
  }

  return null;
}
