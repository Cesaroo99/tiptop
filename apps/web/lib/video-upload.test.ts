import { describe, expect, it } from "vitest";
import { extFromFilename, resolveVideoExt, safeUploadName, sniffVideoExt } from "./video-upload";

describe("upload vidéo mood", () => {
  it("accepte un 3gp, un type vide et un mp4 sniffé", () => {
    expect(resolveVideoExt({ type: "video/3gpp", name: "clip.3gp" }, new Uint8Array())).toBe("3gp");
    expect(resolveVideoExt({ type: "", name: "clip.webm" }, new Uint8Array())).toBe("webm");
    const ftyp = new Uint8Array([0, 0, 0, 24, 102, 116, 121, 112, 105, 115, 111, 109]);
    expect(sniffVideoExt(ftyp)).toBe("mp4");
    expect(resolveVideoExt({ type: "application/octet-stream", name: "mood" }, ftyp)).toBe("mp4");
    expect(extFromFilename("a.MOV")).toBe("mov");
    expect(safeUploadName("not-a-file.mp4")).toBeNull();
    expect(safeUploadName("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee.mp4")).toBe(
      "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee.mp4",
    );
  });
});
