using Microsoft.EntityFrameworkCore;
using NUnit.Framework;
using RestaurantSystemAPI.Models.Entities;
using RestaurantSystemAPI.Data;
using System.Linq;

namespace TestProject1.Services
{
    [TestFixture]
    public class DatabaseIntegrationTests
    {
        private ApplicationDbContext _context;

        [SetUp]
        public void Setup()
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: $"IntegrationTestDB_{Guid.NewGuid()}")
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

        [Test]
        public void Database_CanCreateUser()
        {
            // Arrange
            var user = new User
            {
                FirstName = "Test",
                LastName = "User",
                Email = "test@mail.ru",
                PasswordHash = "123456"
            };

            // Act
            _context.Users.Add(user);
            _context.SaveChanges();

            // Assert
            var savedUser = _context.Users.FirstOrDefault(u => u.Email == "test@mail.ru");
            Assert.IsNotNull(savedUser);
            Assert.AreEqual("Test", savedUser.FirstName);
        }
    }
}