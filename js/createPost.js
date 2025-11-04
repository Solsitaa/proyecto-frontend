const API_POSTS="https://a-production-10b6.up.railway.app/api/posts";

function getToken(){return localStorage.getItem("token")}

function setBusy(btn,busy){if(!btn)return;btn.disabled=busy;btn.innerHTML=busy?'<span class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>Publicando...':'Publicar'}

function showAlert(el,msg,type){if(!el)return;el.innerHTML='<div class="alert alert-'+type+' alert-dismissible fade show" role="alert">'+msg+'<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button></div>'}

async function createPost(payload){
  const token=getToken();
  if(!token) throw new Error("AUTH_MISSING");
  const res=await fetch(API_POSTS,{method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+token},body:JSON.stringify(payload)});
  const text=await res.text().catch(()=> "");
  if(!res.ok) throw new Error(String(res.status)+":"+text);
  try{return JSON.parse(text)}catch{return {}}
}

document.addEventListener("DOMContentLoaded",()=>{
  const form=document.getElementById("postForm");
  const title=document.getElementById("title");
  const content=document.getElementById("content");
  const submitBtn=document.getElementById("submitPost");
  const clearBtn=document.getElementById("clearBtn");
  const result=document.getElementById("postResult");

  if(!form) return;

  form.addEventListener("submit",async e=>{
    e.preventDefault();
    if(!form.checkValidity()){form.classList.add("was-validated");return}
    const payload={title:title.value.trim(),content:content.value.trim()};
    if(!payload.title||!payload.content){form.classList.add("was-validated");return}
    setBusy(submitBtn,true);
    result.innerHTML="";
    try{
      const post=await createPost(payload);
      const id=post.id??"";
      const status=(post.status??"").toString().toUpperCase();
      showAlert(result,"Publicado: "+id+" • "+status,"success");
      title.value="";
      content.value="";
      form.classList.remove("was-validated");
    }catch(err){
      const msg=String(err.message||"");
      if(msg==="AUTH_MISSING"){showAlert(result,"Debes iniciar sesión para publicar","warning")}
      else if(msg.startsWith("401")){showAlert(result,"Token inválido o expirado","warning")}
      else if(msg.startsWith("403")){showAlert(result,"No tienes permisos para publicar","danger")}
      else if(msg.startsWith("413")){showAlert(result,"El contenido es demasiado largo","danger")}
      else{showAlert(result,"Error al publicar","danger")}
    }finally{
      setBusy(submitBtn,false);
    }
  });

  if(clearBtn){
    clearBtn.addEventListener("click",()=>{
      title.value="";
      content.value="";
      form.classList.remove("was-validated");
      if(result) result.innerHTML="";
    });
  }
});