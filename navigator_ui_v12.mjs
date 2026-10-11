/* v1.2 workflow map: anchors point only to existing locally rendered sections. */
const nav=document.getElementById('workflow-v12');
if(nav){
 const links=[...nav.querySelectorAll('a[href^="#"]')];
 const elements=links.map(a=>({link:a,target:document.getElementById(a.getAttribute('href').slice(1))}))
  .filter(({target})=>!!target);
 const status=document.getElementById('workflow-v12-status');
 function markActive(id){
  for(const {link,target} of elements)link.setAttribute('aria-current',target.id===id?'location':'false');
  const found=elements.find(({target})=>target.id===id);
  if(found&&status)status.textContent='Viewing '+found.link.textContent.trim();
 }
 let inView=new Map();
 const observer=typeof IntersectionObserver!=='undefined'?
  new IntersectionObserver(entries=>{
   for(const entry of entries){if(entry.isIntersecting)inView.set(entry.target.id,entry.boundingClientRect.top);
   else inView.delete(entry.target.id);}
   if(inView.size){
    const top=[...inView].sort((a,b)=>Math.abs(a[1])-Math.abs(b[1]))[0][0];
    markActive(top);
   }
  },{rootMargin:'-5% 0px -60% 0px',threshold:0}):null;
 for(const item of elements){
  observer?.observe(item.target);
  item.link.addEventListener('click',()=>markActive(item.target.id));
 }
 function fromHash(){
  const id=decodeURIComponent(location.hash.replace(/^#/,''));if(id)markActive(id);
 }
 window.addEventListener('hashchange',fromHash);
 fromHash();
}
