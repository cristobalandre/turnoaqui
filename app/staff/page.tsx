"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Staff = {
  id: string;
  name: string;
  role: string;
  active: boolean;
  avatar_thumb_url?: string | null; // 512
  avatar_full_url?: string | null;  // 1024
};

const ORG_ID = "a573aa05-d62b-44c7-a878-b9138902a094"; // ✅ TU ORG FIJA
const BUCKET = "Avatars"; // ✅ EXACTO como lo tienes en Supabase (case-sensitive)

const THUMB_SIZE = 512;
const FULL_SIZE = 1024;

export default function StaffPage() {
  const [items, setItems] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);

  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState("staff");
  const [saving, setSaving] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingRole, setEditingRole] = useState("staff");
  const [editingActive, setEditingActive] = useState(true);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const roleLabel = useMemo(() => {
    return {
      producer: "Productor",
      artist: "Artista",
      barber: "Barbero",
      staff: "Staff",
    } as Record<string, string>;
  }, []);

  const load = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("staff")
      .select("id,name,role,active,avatar_thumb_url,avatar_full_url,org_id")
      .eq("org_id", ORG_ID)
      .order("created_at", { ascending: true });

    if (error) {
      console.error(error);
      alert("Error cargando staff: " + error.message);
    } else {
      setItems((data as Staff[]) || []);
    }

    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  // ✅ Crea un recorte cuadrado centrado y exporta WebP al tamaño pedido
  const createCroppedWebp = async (file: File, size: number) => {
    if (!file.type.startsWith("image/")) {
      throw new Error("El archivo no es una imagen.");
    }

    const maxMB = 15;
    if (file.size > maxMB * 1024 * 1024) {
      throw new Error(`Imagen muy pesada (máx ${maxMB}MB).`);
    }

    const imgUrl = URL.createObjectURL(file);
    const img = new Image();
    img.crossOrigin = "anonymous";

    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("No se pudo leer la imagen."));
      img.src = imgUrl;
    });

    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("No se pudo crear el canvas.");

    const sw = img.width;
    const sh = img.height;
    const side = Math.min(sw, sh);
    const sx = Math.floor((sw - side) / 2);
    const sy = Math.floor((sh - side) / 2);

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);

    const blob: Blob = await new Promise((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("No se pudo exportar la imagen."))),
        "image/webp",
        0.92 // ✅ calidad alta
      );
    });

    URL.revokeObjectURL(imgUrl);
    return new File([blob], `avatar-${size}.webp`, { type: "image/webp" });
  };

  // ✅ Subir 2 versiones (512 y 1024) con ruta multi-org
  const uploadAvatarPro = async (staffId: string, file: File) => {
    const thumbFile = await createCroppedWebp(file, THUMB_SIZE);
    const fullFile = await createCroppedWebp(file, FULL_SIZE);

    const thumbPath = `${ORG_ID}/staff/${staffId}/avatar-512.webp`;
    const fullPath = `${ORG_ID}/staff/${staffId}/avatar-1024.webp`;

    const thumbRes = await supabase.storage.from(BUCKET).upload(thumbPath, thumbFile, {
      cacheControl: "3600",
      upsert: true,
      contentType: "image/webp",
    });
    if (thumbRes.error) throw thumbRes.error;

    const fullRes = await supabase.storage.from(BUCKET).upload(fullPath, fullFile, {
      cacheControl: "3600",
      upsert: true,
      contentType: "image/webp",
    });
    if (fullRes.error) throw fullRes.error;

    const thumbUrl = supabase.storage.from(BUCKET).getPublicUrl(thumbPath).data.publicUrl;
    const fullUrl = supabase.storage.from(BUCKET).getPublicUrl(fullPath).data.publicUrl;

    // ✅ anti-cache (para que se actualice altiro)
    const t = Date.now();
    return {
      thumbUrl: `${thumbUrl}?t=${t}`,
      fullUrl: `${fullUrl}?t=${t}`,
    };
  };

  const setStaffAvatar = async (staffId: string, file: File) => {
    try {
      const { thumbUrl, fullUrl } = await uploadAvatarPro(staffId, file);

      const { error } = await supabase
        .from("staff")
        .update({
          avatar_thumb_url: thumbUrl,
          avatar_full_url: fullUrl,
        })
        .eq("id", staffId)
        .eq("org_id", ORG_ID);

      if (error) throw error;

      await load();
    } catch (e: any) {
      console.error(e);
      alert("Error subiendo avatar ❌ " + (e?.message || String(e)));
    }
  };

  const add = async () => {
    const name = newName.trim();
    if (!name) return;

    setSaving(true);

    const { error } = await supabase.from("staff").insert([
      {
        name,
        role: newRole,
        org_id: ORG_ID, // ✅ importantísimo
        active: true,
      },
    ]);

    setSaving(false);

    if (error) {
      alert("Error creando staff: " + error.message);
      return;
    }

    setNewName("");
    setNewRole("staff");
    load();
  };

  const startEdit = (s: Staff) => {
    setEditingId(s.id);
    setEditingName(s.name);
    setEditingRole(s.role);
    setEditingActive(s.active);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName("");
    setEditingRole("staff");
    setEditingActive(true);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    const name = editingName.trim();
    if (!name) return;

    const { error } = await supabase
      .from("staff")
      .update({
        name,
        role: editingRole,
        active: editingActive,
      })
      .eq("id", editingId)
      .eq("org_id", ORG_ID);

    if (error) {
      alert("Error editando: " + error.message);
      return;
    }

    cancelEdit();
    load();
  };

  const remove = async (s: Staff) => {
    const ok = confirm(`¿Eliminar "${s.name}"?`);
    if (!ok) return;

    const { error } = await supabase
      .from("staff")
      .delete()
      .eq("id", s.id)
      .eq("org_id", ORG_ID);

    if (error) {
      alert("Error eliminando: " + error.message);
      return;
    }

    load();
  };

  return (
    <div style={{ padding: 24, maxWidth: 900 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700 }}>Staff</h1>
      <p style={{ color: "#666" }}>
        Personas que atienden: productores, artistas, barberos, etc.
      </p>

      {/* ✅ Modal para ver grande (usa 1024) */}
      {previewUrl && (
        <div
          onClick={() => setPreviewUrl(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff",
              borderRadius: 14,
              maxWidth: 560,
              width: "100%",
              padding: 14,
              boxShadow: "0 10px 30px rgba(0,0,0,.25)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
              <div style={{ fontWeight: 700 }}>Foto</div>
              <button
                onClick={() => setPreviewUrl(null)}
                style={{
                  border: "1px solid #ddd",
                  background: "#fff",
                  borderRadius: 8,
                  cursor: "pointer",
                  padding: "6px 10px",
                }}
              >
                Cerrar
              </button>
            </div>

            <div style={{ marginTop: 12 }}>
              <img
                src={previewUrl}
                alt="avatar grande"
                style={{
                  width: "100%",
                  height: "auto",
                  borderRadius: 12,
                  display: "block",
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ✅ Crear staff */}
      <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Nombre"
          style={{
            flex: 1,
            padding: "10px 12px",
            border: "1px solid #ddd",
            borderRadius: 8,
          }}
        />
        <select
          value={newRole}
          onChange={(e) => setNewRole(e.target.value)}
          style={{
            padding: "10px 12px",
            border: "1px solid #ddd",
            borderRadius: 8,
          }}
        >
          <option value="producer">Productor</option>
          <option value="artist">Artista</option>
          <option value="barber">Barbero</option>
          <option value="staff">Staff</option>
        </select>

        <button
          onClick={add}
          disabled={saving}
          style={{
            padding: "10px 14px",
            border: "1px solid #ddd",
            borderRadius: 8,
            cursor: "pointer",
          }}
        >
          {saving ? "Guardando..." : "Agregar"}
        </button>
      </div>

      {/* ✅ Lista */}
      <div style={{ marginTop: 18 }}>
        {loading ? (
          <p>Cargando...</p>
        ) : items.length === 0 ? (
          <p>No hay staff aún.</p>
        ) : (
          <div
            style={{
              border: "1px solid #eee",
              borderRadius: 10,
              overflow: "hidden",
            }}
          >
            {items.map((s) => (
              <div
                key={s.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: 12,
                  borderBottom: "1px solid #f1f1f1",
                }}
              >
                {editingId === s.id ? (
                  <div style={{ flex: 1, display: "flex", gap: 8 }}>
                    <input
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      style={{
                        flex: 1,
                        padding: "10px 12px",
                        border: "1px solid #ddd",
                        borderRadius: 8,
                      }}
                    />

                    <select
                      value={editingRole}
                      onChange={(e) => setEditingRole(e.target.value)}
                      style={{
                        padding: "10px 12px",
                        border: "1px solid #ddd",
                        borderRadius: 8,
                      }}
                    >
                      <option value="producer">Productor</option>
                      <option value="artist">Artista</option>
                      <option value="barber">Barbero</option>
                      <option value="staff">Staff</option>
                    </select>

                    <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <input
                        type="checkbox"
                        checked={editingActive}
                        onChange={(e) => setEditingActive(e.target.checked)}
                      />
                      Activo
                    </label>

                    <button
                      onClick={saveEdit}
                      style={{
                        padding: "10px 14px",
                        border: "1px solid #ddd",
                        borderRadius: 8,
                        cursor: "pointer",
                      }}
                    >
                      Guardar
                    </button>

                    <button
                      onClick={cancelEdit}
                      style={{
                        padding: "10px 14px",
                        border: "1px solid #ddd",
                        borderRadius: 8,
                        cursor: "pointer",
                      }}
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <>
                    {/* ✅ Avatar (usa 512) */}
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <button
                        onClick={() => s.avatar_full_url && setPreviewUrl(s.avatar_full_url)}
                        style={{
                          width: 46,
                          height: 46,
                          borderRadius: 999,
                          overflow: "hidden",
                          border: "1px solid #ddd",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: "#f5f5f5",
                          fontWeight: 700,
                          flexShrink: 0,
                          padding: 0,
                          cursor: s.avatar_full_url ? "zoom-in" : "default",
                        }}
                        title={s.avatar_full_url ? "Ver foto" : "Sin foto"}
                      >
                        {s.avatar_thumb_url ? (
                          <img
                            src={s.avatar_thumb_url}
                            alt="avatar"
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                        ) : (
                          (s.name?.[0] || "?").toUpperCase()
                        )}
                      </button>

                      <div>
                        <div style={{ fontWeight: 600 }}>
                          {s.name} {!s.active ? "❌" : "✅"}
                        </div>
                        <div style={{ color: "#666", fontSize: 13 }}>
                          {roleLabel[s.role] || s.role}
                        </div>
                      </div>
                    </div>

                    {/* ✅ Botones */}
                    <div style={{ display: "flex", gap: 8 }}>
                      <label
                        style={{
                          padding: "8px 10px",
                          border: "1px solid #ddd",
                          borderRadius: 8,
                          cursor: "pointer",
                          userSelect: "none",
                        }}
                        title="Subir foto"
                      >
                        Foto
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: "none" }}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) setStaffAvatar(s.id, file);
                            e.currentTarget.value = "";
                          }}
                        />
                      </label>

                      <button
                        onClick={() => startEdit(s)}
                        style={{
                          padding: "8px 10px",
                          border: "1px solid #ddd",
                          borderRadius: 8,
                          cursor: "pointer",
                        }}
                      >
                        Editar
                      </button>

                      <button
                        onClick={() => remove(s)}
                        style={{
                          padding: "8px 10px",
                          border: "1px solid #ddd",
                          borderRadius: 8,
                          cursor: "pointer",
                        }}
                      >
                        Eliminar
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ marginTop: 18 }}>
        <a href="/dashboard">← volver al dashboard</a>
      </div>
    </div>
  );
}
