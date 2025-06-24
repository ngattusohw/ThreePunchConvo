import React from "react";

interface DebugPanelProps {
  clientSecret: string | null;
  isLoadingClientSecret: boolean;
  isLoaded: boolean;
  isSignedIn: boolean | undefined;
  userId: string | null | undefined;
  error: string | null;
}

const DebugPanel: React.FC<DebugPanelProps> = ({
  clientSecret,
  isLoadingClientSecret,
  isLoaded,
  isSignedIn,
  userId,
  error,
}) => {
  return (
    <div className='fixed bottom-0 right-0 z-50 max-h-[50vh] max-w-md overflow-auto rounded-tl-lg bg-black bg-opacity-80 p-4 text-sm text-white'>
      <h3 className='mb-2 text-lg font-bold'>Debug Panel</h3>
      <div className='grid grid-cols-2 gap-1'>
        <div className='font-semibold'>Auth Loaded:</div>
        <div>{isLoaded ? "✅" : "❌"}</div>

        <div className='font-semibold'>Signed In:</div>
        <div>{isSignedIn ? "✅" : "❌"}</div>

        <div className='font-semibold'>User ID:</div>
        <div className='break-all'>{userId || "None"}</div>

        <div className='font-semibold'>Loading Secret:</div>
        <div>{isLoadingClientSecret ? "⏳" : "✅"}</div>

        <div className='font-semibold'>Client Secret:</div>
        <div>
          {clientSecret
            ? `${clientSecret.substring(0, 10)}...${clientSecret.substring(clientSecret.length - 10)}`
            : "None"}
        </div>

        <div className='font-semibold'>Secret Format:</div>
        <div>
          {clientSecret?.includes("_secret_") ? "✅ Valid" : "❌ Invalid"}
        </div>

        <div className='font-semibold'>Secret Length:</div>
        <div>{clientSecret?.length || 0} chars</div>
      </div>

      {error && (
        <div className='mt-2 text-red-400'>
          <div className='font-semibold'>Error:</div>
          <div className='break-all'>{error}</div>
        </div>
      )}

      <button
        className='mt-4 rounded bg-gray-700 px-2 py-1 text-xs text-white hover:bg-gray-600'
        onClick={() => window.location.reload()}
      >
        Reload Page
      </button>
    </div>
  );
};

export default DebugPanel;
