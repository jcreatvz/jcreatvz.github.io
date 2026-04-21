/*
 * MEDIA WHEEL — Initialization
 * Host this file or inline it in a <script> tag BEFORE media-wheel-widget.js
 *
 * window.MEDIA_WHEEL_CONFIG  — override any setting (only include keys you want to change)
 * window.MEDIA_WHEEL_ITEMS   — replace the card items array entirely
 */

window.MEDIA_WHEEL_CONFIG = {
  bgColor: '#ff0000',
  animSpeed: 1.11,
  radius: 2.9,
  fov: 31,
  camY: 6.8,
  camZ: 12.8,
  cardW: 200,
  cardH: 149,
  cardRotX: 67,
  cardRotY: -117,
  cardRotZ: 57,
  showLabels: true,
  showPreview: true,
  showInfoBadge: true,
  showSelectorLine: true,
  selectorAngle: 325,
  animating: true,
  globalFit: 'cover',
  multiplier: 2,

  /* scroll-driven camera */
  scrollCamEnabled: true,
  scrollCamStart: 0,
  scrollCamEnd: 1,
  scrollStartCamY: 6.8,
  scrollEndCamY: 2,
  scrollStartCamZ: 12.8,
  scrollEndCamZ: 6.5,
  scrollStartFov: 31,
  scrollEndFov: 62
};

window.MEDIA_WHEEL_ITEMS = [
  {
    title: 'Aurelia fractalis',
    sub: 'photo sample',
    c: ['#e63946','#ff8a8a','#c0392b'],
    media: { type: 'image', url: 'https://images.unsplash.com/photo-1444464666168-49d633b86797?auto=format&fit=crop&w=1200&q=80' }
  },
  {
    title: 'Botanica mirabilis',
    sub: 'landscape sample',
    c: ['#457b9d','#88c4e8','#2980b9'],
    media: { type: 'image', url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80' }
  },
  {
    title: 'Motion sample',
    sub: 'autoplay muted loop',
    c: ['#1d3557','#7fb3ff','#457b9d'],
    media: { type: 'video', url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4' }
  },
  {
    title: 'Rosaflora quantica',
    sub: '63.88|76.40|4.4',
    c: ['#f48fb1','#ffb6d3','#e91e63']
  },
  {
    title: 'Heliopsis minoris',
    sub: '54.31|65.77|2.9',
    c: ['#fdd835','#fff9c4','#f9a825']
  },
  {
    title: 'Veloria noctiflora',
    sub: '88.99|45.31|0.6',
    c: ['#2e7d32','#81c784','#1b5e20']
  },
  {
    title: 'Chloranthus sporalis',
    sub: '18.06|23.05|1.2',
    c: ['#1565c0','#64b5f6','#0d47a1']
  },
  {
    title: 'Petalum obscura',
    sub: '45.10|42.63|8.7',
    c: ['#7b1fa2','#ce93d8','#4a148c']
  }
];
