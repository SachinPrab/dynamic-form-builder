import React from 'react'
import { BrowserRouter as Router, Route, Routes, BrowserRouter } from 'react-router-dom'
import LoginWithAirtable from './pages/Login'
import Callback from './pages/Callback'
import BaseSelector from './pages/BaseSelector'
import Form from './pages/Form'
const App = () => {
  return (
    <div>
      <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginWithAirtable />} />
        <Route path="/callback" element={<Callback />} />
        <Route path="/bases" element={<BaseSelector />} />
        <Route path="/form/:formId" element={<Form />} />
      </Routes>
      </BrowserRouter>
    </div>
  )
}

export default App
