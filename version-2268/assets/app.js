
(function(){
  function qs(sel, root){return (root||document).querySelector(sel)}
  function qsa(sel, root){return Array.prototype.slice.call((root||document).querySelectorAll(sel))}
  var navButton=qs("[data-nav-toggle]");
  var navLinks=qs("[data-nav-links]");
  if(navButton&&navLinks){navButton.addEventListener("click",function(){navLinks.classList.toggle("is-open")})}
  var hero=qs("[data-hero]");
  if(hero){
    var slides=qsa("[data-hero-slide]",hero);
    var dots=qsa("[data-hero-dot]",hero);
    var current=0;
    function show(i){
      if(!slides.length)return;
      current=(i+slides.length)%slides.length;
      slides.forEach(function(s,idx){s.classList.toggle("is-active",idx===current)});
      dots.forEach(function(d,idx){d.classList.toggle("is-active",idx===current)})
    }
    dots.forEach(function(d){d.addEventListener("click",function(){show(parseInt(d.getAttribute("data-hero-dot")||"0",10))})});
    if(slides.length>1){setInterval(function(){show(current+1)},5200)}
  }
  function normalize(s){return (s||"").toString().toLowerCase()}
  function setupFilters(){
    var list=qs("[data-card-list]");
    var text=qs("[data-page-filter]");
    var type=qs("[data-type-filter]");
    var year=qs("[data-year-filter]");
    if(!list||(!text&&!type&&!year))return;
    var cards=qsa("[data-card]",list);
    var empty=qs("[data-empty-state]");
    function run(){
      var q=normalize(text?text.value:"");
      var t=normalize(type?type.value:"");
      var y=parseInt(year&&year.value?year.value:"0",10);
      var shown=0;
      cards.forEach(function(card){
        var blob=normalize([card.getAttribute("data-title"),card.getAttribute("data-region"),card.getAttribute("data-type"),card.getAttribute("data-year"),card.getAttribute("data-tags")].join(" "));
        var ctype=normalize(card.getAttribute("data-type"));
        var cyear=parseInt((card.getAttribute("data-year")||"").match(/\d{4}/)||"0",10);
        var ok=(!q||blob.indexOf(q)>-1)&&(!t||ctype.indexOf(t)>-1)&&(!y||cyear>=y);
        card.style.display=ok?"":"none";
        if(ok)shown++;
      });
      if(empty)empty.classList.toggle("is-visible",shown===0)
    }
    [text,type,year].forEach(function(el){if(el)el.addEventListener(el.tagName==="INPUT"?"input":"change",run)});
    run();
  }
  setupFilters();
  function cardHtml(m){
    var tags=(m.a||[]).slice(0,3).map(function(x){return "<span>"+escapeHtml(x)+"</span>"}).join("");
    return '<article class="movie-card group" data-card><a href="./'+escapeAttr(m.u)+'" class="movie-link" title="'+escapeAttr(m.t)+' 在线观看"><div class="poster-wrap"><img src="'+escapeAttr(m.c)+'" alt="'+escapeAttr(m.t)+'" loading="lazy"><span class="year-badge">'+escapeHtml(m.y)+'</span><span class="play-chip">▶ 播放</span></div><div class="movie-info"><div class="meta-row"><span>'+escapeHtml(m.r)+'</span><span>'+escapeHtml(m.p)+'</span></div><h3>'+escapeHtml(m.t)+'</h3><p>'+escapeHtml(m.o)+'</p><div class="tag-row">'+tags+'</div></div></a></article>'
  }
  function escapeHtml(s){return (s==null?"":String(s)).replace(/[&<>"']/g,function(ch){return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[ch]})}
  function escapeAttr(s){return escapeHtml(s)}
  function setupSearch(){
    var box=qs("[data-search-results]");
    if(!box||!window.SITE_INDEX)return;
    var params=new URLSearchParams(location.search);
    var q=(params.get("q")||"").trim();
    var title=qs("[data-search-title]");
    var sub=qs("[data-search-subtitle]");
    var empty=qs("[data-search-empty]");
    if(q){
      var nq=normalize(q);
      var results=window.SITE_INDEX.filter(function(m){
        return normalize([m.t,m.y,m.r,m.p,m.g,m.o,(m.a||[]).join(" ")].join(" ")).indexOf(nq)>-1
      }).slice(0,180);
      box.innerHTML=results.map(cardHtml).join("");
      if(title)title.textContent="搜索结果";
      if(sub)sub.textContent="关键词："+q;
      if(empty)empty.classList.toggle("is-visible",results.length===0);
    }else{
      if(empty)empty.classList.remove("is-visible");
    }
  }
  setupSearch();
  function setupPlayer(){
    var video=qs("#movie-player");
    if(!video)return;
    var btn=qs("#movie-play");
    var src=video.getAttribute("data-m3u8");
    var loaded=false;
    function load(){
      if(loaded||!src)return;
      loaded=true;
      if(video.canPlayType("application/vnd.apple.mpegurl")){
        video.src=src;
      }else if(window.Hls&&window.Hls.isSupported()){
        var hls=new window.Hls({enableWorker:true});
        hls.loadSource(src);
        hls.attachMedia(video);
      }else{
        video.src=src;
      }
    }
    function play(){
      load();
      var p=video.play();
      if(p&&p.catch){p.catch(function(){})}
    }
    load();
    if(btn){btn.addEventListener("click",play)}
    video.addEventListener("click",function(){if(video.paused){play()}else{video.pause()}});
    video.addEventListener("play",function(){if(btn)btn.classList.add("hidden")});
    video.addEventListener("pause",function(){if(btn)btn.classList.remove("hidden")});
  }
  setupPlayer();
})();
