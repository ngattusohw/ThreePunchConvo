// Image upload validation rules and utilities

export interface ImageUploadRules {
  maxFileSize: number; // in bytes
  maxWidth: number;
  maxHeight: number;
  minWidth: number;
  minHeight: number;
  allowedFormats: string[];
  maxFilesPerUpload: number;
  totalMaxSize: number; // total size for multiple files
}

export interface ImageValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  processedFile?: File;
}

// Default rules for forum thread images
export const DEFAULT_IMAGE_RULES: ImageUploadRules = {
  maxFileSize: 25 * 1024 * 1024, // 25MB (increased from 10MB for iPhone photos)
  maxWidth: 6000, // Increased from 4096 to handle iPhone photos (up to 4032x3024 and beyond)
  maxHeight: 6000, // Increased from 4096 to handle iPhone photos
  minWidth: 50,
  minHeight: 50,
  allowedFormats: [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
  ],
  maxFilesPerUpload: 1,
  totalMaxSize: 25 * 1024 * 1024, // 25MB total
};

// Strict rules for profile pictures
export const PROFILE_IMAGE_RULES: ImageUploadRules = {
  maxFileSize: 5 * 1024 * 1024, // 5MB
  maxWidth: 2048,
  maxHeight: 2048,
  minWidth: 100,
  minHeight: 100,
  allowedFormats: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
  maxFilesPerUpload: 1,
  totalMaxSize: 5 * 1024 * 1024,
};

/**
 * Validates a single image file against the provided rules
 */
export async function validateImageFile(
  file: File,
  rules: ImageUploadRules = DEFAULT_IMAGE_RULES,
): Promise<ImageValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check file type
  if (!rules.allowedFormats.includes(file.type)) {
    errors.push(
      `File format "${file.type}" is not allowed. Supported formats: ${rules.allowedFormats.join(", ")}`,
    );
  }

  // Check file size
  if (file.size > rules.maxFileSize) {
    errors.push(
      `File size (${formatFileSize(file.size)}) exceeds maximum allowed size of ${formatFileSize(rules.maxFileSize)}`,
    );
  }

  // Check if file is corrupted or empty
  if (file.size === 0) {
    errors.push("File appears to be empty or corrupted");
  }

  // For images, validate dimensions
  if (file.type.startsWith("image/")) {
    try {
      const dimensions = await getImageDimensions(file);

      if (
        dimensions.width > rules.maxWidth ||
        dimensions.height > rules.maxHeight
      ) {
        errors.push(
          `Image dimensions (${dimensions.width}×${dimensions.height}) exceed maximum allowed size of ${rules.maxWidth}×${rules.maxHeight}`,
        );
      }

      if (
        dimensions.width < rules.minWidth ||
        dimensions.height < rules.minHeight
      ) {
        errors.push(
          `Image dimensions (${dimensions.width}×${dimensions.height}) are below minimum required size of ${rules.minWidth}×${rules.minHeight}`,
        );
      }

      // Add warnings for edge cases
      const aspectRatio = dimensions.width / dimensions.height;
      if (aspectRatio > 5 || aspectRatio < 0.2) {
        warnings.push(
          "Image has an extreme aspect ratio and may not display well",
        );
      }

      if (dimensions.width > 2048 || dimensions.height > 2048) {
        warnings.push(
          "Large image may take longer to load and use more bandwidth",
        );
      }

      if (file.type === "image/gif" && file.size > 5 * 1024 * 1024) {
        warnings.push("Large GIF files may cause performance issues");
      }
    } catch (error) {
      errors.push("Could not read image dimensions. File may be corrupted");
    }
  }

  // Check for potentially malicious files
  const suspiciousExtensions = [".exe", ".bat", ".cmd", ".scr", ".pif"];
  const fileName = file.name.toLowerCase();
  if (suspiciousExtensions.some((ext) => fileName.includes(ext))) {
    errors.push(
      "File appears to contain executable content and cannot be uploaded",
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validates multiple image files
 */
export async function validateImageFiles(
  files: FileList | File[],
  rules: ImageUploadRules = DEFAULT_IMAGE_RULES,
): Promise<{
  isValid: boolean;
  results: ImageValidationResult[];
  totalErrors: string[];
}> {
  const fileArray = Array.from(files);
  const totalErrors: string[] = [];

  // Check total number of files
  if (fileArray.length > rules.maxFilesPerUpload) {
    totalErrors.push(
      `Too many files. Maximum ${rules.maxFilesPerUpload} files allowed`,
    );
  }

  // Check total size
  const totalSize = fileArray.reduce((sum, file) => sum + file.size, 0);
  if (totalSize > rules.totalMaxSize) {
    totalErrors.push(
      `Total file size (${formatFileSize(totalSize)}) exceeds maximum allowed size of ${formatFileSize(rules.totalMaxSize)}`,
    );
  }

  // Validate each file
  const results = await Promise.all(
    fileArray.map((file) => validateImageFile(file, rules)),
  );

  const hasAnyErrors =
    results.some((result) => !result.isValid) || totalErrors.length > 0;

  return {
    isValid: !hasAnyErrors,
    results,
    totalErrors,
  };
}

/**
 * Gets image dimensions from a file
 */
function getImageDimensions(
  file: File,
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };

    img.src = url;
  });
}

