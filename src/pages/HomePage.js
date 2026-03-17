import React, { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { db } from '../firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import './HomePage.css';

function CarModel({ scrollY, heroHeight }) {
  const group = useRef();
  useFrame((state) => {
    if (!group.current) return;
    const progress = Math.min(scrollY / (heroHeight || 800), 1);
    const targetY = 0.3 + progress * Math.PI * 1.8;
    group.current.rotation.y += (targetY - group.current.rotation.y) * 0.04;
    group.current.rotation.x += (0.05 + Math.sin(progress * Math.PI) * 0.1 - group.current.rotation.x) * 0.04;
    group.current.position.y = Math.sin(state.clock.elapsedTime * 0.8) * 0.025;
  });
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, metalness: 0.95, roughness: 0.08 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x1a2a3a, metalness: 0.1, roughness: 0.05, transparent: true, opacity: 0.7 });
  const goldMat  = new THREE.MeshStandardMaterial({ color: 0xc9a84c, metalness: 1.0, roughness: 0.05 });
  const tireMat  = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.1, roughness: 0.9 });
  const lightMat = new THREE.MeshStandardMaterial({ color: 0xffeedd, emissive: 0xffeedd, emissiveIntensity: 0.4 });
  const redMat   = new THREE.MeshStandardMaterial({ color: 0xff2200, emissive: 0xff2200, emissiveIntensity: 0.5 });
  const darkMat  = new THREE.MeshStandardMaterial({ color: 0x050505, metalness: 0.8, roughness: 0.2 });
  function Wheel({ position }) {
    return (
      <group position={position}>
        <mesh rotation={[Math.PI/2,0,0]} material={tireMat}><cylinderGeometry args={[0.38,0.38,0.28,32]}/></mesh>
        <mesh rotation={[Math.PI/2,0,0]} material={goldMat}><cylinderGeometry args={[0.26,0.26,0.3,10]}/></mesh>
        {[0,1,2,3,4].map(i=>(
          <mesh key={i} rotation={[0,0,i*(Math.PI*2/5)]} material={goldMat}><boxGeometry args={[0.05,0.22,0.3]}/></mesh>
        ))}
      </group>
    );
  }
  return (
    <group ref={group} position={[0,0.05,0]}>
      <mesh position={[0,0.3,0]} material={bodyMat}><boxGeometry args={[3.8,0.55,1.8]}/></mesh>
      <mesh position={[0.95,0.62,0]} material={bodyMat}><boxGeometry args={[1.5,0.18,1.75]}/></mesh>
      <mesh position={[-0.15,0.9,0]} material={bodyMat}><boxGeometry args={[1.7,0.55,1.65]}/></mesh>
      <mesh position={[-0.1,1.18,0]} rotation={[0,Math.PI/4,0]} material={bodyMat}><cylinderGeometry args={[0.6,0.82,0.1,4]}/></mesh>
      <mesh position={[0.6,0.92,0]} rotation={[0,Math.PI/2,-0.35]} material={glassMat}><planeGeometry args={[1.55,0.55]}/></mesh>
      <mesh position={[-0.85,0.9,0]} rotation={[0,Math.PI/2,0.35]} material={glassMat}><planeGeometry args={[1.55,0.5]}/></mesh>
      {[-0.88,0.88].map((z,i)=>(
        <mesh key={i} position={[-0.1,0.92,z]} rotation={[0,i===1?0:Math.PI,0]} material={glassMat}><planeGeometry args={[1.5,0.42]}/></mesh>
      ))}
      <mesh position={[-1.25,0.6,0]} material={bodyMat}><boxGeometry args={[0.9,0.35,1.75]}/></mesh>
      <mesh position={[1.92,0.32,0]} material={goldMat}><boxGeometry args={[0.08,0.3,1.2]}/></mesh>
      {[-0.3,0.3].map((z,i)=>(<mesh key={i} position={[1.93,0.32,z]} material={goldMat}><boxGeometry args={[0.06,0.22,0.42]}/></mesh>))}
      {[-0.65,0.65].map((z,i)=>(
        <group key={i}>
          <mesh position={[1.92,0.42,z]} material={lightMat}><boxGeometry args={[0.06,0.14,0.38]}/></mesh>
          <mesh position={[1.91,0.5,z]} material={lightMat}><boxGeometry args={[0.04,0.06,0.55]}/></mesh>
        </group>
      ))}
      {[-0.65,0.65].map((z,i)=>(<mesh key={i} position={[-1.9,0.45,z]} material={redMat}><boxGeometry args={[0.05,0.16,0.4]}/></mesh>))}
      <mesh position={[-1.7,0.82,0]} material={bodyMat}><boxGeometry args={[0.08,0.22,1.7]}/></mesh>
      <mesh position={[-1.85,0.95,0]} material={bodyMat}><boxGeometry args={[0.35,0.05,1.7]}/></mesh>
      {[-0.92,0.92].map((z,i)=>(<mesh key={i} position={[0,0.05,z]} material={darkMat}><boxGeometry args={[3.2,0.12,0.08]}/></mesh>))}
      <mesh position={[0,-0.02,0]} material={darkMat}><boxGeometry args={[3.4,0.1,1.6]}/></mesh>
      <Wheel position={[1.2,-0.05,-0.93]}/><Wheel position={[1.2,-0.05,0.93]}/>
      <Wheel position={[-1.2,-0.05,-0.93]}/><Wheel position={[-1.2,-0.05,0.93]}/>
    </group>
  );
}

