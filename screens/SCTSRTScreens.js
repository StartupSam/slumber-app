/* eslint-disable import/prefer-default-export */
import React from 'react';
import { useWindowDimensions, Text, StyleSheet } from 'react-native';
import { scale } from 'react-native-size-matters';
import {
  VictoryChart,
  VictoryTheme,
  VictoryLine,
  VictoryAxis
} from 'victory-native';
import { AuthContext } from '../utilities/authContext';
import IconExplainScreen from '../components/screens/IconExplainScreen';
import WizardContentScreen from '../components/screens/WizardContentScreen';
import MultiButtonScreen from '../components/screens/MultiButtonScreen';
import DateTimePickerScreen from '../components/screens/DateTimePickerScreen';
import GLOBAL from '../utilities/global';
import { dozy_theme } from '../config/Themes';
import WaveHello from '../assets/images/WaveHello.svg';
import FemaleDoctor from '../assets/images/FemaleDoctor.svg';
import LabCoat from '../assets/images/LabCoat.svg';
import Clipboard from '../assets/images/Clipboard.svg';
import TiredFace from '../assets/images/TiredFace.svg';
import BarChart from '../assets/images/BarChart.svg';
import Expressionless from '../assets/images/Expressionless.svg';
import MonocleEmoji from '../assets/images/MonocleEmoji.svg';
import Stop from '../assets/images/Stop.svg';
import WarningTriangle from '../assets/images/WarningTriangle.svg';
import TanBook from '../assets/images/TanBook.svg';
import RaisedHands from '../assets/images/RaisedHands.svg';
import SCTSRTTreatmentPlan from '../assets/images/SCTSRTTreatmentPlan.svg';
import BadCycleIllustration from '../assets/images/BadCycleIllustration.svg';
import AlarmClock from '../assets/images/AlarmClock.svg';
import Rule2Illustration from '../assets/images/Rule2Illustration.svg';
import Rule3Illustration from '../assets/images/Rule3Illustration.svg';
import submitOnboardingData from '../utilities/submitOnboardingData';
import registerForPushNotificationsAsync from '../utilities/pushNotifications';

// TODO: Add progress bar percentages to each screen

// Define the theme for the file globally
const theme = dozy_theme;

// Define square image size defaults as a percent of width
const imgSizePercent = 0.4;

// Define default chart styles
const chartStyles = {
  chart: {
    width: scale(300),
    height: scale(300),
    domainPadding: { x: [3, 3], y: [35, 35] }
  },
  axis: {
    tickLabels: {
      angle: -45,
      fontSize: scale(11)
    },
    grid: {
      stroke: theme.colors.medium
    }
  },
  line: {
    data: {
      stroke: theme.colors.primary,
      strokeWidth: scale(4),
      strokeLinejoin: 'round'
    }
  }
};

export const Welcome = ({ navigation }) => {
  let imgSize = imgSizePercent * useWindowDimensions().width;
  return (
    <IconExplainScreen
      theme={theme}
      bottomBackButton={() => navigation.goBack()}
      image={<FemaleDoctor width={imgSize} height={imgSize * 1.2} />}
      onQuestionSubmit={() => {
        navigation.navigate('SleepEfficiency', {
          progressBarPercent: null
        });
      }}
      textLabel="Welcome back! This’ll take 10-15 minutes. We’ll review your sleep over the last week, update your treatment plan, and get you started on your new treatment."
    />
  );
};

