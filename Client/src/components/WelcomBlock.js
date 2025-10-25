import "../styles/welcom.css";
import { useNavigate } from "react-router-dom";

export default function WelcomBlock() {
  const navigate = useNavigate();
  return (
    <section className="hero-context">
      <div>
        <h2>
          Добро пожаловать в мир русских <br /> традиций
        </h2>
        <p className="text">
          Каждая чарка меда рассказывает свою историю. Откройте для себя вкус
          настоящей России в Графе Суворове.
        </p>
        <div className="hero-button">
          <button className="button" onClick={() => navigate("/contact")}>
            Связаться с нами
          </button>
        </div>
      </div>
    </section>
  );
}
