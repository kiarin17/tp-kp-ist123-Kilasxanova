import "../styles/services.css";
import { FaMedal, FaShoppingBag, FaCalendarAlt } from "react-icons/fa";

export default function Services() {
  return (
    <section className="services" id="services">
      <h2 className="services-title">Наши услуги</h2>
      <div className="services-underline"></div>

      <div className="services-cards">
        
        <div className="service-card">
          <div className="service-icon">
            <FaMedal />
          </div>
          <h3>Дегустация медов</h3>
          <p>
            Попробуйте коллекцию медовых напитков: от крепких хмельных медов до
            безалкогольных. Экскурсия с гидом в историю русского застолья.
          </p>
        </div>

        <div className="service-card">
          <div className="service-icon">
            <FaShoppingBag />
          </div>
          <h3>Магазин деликатесов</h3>
          <p>
            Приобретите лучшую медовуху, сбитни, пряники и другие различные угощения.
            Доступна доставка.
          </p>
        </div>

        <div className="service-card">
          <div className="service-icon">
            <FaCalendarAlt />
          </div>
          <h3>Бронирование столов</h3>
          <p>
            Забронируйте столик в нашем уютном зале. Идеально для семейных торжеств
            и атмосферных встреч в духе старой России.
          </p>
        </div>

      </div>
    </section>
  );
}
