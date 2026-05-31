export const removeExtension = (filename: string, extension: string) => {
  const ext = `.${extension}`;
  if (filename.endsWith(ext)) {
    return filename.slice(0, -ext.length);
  }
  return filename;
};

const INVALID_NAME_CHARACTERS_REPLACE_REGEX = /[<>:"/\\|?*]/g;
const INVALID_NAME_CHARACTERS_TEST_REGEX = /[<>:"/\\|?*]/;

export const stripInvalidNameCharacters = (value: string) => {
  return value.replace(INVALID_NAME_CHARACTERS_REPLACE_REGEX, "");
};

export const hasInvalidNameCharacters = (value: string) => {
  return INVALID_NAME_CHARACTERS_TEST_REGEX.test(value);
};

export const sanitizeFolderName = (
  value: string,
  fallback = "Nueva carpeta",
) => {
  const sanitized = stripInvalidNameCharacters(value).trim();
  return sanitized || fallback;
};

export const sanitizeTagName = (value: string, fallback = "") => {
  const sanitized = stripInvalidNameCharacters(value).trim();
  return sanitized || fallback;
};

export const sanitizeFileName = (
  value: string,
  fallbackBaseName = "archivo",
) => {
  const trimmedValue = value.trim();
  const dotIndex = trimmedValue.lastIndexOf(".");

  if (dotIndex <= 0) {
    const sanitizedName = stripInvalidNameCharacters(trimmedValue).trim();
    return sanitizedName || fallbackBaseName;
  }

  const baseName = stripInvalidNameCharacters(
    trimmedValue.slice(0, dotIndex),
  ).trim();
  const extension = stripInvalidNameCharacters(
    trimmedValue.slice(dotIndex + 1),
  ).trim();
  const safeBaseName = baseName || fallbackBaseName;

  return extension ? `${safeBaseName}.${extension}` : safeBaseName;
};
