/* ARAN: private, grounded recourse guidance with optional on-device WebLLM.
   No user accounts, remote AI keys, analytics or saved personal chat histories. */
(function(){
'use strict';
var D=document, get=id=>D.getElementById(id);
var S={lang:'en',topic:'',last:'',terms:[],cases:[],show:6,plan:null,ai:null,aiReady:false,aiBusy:false};
var sources={
chrc:'https://www.chrc-ccdp.gc.ca/find-help/file-discrimination-complaint',
fps:'https://www.fpslreb-crtespf.gc.ca/en/resources/guides/staffing-complaints-guide.html',
board:'https://www.fpslreb-crtespf.gc.ca/en/resources/faq.html',
dta:'https://www.canada.ca/en/government/publicservice/wellness-inclusion-diversity-public-service/diversity-inclusion-public-service/working-government-canada-duty-accommodate-right-non-discrimination/duty-accommodate-general-process-managers.html',
medical:'https://www.canada.ca/en/government/publicservice/wellness-inclusion-diversity-public-service/diversity-inclusion-public-service/working-government-canada-duty-accommodate-right-non-discrimination/duty-accommodate-general-process-managers/make-informed-decision.html',
harassment:'https://www.canada.ca/en/employment-social-development/programs/workplace-health-safety/harassment-violence-prevention.html',
eap:'https://www.canada.ca/en/health-canada/services/environmental-workplace-health/occupational-health-safety/employee-assistance-services/employee-assistance-program.html',
icms:'https://www.canada.ca/en/government/publicservice/wellness-inclusion-diversity-public-service/harassment-violence/informal-conflict-management-system-services/contact-icms-office.html',
psic:'https://www.psic-ispc.gc.ca/en',
ol:'https://www.clo-ocol.gc.ca/en',
union:'../#union'};
var B=(en,fr)=>S.lang==='fr'?fr:en;
function node(tag,text,css,parent){var n=D.createElement(tag);if(text!==undefined)n.textContent=text;if(css)n.className=css;if(parent)parent.appendChild(n);return n}
function anchor(parent,text,url){if(!url||typeof url!=='string'||!(/^(https:\/\/|\.\.\/|#)/).test(url))return;var a=node('a',text,'',parent);a.href=url;if(url.indexOf('https://')===0){a.target='_blank';a.rel='noopener noreferrer'}return a}
function norm(x){return String(x||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()}
function tok(x){return norm(x).split(/[^\p{L}\p{N}]+/u).filter(y=>y.length>3).slice(0,45)}
var topicNames={
race:['Racism','Racisme'],disability:['Disability or accommodation','Handicap ou accommodement'],religion:['Religion or belief','Religion ou croyance'],
harassment:['Harassment','Harcèlement'],staffing:['Staffing','Dotation'],reprisal:['Reprisals','Représailles'],
sex:['Sex discrimination','Discrimination fondée sur le sexe'],family:['Family status','Situation familiale'],
language:['Official languages','Langues officielles'],union:['Grievances and unions','Griefs et syndicats'],safety:['Safety','Sécurité'],
cases:['Legal decisions','Décisions juridiques'],peer:['Peer support','Soutien entre pairs']};
var pattern={
race:/racis|racial|black|noir|indigenous|autochton|ethnic|couleur|race|microaggress|racializ|racis[eé]/i,
disability:/disabil|handicap|accommod|medical|medic|sant[eé]|health|ptsd|adhd|autis|telework|t[eé]l[eé]travail|dta|adaptation/i,
religion:/religi|faith|belief|croyance|hijab|turban|sikh|muslim|musulman|prayer|pri[eè]re|ramadan|shabbat|sabbath/i,
harassment:/harass|harcel|bully|intimid|threat|menac|hostile|violence|toxic|aggress/i,
staffing:/staff|hiring|appoint|promot|dotation|nomination|embauch|competition|concours|poste|non.advertised|sélection/i,
reprisal:/reprisal|retaliat|repressa|représa|whistle|divulg|signalement|punish|retorsion/i,
sex:/sexism|sexist|sex discrimination|pregnan|grossess|women|femme|maternit|sexual harassment/i,
family:/childcare|caregiv|parent|family status|famili|garde d.enfant|aidant/i,
language:/official language|bilingu|linguist|francophon|anglophon|langue officielle|langue de travail/i,
union:/union|syndic|bargaining|collective agreement|convention collective|griev|grief/i,
safety:/unsafe|danger|safety|securit|sécurité|imminent|physic|threat|menac/i,
cases:/case law|case like|cases|decisions|decisions like|jurisprud|precedent|decision|tribunal|court|causes/i,
peer:/peer|mentor|volunteer|benevol|bénévol|soutien entre pairs|someone to talk|talk to someone|personne a qui parler/i};
var defs={
informal:{
en:['Informal help and independent advice','An ICMS office, ombuds where available, trusted representative or employee network can help you understand your options. These services vary in confidentiality and cannot automatically stop legal deadlines.'],
fr:['Soutien informel et conseil indépendant','Un service de gestion informelle des conflits, un ombuds ou une personne de confiance peut vous aider à comprendre vos options. La confidentialité varie et ces démarches ne suspendent pas automatiquement les délais.'],
url:sources.icms},
union:{
en:['Grievance or collective-agreement route','A grievance may address employment decisions, accommodation, discipline or terms of work. The available process, representation, time limits and adjudication depend on your employer, collective agreement and status. Ask your bargaining agent or qualified adviser promptly.'],
fr:['Grief ou recours conventionnel','Un grief peut viser une décision d’emploi, l’accommodement, la discipline ou les conditions de travail. Le processus, les délais et la représentation dépendent de votre employeur, de votre statut et de la convention collective. Consultez rapidement une personne compétente.'],
url:sources.board},
humanrights:{
en:['Canadian Human Rights Commission','Where a protected ground may have contributed to an adverse decision or workplace treatment, a CHRC complaint may be possible. It is normally filed within 12 months of an incident, with exceptions in some circumstances, even if another process is underway. The Commission screens complaints; the Tribunal decides referred merits cases.'],
fr:['Commission canadienne des droits de la personne','Si un motif protégé a pu contribuer à une décision défavorable, une plainte à la CCDP peut être possible. Le délai habituel est de 12 mois, avec certaines exceptions, même si d’autres démarches ont lieu. La Commission examine les plaintes; le Tribunal statue sur le fond des affaires renvoyées.'],
url:sources.chrc},
staffing:{
en:['Eligible internal staffing complaint','Some internal appointments, lay-offs and revocations under the Public Service Employment Act can be challenged before the FPSLREB. An eligible complaint is generally due within 15 calendar days of the relevant notice. External processes and other employers may have different routes. Check the actual notice immediately.'],
fr:['Plainte admissible en dotation interne','Certaines nominations internes, mises en disponibilité ou révocations sous la Loi sur l’emploi dans la fonction publique peuvent être contestées à la CRTEFP. Le délai habituel est de 15 jours civils après l’avis pertinent. Les processus externes et autres employeurs ont des règles différentes. Vérifiez l’avis.'],
url:sources.fps},
accommodation:{
en:['Individual accommodation assessment','Explain the barrier and functional requirement, propose workable adjustments and ask for reasons in writing. Medical details should be limited to what is necessary and kept confidential. For religion, the employer must consider sincere beliefs or practices. Accommodation requires an individualized assessment, up to undue hardship.'],
fr:['Évaluation individuelle de l’accommodement','Décrivez l’obstacle et le besoin fonctionnel, suggérez des mesures possibles et demandez des motifs écrits. Les données médicales doivent être limitées et protégées. Pour la religion, les croyances et pratiques sincères doivent être prises en compte. L’analyse est individuelle, jusqu’à la contrainte excessive.'],
url:sources.dta},
harassment:{
en:['Harassment and violence prevention process','A workplace occurrence may engage duties to prevent, resolve and investigate harassment and violence. This is not automatically a human-rights damages procedure or a substitute for a grievance. Check who the employer’s designated recipient is and which legislative regime applies.'],
fr:['Prévention du harcèlement et de la violence','Un événement peut entraîner des obligations de prévention, de résolution et d’enquête. Il ne constitue pas automatiquement une demande d’indemnisation en droits de la personne ou un remplacement du grief. Vérifiez le destinataire désigné et les règles applicables.'],
url:sources.harassment},
integrity:{
en:['Wrongdoing disclosure and reprisal protection','Disclosures of wrongdoing under the Public Servants Disclosure Protection Act may involve the designated senior officer or the Public Sector Integrity Commissioner. Such reprisal procedures are not the same as a regular grievance or a human-rights complaint. Check the applicable protected activity and deadlines.'],
fr:['Divulgation d’actes répréhensibles et représailles','Selon la Loi sur la protection des fonctionnaires divulgateurs d’actes répréhensibles, l’agent supérieur désigné ou le Commissaire à l’intégrité peut être pertinent. Ces procédures diffèrent d’un grief ordinaire ou d’une plainte de droits de la personne. Vérifiez les protections et les délais.'],
url:sources.psic},
languages:{
en:['Official Languages Commissioner','Language-of-work rights, staffing profiles and official-language reprisals may fall under the Official Languages Act. The Commissioner investigates and may recommend corrective measures; this is not automatically a judicial remedy. Staffing matters can have distinct complaint procedures.'],
fr:['Commissaire aux langues officielles','La langue de travail, les profils linguistiques et les représailles peuvent relever de la Loi sur les langues officielles. Le commissaire enquête et peut recommander des mesures; cela ne constitue pas automatiquement une réparation judiciaire. La dotation peut relever d’autres recours.'],
url:sources.ol},
eap:{
en:['Confidential professional support','EAP can support employees coping with racism, discrimination, harassment or workplace stress. Many departments use Health Canada; others have their own provider. You may request someone with experience supporting a relevant cultural or equity community. EAP is not a formal recourse mechanism.'],
fr:['Soutien professionnel confidentiel','Le PAE peut aider les personnes vivant du racisme, de la discrimination, du harcèlement ou du stress. Plusieurs organisations utilisent Santé Canada, d’autres leur propre fournisseur. Vous pouvez demander une personne ayant une expérience culturelle pertinente. Le PAE n’est pas un recours officiel.'],
url:sources.eap}
};
function detect(text,chosen){
var out=new Set();Object.keys(pattern).forEach(key=>{if(pattern[key].test(norm(text)))out.add(key)});
if(chosen&&topicNames[chosen])out.add(chosen);
return out;
}
function planFor(issues){
issues=new Set(issues);
var keys=[...issues].filter(x=>topicNames[x]&&x!=='cases'&&x!=='peer');
var intro=keys.length?B('Your concern may relate to: ','Votre situation peut concerner : ')+keys.map(k=>topicNames[k][S.lang==='fr'?1:0]).join(', ')+'. '+B('These are possibilities, not findings that discrimination legally occurred.','Il s’agit de possibilités, non d’une conclusion juridique de discrimination.')
:B('You can ask about options without deciding first whether conduct meets a legal definition.','Vous pouvez explorer vos recours sans déterminer d’abord si la conduite répond à une définition juridique.');
var notice=B('Some complaint deadlines are short. An eligible federal internal staffing complaint generally has a 15-calendar-day period after the relevant notice; a CHRC complaint is normally filed within 12 months of an incident. Other grievances and employer processes have different rules. Informal conversations do not automatically stop deadlines.',
'Certains délais sont courts. Une plainte fédérale admissible en dotation interne est généralement limitée à 15 jours civils après l’avis pertinent; une plainte à la CCDP est normalement déposée dans les 12 mois suivant les faits. Les autres recours ont des délais distincts. Les échanges informels ne les suspendent pas automatiquement.');
var now=[
B('Write a dated, private chronology of decisions, comments, witnesses, impacts and your own responses. Distinguish facts, documents and interpretations.','Rédigez une chronologie privée et datée des décisions, commentaires, témoins, effets et réponses. Distinguez les faits, documents et interprétations.'),
B('Preserve relevant notices, job postings, accommodation requests and responses through permitted channels. Do not copy third-party personal information or restricted documents into personal accounts.','Conservez les avis, affichages, demandes d’accommodement et réponses par des moyens autorisés. Ne copiez pas de renseignements personnels de tiers ni de documents protégés dans des comptes privés.'),
B('Decide what you want changed: an accommodation, a safe workplace, an assessment of a staffing decision, policy improvement, compensation or other remedy.','Précisez le résultat recherché : accommodement, sécurité, examen d’une dotation, amélioration de politique, indemnité ou autre réparation.'),
B('Consider a trusted union representative or qualified adviser and ask about impartial ICMS or ombuds services. Confirm filing deadlines directly.','Communiquez avec une personne syndicale de confiance ou un conseiller compétent et renseignez-vous sur les services de gestion informelle ou d’ombuds. Confirmez directement les délais.')
];
if(issues.has('race'))now.unshift(B('Where relevant, compare the individual decision with consistent patterns: criteria applied, comparators, career data, survey findings and evidence connecting a pattern to the decision. General statistics alone may not establish an individual claim.','Examinez les critères appliqués, les comparaisons, les données de carrière et les sondages, ainsi que les preuves du lien avec la décision. Les statistiques générales peuvent ne pas suffire pour une plainte individuelle.'));
if(issues.has('disability'))now.unshift(B('For an accommodation issue, explain functional barriers and the requested change. Ask why information is needed, who will see it, and what alternatives were considered; avoid sending full medical records unnecessarily.','Pour un accommodement, décrivez les obstacles fonctionnels et les mesures souhaitées. Demandez pourquoi les renseignements sont nécessaires, qui y aura accès et quelles solutions ont été étudiées. Évitez d’envoyer tout votre dossier médical sans nécessité.'));
if(issues.has('religion'))now.unshift(B('Identify the sincerely held practice or belief and the workplace rule that conflicts with it, then ask for an individualized assessment.','Précisez la croyance ou pratique sincère et la règle de travail qui entre en conflit, puis demandez une évaluation individualisée.'));
if(issues.has('staffing'))now.unshift(B('Check the notice of appointment or proposed appointment and whether the process is internal, external, advertised or non-advertised. A short deadline may already be running.','Vérifiez l’avis de nomination ou de nomination proposée, et si le processus est interne, externe, annoncé ou non annoncé. Le délai pourrait déjà être commencé.'));
if(issues.has('reprisal'))now.unshift(B('Record the prior complaint or disclosure, who knew about it, and subsequent actions. Sequence matters, although timing by itself does not prove causation.','Notez la plainte ou divulgation antérieure, les personnes qui en avaient connaissance et les mesures subséquentes. Le temps écoulé est pertinent sans prouver à lui seul un lien causal.'));
var avoid=[
B('Do not assume informal talks, mediation, peer help or an ombuds automatically extend a legal filing deadline.','Ne présumez pas que des discussions, une médiation, des pairs ou l’ombuds prolongent un délai légal.'),
B('Do not share identifying names, personnel numbers, diagnoses or confidential files in an online search or chatbot.','Ne communiquez pas de noms, numéros d’employé, diagnostics ni documents confidentiels dans un outil en ligne.'),
B('Do not assume a case result, a survey pattern or an AI answer predicts the result in your situation.','Ne supposez pas qu’une décision, un sondage ou une réponse de l’IA prédit le résultat de votre situation.')
];
var routes=[];
if(issues.has('disability')||issues.has('religion')||issues.has('family'))routes.push('accommodation');
if(issues.has('staffing'))routes.push('staffing');
if(issues.has('harassment')||issues.has('safety'))routes.push('harassment');
if(issues.has('reprisal'))routes.push('integrity');
if(issues.has('language'))routes.push('languages');
if(['race','disability','religion','sex','family','harassment','reprisal'].some(k=>issues.has(k)))routes.push('humanrights');
routes.push('union','informal','eap');
return {intro,notice,now,avoid,routes:[...new Set(routes)]};
}
function section(parent,name){var s=node('section',undefined,'plan-section',parent);node('h3',name,'',s);return s}
function renderPlan(plan){
var root=get('plan-content');root.replaceChildren();node('p',plan.intro,'plan-intro',root);
var urgent=node('div',undefined,'priority-note',root);node('strong',B('Check deadlines promptly','Vérifiez rapidement les délais'),'',urgent);node('p',plan.notice,'',urgent);
var actions=section(root,B('Practical next steps','Démarches pratiques'));var ol=node('ol',undefined,'',actions);plan.now.forEach(s=>node('li',s,'',ol));
var rec=section(root,B('Potential recourse and support routes','Recours et soutiens possibles'));
plan.routes.forEach(key=>{var c=defs[key];if(!c)return;var box=node('div',undefined,'route-item',rec);node('h4',c[S.lang][0],'',box);node('p',c[S.lang][1],'',box);anchor(box,B('Official information','Renseignements officiels'),c.url)});
var cautions=section(root,B('What to avoid','Précautions'));var ul=node('ul',undefined,'',cautions);plan.avoid.forEach(s=>node('li',s,'',ul));
S.plan=plan;
}
function turn(who,msg){var root=get('chat-history'),r=node('div',undefined,'chat-turn '+who,root);node('strong',who==='user'?B('You','Vous'):B('Recourse Assistant · grounded guidance','Assistant aux recours · conseils fondés sur les sources'),'',r);node('p',msg,'',r);root.scrollTop=root.scrollHeight}
function relevance(c,issueList,q){
var score=0,gs=c.grounds||[],is=c.issues||[];const correspond={race:'race',disability:'disability',religion:'religion',reprisal:'retaliation',sex:'sex',family:'family'};
const issueTerms={race:['race','harassment','group'],disability:['accommodation','telework'],religion:['accommodation'],harassment:['harassment','investigation'],staffing:['staffinternal','staffexternal'],reprisal:['reprisal','whistle'],family:['accommodation'],safety:['harassment'],language:['language']};
issueList.forEach(k=>{if(gs.includes(correspond[k]))score+=15;(issueTerms[k]||[]).forEach(x=>{if(is.includes(x))score+=5})});
if(c.scope==='Federal public service')score+=6;else if(c.scope==='Not an employment dispute')score-=16;
var hay=norm([c.title,c.citation,c.what,c.factors,c.outcome,...is].join(' '));q.forEach(w=>{if(hay.includes(w))score+=3});
return score;
}
function caseLabel(c){var a={allowed:['Allowed','Accueillie'],dismissed:['Dismissed','Rejetée'],mixed:['Mixed','Mixte'],review:['Under review','En révision'],procedural:['Procedural','Procédurale'],precedent:['Precedent','Précédent']};return (a[c.status]||[c.status,c.status])[S.lang==='fr'?1:0]}
function shortlist(){
var q=tok(get('case-keywords').value),out=get('case-outcome').value,term=(S.terms||[]);
var list=S.cases.filter(x=>!out||x.status===out).filter(x=>!q.length||q.every(w=>norm([x.title,x.citation,x.what,x.what_fr,x.factors,x.factors_fr,x.outcome,x.outcome_fr,(x.issues||[]).join(' ')].join(' ')).includes(w)));
list.sort((a,b)=>relevance(b,term,q)-relevance(a,term,q));
if(!q.length&&term.length&&!term.includes('cases')){const high=list.filter(x=>relevance(x,term,q)>=10);if(high.length>2)list=high}
if(list.length>4){var ordered=[],seen=new Set();['allowed','dismissed','mixed'].forEach(stat=>{var item=list.find(x=>x.status===stat&&!seen.has(x.id));if(item){ordered.push(item);seen.add(item.id)}});list.forEach(x=>{if(!seen.has(x.id))ordered.push(x)});return ordered}
return list;
}
function renderCases(){
var root=get('case-results');root.replaceChildren();if(!S.cases.length){node('p',B('Local cases could not be loaded. Use the public case-law search linked below.','Les décisions locales sont indisponibles. Consultez la recherche publique ci-dessous.'),'empty',root);get('case-count').textContent='';return}
var rows=shortlist();get('case-count').textContent=B(rows.length+' records',rows.length+' dossiers');
if(!rows.length)node('p',B('No matching case in this collection. Try broader published decisions.','Aucune cause correspondante dans cette sélection. Essayez la recherche élargie.'),'empty',root);
rows.slice(0,S.show).forEach(c=>{
var box=node('article',undefined,'case-card',root);node('h3',c.title,'',box);
node('p',[c.citation,c.body,c.scope].filter(Boolean).join(' · '),'ref',box);
var tags=node('p',undefined,'',box);node('span',caseLabel(c),'pill',tags);
if(c.finding==='not-separately-classified'||/secondary|representative/.test(c.sourceType))node('span',B('Verify original source','Vérifier la source'),'pill flag',tags);
node('p',(S.lang==='fr'&&c.what_fr)||c.what,'',box);
var details=node('details',undefined,'',box);node('summary',B('Reasons and remedies','Motifs et réparations'),'',details);
node('p',B('Considered: ','Facteurs examinés : ')+((S.lang==='fr'&&c.factors_fr)||c.factors||''),'',details);
node('p',B('Outcome: ','Résultat : ')+((S.lang==='fr'&&c.outcome_fr)||c.outcome||''),'',details);
node('p',B('Source type: ','Type de source : ')+(c.sourceType||'unverified'),'meta',details);
if(c.finding==='not-separately-classified')node('p',B('The specific discrimination finding in this entry has not been independently classified.','La conclusion précise de discrimination n’a pas été classifiée indépendamment.'),'meta',details);
if(c.sourceNote)node('p',c.sourceNote,'meta',details);
var links=node('p',undefined,'',box);anchor(links,B('Read cited source','Consulter la source'),c.url);
if(c.officialDecisionSearch)anchor(links,B('Search official decision','Recherche officielle'),c.officialDecisionSearch);
});
get('more-cases').hidden=rows.length<=S.show;
}
function risk(text){return /kill myself|suicid|end my life|harm myself|me suicid|me tuer|danger immediat|immediate danger/i.test(text)}
function answer(question,selected){
var msg=String(question||'').trim().slice(0,1500);if(!msg)return;
S.last=msg;S.topic=selected||S.topic;
turn('user',msg);
if(risk(msg)){var safety=B('If anyone is in immediate danger, call 911. In Canada, call or text 988 for suicide crisis support. Workplace peer support is not an emergency service. You can also contact your EAP.','En cas de danger immédiat, composez le 911. Au Canada, appelez ou textez le 988 pour le soutien en cas de crise suicidaire. Le soutien entre pairs n’est pas un service d’urgence. Vous pouvez aussi contacter votre PAE.');turn('assistant',safety);var p=get('plan-content');p.replaceChildren();node('p',safety,'priority-note',p);anchor(p,B('Find Employee Assistance Program support','Trouver le Programme d’aide aux employés'),sources.eap);return}
S.terms=[...detect(msg,selected||S.topic)];S.show=6;
var plan=planFor(S.terms);renderPlan(plan);
turn('assistant',B('I have identified possible recourse routes and practical steps based on your concern. A legal finding depends on evidence and the right decision-maker. See the options and comparable decisions below. You can ask another question or request peer support.','J’ai repéré des recours et des démarches possibles. Une conclusion juridique dépend de la preuve et de l’organisme compétent. Consultez les options et les décisions comparables ci-dessous. Vous pouvez poser une autre question ou demander du soutien entre pairs.'));
renderCases();
if(S.terms.includes('peer'))get('peer-support').scrollIntoView({behavior:'smooth',block:'start'});
if(S.terms.includes('cases'))get('similar-cases').scrollIntoView({behavior:'smooth',block:'start'});
if(S.aiReady)explainAI(msg,plan);
}
function retranslate(){
D.documentElement.lang=S.lang;
D.querySelectorAll('[data-en][data-fr]').forEach(n=>n.textContent=n.getAttribute('data-'+S.lang));
get('lang-btn').textContent=S.lang==='en'?'Français':'English';
get('question').placeholder=B('Describe the concern without names, medical details or identifying information.','Décrivez le problème sans noms ni renseignements médicaux ou permettant d’identifier une personne.');
get('case-keywords').placeholder=B('e.g. racism promotion disability religion','ex. racisme promotion handicap religion');
if(S.plan)renderPlan(planFor(S.terms));
renderCases();
}
async function loadCases(){
try{var resp=await fetch('../data/cases.json',{credentials:'omit'});if(!resp.ok)throw Error('failed');var data=await resp.json();if(!Array.isArray(data.cases))throw Error('invalid');S.cases=data.cases.filter(c=>c&&c.id&&c.citation&&c.what&&c.url)}catch(err){S.cases=[]}renderCases();
}
function peerMail(offer){
var subject=offer?'ARAN | Volunteer peer recourse support / Bénévolat pour les recours':'ARAN | Request for peer recourse support / Demande de soutien entre pairs';
var body=offer?B('Hello ARAN,\n\nI may be able to share my experience of workplace recourse processes as an informal peer volunteer. Please let me know whether a coordinated program exists and what safeguards apply.\n\nI understand this is not legal advice or representation.\n\nThank you.','Bonjour le RAAR,\n\nJe pourrais partager mon expérience des recours en milieu de travail comme bénévole. Merci de préciser si un programme coordonné existe et quelles mesures de protection s’appliquent.\n\nJe comprends que ce n’est ni un conseil ni une représentation juridique.\n\nMerci.'):
B('Hello ARAN,\n\nI would like to ask whether an experienced peer volunteer could help me understand workplace recourse options. Please let me know whether support is available, the privacy arrangements and the next steps.\n\nI have not included confidential details.\n\nThank you.','Bonjour le RAAR,\n\nJe souhaite savoir si une personne bénévole expérimentée peut m’aider à comprendre les recours possibles au travail. Merci de m’indiquer si ce soutien existe, comment la vie privée est protégée et les prochaines étapes.\n\nJe n’ai inclus aucun détail confidentiel.\n\nMerci.');
location.href='mailto:aranpublicservants@gmail.com?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(body);
}
async function explainAI(message,plan){
if(!S.ai||S.aiBusy)return;
S.aiBusy=true;var status=get('ai-status'),box=get('ai-answer'),output=get('ai-text');box.hidden=false;
status.textContent=B('Preparing local AI explanation…','Préparation de l’explication IA locale…');
try{
var top=shortlist().slice(0,3).map(c=>({citation:c.citation,what:c.what,factors:c.factors,outcome:c.outcome,sourceType:c.sourceType}));
var official=plan.routes.slice(0,5).map(key=>({name:defs[key][S.lang][0],guidance:defs[key][S.lang][1],source:defs[key].url}));
var policy='You are an equity-informed Canadian federal public service recourse EXPLAINER. Do not minimize or dismiss racism, ableism or religious discrimination, but do not assume a violation has been proven. Use ONLY the provided official-route explanations and referenced case summaries. Never invent statutes, decisions, amounts, time limits or case outcomes. Avoid personal data. Do not provide individualized legal advice or promise a remedy. Remind that informal services do not automatically suspend legal deadlines. State uncertainties. Answer in '+(S.lang==='fr'?'French':'English')+' in at most 210 words: three practical steps, one relevant case lesson and a question. Do not add unsupported citations.';
var content=JSON.stringify({question:message,officialPaths:official,steps:plan.now,caseExcerpts:top}).slice(0,11000);
var r=await S.ai.chat.completions.create({messages:[{role:'system',content:policy},{role:'user',content:'Explain using these sources only: '+content}],temperature:0.05,max_tokens:370});
var result=r?.choices?.[0]?.message?.content;if(!result)throw Error('Empty output');
output.textContent=result;status.textContent=B('On-device AI explanation — verify with sources.','Explication locale de l’IA — vérifiez les sources.');
}catch(err){output.textContent=B('The local model could not finish. The source-based guidance and links remain available.','Le modèle local n’a pas terminé. Les conseils et sources restent disponibles.');status.textContent=B('AI unavailable; guided help still works.','IA indisponible; le guide demeure accessible.');}
finally{S.aiBusy=false}
}
async function enableAI(){
var status=get('ai-status'),btn=get('ai-enable');
if(S.aiReady){status.textContent=B('The local AI is already enabled. Ask your question.','L’IA locale est déjà activée. Posez votre question.');return}
if(!navigator.gpu){status.textContent=B('This device or browser does not support WebGPU. Guided help works without AI.','Cet appareil ou navigateur n’est pas compatible avec WebGPU. Le guide fonctionne sans IA.');return}
btn.disabled=true;status.textContent=B('Loading the on-device model. This requires a large one-time download and graphics memory. Questions are not sent to a paid AI service.','Chargement du modèle local. Il faut télécharger un fichier important et disposer de mémoire graphique. Les questions ne sont pas envoyées à un service d’IA payant.');
try{
var lib=await import('https://esm.run/@mlc-ai/web-llm@0.2.88');
if(!lib.CreateMLCEngine)throw Error('Missing library');
S.ai=await lib.CreateMLCEngine('Qwen3-0.6B-q4f16_1-MLC',{initProgressCallback:p=>{status.textContent=B('Preparing local model: ','Préparation du modèle local : ')+(p.text||Math.round((p.progress||0)*100)+'%')}});
S.aiReady=true;btn.textContent=B('On-device AI enabled','IA locale activée');status.textContent=B('Ready. AI runs on this device; always verify its explanations.','Prête. L’IA fonctionne sur cet appareil; vérifiez toujours ses explications.');
if(S.last&&S.plan)explainAI(S.last,S.plan);
}catch(e){btn.disabled=false;status.textContent=B('This browser cannot run the model right now. The main guide still works, without a login or payment.','Ce navigateur ne peut pas exécuter le modèle pour le moment. Le guide reste utilisable sans compte ni frais.');}
}
D.querySelectorAll('#quick-questions button').forEach(b=>b.addEventListener('click',()=>{
var key=b.dataset.topic,question=b.getAttribute('data-'+S.lang)||b.textContent;
get('question').value='';answer(question,key);
}));
get('ask-form').addEventListener('submit',e=>{
e.preventDefault();var q=get('question').value.trim();if(!q){get('question').focus();return}
var explicit=detect(q);answer(q,explicit.size?null:S.topic);get('question').value='';
});
get('reset-chat').addEventListener('click',()=>{
S.topic='';S.last='';S.terms=[];S.plan=null;S.show=6;
get('chat-history').replaceChildren();get('plan-content').replaceChildren();get('ai-answer').hidden=true;
get('case-keywords').value='';get('case-outcome').value='';
node('p',B('Choose a topic or ask a question to begin.','Choisissez un sujet ou posez une question.'),'empty',get('plan-content'));renderCases();
turn('assistant',B('Describe a concern in general terms, or choose a question above. I will not ask you for names or medical records.','Décrivez votre préoccupation en termes généraux ou choisissez une question. Aucun nom ni dossier médical n’est nécessaire.'));
});
get('copy-plan').addEventListener('click',async()=>{
if(!S.plan)return;
var txt=[S.plan.intro,S.plan.notice,...S.plan.now,...S.plan.routes.map(k=>defs[k][S.lang].join(': ')),...S.plan.avoid].join('\n\n');
try{await navigator.clipboard.writeText(txt);get('copy-plan').textContent=B('Copied','Copié')}catch(e){get('copy-plan').textContent=B('Copy unavailable','Copie indisponible')}
});
get('case-keywords').addEventListener('input',()=>{S.show=6;renderCases()});
get('case-outcome').addEventListener('change',()=>{S.show=6;renderCases()});
get('more-cases').addEventListener('click',()=>{S.show+=8;renderCases()});
get('request-peer').addEventListener('click',()=>peerMail(false));
get('offer-peer').addEventListener('click',()=>peerMail(true));
get('lang-btn').addEventListener('click',()=>{S.lang=S.lang==='en'?'fr':'en';retranslate()});
get('ai-enable').addEventListener('click',enableAI);
if(new URLSearchParams(location.search).get('lang')==='fr'){S.lang='fr'}
retranslate();
turn('assistant',B('You can start with a short question, explore similar decisions or ask about a peer connection. You do not need to decide whether to file a complaint before seeking guidance.','Vous pouvez poser une question, explorer des décisions comparables ou demander du soutien entre pairs. Vous n’avez pas besoin de décider immédiatement si vous déposez une plainte.'));
loadCases();
})();