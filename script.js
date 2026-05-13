const STORAGE_KEY = "teamWorkGroupsData";
const SESSION_KEY = "teamWorkCurrentSession";

let appData = JSON.parse(localStorage.getItem(STORAGE_KEY)) || { groups: {} };

let currentGroupId = null;
let currentGroup = null;
let currentUser = null;
let timerInterval = null;

function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
}

function saveSession(groupId, mssv) {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ groupId, mssv }));
}

function clearSession() {
    localStorage.removeItem(SESSION_KEY);
}

function generateGroupId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

function showChooseStep() {
    document.getElementById("step-choose").classList.remove("hidden");
    document.getElementById("step-create").classList.add("hidden");
    document.getElementById("step-join").classList.add("hidden");
    clearErrors();
}

function showCreateForm() {
    document.getElementById("step-choose").classList.add("hidden");
    document.getElementById("step-create").classList.remove("hidden");
    
    let newId = generateGroupId();
    while(appData.groups[newId]) {
        newId = generateGroupId();
    }
    document.getElementById("create-group-id").value = newId;
    
    clearErrors();
}

function showJoinForm() {
    if (Object.keys(appData.groups).length === 0) {
        alert("Chưa có nhóm nào được tạo trên hệ thống! Vui lòng tạo nhóm mới trước.");
        return;
    }
    document.getElementById("step-choose").classList.add("hidden");
    document.getElementById("step-join").classList.remove("hidden");
    clearErrors();
}

function clearErrors() {
    document.getElementById("create-error").classList.add("hidden");
    document.getElementById("join-error").classList.add("hidden");
    document.getElementById("add-member-error").classList.add("hidden");
}

function handleCreateGroup() {
    const groupId = document.getElementById("create-group-id").value.trim();
    const purpose = document.getElementById("create-purpose").value.trim();
    const maxMembers = document.getElementById("create-max-members").value;
    const leaderName = document.getElementById("create-leader-name").value.trim();
    const leaderMssv = document.getElementById("create-leader-mssv").value.trim();
    const errorText = document.getElementById("create-error");

    if (!groupId || !purpose || !maxMembers || !leaderName || !leaderMssv) {
        errorText.innerText = "Vui lòng điền đủ thông tin!";
        errorText.classList.remove("hidden");
        return;
    }

    if (appData.groups[groupId]) {
        errorText.innerText = "Mã nhóm này đã tồn tại! Vui lòng chọn mã khác.";
        errorText.classList.remove("hidden");
        return;
    }

    appData.groups[groupId] = {
        purpose: purpose,
        maxMembers: parseInt(maxMembers),
        examDateString: "",
        examDate: null,
        members: [{
            name: leaderName,
            mssv: leaderMssv,
            role: "Trưởng nhóm",
            task: "Quản lý nhóm",
            uploadedFile: ""
        }],
        tasks: [{
            id: Date.now(),
            text: "Quản lý nhóm",
            assignee: leaderName,
            completed: false
        }]
    };

    saveData();
    saveSession(groupId, leaderMssv);

    currentGroupId = groupId;
    currentGroup = appData.groups[groupId];
    currentUser = { name: leaderName, mssv: leaderMssv, role: "leader" };

    enterApp();
}

function handleJoinGroup() {
    const inputGroupId = document.getElementById("join-group-id").value.trim();
    const inputMssv = document.getElementById("join-mssv").value.trim();
    const errorText = document.getElementById("join-error");

    if (!inputGroupId || !inputMssv) {
        errorText.innerText = "Vui lòng nhập đủ thông tin!";
        errorText.classList.remove("hidden");
        return;
    }

    if (!appData.groups[inputGroupId]) {
        errorText.innerText = "Mã nhóm không tồn tại!";
        errorText.classList.remove("hidden");
        return;
    }

    const targetGroup = appData.groups[inputGroupId];

    const member = targetGroup.members.find(m => m.mssv === inputMssv);
    if (!member) {
        errorText.innerText = "Bạn không có trong danh sách nhóm này!";
        errorText.classList.remove("hidden");
        return;
    }

    currentGroupId = inputGroupId;
    currentGroup = targetGroup;

    if (member.role === "Trưởng nhóm") {
        currentUser = { name: member.name, mssv: member.mssv, role: "leader" };
    } else {
        currentUser = { name: member.name, mssv: member.mssv, role: "member" };
    }

    saveSession(inputGroupId, inputMssv);
    enterApp();
}

function handleLogout() {
    currentGroupId = null;
    currentGroup = null;
    currentUser = null;
    
    document.getElementById("main-app").classList.add("hidden");
    document.getElementById("auth-overlay").classList.remove("hidden");
    
    document.getElementById("join-group-id").value = "";
    document.getElementById("join-mssv").value = "";
    
    clearSession();
    showChooseStep();
    if (timerInterval) clearInterval(timerInterval);
}

