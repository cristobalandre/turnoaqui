"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link"; // Importamos Link

export default function RequestsPage() {
  const supabase = createClient();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(false); // Nuevo estado para errores de sesión

  const fetchRequests = async () => {
    setLoading(true);
    setAuthError(false);

    // 1. Verificamos sesión SUAVEMENTE (sin redirect forzado)
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      setAuthError(true); // Marcamos error pero NO redirigimos automáticamente
      setLoading(false);
      return;
    }

    // 2. Si hay usuario, pedimos datos
    const { data, error } = await supabase
      .from("bookings")
      .select("*, rooms(name)")
      .eq("payment_status", "pending")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error cargando:", error);
    } else {
      setRequests(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // ACCIONES (Aprobar/Rechazar) - Igual que antes
  const handleApprove = async (id: string) => {
    if (!confirm("¿Confirmar reserva?")) return;
    const { error } = await supabase.from("bookings").update({ payment_status: "paid", color: "#10b981" }).eq("id", id);
    if (!error) setRequests((prev) => prev.filter((req) => req.id !== id));
  };

  const handleReject = async (id: string) => {
    if (!confirm("¿Eliminar solicitud?")) return;
    const { error } = await supabase.from("bookings").delete().eq("id", id);
    if (!error) setRequests((prev) => prev.filter((req) => req.id !== id));
  };

  // VISTA DE ERROR DE SESIÓN (Para romper el bucle)
  if (authError) {
    return (
      <div style={{ padding: 40, background: "#09090b", minHeight: "100vh", color: "white", textAlign: "center" }}>
        <h1 style={{ color: "#ef4444" }}>🔒 Acceso Denegado</h1>
        <p>No pudimos detectar tu sesión de administrador.</p>
        <div style={{ marginTop: 20 }}>
          <Link href="/login" style={{ background: "#3b82f6", padding: "10px 20px", borderRadius: 8, color: "white", textDecoration: "none", marginRight: 10 }}>
            Iniciar Sesión
          </Link>
          <Link href="/dashboard" style={{ background: "#333", padding: "10px 20px", borderRadius: 8, color: "white", textDecoration: "none" }}>
            Volver al Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 40, fontFamily: "sans-serif", maxWidth: 900, margin: "0 auto", minHeight: "100vh", background: "#09090b", color: "#fff" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 30, borderBottom: "1px solid #333", paddingBottom: 20 }}>
        <h1 style={{ fontSize: 28, margin: 0 }}>📥 Solicitudes Web</h1>
        <div style={{ display: "flex", gap: 10 }}>
            <Link href="/dashboard" style={{ background: "#333", border: "none", color: "white", padding: "8px 12px", borderRadius: 6, textDecoration: "none", fontSize: "14px" }}>
            ⬅ Volver
            </Link>
            <button onClick={fetchRequests} style={{ background: "#3b82f6", border: "none", color: "white", padding: "8px 12px", borderRadius: 6, cursor: "pointer" }}>
            🔄 Actualizar
            </button>
        </div>
      </div>

      {loading ? (
        <p>Cargando...</p>
      ) : requests.length === 0 ? (
        <div style={{ padding: 50, textAlign: "center", color: "#888", background: "#111", borderRadius: 12, border: "1px dashed #333" }}>
          ✅ No hay solicitudes pendientes.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
          {requests.map((req) => (
            <div key={req.id} style={{ background: "#1e1e1e", padding: 20, borderRadius: 12, border: "1px solid #333", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 20 }}>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: "0 0 5px 0", color: "#fff", fontSize: 18 }}>{req.client_name || "Cliente Web"}</h3>
                <div style={{ fontSize: 14, color: "#aaa" }}>
                    📅 {format(new Date(req.start_at), "PPP p", { locale: es })}
                    <br/>
                    <span style={{color: "#3b82f6"}}>{req.rooms?.name}</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => handleReject(req.id)} style={{ padding: "8px 16px", background: "transparent", border: "1px solid #ef4444", color: "#ef4444", borderRadius: 6, cursor: "pointer" }}>Rechazar</button>
                <button onClick={() => handleApprove(req.id)} style={{ padding: "8px 16px", background: "#10b981", border: "none", color: "#000", borderRadius: 6, cursor: "pointer", fontWeight: "bold" }}>Aprobar</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}