import React from 'react';
import { PDFViewer, Document, Page, Text } from '@react-pdf/renderer';
import MyDocument from './pdf/MyDocument';


const App = () => (
  <PDFViewer style={{ width: '100vw', height: '100vh' }}>
    <MyDocument />
  </PDFViewer>
);

export default App;
