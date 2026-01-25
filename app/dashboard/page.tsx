export default function DashboardPage() {
  return (
    <div style={{ padding: 24 }}>
      <h1>Dashboard ✅</h1>
      <p>Ya estás adentro.</p>

      <div style={{ marginTop: 16, display: "flex", gap: 12 }}>
        <a href="/resources">Recursos</a>
        <a href="/staff">Staff</a>
        <a href="/services">Servicios</a>
        <a href="/calendar">Agenda</a>
      </div>
    </div>
  );
}
