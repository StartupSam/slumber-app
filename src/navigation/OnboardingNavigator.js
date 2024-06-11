import React from 'react';
import { Platform } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import * as Screens from '../screens/OnboardingScreens';
import HeaderProgressBar from '../components/HeaderProgressBar';

// Init and define the authentication flow for diary entry
const OnboardingStack = createStackNavigator();

const animConfig = {
  animation: 'spring',
  config: {
    stiffness: 1000,
    damping: 500,
    mass: 3,
    overshootClamping: true,
    restDisplacementThreshold: 0.01,
    restSpeedThreshold: 0.01,
  },
};

// Create a stack screen for each component defined in DiaryEntryScreens
export default function OnboardingNavigator() {
  return (
    <OnboardingStack.Navigator
      initialRouteName="Welcome"
      screenOptions={{
        headerShown: true,
        // eslint-disable-next-line react/display-name
        leftButton: () => <></>,
        animationEnabled: true,
      }}
    >
      {Object.keys(Screens).map((screen) => {
        return (
          <OnboardingStack.Screen
            key={screen}
            name={screen}
            component={Screens[screen]}
            options={() => ({
              title: screen,
              // Use a custom header component with a progressbar
              // eslint-disable-next-line react/display-name
              header: ({ route, navigation }) => {
                return (
                  <HeaderProgressBar
                    progressBarPercent={
                      route.params !== undefined
                        ? route.params.progressBarPercent
                        : null
                    }
                    navigation={navigation}
                    backButtonDisabled
                  />
                );
              },
              animationEnabled: Platform.OS === 'ios' ? true : false,
              headerTransparent: true,
              transitionSpec: {
                open: animConfig,
                close: animConfig,
              },
            })}
          />
        );
      })}
    </OnboardingStack.Navigator>
  );
}