function handleLeaveGroup() {
    if (currentUser.role === 'leader') {
        if (confirm("CẢNH BÁO: Bạn là Trưởng nhóm! Việc thoát nhóm sẽ XÓA TOÀN BỘ dữ liệu của nhóm này vĩnh viễn. Bạn có chắc chắn muốn xóa nhóm không?")) {
            delete appData.groups[currentGroupId];
            saveData();
            clearSession();
            handleLogout();
            alert("Đã xóa nhóm thành công!");
        }
    } else {
        if (confirm("Bạn có chắc chắn muốn thoát khỏi nhóm này không? Dữ liệu và nhiệm vụ của bạn sẽ bị xóa.")) {
            currentGroup.members = currentGroup.members.filter(m => m.mssv !== currentUser.mssv);
            currentGroup.tasks = currentGroup.tasks.filter(t => t.assignee !== currentUser.name);
            
            saveData();
            clearSession();
            handleLogout();
            alert("Bạn đã thoát khỏi nhóm thành công.");
        }
    }
}

function kickMember(mssv) {
    if (confirm("Bạn có chắc chắn muốn xóa thành viên này khỏi nhóm?")) {
        const memberToRemove = currentGroup.members.find(m => m.mssv === mssv);
        if (memberToRemove) {
            currentGroup.members = currentGroup.members.filter(m => m.mssv !== mssv);
            currentGroup.tasks = currentGroup.tasks.filter(t => t.assignee !== memberToRemove.name);
            saveData();
            renderMembersTable();
            renderTasks();
            renderDocuments();
        }
    }
}

function enterApp() {
    document.getElementById("auth-overlay").classList.add("hidden");
    document.getElementById("main-app").classList.remove("hidden");
    
    document.getElementById("header-title").innerText = currentGroup.purpose;
    document.getElementById("display-group-id").innerText = currentGroupId;
    document.getElementById("display-group-purpose").innerText = currentGroup.purpose;
    document.getElementById("setting-purpose").value = currentGroup.purpose;
    document.getElementById("setting-max-members").value = currentGroup.maxMembers;
    
    document.getElementById("display-user-name").innerText = `${currentUser.name} (${currentUser.role === 'leader' ? 'Trưởng nhóm' : 'Thành viên'})`;
    
    initAppPermissions();
    renderApp();
    
    if (currentGroup.examDate) {
        document.getElementById("exam-date-text").innerText = `Deadline: ${currentGroup.examDateString.replace("T", " ")}`;
    } else {
        document.getElementById("exam-date-text").innerText = `Deadline: Chưa thiết lập`;
        document.getElementById("timer").innerHTML = "00:00:00:00";
    }
    
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(updateTimer, 1000);
    
    document.querySelectorAll('#sidebar-nav li').forEach(nav => nav.classList.remove('active'));
    document.querySelector('#sidebar-nav li[data-target="dashboard-view"]').classList.add('active');
    document.querySelectorAll('.view-section').forEach(section => section.classList.add('hidden'));
    document.getElementById("dashboard-view").classList.remove('hidden');
}

function initAppPermissions() {
    const leaderElements = document.querySelectorAll(".leader-only");
    
    if (currentUser.role === "member") {
        leaderElements.forEach(el => el.classList.add("hidden"));
        document.getElementById("settings-content").classList.add("hidden");
        document.getElementById("settings-restricted").classList.remove("hidden");
    } else {
        leaderElements.forEach(el => el.classList.remove("hidden"));
        document.getElementById("settings-content").classList.remove("hidden");
        document.getElementById("settings-restricted").classList.add("hidden");
    }
}

function renderApp() {
    renderTasks();
    renderMembersTable();
    renderDocuments();
    updateTimer();
}

function addMember() {
    if (currentUser.role !== 'leader') return;
    
    const errorText = document.getElementById("add-member-error");
    errorText.classList.add("hidden");

    if (currentGroup.members.length >= currentGroup.maxMembers) {
        errorText.innerText = `Đã đạt giới hạn ${currentGroup.maxMembers} thành viên!`;
        errorText.classList.remove("hidden");
        return;
    }

    const name = document.getElementById("new-member-name").value.trim();
    const mssv = document.getElementById("new-member-mssv").value.trim();
    const taskText = document.getElementById("new-member-task").value.trim();

    if (!name || !mssv || !taskText) {
        errorText.innerText = "Vui lòng nhập đủ thông tin!";
        errorText.classList.remove("hidden");
        return;
    }

    const exists = currentGroup.members.find(m => m.mssv === mssv);
    if (exists) {
        errorText.innerText = "Mã sinh viên này đã tồn tại trong nhóm!";
        errorText.classList.remove("hidden");
        return;
    }

    currentGroup.members.push({
        name: name,
        mssv: mssv,
        role: "Thành viên",
        task: taskText,
        uploadedFile: ""
    });

    currentGroup.tasks.push({
        id: Date.now(),
        text: taskText,
        assignee: name,
        completed: false
    });

    saveData();

    document.getElementById("new-member-name").value = "";
    document.getElementById("new-member-mssv").value = "";
    document.getElementById("new-member-task").value = "";

    renderMembersTable();
    renderTasks();
    renderDocuments();
}

