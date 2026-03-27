import { useEffect, useState, useCallback } from 'react';
import { useAlert, useServices } from '@/providers';
import { ColorInfo } from '@/types/common/colors';
import { SYSTEM_COLORS } from '@/constants/themes/colors';

function sortColors(colors: ColorInfo[]): ColorInfo[] {
  return [...colors].sort((a, b) => {
    if (a.isFavorite && !b.isFavorite) return -1;
    if (!a.isFavorite && b.isFavorite) return 1;
    return 0;
  });
}

interface UseColorsReturn {
  colors: ColorInfo[];
  selectedColor: ColorInfo;
  showColorPicker: boolean;
  setSelectedColor: (color: ColorInfo) => void;
  setShowColorPicker: (show: boolean) => void;
  handleSaveColor: (data: ColorInfo) => Promise<void>;
}

export function useColors(defaultColor: ColorInfo = SYSTEM_COLORS['yellow']): UseColorsReturn {
  const { showAlert } = useAlert();
  const { services: { userColorService } } = useServices();

  const [colors, setColors] = useState<ColorInfo[]>(Object.values(SYSTEM_COLORS));
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
        console.error('Error loading user colors:', error);
        showAlert({ title: 'Error', message: 'No se pudieron cargar los colores personalizados. Inténtalo de nuevo.' });
      }
    }

    loadUserColors();
  }, [userColorService]);

  const handleSaveColor = useCallback(async (data: ColorInfo): Promise<void> => {
    try {
      if (!userColorService) return;

      await userColorService.createColor(data);
      setColors(prev => sortColors([...prev, data]));
      setSelectedColor(data);
      setShowColorPicker(false);
    } catch (error) {
      showAlert({ title: 'Error', message: 'No se pudo guardar el color personalizado. Inténtalo de nuevo.' });
    }
  }, [userColorService, showAlert]);

  return {
    colors,
    selectedColor,
    showColorPicker,
    setSelectedColor,
    setShowColorPicker,
    handleSaveColor,
  };
}
