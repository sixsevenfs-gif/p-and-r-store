"use client";

import { AnimatePresence, motion, useScroll, useTransform } from "framer-motion";
import { ArrowLeft, ArrowRight, ChevronDown, Menu, Plus, Search, ShoppingBag, X } from "lucide-react";
import { useEffect, useState } from "react";

type ProductPhoto = { id: string; label: string; image: string; alt: string };
type Product = {
  id: number;
  name: string;
  price: number;
  color: string;
  image: string;
  image2: string;
  note: string;
  photos: ProductPhoto[];
};

const teePhotos: ProductPhoto[] = [
  { id: "front", label: "Front model", image: "/images/product/same-shit-front-model.png", alt: "Model front view wearing Same shit Different day oversized T-shirt" },
  { id: "back", label: "Back model", image: "/images/product/same-shit-back-model.png", alt: "Model back view wearing white oversized T-shirt" },
  { id: "print", label: "Print detail", image: "/images/product/same-shit-print-flatlay.png", alt: "White oversized T-shirt flat lay showing Same shit Different day print" },
  { id: "collar", label: "Collar detail", image: "/images/product/same-shit-collar-detail.png", alt: "Close detail of white T-shirt collar and fabric" },
];

const mainProduct: Product = {
  id: 1,
  name: "Same Shit Different Day Tee",
  price: 1499,
  color: "White",
  image: teePhotos[0].image,
  image2: teePhotos[1].image,
  note: "Single oversized white T-shirt with front chest print, relaxed drop shoulder, ribbed crew neck and clean back.",
  photos: teePhotos,
};

const products: Product[] = [mainProduct];

const fade = { initial: { opacity: 0, y: 28 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: "-10%" }, transition: { duration: .8, ease: [0.22, 1, 0.36, 1] as const } };

