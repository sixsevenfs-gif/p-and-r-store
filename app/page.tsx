"use client";

import { AnimatePresence, motion, useScroll, useTransform } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, ChevronDown, ChevronLeft, ChevronRight, FileText, Heart, LogOut, MapPin, Menu, Minus, Plus, Search, ShieldCheck, ShoppingBag, Truck, UserRound, WalletCards, X } from "lucide-react";
import Image from "next/image";
import { FormEvent, useEffect, useRef, useState } from "react";
import { products as seedProducts, type Product } from "./product-data";

type View = "home" | "collection" | "product" | "cart" | "checkout" | "about" | "account" | "unique";
type AccountTab = "overview" | "orders" | "wishlist" | "addresses" | "wallet";
const blurDataURL = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0nNDAwJyBoZWlnaHQ9JzUwMCcgdmlld0JveD0nMCAwIDQwMCA1MDAnIHhtbG5zPSdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Zyc+PHJlY3Qgd2lkdGg9JzQwMCcgaGVpZ2h0PSc1MDAnIGZpbGw9JyNmM2YzZjAnLz48L3N2Zz4=";
const products = seedProducts;
const fade = { initial: { opacity: 0, y: 28 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: "-10%" }, transition: { duration: .8, ease: [0.22, 1, 0.36, 1] as const } };
type ContentSection = {section_key:string;section_type?:string;title?:string;subtitle?:string;body?:string;image_url?:string;cta_label?:string;cta_url?:string;sort_order?:number};
const aboutDefaults: ContentSection[] = [
  {section_key:"about_hero",section_type:"hero",title:"Considered essentials.",subtitle:"Built around proportion, weight and repetition.",image_url:"/images/bone-editorial.jpg",sort_order:10},
  {section_key:"about_standard",section_type:"standard",subtitle:"P&R / THE STANDARD",title:"Pieces worn most\nshould be made best.",body:"P&R is built around considered everyday clothing—designed with attention to proportion, fabric weight and repeat wear.\n\nThe collection is designed in India around an easy, unisex point of view.",sort_order:20},
  {section_key:"about_fit",section_type:"fit",subtitle:"FIT PHILOSOPHY",title:"Room to move.\nEnough structure to\nhold its form.",body:"Dropped shoulders and deliberate volume shape the silhouette. Each piece should feel relaxed without losing structure.",image_url:"/products/literally-just-a-girl-tee/closeup-fabric.jpg",cta_label:"VIEW SIZE GUIDE",cta_url:"/shop",sort_order:30},
  {section_key:"about_build",section_type:"build",subtitle:"THE BUILD",body:"240 GSM COTTON\nUNISEX PROPORTIONS\nDESIGNED FOR REPEAT WEAR",sort_order:40},
  {section_key:"about_contact",section_type:"contact",subtitle:"STUDIO / CONTACT",title:"Questions about fit, product or an order?",cta_label:"CUSTOMER SUPPORT",cta_url:"/account",sort_order:50},
];
export default function Home() {
  const [products, setProducts] = useState<Product[]>(seedProducts);
  const [cmsSections, setCmsSections] = useState<ContentSection[] | null>(null);
  const cms = Object.fromEntries((cmsSections ?? []).map(section => [section.section_key, section]));
  const [view, setView] = useState<View>("home");
  const [selected, setSelected] = useState(seedProducts[0]);
  const [cart, setCart] = useState<Product[]>([]);
  const [cartNotice, setCartNotice] = useState<Product | null>(null);
  const [reservationNotice, setReservationNotice] = useState<{ product: Product; state: "securing" | "reserved" | "closed" | "error"; message: string } | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [navSolid, setNavSolid] = useState(false);
  const [headerWallet, setHeaderWallet] = useState<{available:number;pending:number}|null>(null);
  const [collectionFilter, setCollectionFilter] = useState<"All" | "Men" | "Women">("All");
  const { scrollYProgress } = useScroll();
  const heroScale = useTransform(scrollYProgress, [0, .16], [1.08, 1]);
  const heroOpacity = useTransform(scrollYProgress, [0, .13], [1, 0]);
  const standardProducts = products.filter((product) => !product.isUniqueFind);
  const uniqueProducts = products.filter((product) => product.isUniqueFind);
  const featuredDropProducts = standardProducts.slice(0,5);
  const hero=cms.hero;

  useEffect(()=>{fetch("/api/catalog").then(r=>r.ok?r.json():Promise.reject()).then(({products:rows})=>{const next:Product[]=rows.map((row:Record<string,unknown>)=>{const images=Array.isArray(row.images)?row.images:[];const variants=Array.isArray(row.variants)?row.variants:[];const gallery=images.map((image:Record<string,unknown>,index:number)=>({key:String(image.id??index),label:String(image.alt_text||`View ${index+1}`),src:String(image.url)})).filter(image=>image.src);const parsedVariants=variants.map((variant:Record<string,unknown>)=>({id:Number(variant.id),size:String(variant.size),stock:Math.max(0,Number(variant.stock)-Number(variant.reserved_stock||0)),price:variant.price===null?null:Number(variant.price)}));const defaultVariant=parsedVariants.find(variant=>variant.id===Number(row.default_variant_id))||parsedVariants.find(variant=>variant.size==="M")||parsedVariants[0];return {id:Number(row.id),slug:String(row.slug),name:String(row.name),price:Number(row.price)/100,compareAtPrice:row.compare_at_price==null?null:Number(row.compare_at_price)/100,color:String(row.color),category:(row.category==="Women"?"Women":"Men"),note:String(row.description||""),variantId:defaultVariant?.id,gallery:gallery.length?gallery:[{key:"front",label:"Front",src:String(row.image_url||"/images/campaign-hero.jpg")}],variants:parsedVariants,editionNumber:Number(row.edition_number ?? row.id),isUniqueFind:Boolean(row.is_unique_find),lifetimeProductionCap:row.lifetime_production_cap==null?null:Number(row.lifetime_production_cap),availableStock:Math.max(0,Number(row.available_stock||0)),uniqueFindStatus:String(row.unique_find_status||"available")}});if(next.length){setProducts(next);setSelected(current=>next.find(p=>p.slug===current.slug)||next[0])}}).catch(()=>{})},[]);
  useEffect(()=>{fetch("/api/content",{cache:"no-store"}).then(r=>r.ok?r.json():Promise.reject()).then(({sections})=>setCmsSections(sections as ContentSection[])).catch(()=>{})},[]);
  useEffect(() => { const onScroll = () => setNavSolid(window.scrollY > 60 || view !== "home"); onScroll(); addEventListener("scroll", onScroll); return () => removeEventListener("scroll", onScroll); }, [view]);
  useEffect(() => { queueMicrotask(() => setView(viewFromPath(location.pathname))); const onPop = () => setView(viewFromPath(location.pathname)); addEventListener("popstate", onPop); return () => removeEventListener("popstate", onPop); }, []);
  useEffect(() => { const saved = localStorage.getItem("pr-bag"); if (saved) { try { const entries = JSON.parse(saved) as Array<string | {slug:string;selectedSize?:string;variantId?:number}>; queueMicrotask(() => setCart(entries.flatMap(entry => { const savedItem=typeof entry === "string" ? {slug:entry} : entry; const product=products.find(item=>item.slug===savedItem.slug); return product ? [{...product,selectedSize:savedItem.selectedSize||"M",variantId:savedItem.variantId||product.variantId}] : []; }))); } catch {} } }, [products]);
  useEffect(() => { const code = new URLSearchParams(location.search).get("ref"); if (code) localStorage.setItem("pr-referral", code); }, []);
  const refreshWallet = async () => {
    try {
      const response = await fetch("/api/wallet", { cache: "no-store" });
      setHeaderWallet(response.ok ? await response.json() as {available:number;pending:number} : null);
    } catch { setHeaderWallet(null); }
  };
  useEffect(() => { queueMicrotask(() => void refreshWallet()); }, []);
  useEffect(() => { localStorage.setItem("pr-bag", JSON.stringify(cart.map(({slug,selectedSize,variantId}) => ({slug,selectedSize:selectedSize||"M",variantId})))); }, [cart]);
  useEffect(() => {
    if (!cartNotice) return;
    const timeout = window.setTimeout(() => setCartNotice(null), 3400);
    return () => window.clearTimeout(timeout);
  }, [cartNotice]);
  useEffect(() => { document.body.style.overflow = menuOpen || searchOpen ? "hidden" : ""; return () => { document.body.style.overflow = ""; }; }, [menuOpen, searchOpen]);
  const go = (next: View) => { setView(next); setMenuOpen(false); setSearchOpen(false); setCartOpen(false); history.pushState({view:next}, "", next === "home" ? "/" : `/${next === "collection" ? "shop" : next === "cart" ? "bag" : next}`); requestAnimationFrame(() => scrollTo({ top: 0, behavior: next === "cart" ? "auto" : "smooth" })); };
  const goCollection = (filter: "All" | "Men" | "Women" = "All") => { setCollectionFilter(filter); go("collection"); };
  const goAccount = (tab: AccountTab = "overview") => { setView("account"); setMenuOpen(false); setSearchOpen(false); setCartOpen(false); history.pushState({view:"account",tab}, "", tab === "overview" ? "/account" : `/account?tab=${tab}`); requestAnimationFrame(() => scrollTo({top:0,behavior:"smooth"})); };
  const goWallet = () => goAccount("wallet");
  const openProduct = (p: Product) => { setSelected(p); go("product"); };
  const cartKey = (product: Product) => `${product.variantId || product.slug}:${product.selectedSize || "M"}`;
  const add = async (p = selected) => {
    if (p.isUniqueFind) {
      if (!p.variantId || p.uniqueFindStatus === "closed" || !p.availableStock) { setReservationNotice({product:p,state:"closed",message:"Another customer secured the last T-shirt moments ago."}); return; }
      setReservationNotice({product:p,state:"securing",message:"VERIFYING AVAILABILITY"});
      try { const response=await fetch("/api/unique-finds/reserve",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({variantId:p.variantId,idempotencyKey:crypto.randomUUID()})}); const result=await response.json() as {error?:string}; if(response.status===401){location.href=`/login?next=${encodeURIComponent("/unique-finds")}`;return;} if(!response.ok){setReservationNotice({product:p,state:result.error==="SOLD OUT"?"closed":"error",message:result.error||"UNIQUE FINDS COULD NOT RESPOND"});return;} setCart(current=>[...current,p]);setReservationNotice({product:p,state:"reserved",message:"RESERVED FOR CHECKOUT"}); } catch { setReservationNotice({product:p,state:"error",message:"UNIQUE FINDS COULD NOT RESPOND"}); }
      return;
    }
    if (p.variantId) void fetch("/api/cart", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({variantId:p.variantId,quantity:1}) });
    setCart((current) => [...current, p]);
    setCartNotice(p);
  };
  const setCartQuantity = (product: Product, quantity: number) => setCart((current) => {
    const safeQuantity = Math.max(0, quantity);
    const withoutProduct = current.filter((item) => cartKey(item) !== cartKey(product));
    return [...withoutProduct, ...Array.from({ length: safeQuantity }, () => product)];
  });
  const setCartSize = (product: Product, selectedSize: string) => setCart((current) => {
    const nextVariant = product.variants?.find((variant) => variant.size === selectedSize);
    if (!nextVariant) return current;
    return current.map((item) => cartKey(item) === cartKey(product) ? {...item,selectedSize,variantId:nextVariant.id} : item);
  });
  const collectionProducts = collectionFilter === "All" ? standardProducts : standardProducts.filter((product) => product.category === collectionFilter);

  return <main>
    <header className={`nav ${navSolid ? "solid" : ""}`}>
      <button className="mobile-menu" aria-label="Open menu" onClick={() => setMenuOpen(true)}><Menu size={20}/></button>
      <nav className="nav-left"><button onClick={() => go("home")}>Shop</button><button onClick={() => goCollection("All")}>New Drop</button><button onClick={() => goCollection("Men")}>Men</button><button onClick={() => goCollection("Women")}>Women</button><button onClick={() => go("unique")}>Unique Finds</button><button onClick={() => go("about")}>About</button></nav>
      <button className="wordmark" onClick={() => go("home")} aria-label="P and R home">P<span>&</span>R</button>
      <nav className="nav-right"><button aria-label="Search" onClick={() => setSearchOpen(true)}><Search size={18}/><span>Search</span></button>{headerWallet&&<button className="header-wallet" onClick={goWallet} title="Real store credit — use at checkout"><WalletCards size={16}/><span><b>Wallet ₹{Math.floor(headerWallet.available/100).toLocaleString("en-IN")}</b><small>Use at checkout</small></span></button>}<button className="header-wishlist" onClick={() => goAccount("wishlist")} aria-label="Open wishlist"><Heart size={18}/><span>Wishlist</span></button><button onClick={() => go("cart")}><ShoppingBag size={18}/><span>Bag ({cart.length})</span></button><button className="account" onClick={() => goAccount()}><UserRound size={17}/><span>Account</span></button></nav>
    </header>

    <AnimatePresence mode="wait">
      {view === "home" && <motion.div key="home" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
        <section className="hero">
          <motion.img style={{scale:heroScale}} src={hero?.image_url||"/images/campaign-hero.jpg"} alt="P&R oversized essentials campaign" />
          <div className="hero-shade"/>
          <motion.div className="hero-copy" style={{opacity:heroOpacity}} initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{duration:1.2,delay:.2}}>
            <p>Edition 001 / 2026</p><h1>{hero?.title||<>Oversized<br/>Essentials</>}</h1><span>{hero?.subtitle||"Built for everyday."}</span><button onClick={() => goCollection("All")}>{hero?.cta_label||"Shop the collection"} <ArrowRight size={14}/></button>
          </motion.div>
          <div className="scroll-note">Scroll to discover <span/></div>
        </section>

        <motion.section className="manifesto" {...fade}><p>OUR POINT OF VIEW</p><h2>Designed to be felt,<br/>not announced.</h2><div><span>We make considered essentials for people who understand that presence doesn’t need permission.</span><button onClick={() => document.querySelector("#about")?.scrollIntoView({behavior:"smooth"})}>Read our story <ArrowRight size={14}/></button></div></motion.section>

        <section className="drop">
          <motion.div className="section-head" {...fade}><div><p>NEW DROP / 001</p><h2>Oversized Essentials</h2><span className="section-note">Girls and boys. One everyday uniform.</span></div><button onClick={() => goCollection("All")}>View all pieces <ArrowRight size={14}/></button></motion.div>
          <div className="product-grid featured-products">{featuredDropProducts.map((p,i)=><ProductCard key={p.id} p={p} i={i} open={openProduct} add={add}/>)}</div>
        </section>

        <section className="editorial-grid">
          <motion.button onClick={() => goCollection("Women")} className="editorial large" {...fade}><img src="/images/bone-editorial.jpg" alt="Women's oversized collection"/><span><small>02 / WOMEN</small>Quiet form. Strong presence.<ArrowRight/></span></motion.button>
          <motion.button onClick={() => goCollection("Men")} className="editorial" {...fade}><img src="/images/washed-charcoal.jpg" alt="Men's oversized collection"/><span><small>01 / MEN</small>The daily uniform.<ArrowRight/></span></motion.button>
        </section>

        <section className="unique-banner unique-banner-reference" aria-label="Unique Finds"><Image src="/images/unique-finds-hero.png" alt="P&R Limited Collection — Unique Finds. Only five or fewer will ever exist." fill priority sizes="100vw"/><button onClick={() => go("unique")} aria-label="Discover Unique Finds"/></section>

        <section className="about" id="about"><motion.div {...fade}><p>P&R / THE STANDARD</p><h2>Less noise.<br/><em>More presence.</em></h2></motion.div><motion.div {...fade}><p>P&R was created around a simple belief: the things you wear most should be the things made best.</p><p>Our first study is the oversized T-shirt—reworked through proportion, weight and restraint. Made for movement. Designed for repetition.</p><div className="facts"><span>Designed in India</span><span>240 GSM cotton</span><span>Unisex proportions</span></div></motion.div></section>
        <section className="drop core"><motion.div className="section-head" {...fade}><div><p>CORE ESSENTIALS</p><h2>The daily rotation.</h2></div><button onClick={() => goCollection("All")}>Shop all <ArrowRight size={14}/></button></motion.div><div className="product-grid core-products">{standardProducts.slice(4,8).map((p,i)=><ProductCard key={p.id} p={p} i={i} open={openProduct} add={add}/>)}</div></section>
        <section className="campaign-break"><Image src="/images/campaign-hero.jpg" alt="P&R Edition 001 campaign" fill sizes="100vw"/><div><p>EDITION 001</p><h2>Built for everyday.</h2><button onClick={() => goCollection("All")}>Explore the collection <ArrowRight size={14}/></button></div></section>
        <Newsletter/>
      </motion.div>}

      {view === "about" && <AboutPage sections={cmsSections}/>}

      {view === "unique" && <UniqueFindsPage products={uniqueProducts} open={openProduct} add={add} shop={() => goCollection("All")}/>}

      {view === "collection" && <motion.div key="collection" className="collection-page" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
        <div className="collection-title"><p>COLLECTION / EDITION 001</p><h1>{collectionFilter === "Women" ? "Women" : collectionFilter === "Men" ? "Men" : "Oversized"}<br/>{collectionFilter === "All" ? "Essentials" : "Essentials"}</h1><span>{collectionFilter === "Women" ? "Women’s crop tees and everyday essentials." : "Four studies in proportion, weight and ease."}</span></div>
        <div className="filter-row"><span>{collectionProducts.length} pieces</span><div><button className={collectionFilter==="All"?"active":""} onClick={() => setCollectionFilter("All")}>All</button><button className={collectionFilter==="Men"?"active":""} onClick={() => setCollectionFilter("Men")}>Men</button><button className={collectionFilter==="Women"?"active":""} onClick={() => setCollectionFilter("Women")}>Women</button><button>Filter <ChevronDown size={13}/></button></div></div>
        <div className="product-grid collection-products">{collectionProducts.map((p,i)=><ProductCard key={p.id} p={p} i={i} open={openProduct} add={add}/>)}</div>
      </motion.div>}

      {view === "product" && <motion.div key="product" className="product-page" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
        <button className="back" onClick={() => go("collection")}><ArrowLeft size={15}/> Back to collection</button>
        <ProductGallery product={selected}/>
        <ProductInfo product={selected} onAdd={(item) => add(item)} onBuy={(item) => { add(item); setCartOpen(false); go("checkout"); }}/>
      </motion.div>}

      {view === "cart" && <CartPage key="cart" cart={cart} add={add} updateQuantity={setCartQuantity} updateSize={setCartSize} openProduct={openProduct} shop={goCollection} checkout={() => go("checkout")}/>}

      {view === "checkout" && <CheckoutPage cart={cart} backToCart={() => go("cart")} continueShopping={() => goCollection("All")} viewOrders={() => goAccount("orders")} onPlaced={() => {setCart([]);void refreshWallet();}}/>}
      {view === "account" && (
        <AccountPage shop={() => goCollection("All")} openProduct={openProduct}/>
      )}
    </AnimatePresence>

    <Footer go={go} goAccount={goAccount}/>
    <AnimatePresence>{cartNotice && <motion.aside className="cart-added-toast" role="status" aria-live="polite" initial={{opacity:0,y:20,scale:.96}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:14,scale:.97}} transition={{duration:.28,ease:[.22,1,.36,1]}}>
      <motion.span initial={{scale:.65,rotate:-14}} animate={{scale:1,rotate:0}} transition={{type:"spring",stiffness:420,damping:18}}><ShoppingBag size={19}/></motion.span>
      <div><b>Added to your bag</b><small>{cartNotice.name} · {cartNotice.selectedSize || "M"}</small></div>
      <button onClick={() => { setCartNotice(null); go("cart"); }}>View bag <ArrowRight size={14}/></button>
    </motion.aside>}</AnimatePresence>
    <AnimatePresence>{reservationNotice&&<motion.div className="unique-reservation" role="dialog" aria-modal="true" aria-live="polite" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}><motion.section initial={{scale:.96,y:14}} animate={{scale:1,y:0}} exit={{scale:.96,y:14}}><p>{reservationNotice.state==="securing"?"SECURING YOUR T-SHIRT":reservationNotice.state==="reserved"?"LIMITED T-SHIRT SECURED":"UNIQUE FIND"}</p><b>LIMITED TO {reservationNotice.product.lifetimeProductionCap||5} T-SHIRTS · NEVER RESTOCKED</b><h2>{reservationNotice.message}</h2>{reservationNotice.state==="securing"?<span>HOLDING YOUR T-SHIRT</span>:<div><button onClick={()=>{const saved=reservationNotice;setReservationNotice(null);if(saved.state==="reserved")go("checkout");}}>CONTINUE TO CHECKOUT</button><button onClick={()=>{setReservationNotice(null);go("cart")}}>VIEW BAG</button>{reservationNotice.state!=="reserved"&&<button onClick={()=>{setReservationNotice(null);go("unique")}}>RETURN TO UNIQUE FINDS</button>}</div>}</motion.section></motion.div>}</AnimatePresence>
    <AnimatePresence>{searchOpen && <SearchOverlay close={() => setSearchOpen(false)} openProduct={openProduct}/>}</AnimatePresence>
    <AnimatePresence>{cartOpen && <Cart cart={cart} close={()=>setCartOpen(false)} remove={(i)=>setCart(c=>c.filter((_,x)=>x!==i))} checkout={()=>{setCartOpen(false);go("checkout")}}/>}</AnimatePresence>
    <AnimatePresence>{menuOpen && <motion.div className="menu" initial={{x:"-100%"}} animate={{x:0}} exit={{x:"-100%"}} transition={{ease:[.22,1,.36,1],duration:.55}}><button onClick={()=>setMenuOpen(false)} aria-label="Close menu"><X/></button><nav><button onClick={()=>go("home")}>Shop</button><button onClick={()=>goCollection("All")}>New Drop</button><button onClick={()=>goCollection("Men")}>Men</button><button onClick={()=>goCollection("Women")}>Women</button><button onClick={()=>go("unique")}>Unique Finds</button><button onClick={()=>go("about")}>About</button><button onClick={()=>setSearchOpen(true)}>Search</button></nav><p>Less noise. More presence.</p></motion.div>}</AnimatePresence>
  </main>
}