export const SleepEfficiency = ({ navigation }) => {
  const { state } = React.useContext(AuthContext);

  // Trim sleepLogs to only show most recent 10
  const recentSleepLogs = state.sleepLogs.slice(0, 10);

  // Calculate recent sleep efficiency average
  const sleepEfficiencyAvg = Number(
    (
      (recentSleepLogs.reduce((a, b) => a + b.sleepEfficiency, 0) /
        recentSleepLogs.length) *
      100
    ).toFixed(0)
  );

  return (
    <WizardContentScreen
      theme={theme}
      bottomBackButton={() => navigation.goBack()}
      onQuestionSubmit={() => {
        navigation.navigate('SleepOnset', {
          progressBarPercent: null
        });
      }}
      textLabel={
        'Your sleep efficiency has been ' +
        (sleepEfficiencyAvg < 85 ? 'poor this week' : 'good this week') +
        ', with an average of ' +
        sleepEfficiencyAvg +
        '% per night. ' +
        (sleepEfficiencyAvg < 85 ? 'Not to worry' : 'Regardless') +
        " - the techniques we'll be introducing today will " +
        (sleepEfficiencyAvg < 85
          ? 'focus on permanently boosting'
          : 'still improve') +
        ' sleep efficiency.'
      }
    >
      <VictoryChart
        width={chartStyles.chart.width}
        height={chartStyles.chart.height}
        theme={VictoryTheme.material}
        scale={{ x: 'time' }}
        domainPadding={chartStyles.chart.domainPadding}
      >
        <VictoryAxis
          dependentAxis
          tickFormat={(tick) => tick * 100 + '%'}
          style={chartStyles.axis}
          tickCount={5}
        />
        <VictoryAxis
          style={chartStyles.axis}
          tickFormat={(tick) => {
            return tick.toLocaleString('en-US', {
              month: 'short',
              day: 'numeric'
            });
          }}
          tickCount={7}
        />
        <VictoryLine
          data={recentSleepLogs}
          x={(d) => d.upTime.toDate()}
          y="sleepEfficiency"
          style={chartStyles.line}
          interpolation="monotoneX"
        />
      </VictoryChart>
    </WizardContentScreen>
  );
};

export const SleepOnset = ({ navigation }) => {
  const { state } = React.useContext(AuthContext);

  // Trim sleepLogs to only show most recent 10
  const recentSleepLogs = state.sleepLogs.slice(0, 10);

  // Calculate recent sleep efficiency average
  const sleepOnsetAvg = Number(
    (
      recentSleepLogs.reduce((a, b) => a + b.minsToFallAsleep, 0) /
      recentSleepLogs.length
    ).toFixed(0)
  );

  return (
    <WizardContentScreen
      theme={theme}
      bottomBackButton={() => navigation.goBack()}
      onQuestionSubmit={() => {
        navigation.navigate('SleepMaintenance', {
          progressBarPercent: null
        });
      }}
      textLabel={
        'Your sleep onset latency (time it takes to fall asleep) has been ' +
        (sleepOnsetAvg > 45 ? 'poor this week' : 'ok this week') +
        " - you've been taking an average of " +
        sleepOnsetAvg +
        ' minutes to fall asleep. This number will improve along with sleep efficiency in the coming weeks.'
      }
    >
      <VictoryChart
        width={chartStyles.chart.width}
        height={chartStyles.chart.height}
        theme={VictoryTheme.material}
        scale={{ x: 'time' }}
        domainPadding={chartStyles.chart.domainPadding}
      >
        <VictoryAxis dependentAxis style={chartStyles.axis} tickCount={5} />
        <VictoryAxis
          style={chartStyles.axis}
          tickFormat={(tick) => {
            return tick.toLocaleString('en-US', {
              month: 'short',
              day: 'numeric'
            });
          }}
          tickCount={7}
        />
        <VictoryLine
          data={recentSleepLogs}
          x={(d) => d.upTime.toDate()}
          y="minsToFallAsleep"
          style={chartStyles.line}
          interpolation="monotoneX"
        />
      </VictoryChart>
    </WizardContentScreen>
  );
};

