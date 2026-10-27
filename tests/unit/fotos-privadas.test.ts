import { beforeEach, it, expect, vi } from "vitest";
import { rutaFotoValida } from "@/lib/privacidad/foto";
const h = vi.hoisted(() => ({
  perfil: {
    id: "00000000-0000-4000-8000-000000000001",
    foto_path: "",
    identidad_visible: true,
  },
  sign: vi.fn().mockResolvedValue({
    data: { signedUrl: "https://storage.example/foto-firmada" },
  }),
  admin: vi.fn(),
}));
vi.mock("@/lib/demo", async (original) => ({
  ...(await original<typeof import("@/lib/demo")>()),
  MODO_DEMO: false,
}));
vi.mock("@/lib/supabase/admin", () => ({
  crearClienteAdmin: () => {
    h.admin();
    return { storage: { from: () => ({ createSignedUrl: h.sign }) } };
  },
}));
vi.mock("@/lib/supabase/server", () => ({
  crearClienteServidor: async () => ({
    auth: { getUser: async () => ({ data: { user: { id: "empresa" } } }) },
    from: (tabla: string) => {
      const chain: Record<string, unknown> = {};
      for (const k of ["select", "eq", "order", "limit", "maybeSingle"]) chain[k] = () => chain;
      chain.then = (resolve: (r: unknown) => unknown, reject: (e: unknown) => unknown) =>
        Promise.resolve({
          data: tabla === "company_talent_view" ? h.perfil : [],
        }).then(resolve, reject);
      return chain;
    },
  }),
}));
import { obtenerPerfil } from "@/lib/datos/consultas";
beforeEach(() => {
  h.admin.mockClear();
  h.sign.mockClear();
  h.perfil.foto_path = `${h.perfil.id}/foto.jpg`;
  h.perfil.identidad_visible = true;
});
it("firma solo una foto canónica del perfil cuya identidad está autorizada", async () => {
  const r = await obtenerPerfil(h.perfil.id);
  expect(r?.perfil.foto_url).toBe("https://storage.example/foto-firmada");
  expect(h.sign).toHaveBeenCalledWith(h.perfil.foto_path, 600);
});
it.each([
  "00000000-0000-4000-8000-000000000002/foto.jpg",
  "../foto.jpg",
  "https://ejemplo.com/foto.jpg",
  "00000000-0000-4000-8000-000000000001/%2e%2e.jpg",
])("no usa la llave de servicio para una ruta ajena o inválida: %s", async (ruta) => {
  h.perfil.foto_path = ruta;
  expect((await obtenerPerfil(h.perfil.id))?.perfil.foto_url).toBeNull();
  expect(h.admin).not.toHaveBeenCalled();
});
it("no firma una foto si no está autorizada la identidad, aunque la ruta sea propia", async () => {
  h.perfil.identidad_visible = false;
  expect((await obtenerPerfil(h.perfil.id))?.perfil.foto_url).toBeNull();
  expect(h.admin).not.toHaveBeenCalled();
});
it("rechaza rutas normalizables, subcarpetas, barras invertidas y extensiones activas", () => {
  for (const f of ["../foto.jpg", "carpeta/foto.jpg", "foto.svg", "foto.jpg?x=1", "foto%2ejpg", "foto\\otra.jpg"])
    expect(rutaFotoValida(h.perfil.id, `${h.perfil.id}/${f}`)).toBe(false);
});
