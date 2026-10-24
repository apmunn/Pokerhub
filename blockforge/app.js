/* Zaverith v1.0. Free static Minecraft server tools. No backend or external API required. */
'use strict';
const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];
const escapeHTML = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const slug = v => String(v||'').replace(/[^a-zA-Z0-9_-]/g,'_').slice(0,45);
const STORE = 'blockforge-v1';
const PREF_STORE = 'blockforge-comfort-v2';
const prefDefaults = {light:false,large:false,contrast:false,motion:false};
function loadPrefs(){try{const data=JSON.parse(localStorage.getItem(PREF_STORE)||'{}');return {...prefDefaults,...Object.fromEntries(Object.entries(data||{}).filter(([key,value])=>key in prefDefaults && typeof value==='boolean'))}}catch{return {...prefDefaults}}}
const prefs=loadPrefs();
function applyPrefs(){
  const root=document.documentElement;
  root.dataset.theme=prefs.light?'light':'cozy';
  root.dataset.text=prefs.large?'large':'regular';
  root.dataset.contrast=prefs.contrast?'high':'normal';
  root.dataset.motion=prefs.motion?'reduce':'normal';
  for(const [key,buttonId,valueId] of [['light','theme-toggle','theme-value'],['large','text-toggle','text-value'],['contrast','contrast-toggle','contrast-value'],['motion','motion-toggle','motion-value']]){
    const button=document.getElementById(buttonId),value=document.getElementById(valueId);
    if(button)button.setAttribute('aria-pressed',String(prefs[key]));
    if(value)value.textContent=prefs[key]?'On':'Off';
  }
  try{localStorage.setItem(PREF_STORE,JSON.stringify(prefs))}catch{}
}
function setNavOpen(open){
  const sidebar=$('#sidebar'),button=$('#menu-toggle'),backdrop=$('#nav-backdrop');
  if(!sidebar||!button||!backdrop)return;
  if(!open && sidebar.contains(document.activeElement))button.focus();
  sidebar.inert=!open && window.innerWidth<=780;
  sidebar.classList.toggle('open',open);
  button.setAttribute('aria-expanded',String(open));
  button.setAttribute('aria-label',open?'Close navigation':'Open navigation');
  backdrop.hidden=!open;
  if(open){const first=$('#menu-close');if(first)first.focus()}
}
applyPrefs();