function viewFromPath(pathname:string):View {
  if(pathname==="/unique-finds")return "unique";
  if(pathname==="/shop")return "collection";
  if(pathname==="/bag")return "cart";
  if(pathname==="/product")return "product";
  if(pathname==="/checkout")return "checkout";
  if(pathname==="/about")return "about";
  if(pathname==="/account")return "account";
  return "home";
}

function AboutPage({sections}:{sections:ContentSection[] | null}) {
  const publishedAbout = (sections ?? []).filter(section => section.section_key.startsWith("about_"));
  const content = sections === null || (!sections.some(section => section.section_key.startsWith("about_")) && sections.length === 0) ? aboutDefaults : publishedAbout;
  const hero = content.find(section => section.section_type === "hero" || section.section_key === "about_hero");
  const ordered = content.filter(section => section !== hero).sort((a,b)=>(a.sort_order ?? 0)-(b.sort_order ?? 0));
  const lines = (value?:string) => value?.split("\n").filter(Boolean) ?? [];
  const paragraphs = (value?:string) => value?.split(/\n\s*\n/).filter(Boolean) ?? [];
  const validEmail = (value?:string) => value?.trim().match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)?.[0];
  const renderSection = (section:ContentSection) => {
    const kind = section.section_type || section.section_key.replace("about_","");
    if (kind === "standard") return <motion.section className="about-standard about-container" {...fade} key={section.section_key}>
      <div><p className="about-kicker">{section.subtitle}</p><h2>{lines(section.title).map((line,index)=><span key={index}>{line}</span>)}</h2></div>
      <div className="about-copy">{paragraphs(section.body).map((paragraph,index)=><p key={index}>{paragraph}</p>)}</div>
    </motion.section>;
    if (kind === "fit") return <motion.section className="about-fit about-container" {...fade} key={section.section_key}>
      <div className="about-fit-copy"><p className="about-kicker">{section.subtitle}</p><h2>{lines(section.title).map((line,index)=><span key={index}>{line}</span>)}</h2><p>{section.body}</p>{section.cta_label&&section.cta_url&&<a href={section.cta_url}>{section.cta_label} <ArrowRight size={14}/></a>}</div>
      {section.image_url&&<motion.div className="about-detail-image" initial={{clipPath:"inset(0 0 100% 0)"}} whileInView={{clipPath:"inset(0 0 0% 0)"}} viewport={{once:true,amount:.2}} transition={{duration:.9,ease:[.22,1,.36,1]}}><Image src={section.image_url} alt="P&R garment construction detail" fill sizes="(max-width: 760px) 100vw, 44vw"/></motion.div>}
    </motion.section>;
    if (kind === "build") return <motion.section className="about-build" {...fade} key={section.section_key}><div className="about-container"><p className="about-kicker">{section.subtitle}</p><div>{lines(section.body).map(attribute=><span key={attribute}>{attribute}</span>)}</div></div></motion.section>;
    if (kind === "contact") {
      const email = validEmail(section.body);
      return <motion.section className="about-contact about-container" {...fade} key={section.section_key}><p className="about-kicker">{section.subtitle}</p><h2>{section.title}</h2>{email&&<a className="about-email" href={`mailto:${email}`}>{email}</a>}<div className="about-contact-links">{section.cta_label&&section.cta_url&&<a href={section.cta_url}>{section.cta_label} <ArrowRight size={14}/></a>}{section.image_url&&<a href={section.image_url} target="_blank" rel="noreferrer">INSTAGRAM <ArrowRight size={14}/></a>}</div></motion.section>;
    }
    return null;
  };
  return <motion.div className="about-page" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
    {hero&&<section className="about-hero"><Image src={hero.image_url||"/images/bone-editorial.jpg"} alt="P&R model wearing an oversized essential" fill priority sizes="100vw"/><div className="about-hero-shade"/><motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{duration:.8,ease:[.22,1,.36,1]}}><p className="about-kicker">ABOUT P&R</p><h1>{hero.title}</h1><span>{hero.subtitle}</span></motion.div></section>}
    {ordered.map(renderSection)}
  </motion.div>;
}

