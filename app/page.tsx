"use client";

import { AnimatePresence, motion, useScroll, useTransform } from "framer-motion";
import { ArrowLeft, ArrowRight, ChevronDown, ChevronLeft, ChevronRight, Menu, Plus, Search, ShoppingBag, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { products, type Product } from "./product-data";

const blurDataURL = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0nNDAwJyBoZWlnaHQ9JzUwMCcgdmlld0JveD0nMCAwIDQwMCA1MDAnIHhtbG5zPSdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Zyc+PHJlY3Qgd2lkdGg9JzQwMCcgaGVpZ2h0PSc1MDAnIGZpbGw9JyNmM2YzZjAnLz48L3N2Zz4=";
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

  useEffect(() => { const onScroll = () => setNavSolid(window.scrollY > 60 || view !== "home"); onScroll(); addEventListener("scroll", onScroll); return () => removeEventListener("scroll", onScroll); }, [view]);
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
          <motion.img style={{scale:heroScale}} src="/images/campaign-hero.png" alt="P&R oversized essentials campaign" />
          <div className="hero-shade"/>
          <motion.div className="hero-copy" style={{opacity:heroOpacity}} initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{duration:1.2,delay:.2}}>
            <p>Edition 001 / 2026</p><h1>Oversized<br/>Essentials</h1><span>Built for everyday.</span><button onClick={() => go("collection")}>Shop the collection <ArrowRight size={14}/></button>
          </motion.div>
          <div className="scroll-note">Scroll to discover <span/></div>
        </section>

        <motion.section className="manifesto" {...fade}><p>OUR POINT OF VIEW</p><h2>Designed to be felt,<br/>not announced.</h2><div><span>We make considered essentials for people who understand that presence doesn’t need permission.</span><button onClick={() => document.querySelector("#about")?.scrollIntoView({behavior:"smooth"})}>Read our story <ArrowRight size={14}/></button></div></motion.section>

        <section className="drop">
          <motion.div className="section-head" {...fade}><div><p>NEW DROP / 001</p><h2>Oversized Essentials</h2></div><button onClick={() => go("collection")}>View all pieces <ArrowRight size={14}/></button></motion.div>
          <div className="product-grid">{products.slice(0,3).map((p,i)=><ProductCard key={p.id} p={p} i={i} open={openProduct} add={add}/>)}</div>
        </section>

        <section className="editorial-grid">
          <motion.button onClick={() => go("collection")} className="editorial large" {...fade}><img src="/images/bone-editorial.png" alt="Women's oversized collection"/><span><small>02 / WOMEN</small>Quiet form. Strong presence.<ArrowRight/></span></motion.button>
          <motion.button onClick={() => go("collection")} className="editorial" {...fade}><img src="/images/washed-charcoal.png" alt="Men's oversized collection"/><span><small>01 / MEN</small>The daily uniform.<ArrowRight/></span></motion.button>
        </section>

        <section className="about" id="about"><motion.div {...fade}><p>P&R / THE STANDARD</p><h2>Less noise.<br/><em>More presence.</em></h2></motion.div><motion.div {...fade}><p>P&R was created around a simple belief: the things you wear most should be the things made best.</p><p>Our first study is the oversized T-shirt—reworked through proportion, weight and restraint. Made for movement. Designed for repetition.</p><div className="facts"><span>Designed in India</span><span>240 GSM cotton</span><span>Unisex proportions</span></div></motion.div></section>
        <Newsletter/>
      </motion.div>}

      {view === "collection" && <motion.div key="collection" className="collection-page" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
        <div className="collection-title"><p>COLLECTION / EDITION 001</p><h1>Oversized<br/>Essentials</h1><span>Four studies in proportion, weight and ease.</span></div>
        <div className="filter-row"><span>{products.length} pieces</span><div><button>All</button><button>Men</button><button>Women</button><button>Filter <ChevronDown size={13}/></button></div></div>
        <div className="product-grid collection-products">{products.map((p,i)=><ProductCard key={p.id} p={p} i={i} open={openProduct} add={add}/>)}</div>
      </motion.div>}

      {view === "product" && <motion.div key="product" className="product-page" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
        <button className="back" onClick={() => go("collection")}><ArrowLeft size={15}/> Back to collection</button>
        <ProductGallery product={selected}/>
        <ProductInfo product={selected} onAdd={() => add()} onBuy={() => { add(); setCartOpen(false); go("checkout"); }}/>
      </motion.div>}

      {view === "checkout" && <motion.div key="checkout" className="checkout" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
        <button className="back" onClick={() => setCartOpen(true)}><ArrowLeft size={15}/> Return to bag</button><p>SECURE CHECKOUT</p><h1>Finish your order</h1>
        <div className="checkout-grid"><form onSubmit={e=>e.preventDefault()}><label>Email address<input type="email" placeholder="you@example.com"/></label><h3>Delivery</h3><div className="split"><label>First name<input/></label><label>Last name<input/></label></div><label>Address<input/></label><div className="split"><label>City<input/></label><label>PIN code<input inputMode="numeric"/></label></div><button className="primary">Continue to payment</button></form><aside><h3>Your order</h3>{cart.map((p,i)=><div className="order-item" key={i}><img src={p.gallery[0].src}/><span>{p.name}<small>{p.color} / M</small></span><b>₹{p.price.toLocaleString("en-IN")}</b></div>)}<div className="total"><span>Total</span><b>₹{cart.reduce((s,p)=>s+p.price,0).toLocaleString("en-IN")}</b></div></aside></div>
      </motion.div>}
    </AnimatePresence>

    <Footer go={go}/>
    <AnimatePresence>{cartOpen && <Cart cart={cart} close={()=>setCartOpen(false)} remove={(i)=>setCart(c=>c.filter((_,x)=>x!==i))} checkout={()=>{setCartOpen(false);go("checkout")}}/>}</AnimatePresence>
    <AnimatePresence>{menuOpen && <motion.div className="menu" initial={{x:"-100%"}} animate={{x:0}} exit={{x:"-100%"}} transition={{ease:[.22,1,.36,1],duration:.55}}><button onClick={()=>setMenuOpen(false)}><X/></button><nav><button onClick={()=>go("collection")}>Shop</button><button onClick={()=>go("collection")}>Men</button><button onClick={()=>go("collection")}>Women</button><button onClick={()=>go("home")}>Campaign</button></nav><p>Less Noise. More Presence.</p></motion.div>}</AnimatePresence>
  </main>
}

