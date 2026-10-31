const packageName = "@supabase/supabase-js";
const packageVersion = "2.118.0";
const packageRef = `${packageName}@${packageVersion}`;
const endpoint = new URL("https://bundlephobia.com/api/size");
endpoint.searchParams.set("package", packageRef);

try {
  const response = await fetch(endpoint, { signal: AbortSignal.timeout(60_000) });
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || `Bundlephobia returned HTTP ${response.status}.`);
  }
  if (typeof result.gzip !== "number" || typeof result.size !== "number") {
    throw new Error("Bundlephobia returned an unexpected response.");
  }

  const kilobytes = (bytes) => `${(bytes / 1024).toFixed(1)} KB`;
  console.log(`Bundlephobia report for ${packageRef}`);
  console.log(`Minified: ${kilobytes(result.size)}`);
  console.log(`Minified + gzip: ${kilobytes(result.gzip)}`);
  if (typeof result.dependencyCount === "number") {
    console.log(`Dependencies: ${result.dependencyCount}`);
  }
  console.log("This is the package estimate; Lighthouse measures the bytes actually loaded by Aura.");
} catch (error) {
  console.error(`Could not get the Bundlephobia report: ${error.message}`);
  process.exitCode = 1;
}
