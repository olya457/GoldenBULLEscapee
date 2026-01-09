import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';

import LoaderScreen from '../screens/LoaderScreen';
import MenuScreen from '../screens/MenuScreen';
import GameScreen from '../screens/GameScreen';
import PuzzleScreen from '../screens/PuzzleScreen';
import StoriesScreen from '../screens/StoriesScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <Stack.Navigator initialRouteName="Loader" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Loader" component={LoaderScreen} />
      <Stack.Screen name="Menu" component={MenuScreen} />

      <Stack.Screen name="Game" component={GameScreen} />
      <Stack.Screen name="Puzzle" component={PuzzleScreen} />
      <Stack.Screen name="Stories" component={StoriesScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      
    </Stack.Navigator>
  );
}
