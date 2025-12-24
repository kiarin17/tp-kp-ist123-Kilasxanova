using NUnit.Framework;
using RestaurantSystemAPI.Models.Entities;

namespace RestaurantSystemAPI.Tests
{
    [TestFixture]
    public class VerySimpleTests
    {
        // ТЕСТ 1: Создание пользователя
        [Test]
        public void CreateUser_Success()
        {
            var user = new User
            {
                Email = "simple@test.com",
                FirstName = "Простой",
                LastName = "Тест"
            };

            Assert.IsNotNull(user, "Пользователь должен создаваться");
            Assert.AreEqual("simple@test.com", user.Email);
        }

        // ТЕСТ 2: Проверка email
        [Test]
        public void UserEmail_HasAtSymbol()
        {
            var user = new User { Email = "test@mail.com" };

            bool hasAtSymbol = user.Email.Contains("@");
            Assert.IsTrue(hasAtSymbol, "Email должен содержать @");
        }

        // ТЕСТ 3: Полное имя
        [Test]
        public void UserFullName_IsCorrect()
        {
            var user = new User
            {
                FirstName = "Анна",
                LastName = "Иванова"
            };

            string fullName = $"{user.FirstName} {user.LastName}";
            Assert.AreEqual("Анна Иванова", fullName);
        }

        // ТЕСТ 4: Пустой пользователь
        [Test]
        public void EmptyUser_HasNullFields()
        {
            var user = new User(); 

            Assert.IsNull(user.Email);
            Assert.IsNull(user.FirstName);
            Assert.IsNull(user.LastName);
        }

        // ТЕСТ 5: Смена email
        [Test]
        public void User_CanChangeEmail()
        {
            var user = new User { Email = "old@mail.com" };

            user.Email = "new@mail.com"; 

            Assert.AreEqual("new@mail.com", user.Email);
        }
    }
}