const $=id=>document.getElementById(id);
const MODELS=['gemini-2.5-flash','gemini-2.0-flash','gemini-2.5-flash-lite','gemini-flash-latest'];
const state={files:[],images:[]};
const esc=s=>s.replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));

// API key
$('apiKey').value=localStorage.getItem('gemini_key')||'';
const keyMsg=()=>$('keyStatus').textContent=localStorage.getItem('gemini_key')?'✓ Đã lưu khóa trên máy này.':'Chưa có khóa.';
keyMsg();
$('saveKey').onclick=()=>{localStorage.setItem('gemini_key',$('apiKey').value.trim());keyMsg();};
$('clearKey').onclick=()=>{localStorage.removeItem('gemini_key');$('apiKey').value='';keyMsg();};

// Files
$('files').onchange=async e=>{
  state.files=[];
  for(const f of e.target.files){
    let text='';
    try{
      if(/\.docx$/i.test(f.name)) text=(await mammoth.extractRawText({arrayBuffer:await f.arrayBuffer()})).value;
      else text=await f.text();
    }catch(err){text='';}
    state.files.push({name:f.name,text});
  }
  $('fileList').textContent=state.files.map(f=>`📎 ${f.name} (${f.text.split(/\s+/).length} từ)`).join(' · ');
};
// Images
$('images').onchange=async e=>{
  state.images=[];
  for(const f of e.target.files){
    const url=await new Promise(r=>{const fr=new FileReader();fr.onload=()=>r(fr.result);fr.readAsDataURL(f);});
    const dim=await new Promise(r=>{const i=new Image();i.onload=()=>r({w:i.naturalWidth,h:i.naturalHeight});i.src=url;});
    state.images.push({name:f.name,url,buf:await f.arrayBuffer(),...dim,caption:''});
  }
  $('imgList').innerHTML=state.images.map((im,i)=>`<div><img src="${im.url}"><b>Ảnh ${i+1}</b><input data-i="${i}" placeholder="Chú thích ảnh ${i+1} (nội dung, nguồn ảnh)"></div>`).join('');
  $('imgList').querySelectorAll('input').forEach(inp=>inp.oninput=()=>state.images[inp.dataset.i].caption=inp.value);
};

async function fetchLink(u){
  try{const r=await fetch('https://r.jina.ai/'+u);if(!r.ok)throw 0;return (await r.text()).slice(0,15000);}
  catch(e){return null;}
}

function buildPrompt(src){
  const mode=$('mode').value, genre=$('genre').value, pages=parseFloat($('pages').value);
  const words=Math.round(pages*430);
  const modeRule=mode==='dang'
   ?`MẢNG: Công tác Đảng – chính trị tư tưởng (báo Đảng, trang tuyên giáo cấp tỉnh). Giọng văn trang trọng, chuẩn mực, lập luận chặt: cơ sở chủ trương/văn bản → thực tiễn địa phương → kết quả, hạn chế → giải pháp, nhiệm vụ. TUYỆT ĐỐI chỉ nêu nghị quyết, chỉ thị, kết luận, số hiệu văn bản, phát biểu, chức danh, số liệu CÓ TRONG TƯ LIỆU. Không suy diễn chỉ đạo. Chỗ nào cần dẫn chứng mà tư liệu không có thì viết [CẦN KIỂM CHỨNG: mô tả thông tin cần bổ sung]. Dùng đúng cách viết hoa tên Đảng, cơ quan, chức danh theo quy định hiện hành.`
   :`MẢNG: Giáo dục & chuyển đổi số. Văn phong báo chí hiện đại, cụ thể, có nhân vật, chi tiết, số liệu từ tư liệu; giải thích thuật ngữ công nghệ dễ hiểu cho phụ huynh, giáo viên.`;
  const genreRule={'Tin ngắn':'Tin: mô hình kim tự tháp ngược, 5W1H ngay đoạn đầu, không bình luận cá nhân, không cần đầu mục.',
   'Tường thuật':'Tường thuật: diễn biến theo trình tự, có không khí sự kiện, trích phát biểu tiêu biểu (chỉ từ tư liệu).',
   'Phóng sự':'Phóng sự: mở bằng cảnh/chi tiết hoặc nhân vật, có 2–4 đầu mục, đan xen tư liệu và quan sát, kết gợi mở.',
   'Bình luận':'Bình luận: nêu vấn đề, phân tích nhiều chiều, luận cứ từ tư liệu, đề xuất giải pháp, có 2–3 đầu mục.',
   'Bài tuyên truyền tư tưởng':'Bài tuyên truyền, định hướng tư tưởng: khẳng định giá trị/chủ trương, phân tích ý nghĩa, liên hệ thực tiễn địa phương, nêu nhiệm vụ; có 2–4 đầu mục.'}[genre];
  const n=state.images.length;
  const imgRule=n?`Có ${n} ảnh. Chèn mỗi ảnh đúng một lần trên một dòng riêng dạng [[ANH:1]] … [[ANH:${n}]] ở vị trí phù hợp nội dung. Chú thích ảnh: ${state.images.map((im,i)=>`Ảnh ${i+1}: ${im.caption||'(chưa có)'}`).join('; ')}.`:'Không có ảnh, không chèn [[ANH]].';
  return `Bạn là biên tập viên kỳ cựu của báo in và báo điện tử Việt Nam. Hãy viết một bài báo hoàn chỉnh bằng tiếng Việt chuẩn mực.
${modeRule}
THỂ LOẠI: ${genre}. ${genreRule}
ĐỘ DÀI: khoảng ${words} từ (≈${pages} trang A4), sai lệch không quá 10%.
QUY TẮC:
- Chỉ dùng sự kiện, số liệu, tên người, trích dẫn có trong TƯ LIỆU. Không bịa. Thông tin cần mà thiếu → [CẦN KIỂM CHỨNG: ...].
- Tít ngắn gọn, hấp dẫn, đúng nội dung (có thể điều chỉnh từ tên bài gợi ý). Sapo 2–3 câu, tóm ý chính.
- ${imgRule}
- Không dùng markdown đậm/nghiêng, không emoji, không lời dẫn ngoài bài.
ĐỊNH DẠNG ĐẦU RA (bắt buộc):
TIÊU ĐỀ: <tít>
SAPO: <sapo>
<các đoạn thân bài, mỗi đoạn một dòng; đầu mục viết "## Tên đầu mục">
<đoạn kết>

TÊN BÀI GỢI Ý: ${$('title').value.trim()}
SAPO GỢI Ý: ${$('sapo').value.trim()||'(không có)'}
===== TƯ LIỆU =====
${src}`;
}

