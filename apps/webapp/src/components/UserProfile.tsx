import React from 'react';

interface User {
  id: number;
  telegramId: number;
  firstName: string;
  lastName?: string;
  username?: string;
  gamesPlayed: number;
  gamesWon: number;
  rating: number;
  createdAt: string;
}

interface UserProfileProps {
  user: User;
  onLogout: () => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ user, onLogout }) => {
  const winRate = user.gamesPlayed > 0 ? ((user.gamesWon / user.gamesPlayed) * 100).toFixed(1) : '0.0';

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center space-x-4 mb-6">
        <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
          {user.firstName.charAt(0).toUpperCase()}
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-800">
            {user.firstName} {user.lastName}
          </h2>
          {user.username && (
            <p className="text-gray-600">@{user.username}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{user.gamesPlayed}</div>
          <div className="text-sm text-gray-600">Игр сыграно</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{user.gamesWon}</div>
          <div className="text-sm text-gray-600">Побед</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">{winRate}%</div>
          <div className="text-sm text-gray-600">Процент побед</div>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <div className="flex justify-between items-center">
          <span className="text-gray-700">Рейтинг:</span>
          <span className="text-xl font-bold text-orange-600">{user.rating}</span>
        </div>
      </div>

      <div className="text-center text-sm text-gray-500 mb-4">
        Игрок с {new Date(user.createdAt).toLocaleDateString('ru-RU')}
      </div>

      <button
        onClick={onLogout}
        className="w-full bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition-colors"
      >
        Выйти из аккаунта
      </button>
    </div>
  );
};
