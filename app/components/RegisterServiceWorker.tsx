"use client";

import { useEffect } from "react";

export default function RegisterServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    if (process.env.NODE_ENV !== "production") {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => registration.unregister());
      });
      if ("caches" in window) {
        caches.keys().then((keys) => {
          keys.filter((key) => key.startsWith("good-times-")).forEach((key) => caches.delete(key));
        });
      }
      return;
    }

    navigator.serviceWorker.register("/sw.js").catch(() => {
      // 离线能力注册失败不影响日志的本地记录。
    });
  }, []);

  return null;
}
