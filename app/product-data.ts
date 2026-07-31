export type ProductImage = { key: string; label: string; src: string };
export type ProductCategory = "Men" | "Women";
export type Product = { id: number; slug: string; name: string; price: number; color: string; category: ProductCategory; note: string; gallery: ProductImage[] };

export const products: Product[] = [
  {
    "id": 1,
    "slug": "allergic-to-people-tee",
    "name": "Allergic To People Tee",
    "price": 1499,
    "color": "Ecru / Blue Print",
    "category": "Women",
    "note": "Women's ecru oversized T-shirt with a bold blue chest print, clean back, ribbed neck and relaxed everyday drape.",
    "gallery": [
      {
        "key": "front",
        "label": "Front Print",
        "src": "/products/allergic-to-people-tee/front.jpg"
      },
      {
        "key": "back",
        "label": "Back",
        "src": "/products/allergic-to-people-tee/back.jpg"
      },
      {
        "key": "closeup-fabric",
        "label": "Print Detail",
        "src": "/products/allergic-to-people-tee/closeup-fabric.jpg"
      },
      {
        "key": "neck",
        "label": "Neck",
        "src": "/products/allergic-to-people-tee/neck.jpg"
      }
    ]
  },
  {
    "id": 2,
    "slug": "apologies-in-cash-tee",
    "name": "Apologies In Cash Tee",
    "price": 1499,
    "color": "White / Burgundy Print",
    "category": "Women",
    "note": "Women's white oversized T-shirt with a burgundy chest print, clean back, ribbed neck and relaxed everyday drape.",
    "gallery": [
      {
        "key": "front",
        "label": "Front Print",
        "src": "/products/apologies-in-cash-tee/front.jpg"
      },
      {
        "key": "back",
        "label": "Back",
        "src": "/products/apologies-in-cash-tee/back.jpg"
      },
      {
        "key": "closeup-fabric",
        "label": "Print Detail",
        "src": "/products/apologies-in-cash-tee/closeup-fabric.jpg"
      },
      {
        "key": "flatlay",
        "label": "Flatlay",
        "src": "/products/apologies-in-cash-tee/flatlay.jpg"
      }
    ]
  },
  {
    "id": 3,
    "slug": "born-to-slay-baby-tee",
    "name": "Born To Slay Baby Tee",
    "price": 1299,
    "color": "White / Burgundy Print",
    "category": "Women",
    "note": "Women's white baby tee with a burgundy serif chest print, clean back, ribbed neck and fitted everyday drape.",
    "gallery": [
      {
        "key": "front",
        "label": "Front Print",
        "src": "/products/born-to-slay-baby-tee/front.jpg"
      },
      {
        "key": "back",
        "label": "Back",
        "src": "/products/born-to-slay-baby-tee/back.jpg"
      },
      {
        "key": "flatlay",
        "label": "Flatlay",
        "src": "/products/born-to-slay-baby-tee/flatlay.jpg"
      },
      {
        "key": "closeup-fabric",
        "label": "Print Detail",
        "src": "/products/born-to-slay-baby-tee/closeup-fabric.jpg"
      }
    ]
  },
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
    "id": 5,
    "slug": "dump-him-crop-tee",
    "name": "Dump Him Crop Tee",
    "price": 1299,
    "color": "Black / White Print",
    "category": "Women",
    "note": "Women's black cropped T-shirt with a minimal white chest print, clean back, ribbed neck and fitted everyday drape.",
    "gallery": [
      {
        "key": "front",
        "label": "Front Print",
        "src": "/products/dump-him-crop-tee/front.jpg"
      },
      {
        "key": "back",
        "label": "Back",
        "src": "/products/dump-him-crop-tee/back.jpg"
      },
      {
        "key": "closeup-fabric",
        "label": "Print Detail",
        "src": "/products/dump-him-crop-tee/closeup-fabric.jpg"
      },
      {
        "key": "flatlay",
        "label": "Flatlay",
        "src": "/products/dump-him-crop-tee/flatlay.jpg"
      }
    ]
  },
  {
    "id": 6,
    "slug": "even-at-my-worst-tee",
    "name": "Even At My Worst Tee",
    "price": 1599,
    "color": "White / Red Print",
    "category": "Men",
    "note": "Oversized white T-shirt with a bold red front graphic, clean back, ribbed neck and premium everyday drape.",
    "gallery": [
      {
        "key": "front",
        "label": "Front Print",
        "src": "/products/even-at-my-worst-tee/front.jpg"
      },
      {
        "key": "back",
        "label": "Back",
        "src": "/products/even-at-my-worst-tee/back.jpg"
      },
      {
        "key": "closeup-fabric",
        "label": "Print Detail",
        "src": "/products/even-at-my-worst-tee/closeup-fabric.jpg"
      },
      {
        "key": "neck",
        "label": "Neck",
        "src": "/products/even-at-my-worst-tee/neck.jpg"
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
    "id": 9,
    "slug": "i-hate-explaining-tee",
    "name": "I Hate Explaining Tee",
    "price": 1599,
    "color": "White / Black Print",
    "category": "Men",
    "note": "Oversized white T-shirt with a bold black chest print, clean back, ribbed neck and relaxed premium drape.",
    "gallery": [
      {
        "key": "front",
        "label": "Front Print",
        "src": "/products/i-hate-explaining-tee/front.jpg"
      },
      {
        "key": "back",
        "label": "Back",
        "src": "/products/i-hate-explaining-tee/back.jpg"
      },
      {
        "key": "closeup-fabric",
        "label": "Print Detail",
        "src": "/products/i-hate-explaining-tee/closeup-fabric.jpg"
      },
      {
        "key": "neck",
        "label": "Neck",
        "src": "/products/i-hate-explaining-tee/neck.jpg"
      }
    ]
  },
  {
    "id": 10,
    "slug": "i-told-my-mom-tee",
    "name": "I Told My Mom Tee",
    "price": 1599,
    "color": "Black / Dust Pink Print",
    "category": "Men",
    "note": "Oversized black T-shirt with a dust-pink back graphic, plain front, ribbed neck and heavy everyday drape.",
    "gallery": [
      {
        "key": "back-lifestyle",
        "label": "Back Print",
        "src": "/products/i-told-my-mom-tee/back-lifestyle.jpg"
      },
      {
        "key": "front",
        "label": "Front",
        "src": "/products/i-told-my-mom-tee/front.jpg"
      },
      {
        "key": "back",
        "label": "Back Flatlay",
        "src": "/products/i-told-my-mom-tee/back.jpg"
      },
      {
        "key": "neck",
        "label": "Neck",
        "src": "/products/i-told-my-mom-tee/neck.jpg"
      }
    ]
  },
  {
    "id": 11,
    "slug": "literally-just-a-girl-tee",
    "name": "Literally Just A Girl Tee",
    "price": 1499,
    "color": "White / Burgundy Print",
    "category": "Women",
    "note": "Women's white oversized T-shirt with a burgundy serif chest print, clean back, ribbed neck and relaxed everyday drape.",
    "gallery": [
      {
        "key": "front",
        "label": "Front Print",
        "src": "/products/literally-just-a-girl-tee/front.jpg"
      },
      {
        "key": "back",
        "label": "Back",
        "src": "/products/literally-just-a-girl-tee/back.jpg"
      },
      {
        "key": "closeup-fabric",
        "label": "Print Detail",
        "src": "/products/literally-just-a-girl-tee/closeup-fabric.jpg"
      },
      {
        "key": "flatlay",
        "label": "Flatlay",
        "src": "/products/literally-just-a-girl-tee/flatlay.jpg"
      }
    ]
  },
  {
    "id": 12,
    "slug": "master-of-sarcasm-crop-tee",
    "name": "Master of Sarcasm Crop Tee",
    "price": 1299,
    "color": "White / Black Print",
    "category": "Women",
    "note": "Women's white cropped T-shirt with a bold black chest print, clean back, ribbed neck and relaxed everyday drape.",
    "gallery": [
      {
        "key": "front",
        "label": "Front Print",
        "src": "/products/master-of-sarcasm-crop-tee/front.jpg"
      },
      {
        "key": "back",
        "label": "Back",
        "src": "/products/master-of-sarcasm-crop-tee/back.jpg"
      },
      {
        "key": "closeup-fabric",
        "label": "Print Detail",
        "src": "/products/master-of-sarcasm-crop-tee/closeup-fabric.jpg"
      },
      {
        "key": "flatlay",
        "label": "Flatlay",
        "src": "/products/master-of-sarcasm-crop-tee/flatlay.jpg"
      }
    ]
  },
  {
    "id": 13,
    "slug": "milf-tee",
    "name": "MILF Tee",
    "price": 1599,
    "color": "White / Red Print",
    "category": "Men",
    "note": "Oversized white T-shirt with a bold red serif front graphic, clean back, ribbed neck and premium everyday drape.",
    "gallery": [
      {
        "key": "front",
        "label": "Front Print",
        "src": "/products/milf-tee/front.jpg"
      },
      {
        "key": "back",
        "label": "Back",
        "src": "/products/milf-tee/back.jpg"
      },
      {
        "key": "closeup-fabric",
        "label": "Print Detail",
        "src": "/products/milf-tee/closeup-fabric.jpg"
      },
      {
        "key": "neck",
        "label": "Neck",
        "src": "/products/milf-tee/neck.jpg"
      }
    ]
  },
  {
    "id": 14,
    "slug": "music-remembered-tee",
    "name": "Music Remembered Tee",
    "price": 1499,
    "color": "White / Black Back Print",
    "category": "Women",
    "note": "Women's white oversized T-shirt with a plain front, handwritten black back print, soft ribbed neck and relaxed everyday drape.",
    "gallery": [
      {
        "key": "front",
        "label": "Front",
        "src": "/products/music-remembered-tee/front.jpg"
      },
      {
        "key": "back",
        "label": "Back Print",
        "src": "/products/music-remembered-tee/back.jpg"
      },
      {
        "key": "neck",
        "label": "Neck",
        "src": "/products/music-remembered-tee/neck.jpg"
      },
      {
        "key": "flatlay",
        "label": "Flatlay",
        "src": "/products/music-remembered-tee/flatlay.jpg"
      }
    ]
  },
  {
    "id": 15,
    "slug": "my-cardio-tee",
    "name": "My Cardio Tee",
    "price": 1599,
    "color": "White / Burgundy Back Print",
    "category": "Men",
    "note": "Oversized white T-shirt with a clean plain front, burgundy back graphic, ribbed neck and relaxed premium drape.",
    "gallery": [
      {
        "key": "front",
        "label": "Front",
        "src": "/products/my-cardio-tee/front.jpg"
      },
      {
        "key": "back",
        "label": "Back Print",
        "src": "/products/my-cardio-tee/back.jpg"
      },
      {
        "key": "closeup-fabric",
        "label": "Print Detail",
        "src": "/products/my-cardio-tee/closeup-fabric.jpg"
      },
      {
        "key": "neck",
        "label": "Neck",
        "src": "/products/my-cardio-tee/neck.jpg"
      }
    ]
  },
  {
    "id": 16,
    "slug": "my-heart-says-yes-tee",
    "name": "My Heart Says Yes Tee",
    "price": 1599,
    "color": "Ecru / Burgundy Print",
    "category": "Men",
    "note": "Oversized ecru T-shirt with a burgundy serif chest print, clean back, ribbed neck and relaxed premium drape.",
    "gallery": [
      {
        "key": "front",
        "label": "Front Print",
        "src": "/products/my-heart-says-yes-tee/front.jpg"
      },
      {
        "key": "back",
        "label": "Back",
        "src": "/products/my-heart-says-yes-tee/back.jpg"
      },
      {
        "key": "closeup-fabric",
        "label": "Print Detail",
        "src": "/products/my-heart-says-yes-tee/closeup-fabric.jpg"
      },
      {
        "key": "neck",
        "label": "Neck",
        "src": "/products/my-heart-says-yes-tee/neck.jpg"
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
    "id": 18,
    "slug": "nothing-to-wear-tee",
    "name": "Nothing To Wear Tee",
    "price": 1599,
    "color": "Sand / Burgundy Print",
    "category": "Men",
    "note": "Oversized sand T-shirt with a burgundy serif front print, clean back, ribbed neck and relaxed premium drape.",
    "gallery": [
      {
        "key": "front",
        "label": "Front Print",
        "src": "/products/nothing-to-wear-tee/front.jpg"
      },
      {
        "key": "back",
        "label": "Back",
        "src": "/products/nothing-to-wear-tee/back.jpg"
      },
      {
        "key": "closeup-fabric",
        "label": "Print Detail",
        "src": "/products/nothing-to-wear-tee/closeup-fabric.jpg"
      },
      {
        "key": "neck",
        "label": "Neck",
        "src": "/products/nothing-to-wear-tee/neck.jpg"
      }
    ]
  },
  {
    "id": 19,
    "slug": "perfect-italian-tee",
    "name": "Perfect Italian Tee",
    "price": 1499,
    "color": "White / Black Print",
    "category": "Women",
    "note": "Women's white oversized T-shirt with a black serif chest print, relaxed everyday fit, clean back and soft ribbed neckline.",
    "gallery": [
      {
        "key": "front",
        "label": "Front Print",
        "src": "/products/perfect-italian-tee/front.jpg"
      },
      {
        "key": "back",
        "label": "Back",
        "src": "/products/perfect-italian-tee/back.jpg"
      },
      {
        "key": "closeup-fabric",
        "label": "Print Detail",
        "src": "/products/perfect-italian-tee/closeup-fabric.jpg"
      },
      {
        "key": "flatlay",
        "label": "Flatlay",
        "src": "/products/perfect-italian-tee/flatlay.jpg"
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
