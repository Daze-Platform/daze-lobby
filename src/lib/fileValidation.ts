// File validation utilities for secure uploads

export const ALLOWED_IMAGE_TYPES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/svg+xml',
] as const;

export const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
] as const;

export const ALLOWED_ASSET_TYPES = [
  ...ALLOWED_IMAGE_TYPES,
  ...ALLOWED_DOCUMENT_TYPES,
] as const;

// Dangerous file extensions to block
const BLOCKED_EXTENSIONS = [
  '.exe', '.bat', '.cmd', '.com', '.msi', '.scr',
  '.js', '.vbs', '.ps1', '.sh', '.bash',
  '.html', '.htm', '.php', '.asp', '.aspx', '.jsp',
  '.dll', '.so', '.dylib',
];

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validates a file for PDF-only uploads (contracts, legal documents)
 */
export function validatePdfFile(file: File, maxSizeMB: number = 10): FileValidationResult {
  // Check file extension
  const extension = '.' + file.name.split('.').pop()?.toLowerCase();
  
  if (extension !== '.pdf') {
    return { isValid: false, error: 'Only PDF files are allowed for legal documents' };
  }

  // Check MIME type
  if (file.type !== 'application/pdf') {
    return { isValid: false, error: 'Invalid file type. Only PDF files are accepted.' };
  }

  // Check file size
  const maxBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxBytes) {
    return { isValid: false, error: `File size must be less than ${maxSizeMB}MB` };
  }

  // Check for blocked extensions (double extension attack prevention)
  const lowerName = file.name.toLowerCase();
  for (const blocked of BLOCKED_EXTENSIONS) {
    if (lowerName.includes(blocked)) {
      return { isValid: false, error: 'This file type is not allowed for security reasons' };
    }
  }

  return { isValid: true };
}

/**
 * Validates a file for image uploads (logos, brand assets)
 */
export function validateImageFile(file: File, maxSizeMB: number = 5): FileValidationResult {
  // Check file extension
  const extension = '.' + file.name.split('.').pop()?.toLowerCase();
  const allowedExtensions = ['.png', '.jpg', '.jpeg', '.svg'];
  
  if (!allowedExtensions.includes(extension)) {
    return { isValid: false, error: 'Only PNG, JPG, and SVG files are allowed for images' };
  }

  // Check MIME type
  const allowedMimes = ALLOWED_IMAGE_TYPES as readonly string[];
  if (!allowedMimes.includes(file.type)) {
    return { isValid: false, error: 'Invalid image type. Allowed: PNG, JPG, SVG' };
  }

  // Check file size
  const maxBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxBytes) {
    return { isValid: false, error: `Image size must be less than ${maxSizeMB}MB` };
  }

  // Check for blocked extensions
  const lowerName = file.name.toLowerCase();
  for (const blocked of BLOCKED_EXTENSIONS) {
    if (lowerName.includes(blocked)) {
      return { isValid: false, error: 'This file type is not allowed for security reasons' };
    }
  }

  return { isValid: true };
}

/**
 * Validates a file for menu uploads (PDF or images)
 */
export function validateMenuFile(file: File, maxSizeMB: number = 20): FileValidationResult {
  // Check file extension
  const extension = '.' + file.name.split('.').pop()?.toLowerCase();
  const allowedExtensions = ['.png', '.jpg', '.jpeg', '.pdf'];
  
  if (!allowedExtensions.includes(extension)) {
    return { isValid: false, error: 'Only PNG, JPG, and PDF files are allowed for menus' };
  }

  // Check MIME type
  const allowedMimes = [...ALLOWED_IMAGE_TYPES.filter(t => t !== 'image/svg+xml'), 'application/pdf'] as string[];
  if (!allowedMimes.includes(file.type)) {
    return { isValid: false, error: 'Invalid file type. Allowed: PNG, JPG, PDF' };
  }

  // Check file size
  const maxBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxBytes) {
    return { isValid: false, error: `File size must be less than ${maxSizeMB}MB` };
  }

  // Check for blocked extensions
  const lowerName = file.name.toLowerCase();
  for (const blocked of BLOCKED_EXTENSIONS) {
    if (lowerName.includes(blocked)) {
      return { isValid: false, error: 'This file type is not allowed for security reasons' };
    }
  }

  return { isValid: true };
}

/**
 * Sanitizes a filename for safe storage
 */
export function sanitizeFilename(filename: string): string {
  // Remove path traversal attempts
  let safe = filename.replace(/[\\/\\]/g, '_');
  
  // Remove null bytes
  safe = safe.replace(/\0/g, '');
  
  // Keep only safe characters
  safe = safe.replace(/[^a-zA-Z0-9._-]/g, '_');
  
  // Limit length
  if (safe.length > 100) {
    const ext = safe.split('.').pop() || '';
    const name = safe.slice(0, 90);
    safe = `${name}.${ext}`;
  }
  
  return safe;
}
