/* Independent design sandbox. No fetch, API, database or storage access. */
const original = {
  title: '旅遊絕交問卷', description: '出發前測試旅伴相容度',
  questions: ['可以排隊超過 30 分鐘嗎？', '願意早上 6 點起床嗎？', '可以接受臨時改行程嗎？'],
};
const state = { mode: 'b3', page: 'portal', size: 'desktop', query: '', nickname: '', answers: [], submitted: false, title: original.title, description: original.description, questions: [...original.questions], created: false };
const directions = {a: ['紙感編輯', 'PAPER & VOICE'], b: ['B 原版', 'COMMON GROUND'], b2: ['B2 鮮明五色', 'COMMON GROUND / REVISION 02'], b3: ['B3 活潑高彩度', 'COMMON GROUND / REVISION 03'], c: ['緊湊刊物', 'CLEAR PERSPECTIVES']};
const participants = [ {name:'Alice', answers:['yes','no','depends']}, {name:'Bob', answers:['no','yes','yes']}, {name:'Carol', answers:['depends','no','no']} ];
// Alice is from backend.md's sample; Bob / Carol are illustrative matrix data.
const paths = { check:'<path d="m5 12 4 4L19 6"/>', x:'<path d="m6 6 12 12M6 18 18 6"/>', arrow:'<path d="M4 12h16m-6-6 6 6-6 6"/>', left:'<path d="M20 12H4m6-6-6 6 6 6"/>', sliders:'<path d="M4 6h16M4 12h16M4 18h16M8 3v6m8 0v6m-6 0v6"/>', plus:'<path d="M12 5v14M5 12h14"/>', undo:'<path d="M4 10h10a6 6 0 0 1 0 12M4 10l5-5M4 10l5 5"/>', search:'<circle cx="10" cy="10" r="6"/><path d="m15 15 5 5"/>' };
const icon = name => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]}</svg>`;
const escapeHtml = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const activeSurvey = () => state.created ? {title: state.title, description: state.description, questions: state.questions} : original;
const btn = (label, action, primary = false, attrs = '') => `<button type="button" class="btn${primary?' primary':''}" data-action="${action}" ${attrs}>${label}</button>`;
function heading(kicker, title, description) { return `<div class="heading"><div class="eyebrow">${kicker}</div><h1>${escapeHtml(title)}</h1><p>${escapeHtml(description)}</p></div>`; }
function notice() { return '<p class="notice">目前以訪客使用，這次操作不會儲存為個人歷史。<button data-action="login">先登入</button></p>'; }
function portal(direction) {
  const survey=activeSurvey();
  const found = `${survey.title} ${survey.description}`.toLowerCase().includes(state.query.trim().toLowerCase());
  if(direction==='b2'||direction==='b3') return `<section class="home-intro" aria-labelledby="home-title-${direction}"><p class="eyebrow">理解，從表達開始</p><h1 id="home-title-${direction}">先說說<br>你的<span>想法。</span></h1><p class="home-description">建立一份表單，了解彼此的偏好與界線。</p><div class="home-cta">${btn(`新增表單 ${icon('arrow')}`,'create',true)}<button type="button" class="home-secondary" data-action="existing">開啟既有表單</button></div><p class="home-detail">不必登入，也能開始。</p></section>
  <section class="home-existing" aria-label="既有表單"><div class="section-head"><h2>既有表單</h2><span class="count">1 份</span></div><label class="field home-search"><span class="sr-only">搜尋表單名稱或說明</span><input type="search" data-field="query" placeholder="搜尋表單" value="${escapeHtml(state.query)}"></label><div class="survey-list">${surveyListing(found,direction)}</div></section>`;
  return `${heading('表單工作區', '表單入口', '建立新表單，或開啟既有表單查看填答與結果。')}
  <div class="portal-actions"><button data-action="create"><strong>新增表單</strong><span>設定標題與題目，開始收集大家的想法。</span><em>建立新表單 ${icon('arrow')}</em></button><button data-action="existing"><strong>既有表單</strong><span>找到已建立的表單，進入填寫或查看結果。</span><em>瀏覽表單列表 ${icon('arrow')}</em></button></div>
  <div class="section-head"><h2>既有表單</h2><span class="count">1 份</span></div>
  <label class="field"><span>搜尋表單名稱或說明</span><input type="search" data-field="query" placeholder="搜尋表單名稱或說明" value="${escapeHtml(state.query)}"></label>
  <div class="survey-list">${surveyListing(found)}</div>`;
}
function surveyListing(found,direction) {
  const survey=activeSurvey();
  if(direction==='b2'||direction==='b3') return found ? `<article class="survey-item compact-survey"><div><h3>${escapeHtml(survey.title)}</h3><p>${state.submitted?4:3} 人已填答</p></div><div class="action-row">${btn('開啟表單','fill')}${btn('查看結果','results')}</div></article>` : '<p class="empty-message" role="status">找不到符合的表單，試試其他關鍵字。</p>';
  return found ? `<article class="survey-item"><span class="count">建立於 2026/10/09 · 示範表單</span><h3>${escapeHtml(survey.title)}</h3><p>${escapeHtml(survey.description)}</p><p>${state.submitted?4:3} 人已填答</p><div class="action-row">${btn('開啟表單','fill',true)}${btn('查看結果','results')}</div></article>` : '<p class="empty-message" role="status">找不到符合的表單。試試其他名稱或關鍵字。</p>';
}
function create() {
  return `${heading('建立問卷', '建立問卷', '輸入標題、描述與 1–20 題問題。答案固定 Yes / No / Depends。')}${notice()}
  <form class="create-body" data-form="create"><label class="field"><span>標題</span><input required maxlength="200" data-field="title" value="${escapeHtml(state.title)}"></label><label class="field"><span>描述（可選）</span><textarea maxlength="1000" data-field="description">${escapeHtml(state.description)}</textarea></label>
  <div class="section-head"><h2>問題列表 <span class="count">${state.questions.length}/20</span></h2>${btn(`${icon('plus')} 新增問題`,'add',false,state.questions.length>=20?'disabled':'')}</div>
  ${state.questions.map((q,i)=>`<div class="question-field"><span>${String(i+1).padStart(2,'0')}</span><label><span class="sr-only">問題 ${i+1}</span><input required data-question="${i}" value="${escapeHtml(q)}" placeholder="輸入第 ${i+1} 題"><span class="count">固定答案值：Yes / No / Depends</span></label></div>`).join('')}
  <div class="submit-row"><p>示範建立 · 不會寫入資料庫</p><button class="btn primary" type="submit">建立問卷 ${icon('arrow')}</button></div><div class="local-alert" role="status"></div></form>`;
}
function fill() {
  const survey=activeSurvey(), q=survey.questions[state.answers.length], complete=!q;
  return `${heading('填寫表單',survey.title,survey.description)}${notice()}<div class="action-row">${btn('複製問卷連結','copy-fill')}${btn('複製結果連結','copy-results')}${btn('查看目前結果','results')}</div>
  <form class="fill-body" data-form="fill"><label class="field"><span>你的暱稱</span><input data-field="nickname" required maxlength="50" placeholder="例如：小明" value="${escapeHtml(state.nickname)}"></label>
  <div class="progress-line"><span>${complete?'全部完成':`第 ${state.answers.length+1} 題`} / ${survey.questions.length} 題</span><button type="button" data-action="undo" ${state.answers.length===0?'disabled':''}>${icon('undo')} 上一題</button></div>
  <div class="progress" role="progressbar" aria-label="作答進度" aria-valuemin="0" aria-valuemax="${survey.questions.length}" aria-valuenow="${state.answers.length}"><span style="width:${state.answers.length/survey.questions.length*100}%"></span></div>
  <div class="question-card${complete?' completion':''}" ${complete?'':'data-gesture="true" role="group" aria-label="目前問題"'}><div class="question-top"><span>BOUNDARIES</span><span>${String(Math.min(state.answers.length+1,survey.questions.length)).padStart(2,'0')} / ${String(survey.questions.length).padStart(2,'0')}</span></div><h2>${complete?'每一題，都有你的答案了':escapeHtml(q)}</h2>${complete?'<p>確認暱稱後，就可以提交。<br>想修改最後一題？點選「上一題」。</p>':`<div class="question-bottom"><span>${icon('left')} No</span><span>雙擊 · 看狀況</span><span>Yes ${icon('arrow')}</span></div>`}</div>
  ${complete?'':`<div class="answer-options"><button class="answer no" type="button" data-answer="no" aria-label="回答 No">${icon('x')} No</button><button class="answer depends" type="button" data-answer="depends" aria-label="回答 看狀況">${icon('sliders')} 看狀況</button><button class="answer yes" type="button" data-answer="yes" aria-label="回答 Yes">${icon('check')} Yes</button></div>`}
  <p class="hint">${complete?`已作答 ${state.answers.length}/${survey.questions.length} 題，答案尚未提交`:'左滑 No，右滑 Yes · 也可以點按鈕'}</p>
  <div class="submit-row"><p>示範填答 · 不會送出到正式產品</p><button type="submit" class="btn primary" ${!complete||!state.nickname.trim()?'disabled':''}>提交答案 ${icon('arrow')}</button></div><p class="error" role="alert"></p></form>`;
}
function answerMark(value) { const meta={yes:['check','Yes'],no:['x','No'],depends:['sliders','Depends']}; const [shape,label]=meta[value]; return `<span class="status ${value}">${icon(shape)} ${label}</span>`; }
function results() {
  const survey=activeSurvey(), people=[...participants];
  if(state.submitted) people.push({name:state.nickname,answers:state.answers});
  return `${heading('結果矩陣',survey.title,survey.description)}<div class="action-row">${btn('邀請朋友填寫','fill',true)}${btn('複製結果連結','copy-results')}${btn('複製問卷連結','copy-fill')}</div>
  <p class="count">共 ${people.length} 人填寫，${survey.questions.length} 題。<br>示範資料，非正式使用者紀錄。</p>
  <div class="matrix-wrap" tabindex="0" role="region" aria-label="答案矩陣，可橫向捲動"><table class="matrix" style="min-width:${200+people.length*100}px"><caption class="sr-only">${escapeHtml(survey.title)}：問題與參與者的答案</caption><thead><tr><th scope="col">問題 / 人員</th>${people.map(p=>`<th scope="col">${escapeHtml(p.name)}</th>`).join('')}</tr></thead><tbody>${survey.questions.map((q,i)=>`<tr><th scope="row"><q>Q${i+1}</q>${escapeHtml(q)}</th>${people.map(p=>`<td>${p.answers[i]?answerMark(p.answers[i]):'<span aria-label="尚無答案">—</span>'}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
  <p class="matrix-note">Yes、No、Depends 都是有效的表達。<br>正式產品重新整理即可取得最新資料；此處只顯示本頁示範。</p><div class="local-alert" role="status"></div>`;
}
const content = { portal, create, fill, results };
function render() {
  const previews=document.getElementById('previews');
  const keys=state.mode==='compare'?['a','b','c']:state.mode==='b-compare'?['b','b2']:state.mode==='b-revision'?['b2','b3']:[state.mode];
  previews.className=`previews ${keys.length>1?'compare':'single'} ${['b-compare','b-revision'].includes(state.mode)?'pair':''} ${['b2','b3'].includes(state.mode)?'revision':''} ${state.size==='desktop'?'':state.size}`;
  previews.innerHTML=keys.map(key=>`<article class="preview"><div class="preview-label"><strong>${['b','b2','b3'].includes(key)?'':`${key.toUpperCase()} · `}${directions[key][0]}</strong><span>${directions[key][1]}</span></div><div class="app ${key==='b3'?'b b2 b3':key==='b2'?'b b2':key}" data-direction="${key}" data-view="${state.page}"><header class="app-header"><button class="wordmark" data-action="portal" aria-label="Boundaries 表單入口">Boundaries</button><button class="account-link" data-action="login">${['b2','b3'].includes(key)?'登入':'訪客模式<span>登入並儲存紀錄</span>'}</button></header><div class="app-main">${state.page==='portal'?'':`<nav class="breadcrumb" aria-label="頁面位置"><button data-action="portal">表單入口</button><span>/ ${state.page==='create'?'建立問卷':state.page==='fill'?'填寫表單':'結果矩陣'}</span></nav>`}${content[state.page](key)}</div></div></article>`).join('');
  document.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===state.mode)));
  document.querySelectorAll('[data-page]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.page===state.page)));
  document.querySelectorAll('[data-size]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.size===state.size)));
  const params=new URLSearchParams({direction:state.mode,page:state.page,size:state.size});
  history.replaceState(null,'',`#${params}`);
}
function announce(text) { document.getElementById('announcement').textContent=text; }
function answer(value) { if(state.answers.length>=activeSurvey().questions.length)return; state.answers.push(value); state.submitted=false; render(); announce(`已回答 ${value}。${state.answers.length===activeSurvey().questions.length?'全部完成':`第 ${state.answers.length+1} 題：${activeSurvey().questions[state.answers.length]}`}`); document.querySelector('.answer-options button, .submit-row button')?.focus(); }
function showAlert(text) { document.querySelectorAll('.app-main').forEach(main=>{let target=main.querySelector('.local-alert');if(!target){target=document.createElement('p');target.className='local-alert';target.setAttribute('role','status');main.append(target);}target.textContent=text;}); }
document.addEventListener('click', async event=>{
  const button=event.target.closest('button');if(!button||button.disabled)return;
  if(button.dataset.mode){state.mode=button.dataset.mode;render();document.querySelector(`[data-mode="${state.mode}"]`).focus();return;}
  if(button.dataset.page){state.page=button.dataset.page;render();window.scrollTo(0,0);document.querySelector(`[data-page="${state.page}"]`).focus();return;}
  if(button.dataset.size){state.size=button.dataset.size;render();document.querySelector(`[data-size="${state.size}"]`).focus();return;}
  if(button.dataset.answer){answer(button.dataset.answer);return;}
  const action=button.dataset.action;
  if(content[action]){state.page=action;render();window.scrollTo(0,0);announce(`已開啟${action}`);return;}
  if(action==='undo'){state.answers.pop();state.submitted=false;render();announce('已回到上一題');return;}
  if(action==='add'&&state.questions.length<20){state.questions.push('');render();document.querySelector(`[data-question="${state.questions.length-1}"]`).focus();return;}
  if(action==='existing'){const main=button.closest('.app-main');main.querySelector('.section-head').scrollIntoView({block:'center'});main.querySelector('[data-field="query"]').focus();return;}
  if(action==='login'){showAlert('此原型不連接登入服務。正式產品支援 Google 登入，或以訪客繼續。');return;}
  if(action?.startsWith('copy-')){
    const url=new URL(location.href);url.hash=new URLSearchParams({direction:state.mode,page:action==='copy-fill'?'fill':'results',size:state.size}).toString();
    try{await navigator.clipboard.writeText(url.href);showAlert('已複製原型畫面連結（不是正式問卷連結；填答資料不會隨連結保存）。');}catch{showAlert('無法存取剪貼簿，請直接複製瀏覽器網址。');}
  }
});
document.addEventListener('input',event=>{
  const field=event.target.dataset.field,index=event.target.dataset.question;
  if(field)state[field]=event.target.value;
  if(index!==undefined)state.questions[Number(index)]=event.target.value;
  // Keep the same content across all directions without replacing focused inputs.
  const selector=field?`[data-field="${field}"]`:index!==undefined?`[data-question="${index}"]`:null;
  if(selector)document.querySelectorAll(selector).forEach(el=>{if(el!==event.target)el.value=event.target.value;});
  if(field==='nickname')document.querySelectorAll('[data-form="fill"] [type="submit"]').forEach(el=>el.disabled=state.answers.length!==activeSurvey().questions.length||!state.nickname.trim());
  if(field==='query'){const s=activeSurvey(),found=`${s.title} ${s.description}`.toLowerCase().includes(state.query.trim().toLowerCase());document.querySelectorAll('.survey-list').forEach(el=>el.innerHTML=surveyListing(found,el.closest('.app').dataset.direction));}
});
document.addEventListener('submit',event=>{
  event.preventDefault();const kind=event.target.dataset.form;
  if(kind==='create'){
    if(!state.title.trim()||state.questions.some(q=>!q.trim())){showAlert('標題與每個問題都要有內容。');return;}
    state.created=true;state.answers=[];state.submitted=false;state.page='fill';render();window.scrollTo(0,0);showAlert('示範建立成功。此表單只存在於本頁，重新整理即重設。');
  }
  if(kind==='fill'){
    if(!state.nickname.trim()||state.answers.length!==activeSurvey().questions.length)return;
    if(participants.some(p=>p.name===state.nickname.trim())){document.querySelectorAll('.error').forEach(el=>el.textContent='同一暱稱已經提交過這份問卷');return;}
    state.nickname=state.nickname.trim();state.submitted=true;state.page='results';render();window.scrollTo(0,0);announce('示範答案已加入結果矩陣，不會送出到正式產品。');
  }
});
let pointer=null,lastTap=0;
document.addEventListener('pointerdown',event=>{if(!event.target.closest('[data-gesture]')||!event.isPrimary||event.button!==0)return;pointer={id:event.pointerId,x:event.clientX,y:event.clientY,card:event.target.closest('[data-gesture]')};});
document.addEventListener('pointermove',event=>{if(!pointer||pointer.id!==event.pointerId)return;const dx=event.clientX-pointer.x,dy=event.clientY-pointer.y;if(Math.abs(dy)>12&&Math.abs(dy)>Math.abs(dx)){pointer=null;lastTap=0;return;}if(Math.abs(dx)>64&&Math.abs(dx)>Math.abs(dy)*1.2){pointer=null;lastTap=0;answer(dx>0?'yes':'no');}});
document.addEventListener('pointerup',event=>{if(!pointer||pointer.id!==event.pointerId)return;const moved=Math.hypot(event.clientX-pointer.x,event.clientY-pointer.y);pointer=null;if(moved<10){const now=Date.now();if(now-lastTap<350){lastTap=0;answer('depends');}else lastTap=now;}});
document.addEventListener('pointercancel',()=>{pointer=null;lastTap=0;});
const initial=new URLSearchParams(location.hash.slice(1));
if(['compare','b-compare','b-revision','a','b','b2','b3','c'].includes(initial.get('direction')))state.mode=initial.get('direction');
if(Object.hasOwn(content,initial.get('page')))state.page=initial.get('page');
if(['desktop','mobile','small'].includes(initial.get('size')))state.size=initial.get('size');
render();
