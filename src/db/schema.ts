import {
  pgTable,
  pgSequence,
  serial,
  text,
  integer,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const catalogNumberSeq = pgSequence("catalog_number_seq", {
  startWith: 1,
  increment: 1,
});

export const games = pgTable("games", {
  id: serial("id").primaryKey(),
  catalogNumber: integer("catalog_number")
    .notNull()
    .default(sql`nextval('catalog_number_seq')`),
  slug: varchar("slug", { length: 120 }).notNull().unique(),

  // Steam-sourced metadata (nullable: a game might not be on Steam)
  steamAppId: integer("steam_app_id"),
  name: text("name").notNull(),
  headerImageUrl: text("header_image_url"),
  shortDescription: text("short_description"),
  releaseDate: varchar("release_date", { length: 64 }), // Steam returns free-text dates, not always ISO
  developer: text("developer"),
  publisher: text("publisher"),
  genres: text("genres").array(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const screenshots = pgTable("screenshots", {
  id: serial("id").primaryKey(),
  gameId: integer("game_id")
    .notNull()
    .references(() => games.id, { onDelete: "cascade" }),

  r2Key: text("r2_key").notNull(),
  caption: text("caption"),
  width: integer("width").notNull(),
  height: integer("height").notNull(),

  takenAt: timestamp("taken_at"), // optional, e.g. from EXIF or user input
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Game = typeof games.$inferSelect;
export type NewGame = typeof games.$inferInsert;
export type Screenshot = typeof screenshots.$inferSelect;
export type NewScreenshot = typeof screenshots.$inferInsert;