export default function Home() {
  const [view, setView] = useState<"home" | "collection" | "product" | "checkout">("home");
  const [selected, setSelected] = useState(products[0]);
  const [cart, setCart] = useState<Product[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [navSolid, setNavSolid] = useState(false);
  const { scrollYProgress } = useScroll();
  const heroScale = useTransform(scrollYProgress, [0, .16], [1.08, 1]);
  const heroOpacity = useTransform(scrollYProgress, [0, .13], [1, 0]);

  useEffect(() => { const onScroll = () => setNavSolid(scrollY > 60 || view !== "home"); onScroll(); addEventListener("scroll", onScroll); return () => removeEventListener("scroll", onScroll); }, [view]);
  const go = (next: typeof view) => { setView(next); setMenuOpen(false); scrollTo({ top: 0, behavior: "smooth" }); };
  const openProduct = (p: Product) => { setSelected(p); go("product"); };
  const add = (p = selected) => { setCart(c => [...c, p]); setCartOpen(true); };

  return <main>
    <header className={`nav ${navSolid ? "solid" : ""}`}>
      <button className="mobile-menu" aria-label="Open menu" onClick={() => setMenuOpen(true)}><Menu size={20}/></button>
      <nav className="nav-left"><button onClick={() => go("collection")}>Shop</button><button onClick={() => go("collection")}>Men</button><button onClick={() => go("collection")}>Women</button><button onClick={() => { go("home"); setTimeout(() => document.querySelector("#about")?.scrollIntoView({behavior:"smooth"}), 50); }}>About</button></nav>
      <button className="wordmark" onClick={() => go("home")} aria-label="P and R home">P<span>&</span>R</button>
      <nav className="nav-right"><button aria-label="Search"><Search size={18}/><span>Search</span></button><button onClick={() => setCartOpen(true)}><ShoppingBag size={18}/><span>Cart ({cart.length})</span></button><button className="account">Account</button></nav>
    </header>

    <AnimatePresence mode="wait">
      {view === "home" && <motion.div key="home" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
        <section className="hero">
          <motion.img style={{scale:heroScale}} src="/images/product/same-shit-front-model.png" alt="P&R Same Shit Different Day oversized tee campaign" />
          <div className="hero-shade"/>
          <motion.div className="hero-copy" style={{opacity:heroOpacity}} initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{duration:1.2,delay:.2}}>
            <p>Edition 001 / 2026</p><h1>Same Shit<br/>Different Day</h1><span>One tee. Four views.</span><button onClick={() => go("collection")}>Shop the tee <ArrowRight size={14}/></button>
          </motion.div>
          <div className="scroll-note">Scroll to discover <span/></div>
        </section>

        <motion.section className="manifesto" {...fade}><p>OUR POINT OF VIEW</p><h2>Designed to be felt,<br/>not announced.</h2><div><span>We make considered essentials for people who understand that presence doesn’t need permission.</span><button onClick={() => document.querySelector("#about")?.scrollIntoView({behavior:"smooth"})}>Read our story <ArrowRight size={14}/></button></div></motion.section>

        <section className="drop">
          <motion.div className="section-head" {...fade}><div><p>NEW DROP / 001</p><h2>{mainProduct.name}</h2></div><button onClick={() => go("collection")}>View product shots <ArrowRight size={14}/></button></motion.div>
          <div className="product-grid">{mainProduct.photos.slice(0,3).map((photo,i)=><ProductPhotoCard key={photo.id} photo={photo} i={i} open={()=>openProduct(mainProduct)} add={()=>add(mainProduct)}/>)}</div>
        </section>

        <section className="editorial-grid">
          <motion.button onClick={() => go("product")} className="editorial large" {...fade}><img src="/images/product/same-shit-back-model.png" alt="Back view of Same Shit Different Day tee"/><span><small>02 / BACK VIEW</small>Clean back. Oversized fall.<ArrowRight/></span></motion.button>
          <motion.button onClick={() => go("product")} className="editorial" {...fade}><img src="/images/product/same-shit-collar-detail.png" alt="Collar detail of white oversized tee"/><span><small>03 / COLLAR</small>Ribbed neck detail.<ArrowRight/></span></motion.button>
        </section>

        <section className="about" id="about"><motion.div {...fade}><p>P&R / THE STANDARD</p><h2>Less noise.<br/><em>More presence.</em></h2></motion.div><motion.div {...fade}><p>P&R was created around a simple belief: the things you wear most should be the things made best.</p><p>Our first study is one oversized T-shirt with a direct everyday statement, shown through the real views that matter: front, back, print and collar.</p><div className="facts"><span>Designed in India</span><span>Oversized fit</span><span>Single drop focus</span></div></motion.div></section>
        <Newsletter/>
      </motion.div>}

      {view === "collection" && <motion.div key="collection" className="collection-page" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
        <div className="collection-title"><p>PRODUCT / EDITION 001</p><h1>Same Shit<br/>Different Day</h1><span>One oversized tee, shown from every important angle.</span></div>
        <div className="filter-row"><span>{mainProduct.photos.length} product photos</span><div><button>Front</button><button>Back</button><button>Print</button><button>Details <ChevronDown size={13}/></button></div></div>
        <div className="product-grid collection-products">{mainProduct.photos.map((photo,i)=><ProductPhotoCard key={photo.id} photo={photo} i={i} open={()=>openProduct(mainProduct)} add={()=>add(mainProduct)}/>)}</div>
      </motion.div>}

      {view === "product" && <motion.div key="product" className="product-page" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
        <button className="back" onClick={() => go("collection")}><ArrowLeft size={15}/> Back to collection</button>
        <div className="gallery">{selected.photos.map(photo => <figure key={photo.id}><img src={photo.image} alt={photo.alt}/><figcaption>{photo.label}</figcaption></figure>)}</div>
        <ProductInfo product={selected} onAdd={() => add()} onBuy={() => { add(); setCartOpen(false); go("checkout"); }}/>
      </motion.div>}

      {view === "checkout" && <motion.div key="checkout" className="checkout" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
        <button className="back" onClick={() => setCartOpen(true)}><ArrowLeft size={15}/> Return to bag</button><p>SECURE CHECKOUT</p><h1>Finish your order</h1>
        <div className="checkout-grid"><form onSubmit={e=>e.preventDefault()}><label>Email address<input type="email" placeholder="you@example.com"/></label><h3>Delivery</h3><div className="split"><label>First name<input/></label><label>Last name<input/></label></div><label>Address<input/></label><div className="split"><label>City<input/></label><label>PIN code<input inputMode="numeric"/></label></div><button className="primary">Continue to payment</button></form><aside><h3>Your order</h3>{cart.map((p,i)=><div className="order-item" key={i}><img src={p.image}/><span>{p.name}<small>{p.color} / M</small></span><b>₹{p.price.toLocaleString("en-IN")}</b></div>)}<div className="total"><span>Total</span><b>₹{cart.reduce((s,p)=>s+p.price,0).toLocaleString("en-IN")}</b></div></aside></div>
      </motion.div>}
    </AnimatePresence>

    <Footer go={go}/>
    <AnimatePresence>{cartOpen && <Cart cart={cart} close={()=>setCartOpen(false)} remove={(i)=>setCart(c=>c.filter((_,x)=>x!==i))} checkout={()=>{setCartOpen(false);go("checkout")}}/>}</AnimatePresence>
    <AnimatePresence>{menuOpen && <motion.div className="menu" initial={{x:"-100%"}} animate={{x:0}} exit={{x:"-100%"}} transition={{ease:[.22,1,.36,1],duration:.55}}><button onClick={()=>setMenuOpen(false)}><X/></button><nav><button onClick={()=>go("collection")}>Shop</button><button onClick={()=>go("collection")}>Men</button><button onClick={()=>go("collection")}>Women</button><button onClick={()=>go("home")}>Campaign</button></nav><p>Less Noise. More Presence.</p></motion.div>}</AnimatePresence>
  </main>
}

