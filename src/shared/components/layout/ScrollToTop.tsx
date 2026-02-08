 import { useEffect } from 'react';
 import { useLocation } from 'react-router-dom';
 
 /**
  * Scrolls to top of page on route change.
  * This behavior is called "scroll restoration" or "scroll to top".
  */
 export function ScrollToTop() {
   const { pathname } = useLocation();
 
   useEffect(() => {
     window.scrollTo(0, 0);
   }, [pathname]);
 
   return null;
 }