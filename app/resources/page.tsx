"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Room = {
  id: string;
  name: string;
  org_id: string;
  created_at?: string;
};

const ORG_ID = "a573aa05-d62b-44c7-a878-b9138902a094";

export default function ResourcesPage() {
  const [loading, setLoading] = useState(true);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [newName, setNewName] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const canAdd = useMemo(() => newName.trim().length >= 2, [newName]);

  async function loadRooms() {
    setLoading(true);

    const { data, error } = await supabase
      .from("rooms")
      .select("*")
      .eq("org_id", ORG_ID)
      .order("created_at", { ascending: true });

    if (error) {
      alert("Error cargando recursos: " + error.message);
      setLoading(false);
      return;
    }

    setRooms((data || []) as Room[]);
    setLoading(false);
  }

  useEffect(() => {
    loadRooms();
  }, []);

  async function addRoom() {
    const name = newName.trim();
    if (!name) return;

    const { error } = await supabase.from("rooms").insert([
      {
        name,
        org_id: ORG_ID,
      },
    ]);

    if (error) {
      alert("Error creando recurso: " + error.message);
      return;
    }

    setNewName("");
    await loadRooms();
  }

  function startEdit(room: Room) {
    setEditingId(room.id);
    setEditingName(room.name);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditingName("");
  }

  async function saveEdit(roomId: string) {
    const name = editingName.trim();
    if (name.length < 2) {
      alert("El nombre debe tener al menos 2 caracteres.");
      return;
    }

    const { error } = await supabase
      .from("rooms")
      .update({ name })
      .eq("id", roomId)
      .eq("org_id", ORG_ID);

    if (error) {
      alert("Error editando recurso: " + error.message);
      return;
    }

    cancelEdit();
    await loadRooms();
  }

  async function deleteRoom(roomId: string) {
    const ok = confirm("¿Eliminar este recurso? (Esto puede afectar reservas)");
    if (!ok) return;

    const { error } = await supabase
      .from("rooms")
      .delete()
      .eq("id", roomId)
      .eq("org_id", ORG_ID);

    if (error) {
      alert("Error eliminando recurso: " + error.message);
      return;
    }

    await loadRooms();
  }

  return (
    <div style={{ padding: 24, maxWidth: 900 }}>
      <h1 style={{ margin: 0 }}>Recursos</h1>
      <p style={{ marginTop: 6, opacity: 0.7 }}>
        Recursos = salas / sillones / boxes (lo que se agenda).
      </p>

      {/* Add */}
      <div
        style={{
          display: "flex",
          gap: 10,
          marginTop: 16,
          alignItems: "center",
        }}
      >
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Ej: Estudio 4 / Sillón 2 / Box 1"
          style={{
            flex: 1,
            padding: "10px 12px",
            border: "1px solid #ddd",
            borderRadius: 10,
          }}
        />
        <button
          onClick={addRoom}
          disabled={!canAdd}
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            border: "1px solid #ddd",
            background: canAdd ? "black" : "#eee",
            color: canAdd ? "white" : "#666",
            cursor: canAdd ? "pointer" : "not-allowed",
          }}
        >
          Agregar
        </button>
      </div>

      {/* List */}
      <div
        style={{
          marginTop: 18,
          border: "1px solid #eee",
          borderRadius: 14,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: 12,
            borderBottom: "1px solid #eee",
            fontWeight: 600,
            background: "#fafafa",
          }}
        >
          Lista de recursos
        </div>

        {loading ? (
          <div style={{ padding: 12, opacity: 0.7 }}>Cargando...</div>
        ) : rooms.length === 0 ? (
          <div style={{ padding: 12, opacity: 0.7 }}>
            No hay recursos aún. Agrega el primero arriba 👆
          </div>
        ) : (
          <div>
            {rooms.map((room) => {
              const isEditing = editingId === room.id;

              return (
                <div
                  key={room.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 10,
                    padding: 12,
                    borderBottom: "1px solid #f0f0f0",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    {isEditing ? (
                      <input
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          border: "1px solid #ddd",
                          borderRadius: 10,
                        }}
                      />
                    ) : (
                      <div style={{ fontWeight: 600 }}>{room.name}</div>
                    )}
                  </div>

                  <div style={{ display: "flex", gap: 8 }}>
                    {isEditing ? (
                      <>
                        <button
                          onClick={() => saveEdit(room.id)}
                          style={{
                            padding: "8px 12px",
                            borderRadius: 10,
                            border: "1px solid #ddd",
                            background: "black",
                            color: "white",
                            cursor: "pointer",
                          }}
                        >
                          Guardar
                        </button>
                        <button
                          onClick={cancelEdit}
                          style={{
                            padding: "8px 12px",
                            borderRadius: 10,
                            border: "1px solid #ddd",
                            background: "white",
                            cursor: "pointer",
                          }}
                        >
                          Cancelar
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => startEdit(room)}
                          style={{
                            padding: "8px 12px",
                            borderRadius: 10,
                            border: "1px solid #ddd",
                            background: "white",
                            cursor: "pointer",
                          }}
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => deleteRoom(room.id)}
                          style={{
                            padding: "8px 12px",
                            borderRadius: 10,
                            border: "1px solid #ddd",
                            background: "white",
                            cursor: "pointer",
                          }}
                        >
                          Eliminar
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div style={{ marginTop: 16 }}>
        <a href="/dashboard" style={{ fontSize: 14 }}>
          ← volver al dashboard
        </a>
      </div>
    </div>
  );
}
