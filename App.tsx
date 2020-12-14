import React from 'react';
import {
  Platform,
  StatusBar,
  StyleSheet,
  View,
  LogBox,
  Text
} from 'react-native';
import { Provider as ThemeProvider } from '@draftbit/ui';
import AppLoading from 'expo-app-loading';
import * as Font from 'expo-font';
import * as Icon from '@expo/vector-icons';
import * as Google from 'expo-google-app-auth';
import * as SecureStore from 'expo-secure-store';
import { NavigationContainer } from '@react-navigation/native';
import { FbAuth, FbLib } from './config/firebaseConfig';
import * as firebase from 'firebase';
import { dozy_theme } from './config/Themes';
import '@firebase/firestore';
import AppNavigator from './navigation/AppNavigator';
import { AuthContext } from './utilities/authContext';
import refreshUserData from './utilities/refreshUserData';

// Mute "setting a timer" firebase warnings in console
LogBox.ignoreLogs(['Setting a timer']);
const _console = { ...console };
console.warn = (message) => {
  if (message.indexOf('Setting a timer') <= -1) {
    _console.warn(message);
  }
};

// Disable font scaling app-wide, enable on things it doesn't break
// Hmm - this code throws TS undefined errors, but works. Not sure why.
Text.defaultProps = Text.defaultProps || {};
Text.defaultProps.allowFontScaling = false;

// A utility function to always return a valid date number given a starting date and a delta
// TODO: Move this to its own file
function alterMonthSelection(prevMonth, changeBy) {
  const addedValue = prevMonth + changeBy;

  if (addedValue === 13) {
    return 1;
  } else if (addedValue === 0) {
    return 12;
  } else {
    return addedValue;
  }
}

