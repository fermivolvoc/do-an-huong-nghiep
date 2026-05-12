let groupData = null;
let membersData = [];
let tasks = [];
let currentUser = null;
let examDate = null;
let examDateString = "";
let timerInterval = null;

function showChooseStep() {
    document.getElementById("step-choose").classList.remove("hidden");
    document.getElementById("step-create").classList.add("hidden");
    document.getElementById("step-join").classList.add("hidden");
    clearErrors();
}

function showCreateForm() {
    document.getElementById("step-choose").classList.add("hidden");
    document.getElementById("step-create").classList.remove("hidden");
    clearErrors();
}

function showJoinForm() {
    if (!groupData) {
        document.getElementById("join-error").innerText = "Chưa có nhóm nào được tạo trên hệ thống!";
        document.getElementById("join-error").classList.remove("hidden");
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
    const purpose = document.getElementById("create-purpose").value.trim();
    const maxMembers = document.getElementById("create-max-members").value;
    const leaderName = document.getElementById("create-leader-name").value.trim();
    const leaderMssv = document.getElementById("create-leader-mssv").value.trim();
    const password = document.getElementById("create-password").value.trim();

    if (!purpose || !maxMembers || !leaderName || !leaderMssv || !password) {
        document.getElementById("create-error").classList.remove("hidden");
        return;
    }

    groupData = {
        purpose: purpose,
        maxMembers: parseInt(maxMembers),
        password: password
    };

    membersData = [];
    tasks = [];
    examDate = null;
    examDateString = "";

    membersData.push({
        name: leaderName,
        mssv: leaderMssv,
        role: "Trưởng nhóm",
        task: "Quản lý nhóm"
    });

    tasks.push({
        id: Date.now(),
        text: "Quản lý nhóm",
        assignee: leaderName,
        completed: false
    });

    currentUser = { name: leaderName, mssv: leaderMssv, role: "leader" };

    enterApp();
}

function handleJoinGroup() {
    const inputMssv = document.getElementById("join-mssv").value.trim();
    const inputPass = document.getElementById("join-password").value.trim();
    const errorText = document.getElementById("join-error");

    if (!inputMssv || !inputPass) {
        errorText.innerText = "Vui lòng nhập đủ thông tin!";
        errorText.classList.remove("hidden");
        return;
    }

    if (inputPass !== groupData.password) {
        errorText.innerText = "Mật khẩu nhóm không chính xác!";
        errorText.classList.remove("hidden");
        return;
    }

    const member = membersData.find(m => m.mssv === inputMssv);
    
    if (!member) {
        errorText.innerText = "Bạn không có trong danh sách nhóm";
        errorText.classList.remove("hidden");
        return;
    }

    if (member.role === "Trưởng nhóm") {
        currentUser = { name: member.name, mssv: member.mssv, role: "leader" };
    } else {
        currentUser = { name: member.name, mssv: member.mssv, role: "member" };
    }

    enterApp();
}

function handleLogout() {
    currentUser = null;
    document.getElementById("main-app").classList.add("hidden");
    document.getElementById("auth-overlay").classList.remove("hidden");
    
    document.getElementById("join-mssv").value = "";
    document.getElementById("join-password").value = "";
    
    showChooseStep();
    if (timerInterval) clearInterval(timerInterval);
}

function enterApp() {
    document.getElementById("auth-overlay").classList.add("hidden");
    document.getElementById("main-app").classList.remove("hidden");
    
    document.getElementById("header-title").innerText = groupData.purpose;
    document.getElementById("display-group-purpose").innerText = groupData.purpose;
    document.getElementById("setting-purpose").value = groupData.purpose;
    document.getElementById("setting-max-members").value = groupData.maxMembers;
    
    document.getElementById("display-user-name").innerText = `${currentUser.name} (${currentUser.role === 'leader' ? 'Trưởng nhóm' : 'Thành viên'})`;
    
    initAppPermissions();
    renderApp();
    
    if (examDate) {
        document.getElementById("exam-date-text").innerText = `Deadline: ${examDateString.replace("T", " ")}`;
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

    if (membersData.length >= groupData.maxMembers) {
        errorText.innerText = `Đã đạt giới hạn ${groupData.maxMembers} thành viên!`;
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

    const exists = membersData.find(m => m.mssv === mssv);
    if (exists) {
        errorText.innerText = "Mã sinh viên này đã tồn tại trong nhóm!";
        errorText.classList.remove("hidden");
        return;
    }

    membersData.push({
        name: name,
        mssv: mssv,
        role: "Thành viên",
        task: taskText
    });

    tasks.push({
        id: Date.now(),
        text: taskText,
        assignee: name,
        completed: false
    });

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
    document.getElementById("member-count-text").innerText = `(${membersData.length}/${groupData.maxMembers})`;
    const tbody = document.getElementById("member-tbody");
    tbody.innerHTML = "";
    
    membersData.forEach(m => {
        const tr = document.createElement("tr");
        
        let displayMssv = m.mssv;
        if (currentUser.role === 'member' && m.mssv !== currentUser.mssv) {
            displayMssv = maskMssv(m.mssv);
        }

        tr.innerHTML = `
            <td><strong>${m.name}</strong> ${m.role === 'Trưởng nhóm' ? '👑' : ''}</td>
            <td>${displayMssv}</td>
            <td>${m.task}</td>
        `;
        tbody.appendChild(tr);
    });
}

function renderTasks() {
    const taskList = document.getElementById("task-list");
    taskList.innerHTML = "";

    tasks.forEach(task => {
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
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        renderTasks();
    }
}

function editTask(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        const newText = prompt("Sửa tên nhiệm vụ:", task.text);
        if (newText !== null && newText.trim() !== "") {
            task.text = newText;
            
            const member = membersData.find(m => m.name === task.assignee);
            if (member) member.task = newText;

            renderTasks();
            renderMembersTable();
        }
    }
}

function updateProgress() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

    document.getElementById("progress-bar").style.width = percentage + "%";
    document.getElementById("progress-text").innerText = percentage + "% hoàn thành";
}

function updateTimer() {
    if (!examDate) return;
    
    const now = new Date().getTime();
    const distance = examDate - now;

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
    const defaultVal = examDateString ? examDateString : "2026-06-25T08:00:00";
    const newDate = prompt("Nhập deadline mới (Định dạng: YYYY-MM-DDTHH:MM:SS)\nVD: 2026-06-25T08:00:00", defaultVal);
    if (newDate) {
        const parsed = new Date(newDate).getTime();
        if (!isNaN(parsed)) {
            examDateString = newDate;
            examDate = parsed;
            document.getElementById("exam-date-text").innerText = `Deadline: ${examDateString.replace("T", " ")}`;
            updateTimer();
        } else {
            alert("Định dạng ngày không hợp lệ!");
        }
    }
}

function renderDocuments() {
    const docGrid = document.getElementById("doc-list");
    docGrid.innerHTML = "";

    membersData.forEach(m => {
        const docCard = document.createElement("div");
        docCard.classList.add("doc-card");
        
        const canUpload = (currentUser.role === 'leader') || (currentUser.name === m.name);
        
        docCard.innerHTML = `
            <h4>Tài liệu của: ${m.name}</h4>
            <p>File đã nộp: <i>Chưa có file</i></p>
            <input type="file" ${canUpload ? '' : 'disabled'} title="${canUpload ? 'Tải file lên' : 'Không có quyền upload vào mục của người khác'}">
        `;
        docGrid.appendChild(docCard);
    });
}

function updateGroupPurpose() {
    const newPurpose = document.getElementById("setting-purpose").value.trim();
    if (newPurpose) {
        groupData.purpose = newPurpose;
        document.getElementById("header-title").innerText = groupData.purpose;
        document.getElementById("display-group-purpose").innerText = groupData.purpose;
        alert("Cập nhật mục đích nhóm thành công!");
    }
}

function updateMaxMembers() {
    const newMax = parseInt(document.getElementById("setting-max-members").value);
    if (newMax >= membersData.length) {
        groupData.maxMembers = newMax;
        renderMembersTable();
        alert("Cập nhật số lượng thành viên thành công!");
    } else {
        alert("Số lượng tối đa không thể nhỏ hơn số thành viên hiện tại!");
        document.getElementById("setting-max-members").value = groupData.maxMembers;
    }
}

function changePassword() {
    const newPass = document.getElementById("new-password").value;
    if (newPass.trim() !== "") {
        groupData.password = newPass;
        alert("Đã đổi mật khẩu nhóm thành công!");
        document.getElementById("new-password").value = "";
    } else {
        alert("Mật khẩu không được để trống!");
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