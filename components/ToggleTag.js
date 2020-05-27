import React from 'react';
import { StyleSheet, Text, View, TouchableWithoutFeedback } from 'react-native';
import { withTheme } from '@draftbit/ui';
import '@firebase/firestore';
import { Entypo } from '@expo/vector-icons';
import { scale } from 'react-native-size-matters';

// Component for the icon/button that toggles
const ToggleTag = (props) => {
  const { theme } = props;
  const [selected, setSelected] = React.useState(false);

  return (
    <TouchableWithoutFeedback
      onPress={() => {
        setSelected(!selected);
        props.onPress(props.label);
      }}
    >
      <View style={styles.View_ToggleContainer}>
        <View
          style={[
            styles.View_IconContainer,
            selected
              ? {
                  backgroundColor: theme.colors.primary,
                  borderColor: theme.colors.primary
                }
              : {
                  borderColor: theme.colors.lightInverse
                }
          ]}
        >
          <Entypo
            name={props.entypoIcon}
            size={scale(25)}
            color={selected ? theme.colors.secondary : theme.colors.primary}
          />
        </View>
        <Text style={[styles.Text_ToggleLabel, { color: theme.colors.light }]}>
          {props.label}
        </Text>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  View_ToggleContainer: {
    width: '15%',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    margin: scale(4)
  },
  View_IconContainer: {
    borderWidth: scale(1),
    borderRadius: 100,
    width: scale(52),
    height: scale(52),
    justifyContent: 'center',
    alignItems: 'center'
  },
  Text_ToggleLabel: {
    textAlign: 'center',
    paddingTop: scale(2)
  }
});

export default withTheme(ToggleTag);