function ProductPhotoCard({photo,i,open,add}:{photo:ProductPhoto,i:number,open:()=>void,add:()=>void}) { return <motion.article className={`product-card ${i===1?"offset":""}`} {...fade}><button className="product-image" onClick={open}><img src={photo.image} alt={photo.alt}/><span>View tee <ArrowRight size={14}/></span></button><div className="product-meta"><button onClick={open}><b>{photo.label}</b><small>{mainProduct.name}</small></button><span>₹{mainProduct.price.toLocaleString("en-IN")}</span><button className="quick" onClick={add}>Quick add</button></div></motion.article> }

function ProductInfo({product,onAdd,onBuy}:{product:Product,onAdd:()=>void,onBuy:()=>void}) { const [size,setSize]=useState("M"); const [open,setOpen]=useState("Details"); return <aside className="product-info"><p>EDITION 001</p><h1>{product.name}</h1><b>₹{product.price.toLocaleString("en-IN")}</b><span className="tax">Inclusive of all taxes</span><p className="description">An oversized study in proportion. Cut from dense combed cotton with dropped shoulders and a structured, easy drape.</p><div className="choice"><label>Colour <span>{product.color}</span></label><div className={`swatch ${product.color.includes("Bone")||product.color.includes("Ecru")?"light":""}`}/></div><div className="choice"><label>Size <button>Size guide</button></label><div className="sizes">{["XS","S","M","L","XL"].map(s=><button className={size===s?"selected":""} onClick={()=>setSize(s)} key={s}>{s}</button>)}</div></div><button className="primary" onClick={onAdd}>Add to bag</button><button className="secondary" onClick={onBuy}>Buy now</button><div className="accordions">{["Details","Shipping & returns","Care guide"].map(x=><div key={x}><button onClick={()=>setOpen(open===x?"":x)}>{x}<Plus size={15}/></button>{open===x&&<motion.p initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}}>{x==="Details"?product.note:x==="Care guide"?"Cold wash inside out. Do not tumble dry. Iron on reverse.":"Complimentary shipping across India. Easy returns within 7 days."}</motion.p>}</div>)}</div></aside> }

function Cart({cart,close,remove,checkout}:{cart:Product[],close:()=>void,remove:(i:number)=>void,checkout:()=>void}) { return <><motion.div className="scrim" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={close}/><motion.aside className="cart" initial={{x:"100%"}} animate={{x:0}} exit={{x:"100%"}} transition={{duration:.5,ease:[.22,1,.36,1]}}><header><span>Your bag / {cart.length}</span><button onClick={close}><X/></button></header>{!cart.length?<div className="empty"><ShoppingBag/><h2>Your bag is empty.</h2><button onClick={close}>Continue shopping</button></div>:<><div className="cart-list">{cart.map((p,i)=><div className="cart-item" key={i}><img src={p.image}/><div><b>{p.name}</b><small>{p.color} / M</small><span>₹{p.price.toLocaleString("en-IN")}</span><button onClick={()=>remove(i)}>Remove</button></div></div>)}</div><footer><p><span>Subtotal</span><b>₹{cart.reduce((s,p)=>s+p.price,0).toLocaleString("en-IN")}</b></p><small>Shipping calculated at checkout.</small><button className="primary" onClick={checkout}>Checkout <ArrowRight size={15}/></button></footer></>}</motion.aside></> }

function Newsletter(){return <section className="newsletter"><p>PRIVATE NOTES / P&R</p><h2>Occasional signals.<br/>No noise.</h2><form onSubmit={e=>e.preventDefault()}><input type="email" aria-label="Email address" placeholder="Enter your email address"/><button aria-label="Subscribe"><ArrowRight/></button></form><span>New editions, stories and considered updates.</span></section>}
function Footer({go}:{go:(v:"home"|"collection"|"product"|"checkout")=>void}){return <footer className="site-footer"><button className="footer-logo" onClick={()=>go("home")}>P<span>&</span>R</button><div><p>Explore</p><button onClick={()=>go("collection")}>Shop all</button><button onClick={()=>go("collection")}>Men</button><button onClick={()=>go("collection")}>Women</button></div><div><p>Information</p><button>Shipping & returns</button><button>Care guide</button><button>Contact</button></div><div><p>Follow</p><button>Instagram</button><button>Pinterest</button></div><small>© 2026 P&R STUDIOS — INDIA</small></footer>}
