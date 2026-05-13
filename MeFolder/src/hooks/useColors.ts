import { useEffect, useState, useCallback } from "react";
import { useAlert, useServices } from "@/providers";
import { ColorInfo } from "@/types/common/colors";
import { SYSTEM_COLORS } from "@/constants/themes/colors";

function sortColors(colors: ColorInfo[]): ColorInfo[] {
  return [...colors].sort((a, b) => {
    if (a.isFavorite && !b.isFavorite) return -1;
    if (!a.isFavorite && b.isFavorite) return 1;
    return 0;
  });
}

function normalizeColorValue(value?: string): string {
  return value?.trim().toLowerCase() ?? "";
}

function areSameColor(
  left: ColorInfo | null,
  right: ColorInfo | null,
): boolean {
  if (!left || !right) {
    return false;
  }

  return (
    (left.id ?? null) === (right.id ?? null) &&
    normalizeColorValue(left.hex) === normalizeColorValue(right.hex) &&
    normalizeColorValue(left.name) === normalizeColorValue(right.name)
  );
}

interface UseColorsReturn {
  colors: ColorInfo[];
  selectedColor: ColorInfo;
  showColorPicker: boolean;
  setSelectedColor: (color: ColorInfo) => void;
  setShowColorPicker: (show: boolean) => void;
  handleSaveColor: (data: ColorInfo) => Promise<void>;
  handleDeleteColor: (color: ColorInfo) => Promise<void>;
}

export function useColors(
  defaultColor: ColorInfo = SYSTEM_COLORS["yellow"],
): UseColorsReturn {
  const { showAlert } = useAlert();
  const {
    services: { userColorService },
  } = useServices();

  const [colors, setColors] = useState<ColorInfo[]>(
    Object.values(SYSTEM_COLORS),
  );
  const [selectedColor, setSelectedColor] = useState<ColorInfo>(defaultColor);
  const [showColorPicker, setShowColorPicker] = useState(false);

  useEffect(() => {
    async function loadUserColors() {
      if (!userColorService) return;
      try {
        const userColors = await userColorService.getAllColors();
        const allColors = [...Object.values(SYSTEM_COLORS), ...userColors];
        setColors(sortColors(allColors));
      } catch (error) {
        console.error("Error loading user colors:", error);
        showAlert({
          title: "Error",
          message:
            "No se pudieron cargar los colores personalizados. Inténtalo de nuevo.",
        });
      }
    }

    loadUserColors();
  }, [userColorService]);

  const handleSaveColor = useCallback(
    async (data: ColorInfo): Promise<void> => {
      try {
        if (!userColorService) return;

        if (data.id) {
          const updatedColor = await userColorService.updateColor(data.id, {
            ...(data.name !== undefined && { name: data.name }),
            hex: data.hex,
            rgb: data.rgb,
            isFavorite: data.isFavorite,
          });

          setColors((prev) =>
            sortColors(
              prev.map((currentColor) =>
                currentColor.id === updatedColor.id
                  ? updatedColor
                  : currentColor,
              ),
            ),
          );
          setSelectedColor(updatedColor);
          setShowColorPicker(false);
          return;
        }

        const checkMaxColor = await userColorService.checkMaxColor();

        if (checkMaxColor) {
          showAlert({
            title: "Máximo alcanzado",
            message: "No se pueden agregar más colores personalizados.",
          });
          return;
        }

        const createdColor = await userColorService.createColor(data);
        setColors((prev) => sortColors([...prev, createdColor]));
        setSelectedColor(createdColor);
        setShowColorPicker(false);
      } catch (error) {
        showAlert({
          title: "Error",
          message:
            "No se pudo guardar el color personalizado. Inténtalo de nuevo.",
        });
      }
    },
    [userColorService, showAlert],
  );

  const handleDeleteColor = useCallback(
    async (color: ColorInfo): Promise<void> => {
      try {
        if (!userColorService) return;

        const colorId =
          color.id ??
          colors.find(
            (currentColor) =>
              currentColor.hex === color.hex &&
              currentColor.name === color.name &&
              !currentColor.isSystem,
          )?.id;

        if (color.isSystem || !colorId) {
          showAlert({
            title: "Error",
            message: "No se puede eliminar este color.",
          });
          return;
        }

        await userColorService.deleteColor(colorId);
        setColors((prev) =>
          sortColors(
            prev.filter((currentColor) => currentColor.id !== colorId),
          ),
        );

        const isDeletedSelectedColor = areSameColor(selectedColor, color);

        if (isDeletedSelectedColor) {
          setSelectedColor(SYSTEM_COLORS["yellow"]);
        }

        setShowColorPicker(false);
      } catch (error) {
        showAlert({
          title: "Error",
          message:
            "No se pudo eliminar el color personalizado. Inténtalo de nuevo.",
        });
      }
    },
    [colors, userColorService, showAlert, selectedColor],
  );

  return {
    colors,
    selectedColor,
    showColorPicker,
    setSelectedColor,
    setShowColorPicker,
    handleSaveColor,
    handleDeleteColor,
  };
}
