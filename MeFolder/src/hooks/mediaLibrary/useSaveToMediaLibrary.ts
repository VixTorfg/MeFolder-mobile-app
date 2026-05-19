import { useCallback, useState } from "react";
import * as MediaLibrary from "expo-media-library";
import { useAlert } from "@/providers";

export type SaveToMediaLibraryKind = "image" | "video" | "audio";

interface SaveToMediaLibraryParams {
  uri: string;
  kind: SaveToMediaLibraryKind;
  displayName?: string | undefined;
}

function resolveGranularPermissions(kind: SaveToMediaLibraryKind) {
  switch (kind) {
    case "image":
      return ["photo"] as MediaLibrary.GranularPermission[];
    case "video":
      return ["video"] as MediaLibrary.GranularPermission[];
    case "audio":
      return ["audio"] as MediaLibrary.GranularPermission[];
  }
}

function resolveUnsupportedMessage(kind: SaveToMediaLibraryKind) {
  if (kind === "audio") {
    return "Guardar audios directamente en la galeria no esta soportado de forma fiable con Expo MediaLibrary. Para audio conviene exportarlo a Archivos o usar una carpeta propia de la app.";
  }

  return "Este tipo de archivo no se puede guardar en la galeria del dispositivo desde este visor.";
}

export function useSaveToMediaLibrary() {
  const { showAlert } = useAlert();
  const [isSavingToMediaLibrary, setIsSavingToMediaLibrary] = useState(false);

  const ensureWritePermission = useCallback(
    async (kind: SaveToMediaLibraryKind) => {
      const granularPermissions = resolveGranularPermissions(kind);

      let permission = await MediaLibrary.getPermissionsAsync(
        true,
        granularPermissions,
      );

      if (!permission.granted) {
        permission = await MediaLibrary.requestPermissionsAsync(
          true,
          granularPermissions,
        );
      }

      return permission.granted;
    },
    [],
  );

  const saveToMediaLibrary = useCallback(
    async ({ uri, kind, displayName }: SaveToMediaLibraryParams) => {
      if (isSavingToMediaLibrary) {
        return false;
      }

      if (kind === "audio") {
        showAlert({
          title: "Guardado no disponible",
          message: resolveUnsupportedMessage(kind),
        });
        return false;
      }

      if (!uri.startsWith("file://")) {
        showAlert({
          title: "Archivo no compatible",
          message:
            "Solo se pueden guardar en la galeria archivos locales del dispositivo.",
        });
        return false;
      }

      setIsSavingToMediaLibrary(true);

      try {
        const isAvailable = await MediaLibrary.isAvailableAsync();

        if (!isAvailable) {
          throw new Error("La galeria del dispositivo no esta disponible.");
        }

        const hasPermission = await ensureWritePermission(kind);

        if (!hasPermission) {
          showAlert({
            title: "Permiso requerido",
            message:
              "Necesitas conceder permiso para guardar archivos en la galeria.",
          });
          return false;
        }

        await MediaLibrary.saveToLibraryAsync(uri);

        showAlert({
          title: "Archivo guardado",
          message: `${displayName ?? "El archivo"} ya esta disponible en la galeria del dispositivo.`,
        });

        return true;
      } catch (error) {
        showAlert({
          title: "No se pudo guardar",
          message:
            error instanceof Error
              ? error.message
              : "Se produjo un error al guardar el archivo en la galeria.",
        });
        return false;
      } finally {
        setIsSavingToMediaLibrary(false);
      }
    },
    [ensureWritePermission, isSavingToMediaLibrary, showAlert],
  );

  return {
    isSavingToMediaLibrary,
    saveToMediaLibrary,
  };
}
