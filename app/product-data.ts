export type ProductImage = { key: string; label: string; src: string };
export type Product = { id: number; slug: string; name: string; price: number; color: string; note: string; gallery: ProductImage[] };

export const products: Product[] = [
  {
    "id": 1,
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
    "id": 2,
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
