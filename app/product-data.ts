export type ProductImage = { key: string; label: string; src: string };
export type ProductCategory = "Men" | "Women";
export type ProductVariant = { id: number; size: string; stock: number; price?: number | null };
export type Product = { id: number; slug: string; name: string; price: number; compareAtPrice?: number | null; newArrival?: boolean; color: string; category: ProductCategory; note: string; gallery: ProductImage[]; variantId?: number; selectedSize?: string; variants?: ProductVariant[]; editionNumber?: number | null; isUniqueFind?: boolean; lifetimeProductionCap?: number | null; availableStock?: number; uniqueFindStatus?: string };

export const products: Product[] = [
  {
    "id": 1,
    "editionNumber": 1,
    "slug": "allergic-to-people-tee",
    "name": "Allergic To People Tee",
    "price": 1299,
    "compareAtPrice": 1499,
    "newArrival": true,
    "color": "Ecru / Blue Print",
    "category": "Women",
    "note": "An ecru oversized tee with bold blue lettering across the chest. The plain back keeps the focus on the graphic; wear it loose over jeans for an easy everyday outfit.\n\n240 GSM, 100% super-combed cotton. Pre-shrunk and bio-washed, with a Lycra-ribbed neckline and double-stitched construction. Full-length, unisex oversized fit.",
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
    "editionNumber": 2,
    "slug": "apologies-in-cash-tee",
    "name": "Apologies In Cash Tee",
    "price": 1499,
    "compareAtPrice": null,
    "newArrival": true,
    "color": "White / Burgundy Print",
    "category": "Women",
    "note": "A white oversized tee with a compact burgundy statement across the chest. A clean back and roomy silhouette make it easy to pair with denim or relaxed trousers.\n\n240 GSM, 100% super-combed cotton. Pre-shrunk and bio-washed, with a Lycra-ribbed neckline and double-stitched construction. Full-length, unisex oversized fit.",
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
    "editionNumber": 3,
    "slug": "born-to-slay-baby-tee",
    "name": "Born To Slay Baby Tee",
    "price": 1299,
    "compareAtPrice": null,
    "newArrival": true,
    "color": "White / Burgundy Print",
    "category": "Women",
    "note": "A white fitted baby tee with burgundy lettering across the front and a plain back. Its closer silhouette pairs naturally with high-waisted denim or a skirt. This is a baby-tee fit, rather than the oversized cut.",
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
    "editionNumber": 4,
    "slug": "dont-call-me-lucky-tee",
    "name": "Dont Call Me Lucky Tee",
    "price": 1499,
    "compareAtPrice": null,
    "newArrival": true,
    "color": "White",
    "category": "Men",
    "note": "A white oversized tee with a plain front and a stacked black statement print on the back. The design puts the message behind you while keeping the front understated. Pair it with relaxed jeans or cargo trousers.\n\n240 GSM, 100% super-combed cotton. Pre-shrunk and bio-washed, with a Lycra-ribbed neckline and double-stitched construction. Full-length, unisex oversized fit.",
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
    "editionNumber": 5,
    "slug": "dump-him-crop-tee",
    "name": "Dump Him Crop Tee",
    "price": 1299,
    "compareAtPrice": null,
    "newArrival": true,
    "color": "Black / White Print",
    "category": "Women",
    "note": "A black fitted crop tee with a small white chest print and a clean back. The shorter hem works with high-waisted jeans, trousers or skirts. This style has a cropped silhouette.",
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
    "editionNumber": 6,
    "slug": "even-at-my-worst-tee",
    "name": "Even At My Worst Tee",
    "price": 1599,
    "compareAtPrice": null,
    "newArrival": false,
    "color": "White / Red Print",
    "category": "Men",
    "note": "A white oversized tee with a compact red front graphic and a plain back. The small-scale lettering adds a sharp accent to the relaxed silhouette. Wear it with dark denim or loose trousers.\n\n240 GSM, 100% super-combed cotton. Pre-shrunk and bio-washed, with a Lycra-ribbed neckline and double-stitched construction. Full-length, unisex oversized fit.",
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
    "editionNumber": 7,
    "slug": "fall-in-love-tee",
    "name": "Fall In Love Tee",
    "price": 1499,
    "compareAtPrice": null,
    "newArrival": false,
    "color": "White",
    "category": "Men",
    "note": "A white oversized tee with a clean front and a large burgundy text graphic on the back. The stacked lettering makes the rear view the focal point. Style it with plain trousers to let the print stand out.\n\n240 GSM, 100% super-combed cotton. Pre-shrunk and bio-washed, with a Lycra-ribbed neckline and double-stitched construction. Full-length, unisex oversized fit.",
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
    "editionNumber": 8,
    "slug": "hot-wife-tee",
    "name": "Hot Wife Tee",
    "price": 1499,
    "compareAtPrice": null,
    "newArrival": false,
    "color": "White / Burgundy Print",
    "category": "Men",
    "note": "A white oversized tee with a burgundy serif statement on the chest and a plain back. The compact typography gives the roomy silhouette a playful detail; pair it with denim or casual shorts.\n\n240 GSM, 100% super-combed cotton. Pre-shrunk and bio-washed, with a Lycra-ribbed neckline and double-stitched construction. Full-length, unisex oversized fit.",
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
    "editionNumber": 9,
    "slug": "i-hate-explaining-tee",
    "name": "I Hate Explaining Tee",
    "price": 1599,
    "compareAtPrice": null,
    "newArrival": false,
    "color": "White / Black Print",
    "category": "Men",
    "note": "A white oversized tee with bold black lettering arranged across the chest. The plain back balances the direct front statement. A straightforward piece for jeans, cargos and off-duty layering.\n\n240 GSM, 100% super-combed cotton. Pre-shrunk and bio-washed, with a Lycra-ribbed neckline and double-stitched construction. Full-length, unisex oversized fit.",
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
    "editionNumber": 10,
    "slug": "i-told-my-mom-tee",
    "name": "I Told My Mom Tee",
    "price": 1599,
    "compareAtPrice": null,
    "newArrival": false,
    "color": "Black / Dust Pink Print",
    "category": "Men",
    "note": "A black oversized tee with an understated plain front and a soft pink text graphic on the back. The contrasting lettering makes the rear print the main feature. Wear it with dark denim for a tonal outfit.\n\n240 GSM, 100% super-combed cotton. Pre-shrunk and bio-washed, with a Lycra-ribbed neckline and double-stitched construction. Full-length, unisex oversized fit.",
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
    "editionNumber": 11,
    "slug": "literally-just-a-girl-tee",
    "name": "Literally Just A Girl Tee",
    "price": 1499,
    "compareAtPrice": null,
    "newArrival": false,
    "color": "White / Burgundy Print",
    "category": "Women",
    "note": "A white oversized tee with a small burgundy chest statement and a plain back. The restrained print leaves plenty of clean space around the lettering. Wear it loose or tuck it into your favourite jeans.\n\n240 GSM, 100% super-combed cotton. Pre-shrunk and bio-washed, with a Lycra-ribbed neckline and double-stitched construction. Full-length, unisex oversized fit.",
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
    "editionNumber": 12,
    "slug": "master-of-sarcasm-crop-tee",
    "name": "Master of Sarcasm Crop Tee",
    "price": 1299,
    "compareAtPrice": null,
    "newArrival": false,
    "color": "White / Black Print",
    "category": "Women",
    "note": "A white relaxed crop tee with bold black chest lettering and a plain back. Its boxier, shorter silhouette pairs with high-waisted trousers or shorts. This style is cropped rather than full length.",
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
    "editionNumber": 13,
    "slug": "milf-tee",
    "name": "MILF Tee",
    "price": 1599,
    "compareAtPrice": null,
    "newArrival": false,
    "color": "White / Red Print",
    "category": "Men",
    "note": "A white oversized tee with large red serif lettering and a smaller black caption on the front. The clean back keeps the attention on the contrasting chest graphic. Pair it with simple denim or trousers.\n\n240 GSM, 100% super-combed cotton. Pre-shrunk and bio-washed, with a Lycra-ribbed neckline and double-stitched construction. Full-length, unisex oversized fit.",
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
    "editionNumber": 14,
    "slug": "music-remembered-tee",
    "name": "Music Remembered Tee",
    "price": 1499,
    "compareAtPrice": null,
    "newArrival": false,
    "color": "White / Black Back Print",
    "category": "Women",
    "note": "A white oversized tee with a plain front and handwritten-style black lettering on the back. The music-themed rear graphic adds character without crowding the front. An easy match for jeans and everyday layers.\n\n240 GSM, 100% super-combed cotton. Pre-shrunk and bio-washed, with a Lycra-ribbed neckline and double-stitched construction. Full-length, unisex oversized fit.",
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
    "editionNumber": 15,
    "slug": "my-cardio-tee",
    "name": "My Cardio Tee",
    "price": 1599,
    "compareAtPrice": null,
    "newArrival": false,
    "color": "White / Burgundy Back Print",
    "category": "Men",
    "note": "A white oversized tee with a plain front and a bold burgundy statement on the back. The larger rear lettering is balanced by a smaller caption. Wear it with loose denim for a relaxed everyday outfit.\n\n240 GSM, 100% super-combed cotton. Pre-shrunk and bio-washed, with a Lycra-ribbed neckline and double-stitched construction. Full-length, unisex oversized fit.",
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
    "editionNumber": 16,
    "slug": "my-heart-says-yes-tee",
    "name": "My Heart Says Yes Tee",
    "price": 1599,
    "compareAtPrice": null,
    "newArrival": false,
    "color": "Ecru / Burgundy Print",
    "category": "Men",
    "note": "An ecru oversized tee with a small burgundy statement across the chest and a clean back. The warm neutral base and compact typography keep the look understated. Pair it with blue denim or darker trousers.\n\n240 GSM, 100% super-combed cotton. Pre-shrunk and bio-washed, with a Lycra-ribbed neckline and double-stitched construction. Full-length, unisex oversized fit.",
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
    "editionNumber": 17,
    "slug": "need-money-for-porsche-tee",
    "name": "Need Money For Porsche Tee",
    "price": 1499,
    "compareAtPrice": null,
    "newArrival": false,
    "color": "White",
    "category": "Men",
    "note": "A white oversized tee with a clean front and an expressive black text graphic on the back. The stacked handwritten-style lettering gives the design its character. Keep the rest of the outfit simple with jeans or cargos.\n\n240 GSM, 100% super-combed cotton. Pre-shrunk and bio-washed, with a Lycra-ribbed neckline and double-stitched construction. Full-length, unisex oversized fit.",
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
    "editionNumber": 18,
    "slug": "nothing-to-wear-tee",
    "name": "Nothing To Wear Tee",
    "price": 1599,
    "compareAtPrice": null,
    "newArrival": false,
    "color": "Sand / Burgundy Print",
    "category": "Men",
    "note": "A sand-coloured oversized tee with a small burgundy front statement and a plain back. The neutral base makes it easy to repeat with black trousers, denim or shorts; the chest print adds a wry finishing detail.\n\n240 GSM, 100% super-combed cotton. Pre-shrunk and bio-washed, with a Lycra-ribbed neckline and double-stitched construction. Full-length, unisex oversized fit.",
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
    "editionNumber": 19,
    "slug": "perfect-italian-tee",
    "name": "Perfect Italian Tee",
    "price": 1499,
    "compareAtPrice": null,
    "newArrival": false,
    "color": "White / Black Print",
    "category": "Women",
    "note": "A white oversized tee with black serif lettering across the chest and a clean back. The simple two-colour design works with denim, shorts or relaxed trousers. Wear it loose for the intended easy silhouette.\n\n240 GSM, 100% super-combed cotton. Pre-shrunk and bio-washed, with a Lycra-ribbed neckline and double-stitched construction. Full-length, unisex oversized fit.",
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
    "editionNumber": 20,
    "slug": "pre-rich-tee",
    "name": "Pre Rich Tee",
    "price": 1499,
    "compareAtPrice": null,
    "newArrival": false,
    "color": "White",
    "category": "Men",
    "note": "A white oversized tee with a large black handwritten-style statement on the front. The stacked lettering is the focal point, with a plain back to balance it. Pair it with relaxed jeans or casual trousers.\n\n240 GSM, 100% super-combed cotton. Pre-shrunk and bio-washed, with a Lycra-ribbed neckline and double-stitched construction. Full-length, unisex oversized fit.",
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
    "editionNumber": 21,
    "slug": "same-shit-different-day",
    "name": "Same Shit Different Day Tee",
    "price": 1499,
    "compareAtPrice": null,
    "newArrival": false,
    "color": "White",
    "category": "Men",
    "note": "A white oversized tee with a two-line black serif statement on the chest and a plain back. The clean typography gives this everyday piece a direct, understated look. Wear it with denim or loose trousers.\n\n240 GSM, 100% super-combed cotton. Pre-shrunk and bio-washed, with a Lycra-ribbed neckline and double-stitched construction. Full-length, unisex oversized fit.",
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
