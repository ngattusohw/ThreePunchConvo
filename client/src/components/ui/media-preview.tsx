import React from "react";
import { useAuth } from "@clerk/clerk-react";

interface MediaPreviewProps {
  media: {
    url: string;
    [key: string]: any;
  };
  threadTitle: string;
}

const MediaPreview = ({ media, threadTitle }: MediaPreviewProps) => {
  const { getToken } = useAuth();
  const [isLoading, setIsLoading] = React.useState(true);
  const [hasError, setHasError] = React.useState(false);
  const [errorDetails, setErrorDetails] = React.useState<string>("");
  const [naturalDimensions, setNaturalDimensions] = React.useState({
    width: 0,
    height: 0,
  });
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setNaturalDimensions({
      width: img.naturalWidth,
      height: img.naturalHeight,
    });
    setIsLoading(false);
    console.log("Image loaded successfully:", media.url);
  };

  const handleError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setHasError(true);
    setIsLoading(false);
    const errorMsg = `Network error or image not found`;
    setErrorDetails(errorMsg);
    console.error("Failed to load image:", media.url, e);

    // Try to fetch the URL with auth headers to get more specific error info
    getToken()
      .then((token) => {
        const headers: HeadersInit = {};
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        return fetch(media.url, { headers });
      })
      .then((response) => {
        console.log(
          "Fetch response for",
          media.url,
          ":",
          response.status,
          response.statusText,
        );
        if (!response.ok) {
          setErrorDetails(`HTTP ${response.status}: ${response.statusText}`);
        }
      })
      .catch((error) => {
        console.error("Fetch error for", media.url, ":", error);
        setErrorDetails(`Network error: ${error.message}`);
      });
  };

  // Debug: Log the media URL and test accessibility
  React.useEffect(() => {
    console.log("MediaPreview loading image:", media.url);

    // Test if the URL is accessible with auth
    getToken()
      .then((token) => {
        const headers: HeadersInit = { method: "HEAD" };
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        return fetch(media.url, {
          method: "HEAD",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
      })
      .then((response) => {
        console.log("HEAD request result for", media.url, ":", response.status);
        if (!response.ok) {
          console.warn(
            "Image may not be accessible:",
            response.status,
            response.statusText,
          );
        }
      })
      .catch((error) => {
        console.error("Cannot access image URL:", media.url, error);
      });
  }, [media.url, getToken]);

  // Determine if image is very wide (panoramic) or very tall
  const aspectRatio = naturalDimensions.width / naturalDimensions.height;
  const isVeryWide = aspectRatio > 3;
  const isVeryTall = aspectRatio < 0.5;
  const isSmall =
    naturalDimensions.width < 200 && naturalDimensions.height < 200;

  // Get appropriate CSS classes based on image characteristics
  const getImageClasses = () => {
    let classes = "transition-opacity duration-300 cursor-pointer";

    if (isSmall) {
      // Small images: don't stretch, center them
      classes += " max-w-full max-h-96 object-contain mx-auto";
    } else if (isVeryWide) {
      // Very wide images: limit height more aggressively
      classes += " w-full max-h-48 object-contain";
    } else if (isVeryTall) {
      // Very tall images: limit width and height
      classes += " max-w-full max-h-96 object-contain mx-auto";
    } else {
      // Normal aspect ratio images
      classes += " w-full max-h-80 object-contain";
    }

    return classes;
  };

  if (hasError) {
    return (
      <div className='flex h-32 items-center justify-center rounded-lg bg-gray-800'>
        <div className='text-center text-gray-400'>
          <svg
            className='mx-auto mb-2 h-8 w-8'
            fill='none'
            viewBox='0 0 24 24'
            stroke='currentColor'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z'
            />
          </svg>
          <p className='text-sm'>Failed to load media</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className='relative'>
        {isLoading && (
          <div className='absolute inset-0 z-10 flex h-32 items-center justify-center rounded-lg bg-gray-800'>
            <div className='h-8 w-8 animate-spin rounded-full border-b-2 border-blue-500'></div>
          </div>
        )}
        <img
          src={media.url}
          alt={`Media for ${threadTitle}`}
          className={`${getImageClasses()} ${isLoading ? "opacity-0" : "opacity-100"}`}
          onLoad={handleLoad}
          onError={handleError}
          loading='lazy'
          onClick={() => setIsModalOpen(true)}
        />
        {/* Show file type indicator for GIFs and other special formats */}
        {media.url.toLowerCase().includes(".gif") &&
          !isLoading &&
          !hasError && (
            <div className='absolute right-2 top-2 rounded bg-black bg-opacity-75 px-2 py-1 text-xs text-white'>
              GIF
            </div>
          )}
        {/* Show dimensions for very large images */}
        {!isLoading &&
          !hasError &&
          (naturalDimensions.width > 1920 ||
            naturalDimensions.height > 1080) && (
            <div className='absolute bottom-2 right-2 rounded bg-black bg-opacity-75 px-2 py-1 text-xs text-white'>
              {naturalDimensions.width} × {naturalDimensions.height}
            </div>
          )}
      </div>

      {/* Modal for full-size image */}
      {isModalOpen && (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90'
          onClick={() => setIsModalOpen(false)}
        >
          <div className='relative max-h-[90vh] max-w-[90vw]'>
            <button
              className='absolute right-4 top-4 z-10 text-white hover:text-gray-300'
              onClick={() => setIsModalOpen(false)}
            >
              <svg
                className='h-8 w-8'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M6 18L18 6M6 6l12 12'
                />
              </svg>
            </button>
            <img
              src={media.url}
              alt={`Media for ${threadTitle}`}
              className='max-h-[90vh] max-w-full object-contain'
            />
          </div>
        </div>
      )}
    </>
  );
};

export default MediaPreview;
