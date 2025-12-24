// Controllers/AuthControllerWorkingTests.cs
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NUnit.Framework;
using RestaurantSystemAPI.Controllers;
using RestaurantSystemAPI.Models.Entities;
using RestaurantSystemAPI.Models.DTOs;
using RestaurantSystemAPI.Data;
using System.Threading.Tasks;
using System;
using Microsoft.Extensions.Configuration;

namespace TestProject1.Controllers
{
    [TestFixture]
    public class AuthControllerWorkingTests
    {
        private ApplicationDbContext _context;

        [SetUp]
        public void Setup()
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: $"TestDB_{Guid.NewGuid()}")
                .Options;

            _context = new ApplicationDbContext(options);
            _context.Database.EnsureDeleted();
            _context.Database.EnsureCreated();
        }

        [TearDown]
        public void TearDown()
        {
            _context?.Dispose();
        }

        // Вспомогательный класс для тестирования
        public class TestJwtService : RestaurantSystemAPI.Services.JwtService
        {
            public TestJwtService()
                : base(CreateTestConfiguration())
            {
            }

            private static Microsoft.Extensions.Configuration.IConfiguration CreateTestConfiguration()
            {
                // Простая конфигурация для тестов
                var configData = new System.Collections.Generic.Dictionary<string, string>
                {
                    ["Jwt:Key"] = "TestKey123456789012345678901234567890",
                    ["Jwt:Issuer"] = "TestIssuer",
                    ["Jwt:Audience"] = "TestAudience"
                };

                return new Microsoft.Extensions.Configuration.ConfigurationBuilder()
                    .AddInMemoryCollection(configData)
                    .Build();
            }
        }

        [Test]
        public async Task Test1_UserCanLoginWithCorrectPassword()
        {
            // Arrange
            var jwtService = new TestJwtService();
            var controller = new AuthController(_context, jwtService);

            var user = new User
            {
                Email = "login@mail.ru",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("123456"),
                FirstName = "Login",
                LastName = "Test",
                Role = "Client",
                IsActive = true
            };

            await _context.Users.AddAsync(user);
            await _context.SaveChangesAsync();

            var request = new LoginRequest
            {
                Email = "login@mail.ru",
                Password = "123456"
            };

            // Act
            var result = await controller.Login(request);

            // Assert
            Assert.That(result, Is.InstanceOf<OkObjectResult>());
        }

        [Test]
        public async Task Test2_UserCannotLoginWithWrongPassword()
        {
            // Arrange
            var jwtService = new TestJwtService();
            var controller = new AuthController(_context, jwtService);

            var user = new User
            {
                Email = "wrongpass@mail.ru",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("correct123"),
                FirstName = "Wrong",
                LastName = "Password",
                Role = "Client",
                IsActive = true
            };

            await _context.Users.AddAsync(user);
            await _context.SaveChangesAsync();

            var request = new LoginRequest
            {
                Email = "wrongpass@mail.ru",
                Password = "wrong456"
            };

            // Act
            var result = await controller.Login(request);

            // Assert
            // Проверяем, что это любой тип ошибки (Unauthorized или BadRequest)
            Assert.That(result, Is.Not.InstanceOf<OkObjectResult>());
        }

        [Test]
        public async Task Test3_CanRegisterNewUser()
        {
            // Arrange
            var jwtService = new TestJwtService();
            var controller = new AuthController(_context, jwtService);

            var request = new RegisterRequest
            {
                FirstName = "Register",
                LastName = "New",
                Email = "registernew@mail.ru",
                PhoneNumber = "+79990000000",
                Password = "password123"
            };

            // Act
            var result = await controller.Register(request);

            // Assert
            Assert.That(result, Is.InstanceOf<OkObjectResult>());
        }

        [Test]
        public async Task Test4_RegisterCreatesUserInDatabase()
        {
            // Arrange
            var jwtService = new TestJwtService();
            var controller = new AuthController(_context, jwtService);

            var request = new RegisterRequest
            {
                FirstName = "Db",
                LastName = "Test",
                Email = "dbtest@mail.ru",
                PhoneNumber = "+79991111111",
                Password = "testpass"
            };

            // Act
            await controller.Register(request);

            // Assert
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Email == "dbtest@mail.ru");

            Assert.IsNotNull(user);
            Assert.AreEqual("Db", user.FirstName);
        }

        [Test]
        public async Task Test5_RegisterHashesPassword()
        {
            // Arrange
            var jwtService = new TestJwtService();
            var controller = new AuthController(_context, jwtService);

            var password = "SecurePass123";
            var request = new RegisterRequest
            {
                FirstName = "Hash",
                LastName = "Test",
                Email = "hashtest@mail.ru",
                PhoneNumber = "+79992222222",
                Password = password
            };

            // Act
            await controller.Register(request);

            // Assert
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Email == "hashtest@mail.ru");

            Assert.IsTrue(BCrypt.Net.BCrypt.Verify(password, user.PasswordHash));
        }

        [Test]
        public async Task Test6_CannotRegisterWithExistingEmail()
        {
            // Arrange
            var jwtService = new TestJwtService();
            var controller = new AuthController(_context, jwtService);

            // Создаем первого пользователя
            var existingUser = new User
            {
                Email = "existing@mail.ru",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("123456"),
                FirstName = "Existing",
                LastName = "User"
            };

            await _context.Users.AddAsync(existingUser);
            await _context.SaveChangesAsync();

            // Пытаемся зарегистрировать второго с тем же email
            var request = new RegisterRequest
            {
                FirstName = "Duplicate",
                LastName = "User",
                Email = "existing@mail.ru", // Тот же email
                PhoneNumber = "+79993333333",
                Password = "654321"
            };

            // Act
            var result = await controller.Register(request);

            // Assert - должен вернуть ошибку
            Assert.That(result, Is.Not.InstanceOf<OkObjectResult>());
        }

        [Test]
        public async Task Test7_InactiveUserCannotLogin()
        {
            // Arrange
            var jwtService = new TestJwtService();
            var controller = new AuthController(_context, jwtService);

            var user = new User
            {
                Email = "inactive@mail.ru",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("123456"),
                FirstName = "Inactive",
                LastName = "User",
                IsActive = false // Неактивный!
            };

            await _context.Users.AddAsync(user);
            await _context.SaveChangesAsync();

            var request = new LoginRequest
            {
                Email = "inactive@mail.ru",
                Password = "123456"
            };

            // Act
            var result = await controller.Login(request);

            // Assert
            Assert.That(result, Is.Not.InstanceOf<OkObjectResult>());
        }

        [Test]
        public async Task Test8_NonexistentUserCannotLogin()
        {
            // Arrange
            var jwtService = new TestJwtService();
            var controller = new AuthController(_context, jwtService);

            var request = new LoginRequest
            {
                Email = "ghost@mail.ru", // Не существует
                Password = "anypassword"
            };

            // Act
            var result = await controller.Login(request);

            // Assert
            Assert.That(result, Is.Not.InstanceOf<OkObjectResult>());
        }
    }
}