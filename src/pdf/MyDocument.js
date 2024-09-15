import React from 'react';
import { Page, Text, View, Font, Document, StyleSheet } from '@react-pdf/renderer';

// Register fonts
Font.register({
  family: 'Poppins',
  fonts: [
    { src: 'src/fonts/poppins/Poppins-Regular.ttf' },
    { src: 'src/fonts/poppins/Poppins-Bold.ttf', fontWeight: 'bold' },
  ],
});

// Create styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
  },
  header: {
    textAlign: 'center',
    fontSize: 24,
    color: '#8b008b',
    //fontFamily:'Poppins',
    fontWeight: 'bold',
    marginBottom: 20,
  },
  sectionHeader: {
    textAlign: 'left',
    fontSize: 18,
    color: '#8b008b',
    fontWeight: 'bold',
    marginBottom: 10,
    marginTop: 10,
  },
  section: {
    marginBottom: 10,
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 8,
    boxShadow: '0 2px 5px rgba(0, 0, 0, 0.05)',
    fontSize: 12,
    color: '#333',
  },
  label: {
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summary: {
    marginBottom: 10,
    padding: 20,
    borderRadius: 8,
    border: '1px solid #ddd',
    fontSize: 12,
    color: '#333',
    backgroundColor: '#fff',
  },
  prescription: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4a0e4e',
  },
});

// Define the document structure
const MyDocument = () => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <Text>Pre-Visit Summary</Text>
      </View>

      {/* Patient Information Section */}
      <View style={styles.sectionHeader}>
        <Text>Patient Information</Text>
      </View>

      <View style={styles.section}>
        <View style={styles.row}>
          <Text>Name: NAME</Text>
          <Text>Age: AGE</Text>
        </View>
        <View style={styles.row}>
          <Text>Patient ID: ID</Text>
          <Text>Gender: IM/HIM</Text>
        </View>
        <View style={styles.row}>
          <Text>Date: DATE</Text>
          <Text>Visit Type: TYPE</Text>
        </View>
      </View>

      {/* Visit Summary Section */}
      <View style={styles.sectionHeader}>
        <Text>Visit Summary</Text>
      </View>
      <View style={styles.summary}>
        <Text>
          Patient has been vomiting. Lorem ipsum.
        </Text>
      </View>

      {/* Chat Transcript Section */}
      <View style={styles.sectionHeader}>
        <Text>Chat Transcript</Text>
      </View>
      <View style={styles.section}>
        <Text style={{ fontWeight: 'bold' }}>healthyz: </Text>
        <Text>QUESTION BOLD.. repeat</Text>
      </View>

      {/* Medical History Section */}
      <View style={styles.sectionHeader}>
        <Text>Medical History</Text>
      </View>
      <View style={styles.section}>
        <Text style={{ fontWeight: 'bold' }}>PROMPT BOLD</Text>
        <Text>Answer</Text>
      </View>
      <View style={styles.section}>
        <Text style={{ fontWeight: 'bold' }}>PROMPT BOLD</Text>
        <Text>Answer</Text>
      </View>
      <View style={styles.section}>
        <Text style={{ fontWeight: 'bold' }}>PROMPT BOLD</Text>
        <Text>Answer</Text>
      </View>
    </Page>
  </Document>
);

export default MyDocument;
