import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import CityPage from './pages/CityPage';
import StatePage from './pages/StatePage';
import Privacy from './Privacy';
import Transparency from './Transparency';
import TestApi from './TestApi';
import SecurityDashboard from './pages/SecurityDashboard';
import './App.css';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/locations" element={<StatePage />} />
      <Route path="/locations/:state" element={<StatePage />} />
      <Route path="/locations/:state/:city" element={<CityPage />} />
      <Route path="/locations/:state/:city/:reportId" element={<CityPage />} />

      <Route path="/privacy" element={<Privacy />} />
      <Route path="/transparency" element={<Transparency />} />
      <Route path="/test" element={<TestApi />} />
      <Route path="/security" element={<SecurityDashboard />} />

      {/* Fallback for unknown routes */}
      <Route path="*" element={<Home />} />
    </Routes>
  );
}

export default App;

