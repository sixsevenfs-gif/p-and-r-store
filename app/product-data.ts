export type ProductImage = { key: string; label: string; src: string };
export type Product = { id: number; slug: string; name: string; price: number; color: string; note: string; gallery: ProductImage[] };

export const products: Product[] = [
  {
    "id": 1,
    "slug": "even-at-my-worst-tee",
    "name": "Even At My Worst Tee",
    "price": 1599,
    "color": "White / Red Print",
    "note": "Oversized white T-shirt with a bold red front graphic, clean back, ribbed neck and premium everyday drape.",
    "gallery": [
      {
        "key": "front",
        "label": "Front Print",
        "src": "/products/even-at-my-worst-tee/front.png"
      },
      {
        "key": "back",
        "label": "Back",
        "src": "/products/even-at-my-worst-tee/back.png"
      },
      {
        "key": "closeup-fabric",
        "label": "Print Detail",
        "src": "/products/even-at-my-worst-tee/closeup-fabric.png"
      },
      {
        "key": "neck",
        "label": "Neck",
        "src": "/products/even-at-my-worst-tee/neck.png"
      }
    ]
  },
  {
    "id": 2,
    "slug": "hot-wife-tee",
    "name": "Hot Wife Tee",
    "price": 1499,
    "color": "White / Burgundy Print",
    "note": "Oversized white T-shirt with a burgundy serif chest print, clean back, ribbed neck and relaxed drop shoulder.",
    "gallery": [
      {
        "key": "front",
        "label": "Front",
        "src": "/products/hot-wife-tee/front.png"
      },
      {
        "key": "back",
        "label": "Back",
        "src": "/products/hot-wife-tee/back.png"
      },
      {
        "key": "closeup-fabric",
        "label": "Fabric",
        "src": "/products/hot-wife-tee/closeup-fabric.png"
      },
      {
        "key": "neck",
        "label": "Neck",
        "src": "/products/hot-wife-tee/neck.png"
      }
    ]
  },
  {
    "id": 3,
    "slug": "i-told-my-mom-tee",
    "name": "I Told My Mom Tee",
    "price": 1599,
    "color": "Black / Dust Pink Print",
    "note": "Oversized black T-shirt with a dust-pink back graphic, plain front, ribbed neck and heavy everyday drape.",
    "gallery": [
      {
        "key": "back-lifestyle",
        "label": "Back Print",
        "src": "/products/i-told-my-mom-tee/back-lifestyle.png"
      },
      {
        "key": "front",
        "label": "Front",
        "src": "/products/i-told-my-mom-tee/front.png"
      },
      {
        "key": "back",
        "label": "Back Flatlay",
        "src": "/products/i-told-my-mom-tee/back.png"
      },
      {
        "key": "neck",
        "label": "Neck",
        "src": "/products/i-told-my-mom-tee/neck.png"
      }
    ]
  },
  {
    "id": 4,
    "slug": "milf-tee",
    "name": "MILF Tee",
    "price": 1599,
    "color": "White / Red Print",
    "note": "Oversized white T-shirt with a bold red serif front graphic, clean back, ribbed neck and premium everyday drape.",
    "gallery": [
      {
        "key": "front",
        "label": "Front Print",
        "src": "/products/milf-tee/front.png"
      },
      {
        "key": "back",
        "label": "Back",
        "src": "/products/milf-tee/back.png"
      },
      {
        "key": "closeup-fabric",
        "label": "Print Detail",
        "src": "/products/milf-tee/closeup-fabric.png"
      },
      {
        "key": "neck",
        "label": "Neck",
        "src": "/products/milf-tee/neck.png"
      }
    ]
  },
  {
    "id": 5,
    "slug": "my-cardio-tee",
    "name": "My Cardio Tee",
    "price": 1599,
    "color": "White / Burgundy Back Print",
    "note": "Oversized white T-shirt with a clean plain front, burgundy back graphic, ribbed neck and relaxed premium drape.",
    "gallery": [
      {
        "key": "front",
        "label": "Front",
        "src": "/products/my-cardio-tee/front.png"
      },
      {
        "key": "back",
        "label": "Back Print",
        "src": "/products/my-cardio-tee/back.png"
      },
      {
        "key": "closeup-fabric",
        "label": "Print Detail",
        "src": "/products/my-cardio-tee/closeup-fabric.png"
      },
      {
        "key": "neck",
        "label": "Neck",
        "src": "/products/my-cardio-tee/neck.png"
      }
    ]
  },
  {
    "id": 6,
    "slug": "my-heart-says-yes-tee",
    "name": "My Heart Says Yes Tee",
    "price": 1599,
    "color": "Ecru / Burgundy Print",
    "note": "Oversized ecru T-shirt with a burgundy serif chest print, clean back, ribbed neck and relaxed premium drape.",
    "gallery": [
      {
        "key": "front",
        "label": "Front Print",
        "src": "/products/my-heart-says-yes-tee/front.png"
      },
      {
        "key": "back",
        "label": "Back",
        "src": "/products/my-heart-says-yes-tee/back.png"
      },
      {
        "key": "closeup-fabric",
        "label": "Print Detail",
        "src": "/products/my-heart-says-yes-tee/closeup-fabric.png"
      },
      {
        "key": "neck",
        "label": "Neck",
        "src": "/products/my-heart-says-yes-tee/neck.png"
      }
    ]
  },
  {
    "id": 7,
    "slug": "nothing-to-wear-tee",
    "name": "Nothing To Wear Tee",
    "price": 1599,
    "color": "Sand / Burgundy Print",
    "note": "Oversized sand T-shirt with a burgundy serif front print, clean back, ribbed neck and relaxed premium drape.",
    "gallery": [
      {
        "key": "front",
        "label": "Front Print",
        "src": "/products/nothing-to-wear-tee/front.png"
      },
      {
        "key": "back",
        "label": "Back",
        "src": "/products/nothing-to-wear-tee/back.png"
      },
      {
        "key": "closeup-fabric",
        "label": "Print Detail",
        "src": "/products/nothing-to-wear-tee/closeup-fabric.png"
      },
      {
        "key": "neck",
        "label": "Neck",
        "src": "/products/nothing-to-wear-tee/neck.png"
      }
    ]
  },
  {
    "id": 8,
    "slug": "same-shit-different-day",
    "name": "Same Shit Different Day Tee",
    "price": 1499,
    "color": "White",
    "note": "Oversized white T-shirt with a front statement print, clean back, ribbed neck and relaxed drop shoulder.",
    "gallery": [
      {
        "key": "front",
        "label": "Front",
        "src": "/products/same-shit-different-day/front.png"
      },
      {
        "key": "back",
        "label": "Back",
        "src": "/products/same-shit-different-day/back.png"
      },
      {
        "key": "neck",
        "label": "Neck",
        "src": "/products/same-shit-different-day/neck.png"
      },
      {
        "key": "flatlay",
        "label": "Flatlay",
        "src": "/products/same-shit-different-day/flatlay.png"
      }
    ]
  }
];
