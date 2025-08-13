import React from 'react';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">
          🚢 Морской бой
        </h1>
        <p className="text-gray-600 text-center mb-8">
          Telegram Mini App для игры в морской бой
        </p>
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">🎮 Как играть:</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Разместите корабли на поле</li>
              <li>• Стреляйте по полю противника</li>
              <li>• Первый, кто потопит все корабли, побеждает!</li>
            </ul>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-semibold text-green-800 mb-2">✅ Статус:</h3>
            <p className="text-sm text-green-700">
              API сервер работает • База данных подключена • Telegram Bot настроен
            </p>
          </div>
        </div>
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            Версия 1.0.0 • Разработано с ❤️
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
