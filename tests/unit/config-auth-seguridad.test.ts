import { readFileSync } from "node:fs";
import { expect, it } from "vitest";

it.each(["email","sms"])("M2/S02: Auth local exige demostrar posesión del %s",medio=>{
  const config=readFileSync(new URL('../../supabase/config.toml',import.meta.url),'utf8');
  const seccion=config.split(`[auth.${medio}]`)[1].split(/^\[/m)[0];
  expect(seccion).toMatch(/^enable_confirmations\s*=\s*true\s*$/m);
});
