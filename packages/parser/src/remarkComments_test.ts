import { assertEquals } from "https://deno.land/std@0.204.0/assert/mod.ts";
import { parser } from "./index.ts";

Deno.test(async function remarkComments() {
  assertEquals(
    await parser(`
before%%comment%%after
`),
    "<p>beforeafter</p>",
  );
});

Deno.test(async function remarkComments() {
  assertEquals(
    await parser(`
text
`),
    "<p>text</p>",
  );
});

Deno.test(async function remarkComments() {
  assertEquals(
    await parser(`
%%%%
`),
    "",
  );
});

Deno.test(async function remarkComments() {
  assertEquals(
    await parser(`
%%text
`),
    "<p>text</p>",
  );
});

Deno.test(async function remarkComments() {
  assertEquals(
    await parser(`
%%*em*%%
`),
    "",
  );
});

Deno.test(async function remarkComments() {
  assertEquals(
    await parser(`
before%%comment*em*comment%%after
`),
    "<p>beforeafter</p>",
  );
});

Deno.test(async function remarkComments() {
  assertEquals(
    await parser(`
before%%comment\n*em*\ncomment%%after
`),
    "<p>beforeafter</p>",
  );
});
