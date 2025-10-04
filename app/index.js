import React, { useRef, useEffect, useState } from 'react';
import { SafeAreaView, View, StyleSheet, ActivityIndicator, Text, TouchableOpacity, Linking, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { useColorScheme } from '@/hooks/useColorScheme';
import * as SplashScreen from 'expo-splash-screen';
import { Ionicons } from '@expo/vector-icons'; // Importing icons

SplashScreen.preventAutoHideAsync();

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [currentUrl, setCurrentUrl] = useState('https://kingzsub.com/user/login');
  const webViewRef = useRef(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  const styles = isDarkMode ? darkStyles : lightStyles;

  // Handle back navigation for the WebView
  const handleBackNavigation = () => {
    if (webViewRef.current) {
      setCurrentUrl('https://kingzsub.com/user/dashboard');
    }
  };

  // Update canGoBack state when the navigation state changes
  const handleNavigationStateChange = (navState) => {
    setCanGoBack(true);
    setCurrentUrl(navState.url);
  };

  const handleNavigate = (url) => {
    setLoading(true); 
    setCurrentUrl(url);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      SplashScreen.hideAsync();
    }, 10000);

    return () => clearTimeout(timer);
  }, []);

  const handleLoadStart = () => {
    setLoading(true);
    if (Platform.OS === 'ios') {
      console.log('Network activity indicator enabled');
    }
  };

  const handleLoadEnd = () => {
    setLoading(false);
    if (Platform.OS === 'ios') {
      console.log('Network activity indicator disabled');
    }
  };

  const openWhatsApp = () => {
    const phoneNumber = '+2347061105116';
    const url = `https://api.whatsapp.com/send?phone=${phoneNumber}`;
  
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(url);
        } else {
          return Linking.openURL(url);
        }
      })
      .catch((err) => console.error('An error occurred', err));
  };
  

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* WhatsApp icon at the top-right corner */}
      <View style={styles.header} pointerEvents="box-none">
        <TouchableOpacity onPress={openWhatsApp} style={styles.whatsappButton}>
          <Ionicons name="logo-whatsapp" size={30} color={isDarkMode ? '#25D366' : '#25D366'} />
        </TouchableOpacity>
      </View>

      <View style={styles.container} pointerEvents="box-none">
        {loading && (
          <View style={styles.loaderContainer}>
            <ActivityIndicator
              color={isDarkMode ? '#f3f3f3' : '#f3f3f3'}
              size="large"
            />
          </View>
        )}

        {/* WebView */}
        <WebView
          ref={webViewRef}
          key={currentUrl} // Force re-render when URL changes
          source={{ uri: currentUrl }}
          style={styles.webview}
          startInLoadingState={true}
          onLoadStart={handleLoadStart}
          onLoadEnd={handleLoadEnd}
          onNavigationStateChange={handleNavigationStateChange}
          renderError={() => (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>Failed to load page</Text>
            </View>
          )}
          cacheEnabled={true}
          cacheMode="LOAD_CACHE_ELSE_NETWORK"
          domStorageEnabled={true}
          javaScriptEnabled={true}
          allowFileAccess={true}
          allowUniversalAccessFromFileURLs={true}
          mixedContentMode="always"
        />
      </View>

      {currentUrl.includes('/dashboard') && (
        <View style={styles.footer}>
          <TouchableOpacity onPress={() => handleNavigate('https://kingzsub.com/user/pay-data')} style={styles.backButton}>
            <Ionicons name="wifi" size={12} color="#f3f3f3" />
            <Text style={styles.backButtonText}> Data</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => handleNavigate('https://kingzsub.com/user/pay-airtime')} style={styles.backButton}>
            <Ionicons name="wifi" size={12} color="#f3f3f3" />
            <Text style={styles.backButtonText}> Airtime</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => handleNavigate('https://kingzsub.com/user/pay-cable')} style={styles.backButton}>
            <Ionicons name="tv" size={12} color="#f3f3f3" />
            <Text style={styles.backButtonText}> Cable</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => handleNavigate('https://kingzsub.com/user/pay-electric')} style={styles.backButton}>
            <Ionicons name="bulb" size={12} color="#f3f3f3" />
            <Text style={styles.backButtonText}> Electric</Text>
          </TouchableOpacity>
        </View>
      )}

      {!currentUrl.includes('/dashboard') && !currentUrl.includes('/login') && !currentUrl.includes('/register') && !currentUrl.includes('/password/reset') && canGoBack && (
        <View style={styles.footer}>
          <TouchableOpacity onPress={handleBackNavigation} style={styles.backButton}>
            <Ionicons name="arrow-back" size={18} color="white" />
            <Text style={styles.backButtonText}> Back</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const commonStyles = {
  safeArea: {
    flex: 1,
    backgroundColor: '#1D244F',
    marginTop: 25,
  },
  header: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 20,
    pointerEvents: 'box-none',
  },
  whatsappButton: {
    padding: 10,
    marginTop: 50,
    borderRadius: 50,
    backgroundColor: '#02071b',
  },
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
    zIndex: -1,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: '#02071b',
    zIndex: 10,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#02071b',
    backgroundColor: '#02071b',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 5,
    marginTop: 10,
    borderRadius: 5,
  },
  backButtonText: {
    color: '#f3f3f3',
    fontWeight: 'bold',
    marginLeft: 5,
  },
};

const lightStyles = StyleSheet.create({
  ...commonStyles,
  safeArea: {
    ...commonStyles.safeArea,
    backgroundColor: '#fff',
  },
  errorText: {
    fontSize: 18,
    color: 'red',
  },
});

const darkStyles = StyleSheet.create({
  ...commonStyles,
  safeArea: {
    ...commonStyles.safeArea,
    backgroundColor: '#000',
  },
  errorText: {
    fontSize: 18,
    color: 'lightcoral',
  },
});
