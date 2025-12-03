import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { FaUser, FaEnvelope, FaPhone, FaLock, FaUserPlus } from "react-icons/fa";

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
        <div style={styles.container}>
            <div style={styles.form}>
                <div style={styles.logo}>
                    <h1 style={styles.logoText}>Граф Суворов</h1>
                    <p style={styles.logoSubtitle}>Регистрация нового аккаунта</p>
                </div>
                
                {error && (
                    <div style={styles.error}>
                        <div style={styles.errorIcon}>!</div>
                        <div style={styles.errorText}>{error}</div>
                    </div>
                )}
                
                {message && (
                    <div style={styles.success}>
                        <div style={styles.successIcon}>✓</div>
                        <div style={styles.successText}>{message}</div>
                    </div>
                )}
                
                <form onSubmit={handleSubmit} style={styles.formContent}>
                    <div style={styles.formRow}>
                        <div style={styles.formGroup}>
                            <label htmlFor="firstName" style={styles.label}>
                                <FaUser style={styles.labelIcon} />
                                Имя *
                            </label>
                            <input
                                type="text"
                                id="firstName"
                                name="firstName"
                                value={form.firstName}
                                onChange={handleChange}
                                required
                                placeholder="Иван"
                                style={{
                                    ...styles.input,
                                    ...(validationErrors.firstName ? styles.inputError : {})
                                }}
                            />
                            {validationErrors.firstName && (
                                <div style={styles.validationError}>{validationErrors.firstName}</div>
                            )}
                        </div>

                        <div style={styles.formGroup}>
                            <label htmlFor="lastName" style={styles.label}>
                                <FaUser style={styles.labelIcon} />
                                Фамилия *
                            </label>
                            <input
                                type="text"
                                id="lastName"
                                name="lastName"
                                value={form.lastName}
                                onChange={handleChange}
                                required
                                placeholder="Иванов"
                                style={{
                                    ...styles.input,
                                    ...(validationErrors.lastName ? styles.inputError : {})
                                }}
                            />
                            {validationErrors.lastName && (
                                <div style={styles.validationError}>{validationErrors.lastName}</div>
                            )}
                        </div>
                    </div>
                    
                    <div style={styles.formGroup}>
                        <label htmlFor="email" style={styles.label}>
                            <FaEnvelope style={styles.labelIcon} />
                            Email *
                        </label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            required
                            placeholder="example@mail.ru"
                            style={{
                                ...styles.input,
                                ...(validationErrors.email ? styles.inputError : {})
                            }}
                        />
                        {validationErrors.email && (
                            <div style={styles.validationError}>{validationErrors.email}</div>
                        )}
                    </div>

                    <div style={styles.formGroup}>
                        <label htmlFor="phoneNumber" style={styles.label}>
                            <FaPhone style={styles.labelIcon} />
                            Телефон *
                        </label>
                        <input
                            type="tel"
                            id="phoneNumber"
                            name="phoneNumber"
                            value={form.phoneNumber}
                            onChange={handleChange}
                            required
                            placeholder="+7 (999) 123-45-67"
                            style={{
                                ...styles.input,
                                ...(validationErrors.phoneNumber ? styles.inputError : {})
                            }}
                        />
                        {validationErrors.phoneNumber && (
                            <div style={styles.validationError}>{validationErrors.phoneNumber}</div>
                        )}
                    </div>
                    
                    <div style={styles.formGroup}>
                        <label htmlFor="password" style={styles.label}>
                            <FaLock style={styles.labelIcon} />
                            Пароль *
                        </label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={form.password}
                            onChange={handleChange}
                            required
                            placeholder="Минимум 6 символов"
                            style={{
                                ...styles.input,
                                ...(validationErrors.password ? styles.inputError : {})
                            }}
                        />
                        {validationErrors.password && (
                            <div style={styles.validationError}>{validationErrors.password}</div>
                        )}
                        <div style={styles.passwordHint}>
                            Пароль должен содержать минимум 6 символов
                        </div>
                    </div>

                    <div style={styles.formGroup}>
                        <label htmlFor="confirmPassword" style={styles.label}>
                            <FaLock style={styles.labelIcon} />
                            Подтвердите пароль *
                        </label>
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
                            placeholder="Повторите пароль"
                            style={{
                                ...styles.input,
                                ...(validationErrors.confirmPassword ? styles.inputError : {})
                            }}
                        />
                        {validationErrors.confirmPassword && (
                            <div style={styles.validationError}>{validationErrors.confirmPassword}</div>
                        )}
                    </div>
                    
                    <button 
                        type="submit" 
                        style={{
                            ...styles.button,
                            ...(loading ? styles.buttonDisabled : {})
                        }}
                        disabled={loading}
                    >
                        <FaUserPlus style={{ marginRight: '10px' }} />
                        {loading ? 'Регистрация...' : 'Зарегистрироваться'}
                    </button>
                </form>
                
                <div style={styles.links}>
                    <p style={styles.linkText}>
                        Уже есть аккаунт?{' '}
                        <Link to="/login" style={styles.link}>
                            Войти
                        </Link>
                    </p>
                    <p style={styles.linkText}>
                        <Link to="/" style={styles.link}>
                            ← Вернуться на главную
                        </Link>
                    </p>
                </div>
            </div>
            
            <div style={styles.footer}>
                <p style={styles.footerText}>
                    Регистрируясь, вы соглашаетесь с правилами использования сервиса
                </p>
            </div>
        </div>
    );
};

