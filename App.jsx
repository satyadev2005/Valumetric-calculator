import React, { useState, useMemo } from "react";
import { Plus, Trash2, Package, Ruler, IndianRupee, Truck, Settings2, Copy, Check } from "lucide-react";
import "./styles.css";

const UNIT_TO_CM = 2.54;

function makeProduct(id) {
  return { id, name: `Item ${id}`, length: "", width: "", height: "", unit: "cm",
    paddingL: "0", paddingW: "0", paddingH: "0", qty: "1", actualWeight: "",
    weightBasis: "volumetric", slabMode: "auto", customRateAbove300: "",
    manufacturingCost: "", commercialCost: "", packingCost: "", oversizeCharge: "",
    overweightCharge: "", marginPercent: "", marginFlat: "" };
}
function round2(n) { return Math.round((n + Number.EPSILON) * 100) / 100; }
function computeProduct(p) {
  const toCm = v => { const num=parseFloat(v)||0; return p.unit==="in"?num*UNIT_TO_CM:num; };
  const padLcm=p.unit==="in"?(parseFloat(p.paddingL)||0)*UNIT_TO_CM:(parseFloat(p.paddingL)||0);
  const padWcm=p.unit==="in"?(parseFloat(p.paddingW)||0)*UNIT_TO_CM:(parseFloat(p.paddingW)||0);
  const padHcm=p.unit==="in"?(parseFloat(p.paddingH)||0)*UNIT_TO_CM:(parseFloat(p.paddingH)||0);
  const L=toCm(p.length)+padLcm,W=toCm(p.width)+padWcm,H=toCm(p.height)+padHcm;
  const hasDims=L>0&&W>0&&H>0, volumetricWeight=hasDims?(L*W*H)/5000:0;
  const actualWeight=parseFloat(p.actualWeight)||0;
  let chargeableWeight=volumetricWeight;
  if(p.weightBasis==="actual") chargeableWeight=actualWeight;
  else if(p.weightBasis==="higher") chargeableWeight=Math.max(volumetricWeight,actualWeight);
  let ratePerKg=0,slabLabel="—";
  if(chargeableWeight>0&&chargeableWeight<=70){ratePerKg=850;slabLabel="1–70 kg @ ₹850/kg";}
  else if(chargeableWeight<=300&&chargeableWeight>0){ratePerKg=700;slabLabel="71–300 kg @ ₹700/kg";}
  else if(chargeableWeight>300){
    if(p.slabMode==="custom"){ratePerKg=parseFloat(p.customRateAbove300)||0;slabLabel="300+ kg @ custom rate";}
    else {ratePerKg=700;slabLabel=p.slabMode==="flat300"?"300+ kg @ ₹700/kg (flat)":"300+ kg @ ₹700/kg";}
  }
  const qty=Math.max(1,parseInt(p.qty)||1), shippingCostSingle=chargeableWeight*ratePerKg;
  const shippingCostTotal=shippingCostSingle*qty;
  const manufacturing=(parseFloat(p.manufacturingCost)||0)*qty, commercial=(parseFloat(p.commercialCost)||0)*qty;
  const packing=(parseFloat(p.packingCost)||0)*qty, oversize=(parseFloat(p.oversizeCharge)||0)*qty, overweight=(parseFloat(p.overweightCharge)||0)*qty;
  const subtotal=shippingCostTotal+manufacturing+commercial+packing+oversize+overweight;
  const marginPct=parseFloat(p.marginPercent)||0, marginFlatVal=(parseFloat(p.marginFlat)||0)*qty;
  const totalMargin=subtotal*(marginPct/100)+marginFlatVal, finalPrice=subtotal+totalMargin;
  return {L:round2(L),W:round2(W),H:round2(H),volumetricWeight:round2(volumetricWeight),actualWeight:round2(actualWeight),
    chargeableWeight:round2(chargeableWeight),ratePerKg,slabLabel,qty,shippingCostSingle:round2(shippingCostSingle),
    shippingCostTotal:round2(shippingCostTotal),manufacturing:round2(manufacturing),commercial:round2(commercial),
    packing:round2(packing),oversize:round2(oversize),overweight:round2(overweight),subtotal:round2(subtotal),
    totalMargin:round2(totalMargin),finalPrice:round2(finalPrice),hasDims};
}
function Field({label,children,hint}){return <label className="vf-field"><span className="vf-field-label">{label}</span>{children}{hint&&<span className="vf-field-hint">{hint}</span>}</label>}

