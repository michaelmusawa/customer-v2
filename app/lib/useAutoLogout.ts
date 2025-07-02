// utils/useAutoLogout.ts
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const IDLE_TIMEOUT = 15 * 60 * 1000;

export function useAutoLogout() {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  const resetTimer = () => {
    if (timerRef.current !== null) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      // Call our API route
      try {
        await fetch("/api/logout", { method: "POST" });
      } catch (err) {
        console.error("Logout API failed", err);
      }
      // Then redirect
      router.push("/login?reason=inactive");
    }, IDLE_TIMEOUT);
  };

  // Set up event listeners to reset the timer on user activity
  useEffect(() => {
    const events = [
      "mousemove",
      "mousedown",
      "keydown",
      "touchstart",
      "scroll",
    ];
    events.forEach((e) => window.addEventListener(e, resetTimer));
    resetTimer();
    return () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
      events.forEach((e) => window.removeEventListener(e, resetTimer));
    };
  }, []);
}