const styles = {
    container: {
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #8B4513 0%, #D2691E 100%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '20px',
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
    },
    form: {
        background: 'white',
        padding: '40px',
        borderRadius: '20px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        width: '100%',
        maxWidth: '500px',
        border: '2px solid #FFD700'
    },
    logo: {
        textAlign: 'center',
        marginBottom: '30px'
    },
    logoText: {
        color: '#8B4513',
        fontSize: '2.5rem',
        fontWeight: 'bold',
        margin: '0 0 10px 0'
    },
    logoSubtitle: {
        color: '#666',
        fontSize: '1rem',
        margin: 0
    },
    formContent: {
        marginBottom: '20px'
    },
    formRow: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '15px',
        marginBottom: '15px'
    },
    formGroup: {
        marginBottom: '20px'
    },
    label: {
        display: 'flex',
        alignItems: 'center',
        marginBottom: '8px',
        color: '#8B4513',
        fontWeight: '600',
        fontSize: '14px'
    },
    labelIcon: {
        marginRight: '8px',
        fontSize: '16px'
    },
    input: {
        width: '100%',
        padding: '14px 16px',
        border: '2px solid #FFE4B5',
        borderRadius: '10px',
        fontSize: '1rem',
        transition: 'all 0.3s ease',
        background: '#fff',
        color: '#333'
    },
    inputError: {
        borderColor: '#ff4444',
        background: '#fff8f8'
    },
    validationError: {
        color: '#ff4444',
        fontSize: '12px',
        marginTop: '5px'
    },
    passwordHint: {
        fontSize: '12px',
        color: '#666',
        marginTop: '5px',
        fontStyle: 'italic'
    },
    button: {
        width: '100%',
        background: 'linear-gradient(135deg, #8B4513, #D2691E)',
        color: 'white',
        border: 'none',
        padding: '16px',
        borderRadius: '10px',
        fontSize: '1.1rem',
        fontWeight: 'bold',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        marginTop: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    },
    buttonDisabled: {
        opacity: 0.7,
        cursor: 'not-allowed'
    },
    error: {
        background: 'linear-gradient(135deg, #ff4444, #cc0000)',
        color: 'white',
        padding: '15px',
        borderRadius: '10px',
        marginBottom: '25px',
        display: 'flex',
        alignItems: 'center',
        animation: 'slideIn 0.3s ease-out'
    },
    errorIcon: {
        background: 'white',
        color: '#ff4444',
        width: '24px',
        height: '24px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 'bold',
        marginRight: '12px',
        fontSize: '14px'
    },
    errorText: {
        flex: 1,
        fontWeight: '500'
    },
    success: {
        background: 'linear-gradient(135deg, #4CAF50, #2E7D32)',
        color: 'white',
        padding: '15px',
        borderRadius: '10px',
        marginBottom: '25px',
        display: 'flex',
        alignItems: 'center',
        animation: 'slideIn 0.3s ease-out'
    },
    successIcon: {
        background: 'white',
        color: '#4CAF50',
        width: '24px',
        height: '24px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 'bold',
        marginRight: '12px',
        fontSize: '14px'
    },
    successText: {
        flex: 1,
        fontWeight: '500'
    },
    links: {
        textAlign: 'center',
        marginTop: '20px',
        paddingTop: '20px',
        borderTop: '1px solid #eee'
    },
    linkText: {
        color: '#666',
        fontSize: '0.95rem',
        margin: '0 0 10px 0'
    },
    link: {
        color: '#8B4513',
        fontWeight: '600',
        textDecoration: 'none',
        transition: 'color 0.3s ease'
    },
    footer: {
        marginTop: '30px',
        textAlign: 'center',
        color: 'rgba(255, 255, 255, 0.8)',
        fontSize: '0.8rem',
        maxWidth: '500px',
        padding: '0 20px'
    },
    footerText: {
        margin: 0
    }
};

// Добавляем анимацию
if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateY(-10px);
                opacity: 0;
            }
            to {
                transform: translateY(0);
                opacity: 1;
            }
        }
        
        input:focus {
            outline: none;
            border-color: #8B4513;
            box-shadow: 0 0 0 3px rgba(139, 69, 19, 0.1);
        }
        
        .link:hover {
            color: #D2691E;
            text-decoration: underline;
        }
        
        .button:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(139, 69, 19, 0.3);
        }
    `;
    document.head.appendChild(style);
}

export default Register;