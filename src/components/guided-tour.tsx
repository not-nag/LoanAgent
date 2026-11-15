'use client';
import {useEffect} from 'react';
import {ArrowRight,Check,X} from 'lucide-react';
import {Button} from './ui/button';
import {TOUR_STEPS} from '@/lib/guided-tour';
export function GuidedTour({index,canContinue,error,onNext,onBack,onExit,onSkip,onLocate}:{index:number;canContinue:boolean;error:string;onLocate:()=>void;onNext:()=>void;onBack:()=>void;onExit:()=>void;onSkip:()=>void}){
 const step=TOUR_STEPS[index];
 useEffect(()=>{
  let highlighted:HTMLElement|null=null;let scrolled=false;
  const highlight=()=>{
   const node=document.getElementById(step.target);
   if(node===highlighted)return;
   highlighted?.classList.remove('tour-highlight');highlighted=node;
   if(node){node.classList.add('tour-highlight');if(!scrolled){node.scrollIntoView({behavior:'smooth',block:'start',inline:'nearest'});scrolled=true;}}
  };
  const observer=new MutationObserver(highlight);observer.observe(document.body,{subtree:true,childList:true});
  const timer=setTimeout(highlight,120);return()=>{clearTimeout(timer);observer.disconnect();highlighted?.classList.remove('tour-highlight')};
 },[index,step.target]);
 return <aside className="guided-coach" aria-label="Interactive guided tour"><header><span>{step.chapter}</span><button aria-label="Exit guided tour" onClick={onExit}><X size={15}/></button></header><div className="guided-progress" role="progressbar" aria-label="Tour progress" aria-valuemin={1} aria-valuemax={TOUR_STEPS.length} aria-valuenow={index+1}><span style={{width:`${(index+1)/TOUR_STEPS.length*100}%`}}/></div><div className="guided-copy" aria-live="polite"><small>STEP {index+1} OF {TOUR_STEPS.length}</small><h2>{step.title}</h2><p>{step.body}</p>{step.wait&&<div className="guided-checkpoint">{canContinue?<><Check size={13}/>Step complete</>:<><button onClick={onLocate}>Show the action to complete ↗</button></>}</div>}{error&&step.fallback&&<p className="guided-error">The expected AI result is unavailable. Use “Show the action” to prepare the request again, then press Send. You can also skip this step.</p>}</div><footer><Button variant="ghost" size="sm" disabled={index===0} onClick={onBack}>Back</Button>{error&&step.fallback?<Button variant="outline" size="sm" onClick={onSkip}>Skip AI step<ArrowRight size={13}/></Button>:<Button size="sm" disabled={!canContinue} onClick={onNext}>{index===TOUR_STEPS.length-1?'Finish tour':'Continue'}<ArrowRight size={13}/></Button>}</footer></aside>;
}
