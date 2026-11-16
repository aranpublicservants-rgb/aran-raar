/* Source-grounded conversational assistance with optional local language generation. */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const state={lang:'en',cases:[],history:[],topics:new Set(),lastConcern:'',currentPlan:null,engine:null,enginePromise:null,inferencing:false,answerVersion:0,chosenDraft:null};
const bilingual=(en,fr)=>state.lang==='fr'?fr:en;
const elem=(tag,content,parent,className)=>{const x=document.createElement(tag);if(content!==null&&content!==undefined)x.textContent=content;if(className)x.className=className;if(parent)parent.appendChild(x);return x;};
const urlOk=v=>typeof v==='string'&&(/^(https:\/\/|\.{1,2}\/)/.test(v));
const sourceLink=(parent,label,url)=>{if(!urlOk(url))return;const x=elem('a',label,parent);x.href=url;if(url.startsWith('https://')){x.target='_blank';x.rel='noopener noreferrer'}return x};
const clean=x=>String(x||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const words=x=>clean(x).split(/[^\p{L}\p{N}]+/u).filter(x=>x.length>3).slice(0,35);
const labels={
race:['racism and racial discrimination','racisme et discrimination raciale'],
disability:['disability and accommodation','handicap et accommodement'],
religion:['religious belief and accommodation','croyances religieuses et accommodement'],
harassment:['harassment or violence','harcèlement ou violence'],
staffing:['staffing or promotion','dotation ou promotion'],
reprisal:['reprisals or retaliation','représailles'],
sex:['sex-based discrimination','discrimination fondée sur le sexe'],
family:['family-status responsibilities','responsabilités familiales'],
language:['official-language rights','droits linguistiques']
};
const triggers={
race:/racis|racial|black|noir|indigenous|autochton|racis[eé]|ethnic|couleur|microaggress|antiblack|anti.black|race|discriminat.*origin/i,
disability:/disab|handicap|accommod|accommodement|adaptation|medical|m[eé]dic|health|sant[eé]|adhd|autis|ptsd|telework|t[eé]l[eé]travail|limitation|accessib/i,
religion:/relig|faith|belief|croyance|sinc[eè]re|hijab|turban|sikh|prayer|pri[eè]re|musulman|muslim|ramadan|sabbath|shabbat|kosher|halal/i,
harassment:/harass|harc[eè]l|bully|intimid|hostile|threat|menac|violence|humiliat|abusive|abusif/i,
staffing:/staff|dotation|promot|promotion|appoint|nomination|hiring|embauch|selection|s[eé]lection|concours|poste|non.advertised|non.annonc/i,
reprisal:/reprisal|retaliat|repr[eé]saill|punish|punition|whistle|divulg|signalement|retorsion/i,
sex:/sexism|sexist|sexisme|pregnan|grossesse|maternit|gender discrimination|discriminat.*sex|sexual harass/i,
family:/childcare|caregiv|parent|family status|situation de famille|familial|garde d.enfant|aidant/i,
language:/official language|langue officielle|bilingu|linguist|francophon|anglophon|langue de travail/i
};
const routes={
rights:{label:['Human-rights complaint','Plainte en droits de la personne'],
body:['The Canadian Human Rights Commission receives complaints involving prohibited grounds. A complaint is normally made within 12 months of the incident, subject to exceptions. The Commission screens complaints; the Canadian Human Rights Tribunal decides referred cases.',
'La Commission canadienne des droits de la personne reçoit les plaintes liées aux motifs interdits. Le délai habituel est de 12 mois après les faits, sous réserve d’exceptions. La Commission examine les plaintes; le Tribunal se prononce sur les causes renvoyées.'],url:'https://www.chrc-ccdp.gc.ca/find-help/file-discrimination-complaint'},
accommodation:{label:['Individual accommodation process','Processus d’accommodement individuel'],
body:['Explain the barrier and practical adjustments sought. Ask for an individualized assessment and written response. Medical information should be limited to what is necessary. Religious practices or beliefs may also require accommodation up to undue hardship.',
'Décrivez l’obstacle et les mesures recherchées. Demandez une évaluation individuelle et une réponse écrite. Les renseignements médicaux devraient être limités au nécessaire. Les croyances ou pratiques religieuses peuvent aussi nécessiter un accommodement jusqu’à la contrainte excessive.'],
url:'https://www.canada.ca/en/government/publicservice/wellness-inclusion-diversity-public-service/diversity-inclusion-public-service/working-government-canada-duty-accommodate-right-non-discrimination/duty-accommodate-general-process-managers.html'},
staffing:{label:['Staffing complaint, where eligible','Plainte de dotation, si admissible'],
body:['Some internal federal appointments and related decisions may be challenged at the FPSLREB. A qualifying staffing complaint generally must be filed within 15 calendar days of the relevant notice; processes and deadlines vary for other staffing situations.',
'Certaines nominations internes fédérales peuvent être contestées devant la CRTEFP. Une plainte admissible est généralement déposée dans les 15 jours civils suivant l’avis pertinent; d’autres situations ont des règles différentes.'],
url:'https://www.fpslreb-crtespf.gc.ca/en/resources/guides/staffing-complaints-guide.html'},
grievance:{label:['Grievance or union advice','Grief ou conseils syndicaux'],
body:['A grievance may address workplace decisions, discipline, accommodation or collective-agreement provisions. Ask your bargaining agent or qualified adviser which procedure and deadline applies to you.',
'Un grief peut porter sur une décision de travail, la discipline, l’accommodement ou la convention collective. Demandez à une personne syndicale ou compétente quelle procédure et quel délai s’appliquent à votre situation.'],
url:'https://www.fpslreb-crtespf.gc.ca/en/resources/faq.html'},
harassment:{label:['Harassment and violence process','Processus de harcèlement et violence'],
body:['Your employer may have obligations to respond to, prevent and investigate workplace harassment or violence. The process is different from a human-rights damages complaint, and each mechanism has its own purpose.',
'L’employeur peut avoir des obligations de réaction, de prévention et d’enquête en matière de harcèlement ou de violence au travail. Ce processus diffère d’une plainte en droits de la personne demandant une indemnité.'],
url:'https://www.canada.ca/en/employment-social-development/programs/workplace-health-safety/harassment-violence-prevention.html'},
reprisal:{label:['Disclosure and reprisal protections','Divulgation et protection contre les représailles'],
body:['A protected disclosure of wrongdoing may engage the Public Sector Integrity Commissioner or the organization’s designated senior officer. Ordinary workplace retaliation and a disclosure reprisal are not necessarily the same legal route.',
'Une divulgation protégée d’actes répréhensibles peut relever du Commissaire à l’intégrité ou de l’agent supérieur désigné. Les représailles au travail et celles liées à une divulgation ne suivent pas nécessairement le même recours.'],
url:'https://www.psic-ispc.gc.ca/en'},
language:{label:['Official-languages complaint','Plainte relative aux langues officielles'],
body:['Language-of-work rights and linguistic designations may fall under the Official Languages Act. The Commissioner can investigate; staffing decisions may also have separate mechanisms.',
'Les droits liés à la langue de travail et les exigences linguistiques peuvent relever de la Loi sur les langues officielles. Le commissaire peut enquêter; certaines décisions de dotation ont aussi des recours distincts.'],
url:'https://www.clo-ocol.gc.ca/en'},
informal:{label:['Informal assistance or neutral support','Soutien informel ou neutre'],
body:['You can explore an informal conflict management service, a neutral ombuds office where available, or a representative you trust. These discussions do not automatically pause filing deadlines.',
'Vous pouvez consulter un service de gestion informelle des conflits, un bureau de l’ombuds lorsqu’il existe ou une personne de confiance. Ces discussions ne suspendent pas automatiquement les délais.'],
url:'https://www.canada.ca/en/government/publicservice/wellness-inclusion-diversity-public-service/harassment-violence/informal-conflict-management-system-services/contact-icms-office.html'}
};
function identify(text){
 const s=clean(text),found=[];
 for(const [key,rx] of Object.entries(triggers))if(rx.test(s))found.push(key);
 return found;
}
function chosenRoutes(topics){
 const ts=new Set(topics),out=[];
 if(ts.has('disability')||ts.has('religion')||ts.has('family'))out.push('accommodation');
 if(ts.has('staffing'))out.push('staffing');
 if(ts.has('harassment'))out.push('harassment');
 if(ts.has('reprisal'))out.push('reprisal');
 if(ts.has('language'))out.push('language');
 if(['race','disability','religion','sex','family','harassment','reprisal'].some(k=>ts.has(k)))out.push('rights');
 out.push('grievance','informal');return [...new Set(out)].slice(0,6);
}
function createGuidance(topics){
 const ts=new Set(topics);
 const steps=[
 bilingual('Keep a dated record of what happened, the decisions made, any witnesses, and the impact on you. Separate what you observed from what you suspect.','Conservez une chronologie des faits, décisions, témoins et conséquences. Distinguez ce que vous avez constaté de ce que vous soupçonnez.'),
 bilingual('Save relevant notices, emails or policies using permitted channels. Protect confidential and third-party information.','Conservez les avis, courriels ou politiques pertinents par des moyens autorisés, tout en protégeant les renseignements confidentiels et ceux de tiers.'),
 bilingual('Check the relevant filing deadline before relying on informal discussions.','Vérifiez les délais de dépôt avant de vous fier aux discussions informelles.')
 ];
 if(ts.has('race'))steps.unshift(bilingual('If you suspect a pattern of racial bias, note the specific decisions and comparators as well as any reliable organizational data. A pattern deserves examination, but general statistics alone may not prove an individual case.','Si vous soupçonnez un schéma de racisme, notez les décisions et les comparaisons pertinentes ainsi que les données fiables. Les tendances méritent un examen, mais les statistiques générales ne prouvent pas nécessairement un cas individuel.'));
 if(ts.has('disability'))steps.unshift(bilingual('For accommodation, describe the workplace barrier and the functional change you need; request a written, individualized assessment without sharing unnecessary diagnostic details.','Pour l’accommodement, décrivez l’obstacle et le changement fonctionnel nécessaire; demandez une évaluation individualisée écrite sans divulguer inutilement le diagnostic.'));
 if(ts.has('religion'))steps.unshift(bilingual('Explain the workplace requirement that conflicts with your sincerely held belief or practice and request an individualized assessment.','Expliquez l’exigence professionnelle qui entre en conflit avec votre croyance ou pratique sincère et demandez une évaluation individualisée.'));
 if(ts.has('staffing'))steps.unshift(bilingual('Find the actual staffing notice and confirm whether this is an internal or external appointment. Short complaint periods may begin with the notice.','Retrouvez l’avis de dotation et vérifiez si la nomination est interne ou externe. Un court délai peut commencer à la date de l’avis.'));
 if(ts.has('reprisal'))steps.unshift(bilingual('Document the complaint or disclosure, who knew about it, and the timing of later decisions; chronology is important but does not by itself prove a causal connection.','Notez la plainte ou divulgation, les personnes qui la connaissaient et la chronologie des décisions; la succession des événements ne prouve pas à elle seule un lien causal.'));
 return {steps,keys:chosenRoutes(topics)};
}
function supportText(topics){
 const ts=new Set(topics);
 let opening=bilingual('Thank you for telling me. You deserve to have your concern taken seriously, and you do not need to decide everything at once.','Merci de m’en parler. Votre préoccupation mérite d’être prise au sérieux et vous n’avez pas à tout décider immédiatement.');
 if(ts.has('race'))opening=bilingual('What you describe raises a concern about racism. You deserve to be heard without having to prove your experience in this conversation. We can look at what happened, the possible patterns, and the ways to address them.','Votre récit soulève une préoccupation liée au racisme. Vous méritez d’être écouté sans devoir prouver votre vécu dans cette conversation. Nous pouvons examiner les faits, les tendances possibles et les recours.');
 else if(ts.has('disability'))opening=bilingual('It can be exhausting to explain an accommodation need and feel unheard. Your concern deserves an individualized, respectful assessment. We can identify what was requested and how the employer responded.','Il peut être éprouvant d’expliquer un besoin d’accommodement sans se sentir entendu. Votre situation mérite une évaluation individuelle et respectueuse. Nous pouvons examiner la demande et la réponse de l’employeur.');
 else if(ts.has('religion'))opening=bilingual('Your religious belief or practice deserves a respectful, individualized discussion rather than an assumption that it is inconvenient. We can explore how the workplace requirement affects you and what was considered.','Votre croyance ou pratique religieuse mérite une discussion respectueuse et individualisée, plutôt que des présomptions. Nous pouvons examiner les effets de l’exigence de travail et les solutions envisagées.');
 else if(ts.has('harassment'))opening=bilingual('Being concerned about harassment can make work feel uncertain or unsafe. I take what you described seriously. We can identify what is happening and the support or processes that may help.','Le harcèlement peut rendre le milieu de travail incertain ou insécurisant. Je prends votre préoccupation au sérieux. Examinons les faits et les soutiens ou recours possibles.');
 else if(ts.has('reprisal'))opening=bilingual('Concern about retaliation can make it harder to speak up. We can examine what happened and ways to protect your options without rushing you into a complaint.','La crainte de représailles peut rendre la prise de parole difficile. Nous pouvons examiner les faits et préserver vos options sans précipiter une plainte.');
 const action=ts.has('staffing')?bilingual('The staffing notice and its date may be particularly important.','L’avis de dotation et sa date pourraient être particulièrement importants.'):
 ts.has('disability')?bilingual('A written record of your requested adjustment and the employer’s response may help.','Une trace écrite de la mesure demandée et de la réponse de l’employeur peut aider.'):
 bilingual('A short chronology and any written decisions are useful places to start.','Une courte chronologie et toute décision écrite constituent de bons points de départ.');
 const question=ts.has('disability')?bilingual('What adjustment did you ask for, and was a reason given for the response?','Quel accommodement avez-vous demandé et vous a-t-on expliqué la réponse?'):
 ts.has('staffing')?bilingual('Was this an internal staffing process, and when did you receive the notice?','S’agissait-il d’un processus interne et quand avez-vous reçu l’avis?'):
 ts.has('harassment')?bilingual('Is this still happening, and what would help you feel safer right now?','La situation se poursuit-elle et qu’est-ce qui vous aiderait à vous sentir en sécurité?'):
 ts.has('reprisal')?bilingual('What happened after you raised the concern or made the disclosure?','Que s’est-il passé après que vous avez soulevé la préoccupation ou fait la divulgation?'):
 bilingual('What happened most recently, and what would you most like to change?','Que s’est-il passé récemment et qu’aimeriez-vous surtout voir changer?');
 return opening+'\n\n'+action+' '+bilingual('I can help you look at possible steps and decisions below; that does not require assuming a legal violation has already been established.','Je peux vous aider à examiner les démarches et les décisions ci-dessous, sans présumer qu’une violation juridique a déjà été établie.')+'\n\n'+question;
}
function entry(role,text){
 const log=$('conversation-log'),outer=elem('div',null,log,'turn '+role);
 elem('div',role==='user'?bilingual('You','Vous'):bilingual('Recourse Assistant','Assistant aux recours'),outer,'turn-label');
 const content=elem('p',text,outer,'answer-text');log.scrollTop=log.scrollHeight;
 return content;
}
function renderGuidance(){
 const root=$('route-results');root.replaceChildren();
 if(!state.currentPlan){elem('p',bilingual('As we talk, useful next steps and official references will appear here.','Au fil de notre conversation, les étapes utiles et les sources officielles apparaîtront ici.'),root,'small-note');return}
 const g=state.currentPlan;
 const caution=elem('div',null,root,'route-card caution');
 elem('h3',bilingual('First: protect your options','D’abord : préserver vos recours'),caution);
 elem('p',bilingual('Informal conversations do not automatically pause legal deadlines.','Les discussions informelles ne suspendent pas automatiquement les délais légaux.'),caution);
 const steps=elem('div',null,root,'route-card');elem('h3',bilingual('What you can do now','Ce que vous pouvez faire maintenant'),steps);
 const list=elem('ol',null,steps);g.steps.slice(0,4).forEach(x=>elem('li',x,list));
 for(const key of g.keys.slice(0,4)){const r=routes[key];if(!r)continue;const d=elem('div',null,root,'route-card');
 elem('h3',r.label[state.lang==='fr'?1:0],d);
 elem('p',r.body[state.lang==='fr'?1:0],d);
 sourceLink(d,bilingual('Official information','Source officielle'),r.url);
 }
}
function scoreCase(c,terms,queryWords){
 const grounds=c.grounds||[],issues=c.issues||[];let score=0;
 const groundsMap={race:'race',disability:'disability',religion:'religion',sex:'sex',family:'family',reprisal:'retaliation'};
 const issuesMap={race:['race','group'],disability:['accommodation','telework'],religion:['accommodation'],harassment:['harassment','investigation'],staffing:['staffinternal','staffexternal'],reprisal:['reprisal'],language:['language']};
 for(const key of terms){if(grounds.includes(groundsMap[key]))score+=16;for(const ix of issuesMap[key]||[])if(issues.includes(ix))score+=5}
 if(c.scope==='Federal public service')score+=7;else if(c.scope==='Not an employment dispute')score-=10;
 const blob=clean([c.title,c.citation,c.what,c.outcome,(c.issues||[]).join(' ')].join(' '));
 queryWords.forEach(x=>{if(blob.includes(x))score+=2});
 return score;
}
function related(){
 const terms=[...state.topics],qwords=words(state.lastConcern).slice(0,12);
 let candidates=state.cases.map(c=>({case:c,score:scoreCase(c,terms,qwords)})).sort((a,b)=>b.score-a.score);
 if(terms.length){const narrow=candidates.filter(x=>x.score>=10);if(narrow.length>=2)candidates=narrow}
 const chosen=[],seen=new Set();
 for(const status of ['allowed','dismissed']){const item=candidates.find(x=>x.case.status===status&&!seen.has(x.case.id));if(item){chosen.push(item.case);seen.add(item.case.id)}}
 for(const x of candidates){if(chosen.length>=3)break;if(!seen.has(x.case.id)){chosen.push(x.case);seen.add(x.case.id)}}
 return chosen;
}
function renderCases(){
 const root=$('related-cases');root.replaceChildren();
 if(!state.cases.length){elem('p',bilingual('Decisions are available in the full library.','Les décisions sont disponibles dans la bibliothèque complète.'),root,'small-note');return}
 for(const c of related()){
 const d=elem('article',null,root,'case-card');
 elem('h3',c.title,d);
 elem('p',[c.citation,c.body].filter(Boolean).join(' · '),d,'meta');
 elem('p',(state.lang==='fr'&&c.what_fr)||c.what,d);
 const det=elem('details',null,d);elem('summary',bilingual('How the decision was reached','Comment la décision a été prise'),det);
 elem('p',(state.lang==='fr'&&c.factors_fr)||c.factors||'',det);
 elem('p',(state.lang==='fr'&&c.outcome_fr)||c.outcome||'',det);
 if(c.finding==='not-separately-classified')elem('p',bilingual('The specific discrimination finding has not been independently classified.','La conclusion sur la discrimination n’a pas été classifiée indépendamment.'),det,'meta');
 if(c.sourceType==='secondary-summary'||c.sourceType==='representative-statement')elem('p',bilingual('Source is a published summary, not independently verified full reasons.','La source est un résumé publié, non une décision intégrale vérifiée.'),det,'meta');
 sourceLink(d,bilingual('Read the source','Lire la source'),c.url);
 }
}
async function loadCases(){
 try{const response=await fetch('../data/cases.json',{credentials:'omit'});if(!response.ok)throw Error('unavailable');const data=await response.json();state.cases=(data.cases||[]).filter(c=>c&&c.id&&c.title&&c.citation&&c.url&&c.what)}
 catch(e){state.cases=[]}
 renderCases();
}
const critical=/suicid|kill myself|harm myself|end my life|me tuer|me suicid|en finir avec ma vie|immediate physical danger|danger immediat/i;
function emergency(text){
 if(!critical.test(text))return false;
 const reply=bilingual('If anyone is in immediate danger, call 911. In Canada, call or text 988 for suicide crisis support. You deserve immediate support from a real person.','En cas de danger immédiat, composez le 911. Au Canada, appelez ou textez le 988 pour obtenir du soutien en situation de crise suicidaire. Vous méritez l’aide immédiate d’une personne réelle.');
 entry('assistant',reply);$('assistant-state').textContent='';return true;
}
function handle(message,selected){
 const input=String(message||'').trim().slice(0,1600);if(!input)return;
 entry('user',input);state.history.push({role:'user',content:input});state.lastConcern=input;
 const found=identify(input);if(selected&&!found.includes(selected))found.push(selected);
 for(const x of found)state.topics.add(x);
 if(emergency(input))return;
 const topicList=[...state.topics];
 state.currentPlan=createGuidance(topicList);
 const baseline=supportText(topicList);
 const answer=entry('assistant',baseline);state.history.push({role:'assistant',content:baseline});
 renderGuidance();renderCases();
 const version=++state.answerVersion;
 startAI(input,baseline,answer,version);
}
function showStatus(msg){$('assistant-state').textContent=msg}
function promptFor(message){
 const g=state.currentPlan||createGuidance([...state.topics]);
 const relevant=related().slice(0,3).map(c=>({citation:c.citation,case:c.title,grounds:c.grounds,issues:c.issues,what:state.lang==='fr'?c.what_fr:c.what,factors:state.lang==='fr'?c.factors_fr:c.factors,outcome:state.lang==='fr'?c.outcome_fr:c.outcome,source:c.url}));
 const refs=g.keys.slice(0,5).map(key=>({route:routes[key].label[state.lang==='fr'?1:0],description:routes[key].body[state.lang==='fr'?1:0],url:routes[key].url}));
 const prior=state.history.filter(x=>x.role==='user').slice(-4).map(x=>x.content);
 return JSON.stringify({currentConcern:message,previousUserMessages:prior,identifiedIssues:[...state.topics],practicalSteps:g.steps.slice(0,5),sourceLinkedRoutes:refs,relatedDecisions:relevant}).slice(0,10500);
}
const systemPrompt=(language)=>'You are an automated, equity-informed support companion for Canadian federal public servants experiencing possible racism, ableism, religious discrimination, retaliation, harassment or related barriers. Speak with the care, patience and experience of a supportive peer, but do not impersonate a human. Validate the concern without declaring discrimination proven. Consider how systemic barriers and power imbalances can affect someone. Avoid telling people to prove their feelings or minimize their experience. Be constructive, nonjudgmental, culturally sensitive and trauma-informed. Use the supplied grounded legal descriptions and cases ONLY. Do not invent case outcomes, rights, deadlines, contacts, legal tests or remedies. If a detail is missing, ask one useful question. No legal advice or predictions, no generic disclaimers repeated. Gently remind people to protect dates and avoid sharing confidential records. Answer in '+language+' in 110–190 words, 2–3 short paragraphs, with a single question at the end. Do not use headings, numbered lists or mention your model. Do not output reasoning tags or internal thinking. Avoid claiming you can connect to volunteers or send messages.';
async function ensureAI(){
 if(state.engine)return state.engine;
 if(state.enginePromise)return state.enginePromise;
 if(!navigator.gpu)return null;
 state.enginePromise=(async()=>{
   try{
     const lib=await import('https://esm.run/@mlc-ai/web-llm@0.2.88');
     if(!lib.CreateMLCEngine)throw Error('library unavailable');
     const engine=await lib.CreateMLCEngine('Qwen3-0.6B-q4f16_1-MLC',{initProgressCallback:()=>{}});
     state.engine=engine;return engine;
   }catch(e){return null}
 })();
 return state.enginePromise;
}
async function startAI(message,baseline,answer,version){
 if(state.inferencing)return;
 if(!navigator.gpu){showStatus(bilingual('Guidance and sources are ready.','Les conseils et les sources sont prêts.'));return}
 showStatus(bilingual('Considering your question…','Examen de votre question…'));
 const engine=await ensureAI();
 if(!engine){showStatus(bilingual('Guidance and sources are ready.','Les conseils et les sources sont prêts.'));return}
 if(version!==state.answerVersion){showStatus('');return}
 state.inferencing=true;
 try{
   const context=promptFor(message);
   const output=await engine.chat.completions.create({messages:[{role:'system',content:systemPrompt(state.lang==='fr'?'French':'English')},{role:'user',content:'/no_think\nUse this source-based context and respond to the person: '+context}],temperature:0.15,max_tokens:430});
   const raw=output?.choices?.[0]?.message?.content||'';
   const finalText=raw.includes('</think>')?raw.split('</think>').slice(-1)[0]:raw;
   const text=finalText.replace(/<think>[\s\S]*?<\/think>/gi,'').replace(/<think>[\s\S]*$/gi,'').replace(/<\/?think>/gi,'').trim();
   if(text&&version===state.answerVersion&&text.length>=35){
     answer.textContent=text;
     if(state.history.length&&state.history[state.history.length-1].role==='assistant')state.history[state.history.length-1].content=text;
   }
 }catch(e){}finally{state.inferencing=false;showStatus('')}
}
function messageText(audience){
 const u=state.history.filter(x=>x.role==='user').map(x=>x.content).filter(Boolean);
 const last=u.slice(-2).join(' ').slice(0,650);
 const enIntro=audience==='union'?'I would appreciate advice about the available workplace recourse options and any applicable deadlines.':
 audience==='manager'?'I would like to discuss a workplace concern and request a respectful review of what happened.':
 audience==='advisor'?'I would appreciate a confidential conversation about the workplace concern described below and the options available to me.':
 'I am reaching out because I am dealing with something at work and would appreciate your perspective and support.';
 const frIntro=audience==='union'?'Je souhaiterais obtenir des conseils sur les recours disponibles et les délais applicables.':
 audience==='manager'?'J’aimerais discuter d’une préoccupation au travail et demander un examen respectueux de la situation.':
 audience==='advisor'?'Je souhaiterais avoir une conversation confidentielle au sujet de la situation décrite ci-dessous et de mes options.':
 'Je vous écris parce que je vis une situation difficile au travail et j’apprécierais votre écoute et votre soutien.';
 if(state.lang==='fr')return 'Bonjour,\n\n'+frIntro+'\n\n'+(last?'Voici comment je décrirais ma préoccupation :\n'+last+'\n\n':'')+'Je souhaite comprendre les faits, les démarches possibles et la façon de traiter la situation de manière juste et respectueuse. Seriez-vous disponible pour en parler et convenir des prochaines étapes?\n\nMerci.';
 return 'Hello,\n\n'+enIntro+'\n\n'+(last?'Here is how I would describe my concern:\n'+last+'\n\n':'')+'I would like to understand what happened, what options I have and how the situation can be handled fairly and respectfully. Would you be open to discussing this and considering next steps?\n\nThank you.';
}
function prepareDraft(){
 $('draft-panel').hidden=false;
 $('draft-text').value=messageText($('audience').value);
 $('draft-status').textContent=bilingual('Review and edit before copying.','Relisez et modifiez avant de copier.');
 $('draft-text').focus();
}
async function copyDraft(){
 const text=$('draft-text').value.trim();if(!text)return;
 try{await navigator.clipboard.writeText(text);$('draft-status').textContent=bilingual('Copied. You choose who receives it.','Copié. Vous choisissez le destinataire.')}
 catch(e){$('draft-text').focus();$('draft-text').select();$('draft-status').textContent=bilingual('Select the text and copy it.','Sélectionnez le texte et copiez-le.')}
}
function language(to){
 state.lang=to;document.documentElement.lang=to;
 for(const x of document.querySelectorAll('[data-en][data-fr]'))x.textContent=x.getAttribute('data-'+to);
 $('switch-language').textContent=to==='en'?'Français':'English';$('switch-language').lang=to==='en'?'fr':'en';
 $('user-message').placeholder=$('user-message').getAttribute('data-placeholder-'+to);
 if(state.currentPlan)state.currentPlan=createGuidance([...state.topics]);
 renderGuidance();renderCases();
 if(!$('draft-panel').hidden)$('draft-text').value=messageText($('audience').value);
}
function initialize(){
 language(new URLSearchParams(location.search).get('lang')==='fr'?'fr':'en');
 entry('assistant',bilingual('I’m here to help you think through what’s happening at work. You can tell me as much or as little as feels comfortable. What is on your mind?','Je suis ici pour vous aider à réfléchir à ce qui se passe au travail. Vous pouvez m’en dire autant ou aussi peu que vous le souhaitez. Qu’est-ce qui vous préoccupe?'));
 renderGuidance();loadCases();
 $('message-form').addEventListener('submit',e=>{e.preventDefault();const val=$('user-message').value.trim();if(!val){$('user-message').focus();return}$('user-message').value='';handle(val,null)});
 for(const b of document.querySelectorAll('#suggestions button'))b.addEventListener('click',()=>handle(b.getAttribute('data-'+state.lang)||b.textContent,b.dataset.topic));
 $('switch-language').addEventListener('click',()=>language(state.lang==='en'?'fr':'en'));
 $('clear').addEventListener('click',()=>{
   state.history=[];state.topics=new Set();state.lastConcern='';state.currentPlan=null;state.answerVersion++;$('conversation-log').replaceChildren();
   $('draft-panel').hidden=true;$('draft-text').value='';showStatus('');
   language(state.lang);
   entry('assistant',bilingual('We can begin again. What would you like to talk about?','Nous pouvons recommencer. De quoi aimeriez-vous parler?'));
 });
 $('prepare-message').addEventListener('click',prepareDraft);
 $('audience').addEventListener('change',()=>{if(!$('draft-panel').hidden)prepareDraft()});
 $('copy-draft').addEventListener('click',copyDraft);
}
initialize();
})();