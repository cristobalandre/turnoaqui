"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

const ORG_ID = "a573aa05-d62b-44c7-a878-b9138902a094";
const BUCKET = "avatars"; // ✅ tu bucket en minúscula

type ClientRow = {
  id: string;
  org_id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  avatar_url: string | null;
  notes: string | null;
  created_at: string;
};

function initials(name: string) {
  const parts = name.trim().split(" ").filter(Boolean);
  if (!parts.length) return "C";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

async function uploadClientAvatar(file: File, clientId: string) {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `clients/${clientId}.${ext}`; // ✅ clients/{clientId}.jpg

  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, {
    upsert: true,
    cacheControl: "3600",
    contentType: file.type,
  });

  if (uploadError) throw new Error(uploadError.message);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);

  // form create/edit
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ClientRow | null>(null);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");

  const [search, setSearch] = useState("");

  const filteredClients = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((c) => {
      const n = (c.full_name || "").toLowerCase();
      const p = (c.phone || "").toLowerCase();
      const e = (c.email || "").toLowerCase();
      return n.includes(q) || p.includes(q) || e.includes(q);
    });
  }, [clients, search]);

  const resetForm = () => {
    setFullName("");
    setPhone("");
    setEmail("");
    setNotes("");
  };

  const openCreate = () => {
    setEditing(null);
    resetForm();
    setModalOpen(true);
  };

  const openEdit = (c: ClientRow) => {
    setEditing(c);
    setFullName(c.full_name || "");
    setPhone(c.phone || "");
    setEmail(c.email || "");
    setNotes(c.notes || "");
    setModalOpen(true);
  };

  const loadClients = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("clients")
      .select("id,org_id,full_name,phone,email,avatar_url,notes,created_at")
      .eq("org_id", ORG_ID)
      .order("created_at", { ascending: false });

    if (error) {
      alert("Error cargando clientes: " + error.message);
      setLoading(false);
      return;
    }

    setClients((data as ClientRow[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    loadClients();
  }, []);

  const saveClient = async () => {
    if (!fullName.trim()) return alert("Nombre requerido.");

    if (!editing) {
      // CREATE
      const { data, error } = await supabase
        .from("clients")
        .insert([
          {
            org_id: ORG_ID,
            full_name: fullName.trim(),
            phone: phone.trim() || null,
            email: email.trim() || null,
            notes: notes.trim() || null,
            avatar_url: null,
          },
        ])
        .select("*")
        .single();

      if (error) return alert("No se pudo crear: " + error.message);

      setClients((prev) => [data as ClientRow, ...prev]);
      setModalOpen(false);
      resetForm();
      return;
    }

    // UPDATE
    const { error } = await supabase
      .from("clients")
      .update({
        full_name: fullName.trim(),
        phone: phone.trim() || null,
        email: email.trim() || null,
        notes: notes.trim() || null,
      })
      .eq("id", editing.id)
      .eq("org_id", ORG_ID);

    if (error) return alert("No se pudo actualizar: " + error.message);

    setClients((prev) =>
      prev.map((c) =>
        c.id === editing.id
          ? {
              ...c,
              full_name: fullName.trim(),
              phone: phone.trim() || null,
              email: email.trim() || null,
              notes: notes.trim() || null,
            }
          : c
      )
    );

    setModalOpen(false);
    setEditing(null);
    resetForm();
  };

  const deleteClient = async (clientId: string) => {
    const ok = confirm("¿Eliminar cliente? (Las reservas quedarán con client_id null si aplica)");
    if (!ok) return;

    const { error } = await supabase.from("clients").delete().eq("id", clientId).eq("org_id", ORG_ID);
    if (error) return alert("No se pudo eliminar: " + error.message);

    setClients((prev) => prev.filter((c) => c.id !== clientId));
  };

  const onPickAvatar = async (file: File, client: ClientRow) => {
    try {
      // 1) subimos
      const url = await uploadClientAvatar(file, client.id);

      // 2) guardamos en DB
      const { error } = await supabase
        .from("clients")
        .update({ avatar_url: url })
        .eq("id", client.id)
        .eq("org_id", ORG_ID);

      if (error) throw new Error(error.message);

      // 3) refrescamos local
      setClients((prev) => prev.map((c) => (c.id === client.id ? { ...c, avatar_url: url } : c)));
    } catch (e: any) {
      alert("Error subiendo avatar: " + e.message);
    }
  };

  return (
    <div style={{ padding: 24, background: "#fafafa", minHeight: "100vh" }}>
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 980, letterSpacing: -0.3 }}>Clientes 👤</h1>
          <div style={{ marginTop: 6, color: "#64748b", fontWeight: 700 }}>
            Crea clientes con avatar para mostrarlos en el calendario (AgendaPro style).
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, teléfono o email..."
            style={{
              width: 320,
              padding: "10px 12px",
              borderRadius: 14,
              border: "1px solid rgba(15,23,42,0.10)",
              background: "white",
              boxShadow: "0 10px 26px rgba(0,0,0,0.05)",
              fontWeight: 700,
            }}
          />

          <button
            onClick={openCreate}
            style={{
              padding: "10px 14px",
              borderRadius: 14,
              border: "1px solid rgba(15,23,42,0.10)",
              cursor: "pointer",
              fontWeight: 980,
              background: "linear-gradient(180deg,#111827,#0b1220)",
              color: "white",
              boxShadow: "0 12px 26px rgba(0,0,0,0.18)",
            }}
          >
            + Nuevo cliente
          </button>
        </div>
      </div>

      {/* LIST */}
      <div
        style={{
          marginTop: 16,
          border: "1px solid rgba(15,23,42,0.08)",
          borderRadius: 18,
          background: "white",
          boxShadow: "0 14px 34px rgba(0,0,0,0.06)",
          overflow: "hidden",
        }}
      >
        <div style={{ padding: 14, borderBottom: "1px solid rgba(15,23,42,0.06)", fontWeight: 980 }}>
          {loading ? "Cargando..." : `${filteredClients.length} clientes`}
        </div>

        <div style={{ padding: 14 }}>
          {filteredClients.length === 0 && !loading && (
            <div style={{ color: "#64748b", fontWeight: 700 }}>No hay clientes todavía.</div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 12 }}>
            {filteredClients.map((c) => (
              <div
                key={c.id}
                style={{
                  border: "1px solid rgba(15,23,42,0.08)",
                  borderRadius: 18,
                  padding: 14,
                  boxShadow: "0 12px 26px rgba(0,0,0,0.05)",
                  background: "linear-gradient(180deg,#fff,#fbfdff)",
                }}
              >
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  {/* Avatar */}
                  {c.avatar_url ? (
                    <img
                      src={c.avatar_url}
                      alt={c.full_name}
                      width={54}
                      height={54}
                      style={{ borderRadius: 999, objectFit: "cover", border: "1px solid rgba(15,23,42,0.12)" }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 54,
                        height: 54,
                        borderRadius: 999,
                        display: "grid",
                        placeItems: "center",
                        fontWeight: 980,
                        background: "#eef2ff",
                        color: "#111827",
                        border: "1px solid rgba(15,23,42,0.12)",
                      }}
                    >
                      {initials(c.full_name)}
                    </div>
                  )}

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 980, fontSize: 15, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {c.full_name}
                    </div>

                    <div style={{ marginTop: 4, color: "#64748b", fontWeight: 700, fontSize: 12 }}>
                      {c.phone ? `📞 ${c.phone}` : "📞 (sin teléfono)"}{" "}
                      {c.email ? `· ✉️ ${c.email}` : ""}
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {c.notes && (
                  <div
                    style={{
                      marginTop: 10,
                      padding: "10px 12px",
                      borderRadius: 14,
                      background: "#f8fafc",
                      border: "1px solid rgba(15,23,42,0.06)",
                      color: "#334155",
                      fontWeight: 700,
                      fontSize: 12,
                    }}
                  >
                    {c.notes}
                  </div>
                )}

                {/* Actions */}
                <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
                  <button
                    onClick={() => openEdit(c)}
                    style={{
                      padding: "10px 12px",
                      borderRadius: 14,
                      border: "1px solid rgba(15,23,42,0.10)",
                      cursor: "pointer",
                      background: "white",
                      fontWeight: 950,
                      boxShadow: "0 10px 22px rgba(0,0,0,0.05)",
                    }}
                  >
                    Editar
                  </button>

                  <label
                    style={{
                      padding: "10px 12px",
                      borderRadius: 14,
                      border: "1px solid rgba(15,23,42,0.10)",
                      cursor: "pointer",
                      background: "white",
                      fontWeight: 950,
                      boxShadow: "0 10px 22px rgba(0,0,0,0.05)",
                    }}
                  >
                    Cambiar foto
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        onPickAvatar(file, c);
                        e.currentTarget.value = "";
                      }}
                    />
                  </label>

                  <button
                    onClick={() => deleteClient(c.id)}
                    style={{
                      padding: "10px 12px",
                      borderRadius: 14,
                      border: "1px solid rgba(15,23,42,0.10)",
                      cursor: "pointer",
                      background: "white",
                      fontWeight: 950,
                    }}
                  >
                    Eliminar
                  </button>
                </div>

                <div style={{ marginTop: 10, color: "#94a3b8", fontSize: 11, fontWeight: 700 }}>
                  ID: {c.id}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MODAL CREATE/EDIT */}
      {modalOpen && (
        <div
          onClick={() => setModalOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
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
              width: 520,
              background: "white",
              borderRadius: 18,
              padding: 14,
              boxShadow: "0 14px 40px rgba(0,0,0,.30)",
              border: "1px solid rgba(15,23,42,0.10)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
              <div style={{ fontWeight: 980, fontSize: 16 }}>{editing ? "Editar cliente" : "Nuevo cliente"}</div>
              <button
                onClick={() => setModalOpen(false)}
                style={{
                  border: "1px solid rgba(15,23,42,0.12)",
                  borderRadius: 14,
                  padding: "8px 10px",
                  cursor: "pointer",
                  background: "white",
                  fontWeight: 900,
                }}
              >
                Cerrar
              </button>
            </div>

            <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nombre completo"
                style={{
                  padding: "10px 12px",
                  borderRadius: 14,
                  border: "1px solid rgba(15,23,42,0.10)",
                  fontWeight: 700,
                }}
              />

              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Teléfono (opcional)"
                style={{
                  padding: "10px 12px",
                  borderRadius: 14,
                  border: "1px solid rgba(15,23,42,0.10)",
                  fontWeight: 700,
                }}
              />

              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email (opcional)"
                style={{
                  padding: "10px 12px",
                  borderRadius: 14,
                  border: "1px solid rgba(15,23,42,0.10)",
                  fontWeight: 700,
                }}
              />

              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notas (opcional)"
                style={{
                  padding: "10px 12px",
                  borderRadius: 14,
                  border: "1px solid rgba(15,23,42,0.10)",
                  fontWeight: 700,
                  minHeight: 90,
                  resize: "vertical",
                }}
              />

              <button
                onClick={saveClient}
                style={{
                  padding: "12px 14px",
                  borderRadius: 14,
                  border: "1px solid rgba(15,23,42,0.10)",
                  cursor: "pointer",
                  fontWeight: 980,
                  background: "linear-gradient(180deg,#111827,#0b1220)",
                  color: "white",
                  boxShadow: "0 12px 26px rgba(0,0,0,0.20)",
                }}
              >
                {editing ? "Guardar cambios" : "Crear cliente"}
              </button>

              {!editing && (
                <div style={{ color: "#64748b", fontSize: 12, fontWeight: 700 }}>
                  Tip: al crear el cliente podrás subir su foto con “Cambiar foto”.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div style={{ marginTop: 16 }}>
        <a href="/dashboard" style={{ color: "#0f172a", fontWeight: 900, textDecoration: "none" }}>
          ← volver al dashboard
        </a>
      </div>
    </div>
  );
}