async function callGemini(prompt,temp){
  const key=localStorage.getItem('gemini_key')||$('apiKey').value.trim();
  if(!key) throw new Error('Chưa nhập khóa API Gemini (mục ①).');
  let last='';
  for(const m of MODELS){
    setStatus(`Đang viết bằng ${m}…`);
    const r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${encodeURIComponent(key)}`,{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({contents:[{role:'user',parts:[{text:prompt}]}],generationConfig:{temperature:temp,maxOutputTokens:8192}})});
    const j=await r.json().catch(()=>({}));
    if(r.ok){const t=j.candidates?.[0]?.content?.parts?.map(p=>p.text||'').join('');if(t)return t.trim();last='Mô hình không trả nội dung (có thể bị bộ lọc an toàn chặn).';}
    else{last=j.error?.message||('HTTP '+r.status);if(r.status===400&&/API key/i.test(last))break;}
  }
  throw new Error('Gemini báo lỗi: '+last);
}
const setStatus=s=>$('status').textContent=s;

$('go').onclick=async()=>{
  if(!$('title').value.trim()&&!$('notes').value.trim()){alert('Nhập tên bài hoặc tư liệu.');return;}
  $('go').disabled=true;
  try{
    let src='';
    if($('notes').value.trim()) src+=`[Ghi chú của tác giả]\n${$('notes').value.trim()}\n\n`;
    state.files.forEach(f=>src+=`[Tài liệu: ${f.name}]\n${f.text.slice(0,30000)}\n\n`);
    const urls=$('urls').value.split(/\s+/).filter(u=>/^https?:\/\//.test(u));
    const failed=[];
    for(const u of urls){setStatus('Đang đọc link: '+u);const t=await fetchLink(u);if(t)src+=`[Nguồn: ${u}]\n${t}\n\n`;else failed.push(u);}
    if(!src.trim()) src='(Không có tư liệu – chỉ dựng khung, đánh dấu [CẦN KIỂM CHỨNG] mọi dữ kiện.)';
    const temp=/Bình luận|tuyên truyền/.test($('genre').value)?0.5:0.4;
    let out=await callGemini(buildPrompt(src),temp);
    out=out.replace(/\*\*(.+?)\*\*/g,'$1').replace(/^#\s+/gm,'## ');
    // ensure all images appear
    state.images.forEach((_,i)=>{if(!out.includes(`[[ANH:${i+1}]]`))out+=`\n[[ANH:${i+1}]]`;});
    $('draft').value=out;$('outCard').hidden=false;updateWC();showTab('edit');
    setStatus('✓ Xong. Hãy đọc duyệt bản thảo.'+(failed.length?` Không đọc được ${failed.length} link (hãy dán nội dung thủ công).`:''));
    $('outCard').scrollIntoView({behavior:'smooth'});
  }catch(e){setStatus('⚠ '+e.message);}
  $('go').disabled=false;
};

function parse(text){
  const lines=text.split('\n').map(l=>l.trim()).filter(Boolean);
  let title='',sapo='';const body=[];
  for(const l of lines){
    let m;
    if(!title&&(m=l.match(/^TI[ÊE]U Đ[ỀE]\s*:\s*(.*)/i)))title=m[1];
    else if(!sapo&&(m=l.match(/^SAPO\s*:\s*(.*)/i)))sapo=m[1];
    else if((m=l.match(/^\[\[ANH:(\d+)\]\]$/)))body.push({t:'img',i:+m[1]-1});
    else if((m=l.match(/^#{2,3}\s*(.*)/)))body.push({t:'h',s:m[1]});
    else body.push({t:'p',s:l});
  }
  return {title:title||$('title').value.trim(),sapo,body};
}
const updateWC=()=>{$('wc').textContent=`${$('draft').value.split(/\s+/).filter(Boolean).length} từ ≈ ${( $('draft').value.split(/\s+/).filter(Boolean).length/430).toFixed(1)} trang A4`;};
$('draft').oninput=updateWC;
function showTab(t){document.querySelectorAll('.tabs button').forEach(b=>b.classList.toggle('on',b.dataset.t===t));
  $('draft').hidden=t!=='edit';$('preview').hidden=t!=='prev';if(t==='prev')renderPreview();}
document.querySelectorAll('.tabs button').forEach(b=>b.onclick=()=>showTab(b.dataset.t));
const mark=s=>esc(s).replace(/\[CẦN KIỂM CHỨNG[^\]]*\]/g,m=>`<span class="chk">${m}</span>`);
function renderPreview(){
  const a=parse($('draft').value);
  $('preview').innerHTML=`<h1>${esc(a.title)}</h1>${a.sapo?`<p class="sapo">${mark(a.sapo)}</p>`:''}`+a.body.map(b=>{
    if(b.t==='h')return `<h3>${mark(b.s)}</h3>`;
    if(b.t==='img'){const im=state.images[b.i];return im?`<figure><img src="${im.url}"><figcaption>Ảnh ${b.i+1}: ${esc(im.caption)}</figcaption></figure>`:'';}
    return `<p>${mark(b.s)}</p>`;}).join('')+`<p class="by">Bài: ${esc($('author').value)}</p>`;
}
$('copy').onclick=()=>navigator.clipboard.writeText($('draft').value).then(()=>setStatus('Đã sao chép.'));

$('export').onclick=async()=>{
  const D=window.docx;const a=parse($('draft').value);
  const F='Times New Roman',SZ=26,LINE=360;
  const run=(s,o={})=>new D.TextRun({text:s,font:F,size:SZ,...o});
  const runs=(s,o={})=>s.split(/(\[CẦN KIỂM CHỨNG[^\]]*\])/).filter(Boolean).map(x=>x.startsWith('[CẦN')?run(x,{...o,highlight:'yellow'}):run(x,o));
  const ch=[];
  ch.push(new D.Paragraph({alignment:D.AlignmentType.CENTER,spacing:{after:240,line:LINE},children:[run(a.title.toUpperCase(),{bold:true,size:32})]}));
  if(a.sapo)ch.push(new D.Paragraph({alignment:D.AlignmentType.JUSTIFIED,spacing:{after:200,line:LINE},children:runs(a.sapo,{italics:true,bold:true})}));
  for(const b of a.body){
    if(b.t==='h')ch.push(new D.Paragraph({spacing:{before:200,after:120,line:LINE},children:runs(b.s,{bold:true})}));
    else if(b.t==='img'){const im=state.images[b.i];if(!im)continue;
      const w=Math.min(500,im.w),h=Math.round(w*im.h/im.w);
      const type=/png/.test(im.url.slice(0,30))?'png':/gif/.test(im.url.slice(0,30))?'gif':'jpg';
      ch.push(new D.Paragraph({alignment:D.AlignmentType.CENTER,spacing:{before:120},children:[new D.ImageRun({data:im.buf,type,transformation:{width:w,height:h}})]}));
      ch.push(new D.Paragraph({alignment:D.AlignmentType.CENTER,spacing:{after:200},children:[run(`Ảnh ${b.i+1}: ${im.caption||'[Chú thích ảnh]'}`,{italics:true,size:24})]}));}
    else ch.push(new D.Paragraph({alignment:D.AlignmentType.JUSTIFIED,indent:{firstLine:567},spacing:{after:120,line:LINE},children:runs(b.s)}));
  }
  ch.push(new D.Paragraph({alignment:D.AlignmentType.RIGHT,spacing:{before:240},children:[run('Bài: '+$('author').value,{bold:true})]}));
  const doc=new D.Document({sections:[{properties:{page:{size:{width:11906,height:16838},margin:{top:1134,bottom:1134,left:1701,right:1134}}},
    footers:{default:new D.Footer({children:[new D.Paragraph({alignment:D.AlignmentType.CENTER,children:[run('Bản thảo – cộng tác viên tự chịu trách nhiệm nội dung trước khi gửi tòa soạn',{italics:true,size:20,color:'666666'})]})]})},
    children:ch}]});
  const blob=await D.Packer.toBlob(doc);
  const name=(a.title||'bai-bao').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/gi,'d').replace(/[^\w]+/g,'-').slice(0,60);
  saveAs(blob,name+'.docx');
};