export const SleepMaintenance = ({ navigation }) => {
  const { state } = React.useContext(AuthContext);

  // Trim sleepLogs to only show most recent 10
  const recentSleepLogs = state.sleepLogs.slice(0, 10);

  // Calculate recent sleep efficiency average
  const nightMinsAwakeAvg = Number(
    (
      recentSleepLogs.reduce((a, b) => a + b.nightMinsAwake, 0) /
      recentSleepLogs.length
    ).toFixed(0)
  );

  return (
    <WizardContentScreen
      theme={theme}
      bottomBackButton={() => navigation.goBack()}
      onQuestionSubmit={() => {
        navigation.navigate('TreatmentPlan', {
          progressBarPercent: null
        });
      }}
      textLabel={
        'Your sleep maintenance (how easily you stay asleep) has been ' +
        (nightMinsAwakeAvg > 45 ? 'poor this week' : 'ok this week') +
        " - after initially falling sleep, you're awake " +
        nightMinsAwakeAvg +
        " minutes on average. This number will also improve with the techniques we're introducing today."
      }
      buttonLabel="This week's treatment"
    >
      <VictoryChart
        width={chartStyles.chart.width}
        height={chartStyles.chart.height}
        theme={VictoryTheme.material}
        scale={{ x: 'time' }}
        domainPadding={chartStyles.chart.domainPadding}
      >
        <VictoryAxis dependentAxis style={chartStyles.axis} tickCount={5} />
        <VictoryAxis
          style={chartStyles.axis}
          tickFormat={(tick) => {
            return tick.toLocaleString('en-US', {
              month: 'short',
              day: 'numeric'
            });
          }}
          tickCount={7}
        />
        <VictoryLine
          data={recentSleepLogs}
          x={(d) => d.upTime.toDate()}
          y="nightMinsAwake"
          style={chartStyles.line}
          interpolation="monotoneX"
        />
      </VictoryChart>
    </WizardContentScreen>
  );
};

export const TreatmentPlan = ({ navigation }) => {
  let imgSize = imgSizePercent * useWindowDimensions().width;

  return (
    <WizardContentScreen
      theme={theme}
      bottomBackButton={() => navigation.goBack()}
      onQuestionSubmit={() => {
        navigation.navigate('TreatmentPlanContinued', {
          progressBarPercent: null
        });
      }}
      textLabel={
        "Let's get started with Stimulus Control Therapy (SCT) and Sleep Restriction Therapy (SRT). We'll calculate your current sleep duration, use that to determine the amount of time you should spend in bed, then work with you to set a new sleep schedule designed to fix your insomnia."
      }
      buttonLabel="Next"
      flexibleLayout
    >
      <SCTSRTTreatmentPlan width={imgSize * 2} height={imgSize} />
    </WizardContentScreen>
  );
};

export const TreatmentPlanContinued = ({ navigation }) => {
  let imgSize = imgSizePercent * useWindowDimensions().width;

  return (
    <WizardContentScreen
      theme={theme}
      bottomBackButton={() => navigation.goBack()}
      onQuestionSubmit={() => {
        navigation.navigate('DriversOfSleep', {
          progressBarPercent: null
        });
      }}
      textLabel={
        "By sacrificing some short-term comfort, these two techniques will help you fall asleep quickly and stay asleep. To start, we'll talk about how sleep works, why these techniques help, and how to use them."
      }
      buttonLabel="Next"
    >
      <SCTSRTTreatmentPlan width={imgSize * 2} height={imgSize} />
    </WizardContentScreen>
  );
};

export const DriversOfSleep = ({ navigation }) => {
  let imgSize = imgSizePercent * useWindowDimensions().width;
  return (
    <WizardContentScreen
      theme={theme}
      bottomBackButton={() => navigation.goBack()}
      onQuestionSubmit={() => {
        navigation.navigate('WhySleepDrives', {
          progressBarPercent: 0.14
        });
      }}
      titleLabel="The two main drivers of human sleep"
      textLabel={
        <Text>
          Are <Text style={styles.BoldLabelText}>circadian sleep drive</Text>{' '}
          and <Text style={styles.BoldLabelText}>homeostatic sleep drive.</Text>{' '}
          Homeostatic sleep drive means the longer you&apos;ve been awake, the
          sleepier you become. Circadian sleep drive is your body&apos;s
          internal clock - it controls your energy with the day/night cycle.
        </Text>
      }
      flexibleLayout
      buttonLabel="Why does this matter?"
    >
      <FemaleDoctor width={imgSize} height={imgSize} />
    </WizardContentScreen>
  );
};

