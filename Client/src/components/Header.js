import { Link } from 'react-router-dom';
import logo from '../img/logo.png'
import '../styles/header.css'

export default function Header() {
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