/**
 * Formats file size in human readable format
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

/**
 * Compresses an image if it exceeds certain thresholds
 */
export async function compressImageIfNeeded(
  file: File,
  maxWidth: number = 1920, // Good balance for web display
  maxHeight: number = 1920, // Made square to handle both orientations
  quality: number = 0.8,
): Promise<File> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      const { width, height } = img;

      // For very large images (like iPhone photos), be more aggressive
      let targetMaxWidth = maxWidth;
      let targetMaxHeight = maxHeight;
      let targetQuality = quality;

      // If it's a very large image (likely from phone), use more aggressive compression
      if (width > 3000 || height > 3000) {
        targetMaxWidth = Math.min(maxWidth, 1920);
        targetMaxHeight = Math.min(maxHeight, 1920);
        targetQuality = 0.7; // Lower quality for very large images
      }

      // Calculate new dimensions while maintaining aspect ratio
      let newWidth = width;
      let newHeight = height;

      if (width > targetMaxWidth || height > targetMaxHeight) {
        const aspectRatio = width / height;

        if (width > height) {
          newWidth = targetMaxWidth;
          newHeight = targetMaxWidth / aspectRatio;
        } else {
          newHeight = targetMaxHeight;
          newWidth = targetMaxHeight * aspectRatio;
        }
      }

      canvas.width = newWidth;
      canvas.height = newHeight;

      // Draw and compress
      ctx?.drawImage(img, 0, 0, newWidth, newHeight);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });

            console.log(
              `Compressed ${file.name}: ${Math.round(file.size / 1024)}KB → ${Math.round(blob.size / 1024)}KB`,
            );
            console.log(
              `Resized from ${width}×${height} to ${newWidth}×${newHeight}`,
            );

            resolve(compressedFile);
          } else {
            reject(new Error("Failed to compress image"));
          }
        },
        file.type,
        targetQuality,
      );
    };

    img.onerror = () =>
      reject(new Error("Failed to load image for compression"));
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Checks if a file might be a security risk
 */
export function performSecurityCheck(file: File): {
  isSafe: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  // Check file size (extremely large files could be DOS attacks)
  if (file.size > 50 * 1024 * 1024) {
    issues.push("File size is unusually large");
  }

  // Check MIME type vs file extension consistency
  const extension = file.name.split(".").pop()?.toLowerCase();
  const expectedMimeTypes: { [key: string]: string[] } = {
    jpg: ["image/jpeg"],
    jpeg: ["image/jpeg"],
    png: ["image/png"],
    gif: ["image/gif"],
    webp: ["image/webp"],
  };

  if (extension && expectedMimeTypes[extension]) {
    if (!expectedMimeTypes[extension].includes(file.type)) {
      issues.push("File extension does not match MIME type");
    }
  }

  return {
    isSafe: issues.length === 0,
    issues,
  };
}
