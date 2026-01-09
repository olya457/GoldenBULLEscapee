import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ImageBackground,
  Image,
  ScrollView,
  Dimensions,
  Animated,
  Easing,
  Share,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Stories'>;

const { width: W, height: H } = Dimensions.get('window');
const IS_TINY = H < 680;
const IS_SMALL = H < 750;
const IS_VERY_SMALL = H < 620;
const BG = require('../assets/background_game.png');
const ICON_PAUSE = require('../assets/icon_back.png');
const BTN_SHARE = require('../assets/btn_share.png');
type Story = { id: number; title: string; body: string };

const STORIES: Story[] = [
  {
    id: 1,
    title: 'The Golden Bull and the Sky Labyrinth',
    body:
      'Long before grids and arrows ruled the world, the Golden Bull walked freely across the open sky. Clouds shifted beneath his hooves, and direction was a matter of choice, not command. He was a guardian of balance, watching a world where freedom and chaos existed side by side. When the Sky Architects built a labyrinth to control movement itself, the Bull entered willingly, believing no system could truly trap him.\n\n' +
      'The moment he reached the center, the labyrinth sealed shut. The sky collapsed into rigid lines, and arrows replaced instinct. Now the Bull stands surrounded by rules instead of clouds, forced to understand the logic of the system he once trusted in order to escape.',
  },
  {
    id: 2,
    title: 'Escape from the Stone Barn',
    body:
      'The Stone Barn was carved deep inside the mountains to imprison legends rather than animals. Its walls were unbreakable, but the true prison lay beneath the ground — a grid of arrows that dictated every possible step. When the Golden Bull was led inside, no chains were needed. The floor itself became the cage, silent and absolute.\n\n' +
      'At first, the Bull relied on strength and instinct, charging forward without hesitation. Every attempt failed. Slowly, he realized the truth: the barn could not be broken. It could only be solved. Freedom would come not from force, but from understanding the grid beneath his hooves.',
  },
  {
    id: 3,
    title: 'The Bull Who Challenged Time',
    body:
      'In this labyrinth, time is not an abstract idea — it is visible and unforgiving. Seconds disappear while the Golden Bull stands motionless, studying the shifting paths around him. Pressure grows heavier with every moment, pushing him toward rushed decisions and careless mistakes.\n\n' +
      'The Bull learns that haste only strengthens the grid. Calm thinking weakens it. By choosing carefully and acting with precision, he turns time from an enemy into a tool, reclaiming lost moments with every correct move forward.',
  },
  {
    id: 4,
    title: 'Heart of the Grid',
    body:
      'At the exact center of the maze lies a place where every direction feels wrong. The Golden Bull stands there, surrounded by arrows pulling space apart, each promising progress while quietly hiding danger. The grid seems to contradict itself, offering movement but denying escape at every turn.\n\n' +
      'Beneath the chaos lies strict order. The grid follows rules that reveal themselves only through patience and observation. As the Bull understands its rhythm and logic, the heart of the grid responds, revealing paths that once seemed invisible.',
  },
  {
    id: 5,
    title: 'The Curse of the Arrows',
    body:
      'The arrows were created to guide movement and bring order to chaos. Over time, they replaced thinking with obedience, turning choice into habit and freedom into routine. People followed directions without question, and the grid grew stronger with every step taken blindly.\n\n' +
      'The Golden Bull refused to obey. Instead, he studied the arrows, learning their limits and patterns. By mastering them rather than resisting them, he began to weaken their curse and bend the grid toward escape.',
  },
  {
    id: 6,
    title: 'The Final Run',
    body:
      'The grid does not allow endless attempts. When time runs out, paths reset and mistakes vanish without mercy. Each run feels like the last, carrying the weight of every decision made before.\n\n' +
      'The Bull understands this is his final chance. Every move must matter. Every choice must serve a purpose. There is no space for hesitation — only focus, clarity, and resolve.',
  },
  {
    id: 7,
    title: 'The Hoof of Freedom',
    body:
      'Legends say the grid trembles when the Golden Bull moves closer to escape. Tiles resist, arrows shift, and space tightens as if the maze itself fears his progress.\n\n' +
      'Yet every cleared tile weakens the system. With each step forward, the Bull leaves cracks in the structure that once seemed unbreakable, bringing freedom within reach.',
  },
  {
    id: 8,
    title: 'The Living Maze',
    body:
      'This maze reacts to thought itself. It adapts, changes patterns, and punishes repetition. What worked once may fail the next time, turning confidence into a trap.\n\n' +
      'But even living systems rely on logic. Once the Bull understands how the maze thinks, its illusions collapse. True paths emerge where confusion once ruled.',
  },
  {
    id: 9,
    title: 'Will of Gold',
    body:
      'Gold bends slowly, but it does not shatter. The Golden Bull embodies this truth, standing firm against pressure, failure, and doubt within the shifting grid.\n\n' +
      'Surrounded by false paths and collapsing plans, his greatest strength is patience. The will to continue thinking becomes the key to survival and escape.',
  },
  {
    id: 10,
    title: 'Freedom, Finally',
    body:
      'When the path is finally clear, there is no explosion and no celebration. The grid simply opens, silent and defeated, as if it has lost its purpose.\n\n' +
      'The Golden Bull walks out calmly, leaving the maze behind. Without a prisoner to challenge it, the grid fades away, its rules forgotten.',
  },
];

