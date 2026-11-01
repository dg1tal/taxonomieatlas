const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const validDate=value=>typeof value==='string'&&/^\d{4}-\d{2}-\d{2}T.*(?:Z|\+00:00)$/.test(value)&&Number.isFinite(Date.parse(value));
const validRun=value=>value===null||typeof value==='string'&&/^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/actions\/runs\/\d+$/.test(value);
export function validateSourceStatus(s){
 if(!s||s.schema_version!==1||!validDate(s.updated_at)||!s.latest_check||!validDate(s.latest_check.at)||!['success','review_required','failed'].includes(s.latest_check.outcome)||!validRun(s.latest_check.run_url))return false;
 if(s.last_successful_check&&(!validDate(s.last_successful_check.at)||!validRun(s.last_successful_check.run_url)))return false;
 const p=s.published_update,r=s.manual_review;
 return !!(p&&typeof p.revision==='string'&&typeof p.version==='string'&&typeof p.summary==='string'&&/^[a-f0-9]{64}$/.test(p.sha256)&&p.path===`releases/${p.sha256}.json`&&validRun(p.run_url)&&
  typeof s.publication_pending==='boolean'&&r&&['clear','required','unknown'].includes(r.update_state)&&typeof r.incomplete==='boolean'&&validDate(r.as_of)&&Array.isArray(r.update_items)&&r.update_items.every(x=>typeof x==='string')&&r.dataset&&
  ['germany_species_concepts','germany_subspecies_assignments'].every(k=>Number.isInteger(r.dataset[k])&&r.dataset[k]>=0)&&Array.isArray(s.errors)&&s.errors.every(x=>typeof x==='string'));
}
export async function loadSourceStatus(fetcher=fetch){
 const response=await fetcher('./source-status.json',{cache:'no-store'});
 if(!response.ok)throw Error('Quellenstatus nicht erreichbar');
 const status=await response.json();
 if(!validateSourceStatus(status))throw Error('Ungültiger Quellenstatus');
 return status;
}
function time(value){return `<time datetime="${esc(value)}">${esc(new Intl.DateTimeFormat('de-DE',{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',timeZone:'Europe/Berlin',timeZoneName:'short'}).format(new Date(value)))}</time>`;}
function link(url,label){return url?`<a href="${esc(url)}" target="_blank" rel="noopener">${esc(label)} ↗</a>`:'';}
export function renderSourceStatus(state){
 const s=state?.data;
 if(!s||!validateSourceStatus(s))return `<p class="help">${state?.kind==='loading'?'Quellenstatus wird geladen …':'Quellenstatus derzeit nicht abrufbar. Bitte später erneut prüfen.'}</p>`;
 const r=s.manual_review,p=s.published_update,last=s.last_successful_check;
 const notice=state.kind==='unavailable'?`<p class="note">Status derzeit nicht aktuell abrufbar. Zuletzt geladene Angaben vom ${time(s.updated_at)}.</p>`:state.kind==='loading'?'<p class="help">Status wird aktualisiert …</p>':'';
 const manual=r.update_state==='clear'?'Keine offenen Updateprüfungen.':r.update_state==='required'&&r.incomplete?`${r.update_items.length} gemeldete Updateprüfungen; aktueller Stand unvollständig.`:r.update_state==='required'?`${r.update_items.length} manuelle Updateprüfung${r.update_items.length===1?'':'en'} erforderlich.`:'Offene Updateprüfungen derzeit nicht vollständig feststellbar.';
 const outcome={success:'Erfolgreich abgeschlossen',review_required:'Manuelle Prüfung erforderlich',failed:'Prüflauf fehlgeschlagen'}[s.latest_check.outcome];
 const backlog=r.dataset.germany_species_concepts||r.dataset.germany_subspecies_assignments;
 return `${notice}<dl class="source-status-grid"><dt>Quellen zuletzt erfolgreich geprüft</dt><dd>${last?time(last.at):'Noch kein erfolgreicher Quellencheck dokumentiert.'}</dd><dt>Veröffentlichtes Update</dt><dd><strong>${esc(p.revision)}</strong><small>AviList ${esc(p.version)} · ${esc(p.summary)}</small></dd><dt>Manuelle Updateprüfungen</dt><dd>${esc(manual)}${r.incomplete?'<small>Die letzte Prüfung konnte nicht alle Quellen bestätigen.</small>':''}</dd></dl>
 <p class="help">Letzter Prüflauf: ${esc(outcome)} · ${time(s.latest_check.at)} ${link(s.latest_check.run_url,'Prüflauf auf GitHub')}</p>
 ${s.publication_pending?'<p class="note">Ein geprüfter Datenkandidat wurde noch nicht veröffentlicht. Oben steht der weiterhin bereitgestellte Datenstand.</p>':''}
 ${r.update_items.length?`<details><summary>${r.incomplete?'Gemeldete':'Offene'} Updateprüfungen anzeigen</summary><p class="help">${r.carried_forward?'Ältere, noch nicht erneut bestätigte Meldungen enthalten. Ältester Meldungsstand:':'Stand:'} ${time(r.as_of)}</p><ul class="help">${r.update_items.map(item=>`<li>${esc(item)}</li>`).join('')}</ul></details>`:''}
 ${s.errors.length?`<details><summary>Probleme beim letzten Quellencheck</summary><ul class="help">${s.errors.map(item=>`<li>${esc(item)}</li>`).join('')}</ul></details>`:''}
 ${backlog?`<details><summary>Bereits bekannte fachliche Prüffälle im Datenbestand</summary><p class="help">${r.dataset.germany_species_concepts.toLocaleString('de-DE')} Einträge der Deutschland-Artenliste warten auf fachlichen Abgleich; ${r.dataset.germany_subspecies_assignments.toLocaleString('de-DE')} Unterartzuordnungen sind offen oder bereits in der Quelle unsicher. Diese Altfälle sind getrennt von neuen Updateprüfungen dokumentiert.</p></details>`:''}
 <details><summary>Veröffentlichtes Datenpaket</summary><p class="help"><a href="${esc(p.path)}">JSON-Datenpaket öffnen</a> ${link(p.run_url,'Veröffentlichungs-Prüflauf')}<br>SHA-256: <code>${esc(p.sha256)}</code></p></details>`;
}
