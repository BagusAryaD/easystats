const BASE = process.env.NEXT_PUBLIC_API_BASE ?? "";

export async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    let detail = res.statusText;
    try {
      const j = await res.json();
      detail = j.detail ?? j.error ?? JSON.stringify(j);
    } catch {
      /* body bukan JSON */
    }
    throw new Error(detail || "Terjadi kesalahan pada server.");
  }

  return (await res.json()) as T;
}