function GearScene({ activeStep }) {
  const g1=useRef(), g2=useRef(), g3=useRef();
  useFrame((state)=>{
    const t=state.clock.elapsedTime;
    if(g1.current) g1.current.rotation.z=t*0.4;
    if(g2.current) g2.current.rotation.z=-t*0.6;
    if(g3.current) g3.current.rotation.z=t*0.3;
  });
  const goldMat=new THREE.MeshStandardMaterial({color:0xc9a84c,metalness:0.9,roughness:0.1});
  const activeMat=new THREE.MeshStandardMaterial({color:0xffd700,metalness:1.0,roughness:0.05,emissive:0xc9a84c,emissiveIntensity:0.4});
  const darkMat=new THREE.MeshStandardMaterial({color:0x1a1a1a,metalness:0.8,roughness:0.2});
  function Gear({gRef,position,scale,step}){
    const mat=activeStep===step?activeMat:goldMat;
    return(
      <group ref={gRef} position={position} scale={scale}>
        <mesh material={mat}><cylinderGeometry args={[0.8,0.8,0.2,20]}/></mesh>
        <mesh material={darkMat}><cylinderGeometry args={[0.35,0.35,0.25,12]}/></mesh>
        {[0,1,2,3,4,5,6,7].map(i=>(<mesh key={i} rotation={[0,0,i*(Math.PI/4)]} material={mat}><boxGeometry args={[0.18,1.0,0.22]}/></mesh>))}
      </group>
    );
  }
  return(
    <>
      <ambientLight intensity={0.4}/>
      <directionalLight position={[5,5,5]} intensity={1.2}/>
      <pointLight position={[0,2,2]} intensity={0.6} color="#c9a84c"/>
      <group ref={g1}><Gear gRef={g1} position={[-1.2,0.5,0]} scale={1} step={0}/></group>
      <group ref={g2}><Gear gRef={g2} position={[0.8,-0.3,0]} scale={0.7} step={1}/></group>
      <group ref={g3}><Gear gRef={g3} position={[1.8,0.8,0]} scale={0.5} step={2}/></group>
    </>
  );
}

