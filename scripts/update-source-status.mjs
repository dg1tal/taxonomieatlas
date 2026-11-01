// Publish operational status independently of immutable taxonomy packages.
import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {validateSourceStatus} from '../dist/source-status.mjs';
const sha=value=>crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
const date=value=>typeof value==='string'&&/^\d{4}-\d{2}-\d{2}T.*(?:Z|\+00:00)$/.test(value)&&Number.isFinite(Date.parse(value));
const runUrl=value=>typeof value==='string'&&/^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/actions\/runs\/\d+$/.test(value)?value:null;
export function makeSourceStatus({previous=null,report=null,checkResult='failure',run=null,bundle,manifest,releaseReview=null,candidate=null,now=new Date().toISOString()}){
 if(manifest.sha256!==sha(bundle)||manifest.path!==`releases/${manifest.sha256}.json`)throw Error('Published bundle and release manifest differ');
 const valid=report&&date(report.completed_at||report.checked_at)&&Array.isArray(report.errors)&&Array.isArray(report.blocked);
 const errors=valid?report.errors.map(String).slice(0,100).map(s=>s.slice(0,500)):['Kein vollständiger Quellenprüfbericht verfügbar.'];
 const blocked=valid?report.blocked.map(String).slice(0,100).map(s=>s.slice(0,500)):[];
 const at=valid?(report.completed_at||report.checked_at):now;
 const outcome=checkResult==='success'&&valid&&!errors.length&&!blocked.length?'success':valid&&blocked.length?'review_required':'failed';
 const latest={at,outcome,run_url:runUrl(run)};
 const lastSuccess=outcome==='success'?{at,run_url:runUrl(run)}:previous?.last_successful_check||null;
 const incomplete=!valid||errors.length>0||(!blocked.length&&checkResult!=='success');
 const updateState=blocked.length?'required':incomplete?'unknown':'clear';
 const carried=incomplete?(previous?.manual_review?.update_items||[]).filter(item=>!blocked.includes(item)):[];
 const items=[...blocked,...carried];
 const genus=releaseReview?.genus_patches?.length||0,fields=releaseReview?.patches?.length||0;
 const summary=[genus?`${genus} Gattungsnamen aktualisiert`:null,fields?`${fields} AviList-Namens- oder Codekorrekturen`:null].filter(Boolean).join(' · ')||'Geprüfter Datenstand';
 const sameRelease=previous?.published_update?.sha256===manifest.sha256;
 const recordedRelease=!!releaseReview&&report?.checked_at===releaseReview.checked_at&&report?.to_sha256===bundle.source.sha256&&(!report.dataset_revision||report.dataset_revision===bundle.dataset_revision);
 const releaseRun=runUrl(releaseReview?.workflow_url)|| (sameRelease?runUrl(previous.published_update.run_url):null)|| (report?.checked_at===releaseReview?.checked_at?runUrl(run):null);
 const dataset={germany_species_concepts:(bundle.germany_source?.records||[]).filter(r=>r.review!=='confirmed').length,
  germany_subspecies_assignments:[...(bundle.germany_subspecies_source?.records||[]),...(bundle.germany_subspecies_source?.later_records||[])].filter(r=>r.mapping_status!=='confirmed').length};
 return {schema_version:1,updated_at:now,last_successful_check:lastSuccess,latest_check:latest,
  published_update:{revision:bundle.dataset_revision||'ohne Revisionskennung',version:bundle.version,sha256:manifest.sha256,path:manifest.path,summary,run_url:releaseRun},
  publication_pending:!!(valid&&report.publish===true&&(candidate?sha(candidate)!==manifest.sha256:!recordedRelease)),
  manual_review:{update_state:updateState,update_items:items,as_of:carried.length?previous.manual_review.as_of:at,carried_forward:carried.length>0,incomplete,dataset},errors};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const read=file=>{try{return fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):null;}catch{return null;}};
 const reportPath=process.argv[2]||'source-update/report.json',manifest=read('dist/releases.json');
 const status=makeSourceStatus({previous:read('dist/source-status.json'),report:read(reportPath),checkResult:process.env.SOURCE_CHECK_RESULT||'failure',
  run:process.env.SOURCE_RUN_URL,bundle:read('dist/data.json'),manifest,releaseReview:read(`sources/reviews/${manifest.sha256}.source-check.json`),
  candidate:read(path.join(path.dirname(reportPath),'candidate.json'))});
 if(!validateSourceStatus(status))throw Error('Invalid public source status');
 fs.writeFileSync('dist/source-status.json',JSON.stringify(status,null,2)+'\n');
 console.log(`Source status: ${status.latest_check.outcome}; release ${status.published_update.revision}; reviews ${status.manual_review.update_state}`);
}
