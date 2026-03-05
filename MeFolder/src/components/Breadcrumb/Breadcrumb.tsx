import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useNavigationStore } from '@/stores';
import { useBreadcrumbStyles } from './styles';

const MAX_VISIBLE_SEGMENTS = 4;

export const Breadcrumb = () => {
  const { segments, navigateToIndex } = useNavigationStore();
  const styles = useBreadcrumbStyles();

  const shouldTruncate = segments.length > MAX_VISIBLE_SEGMENTS;
  const visibleSegments = shouldTruncate
    ? segments.slice(-MAX_VISIBLE_SEGMENTS)
    : segments;
  const startIndex = segments.length - visibleSegments.length;

  return (
    <View style={styles.container}>
      {shouldTruncate && (
        <View style={styles.segment}>
          <TouchableOpacity onPress={() => navigateToIndex(0)}>
            <Text style={styles.ellipsis}>…</Text>
          </TouchableOpacity>
          <Text style={styles.separator}>/</Text>
        </View>
      )}
      {visibleSegments.map((segment, i) => {
        const realIndex = startIndex + i;
        const isLast = realIndex === segments.length - 1;

        return (
          <View key={segment.id ?? 'root'} style={styles.segment}>
            <TouchableOpacity
              onPress={() => navigateToIndex(realIndex)}
              disabled={isLast}
              style={styles.segmentButton}
            >
              <Text
                style={[styles.segmentText, isLast && styles.segmentActive]}
                numberOfLines={1}
              >
                {segment.name}
              </Text>
            </TouchableOpacity>
            {!isLast && <Text style={styles.separator}>/</Text>}
          </View>
        );
      })}
    </View>
  );
};