function ProductPrice({product,compact=false}:{product:Product;compact?:boolean}) {
  const onSale=Boolean(product.compareAtPrice&&product.compareAtPrice>product.price);
  return <span className={`store-price ${onSale?"on-sale":""} ${compact?"compact":""}`}>{onSale&&<><small>Limited offer</small><del>₹{product.compareAtPrice!.toLocaleString("en-IN")}</del></>}<strong>₹{product.price.toLocaleString("en-IN")}</strong></span>;
}

function ProductCard({p,open,add}:{p:Product,i:number,open:(p:Product)=>void,add:(p:Product)=>void}) {
  const first = p.gallery[0];
  const second = p.gallery[1] ?? p.gallery[0];
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [saveError, setSaveError] = useState("");
  useEffect(()=>{const timer=window.setTimeout(()=>setMounted(true),0);return()=>window.clearTimeout(timer);},[]);
  // Keep the first browser render identical to SSR. In dev, Fast Refresh can
  // retain a previous saved state and otherwise cause a hydration mismatch.
  const visiblySaved=mounted&&saved;
  const save = async () => {
    if (saving) return;
    setSaveError("");
    setSaving(true);
    try {
      const response = await fetch(saved ? `/api/account/wishlist?productSlug=${encodeURIComponent(p.slug)}` : "/api/account/wishlist", { method:saved ? "DELETE" : "POST", headers:{"Content-Type":"application/json"}, body:saved ? undefined : JSON.stringify({productSlug:p.slug}) });
      if (response.status === 401) { location.href = `/login?next=${encodeURIComponent("/account")}`; return; }
      if (!response.ok) { const body=await response.json().catch(()=>({})); setSaveError(body.error||"Could not update wishlist."); return; }
      setSaved((value) => !value);
    } catch { setSaveError("Could not update wishlist."); } finally { setSaving(false); }
  };
  return <motion.article className="product-card" {...fade}><button className="product-image" onClick={()=>open(p)}><Image src={first.src} alt={`${p.name} ${first.label}`} fill sizes="(max-width: 760px) 50vw, 25vw" placeholder="blur" blurDataURL={blurDataURL}/><Image className="second" src={second.src} alt="" fill sizes="(max-width: 760px) 50vw, 25vw" placeholder="blur" blurDataURL={blurDataURL}/><span>{p.isUniqueFind ? "View T-shirt" : "View piece"} <ArrowRight size={14}/></span></button><motion.button className={`card-wishlist ${visiblySaved ? "saved" : ""}`} onPointerDown={(event)=>event.stopPropagation()} onClick={(event)=>{event.preventDefault();event.stopPropagation();void save()}} disabled={saving} aria-label={`${visiblySaved ? "Remove" : "Save"} ${p.name} ${visiblySaved ? "from" : "to"} wishlist`} aria-pressed={visiblySaved} animate={visiblySaved ? {scale:[1,1.28,.96,1]} : {scale:1}} transition={{duration:.36}}><Heart size={16} fill={visiblySaved ? "currentColor" : "none"}/>{visiblySaved&&<motion.i className="wishlist-pop" initial={{scale:.2,opacity:.9}} animate={{scale:1.65,opacity:0}} transition={{duration:.46}}/>}</motion.button>{saveError&&<small className="wishlist-error" role="alert">{saveError}</small>}<div className="product-meta"><button onClick={()=>open(p)}>{!p.isUniqueFind&&<em className="edition-label">EDITION {String(p.editionNumber ?? p.id).padStart(3,"0")}</em>}<b>{p.name}</b><small>{p.isUniqueFind ? (p.uniqueFindStatus==="closed"?"SOLD OUT · NEVER RESTOCKED":p.availableStock===1?"1 LEFT · NEVER RESTOCKED":`ONLY ${p.lifetimeProductionCap||5} MADE · ${p.availableStock||0} LEFT`) : p.color}</small></button><ProductPrice product={p} compact/><button className="quick" onClick={()=>void add(p)} disabled={p.isUniqueFind && (!p.availableStock || p.uniqueFindStatus==="closed")}>{p.isUniqueFind?"Secure":"Quick add"}</button></div></motion.article>
}

