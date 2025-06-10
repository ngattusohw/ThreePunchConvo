import { useState, useCallback } from 'react';
import {
  validateImageFiles,
  compressImageIfNeeded,
  performSecurityCheck,
  ImageUploadRules,
  ImageValidationResult,
  DEFAULT_IMAGE_RULES
} from '@/lib/image-upload-validation';

interface UseImageUploadOptions {
  rules?: ImageUploadRules;
  autoCompress?: boolean;
  onValidationComplete?: (results: ImageValidationResult[]) => void;
  onError?: (errors: string[]) => void;
}

interface UseImageUploadReturn {
  isValidating: boolean;
  isCompressing: boolean;
  validatedFiles: File[];
  validationErrors: string[];
  validationWarnings: string[];
  handleFileSelection: (files: FileList | File[]) => Promise<File[]>;
  clearFiles: () => void;
  validateAndProcessFiles: (files: FileList | File[]) => Promise<File[]>;
}

export function useImageUpload(options: UseImageUploadOptions = {}): UseImageUploadReturn {
  const {
    rules = DEFAULT_IMAGE_RULES,
    autoCompress = true,
    onValidationComplete,
    onError
  } = options;

  const [isValidating, setIsValidating] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [validatedFiles, setValidatedFiles] = useState<File[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);

  const validateAndProcessFiles = useCallback(async (files: FileList | File[]): Promise<File[]> => {
    setIsValidating(true);
    setValidationErrors([]);
    setValidationWarnings([]);

    try {
      // First, perform security checks
      const fileArray = Array.from(files);
      const securityIssues: string[] = [];

      for (const file of fileArray) {
        const securityCheck = performSecurityCheck(file);
        if (!securityCheck.isSafe) {
          securityIssues.push(...securityCheck.issues.map(issue => `${file.name}: ${issue}`));
        }
      }

      if (securityIssues.length > 0) {
        setValidationErrors(securityIssues);
        onError?.(securityIssues);
        return [];
      }

      // Validate files
      const validationResult = await validateImageFiles(files, rules);
      
      // Collect all errors and warnings
      const allErrors = [
        ...validationResult.totalErrors,
        ...validationResult.results.flatMap(result => result.errors)
      ];
      
      const allWarnings = validationResult.results.flatMap(result => result.warnings);

      setValidationErrors(allErrors);
      setValidationWarnings(allWarnings);

      if (!validationResult.isValid) {
        onError?.(allErrors);
        return [];
      }

      // Get valid files
      const validFiles = fileArray.filter((_, index) => validationResult.results[index].isValid);

      // Compress files if needed and enabled
      let processedFiles = validFiles;
      if (autoCompress && validFiles.length > 0) {
        setIsCompressing(true);
        try {
          processedFiles = await Promise.all(
            validFiles.map(async (file) => {
              if (file.type.startsWith('image/') && file.type !== 'image/gif') {
                // Don't compress GIFs as it would break animation
                return await compressImageIfNeeded(file);
              }
              return file;
            })
          );
        } catch (compressionError) {
          console.error('Compression failed:', compressionError);
          // Fall back to original files if compression fails
          processedFiles = validFiles;
        }
        setIsCompressing(false);
      }

      setValidatedFiles(processedFiles);
      onValidationComplete?.(validationResult.results);

      return processedFiles;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown validation error';
      setValidationErrors([errorMessage]);
      onError?.([errorMessage]);
      return [];
    } finally {
      setIsValidating(false);
    }
  }, [rules, autoCompress, onValidationComplete, onError]);

  const handleFileSelection = useCallback(async (files: FileList | File[]): Promise<File[]> => {
    if (!files || files.length === 0) {
      return [];
    }

    return await validateAndProcessFiles(files);
  }, [validateAndProcessFiles]);

  const clearFiles = useCallback(() => {
    setValidatedFiles([]);
    setValidationErrors([]);
    setValidationWarnings([]);
  }, []);

  return {
    isValidating,
    isCompressing,
    validatedFiles,
    validationErrors,
    validationWarnings,
    handleFileSelection,
    clearFiles,
    validateAndProcessFiles
  };
} 