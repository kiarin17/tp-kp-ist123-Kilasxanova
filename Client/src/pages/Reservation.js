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
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [reservationInfo, setReservationInfo] = useState();
  const [showTimeSuggestions, setShowTimeSuggestions] = useState(false);

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(null);
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
    const errors = [];

    if (!formData.name.trim()) {
      errors.push('Введите имя и отчество');
    }

    if (!formData.phone.trim()) {
      errors.push('Введите телефон');
    } else if (!/^[\d\s()+-\s]+$/.test(formData.phone)) {
      errors.push('Введите корректный номер телефона');
    }

    if (!formData.date) {
      errors.push('Выберите дату');
    }

    if (!formData.time) {
      errors.push('Выберите время');
    } else {
      const selectedDateTime = new Date(`${formData.date}T${formData.time}`);
      const now = new Date();
      
      if (selectedDateTime <= now) {
        errors.push('Выберите дату и время в будущем');
      }

      const hour = selectedDateTime.getHours();
      if (hour < 12 || hour > 23) {
        errors.push('Время работы ресторана: 12:00 - 23:00');
      }
    }

    if (!formData.guests || parseInt(formData.guests) < 1 || parseInt(formData.guests) > 50) {
      errors.push('Выберите количество гостей (1-50)');
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setError({ 
        message: validationErrors[0],
        details: validationErrors.slice(1)
      });
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);
    setShowTimeSuggestions(false);

    // Формируем полную дату и время
    const reservationDateTime = new Date(`${formData.date}T${formData.time}:00`);
    
    // Формируем тип брони
    const type = formData.reservationType === 'table' 
      ? 'Бронирование стола' 
      : `Дегустация: ${tastingTypes.find(t => t.value === formData.tastingType)?.label}`;

    // Формируем дополнительные услуги
    let additionalServicesText = '';
    if (formData.reservationType === 'tasting' && formData.additionalServices.length > 0) {
      additionalServicesText = formData.additionalServices.map(s => {
        const service = additionalServices.find(as => as.value === s);
        return service ? service.label : s;
      }).join(', ');
    }

    // Формируем специальные запросы
    let specialRequests = formData.specialRequests.trim();
    if (additionalServicesText) {
      specialRequests = specialRequests 
        ? `${specialRequests}\n\nДополнительные услуги: ${additionalServicesText}`
        : `Дополнительные услуги: ${additionalServicesText}`;
    }

    // Подготавливаем данные для отправки
    const reservationData = {
      type: type,
      reservationDateTime: reservationDateTime.toISOString(),
      guestsCount: parseInt(formData.guests),
      customerName: formData.name.trim(),
      customerPhone: formData.phone.trim(),
      customerEmail: formData.email?.trim() || null,
      specialRequests: specialRequests || null,
      additionalServices: additionalServicesText || null
    };

    console.log('Отправляемые данные:', reservationData);

    try {
      const response = await axios.post(`${API_BASE_URL}/reservations`, reservationData, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10 секунд таймаут
      });

      console.log('Ответ сервера:', response.data);

      if (response.data.success) {
        setSuccess(true);
        setReservationInfo({
          id: response.data.reservationId,
          code: response.data.reservationCode,
          type: type,
          dateTime: reservationDateTime,
          guests: formData.guests,
          name: formData.name
        });
        
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
        setError({ 
          message: response.data.error || 'Произошла ошибка при бронировании'
        });
      }
      
    } catch (error) {
      console.error('Ошибка запроса:', error);
      
      let errorMessage = 'Произошла ошибка при бронировании. Пожалуйста, попробуйте еще раз.';
      let suggestions = null;
      
      if (error.response) {
        console.error('Данные ответа:', error.response.data);
        
        if (error.response.data?.error) {
          errorMessage = error.response.data.error;
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        }
        
        if (error.response.data?.suggestions) {
          suggestions = error.response.data.suggestions;
          setShowTimeSuggestions(true);
        }
        
        if (error.response.data?.details) {
          console.error('Детали ошибки:', error.response.data.details);
        }
      } else if (error.request) {
        errorMessage = 'Не удалось подключиться к серверу. Проверьте подключение к интернету.';
      } else {
        errorMessage = error.message;
      }
      
      setError({ 
        message: errorMessage,
        suggestions: suggestions
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (date) => {
    return date.toLocaleString('ru-RU', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleTimeSuggestionSelect = (suggestion) => {
    const date = new Date(suggestion.DateTime);
    setFormData(prev => ({
      ...prev,
      date: date.toISOString().split('T')[0],
      time: date.toTimeString().slice(0, 5)
    }));
    setShowTimeSuggestions(false);
    setError(null);
  };

  return (
    <div className="reservation-container">
      <div className="reservation-header">
        <h1 className="zabava-font">Форма бронирования стола или дегустации</h1>
        <div className="header-divider"></div>
      </div>

      {/* Сообщение об успехе */}
      {success && reservationInfo && (
        <div className="success-message">
          <CheckCircle className="success-icon" />
          <div className="success-content">
            <h3>Бронирование успешно создано!</h3>
            <p>Мы свяжемся с вами в течение 30 минут для подтверждения.</p>
            
            <div className="reservation-details">
              <div className="detail-item">
                <span className="detail-label">Номер брони:</span>
                <span className="detail-value">#{reservationInfo.id}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Код бронирования:</span>
                <span className="detail-value code">{reservationInfo.code}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Тип:</span>
                <span className="detail-value">{reservationInfo.type}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Дата и время:</span>
                <span className="detail-value">{formatDateTime(reservationInfo.dateTime)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Количество гостей:</span>
                <span className="detail-value">{reservationInfo.guests}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Имя:</span>
                <span className="detail-value">{reservationInfo.name}</span>
              </div>
            </div>
            
            <div className="success-note">
              <Info size={16} />
              <span>Пожалуйста, сохраните код бронирования. Он потребуется при обращении в ресторан.</span>
            </div>
          </div>
          <button 
            onClick={() => setSuccess(false)} 
            className="close-success"
            aria-label="Закрыть"
          >
            <XCircle />
          </button>
        </div>
      )}

      {/* Сообщение об ошибке */}
      {error && !showTimeSuggestions && (
        <div className="error-message">
          <AlertTriangle className="error-icon" />
          <div className="error-content">
            <h3>Ошибка бронирования</h3>
            <p>{error.message}</p>
            {error.details && error.details.length > 0 && (
              <ul className="error-details">
                {error.details.map((detail, index) => (
                  <li key={index}>{detail}</li>
                ))}
              </ul>
            )}
            {error.suggestions && (
              <button 
                onClick={() => setShowTimeSuggestions(true)}
                className="show-suggestions-btn"
              >
                Показать альтернативные варианты времени
              </button>
            )}
          </div>
          <button 
            onClick={() => setError(null)} 
            className="close-error"
            aria-label="Закрыть"
          >
            <XCircle />
          </button>
        </div>
      )}

      {/* Предложения по времени */}
      {showTimeSuggestions && error?.suggestions && (
        <div className="suggestions-overlay">
          <div className="suggestions-modal">
            <div className="suggestions-header">
              <AlertTriangle className="suggestions-icon" />
              <h3>Выбранное время недоступно</h3>
              <button 
                onClick={() => setShowTimeSuggestions(false)} 
                className="close-suggestions"
                aria-label="Закрыть"
              >
                <XCircle />
              </button>
            </div>
            
            <p className="suggestions-subtitle">Предлагаем альтернативные варианты:</p>
            
            <div className="suggestions-list">
              {error.suggestions.map((suggestion, index) => (
                <div key={index} className="suggestion-item">
                  <div className="suggestion-info">
                    <CheckCircle className="available-icon" />
                    <div>
                      <div className="suggestion-time">
                        {new Date(suggestion.DateTime).toLocaleString('ru-RU', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                      <div className="suggestion-message">{suggestion.Message}</div>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleTimeSuggestionSelect(suggestion)}
                    className="select-suggestion-btn"
                  >
                    Выбрать
                  </button>
                </div>
              ))}
            </div>
            
            <div className="suggestions-actions">
              <button 
                onClick={() => setShowTimeSuggestions(false)}
                className="cancel-suggestions"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}

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
                    />
                    <span className="radio-custom"></span>
                    <span className="radio-text">{type.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Тип дегустации (показывается только если выбрана дегустация) */}
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
                      />
                      <span className="radio-custom"></span>
                      <span className="radio-text">{type.label}</span>
                      {type.value === 'alcoholic' && <span className="age-warning">18+</span>}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Строка 1: Имя и отчество */}
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
                required
                placeholder="Иван Иванович"
                className="form-input"
                disabled={loading}
              />
            </div>

            {/* Строка 2: Телефон */}
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
                required
                placeholder="+7 (999) 123-45-67"
                className="form-input"
                disabled={loading}
              />
            </div>

            {/* Строка 3: Почта и количество гостей */}
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
                  className="form-input"
                  disabled={loading}
                />
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
                  required
                  className="form-input"
                  disabled={loading}
                >
                  <option value="">Выберите количество</option>
                  {guestsOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Строка 4: Дата и время */}
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
                  required
                  min={new Date().toISOString().split('T')[0]}
                  className="form-input"
                  disabled={loading}
                />
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
                  required
                  min="12:00"
                  max="23:00"
                  className="form-input"
                  disabled={loading}
                />
                {formData.date && formData.time && (
                  <div className="time-hint">
                    <Info size={12} />
                    <span>Время работы: 12:00 - 23:00</span>
                  </div>
                )}
              </div>
            </div>

            {/* Дополнительные услуги (только для дегустации) */}
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

            {/* Строка 5: Дополнительные пожелания */}
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

            {/* Строка 6: Кнопка */}
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

        {/* Блоки справа */}
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

          {/* Правила бронирования */}
          <div className="info-card rules-card">
            <h3 className="zabava-font">Правила бронирования</h3>
            <ul className="rules-list">
              <li>✓ Бронирование минимум за 2 часа</li>
              <li>✓ Время работы: 12:00 - 23:00</li>
              <li>✓ Максимальная группа: 20 человек</li>
              <li>✓ Подтверждение брони в течение 30 минут</li>
              <li>✓ Бесплатная отмена за 24 часа</li>
              <li>✓ Дегустация только для групп от 2 человек</li>
              <li>✓ Алкогольная дегустация: 18+</li>
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