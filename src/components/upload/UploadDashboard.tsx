"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type GameOption = { id: number; slug: string; name: string };

type UploadItem = {
  id: string;
  file: File;
  previewUrl: string;
  caption: string;
  status: "queued" | "uploading" | "done" | "error";
  errorMessage?: string;
};

const ACCEPTED_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

function readImageDimensions(
  file: File,
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read image dimensions"));
    };
    img.src = url;
  });
}

async function uploadOne(
  item: UploadItem,
  gameSlug: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const presignRes = await fetch("/api/upload/presign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gameSlug, contentType: item.file.type }),
    });

    if (!presignRes.ok) {
      const data = await presignRes.json().catch(() => ({}));
      return { ok: false, message: data?.error ?? "Could not get upload URL" };
    }

    const { uploadUrl, key, signature } = await presignRes.json();

    const putRes = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": item.file.type },
      body: item.file,
    });

    if (!putRes.ok) {
      return { ok: false, message: "Upload to storage failed" };
    }

    const { width, height } = await readImageDimensions(item.file);

    const completeRes = await fetch("/api/upload/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        gameSlug,
        r2Key: key,
        signature,
        width,
        height,
        caption: item.caption.trim() || null,
      }),
    });

    if (!completeRes.ok) {
      const data = await completeRes.json().catch(() => ({}));
      return { ok: false, message: data?.error ?? "Could not save screenshot" };
    }

    return { ok: true };
  } catch {
    return { ok: false, message: "Unexpected error during upload" };
  }
}

export function UploadDashboard() {
  const [games, setGames] = useState<GameOption[]>([]);
  const [selectedSlug, setSelectedSlug] = useState<string>("");
  const [items, setItems] = useState<UploadItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/games")
      .then((res) => res.json())
      .then((data) => {
        setGames(data.games ?? []);
        if (data.games?.length) setSelectedSlug(data.games[0].slug);
      })
      .catch(() => {
        // Leaves `games` empty; the picker will show "no games yet"
        // and the dropzone stays disabled rather than erroring loudly.
      });
  }, []);

  const addFiles = useCallback((fileList: FileList | File[]) => {
    const newItems: UploadItem[] = Array.from(fileList)
      .filter((file) => ACCEPTED_TYPES.has(file.type))
      .map((file) => ({
        id: `${file.name}-${file.size}-${Math.random().toString(36).slice(2)}`,
        file,
        previewUrl: URL.createObjectURL(file),
        caption: "",
        status: "queued" as const,
      }));

    setItems((prev) => [...prev, ...newItems]);
  }, []);

  function updateCaption(id: string, caption: string) {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, caption } : item)),
    );
  }

  // Revoke object URLs on unmount to avoid leaking memory across a
  // long upload session where many files get queued over time.
  useEffect(() => {
    return () => {
      items.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function startUploads() {
    const gameSlug = selectedSlug;
    if (!gameSlug) return;

    const queued = items.filter((item) => item.status === "queued");

    for (const item of queued) {
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, status: "uploading" } : i)),
      );

      const result = await uploadOne(item, gameSlug);

      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id
            ? result.ok
              ? { ...i, status: "done" }
              : { ...i, status: "error", errorMessage: result.message }
            : i,
        ),
      );
    }
  }

  function removeItem(id: string) {
    setItems((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((i) => i.id !== id);
    });
  }

  const queuedCount = items.filter((i) => i.status === "queued").length;
  const uploadingCount = items.filter((i) => i.status === "uploading").length;
  const isUploading = uploadingCount > 0;

  return (
    <div className="flex flex-col gap-8">
      <header>
        <p className="font-utility text-xs uppercase tracking-wider text-rust mb-2">
          archive access
        </p>
        <h1 className="font-display text-2xl font-semibold">add captures</h1>
      </header>

      <div className="flex flex-col gap-2">
        <label className="font-utility text-xs uppercase tracking-wider text-fade">
          game
        </label>
        {games.length === 0 ? (
          <p className="font-utility text-sm text-fade">
            no games in the archive yet — add one first.
          </p>
        ) : (
          <select
            value={selectedSlug}
            onChange={(e) => setSelectedSlug(e.target.value)}
            className="border border-tan bg-[#FBF8F0] px-3 py-2 font-utility text-sm focus:outline-none focus:border-rust"
          >
            {games.map((game) => (
              <option key={game.id} value={game.slug}>
                {game.name}
              </option>
            ))}
          </select>
        )}
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
        }}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-sm p-10 text-center cursor-pointer transition-colors ${
          isDragging ? "border-rust bg-[#FBF0EA]" : "border-tan bg-[#FBF8F0]"
        }`}
      >
        <p className="font-utility text-sm text-fade">
          drag screenshots here, or click to choose files
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {items.length > 0 ? (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 bg-card border border-card-border px-3 py-2.5"
              >
                <div className="relative w-24 aspect-video shrink-0 overflow-hidden border border-card-border bg-[#1c1a17]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.previewUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                  <span
                    className={`absolute bottom-1 left-1 font-utility text-[9px] px-1.5 py-0.5 rounded-sm ${
                      item.status === "done"
                        ? "bg-sage text-[#FBF8F0]"
                        : item.status === "error"
                          ? "bg-rust text-[#FBF8F0]"
                          : item.status === "uploading"
                            ? "bg-[#FBF8F0] text-ink"
                            : "bg-black/50 text-[#FBF8F0]"
                    }`}
                  >
                    {item.status}
                  </span>
                </div>

                <input
                  type="text"
                  value={item.caption}
                  onChange={(e) => updateCaption(item.id, e.target.value)}
                  disabled={item.status !== "queued"}
                  placeholder="add a caption (optional)"
                  className="flex-1 min-w-0 border border-tan bg-[#FBF8F0] px-3 py-2 font-display text-sm italic focus:outline-none focus:border-rust disabled:opacity-50"
                />

                {item.status === "queued" ? (
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    aria-label="Remove"
                    className="shrink-0 w-6 h-6 flex items-center justify-center bg-black/10 hover:bg-black/20 text-ink text-sm rounded-full"
                  >
                    &times;
                  </button>
                ) : null}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between font-utility text-xs text-fade">
            <span>
              {queuedCount} queued,{" "}
              {items.filter((i) => i.status === "done").length} done
              {items.some((i) => i.status === "error")
                ? `, ${items.filter((i) => i.status === "error").length} failed`
                : ""}
            </span>
            <button
              type="button"
              onClick={startUploads}
              disabled={queuedCount === 0 || isUploading || !selectedSlug}
              className="font-utility text-xs uppercase tracking-wider bg-ink text-paper px-4 py-2 disabled:opacity-40 transition-opacity"
            >
              {isUploading ? "uploading..." : `upload ${queuedCount || ""}`}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
