import { Tabs } from 'expo-router';
import React from 'react';
import { FloatingTabBar } from '../../src/components';

export default function TabLayout() {
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
          options={{
            title: 'Inicio',
          }}
        />
        <Tabs.Screen
          name="library"
          options={{
            title: 'Biblioteca',
          }}
        />
        <Tabs.Screen
          name="tags"
          options={{
            title: 'Etiquetas',
          }}
        />
        <Tabs.Screen
          name="trash"
          options={{
            title: 'Papelera',
          }}
        />
      </Tabs>
      
      <FloatingTabBar />
    </>
  );
}