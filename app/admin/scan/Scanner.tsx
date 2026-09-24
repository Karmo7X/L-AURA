"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Camera, LoaderCircle, Search } from "lucide-react";
import { findOrderByNumber } from "../actions";
import { field, fieldLabel, primaryButton } from "../styles";
import { UUID } from "@/lib/orders";

/** Chrome and Edge can read QR codes natively; other browsers get the fallback. */
interface DetectedBarcode {
  rawValue: string;
}
type BarcodeDetectorLike = { detect(source: CanvasImageSource): Promise<DetectedBarcode[]> };
declare global {
  interface Window {
    BarcodeDetector?: new (options?: { formats: string[] }) => BarcodeDetectorLike;
  }
}

/** Pull the order id out of a scanned /admin/pay/<id> link. */
function orderIdFrom(text: string) {
  const id = text.trim().split("/").pop()?.split("?")[0] ?? "";
  return UUID.test(id) ? id : null;
}

export function Scanner() {
  const router = useRouter();
  const video = useRef<HTMLVideoElement>(null);
  const [camera, setCamera] = useState<"idle" | "starting" | "on" | "unsupported" | "blocked">("idle");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // hold the camera only while this screen is open
  useEffect(() => {
    if (camera !== "starting") return;
    let stream: MediaStream | null = null;
    let stop = false;

    const run = async () => {
      if (!window.BarcodeDetector) {
        setCamera("unsupported");
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (stop) return;
        if (video.current) {
          video.current.srcObject = stream;
          await video.current.play();
        }
        setCamera("on");
        const detector = new window.BarcodeDetector({ formats: ["qr_code"] });
        const look = async () => {
          if (stop || !video.current) return;
          try {
            const [found] = await detector.detect(video.current);
            const id = found && orderIdFrom(found.rawValue);
            if (id) {
              stop = true;
              router.push(`/admin/pay/${id}`);
              return;
            }
          } catch {
            // a frame that couldn't be read — try the next one
          }
          window.setTimeout(look, 300);
        };
        look();
      } catch {
        setCamera("blocked");
      }
    };
    run();

    return () => {
      stop = true;
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [camera, router]);

  const lookUp = (formData: FormData) => {
    const number = Number(String(formData.get("order_number") ?? "").replace(/[^0-9]/g, ""));
    setError(null);
    startTransition(async () => {
      const result = await findOrderByNumber(number);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      router.push(`/admin/pay/${result.id}`);
    });
  };

  return (
    <div className="mt-6 grid gap-5">
      <div className="overflow-hidden rounded-2xl border border-espresso-800/10 bg-espresso-900">
        <div className="relative aspect-4/3 w-full">
          <video ref={video} playsInline muted className="h-full w-full object-cover" />
          {camera !== "on" && (
            <div className="absolute inset-0 grid place-items-center p-6 text-center text-linen">
              {camera === "idle" && (
                <button type="button" onClick={() => setCamera("starting")} className={primaryButton}>
                  <Camera className="h-4 w-4" aria-hidden />
                  Start the camera
                </button>
              )}
              {camera === "starting" && <LoaderCircle className="h-6 w-6 animate-spin" aria-label="Starting the camera" />}
              {camera === "unsupported" && (
                <p className="text-[14px] text-latte">
                  This browser can’t scan here. Use your phone’s camera on the guest’s code, or type the order number below.
                </p>
              )}
              {camera === "blocked" && (
                <p className="text-[14px] text-latte">
                  The camera is blocked. Allow it in your browser, or type the order number below.
                </p>
              )}
            </div>
          )}
          {camera === "on" && (
            <span aria-hidden className="pointer-events-none absolute inset-8 rounded-2xl border-2 border-peach/70" />
          )}
        </div>
      </div>

      <form action={lookUp} className="grid gap-2">
        <label className="grid gap-1.5">
          <span className={fieldLabel}>Or type the order number</span>
          <input name="order_number" inputMode="numeric" placeholder="1042" className={field} />
        </label>
        {error && (
          <p role="alert" className="rounded-lg bg-terracotta/10 px-3 py-2 text-[13px] text-amber-deep">
            {error}
          </p>
        )}
        <button type="submit" disabled={pending} className={primaryButton}>
          {pending ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden /> : <Search className="h-4 w-4" aria-hidden />}
          Find the order
        </button>
      </form>
    </div>
  );
}
