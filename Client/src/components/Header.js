import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import logo from "../img/logo.png";
import "../styles/header.css";

export default function Header() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Проверяем есть ли пользователь в localStorage при загрузке
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
      <div className="header-top">
        <div className="logo-container">
          <img src={logo} alt="Логотип" className="logo" />
          <div className="brand">
            <h1 className="brand-name">Граф Суворов</h1>
            <p className="slogan">Традиционная медовая палата</p>
          </div>
        </div>

        {/* Блок пользователя */}
        <div className="user-section">
          {user ? (
            <div className="user-menu">
              <span className="user-greeting">Привет, {user.firstName}</span>
              <Link to="/profile" className="profile-link">Личный кабинет</Link>
              
              {/* Ссылки для админа и курьера */}
              {user.role === 'Admin' && (
                <Link to="/admin" className="admin-link">Админ-панель</Link>
              )}
              {user.role === 'Courier' && (
                <Link to="/courier" className="courier-link">Кабинет курьера</Link>
              )}
              
              <button onClick={handleLogout} className="logout-btn">Выйти</button>
            </div>
          ) : (
            <div className="auth-links">
              <Link to="/login" className="login-link">Войти</Link>
              <Link to="/register" className="register-link">Регистрация</Link>
            </div>
          )}
        </div>
      </div>

      <nav>
        <Link to="/">Главная</Link>
        <Link to="/menu">Меню</Link>
        <Link to="/tasting">Дегустация</Link>
        <Link to="/reservation">Бронирование</Link>
        <Link to="/shop">Магазин</Link>
        <Link to="/about">О нас</Link>
        <Link to="/contact">Контакты</Link>
       
      </nav>
    </header>
  );
}