import { useEffect, useRef } from 'react';
import {
  Platform,
  Alert,
  Linking,
  AppState,
  AppStateStatus,
} from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import * as Application from 'expo-application';
import * as IntentLauncher from 'expo-intent-launcher';
import firestore from '@react-native-firebase/firestore';
import moment from 'moment';
import { get, omit, findIndex } from 'lodash';
import Navigation from './navigation.service';
import { NotificationType, NotificationData } from '../types/notification';
import { useSleepLogsStore } from '../utilities/sleepLogsStore';
import { useUserDataStore } from '../utilities/userDataStore';

export default class Notification {
  static notificationTray: NotificationData[] = [];

  static treatmentModule: string | undefined;

  static isCheckinDue = false;

  static useNotificationService(userId?: string): void {
    const notificationEnabledRef = useRef(false);
    const notificationReceivedListener = useRef<any>(null);
    const notificationResponseListener = useRef<any>(null);
    const userData = useUserDataStore(
      (userDataState) => userDataState.userData,
    );

    const sleepLogs = useSleepLogsStore((logsState) => logsState.sleepLogs);

    useEffect((): (() => void) | void => {
      if (userId) {
        Notification.isNotificationEnabled().then((enabled: boolean) => {
          notificationEnabledRef.current = enabled;
        });

        const handleAppStateChange = async (
          newState: AppStateStatus,
        ): Promise<void> => {
          if (newState === 'background') {
            notificationEnabledRef.current =
              await Notification.isNotificationEnabled();
          } else if (newState === 'active') {
            const newNotificationEnabled =
              await Notification.isNotificationEnabled();
            if (!notificationEnabledRef.current && newNotificationEnabled) {
              notificationEnabledRef.current = newNotificationEnabled;
              const expoPushToken =
                await Notification.registerForPushNotificationsAsync(false);
              if (expoPushToken) {
                await Notification.updateExpoPushToken(expoPushToken, userId);
              }
            } else {
              notificationEnabledRef.current = newNotificationEnabled;
            }
          }
        } ;

        const subscription = AppState.addEventListener('change', handleAppStateChange);

        notificationResponseListener.current =
          Notifications.addNotificationResponseReceivedListener(
            Notification.handleNotification,
          );

        return () => {
          subscription.remove()
          // AppState.removeEventListener('change', handleAppStateChange);
          // if (notificationReceivedListener.current) {
          //   Notifications.removeNotificationSubscription(
          //     notificationReceivedListener.current,
          //   );
          //   notificationReceivedListener.current = null;
          // }
          // if (notificationResponseListener.current) {
          //   Notifications.removeNotificationSubscription(
          //     notificationResponseListener.current,
          //   );
          //   notificationResponseListener.current = null;
          // }
        };
      }
    }, [userId]);

    useEffect(() => {
      Notification.treatmentModule = userData?.nextCheckin?.treatmentModule;
      Notification.isCheckinDue =
        moment(userData?.currentTreatments?.nextCheckinDatetime.toDate())
          .startOf('date')
          .isSameOrBefore(new Date()) && sleepLogs.length >= 7;
    }, [
      userId,
      userData?.nextCheckin?.treatmentModule,
      userData?.currentTreatments?.nextCheckinDatetime,
      sleepLogs,
    ]);
  }

  static async getExpoPushToken(): Promise<string | undefined> {
    return (
      await Notifications.getExpoPushTokenAsync({
        experienceId: `@startupsam/${Constants.manifest?.slug}`,
      })
    )?.data;
  }

