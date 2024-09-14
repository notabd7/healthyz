import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import HealthProfile from './components/HealthProfile';
import SavedProfile from './components/SavedProfile';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<HealthProfile />} />
          <Route path="/saved-profile" element={<SavedProfile />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;