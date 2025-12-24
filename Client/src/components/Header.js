import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import logo from "../img/logo.png";
import "../styles/header.css";

export default function Header() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/');
  };

  return (
    <header>
      <div className="header-container">
        {/* Логотип слева */}
        <div className="logo-container">
          <Link to="/" className="logo-link">
            <img src={logo} alt="Логотип" className="logo" />
            <div className="brand">
              <h1 className="brand-name">Граф Суворов</h1>
              <p className="slogan">Традиционная медовая палата</p>
            </div>
          </Link>
        </div>

        {/* Навигация по центру */}
        <nav className="main-nav">
          <Link to="/">Главная</Link>
          <Link to="/menu">Меню</Link>
          <Link to="/tasting">Дегустация</Link>
          <Link to="/reservation">Бронирование</Link>
          <Link to="/about">О нас</Link>
          <Link to="/contact">Контакты</Link>
      
        </nav>

        {/* Блок пользователя справа */}
        <div className="user-section">
          {user ? (
            <div className="user-menu">
              <div className="user-info">
                <span className="user-avatar">
                  {user.firstName?.[0]}{user.lastName?.[0]}
                </span>
                <div className="user-details">
                  <span className="user-name">{user.firstName}</span>
                  <span className="user-role">
                    {user.role === 'Admin' && 'Админ'}
                    {user.role === 'Courier' && 'Курьер'}
                    {user.role === 'Client' && 'Клиент'}
                  </span>
                </div>
              </div>
              
              <div className="user-dropdown">
                <Link to="/profile" className="dropdown-item">
                  <span className="dropdown-icon"></span>
                  Профиль
                </Link>
                
                {user.role === 'Client' && (
                  <>
                    <Link to="/client" className="dropdown-item">
                      <span className="dropdown-icon"></span>
                      Заказать еду
                    </Link>
                    <Link to="/client/orders" className="dropdown-item">
                      <span className="dropdown-icon"></span>
                      Мои заказы
                    </Link>
                    <Link to="/client/cart" className="dropdown-item">
                      <span className="dropdown-icon"></span>
                      Корзина
                    </Link>
                  </>
                )}
                
                {user.role === 'Admin' && (
                  <Link to="/admin" className="dropdown-item">
                    <span className="dropdown-icon"></span>
                    Админ-панель
                  </Link>
                )}
                
                {user.role === 'Courier' && (
                  <Link to="/courier" className="dropdown-item">
                    <span className="dropdown-icon">🚴</span>
                    Курьер
                  </Link>
                )}
                
                <button onClick={handleLogout} className="dropdown-item logout">
                  <span className="dropdown-icon"></span>
                  Выйти
                </button>
              </div>
            </div>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="login-btn">
                Войти
              </Link>
              <Link to="/register" className="register-btn">
                Регистрация
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}