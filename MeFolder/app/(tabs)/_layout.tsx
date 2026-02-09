import { Tabs } from 'expo-router';
import React from 'react';
import { FloatingTabBar } from '@/components';
import { useTheme } from '@/providers/ThemeProvider';

export default function TabLayout() {
  const { theme } = useTheme();
  const { colors } = theme;

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            display: 'none',
          },
        }}
      >
        <Tabs.Screen
          name="index"
        />
        <Tabs.Screen
          name="library"
        />
        <Tabs.Screen
          name="tags"
        />
        <Tabs.Screen
          name="trash"
        />
      </Tabs>
      
      <FloatingTabBar 
        backgroundColor={colors.background}
        activeColor={colors.primary}
        inactiveColor={colors.textSecondary}
        borderColor={colors.borderSoft} 
      />
    </>
  );
}