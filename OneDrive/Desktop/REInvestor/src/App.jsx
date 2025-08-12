import React, { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { registerSW, wireInstallButton } from './register-sw'

const LIST_TYPES = [
  'Probate','Code Violations','Absentee Owner','Tired Landlord','High Equity','Zombie Property','Pre-Foreclosure','Expired Listing','Tax Delinquent','Vacant',
]
const PROPERTY_TYPES = ['Single Family','Townhouse','Condo','Multi-Family (2-4)','Apartments (5+)','Mobile Home','Land']
const STATES = ['NC','SC','GA','FL','VA','TN','TX','AZ','CA','OH','PA','NY','MI']

function seedLeads(){return[
  {id:'L-1001',address:'1427 Oak Glen Dr',city:'Raleigh',state:'NC',zip:'27610',bedrooms:3,bathrooms:2,sqft:1475,arv:320000,estimatedRepairs:40000,listType:'Expired Listing',propertyType:'Single Family',owner:'Smith Family Trust',ownerOccupied:false,equityPct:58,mortgageRate:3.25,status:'Warm',notes:'Agent: Jane Miller. Seller wants close to list; may entertain terms.',source:'Agent Outreach',lastTouched:'2025-08-09'},
  {id:'L-1002',address:'915 Birch Ct',city:'Charlotte',state:'NC',zip:'28213',bedrooms:4,bathrooms:2.5,sqft:1890,arv:410000,estimatedRepairs:25000,listType:'High Equity',propertyType:'Single Family',owner:'Michael Johnson',ownerOccupied:false,equityPct:65,mortgageRate:2.75,status:'New',notes:'Landlord relocating; tenant M2M. Could be wholesale or sub-to.',source:'Skip Trace',lastTouched:'2025-08-11'},
  {id:'L-1003',address:'77 Ridgeview Ln',city:'Phoenix',state:'AZ',zip:'85032',bedrooms:3,bathrooms:2,sqft:1260,arv:360000,estimatedRepairs:60000,listType:'Code Violations',propertyType:'Single Family',owner:'Estate of Laura P.',ownerOccupied:false,equityPct:35,mortgageRate:5.75,status:'Hot',notes:'Notice posted; probate in process. Heirs open to cash as-is.',source:'D4D',lastTouched:'2025-08-10'},
]}

const format = (n)=> (typeof n==='number'? n: Number(n||0)).toLocaleString('en-US',{style:'currency',currency:'USD'})
const cashOffer = (arv, repairs, marginPct=0.18)=> Math.max(0, Math.round(arv*(1-marginPct)-repairs))
const moPayment = (principal, ratePct, years=30)=>{const r=ratePct/100/12;const n=years*12;return r===0?Math.round(principal/n):Math.round((principal*r)/(1-Math.pow(1+r,-n)))}

function generateWholesaleAssignment(p){
  const {buyerName,sellerName,propertyAddress,assignmentFee,earnestMoney,closingDate,assignorLLC}=p
  return `ASSIGNMENT OF CONTRACT

Assignor: ${assignorLLC}
Assignee (Buyer): ${buyerName}
Seller: ${sellerName}
Property: ${propertyAddress}

1. Assignor assigns all rights in the Purchase Agreement to Assignee.
2. Assignment Fee: ${format(Number(assignmentFee)||0)} due at closing.
3. Earnest Money: ${format(Number(earnestMoney)||0)} to be deposited with escrow.
4. Closing Date: ${closingDate}.
5. Property conveyed AS-IS.
6. Title/escrow to be opened within 2 business days.
7. Assignor makes no warranties beyond the original Purchase Agreement.

Signatures:
Assignor: ____________________
Assignee: ____________________
Seller (Acknowledgement): ____________________
Date: __________`
}

function generateSubToContract(p){
  const {buyerName,sellerName,propertyAddress,loanServicer,loanBalance,interestRate,pitiPayment,cashToSeller,closingDate,escrowCompany}=p
  return `SUBJECT-TO PURCHASE AGREEMENT

Buyer: ${buyerName}
Seller: ${sellerName}
Property: ${propertyAddress}

1. Buyer acquires title subject to existing financing.
   Servicer: ${loanServicer}
   Current Balance: ${format(Number(loanBalance)||0)}
   Interest Rate: ${interestRate}%
   Current PITI: ${format(Number(pitiPayment)||0)} per month

2. Consideration:
   (a) Buyer to bring loan current if applicable.
   (b) Cash to Seller at closing: ${format(Number(cashToSeller)||0)}

3. Closing: ${closingDate} at ${escrowCompany}.
4. Seller to cooperate with loan authorization and insurance updates.
5. Property conveyed AS-IS; standard due diligence applies.
6. Additional terms per Addendum A.

Signatures:
Buyer: ____________________
Seller: ____________________
Date: __________`
}

function downloadText(filename, text){
  const blob = new Blob([text], {type:'text/plain;charset=utf-8'})
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove()
  URL.revokeObjectURL(url)
}

export default function App(){
  const [filters,setFilters]=useState({listType:'',propertyType:'',state:'',minEquity:0,ownerOccupied:'any',hasAgent:'any',text:''})
  const [leads,setLeads]=useState(()=>{const x=localStorage.getItem('rei-leads'); return x? JSON.parse(x): seedLeads()})
  const [selected,setSelected]=useState(null)
  const [showWholesale,setShowWholesale]=useState(false)
  const [showSubTo,setShowSubTo]=useState(false)
  const installBtnRef = useRef(null)

  useEffect(()=>{ localStorage.setItem('rei-leads', JSON.stringify(leads)) },[leads])
  useEffect(()=>{ registerSW(); if (installBtnRef.current) wireInstallButton(installBtnRef.current) },[])

  const filtered = useMemo(()=>leads.filter(l=>{
    const matchesList = !filters.listType || l.listType===filters.listType
    const matchesProp = !filters.propertyType || l.propertyType===filters.propertyType
    const matchesState = !filters.state || l.state===filters.state
    const matchesEquity = (l.equityPct??0) >= Number(filters.minEquity||0)
    const matchesOcc = filters.ownerOccupied==='any' || (filters.ownerOccupied==='yes' && l.ownerOccupied) || (filters.ownerOccupied==='no' && !l.ownerOccupied)
    const matchesAgent = filters.hasAgent==='any' || (filters.hasAgent==='yes' && (l.notes||'').toLowerCase().includes('agent')) || (filters.hasAgent==='no' && !(l.notes||'').toLowerCase().includes('agent'))
    const matchesText = !filters.text || `${l.address} ${l.city} ${l.state} ${l.zip} ${l.notes}`.toLowerCase().includes(filters.text.toLowerCase())
    return matchesList && matchesProp && matchesState && matchesEquity && matchesOcc && matchesAgent && matchesText
  }),[leads,filters])

  const quick = useMemo(()=>{
    if(!selected) return null
    const offer = cashOffer(selected.arv, selected.estimatedRepairs)
    const subtoMo = moPayment(selected.arv - selected.estimatedRepairs, selected.mortgageRate||4.5, 30)
    return {offer, subtoMo}
  },[selected])

  const [wholesaleForm,setWholesaleForm]=useState({buyerName:'',sellerName:'',propertyAddress:'',assignmentFee:10000,earnestMoney:2500,closingDate:'2025-09-15',assignorLLC:'Your LLC, LLC'})
  const [subtoForm,setSubtoForm]=useState({buyerName:'',sellerName:'',propertyAddress:'',loanServicer:'',loanBalance:250000,interestRate:3.25,pitiPayment:1650,cashToSeller:5000,closingDate:'2025-09-20',escrowCompany:'ABC Title & Escrow'})

  useEffect(()=>{
    if(selected){
      const addr = `${selected.address}, ${selected.city}, ${selected.state} ${selected.zip}`
      setWholesaleForm(f=>({...f, propertyAddress: addr, sellerName: selected.owner||''}))
      setSubtoForm(f=>({...f, propertyAddress: addr, sellerName: selected.owner||''}))
    }
  },[selected])

  function addLead(e){
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const newLead = {
      id: `L-${Math.floor(Math.random()*9000)+1000}`,
      address: fd.get('address')||'',
      city: fd.get('city')||'',
      state: fd.get('state')||'',
      zip: fd.get('zip')||'',
      bedrooms: Number(fd.get('bedrooms')||0),
      bathrooms: Number(fd.get('bathrooms')||0),
      sqft: Number(fd.get('sqft')||0),
      arv: Number(fd.get('arv')||0),
      estimatedRepairs: Number(fd.get('repairs')||0),
      listType: fd.get('listType')||'',
      propertyType: fd.get('propertyType')||'',
      owner: fd.get('owner')||'',
      ownerOccupied: fd.get('ownerOcc')==='on',
      equityPct: Number(fd.get('equityPct')||0),
      mortgageRate: Number(fd.get('mortgageRate')||0),
      status: 'New',
      notes: fd.get('notes')||'',
      source: 'Manual',
      lastTouched: new Date().toISOString().slice(0,10),
    }
    setLeads(p=>[newLead, ...p]); e.currentTarget.reset()
  }
  function removeLead(id){ setLeads(p=>p.filter(l=>l.id!==id)); if(selected?.id===id) setSelected(null) }

  return (
    <div className="min-h-screen text-gray-900">
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="w-5 h-5 rounded bg-sky-500"></div>
          <h1 className="font-semibold tracking-tight">REI Deal Machine — Wholesale & SubTo</h1>
          <span className="ml-auto text-xs px-2 py-1 rounded border bg-white/70">PWA-ready</span>
          <button ref={installBtnRef} style={{display:'none'}} className="ml-3 border rounded px-3 py-1 text-sm">Install App</button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-12 gap-6">
        {/* Filters */}
        <section className="col-span-12 lg:col-span-3 space-y-4">
          <div className="bg-white rounded-xl border shadow-sm">
            <div className="p-4 pb-2 font-medium">Targeted Search</div>
            <div className="p-4 pt-0 space-y-3 text-sm">
              <label className="text-xs">List Type</label>
              <select className="w-full border rounded px-3 py-2" onChange={e=>setFilters(s=>({...s, listType:e.target.value}))}>
                <option value="">Any</option>
                {LIST_TYPES.map(x=><option key={x} value={x}>{x}</option>)}
              </select>

              <label className="text-xs">Property Type</label>
              <select className="w-full border rounded px-3 py-2" onChange={e=>setFilters(s=>({...s, propertyType:e.target.value}))}>
                <option value="">Any</option>
                {PROPERTY_TYPES.map(x=><option key={x} value={x}>{x}</option>)}
              </select>

              <label className="text-xs">State</label>
              <select className="w-full border rounded px-3 py-2" onChange={e=>setFilters(s=>({...s, state:e.target.value}))}>
                <option value="">Any</option>
                {STATES.map(x=><option key={x} value={x}>{x}</option>)}
              </select>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs">Min Equity %</label>
                  <input type="number" min="0" max="100" className="w-full border rounded px-3 py-2" onChange={e=>setFilters(s=>({...s, minEquity:e.target.value}))} />
                </div>
                <div>
                  <label className="text-xs">Owner-Occupied</label>
                  <select className="w-full border rounded px-3 py-2" onChange={e=>setFilters(s=>({...s, ownerOccupied:e.target.value}))}>
                    <option value="any">Any</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs">Agent Mentioned</label>
                  <select className="w-full border rounded px-3 py-2" onChange={e=>setFilters(s=>({...s, hasAgent:e.target.value}))}>
                    <option value="any">Any</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs">Free Text</label>
                  <input className="w-full border rounded px-3 py-2" placeholder="Address, notes..." onChange={e=>setFilters(s=>({...s, text:e.target.value}))} />
                </div>
              </div>

              <button className="w-full mt-1 border rounded px-3 py-2 text-sm">Search</button>
            </div>
          </div>

          {/* Add Lead */}
          <div className="bg-white rounded-xl border shadow-sm">
            <div className="p-4 pb-2 font-medium">Quick Add Lead</div>
            <form className="p-4 space-y-3 text-sm" onSubmit={addLead}>
              <input name="address" placeholder="Address" required className="w-full border rounded px-3 py-2" />
              <div className="grid grid-cols-3 gap-2">
                <input name="city" placeholder="City" required className="border rounded px-3 py-2" />
                <select name="state" className="border rounded px-3 py-2">
                  {STATES.map(s=><option key={s} value={s}>{s}</option>)}
                </select>
                <input name="zip" placeholder="ZIP" className="border rounded px-3 py-2" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <input name="bedrooms" type="number" placeholder="Beds" className="border rounded px-3 py-2" />
                <input name="bathrooms" type="number" placeholder="Baths" className="border rounded px-3 py-2" />
                <input name="sqft" type="number" placeholder="Sq Ft" className="border rounded px-3 py-2" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input name="arv" type="number" placeholder="ARV ($)" className="border rounded px-3 py-2" />
                <input name="repairs" type="number" placeholder="Repairs ($)" className="border rounded px-3 py-2" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <select name="listType" className="border rounded px-3 py-2">
                  {LIST_TYPES.map(t=><option key={t} value={t}>{t}</option>)}
                </select>
                <select name="propertyType" className="border rounded px-3 py-2">
                  {PROPERTY_TYPES.map(t=><option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input name="owner" placeholder="Owner / Contact" className="border rounded px-3 py-2" />
                <label className="flex items-center gap-2 border rounded px-3 py-2">
                  <span className="text-xs">Owner Occupied</span>
                  <input name="ownerOcc" type="checkbox" />
                </label>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input name="equityPct" type="number" placeholder="Equity %" className="border rounded px-3 py-2" />
                <input name="mortgageRate" type="number" step="0.01" placeholder="Rate %" className="border rounded px-3 py-2" />
              </div>
              <textarea name="notes" placeholder="Notes (agent, motivation, timeline)" className="w-full border rounded px-3 py-2"></textarea>
              <button type="submit" className="w-full border rounded px-3 py-2">Save Lead</button>
            </form>
          </div>
        </section>

        {/* Leads + Details */}
        <section className="col-span-12 lg:col-span-9 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border shadow-sm lg:col-span-1">
              <div className="p-4 pb-2 font-medium">Leads</div>
              <div className="p-4 pt-0">
                <div className="rounded-md border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100">
                      <tr><th className="text-left p-2">Address</th><th className="text-left p-2">List</th><th className="text-left p-2">Equity</th><th className="text-left p-2">ARV</th><th className="text-left p-2">Status</th><th></th></tr>
                    </thead>
                    <tbody>
                      {filtered.map(l => (
                        <tr key={l.id} className={`border-t hover:bg-gray-50 ${selected?.id===l.id? 'bg-blue-50':''}`}>
                          <td className="p-2 cursor-pointer" onClick={()=>setSelected(l)}>
                            <div className="font-medium">{l.address}</div>
                            <div className="text-xs text-gray-500">{l.city}, {l.state} {l.zip}</div>
                          </td>
                          <td className="p-2">{l.listType}</td>
                          <td className="p-2">{l.equityPct}%</td>
                          <td className="p-2">{format(l.arv)}</td>
                          <td className="p-2"><span className="text-xs px-2 py-1 rounded border">{l.status}</span></td>
                          <td className="p-2 text-right"><button className="text-red-600 text-sm" onClick={()=>removeLead(l.id)}>Delete</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border shadow-sm lg:col-span-2">
              <div className="p-4 pb-2 font-medium">Lead Details</div>
              <div className="p-4 pt-0 space-y-3">
                {!selected ? (
                  <p className="text-sm text-gray-500">Select a lead to see details and run numbers.</p>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold">{selected.address}</div>
                        <div className="text-xs text-gray-500">{selected.city}, {selected.state} {selected.zip}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-1 rounded border bg-white">{selected.propertyType}</span>
                        <span className="text-xs px-2 py-1 rounded border bg-white">{selected.listType}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <Info label="Beds" value={selected.bedrooms} />
                      <Info label="Baths" value={selected.bathrooms} />
                      <Info label="Sq Ft" value={selected.sqft} />
                      <Info label="ARV" value={format(selected.arv)} />
                      <Info label="Repairs" value={format(selected.estimatedRepairs)} />
                      <Info label="Equity %" value={`${selected.equityPct}%`} />
                      <Info label="Rate" value={`${selected.mortgageRate||'—'}%`} />
                      <Info label="Touched" value={selected.lastTouched} />
                    </div>

                    {quick && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <KeyMetric label="Cash Offer (Est.)" value={format(quick.offer)} />
                        <KeyMetric label="Sub-To Est. Payment" value={format(quick.subtoMo)} />
                      </div>
                    )}

                    <div>
                      <div className="text-xs text-gray-600 mb-1">Notes</div>
                      <textarea defaultValue={selected.notes} className="w-full border rounded px-3 py-2" onBlur={e=>{
                        setLeads(prev=>prev.map(l=> l.id===selected.id? {...l, notes:e.target.value, lastTouched:new Date().toISOString().slice(0,10)}: l))
                      }} />
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2">
                      <button className="border rounded px-3 py-2" onClick={()=>setShowWholesale(true)}>Generate Wholesale Assignment</button>
                      <button className="border rounded px-3 py-2" onClick={()=>setShowSubTo(true)}>Generate Sub-To Contract</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t bg-white/60">
        <div className="max-w-7xl mx-auto px-4 py-4 text-xs text-gray-500 flex items-center gap-3">
          <span>© {new Date().getFullYear()} REI Deal Machine</span>
          <span className="ml-auto">Use attorney-approved contracts. Local laws vary.</span>
        </div>
      </footer>

      {/* Dialogs */}
      {showWholesale && (
        <Modal title="Wholesale Assignment" onClose={()=>setShowWholesale(false)}>
          <FormGrid>
            <Field label="Buyer (Assignee)" value={wholesaleForm.buyerName} onChange={v=>setWholesaleForm(s=>({...s,buyerName:v}))} />
            <Field label="Seller" value={wholesaleForm.sellerName} onChange={v=>setWholesaleForm(s=>({...s,sellerName:v}))} />
            <Field label="Property" value={wholesaleForm.propertyAddress} onChange={v=>setWholesaleForm(s=>({...s,propertyAddress:v}))} full />
            <Field label="Assignment Fee ($)" type="number" value={wholesaleForm.assignmentFee} onChange={v=>setWholesaleForm(s=>({...s,assignmentFee:v}))} />
            <Field label="Earnest Money ($)" type="number" value={wholesaleForm.earnestMoney} onChange={v=>setWholesaleForm(s=>({...s,earnestMoney:v}))} />
            <Field label="Closing Date" value={wholesaleForm.closingDate} onChange={v=>setWholesaleForm(s=>({...s,closingDate:v}))} />
            <Field label="Assignor (Your LLC)" value={wholesaleForm.assignorLLC} onChange={v=>setWholesaleForm(s=>({...s,assignorLLC:v}))} />
          </FormGrid>
          <div className="flex justify-between">
            <button className="border rounded px-3 py-2" onClick={()=>{
              const text = generateWholesaleAssignment(wholesaleForm)
              downloadText(`Wholesale_Assignment_${(selected?.address||'property').replace(/\s+/g,'_')}.txt`, text)
            }}>Download .txt</button>
            <button className="border rounded px-3 py-2" onClick={()=>setShowWholesale(false)}>Done</button>
          </div>
        </Modal>
      )}

      {showSubTo && (
        <Modal title="Subject-To Purchase Agreement" onClose={()=>setShowSubTo(false)}>
          <FormGrid>
            <Field label="Buyer" value={subtoForm.buyerName} onChange={v=>setSubtoForm(s=>({...s,buyerName:v}))} />
            <Field label="Seller" value={subtoForm.sellerName} onChange={v=>setSubtoForm(s=>({...s,sellerName:v}))} />
            <Field label="Property" value={subtoForm.propertyAddress} onChange={v=>setSubtoForm(s=>({...s,propertyAddress:v}))} full />
            <Field label="Loan Servicer" value={subtoForm.loanServicer} onChange={v=>setSubtoForm(s=>({...s,loanServicer:v}))} />
            <Field label="Loan Balance ($)" type="number" value={subtoForm.loanBalance} onChange={v=>setSubtoForm(s=>({...s,loanBalance:v}))} />
            <Field label="Interest Rate (%)" type="number" value={subtoForm.interestRate} onChange={v=>setSubtoForm(s=>({...s,interestRate:v}))} />
            <Field label="Current PITI ($/mo)" type="number" value={subtoForm.pitiPayment} onChange={v=>setSubtoForm(s=>({...s,pitiPayment:v}))} />
            <Field label="Cash to Seller ($)" type="number" value={subtoForm.cashToSeller} onChange={v=>setSubtoForm(s=>({...s,cashToSeller:v}))} />
            <Field label="Closing Date" value={subtoForm.closingDate} onChange={v=>setSubtoForm(s=>({...s,closingDate:v}))} />
            <Field label="Escrow/Title Company" value={subtoForm.escrowCompany} onChange={v=>setSubtoForm(s=>({...s,escrowCompany:v}))} />
          </FormGrid>
          <div className="flex justify-between">
            <button className="border rounded px-3 py-2" onClick={()=>{
              const text = generateSubToContract(subtoForm)
              downloadText(`SubTo_Agreement_${(selected?.address||'property').replace(/\s+/g,'_')}.txt`, text)
            }}>Download .txt</button>
            <button className="border rounded px-3 py-2" onClick={()=>setShowSubTo(false)}>Done</button>
          </div>
        </Modal>
      )}
    </div>
  )
}

function Info({label,value}){
  return (
    <div className="rounded-lg border p-3 bg-white/60">
      <div className="text-[10px] uppercase text-gray-500 tracking-wider">{label}</div>
      <div className="text-sm font-medium">{value ?? '—'}</div>
    </div>
  )
}

function KeyMetric({label,value}){
  return (
    <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} className="rounded-xl border p-4 bg-white/70 flex items-center justify-between">
      <div>
        <div className="text-[10px] uppercase text-gray-500 tracking-wider">{label}</div>
        <div className="text-lg font-semibold">{value}</div>
      </div>
      <div className="p-2 rounded-full border bg-white w-6 h-6"></div>
    </motion.div>
  )
}

function Modal({title, children, onClose}){
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/30">
      <div className="bg-white rounded-t-2xl md:rounded-2xl shadow-xl w-full md:w-[720px] max-h-[90vh] overflow-auto">
        <div className="p-4 border-b flex items-center justify-between">
          <div className="font-semibold">{title}</div>
          <button onClick={onClose} className="text-sm border rounded px-2 py-1">Close</button>
        </div>
        <div className="p-4 space-y-4">{children}</div>
      </div>
    </div>
  )
}

function FormGrid({children}){
  return <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{children}</div>
}

function Field({label, value, onChange, type='text', full}){
  return (
    <div className={full?'md:col-span-2':''}>
      <div className="text-xs text-gray-600 mb-1">{label}</div>
      <input value={value} onChange={e=>onChange(e.target.value)} type={type} className="w-full border rounded px-3 py-2" />
    </div>
  )
}