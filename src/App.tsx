import { Routes, Route } from 'react-router-dom';
import { Landing } from './routes/Landing';
import { HostSetup } from './routes/HostSetup';
import { Room } from './routes/Room';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/host" element={<HostSetup />} />
      <Route path="/play/:code" element={<Room />} />
    </Routes>
  );
}
