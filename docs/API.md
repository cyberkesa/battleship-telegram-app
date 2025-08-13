# API Documentation

## Base URL
```
http://localhost:3000/api
```

## Authentication

### POST /auth/telegram
Аутентификация через Telegram Web App.

**Request Body:**
```json
{
  "initData": "query_id=...&user=...&auth_date=...&hash=...",
  "user": {
    "id": 123456789,
    "first_name": "John",
    "last_name": "Doe",
    "username": "johndoe"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "jwt_token_here",
    "user": {
      "id": "user_id",
      "telegramId": 123456789,
      "username": "johndoe",
      "firstName": "John",
      "lastName": "Doe"
    }
  }
}
```

### GET /auth/me
Получение профиля текущего пользователя.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user_id",
    "telegramId": 123456789,
    "username": "johndoe",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

## Matchmaking

### POST /matchmaking/join
Присоединение к очереди поиска игры.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "inQueue": true
  }
}
```

### POST /matchmaking/leave
Выход из очереди поиска.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "left": true
  }
}
```

### GET /matchmaking/status
Получение статуса очереди.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "inQueue": true,
    "queueSize": 3
  }
}
```

### GET /matchmaking/active-match
Получение активной игры пользователя.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "match_id",
    "status": "playing",
    "playerA": {
      "id": "player_a_id",
      "telegramId": 123456789,
      "username": "player1",
      "firstName": "Player",
      "isReady": true
    },
    "playerB": {
      "id": "player_b_id",
      "telegramId": 987654321,
      "username": "player2",
      "firstName": "Player",
      "isReady": true
    },
    "currentTurn": "player_a_id",
    "winner": null,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

## Game

### POST /game/:matchId/setup
Расстановка кораблей на поле.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "ships": [
    {
      "id": "ship_id",
      "size": 5,
      "positions": [
        {"x": 0, "y": 0},
        {"x": 1, "y": 0},
        {"x": 2, "y": 0},
        {"x": 3, "y": 0},
        {"x": 4, "y": 0}
      ],
      "hits": [],
      "isSunk": false
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "board": {
      "id": "board_id",
      "playerId": "player_id",
      "ships": [...]
    }
  }
}
```

### POST /game/:matchId/move
Выполнение хода в игре.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "position": {
    "x": 5,
    "y": 5
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "hit": true,
    "sunk": false,
    "shipId": "ship_id",
    "gameOver": false
  }
}
```

### GET /game/:matchId/state
Получение состояния игры.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "match_id",
    "status": "playing",
    "playerA": {...},
    "playerB": {...},
    "currentTurn": "player_a_id",
    "winner": null,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

## Events (SSE)

### GET /events/:gameId/subscribe
Подписка на события игры через Server-Sent Events.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```
data: {"type":"connected","data":{"gameId":"match_id","playerId":"player_id"},"timestamp":"2024-01-01T00:00:00Z"}

data: {"type":"move_made","data":{"playerId":"player_id","position":{"x":5,"y":5},"hit":true},"timestamp":"2024-01-01T00:00:00Z"}

data: {"type":"game_over","data":{"winner":"player_id"},"timestamp":"2024-01-01T00:00:00Z"}
```

## Error Responses

Все API endpoints возвращают ошибки в следующем формате:

```json
{
  "success": false,
  "error": "Error message description"
}
```

## Status Codes

- `200` - Успешный запрос
- `400` - Неверный запрос
- `401` - Не авторизован
- `403` - Доступ запрещен
- `404` - Не найдено
- `500` - Внутренняя ошибка сервера