function UniqueFindsPage({products,open,add,shop}:{products:Product[];open:(product:Product)=>void;add:(product:Product)=>void;shop:()=>void}) {
  const [entered,setEntered]=useState(false);
  useEffect(()=>{const reduced=matchMedia("(prefers-reduced-motion: reduce)").matches;const seen=sessionStorage.getItem("pr-unique-finds-seen");const timer=window.setTimeout(()=>{if(!reduced&&!seen)sessionStorage.setItem("pr-unique-finds-seen","1");setEntered(true);},reduced||seen?0:1450);return()=>clearTimeout(timer);},[]);
  return <section className="unique-archive">{!entered&&<div className="archive-loader" aria-live="polite"><small>P&amp;R UNIQUE FINDS</small><b>LIMITED RELEASE</b><span>NOW AVAILABLE</span></div>}<header className="unique-page-hero"><div className="unique-page-copy"><p>P&amp;R LIMITED COLLECTION</p><h1>UNIQUE<br/>FINDS</h1><span>Only five or fewer will ever exist.<br/>Sold out means gone forever.</span></div><div className="unique-page-art" aria-hidden="true"><Image src="/images/bone-editorial.jpg" alt="" fill sizes="(max-width: 760px) 100vw, 50vw"/><div className="unique-page-seal"><b>5 OR<br/>FEWER</b><span>EVER MADE</span></div></div></header><div className="unique-promise"><span>LIMITED TO FIVE T-SHIRTS</span><b>Made once. Never Restocked.</b><span>WHEN IT&apos;S GONE, IT&apos;S GONE</span></div>{products.length?<div className="unique-grid">{products.map((product,index)=><ProductCard key={product.id} p={product} i={index} open={open} add={add}/>)}</div>:<div className="archive-empty"><p>UNIQUE FINDS</p><h2>COMING SOON</h2><span>The first limited T-shirts are being prepared.</span><b>Never Restocked.</b><button onClick={shop}>RETURN TO SHOP <ArrowRight size={15}/></button><small>STATUS — COMING SOON</small></div>}</section>
}

function CartPage({cart,add,updateQuantity,updateSize,openProduct,shop,checkout}:{cart:Product[],add:(p:Product)=>void,updateQuantity:(p:Product,quantity:number)=>void,updateSize:(p:Product,size:string)=>void,openProduct:(p:Product)=>void,shop:(filter?:"All"|"Men"|"Women")=>void,checkout:()=>void}) {
  const [codesOpen, setCodesOpen] = useState(false);
  const cartKey = (product: Product) => `${product.variantId || product.slug}:${product.selectedSize || "M"}`;
  const items = Array.from(cart.reduce((grouped, product) => {
    const key = cartKey(product), entry = grouped.get(key);
    grouped.set(key, entry ? {...entry,quantity:entry.quantity+1} : {product,quantity:1});
    return grouped;
  }, new Map<string,{product:Product;quantity:number}>()).values());
  const subtotal = cart.reduce((sum, product) => sum + product.price, 0);
  const freeShippingAt = 1999;
  const away = Math.max(0, freeShippingAt - subtotal);
  const shipping = subtotal === 0 || away === 0 ? 0 : 99;
  const discount = 0;
  const tax = Math.round(subtotal * 0.05);
  const total = subtotal + shipping + tax - discount;
  const progress = Math.min(100, Math.round((subtotal / freeShippingAt) * 100));
  const recommended = products.filter((product) => !items.some((item) => item.product.slug === product.slug)).slice(0, 8);

  if (!cart.length) return <motion.section className="cart-page empty-cart-page" initial={{opacity:0,filter:"blur(10px)",y:18}} animate={{opacity:1,filter:"blur(0px)",y:0}} exit={{opacity:0,filter:"blur(10px)",y:-12}} transition={{duration:.55,ease:[.22,1,.36,1]}}>
    <div className="empty-cart-visual"><img src="/images/campaign-hero.jpg" alt="P&R campaign"/><div><ShoppingBag size={42}/><span>P&R / BAG</span></div></div>
    <div className="empty-cart-copy"><p>SHOPPING BAG</p><h1>Your bag is empty.</h1><span>Looks like you haven&apos;t added anything yet. Start with the pieces everyone keeps coming back to.</span><div><button className="primary" onClick={() => shop("All")}>Continue Shopping</button><button className="secondary" onClick={() => shop("Women")}>Trending Collection</button></div><div className="empty-picks">{recommended.slice(0,3).map((product) => <button key={product.slug} onClick={() => openProduct(product)}>{product.name}<span>₹{product.price.toLocaleString("en-IN")}</span></button>)}</div></div>
  </motion.section>;

  return <>
  <motion.section className="cart-page" initial={{opacity:0,filter:"blur(10px)",y:24}} animate={{opacity:1,filter:"blur(0px)",y:0}} exit={{opacity:0,filter:"blur(8px)",y:-16}} transition={{duration:.58,ease:[.22,1,.36,1]}}>
    <div className="cart-hero"><div><p>SHOPPING BAG</p><h1>Review your pieces.</h1></div><span>{items.length} {items.length === 1 ? "piece" : "pieces"} selected · Secure checkout ready</span></div>
    <div className="cart-layout">
      <div className="bag-column">
        <div className="bag-column-head"><span>Item</span><span>Details</span><span>Total</span></div>
        <AnimatePresence initial={false}>
          {items.map(({product, quantity}, index) => <motion.article className="bag-card" key={cartKey(product)} initial={{opacity:0,y:24,scale:.98}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,scale:.96}} transition={{duration:.42,delay:index*.04,ease:[.22,1,.36,1]}}>
            <button className="bag-image" onClick={() => openProduct(product)}><Image src={product.gallery[0].src} alt={product.name} fill sizes="(max-width: 760px) 34vw, 22vw" placeholder="blur" blurDataURL={blurDataURL}/></button>
            <div className="bag-details">
              <div className="bag-topline"><span>{product.isUniqueFind ? `Limited to ${product.lifetimeProductionCap||5} T-shirts · Never Restocked` : `Edition ${String(product.editionNumber??product.id).padStart(3,"0")} / ${product.category}`}</span><button aria-label="Save to wishlist"><Heart size={18}/></button></div>
              <button className="bag-name" onClick={() => openProduct(product)}>{product.name}</button>
              <p>{product.note}</p>
              <div className="bag-options">
                <label>Color <span>{product.color}</span></label>
                <label>Stock <span>In stock</span></label>
                <label>Size <select value={product.selectedSize || "M"} onChange={(event) => updateSize(product,event.target.value)}>{(product.variants?.filter(variant=>variant.stock>0).map(variant=>variant.size) || ["XS","S","M","L","XL"]).map((size) => <option key={size}>{size}</option>)}</select></label>
              </div>
              <div className="bag-actions">
                <div className="qty" aria-label={`Quantity for ${product.name}`}><button onClick={() => updateQuantity(product, quantity - 1)}><Minus size={14}/></button><motion.span key={quantity} initial={{y:8,opacity:0}} animate={{y:0,opacity:1}}>{quantity}</motion.span><button onClick={() => updateQuantity(product, quantity + 1)}><Plus size={14}/></button></div>
                <button className="remove" onClick={() => updateQuantity(product, 0)}>Remove</button>
              </div>
              <div className="delivery"><Truck size={16}/><span>Estimated delivery: 3–5 business days</span></div>
            </div>
            <strong>₹{(product.price * quantity).toLocaleString("en-IN")}</strong>
          </motion.article>)}
        </AnimatePresence>
      </div>
      <aside className="summary-card">
        <p>ORDER SUMMARY</p>
        <div className="summary-group">
          <div className="summary-row"><span>Subtotal</span><motion.b key={subtotal} initial={{opacity:0,y:6}} animate={{opacity:1,y:0}}>₹{subtotal.toLocaleString("en-IN")}</motion.b></div>
          <div className="summary-row"><span>Shipping</span><b>{shipping ? `₹${shipping}` : "Free"}</b></div>
          <div className="summary-row"><span>Discount</span><b>₹{discount}</b></div>
          <div className="summary-row"><span>Taxes</span><b>₹{tax.toLocaleString("en-IN")}</b></div>
        </div>
        <div className="summary-total"><span>Total</span><motion.b key={total} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}>₹{total.toLocaleString("en-IN")}</motion.b></div>
        <button className="checkout-button" onClick={checkout}>Checkout <ArrowRight size={15}/></button>
        <div className="express"><span>Express checkout</span><div><button>Apple Pay</button><button>Google Pay</button><button>UPI</button></div></div>
        <button className="codes-toggle" onClick={() => setCodesOpen((value) => !value)}>Coupon & gift cards <ChevronDown size={14}/></button>
        <AnimatePresence initial={false}>{codesOpen && <motion.div className="codes-panel" initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}} exit={{height:0,opacity:0}} transition={{duration:.28,ease:[.22,1,.36,1]}}><label className="code-input">Coupon code<input placeholder="Enter code"/></label><label className="code-input">Gift card<input placeholder="Gift card number"/></label></motion.div>}</AnimatePresence>
        <div className="free-shipping"><div><span style={{width:`${progress}%`}}/></div><p>{away ? `Only ₹${away.toLocaleString("en-IN")} away from FREE SHIPPING` : "You unlocked FREE SHIPPING"}</p></div>
        <div className="summary-note"><Truck size={17}/><span>Estimated delivery: 3–5 business days.</span></div>
        <div className="summary-note"><ShieldCheck size={17}/><span>Secure checkout. Easy returns within 7 days.</span></div>
        <div className="summary-trust"><span>SSL secured</span><span>Cashfree / UPI</span><span>Easy exchange</span></div>
      </aside>
    </div>
    <section className="recommendations"><div><p>YOU MAY ALSO LIKE</p><h2>Complete the uniform.</h2></div><div className="recommendation-track">{recommended.map((product) => <article className="recommend-card" key={product.slug}><button className="recommend-image" onClick={() => openProduct(product)}><Image src={product.gallery[0].src} alt={product.name} fill sizes="260px" placeholder="blur" blurDataURL={blurDataURL}/>{product.gallery[1] && <Image className="second" src={product.gallery[1].src} alt="" fill sizes="260px" placeholder="blur" blurDataURL={blurDataURL}/>}<Heart size={17}/></button><div><button onClick={() => openProduct(product)}>{product.name}</button><span>₹{product.price.toLocaleString("en-IN")}</span></div><button className="quick-add" onClick={() => add(product)}>Quick add</button></article>)}</div></section>
    <div className="trust-strip"><span>✓ Premium Quality</span><span>✓ Free Shipping above ₹1999</span><span>✓ Easy Returns</span><span>✓ Secure Payments</span></div>
  </motion.section>
  <div className="mobile-checkout-bar"><span>₹{total.toLocaleString("en-IN")}</span><button onClick={checkout}>Checkout</button></div>
  </>
}

