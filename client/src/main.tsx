import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { ClerkProvider } from "@clerk/clerk-react";
import { dark } from "@clerk/themes";
import App from "./App";
import { queryClient } from "./lib/queryClient";
import "./index.css";
import "./lib/fonts.css";
import { PostHogProvider } from "posthog-js/react";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

const options = {
  api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
};

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key");
}

createRoot(document.getElementById("root")!).render(
  <ClerkProvider
    appearance={{
      baseTheme: dark,
    }}
    publishableKey={PUBLISHABLE_KEY}
    afterSignOutUrl='/'
  >
    <QueryClientProvider client={queryClient}>
      <PostHogProvider
        apiKey={import.meta.env.VITE_PUBLIC_POSTHOG_KEY}
        options={{
          api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
          capture_exceptions: true,
          debug: import.meta.env.MODE === "development",
          enable_recording_console_log: true,
          session_recording: {
            maskAllInputs: false,
            maskInputOptions: {
              password: true,
            },
            recordCrossOriginIframes: false,
          },
        }}
      >
        <App />
      </PostHogProvider>
    </QueryClientProvider>
  </ClerkProvider>,
);
