import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  TextInput,
  TouchableOpacity,
  TextInputSubmitEditingEvent,
  Animated,
  Easing,
  Keyboard,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSearchBoxStyles } from "./styles";

export interface SearchResultItem {
  id: string;
  name: string;
  type: "file" | "folder";
}

export type SearchHandler = (query: string) => Promise<SearchResultItem[]>;

interface SearchBoxProps {
  placeholder?: string;
  onSearch?: SearchHandler;
  onClear?: () => void;
  onChangeText?: (text: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  onExpandedChange?: (expanded: boolean) => void;
  disabled?: boolean;
  iconSize?: number;
  autoFocus?: boolean;
  collapsible?: boolean;
}

export default function SearchBox({
  placeholder = "Buscar archivos y carpetas...",
  onSearch,
  onClear,
  onChangeText,
  onFocus,
  onBlur,
  onExpandedChange,
  disabled = false,
  iconSize = 22,
  autoFocus = false,
  collapsible = false,
}: SearchBoxProps) {
  const styles = useSearchBoxStyles();
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isExpanded, setIsExpanded] = useState(!collapsible);

  const { width: screenWidth } = useWindowDimensions();
  const collapsedWidth = 42;
  const expandedWidth = Math.max(220, Math.min(screenWidth - 76, 420));
  const activeIconSize = Math.max(20, Math.round(iconSize * 0.82));
  const clearIconSize = Math.max(20, Math.round(iconSize * 0.72));

  const isFocusedRef = useRef(isFocused);
  const inputRef = useRef<TextInput>(null);
  const widthAnim = useRef(
    new Animated.Value(collapsible ? collapsedWidth : expandedWidth),
  ).current;
  const inputOpacity = useRef(new Animated.Value(collapsible ? 0 : 1)).current;

  useEffect(() => {
    isFocusedRef.current = isFocused;
  }, [isFocused]);

  useEffect(() => {
    const hideListener = Keyboard.addListener("keyboardDidHide", () => {
      if (isFocusedRef.current) {
        inputRef.current?.blur();
      }
    });

    return () => {
      hideListener.remove();
    };
  }, []);

  const expandSearch = useCallback(() => {
    if (!collapsible || isExpanded || disabled || isSearching) {
      return;
    }

    setIsExpanded(true);
    onExpandedChange?.(true);

    Animated.parallel([
      Animated.timing(widthAnim, {
        toValue: expandedWidth,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(inputOpacity, {
        toValue: 1,
        duration: 180,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        inputRef.current?.focus();
      }
    });
  }, [
    collapsible,
    isExpanded,
    disabled,
    isSearching,
    onExpandedChange,
    expandedWidth,
    widthAnim,
    inputOpacity,
  ]);

  const collapseSearch = useCallback(() => {
    if (!collapsible || !isExpanded) {
      return;
    }

    Animated.parallel([
      Animated.timing(inputOpacity, {
        toValue: 0,
        duration: 120,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(widthAnim, {
        toValue: collapsedWidth,
        duration: 180,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: false,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        setIsExpanded(false);
        onExpandedChange?.(false);
      }
    });
  }, [
    collapsible,
    isExpanded,
    inputOpacity,
    widthAnim,
    collapsedWidth,
    onExpandedChange,
  ]);

  const handleChangeText = useCallback(
    (text: string) => {
      setQuery(text);
      onChangeText?.(text);
    },
    [onChangeText],
  );

  /** Ejecuta la búsqueda al pulsar Enter */
  const handleSubmit = useCallback(
    async (_e: TextInputSubmitEditingEvent) => {
      const trimmed = query.trim();
      if (!trimmed || !onSearch) return;

      setIsSearching(true);
      try {
        await onSearch(trimmed);
      } finally {
        setIsSearching(false);
      }
    },
    [query, onSearch],
  );

  const handleClear = useCallback(() => {
    setQuery("");
    onChangeText?.("");
    onClear?.();
    inputRef.current?.focus();
  }, [onChangeText, onClear]);

  const handleSearchPress = useCallback(() => {
    if (disabled || isSearching) {
      return;
    }

    if (collapsible && !isExpanded) {
      expandSearch();
      return;
    }

    inputRef.current?.focus();
  }, [disabled, isSearching, collapsible, isExpanded, expandSearch]);

  const showClear = query.length > 0;
  const showInput = !collapsible || isExpanded;

  return (
    <Animated.View
      style={[
        styles.container,
        !collapsible && styles.fullWidthContainer,
        collapsible && styles.collapsibleContainer,
        collapsible && !isExpanded && styles.collapsedContainer,
        isFocused && styles.containerFocused,
        collapsible && { width: widthAnim },
      ]}
    >
      <TouchableOpacity
        onPress={handleSearchPress}
        style={[
          styles.searchActivator,
          collapsible && !isExpanded && styles.searchActivatorCollapsed,
          showInput && styles.searchActivatorExpanded,
        ]}
        hitSlop={8}
        disabled={disabled || isSearching}
      >
        <Ionicons
          name="search-outline"
          size={collapsible && !isExpanded ? iconSize : activeIconSize}
          style={
            collapsible && !isExpanded
              ? styles.collapsedIcon
              : isFocused
                ? styles.iconFocused
                : styles.icon
          }
        />
      </TouchableOpacity>

      {showInput && (
        <Animated.View
          style={[
            styles.inputArea,
            collapsible && {
              opacity: inputOpacity,
            },
          ]}
        >
          <Animated.View style={styles.inputDivider} />

          <TextInput
            ref={inputRef}
            style={styles.input}
            value={query}
            onChangeText={handleChangeText}
            onSubmitEditing={handleSubmit}
            onFocus={() => {
              setIsFocused(true);
              onFocus?.();
            }}
            onBlur={() => {
              setIsFocused(false);
              onBlur?.();
              collapseSearch();
            }}
            placeholder={placeholder}
            placeholderTextColor={styles.placeholder.color}
            returnKeyType="search"
            editable={!disabled && !isSearching}
            numberOfLines={1}
            autoFocus={autoFocus || (collapsible && isExpanded)}
          />

          {showClear && (
            <TouchableOpacity
              onPress={handleClear}
              style={styles.clearButton}
              hitSlop={8}
            >
              <Ionicons
                name="close-circle"
                size={clearIconSize}
                style={styles.clearIcon}
              />
            </TouchableOpacity>
          )}
        </Animated.View>
      )}
    </Animated.View>
  );
}