function ProductGallery({product}:{product:Product}) {
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [lightboxSeen, setLightboxSeen] = useState(0);
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
    requestAnimationFrame(() => document.getElementById(`lightbox-shot-${product.id}-${lightbox}`)?.scrollIntoView({ block: "start" }));
    const observers = images.map((_, index) => {
      const el = document.getElementById(`lightbox-shot-${product.id}-${index}`);
      if (!el) return null;
      const observer = new IntersectionObserver(([entry]) => entry.isIntersecting && setLightboxSeen(index), { threshold: .58 });
      observer.observe(el);
      return observer;
    });
    return () => observers.forEach((observer) => observer?.disconnect());
  }, [images, lightbox, product.id]);

  useEffect(() => {
    if (lightbox === null) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLightbox(null);
      if (event.key === "ArrowRight") setLightbox((value) => { if (value === null) return value; const next = (value + 1) % images.length; setLightboxSeen(next); return next; });
      if (event.key === "ArrowLeft") setLightbox((value) => { if (value === null) return value; const next = (value - 1 + images.length) % images.length; setLightboxSeen(next); return next; });
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [images.length, lightbox]);

  const openAt = (index: number) => { setLightbox(index); setLightboxSeen(index); setZoomed(false); };
  const changeLightbox = (step: number) => setLightbox((value) => { if (value === null) return value; const next = (value + step + images.length) % images.length; setLightboxSeen(next); return next; });
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
      <div className="lightbox-scroll-gallery">
        {images.map((image, index) => <motion.button id={`lightbox-shot-${product.id}-${index}`} className="lightbox-scroll-frame" key={image.key} onClick={handleLightboxTap} initial={{opacity:.72, scale:.965}} whileInView={{opacity:1, scale:1}} viewport={{amount:.72}} transition={{duration:.42, ease:[.22,1,.36,1]}}><Image src={image.src} alt={`${product.name} ${image.label}`} fill sizes="100vw" priority={index === lightbox} placeholder="blur" blurDataURL={blurDataURL}/></motion.button>)}
      </div>
      <motion.button className={`lightbox-image ${zoomed ? "zoomed" : ""}`} onClick={handleLightboxTap}>
        <Image src={images[lightbox].src} alt={`${product.name} ${images[lightbox].label}`} fill sizes="100vw" priority placeholder="blur" blurDataURL={blurDataURL}/>
      </motion.button>
      <button className="lightbox-arrow right" onClick={() => changeLightbox(1)} aria-label="Next image"><ChevronRight size={24}/></button>
      <div className="lightbox-count">{lightboxSeen + 1} / {images.length}</div>
    </motion.div>}</AnimatePresence>
  </div>
}

function ProductInfo({product,onAdd,onBuy}:{product:Product;onAdd:(item:Product)=>void;onBuy:(item:Product)=>void}) {
  const availableVariants = product.variants?.filter((variant) => variant.stock > 0) ?? [];
  const [size,setSize]=useState(() => availableVariants.find((variant) => variant.size === "M")?.size || availableVariants[0]?.size || "M");
  const [open,setOpen]=useState("Details");
  const [sizeGuideOpen,setSizeGuideOpen]=useState(false);
  const inches = [["XS","40″","27″","18″"],["S","42″","28″","19″"],["M","44″","29″","20″"],["L","46″","30″","21″"],["XL","48″","31″","22″"],["2XL","50″","32″","23″"]];
  const centimetres = [["XS","102 cm","69 cm","46 cm"],["S","107 cm","71 cm","48 cm"],["M","112 cm","74 cm","51 cm"],["L","117 cm","76 cm","53 cm"],["XL","122 cm","79 cm","56 cm"],["2XL","127 cm","81 cm","58 cm"]];
  const table = (rows:string[][]) => <div className="size-guide-table-wrap"><table><thead><tr><th>Size</th><th>Chest</th><th>Length</th><th>Shoulder</th></tr></thead><tbody>{rows.map(([label,chest,length,shoulder])=><tr key={label}><th>{label}</th><td>{chest}</td><td>{length}</td><td>{shoulder}</td></tr>)}</tbody></table></div>;
  const selectedVariant = availableVariants.find((variant) => variant.size === size) || product.variants?.find((variant) => variant.size === size);
  const selectedItem = {...product, selectedSize:size, variantId:selectedVariant?.id || product.variantId};
  useEffect(() => { const available=availableVariants.find((variant)=>variant.size===size); if (!available && availableVariants[0]) setSize(availableVariants[0].size); }, [product.slug, availableVariants, size]);
  return <>
    <aside className="product-info">{!product.isUniqueFind&&<p>EDITION {String(product.editionNumber ?? product.id).padStart(3,"0")}</p>}{product.isUniqueFind&&<small className="unique-product-kicker">UNIQUE FIND · Limited to {product.lifetimeProductionCap||5} T-shirts. Never Restocked.</small>}<h1>{product.name}</h1><ProductPrice product={product}/><span className="tax">Inclusive of all taxes</span><p className="description">{product.isUniqueFind ? (product.uniqueFindStatus==="closed" ? "This T-shirt is sold out and will never be restocked." : `Only ${product.lifetimeProductionCap||5} made. ${product.availableStock===1?"1 left.":`${product.availableStock||0} left.`} This design will never be restocked.`) : "An oversized study in proportion. Cut from dense combed cotton with dropped shoulders and a structured, easy drape."}</p><div className="choice"><label>Colour <span>{product.color}</span></label><div className={`swatch ${product.color.includes("Bone")||product.color.includes("Ecru")?"light":""}`}/></div><div className="choice"><label>Size <button type="button" onClick={()=>setSizeGuideOpen(true)} aria-haspopup="dialog">Size guide</button></label><div className="sizes">{(availableVariants.length ? availableVariants.map((variant)=>variant.size) : ["XS","S","M","L","XL"]).map(s=><button disabled={product.isUniqueFind&&product.uniqueFindStatus==="closed"} className={size===s?"selected":""} onClick={()=>setSize(s)} key={s}>{s}</button>)}</div></div><button className="primary" disabled={product.isUniqueFind&&(!product.availableStock||product.uniqueFindStatus==="closed")} onClick={()=>void onAdd(selectedItem)}>{product.isUniqueFind ? (product.uniqueFindStatus==="closed"?"SOLD OUT":"SECURE THIS T-SHIRT") : "Add to bag"}</button>{!product.isUniqueFind&&<button className="secondary" onClick={()=>onBuy(selectedItem)}>Buy now</button>}<div className="accordions">{["Details","Shipping & returns","Care guide"].map(x=><div key={x}><button onClick={()=>setOpen(open===x?"":x)}>{x}<Plus size={15}/></button>{open===x&&<motion.p initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}}>{x==="Details"?product.note:x==="Care guide"?"Cold wash inside out. Do not tumble dry. Iron on reverse.":"Complimentary shipping across India. Easy returns within 7 days."}</motion.p>}</div>)}</div></aside>
    <AnimatePresence>{sizeGuideOpen&&<motion.div className="size-guide-modal" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} role="dialog" aria-modal="true" aria-labelledby="size-guide-title"><button className="size-guide-backdrop" aria-label="Close size guide" onClick={()=>setSizeGuideOpen(false)}/><motion.aside className="size-guide-panel" initial={{x:"100%"}} animate={{x:0}} exit={{x:"100%"}} transition={{duration:.35,ease:[.22,1,.36,1]}}><header><div><p>FIT &amp; SIZING</p><h2 id="size-guide-title">Oversized T-Shirt<br/>Size Guide</h2></div><button aria-label="Close size guide" onClick={()=>setSizeGuideOpen(false)}><X size={22}/></button></header><p className="size-guide-note">All measurements are garment measurements. For a relaxed oversized fit, choose your usual size.</p><section><h3>Inches</h3>{table(inches)}</section><section><h3>Centimetres</h3>{table(centimetres)}</section></motion.aside></motion.div>}</AnimatePresence>
  </>;
}

