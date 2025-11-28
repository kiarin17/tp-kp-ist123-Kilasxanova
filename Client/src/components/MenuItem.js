export default function MenuItem({ item, isAdmin, onEdit, onDelete }) {
  return (
    <div className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden group">
      {/* Изображение */}
      <div className="relative h-48 bg-gray-200 overflow-hidden">
        {item.imageUrl ? (
          <img 
            src={item.imageUrl} 
            alt={item.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-amber-100">
            <span className="text-amber-600 text-lg font-semibold">Нет фото</span>
          </div>
        )}
        
        {/* Бейдж времени приготовления */}
        {item.preparationTime && (
          <div className="absolute top-3 right-3 bg-black bg-opacity-70 text-white px-2 py-1 rounded-full text-sm">
            ⏱ {item.preparationTime} мин
          </div>
        )}
      </div>

      {/* Контент */}
      <div className="p-5">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-bold text-gray-800">{item.name}</h3>
          <span className="text-amber-600 font-bold text-lg">
            {item.price} ₽
          </span>
        </div>
        
        <p className="text-gray-600 mb-4 line-clamp-2">{item.description}</p>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500 bg-amber-50 px-2 py-1 rounded">
            {item.categoryName}
          </span>
          
          {/* Кнопки для админа */}
          {isAdmin && (
            <div className="flex gap-2">
              <button 
                onClick={onEdit}
                className="text-blue-600 hover:text-blue-800 transition-colors"
              >
                ✏️
              </button>
              <button 
                onClick={onDelete}
                className="text-red-600 hover:text-red-800 transition-colors"
              >
                🗑️
              </button>
            </div>
          )}
        </div>

        {/* Кнопка добавления в корзину для клиентов */}
        {!isAdmin && (
          <button className="w-full mt-4 bg-amber-600 text-white py-2 rounded-lg hover:bg-amber-700 transition-colors font-semibold">
            В корзину
          </button>
        )}
      </div>
    </div>
  );
}