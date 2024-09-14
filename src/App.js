import React from 'react';
import './App.css'; // Adjust the path if necessary
import PDF from './MyDocument'; // Adjust the path if necessary

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>PDF Generation Example</h1>
        <PDF />
      </header>
    </div>
  );
}

export default App;


// import React from 'react';
// import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
// import HealthProfile from './components/HealthProfile';
// import SavedProfile from './components/SavedProfile';

// function App() {
//   return (
//     <Router>
//       <div className="App">
//         <Routes>
//           <Route path="/" element={<HealthProfile />} />
//           <Route path="/saved-profile" element={<SavedProfile />} />
//         </Routes>
//       </div>
//     </Router>
//   );
// }

// export default App;