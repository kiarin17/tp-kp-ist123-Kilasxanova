import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { FaUser, FaEnvelope, FaPhone, FaLock, FaUserPlus, FaArrowLeft } from "react-icons/fa";
import "../styles/register.css";

const Register = () => {
    const [form, setForm] = useState({ 
        firstName: "", 
        lastName: "", 
        email: "", 
        password: "",
        phoneNumber: ""
    });
    const [confirmPassword, setConfirmPassword] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [validationErrors, setValidationErrors] = useState({});
    const navigate = useNavigate();

    const validateForm = () => {
        const errors = {};
        
        if (!form.firstName.trim()) errors.firstName = "Имя обязательно";
        if (!form.lastName.trim()) errors.lastName = "Фамилия обязательна";
        
        if (!form.email.trim()) {
            errors.email = "Email обязателен";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
            errors.email = "Введите корректный email";
        }
        
        if (!form.phoneNumber.trim()) {
            errors.phoneNumber = "Телефон обязателен";
        } else if (!/^(\+7|8)[\s\-]?\(?\d{3}\)?[\s\-]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2}$/.test(form.phoneNumber.replace(/\s/g, ''))) {
            errors.phoneNumber = "Введите корректный телефон";
        }
        
        if (!form.password) {
            errors.password = "Пароль обязателен";
        } else if (form.password.length < 6) {
            errors.password = "Пароль должен содержать минимум 6 символов";
        }
        
        if (!confirmPassword) {
            errors.confirmPassword = "Подтвердите пароль";
        } else if (form.password !== confirmPassword) {
            errors.confirmPassword = "Пароли не совпадают";
        }
        
        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const formatPhoneNumber = (value) => {
        const numbers = value.replace(/\D/g, '');
        if (numbers.length === 0) return '';
        
        let formatted = '+7';
        if (numbers.length > 1) {
            formatted += ` (${numbers.substring(1, 4)}`;
        }
        if (numbers.length >= 5) {
            formatted += `) ${numbers.substring(4, 7)}`;
        }
        if (numbers.length >= 8) {
            formatted += `-${numbers.substring(7, 9)}`;
        }
        if (numbers.length >= 10) {
            formatted += `-${numbers.substring(9, 11)}`;
        }
        return formatted;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        
        if (name === 'phoneNumber') {
            setForm(prev => ({ ...prev, [name]: formatPhoneNumber(value) }));
        } else {
            setForm(prev => ({ ...prev, [name]: value }));
        }
        
        // Очищаем ошибки при вводе
        if (validationErrors[name]) {
            setValidationErrors(prev => ({ ...prev, [name]: '' }));
        }
        setError("");
        setMessage("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        setLoading(true);
        setError("");
        setMessage("");

        try {
            console.log('Отправка запроса на регистрацию...', form);
            
            const response = await axios.post('http://localhost:5110/api/auth/register', form);
            
            console.log('Регистрация успешна:', response.data);
            
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
            
            setMessage('Регистрация успешна! Перенаправляем в личный кабинет...');
            
            // Автоматический вход после регистрации
            setTimeout(() => {
                console.log('Перенаправляем в клиентскую панель');
                navigate('/client');
            }, 1500);
            
        } catch (err) {
            console.error('Ошибка регистрации:', err);
            
            if (err.response?.status === 400) {
                setError(err.response.data?.message || 'Неверные данные');
            } else if (err.response?.status === 409) {
                setError('Пользователь с таким email уже существует');
            } else if (err.response?.data?.errors) {
                const errors = err.response.data.errors;
                const errorMessages = Object.values(errors).flat();
                setError(errorMessages.join(', '));
            } else if (err.response?.data?.message) {
                setError(err.response.data.message);
            } else if (err.message === 'Network Error') {
                setError('Ошибка сети. Проверьте подключение к серверу');
            } else {
                setError('Ошибка сервера. Попробуйте позже');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="register-container">
            <div className="register-decoration">
                <div className="decoration-ornament ornament-1"></div>
                <div className="decoration-ornament ornament-2"></div>
                <div className="decoration-ornament ornament-3"></div>
            </div>
            
            <div className="register-content">
                <div className="register-header">
                    <div className="register-logo">
                        <div className="logo-icon"></div>
                        <h1 className="logo-title">Граф Суворов</h1>
                    </div>
                    <p className="register-subtitle">Регистрация нового аккаунта</p>
                    <div className="header-divider">
                        <div className="divider-line"></div>
                        <div className="divider-icon">✧</div>
                        <div className="divider-line"></div>
                    </div>
                </div>
                
                <div className="register-form-wrapper">
                    {error && (
                        <div className="register-error">
                            <div className="error-icon">!</div>
                            <div className="error-text">{error}</div>
                        </div>
                    )}
                    
                    {message && (
                        <div className="register-success">
                            <div className="success-icon">✓</div>
                            <div className="success-text">{message}</div>
                        </div>
                    )}
                    
                    <form onSubmit={handleSubmit} className="register-form">
                        <div className="form-row">
                            <div className="form-group">
                                <div className="input-wrapper">
                                    <FaUser className="input-icon" />
                                    <input
                                        type="text"
                                        id="firstName"
                                        name="firstName"
                                        value={form.firstName}
                                        onChange={handleChange}
                                        required
                                        placeholder=" "
                                        className={`form-input ${validationErrors.firstName ? 'input-error' : ''}`}
                                    />
                                    <label htmlFor="firstName" className="floating-label">Имя *</label>
                                </div>
                                {validationErrors.firstName && (
                                    <div className="validation-error">{validationErrors.firstName}</div>
                                )}
                            </div>

                            <div className="form-group">
                                <div className="input-wrapper">
                                    <FaUser className="input-icon" />
                                    <input
                                        type="text"
                                        id="lastName"
                                        name="lastName"
                                        value={form.lastName}
                                        onChange={handleChange}
                                        required
                                        placeholder=" "
                                        className={`form-input ${validationErrors.lastName ? 'input-error' : ''}`}
                                    />
                                    <label htmlFor="lastName" className="floating-label">Фамилия *</label>
                                </div>
                                {validationErrors.lastName && (
                                    <div className="validation-error">{validationErrors.lastName}</div>
                                )}
                            </div>
                        </div>
                        
                        <div className="form-group">
                            <div className="input-wrapper">
                                <FaEnvelope className="input-icon" />
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={form.email}
                                    onChange={handleChange}
                                    required
                                    placeholder=" "
                                    className={`form-input ${validationErrors.email ? 'input-error' : ''}`}
                                />
                                <label htmlFor="email" className="floating-label">Email *</label>
                            </div>
                            {validationErrors.email && (
                                <div className="validation-error">{validationErrors.email}</div>
                            )}
                        </div>

                        <div className="form-group">
                            <div className="input-wrapper">
                                <FaPhone className="input-icon" />
                                <input
                                    type="tel"
                                    id="phoneNumber"
                                    name="phoneNumber"
                                    value={form.phoneNumber}
                                    onChange={handleChange}
                                    required
                                    placeholder=" "
                                    className={`form-input ${validationErrors.phoneNumber ? 'input-error' : ''}`}
                                />
                                <label htmlFor="phoneNumber" className="floating-label">Телефон *</label>
                            </div>
                            {validationErrors.phoneNumber && (
                                <div className="validation-error">{validationErrors.phoneNumber}</div>
                            )}
                        </div>
                        
                        <div className="form-group">
                            <div className="input-wrapper">
                                <FaLock className="input-icon" />
                                <input
                                    type="password"
                                    id="password"
                                    name="password"
                                    value={form.password}
                                    onChange={handleChange}
                                    required
                                    placeholder=" "
                                    className={`form-input ${validationErrors.password ? 'input-error' : ''}`}
                                />
                                <label htmlFor="password" className="floating-label">Пароль *</label>
                            </div>
                            {validationErrors.password && (
                                <div className="validation-error">{validationErrors.password}</div>
                            )}
                            <div className="password-hint">
                                Пароль должен содержать минимум 6 символов
                            </div>
                        </div>

                        <div className="form-group">
                            <div className="input-wrapper">
                                <FaLock className="input-icon" />
                                <input
                                    type="password"
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    value={confirmPassword}
                                    onChange={(e) => {
                                        setConfirmPassword(e.target.value);
                                        if (validationErrors.confirmPassword) {
                                            setValidationErrors(prev => ({ ...prev, confirmPassword: '' }));
                                        }
                                    }}
                                    required
                                    placeholder=" "
                                    className={`form-input ${validationErrors.confirmPassword ? 'input-error' : ''}`}
                                />
                                <label htmlFor="confirmPassword" className="floating-label">Подтвердите пароль *</label>
                            </div>
                            {validationErrors.confirmPassword && (
                                <div className="validation-error">{validationErrors.confirmPassword}</div>
                            )}
                        </div>
                        
                        <button 
                            type="submit" 
                            className={`register-button ${loading ? 'loading' : ''}`}
                            disabled={loading}
                        >
                          
                            {loading ? (
                                <>
                                    <div className="spinner"></div>
                                    <span>Регистрация...</span>
                                </>
                            ) : 'Зарегистрироваться'}
                        </button>
                    </form>
                </div>
                
                <div className="register-links">
                    <Link to="/login" className="login-link">
                        <span>Уже есть аккаунт? Войти</span>
                        <span className="link-arrow">→</span>
                    </Link>
                    <Link to="/" className="back-link">
                        <FaArrowLeft />
                        <span>Вернуться на главную</span>
                    </Link>
                </div>
                
                <div className="register-footer">
                    <p className="footer-text">
                        Регистрируясь, вы соглашаетесь с правилами использования сервиса
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;