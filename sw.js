const cacheName = 'offline-mode';
const filesToCache = [
  "./",
  "./android-chrome-192x192.png",
  "./android-chrome-512x512.png",
  "./apple-touch-icon.png",
  "./browserconfig.xml",
  "./favicon.ico",
  "./favicon-16x16.png",
  "./favicon-32x32.png",
  "./index.html",
  "./luckydraw-contohdata.xlsx",
  "./luckydraw-contohprizedata.xlsx",
  "./mstile-150x150.png",
  "./safari-pinned-tab.svg",
  "./site.webmanifest",
  "./assets/",
  "./assets/audio/",
  "./assets/audio/drum-roll.mp3",
  "./assets/audio/success-fanfare-n-applause-whistle.mp3",
  "./assets/css/",
  "./assets/css/font-open-sans.css",
  "./assets/css/style.css",
  "./assets/css/dist/",
  "./assets/css/dist/animate.min.css",
  "./assets/css/dist/bootstrap.min.css.map",
  "./assets/css/dist/bootstrap-5.3.3.min.css",
  "./assets/font-open-sans/",
  "./assets/font-open-sans/open-sans-v34-latin-300.woff",
  "./assets/font-open-sans/open-sans-v34-latin-300.woff2",
  "./assets/font-open-sans/open-sans-v34-latin-300italic.woff",
  "./assets/font-open-sans/open-sans-v34-latin-300italic.woff2",
  "./assets/font-open-sans/open-sans-v34-latin-500.woff",
  "./assets/font-open-sans/open-sans-v34-latin-500.woff2",
  "./assets/font-open-sans/open-sans-v34-latin-500italic.woff",
  "./assets/font-open-sans/open-sans-v34-latin-500italic.woff2",
  "./assets/font-open-sans/open-sans-v34-latin-600.woff",
  "./assets/font-open-sans/open-sans-v34-latin-600.woff2",
  "./assets/font-open-sans/open-sans-v34-latin-600italic.woff",
  "./assets/font-open-sans/open-sans-v34-latin-600italic.woff2",
  "./assets/font-open-sans/open-sans-v34-latin-700.woff",
  "./assets/font-open-sans/open-sans-v34-latin-700.woff2",
  "./assets/font-open-sans/open-sans-v34-latin-700italic.woff",
  "./assets/font-open-sans/open-sans-v34-latin-700italic.woff2",
  "./assets/font-open-sans/open-sans-v34-latin-800.woff",
  "./assets/font-open-sans/open-sans-v34-latin-800.woff2",
  "./assets/font-open-sans/open-sans-v34-latin-800italic.woff",
  "./assets/font-open-sans/open-sans-v34-latin-800italic.woff2",
  "./assets/font-open-sans/open-sans-v34-latin-italic.woff",
  "./assets/font-open-sans/open-sans-v34-latin-italic.woff2",
  "./assets/font-open-sans/open-sans-v34-latin-regular.woff",
  "./assets/font-open-sans/open-sans-v34-latin-regular.woff2",
  "./assets/img/",
  "./assets/img/background.jpg",
  "./assets/img/custom-background.jpg",
  "./assets/img/custom-event-logo.png",
  "./assets/img/event-logo.png",
  "./assets/js/",
  "./assets/js/confetti.js",
  "./assets/js/constants.js",
  "./assets/js/exportWinners.js",
  "./assets/js/script.js",
  "./assets/js/settings.js",
  "./assets/js/utils.js",
  "./assets/js/dist/",
  "./assets/js/dist/bootstrap.bundle.min.js.map",
  "./assets/js/dist/bootstrap-5.3.3.bundle.min.js",
  "./assets/js/dist/dayjs-locale-id-v1.11.13.js",
  "./assets/js/dist/dayjs-v1.11.13.min.js",
  "./assets/js/dist/sweetalert2@11.js",
  "./assets/js/dist/xlsx-v0.19.1.full.min.js",
]

// Cache all the files to make a PWA
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(cacheName).then(cache => {
      // Our application only has two files here index.html and site.webmanifest
      // but you can add more such as style.css as your app grows
      return cache.addAll(filesToCache);
    })
  );
});

// try to serve from the network first, 
// if not available, serve the cached file 
self.addEventListener('fetch', event => {

  // check if request is made by chrome extensions or web page
  // if request is made for web page url must contains http / https.
  // skip the request if request is not made with http or https protocol.
  // also skip if request is not a get method
  if (!event.request.url.startsWith('http') || event.request.method.toUpperCase() !== "GET") return;

  // Open the cache
  event.respondWith(
    caches.open(cacheName)
      .then((cache) => {
        // Go to the network first
        return fetch(event.request.url).then((fetchedResponse) => {
          try {
            cache.put(event.request, fetchedResponse.clone());
          } catch (err) {
            console.log(err)
          }

          return fetchedResponse;
        }).catch(() => {
          // If the network is unavailable, get
          return cache.match(event.request.url);
        });
      })
  );
});


// intercept all fetch requests
// and check if we have cached the file
// if so it will serve the cached file
// self.addEventListener('fetch', event => {
//   event.respondWith(
//     caches.open(cacheName)
//       .then(cache => cache.match(event.request, { ignoreSearch: true }))
//       .then(response => {
//         return response || fetch(event.request);
//       })
//   );
// });