function maskMssv(mssv) {
    if (mssv.length <= 4) return "****";
    return mssv.substring(0, mssv.length - 4) + "****";
}

function renderMembersTable() {
    document.getElementById("member-count-text").innerText = `(${currentGroup.members.length}/${currentGroup.maxMembers})`;
    const tbody = document.getElementById("member-tbody");
    tbody.innerHTML = "";
    
    currentGroup.members.forEach(m => {
        const tr = document.createElement("tr");
        
        let displayMssv = m.mssv;
        if (currentUser.role === 'member' && m.mssv !== currentUser.mssv) {
            displayMssv = maskMssv(m.mssv);
        }

        tr.innerHTML = `
            <td><strong>${m.name}</strong> ${m.role === 'Trưởng nhóm' ? '👑' : ''}</td>
            <td>${displayMssv}</td>
            <td>${m.task}</td>
            <td>${currentUser.role === 'leader' && m.role !== 'Trưởng nhóm' ? `<button class="kick-btn" onclick="kickMember('${m.mssv}')">Đuổi</button>` : '-'}</td>
        `;
        tbody.appendChild(tr);
    });
}

function renderTasks() {
    const taskList = document.getElementById("task-list");
    taskList.innerHTML = "";

    currentGroup.tasks.forEach(task => {
        const li = document.createElement("li");
        if (task.completed) li.classList.add("completed");

        const infoDiv = document.createElement("div");
        infoDiv.classList.add("task-info");

        const canEditCheck = (currentUser.role === 'leader') || (currentUser.name === task.assignee);
        
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = task.completed;
        checkbox.disabled = !canEditCheck;
        checkbox.onchange = () => toggleTask(task.id);

        const textSpan = document.createElement("span");
        textSpan.innerText = task.text;

        infoDiv.appendChild(checkbox);
        infoDiv.appendChild(textSpan);
        
        const actionsDiv = document.createElement("div");
        actionsDiv.classList.add("task-actions");

        const assigneeSpan = document.createElement("span");
        assigneeSpan.classList.add("task-assignee");
        assigneeSpan.innerText = task.assignee;

        actionsDiv.appendChild(assigneeSpan);

        if (currentUser.role === 'leader') {
            const editBtn = document.createElement("button");
            editBtn.classList.add("edit-btn");
            editBtn.innerText = "Sửa";
            editBtn.onclick = () => editTask(task.id);
            actionsDiv.appendChild(editBtn);
        }
        
        li.appendChild(infoDiv);
        li.appendChild(actionsDiv);
        
        taskList.appendChild(li);
    });

    updateProgress();
}

function toggleTask(id) {
    const task = currentGroup.tasks.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        saveData();
        renderTasks();
    }
}

function editTask(id) {
    const task = currentGroup.tasks.find(t => t.id === id);
    if (task) {
        const newText = prompt("Sửa tên nhiệm vụ:", task.text);
        if (newText !== null && newText.trim() !== "") {
            task.text = newText;
            
            const member = currentGroup.members.find(m => m.name === task.assignee);
            if (member) member.task = newText;

            saveData();
            renderTasks();
            renderMembersTable();
        }
    }
}

function updateProgress() {
    const total = currentGroup.tasks.length;
    const completed = currentGroup.tasks.filter(t => t.completed).length;
    const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

    document.getElementById("progress-bar").style.width = percentage + "%";
    document.getElementById("progress-text").innerText = percentage + "% hoàn thành";
}

