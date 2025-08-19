-- Create lobbies and lobby_players tables to support lobby feature

-- lobbies table
CREATE TABLE IF NOT EXISTS lobbies (
  id TEXT PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'waiting',
  invite_link TEXT,
  match_id TEXT,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- lobby_players table
CREATE TABLE IF NOT EXISTS lobby_players (
  id SERIAL PRIMARY KEY,
  lobby_id TEXT NOT NULL,
  player_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  avatar TEXT,
  is_ready BOOLEAN NOT NULL DEFAULT FALSE,
  is_host BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_lobby_players_lobby_id FOREIGN KEY (lobby_id) REFERENCES lobbies(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_lobby_players_user_id FOREIGN KEY (player_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- helpful index to avoid duplicate players in a lobby
CREATE UNIQUE INDEX IF NOT EXISTS lobby_players_unique_lobby_player ON lobby_players(lobby_id, player_id);