function readState(){try{return JSON.parse(localStorage.getItem(STORE)||'{}')||{}}catch{return {}}}
const state = Object.assign({profile:'1.12.2',eagler:true,server:'Spigot',features:['economy','shops','leaderboards','permissions','worlds'],economy:[{item:'DIAMOND',buy:500,sell:120},{item:'IRON_INGOT',buy:80,sell:20},{item:'GOLD_INGOT',buy:110,sell:35},{item:'COBBLESTONE',buy:8,sell:2}],boardName:'SERVER STATS',boardStat:'kills',boardRows:['PlayerOne','BuilderPro','Miner123'],props:{motd:'A Zaverith Server',maxPlayers:20,difficulty:'normal',gamemode:'survival',pvp:true,onlineMode:true,spawnProtection:16,viewDistance:10,allowFlight:false,whitelist:false,commandBlocks:false,port:25565},motd:'&a&lWelcome to &bZaverith',yaml:[{key:'server-name',value:'My Server'},{key:'welcome-message',value:'Hello players'}]},readState());
const save=()=>{try{localStorage.setItem(STORE,JSON.stringify(state))}catch{}};
const names={home:'Overview',servers:'My servers',server:'Server dashboard',market:'Marketplace',wizard:'Setup wizard',plugins:'Plugin library',economy:'Economy planner',leaderboards:'Scoreboards',crafting:'Crafting guide',worlds:'Worlds & maps',configs:'Config generator'};
const profiles=['1.5.2','1.6.4','1.7.10','1.8.8','1.9.4','1.10.2','1.11.2','1.12.2','1.13.2','1.14.4','1.15.2','1.16.5','1.17.1','1.18.2','1.19.4','1.20.4','1.20.6','1.21+'].map(id=>({id,label:'Java '+id,short:'Java '+id}));
const minorVersion=()=>{const m=String(state.profile).match(/^1\.(\d+)/);return m?Number(m[1]):12};
const categories=['All','Economy','Shops','Leaderboards','Crafting','Worlds','Maps','Permissions','Utilities','Protection','Performance','Eaglercraft'];
const plugins=[
{id:'essentials',name:'EssentialsX',cat:'Economy',desc:'Economy, homes, warps, teleport requests, kits and common server commands.',deps:'Vault for many shop/economy integrations',link:'https://essentialsx.net/downloads.html',range:'varies',note:'Find an archived build matching older servers. Economy support depends on the chosen build.'},
{id:'vault',name:'Vault',cat:'Economy',desc:'An API bridge between economy, chat and permission plugins. Vault does not create money on its own.',deps:'Economy provider such as EssentialsX',link:'https://www.spigotmc.org/resources/vault.34315/',range:'varies',note:'Use a compatible build and install a real economy provider.'},
{id:'shopkeepers',name:'Shopkeepers',cat:'Shops',desc:'NPC/villager trading shops. Different from a GUI server shop.',deps:'Economy plugin for currency-based shop modes',link:'https://www.spigotmc.org/resources/shopkeepers.80756/',range:'varies',note:'Verify the exact build and its supported Minecraft versions.'},
{id:'gui-shop',name:'GUI Shop plugin',cat:'Shops',desc:'Menu-based buy and sell shops. Choose a specific plugin with a matching config format.',deps:'Often Vault and an economy provider',link:'',range:'varies',note:'There is no universal shop YAML format. Select the plugin first.'},
{id:'auction',name:'Auction House plugin',cat:'Shops',desc:'Player-to-player listing and auction features.',deps:'Often Vault and an economy provider',link:'',range:'varies',note:'Pick a maintained or archived release for your exact server version.'},
{id:'luckperms',name:'LuckPerms',cat:'Permissions',desc:'Create ranks, permission groups, prefixes and staff access rules.',deps:'None typically required',link:'https://luckperms.net/',range:'varies',note:'Download the build compatible with your server software.'},
{id:'papi',name:'PlaceholderAPI',cat:'Leaderboards',desc:'Supplies dynamic placeholders used by many scoreboards, holograms and menus.',deps:'Compatible expansions and a display plugin',link:'https://www.spigotmc.org/resources/placeholderapi.6245/',range:'varies',note:'An expansion may be needed for money, kills or other stats.'},
{id:'tab',name:'TAB',cat:'Leaderboards',desc:'Tab list, name tags and scoreboard display tools, depending on version.',deps:'PlaceholderAPI for some external stats',link:'https://github.com/NEZNAMY/TAB',range:'varies',note:'Older servers may need older releases. Check project documentation.'},
{id:'stats',name:'Statistics plugin',cat:'Leaderboards',desc:'Track kills, playtime and other stats for leaderboard displays.',deps:'Optional PlaceholderAPI / scoreboard plugin',link:'',range:'varies',note:'Stats storage and placeholders differ by plugin.'},
{id:'craft',name:'Custom crafting plugin',cat:'Crafting',desc:'Create custom recipes and permissions for special items.',deps:'Plugin-specific',link:'',range:'varies',note:'Recipe APIs changed across versions. Verify plugin and recipe syntax.'},
{id:'multiverse',name:'Multiverse-Core',cat:'Worlds',desc:'Load and manage multiple server worlds with teleport support.',deps:'Additional Multiverse modules only when needed',link:'https://github.com/Multiverse/Multiverse-Core',range:'varies',note:'Choose a version-compatible release and back up worlds before import.'},
{id:'oneblock',name:'OneBlock world mode',cat:'Worlds',desc:'A OneBlock experience usually requires a world template, datapack or dedicated plugin.',deps:'Depends on chosen implementation',link:'',range:'varies',note:'Not every OneBlock world/plugin works on legacy versions.'},
{id:'dynmap',name:'Dynmap',cat:'Maps',desc:'Optional web map for a running Java server, if host permits extra ports and resources.',deps:'Supported server build, hosting access',link:'https://github.com/webbukkit/dynmap',range:'varies',note:'Can use substantial CPU/storage. Check server and hosting compatibility.'},
{id:'worldedit',name:'WorldEdit',cat:'Worlds',desc:'Build tools, region selections, copy/paste and schematic workflows.',deps:'None for basic usage',link:'https://enginehub.org/worldedit',range:'varies',note:'Schematics and commands vary between old and new builds.'},
{id:'worldguard',name:'WorldGuard',cat:'Protection',desc:'Protect spawn and regions with flags and permissions.',deps:'Compatible WorldEdit build',link:'https://enginehub.org/worldguard',range:'varies',note:'Requires a matching WorldEdit and WorldGuard combination.'},
{id:'spark',name:'spark',cat:'Performance',desc:'Profiler for diagnosing lag, CPU load and slow server tasks.',deps:'Compatible runtime and server version',link:'https://spark.lucko.me/',range:'varies',note:'Some old versions need an older build; confirm Java runtime support.'},
{id:'eagler',name:'Eaglercraft gateway / proxy',cat:'Eaglercraft',desc:'A browser client normally needs a supported gateway/proxy to reach a Java server.',deps:'Compatible proxy/gateway, authentication and network configuration',link:'',range:'gateway',note:'Eaglercraft client protocol versions differ. Do not disable online authentication blindly.'}
];
const featureDefs=[
{id:'economy',label:'Money & balances',desc:'Currency, /pay and balances',plugins:['essentials','vault']},
{id:'shops',label:'Shops & auctions',desc:'Buy/sell menus and auctions',plugins:['essentials','vault','gui-shop','auction']},
{id:'leaderboards',label:'Leaderboards',desc:'Stats, money and scoreboards',plugins:['papi','tab','stats']},
{id:'crafting',label:'Custom crafting',desc:'Recipe systems and crafting help',plugins:['craft']},
{id:'worlds',label:'Multiple worlds',desc:'World manager and OneBlock options',plugins:['multiverse','oneblock']},
{id:'maps',label:'Web maps',desc:'Optional Dynmap and world maps',plugins:['dynmap']},
{id:'permissions',label:'Ranks & permissions',desc:'Groups, ranks and permissions',plugins:['luckperms']},
{id:'protection',label:'Anti-grief',desc:'Protected regions and editing',plugins:['worldedit','worldguard']},
{id:'performance',label:'Performance',desc:'Profiling and lag diagnosis',plugins:['spark']},
{id:'eagler',label:'Eaglercraft access',desc:'Gateway and proxy planning',plugins:['eagler']}
];
const recipes=[
{name:'Crafting Table',min:0,ingredients:'4 wooden planks',grid:['','','','plank','plank','','plank','plank',''],output:'1 crafting table',desc:'Any wood plank type.'},
{name:'Furnace',min:0,ingredients:'8 cobblestone',grid:['cobble','cobble','cobble','cobble','','cobble','cobble','cobble','cobble'],output:'1 furnace',desc:'Use cobblestone for classic versions.'},
{name:'Chest',min:0,ingredients:'8 wooden planks',grid:['plank','plank','plank','plank','','plank','plank','plank','plank'],output:'1 chest',desc:'Storage block.'},
{name:'Sticks',min:0,ingredients:'2 wooden planks',grid:['','plank','','','plank','','','',''],output:'4 sticks',desc:'Two planks vertically.'},
{name:'Torches',min:0,ingredients:'1 coal or charcoal + 1 stick',grid:['','coal','','','stick','','','',''],output:'4 torches',desc:'Fuel above stick.'},
{name:'Bread',min:0,ingredients:'3 wheat',grid:['','','','wheat','wheat','wheat','','',''],output:'1 bread',desc:'Three wheat horizontally.'},
{name:'Paper',min:0,ingredients:'3 sugar cane',grid:['','','','cane','cane','cane','','',''],output:'3 paper',desc:'Three sugar cane horizontally.'},
{name:'Compass',min:0,ingredients:'4 iron ingots + 1 redstone dust',grid:['','iron','','iron','redstone','iron','','iron',''],output:'1 compass',desc:'Points toward world spawn in the Overworld.'},
{name:'Anvil',min:0,ingredients:'3 iron blocks + 4 iron ingots',grid:['iron block','iron block','iron block','','iron','','iron','iron','iron'],output:'1 anvil',desc:'Repair and rename items.'},
{name:'Shield',min:9,ingredients:'6 wooden planks + 1 iron ingot',grid:['plank','iron','plank','plank','plank','plank','','plank',''],output:'1 shield',desc:'Java 1.9+; not available in older Java versions.'},
{name:'Observer',min:11,ingredients:'6 cobblestone + 2 redstone + 1 nether quartz',grid:['cobble','cobble','cobble','redstone','redstone','quartz','cobble','cobble','cobble'],output:'1 observer',desc:'Java 1.11+.'},
{name:'Blast Furnace',min:14,ingredients:'5 iron ingots + 1 furnace + 3 smooth stone',grid:['iron','iron','iron','iron','furnace','iron','smooth stone','smooth stone','smooth stone'],output:'1 blast furnace',desc:'Java 1.14+.'},
{name:'Smoker',min:14,ingredients:'4 logs + 1 furnace',grid:['','log','','log','furnace','log','','log',''],output:'1 smoker',desc:'Java 1.14+.'}
];
function toast(msg){const t=$('#toast');t.textContent=msg;t.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.classList.remove('show'),2700)}
function download(filename,content,type='text/plain'){const blob=new Blob([content],{type:type+';charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Downloaded '+filename)}
async function copyText(content){try{await navigator.clipboard.writeText(content);toast('Copied to clipboard')}catch{const ta=document.createElement('textarea');ta.value=content;document.body.append(ta);ta.select();document.execCommand('copy');ta.remove();toast('Copied to clipboard')}}
function header(title,desc,kicker='TOOLS'){return `<div class="page-header"><div class="eyebrow">${kicker}</div><h1>${title}</h1><p>${desc}</p></div>`}
function cardNav(href,icon,title,desc){return `<a class="card interactive" href="#${href}"><div class="symbol">${icon}</div><h3>${title}</h3><p>${desc}</p><span class="card-link">Open tool ↗</span></a>`}
function versionSelect(id='version-select'){return `<select id="${id}" aria-label="Minecraft version group">${profiles.map(p=>`<option value="${p.id}" ${state.profile===p.id?'selected':''}>${p.label}</option>`).join('')}</select>`}
function eNote(){return `<div class="notice mt"><strong>Eaglercraft note:</strong> Eaglercraft is a browser client, not a Bukkit server version. Use a gateway/proxy that matches your client protocol and Java backend. Plugin compatibility depends on the <strong>Java server version</strong>, and authentication must be configured safely.</div>`}
function home(){return zOverview()}
function wizard(){return `${header('Server setup wizard','Pick your server type and features. Get a plugin checklist with dependencies and setup notes.','GUIDED SETUP')}<div class="split"><div class="stack"><section class="card"><h3>01 / Server details</h3><div class="form-grid mt"><div class="field"><label for="wizard-version">Minecraft Java version</label>${versionSelect('wizard-version')}</div><div class="field"><label for="wizard-server">Server software</label><select id="wizard-server"><option ${state.server==='Spigot'?'selected':''}>Spigot</option><option ${state.server==='Paper'?'selected':''}>Paper</option><option ${state.server==='Other'?'selected':''}>Other</option></select></div><label class="choice full"><input id="wizard-eagler" type="checkbox" ${state.eagler?'checked':''}> Eaglercraft browser players will connect</label></div></section><section class="card"><h3>02 / Choose features</h3><p>Pick anything you want. The wizard includes suggested dependencies.</p><div class="check-grid mt">${featureDefs.map(f=>`<label class="check-card"><input type="checkbox" data-feature="${f.id}" ${state.features.includes(f.id)?'checked':''}><span><strong>${f.label}</strong><small>${f.desc}</small></span></label>`).join('')}</div></section><div class="notice warn">All results are planning recommendations, not confirmed compatibility tests. Verify exact plugin releases, server software, Java runtime and dependencies before installing.</div></div><div class="stack"><section class="card"><div class="section-head" style="margin:0 0 12px"><div><div class="section-caption">YOUR STACK</div><h2 style="margin-top:7px">Setup checklist</h2></div><span class="tag">AUTO GENERATED</span></div><div id="wizard-output"></div><div class="actions mt"><button class="btn primary" id="wizard-download">↓ Download checklist</button><button class="btn" id="wizard-copy">Copy</button></div></section>${eNote()}</div></div>`}
function wizardList(){const selected=new Set(state.features);if(state.eagler)selected.add('eagler');const ids=[...new Set([...selected].flatMap(id=>(featureDefs.find(f=>f.id===id)||{plugins:[]}).plugins))];const order=['essentials','vault','luckperms','worldedit','worldguard','papi','multiverse','tab','stats','gui-shop','shopkeepers','auction','craft','oneblock','dynmap','spark','eagler'];return ids.map(id=>plugins.find(p=>p.id===id)).filter(Boolean).sort((a,b)=>order.indexOf(a.id)-order.indexOf(b.id))}
function wizardText(){const stack=wizardList();const ver=profiles.find(p=>p.id===state.profile)?.label||state.profile;return `BLOCKFORGE SERVER SETUP CHECKLIST\nVersion group: ${ver}\nServer: ${state.server}\nEaglercraft: ${state.eagler?'Yes (requires compatible gateway/proxy)':'No'}\nFeatures: ${state.features.join(', ')||'None'}\n\nSUGGESTED STACK\n${stack.map((p,i)=>`${i+1}. ${p.name}\n   Purpose: ${p.desc}\n   Dependencies: ${p.deps}\n   Check: ${p.note}${p.link?'\n   Official/project: '+p.link:''}`).join('\n\n')||'Select features to build your stack.'}\n\nINSTALL ORDER\n1. Back up your world and configs.\n2. Confirm Minecraft server software, version and Java runtime.\n3. Download exact compatible builds from official project pages.\n4. Install dependencies before dependent plugins.\n5. Restart and read console logs for errors.\n6. Test permissions, economy, shops and world imports.\n7. For Eaglercraft, configure and secure a compatible gateway/proxy; do not casually disable authentication.\n\nCompatibility must be checked per release. Zaverith does not ship plugin JAR files.`}
function refreshWizard(){const target=$('#wizard-output');if(!target)return;const stack=wizardList();target.innerHTML=stack.length?`<div class="steps">${stack.map((p,i)=>`<div class="step"><div class="step-num">${i+1}</div><div><h3>${escapeHTML(p.name)}</h3><p>${escapeHTML(p.desc)}</p><div class="tags"><span class="tag gray">${escapeHTML(p.cat)}</span><span class="tag orange">Verify version</span></div><p><strong>Needs:</strong> ${escapeHTML(p.deps)}</p>${p.link?`<p><a class="linkout" href="${p.link}" target="_blank" rel="noopener noreferrer">Official / project page ↗</a></p>`:''}</div></div>`).join('')}</div>`:'<div class="empty">Choose some features to generate a checklist.</div>'}
function pluginsPage(){return `${header('Plugin library','Find the right tools for your server. All plugin versions require verification against your exact Java server build.','PLUGIN DISCOVERY')}<div class="toolbar"><input id="plugin-search" class="search" type="search" placeholder="Search plugins, features, dependencies…" aria-label="Search plugins"><select id="plugin-category"><option>All</option>${categories.slice(1).map(c=>`<option>${c}</option>`).join('')}</select>${versionSelect('plugin-version')}<label class="choice"><input id="plugin-eagler" type="checkbox" ${state.eagler?'checked':''}> Eaglercraft setup</label></div><div class="notice mb">These are <strong>server-side Java plugin suggestions</strong>, not downloads. Every release must match your exact server and Java runtime. A browser Eaglercraft client typically needs a compatible gateway/proxy.</div><div class="section-head"><div><h2>Browse tools</h2><p id="plugin-count"></p></div></div><div id="plugin-results" class="grid three"></div>`}
function refreshPlugins(){const q=($('#plugin-search')?.value||'').toLowerCase().trim(),cat=$('#plugin-category')?.value||'All';const results=plugins.filter(p=>(cat==='All'||p.cat===cat)&&(!q||[p.name,p.cat,p.desc,p.deps,p.note].join(' ').toLowerCase().includes(q)));const count=$('#plugin-count');if(count)count.textContent=`${results.length} of ${plugins.length} entries · ${profiles.find(p=>p.id===state.profile)?.label}`;const out=$('#plugin-results');if(!out)return;out.innerHTML=results.length?results.map(p=>`<article class="card plugin-card"><div class="plugin-head"><h3>${escapeHTML(p.name)}</h3><span class="tag gray">${escapeHTML(p.cat)}</span></div><p>${escapeHTML(p.desc)}</p><div class="tags"><span class="tag orange">Version dependent</span><span class="tag cyan">Java server</span></div><div class="footer-note"><strong>Dependencies:</strong> ${escapeHTML(p.deps)}<br><strong>Compatibility:</strong> ${escapeHTML(p.note)}</div><div class="plugin-foot"><span>Check exact release</span>${p.link?`<a href="${p.link}" target="_blank" rel="noopener noreferrer">Project page ↗</a>`:'<span>Choose a specific project</span>'}</div></article>`).join(''):'<div class="no-results">No matching plugins. Try another search or category.</div>'}
function economyPage(){return `${header('Economy planner','Plan server shop prices, check for buy/sell exploits and export a CSV. This is a planner, not a plugin config.','MONEY SYSTEMS')}<div class="grid two mb"><div class="card metric"><div class="symbol" style="margin:0">◈</div><div><div class="num" id="economy-count">0</div><p>Shop items</p></div></div><div class="card metric"><div class="symbol" style="margin:0">✓</div><div><div class="num" id="economy-safe">0</div><p>Prices without obvious buy/sell loop</p></div></div></div><div class="card"><div class="section-head" style="margin:0 0 18px"><div><h2>Item prices</h2><p>Use material names matching your chosen Minecraft version.</p></div><div class="actions"><button class="btn small" id="economy-add">+ Add item</button><button class="btn small primary" id="economy-export">↓ Export CSV</button></div></div><div class="table-wrap"><table><thead><tr><th scope="col">Material / item</th><th scope="col">Buy price</th><th scope="col">Sell price</th><th scope="col">Margin</th><th scope="col">Action</th></tr></thead><tbody id="economy-rows"></tbody></table></div><div id="economy-warning" class="mt"></div></div><div class="grid two mt"><div class="card"><h3>Suggested economy stack</h3><p><strong>EssentialsX</strong> can provide balances and /pay. <strong>Vault</strong> connects supported shops and other plugins to that economy. Choose a GUI shop plugin separately.</p><a class="linkout" href="#plugins">Explore plugins →</a></div><div class="card"><h3>Important</h3><p>Shop configs are plugin-specific. This tool exports CSV for planning and does not claim to generate working configs for every shop plugin. Test all prices on a backup server.</p></div></div>`}
function refreshEconomy(){const tbody=$('#economy-rows');if(!tbody)return;tbody.innerHTML=state.economy.map((r,i)=>`<tr><td><input aria-label="Item ${i+1}" data-econ="item" data-index="${i}" value="${escapeHTML(r.item)}" maxlength="64"></td><td><input aria-label="Buy price ${i+1}" data-econ="buy" data-index="${i}" type="number" min="0" step="0.01" value="${Number(r.buy)||0}"></td><td><input aria-label="Sell price ${i+1}" data-econ="sell" data-index="${i}" type="number" min="0" step="0.01" value="${Number(r.sell)||0}"></td><td id="margin-${i}">${Number(r.buy)>=Number(r.sell)?'✓ Safe':'⚠ Exploit'}</td><td><button data-remove-econ="${i}" aria-label="Remove item ${i+1}">×</button></td></tr>`).join('');refreshEconomySummary()}
function refreshEconomySummary(){const safe=state.economy.filter(r=>Number(r.buy)>=Number(r.sell)&&Number(r.buy)>=0&&Number(r.sell)>=0).length;$('#economy-count').textContent=state.economy.length;$('#economy-safe').textContent=safe;const bad=state.economy.length-safe;$('#economy-warning').innerHTML=bad?`<div class="notice warn">${bad} item(s) have a negative price or a sell price higher than buy price. Players may be able to generate money by buying and selling repeatedly.</div>`:'<div class="notice">All current items have nonnegative prices and buy prices at least as high as sell prices.</div>';state.economy.forEach((r,i)=>{const cell=$(`#margin-${i}`);if(cell)cell.textContent=Number(r.buy)>=Number(r.sell)&&Number(r.buy)>=0&&Number(r.sell)>=0?'✓ Safe':'⚠ Exploit'})}
function csvEscape(v){return '"'+String(v).replace(/"/g,'""')+'"'}
function economyCSV(){return 'material,buy_price,sell_price\n'+state.economy.map(r=>[r.item,r.buy,r.sell].map(csvEscape).join(',')).join('\n')+'\n'}
function boardPage(){return `${header('Leaderboard designer','Create a vanilla scoreboard objective and preview the display. Money boards require a compatible economy-to-scoreboard plugin.','PLAYER STATS')}<div class="split"><section class="card"><h3>Board settings</h3><div class="form-grid mt"><div class="field full"><label for="board-name">Board title</label><input id="board-name" maxlength="32" value="${escapeHTML(state.boardName)}"></div><div class="field full"><label for="board-stat">Scoreboard type</label><select id="board-stat"><option value="kills" ${state.boardStat==='kills'?'selected':''}>Player kills</option><option value="deaths" ${state.boardStat==='deaths'?'selected':''}>Deaths</option><option value="money" ${state.boardStat==='money'?'selected':''}>Money (requires plugin)</option><option value="custom" ${state.boardStat==='custom'?'selected':''}>Custom dummy objective</option></select></div></div><div class="notice warn mt" id="board-warning"></div><div class="actions mt"><button class="btn primary" id="board-download">↓ Download commands</button><button class="btn" id="board-copy">Copy commands</button></div></section><section class="card"><div class="section-caption">LIVE PREVIEW</div><h3 class="mt">Sidebar mockup</h3><div id="board-preview" class="score-preview"></div><p class="mini">This preview uses sample players, not live server data.</p></section></div><div class="section-head"><h2>Generated commands</h2></div><div class="code-panel"><div class="code-top"><span>commands.txt</span><button class="btn small" id="board-code-copy">Copy</button></div><pre id="board-code"></pre></div>`}
function boardCommands(){const objective=state.boardStat==='kills'?'playerKillCount':state.boardStat==='deaths'?'deathCount':'dummy';return `# Run as an operator or from the server console (remove / in console).\n# Make sure the objective name isn't already in use.\n/scoreboard objectives add bf_${state.boardStat} ${objective}\n/scoreboard objectives setdisplay sidebar bf_${state.boardStat}\n# Rename the display title with a command supported by your server version.\n${state.boardStat==='money'?'# MONEY NOTE: a dummy objective does not sync Vault balances.\n# Install and configure a compatible economy scoreboard/placeholder bridge.\n':''}${state.boardStat==='custom'?'# Set scores manually or with a plugin:\n/scoreboard players set ExamplePlayer bf_custom 10\n':''}# To remove: /scoreboard objectives remove bf_${state.boardStat}`}
function refreshBoard(){const title=state.boardName.trim()||'SERVER STATS';$('#board-preview').innerHTML=`<b>${escapeHTML(title)}</b>\n${state.boardRows.map((p,i)=>`<span class="green">${escapeHTML(p)}</span>   <span class="score">${[125,83,42][i]}</span>`).join('\n')}`;$('#board-code').textContent=boardCommands();$('#board-warning').textContent=state.boardStat==='money'?'Money requires a scoreboard plugin or bridge that can read your economy provider. Vanilla dummy scores do not automatically track balances.':'Objective criteria and display-name commands vary by Minecraft version. Test on your server before using.'}
function craftingPage(){return `${header('Crafting guide','Search classic recipes and see when newer blocks were added. Recipes shown are for Minecraft Java Edition.','RECIPE LIBRARY')}<div class="toolbar"><input id="recipe-search" class="search" type="search" aria-label="Search crafting recipes" placeholder="Search recipe or ingredient…">${versionSelect('recipe-version')}<label class="choice"><input id="recipe-all" type="checkbox"> Show recipes from newer versions</label></div><div class="section-head"><h2>Crafting recipes</h2><span id="recipe-count" class="count"></span></div><div id="recipe-results" class="grid three"></div><div class="notice mt">Some materials and recipes change between releases. A 3×3 grid is shown for consistency even when a recipe fits the player's 2×2 inventory grid.</div>`}
function refreshRecipes(){const q=($('#recipe-search')?.value||'').toLowerCase(),all=$('#recipe-all')?.checked||false;const max=minorVersion();const results=recipes.filter(r=>(all||r.min<=max)&&[r.name,r.ingredients,r.desc].join(' ').toLowerCase().includes(q));$('#recipe-count').textContent=results.length+' recipes';$('#recipe-results').innerHTML=results.length?results.map(r=>`<article class="card recipe-card"><div class="tags"><span class="tag ${r.min?'cyan':''}">${r.min?'Java 1.'+r.min+'+':'Classic'}</span></div><h3>${escapeHTML(r.name)}</h3><div class="recipe"><div class="recipe-board">${r.grid.map(s=>`<span class="recipe-slot ${s?'filled':''}" title="${escapeHTML(s||'Empty')}">${escapeHTML(s?({plank:'PLK',cobble:'COB',coal:'COAL',stick:'STK',wheat:'WHT',cane:'CANE',iron:'Fe',redstone:'RED',quartz:'QTZ',furnace:'FURN','iron block':'Fe×9','smooth stone':'STN',log:'LOG'}[s]||s):'')}</span>`).join('')}</div><div class="recipe-desc"><strong>Ingredients</strong><br>${escapeHTML(r.ingredients)}<br><br><strong>Output</strong><br>${escapeHTML(r.output)}</div></div><p>${escapeHTML(r.desc)}</p></article>`).join(''):'<div class="no-results">No matching recipes for this version group.</div>'}
function worldsPage(){return `${header('Worlds & maps','Plan world imports, OneBlock setups and live maps without losing your server data.','WORLD MANAGEMENT')}<div class="grid three"><div class="card world-card"><div class="world-icon">◈</div><span class="tag">WORLD TYPE</span><h3 class="mt">Survival & creative</h3><p>Run a standard overworld and optional extra worlds using a version-compatible world manager.</p><a class="linkout" href="#plugins">Find world plugins →</a></div><div class="card world-card"><div class="world-icon">▣</div><span class="tag cyan">CHALLENGE</span><h3 class="mt">OneBlock</h3><p>Use a compatible OneBlock world template or a dedicated plugin. Different implementations support different versions.</p><a class="linkout" href="#wizard">Plan OneBlock setup →</a></div><div class="card world-card"><div class="world-icon">◎</div><span class="tag orange">WEB MAPS</span><h3 class="mt">Dynmap / map viewers</h3><p>A live web map requires a running server, supported plugin and host networking. It cannot be hosted as a static map on this site.</p><a class="linkout" href="https://github.com/webbukkit/dynmap" target="_blank" rel="noopener noreferrer">Dynmap project ↗</a></div></div><div class="section-head"><div><h2>Safe world import checklist</h2><p>Do these steps before uploading or replacing a world.</p></div><button id="world-download" class="btn primary">↓ Download checklist</button></div><div class="steps">${[['Back up everything','Save your world folders, plugins and server configs before changes.'],['Check the Minecraft version','Worlds created in newer versions may not work on older servers. Downgrades can corrupt data.'],['Stop the server','Do not replace world folders while the server is writing to them.'],['Upload the correct folder','For a default world, use the actual world directory containing level.dat. Check the level-name setting.'],['Import extra worlds properly','Use a version-compatible world manager such as Multiverse-Core and follow its documented import command.'],['Test and protect','Restart, inspect logs, check spawn and permissions, and keep a rollback copy.']].map((s,i)=>`<div class="step"><div class="step-num">${i+1}</div><div><h3>${s[0]}</h3><p>${s[1]}</p></div></div>`).join('')}</div>${eNote()}`}
function worldText(){return 'BLOCKFORGE WORLD IMPORT CHECKLIST\n\n1. Back up world folders and configs.\n2. Check world version compatibility. Avoid downgrading worlds.\n3. Stop the server.\n4. Upload the correct folder containing level.dat. Check server.properties level-name.\n5. For extra worlds, use a compatible world manager and its official import instructions.\n6. Restart, inspect logs, test spawns and protect regions.\n7. Keep a rollback backup.\n\nOneBlock needs a compatible world template or plugin.\nDynmap needs a supported running server and hosting/network access.\n'}
function propsPage(){return `${header('Config generator','Generate server.properties, preview MOTD colors and create simple generic YAML. No plugin-specific schemas are assumed.','SERVER CONFIGS')}<div class="toolbar"><span class="subtle">Target version</span>${versionSelect('props-version')}<span class="tag orange">Java Edition</span></div><div class="split"><section class="card"><h3>server.properties settings</h3><div class="form-grid mt"><div class="field full"><label for="p-motd">Server MOTD</label><input id="p-motd" data-prop="motd" maxlength="80" value="${escapeHTML(state.props.motd)}"></div><div class="field"><label for="p-maxPlayers">Max players</label><input id="p-maxPlayers" data-prop="maxPlayers" type="number" min="1" max="10000" value="${state.props.maxPlayers}"></div><div class="field"><label for="p-port">Server port</label><input id="p-port" data-prop="port" type="number" min="1" max="65535" value="${state.props.port}"></div><div class="field"><label for="p-difficulty">Difficulty</label><select id="p-difficulty" data-prop="difficulty">${['peaceful','easy','normal','hard'].map(x=>`<option ${state.props.difficulty===x?'selected':''}>${x}</option>`).join('')}</select></div><div class="field"><label for="p-gamemode">Gamemode</label><select id="p-gamemode" data-prop="gamemode">${['survival','creative','adventure','spectator'].map(x=>`<option ${state.props.gamemode===x?'selected':''}>${x}</option>`).join('')}</select></div><div class="field"><label for="p-spawnProtection">Spawn protection radius</label><input id="p-spawnProtection" data-prop="spawnProtection" type="number" min="0" max="10000" value="${state.props.spawnProtection}"></div><div class="field"><label for="p-viewDistance">View distance</label><input id="p-viewDistance" data-prop="viewDistance" type="number" min="2" max="32" value="${state.props.viewDistance}"></div><div class="field full"><div class="check-grid">${[['pvp','PVP enabled'],['onlineMode','Online authentication'],['allowFlight','Allow flight'],['whitelist','Whitelist'],['commandBlocks','Command blocks']].map(([key,label])=>`<label class="choice"><input data-prop="${key}" type="checkbox" ${state.props[key]?'checked':''}> ${label}</label>`).join('')}</div></div></div><div class="notice warn mt">Keep <strong>online-mode=true</strong> for ordinary public Java servers. Eaglercraft gateway authentication and forwarding require careful proxy-specific setup. Don't turn authentication off just to make a browser client connect.</div></section><div class="stack"><div class="code-panel"><div class="code-top"><span>server.properties</span><button id="props-copy" class="btn small">Copy</button></div><pre id="props-code"></pre></div><div class="actions"><button id="props-download" class="btn primary">↓ Download server.properties</button></div><div class="notice">This is a starter configuration. Hosting panels may manage certain settings automatically. Review each option before replacing a live server's file.</div></div></div><div class="section-head"><div><h2>MOTD color preview</h2><p>Supports legacy &amp; color codes and common bold/italic/underline formatting.</p></div></div><div class="grid two"><div class="card"><div class="field"><label for="motd-input">MOTD with &amp; codes</label><textarea id="motd-input">${escapeHTML(state.motd)}</textarea></div><div class="actions mt"><button id="motd-copy" class="btn">Copy MOTD</button><button id="motd-apply" class="btn primary">Use in server.properties</button></div></div><div class="card"><h3>Live preview</h3><div id="motd-preview" class="score-preview"></div><p class="mini">Colors vary by client and server. Some servers expect § codes rather than &amp; codes.</p></div></div><div class="section-head"><div><h2>Generic YAML builder</h2><p>For notes and simple key-value configs. It is <strong>not</strong> a universal plugin config generator.</p></div></div><div class="split"><div class="card"><div id="yaml-rows" class="stack"></div><div class="actions mt"><button id="yaml-add" class="btn small">+ Add setting</button><button id="yaml-download" class="btn primary">↓ Download YAML</button></div></div><div class="code-panel"><div class="code-top"><span>example.yml</span><button id="yaml-copy" class="btn small">Copy</button></div><pre id="yaml-code"></pre></div></div>`}
function makeProperties(){const p=state.props;const n=(k,min,max)=>Math.min(max,Math.max(min,Number(p[k])||min));const older=minorVersion()<=12;const difficulty=older?String(['peaceful','easy','normal','hard'].indexOf(p.difficulty)):p.difficulty;const gamemode=older?String(['survival','creative','adventure','spectator'].indexOf(p.gamemode)):p.gamemode;const motd=String(p.motd||'').replace(/[\r\n]/g,' ').replace(/\\/g,'\\\\').replace(/=/g,'\\=').replace(/:/g,'\\:');return [`# Zaverith starter server.properties`,`# Verify settings for your server version and host.`,`motd=${motd}`,`server-port=${n('port',1,65535)}`,`max-players=${n('maxPlayers',1,10000)}`,`difficulty=${difficulty}`,`gamemode=${gamemode}`,`pvp=${!!p.pvp}`,`online-mode=${!!p.onlineMode}`,`spawn-protection=${n('spawnProtection',0,10000)}`,`view-distance=${n('viewDistance',2,32)}`,`allow-flight=${!!p.allowFlight}`,`white-list=${!!p.whitelist}`,`enable-command-block=${!!p.commandBlocks}`,`level-name=world`,`enable-query=false`].join('\n')+'\n'}
function yamlValue(v){const s=String(v);if(/^(true|false|null|-?(?:\d+(?:\.\d+)?))$/i.test(s))return s.toLowerCase();return JSON.stringify(s)}
function makeYaml(){return '# Example only: replace keys with those required by your chosen plugin.\n'+state.yaml.map(r=>`${/^[a-zA-Z_][\w-]*$/.test(r.key)?r.key:JSON.stringify(r.key)}: ${yamlValue(r.value)}`).join('\n')+'\n'}
function renderYamlRows(){const out=$('#yaml-rows');if(!out)return;out.innerHTML=state.yaml.map((r,i)=>`<div class="form-grid"><div class="field"><label for="yaml-key-${i}">Key ${i+1}</label><input id="yaml-key-${i}" data-yaml="key" data-index="${i}" value="${escapeHTML(r.key)}" maxlength="80"></div><div class="field"><label for="yaml-value-${i}">Value ${i+1}</label><input id="yaml-value-${i}" data-yaml="value" data-index="${i}" value="${escapeHTML(r.value)}" maxlength="200"></div></div>`).join('');refreshConfig()}
function motdHTML(input){const colors={'0':'#000000','1':'#0000aa','2':'#00aa00','3':'#00aaaa','4':'#aa0000','5':'#aa00aa','6':'#ffaa00','7':'#aaaaaa','8':'#555555','9':'#5555ff','a':'#55ff55','b':'#55ffff','c':'#ff5555','d':'#ff55ff','e':'#ffff55','f':'#ffffff'};let style={color:'#ffffff',bold:false,italic:false,under:false};let out='',part='';function flush(){if(part){out+=`<span style="color:${style.color};font-weight:${style.bold?'800':'400'};font-style:${style.italic?'italic':'normal'};text-decoration:${style.under?'underline':'none'}">${escapeHTML(part)}</span>`;part=''}}for(let i=0;i<input.length;i++){if((input[i]==='&'||input[i]==='§')&&i+1<input.length){const c=input[i+1].toLowerCase();if(colors[c]){flush();style={color:colors[c],bold:false,italic:false,under:false};i++;continue}if('lonr'.includes(c)){flush();if(c==='l')style.bold=true;if(c==='o')style.italic=true;if(c==='n')style.under=true;if(c==='r')style={color:'#ffffff',bold:false,italic:false,under:false};i++;continue}}part+=input[i]}flush();return out||'<span style="color:#92a8aa">Type an MOTD to preview…</span>'}
function refreshConfig(){if($('#props-code'))$('#props-code').textContent=makeProperties();if($('#yaml-code'))$('#yaml-code').textContent=makeYaml();if($('#motd-preview'))$('#motd-preview').innerHTML=motdHTML(state.motd)}

/* Zaverith prelaunch workspace. No remote server control or payment processing. */
const Z_STORE_KEY='zaverith-workspace-v1';
const Z_TASKS=[
  'Choose a compatible server version and software',
  'Set up permissions and staff access',
  'Configure economy and shop pricing',
  'Review plugins and dependencies',
  'Back up worlds and configurations',
  'Test the server with trusted players'
];
const Z_WIDGETS=[
  {id:'overview',label:'Server overview'},
  {id:'checklist',label:'Launch checklist'},
  {id:'plugins',label:'Plugin notes'},
  {id:'backups',label:'Backups & recovery'},
  {id:'security',label:'Security & permissions'},
  {id:'links',label:'Quick tools'}
];
const Z_PRODUCTS=[
  {id:'economy',name:'Economy Starter Kit',cat:'Templates',price:'$4.99',desc:'Shop pricing sheets, currency balancing checklist, and economy setup planner.',includes:'CSV planning template · economy checklist · setup notes'},
  {id:'launch',name:'Server Launch Bundle',cat:'Guides',price:'$8.99',desc:'A guided launch plan for Minecraft Java community servers.',includes:'Launch checklist · staff planning · backups guide'},
  {id:'scoreboard',name:'Scoreboard Design Pack',cat:'Design',price:'$3.99',desc:'Layouts and styling references for server scoreboards and stat panels.',includes:'Display mockups · layout examples · customization guide'},
  {id:'branding',name:'Community Branding Kit',cat:'Design',price:'$5.99',desc:'Editable ideas for server announcements, community rules, and identity.',includes:'Announcement templates · style guide · starter copy'},
  {id:'worlds',name:'World Setup Blueprint',cat:'Guides',price:'$2.99',desc:'World import and OneBlock planning checklists with version warnings.',includes:'World planning sheet · backup guide · version checklist'},
  {id:'plugins',name:'Plugin Stack Planner',cat:'Templates',price:'$3.99',desc:'Plan dependencies and configuration tasks before installing plugins.',includes:'Plugin inventory · dependency checklist · compatibility worksheet'}
];
function zLoad(){
  try{
    const d=JSON.parse(localStorage.getItem(Z_STORE_KEY)||'{}');
    return {
      servers:Array.isArray(d.servers)?d.servers.filter(s=>s&&typeof s==='object').slice(0,40):[],
      active:typeof d.active==='string'?d.active:'',
      wishlist:Array.isArray(d.wishlist)?d.wishlist:[],
      widgets:Array.isArray(d.widgets)?d.widgets:Z_WIDGETS.map(w=>w.id)
    };
  }catch{return {servers:[],active:'',wishlist:[],widgets:Z_WIDGETS.map(w=>w.id)}}
}
const zState=zLoad();
let zMarketFilter='All';
function zSave(){try{localStorage.setItem(Z_STORE_KEY,JSON.stringify(zState))}catch{toast('Unable to save in this browser')}}
function zCurrent(){return zState.servers.find(s=>s.id===zState.active)||zState.servers[0]||null}
function zCountDone(s){return Z_TASKS.filter((_,i)=>Array.isArray(s.tasks)&&s.tasks.includes(i)).length}
function zServerCard(s){
  return `<article class="card z-server-card">
    <div class="z-card-top"><span class="z-server-glyph" aria-hidden="true">▦</span><span class="tag gray">Not connected</span></div>
    <h3>${escapeHTML(s.name)}</h3><p class="z-mono">${escapeHTML(s.address||'No address added')}</p>
    <div class="z-meta"><span>${escapeHTML(s.software||'Java')}</span><span>Java ${escapeHTML(s.version||'Not set')}</span></div>
    <div class="z-progress"><div style="width:${Math.round(zCountDone(s)/Z_TASKS.length*100)}%"></div></div>
    <div class="z-card-bottom"><span class="subtle">${zCountDone(s)}/${Z_TASKS.length} launch tasks</span><button type="button" class="btn small" data-z-open="${escapeHTML(s.id)}">Open dashboard →</button></div>
  </article>`;
}
function zOverview(){
  const total=zState.servers.length;
  const done=zState.servers.reduce((sum,s)=>sum+zCountDone(s),0);
  return `<section class="z-welcome">
    <div class="eyebrow">ZAVERITH / YOUR WORKSPACE</div>
    <h1>Everything your server needs.<br><em>One organized workspace.</em></h1>
    <p>Plan your Minecraft servers, organize tools, and prepare your community from one dashboard.</p>
    <div class="actions"><a href="#servers" class="btn primary">Manage my servers →</a><a href="#market" class="btn ghost">Explore marketplace</a></div>
    <div class="z-trustline">◈ Local workspace preview · No server connection or live statistics yet</div>
  </section>
  <div class="z-stat-grid">
    <div class="z-stat"><span>Saved servers</span><strong>${total}</strong><small>On this device</small></div>
    <div class="z-stat"><span>Launch tasks completed</span><strong>${done}</strong><small>Across saved servers</small></div>
    <div class="z-stat"><span>Favorite products</span><strong>${zState.wishlist.length}</strong><small>Wishlist only</small></div>
    <div class="z-stat"><span>Server connections</span><strong>0</strong><small>Integration not enabled</small></div>
  </div>
  <div class="section-head"><div><div class="section-caption">YOUR WORKSPACE</div><h2>My servers</h2><p>Manage multiple server profiles and track setup progress.</p></div><a href="#servers" class="btn small">View all servers →</a></div>
  ${total?`<div class="grid three">${zState.servers.slice(0,3).map(zServerCard).join('')}</div>`:`<div class="z-empty"><div class="z-empty-icon">▦</div><h3>No servers added yet</h3><p>Create your first server profile to start organizing versions, plugins, setup tasks and notes.</p><a href="#servers" class="btn primary">Create a server profile →</a></div>`}
  <div class="section-head"><div><div class="section-caption">YOUR TOOLBOX</div><h2>Build with Zaverith</h2><p>All your planning tools, grouped by purpose.</p></div></div>
  <div class="grid four">
    ${cardNav('wizard','◇','Setup wizard','Create a version-aware server checklist.')}
    ${cardNav('plugins','▧','Plugin library','Browse tools and compatibility notes.')}
    ${cardNav('economy','◈','Economy planner','Plan prices and export a CSV.')}
    ${cardNav('leaderboards','▥','Scoreboard builder','Design stats and export commands.')}
    ${cardNav('configs','⌘','Config generator','Create server.properties and YAML examples.')}
    ${cardNav('worlds','◉','Worlds & maps','Plan world imports and backups.')}
    ${cardNav('crafting','⊞','Crafting guide','Look up recipes by Java version.')}
    ${cardNav('market','✦','Marketplace preview','Explore upcoming digital toolkits.')}
  </div>
  <div class="z-bottom-note">Zaverith is an independent community toolkit. Tools are not automatically connected to Minecraft servers.</div>`;
}
function zServerForm(s){
  const edit=!!s;
  return `<form id="z-server-form" class="z-form">
    ${edit?`<input type="hidden" name="serverId" value="${escapeHTML(s.id)}">`:''}
    <div class="form-grid">
      <div class="field"><label for="z-name">Server name</label><input id="z-name" name="name" required maxlength="55" placeholder="My Survival SMP" value="${escapeHTML(s?.name||'')}"></div>
      <div class="field"><label for="z-address">Server address (optional)</label><input id="z-address" name="address" maxlength="140" placeholder="play.example.net" value="${escapeHTML(s?.address||'')}"></div>
      <div class="field"><label for="z-version">Java version</label><select id="z-version" name="version">${profiles.map(p=>`<option value="${p.id}" ${(s?.version||'1.12.2')===p.id?'selected':''}>${p.label}</option>`).join('')}</select></div>
      <div class="field"><label for="z-software">Server software</label><select id="z-software" name="software">${['Spigot','Paper','Purpur','Bukkit','Vanilla','Other'].map(v=>`<option value="${v}" ${(s?.software||'Spigot')===v?'selected':''}>${v}</option>`).join('')}</select></div>
      <div class="field"><label for="z-slots">Planned player slots</label><input id="z-slots" name="slots" type="number" min="1" max="100000" value="${Number(s?.slots)||20}"></div>
      <div class="field"><label for="z-plugins">Installed / planned plugins</label><input id="z-plugins" name="plugins" maxlength="500" placeholder="EssentialsX, Vault, LuckPerms" value="${escapeHTML(s?.plugins||'')}"></div>
    </div>
    <div class="field mt"><label for="z-notes">Notes</label><textarea id="z-notes" name="notes" maxlength="1600" placeholder="Goals, hosting provider, server rules, ideas...">${escapeHTML(s?.notes||'')}</textarea></div>
    <div class="actions"><button class="btn primary" type="submit">${edit?'Save server details':'Add server to workspace'} →</button></div>
  </form>`;
}
function zServersPage(){
  return `${header('My servers','Keep every Minecraft server organized in one place. Profiles are saved in this browser only.','SERVER WORKSPACE')}
  <div class="notice"><strong>Local planning dashboard:</strong> These profiles do not connect to your host or control live Minecraft servers. Real status, player counts and remote actions need a secure server integration.</div>
  <div class="z-section-actions"><span class="tag gray">${zState.servers.length} saved server${zState.servers.length===1?'':'s'}</span><button type="button" id="z-export" class="btn small">Export workspace JSON ↓</button></div>
  ${zState.servers.length?`<div class="grid three">${zState.servers.map(zServerCard).join('')}</div>`:`<div class="z-empty"><h3>Your server list is empty</h3><p>Add a real server profile below, or load an example to explore the dashboard.</p><button type="button" id="z-demo" class="btn small">Try a clearly labeled demo server</button></div>`}
  <details class="z-panel" id="z-add-panel" ${zState.servers.length?'':'open'}><summary>＋ Add a Minecraft server</summary>${zServerForm(null)}</details>
  <div class="z-bottom-note">You can export a JSON backup of your profiles. Browser storage is not synced across devices.</div>`;
}
function zDetailPage(){
  const s=zCurrent();
  if(!s)return `${header('Server dashboard','Choose or add a server to see its planning dashboard.','WORKSPACE')}<div class="z-empty"><h3>No server selected</h3><p>Create a server profile to customize widgets, notes and checklists.</p><a href="#servers" class="btn primary">Go to my servers →</a></div>`;
  const enabled=new Set(zState.widgets);
  const widgets=[];
  if(enabled.has('overview'))widgets.push(`<section class="card z-widget"><div class="z-widget-title"><h3>Server overview</h3><span class="tag gray">Manual</span></div><div class="z-info-grid"><div><small>Address</small><strong class="z-mono">${escapeHTML(s.address||'Not added')}</strong></div><div><small>Software</small><strong>${escapeHTML(s.software||'Not set')}</strong></div><div><small>Java version</small><strong>${escapeHTML(s.version||'Not set')}</strong></div><div><small>Planned slots</small><strong>${Number(s.slots)||20}</strong></div></div><p class="subtle">No live server telemetry is connected.</p></section>`);
  if(enabled.has('checklist'))widgets.push(`<section class="card z-widget"><div class="z-widget-title"><h3>Launch checklist</h3><span class="tag">${zCountDone(s)}/${Z_TASKS.length} complete</span></div><div class="z-progress"><div style="width:${Math.round(zCountDone(s)/Z_TASKS.length*100)}%"></div></div><div class="z-checks">${Z_TASKS.map((task,i)=>`<label><input type="checkbox" data-z-task="${i}" ${Array.isArray(s.tasks)&&s.tasks.includes(i)?'checked':''}><span>${escapeHTML(task)}</span></label>`).join('')}</div></section>`);
  if(enabled.has('plugins'))widgets.push(`<section class="card z-widget"><div class="z-widget-title"><h3>Plugin inventory</h3><span class="tag gray">Manual list</span></div><p>${s.plugins?escapeHTML(s.plugins):'No plugins listed yet. Add them in Edit server details.'}</p><a href="#plugins" class="z-text-link">Explore compatible plugins ↗</a></section>`);
  if(enabled.has('backups'))widgets.push(`<section class="card z-widget"><div class="z-widget-title"><h3>Backups & recovery</h3><span class="tag orange">Planning</span></div><p>Back up your world folders, plugin configs and server.properties before making changes.</p><a href="#worlds" class="z-text-link">Open world backup guide ↗</a></section>`);
  if(enabled.has('security'))widgets.push(`<section class="card z-widget"><div class="z-widget-title"><h3>Security & access</h3><span class="tag orange">Checklist</span></div><p>Review admin permissions, authentication, whitelisting and proxy configuration. Avoid sharing control-panel credentials.</p><a href="#wizard" class="z-text-link">Open setup wizard ↗</a></section>`);
  if(enabled.has('links'))widgets.push(`<section class="card z-widget"><div class="z-widget-title"><h3>Quick tools</h3><span class="tag cyan">Toolbox</span></div><div class="z-tool-links"><a href="#economy">◈ Economy</a><a href="#leaderboards">▥ Scoreboards</a><a href="#configs">⌘ Configs</a><a href="#plugins">▧ Plugins</a><a href="#crafting">⊞ Crafting</a><a href="#worlds">◉ Worlds</a></div></section>`);
  return `${header(escapeHTML(s.name),'Your server command center for planning, setup, and organized tools.','SERVER DASHBOARD')}
  <div class="notice"><strong>Not connected:</strong> Online status, player counts, TPS, CPU and remote controls are unavailable in this browser-only preview. No values shown here are live.</div>
  <div class="z-section-actions"><a href="#servers" class="btn small">← All servers</a><div class="z-actions-right"><button type="button" id="z-copy-address" class="btn small" ${s.address?'':'disabled'}>Copy address</button><button type="button" id="z-delete-server" class="btn small z-danger">Delete profile</button></div></div>
  <div class="z-stat-grid">
    <div class="z-stat"><span>Connection</span><strong class="z-status-text">Not connected</strong><small>No integration configured</small></div>
    <div class="z-stat"><span>Players online</span><strong>—</strong><small>Live data unavailable</small></div>
    <div class="z-stat"><span>Performance / TPS</span><strong>—</strong><small>Live data unavailable</small></div>
    <div class="z-stat"><span>Launch progress</span><strong>${Math.round(zCountDone(s)/Z_TASKS.length*100)}%</strong><small>Manual checklist</small></div>
  </div>
  <details class="z-panel"><summary>✎ Edit server details and notes</summary>${zServerForm(s)}</details>
  <details class="z-panel z-customize"><summary>⚙ Customize dashboard widgets</summary><p>Choose which sections appear below. Saved on this device.</p><div class="z-widget-toggles">${Z_WIDGETS.map(w=>`<label><input type="checkbox" data-z-widget="${w.id}" ${enabled.has(w.id)?'checked':''}>${w.label}</label>`).join('')}</div></details>
  <div class="z-dashboard-grid">${widgets.length?widgets.join(''):'<div class="z-empty"><p>All widgets are hidden. Open Customize dashboard widgets to bring them back.</p></div>'}</div>
  ${s.notes?`<section class="card z-notes"><h3>Server notes</h3><p>${escapeHTML(s.notes).replace(/\n/g,'<br>')}</p></section>`:''}
  <div class="z-bottom-note">Server profiles are stored locally in your browser. Deleting browser data can erase them; export a backup from My servers.</div>`;
}
function zMarketPage(){
  const list=Z_PRODUCTS.filter(p=>zMarketFilter==='All'||p.cat===zMarketFilter);
  return `${header('Marketplace','A first look at digital toolkits and resources planned for Zaverith.','COMING SOON')}
  <div class="z-market-hero"><div><span class="tag orange">PRE-LAUNCH CATALOG</span><h2>Made for server creators.</h2><p>Templates, design resources and setup guides built for Minecraft communities.</p></div><div class="z-market-symbol" aria-hidden="true">✦</div></div>
  <div class="notice warn"><strong>Store preview only:</strong> Prices are draft examples. Nothing is available to purchase yet, and no payments or orders are accepted. A secure checkout, product delivery, and policies must be set up before launch.</div>
  <div class="z-section-actions"><label for="z-market-filter">Browse category</label><select id="z-market-filter" class="search">${['All','Templates','Guides','Design'].map(c=>`<option ${zMarketFilter===c?'selected':''}>${c}</option>`).join('')}</select></div>
  <div class="grid three">${list.map(p=>`<article class="card z-product"><div class="z-product-icon" aria-hidden="true">${p.cat==='Design'?'◈':p.cat==='Guides'?'◇':'▦'}</div><div class="z-product-top"><span class="tag gray">${p.cat}</span><span class="tag orange">Coming soon</span></div><h3>${p.name}</h3><p>${p.desc}</p><p class="z-includes">${p.includes}</p><div class="z-product-bottom"><strong>${p.price} <small>draft</small></strong><button type="button" class="btn small" data-z-wish="${p.id}" aria-pressed="${zState.wishlist.includes(p.id)}">${zState.wishlist.includes(p.id)?'♥ Saved':'♡ Wishlist'}</button></div></article>`).join('')}</div>
  <section class="z-panel z-freebie"><h3>Try a free resource</h3><p>Download a basic server-launch checklist now. No account needed.</p><button type="button" id="z-store-sample" class="btn primary">Download free checklist ↓</button></section>
  <div class="z-bottom-note">Zaverith is independent and not endorsed by Mojang or Microsoft. Store plans will follow Minecraft usage guidelines and applicable payment rules.</div>`;
}
function zHandleChange(e){
  const t=e.target;
  if(t.id==='z-market-filter'){zMarketFilter=t.value;route();return true}
  if(t.matches('[data-z-task]')){
    const s=zCurrent();if(!s)return true;
    const n=Number(t.dataset.zTask);if(!Number.isInteger(n)||n<0||n>=Z_TASKS.length)return true;
    s.tasks=Array.isArray(s.tasks)?s.tasks:[];
    s.tasks=t.checked?[...new Set([...s.tasks,n])]:s.tasks.filter(v=>v!==n);
    zSave();route();return true;
  }
  if(t.matches('[data-z-widget]')){
    const key=t.dataset.zWidget;
    if(!Z_WIDGETS.some(w=>w.id===key))return true;
    zState.widgets=t.checked?[...new Set([...zState.widgets,key])]:zState.widgets.filter(v=>v!==key);
    zSave();route();return true;
  }
  return false;
}
function zHandleClick(e){
  const t=e.target.closest('button');if(!t)return false;
  if(t.hasAttribute('data-z-open')){
    const id=t.dataset.zOpen;if(!zState.servers.some(s=>s.id===id))return true;
    zState.active=id;zSave();if(location.hash==='#server')route();else location.hash='#server';return true;
  }
  if(t.hasAttribute('data-z-wish')){
    const id=t.dataset.zWish;if(!Z_PRODUCTS.some(p=>p.id===id))return true;
    zState.wishlist=zState.wishlist.includes(id)?zState.wishlist.filter(v=>v!==id):[...zState.wishlist,id];
    zSave();route();return true;
  }
  if(t.id==='z-demo'){
    const id='sample-'+Date.now();
    zState.servers.push({id,name:'Sample Survival (demo)',address:'',version:'1.12.2',software:'Spigot',slots:20,plugins:'EssentialsX, Vault, LuckPerms',notes:'Example profile only. This is not a connected Minecraft server.',tasks:[0]});
    zState.active=id;zSave();route();toast('Demo profile added');return true;
  }
  if(t.id==='z-export'){download('zaverith-workspace-backup.json',JSON.stringify({exportedAt:new Date().toISOString(),...zState},null,2),'application/json');return true}
  if(t.id==='z-copy-address'){const s=zCurrent();if(s?.address)copyText(s.address);return true}
  if(t.id==='z-delete-server'){
    const s=zCurrent();if(!s)return true;
    if(!confirm('Delete the saved profile for '+s.name+'? This cannot be undone.'))return true;
    zState.servers=zState.servers.filter(v=>v.id!==s.id);zState.active=zState.servers[0]?.id||'';zSave();location.hash='#servers';route();toast('Server profile deleted');return true;
  }
  if(t.id==='z-store-sample'){
    download('zaverith-free-server-checklist.txt','ZAVERITH - FREE SERVER LAUNCH CHECKLIST\n\n1. Choose your Minecraft Java version and server software.\n2. Verify every plugin supports your exact version.\n3. Set up permissions and authentication safely.\n4. Plan economy, shops and player progression.\n5. Back up worlds and configuration files.\n6. Test gameplay, commands and moderation.\n7. Invite trusted testers before public launch.\n\nZaverith is an independent planning toolkit.\n');return true;
  }
  return false;
}
function zHandleSubmit(e){
  if(e.target.id!=='z-server-form')return false;
  e.preventDefault();
  const form=e.target,fd=new FormData(form);
  const name=String(fd.get('name')||'').trim().slice(0,55);
  if(!name){toast('Enter a server name');return true}
  const id=String(fd.get('serverId')||'');
  const existing=zState.servers.find(s=>s.id===id);
  if(!existing&&zState.servers.length>=40){toast('Workspace limit: 40 server profiles');return true}
  const address=String(fd.get('address')||'').trim().slice(0,140);
  const version=String(fd.get('version')||'1.12.2');
  const software=String(fd.get('software')||'Spigot');
  const slots=Math.min(100000,Math.max(1,Number(fd.get('slots'))||20));
  const details={name,address,version,software,slots,plugins:String(fd.get('plugins')||'').trim().slice(0,500),notes:String(fd.get('notes')||'').trim().slice(0,1600)};
  if(existing){Object.assign(existing,details)}else{
    const newId='srv-'+Date.now()+'-'+Math.random().toString(36).slice(2,8);
    zState.servers.push({id:newId,...details,tasks:[]});zState.active=newId;
  }
  zSave();location.hash='#server';route();toast(existing?'Server profile updated':'Server profile created');return true;
}

const pages={home,servers:zServersPage,server:zDetailPage,market:zMarketPage,wizard,plugins:pluginsPage,economy:economyPage,leaderboards:boardPage,crafting:craftingPage,worlds:worldsPage,configs:propsPage};
function route(focusMain=false){let id=(location.hash||'#home').slice(1);if(!pages[id])id='home';$('#app').innerHTML=`<div class="page">${pages[id]()}</div>`;$('#breadcrumb-page').textContent=names[id];$$('#main-nav a').forEach(a=>{const on=a.dataset.route===id;a.classList.toggle('active',on);if(on)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current')});setNavOpen(false);window.scrollTo({top:0,behavior:'instant'});$('#page-announcer').textContent=names[id]+' page';if(focusMain)$('#app').focus({preventScroll:true});if(id==='wizard')refreshWizard();if(id==='plugins')refreshPlugins();if(id==='economy')refreshEconomy();if(id==='leaderboards')refreshBoard();if(id==='crafting')refreshRecipes();if(id==='configs'){renderYamlRows();refreshConfig()}}
function updateVersion(value){if(!profiles.some(p=>p.id===value))return;state.profile=value;save();const page=(location.hash||'#home').slice(1);if(['plugins','crafting','wizard','configs'].includes(page))route()}
function onChange(e){if(zHandleChange(e))return;const t=e.target;if(t.id==='wizard-version'||t.id==='plugin-version'||t.id==='recipe-version'||t.id==='props-version'){updateVersion(t.value);return}if(t.id==='wizard-server'){state.server=t.value;save();return}if(t.id==='wizard-eagler'||t.id==='plugin-eagler'){state.eagler=t.checked;save();if(t.id==='wizard-eagler')refreshWizard();else refreshPlugins();return}if(t.matches('[data-feature]')){const id=t.dataset.feature;state.features=t.checked?[...new Set([...state.features,id])]:state.features.filter(x=>x!==id);save();refreshWizard();return}if(t.id==='plugin-search'||t.id==='plugin-category'){refreshPlugins();return}if(t.id==='recipe-search'||t.id==='recipe-all'){refreshRecipes();return}if(t.matches('[data-econ]')){const row=state.economy[Number(t.dataset.index)];if(!row)return;row[t.dataset.econ]=t.dataset.econ==='item'?t.value:Number(t.value);save();refreshEconomySummary();return}if(t.id==='board-name'){state.boardName=t.value;save();refreshBoard();return}if(t.id==='board-stat'){state.boardStat=t.value;save();refreshBoard();return}if(t.matches('[data-prop]')){const key=t.dataset.prop;state.props[key]=t.type==='checkbox'?t.checked:t.type==='number'?Number(t.value):t.value;save();refreshConfig();return}if(t.id==='motd-input'){state.motd=t.value;save();refreshConfig();return}if(t.matches('[data-yaml]')){const row=state.yaml[Number(t.dataset.index)];if(!row)return;row[t.dataset.yaml]=t.value;save();refreshConfig();return}}
function onClick(e){if(zHandleClick(e))return;const t=e.target.closest('button');if(!t)return;switch(t.id){case 'menu-toggle':setNavOpen(!$('#sidebar').classList.contains('open'));break;case 'menu-close':setNavOpen(false);break;case 'theme-toggle':prefs.light=!prefs.light;applyPrefs();toast(prefs.light?'Light theme on':'Cozy dark theme on');break;case 'text-toggle':prefs.large=!prefs.large;applyPrefs();toast(prefs.large?'Larger text on':'Standard text size on');break;case 'contrast-toggle':prefs.contrast=!prefs.contrast;applyPrefs();toast(prefs.contrast?'High contrast on':'Standard contrast on');break;case 'motion-toggle':prefs.motion=!prefs.motion;applyPrefs();toast(prefs.motion?'Reduced motion on':'Standard motion on');break;case 'wizard-download':download('zaverith-plugin-checklist.txt',wizardText());break;case 'wizard-copy':copyText(wizardText());break;case 'economy-add':state.economy.push({item:'NEW_ITEM',buy:10,sell:2});save();refreshEconomy();break;case 'economy-export':download('zaverith-economy-prices.csv',economyCSV(),'text/csv');break;case 'board-download':download('zaverith-scoreboard-commands.txt',boardCommands());break;case 'board-copy':case 'board-code-copy':copyText(boardCommands());break;case 'world-download':download('zaverith-world-checklist.txt',worldText());break;case 'props-copy':copyText(makeProperties());break;case 'props-download':download('server.properties',makeProperties());break;case 'motd-copy':copyText(state.motd);break;case 'motd-apply':state.props.motd=state.motd;save();route();toast('MOTD applied to generator');break;case 'yaml-add':state.yaml.push({key:'new-key',value:'value'});save();renderYamlRows();break;case 'yaml-copy':copyText(makeYaml());break;case 'yaml-download':download('example.yml',makeYaml(),'application/yaml');break;default:if(t.hasAttribute('data-remove-econ')){state.economy.splice(Number(t.dataset.removeEcon),1);save();refreshEconomy()}}}
document.addEventListener('input',onChange);
document.addEventListener('change',onChange);
document.addEventListener('click',onClick);
document.addEventListener('submit',e=>zHandleSubmit(e));
$('#nav-backdrop').addEventListener('click',()=>setNavOpen(false));
document.addEventListener('keydown',event=>{
  if(event.key==='Tab' && $('#sidebar').classList.contains('open') && window.innerWidth<=780){
    const items=$$('#sidebar button, #sidebar a').filter(el=>!el.disabled);
    const first=items[0],last=items[items.length-1];
    if(event.shiftKey && document.activeElement===first){event.preventDefault();last.focus()}
    else if(!event.shiftKey && document.activeElement===last){event.preventDefault();first.focus()}
  }
  if(event.key==='Escape'){
    if($('#sidebar').classList.contains('open')){setNavOpen(false);$('#menu-toggle').focus()}
    const details=$('#comfort-menu');
    if(details.open){details.open=false;details.querySelector('summary').focus()}
  }
});
window.addEventListener('resize',()=>{if(window.innerWidth>780)setNavOpen(false)});
window.addEventListener('hashchange',()=>route(true));
route();