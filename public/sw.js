// Service worker panelu: powiadomienia o nowych wizytach i licznik na ikonie aplikacji.
self.addEventListener("push", (event) => {
  const d = event.data ? event.data.json() : {};
  const jobs = [
    self.registration.showNotification(d.title || "Nowa wizyta", {
      body: d.body || "",
      icon: "/icon-192.png",
      badge: "/favicon-32.png",
      tag: "wizyty-" + Date.now(),
      data: { url: "/panel" },
    }),
  ];
  if (d.count && self.navigator.setAppBadge) jobs.push(self.navigator.setAppBadge(d.count).catch(() => {}));
  event.waitUntil(Promise.all(jobs));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      const open = list.find((c) => new URL(c.url).pathname.startsWith("/panel"));
      if (open) return open.navigate("/panel").then((c) => c && c.focus());
      return self.clients.openWindow("/panel");
    }),
  );
});
