import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';  // ✅ Single import
import LoginWithAirtable from './pages/Login';
import Callback from './pages/Callback';
import BaseSelector from './pages/BaseSelector';
import Form from './pages/Form';

const App = () => {
  return (
    <Router>  {/* ✅ Wrap ONCE at root */}
      <Routes>
        <Route path="/" element={<LoginWithAirtable />} />
        <Route path="/oauth/airtable/callback" element={<Callback />} />
        <Route path="/bases" element={<BaseSelector />} />
        <Route path="/form/:formId" element={<Form />} />
      </Routes>
    </Router>
  );
};

export default App;