function ProductCard({p,i,open,add}:{p:Product,i:number,open:(p:Product)=>void,add:(p:Product)=>void}) {
  const first = p.gallery[0];
  const second = p.gallery[1] ?? p.gallery[0];
  return <motion.article className={`product-card ${i===1?"offset":""}`} {...fade}><button className="product-image" onClick={()=>open(p)}><Image src={first.src} alt={`${p.name} ${first.label}`} fill sizes="(max-width: 760px) 50vw, 33vw" placeholder="blur" blurDataURL={blurDataURL}/><Image className="second" src={second.src} alt="" fill sizes="(max-width: 760px) 50vw, 33vw" placeholder="blur" blurDataURL={blurDataURL}/><span>View piece <ArrowRight size={14}/></span></button><div className="product-meta"><button onClick={()=>open(p)}><b>{p.name}</b><small>{p.color}</small></button><span>₹{p.price.toLocaleString("en-IN")}</span><button className="quick" onClick={()=>add(p)}>Quick add</button></div></motion.article>
}

function ProductGallery({product}:{product:Product}) {
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [zoomed, setZoomed] = useState(false);
  const lastTap = useRef(0);
  const images = product.gallery;

  useEffect(() => {
    const observers = images.map((_, index) => {
      const el = document.getElementById(`product-shot-${product.id}-${index}`);
      if (!el) return null;
      const observer = new IntersectionObserver(([entry]) => entry.isIntersecting && setActive(index), { threshold: .55 });
      observer.observe(el);
      return observer;
    });
    return () => observers.forEach((observer) => observer?.disconnect());
  }, [images, product.id]);

  useEffect(() => {
    if (lightbox === null) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLightbox(null);
      if (event.key === "ArrowRight") setLightbox((value) => value === null ? value : (value + 1) % images.length);
      if (event.key === "ArrowLeft") setLightbox((value) => value === null ? value : (value - 1 + images.length) % images.length);
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [images.length, lightbox]);

  const openAt = (index: number) => { setLightbox(index); setZoomed(false); };
  const changeLightbox = (step: number) => setLightbox((value) => value === null ? value : (value + step + images.length) % images.length);
  const handleLightboxTap = () => {
    const now = Date.now();
    if (now - lastTap.current < 280) setZoomed((value) => !value);
    lastTap.current = now;
  };

  return <div className="product-gallery-shell">
    <nav className="product-thumbs" aria-label="Product image navigation">
      {images.map((image, index) => <button key={image.key} className={active === index ? "active" : ""} onClick={() => document.getElementById(`product-shot-${product.id}-${index}`)?.scrollIntoView({ behavior: "smooth", block: "start" })}><span>{String(index + 1).padStart(2, "0")}</span>{image.label}</button>)}
    </nav>
    <div className="desktop-gallery">
      {images.map((image, index) => <motion.button id={`product-shot-${product.id}-${index}`} className="gallery-frame" key={image.key} onClick={() => openAt(index)} initial={{opacity:0, y:22}} whileInView={{opacity:1, y:0}} viewport={{once:true, margin:"-15%"}} transition={{duration:.7, ease:[.22,1,.36,1]}}><Image src={image.src} alt={`${product.name} ${image.label}`} fill sizes="(max-width: 1100px) 65vw, 55vw" placeholder="blur" blurDataURL={blurDataURL}/><span>{image.label}</span></motion.button>)}
    </div>
    <div className="mobile-gallery">
      <motion.div className="mobile-track" drag="x" dragConstraints={{left:0,right:0}} onDragEnd={(_, info) => { if (info.offset.x < -55) setActive((active + 1) % images.length); if (info.offset.x > 55) setActive((active - 1 + images.length) % images.length); }} animate={{x:`-${active * 100}%`}} transition={{duration:.35, ease:[.22,1,.36,1]}}>
        {images.map((image, index) => <button className="mobile-slide" key={image.key} onClick={() => openAt(index)}><Image src={image.src} alt={`${product.name} ${image.label}`} fill sizes="100vw" placeholder="blur" blurDataURL={blurDataURL}/></button>)}
      </motion.div>
      <div className="mobile-count">{active + 1} / {images.length}</div>
    </div>
    <AnimatePresence>{lightbox !== null && <motion.div className="lightbox" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
      <button className="lightbox-close" onClick={() => setLightbox(null)} aria-label="Close gallery"><X size={21}/></button>
      <button className="lightbox-arrow left" onClick={() => changeLightbox(-1)} aria-label="Previous image"><ChevronLeft size={24}/></button>
      <motion.button className={`lightbox-image ${zoomed ? "zoomed" : ""}`} onClick={handleLightboxTap} drag="x" dragConstraints={{left:0,right:0}} onDragEnd={(_, info) => { if (info.offset.x < -70) changeLightbox(1); if (info.offset.x > 70) changeLightbox(-1); }}>
        <Image src={images[lightbox].src} alt={`${product.name} ${images[lightbox].label}`} fill sizes="100vw" priority placeholder="blur" blurDataURL={blurDataURL}/>
      </motion.button>
      <button className="lightbox-arrow right" onClick={() => changeLightbox(1)} aria-label="Next image"><ChevronRight size={24}/></button>
      <div className="lightbox-count">{lightbox + 1} / {images.length}</div>
    </motion.div>}</AnimatePresence>
  </div>
}

function ProductInfo({product,onAdd,onBuy}:{product:Product,onAdd:()=>void,onBuy:()=>void}) { const [size,setSize]=useState("M"); const [open,setOpen]=useState("Details"); return <aside className="product-info"><p>EDITION 001</p><h1>{product.name}</h1><b>₹{product.price.toLocaleString("en-IN")}</b><span className="tax">Inclusive of all taxes</span><p className="description">An oversized study in proportion. Cut from dense combed cotton with dropped shoulders and a structured, easy drape.</p><div className="choice"><label>Colour <span>{product.color}</span></label><div className={`swatch ${product.color.includes("Bone")||product.color.includes("Ecru")?"light":""}`}/></div><div className="choice"><label>Size <button>Size guide</button></label><div className="sizes">{["XS","S","M","L","XL"].map(s=><button className={size===s?"selected":""} onClick={()=>setSize(s)} key={s}>{s}</button>)}</div></div><button className="primary" onClick={onAdd}>Add to bag</button><button className="secondary" onClick={onBuy}>Buy now</button><div className="accordions">{["Details","Shipping & returns","Care guide"].map(x=><div key={x}><button onClick={()=>setOpen(open===x?"":x)}>{x}<Plus size={15}/></button>{open===x&&<motion.p initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}}>{x==="Details"?product.note:x==="Care guide"?"Cold wash inside out. Do not tumble dry. Iron on reverse.":"Complimentary shipping across India. Easy returns within 7 days."}</motion.p>}</div>)}</div></aside> }

