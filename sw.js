const CACHE_NAME = "gleza-v1";

const APP_FILES = [
    "/",
    "/index.html",
    "/style.css",
    "/script.js",
    "/manifest.json",
    "/icon.svg"
];


/* =========================
   INSTALL
========================= */

self.addEventListener("install", (event) => {

    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(APP_FILES);
        })
    );

    self.skipWaiting();

});


/* =========================
   ACTIVATE
========================= */

self.addEventListener("activate", (event) => {

    event.waitUntil(

        caches.keys().then((cacheNames) => {

            return Promise.all(

                cacheNames
                    .filter((cacheName) => {
                        return cacheName !== CACHE_NAME;
                    })
                    .map((cacheName) => {
                        return caches.delete(cacheName);
                    })

            );

        })

    );

    self.clients.claim();

});


/* =========================
   FETCH
========================= */

self.addEventListener("fetch", (event) => {

    event.respondWith(

        fetch(event.request)
            .then((response) => {

                return response;

            })
            .catch(() => {

                return caches.match(event.request);

            })

    );

});


/* =========================
   PUSH NOTIFICATIONS
========================= */

self.addEventListener("push", (event) => {

    let data = {};

    try {

        data = event.data
            ? event.data.json()
            : {};

    } catch (error) {

        data = {
            title: "Gleza",
            body: "New funny stuff is waiting for you 😂"
        };

    }

    const title = data.title || "Gleza";

    const options = {

        body:
            data.body ||
            "New funny stuff is waiting for you 😂",

        icon: "/icon-192.png",

        badge: "/icon-192.png",

        data: {
            url: data.url || "/"
        }

    };

    event.waitUntil(

        self.registration.showNotification(
            title,
            options
        )

    );

});


/* =========================
   NOTIFICATION CLICK
========================= */

self.addEventListener(
    "notificationclick",
    (event) => {

        event.notification.close();

        const url =
            event.notification.data &&
            event.notification.data.url
                ? event.notification.data.url
                : "/";

        event.waitUntil(

            clients.matchAll({

                type: "window",

                includeUncontrolled: true

            }).then((clientList) => {

                for (const client of clientList) {

                    if (
                        client.url.includes(
                            self.location.origin
                        ) &&
                        "focus" in client
                    ) {

                        client.navigate(url);

                        return client.focus();

                    }

                }

                if (clients.openWindow) {

                    return clients.openWindow(url);

                }

            })

        );

    }
);