export const WhySleepDrives = ({ navigation }) => {
  let imgSize = imgSizePercent * useWindowDimensions().width;
  return (
    <WizardContentScreen
      theme={theme}
      bottomBackButton={() => navigation.goBack()}
      onQuestionSubmit={() => {
        navigation.navigate('FragmentedSleep', {
          progressBarPercent: 0.14
        });
      }}
      textLabel={
        'By making both your circadian and homeostatic sleep drives stronger, we help you fall asleep faster and stay asleep longer.'
      }
      buttonLabel="Great!"
    >
      <FemaleDoctor width={imgSize} height={imgSize} />
    </WizardContentScreen>
  );
};

export const FragmentedSleep = ({ navigation }) => {
  let imgSize = imgSizePercent * useWindowDimensions().width;
  return (
    <WizardContentScreen
      theme={theme}
      bottomBackButton={() => navigation.goBack()}
      onQuestionSubmit={() => {
        navigation.navigate('ConsolidatingSleep', {
          progressBarPercent: 0.14
        });
      }}
      titleLabel="Right now, your sleep is pretty fragmented."
      textLabel="That is to say, most of the time you spend in bed isn't spent sleeping - the actual sleep time is scattered in chunks in the night. Our first step in treatment is to fix that."
      flexibleLayout
      buttonLabel="How do I fix it?"
    >
      <FemaleDoctor width={imgSize} height={imgSize} />
    </WizardContentScreen>
  );
};

export const ConsolidatingSleep = ({ navigation }) => {
  let imgSize = imgSizePercent * useWindowDimensions().width;
  return (
    <WizardContentScreen
      theme={theme}
      bottomBackButton={() => navigation.goBack()}
      onQuestionSubmit={() => {
        navigation.navigate('ReduceTimeInBed', {
          progressBarPercent: 0.14
        });
      }}
      titleLabel="We fix it by consolidating your sleep into one chunk."
      textLabel="This raises your sleep efficiency back over 85%, where it should be. Once your sleep is mostly in one efficient chunk again, we carefully increase your time in bed until you can sleep the whole night through."
      flexibleLayout
      buttonLabel="How does one consolidate sleep?"
    >
      <FemaleDoctor width={imgSize} height={imgSize} />
    </WizardContentScreen>
  );
};

export const ReduceTimeInBed = ({ navigation }) => {
  let imgSize = imgSizePercent * useWindowDimensions().width;
  return (
    <WizardContentScreen
      theme={theme}
      bottomBackButton={() => navigation.goBack()}
      onQuestionSubmit={() => {
        navigation.navigate('SCTSRTIntro', {
          progressBarPercent: 0.14
        });
      }}
      titleLabel="Consolidate sleep by reducing time spent in bed."
      textLabel="Weirdly, staying in bed can be bad for sleep! By extending time in bed, there’s less pressure to sleep the next night. To compensate, you stay in bed longer, which further reduces ability to sleep. It’s a vicious cycle!"
      flexibleLayout
      buttonLabel="What do I need to do?"
    >
      <BadCycleIllustration width={imgSize * 1.5} height={imgSize} />
    </WizardContentScreen>
  );
};

export const SCTSRTIntro = ({ navigation }) => {
  let imgSize = imgSizePercent * useWindowDimensions().width;
  return (
    <WizardContentScreen
      theme={theme}
      bottomBackButton={() => navigation.goBack()}
      onQuestionSubmit={() => {
        navigation.navigate('Rule1', {
          progressBarPercent: 0.14
        });
      }}
      titleLabel="This is where SCT and SRT come in."
      textLabel="By following 3 simple rules, we can break the vicious cycle, boost your homeostatic sleep drive, and start improving your sleep."
      buttonLabel="What's the first rule?"
    >
      <Clipboard width={imgSize} height={imgSize} />
    </WizardContentScreen>
  );
};

export const Rule1 = ({ navigation }) => {
  let imgSize = imgSizePercent * useWindowDimensions().width;
  return (
    <WizardContentScreen
      theme={theme}
      bottomBackButton={() => navigation.goBack()}
      onQuestionSubmit={() => {
        navigation.navigate('Rule2', {
          progressBarPercent: 0.14
        });
      }}
      titleLabel="1st, maintain the sleep restricted schedule."
      textLabel="That means going to bed and getting out of bed at specific times we'll pick with you."
      buttonLabel="What's the second rule?"
    >
      <AlarmClock width={imgSize} height={imgSize} />
    </WizardContentScreen>
  );
};

