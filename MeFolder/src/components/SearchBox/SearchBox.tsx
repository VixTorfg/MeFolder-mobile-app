import React, { useState, useCallback, useRef } from 'react';
import { View, TextInput, TouchableOpacity, NativeSyntheticEvent, TextInputSubmitEditingEventData } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSearchBoxStyles } from './styles';
import { SearchBoxProps } from '@/types/ui/components';

export default function SearchBox({
  placeholder = 'Buscar archivos y carpetas...',
  onSearch,
  onClear,
  onChangeText,
  disabled = false,
  iconSize = 24,
}: SearchBoxProps) {
  const styles = useSearchBoxStyles();
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const handleChangeText = useCallback((text: string) => {
    setQuery(text);
    onChangeText?.(text);
  }, [onChangeText]);

  /** Ejecuta la búsqueda al pulsar Enter */
  const handleSubmit = useCallback(async (
    _e: NativeSyntheticEvent<TextInputSubmitEditingEventData>
  ) => {
    const trimmed = query.trim();
    if (!trimmed || !onSearch) return;

    setIsSearching(true);
    try {
      await onSearch(trimmed);
    } finally {
      setIsSearching(false);
    }
  }, [query, onSearch]);

  const handleClear = useCallback(() => {
    setQuery('');
    onClear?.();
    inputRef.current?.focus();
  }, [onClear]);

  const showClear = query.length > 0;

  return (
    <View style={[styles.container, isFocused && styles.containerFocused]}>
      <Ionicons
        name="search-outline"
        size={iconSize}
        style={isFocused ? styles.iconFocused : styles.icon}
      />

      <TextInput
        ref={inputRef}
        style={styles.input}
        value={query}
        onChangeText={handleChangeText}
        onSubmitEditing={handleSubmit}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        placeholderTextColor={styles.icon.color}
        returnKeyType="search"
        editable={!disabled && !isSearching}
        numberOfLines={1}
      />

      {showClear && (
        <TouchableOpacity onPress={handleClear} style={styles.clearButton} hitSlop={8}>
          <Ionicons name="close-circle" size={iconSize} style={styles.clearIcon} />
        </TouchableOpacity>
      )}
    </View>
  );
}
