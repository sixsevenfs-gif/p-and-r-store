export type ProductImage = { key: string; label: string; src: string };
export type ProductCategory = "Men" | "Women";
export type Product = { id: number; slug: string; name: string; price: number; color: string; category: ProductCategory; note: string; gallery: ProductImage[] };

export const products: Product[] = [
  {
    "id": 4,
    "slug": "dont-call-me-lucky-tee",
    "name": "Dont Call Me Lucky Tee",
    "price": 1499,
    "color": "White",
    "category": "Men",
    "note": "Oversized T-shirt with a premium everyday fit, clean construction and detailed product photography.",
    "gallery": [
      {
        "key": "front",
        "label": "Front",
        "src": "/products/dont-call-me-lucky-tee/front.jpg"
      },
      {
        "key": "back",
        "label": "Back",
        "src": "/products/dont-call-me-lucky-tee/back.jpg"
      },
      {
        "key": "neck",
        "label": "Neck",
        "src": "/products/dont-call-me-lucky-tee/neck.jpg"
      },
      {
        "key": "flatlay",
        "label": "Flatlay",
        "src": "/products/dont-call-me-lucky-tee/flatlay.jpg"
      }
    ]
  },
  {
    "id": 7,
    "slug": "fall-in-love-tee",
    "name": "Fall In Love Tee",
    "price": 1499,
    "color": "White",
    "category": "Men",
    "note": "Oversized T-shirt with a premium everyday fit, clean construction and detailed product photography.",
    "gallery": [
      {
        "key": "front",
        "label": "Front",
        "src": "/products/fall-in-love-tee/front.jpg"
      },
      {
        "key": "back",
        "label": "Back",
        "src": "/products/fall-in-love-tee/back.jpg"
      },
      {
        "key": "neck",
        "label": "Neck",
        "src": "/products/fall-in-love-tee/neck.jpg"
      },
      {
        "key": "flatlay",
        "label": "Flatlay",
        "src": "/products/fall-in-love-tee/flatlay.jpg"
      }
    ]
  },
  {
    "id": 8,
    "slug": "hot-wife-tee",
    "name": "Hot Wife Tee",
    "price": 1499,
    "color": "White / Burgundy Print",
    "category": "Men",
    "note": "Oversized white T-shirt with a burgundy serif chest print, clean back, ribbed neck and relaxed drop shoulder.",
    "gallery": [
      {
        "key": "front",
        "label": "Front",
        "src": "/products/hot-wife-tee/front.jpg"
      },
      {
        "key": "back",
        "label": "Back",
        "src": "/products/hot-wife-tee/back.jpg"
      },
      {
        "key": "closeup-fabric",
        "label": "Fabric",
        "src": "/products/hot-wife-tee/closeup-fabric.jpg"
      },
      {
        "key": "neck",
        "label": "Neck",
        "src": "/products/hot-wife-tee/neck.jpg"
      }
    ]
  },
  {
    "id": 17,
    "slug": "need-money-for-porsche-tee",
    "name": "Need Money For Porsche Tee",
    "price": 1499,
    "color": "White",
    "category": "Men",
    "note": "Oversized T-shirt with a premium everyday fit, clean construction and detailed product photography.",
    "gallery": [
      {
        "key": "front",
        "label": "Front",
        "src": "/products/need-money-for-porsche-tee/front.jpg"
      },
      {
        "key": "back",
        "label": "Back",
        "src": "/products/need-money-for-porsche-tee/back.jpg"
      },
      {
        "key": "neck",
        "label": "Neck",
        "src": "/products/need-money-for-porsche-tee/neck.jpg"
      },
      {
        "key": "flatlay",
        "label": "Flatlay",
        "src": "/products/need-money-for-porsche-tee/flatlay.jpg"
      }
    ]
  },
  {
    "id": 20,
    "slug": "pre-rich-tee",
    "name": "Pre Rich Tee",
    "price": 1499,
    "color": "White",
    "category": "Men",
    "note": "Oversized T-shirt with a premium everyday fit, clean construction and detailed product photography.",
    "gallery": [
      {
        "key": "front",
        "label": "Front",
        "src": "/products/pre-rich-tee/front.jpg"
      },
      {
        "key": "back",
        "label": "Back",
        "src": "/products/pre-rich-tee/back.jpg"
      },
      {
        "key": "neck",
        "label": "Neck",
        "src": "/products/pre-rich-tee/neck.jpg"
      },
      {
        "key": "flatlay",
        "label": "Flatlay",
        "src": "/products/pre-rich-tee/flatlay.jpg"
      }
    ]
  },
  {
    "id": 21,
    "slug": "same-shit-different-day",
    "name": "Same Shit Different Day Tee",
    "price": 1499,
    "color": "White",
    "category": "Men",
    "note": "Oversized white T-shirt with a front statement print, clean back, ribbed neck and relaxed drop shoulder.",
    "gallery": [
      {
        "key": "front",
        "label": "Front",
        "src": "/products/same-shit-different-day/front.jpg"
      },
      {
        "key": "back",
        "label": "Back",
        "src": "/products/same-shit-different-day/back.jpg"
      },
      {
        "key": "neck",
        "label": "Neck",
        "src": "/products/same-shit-different-day/neck.jpg"
      },
      {
        "key": "flatlay",
        "label": "Flatlay",
        "src": "/products/same-shit-different-day/flatlay.jpg"
      }
    ]
  }
];
