import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { Container } from '@draftbit/ui';
import '@firebase/firestore';
import { scale } from 'react-native-size-matters';
import { slumber_theme } from '../config/Themes';

const HighlightedTime = (props) => {
  const theme = slumber_theme;
  return (
    <Container
      style={{
        ...styles.View_Container,
        borderRadius: theme.borderRadius.button
      }}
      elevation={0}
      backgroundColor={props.bgColor}
      useThemeGutterPadding={false}
    >
      <Text
        style={[
          theme.typography.smallLabel,
          styles.Text_Highlighted,
          { color: props.textColor }
        ]}
      >
        {props.label}
      </Text>
    </Container>
  );
};

const styles = StyleSheet.create({
  View_Container: {
    width: '94%',
    alignSelf: 'flex-start',
    marginHorizontal: 0,
    overflow: 'hidden'
  },
  Text_Highlighted: {
    textAlign: 'center',
    width: '100%',
    paddingVertical: scale(5),
    paddingHorizontal: scale(2)
  }
});

export default HighlightedTime;
