import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getDatabase, ref, push, set, onValue, remove } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import { getStorage, ref as sRef, uploadBytes, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

// حط الكونفيج بتاعك من Firebase هنا - هتجيبه مرة واحدة بس
const firebaseConfig = {
  apiKey: "PUT_YOUR_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT-default-rtdb.firebaseio.com",
  projectId: "YOUR_PROJECT",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "000000000",
  appId: "1:000:web:000"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const storage = getStorage(app);

const PASSWORD = "86518651";
const tablesRef = ref(db, 'shaarawy_tables');

const uploadBtn = document.getElementById('uploadBtn');
const deleteAllBtn = document.getElementById('deleteAllBtn');
const modal = document.getElementById('passwordModal');
const passwordInput = document.getElementById('passwordInput');
const confirmBtn = document.getElementById('confirmBtn');
const cancelBtn = document.getElementById('cancelBtn');
const passError = document.getElementById('passError');
const fileInput = document.getElementById('fileInput');
const tablesContainer = document.getElementById('tablesContainer');
const noTables = document.getElementById('noTables');
const modalTitle = document.getElementById('modalTitle');

let action = 'upload';
let targetId = null;

function openModal(type, id=null){
    action = type;
    targetId = id;
    modalTitle.textContent = type === 'upload' ? 'ادخل كلمة السر للرفع' : 'ادخل كلمة السر للحذف';
    modal.style.display = 'flex';
    passwordInput.value = '';
    passError.textContent = '';
    passwordInput.focus();
}
function closeModal(){ modal.style.display='none'; }

uploadBtn.onclick = ()=> openModal('upload');
deleteAllBtn.onclick = ()=> openModal('deleteAll');
cancelBtn.onclick = closeModal;

confirmBtn.onclick = async ()=>{
    if(passwordInput.value !== PASSWORD){
        passError.textContent = 'كلمة السر غلط';
        return;
    }
    if(action === 'upload'){
        fileInput.click();
    } else if(action === 'deleteAll'){
        if(!confirm('متأكد تمسح كل الجداول من عند كل الطلاب؟')) return;
        try{ await remove(tablesRef); closeModal(); }catch(e){ alert(e.message); }
    } else if(action === 'deleteOne'){
        try{
            await remove(ref(db, `shaarawy_tables/${targetId}`));
            await deleteObject(sRef(storage, `tables/${targetId}.pdf`)).catch(()=>{});
            closeModal();
        }catch(e){ alert(e.message); }
    }
};

fileInput.onchange = async (e)=>{
    const file = e.target.files[0];
    if(!file) return;
    confirmBtn.disabled = true;
    modalTitle.textContent = 'جاري الرفع...';
    try{
        const newRef = push(tablesRef);
        const id = newRef.key;
        const storageRef = sRef(storage, `tables/${id}.pdf`);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        await set(newRef, { url, name: file.name, time: new Date().toLocaleString('ar-EG'), id });
        closeModal();
        alert('تم الرفع بنجاح');
    }catch(err){ alert(err.message); }
    confirmBtn.disabled = false;
    fileInput.value = '';
};

onValue(tablesRef, (snap)=>{
    const data = snap.val();
    tablesContainer.innerHTML = '';
    if(!data){
        tablesContainer.appendChild(noTables);
        noTables.style.display = 'block';
        return;
    }
    Object.values(data).reverse().forEach(item=>{
        const div = document.createElement('div');
        div.className = 'pdf-card';
        div.innerHTML = `
            <iframe src="${item.url}"></iframe>
            <div class="pdf-info">
                <span>${item.name} - ${item.time}</span>
                <div>
                    <a href="${item.url}" target="_blank">فتح / طباعة</a>
                    <button class="delete-one" data-id="${item.id}">حذف</button>
                </div>
            </div>
        `;
        tablesContainer.appendChild(div);
    });
    tablesContainer.querySelectorAll('.delete-one').forEach(b=>{
        b.onclick = ()=> openModal('deleteOne', b.dataset.id);
    });
});