import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { trpc } from "@/providers/trpc";
import { useToast } from "@/components/Toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Format = "m3u" | "xtream";
type Playlist = {
  id: number;
  name: string;
  format: "m3u" | "xtream";
  source: "cinekin" | "external";
};

export default function PlaylistsView() {
  const { toast } = useToast();
  const utils = trpc.useUtils();
  const playlists = trpc.clientPortal.listPlaylists.useQuery();

  const [name, setName] = useState("");
  const [format, setFormat] = useState<Format>("m3u");
  const [m3uUrl, setM3uUrl] = useState("");
  const [xServer, setXServer] = useState("");
  const [xUser, setXUser] = useState("");
  const [xPass, setXPass] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Playlist | null>(null);

  const invalidate = () => {
    utils.clientPortal.listPlaylists.invalidate();
    utils.clientPortal.getDashboard.invalidate();
  };

  const add = trpc.clientPortal.addPlaylist.useMutation({
    onSuccess: () => {
      toast("Playlist ajoutée.", "success");
      setName("");
      setM3uUrl("");
      setXServer("");
      setXUser("");
      setXPass("");
      invalidate();
    },
    onError: (e) => toast(e.message || "Échec de l'ajout", "error"),
  });

  const del = trpc.clientPortal.deletePlaylist.useMutation({
    onSuccess: () => {
      toast("Playlist supprimée.", "success");
      setDeleteTarget(null);
      invalidate();
    },
    onError: (e) => toast(e.message || "Échec de la suppression", "error"),
  });

  const canAdd =
    name.trim().length > 0 &&
    (format === "m3u" ? m3uUrl.trim().length > 0 : xServer.trim() && xUser.trim() && xPass.trim());

  const submit = () => {
    add.mutate({
      name: name.trim(),
      format,
      source: "external",
      ...(format === "m3u"
        ? { m3uUrl: m3uUrl.trim() }
        : {
            xtreamServerUrl: xServer.trim(),
            xtreamUsername: xUser.trim(),
            xtreamPassword: xPass.trim(),
          }),
    });
  };

  const isCineKin = deleteTarget?.source === "cinekin";

  return (
    <div className="space-y-6">
      {/* Add form */}
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6">
        <h2 className="mb-4 font-display text-lg font-semibold text-white">Ajouter une playlist</h2>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pl-name" className="text-white/70">Nom</Label>
            <Input
              id="pl-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="border-white/10 bg-white/[0.03] text-white"
            />
          </div>

          {/* Format toggle */}
          <div className="space-y-2">
            <Label className="text-white/70">Format</Label>
            <div className="grid grid-cols-2 gap-2">
              {(["m3u", "xtream"] as Format[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFormat(f)}
                  className={`rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                    format === f
                      ? "border-[#5a6b4e] bg-[#5a6b4e]/15 text-white"
                      : "border-white/10 bg-white/[0.02] text-white/60 hover:border-white/20"
                  }`}
                >
                  {f === "m3u" ? "M3U" : "Xtream Codes"}
                </button>
              ))}
            </div>
          </div>

          {/* Fields switch by format */}
          {format === "m3u" ? (
            <div className="space-y-2">
              <Label htmlFor="pl-m3u" className="text-white/70">URL M3U</Label>
              <Input
                id="pl-m3u"
                value={m3uUrl}
                onChange={(e) => setM3uUrl(e.target.value)}
                placeholder="https://…/playlist.m3u"
                className="border-white/10 bg-white/[0.03] font-mono text-white"
              />
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2 sm:col-span-3">
                <Label htmlFor="pl-server" className="text-white/70">Serveur</Label>
                <Input
                  id="pl-server"
                  value={xServer}
                  onChange={(e) => setXServer(e.target.value)}
                  placeholder="http://serveur:port"
                  className="border-white/10 bg-white/[0.03] font-mono text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pl-user" className="text-white/70">Identifiant</Label>
                <Input
                  id="pl-user"
                  value={xUser}
                  onChange={(e) => setXUser(e.target.value)}
                  className="border-white/10 bg-white/[0.03] text-white"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="pl-pass" className="text-white/70">Mot de passe</Label>
                <Input
                  id="pl-pass"
                  type="password"
                  value={xPass}
                  onChange={(e) => setXPass(e.target.value)}
                  className="border-white/10 bg-white/[0.03] text-white"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <Button
              onClick={submit}
              disabled={!canAdd || add.isPending}
              className="bg-[#5a6b4e] text-white hover:bg-[#4d5d42]"
            >
              <Plus className="mr-1.5 h-4 w-4" />
              {add.isPending ? "Ajout…" : "Ajouter"}
            </Button>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="space-y-3">
        {playlists.data && playlists.data.length > 0 ? (
          playlists.data.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between gap-4 rounded-xl border border-white/[0.08] bg-white/[0.02] p-4"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="truncate font-medium text-white">{p.name}</span>
                  <Badge
                    variant="outline"
                    className={
                      p.source === "cinekin"
                        ? "border-[#5a6b4e]/40 bg-[#5a6b4e]/10 text-[#8ba26f]"
                        : "border-white/15 bg-white/5 text-white/60"
                    }
                  >
                    {p.source === "cinekin" ? "Ciné-Kin" : "Externe"}
                  </Badge>
                  <span className="text-xs uppercase text-white/40">{p.format}</span>
                </div>
              </div>
              <button
                onClick={() => setDeleteTarget(p)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white/50 transition-colors hover:bg-red-500/10 hover:text-red-400"
                title="Supprimer"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))
        ) : (
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] py-10 text-center text-white/50">
            {playlists.isLoading ? "Chargement…" : "Aucune playlist"}
          </div>
        )}
      </div>

      {/* Delete confirmation (reinforced for the Ciné-Kin playlist) */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isCineKin ? "Supprimer la playlist Ciné-Kin ?" : "Supprimer la playlist ?"}</DialogTitle>
            <DialogDescription>
              {isCineKin ? (
                <>
                  ⚠️ Vous êtes sur le point de supprimer la playlist <strong>Ciné-Kin</strong> —
                  c'est votre bouquet principal. Vous perdrez l'accès à ses chaînes jusqu'à ce
                  qu'elle soit rétablie. Cette action est possible mais fortement déconseillée.
                </>
              ) : (
                <>La playlist « {deleteTarget?.name} » sera définitivement supprimée.</>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
              Annuler
            </Button>
            <Button
              disabled={del.isPending}
              onClick={() => deleteTarget && del.mutate({ id: deleteTarget.id })}
              className={isCineKin ? "bg-red-600 text-white hover:bg-red-700" : "bg-[#5a6b4e] text-white hover:bg-[#4d5d42]"}
            >
              {del.isPending ? "Suppression…" : isCineKin ? "Supprimer quand même" : "Supprimer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
