import { expect, it, vi } from "vitest";
vi.mock("@serwist/next",()=>({default:()=> (config: unknown)=>config}));
import config from "../../next.config";

it("M4: todas las rutas reciben protección contra marcos, MIME incorrecto y permisos innecesarios", async () => {
  const grupos=await config.headers?.();
  const comunes=grupos?.find(g=>g.source==="/:path*")?.headers ?? [];
  const valores=Object.fromEntries(comunes.map(h=>[h.key.toLowerCase(),h.value]));
  expect(valores['x-frame-options']).toBe('DENY');
  expect(valores['x-content-type-options']).toBe('nosniff');
  expect(valores['content-security-policy']).toContain("frame-ancestors 'none'");
  expect(valores['content-security-policy']).toContain("object-src 'none'");
  expect(valores['permissions-policy']).toContain("microphone=(self)");
});
