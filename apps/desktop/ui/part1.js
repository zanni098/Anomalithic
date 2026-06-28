
      const $ = (s, r=document) => r.querySelector(s);
      const $$ = (s, r=document) => [...r.querySelectorAll(s)];
      const RUNTIME = "http://127.0.0.1:4517";
      const now = () => new Date().toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"});
      let running = false, timers = [], turn = 0, spend = 0, tokens = 0, feedN = 0;
      const toast = (m) => { const t=$("#toast"); t.textContent=m; t.classList.add("show"); setTimeout(()=>t.classList.remove("show"),1800); };
      const tabsWithComposer = new Set(["console"]);
      function showTab(tab){
        $$(".navitem").forEach(n=>n.classList.toggle("active", n.dataset.tab===tab));
        $$(".tab").forEach(n=>n.classList.toggle("active", n.dataset.tab===tab));
        $$(".view").forEach(v=>v.hidden = v.id !== "view-"+tab);
        $("#composer").style.display = tabsWithComposer.has(tab) ? "" : "none";
      }
      $("#nav").addEventListener("click", e=>{ const it=e.target.closest(".navitem"); if(it) showTab(it.dataset.tab); });
      $("#tabs").addEventListener("click", e=>{ const it=e.target.closest(".tab"); if(it) showTab(it.dataset.tab); });
      $("#themeBtn").addEventListener("click", ()=>{ const h=document.documentElement; h.dataset.theme = h.dataset.theme==="dark"?"light":"dark"; toast("Theme: "+h.dataset.theme); });
      $("#modelSel").addEventListener("change", e=>{ $("#modelChip").textContent = "✦ "+e.target.value; toast("Model → "+e.target.value); });
      const thread = $("#thread");
      function clearEmpty(){ const e=$("#emptyState"); if(e) e.remove(); }
      function scroll(){ const v=$("#view-console"); v.scrollTop = v.scrollHeight; }
      function el(html){ const d=document.createElement("div"); d.innerHTML=html.trim(); return d.firstChild; }
      const esc = s => (s||"").replace(/[&<>]/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[c]));
      function userMsg(text){ clearEmpty(); thread.appendChild(el(`<div class="msg"><div class="av user">You</div><div class="bubble"><div class="who">You <span class="time">${now()}</span></div><p>${esc(text)}</p></div></div>`)); scroll(); }
      function aiBubble(){
        clearEmpty();
        const node = el(`<div class="msg"><div class="av ai"><svg width="15" height="15" viewBox="0 0 32 32"><g transform="translate(16 16)"><rect x="-1.5" y="-13" width="3" height="26" rx="1.5" fill="var(--coral)"/><rect x="-1.5" y="-13" width="3" height="26" rx="1.5" fill="var(--coral)" transform="rotate(45)"/><rect x="-1.5" y="-13" width="3" height="26" rx="1.5" fill="var(--coral)" transform="rotate(90)"/><rect x="-1.5" y="-13" width="3" height="26" rx="1.5" fill="var(--coral)" transform="rotate(135)"/></g></svg></div><div class="bubble"><div class="who">Anomalithic <span class="time">${now()}</span></div><div class="content"></div></div></div>`);
        thread.appendChild(node); scroll(); return $(".content", node);
      }
      function addP(c, html){ c.appendChild(el(`<p>${html}</p>`)); scroll(); }
      const PLAN = ["Scan the repo and run the current test suite to see what fails","Isolate the 3 failing tests and the modules they touch","Fix the weakest failure first, re-run, repeat","Verify: hostile checker re-runs the full suite for evidence"];
      function planCard(){
        const c = aiBubble();
        addP(c, "Got it. I'll work this as a loop with a checkable bar — <b>stop when <code style='font-family:var(--mono)'>pnpm test</code> passes with zero failures.</b> Here's the plan:");
        const card = el(`<div class="card"><div class="head">▤ Plan <span class="tag">persistent · spine</span></div><div class="plan" id="planLive"></div></div>`);
        c.appendChild(card);
        const live = $("#planLive", card);
        PLAN.forEach((t,i)=> live.appendChild(el(`<div class="step" data-i="${i}"><div class="ck"></div><div class="t">${t}</div></div>`)));
        renderPlanSide(); scroll(); return c;
      }
      function setStep(i, state){
        $$(`.step[data-i='${i}']`).forEach(s=>{ s.classList.remove("run","done"); if(state) s.classList.add(state); if(state==="done") $(".ck",s).textContent="✓"; if(state==="run") $(".ck",s).textContent=""; });
        const done = $$("#planLive .step.done").length;
        $("#planBadge").textContent = done; $("#planCount").textContent = done+"/"+PLAN.length;
      }
      function renderPlanSide(){
        const mini=$("#planMini"), full=$("#planFull"); mini.innerHTML=""; full.innerHTML="";
        PLAN.forEach((t,i)=>{ mini.appendChild(el(`<div class="step" data-i="${i}"><div class="ck"></div><div class="t">${t}</div></div>`)); full.appendChild(el(`<div class="step" data-i="${i}"><div class="ck"></div><div class="t">${t}</div></div>`)); });
        $("#planCount").textContent = "0/"+PLAN.length;
      }
      function feed(icon, html){ feedN++; $("#feedN").textContent=feedN; const f=$("#feed"); if(feedN===1) f.innerHTML=""; f.insertBefore(el(`<div class="fitem"><div class="fi">${icon}</div><div class="ft">${html}</div><div class="fx">${now()}</div></div>`), f.firstChild); }
      function budget(t, s, tok){ turn=t; spend=s; tokens=tok; $("#turnV").textContent=t+" / 20"; $("#turnBar").style.width=(t/20*100)+"%"; $("#spendV").textContent="$"+s.toFixed(2)+" / $1.50"; $("#spendBar").style.width=(s/1.5*100)+"%"; $("#tokV").textContent=tok.toLocaleString(); $("#tokBar").style.width=Math.min(100,tok/12000*100)+"%"; }
      function agentSt(maker, checker){ const m=$("#makerSt"), c=$("#checkerSt"); m.className="st "+(maker||"idle"); m.textContent=maker==="work"?"working":maker||"idle"; c.className="st "+(checker||"idle"); c.textContent=checker==="work"?"verifying":checker||"idle"; }
      function stop(){ timers.forEach(clearTimeout); timers=[]; running=false; $("#runBtn").classList.remove("stop"); $("#runBtn").textContent="Run ▸"; $("#goalState").textContent="stopped"; agentSt("idle","idle"); }
      function seq(steps){ let t=0; steps.forEach(([d,fn])=>{ t+=d; timers.push(setTimeout(()=>{ if(running) fn(); }, t)); }); timers.push(setTimeout(()=>{ if(running){ running=false; $("#runBtn").classList.remove("stop"); $("#runBtn").textContent="Run ▸"; } }, t+200)); }
      function typeTerm(node, lines){ let i=0; (function nx(){ if(i>=lines.length) return; const [k,t]=lines[i++]; node.appendChild(el(`<div><span class="${k}">${esc(t)}</span></div>`)); const v=$("#view-console"); v.scrollTop=v.scrollHeight; timers.push(setTimeout(nx, 220)); })(); }
      function runDemo(goal){
        if(running) return;
        running=true; turn=0; spend=0; tokens=0;
        $("#runBtn").classList.add("stop"); $("#runBtn").textContent="◼ Stop";
        $("#goalText").textContent = goal; $("#goalState").textContent="running";
        userMsg(goal);
        let term;
        seq([
          [300, ()=>{ const c=aiBubble(); addP(c,"Reading the repo and running the suite first — I won't guess."); agentSt("work","idle"); feed("◷","Thinking window opened · <b>impression #1</b> minted"); budget(1,0.04,820); }],
          [700, ()=> planCard()],
          [500, ()=>{ setStep(0,"run"); feed("▦","Read <b>14 files</b> · package.json, source tree"); budget(2,0.07,1640); }],
          [600, ()=>{ const c=aiBubble(); addP(c,"Running the test suite:"); term=el(`<div class="card"><div class="head">▶ Terminal <span class="tag">action check</span></div><div class="term" id="t1"></div></div>`); c.appendChild(term); typeTerm($("#t1",term), [["c","$ pnpm test"],["dim","  ● auth.test.ts"],["err","  ✕ signs a valid token (expected 200, got 500)"],["err","  ✕ rejects an expired token"],["dim","  ● rate-limit.test.ts"],["err","  ✕ blocks after N requests"],["err","  3 failed, 21 passed (24 total)"]]); feed("▶","<b>pnpm test</b> → 3 failed, 21 passed"); }],
          [2200, ()=>{ setStep(0,"done"); setStep(1,"run"); $("#termFull").innerHTML=$("#t1").innerHTML; budget(3,0.12,3100); }],
          [700, ()=>{ const c=aiBubble(); addP(c,"Found it — <code style='font-family:var(--mono)'>verifyToken()</code> throws on a missing <code style='font-family:var(--mono)'>exp</code> claim instead of returning 401. Fixing the weakest failure first:"); feed("◑","Maker drafting patch"); agentSt("work","idle"); }],
          [800, ()=>{ const c=aiBubble(); const card=el(`<div class="card"><div class="head">▦ Edit · src/auth/verify.ts <span class="tag">do</span></div><div class="diff"></div></div>`); const d=$(".diff",card); [["ctx","@@ verifyToken(token) @@"],["ctx","  const claims = decode(token);"],["del","- if (!claims.exp) throw new Error('bad token');"],["add","+ if (!claims.exp) return { ok: false, status: 401 };"],["add","+ if (claims.exp < now()) return { ok: false, status: 401 };"],["ctx","  return { ok: true, status: 200, claims };"]].forEach(([k,t])=>d.appendChild(el(`<div class="l ${k}">${esc(t)}</div>`))); c.appendChild(card); setStep(1,"done"); setStep(2,"run"); feed("✎","Edited <b>src/auth/verify.ts</b> (+2 −1)"); budget(5,0.31,6400); }],
          [1300, ()=>{ const c=aiBubble(); addP(c,"Re-running to check against reality:"); const t2=el(`<div class="card"><div class="head">▶ Terminal <span class="tag">iteration check</span></div><div class="term" id="t2"></div></div>`); c.appendChild(t2); typeTerm($("#t2",t2),[["c","$ pnpm test"],["ok","  ✓ auth.test.ts (3)"],["ok","  ✓ rate-limit.test.ts (4)"],["ok","  24 passed (24 total)"]]); feed("▶","<b>pnpm test</b> → 24 passed ✓"); }],
          [2000, ()=>{ setStep(2,"done"); setStep(3,"run"); agentSt("done","work"); feed("◑","Checker (opus, hostile) re-running full suite"); budget(7,0.52,9200); }],
          [1200, ()=>{ const c=aiBubble(); addP(c,"Independent verification by the checker — a different, stronger model with no ego in the patch:"); const card=el(`<div class="card"><div class="head">◑ Verify · maker–checker <span class="tag">terminal check</span></div><div class="body"><div class="verify"><svg class="scorering" viewBox="0 0 36 36"><circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--panel-2)" stroke-width="3"/><circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--green)" stroke-width="3" stroke-dasharray="100" stroke-dashoffset="6" stroke-linecap="round" transform="rotate(-90 18 18)"/><text x="18" y="21" text-anchor="middle" font-size="9" fill="var(--text)">9.4</text></svg><div class="vt">All criteria pass with evidence: <b>24/24 tests green</b>, exit 0, no skipped specs. Quoted check output, not opinion. <br><b style="color:var(--green)">FINAL</b> — goal verified, exiting clean.</div></div></div></div>`); c.appendChild(card); setStep(3,"done"); agentSt("done","done"); feed("✓","Checker: <b>9.4/10</b> · FINAL"); budget(8,0.61,10400); }],
          [900, ()=>{ const c=aiBubble(); addP(c,"<b>Done.</b> Fixed 3 failing tests in 8 turns. The fix: <code style='font-family:var(--mono)'>verifyToken()</code> now returns 401 for missing/expired <code style='font-family:var(--mono)'>exp</code> instead of throwing. Suite is green and independently verified. Spent <b>$0.61</b> of the $1.50 cap; 18 thinking-impressions earned you <b style='color:var(--coral)'>$0.36</b>."); $("#goalState").textContent="done ✓"; feed("◆","Session credited <b>$0.36</b> · 18 impressions"); toast("Goal verified — FINAL ✓"); }],
        ]);
      }