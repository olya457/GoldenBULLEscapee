import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ImageBackground,
  Image,
  Switch,
  Dimensions,
  Platform,
  Share,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

const { width: W, height: H } = Dimensions.get('window');
const IS_VERY_SMALL = H < 620;
const IS_TINY = H < 680;
const BG = require('../assets/background_game.png');
const ICON_BACK = require('../assets/icon_back.png');
const BTN_SHARE_APP = require('../assets/btn_share.png');

const KEY_NOTIFICATIONS = 'gbull_notifications_on_v1';
const KEY_PUZZLE_UNLOCK_V1 = 'gbull_puzzle_unlocked_v1';
const KEY_PUZZLE_UNLOCK_V2 = 'gbull_puzzle_unlocked_v2';
const KEY_GAME_UNLOCK = 'gbull_unlocked_level_v1';
const KEY_GAME_RECORD = 'gbull_game_record_v1';
const KEY_GAME_PROGRESS = 'gbull_game_progress_v1';
const KEY_GAME_COINS = 'gbull_game_coins_v1';

export default function SettingsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();

  const TOP = insets.top + (IS_VERY_SMALL ? 10 : 16);
  const PAD = IS_VERY_SMALL ? 14 : 18;

  const CARD_W = useMemo(() => Math.min(W * 0.88, 360), []);
  const ROW_H = IS_VERY_SMALL ? 54 : IS_TINY ? 58 : 62;

  const SHARE_W = Math.min(W * 0.78, 340);
  const SHARE_H = IS_VERY_SMALL ? 66 : IS_TINY ? 72 : 78;
  const SHARE_BOTTOM = insets.bottom + (IS_VERY_SMALL ? 18 : 24) + 26;

  const [notificationsOn, setNotificationsOn] = useState<boolean>(true);

  const load = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(KEY_NOTIFICATIONS);
      if (raw === null) return;
      setNotificationsOn(raw === '1');
    } catch {}
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const toggleNotifications = useCallback(async (v: boolean) => {
    setNotificationsOn(v);
    try {
      await AsyncStorage.setItem(KEY_NOTIFICATIONS, v ? '1' : '0');
    } catch {}
  }, []);

  const resetProgress = useCallback(() => {
    const doReset = async () => {
      try {
        await AsyncStorage.multiSet([
          [KEY_PUZZLE_UNLOCK_V1, '1'],
          [KEY_PUZZLE_UNLOCK_V2, '1'],
        ]);
        await AsyncStorage.setItem(KEY_GAME_UNLOCK, '1');
        await AsyncStorage.multiRemove([KEY_GAME_RECORD, KEY_GAME_PROGRESS, KEY_GAME_COINS]);

        Alert.alert('Done', 'Progress has been reset.');
      } catch {
        Alert.alert('Error', 'Could not reset progress.');
      }
    };

    Alert.alert(
      'Reset progress?',
      'This will reset Puzzle and Game progress to the beginning.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: doReset },
      ],
      { cancelable: true }
    );
  }, []);

  const onShareApp = useCallback(async () => {
    try {
      await Share.share({
        message: 'Golden BULL Escape — try it now!',
      });
    } catch {}
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <ImageBackground source={BG} style={styles.bg} resizeMode="cover">
        <View style={[styles.topRow, { paddingTop: TOP, paddingHorizontal: PAD }]}>
          <Pressable
            onPress={() => navigation.goBack()}
            hitSlop={10}
            style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
          >
            <Image source={ICON_BACK} style={styles.iconImg} />
          </Pressable>

          <View style={{ flex: 1 }} />
        </View>
        <View style={[styles.content, { paddingHorizontal: PAD }]}>
          <View style={[styles.card, { width: CARD_W }]}>
            <View style={[styles.row, { height: ROW_H }]}>
              <Text style={[styles.rowLabel, { fontSize: IS_VERY_SMALL ? 16 : 18 }]}>
                Notifications
              </Text>
              <Switch
                value={notificationsOn}
                onValueChange={toggleNotifications}
                trackColor={{
                  false: 'rgba(255,255,255,0.25)',
                  true: 'rgba(120,255,160,0.55)',
                }}
                thumbColor={Platform.OS === 'android' ? '#FFFFFF' : undefined}
              />
            </View>

            <View style={styles.sep} />
            <Pressable
              onPress={resetProgress}
              style={({ pressed }) => [
                styles.row,
                { height: ROW_H },
                pressed && { opacity: 0.9 },
              ]}
            >
              <Text style={[styles.rowLabel, { fontSize: IS_VERY_SMALL ? 16 : 18 }]}>
                Reset progress
              </Text>
              <View style={styles.resetBadge}>
                <Text style={styles.resetBadgeText}>Reset</Text>
              </View>
            </Pressable>
          </View>
        </View>
        <View style={[styles.shareDock, { paddingBottom: SHARE_BOTTOM }]}>
          <Pressable
            onPress={onShareApp}
            style={({ pressed }) => [
              pressed && { opacity: 0.92, transform: [{ scale: 0.99 }] },
            ]}
          >
            <Image
              source={BTN_SHARE_APP}
              style={{ width: SHARE_W, height: SHARE_H }}
              resizeMode="contain"
            />
          </Pressable>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  pressed: { opacity: 0.85 },

  topRow: { flexDirection: 'row', alignItems: 'center' },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconImg: { width: 40, height: 40, resizeMode: 'contain' },

  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 28,
  },

  card: {
    borderRadius: 26,
    backgroundColor: 'rgba(44,61,184,0.58)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.65)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.22,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 10 },
      },
      android: { elevation: 6 },
    }),
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowLabel: { color: '#fff', fontWeight: '800' },

  sep: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.25)',
    marginVertical: 10,
  },

  resetBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: 'rgba(245,177,76,0.95)',
  },
  resetBadgeText: { color: '#2B1200', fontWeight: '900' },

  shareDock: { alignItems: 'center' },
});
