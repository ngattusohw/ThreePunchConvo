import { ChangeEvent } from "react";

// URL validation functions
const validateSocialMediaUrl = (url: string, platform: string): boolean => {
  if (!url.trim()) return true; // Empty URLs are valid (optional)

  try {
    const urlObj = new URL(url);

    switch (platform) {
      case "twitter":
        return (
          urlObj.hostname === "twitter.com" ||
          urlObj.hostname === "x.com" ||
          urlObj.hostname === "www.twitter.com" ||
          urlObj.hostname === "www.x.com"
        );
      case "instagram":
        return (
          urlObj.hostname === "instagram.com" ||
          urlObj.hostname === "www.instagram.com"
        );
      case "youtube":
        return (
          urlObj.hostname === "youtube.com" ||
          urlObj.hostname === "www.youtube.com"
        );
      case "facebook":
        return (
          urlObj.hostname === "facebook.com" ||
          urlObj.hostname === "www.facebook.com"
        );
      default:
        return false;
    }
  } catch {
    return false;
  }
};

const getValidationError = (url: string, platform: string): string | null => {
  if (!url.trim()) return null;

  if (!validateSocialMediaUrl(url, platform)) {
    switch (platform) {
      case "twitter":
        return "Please enter a valid X/Twitter URL (e.g., https://x.com/username)";
      case "instagram":
        return "Please enter a valid Instagram URL (e.g., https://instagram.com/username)";
      case "youtube":
        return "Please enter a valid YouTube URL (e.g., https://youtube.com/@username)";
      case "facebook":
        return "Please enter a valid Facebook URL (e.g., https://facebook.com/username)";
      default:
        return "Invalid URL format";
    }
  }
  return null;
};

interface SocialMediaInputProps {
  platform: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (platform: string, value: string) => void;
  disabled?: boolean;
}

export const SocialMediaInput = ({
  platform,
  label,
  placeholder,
  value,
  onChange,
  disabled = false,
}: SocialMediaInputProps) => {
  const isValid = validateSocialMediaUrl(value, platform);
  const hasError = value && !isValid;

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange(platform, e.target.value);
  };

  return (
    <div>
      <div className='flex items-center justify-between'>
        <label className='block text-sm font-medium text-gray-300'>
          {label}
        </label>
        <span className='text-xs text-gray-400'>{value.length}/100</span>
      </div>
      <div className='relative'>
        <input
          type='url'
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          className={`focus:border-ufc-blue mt-1 w-full rounded-lg border bg-gray-800 p-3 text-white placeholder-gray-400 focus:outline-none ${
            hasError
              ? "border-red-500"
              : value && isValid
                ? "border-green-500"
                : "border-gray-600"
          }`}
          maxLength={100}
          disabled={disabled}
        />
        {hasError && (
          <div className='mt-1 text-xs text-red-400'>
            {getValidationError(value, platform)}
          </div>
        )}
      </div>
    </div>
  );
};

// Export validation functions for use in parent components
export { validateSocialMediaUrl, getValidationError };
