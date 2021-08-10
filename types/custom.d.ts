import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import 'firebase/firestore';

declare module '*.svg?inline' {
  const content: React.FunctionComponent<React.SVGAttributes<SVGElement>>;
  export default content;
}

export interface Navigation {
  navigate: Function;
  goBack: Function;
  setParams: Function;
}

export interface SleepLog {
  logId?: string;
  bedTime: FirebaseFirestoreTypes.Timestamp;
  fallAsleepTime: FirebaseFirestoreTypes.Timestamp;
  wakeTime: FirebaseFirestoreTypes.Timestamp;
  upTime: FirebaseFirestoreTypes.Timestamp;
  sleepRating: number;
  sleepDuration: number;
  sleepEfficiency: number;
  nightMinsAwake: number;
  minsToFallAsleep: number;
  minsInBedTotal: number;
  minsAwakeInBedTotal: number;
  wakeCount: number;
  SCTAnythingNonSleepInBed?: boolean;
  SCTNonSleepActivities?: string;
  notes: string;
  tags: string[];
}

export type Chat = {
  chatId?: string;
  sender: string;
  message: string;
  time: FirebaseFirestoreTypes.Timestamp | Date;
  sentByUser: boolean;
};

export type Task = {
  label: string;
  completedTimestamp: FirebaseFirestoreTypes.Timestamp | null;
  dailyRecurring: boolean;
  source: string;
  visibleAfterDate?: FirebaseFirestoreTypes.Timestamp;
  notification?: {
    enabled: boolean;
    notifTime: FirebaseFirestoreTypes.Timestamp;
  };
  taskId: string;
};

export type UserType = {
  uid: string;
  displayName: string;
  email: string;
};
