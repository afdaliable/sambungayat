// HEAD-check each candidate reciter folder against 001001.mp3; print working ones.
const CANDIDATES = [
  "Alafasy_128kbps",
  "Husary_128kbps",
  "Abdul_Basit_Murattal_192kbps",
  "Minshawy_Murattal_128kbps",
];

let failed = 0;
for (const folder of CANDIDATES) {
  const url = `https://everyayah.com/data/${folder}/001001.mp3`;
  try {
    const res = await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(20_000) });
    const type = res.headers.get("content-type");
    const ok = res.ok && (type?.includes("audio") ?? false);
    console.log(
      `${ok ? "OK  " : "FAIL"} ${folder} (${res.status}, ${type}, ${res.headers.get("content-length")} bytes)`,
    );
    if (!ok) failed++;
  } catch (err) {
    console.log(`FAIL ${folder} (${String(err)})`);
    failed++;
  }
}
process.exit(failed ? 1 : 0);
export {};
