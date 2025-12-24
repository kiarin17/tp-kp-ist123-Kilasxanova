using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RestaurantSystemAPI.Data;
using RestaurantSystemAPI.Models.Entities;
using Microsoft.AspNetCore.Authorization;
using System.ComponentModel.DataAnnotations;

namespace RestaurantSystemAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ReservationsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ReservationsController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetReservations([FromQuery] string? status = null, [FromQuery] string? date = null)
        {
            try
            {
                var query = _context.Reservations
                    .Include(r => r.User)
                    .OrderByDescending(r => r.ReservationDateTime)
                    .AsQueryable();

                if (!string.IsNullOrEmpty(status) && status != "all")
                {
                    query = query.Where(r => r.Status == status);
                }

                if (!string.IsNullOrEmpty(date))
                {
                    if (date == "today")
                    {
                        var today = DateTime.Today;
                        query = query.Where(r => r.ReservationDateTime.Date == today);
                    }
                    else if (date == "upcoming")
                    {
                        query = query.Where(r => r.ReservationDateTime >= DateTime.Now);
                    }
                    else if (date == "past")
                    {
                        query = query.Where(r => r.ReservationDateTime < DateTime.Now);
                    }
                }

                var reservations = await query.Select(r => new
                {
                    r.Id,
                    r.Type,
                    r.ReservationDateTime,
                    r.GuestsCount,
                    r.Status,
                    r.SpecialRequests,
                    r.CustomerName,
                    r.CustomerPhone,
                    r.CustomerEmail,
                    r.CreatedAt,
                    r.UpdatedAt,
                    UserId = r.UserId,
                    UserName = r.User != null ? $"{r.User.FirstName} {r.User.LastName}" : null
                }).ToListAsync();

                return Ok(reservations);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }


        [HttpGet("user")]
        [Authorize]
        public async Task<IActionResult> GetUserReservations()
        {
            try
            {
                var userId = int.Parse(User.FindFirst("userId")?.Value ?? "0");

                var reservations = await _context.Reservations
                    .Where(r => r.UserId == userId)
                    .OrderByDescending(r => r.ReservationDateTime)
                    .Select(r => new
                    {
                        r.Id,
                        r.Type,
                        r.ReservationDateTime,
                        r.GuestsCount,
                        r.Status,
                        r.SpecialRequests,
                        r.CustomerName,
                        r.CustomerPhone,
                        r.CustomerEmail,
                        r.CreatedAt
                    })
                    .ToListAsync();

                return Ok(reservations);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }


        [HttpGet("{id}")]
        [Authorize]
        public async Task<IActionResult> GetReservation(int id)
        {
            try
            {
                var userId = int.Parse(User.FindFirst("userId")?.Value ?? "0");
                var isAdmin = User.IsInRole("Admin");

                var reservation = await _context.Reservations
                    .Where(r => r.Id == id && (isAdmin || r.UserId == userId))
                    .Select(r => new
                    {
                        r.Id,
                        r.Type,
                        r.ReservationDateTime,
                        r.GuestsCount,
                        r.Status,
                        r.SpecialRequests,
                        r.CustomerName,
                        r.CustomerPhone,
                        r.CustomerEmail,
                        r.CreatedAt,
                        r.UpdatedAt,
                        UserId = r.UserId
                    })
                    .FirstOrDefaultAsync();

                if (reservation == null)
                {
                    return NotFound(new { message = "Бронь не найдена" });
                }

                return Ok(reservation);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }


        [HttpPost]
        public async Task<IActionResult> CreateReservation([FromBody] CreateReservationRequest request)
        {
            try
            {
                Console.WriteLine($"Получен запрос на бронирование: {System.Text.Json.JsonSerializer.Serialize(request)}");


                if (string.IsNullOrWhiteSpace(request.CustomerName))
                    return BadRequest(new { error = "Имя обязательно" });

                if (string.IsNullOrWhiteSpace(request.CustomerPhone))
                    return BadRequest(new { error = "Телефон обязателен" });

                if (request.GuestsCount < 1 || request.GuestsCount > 50)
                    return BadRequest(new { error = "Количество гостей должно быть от 1 до 50" });

               
                DateTime localDateTime;
                try
                {
                   
                    if (request.ReservationDateTime.Kind == DateTimeKind.Unspecified)
                    {
                        localDateTime = DateTime.SpecifyKind(request.ReservationDateTime, DateTimeKind.Local);
                    }
                    else
                    {
                        localDateTime = request.ReservationDateTime.ToLocalTime();
                    }
                }
                catch
                {
                    return BadRequest(new { error = "Некорректный формат даты и времени" });
                }

                // Проверяем что бронирование минимум за 2 часа вперед
                var minBookingTime = DateTime.Now.AddHours(2);
                if (localDateTime <= minBookingTime)
                {
                    var suggestions = await GetAvailableTimeSuggestionsAsync(localDateTime, request.GuestsCount);
                    return BadRequest(new
                    {
                        error = "Бронирование должно быть минимум за 2 часа от текущего времени",
                        suggestions,
                        errorCode = "TIME_TOO_EARLY"
                    });
                }

                // Проверяем время работы ресторана
                var reservationTime = localDateTime.TimeOfDay;
                if (reservationTime < TimeSpan.FromHours(12) || reservationTime > TimeSpan.FromHours(23))
                {
                    return BadRequest(new
                    {
                        error = "Ресторан работает с 12:00 до 23:00",
                        suggestedTimes = GetSuggestedTimes(localDateTime.Date)
                    });
                }

                //  проверка доступности времени 
                var isAvailable = await IsTimeAvailableAsync(localDateTime, request.GuestsCount);

                if (!isAvailable)
                {
                    var suggestions = await GetAvailableTimeSuggestionsAsync(localDateTime, request.GuestsCount);
                    return BadRequest(new
                    {
                        error = "Выбранное время недоступно. Мест недостаточно",
                        suggestions,
                        errorCode = "TIME_NOT_AVAILABLE"
                    });
                }

                bool isTasting = !string.IsNullOrEmpty(request.Type) &&
                                (request.Type.Contains("Дегустация") || request.Type.Contains("дегустация"));

                var reservation = new Reservation
                {
                    UserId = null,
                    Type = string.IsNullOrEmpty(request.Type) ? "Бронирование стола" : request.Type,
                    ReservationDateTime = localDateTime,
                    GuestsCount = request.GuestsCount,
                    Status = "pending",
                    SpecialRequests = request.SpecialRequests,
                    CustomerName = request.CustomerName,
                    CustomerPhone = request.CustomerPhone,
                    CustomerEmail = request.CustomerEmail,
                    AdditionalServices = request.AdditionalServices,
                    IsTasting = isTasting,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.Reservations.Add(reservation);
                await _context.SaveChangesAsync();

                Console.WriteLine($"Бронь создана успешно: ID={reservation.Id}");

                await NotifyAdminsAboutNewReservation(reservation);

                return Ok(new
                {
                    success = true,
                    message = "Бронирование создано успешно! Мы свяжемся с вами для подтверждения.",
                    reservationId = reservation.Id,
                    reservation = new
                    {
                        reservation.Id,
                        reservation.Type,
                        reservation.ReservationDateTime,
                        reservation.GuestsCount,
                        reservation.CustomerName,
                        reservation.CustomerPhone,
                        reservation.Status
                    }
                });
            }
            catch (DbUpdateException dbEx)
            {
                Console.WriteLine($"Ошибка базы данных: {dbEx.Message}");
                Console.WriteLine($"Inner exception: {dbEx.InnerException?.Message}");
                return StatusCode(500, new
                {
                    error = "Ошибка сохранения в базу данных",
                    details = dbEx.InnerException?.Message
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Общая ошибка: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                return StatusCode(500, new
                {
                    error = "Произошла ошибка при бронировании",
                    details = ex.Message
                });
            }
        }

        // PUT: api/reservations/{id}/status (изменение статуса)
        [HttpPut("{id}/status")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateReservationStatus(int id, [FromBody] UpdateReservationStatusRequest request)
        {
            try
            {
                var reservation = await _context.Reservations.FindAsync(id);
                if (reservation == null)
                {
                    return NotFound(new { message = "Бронь не найдена" });
                }

                var oldStatus = reservation.Status;
                reservation.Status = request.Status;
                reservation.UpdatedAt = DateTime.UtcNow;

                // Добавляем заметку об изменении статуса
                if (!string.IsNullOrEmpty(request.Notes))
                {
                    reservation.SpecialRequests += $"\n[{DateTime.Now:dd.MM.yyyy HH:mm}] {request.Notes}";
                }

                await _context.SaveChangesAsync();

                // Отправляем уведомление клиенту
                if (oldStatus != request.Status && request.Status == "confirmed")
                {
                    await SendConfirmationToCustomer(reservation);
                }
                else if (request.Status == "cancelled")
                {
                    await SendCancellationToCustomer(reservation, request.Notes);
                }

                return Ok(new
                {
                    message = "Статус бронирования обновлен",
                    status = reservation.Status
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        // PUT: api/reservations/{id} (обновление брони)
        [HttpPut("{id}")]
        [Authorize]
        public async Task<IActionResult> UpdateReservation(int id, [FromBody] UpdateReservationRequest request)
        {
            try
            {
                var reservation = await _context.Reservations.FindAsync(id);
                if (reservation == null)
                {
                    return NotFound(new { message = "Бронь не найдена" });
                }

                var userId = int.Parse(User.FindFirst("userId")?.Value ?? "0");
                var isAdmin = User.IsInRole("Admin");

                // Проверка прав доступа
                if (!isAdmin && reservation.UserId != userId)
                {
                    return Forbid();
                }

                // Проверка возможности изменения
                if (reservation.Status == "cancelled" || reservation.Status == "completed")
                {
                    return BadRequest(new { message = "Невозможно изменить завершенную или отмененную бронь" });
                }

                // Если меняется время или количество гостей 
                if (request.ReservationDateTime.HasValue && request.GuestsCount.HasValue)
                {
                    var newDateTime = request.ReservationDateTime.Value;
                    var newGuestsCount = request.GuestsCount.Value;

                    if (newDateTime != reservation.ReservationDateTime || newGuestsCount != reservation.GuestsCount)
                    {
                        var isTimeAvailable = await IsTimeAvailableAsync(newDateTime, newGuestsCount, id);
                        if (!isTimeAvailable)
                        {
                            var suggestions = await GetAvailableTimeSuggestionsAsync(newDateTime, newGuestsCount);
                            return BadRequest(new
                            {
                                message = "Выбранное время недоступно",
                                suggestions,
                                errorCode = "TIME_NOT_AVAILABLE"
                            });
                        }
                    }
                }

                // Обновление полей
                if (!string.IsNullOrEmpty(request.Type))
                {
                    reservation.Type = request.Type;
                }

                if (request.ReservationDateTime.HasValue)
                {
                    reservation.ReservationDateTime = request.ReservationDateTime.Value;
                }

                if (request.GuestsCount.HasValue)
                {
                    reservation.GuestsCount = request.GuestsCount.Value;
                }

                if (!string.IsNullOrEmpty(request.SpecialRequests))
                {
                    reservation.SpecialRequests = request.SpecialRequests;
                }

                if (!string.IsNullOrEmpty(request.CustomerName))
                {
                    reservation.CustomerName = request.CustomerName;
                }

                if (!string.IsNullOrEmpty(request.CustomerPhone))
                {
                    reservation.CustomerPhone = request.CustomerPhone;
                }

                if (!string.IsNullOrEmpty(request.CustomerEmail))
                {
                    reservation.CustomerEmail = request.CustomerEmail;
                }

                reservation.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                return Ok(new { message = "Бронь обновлена успешно" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        // DELETE: api/reservations/{id}
        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> DeleteReservation(int id)
        {
            try
            {
                var reservation = await _context.Reservations.FindAsync(id);
                if (reservation == null)
                {
                    return NotFound(new { message = "Бронь не найдена" });
                }

                var userId = int.Parse(User.FindFirst("userId")?.Value ?? "0");
                var isAdmin = User.IsInRole("Admin");

                // Проверка прав доступа
                if (!isAdmin && reservation.UserId != userId)
                {
                    return Forbid();
                }

                // Проверка возможности удаления
                if (reservation.Status == "completed" && !isAdmin)
                {
                    return BadRequest(new { message = "Невозможно удалить завершенную бронь" });
                }

                // Если бронь уже началась (меньше чем за 2 часа)
                if (reservation.ReservationDateTime <= DateTime.Now.AddHours(2) && !isAdmin)
                {
                    return BadRequest(new { message = "Невозможно отменить бронь менее чем за 2 часа" });
                }

                _context.Reservations.Remove(reservation);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Бронь удалена успешно" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        // GET: api/reservations/available-times
        [HttpGet("available-times")]
        public async Task<IActionResult> GetAvailableTimes([FromQuery] DateTime date, [FromQuery] int guests)
        {
            try
            {
                var availableTimes = await GetAvailableTimeSlotsAsync(date, guests);
                return Ok(availableTimes);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        // GET: api/reservations/stats
        [HttpGet("stats")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetReservationStats()
        {
            try
            {
                var today = DateTime.Today;
                var now = DateTime.Now;

                var stats = new
                {
                    Today = await _context.Reservations
                        .CountAsync(r => r.ReservationDateTime.Date == today),

                    Upcoming = await _context.Reservations
                        .CountAsync(r => r.ReservationDateTime >= now && r.Status == "confirmed"),

                    Pending = await _context.Reservations
                        .CountAsync(r => r.Status == "pending"),

                    CancelledToday = await _context.Reservations
                        .CountAsync(r => r.UpdatedAt.Date == today && r.Status == "cancelled"),

                    // Статистика по типам
                    ByType = await _context.Reservations
                        .GroupBy(r => r.Type)
                        .Select(g => new { Type = g.Key, Count = g.Count() })
                        .ToListAsync(),

                    // Статистика по дням недели
                    ByWeekDay = await _context.Reservations
                        .Where(r => r.ReservationDateTime >= DateTime.Now.AddDays(-30))
                        .GroupBy(r => r.ReservationDateTime.DayOfWeek)
                        .Select(g => new { Day = g.Key.ToString(), Count = g.Count() })
                        .ToListAsync()
                };

                return Ok(stats);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        // Вспомогательные методы
        private async Task<bool> IsTimeAvailableAsync(DateTime dateTime, int guestsCount, int? excludeReservationId = null)
        {
            var targetDate = dateTime.Date;
            var targetHour = dateTime.Hour;

            // Получаем все брони на эту дату
            var reservations = await _context.Reservations
                .Where(r => r.ReservationDateTime.Date == targetDate &&
                           r.Status != "cancelled" &&
                           (excludeReservationId == null || r.Id != excludeReservationId))
                .ToListAsync();

            // Проверяем общее количество гостей за день (не более 50)
            var totalGuestsToday = reservations.Sum(r => r.GuestsCount);
            if (totalGuestsToday + guestsCount > 50)
                return false;

            // Проверяем количество гостей в конкретный час (не более 20)
            var guestsAtSameHour = reservations
                .Where(r => r.ReservationDateTime.Hour == targetHour)
                .Sum(r => r.GuestsCount);

            if (guestsAtSameHour + guestsCount > 20)
                return false;

            return true;
        }

        private async Task<List<TimeSlotSuggestion>> GetAvailableTimeSuggestionsAsync(DateTime requestedTime, int guestsCount)
        {
            var suggestions = new List<TimeSlotSuggestion>();
            var date = requestedTime.Date;

            // Проверяем текущий день
            for (int hour = 12; hour <= 22; hour++)
            {
                if (hour == requestedTime.Hour) continue;

                var suggestedTime = date.AddHours(hour);

                // Пропускаем время в прошлом
                if (suggestedTime <= DateTime.Now.AddHours(2))
                    continue;

                if (await IsTimeAvailableAsync(suggestedTime, guestsCount))
                {
                    suggestions.Add(new TimeSlotSuggestion
                    {
                        DateTime = suggestedTime,
                        Available = true,
                        Message = $"Сегодня в {suggestedTime:HH:mm}"
                    });

                    if (suggestions.Count >= 3) break;
                }
            }

            // Если не нашли на сегодня, ищем на завтра
            if (suggestions.Count == 0)
            {
                var tomorrow = date.AddDays(1);
                for (int hour = 12; hour <= 22; hour += 2)
                {
                    var suggestedTime = tomorrow.AddHours(hour);

                    if (await IsTimeAvailableAsync(suggestedTime, guestsCount))
                    {
                        suggestions.Add(new TimeSlotSuggestion
                        {
                            DateTime = suggestedTime,
                            Available = true,
                            Message = $"Завтра в {suggestedTime:HH:mm}"
                        });

                        if (suggestions.Count >= 3) break;
                    }
                }
            }

            return suggestions;
        }

        private async Task<List<AvailableTimeSlot>> GetAvailableTimeSlotsAsync(DateTime date, int guests)
        {
            var availableSlots = new List<AvailableTimeSlot>();

            for (int hour = 12; hour <= 22; hour++)
            {
                var slotTime = date.AddHours(hour);

                // Пропускаем прошедшее время
                if (slotTime <= DateTime.Now.AddHours(2))
                    continue;

                var isAvailable = await IsTimeAvailableAsync(slotTime, guests);

                availableSlots.Add(new AvailableTimeSlot
                {
                    Time = slotTime,
                    Available = isAvailable,
                    DisplayTime = slotTime.ToString("HH:mm")
                });
            }

            return availableSlots;
        }

        private List<TimeSlotSuggestion> GetSuggestedTimes(DateTime date)
        {
            var suggestions = new List<TimeSlotSuggestion>();
            var now = DateTime.Now;

            for (int hour = 12; hour <= 22; hour += 2)
            {
                var time = date.AddHours(hour);

                // Пропускаем прошедшее время
                if (time > now.AddHours(2))
                {
                    suggestions.Add(new TimeSlotSuggestion
                    {
                        DateTime = time,
                        Available = true,
                        Message = $"Доступно на {time:HH:mm}"
                    });
                }
            }
            return suggestions;
        }

        private async Task NotifyAdminsAboutNewReservation(Reservation reservation)
        {
            Console.WriteLine($"НОВАЯ БРОНЬ #{reservation.Id}");
            Console.WriteLine($"Клиент: {reservation.CustomerName}");
            Console.WriteLine($"Телефон: {reservation.CustomerPhone}");
            Console.WriteLine($"Дата/время: {reservation.ReservationDateTime:dd.MM.yyyy HH:mm}");
            Console.WriteLine($"Гостей: {reservation.GuestsCount}");
            Console.WriteLine($"Тип: {reservation.Type}");
        }

        private async Task SendConfirmationToCustomer(Reservation reservation)
        {
            Console.WriteLine($"Подтверждение брони #{reservation.Id} отправлено клиенту {reservation.CustomerEmail}");
        }

        private async Task SendCancellationToCustomer(Reservation reservation, string reason)
        {
            Console.WriteLine($"Отмена брони #{reservation.Id}. Причина: {reason}");
        }
    }

    // DTO классы 
    public class CreateReservationRequest
    {
        public string? Type { get; set; }

        [Required]
        public DateTime ReservationDateTime { get; set; }

        [Required]
        [Range(1, 50, ErrorMessage = "Количество гостей должно быть от 1 до 50")]
        public int GuestsCount { get; set; }

        public string? SpecialRequests { get; set; }
        public string? AdditionalServices { get; set; }

        [Required(ErrorMessage = "Имя обязательно")]
        public string CustomerName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Телефон обязателен")]
        [Phone(ErrorMessage = "Некорректный номер телефона")]
        public string CustomerPhone { get; set; } = string.Empty;

        [EmailAddress(ErrorMessage = "Некорректный email адрес")]
        public string? CustomerEmail { get; set; }
    }

    public class UpdateReservationRequest
    {
        public string? Type { get; set; }
        public DateTime? ReservationDateTime { get; set; }
        public int? GuestsCount { get; set; }
        public string? SpecialRequests { get; set; }
        public string? CustomerName { get; set; }
        public string? CustomerPhone { get; set; }
        public string? CustomerEmail { get; set; }
    }

    public class UpdateReservationStatusRequest
    {
        [Required]
        public string Status { get; set; } = string.Empty;

        public string? Notes { get; set; }
    }

    // Вспомогательные классы для ответов
    public class TimeSlotSuggestion
    {
        public DateTime DateTime { get; set; }
        public bool Available { get; set; }
        public string Message { get; set; } = string.Empty;
    }

    public class AvailableTimeSlot
    {
        public DateTime Time { get; set; }
        public bool Available { get; set; }
        public string DisplayTime { get; set; } = string.Empty;
    }
}