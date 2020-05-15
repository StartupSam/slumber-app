/* eslint-disable import/prefer-default-export */
import React from 'react';
import NumInputScreen from '../components/NumInputScreen';
import MultiButtonScreen from '../components/MultiButtonScreen';
import TagSelectScreen from '../components/TagSelectScreen';
import DateTimePickerScreen from '../components/DateTimePickerScreen';
import submitSleepDiaryData from '../utilities/submitSleepDiaryData';
import GLOBAL from '../utilities/global';
import { slumber_theme } from '../config/Themes';

// Define the theme for the file globally
const theme = slumber_theme;

export const BedTimeInput = ({ navigation }) => {
  return (
    <DateTimePickerScreen
      theme={theme}
      onQuestionSubmit={(value) => {
        GLOBAL.bedTime = value;
        navigation.navigate('MinsToFallAsleepInput');
      }}
      progressBarPercent={0.13}
      mode="time"
      questionLabel="What time did you go to bed last night?"
      inputLabel="Bedtime"
    />
  );
};

export const MinsToFallAsleepInput = ({ navigation }) => {
  return (
    <NumInputScreen
      theme={theme}
      onQuestionSubmit={(value) => {
        GLOBAL.minsToFallAsleep = value;
        navigation.navigate('WakeCountInput');
      }}
      progressBarPercent={0.26}
      questionLabel="Roughly how long did it take you to fall asleep?"
      inputLabel="(in minutes)"
    />
  );
};

export const WakeCountInput = ({ navigation }) => {
  return (
    <MultiButtonScreen
      theme={theme}
      onQuestionSubmit={(value) => {
        GLOBAL.wakeCount = value;
        navigation.navigate('NightMinsAwakeInput');
      }}
      buttonValues={[
        { label: "0 (didn't wake up)", value: 0 },
        { label: '1', value: 1 },
        { label: '2', value: 2 },
        { label: '3', value: 3 },
        { label: '4', value: 4 },
        { label: '5+', value: 5 }
      ]}
      progressBarPercent={0.38}
      questionLabel="After falling asleep, about how many times did you wake up in the night?"
    />
  );
};

export const NightMinsAwakeInput = ({ navigation }) => {
  return (
    <NumInputScreen
      theme={theme}
      onQuestionSubmit={(value) => {
        GLOBAL.nightMinsAwake = value;
        navigation.navigate('WakeTimeInput');
      }}
      progressBarPercent={0.5}
      questionLabel="Roughly how many minutes were you awake in the night in total?"
      inputLabel="(in minutes)"
    />
  );
};

export const WakeTimeInput = ({ navigation }) => {
  return (
    <DateTimePickerScreen
      theme={theme}
      progressBarPercent={0.63}
      onQuestionSubmit={(value) => {
        GLOBAL.wakeTime = value;
        navigation.navigate('UpTimeInput');
      }}
      mode="time"
      questionLabel="What time did you wake up?"
      inputLabel="Wake time"
    />
  );
};

export const UpTimeInput = ({ navigation }) => {
  return (
    <DateTimePickerScreen
      theme={theme}
      progressBarPercent={0.76}
      onQuestionSubmit={(value) => {
        GLOBAL.upTime = value;
        navigation.navigate('SleepRatingInput');
      }}
      mode="time"
      defaultValue={GLOBAL.wakeTime}
      questionLabel="What time did you get up?"
      inputLabel="The time you got out of bed"
    />
  );
};

export const SleepRatingInput = ({ navigation }) => {
  return (
    <MultiButtonScreen
      theme={theme}
      onQuestionSubmit={(value) => {
        GLOBAL.sleepRating = value;
        navigation.navigate('TagsNotesInput');
      }}
      buttonValues={[
        { label: '1', value: 1 },
        { label: '2', value: 2 },
        { label: '3', value: 3 },
        { label: '4', value: 4 },
        { label: '5', value: 5 }
      ]}
      progressBarPercent={0.87}
      questionLabel="On a scale of 1-5, how would you rate the quality of your sleep last night?"
    />
  );
};

export const TagsNotesInput = ({ navigation }) => {
  return (
    <TagSelectScreen
      theme={theme}
      touchableTags={[
        { label: 'nothing', icon: 'emoji-happy' },
        { label: 'light', icon: 'light-bulb' },
        { label: 'noise', icon: 'sound' },
        { label: 'pets', icon: 'baidu' },
        { label: 'kids', icon: 'users' },
        { label: 'my partner', icon: 'user' },
        { label: 'heat', icon: 'adjust' },
        { label: 'cold', icon: 'water' },
        { label: 'bad bed', icon: 'bug' },
        { label: 'worry', icon: 'emoji-sad' },
        { label: 'stress', icon: 'new' }
      ]}
      onFormSubmit={async (res) => {
        // Update global state with new values
        GLOBAL.notes = res.notes;
        GLOBAL.tags = res.tags;

        // Submit data to Firebase thru helper function
        submitSleepDiaryData();

        // Navigate back to the main app
        navigation.navigate('App');
      }}
      progressBarPercent={0.95}
      questionLabel="What, if anything, disturbed your sleep last night?"
      inputLabel="Anything else of note?"
    />
  );
};