export const Rule2 = ({ navigation }) => {
  let imgSize = imgSizePercent * useWindowDimensions().width;
  return (
    <WizardContentScreen
      theme={theme}
      bottomBackButton={() => navigation.goBack()}
      onQuestionSubmit={() => {
        navigation.navigate('Rule3', {
          progressBarPercent: 0.14
        });
      }}
      titleLabel="2nd, if you're unable to sleep for 15+ minutes, get out of bed..."
      textLabel="...and go do some other relaxing activity. Return to bed when you're sleepy again."
      buttonLabel="What's the third rule?"
    >
      <Rule2Illustration width={imgSize * 1.5} height={imgSize} />
    </WizardContentScreen>
  );
};

export const Rule3 = ({ navigation }) => {
  let imgSize = imgSizePercent * useWindowDimensions().width;
  return (
    <WizardContentScreen
      theme={theme}
      bottomBackButton={() => navigation.goBack()}
      onQuestionSubmit={() => {
        navigation.navigate('ISI1', {
          progressBarPercent: 0.14
        });
      }}
      titleLabel="3rd, don't do anything in bed besides sleeping."
      textLabel="That means no reading, no phone use, no TV, and no daytime naps. "
    >
      <Rule3Illustration width={imgSize * 1.2} height={imgSize} />
    </WizardContentScreen>
  );
};

export const DiaryReminder = ({ navigation }) => {
  return (
    <DateTimePickerScreen
      theme={theme}
      bottomBackButton={() => navigation.goBack()}
      onQuestionSubmit={(value) => {
        // TODO: Can I just make the arrow function async instead of below
        async function setPushToken() {
          GLOBAL.expoPushToken = await registerForPushNotificationsAsync();
        }
        if (value != false) {
          GLOBAL.diaryReminderTime = value;
          setPushToken();
        } else {
          null;
        }
        navigation.navigate('CheckinScheduling', { progressBarPercent: 0.6 });
      }}
      questionLabel="What time do you usually do that? (we'll send you a gentle reminder)"
      bottomGreyButtonLabel="Don't set a reminder"
      mode="time"
    />
  );
};

export const CheckinScheduling = ({ navigation }) => {
  return (
    <DateTimePickerScreen
      theme={theme}
      bottomBackButton={() => navigation.goBack()}
      defaultValue={new Date(new Date().getTime() + 86400000 * 7)}
      onQuestionSubmit={(value) => {
        // TODO: Add validation to ensure date is far out enough for data colleciton
        // Another option - wait until 7 sleep logs are collected before allowing continue
        GLOBAL.firstCheckinTime = value;
        navigation.navigate('PaywallPlaceholder', { progressBarPercent: 0.8 });
      }}
      questionLabel="When would you like to schedule your first weekly check-in? (Check-ins take 5-10 minutes and introduce you to new treatment techniques based on your sleep patterns.)"
      buttonLabel="I've picked a date 7+ days from today"
      mode="datetime"
    />
  );
};

export const OnboardingEnd = ({ navigation }) => {
  let imgSize = imgSizePercent * useWindowDimensions().width;
  const { dispatch, finishOnboarding } = React.useContext(AuthContext);
  return (
    <IconExplainScreen
      theme={theme}
      bottomBackButton={() => navigation.goBack()}
      image={<RaisedHands width={imgSize} height={imgSize} />}
      onQuestionSubmit={() => {
        submitOnboardingData(dispatch);
        finishOnboarding();
      }}
      textLabel="You made it!! We won’t let you down. Let’s get started and record how you slept last night."
      buttonLabel="Continue"
    />
  );
};

const styles = StyleSheet.create({
  BoldLabelText: {
    fontFamily: 'RubikMedium',
    fontSize: scale(20)
  }
});
