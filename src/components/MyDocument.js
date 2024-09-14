import React, {useRef} from 'react';
import html2canvas from 'html2canvas'; 
import jsPDF from 'jspdf';

export default function PDF(){
  const pdfRef = useRef();

  const downloadPDF = () => {
    html2canvas(pdfRef.current).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4'); // 'p' for portrait, 'mm' for millimeters, 'a4' for paper size
      const imgWidth = 210; // A4 paper width in mm
      const pageHeight = 295; // A4 paper height in mm
      const imgHeight = canvas.height * imgWidth / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save('download.pdf');
    });
  };

  return (
      <div className="container mt-5 border p-5" ref={pdfRef}>
          <h1>Hey</h1>
          <div className='row text-center mt-5'>
            <button className="btn btn-primary" onClick={downloadPDF}>Download PDF</button>
        </div>

      </div>
  )
}










// import React, {useRef} from 'react';
// import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';
// import htmlcanvas2 from 'html2canvas';
// import jsPDF from 'jspdf';

// const styles = StyleSheet.create({
//   page: {
//     flexDirection: 'row',
//     backgroundColor: '#E4E4E4'
//   },
//   section: {
//     margin: 10,
//     padding: 10,
//     flexGrow: 1
//   }
// });

// const pdfRef = useRef;

// const MyDocument = () => (
//   <Document>
//     <Page size="A4" style={styles.page}>
//       <View style={styles.section}>
//         <Text>Section #1</Text>
//       </View>
//       <View style={styles.section}>
//         <Text>Section #2</Text>
//       </View>
//     </Page>
//   </Document>
// );

// export default MyDocument;