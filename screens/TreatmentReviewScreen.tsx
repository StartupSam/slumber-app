/* eslint-disable import/prefer-default-export */
import React from 'react';
import { WebView } from 'react-native-webview';
import treatments from '../constants/Treatments';

interface Props {
  route: {
    params: {
      module?: string;
      link?: string;
    };
  };
}

const treatmentsIndexed: { [index: string]: { url: string } } = treatments;

// Display a webview of the relevant knowledgebase collection or page
export const TreatmentReviewScreen: React.FC<Props> = ({ route }) => {
  let uri = 'https://dozy.customerly.help'; // If no params, show main FAQ
  if (route.params?.link) {
    uri = route.params.link;
  } else if (route.params?.module) {
    // If module, get the URL from treatment constants
    uri = treatmentsIndexed[route.params.module].url;
  }

  return (
    <WebView
      source={{
        uri: uri
      }}
    />
  );
};