function updateTimer() {
    if (!currentGroup.examDate) return;
    
    const now = new Date().getTime();
    const distance = currentGroup.examDate - now;

    if (distance < 0) {
        document.getElementById("timer").innerHTML = "ĐÃ ĐẾN DEADLINE!";
        return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    document.getElementById("timer").innerHTML = 
        String(days).padStart(2, '0') + "d : " + 
        String(hours).padStart(2, '0') + "h : " + 
        String(minutes).padStart(2, '0') + "m : " + 
        String(seconds).padStart(2, '0') + "s";
}

function editExamDate() {
    const defaultVal = currentGroup.examDateString ? currentGroup.examDateString : "2026-06-25T08:00:00";
    const newDate = prompt("Nhập deadline mới (Định dạng: YYYY-MM-DDTHH:MM:SS)\nVD: 2026-06-25T08:00:00", defaultVal);
    if (newDate) {
        const parsed = new Date(newDate).getTime();
        if (!isNaN(parsed)) {
            currentGroup.examDateString = newDate;
            currentGroup.examDate = parsed;
            saveData();

            document.getElementById("exam-date-text").innerText = `Deadline: ${currentGroup.examDateString.replace("T", " ")}`;
            updateTimer();
        } else {
            alert("Định dạng ngày không hợp lệ!");
        }
    }
}

function renderDocuments() {
    const docGrid = document.getElementById("doc-list");
    docGrid.innerHTML = "";

    currentGroup.members.forEach((m, index) => {
        const docCard = document.createElement("div");
        docCard.classList.add("doc-card");
        
        const canUpload = (currentUser.role === 'leader') || (currentUser.name === m.name);
        
        const fileDisplay = m.uploadedFile ? `<strong style="color: #38bdf8;">${m.uploadedFile}</strong>` : `<i>Chưa có file</i>`;
        
        docCard.innerHTML = `
            <h4>Tài liệu của: ${m.name}</h4>
            <p style="margin-bottom: 10px;">File đã nộp: ${fileDisplay}</p>
            <div style="display: flex; gap: 10px; align-items: center;">
                <input type="file" id="file-input-${index}" ${canUpload ? '' : 'disabled'} title="${canUpload ? 'Chọn file' : 'Không có quyền'}">
                <button class="action-btn" style="width: auto; padding: 6px 15px;" onclick="handleUpload(${index})" ${canUpload ? '' : 'disabled'}>Nộp</button>
            </div>
        `;
        docGrid.appendChild(docCard);
    });
}

function handleUpload(memberIndex) {
    const fileInput = document.getElementById(`file-input-${memberIndex}`);
    
    if (fileInput.files.length > 0) {
        const fileName = fileInput.files[0].name;
        currentGroup.members[memberIndex].uploadedFile = fileName;
        saveData();
        renderDocuments();
        alert(`Đã nộp file "${fileName}" thành công!`);
    } else {
        alert("Vui lòng chọn một file trước khi bấm Nộp!");
    }
}

function updateGroupPurpose() {
    const newPurpose = document.getElementById("setting-purpose").value.trim();
    if (newPurpose) {
        currentGroup.purpose = newPurpose;
        saveData();

        document.getElementById("header-title").innerText = currentGroup.purpose;
        document.getElementById("display-group-purpose").innerText = currentGroup.purpose;
        alert("Cập nhật mục đích nhóm thành công!");
    }
}

function updateMaxMembers() {
    const newMax = parseInt(document.getElementById("setting-max-members").value);
    if (newMax >= currentGroup.members.length) {
        currentGroup.maxMembers = newMax;
        saveData();
        renderMembersTable();
        alert("Cập nhật số lượng thành viên thành công!");
    } else {
        alert("Số lượng tối đa không thể nhỏ hơn số thành viên hiện tại!");
        document.getElementById("setting-max-members").value = currentGroup.maxMembers;
    }
}

const navItems = document.querySelectorAll('#sidebar-nav li');
const viewSections = document.querySelectorAll('.view-section');

navItems.forEach(item => {
    item.addEventListener('click', () => {
        navItems.forEach(nav => nav.classList.remove('active'));
        item.classList.add('active');
        
        viewSections.forEach(section => section.classList.add('hidden'));
        
        const targetId = item.getAttribute('data-target');
        document.getElementById(targetId).classList.remove('hidden');
    });
});

function checkSession() {
    const sessionStr = localStorage.getItem(SESSION_KEY);
    if (sessionStr) {
        const sessionData = JSON.parse(sessionStr);
        if (appData.groups[sessionData.groupId]) {
            const targetGroup = appData.groups[sessionData.groupId];
            const member = targetGroup.members.find(m => m.mssv === sessionData.mssv);
            if (member) {
                currentGroupId = sessionData.groupId;
                currentGroup = targetGroup;
                currentUser = { 
                    name: member.name, 
                    mssv: member.mssv, 
                    role: member.role === "Trưởng nhóm" ? "leader" : "member" 
                };
                enterApp();
                return;
            }
        }
    }
    document.getElementById("auth-overlay").classList.remove("hidden");
    document.getElementById("main-app").classList.add("hidden");
}

checkSession();
