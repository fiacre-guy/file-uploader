'use client'

import { useState, useRef, ChangeEvent, DragEvent, useEffect } from 'react';
import { X, Upload, Check, AlertCircle, File, Trash2, Save } from 'lucide-react';

interface FileUploadProps {
  multiple?: boolean;
  acceptedTypes?: string[];
  maxSizeMB?: number;
  onUpload?: (files: File[]) => void;
  className?: string;
  label?: string;
  description?: string;
  maxHeight?: string;
  showProgress?: boolean;
}

export default function FileUploader({
  multiple = false,
  acceptedTypes = [],
  maxSizeMB = 5,
  onUpload = () => {},
  className = '',
  label = 'Upload Files',
  description = 'Drag and Drop the files',
  maxHeight = 'max-h-96',
  showProgress = true,
}: FileUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadSuccess, setUploadSuccess] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileListRef = useRef<HTMLDivElement>(null);

  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  
  const acceptedTypesString = acceptedTypes.join(',') || undefined;
  
  // Reset progress when starting a new upload
  useEffect(() => {
    if (isUploading) {
      setUploadProgress(0);
      const timer = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 95) {
            clearInterval(timer);
            return 95; // Cap at 95% until actual completion
          }
          return prev + Math.random() * 10;
        });
      }, 500);
      
      return () => clearInterval(timer);
    }
  }, [isUploading]);
  
  // Scroll to bottom of file list when new files are added
  useEffect(() => {
    if (fileListRef.current && files.length > 0) {
      fileListRef.current.scrollTop = fileListRef.current.scrollHeight;
    }
  }, [files.length]);
  
  // Handle file validation
  const validateFiles = (fileList: FileList): File[] => {
    const newErrors: string[] = [];
    const validFiles: File[] = [];
    
    Array.from(fileList).forEach(file => {
      // Check file type if acceptedTypes is provided
      if (acceptedTypes.length > 0 && !acceptedTypes.some(type => {
        if (type.includes('/*')) {
          const mainType = type.split('/')[0];
          return file.type.startsWith(`${mainType}/`);
        }
        return file.type === type;
      })) {
        newErrors.push(`"${file.name}" has an invalid file type. Accepted types: ${acceptedTypes.join(', ')}`);
        return;
      }
      
      // Check file size
      if (file.size > maxSizeBytes) {
        newErrors.push(`"${file.name}" exceeds maximum size of ${maxSizeMB}MB`);
        return;
      }
      
      validFiles.push(file);
    });
    
    setErrors(newErrors);
    return validFiles;
  };
  
  // Handle file selection
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;
    
    const validFiles = validateFiles(selectedFiles);
    
    if (validFiles.length > 0) {
      if (!multiple) {
        setFiles([validFiles[0]]);
      } else {
        setFiles(prevFiles => [...prevFiles, ...validFiles]);
      }
    }
    
    // Reset the input value to allow uploading the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // Handle drag events
  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  
  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };
  
  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const validFiles = validateFiles(e.dataTransfer.files);
      
      if (validFiles.length > 0) {
        if (!multiple) {
          setFiles([validFiles[0]]);
        } else {
          setFiles(prevFiles => [...prevFiles, ...validFiles]);
        }
      }
    }
  };
  
  // Remove a file
  const removeFile = (indexToRemove: number) => {
    setFiles(files.filter((_, index) => index !== indexToRemove));
  };
  
  // Clear all files
  const clearFiles = () => {
    setFiles([]);
  };
  
  // Handle file upload
  const handleUpload = async () => {
    if (files.length === 0) {
      setErrors(['No files selected for upload']);
      return;
    }
    
    setIsUploading(true);
    setErrors([]);
    setUploadSuccess(false);
    
    try {
      // Create FormData for API call
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });
      
      // Mock API call - replace with actual upload API
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Call the onUpload callback with the files
      onUpload(files);
      
      setUploadProgress(100);
      setUploadSuccess(true);
      
      // Reset success status after 3 seconds
      setTimeout(() => {
        setUploadSuccess(false);
        setFiles([]);
      }, 3000);
    } catch (error) {
      setErrors([`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`]);
    } finally {
      setIsUploading(false);
    }
  };
  
  // Get file icon or preview
  const getFilePreview = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <img 
        src={URL.createObjectURL(file)} 
        alt={file.name} 
        className="w-full h-full object-cover rounded"
      />;
    }
    
    const fileExtension = file.name.split('.').pop()?.toUpperCase() || '';
    
    return <div className="flex flex-col items-center justify-center w-full h-full bg-gray-100 rounded">
      <File className="w-8 h-8 text-gray-500" />
      <span className="text-xs text-gray-600 mt-1">{fileExtension}</span>
    </div>;
  };

  const getFileTypeIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return '🖼️';
    } else if (file.type.startsWith('video/')) {
      return '🎬';
    } else if (file.type.startsWith('audio/')) {
      return '🎵';
    } else if (file.type.includes('pdf')) {
      return '📄';
    } else if (file.type.includes('word') || file.name.endsWith('.doc') || file.name.endsWith('.docx')) {
      return '📝';
    } else if (file.type.includes('excel') || file.name.endsWith('.xls') || file.name.endsWith('.xlsx')) {
      return '📊';
    } else if (file.type.includes('zip') || file.name.endsWith('.zip') || file.name.endsWith('.rar')) {
      return '🗜️';
    }
    return '📁';
  };

  return (
    <div className={`file-upload-component w-full ${className}`}>
      <div className="bg-blue-500 p-6 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-white text-center mb-4">Validate & Upload Files with React</h1>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Left Side - Drag and Drop Area */}
            <div className="w-full md:w-1/2">
              <div
                className={`border-2 border-dashed rounded-lg p-6 h-56 flex flex-col items-center justify-center cursor-pointer ${
                  isDragging ? 'border-blue-500 bg-blue-50' : 'border-blue-300 bg-blue-50 hover:border-blue-400'
                }`}
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="text-center">
                  <div className="flex justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-blue-500 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <path d="M12 18v-6"></path>
                      <path d="M9 15l3-3 3 3"></path>
                    </svg>
                  </div>
                  <p className="font-medium text-gray-700">{description}</p>
                  <p className="text-gray-500 mt-2">or</p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                  >
                    Upload Files
                  </button>
                </div>
                
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept={acceptedTypesString}
                  multiple={multiple}
                />
              </div>
            </div>
            
            {/* Right Side - File Preview Area */}
            <div className="w-full md:w-1/2 bg-white rounded-lg border border-gray-200">
              <div className="h-56 p-4 flex flex-col">
                {files.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    <p>No Files Uploaded Yet</p>
                  </div>
                ) : (
                  <div 
                    ref={fileListRef}
                    className={`overflow-y-auto flex-grow ${maxHeight}`}
                  >
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {files.map((file, index) => (
                        <div key={`${file.name}-${index}`} className="relative group">
                          <div className="h-20 w-full border rounded overflow-hidden bg-white shadow-sm hover:shadow transition-shadow">
                            {getFilePreview(file)}
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFile(index);
                            }}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-80 hover:opacity-100 shadow-sm"
                            aria-label="Remove file"
                          >
                            <X className="w-3 h-3" />
                          </button>
                          <div className="text-xs mt-1">
                            <p className="font-medium truncate" title={file.name}>
                              {getFileTypeIcon(file)} {file.name}
                            </p>
                            <p className="text-gray-500">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Error Messages */}
          {errors.length > 0 && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md overflow-y-auto max-h-40">
              {errors.map((error, index) => (
                <div key={index} className="flex items-center text-red-500 text-sm mb-1 last:mb-0">
                  <AlertCircle className="w-4 h-4 mr-1 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              ))}
            </div>
          )}
          
          {/* Upload Progress */}
          {showProgress && isUploading && (
            <div className="mt-4">
              <div className="flex justify-between text-xs mb-1">
                <span>Uploading...</span>
                <span>{Math.round(uploadProgress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}
          
          {/* Save Button */}
          <div className="mt-4 flex justify-center">
            <button
              type="button"
              onClick={handleUpload}
              disabled={isUploading || files.length === 0}
              className={`px-6 py-2 rounded-md text-white font-medium ${
                isUploading ? 'bg-blue-400 cursor-not-allowed' : 
                files.length === 0 ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'
              } transition-colors`}
            >
              {isUploading ? (
                <>
                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full inline-block"></div>
                  Uploading...
                </>
              ) : uploadSuccess ? (
                <>
                  <Check className="w-4 h-4 mr-2 inline-block" />
                  Upload Complete
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2 inline-block" />
                  Save
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}