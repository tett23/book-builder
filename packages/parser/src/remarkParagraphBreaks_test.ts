import { assertEquals } from "https://deno.land/std@0.204.0/assert/mod.ts";
import { parser } from "./mod.ts";

Deno.test(async function remarkParagraphBreask() {
  assertEquals(
    await parser(`
line
break
`),
    "<p>line</p>\n<p>break</p>",
  );
});

Deno.test(async function remarkParagraphBreask() {
  assertEquals(
    await parser(`
1
2
3`),
    "<p>1</p>\n<p>2</p>\n<p>3</p>",
  );
});

Deno.test(async function remarkParagraphBreask() {
  assertEquals(
    await parser(`line`),
    "<p>line</p>",
  );
});

Deno.test(async function remarkParagraphBreask2() {
  assertEquals(
    await parser(`*em*`),
    "<p><em>em</em></p>",
  );
});

Deno.test(async function remarkParagraphBreask() {
  assertEquals(
    await parser(`*e
m*`),
    "<p><em>e\nm</em></p>",
  );
});

Deno.test(async function remarkParagraphBreask() {
  assertEquals(
    await parser(`
`),
    "",
  );
});

Deno.test(async function remarkParagraphBreask() {
  assertEquals(
    await parser(`
1

2
`),
    "<p>1</p>\n<p>2</p>",
  );
});
