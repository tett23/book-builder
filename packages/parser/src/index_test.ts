import { assertEquals } from "https://deno.land/std@0.204.0/assert/mod.ts";
import { parser } from "./mod.ts";

Deno.test(async function helloWorld() {
  assertEquals(await parser("# hello world"), "<h1>hello world</h1>");
});
