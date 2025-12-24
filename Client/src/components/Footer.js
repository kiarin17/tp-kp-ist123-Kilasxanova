import React from "react";
import { Link } from "react-router-dom";
import logo from "../img/logo.png";
import "../styles/footer.css";

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-top">
        <div className="footer-section">
          <div className="footer-logo">
            <img src={logo} alt="Логотип" className="logo" />
          </div>
          <h3 className="footer-brand">ГРАФ СУВОРОВ</h3>
          <p className="footer-desc">
            Традиционная русская медовая палата <br /> в сердце Суздаля
          </p>
        </div>

        <div className="footer-section">
          <h4>Быстрые ссылки</h4>
          <ul>
            <li>
              <Link to="/">Главная</Link>
            </li>
            <li>
              <Link to="/menu">Меню</Link>
            </li>
            <li>
              <Link to="/tasting">Дегустация</Link>
            </li>
            <li>
              <Link to="/shop">Магазин</Link>
            </li>
          </ul>
        </div>

        <div className="footer-section">
          <h4>Контакты</h4>
          <ul>
            <li>📍 г. Суздаль, ул. Ленина, д. 63А</li>
            <li>📞 +7 (492) 312-08-03</li>
            <li>✉ info@grafsuvorov.ru</li>
          </ul>
        </div>

        <div className="footer-section">
          <h4>Время работы</h4>
          <ul>
            <li>Пн–Пт: 10:00 – 19:00</li>
            <li>Сб–Вс: 10:00 – 20:00</li>
            <li>Праздники: 10:00 – 20:00</li>
          </ul>
        </div>
      </div>

      <div className="footer-divider"></div>

      <div className="footer-divider"></div>

      {/* Нижняя строка */}
      <div className="footer-bottom">
        © 2025 Граф Суворов. Все права защищены.
        <br />
        Сделано с ❤️ для возрождения русских традиций
      </div>
    </footer>
  );
};

export default Footer;
