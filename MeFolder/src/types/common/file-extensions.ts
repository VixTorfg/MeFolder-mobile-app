export type FileVideoExtension = 'mp4' | 'avi' | 'mov' | 'mkv' | 'wmv' | 'flv';

export type FileExtension = 
  // Documentos
  | 'pdf' | 'doc' | 'docx' | 'txt' | 'rtf' | 'md'
  // Imágenes
  | 'jpg' | 'jpeg' | 'png' | 'gif' | 'bmp' | 'svg' | 'webp'
  // Videos
  | FileVideoExtension
  // Audio
  | 'mp3' | 'wav' | 'flac' | 'aac' | 'm4a'
  // Código
  | 'js' | 'ts' | 'jsx' | 'tsx' | 'html' | 'css' | 'scss'
  | 'java' | 'py' | 'cpp' | 'c' | 'php' | 'go' | 'rs'
  // Comprimidos
  | 'zip' | 'rar' | '7z' | 'tar' | 'gz'
  // Otros
  | 'json' | 'xml' | 'csv' | 'xlsx';

/** Extensiones sin video */
export type FileExtensionWithoutVideo = Exclude<FileExtension, FileVideoExtension>;

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

export const EXTENSION_LABELS: Record<FileExtensionWithoutVideo, string> = {
  // Documentos
  pdf: 'Documento PDF',
  doc: 'Documento Word',
  docx: 'Documento Word',
  txt: 'Documento de texto',
  rtf: 'Documento de texto enriquecido',
  md: 'Documento Markdown',

  // Imágenes
  jpg: 'Imagen JPG',
  jpeg: 'Imagen JPEG',
  png: 'Imagen PNG',
  gif: 'Imagen GIF',
  bmp: 'Imagen BMP',
  svg: 'Imagen SVG',
  webp: 'Imagen WebP',

  // Audio
  mp3: 'Audio MP3',
  wav: 'Audio WAV',
  flac: 'Audio FLAC',
  aac: 'Audio AAC',
  m4a: 'Audio M4A',

  // Código
  js: 'Archivo JavaScript',
  ts: 'Archivo TypeScript',
  jsx: 'Archivo JSX',
  tsx: 'Archivo TSX',
  html: 'Documento HTML',
  css: 'Hoja de estilos CSS',
  scss: 'Hoja de estilos SCSS',
  java: 'Archivo Java',
  py: 'Script Python',
  cpp: 'Archivo C++',
  c: 'Archivo C',
  php: 'Archivo PHP',
  go: 'Archivo Go',
  rs: 'Archivo Rust',

  // Comprimidos
  zip: 'Archivo ZIP',
  rar: 'Archivo RAR',
  '7z': 'Archivo 7-Zip',
  tar: 'Archivo TAR',
  gz: 'Archivo GZip',

  // Otros
  json: 'Archivo JSON',
  xml: 'Archivo XML',
  csv: 'Archivo CSV',
  xlsx: 'Hoja de cálculo Excel',
};