export default function VolumetricCalculator(){
 const [products,setProducts]=useState([makeProduct(1)]),[nextId,setNextId]=useState(2),[copiedId,setCopiedId]=useState(null);
 const update=(id,patch)=>setProducts(prev=>prev.map(p=>p.id===id?{...p,...patch}:p));
 const addProduct=()=>{setProducts(prev=>[...prev,makeProduct(nextId)]);setNextId(n=>n+1)};
 const removeProduct=id=>setProducts(prev=>prev.length===1?prev:prev.filter(p=>p.id!==id));
 const duplicateProduct=id=>{setProducts(prev=>{const src=prev.find(p=>p.id===id);if(!src)return prev;return [...prev,{...src,id:nextId,name:src.name+" (copy)"}]});setNextId(n=>n+1)};
 const results=useMemo(()=>products.map(p=>({p,r:computeProduct(p)})),[products]);
 const grandTotal=useMemo(()=>round2(results.reduce((s,{r})=>s+r.finalPrice,0)),[results]);
 const grandWeight=useMemo(()=>round2(results.reduce((s,{r})=>s+r.chargeableWeight*r.qty,0)),[results]);
 const copySummary=id=>{const item=results.find(({p})=>p.id===id);if(!item)return;const {p,r}=item;
 const text=`${p.name}\nDimensions: ${r.L} × ${r.W} × ${r.H} cm\nVolumetric Wt: ${r.volumetricWeight} kg | Actual Wt: ${r.actualWeight} kg | Chargeable: ${r.chargeableWeight} kg\nRate: ${r.slabLabel}\nShipping: ₹${r.shippingCostTotal}\nManufacturing + Commercial + Packing + Oversize + Overweight: ₹${round2(r.manufacturing+r.commercial+r.packing+r.oversize+r.overweight)}\nMargin: ₹${r.totalMargin}\nFinal Price: ₹${r.finalPrice}`;
 navigator.clipboard?.writeText(text);setCopiedId(id);setTimeout(()=>setCopiedId(null),1500)};
 return <div className="vc-root"><div className="vc-shell">
 <div className="vc-header"><div className="vc-title-block"><div className="vc-mark"><Package size={22}/></div><div><div className="vc-title">Volumetric Weight & Shipping Calculator</div><div className="vc-subtitle">L×W×H ÷ 5000 · slab pricing · margin builder</div></div></div><div className="vc-grand"><div className="vc-grand-label">Grand Total</div><div className="vc-grand-value">₹{grandTotal.toLocaleString("en-IN")}</div><div className="vc-grand-sub">{grandWeight} kg chargeable · {products.length} item{products.length>1?"s":""}</div></div></div>
 <div className="vc-products">{results.map(({p,r})=><div className="vc-card" key={p.id}>
 <div className="vc-card-head"><input className="vc-name-input" value={p.name} onChange={e=>update(p.id,{name:e.target.value})} placeholder="Item name"/><div className="vc-head-actions"><button className="vc-icon-btn" onClick={()=>duplicateProduct(p.id)} title="Duplicate"><Copy size={14}/></button><button className="vc-icon-btn" onClick={()=>removeProduct(p.id)} disabled={products.length===1} title="Remove"><Trash2 size={14}/></button></div></div>
 <div className="vc-card-body"><div>
 <div className="vc-section-label"><Ruler size={12}/> Step 1 — Dimensions</div>
 <div className="vc-toggle-group">{["cm","in"].map(u=><button key={u} className={`vc-toggle-btn ${p.unit===u?"active":""}`} onClick={()=>update(p.id,{unit:u})}>{u==="cm"?"Centimeters":"Inches (× 2.54)"}</button>)}</div>
 <div className="vf-row"><Field label="Length"><input type="number" inputMode="decimal" value={p.length} onChange={e=>update(p.id,{length:e.target.value})} placeholder="0"/></Field><Field label="Width"><input type="number" inputMode="decimal" value={p.width} onChange={e=>update(p.id,{width:e.target.value})} placeholder="0"/></Field><Field label="Height"><input type="number" inputMode="decimal" value={p.height} onChange={e=>update(p.id,{height:e.target.value})} placeholder="0"/></Field></div>
 <div className="vc-padding-box"><div className="vf-field-label vc-padding-title">+ Packing padding ({p.unit}) — added separately to each side</div><div className="vf-row"><Field label="Length pad"><input type="number" inputMode="decimal" value={p.paddingL} onChange={e=>update(p.id,{paddingL:e.target.value})} placeholder="0"/></Field><Field label="Width pad"><input type="number" inputMode="decimal" value={p.paddingW} onChange={e=>update(p.id,{paddingW:e.target.value})} placeholder="0"/></Field><Field label="Height pad"><input type="number" inputMode="decimal" value={p.paddingH} onChange={e=>update(p.id,{paddingH:e.target.value})} placeholder="0"/></Field></div></div>
 <div className="vc-padded-readout"><span>After padding →</span><span className="vc-padded-nums">{r.L} × {r.W} × {r.H} cm</span></div>
 <Field label="Quantity (pieces)"><input type="number" inputMode="numeric" min="1" value={p.qty} onChange={e=>update(p.id,{qty:e.target.value})} placeholder="1"/></Field>
 <div className="vc-vw-readout"><span>Volumetric Weight = L × W × H ÷ 5000</span><span className="vc-vw-value">{r.volumetricWeight} kg</span></div>
 <div className="vc-divider"/>
 <div className="vc-section-label"><Package size={12}/> Step 2 — Actual weight & basis</div><div className="vf-row-2"><Field label="Actual weight (kg)"><input type="number" inputMode="decimal" value={p.actualWeight} onChange={e=>update(p.id,{actualWeight:e.target.value})} placeholder="0"/></Field><Field label="Charge on"><select value={p.weightBasis} onChange={e=>update(p.id,{weightBasis:e.target.value})}><option value="volumetric">Volumetric weight</option><option value="actual">Actual weight</option><option value="higher">Higher of the two</option></select></Field></div>
 <div className="vc-divider"/><div className="vc-section-label"><Settings2 size={12}/> Above 300 kg rule</div><div className="vc-toggle-group"><button className={`vc-toggle-btn ${p.slabMode==="flat300"?"active":""}`} onClick={()=>update(p.id,{slabMode:"flat300"})}>Keep ₹700/kg</button><button className={`vc-toggle-btn ${p.slabMode==="custom"?"active":""}`} onClick={()=>update(p.id,{slabMode:"custom"})}>Custom rate</button></div>
 {p.slabMode==="custom"&&<Field label="Custom rate for 300+ kg (₹/kg)"><input type="number" inputMode="decimal" value={p.customRateAbove300} onChange={e=>update(p.id,{customRateAbove300:e.target.value})} placeholder="e.g. 650"/></Field>}
 <div className="vc-divider"/><div className="vc-section-label"><IndianRupee size={12}/> Step 3 — Extra costs (per item, optional)</div><div className="vc-extras-grid">
 {["manufacturingCost","packingCost","oversizeCharge","overweightCharge","commercialCost"].map((k,i)=><Field key={k} label={["Manufacturing cost","Packing cost","Oversize charge","Overweight charge","Commercial cost"][i]}><input type="number" inputMode="decimal" value={p[k]} onChange={e=>update(p.id,{[k]:e.target.value})} placeholder="0"/></Field>)}</div>
 <div className="vc-divider"/><div className="vc-section-label"><Truck size={12}/> Step 4 — Your margin</div><div className="vf-row-2"><Field label="Margin %"><input type="number" inputMode="decimal" value={p.marginPercent} onChange={e=>update(p.id,{marginPercent:e.target.value})} placeholder="0"/></Field><Field label="Margin flat (₹ per item)"><input type="number" inputMode="decimal" value={p.marginFlat} onChange={e=>update(p.id,{marginFlat:e.target.value})} placeholder="0"/></Field></div>
 </div><div className="vc-result-panel">
 {[[`Padded dims (cm)`,`${r.L} × ${r.W} × ${r.H}`],[`Volumetric weight`,`${r.volumetricWeight} kg`],[`Actual weight`,`${r.actualWeight} kg`],[`Chargeable weight`,`${r.chargeableWeight} kg`]].map(([a,b],i)=><div className={`vc-result-row ${i===3?"warn":""}`} key={a}><span>{a}</span><span>{b}</span></div>)}
 <div className="vc-result-row"><span>Rate slab</span><span><span className="vc-slab-badge">{r.slabLabel}</span></span></div><div className="vc-result-divider"/>
 {[["Shipping",`₹${r.shippingCostTotal}`],["Manufacturing cost",`₹${r.manufacturing}`],["Commercial cost",`₹${r.commercial}`],["Packing cost",`₹${r.packing}`],["Oversize charge",`₹${r.oversize}`],["Overweight charge",`₹${r.overweight}`],["Subtotal",`₹${r.subtotal}`],["Your margin",`₹${r.totalMargin}`]].map(([a,b])=><div className="vc-result-row" key={a}><span>{a}</span><span>{b}</span></div>)}
 <div className="vc-final-row"><span className="vc-final-label">Final Price</span><span className="vc-final-value">₹{r.finalPrice.toLocaleString("en-IN")}</span></div>
 <button className={`vc-copy-btn ${copiedId===p.id?"copied":""}`} onClick={()=>copySummary(p.id)}>{copiedId===p.id?<Check size={13}/>:<Copy size={13}/>} {copiedId===p.id?"Copied":"Copy summary"}</button>
 </div></div></div>)}</div>
 <div className="vc-add-bar"><button className="vc-add-btn" onClick={addProduct}><Plus size={16}/> Add another product</button></div>
 <div className="vc-footer-note">Volumetric Weight = (L + padding) × (W + padding) × (H + padding) ÷ 5000 — all dimensions in cm</div>
 </div></div>
}