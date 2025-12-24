// Services/JwtServiceTests.cs
using NUnit.Framework;
using RestaurantSystemAPI.Services;
using TestProject1.TestHelpers;

namespace TestProject1.Services
{
    [TestFixture]
    public class JwtServiceTests
    {
        [Test]
        public void GenerateToken_WithValidData_ReturnsToken()
        {
            // Arrange
            var fakeConfig = new FakeConfiguration();
            var jwtService = new JwtService(fakeConfig);

            int userId = 1;
            string email = "test@mail.ru";
            string role = "Admin";

            // Act
            var token = jwtService.GenerateToken(userId, email, role);

            // Assert
            Assert.IsNotNull(token);
            Assert.IsFalse(string.IsNullOrEmpty(token));
            Assert.IsTrue(token.Length > 10); // JWT токен должен быть достаточно длинным
        }

        [Test]
        public void GenerateToken_WithEmptyKey_ThrowsException()
        {
            // Arrange
            var fakeConfig = new FakeConfiguration(new Dictionary<string, string>
            {
                ["Jwt:Key"] = "", // Пустой ключ
                ["Jwt:Issuer"] = "Test",
                ["Jwt:Audience"] = "Test"
            });

            var jwtService = new JwtService(fakeConfig);
            int userId = 1;
            string email = "test@mail.ru";
            string role = "Admin";

            // Act & Assert
            Assert.Throws<ArgumentNullException>(() =>
                jwtService.GenerateToken(userId, email, role)
            );
        }

        [Test]
        public void ValidateToken_WithValidToken_ReturnsTrue()
        {
            // Arrange
            var fakeConfig = new FakeConfiguration();
            var jwtService = new JwtService(fakeConfig);

            var token = jwtService.GenerateToken(1, "test@mail.ru", "Admin");

            // Act
            var isValid = jwtService.ValidateToken(token);

            // Assert
            Assert.IsTrue(isValid);
        }

        [Test]
        public void ValidateToken_WithInvalidToken_ReturnsFalse()
        {
            // Arrange
            var fakeConfig = new FakeConfiguration();
            var jwtService = new JwtService(fakeConfig);

            string invalidToken = "invalid.token.string";

            // Act
            var isValid = jwtService.ValidateToken(invalidToken);

            // Assert
            Assert.IsFalse(isValid);
        }

        [Test]
        public void ValidateToken_WithEmptyToken_ReturnsFalse()
        {
            // Arrange
            var fakeConfig = new FakeConfiguration();
            var jwtService = new JwtService(fakeConfig);

            string emptyToken = "";

            // Act
            var isValid = jwtService.ValidateToken(emptyToken);

            // Assert
            Assert.IsFalse(isValid);
        }

        [Test]
        public void ValidateToken_WithNullToken_ReturnsFalse()
        {
            // Arrange
            var fakeConfig = new FakeConfiguration();
            var jwtService = new JwtService(fakeConfig);

            // Act
            var isValid = jwtService.ValidateToken(null);

            // Assert
            Assert.IsFalse(isValid);
        }
    }
}