import "../styles/hero.css";

export default function Hero() {
    return (
        <section className="hero">
            <div className="hero-content">
            <h1>ГРАФ СУВОРОВ</h1>
            <div className="hero-divider"></div>
            <h2 className="hero-subtitle">Традиционная русская медовая палата</h2>
            <div className="hero-divider"></div>
            <p className="hero-text">
                Погрузитесь в атмосферу старинной России в самом сердце Суздаля. 
                Отведайте легендарные медовые напитки по рецептам XVII века, русские \
                пряники и блюда традиционной кухни.
            </p>
        <div className="hero-buttons">
          <button className="btn btn-primary" href="">Забронировать дегустацию</button>
          <button className="btn btn-secondary">Посмотреть меню</button>
        </div>
        </div>

        </section>
    )
}