import {useEffect,useId,useRef,useState} from 'react';
import {Search,ArrowUpLeft} from 'lucide-react';
import {Input} from '@/components/ui/input';
import {fetchJobSuggestions,type JobSuggestion} from '@/api/jobs';

export default function JobSearchInput({id,value,onChange,label,placeholder,className=''}:{id:string;value:string;onChange:(value:string)=>void;label:string;placeholder:string;className?:string}) {
 const listId=useId(),input=useRef<HTMLInputElement>(null);
 const [items,setItems]=useState<JobSuggestion[]>([]),[itemsFor,setItemsFor]=useState(''),[focused,setFocused]=useState(false),[active,setActive]=useState(-1),[dismissed,setDismissed]=useState(false);
 useEffect(()=>{
  const controller=new AbortController();
  const timer=setTimeout(()=>{
   if(value.trim().length<2||value.length>80){setItems([]);return;}
   fetchJobSuggestions(value,controller.signal).then(data=>{if(!controller.signal.aborted){setItems(data);setItemsFor(value);}}).catch(()=>{if(!controller.signal.aborted)setItems([]);});
  },180);
  return()=>{clearTimeout(timer);controller.abort();};
 },[value]);
 useEffect(()=>{if(active>=0)document.getElementById(`${listId}-${active}`)?.scrollIntoView?.({block:'nearest'});},[active,listId]);
 const open=focused&&!dismissed&&value.trim().length>=2&&itemsFor===value&&items.length>0;
 const choose=(text:string)=>{onChange(text);setDismissed(true);setActive(-1);input.current?.focus();};
 return <div className="relative min-w-0">
  <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted" aria-hidden="true"/>
  <Input ref={input} id={id} type="search" aria-label={label} value={value} placeholder={placeholder} className={`h-12 bg-page pl-10 ${className}`} autoComplete="off" aria-autocomplete="list" aria-controls={open?listId:undefined} aria-activedescendant={open&&active>=0?`${listId}-${active}`:undefined}
   onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)}
   onChange={e=>{setItems([]);setActive(-1);setDismissed(false);onChange(e.target.value);}}
   onKeyDown={e=>{
    if(e.nativeEvent.isComposing)return;
    if(e.key==='Escape'){e.preventDefault();setDismissed(true);setActive(-1);}
    if(open&&(e.key==='ArrowDown'||e.key==='ArrowUp')){e.preventDefault();setActive(i=>e.key==='ArrowDown'?(i+1)%items.length:(i<=0?items.length-1:i-1));}
    if(open&&e.key==='Enter'&&active>=0){e.preventDefault();choose(items[active].text);}
   }}/>
  {open&&<div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-border bg-surface text-left shadow-xl">
   <p className="border-b border-border px-3 py-2 text-xs font-medium text-muted">Suggested roles</p>
   <ul id={listId} role="listbox" aria-label="Suggested job titles" className="max-h-44 overflow-y-auto py-1 sm:max-h-72">
    {items.map((item,index)=><li key={item.text} id={`${listId}-${index}`} role="option" aria-selected={active===index} onPointerDown={e=>e.preventDefault()} onClick={()=>choose(item.text)} onMouseEnter={()=>setActive(index)} className={`flex min-h-11 cursor-pointer items-center gap-2 px-3 py-2 text-sm text-ink ${active===index?'bg-iris-100':'hover:bg-page'}`}>
      <Search className="h-4 w-4 shrink-0 text-muted" aria-hidden="true"/><span className="min-w-0 flex-1 break-words" dir="auto">{item.text}</span><ArrowUpLeft className="h-3.5 w-3.5 shrink-0 text-muted" aria-hidden="true"/>
    </li>)}
   </ul>
   <p className="border-t border-border px-3 py-2 text-xs text-muted">↑ ↓ to choose · Enter to fill · Keep typing to search freely</p>
  </div>}
 </div>;
}
