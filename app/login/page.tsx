"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@estudio.com");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const onLogin = async () => {
    setLoading(true);
    setMsg("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setMsg("❌ " + error.message);
      return;
    }

    setMsg("✅ Login correcto");
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md border rounded-lg p-6">
        <h1 className="text-2xl font-semibold text-center">Iniciar Sesión</h1>
        <p className="text-center text-sm text-gray-500 mt-1">
          Acceso exclusivo para administradores
        </p>

        <div className="mt-6 space-y-4">
          <div>
            <label className="text-sm font-medium">Email</label>
            <input
              className="w-full border rounded-md px-3 py-2 mt-1"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@estudio.com"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Contraseña</label>
            <input
              className="w-full border rounded-md px-3 py-2 mt-1"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="********"
            />
          </div>

          {msg && <p className="text-sm">{msg}</p>}

          <button
            onClick={onLogin}
            disabled={loading}
            className="w-full border rounded-md py-2 font-medium"
          >
            {loading ? "Ingresando..." : "Iniciar Sesión"}
          </button>
        </div>
      </div>
    </div>
  );
}