  static async registerForPushNotificationsAsync(
    showAlert = true,
    maybeRedirectToSettings = false,
  ): Promise<string | undefined> {
    let isGranted = await Notification.isNotificationEnabled();
    if (!isGranted) {
      isGranted = await Notification.askNotificationPermission(
        maybeRedirectToSettings,
      );
    }

    if (!isGranted) {
      if (showAlert) {
        Alert.alert('Failed to get push token for push notification!');
      }
      return;
    }

    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });

    return Notification.getExpoPushToken();
  }

  static async isNotificationEnabled(): Promise<boolean> {
    const { status } = await Notifications.getPermissionsAsync();

    return status === 'granted';
  }

  static async askNotificationPermission(
    maybeRedirectToSettings = false,
  ): Promise<boolean> {
    let isSuccess = false;

    const { status } = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
        allowAnnouncements: true,
      },
    });

    if (status === 'granted') {
      isSuccess = true;
    } else if (maybeRedirectToSettings) {
      Alert.alert(
        'Action needed',
        'You have disabled your notification permission!\nDo you want to enable it on the Settings app?',
        [
          {
            text: 'Yes',
            onPress: () => {
              if (Platform.OS === 'ios') {
                Linking.openSettings();
              } else {
                IntentLauncher.startActivityAsync(
                  IntentLauncher.ActivityAction.APP_NOTIFICATION_SETTINGS,
                  {
                    data: `package:${Application.applicationId}`,
                  },
                );
              }
            },
          },
          { text: 'No' },
        ],
      );
    }

    return isSuccess;
  }

  static async updateExpoPushToken(
    expoPushToken: string,
    userId: string,
  ): Promise<void> {
    const userDocRef = firestore().collection('users').doc(userId);

    userDocRef.update({
      reminders: {
        expoPushToken,
      },
    });

    const notificationsCollection = await userDocRef
      .collection('notifications')
      .get();
    if (notificationsCollection.docs.length) {
      notificationsCollection.docs.forEach((doc) => {
        if (doc.data()?.expoPushToken !== expoPushToken) {
          doc.ref.update({ expoPushToken });
        }
      });
    }
  }

  static async setBadgeNumber(badgeCount: number): Promise<boolean> {
    return Notifications.setBadgeCountAsync(badgeCount);
  }

  static async calculateBadgeNumber(
    userId: string,
    considerSleepLog = true,
    considerCheckin = true,
    considerUnreadMessages = true,
  ): Promise<number> {
    let badgeNumber = 0;

    if (userId) {
      const userDoc = (
        await firestore().collection('users').doc(userId).get()
      )?.data();

      // Check if the relevant checkin exists
      if (considerCheckin && userDoc) {
        const lastCheckinDate = userDoc?.currentTreatments?.lastCheckinDatetime;
        const nextCheckinDate = userDoc?.currentTreatments?.nextCheckinDatetime;
        if (
          lastCheckinDate &&
          nextCheckinDate &&
          moment(nextCheckinDate.toDate()).isSameOrBefore(moment()) &&
          moment(lastCheckinDate.toDate()).isBefore(
            moment(nextCheckinDate.toDate()),
          )
        ) {
          badgeNumber++;
        }
      }

      // Check if the relevant sleep log exists
      if (considerSleepLog) {
        const sleepLogsAfterToday = await firestore()
          .collection('users')
          .doc(userId)
          .collection('sleepLogs')
          .where('upTime', '>=', moment().startOf('date').valueOf())
          .get();
        if (!sleepLogsAfterToday.docs.length) {
          badgeNumber++;
        }
      }

      // Check unread messages count
      if (
        considerUnreadMessages &&
        userDoc?.livechatUnreadMsg &&
        !userDoc?.lastChat?.sentByUser
      ) {
        const lastMessages = await firestore()
          .collection('users')
          .doc(userId)
          .collection('supportMessages')
          .orderBy('time', 'desc')
          .limit(100)
          .get();
        let index = 0;
        while (!lastMessages?.docs?.[index]?.data()?.sentByUser) {
          badgeNumber++;
          index++;
        }
      }
    }

    return badgeNumber;
  }

  static async maybeShowInAppNotification(
    notification: Notifications.Notification,
  ): Promise<Notifications.NotificationBehavior> {
    const notificationType = get(notification, 'request.content.data.type');
    const isNeededToShowInAppNotification =
      (notificationType === 'DAILY_LOG' &&
        Notification.canProcessDailyLogNotification()) ||
      (notificationType === 'CHECKIN_REMINDER' &&
        Notification.canProcessCheckinReminderNotification()) ||
      (notificationType === 'CHAT_MESSAGE' &&
        Notification.canProcessSupportMessageNotification());

    return {
      shouldShowAlert: isNeededToShowInAppNotification,
      shouldPlaySound: isNeededToShowInAppNotification,
      shouldSetBadge: isNeededToShowInAppNotification,
    };
  }

  static canProcessDailyLogNotification(): boolean {
    return (
      Navigation.currentRouteName !== 'BedTimeInput' &&
      Navigation.currentRouteName !== 'MinsToFallAsleepInput' &&
      Navigation.currentRouteName !== 'PMRAsk' &&
      Navigation.currentRouteName !== 'PITAsk' &&
      Navigation.currentRouteName !== 'WakeCountInput' &&
      Navigation.currentRouteName !== 'SCTUpCountInput' &&
      Navigation.currentRouteName !== 'SCTAnythingNonSleepInBedInput' &&
      Navigation.currentRouteName !== 'SCTNonSleepActivitiesInput' &&
      Navigation.currentRouteName !== 'SCTDaytimeNapsInput' &&
      Navigation.currentRouteName !== 'NightMinsAwakeInput' &&
      Navigation.currentRouteName !== 'WakeTimeInput' &&
      Navigation.currentRouteName !== 'UpTimeInput' &&
      Navigation.currentRouteName !== 'SleepRatingInput' &&
      Navigation.currentRouteName !== 'TagsNotesInput'
    );
  }

  static canProcessCheckinReminderNotification(): boolean {
    return (
      Navigation.currentRouteName !== 'Welcome' &&
      Navigation.currentRouteName !== 'SleepEfficiency' &&
      Navigation.currentRouteName !== 'SleepOnset' &&
      Navigation.currentRouteName !== 'SleepMaintenance' &&
      Navigation.currentRouteName !== 'TreatmentPlan' &&
      Navigation.currentRouteName !== 'TreatmentPlanContinued' &&
      Navigation.currentRouteName !== 'DriversOfSleep' &&
      Navigation.currentRouteName !== 'WhySleepDrives' &&
      Navigation.currentRouteName !== 'FragmentedSleep' &&
      Navigation.currentRouteName !== 'ConsolidatingSleep' &&
      Navigation.currentRouteName !== 'ReduceTimeInBed' &&
      Navigation.currentRouteName !== 'SCTSRTIntro' &&
      Navigation.currentRouteName !== 'Rule1' &&
      Navigation.currentRouteName !== 'Rule2' &&
      Navigation.currentRouteName !== 'Rule3' &&
      Navigation.currentRouteName !== 'RulesRecap' &&
      Navigation.currentRouteName !== 'WhatToExpect' &&
      Navigation.currentRouteName !== 'UnderstandingAsk' &&
      Navigation.currentRouteName !== 'SRTCalibrationIntro' &&
      Navigation.currentRouteName !== 'WakeTimeSetting' &&
      Navigation.currentRouteName !== 'SleepDurationCalculation' &&
      Navigation.currentRouteName !== 'TargetBedtime' &&
      Navigation.currentRouteName !== 'PrescriptionSummary' &&
      Navigation.currentRouteName !== 'DeprivationWarning' &&
      Navigation.currentRouteName !== 'AddressingConcerns' &&
      Navigation.currentRouteName !== 'CheckinScheduling' &&
      Navigation.currentRouteName !== 'SCTSRTEnd' &&
      Navigation.currentRouteName !== 'WhyPMR' &&
      Navigation.currentRouteName !== 'PMROverview' &&
      Navigation.currentRouteName !== 'PMRWalkthrough' &&
      Navigation.currentRouteName !== 'PostPMR' &&
      Navigation.currentRouteName !== 'CalibrationStart' &&
      Navigation.currentRouteName !== 'PMRIntentionAction' &&
      Navigation.currentRouteName !== 'PMRIntentionTime' &&
      Navigation.currentRouteName !== 'TreatmentRecommit' &&
      Navigation.currentRouteName !== 'LastTip' &&
      Navigation.currentRouteName !== 'SRTTitrationStart' &&
      Navigation.currentRouteName !== 'SRTTitration' &&
      Navigation.currentRouteName !== 'SleepDuration' &&
      Navigation.currentRouteName !== 'GSES1' &&
      Navigation.currentRouteName !== 'GSES2' &&
      Navigation.currentRouteName !== 'GSES3' &&
      Navigation.currentRouteName !== 'GSES4' &&
      Navigation.currentRouteName !== 'GSES5' &&
      Navigation.currentRouteName !== 'GSES6' &&
      Navigation.currentRouteName !== 'GSES7' &&
      Navigation.currentRouteName !== 'GSESResult' &&
      Navigation.currentRouteName !== 'TryingToSleep' &&
      Navigation.currentRouteName !== 'Paradox' &&
      Navigation.currentRouteName !== 'Antidote' &&
      Navigation.currentRouteName !== 'HowToPIT' &&
      Navigation.currentRouteName !== 'PITScience' &&
      Navigation.currentRouteName !== 'PITReview' &&
      Navigation.currentRouteName !== 'RulesRecap' &&
      Navigation.currentRouteName !== 'PITEnd' &&
      Navigation.currentRouteName !== 'HYGIntro' &&
      Navigation.currentRouteName !== 'HYGBenefits' &&
      Navigation.currentRouteName !== 'SHIIntro' &&
      Navigation.currentRouteName !== 'SHI1' &&
      Navigation.currentRouteName !== 'SHI2' &&
      Navigation.currentRouteName !== 'SHI3' &&
      Navigation.currentRouteName !== 'SHI4' &&
      Navigation.currentRouteName !== 'SHI4a' &&
      Navigation.currentRouteName !== 'SHI5' &&
      Navigation.currentRouteName !== 'SHI6' &&
      Navigation.currentRouteName !== 'SHI7' &&
      Navigation.currentRouteName !== 'SHI8' &&
      Navigation.currentRouteName !== 'SHI9' &&
      Navigation.currentRouteName !== 'SHIResult' &&
      Navigation.currentRouteName !== 'HYGReview' &&
      Navigation.currentRouteName !== 'HYGEnd' &&
      Navigation.currentRouteName !== 'DBAS1' &&
      Navigation.currentRouteName !== 'DBAS2' &&
      Navigation.currentRouteName !== 'DBAS3' &&
      Navigation.currentRouteName !== 'DBAS4' &&
      Navigation.currentRouteName !== 'DBAS5' &&
      Navigation.currentRouteName !== 'DBAS6' &&
      Navigation.currentRouteName !== 'DBAS7' &&
      Navigation.currentRouteName !== 'DBAS8' &&
      Navigation.currentRouteName !== 'DBAS9' &&
      Navigation.currentRouteName !== 'DBAS10' &&
      Navigation.currentRouteName !== 'DBAS11' &&
      Navigation.currentRouteName !== 'DBAS12' &&
      Navigation.currentRouteName !== 'DBAS13' &&
      Navigation.currentRouteName !== 'DBAS14' &&
      Navigation.currentRouteName !== 'DBAS15' &&
      Navigation.currentRouteName !== 'DBAS16' &&
      Navigation.currentRouteName !== 'DBASResult' &&
      Navigation.currentRouteName !== 'COG1Review' &&
      Navigation.currentRouteName !== 'COG1End' &&
      Navigation.currentRouteName !== 'ISI1' &&
      Navigation.currentRouteName !== 'ISI2' &&
      Navigation.currentRouteName !== 'ISI3' &&
      Navigation.currentRouteName !== 'ISI4' &&
      Navigation.currentRouteName !== 'ISI5' &&
      Navigation.currentRouteName !== 'ISI6' &&
      Navigation.currentRouteName !== 'ISI7' &&
      Navigation.currentRouteName !== 'ISIProcessing' &&
      Navigation.currentRouteName !== 'ISIResults' &&
      Navigation.currentRouteName !== 'ISICategoryChange' &&
      Navigation.currentRouteName !== 'ISIEnd' &&
      Navigation.currentRouteName !== 'EducationStart' &&
      Navigation.currentRouteName !== 'RulesPhaseOut' &&
      Navigation.currentRouteName !== 'WhatToKeepOverview' &&
      Navigation.currentRouteName !== 'ConsistentSchedule' &&
      Navigation.currentRouteName !== 'MaintainSCT' &&
      Navigation.currentRouteName !== 'DoNotCompensate' &&
      Navigation.currentRouteName !== 'IfStopSleeping' &&
      Navigation.currentRouteName !== 'IfSCTNotWork' &&
      Navigation.currentRouteName !== 'SummarizeLearnings' &&
      Navigation.currentRouteName !== 'AccessAndFAQ' &&
      Navigation.currentRouteName !== 'ENDEnd' &&
      Navigation.currentRouteName !== 'TreatmentReview'
    );
  }

  static canProcessSupportMessageNotification(): boolean {
    return Navigation.currentRouteName !== 'Support';
  }

  static addNotificationToTray(notificationData: NotificationData): void {
    Notification.notificationTray.push(notificationData);
  }

  static async removeNotificationFromTray(
    notificationId: string,
  ): Promise<void> {
    const index = findIndex(Notification.notificationTray, {
      id: notificationId,
    });
    if (index !== -1) {
      Notification.notificationTray.splice(index, 1);
    }
    return Notifications.dismissNotificationAsync(notificationId);
  }

  static async removeNotificationsFromTrayByType(
    notificationType: NotificationType,
  ): Promise<void> {
    const presentedNotifications =
      await Notifications.getPresentedNotificationsAsync();

    presentedNotifications.forEach((notification) => {
      if (notification.request.content.data?.type === notificationType) {
        Notification.removeNotificationFromTray(
          notification.request.identifier,
        );
      }
    });
  }

  static handleNotification(
    notificationResponse: Notifications.NotificationResponse,
  ): void {
    const notification = notificationResponse.notification;

    const notificationData = {
      id: notification.request.identifier,
      type: notification.request.content.data.type as NotificationType,
      data: omit(notification.request.content.data, 'type'),
    };

    if (Navigation.isInTabNavigator) {
      Notification.processNotification(notificationData);
    } else {
      Notification.addNotificationToTray(notificationData);
    }
  }

  static processNotification(notificationData: NotificationData): void {
    if (
      notificationData.type === 'DAILY_LOG' &&
      Notification.canProcessDailyLogNotification()
    ) {
      Navigation.push('SleepDiaryEntry');
    } else if (
      notificationData.type === 'CHECKIN_REMINDER' &&
      Notification.canProcessCheckinReminderNotification()
    ) {
      if (Notification.treatmentModule && Notification.isCheckinDue) {
        Navigation.push(Notification.treatmentModule);
      }
    } else if (
      notificationData.type === 'CHAT_MESSAGE' &&
      Notification.canProcessSupportMessageNotification()
    ) {
      Navigation.navigate('Support');
    }

    Notification.removeNotificationFromTray(notificationData.id);
  }
}
