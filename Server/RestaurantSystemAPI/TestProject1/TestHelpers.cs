using Microsoft.EntityFrameworkCore;
using RestaurantSystemAPI.Models.Entities;
using RestaurantSystemAPI.Data;

namespace TestProject1.Services
{
    public static class TestHelpers
    {
        public static ApplicationDbContext CreateTestDbContext(string dbName = null)
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: dbName ?? $"TestDB_{Guid.NewGuid()}")
                .Options;

            var context = new ApplicationDbContext(options);
            context.Database.EnsureDeleted();
            context.Database.EnsureCreated();

            return context;
        }

        public static void ClearDatabase(ApplicationDbContext context)
        {
            if (context.Users.Any()) context.Users.RemoveRange(context.Users);
            if (context.Orders.Any()) context.Orders.RemoveRange(context.Orders);
            if (context.MenuItems.Any()) context.MenuItems.RemoveRange(context.MenuItems);
            if (context.MenuCategories.Any()) context.MenuCategories.RemoveRange(context.MenuCategories);
            context.SaveChanges();
        }
    }
}