export default function HomePage() {
  const [scrollY,setScrollY]=useState(0);
  const [heroHeight,setHeroHeight]=useState(800);
  const [navScrolled,setNavScrolled]=useState(false);
  const [activeStep,setActiveStep]=useState(0);
  const [formLang,setFormLang]=useState('en');
  const [submitting,setSubmitting]=useState(false);
  const [submitted,setSubmitted]=useState(false);
  const [lastReq,setLastReq]=useState(null);
  const [form,setForm]=useState({name:'',phone:'',make:'',model:'',year:'',part:'',desc:''});
  const heroRef=useRef();

  useEffect(()=>{
    if(heroRef.current) setHeroHeight(heroRef.current.offsetHeight);
    const onScroll=()=>{
      setScrollY(window.scrollY);
      setNavScrolled(window.scrollY>60);
      const how=document.getElementById('how');
      if(how){
        const rect=how.getBoundingClientRect();
        const p=1-(rect.top/window.innerHeight);
        if(p>0.2&&p<0.5) setActiveStep(0);
        else if(p>=0.5&&p<0.75) setActiveStep(1);
        else if(p>=0.75) setActiveStep(2);
      }
    };
    window.addEventListener('scroll',onScroll,{passive:true});
    return()=>window.removeEventListener('scroll',onScroll);
  },[]);

  useEffect(()=>{
    const obs=new IntersectionObserver(entries=>{
      entries.forEach(e=>{if(e.isIntersecting)e.target.classList.add('visible');});
    },{threshold:0.15});
    document.querySelectorAll('.reveal').forEach(el=>obs.observe(el));
    return()=>obs.disconnect();
  },[]);

  const scrollTo=(id)=>document.getElementById(id)?.scrollIntoView({behavior:'smooth'});

  const handleSubmit=async(e)=>{
    e.preventDefault();
    if(!form.name||!form.phone||!form.part){alert('Please fill in Name, Phone and Part name.');return;}
    setSubmitting(true);
    try{
      const reqData={...form,status:'new',buy:0,sell:0,createdAt:serverTimestamp(),seenByAdmin:false};
      await addDoc(collection(db,'requests'),reqData);
      setLastReq(reqData);
      setSubmitted(true);
      setForm({name:'',phone:'',make:'',model:'',year:'',part:'',desc:''});
    }catch(err){
      console.error(err);
      alert('Something went wrong. Please try again.');
    }
    setSubmitting(false);
  };

  const openWA=()=>{
    if(!lastReq) return;
    const v=[lastReq.make,lastReq.model,lastReq.year].filter(Boolean).join(' ')||'Not specified';
    const msg=`*KETHAJA — New Part Request*\n\n👤 *Name:* ${lastReq.name}\n📞 *Phone:* ${lastReq.phone}\n🚗 *Vehicle:* ${v}\n🔧 *Part:* ${lastReq.part}\n📝 *Notes:* ${lastReq.desc||'None'}\n\n_Sent via KETHAJA_`;
    window.open(`https://wa.me/94763027060?text=${encodeURIComponent(msg)}`,'_blank');
  };

  const L={
    en:{name:'Full Name',phone:'Phone Number',make:'Vehicle Make',model:'Model',year:'Year',part:'Part Name',desc:'Description',submit:'Submit Request',toggle:'සිංහල',note:'Sent directly to KETHAJA · +94 76 302 7060'},
    si:{name:'නම',phone:'දුරකථන',make:'වාහන නාමය',model:'ආකෘතිය',year:'වර්ෂය',part:'කොටස් නාමය',desc:'විස්තරය',submit:'ඉල්ලීම යවන්න',toggle:'English',note:'KETHAJA වෙත යවනු ලැබේ'},
  };
  const lbl=L[formLang];

  const WaIcon=()=>(
    <svg width="26" height="26" viewBox="0 0 24 24" fill="white">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.115.549 4.099 1.51 5.828L.057 23.885l6.234-1.635A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.006-1.371l-.36-.213-3.7.97.987-3.606-.234-.372A9.818 9.818 0 012.182 12C2.182 6.573 6.573 2.182 12 2.182S21.818 6.573 21.818 12 17.427 21.818 12 21.818z"/>
    </svg>
  );

  return (
    <div className="home">
      <button className="wa-float" onClick={()=>window.open('https://wa.me/94763027060','_blank')}><WaIcon/></button>

      <nav className={`navbar ${navScrolled?'scrolled':''}`}>
        <div className="nav-brand">KETHAJA</div>
        <div className="nav-links">
          <button className="nav-link" onClick={()=>scrollTo('about')}>About</button>
          <button className="nav-link" onClick={()=>scrollTo('how')}>How It Works</button>
          <button className="nav-link" onClick={()=>scrollTo('request')}>Request Part</button>
          <button className="nav-wa" onClick={()=>window.open('https://wa.me/94763027060','_blank')}>WhatsApp</button>
        </div>
      </nav>

      <section id="hero" ref={heroRef} className="hero">
        <div className="hero-bg"/><div className="hero-grid"/><div className="hero-glow"/>
        <Canvas className="hero-canvas" camera={{position:[0,1.2,5.5],fov:45}}>
          <ambientLight intensity={0.15}/>
          <directionalLight position={[5,8,5]} intensity={1.2} castShadow/>
          <directionalLight position={[-5,3,-5]} intensity={0.4} color="#c9a84c"/>
          <directionalLight position={[0,5,-8]} intensity={0.6}/>
          <pointLight position={[0,-1,0]} intensity={0.3} color="#c9a84c"/>
          <CarModel scrollY={scrollY} heroHeight={heroHeight}/>
          <mesh rotation={[-Math.PI/2,0,0]} position={[0,-0.5,0]}>
            <planeGeometry args={[12,8]}/>
            <meshStandardMaterial color={0x080808} metalness={0.9} roughness={0.1} transparent opacity={0.6}/>
          </mesh>
        </Canvas>
        <div className="hero-content">
          <div className="hero-eyebrow">Sri Lanka's Trusted Parts Dealer</div>
          <h1 className="hero-title">KETHAJA</h1>
          <div className="hero-gold-line"/>
          <p className="hero-tagline">Every Part. Every Vehicle. Delivered to Your Door.</p>
          <div className="hero-btns">
            <button className="btn-primary-hero" onClick={()=>scrollTo('request')}>Request a Part</button>
            <button className="btn-ghost-hero" onClick={()=>scrollTo('about')}>Meet Charitha</button>
          </div>
        </div>
        <div className="scroll-hint"><span>Scroll</span><div className="scroll-line"/></div>
      </section>

      <div className="brands-bar">
        <div className="brands-label">WE SOURCE PARTS FOR</div>
        <div className="ticker-wrap">
          <div className="ticker-fade left"/><div className="ticker-fade right"/>
          <div className="ticker">
            {['Toyota','Nissan','Honda','Suzuki','Mitsubishi','BMW','Mercedes','Hyundai','Kia','All Brands',
              'Toyota','Nissan','Honda','Suzuki','Mitsubishi','BMW','Mercedes','Hyundai','Kia','All Brands'].map((b,i)=>(
              <div className="ticker-item" key={i}><span>{b}</span><div className="ticker-dot"/></div>
            ))}
          </div>
        </div>
      </div>

      <section id="about" className="about-section">
        <div className="about-grid reveal">
          <div className="about-visual">
            <div className="about-card">
              <div className="about-card-lines"/>
              <div className="about-badge"><span className="badge-num">15+</span><span className="badge-txt">Years</span></div>
              <div className="about-avatar">CJ</div>
              <div className="about-name">Charitha Jayaweera</div>
              <div className="about-role">Spare Parts Specialist</div>
              <div className="about-stats">
                <div><div className="astat-num">15+</div><div className="astat-lbl">Yrs Exp</div></div>
                <div><div className="astat-num">All</div><div className="astat-lbl">Island</div></div>
                <div><div className="astat-num">100%</div><div className="astat-lbl">Delivery</div></div>
              </div>
            </div>
          </div>
          <div className="about-text">
            <div className="eyebrow">About</div>
            <h2 className="section-title">Meet<br/>Charitha</h2>
            <div className="gold-divider"/>
            <p>With over 15 years in the vehicle spare parts industry, Charitha Jayaweera has built a reputation for finding the right part at the right price — fast. No shop, no overheads — just direct sourcing and door-to-door delivery islandwide.</p>
            <div className="spec-grid">
              {['Cars','Vans','Lorries','Toyota','Nissan','Honda','Suzuki','Mitsubishi','All Brands'].map(s=>(<div className="spec-chip" key={s}>{s}</div>))}
            </div>
          </div>
        </div>
      </section>

      <section id="how" className="how-section">
        <div className="how-inner">
          <div className="how-header reveal">
            <div className="eyebrow">How It Works</div>
            <h2 className="section-title">Three Simple Steps</h2>
            <div className="gold-divider" style={{margin:'1rem auto 0'}}/>
          </div>
          <div className="how-grid reveal">
            <div className="how-canvas-wrap">
              <Canvas camera={{position:[0,1,5],fov:50}}>
                <GearScene activeStep={activeStep}/>
              </Canvas>
            </div>
            <div className="steps-list">
              {[
                {num:'01',title:'Submit Request',desc:'Fill out the form with your vehicle details and the part you need.'},
                {num:'02',title:'We Find It',desc:'Charitha sources the best quality part at the best price from trusted suppliers across Sri Lanka.'},
                {num:'03',title:'Delivered to You',desc:'Your part arrives at your door, anywhere in Sri Lanka. Fast, reliable, islandwide delivery.'},
              ].map((s,i)=>(
                <div className={`step-item ${activeStep===i?'active':''}`} key={i} onClick={()=>setActiveStep(i)}>
                  <div className="step-num">{s.num}</div>
                  <div><div className="step-title">{s.title}</div><div className="step-desc">{s.desc}</div></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="request" className="request-section">
        <div className="request-inner">
          <div className="req-header reveal">
            <div className="eyebrow gold">Part Request</div>
            <h2 className="section-title white">Find Your Part</h2>
            <div className="gold-divider" style={{margin:'1rem auto 2rem'}}/>
          </div>
          {submitted?(
            <div className="success-box reveal">
              <div className="success-check">
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><path d="M5 14l7 7L23 7" stroke="#c9a84c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <h3 className="success-title">Request Sent!</h3>
              <p className="success-sub">Charitha will contact you shortly.<br/>Tap below to also send via WhatsApp for fastest response.</p>
              <button className="wa-big-btn" onClick={openWA}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.115.549 4.099 1.51 5.828L.057 23.885l6.234-1.635A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.006-1.371l-.36-.213-3.7.97.987-3.606-.234-.372A9.818 9.818 0 012.182 12C2.182 6.573 6.573 2.182 12 2.182S21.818 6.573 21.818 12 17.427 21.818 12 21.818z"/></svg>
                Send via WhatsApp
              </button>
              <button className="back-link" onClick={()=>setSubmitted(false)}>Submit Another Request</button>
            </div>
          ):(
            <form className="req-form reveal" onSubmit={handleSubmit}>
              <div className="form-lang-toggle">
                <button type="button" className="lang-toggle-btn" onClick={()=>setFormLang(formLang==='en'?'si':'en')}>{lbl.toggle}</button>
              </div>
              <div className="form-sec-label">Your Details</div>
              <div className="frow">
                <div className="fgroup"><label>{lbl.name} *</label><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Kamal Perera"/></div>
                <div className="fgroup"><label>{lbl.phone} *</label><input type="tel" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="07X XXX XXXX"/></div>
              </div>
              <div className="form-sec-label">Vehicle</div>
              <div className="frow">
                <div className="fgroup"><label>{lbl.make}</label><input value={form.make} onChange={e=>setForm({...form,make:e.target.value})} placeholder="Toyota"/></div>
                <div className="fgroup"><label>{lbl.model}</label><input value={form.model} onChange={e=>setForm({...form,model:e.target.value})} placeholder="Corolla"/></div>
              </div>
              <div className="fgroup"><label>{lbl.year}</label><input type="number" value={form.year} onChange={e=>setForm({...form,year:e.target.value})} placeholder="2015" min="1970" max="2026"/></div>
              <div className="form-sec-label">Part Details</div>
              <div className="fgroup"><label>{lbl.part} *</label><input value={form.part} onChange={e=>setForm({...form,part:e.target.value})} placeholder="e.g. Front brake pad"/></div>
              <div className="fgroup"><label>{lbl.desc}</label><textarea value={form.desc} onChange={e=>setForm({...form,desc:e.target.value})} placeholder="OEM or aftermarket, condition, extra details..."/></div>
              <button type="submit" className="submit-btn" disabled={submitting}>{submitting?'Sending...':lbl.submit}</button>
              <p className="form-note">{lbl.note}</p>
            </form>
          )}
        </div>
      </section>

      <footer className="footer">
        <div className="footer-brand">KETHAJA</div>
        <p className="footer-tagline">Every Part. Every Vehicle. Delivered to Your Door.</p>
        <button className="footer-wa" onClick={()=>window.open('https://wa.me/94763027060','_blank')}>Chat on WhatsApp · +94 76 302 7060</button>
        <div className="footer-links">
          <span onClick={()=>scrollTo('about')}>About</span>
          <span onClick={()=>scrollTo('how')}>How It Works</span>
          <span onClick={()=>scrollTo('request')}>Request Part</span>
        </div>
        <p className="footer-copy">© 2025 KETHAJA · All Rights Reserved · Sri Lanka</p>
      </footer>
    </div>
  );
}