type ConfirmedOrder = { id:number; firstName:string; items:Product[]; total:number; shipping:number; placedAt:string };

function CheckoutPage({cart,backToCart,continueShopping,viewOrders,onPlaced}:{cart:Product[];backToCart:()=>void;continueShopping:()=>void;viewOrders:()=>void;onPlaced:()=>void}) {
  const [status, setStatus] = useState<"idle"|"loading"|"success"|"error">("idle");
  const [message, setMessage] = useState("");
  const [wallet, setWallet] = useState(0);
  const [useWallet, setUseWallet] = useState(false);
  const [walletInput, setWalletInput] = useState("0");
  const [checkoutKey, setCheckoutKey] = useState("");
  const [confirmedOrder, setConfirmedOrder] = useState<ConfirmedOrder | null>(null);
  const subtotal = cart.reduce((sum, product) => sum + product.price, 0);
  const discount = 0;
  const shipping = subtotal >= 1999 ? 0 : subtotal > 0 ? 99 : 0;
  const total = subtotal - discount + shipping;
  const availableWalletRupees = Math.floor(wallet / 100);
  const maxWallet = Math.min(availableWalletRupees, total);
  const walletApplied = useWallet ? Math.min(Math.max(0, Math.floor(Number(walletInput) || 0)), maxWallet) : 0;
  useEffect(() => { fetch("/api/account").then((response) => response.ok ? response.json() : null).then((data) => setWallet(data?.wallet?.approved ?? 0)).catch(() => {}); }, []);
  useEffect(() => {
    const fingerprint = JSON.stringify(cart.map((product) => product.slug).sort());
    try {
      const saved = JSON.parse(sessionStorage.getItem("pr-checkout-session") ?? "null") as {fingerprint?:string;key?:string}|null;
      const key = saved?.fingerprint === fingerprint && saved.key ? saved.key : crypto.randomUUID();
      sessionStorage.setItem("pr-checkout-session", JSON.stringify({ fingerprint, key }));
      queueMicrotask(() => setCheckoutKey(key));
    } catch { queueMicrotask(() => setCheckoutKey(crypto.randomUUID())); }
  }, [cart]);
  const toggleWallet = (checked:boolean) => { setUseWallet(checked); setWalletInput(checked ? String(maxWallet) : "0"); };
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!cart.length) { setStatus("error"); setMessage("Your bag is empty."); return; }
    const form = new FormData(event.currentTarget);
    const grouped = new Map<string, {product:Product;quantity:number}>();
    cart.forEach((product) => { const key=`${product.variantId || product.slug}:${product.selectedSize || "M"}`; const line=grouped.get(key); grouped.set(key,line ? {...line,quantity:line.quantity+1} : {product,quantity:1}); });
    setStatus("loading");
    setMessage("");
    try {
      const response = await fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone: form.get("phone"), firstName: form.get("firstName"), lastName: form.get("lastName"), address: form.get("address"), city: form.get("city"), pinCode: form.get("pinCode"), checkoutKey: checkoutKey || crypto.randomUUID(), walletAmount: walletApplied, paymentMethod:"cod", items: [...grouped.values()].map(({product,quantity}) => product.variantId ? {variantId:product.variantId,quantity} : {productSlug:product.slug,quantity,size:product.selectedSize||"M"}) }) });
      const result = await response.json().catch(() => ({})) as { orderId?: number; error?: string };
      if (!response.ok) throw new Error(result.error ?? "Unable to place your order.");
      setConfirmedOrder({ id:result.orderId ?? 0, firstName:String(form.get("firstName") || "there").trim().split(/\s+/)[0] || "there", items:[...cart], total:Math.max(0,total-walletApplied), shipping, placedAt:new Date().toLocaleDateString("en-IN", {day:"numeric",month:"long",year:"numeric"}) });
      setStatus("success");
      setMessage(`Order #${result.orderId} is confirmed. We’ll update you on your mobile number.`);
      sessionStorage.removeItem("pr-checkout-session");
      onPlaced();
    } catch (error) { setStatus("error"); setMessage(error instanceof Error ? error.message : "Unable to place your order."); }
  };
  return <motion.div key="checkout" className="checkout" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
    <button className="back" onClick={backToCart}><ArrowLeft size={15}/> Return to bag</button><p>SECURE CHECKOUT</p><h1>{status === "success" ? "Order received." : "Finish your order"}</h1>
    {status === "success" && confirmedOrder ? <motion.section className="checkout-confirmation" role="status" initial={{opacity:0,y:18}} animate={{opacity:1,y:0}} transition={{duration:.5,ease:[.22,1,.36,1]}}><motion.div className="confirmation-check" initial={{scale:.35,rotate:-45}} animate={{scale:1,rotate:0}} transition={{type:"spring",stiffness:260,damping:17}}><Check size={27}/></motion.div><p className="confirmation-kicker">ORDER CONFIRMED</p><h2>Thanks for your order,<br/>{confirmedOrder.firstName}.</h2><span className="confirmation-number">Order #PR{confirmedOrder.id} · {confirmedOrder.placedAt}</span><div className="confirmation-flight" aria-hidden="true"><span/><motion.i initial={{x:-18,y:7,rotate:-12,opacity:0}} animate={{x:18,y:-7,rotate:0,opacity:1}} transition={{duration:.7,delay:.25,ease:[.22,1,.36,1]}}>✈</motion.i><span/></div><p className="confirmation-note">Your order is in. We’ll send each delivery update to your mobile number.</p><div className="confirmation-actions"><button className="primary" onClick={viewOrders}>View my order <ArrowRight size={15}/></button><button className="secondary" onClick={continueShopping}>Continue shopping</button></div><section className="confirmation-summary"><header><span>YOUR ORDER</span><b>₹{confirmedOrder.total.toLocaleString("en-IN")}</b></header>{confirmedOrder.items.map((product,index)=><article key={`${product.slug}-${index}`}><img src={product.gallery[0].src} alt=""/><span><b>{product.name}</b><small>{product.color} · Size {product.selectedSize || "M"}</small></span><strong>₹{product.price.toLocaleString("en-IN")}</strong></article>)}<footer><span>Shipping</span><b>{confirmedOrder.shipping ? `₹${confirmedOrder.shipping}` : "Free"}</b></footer></section></motion.section> : <div className="checkout-grid"><form onSubmit={submit}><label>Mobile number<input name="phone" type="tel" inputMode="tel" placeholder="98765 43210" required/></label><h3>Delivery</h3><div className="split"><label>First name<input name="firstName" required/></label><label>Last name<input name="lastName" required/></label></div><label>Address<input name="address" required/></label><div className="split"><label>City<input name="city" required/></label><label>PIN code<input name="pinCode" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required/></label></div>{wallet > 0 && <div className="checkout-wallet"><label className="wallet-check"><input type="checkbox" checked={useWallet} onChange={(event) => toggleWallet(event.target.checked)}/><span><b>Use wallet credit</b><small>₹{availableWalletRupees.toLocaleString("en-IN")} available · Use at checkout</small></span></label>{useWallet&&<label>Amount to use<input type="number" inputMode="numeric" min={0} max={maxWallet} step={1} value={walletInput} onChange={(event)=>setWalletInput(event.target.value)} onBlur={()=>setWalletInput(String(walletApplied))}/><small>Maximum ₹{maxWallet.toLocaleString("en-IN")}</small></label>}</div>}<button className="primary" disabled={status === "loading"}>{status === "loading" ? "Saving order…" : "Place order"}</button>{message && <small className="form-message error" role="alert">{message}</small>}</form><aside><h3>Your order</h3>{cart.map((product,index)=><div className="order-item" key={index}><img src={product.gallery[0].src} alt=""/><span>{product.name}<small>{product.color} / {product.selectedSize || "M"}</small></span><b>₹{product.price.toLocaleString("en-IN")}</b></div>)}<div className="checkout-breakdown"><div><span>Subtotal</span><b>₹{subtotal.toLocaleString("en-IN")}</b></div><div><span>Discount</span><b>−₹{discount.toLocaleString("en-IN")}</b></div><div className="wallet-line"><span>Wallet Applied</span><b>−₹{walletApplied.toLocaleString("en-IN")}</b></div><div><span>Shipping</span><b>{shipping?`₹${shipping.toLocaleString("en-IN")}`:"Free"}</b></div><div className="final"><span>Final Amount</span><b>₹{Math.max(0,total-walletApplied).toLocaleString("en-IN")}</b></div></div></aside></div>}
  </motion.div>;
}

type AccountPayload = {
  customer:{firstName:string;lastName:string;phone:string;referralCode:string};
  referralLink:string;
  wallet:{pending:number;approved:number;used:number;ledger:Array<{id:number;amount:number;status:string;note:string;createdAt:string}>};
  addresses:Array<{id:number;label:string;line1:string;city:string;state:string;pinCode:string}>;
  orders:Array<{id:number;status:string;totalAmount:number;walletAmount:number;createdAt:string;items:Array<{id:number;productName:string;quantity:number;size:string}>}>;
  wishlist:Array<{id:number;productSlug:string;product:Product|null}>;
};

