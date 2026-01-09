import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, ImageBackground, Image, Dimensions, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Loader'>;

const { width: W, height: H } = Dimensions.get('window');
const IS_SMALL = H < 750;

const BG = require('../assets/background.png'); 
const LOGO = require('../assets/logo.png');     

export default function LoaderScreen({ navigation }: Props) {
  const [showWeb, setShowWeb] = useState(true);

  useEffect(() => {

    const t1 = setTimeout(() => setShowWeb(false), 4000);
    const t2 = setTimeout(() => {
      navigation.replace('Menu');
    }, 7000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [navigation]);

  const html = useMemo(() => {
  
    return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1, maximum-scale=1"
    />
    <style>
      html, body {
        width: 100%;
        height: 100%;
        margin: 0;
        padding: 0;
        background: transparent;
        overflow: hidden;
      }
      .wrap {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .spinner {
        position: relative;
        width: 9px;
        height: 9px;
      }

      .spinner div {
        position: absolute;
        width: 50%;
        height: 150%;
        background: #000000;
        transform: rotate(calc(var(--rotation) * 1deg)) translate(0, calc(var(--translation) * 1%));
        animation: spinner-fzua35 1s calc(var(--delay) * 1s) infinite ease;
        border-radius: 2px;
      }

      .spinner div:nth-child(1)  { --delay: 0.1; --rotation: 36;  --translation: 150; }
      .spinner div:nth-child(2)  { --delay: 0.2; --rotation: 72;  --translation: 150; }
      .spinner div:nth-child(3)  { --delay: 0.3; --rotation: 108; --translation: 150; }
      .spinner div:nth-child(4)  { --delay: 0.4; --rotation: 144; --translation: 150; }
      .spinner div:nth-child(5)  { --delay: 0.5; --rotation: 180; --translation: 150; }
      .spinner div:nth-child(6)  { --delay: 0.6; --rotation: 216; --translation: 150; }
      .spinner div:nth-child(7)  { --delay: 0.7; --rotation: 252; --translation: 150; }
      .spinner div:nth-child(8)  { --delay: 0.8; --rotation: 288; --translation: 150; }
      .spinner div:nth-child(9)  { --delay: 0.9; --rotation: 324; --translation: 150; }
      .spinner div:nth-child(10) { --delay: 1.0; --rotation: 360; --translation: 150; }

      @keyframes spinner-fzua35 {
        0%, 10%, 20%, 30%, 50%, 60%, 70%, 80%, 90%, 100% {
          transform: rotate(calc(var(--rotation) * 1deg)) translate(0, calc(var(--translation) * 1%));
        }
        50% {
          transform: rotate(calc(var(--rotation) * 1deg)) translate(0, calc(var(--translation) * 1.5%));
        }
      }
    </style>
  </head>
  <body>
    <div class="wrap">
      <div class="spinner">
        <div></div><div></div><div></div><div></div><div></div>
        <div></div><div></div><div></div><div></div><div></div>
      </div>
    </div>
  </body>
</html>`;
  }, []);

  return (
    <ImageBackground source={BG} style={styles.bg} resizeMode="cover">
      <View style={styles.center}>
        {showWeb ? (
          <View style={styles.webBox}>
            <WebView
              originWhitelist={['*']}
              source={{ html }}
              style={styles.web}
              javaScriptEnabled
              domStorageEnabled
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
              showsHorizontalScrollIndicator={false}
              overScrollMode="never"
              androidLayerType={Platform.OS === 'android' ? 'hardware' : undefined}
              containerStyle={styles.webContainer}
            />
          </View>
        ) : (
          <Image source={LOGO} style={styles.logo} resizeMode="contain" />
        )}
      </View>
    </ImageBackground>
  );
}

const BOX = Math.min(W * 0.55, IS_SMALL ? 220 : 260);

const styles = StyleSheet.create({
  bg: { flex: 1 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  webBox: {
    width: BOX,
    height: BOX,
    alignItems: 'center',
    justifyContent: 'center',
  },

  webContainer: {
    backgroundColor: 'transparent',
  },
  web: {
    width: BOX,
    height: BOX,
    backgroundColor: 'transparent',
  },

  logo: {
    width: Math.min(W * 0.62, IS_SMALL ? 260 : 320),
    height: Math.min(W * 0.62, IS_SMALL ? 260 : 320),
  },
});
