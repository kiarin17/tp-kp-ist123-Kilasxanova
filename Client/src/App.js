import { BrowserRouter as Router, Routes, Route} from 'react-router-dom';
import Home from './pages/Home';
import About from './pages/About';
import Menu from './pages/Menu';
import Reservation from './pages/Reservation';
import Shop from './pages/Shop';
import Tasting from './pages/Tasting';
import Contact from './pages/Contact';
import Header from './components/Header';

function App() {
  return (
    <Router>
      <Header />

      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="/tasting" element={<Tasting />} />
          <Route path="/reservation" element={<Reservation />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
        </Routes>
      </main>
    </Router>
  );
}


export default App; 