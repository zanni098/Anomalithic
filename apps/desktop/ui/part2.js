      async function run(){
        const text = $("#input").value.trim(); if(!text){ return; }
        $("#input").value=""; $("#input").style.height="auto";
        if($("#rtPill").dataset.live==="1"){
          userMsg(text); const c=aiBubble(); addP(c,"<span class='dim'>✦ thinking…</span>");
          try{ const r=await fetch(RUNTIME+"/run",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({prompt:text})}); const d=await r.json(); c.innerHTML=""; addP(c, esc(d.text||"(no output)")); }
          catch(e){ addP(c,"<span style='color:#e0715a'>Runtime unreachable — start it with <code style='font-family:var(--mono)'>anomalithic serve</code>. Showing demo instead.</span>"); runDemo(text); }
        } else { runDemo(text); }
      }
      $("#runBtn").addEventListener("click", ()=>{ if(running) return stop(); run(); });
      $("#input").addEventListener("keydown", e=>{ if(e.key==="Enter" && !e.shiftKey){ e.preventDefault(); if(running) stop(); run(); } });
      $("#input").addEventListener("input", e=>{ e.target.style.height="auto"; e.target.style.height=Math.min(160,e.target.scrollHeight)+"px"; });
      $("#demoBtn").addEventListener("click", ()=>{ if(running) stop(); showTab("console"); runDemo("Fix every failing test in this repo until pnpm test passes with zero failures."); });
      $("#clearBtn").addEventListener("click", ()=>{ stop(); thread.innerHTML=""; thread.appendChild(emptyNode()); $("#feed").innerHTML='<div style="font-size:12px;color:var(--muted)">Tool calls stream here.</div>'; feedN=0; $("#feedN").textContent=0; renderPlanSide(); $("#planBadge").textContent=0; budget(0,0,0); $("#goalState").textContent="idle"; $("#goalText").textContent="No active task. Run a goal to watch the loop work."; });
      let emptyHTML = "";
      function emptyNode(){ return el(emptyHTML); }
      document.addEventListener("click", e=>{ const ex=e.target.closest(".ex"); if(ex){ if(running) stop(); runDemo(ex.dataset.prompt); } });
      const SESSIONS = [{t:"Fix failing auth tests", m:"8 turns · $0.61", a:true},{t:"Add /health endpoint + CI", m:"5 turns · $0.34"},{t:"Security audit → report", m:"12 turns · $1.10"},{t:"Migrate to pnpm workspaces", m:"6 turns · $0.42"}];
      function renderSessions(){ const l=$("#sessionList"); l.innerHTML=""; SESSIONS.forEach((s,i)=> l.appendChild(el(`<div class="session ${s.a?'active':''}" data-i="${i}"><div class="t">${s.t}</div><div class="m mono">${s.m}</div></div>`))); }
      $("#sessionList").addEventListener("click", e=>{ const s=e.target.closest(".session"); if(s){ $$(".session").forEach(x=>x.classList.remove("active")); s.classList.add("active"); } });
      $("#newSession").addEventListener("click", ()=>{ SESSIONS.unshift({t:"New session", m:"0 turns · $0.00", a:true}); SESSIONS.forEach((s,i)=>s.a=(i===0)); renderSessions(); showTab("console"); $("#clearBtn").click(); toast("New session"); });
      const SKILLS=[["▣","loop-engineering","Stop prompting — write loops that verify themselves","built-in"],["▣","code-review","Hostile review for security, perf, correctness","claude"],["▢","deploy","Ship a release with rollback steps","codex"]];
      const MEM=[["◔","prefers pnpm","Project uses pnpm + turbo, never npm"],["◔","CI is packages-only","biome + vitest run on packages"],["◔","coral = brand","UI accent is #d97757 (Claude coral)"],["◔","owner: zanni098","GitHub login for PRs and releases"],["◔","tests = bar","done means pnpm test green, exit 0"]];
      const CONN=[["🐙","GitHub","Open PRs, read repos, merge, releases","on"],["🦊","Supabase","Postgres + edge functions","on"],["💬","Slack","Post run summaries to #eng","off"],["🌐","Browser","Headless fetch + DOM read","on"]];
      const FILES=[["src/auth/verify.ts","edited · +2 −1","✎"],["src/auth/auth.test.ts","read","▦"],["src/rate-limit.ts","read","▦"],["package.json","read","▦"],[".anomalithic/state.md","spine · updated","◆"]];
      const AGENTS=[["M","Maker","claude-sonnet-4-6 · drafts and edits","maker"],["C","Checker","claude-opus-4-8 · hostile verifier","checker"],["R","Researcher","haiku · cheap scans and reads","maker"],["P","Planner","sonnet · breaks down the goal","checker"]];
      $("#skillsList").innerHTML = SKILLS.map(([i,t,d,tag])=>`<div class="lrow"><div class="li">${i}</div><div><div class="lt">${t}</div><div class="ld">${d}</div></div><div class="lr"><span class="tagx ${tag==='built-in'?'on':''}">${tag}</span><div class="switch on"><i></i></div></div></div>`).join("");
      $("#memoryList").innerHTML = MEM.map(([i,t,d])=>`<div class="lrow"><div class="li">${i}</div><div><div class="lt">${t}</div><div class="ld">${d}</div></div></div>`).join("");
      $("#connectorsList").innerHTML = CONN.map(([i,t,d,on])=>`<div class="lrow"><div class="li" style="font-size:18px">${i}</div><div><div class="lt">${t}</div><div class="ld">${d}</div></div><div class="lr"><span class="tagx ${on==='on'?'on':''}">${on==='on'?'connected':'available'}</span><div class="switch ${on==='on'?'on':''}"><i></i></div></div></div>`).join("");
      $("#filesList").innerHTML = FILES.map(([t,d,i])=>`<div class="lrow"><div class="li">${i}</div><div><div class="lt mono" style="font-size:12.5px">${t}</div><div class="ld">${d}</div></div></div>`).join("");
      $("#agentsList").innerHTML = AGENTS.map(([b,t,d,k])=>`<div class="lrow"><div class="li" style="background:color-mix(in srgb,var(--coral) 14%,transparent)"><b style="color:var(--coral)">${b}</b></div><div><div class="lt">${t}</div><div class="ld">${d}</div></div><div class="lr"><span class="tagx">${k}</span></div></div>`).join("");
      document.addEventListener("click", e=>{ const sw=e.target.closest(".switch"); if(sw){ sw.classList.toggle("on"); } });
      const CMDS=[["Run demo task","▶","demo"],["Clear console","⌫","clear"],["Toggle theme","◐","theme"],["New session","+","new"],["Open Skills","▣","tab:skills"],["Open Memory","◔","tab:memory"],["Open Connectors","⇄","tab:connectors"],["Open Plan","▤","tab:plan"],["Open Terminal","▶","tab:terminal"],["Open Earn","◆","tab:earn"]];
      function openPal(){ $("#scrim").classList.add("open"); $("#palInput").value=""; $("#palInput").focus(); renderPal(""); }
      function closePal(){ $("#scrim").classList.remove("open"); }
      function renderPal(q){ const o=$("#palOpts"); const f=CMDS.filter(c=>c[0].toLowerCase().includes(q.toLowerCase())); o.innerHTML=f.map((c,i)=>`<div class="popt ${i===0?'sel':''}" data-act="${c[2]}"><span style="width:18px;text-align:center">${c[1]}</span> ${c[0]}<span class="pk">↵</span></div>`).join(""); }
      function doAct(a){ closePal(); if(a==="demo") $("#demoBtn").click(); else if(a==="clear") $("#clearBtn").click(); else if(a==="theme") $("#themeBtn").click(); else if(a==="new") $("#newSession").click(); else if(a.startsWith("tab:")) showTab(a.slice(4)); }
      $("#openPalette").addEventListener("click", openPal);
      $("#scrim").addEventListener("click", e=>{ if(e.target.id==="scrim") closePal(); });
      $("#palInput").addEventListener("input", e=>renderPal(e.target.value));
      $("#palOpts").addEventListener("click", e=>{ const p=e.target.closest(".popt"); if(p) doAct(p.dataset.act); });
      document.addEventListener("keydown", e=>{ if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==="k"){ e.preventDefault(); openPal(); } if(e.key==="Escape") closePal(); if($("#scrim").classList.contains("open")&&e.key==="Enter"){ const s=$(".popt.sel"); if(s) doAct(s.dataset.act); } });
      async function health(){ try{ const r=await fetch(RUNTIME+"/health",{cache:"no-store"}); const d=await r.json(); $("#rtPill").innerHTML='<span class="dot live"></span> '+d.provider+":"+d.model; $("#rtPill").dataset.live="1"; $("#rtFoot").textContent="runtime · "+d.provider+" · live"; }catch(e){ $("#rtPill").innerHTML='<span class="dot demo"></span> demo mode'; $("#rtPill").dataset.live="0"; } }
      (async()=>{ try{ const {invoke}=window.__TAURI__.core; const info=await invoke("runtime_info"); $("#rtFoot").textContent=info.name+" "+info.version+" · "+info.os+"/"+info.arch; }catch(e){} health(); setInterval(health, 8000); })();
      emptyHTML = $("#emptyState").outerHTML;
      renderSessions(); renderPlanSide(); budget(0,0,0);
    