function Cart({cart,close,remove,checkout}:{cart:Product[],close:()=>void,remove:(i:number)=>void,checkout:()=>void}) { return <><motion.div className="scrim" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={close}/><motion.aside className="cart" initial={{x:"100%"}} animate={{x:0}} exit={{x:"100%"}} transition={{duration:.5,ease:[.22,1,.36,1]}}><header><span>Your bag / {cart.length}</span><button onClick={close}><X/></button></header>{!cart.length?<div className="empty"><ShoppingBag/><h2>Your bag is empty.</h2><button onClick={close}>Continue shopping</button></div>:<><div className="cart-list">{cart.map((p,i)=><div className="cart-item" key={i}><img src={p.gallery[0].src}/><div><b>{p.name}</b><small>{p.color} / M</small><span>₹{p.price.toLocaleString("en-IN")}</span><button onClick={()=>remove(i)}>Remove</button></div></div>)}</div><footer><p><span>Subtotal</span><b>₹{cart.reduce((s,p)=>s+p.price,0).toLocaleString("en-IN")}</b></p><small>Shipping calculated at checkout.</small><button className="primary" onClick={checkout}>Checkout <ArrowRight size={15}/></button></footer></>}</motion.aside></> }

function Newsletter(){return <section className="newsletter"><p>PRIVATE NOTES / P&R</p><h2>Occasional signals.<br/>No noise.</h2><form onSubmit={e=>e.preventDefault()}><input type="email" aria-label="Email address" placeholder="Enter your email address"/><button aria-label="Subscribe"><ArrowRight/></button></form><span>New editions, stories and considered updates.</span></section>}
function Footer({go}:{go:(v:"home"|"collection"|"product"|"checkout")=>void}){return <footer className="site-footer"><button className="footer-logo" onClick={()=>go("home")}>P<span>&</span>R</button><div><p>Explore</p><button onClick={()=>go("collection")}>Shop all</button><button onClick={()=>go("collection")}>Men</button><button onClick={()=>go("collection")}>Women</button></div><div><p>Information</p><button>Shipping & returns</button><button>Care guide</button><button>Contact</button></div><div><p>Follow</p><button>Instagram</button><button>Pinterest</button></div><small>© 2026 P&R STUDIOS — INDIA</small></footer>}
