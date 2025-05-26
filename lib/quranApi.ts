// Utility for Quran Image API backend calls
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

export async function fetchAyahImage(sura: number, ayah: number): Promise<string> {
  // Returns image URL
  return `${API_BASE_URL}/ayah-image?sura=${sura}&ayah=${ayah}`;
}

export async function fetchSurahImage(sura: number): Promise<string> {
  return `${API_BASE_URL}/surah-image?sura=${sura}`;
}

export async function fetchMetadata() {
  const res = await fetch(`${API_BASE_URL}/metadata`);
  if (!res.ok) throw new Error("Failed to fetch metadata");
  return res.json();
}

export async function generateCompositeImage(sura: number, ayah: number, backgroundFile?: File | Blob, scaleFactor = 0.7): Promise<string> {
  const formData = new FormData();
  formData.append("sura", String(sura));
  formData.append("ayah", String(ayah));
  formData.append("scaleFactor", String(scaleFactor));
  if (backgroundFile) {
    formData.append("background", backgroundFile);
  }
  const res = await fetch(`${API_BASE_URL}/generate-image`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error("Failed to generate image");
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}
