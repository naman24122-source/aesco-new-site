(function(){
  'use strict';
  var hero=document.querySelector('.ed-hero');
  if(!hero)return;
  var mq=window.matchMedia('(prefers-reduced-motion: reduce)');
  var context;
  function setup(){
    if(context){context.revert();context=null;}
    if(mq.matches||!window.gsap)return;
    context=gsap.context(function(){
      gsap.from('.ed-hero h1,.ed-hero-lead,.ed-hero .bts',{y:18,opacity:0,duration:.75,stagger:.1,ease:'power3.out',clearProps:'all'});
    },hero);
  }
  setup();
  if(mq.addEventListener)mq.addEventListener('change',setup);
})();