// Root app component
export default function App() {
  // Using auth functions from react-navigation guide
  const [state, dispatch] = React.useReducer(
    (prevState, action) => {
      switch (action.type) {
        case 'RESTORE_TOKEN':
          return {
            ...prevState,
            userToken: action.token,
            profileData: action.profileData
          };
        case 'SIGN_IN':
          return {
            ...prevState,
            isSignout: false,
            userToken: action.token,
            onboardingComplete: action.onboardingComplete,
            authLoading: action.isAuthLoading,
            profileData: action.profileData
          };
        case 'SIGN_OUT':
          return {
            ...prevState,
            isSignout: true,
            userToken: null
          };
        case 'UPDATE_USERDATA':
          return {
            ...prevState,
            userData: action.userData,
            onboardingComplete: action.onboardingComplete
          };
        case 'SET_SLEEPLOGS':
          return {
            ...prevState,
            sleepLogs: action.sleepLogs
          };
        case 'CHANGE_SELECTED_MONTH':
          return {
            ...prevState,
            selectedMonth: alterMonthSelection(
              prevState.selectedMonth,
              action.changeMonthBy
            )
          };
        case 'AUTH_LOADING':
          return {
            ...prevState,
            authLoading: action.isAuthLoading
          };
        case 'FINISH_LOADING':
          return {
            ...prevState,
            isLoading: false
          };
        case 'FINISH_ONBOARDING':
          return {
            ...prevState,
            onboardingComplete: true
          };
      }
    },
    {
      isLoading: true,
      isSignout: false,
      userToken: null,
      onboardingComplete: true,
      profileData: null,
      sleepLogs: [],
      selectedMonth: new Date().getMonth()
    }
  );

  async function _loginWithGoogle() {
    try {
      // NOTE: Current keys only work in Expo dev environment!! To work in standalone apps, need to update hostnames
      // on these keys through the Google Cloud Console.
      const result = await Google.logInAsync({
        // TODO: Move these client IDs to the manifest or another file for cleaner code.
        androidClientId:
          '713165282203-7j7bg1vrl51fnf84rbnvbeeght01o603.apps.googleusercontent.com',
        iosClientId:
          '713165282203-fr943kvhd9rbst5i5ss4g3htgjho143a.apps.googleusercontent.com',
        androidStandaloneAppClientId:
          '713165282203-15rbcpiu517fikvak6c9okehpusbk84e.apps.googleusercontent.com',
        iosStandaloneAppClientId:
          '713165282203-dmren1nkmi5aho4bjm7ssiert19a3fpf.apps.googleusercontent.com',
        scopes: ['profile', 'email']
      });

      if (result.type === 'success') {
        const { idToken, accessToken } = result;
        dispatch({ type: 'AUTH_LOADING', isAuthLoading: true });
        const credential = FbLib.auth.GoogleAuthProvider.credential(
          idToken,
          accessToken
        );
        await FbAuth.setPersistence(FbLib.auth.Auth.Persistence.LOCAL);
        let fbSigninResult = FbAuth.signInWithCredential(credential);
        return await fbSigninResult;
      } else {
        return { cancelled: true };
      }
    } catch (err) {
      console.log('err from App.js:', err);
    }
  }

  React.useEffect(() => {
    StatusBar.setBarStyle('light-content');

    // Update user data from storage and Firebase, update state w/dispatch
    refreshUserData(dispatch);
  }, []);

  // Create authContext so relevant functions are available through the app
  const authContext = {
    dispatch: (argsObject) => {
      dispatch(argsObject);
    },
    state: state,
    signIn: async () => {
      // Fetch and store the relevant auth token

      // Use my previously defined login function to get user data and store the token
      _loginWithGoogle().then(
        (result: firebase.auth.UserCredential | { cancelled: boolean }) => {
          // Store credentials in SecureStore
          if ('credential' in result) {
            SecureStore.setItemAsync(
              'providerId',
              result.credential.providerId
            );
            SecureStore.setItemAsync('userId', result.user.uid);
            SecureStore.setItemAsync(
              'profileData',
              JSON.stringify(result.additionalUserInfo.profile)
            ).catch((error) => {
              console.log('Error signing in: ' + error);
            });

            // Update app state accordingly thru context hook function
            dispatch({
              type: 'SIGN_IN',
              token: result.user.uid,
              onboardingComplete: !result.additionalUserInfo.isNewUser,
              profileData: result.additionalUserInfo.profile,
              isAuthLoading: false
            });
          } else {
            console.log('Error signing in (maybe cancelled)');
          }

          // Update user's data from Firestore db
          refreshUserData(dispatch);
        }
      );
    },
    signOut: () => {
      SecureStore.deleteItemAsync('userId');
      dispatch({ type: 'SIGN_OUT' });
    },
    finishOnboarding: () => {
      dispatch({ type: 'FINISH_ONBOARDING' });
    }
  };

  const _handleLoadingError = (error) => {
    // Add error reporting here
    console.warn(error);
  };

  // Trigger the switch from the loading screen to the app
  function _handleFinishLoading() {
    // TODO: Why TF does this work?? How can I make it not this??
    // Getting AppLoading errors when the dispatch isn't in a setTimeout.
    // Doesn't seem to wait 4 seconds though... confused what's happening
    // setTimeout(() => dispatch({ type: 'FINISH_LOADING' }));
    dispatch({ type: 'FINISH_LOADING' });
  }

  // Load assets async w/Expo tools
  async function _loadResourcesAsync() {
    await Font.loadAsync({
      ...Icon.Ionicons.font,
      'space-mono': require('./assets/fonts/SpaceMono-Regular.ttf'),
      RubikRegular: require('./assets/fonts/RubikRegular.ttf'),
      RubikMedium: require('./assets/fonts/RubikMedium.ttf'),
      RubikBold: require('./assets/fonts/RubikBold.ttf')
    });
  }

  // Render a loading screen if loading, otherwise load the main app
  if (state.isLoading) {
    return (
      <AppLoading
        startAsync={_loadResourcesAsync}
        onError={_handleLoadingError}
        onFinish={_handleFinishLoading}
      />
    );
  } else {
    return (
      <AuthContext.Provider value={authContext}>
        <NavigationContainer>
          <View style={styles.container}>
            <ThemeProvider theme={dozy_theme}>
              {Platform.OS === 'ios' ? (
                <StatusBar barStyle="light-content" />
              ) : (
                []
              )}
              <AppNavigator
                userToken={state.userToken}
                authLoading={state.authLoading}
                onboardingComplete={state.onboardingComplete}
              />
            </ThemeProvider>
          </View>
        </NavigationContainer>
      </AuthContext.Provider>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#232B3F'
  }
});
