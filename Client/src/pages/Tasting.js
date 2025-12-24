import React, { useState } from 'react';
import '../styles/tasting.css';
import { 
  FaWineBottle, 
  FaClock, 
  FaLeaf, 
  FaMusic, 
  FaHistory, 
  FaGuitar, 
  FaTshirt, 
  FaCamera,
  FaCheck,
  FaHeart,
  FaStar,
  FaCrown
} from 'react-icons/fa';

const Tasting = () => {
  const [activeTab, setActiveTab] = useState('alcoholic');

  // Алкогольные медовухи
  const alcoholicMeads = [
    { id: 1, name: 'Суворовская Классика', description: 'Традиционная медовуха по старинному рецепту', abv: '7%', price: '350 ₽' },
    { id: 2, name: 'Боярский Мёд', description: 'Настоящий боярский напиток с дубовым послевкусием', abv: '8%', price: '400 ₽' },
    { id: 3, name: 'Хмельная Царица', description: 'С хмелем и пряными травами', abv: '6.5%', price: '380 ₽' },
    { id: 4, name: 'Медовый Витязь', description: 'Крепкая медовуха с медом из разнотравья', abv: '10%', price: '450 ₽' },
    { id: 5, name: 'Русь Великая', description: 'С добавлением ягод можжевельника', abv: '9%', price: '420 ₽' },
    { id: 6, name: 'Славянский Мед', description: 'С легкими цитрусовыми нотками', abv: '7.5%', price: '370 ₽' },
    { id: 7, name: 'Крем-Медовуха', description: 'Нежная с мягким сливочным послевкусием', abv: '6%', price: '390 ₽' },
    { id: 8, name: 'Дубовая Бочка', description: 'Выдержанная в дубовых бочках', abv: '11%', price: '500 ₽' },
    { id: 9, name: 'Малиновый Медок', description: 'С натуральным малиновым соком', abv: '7%', price: '410 ₽' },
    { id: 10, name: 'Имбирный Мед', description: 'С пряным имбирем и корицей', abv: '8.5%', price: '430 ₽' }
  ];

  // Безалкогольные медовухи
  const nonAlcoholicMeads = [
    { id: 1, name: 'Детский Медок', description: 'Легкий сладкий напиток для всей семьи', price: '250 ₽' },
    { id: 2, name: 'Ягодный Сбитень', description: 'Традиционный безалкогольный сбитень с ягодами', price: '280 ₽' },
    { id: 3, name: 'Медовый Квас', description: 'Освежающий квас на медовой основе', price: '270 ₽' },
    { id: 4, name: 'Лесные Дары', description: 'С дикими ягодами и травами', price: '300 ₽' },
    { id: 5, name: 'Яблочный Мед', description: 'С натуральным яблочным соком', price: '260 ₽' },
    { id: 6, name: 'Пряный Сбитень', description: 'С корицей, гвоздикой и имбирем', price: '290 ₽' },
    { id: 7, name: 'Облепиховый Мед', description: 'С витаминной облепихой', price: '310 ₽' },
    { id: 8, name: 'Мятная Свежесть', description: 'Освежающий напиток с мятой', price: '270 ₽' },
    { id: 9, name: 'Клюквенный Морс-Мед', description: 'Тонизирующий напиток с клюквой', price: '290 ₽' },
    { id: 10, name: 'Медовый Лимонад', description: 'Летний освежающий лимонад', price: '250 ₽' }
  ];

  // Тарифы дегустаций
  const tastingPackages = [
    {
      id: 1,
      name: 'Малая Дегустация',
      type: 'alcoholic',
      description: 'Для первого знакомства',
      includes: ['3 вида алкогольной медовухи', 'Закуски по-русски', 'Рассказ об истории напитка'],
      price: '1200 ₽',
      duration: '45 мин'
    },
    {
      id: 2,
      name: 'Большая Дегустация',
      type: 'alcoholic',
      description: 'Полное погружение в традиции',
      includes: ['7 видов алкогольной медовухи', 'Русские закуски', 'Исторический рассказ', 'Сувенирный бокал'],
      price: '2500 ₽',
      duration: '1.5 часа'
    },
    {
      id: 3,
      name: 'Семейная Дегустация',
      type: 'non-alcoholic',
      description: 'Для всей семьи',
      includes: ['5 видов безалкогольной медовухи', 'Традиционные сладости', 'Рассказ для детей', 'Мастер-класс'],
      price: '1800 ₽',
      duration: '1 час'
    },
    {
      id: 4,
      name: 'Императорский Пакет',
      type: 'both',
      description: 'VIP дегустация с фольклором',
      includes: ['Все 10 видов алкогольной', 'Все 10 видов безалкогольной', 'Живая народная музыка', 'Театрализованное представление', 'Роскошные закуски', 'Фотограф'],
      price: '7500 ₽',
      duration: '3 часа'
    }
  ];

  return (
    <div className="tasting-page">
      {/* Герой-секция */}
      <header className="tasting-hero">
        <div className="hero-content">
          <h1 className="hero-title">Дегустация Медовухи</h1>
          <p className="hero-subtitle">в кафе "Граф Суворов"</p>
          <div className="hero-divider">
            <div className="divider-line"></div>
            <div className="divider-icon">🍯</div>
            <div className="divider-line"></div>
          </div>
          <p className="hero-description">
            Погрузитесь в мир древних славянских традиций и насладитесь 
            настоящей медовухой, приготовленной по старинным рецептам
          </p>
        </div>
        <div className="hero-ornament"></div>
      </header>

      {/* О медовухе */}
      <section className="about-section">
        <div className="container">
          <h2 className="section-title">
            <span className="title-ornament-left"></span>
            О Нашей Медовухе
            <span className="title-ornament-right"></span>
          </h2>
          <div className="about-grid">
            <div className="about-card">
              <div className="about-icon">
                <FaHeart size={48} />
                <div className="icon-ornament"></div>
              </div>
              <h3>Натуральный Мед</h3>
              <p>Используем только натуральный мед от проверенных пасечников</p>
            </div>
            <div className="about-card">
              <div className="about-icon">
                <FaClock size={48} />
                <div className="icon-ornament"></div>
              </div>
              <h3>Вековые Традиции</h3>
              <p>Рецепты, проверенные веками и адаптированные для современного вкуса</p>
            </div>
            <div className="about-card">
              <div className="about-icon">
                <FaLeaf size={48} />
                <div className="icon-ornament"></div>
              </div>
              <h3>Природные Добавки</h3>
              <p>Только природные травы, ягоды и специи без искусственных добавок</p>
            </div>
          </div>
        </div>
      </section>

      {/* Список медовух */}
      <section className="meads-section">
        <div className="container">
          <h2 className="section-title">
            <span className="title-ornament-left"></span>
            Выбор Медовухи
            <span className="title-ornament-right"></span>
          </h2>
          <div className="tabs-container">
            <div className="tabs">
              <button 
                className={`tab-btn ${activeTab === 'alcoholic' ? 'active' : ''}`}
                onClick={() => setActiveTab('alcoholic')}
              >
                <FaWineBottle />
                <span>Алкогольная (10 видов)</span>
              </button>
              <button 
                className={`tab-btn ${activeTab === 'non-alcoholic' ? 'active' : ''}`}
                onClick={() => setActiveTab('non-alcoholic')}
              >
                <FaStar />
                <span>Безалкогольная (10 видов)</span>
              </button>
            </div>
          </div>

          <div className="meads-grid">
            {(activeTab === 'alcoholic' ? alcoholicMeads : nonAlcoholicMeads).map(mead => (
              <div key={mead.id} className="mead-card">
                <div className="mead-card-inner">
                  <div className="mead-header">
                    <h3>{mead.name}</h3>
                    {mead.abv && <span className="abv-badge">{mead.abv}</span>}
                  </div>
                  <p className="mead-description">{mead.description}</p>
                  <div className="mead-footer">
                    <div className="mead-price">{mead.price}</div>
                    <div className="mead-pattern"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Тарифы дегустаций */}
      <section className="packages-section">
        <div className="container">
          <h2 className="section-title">
            <span className="title-ornament-left"></span>
            Тарифы Дегустаций
            <span className="title-ornament-right"></span>
          </h2>
          <div className="packages-grid">
            {tastingPackages.map(pkg => (
              <div key={pkg.id} className="package-card">
                <div className="package-header">
                  <div className="package-icon">
                    {pkg.id === 4 ? <FaCrown size={32} /> : <FaStar size={32} />}
                  </div>
                  <h3>{pkg.name}</h3>
                  <span className="package-type">
                    {pkg.type === 'both' ? 'Алк.+Безалк.' : 
                     pkg.type === 'alcoholic' ? 'Алкогольная' : 'Безалкогольная'}
                  </span>
                </div>
                <div className="package-body">
                  <p className="package-description">{pkg.description}</p>
                  <ul className="package-features">
                    {pkg.includes.map((item, index) => (
                      <li key={index}>
                        <FaCheck />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="package-footer">
                    <div className="package-duration">
                      <FaClock />
                      <span>{pkg.duration}</span>
                    </div>
                    <div className="package-price">{pkg.price}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Фольклорная программа */}
      <section className="folklore-section">
        <div className="container">
          <div className="folklore-content">
            <div className="folklore-text">
              <h2 className="section-title">
                <span className="title-ornament-left"></span>
                Фольклорная Программа
                <span className="title-ornament-right"></span>
              </h2>
              <h3>Погружение в Русские Традиции</h3>
              <p>
                Наши дегустации сопровождаются аутентичными выступлениями фольклорного 
                ансамбля, рассказом об истории медовухи на Руси и театрализованными 
                представлениями в лучших традициях славянской культуры.
              </p>
              <div className="folklore-grid">
                <div className="folklore-item">
                  <FaMusic />
                  <span>Живые народные песни и пляски</span>
                </div>
                <div className="folklore-item">
                  <FaHistory />
                  <span>Рассказ об истории медового напитка</span>
                </div>
                <div className="folklore-item">
                  <FaGuitar />
                  <span>Игра на традиционных инструментах</span>
                </div>
                <div className="folklore-item">
                  <FaTshirt />
                  <span>Народные костюмы</span>
                </div>
                <div className="folklore-item">
                  <FaCamera />
                  <span>Фотосессия в русском стиле</span>
                </div>
              </div>
            </div>
            <div className="folklore-ornament"></div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Tasting;