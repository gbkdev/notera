/** The Notera mark: three coloured spines on indigo. Used for the favicon, app icons and home-screen icon. */
export function brandIcon(n: number, rounded = false) {
  const bar = Math.round(n * 0.12);
  const h = Math.round(n * 0.38);
  return (
    <div style={{ width: n, height: n, display: "flex", alignItems: "center", justifyContent: "center", gap: Math.round(n * 0.07), background: "#4A63F0", borderRadius: rounded ? Math.round(n * 0.22) : 0 }}>
      {["#E5484D", "#FFC83D", "#30A46C"].map((c) => (
        <div key={c} style={{ display: "flex", width: bar, height: h, background: c, borderRadius: Math.max(1, Math.round(bar / 3)) }} />
      ))}
    </div>
  );
}
