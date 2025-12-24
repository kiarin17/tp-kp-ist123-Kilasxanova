import React, { useState } from 'react';
import '../styles/reservation.css';
import { 
  User, Phone, Mail, Users, Calendar, Clock, MessageSquare,
  CheckCircle, AlertTriangle, Wine, Coffee, Music, BookOpen,
  XCircle, MapPin, Info
} from 'lucide-react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5110/api';

const Reservation = () => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    reservationType: 'table',
    tastingType: 'alcoholic',
    guests: '2',
    date: '',
    time: '',
    specialRequests: '',
    additionalServices: []
  });

  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalType, setModalType] = useState('');
  const [timeSuggestions, setTimeSuggestions] = useState([]);
  const [errors, setErrors] = useState({});

  const reservationTypes = [
    { value: 'table', label: 'Бронирование стола' },
    { value: 'tasting', label: 'Дегустация' }
  ];

  const tastingTypes = [
    { value: 'alcoholic', label: 'Алкогольная' },
    { value: 'non-alcoholic', label: 'Безалкогольная' }
  ];

  const additionalServices = [
    { value: 'folk-duo', label: 'Выступление фольклорного дуэта', price: 3000 },
    { value: 'honey-story', label: 'Сказ о медовухе (мини-лекция)', price: 1500 }
  ];

  const guestsOptions = Array.from({ length: 20 }, (_, i) => ({
    value: (i + 1).toString(),
    label: `${i + 1} ${getGuestWord(i + 1)}`
  }));

  function getGuestWord(count) {
    const lastDigit = count % 10;
    const lastTwoDigits = count % 100;
    
    if (lastTwoDigits >= 11 && lastTwoDigits <= 19) return 'гостей';
    if (lastDigit === 1) return 'гость';
    if (lastDigit >= 2 && lastDigit <= 4) return 'гостя';
    return 'гостей';
  }

  const getMinDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 90);
    const year = maxDate.getFullYear();
    const month = String(maxDate.getMonth() + 1).padStart(2, '0');
    const day = String(maxDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Очищаем ошибки при изменении
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    if (name === 'date' || name === 'time') {
      setTimeSuggestions([]);
    }
  };

  const handleCheckboxChange = (serviceValue) => {
    setFormData(prev => {
      const currentServices = [...prev.additionalServices];
      const index = currentServices.indexOf(serviceValue);
      
      if (index === -1) {
        currentServices.push(serviceValue);
      } else {
        currentServices.splice(index, 1);
      }
      
      return {
        ...prev,
        additionalServices: currentServices
      };
    });
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Введите имя и отчество';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Введите телефон';
    } else if (!/^[\d\s()+-\s]+$/.test(formData.phone)) {
      newErrors.phone = 'Введите корректный номер телефона';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Введите корректный email';
    }

    if (!formData.date) {
      newErrors.date = 'Выберите дату';
    }

    if (!formData.time) {
      newErrors.time = 'Выберите время';
    } else if (formData.date) {
      const selectedDateTime = new Date(`${formData.date}T${formData.time}:00`);
      const now = new Date();
      const minDateTime = new Date(now.getTime() + 2 * 60 * 60 * 1000);
      
      if (selectedDateTime <= minDateTime) {
        newErrors.time = 'Бронирование должно быть минимум за 2 часа от текущего времени';
      }
      
      const hour = parseInt(formData.time.split(':')[0]);
      if (hour < 12 || hour > 23) {
        newErrors.time = 'Время работы ресторана: 12:00 - 23:00';
      }
    }

    if (!formData.guests || parseInt(formData.guests) < 1 || parseInt(formData.guests) > 20) {
      newErrors.guests = 'Выберите количество гостей (1-20)';
    }

    return newErrors;
  };

  const showPopup = (message, type = 'error') => {
    setModalMessage(message);
    setModalType(type);
    setShowModal(true);
  };

  // Упрощенная функция для форматирования даты
  const formatSuggestionDate = (suggestion) => {
    console.log('Форматируем предложение:', suggestion);
    
    try {
      // Если у предложения есть поле Message, используем его
      if (suggestion.Message) {
        return suggestion.Message;
      }
      
      // Если у предложения есть поле message, используем его
      if (suggestion.message) {
        return suggestion.message;
      }
      
      // Пробуем получить дату из разных полей
      let dateTimeString;
      
      if (suggestion.DateTime) {
        dateTimeString = suggestion.DateTime;
      } else if (suggestion.dateTime) {
        dateTimeString = suggestion.dateTime;
      } else if (suggestion.time) {
        dateTimeString = suggestion.time;
      } else if (suggestion.DisplayTime) {
        // Если это уже отформатированное время
        return suggestion.DisplayTime;
      } else {
        // Если ничего не подошло, возвращаем запасной вариант
        return 'Доступное время';
      }
      
      console.log('Дата/время строка:', dateTimeString);
      
      // Преобразуем строку в дату
      const date = new Date(dateTimeString);
      
      // Проверяем валидность
      if (isNaN(date.getTime())) {
        console.error('Некорректная дата:', dateTimeString);
        return 'Некорректная дата';
      }
      
      // Форматируем для отображения
      return date.toLocaleString('ru-RU', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
      
    } catch (error) {
      console.error('Ошибка форматирования даты:', error, suggestion);
      return 'Ошибка даты';
    }
  };

  // Упрощенная функция для обработки выбора предложения
  const handleTimeSuggestionSelect = (suggestion) => {
    console.log('Выбрано предложение:', suggestion);
    
    try {
      // Пытаемся получить дату из сообщения
      let dateString = '';
      let timeString = '';
      
      // Если есть Message, пытаемся извлечь время
      if (suggestion.Message) {
        const message = suggestion.Message;
        console.log('Анализируем сообщение:', message);
        
        // Пытаемся найти время в формате HH:mm
        const timeMatch = message.match(/(\d{1,2}):(\d{2})/);
        if (timeMatch) {
          const hours = timeMatch[1].padStart(2, '0');
          const minutes = timeMatch[2];
          timeString = `${hours}:${minutes}`;
          
          // Определяем дату на основе сообщения
          const today = new Date();
          let targetDate = new Date(today);
          
          if (message.includes('Завтра') || message.includes('завтра')) {
            targetDate.setDate(today.getDate() + 1);
          } else if (message.includes('Сегодня') || message.includes('сегодня')) {
            // Оставляем сегодняшнюю дату
          }
          
          dateString = targetDate.toISOString().split('T')[0];
        }
      }
      
      // Если не удалось извлечь из сообщения, пробуем другие поля
      if (!dateString && suggestion.DateTime) {
        const date = new Date(suggestion.DateTime);
        if (!isNaN(date.getTime())) {
          dateString = date.toISOString().split('T')[0];
          timeString = date.toTimeString().slice(0, 5);
        }
      }
      
      // Если все еще нет даты, используем текущую
      if (!dateString) {
        const today = new Date();
        dateString = today.toISOString().split('T')[0];
      }
      
      // Если нет времени, устанавливаем 14:00 по умолчанию
      if (!timeString) {
        timeString = '14:00';
      }
      
      console.log('Устанавливаем дату/время:', { dateString, timeString });
      
      setFormData(prev => ({
        ...prev,
        date: dateString,
        time: timeString
      }));
      
      setTimeSuggestions([]);
      setErrors(prev => ({ ...prev, time: '' }));
      
      // Прокручиваем к полю времени
      setTimeout(() => {
        const timeInput = document.getElementById('time');
        if (timeInput) {
          timeInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
      
    } catch (error) {
      console.error('Ошибка при выборе предложения:', error);
      showPopup('Ошибка при выборе времени', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    setLoading(true);
    setErrors({});
    setTimeSuggestions([]);

    try {
      // Формируем дату и время
      const datePart = formData.date;
      const timePart = formData.time;
      
      if (!datePart || !timePart) {
        throw new Error('Не указана дата или время');
      }

      // Создаем дату в локальном часовом поясе
      const localDateTime = new Date(`${datePart}T${timePart}:00`);
      
      // Преобразуем в ISO строку для сервера
      const isoDateTime = localDateTime.toISOString();

      const type = formData.reservationType === 'table' 
        ? 'Бронирование стола' 
        : `Дегустация: ${tastingTypes.find(t => t.value === formData.tastingType)?.label}`;

      let additionalServicesText = '';
      if (formData.reservationType === 'tasting' && formData.additionalServices.length > 0) {
        additionalServicesText = formData.additionalServices.map(s => {
          const service = additionalServices.find(as => as.value === s);
          return service ? service.label : s;
        }).join(', ');
      }

      let specialRequests = formData.specialRequests.trim();
      if (additionalServicesText) {
        specialRequests = specialRequests 
          ? `${specialRequests}\n\nДополнительные услуги: ${additionalServicesText}`
          : `Дополнительные услуги: ${additionalServicesText}`;
      }

      const reservationData = {
        type: type,
        reservationDateTime: isoDateTime,
        guestsCount: parseInt(formData.guests),
        customerName: formData.name.trim(),
        customerPhone: formData.phone.trim(),
        customerEmail: formData.email?.trim() || null,
        specialRequests: specialRequests || null,
        additionalServices: additionalServicesText || null
      };

      console.log('Отправляемые данные:', reservationData);

      const response = await axios.post(`${API_BASE_URL}/reservations`, reservationData, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      console.log('Ответ сервера:', response.data);

      if (response.data.success) {
        showPopup(response.data.message || 'Бронирование создано успешно! Мы свяжемся с вами для подтверждения.', 'success');
        
        // Сброс формы
        setFormData({
          name: '',
          phone: '',
          email: '',
          reservationType: 'table',
          tastingType: 'alcoholic',
          guests: '2',
          date: '',
          time: '',
          specialRequests: '',
          additionalServices: []
        });
      } else {
        showPopup(response.data.error || 'Произошла ошибка при бронировании', 'error');
      }
      
    } catch (error) {
      console.error('Ошибка запроса:', error);
      
      if (error.response?.data) {
        console.log('Данные ошибки:', error.response.data);
        
        if (error.response.data.suggestions) {
          console.log('Получены предложения:', error.response.data.suggestions);
          // Отладочная информация о структуре предложений
          if (error.response.data.suggestions.length > 0) {
            console.log('Первое предложение:', error.response.data.suggestions[0]);
            console.log('Ключи первого предложения:', Object.keys(error.response.data.suggestions[0]));
          }
          setTimeSuggestions(error.response.data.suggestions);
          showPopup(error.response.data.error || 'Выбранное время недоступно. Пожалуйста, выберите одно из предложенных времен.', 'error');
        } else {
          showPopup(error.response.data.error || 'Произошла ошибка при бронировании', 'error');
        }
      } else if (error.request) {
        showPopup('Не удалось подключиться к серверу. Проверьте подключение к интернету.', 'error');
      } else {
        showPopup('Произошла непредвиденная ошибка. Пожалуйста, попробуйте еще раз.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  // Модальное окно
  const Modal = () => {
    if (!showModal) return null;

    return (
      <div className="modal-overlay" onClick={() => setShowModal(false)}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className={`modal-icon ${modalType}`}>
            {modalType === 'success' ? (
              <CheckCircle size={48} />
            ) : (
              <AlertTriangle size={48} />
            )}
          </div>
          <h3 className="modal-title">
            {modalType === 'success' ? 'Успешно!' : 'Внимание!'}
          </h3>
          <p className="modal-message">{modalMessage}</p>
          <div className="modal-actions">
            <button 
              className="modal-button primary"
              onClick={() => setShowModal(false)}
            >
              ОК
            </button>
          </div>
          <button 
            className="modal-close"
            onClick={() => setShowModal(false)}
            aria-label="Закрыть"
          >
            <XCircle size={24} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="reservation-container">
      <div className="reservation-header">
        <h1 className="zabava-font">Форма бронирования стола или дегустации</h1>
        <div className="header-divider"></div>
      </div>

      <Modal />

      <div className="reservation-content">
        <div className="reservation-form-section">
          <form onSubmit={handleSubmit} className="reservation-form">
            
            {/* Тип бронирования */}
            <div className="form-field-row">
              <div className="form-field-header">
                <Wine className="field-icon" />
                <label className="zabava-font field-label">Тип бронирования</label>
              </div>
              <div className="radio-group">
                {reservationTypes.map((type) => (
                  <label key={type.value} className="radio-label">
                    <input
                      type="radio"
                      name="reservationType"
                      value={type.value}
                      checked={formData.reservationType === type.value}
                      onChange={handleChange}
                      className="radio-input"
                      disabled={loading}
                    />
                    <span className="radio-custom"></span>
                    <span className="radio-text">{type.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Тип дегустации */}
            {formData.reservationType === 'tasting' && (
              <div className="form-field-row">
                <div className="form-field-header">
                  <Coffee className="field-icon" />
                  <label className="zabava-font field-label">Тип дегустации</label>
                </div>
                <div className="radio-group tasting-type-group">
                  {tastingTypes.map((type) => (
                    <label key={type.value} className="radio-label tasting-radio">
                      <input
                        type="radio"
                        name="tastingType"
                        value={type.value}
                        checked={formData.tastingType === type.value}
                        onChange={handleChange}
                        className="radio-input"
                        disabled={loading}
                      />
                      <span className="radio-custom"></span>
                      <span className="radio-text">{type.label}</span>
                      {type.value === 'alcoholic' && <span className="age-warning">18+</span>}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Имя */}
            <div className="form-field-row">
              <div className="form-field-header">
                <User className="field-icon" />
                <label htmlFor="name" className="zabava-font field-label">Ваше имя и отчество</label>
              </div>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Иван Иванович"
                className={`form-input ${errors.name ? 'error' : ''}`}
                disabled={loading}
              />
              {errors.name && <span className="field-error">{errors.name}</span>}
            </div>

            {/* Телефон */}
            <div className="form-field-row">
              <div className="form-field-header">
                <Phone className="field-icon" />
                <label htmlFor="phone" className="zabava-font field-label">Телефон</label>
              </div>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+7 (999) 123-45-67"
                className={`form-input ${errors.phone ? 'error' : ''}`}
                disabled={loading}
              />
              {errors.phone && <span className="field-error">{errors.phone}</span>}
            </div>

            {/* Email и гости */}
            <div className="form-row-double">
              <div className="form-field-row half">
                <div className="form-field-header">
                  <Mail className="field-icon" />
                  <label htmlFor="email" className="zabava-font field-label">Почта</label>
                </div>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="example@mail.ru"
                  className={`form-input ${errors.email ? 'error' : ''}`}
                  disabled={loading}
                />
                {errors.email && <span className="field-error">{errors.email}</span>}
              </div>
              
              <div className="form-field-row half">
                <div className="form-field-header">
                  <Users className="field-icon" />
                  <label htmlFor="guests" className="zabava-font field-label">Количество гостей</label>
                </div>
                <select
                  id="guests"
                  name="guests"
                  value={formData.guests}
                  onChange={handleChange}
                  className={`form-input ${errors.guests ? 'error' : ''}`}
                  disabled={loading}
                >
                  <option value="">Выберите количество</option>
                  {guestsOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors.guests && <span className="field-error">{errors.guests}</span>}
              </div>
            </div>

            {/* Дата и время */}
            <div className="form-row-double">
              <div className="form-field-row half">
                <div className="form-field-header">
                  <Calendar className="field-icon" />
                  <label htmlFor="date" className="zabava-font field-label">Выбор даты</label>
                </div>
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  min={getMinDate()}
                  max={getMaxDate()}
                  className={`form-input ${errors.date ? 'error' : ''}`}
                  disabled={loading}
                />
                {errors.date && <span className="field-error">{errors.date}</span>}
              </div>
              
              <div className="form-field-row half">
                <div className="form-field-header">
                  <Clock className="field-icon" />
                  <label htmlFor="time" className="zabava-font field-label">Выбор времени</label>
                </div>
                <input
                  type="time"
                  id="time"
                  name="time"
                  value={formData.time}
                  onChange={handleChange}
                  min="12:00"
                  max="23:00"
                  className={`form-input ${errors.time ? 'error' : ''}`}
                  disabled={loading}
                />
                {errors.time ? (
                  <span className="field-error">{errors.time}</span>
                ) : (
                  formData.date && formData.time && (
                    <div className="time-hint">
                      <Info size={12} />
                      <span>Время работы: 12:00 - 23:00</span>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Предложения альтернативных дат */}
            {timeSuggestions.length > 0 && (
              <div className="suggestions-section">
                <div className="suggestions-header">
                  <AlertTriangle className="suggestions-icon" />
                  <h4>Предлагаем доступное время:</h4>
                </div>
                <div className="suggestions-list">
                  {timeSuggestions.map((suggestion, index) => {
                    const displayText = suggestion.Message || suggestion.message || 'Доступное время';
                    console.log(`Предложение ${index}:`, suggestion);
                    
                    return (
                      <div key={index} className="suggestion-item">
                        <div className="suggestion-info">
                          <CheckCircle className="available-icon" />
                          <div>
                            <div className="suggestion-time">
                              {displayText}
                            </div>
                          </div>
                        </div>
                        <button 
                          type="button"
                          onClick={() => handleTimeSuggestionSelect(suggestion)}
                          className="select-suggestion-btn"
                          disabled={loading}
                        >
                          Выбрать
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Дополнительные услуги */}
            {formData.reservationType === 'tasting' && (
              <div className="form-field-row">
                <div className="form-field-header">
                  <Music className="field-icon" />
                  <label className="zabava-font field-label">Дополнительные услуги</label>
                  <span className="optional-badge">по желанию</span>
                </div>
                <div className="services-checkbox-group">
                  {additionalServices.map((service) => (
                    <label key={service.value} className="service-checkbox-label">
                      <input
                        type="checkbox"
                        value={service.value}
                        checked={formData.additionalServices.includes(service.value)}
                        onChange={() => handleCheckboxChange(service.value)}
                        className="service-checkbox"
                        disabled={loading}
                      />
                      <span className="checkbox-custom"></span>
                      <div className="service-info">
                        <span className="service-name">{service.label}</span>
                        <span className="service-price">+ {service.price.toLocaleString()} ₽</span>
                      </div>
                      {service.value === 'folk-duo' && <Music className="service-icon" />}
                      {service.value === 'honey-story' && <BookOpen className="service-icon" />}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Дополнительные пожелания */}
            <div className="form-field-row">
              <div className="form-field-header">
                <MessageSquare className="field-icon" />
                <label htmlFor="specialRequests" className="zabava-font field-label">Дополнительные пожелания</label>
              </div>
              <textarea
                id="specialRequests"
                name="specialRequests"
                value={formData.specialRequests}
                onChange={handleChange}
                placeholder="Особые пожелания, аллергии, предложения..."
                rows="3"
                className="form-textarea"
                disabled={loading}
              />
            </div>

            {/* Информация */}
            <div className="booking-info">
              <Info size={16} />
              <span>Бронирование должно быть минимум за 2 часа от текущего времени.</span>
            </div>

            {/* Кнопка отправки */}
            <div className="form-button-row">
              <button 
                type="submit" 
                className="submit-btn"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="loading-spinner-small"></div>
                    <span className="btn-text">Отправка...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="btn-icon" />
                    <span className="btn-text">
                      {formData.reservationType === 'tasting' ? 'Забронировать дегустацию' : 'Забронировать стол'}
                    </span>
                  </>
                )}
              </button>
            </div>

          </form>
        </div>

        {/* Информационный блок */}
        <div className="reservation-info-section">
          {/* Контакты */}
          <div className="info-card contact-card">
            <h3 className="zabava-font">Наши контакты</h3>
            <div className="contact-details">
              <div className="contact-item">
                <Phone className="contact-icon" />
                <div className="contact-content">
                  <div className="contact-label">Телефон</div>
                  <div className="contact-value">+7 (49231) 2-34-56</div>
                </div>
              </div>
              <div className="contact-item">
                <Mail className="contact-icon" />
                <div className="contact-content">
                  <div className="contact-label">Email</div>
                  <div className="contact-value">info@grafsuvorov.ru</div>
                </div>
              </div>
              <div className="contact-item">
                <MapPin className="contact-icon" />
                <div className="contact-content">
                  <div className="contact-label">Адрес</div>
                  <div className="contact-value">г. Суворов, ул. Ресторанная, 1</div>
                </div>
              </div>
            </div>
          </div>

          {/* Правила */}
          <div className="info-card rules-card">
            <h3 className="zabava-font">Правила бронирования</h3>
            <ul className="rules-list">
              <li>Бронирование минимум за 2 часа</li>
              <li>Время работы: 12:00 - 23:00</li>
              <li>Максимальная группа: 20 человек</li>
              <li>Подтверждение брони в течение 30 минут</li>
              <li>Бесплатная отмена за 24 часа</li>
              <li>Дегустация только для групп от 2 человек</li>
              <li>Алкогольная дегустация: 18+</li>
            </ul>
          </div>

          {/* Важная информация */}
          <div className="info-card warning-card">
            <div className="warning-header">
              <AlertTriangle className="warning-icon" />
              <h3 className="zabava-font">Важно!</h3>
            </div>
            <div className="warning-text">
              <p>• Алкогольная дегустация только 18+</p>
              <p>• При бронировании более 10 человек - предоплата 30%</p>
              <p>• При отмене менее чем за 2 часа - штраф 50%</p>
              <p>• Для особых случаев звоните: +7 (999) 123-45-67</p>
              <p>• Дополнительные услуги доступны только при дегустации</p>
            </div>
          </div>

          {/* Время работы */}
          <div className="info-card hours-card">
            <h3 className="zabava-font">Время работы</h3>
            <div className="hours-list">
              <div className="hours-item">
                <span className="hours-day">Пн-Чт:</span>
                <span className="hours-time">12:00 - 23:00</span>
              </div>
              <div className="hours-item">
                <span className="hours-day">Пт-Сб:</span>
                <span className="hours-time">12:00 - 00:00</span>
              </div>
              <div className="hours-item">
                <span className="hours-day">Воскресенье:</span>
                <span className="hours-time">12:00 - 22:00</span>
              </div>
              <div className="hours-note">
                <Info size={14} />
                <span>Последний заказ за 30 минут до закрытия</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reservation;