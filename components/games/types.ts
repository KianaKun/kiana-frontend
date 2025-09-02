// src/components/games/types.ts
export type Game = {
  gameID: number;
  title: string;
  description?: string | null;
  image_url?: string | null;
  price: number | string;   // <- aman untuk DECIMAL dari mysql2
  is_deleted?: 0 | 1;       // optional (kalau kolom ini belum ada di DB)
};

export type GameListResponse = { items: Game[] } | Game[];
