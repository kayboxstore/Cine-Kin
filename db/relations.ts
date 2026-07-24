import { relations } from "drizzle-orm";
import { appClients, resellers, activations, playlists } from "./schema";

// PlanetScale has no DB-level foreign keys; these relations power Drizzle's
// query-time joins (db.query.*.findMany({ with: ... })).

export const appClientsRelations = relations(appClients, ({ one, many }) => ({
  activatedByReseller: one(resellers, {
    fields: [appClients.activatedByResellerId],
    references: [resellers.id],
  }),
  playlists: many(playlists),
  activations: many(activations),
}));

export const resellersRelations = relations(resellers, ({ many }) => ({
  activations: many(activations),
  appClients: many(appClients),
}));

export const activationsRelations = relations(activations, ({ one }) => ({
  appClient: one(appClients, {
    fields: [activations.appClientId],
    references: [appClients.id],
  }),
  reseller: one(resellers, {
    fields: [activations.activatedByResellerId],
    references: [resellers.id],
  }),
}));

export const playlistsRelations = relations(playlists, ({ one }) => ({
  appClient: one(appClients, {
    fields: [playlists.appClientId],
    references: [appClients.id],
  }),
}));
