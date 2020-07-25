import React from 'react';
import {
  ScrollView,
  Text,
  Platform,
  ActivityIndicator,
  View
} from 'react-native';
import { withTheme, ScreenContainer, Container } from '@draftbit/ui';
import PropTypes from 'prop-types';
import '@firebase/firestore';
import { Entypo } from '@expo/vector-icons';
import Intl from 'intl';
import { scale } from 'react-native-size-matters';
import SleepLogEntryCard from '../components/SleepLogEntryCard';
import AddSleepLogButton from '../components/AddSleepLogButton';
import { FbLib } from '../config/firebaseConfig';
import { dozy_theme } from '../config/Themes';
import fetchSleepLogs from '../utilities/fetchSleepLogs';
import { AuthContext } from '../utilities/authContext';

if (Platform.OS === 'android') {
  require('intl/locale-data/jsonp/en-US');
  require('intl/locale-data/jsonp/tr-TR');
  require('date-time-format-timezone');
  Intl.__disableRegExpRestore(); /*For syntaxerror invalid regular expression unmatched parentheses*/
}

const SleepLogsView = (props) => {
  const theme = dozy_theme;
  const { state } = React.useContext(AuthContext);
  let loggedToday = false;
  let selectedSleepLogs = [];

  // Determine whether user has logged sleep for the previous night
  if (props.sleepLogs != null) {
    loggedToday =
      props.sleepLogs[0].upTime.toDate().getDate() === new Date().getDate();

    // Filter available sleep logs based on which month is selected in context
    selectedSleepLogs = props.sleepLogs.filter((log) => {
      return log.upTime.toDate().getMonth() == state.selectedMonth;
    });
  }

  if (props.isLoading) {
    // If sleep logs haven't loaded, show indicator
    return (
      <View horizontal={false}>
        <AddSleepLogButton
          onPress={() => props.logEntryRedirect()}
          notLoggedToday={!loggedToday}
        />
        <ActivityIndicator
          size="large"
          color={theme.colors.primary}
          style={{
            width: scale(45),
            height: scale(45),
            marginTop: '45%',
            alignSelf: 'center'
          }}
        />
      </View>
    );
  } else if (props.sleepLogs === null) {
    // If there aren't any sleep logs, prompt the first
    return (
      <View style={{ flex: 1 }}>
        <View style={{ flex: 1 }}>
          <AddSleepLogButton
            onPress={() => props.logEntryRedirect()}
            notLoggedToday={!loggedToday}
          />
        </View>
        <View
          style={{
            height: scale(325),
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          <Entypo
            name={'arrow-with-circle-up'}
            size={scale(51)}
            color={theme.colors.medium}
          />
          <Text
            style={[
              theme.typography.smallLabel,
              {
                color: theme.colors.medium,
                textAlign: 'center',
                width: '100%',
                fontSize: scale(16),
                marginTop: scale(17)
              }
            ]}
          >
            Add your first sleep log above!
          </Text>
        </View>
      </View>
    );
  } else {
    // Otherwise load sleep logs
    var sleepLogs = selectedSleepLogs;
    return (
      <ScrollView horizontal={false}>
        <AddSleepLogButton
          onPress={() => props.logEntryRedirect()}
          notLoggedToday={!loggedToday}
        />
        {sleepLogs.map((log) => {
          return <SleepLogEntryCard sleepLog={log} key={log.upTime.seconds} />;
        })}
      </ScrollView>
    );
  }
};

const SleepLogsScreen = (props) => {
  // Get global state & dispatch
  const { state, dispatch } = React.useContext(AuthContext);

  // Set local state for loading/not loading
  const [logsLoading, setLogsLoading] = React.useState(true);

  let colRef;
  let db;

  // Set Firebase DB references if userToken is defined
  if (state.userToken) {
    db = FbLib.firestore();
    colRef = db
      .collection('users')
      .doc(state.userToken)
      .collection('sleepLogs');
  }

  // Function to fetch sleep logs from Firebase and put them in global state
  async function setSleepLogs() {
    async function fetchData() {
      // So fetchData is getting run, but fetchSleepLogs loads forever on Android.
      fetchSleepLogs(db, state.userToken)
        .then((sleepLogs) => {
          // Check that theres >1 entry. If no, set state accordingly
          if (sleepLogs.size === 0) {
            setLogsLoading(false);
          } else {
            setLogsLoading(false);
            dispatch({ type: 'SET_SLEEPLOGS', sleepLogs: sleepLogs });
          }

          return 0;
        })
        .catch(function (error) {
          console.log('Error getting sleep logs:', error);
        });
    }

    // Setup a listener to fetch new logs from Firebase
    const fetchDataBound = fetchData.bind(this);
    colRef.onSnapshot(function () {
      fetchDataBound();
    });
  }

  // Set sleep logs once upon loading
  React.useEffect(() => {
    setSleepLogs();
  }, []);

  return (
    <ScreenContainer
      style={{ backgroundColor: '#232B3F' }}
      hasSafeArea={false}
      scrollable={true}
    >
      <Container elevation={0} useThemeGutterPadding={true}>
        <SleepLogsView
          isLoading={logsLoading}
          sleepLogs={state.sleepLogs}
          logEntryRedirect={() => props.navigation.navigate('SleepDiaryEntry')}
        />
      </Container>
    </ScreenContainer>
  );
};

SleepLogsView.propTypes = {
  sleepLogs: PropTypes.array,
  logEntryRedirect: PropTypes.func
};

export default withTheme(SleepLogsScreen);
