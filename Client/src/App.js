// App.js
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import About from './pages/About';
import Menu from './pages/Menu';
import Reservation from './pages/Reservation';
import Tasting from './pages/Tasting';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
import Courier from './pages/Courier';
import Header from './components/Header';

// Импортируем клиентские компоненты
import ClientDashboard from './pages/ClientDashboard';
import ClientCart from './pages/ClientCart';
import ClientOrders from './pages/ClientOrders';
import ClientPayment from './pages/ClientPayment';

// Компонент для защиты маршрутов
const PrivateRoute = ({ children, requiredRole = null }) => {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');

  if (!token || !user) {
    return <Navigate to="/login" />;
  }

  if (requiredRole) {
    const userObj = JSON.parse(user);
    if (userObj.role !== requiredRole) {
      // Перенаправляем в зависимости от роли
      switch (userObj.role) {
        case 'Admin':
          return <Navigate to="/admin" />;
        case 'Courier':
          return <Navigate to="/courier" />;
        default:
          return <Navigate to="/client" />;
      }
    }
  }

  return children;
};

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
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          
       
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route path="/profile" element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          } />
          
    
          <Route path="/client" element={
            <PrivateRoute>
              <ClientDashboard />
            </PrivateRoute>
          } />
          <Route path="/client/cart" element={
            <PrivateRoute>
              <ClientCart />
            </PrivateRoute>
          } />
          <Route path="/client/orders" element={
            <PrivateRoute>
              <ClientOrders />
            </PrivateRoute>
          } />
          <Route path="/client/payment/:orderId" element={
            <PrivateRoute>
              <ClientPayment />
            </PrivateRoute>
          } />
          
    
          <Route path="/admin" element={
            <PrivateRoute requiredRole="Admin">
              <Admin />
            </PrivateRoute>
          } />
          <Route path="/courier" element={
            <PrivateRoute requiredRole="Courier">
              <Courier />
            </PrivateRoute>
          } />
          
          
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </Router>
  );
}

export default App;