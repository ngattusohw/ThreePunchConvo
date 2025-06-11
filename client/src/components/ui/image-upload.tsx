import React, { useRef } from 'react';
import { useImageUpload } from '@/hooks/useImageUpload';
import { DEFAULT_IMAGE_RULES, PROFILE_IMAGE_RULES, ImageUploadRules } from '@/lib/image-upload-validation';

interface ImageUploadProps {
  onFilesSelected: (files: File[]) => void;
  multiple?: boolean;
  rules?: ImageUploadRules;
  accept?: string;
  className?: string;
  children?: React.ReactNode;
  variant?: 'default' | 'profile';
  disabled?: boolean;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  onFilesSelected,
  multiple = true,
  rules,
  accept = 'image/*',
  className = '',
  children,
  variant = 'default',
  disabled = false
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Select rules based on variant if not explicitly provided
  const uploadRules = rules || (variant === 'profile' ? PROFILE_IMAGE_RULES : DEFAULT_IMAGE_RULES);
  
  const {
    isValidating,
    isCompressing,
    validationErrors,
    validationWarnings,
    handleFileSelection
  } = useImageUpload({
    rules: uploadRules,
    autoCompress: true,
    onValidationComplete: (results) => {
      console.log('Validation completed:', results);
    },
    onError: (errors) => {
      console.error('Upload validation errors:', errors);
    }
  });

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    event.preventDefault();
    event.stopPropagation();
    
    const files = event.target.files;
    if (!files || files.length === 0) return;

    console.log('Files selected:', files.length);
    
    try {
      const validatedFiles = await handleFileSelection(files);
      console.log('Validated files:', validatedFiles.length);
      
      if (validatedFiles.length > 0) {
        onFilesSelected(validatedFiles);
      }
    } catch (error) {
      console.error('Error processing files:', error);
    }

    // Reset input value to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (disabled) return;

    const files = event.dataTransfer.files;
    if (files.length === 0) return;

    console.log('Files dropped:', files.length);

    try {
      const validatedFiles = await handleFileSelection(files);
      console.log('Validated dropped files:', validatedFiles.length);
      
      if (validatedFiles.length > 0) {
        onFilesSelected(validatedFiles);
      }
    } catch (error) {
      console.error('Error processing dropped files:', error);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const openFileDialog = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getAcceptedFormats = () => {
    return uploadRules.allowedFormats
      .map(format => format.replace('image/', '').toUpperCase())
      .join(', ');
  };

  return (
    <div className={`relative ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple && uploadRules.maxFilesPerUpload > 1}
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled}
        form=""
      />

      <div
        onClick={openFileDialog}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${disabled 
            ? 'border-gray-600 bg-gray-800 cursor-not-allowed' 
            : 'border-gray-500 hover:border-blue-500 hover:bg-gray-800'
          }
          ${(isValidating || isCompressing) ? 'pointer-events-none opacity-75' : ''}
        `}
      >
        {children || (
          <div className="space-y-2">
            <div className="flex justify-center">
              {(isValidating || isCompressing) ? (
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              ) : (
                <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              )}
            </div>
            
            <div className="text-sm text-gray-300">
              {isValidating && <p>Validating files...</p>}
              {isCompressing && <p>Compressing images...</p>}
              {!isValidating && !isCompressing && (
                <>
                  <p className="font-medium">
                    {multiple && uploadRules.maxFilesPerUpload > 1
                      ? `Choose images or drag and drop`
                      : `Choose an image or drag and drop`
                    }
                  </p>
                  <p className="text-xs text-gray-400">
                    {getAcceptedFormats()} up to {formatFileSize(uploadRules.maxFileSize)}
                    {multiple && uploadRules.maxFilesPerUpload > 1 && 
                      ` (max ${uploadRules.maxFilesPerUpload} files)`
                    }
                  </p>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Error Messages */}
      {validationErrors.length > 0 && (
        <div className="mt-2 p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
          <div className="flex items-start">
            <svg className="h-5 w-5 text-red-400 mt-0.5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <h4 className="text-sm font-medium text-red-400 mb-1">Upload Error</h4>
              <ul className="text-sm text-red-300 space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Warning Messages */}
      {validationWarnings.length > 0 && (
        <div className="mt-2 p-3 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
          <div className="flex items-start">
            <svg className="h-5 w-5 text-yellow-400 mt-0.5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <h4 className="text-sm font-medium text-yellow-400 mb-1">Warnings</h4>
              <ul className="text-sm text-yellow-300 space-y-1">
                {validationWarnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Upload Rules Info */}
      <div className="mt-2 text-xs text-gray-500">
        <p>Max file size: {formatFileSize(uploadRules.maxFileSize)}</p>
        <p>Max dimensions: {uploadRules.maxWidth} × {uploadRules.maxHeight}px</p>
        <p>Supported formats: {getAcceptedFormats()}</p>
        {multiple && uploadRules.maxFilesPerUpload > 1 && (
          <p>Max files: {uploadRules.maxFilesPerUpload}</p>
        )}
      </div>
    </div>
  );
};

export default ImageUpload; 