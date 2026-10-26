/** Account for table clipping and sticky headings when keyboard focus moves. */
export function revealRecipientControl(target:HTMLElement) {
  const region=target.closest<HTMLElement>('.recipient-table .hn-table-scroll');
  if (region&&target.closest('tbody')) {
    const area=region.getBoundingClientRect(), box=target.getBoundingClientRect();
    const top=Math.max(area.top,...Array.from(region.querySelectorAll('thead th')).map(th=>th.getBoundingClientRect().bottom))+6;
    if(box.top<top)region.scrollTop-=top-box.top;
    else if(box.bottom>area.top+region.clientHeight-6)region.scrollTop+=box.bottom-area.top-region.clientHeight+6;
  }
  // Native focus may leave a partially visible heading outside the scrollport.
  // Apply horizontal reveal to header buttons as well as row actions.
  if(region&&target!==region){
    const area=region.getBoundingClientRect(),box=target.getBoundingClientRect();
    if(box.left<area.left+6)region.scrollLeft-=area.left+6-box.left;
    else if(box.right>area.left+region.clientWidth-6)region.scrollLeft+=box.right-area.left-region.clientWidth+6;
  }
  const box=target.getBoundingClientRect();
  const top=(document.querySelector('.hn-header')?.getBoundingClientRect().bottom??0)+10;
  if(box.top<top)window.scrollBy({top:box.top-top,behavior:'instant'});
  else if(box.bottom>innerHeight-10)window.scrollBy({top:box.bottom-innerHeight+10,behavior:'instant'});
}

export function restoreRecipientFocus(origin:HTMLElement|null) {
  const available=origin?.isConnected&&origin.getClientRects().length&&!origin.matches(':disabled')&&!origin.closest('[hidden],[inert]');
  const replacement=origin?.dataset.recipientCode?document.querySelector<HTMLElement>(`[data-recipient-code="${CSS.escape(origin.dataset.recipientCode)}"]`):null;
  const target=available?origin:replacement??document.querySelector<HTMLElement>(origin?.closest('.recipient-filters')?'.recipient-filter-trigger':'.recipient-add');
  if(target){target.focus({preventScroll:true});revealRecipientControl(target);}
}
