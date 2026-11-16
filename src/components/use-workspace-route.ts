'use client';
import {useEffect,useRef,useState} from 'react';
import {HOME_ROUTE,parseWorkspaceRoute,workspaceHref,type WorkspaceRoute,type Page} from '@/lib/workspace-route';

// Shared by the Next.js development app and the standalone Sites Worker client.
export function useWorkspaceRoute(replace: boolean, onHistoryNavigation:()=>void) {
  const [route,setRoute]=useState<WorkspaceRoute>(HOME_ROUTE);
  const [ready,setReady]=useState(false);
  const onPop=useRef(onHistoryNavigation);
  onPop.current=onHistoryNavigation;
  const replaceNext=useRef(false);
  useEffect(()=>{
    replaceNext.current=true;
    setRoute(parseWorkspaceRoute(window.location.pathname));
    setReady(true);
    const handlePop=()=>{
      onPop.current();
      setRoute(parseWorkspaceRoute(window.location.pathname));
    };
    window.addEventListener('popstate',handlePop);
    return ()=>window.removeEventListener('popstate',handlePop);
  },[]);
  useEffect(()=>{
    if(!ready)return;
    const href=workspaceHref(route);
    if(window.location.pathname!==href){
      const method=replace||replaceNext.current?'replaceState':'pushState';
      window.history[method](window.history.state,'',href);
    }
    replaceNext.current=false;
  },[route,ready,replace]);
  const update=(patch:Partial<WorkspaceRoute>)=>setRoute(current=>({...current,...patch,missingPath:undefined}));
  return {route,routeReady:ready,setRoute,
    setPage:(page:Page)=>update({page,newCase:false}),
    setSelected:(selected:string|null)=>update({selected}),
    setNewCase:(newCase:boolean)=>update(newCase?{newCase,page:'Applications',selected:null}:{newCase}),
    replaceNextRoute:()=>{replaceNext.current=true;},
  };
}
