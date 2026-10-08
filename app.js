'use strict';
const $=id=>document.getElementById(id);
document.querySelectorAll('[data-tab]').forEach(button=>button.addEventListener('click',()=>{document.querySelectorAll('[data-tab]').forEach(b=>b.classList.toggle('active',b===button));document.querySelectorAll('.panel').forEach(p=>p.classList.toggle('hidden',p.id!==button.dataset.tab));}));
function openLink(url){const a=document.createElement('a');a.href=url;a.target='_blank';a.rel='noopener noreferrer';document.body.appendChild(a);a.click();a.remove();}
function mapsSearch(query){openLink('https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(query));}
$('directions').addEventListener('click',()=>{const dest=$('destination').value.trim();if(!dest){alert('Enter a destination address.');return;}const start=$('start').value;const avoid=$('tolls').checked;const url=new URL('https://www.google.com/maps/dir/');url.searchParams.set('api','1');url.searchParams.set('origin',start);url.searchParams.set('destination',dest);url.searchParams.set('travelmode','driving');if(avoid)url.searchParams.set('avoid','tolls');openLink(url.toString());});
$('coffeeSearch').addEventListener('click',()=>{const area=$('coffeeArea').value.trim();if(!area){alert('Enter a city or ZIP code.');return;}mapsSearch(`${$('coffeeType').value} near ${area}, Florida`);});
$('iceSearch').addEventListener('click',()=>{const area=$('iceArea').value.trim();if(!area){alert('Enter a city or ZIP code.');return;}mapsSearch(`${$('iceType').value} near ${area}, Florida`);});
$('eventSearch').addEventListener('click',()=>{const zip=$('eventZip').value.trim();if(!/^\d{5}$/.test(zip)){alert('Enter a five-digit ZIP code.');return;}openLink('https://www.google.com/search?q='+encodeURIComponent(`${zip} events`));});
if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));}

// Mobile-first truck selection; each driver uses one truck at a time.
const TRUCK_KEY='driver-planner-selected-truck';
function selectTruck(truck){
  if(!['kona','coffee'].includes(truck))truck='kona';
  try{localStorage.setItem(TRUCK_KEY,truck);}catch(e){}
  document.querySelectorAll('[data-truck]').forEach(b=>{const selected=b.dataset.truck===truck;b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',String(selected));});
  $('truckHelp').textContent=truck==='kona'?'Finding family-friendly Kona Ice opportunities.':'Finding workplaces suited to Travelin’ Tom’s Coffee.';
  document.querySelectorAll('[data-tab]').forEach(b=>{if(b.dataset.tab==='coffee'||b.dataset.tab==='ice')b.classList.toggle('preferred',b.dataset.tab===(truck==='kona'?'ice':'coffee'));});
  const tab=truck==='kona'?'ice':'coffee';
  document.querySelector('[data-tab="'+tab+'"]').click();
}
document.querySelectorAll('[data-truck]').forEach(b=>b.addEventListener('click',()=>selectTruck(b.dataset.truck)));
let savedTruck='kona';try{savedTruck=localStorage.getItem(TRUCK_KEY)||'kona';}catch(e){}
// Preserve the route tab on initial load; only switch tabs when a truck is tapped.
if(!['kona','coffee'].includes(savedTruck))savedTruck='kona';
document.querySelectorAll('[data-truck]').forEach(b=>{const selected=b.dataset.truck===savedTruck;b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',String(selected));});
$('truckHelp').textContent=savedTruck==='kona'?'Finding family-friendly Kona Ice opportunities.':'Finding workplaces suited to Travelin’ Tom’s Coffee.';
