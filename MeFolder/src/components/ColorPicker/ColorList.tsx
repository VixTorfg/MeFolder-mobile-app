import { useEffect, useRef, useState } from "react";
import { usePagination } from "@/hooks";
import { ColorInfo } from "@/types/common/colors";
import { Ionicons } from "@expo/vector-icons";
import { useColorListStyles } from "./styles";
import { Animated, Easing, Text, TouchableOpacity, View } from "react-native";
import ColorPicker from "./ColorPicker";

const PAGE_SIZE = 14;
const COLORS_PER_PAGE = PAGE_SIZE - 1;

interface ColorListProps {
  colors: ColorInfo[];
  selectedColor: ColorInfo | null;
  onSelect: (color: ColorInfo) => void;
  onAddColor: () => void;
  showPicker: boolean;
  onClosePicker: () => void;
  onSavePickerColor: (color: ColorInfo) => Promise<void> | void;
}

export const ColorList = ({
  colors,
  selectedColor,
  onSelect,
  onAddColor,
  showPicker,
  onClosePicker,
  onSavePickerColor,
}: ColorListProps) => {
  const styles = useColorListStyles();
  const [pageNumber, setPageNumber] = useState(1);
  const pageOpacity = useRef(new Animated.Value(1)).current;
  const pageTranslateX = useRef(new Animated.Value(0)).current;
  const previousPageRef = useRef<number | null>(null);
  const { data, hasNextPage, hasPreviousPage, totalPages } = usePagination(
    colors,
    pageNumber,
    COLORS_PER_PAGE,
  );

  useEffect(() => {
    const nextPage = Math.max(totalPages, 1);

    setPageNumber((currentPage) => Math.min(currentPage, nextPage));
  }, [totalPages]);

  useEffect(() => {
    if (!selectedColor) {
      return;
    }

    const selectedColorIndex = colors.findIndex(
      (color) =>
        color.hex === selectedColor.hex && color.name === selectedColor.name,
    );

    if (selectedColorIndex === -1) {
      return;
    }

    setPageNumber(Math.floor(selectedColorIndex / COLORS_PER_PAGE) + 1);
  }, [colors, selectedColor?.hex, selectedColor?.name]);

  useEffect(() => {
    if (previousPageRef.current === null) {
      previousPageRef.current = pageNumber;
      return;
    }

    if (previousPageRef.current === pageNumber) {
      return;
    }

    const direction = pageNumber > previousPageRef.current ? 1 : -1;

    pageOpacity.setValue(0.35);
    pageTranslateX.setValue(direction * 18);

    Animated.parallel([
      Animated.timing(pageOpacity, {
        toValue: 1,
        duration: 450,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(pageTranslateX, {
        toValue: 0,
        duration: 450,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    previousPageRef.current = pageNumber;
  }, [pageNumber, pageOpacity, pageTranslateX]);

  return (
    <>
      <View style={styles.container}>
        <Animated.View
          style={[
            styles.colorList,
            styles.gridWidth,
            {
              opacity: pageOpacity,
              transform: [{ translateX: pageTranslateX }],
            },
          ]}
        >
          {data.map((color) => (
            <TouchableOpacity
              key={color.hex + color.name}
              style={[
                styles.colorOption,
                selectedColor?.hex === color.hex &&
                  selectedColor?.name === color.name &&
                  styles.colorOptionSelected,
              ]}
              onPress={() => onSelect(color)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.colorOptionInner,
                  { backgroundColor: color.hex },
                ]}
              />
              {color.isFavorite && (
                <Ionicons
                  name="star"
                  size={16}
                  color={styles.favoriteIconColor.color}
                  style={styles.favoriteIcon}
                />
              )}
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            style={styles.colorOption}
            onPress={onAddColor}
            activeOpacity={0.7}
          >
            <View style={styles.addButtonInner}>
              <Ionicons
                name="add"
                size={18}
                color={styles.addIconColor.color}
              />
            </View>
          </TouchableOpacity>
        </Animated.View>
      </View>

      <View style={[styles.paginationFooter, styles.gridWidth]}>
        <TouchableOpacity
          style={[
            styles.paginationButton,
            !hasPreviousPage && styles.paginationButtonDisabled,
          ]}
          onPress={() => setPageNumber((currentPage) => currentPage - 1)}
          disabled={!hasPreviousPage}
          activeOpacity={0.7}
        >
          <Ionicons
            name="chevron-back"
            size={18}
            color={styles.paginationIcon.color}
          />
        </TouchableOpacity>

        <Text style={styles.paginationText}>
          {pageNumber} / {Math.max(totalPages, 1)}
        </Text>

        <TouchableOpacity
          style={[
            styles.paginationButton,
            !hasNextPage && styles.paginationButtonDisabled,
          ]}
          onPress={() => setPageNumber((currentPage) => currentPage + 1)}
          disabled={!hasNextPage}
          activeOpacity={0.7}
        >
          <Ionicons
            name="chevron-forward"
            size={18}
            color={styles.paginationIcon.color}
          />
        </TouchableOpacity>
      </View>

      <ColorPicker
        visible={showPicker}
        onClose={onClosePicker}
        onSave={onSavePickerColor}
      />
    </>
  );
};
