import JSZip from "jszip";
import type { GeneratedProject } from "@/generators/aiogram";

export async function buildProjectZip(project: GeneratedProject): Promise<Blob> {
  const zip = new JSZip();
  for (const file of project.files) zip.file(file.path, file.content);
  return zip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 6 } });
}
