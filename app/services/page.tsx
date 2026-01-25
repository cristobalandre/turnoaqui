"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

const ORG_ID = "a573aa05-d62b-44c7-a878-b9138902a094"; // tu org fija

type Service = {
  id: string;
  name: string;
  duration_minutes: number;
  price: number;
  active: boolean;
};

export default function ServicesPage() {
  const [items, setItems] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  const [newName, setNewName] = useState("");
  const [newDuration, setNewDuration] = useState<number>(30);
  const [newPrice, setNewPrice] = useState<number>(0);
  const [saving, setSaving] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingDuration, setEditingDuration] = useState<number>(30);
  const [editingPrice, setEditingPrice] = useState<number>(0);
  const [editingActive, setEditingActive] = useState(true);

  const showError = (error: any, customMsg: string) => {
    console.error("SUPABASE ERROR:", error);
    alert(customMsg + "\n\n" + JSON.stringify(error, null, 2));
  };

  const load = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("services")
      .select("id,name,duration_minutes,price,active")
      .eq("org_id", ORG_ID)
      .order("created_at", { ascending: true });

    if (error) {
      showError(error, "Error cargando servicios");
    } else {
      setItems((data as Service[]) || []);
    }

    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const add = async () => {
    const name = newName.trim();
    if (!name) return;

    if (newDuration <= 0) {
      alert("La duración debe ser mayor a 0.");
      return;
    }

    setSaving(true);

    const { error } = await supabase.from("services").insert([
      {
        org_id: ORG_ID,
        name,
        duration_minutes: Number(newDuration),
        price: Number(newPrice),
        active: true,
      },
    ]);

    setSaving(false);

    if (error) {
      showError(error, "Error creando servicio");
      return;
    }

    setNewName("");
    setNewDuration(30);
    setNewPrice(0);
    load();
  };

  const startEdit = (s: Service) => {
    setEditingId(s.id);
    setEditingName(s.name);
    setEditingDuration(s.duration_minutes);
    setEditingPrice(s.price);
    setEditingActive(s.active);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName("");
    setEditingDuration(30);
    setEditingPrice(0);
    setEditingActive(true);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    const name = editingName.trim();
    if (!name) return;

    if (editingDuration <= 0) {
      alert("La duración debe ser mayor a 0.");
      return;
    }

    const { error } = await supabase
      .from("services")
      .update({
        name,
        duration_minutes: Number(editingDuration),
        price: Number(editingPrice),
        active: editingActive,
      })
      .eq("id", editingId)
      .eq("org_id", ORG_ID);

    if (error) {
      showError(error, "Error editando servicio");
      return;
    }

    cancelEdit();
    load();
  };

  const remove = async (s: Service) => {
    const ok = confirm(`¿Eliminar "${s.name}"?`);
    if (!ok) return;

    const { error } = await supabase
      .from("services")
      .delete()
      .eq("id", s.id)
      .eq("org_id", ORG_ID);

    if (error) {
      showError(error, "Error eliminando servicio");
      return;
    }

    load();
  };

  return (
    <div style={{ padding: 24, maxWidth: 900 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700 }}>Servicios</h1>
      <p style={{ color: "#666" }}>
        Servicios = lo que se agenda (corte, barba, grabación, mezcla, consulta, etc).
      </p>

      <div style={{ marginTop: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Ej: Corte, Barba, Grabación 1h"
          style={{
            flex: "1 1 260px",
            padding: "10px 12px",
            border: "1px solid #ddd",
            borderRadius: 8,
          }}
        />

        <input
          type="number"
          value={newDuration}
          onChange={(e) => setNewDuration(Number(e.target.value))}
          placeholder="Duración (min)"
          style={{
            width: 160,
            padding: "10px 12px",
            border: "1px solid #ddd",
            borderRadius: 8,
          }}
        />

        <input
          type="number"
          value={newPrice}
          onChange={(e) => setNewPrice(Number(e.target.value))}
          placeholder="Precio"
          style={{
            width: 160,
            padding: "10px 12px",
            border: "1px solid #ddd",
            borderRadius: 8,
          }}
        />

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

      <div style={{ marginTop: 18 }}>
        {loading ? (
          <p>Cargando...</p>
        ) : items.length === 0 ? (
          <p>No hay servicios aún.</p>
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
                  <div style={{ flex: 1, display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <input
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      style={{
                        flex: "1 1 220px",
                        padding: "10px 12px",
                        border: "1px solid #ddd",
                        borderRadius: 8,
                      }}
                    />

                    <input
                      type="number"
                      value={editingDuration}
                      onChange={(e) => setEditingDuration(Number(e.target.value))}
                      style={{
                        width: 160,
                        padding: "10px 12px",
                        border: "1px solid #ddd",
                        borderRadius: 8,
                      }}
                    />

                    <input
                      type="number"
                      value={editingPrice}
                      onChange={(e) => setEditingPrice(Number(e.target.value))}
                      style={{
                        width: 160,
                        padding: "10px 12px",
                        border: "1px solid #ddd",
                        borderRadius: 8,
                      }}
                    />

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
                    <div>
                      <div style={{ fontWeight: 700 }}>
                        {s.name} {!s.active ? "❌" : "✅"}
                      </div>
                      <div style={{ color: "#666", fontSize: 13 }}>
                        {s.duration_minutes} min · ${s.price}
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 8 }}>
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
