import "../styles/hero.css";
import React from "react";
import hero from "../img/hero.png";
import { useNavigate } from "react-router-dom";

export default function Hero() {
  const navigate = useNavigate();
  return (
    <section className="hero">
      <img className="hero-img" src={hero} alt="background" />
      <div className="hero-content">
        {/* <h1>Граф Суворов</h1> */}
      </div>
      <div className="hero-subtitle3">
        <p>
          География походов великого полководца на Вашем столе! В самом
          сердце Суздаля
        </p>
      </div>

      <div className="hero-subtitle2">
        <p>
          Отведайте легендарные медовые напитки XVII века, и блюда традиционной
          кухни.
        </p>
      </div>

      <div className="btn">
        <button className="btn-primary" onClick={() => navigate("/tasting")}>
          Забронировать дегустацию
        </button>
        <button className="btn-second" onClick={() => navigate("/menu")}>
          Смотреть меню
        </button>
      </div>
    </section>
  );
}
