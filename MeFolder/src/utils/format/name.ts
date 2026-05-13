export const removeExtension = (filename: string, extension: string) => {
    const ext = `.${extension}`;
    if (filename.endsWith(ext)) {
        return filename.slice(0, -ext.length);
    }
    return filename;
};