function AccountPage({shop,openProduct}:{shop:()=>void;openProduct:(product:Product)=>void}) {
  const [data,setData]=useState<AccountPayload|null>(null);
  const [loading,setLoading]=useState(true);
  const [unauthenticated,setUnauthenticated]=useState(false);
  const [tab,setTab]=useState<AccountTab>("overview");
  const [notice,setNotice]=useState("");
  const [orderDetail,setOrderDetail]=useState<Record<string,unknown>|null>(null);
  const [editingProfile,setEditingProfile]=useState(false);
  const load=async()=>{
    setLoading(true);
    const response=await fetch("/api/account",{cache:"no-store"});
    if(response.status===401){setUnauthenticated(true);setLoading(false);return}
    if(!response.ok){setNotice("Unable to load your account right now.");setLoading(false);return}
    const next=await response.json() as AccountPayload;
    setData(next);setLoading(false);
    const referral=new URLSearchParams(location.search).get("ref")||localStorage.getItem("pr-referral");
    if(referral){await fetch("/api/account",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({referralCode:referral})});localStorage.removeItem("pr-referral")}
  };
  const chooseTab = (next: AccountTab) => {
    setTab(next);
    history.replaceState({ view:"account", tab:next }, "", next === "overview" ? "/account" : `/account?tab=${next}`);
  };
  useEffect(()=>{const params=new URLSearchParams(location.search);const referral=params.get("ref");if(referral)localStorage.setItem("pr-referral",referral);const requested=params.get("tab");if(requested === "orders" || requested === "wishlist" || requested === "addresses" || requested === "wallet")queueMicrotask(()=>setTab(requested));queueMicrotask(()=>void load())},[]);
  const saveProfile=async(event:FormEvent<HTMLFormElement>)=>{event.preventDefault();const form=new FormData(event.currentTarget);const response=await fetch("/api/account",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(Object.fromEntries(form))});setNotice(response.ok?"Profile updated.":"Unable to update profile.");if(response.ok)load()};
  const saveAddress=async(event:FormEvent<HTMLFormElement>)=>{event.preventDefault();const form=new FormData(event.currentTarget);const response=await fetch("/api/account/addresses",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...Object.fromEntries(form),isDefault:true})});setNotice(response.ok?"Address saved.":"Check the address details.");if(response.ok){event.currentTarget.reset();load()}};
  const removeWishlist=async(slug:string)=>{await fetch(`/api/account/wishlist?productSlug=${encodeURIComponent(slug)}`,{method:"DELETE"});load()};
  const viewOrder=async(id:number)=>{setOrderDetail(null);const response=await fetch(`/api/account/orders/${id}`,{cache:"no-store"});const body=await response.json() as {order?:Record<string,unknown>;error?:string};if(!response.ok){setNotice(body.error||"Unable to load this order.");return}setOrderDetail(body.order||null)};
  const cancelOrder=async(id:number)=>{const reason=window.prompt("Why would you like to cancel this order?");if(reason===null)return;const response=await fetch(`/api/account/orders/${id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"cancel",reason})});const body=await response.json() as {error?:string};setNotice(response.ok?"Your order has been cancelled.":body.error||"Unable to cancel this order.");if(response.ok){setOrderDetail(null);load()}};
  const printInvoice=async(id:number)=>{setNotice("");try{const response=await fetch(`/api/account/orders/${id}/documents`,{cache:"no-store"});if(!response.ok){const body=await response.json() as {error?:string};setNotice(body.error||"Invoice could not be prepared. Please try again.");return}const file=await response.blob();const fileUrl=URL.createObjectURL(file);const printWindow=window.open(fileUrl,"_blank","noopener,noreferrer");if(!printWindow){const link=document.createElement("a");link.href=fileUrl;link.download=`PR-${id}-invoice.pdf`;link.click()}setTimeout(()=>URL.revokeObjectURL(fileUrl),60000)}catch{setNotice("Invoice could not be prepared. Please try again.")}};

  if(loading)return <section className="account-shell account-loading">Preparing your account…</section>;
  if(unauthenticated)return <motion.section className="auth-page" initial={{opacity:0}} animate={{opacity:1}}><div><p>P&R MEMBERS</p><h1>Your wardrobe,<br/><em>remembered.</em></h1><span>Use your name and mobile number to save pieces, track orders, manage addresses and earn referral credit.</span><a className="auth-primary" href="/register?next=%2Faccount">Create account <ArrowRight size={16}/></a><a className="auth-secondary" href="/login?next=%2Faccount">Log in to an existing account</a><p className="auth-note"><ShieldCheck size={15}/> No email, password or OTP required.</p></div><div className="auth-art"><Image src="/images/bone-editorial.jpg" alt="P&R member wardrobe" fill sizes="50vw"/></div></motion.section>;
  if(!data)return <section className="account-shell">Unable to load your account.</section>;
  return <motion.section className="account-shell" initial={{opacity:0}} animate={{opacity:1}}>
    <header className="account-head"><div><p>P&R ACCOUNT</p><h1>Welcome back,<br/>{data.customer.firstName}.</h1></div><button onClick={async()=>{await fetch("/api/auth/sign-out",{method:"POST",credentials:"same-origin"});location.href="/";}}><LogOut size={15}/> Log out</button></header>
    <nav className="account-tabs">{(["overview","orders","wishlist","addresses","wallet"] as const).map((item)=><button className={tab===item?"active":""} onClick={()=>chooseTab(item)} key={item}>{item === "orders" ? "My orders" : item === "wishlist" ? "Wishlist" : item}</button>)}</nav>
    {notice&&<div className="account-notice" role="status">{notice}</div>}
    {tab==="overview"&&<><div className="account-quick-links"><button onClick={()=>chooseTab("orders")}><span><Truck size={22}/></span><div><p>MY ORDERS</p><b>{data.orders.length ? `${data.orders.length} order${data.orders.length === 1 ? "" : "s"}` : "No orders yet"}</b><small>{data.orders[0] ? `Latest: ${titleCase(data.orders[0].status)}` : "Track every delivery here"}</small></div><ArrowRight size={20}/></button><button onClick={()=>chooseTab("wishlist")}><span><Heart size={22}/></span><div><p>WISHLIST</p><b>{data.wishlist.length ? `${data.wishlist.length} saved piece${data.wishlist.length === 1 ? "" : "s"}` : "Your saved pieces"}</b><small>Tap hearts while you shop</small></div><ArrowRight size={20}/></button></div><section className="account-profile-summary"><header><p>PROFILE DETAILS</p><button onClick={()=>setEditingProfile((value)=>!value)}>{editingProfile?"Cancel":"Edit profile"}</button></header>{editingProfile?<form className="profile-form account-profile-edit" onSubmit={async(event)=>{await saveProfile(event);setEditingProfile(false)}}><div className="split"><label>First name<input name="firstName" defaultValue={data.customer.firstName}/></label><label>Last name<input name="lastName" defaultValue={data.customer.lastName}/></label></div><label>Registered mobile<input value={data.customer.phone} disabled/></label><small>Mobile-number changes require customer support.</small><button className="primary">Save profile</button></form>:<div className="account-profile-values"><div><span>FIRST NAME</span><b>{data.customer.firstName||"—"}</b></div><div><span>LAST NAME</span><b>{data.customer.lastName||"—"}</b></div><div><span>REGISTERED MOBILE</span><b>{data.customer.phone||"—"}</b></div></div>}</section><button className="account-address-summary" onClick={()=>chooseTab("addresses")}><span><MapPin size={25}/></span><div><p>SAVED ADDRESS</p><b>{data.addresses.length?data.addresses[0].label:"Add or manage delivery addresses."}</b><small>{data.addresses.length?`${data.addresses[0].line1}, ${data.addresses[0].city}`:"Your saved address will appear here."}</small></div><ArrowRight size={22}/></button></>}
    {tab==="orders"&&<div className="account-list"><div className="account-list-heading"><div><p>ORDER TRACKING</p><h2>My orders</h2><span>Every delivery update from P&amp;R appears here.</span></div><button onClick={()=>void load()}>Refresh</button></div>{data.orders.length?data.orders.map(order=><article key={order.id} className="account-order" onClick={()=>void viewOrder(order.id)}><div><p>ORDER #{order.id}</p><h3>{order.items.map(item=>item.productName).join(", ")||"P&R order"}</h3><span>{new Date(order.createdAt).toLocaleDateString("en-IN")} · <b>{titleCase(order.status)}</b></span></div><b>₹{order.totalAmount.toLocaleString("en-IN")}</b></article>):<EmptyAccount title="No orders yet." action="Explore the collection" onAction={shop}/>} {orderDetail&&<CustomerOrderDetail order={orderDetail} onClose={()=>setOrderDetail(null)} onCancel={()=>void cancelOrder(Number(orderDetail.id))} onPrint={()=>void printInvoice(Number(orderDetail.id))}/>}</div>}
    {tab==="wishlist"&&<div className="wishlist-grid">{data.wishlist.length?data.wishlist.map(item=>item.product&&<article key={item.id}><button onClick={()=>openProduct(item.product!)}><Image src={item.product.gallery[0].src} alt={item.product.name} fill sizes="280px"/></button><div><button onClick={()=>openProduct(item.product!)}>{item.product.name}</button><span>₹{item.product.price.toLocaleString("en-IN")}</span></div><button onClick={()=>removeWishlist(item.productSlug)}>Remove</button></article>):<EmptyAccount title="Your wishlist is quiet." action="Find a piece" onAction={shop}/>}</div>}
    {tab==="addresses"&&<div className="account-grid"><div className="account-panel"><p>SAVED ADDRESSES</p>{data.addresses.map(address=><div className="saved-address" key={address.id}><b>{address.label}</b><span>{address.line1}<br/>{address.city}, {address.state} {address.pinCode}</span></div>)}</div><form className="account-panel profile-form" onSubmit={saveAddress}><p>ADD ADDRESS</p><div className="split"><label>First name<input name="firstName" required/></label><label>Last name<input name="lastName" required/></label></div><label>Phone<input name="phone" required/></label><label>Address<input name="line1" required/></label><div className="split"><label>City<input name="city" required/></label><label>State<input name="state" required/></label></div><label>PIN code<input name="pinCode" pattern="[0-9]{6}" required/></label><button className="primary">Save address</button></form></div>}
    {tab==="wallet"&&<div className="wallet-layout"><div className="wallet-balances"><div><span>Pending</span><b>₹{data.wallet.pending/100}</b></div><div className="dark"><span>Approved</span><b>₹{data.wallet.approved/100}</b></div><div><span>Used</span><b>₹{data.wallet.used/100}</b></div></div><div className="account-panel"><p>TRANSACTION HISTORY</p>{data.wallet.ledger.length?data.wallet.ledger.map(entry=><div className="ledger-row" key={entry.id}><span><b>{entry.note}</b><small>{new Date(entry.createdAt).toLocaleDateString("en-IN")} · {entry.status}</small></span><strong className={entry.amount<0?"debit":""}>{entry.amount<0?"−":"+"}₹{Math.abs(entry.amount)/100}</strong></div>):<span>No wallet activity yet.</span>}</div></div>}
  </motion.section>;
}

function EmptyAccount({title,action,onAction}:{title:string;action:string;onAction:()=>void}){return <div className="account-empty"><h2>{title}</h2><button onClick={onAction}>{action} <ArrowRight size={15}/></button></div>}

function CustomerOrderDetail({order,onClose,onCancel,onPrint}:{order:Record<string,unknown>;onClose:()=>void;onCancel:()=>void;onPrint:()=>void}) {
  const timeline=Array.isArray(order.timeline)?order.timeline as Array<Record<string,unknown>>:[];
  const items=Array.isArray(order.items)?order.items as Array<Record<string,unknown>>:[];
  const status=String(order.status||"pending");
  const mayCancel=["pending","awaiting_payment","confirmed","processing"].includes(status);
  const tracking=[order.courier,order.tracking_id].filter(Boolean).map(String).join(" · ");
  return <article className="customer-order-detail"><header><button className="customer-order-back" onClick={onClose}><ArrowLeft size={15}/> Back to my orders</button><span className={`customer-order-status status-${status}`}>{titleCase(status)}</span></header><div className="customer-order-title"><div><p>ORDER #PR{String(order.id)}</p><h3>{items.map(item=>String(item.product_name||"P&R piece")).join(", ")||"Your P&R order"}</h3></div><strong>₹{Math.round(Number(order.total_amount||0)/100).toLocaleString("en-IN")}</strong></div><section className="customer-order-progress"><div><span className="customer-progress-icon"><Truck size={18}/></span><div><p>DELIVERY UPDATE</p><h4>{tracking||"We’re preparing your shipment"}</h4><small>{String(order.tracking_url||"We’ll let you know as soon as your order is on its way.")}</small></div></div></section><div className="customer-order-grid"><section><p className="customer-section-label">ITEMS</p><div className="customer-order-items">{items.map((item,index)=><article key={`${String(item.product_slug)}-${index}`}>{item.image_url?<img src={String(item.image_url)} alt=""/>:<span/>}<div><b>{String(item.product_name||"P&R piece")}</b><small>{String(item.color||"Signature colour")} · Size {String(item.size||"M")} · Qty {String(item.quantity||1)}</small></div><strong>₹{Math.round(Number(item.unit_price||0)/100).toLocaleString("en-IN")}</strong></article>)}</div></section><section><p className="customer-section-label">TRACKING TIMELINE</p><div className="customer-order-timeline">{timeline.length?timeline.map(entry=><article key={String(entry.id)}><i/><div><b>{String(entry.public_title||"Order update")}</b><p>{String(entry.public_description||"")}</p><small>{formatOrderDate(entry.created_at)}</small></div></article>):<p>No delivery updates yet.</p>}</div></section></div><footer className="customer-order-actions"><button className="customer-order-invoice" onClick={onPrint}><FileText size={16}/> View / print invoice</button>{mayCancel&&<button className="customer-order-cancel" onClick={onCancel}>Cancel this order</button>}</footer></article>
}

function formatOrderDate(value: unknown) { const number=Number(value); const date=Number.isFinite(number)&&number>0?new Date(number<1000000000000?number*1000:number):new Date(String(value)); return Number.isNaN(date.getTime())?"":date.toLocaleString("en-IN",{dateStyle:"medium",timeStyle:"short"}); }

function titleCase(value: string) { return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()); }

function Cart({cart,close,remove,checkout}:{cart:Product[],close:()=>void,remove:(i:number)=>void,checkout:()=>void}) { return <><motion.div className="scrim" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={close}/><motion.aside className="cart" initial={{x:"100%"}} animate={{x:0}} exit={{x:"100%"}} transition={{duration:.5,ease:[.22,1,.36,1]}}><header><span>Your bag / {cart.length}</span><button onClick={close}><X/></button></header>{!cart.length?<div className="empty"><ShoppingBag/><h2>Your bag is empty.</h2><button onClick={close}>Continue shopping</button></div>:<><div className="cart-list">{cart.map((p,i)=><div className="cart-item" key={i}><img src={p.gallery[0].src} alt=""/><div><b>{p.name}</b><small>{p.color} / {p.selectedSize || "M"}</small><span>₹{p.price.toLocaleString("en-IN")}</span><button onClick={()=>remove(i)}>Remove</button></div></div>)}</div><footer><p><span>Subtotal</span><b>₹{cart.reduce((s,p)=>s+p.price,0).toLocaleString("en-IN")}</b></p><small>Shipping calculated at checkout.</small><button className="primary" onClick={checkout}>Checkout <ArrowRight size={15}/></button></footer></>}</motion.aside></> }

function SearchOverlay({close,openProduct}:{close:()=>void,openProduct:(p:Product)=>void}){const [query,setQuery]=useState("");const input=useRef<HTMLInputElement>(null);useEffect(()=>{input.current?.focus();const key=(e:KeyboardEvent)=>e.key==="Escape"&&close();addEventListener("keydown",key);return()=>removeEventListener("keydown",key)},[close]);const results=query.trim()?products.filter(p=>`${p.name} ${p.color} ${p.category}`.toLowerCase().includes(query.toLowerCase())):products.slice(0,4);return <motion.div className="search-overlay" role="dialog" aria-modal="true" aria-label="Product search" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}><header><label htmlFor="site-search">Search P&R</label><input ref={input} id="site-search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search products, colour or category"/><button onClick={close} aria-label="Close search"><X/></button></header><div className="search-body"><p>{query ? `${results.length} RESULTS` : "TRENDING NOW"}</p>{results.length?<div>{results.map(p=><button key={p.slug} onClick={()=>{close();openProduct(p)}}><Image src={p.gallery[0].src} alt="" width={90} height={112}/><span><b>{p.name}</b><small>{p.color} / {p.category}</small></span><strong>₹{p.price.toLocaleString("en-IN")}</strong></button>)}</div>:<div className="search-empty"><h2>Nothing found.</h2><span>Try “black”, “women” or “oversized”.</span></div>}</div></motion.div>}
function Newsletter(){const [status,setStatus]=useState<"idle"|"loading"|"success"|"error">("idle");const [message,setMessage]=useState("");const submit=async(e:FormEvent<HTMLFormElement>)=>{e.preventDefault();const form=e.currentTarget;const email=new FormData(form).get("email")?.toString().trim()??"";if(!/^\\S+@\\S+\\.\\S+$/.test(email)){setStatus("error");setMessage("Enter a valid email address.");return}setStatus("loading");setMessage("");try{const response=await fetch("/api/newsletter",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email})});const result=await response.json() as {error?:string};if(!response.ok)throw new Error(result.error??"Unable to subscribe.");setStatus("success");setMessage("You’re on the list.");form.reset()}catch(error){setStatus("error");setMessage(error instanceof Error?error.message:"Unable to subscribe.")}};return <section className="newsletter"><p>PRIVATE NOTES / P&R</p><h2>Updates worth opening.</h2><span>New editions, restocks and occasional studio notes.</span><form onSubmit={submit}><label className="sr-only" htmlFor="newsletter-email">Email address</label><input id="newsletter-email" name="email" type="email" placeholder="Enter your email address" aria-describedby="newsletter-status" required/><button aria-label="Subscribe" disabled={status==="loading"}>{status==="loading"?"…":<ArrowRight/>}</button></form><small id="newsletter-status" role="status">{message||"By subscribing, you agree to receive occasional updates from P&R."}</small></section>}
function Footer({go,goAccount}:{go:(v:View)=>void;goAccount:(tab?:AccountTab)=>void}){return <footer className="site-footer"><button className="footer-logo" onClick={()=>go("home")}>P<span>&</span>R</button><div><p>Explore</p><button onClick={()=>go("collection")}>Shop all</button><button onClick={()=>go("collection")}>Men</button><button onClick={()=>go("collection")}>Women</button></div><div><p>Account</p><button onClick={()=>goAccount()}>Profile</button><button onClick={()=>goAccount("orders")}>My orders</button><button onClick={()=>goAccount("wishlist")}>Wishlist</button><button onClick={()=>goAccount("wallet")}>Wallet</button></div><div><p>Help</p><button onClick={()=>go("about")}>Shipping & Returns</button><button onClick={()=>go("collection")}>Size Guide</button><button onClick={()=>go("about")}>Contact</button></div><div><p>Studio</p><button>Instagram</button><button>Privacy</button><button>Terms</button></div><small>© 2026 P&R STUDIOS — INDIA</small></footer>}
