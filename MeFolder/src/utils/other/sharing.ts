import * as Sharing from "expo-sharing";

export async function openExternal(uri: string, mimeType?: string) {
  if (!(await Sharing.isAvailableAsync())) {
    console.error("[handleOpenItem] Sharing no disponible");
    return;
  }
  try {
    const uti = mimeType ? utiFromMime(mimeType) : undefined;
    await Sharing.shareAsync(uri, {
      ...(mimeType ? { mimeType } : {}),
      ...(uti ? { UTI: uti } : {}),
      dialogTitle: "Abrir con…",
    });
  } catch (e) {
    console.error("[handleOpenItem] No se pudo abrir el archivo:", uri, e);
  }
}

/**UTI from MIME type minimo */
function utiFromMime(mime: string): string | undefined {
  const map: Record<string, string> = {
    "application/pdf": "com.adobe.pdf",
    "text/plain": "public.plain-text",
    "application/zip": "public.zip-archive",
    "application/msword": "com.microsoft.word.doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      "org.openxmlformats.wordprocessingml.document",
  };
  return map[mime.toLowerCase()];
}
