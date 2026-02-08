export type FileExtension = 
  // Documentos
  | 'pdf' | 'doc' | 'docx' | 'txt' | 'rtf' | 'md'
  // Imágenes
  | 'jpg' | 'jpeg' | 'png' | 'gif' | 'bmp' | 'svg' | 'webp'
  // Videos
  | 'mp4' | 'avi' | 'mov' | 'mkv' | 'wmv' | 'flv'
  // Audio
  | 'mp3' | 'wav' | 'flac' | 'aac' | 'm4a'
  // Código
  | 'js' | 'ts' | 'jsx' | 'tsx' | 'html' | 'css' | 'scss'
  | 'java' | 'py' | 'cpp' | 'c' | 'php' | 'go' | 'rs'
  // Comprimidos
  | 'zip' | 'rar' | '7z' | 'tar' | 'gz'
  // Otros
  | 'json' | 'xml' | 'csv' | 'xlsx';

export type FileCategory = 
  | 'document' 
  | 'image' 
  | 'video' 
  | 'audio' 
  | 'code' 
  | 'archive' 
  | 'spreadsheet' 
  | 'other';

export const FILE_CATEGORY_MAP: Record<FileExtension, FileCategory> = {
  
  pdf: 'document', doc: 'document', docx: 'document', 
  txt: 'document', rtf: 'document', md: 'document',
  
  jpg: 'image', jpeg: 'image', png: 'image', gif: 'image',
  bmp: 'image', svg: 'image', webp: 'image',
 
  mp4: 'video', avi: 'video', mov: 'video', mkv: 'video',
  wmv: 'video', flv: 'video',
  
  mp3: 'audio', wav: 'audio', flac: 'audio', aac: 'audio', m4a: 'audio',
  
  js: 'code', ts: 'code', jsx: 'code', tsx: 'code',
  html: 'code', css: 'code', scss: 'code', java: 'code',
  py: 'code', cpp: 'code', c: 'code', php: 'code', go: 'code', rs: 'code',
 
  zip: 'archive', rar: 'archive', '7z': 'archive', tar: 'archive', gz: 'archive',
 
  json: 'other', xml: 'other', csv: 'spreadsheet', xlsx: 'spreadsheet',
};

export interface FileTypeInfo {
  extension: FileExtension;
  category: FileCategory;
  mimeType?: string;
  defaultIcon: string;
}