type Mode = 'list' | 'detail';

export default function StoriesScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();

  const [mode, setMode] = useState<Mode>('list');
  const [activeId, setActiveId] = useState<number>(1);

  const activeStory = useMemo(() => STORIES.find(s => s.id === activeId)!, [activeId]);
  const TOP = insets.top + (IS_VERY_SMALL ? 8 : 16);
  const PAD = IS_VERY_SMALL ? 14 : 18;

  const CARD_W = useMemo(() => Math.min(W * 0.86, 360), []);
  const LIST_TOP_SP = IS_VERY_SMALL ? 10 : 14;

  const BTN_H = IS_VERY_SMALL ? 54 : IS_TINY ? 58 : 62;
  const BTN_R = 26;
  const BTN_GAP = IS_VERY_SMALL ? 10 : 12;
  const CARD_H_BASE = IS_VERY_SMALL ? 420 : IS_TINY ? 460 : 520;
  const CARD_H = useMemo(() => CARD_H_BASE - 40, [CARD_H_BASE]);
  const TITLE_FS = IS_VERY_SMALL ? 15 : IS_TINY ? 16 : 17;
  const TITLE_LH = IS_VERY_SMALL ? 18 : IS_TINY ? 20 : 22;

  const BODY_FS = IS_VERY_SMALL ? 12 : IS_TINY ? 13 : 14;
  const BODY_LH = IS_VERY_SMALL ? 18 : IS_TINY ? 20 : 22;

  const SHARE_W = Math.min(W * 0.70, 310);
  const SHARE_H = IS_VERY_SMALL ? 62 : IS_TINY ? 68 : 74;

  const SHARE_GAP_BASE = IS_VERY_SMALL ? 14 : 18;
  const SHARE_GAP = Math.max(6, SHARE_GAP_BASE - 30);

  const CARD_PAD_H = IS_VERY_SMALL ? 14 : 16;
  const CARD_PAD_TOP = IS_VERY_SMALL ? 14 : 16;
  const CARD_PAD_BOTTOM = IS_VERY_SMALL ? 12 : 14;

  const BODY_SCROLL_BOTTOM = IS_VERY_SMALL ? 12 : 16;

  const fade = useRef(new Animated.Value(1)).current;

  const listIn = useRef(new Animated.Value(0)).current;
  const listItems = useRef(STORIES.map(() => new Animated.Value(0))).current;

  const cardIn = useRef(new Animated.Value(0)).current;
  const titleIn = useRef(new Animated.Value(0)).current;
  const bodyIn = useRef(new Animated.Value(0)).current;
  const shareIn = useRef(new Animated.Value(0)).current;

  const runListEnter = useCallback(() => {
    fade.setValue(0);
    listIn.setValue(0);
    listItems.forEach(v => v.setValue(0));

    Animated.timing(fade, {
      toValue: 1,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    Animated.sequence([
      Animated.timing(listIn, {
        toValue: 1,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.stagger(
        55,
        listItems.map(v =>
          Animated.timing(v, {
            toValue: 1,
            duration: 260,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          })
        )
      ),
    ]).start();
  }, [fade, listIn, listItems]);

  const runDetailEnter = useCallback(() => {
    fade.setValue(0);
    cardIn.setValue(0);
    titleIn.setValue(0);
    bodyIn.setValue(0);
    shareIn.setValue(0);

    Animated.timing(fade, {
      toValue: 1,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    Animated.sequence([
      Animated.timing(cardIn, {
        toValue: 1,
        duration: 360,
        easing: Easing.out(Easing.back(1.02)),
        useNativeDriver: true,
      }),
      Animated.timing(titleIn, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(bodyIn, {
        toValue: 1,
        duration: 240,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(shareIn, {
        toValue: 1,
        duration: 240,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [cardIn, fade, titleIn, bodyIn, shareIn]);

  const openStory = useCallback(
    (id: number) => {
      setActiveId(id);
      setMode('detail');
      requestAnimationFrame(() => runDetailEnter());
    },
    [runDetailEnter]
  );

  const backToList = useCallback(() => {
    setMode('list');
    requestAnimationFrame(() => runListEnter());
  }, [runListEnter]);

  const onShare = useCallback(async () => {
    try {
      await Share.share({ message: `${activeStory.title}\n\n${activeStory.body}` });
    } catch {}
  }, [activeStory.body, activeStory.title]);

  React.useEffect(() => {
    runListEnter();
  }, [runListEnter]);

  return (
    <View style={{ flex: 1 }}>
      {mode === 'list' && (
        <ImageBackground source={BG} style={styles.bg} resizeMode="cover">
          <Animated.View style={{ flex: 1, opacity: fade }}>
            <View style={[styles.topRow, { paddingTop: TOP, paddingHorizontal: PAD }]}>
              <Pressable
                onPress={() => navigation.goBack()}
                hitSlop={10}
                style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
              >
                <Image source={ICON_PAUSE} style={styles.iconImg} />
              </Pressable>
              <View style={{ width: 44 }} />
            </View>

            <Animated.View
              style={{
                flex: 1,
                opacity: listIn,
                transform: [{ translateY: listIn.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
              }}
            >
              <ScrollView
                contentContainerStyle={{
                  paddingHorizontal: PAD,
                  paddingTop: LIST_TOP_SP,
               paddingBottom: insets.bottom + 18 + 40,
                  alignItems: 'center',
                  gap: BTN_GAP,
                }}
                showsVerticalScrollIndicator={false}
              >
                {STORIES.map((st, i) => (
                  <Animated.View
                    key={st.id}
                    style={{
                      opacity: listItems[i],
                      transform: [{ translateY: listItems[i].interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }],
                    }}
                  >
                    <Pressable
                      onPress={() => openStory(st.id)}
                      style={({ pressed }) => [
                        styles.storyBtn,
                        { width: CARD_W, height: BTN_H, borderRadius: BTN_R },
                        pressed && { opacity: 0.92, transform: [{ scale: 0.995 }] },
                      ]}
                    >
                      <Text
                        numberOfLines={2}
                        style={[
                          styles.storyBtnText,
                          { fontSize: IS_VERY_SMALL ? 13 : 14, lineHeight: IS_VERY_SMALL ? 16 : 18 },
                        ]}
                      >
                        {st.title}
                      </Text>
                    </Pressable>
                  </Animated.View>
                ))}
              </ScrollView>
            </Animated.View>
          </Animated.View>
        </ImageBackground>
      )}

      {mode === 'detail' && (
        <ImageBackground source={BG} style={styles.bg} resizeMode="cover">
          <Animated.View style={{ flex: 1, opacity: fade }}>
            <View style={[styles.topRow, { paddingTop: TOP, paddingHorizontal: PAD }]}>
              <Pressable onPress={backToList} hitSlop={10} style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}>
                <Image source={ICON_PAUSE} style={styles.iconImg} />
              </Pressable>
              <View style={{ width: 44 }} />
            </View>

            <ScrollView
              contentContainerStyle={{
                flexGrow: 1,
                alignItems: 'center',
                justifyContent: IS_VERY_SMALL ? 'flex-start' : 'center',
                paddingHorizontal: PAD,
                paddingTop: IS_VERY_SMALL ? 10 : 0,
                paddingBottom: insets.bottom + 18,
              }}
              showsVerticalScrollIndicator={false}
            >
              <Animated.View
                style={[
                  styles.detailCard,
                  {
                    width: CARD_W,
                    height: CARD_H,
                    paddingHorizontal: CARD_PAD_H,
                    paddingTop: CARD_PAD_TOP,
                    paddingBottom: CARD_PAD_BOTTOM,
                    opacity: cardIn,
                    transform: [
                      { scale: cardIn.interpolate({ inputRange: [0, 1], outputRange: [0.97, 1] }) },
                      { translateY: cardIn.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) },
                    ],
                  },
                ]}
              >
                <Animated.Text
                  style={[
                    styles.detailTitle,
                    {
                      fontSize: TITLE_FS,
                      lineHeight: TITLE_LH,
                      opacity: titleIn,
                      transform: [{ translateY: titleIn.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }],
                    },
                  ]}
                  numberOfLines={2}
                >
                  {activeStory.title}
                </Animated.Text>

                <Animated.View
                  style={{
                    flex: 1,
                    opacity: bodyIn,
                    transform: [{ translateY: bodyIn.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }],
                  }}
                >
                  <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: 12, paddingBottom: BODY_SCROLL_BOTTOM }}>
                    <Text style={[styles.detailBody, { fontSize: BODY_FS, lineHeight: BODY_LH }]}>{activeStory.body}</Text>
                  </ScrollView>
                </Animated.View>
              </Animated.View>

              <Animated.View
                style={{
                  marginTop: SHARE_GAP,
                  opacity: shareIn,
                  transform: [{ translateY: shareIn.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }],
                }}
              >
                <Pressable onPress={onShare} style={({ pressed }) => [pressed && { opacity: 0.92, transform: [{ scale: 0.99 }] }]}>
                  <Image source={BTN_SHARE} style={{ width: SHARE_W, height: SHARE_H }} resizeMode="contain" />
                </Pressable>
              </Animated.View>
            </ScrollView>
          </Animated.View>
        </ImageBackground>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  pressed: { opacity: 0.85 },

  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },

  iconBtn: { width: 44, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  iconImg: { width: 40, height: 40, resizeMode: 'contain' },

  storyBtn: {
    backgroundColor: '#2C3DB8',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  storyBtnText: {
    color: '#fff',
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 0.2,
  },

  detailCard: {
    backgroundColor: '#2C3DB8',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.92)',
    borderRadius: 28,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 18, shadowOffset: { width: 0, height: 10 } },
      android: { elevation: 6 },
    }),
  },
  detailTitle: {
    color: '#fff',
    fontWeight: '900',
    textAlign: 'center',
  },
  detailBody: {
    color: 'rgba(255,255,255,0.92)',
    fontWeight: '700',
    textAlign: 'left',
  },
});
