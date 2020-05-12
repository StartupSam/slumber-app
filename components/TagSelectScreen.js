import React from "react"
import { StyleSheet, Text, Platform } from "react-native"
import {
  withTheme,
  ScreenContainer,
  Container,
  IconButton,
  ProgressBar,
  TextField,
  Button,
} from "@draftbit/ui"
import '@firebase/firestore';
import Intl from 'intl';
import * as SecureStore from 'expo-secure-store';
import { FbLib } from "../config/firebaseConfig";
import GLOBAL from '../global';

if (Platform.OS === 'android') {
  require('intl/locale-data/jsonp/en-US');
  require('intl/locale-data/jsonp/tr-TR');
  require('date-time-format-timezone');
  Intl.__disableRegExpRestore();/*For syntaxerror invalid regular expression unmatched parentheses*/
}

const TagSelectScreen = props => {
    // Setup component state
    const [selectedTags, setSelectedTags] = React.useState([]);
    const [notes, setNotes] = React.useState("");

    // Handle updating sleep diary logs in Firebase, calculate hidden vars
    const pushSleepLogToFirebase = async () => {
        
        // Initialize relevant Firebase values
        var db = FbLib.firestore();
        let userId = await SecureStore.getItemAsync('userData');
        var docRef = db.collection("sleep-logs").doc(userId); //CHANGE THIS CALL
    
        // Get today's date, turn it into a string
        var todayDate = new Date();
        var dd = String(todayDate.getDate()).padStart(2, '0');
        var mm = String(todayDate.getMonth() + 1).padStart(2, '0'); //January is 0!
        var yyyy = todayDate.getFullYear();
        const todayDateString = yyyy + '-' + mm + '-' + dd;
    
        // If bedtime/sleeptime are in the evening, change them to be the day before
        if (GLOBAL.bedTime > GLOBAL.wakeTime) {
          GLOBAL.bedTime = new Date(GLOBAL.bedTime.setDate(GLOBAL.bedTime.getDate() - 1));
        }
    
        // calculate total time in bed, time between waking & getting up, and time awake in bed
        var minsInBedTotalMs = (GLOBAL.upTime - GLOBAL.bedTime);
        var minsInBedTotal = Math.floor((minsInBedTotalMs/1000)/60);
        var minsInBedAfterWakingMs = GLOBAL.upTime - GLOBAL.wakeTime;
        var minsInBedAfterWaking = Math.floor((minsInBedAfterWakingMs/1000)/60);
        var minsAwakeInBedTotal = (parseInt(GLOBAL.nightMinsAwake) + parseInt(GLOBAL.minsToFallAsleep) + minsInBedAfterWaking);
        
        // calculate sleep duration & sleep efficiency
        var sleepDuration = minsInBedTotal - minsAwakeInBedTotal;
        var sleepEfficiency = +((sleepDuration / minsInBedTotal).toFixed(2));
    
        // Write the data to the user's sleep log document in Firebase
        docRef.update({
          [todayDateString]: {
            bedTime: GLOBAL.bedTime,
            minsToFallAsleep: parseInt(GLOBAL.minsToFallAsleep),
            wakeCount: GLOBAL.wakeCount,
            nightMinsAwake: parseInt(GLOBAL.nightMinsAwake),
            wakeTime: GLOBAL.wakeTime,
            upTime: GLOBAL.upTime,
            sleepRating: GLOBAL.sleepRating,
            notes: GLOBAL.notes,
            fallAsleepTime: new Date(GLOBAL.bedTime.getTime() + GLOBAL.minsToFallAsleep*60000),
            sleepEfficiency: sleepEfficiency,
            sleepDuration: sleepDuration,
            minsInBedTotal: minsInBedTotal,
            minsAwakeInBedTotal: minsAwakeInBedTotal,
          },
        }).catch(function(error) {
            console.log("Error pushing sleep log data:", error);
        });
    };
    
    // Handle submission
    function onFormSubmit (value) {
        GLOBAL.notes = value;
        pushSleepLogToFirebase();
        props.navigation.navigate("App");
    }

    const { theme } = props
    return (
        <ScreenContainer hasSafeArea={true} scrollable={false} style={styles.Root_nb1}>
            <Container style={styles.Container_nof} elevation={0} useThemeGutterPadding={true}>
                <IconButton
                    style={styles.IconButton_n9u}
                    icon="Ionicons/md-arrow-back"
                    size={32}
                    color={theme.colors.secondary}
                    onPress={() => {
                    props.navigation.goBack()
                    }}
                />
                <Container style={styles.Container_nuv} elevation={0} useThemeGutterPadding={true}>
                    <ProgressBar
                    style={{...styles.ProgressBar_nn5, ...{display: props.progressBar ? 'flex' : 'none'}}}
                    color={theme.colors.primary}
                    progress={props.progressBarPercent}
                    borderWidth={0}
                    borderRadius={10}
                    animationType="spring"
                    unfilledColor={theme.colors.medium}
                    />
                </Container>
            </Container>
            <Container style={styles.Container_n8t} elevation={0} useThemeGutterPadding={true}>
                <Text
                    style={[
                    styles.Text_nqt,
                    theme.typography.headline5,
                    {
                        color: theme.colors.secondary
                    }
                    ]}
                >
                    {props.questionLabel}
                </Text>
                <TextField
                    style={styles.TextField_no0}
                    type="underline"
                    label={props.inputLabel}
                    keyboardType="default"
                    leftIconMode="inset"
                    onChangeText={value => setNotes(value)}
                    onSubmitEditing={(event)=>{
                        onFormSubmit(event.nativeEvent.text)
                    }}
                />
            </Container>
            <Container style={styles.Container_nmw} elevation={0} useThemeGutterPadding={true}>
                <Button
                    style={styles.Button_n5c}
                    type="solid"
                    onPress={() => {
                        onFormSubmit(notes)
                    }}
                    color={theme.colors.primary}
                >
                    Finish
                </Button>
            </Container>
        </ScreenContainer>
    )
}

const styles = StyleSheet.create({
  Button_n5c: {
    paddingTop: 0,
    marginTop: 8
  },
  Container_n8t: {
    height: "72%",
    justifyContent: "center",
    marginTop: 20
  },
  Container_nmw: {
    height: "15%"
  },
  Container_nof: {
    width: "100%",
    height: "10%",
    justifyContent: "space-between",
    flexDirection: "row",
    marginTop: 20
  },
  Container_nuv: {
    width: "100%",
    justifyContent: "center",
    alignItems: "center"
  },
  IconButton_n9u: {
    paddingRight: 0
  },
  ProgressBar_nn5: {
    width: 250,
    height: 7,
    paddingRight: 0,
    marginRight: 0
  },
  Root_nb1: {
  },
  TextField_no0: {},
  Text_nqt: {
    textAlign: "center",
    width: "100%",
    alignItems: "flex-start",
    alignSelf: "center"
  }
})

export default withTheme(TagSelectScreen)
