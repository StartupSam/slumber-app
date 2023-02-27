import firestore from '@react-native-firebase/firestore';
import { Chat } from '../types/custom';
import CoachConstants from '../constants/Coach';
import { Coach } from '../types/coach';

export type AppState = {
  isLoading: boolean;
  isSigningIn: boolean;
  isSignout: boolean;
  userId: string | undefined;
  userData: Record<string, any>;
  onboardingComplete: boolean | undefined;
  coach: Coach;
  profileData: Record<string, any>;
  authLoading: boolean;
};

export const initialState: AppState = {
  isLoading: false,
  isSigningIn: false,
  isSignout: false,
  userId: undefined,
  userData: {},
  onboardingComplete: undefined,
  coach: CoachConstants.defaultCoach,
  profileData: {},
  authLoading: false,
};

export type ACTION =
  | {
      type: 'RESTORE_TOKEN';
      token: string;
      profileData: Record<string, any>;
    }
  | {
      type: 'SIGN_IN';
      token: string;
      onboardingComplete: boolean;
      profileData: Record<string, any>;
      userData: Record<string, any>;
    }
  | { type: 'SIGN_OUT' }
  | {
      type: 'UPDATE_USERDATA';
      userData: Record<string, any>;
      onboardingComplete: boolean | undefined;
    }
  | { type: 'SET_LOADING'; isLoading: boolean }
  | { type: 'SET_SIGNINGIN'; isSigningIn: boolean }
  | { type: 'FINISH_ONBOARDING' }
  | { type: 'SET_COACH'; coach: Coach };

export const appReducer = (prevState: AppState, action: ACTION): AppState => {
  switch (action.type) {
    case 'RESTORE_TOKEN':
      return {
        ...prevState,
        userId: action.token,
        profileData: action.profileData,
      };
    case 'SIGN_IN':
      return {
        ...prevState,
        isSignout: false,
        userId: action.token,
        onboardingComplete: action.onboardingComplete,
        profileData: action.profileData,
        userData: action.userData,
      };
    case 'SIGN_OUT':
      return {
        ...prevState,
        isSignout: true,
        userId: undefined,
        onboardingComplete: undefined,
      };
    case 'UPDATE_USERDATA':
      return {
        ...prevState,
        userData: action.userData,
        onboardingComplete: action.onboardingComplete,
      };
    case 'SET_LOADING':
      return {
        ...prevState,
        isLoading: action.isLoading,
      };
    case 'SET_SIGNINGIN': {
      return {
        ...prevState,
        isSigningIn: action.isSigningIn,
      };
    }
    case 'FINISH_ONBOARDING':
      return {
        ...prevState,
        onboardingComplete: true,
      };
    case 'SET_COACH':
      return {
        ...prevState,
        coach: action.coach,
      };
  }
  return prevState;
};
