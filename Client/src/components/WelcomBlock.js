import "../styles/welcom.css";

export default function WelcomBlock(){
    return(
        <section className="hero-context">
               <div>
          <h2>
            Добро пожаловать в мир русских <br /> традиций
          </h2>
          <p className="text">
            Каждая чарка меда рассказывает свою историю. 
            Откройте для себя вкус настоящей России в Графе Суворове.
          </p>
        <div className="hero-button">
          <button className="button">Связаться с нами</button>
        </div>
        </div>
        </section>
    )
}