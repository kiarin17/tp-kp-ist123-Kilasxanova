using NUnit.Framework;
using RestaurantSystemAPI.Models.Entities;
using System.ComponentModel.DataAnnotations;
using System.Collections.Generic;

namespace TestProject1.Models
{
    [TestFixture]
    public class UserModelTests
    {
        [Test]
        public void User_ValidModel_PassesValidation()
        {
            // Arrange
            var user = new User
            {
                FirstName = "Иван",
                LastName = "Иванов",
                Email = "ivan@mail.ru",
                PasswordHash = "hashedpassword",
                Role = "Client",
                IsActive = true
            };

            var context = new ValidationContext(user);
            var results = new List<ValidationResult>();

            // Act
            var isValid = Validator.TryValidateObject(user, context, results, true);

            // Assert
            Assert.IsTrue(isValid);
            Assert.AreEqual(0, results.Count);
        }
    }
}