const API_URL = "https://script.google.com/macros/s/AKfycbyq06hiIei6skxBTZUIKG3-eQB1dPqCw0kWJve-CLhP3D71JKtT4Ir0shY0yDPvgGyu/exec"; 

let siteData = { papers: [], notices: [] }; 
let currentUser = "";
let currentUserPassword = ""; 
let currentUserRole = "user"; 
let currentUserBookmarks = []; 
let isLoginMode = true;

const appContent = document.getElementById('appContent');
const searchWrapper = document.getElementById('searchWrapper');
const searchBar = document.getElementById('searchBar');
const noticeBoard = document.getElementById('noticeBoard');

// 1. FETCH DATA FROM DATABASE
async function fetchPapersFromDatabase() {
    searchWrapper.style.display = 'none'; 
    noticeBoard.style.display = 'none';
    
    appContent.innerHTML = `
        <div style="text-align: center; margin-top: 80px; color: var(--accent-blue);">
            <i class="fa-solid fa-spinner fa-spin fa-3x"></i>
            <h2 style="margin-top: 20px;">Loading Database...</h2>
            <p style="color: var(--text-muted);">Please wait a moment while we fetch the data.</p>
        </div>
    `;
    
    try {
        let response = await fetch(API_URL);
        let result = await response.json();
        
        siteData.papers = result.papers || [];
        siteData.notices = result.notices || [];

        renderNoticeBoard();
        searchBar.value = ""; 
        renderHome(); 

    } catch (error) {
        appContent.innerHTML = `
            <div style="text-align: center; margin-top: 80px; color: #f87171;">
                <i class="fa-solid fa-triangle-exclamation fa-3x"></i>
                <h2 style="margin-top: 20px;">Connection Error!</h2>
                <p>Could not connect to the database.</p>
                <button class="back-btn" style="margin-top:20px; float:none;" onclick="fetchPapersFromDatabase()">
                    <i class="fa-solid fa-rotate-right"></i> Try Again
                </button>
            </div>
        `;
    }
}

// 2. RENDER NOTICES
function renderNoticeBoard() {
    if (siteData.notices.length === 0) {
        noticeBoard.style.display = 'none';
        return;
    }
    let html = `
        <div class="notice-title"><i class="fa-solid fa-bullhorn"></i> Important Announcements</div>
        <ul style="margin: 0; padding-left: 20px;">
    `;
    siteData.notices.forEach(notice => {
        html += `<li class="notice-item">${notice}</li>`;
    });
    html += `</ul>`;
    noticeBoard.innerHTML = html;
    noticeBoard.style.display = 'block';
}

// 3. RENDER HOME (FACULTIES)
function renderHome() {
    searchWrapper.style.display = 'flex';
    renderNoticeBoard();
    
    let html = `
        <div class="welcome-section" style="width: 100%; text-align: center; margin-bottom: 10px;">
            <h2 style="color: var(--accent-blue); font-size: 1.8em;"><i class="fa-solid fa-building-columns"></i> Select Your Faculty</h2>
        </div>
        <div class="grid-container">`;
    
    let faculties = [...new Set(siteData.papers.map(p => p.faculty ? p.faculty.toString().trim() : ""))].filter(Boolean);

    if (faculties.length === 0) {
        html = '<h3 style="text-align:center; width:100%; color:var(--text-muted); margin-top:50px;">No faculties found.</h3>';
    } else {
        faculties.forEach(faculty => {
            html += `
                <div class="tile" onclick="renderLevels('${faculty.replace(/'/g, "\\'")}')">
                    <i class="fa-solid fa-folder-open"></i>
                    <h3>${faculty}</h3>
                </div>
            `;
        });
    }
    html += '</div>';
    appContent.innerHTML = html;
}

// 4. RENDER LEVELS
function renderLevels(faculty) {
    searchWrapper.style.display = 'none';
    noticeBoard.style.display = 'none';
    
    let filteredPapers = siteData.papers.filter(p => p.faculty && p.faculty.toString().trim() === faculty.toString().trim());
    let levels = [...new Set(filteredPapers.map(p => p.level ? p.level.toString().trim() : ""))].filter(Boolean);

    let html = `
        <div style="max-width: 1100px; margin: 0 auto 20px auto;">
            <div class="back-btn" onclick="renderHome()"><i class="fa-solid fa-arrow-left"></i> Back to Faculties</div>
        </div>
        <div class="welcome-section" style="width: 100%; text-align: center; margin-bottom: 10px;">
            <h2 style="color: var(--accent-blue); font-size: 1.8em;">${faculty}</h2>
        </div>
        <div class="grid-container">`;
    
    levels.forEach(level => {
        html += `
            <div class="tile" onclick="renderSubjects('${faculty.replace(/'/g, "\\'")}', '${level.replace(/'/g, "\\'")}')">
                <i class="fa-solid fa-layer-group"></i>
                <h3>${level}</h3>
            </div>
        `;
    });
    html += '</div>';
    appContent.innerHTML = html;
}

// 5. RENDER SUBJECTS (COURSE CODES)
function renderSubjects(faculty, level) {
    searchWrapper.style.display = 'none';
    noticeBoard.style.display = 'none';
    
    let filteredPapers = siteData.papers.filter(p => 
        p.faculty && p.faculty.toString().trim() === faculty.toString().trim() && 
        p.level && p.level.toString().trim() === level.toString().trim()
    );

    let uniqueCodes = [...new Set(filteredPapers.map(p => p.code ? p.code.toString().trim() : ""))].filter(Boolean);

    let html = `
        <div style="max-width: 1100px; margin: 0 auto 20px auto;">
            <div class="back-btn" onclick="renderLevels('${faculty.replace(/'/g, "\\'")}')"><i class="fa-solid fa-arrow-left"></i> Back to Levels</div>
        </div>
        <div class="welcome-section" style="width: 100%; text-align: center; margin-bottom: 10px;">
            <h2 style="color: var(--accent-blue); font-size: 1.8em;">${level} - Select Subject Code</h2>
        </div>
        <div class="grid-container">`;
    
    uniqueCodes.forEach(code => {
        html += `
            <div class="tile" onclick="renderPapersList('${faculty.replace(/'/g, "\\'")}', '${level.replace(/'/g, "\\'")}', '${code.replace(/'/g, "\\'")}')">
                <i class="fa-solid fa-book"></i>
                <h3>${code}</h3>
            </div>
        `;
    });
    html += '</div>';
    appContent.innerHTML = html;
}

// 5.1 RENDER PAPERS LIST
function renderPapersList(faculty, level, code) {
    searchWrapper.style.display = 'none';
    noticeBoard.style.display = 'none';

    let filteredPapers = siteData.papers.filter(p => 
        p.faculty && p.faculty.toString().trim() === faculty.toString().trim() && 
        p.level && p.level.toString().trim() === level.toString().trim() &&
        p.code && p.code.toString().trim() === code.toString().trim()
    );

    let html = `
        <div style="max-width: 1100px; margin: 0 auto 20px auto;">
            <div class="back-btn" onclick="renderSubjects('${faculty.replace(/'/g, "\\'")}', '${level.replace(/'/g, "\\'")}')"><i class="fa-solid fa-arrow-left"></i> Back to Course Codes</div>
        </div>
        <div class="welcome-section" style="width: 100%; text-align: center; margin-bottom: 10px;">
            <h2 style="color: var(--accent-blue); font-size: 1.8em;">Papers for ${code}</h2>
        </div>
        <div class="grid-container">`;

    filteredPapers.forEach(subject => {
        let isBookmarked = currentUserBookmarks.includes(subject.code.toString().trim());
        let bookmarkClass = isBookmarked ? "active" : "";
        let starIcon = isBookmarked ? "fa-solid fa-star" : "fa-regular fa-star";

        html += `
            <div class="tile" style="position:relative;">
                <button class="bookmark-icon-btn ${bookmarkClass}" onclick="toggleBookmark('${subject.code.replace(/'/g, "\\'")}', event)">
                    <i class="${starIcon}"></i>
                </button>
                <div onclick="renderPaperView('${faculty.replace(/'/g, "\\'")}', '${level.replace(/'/g, "\\'")}', '${subject.code.replace(/'/g, "\\'")}', '${subject.name.replace(/'/g, "\\'")}')">
                    <i class="fa-regular fa-file-pdf"></i>
                    <h3>${subject.name}</h3>
                    <div class="stats-badge" style="margin-top:10px;"><i class="fa-solid fa-download"></i> ${subject.downloads} Downloads</div>
                </div>
            </div>
        `;
    });
    html += '</div>';
    appContent.innerHTML = html;
}

// 6. RENDER PAPER VIEW
function renderPaperView(faculty, level, code, name) {
    searchWrapper.style.display = 'none';
    noticeBoard.style.display = 'none';
    
    let subject = siteData.papers.find(p => p.code.toString().trim() === code.toString().trim() && p.name.toString().trim() === name.toString().trim());
    if(!subject) return;

    let isBookmarked = currentUserBookmarks.includes(subject.code.toString().trim());
    let bookmarkText = isBookmarked ? "Remove Bookmark" : "Save Bookmark";
    let starIcon = isBookmarked ? "fa-solid fa-star" : "fa-regular fa-star";

    let embedLink = subject.pdf;
    if (embedLink && embedLink.includes('/view')) {
        embedLink = embedLink.replace(/\/view.*$/, "/preview");
    }

    let html = `
        <div style="max-width: 1000px; margin: 0 auto 20px auto; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
            <div class="back-btn" onclick="renderPapersList('${faculty.replace(/'/g, "\\'")}', '${level.replace(/'/g, "\\'")}', '${code.replace(/'/g, "\\'")}')"><i class="fa-solid fa-arrow-left"></i> Back to Papers</div>
            <button class="portal-nav-btn" onclick="toggleBookmark('${subject.code.replace(/'/g, "\\'")}', null, true, '${faculty}', '${level}', '${subject.name.replace(/'/g, "\\'")}')">
                <i class="${starIcon}" style="color:#f59e0b;"></i> ${bookmarkText}
            </button>
        </div>
        <div class="paper-view">
            <h2>${subject.code} - ${subject.name}</h2>
            <div class="stats-badge" style="margin-bottom:15px; font-size:1em; padding:6px 14px;"><i class="fa-solid fa-download"></i> Total Downloads: ${subject.downloads}</div>
            <iframe src="${embedLink}"></iframe>
            <br>
            <a href="${subject.pdf}" target="_blank" class="download-btn" onclick="trackDownload('${subject.code.replace(/'/g, "\\'")}', '${subject.name.replace(/'/g, "\\'")}')">
                <i class="fa-solid fa-cloud-arrow-down"></i> Download PDF
            </a>
        </div>
    `;
    appContent.innerHTML = html;
}

// TRACK DOWNLOAD
function trackDownload(code, name) {
    fetch(API_URL + "?action=download&code=" + encodeURIComponent(code) + "&name=" + encodeURIComponent(name));
    let paper = siteData.papers.find(p => p.code.toString().trim() === code.toString().trim() && p.name.toString().trim() === name.toString().trim());
    if (paper) paper.downloads = (parseInt(paper.downloads) || 0) + 1;
}

// TOGGLE BOOKMARK
async function toggleBookmark(code, event, refreshView = false, faculty = '', level = '', name = '') {
    if(event) event.stopPropagation(); 
    
    const payload = { action: "toggleBookmark", username: currentUser, code: code };
    
    if (currentUserBookmarks.includes(code)) {
        currentUserBookmarks = currentUserBookmarks.filter(c => c !== code);
    } else {
        currentUserBookmarks.push(code);
    }
    
    if (refreshView) {
        renderPaperView(faculty, level, code, name);
    } else if (searchWrapper.style.display === 'flex' && searchBar.value !== "") {
        searchPaper();
    } else {
        let p = siteData.papers.find(paper => paper.code.toString().trim() === code.toString().trim());
        if(p) renderPapersList(p.faculty, p.level, p.code);
    }

    try {
        await fetch(API_URL, {
            method: 'POST',
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify(payload)
        });
    } catch (e) { console.log("Bookmark saved in background."); }
}

// RENDER BOOKMARKS
function renderBookmarks() {
    searchWrapper.style.display = 'none';
    noticeBoard.style.display = 'none';

    let html = `
        <div style="max-width: 1100px; margin: 0 auto 20px auto;">
            <div class="back-btn" onclick="renderHome()"><i class="fa-solid fa-arrow-left"></i> Back to Home</div>
        </div>
        <div class="welcome-section" style="width: 100%; text-align: center; margin-bottom: 10px;">
            <h2 style="color: #f59e0b; font-size: 1.8em;"><i class="fa-solid fa-star"></i> My Saved Papers</h2>
        </div>
        <div class="grid-container">`;

    let savedPapers = siteData.papers.filter(p => currentUserBookmarks.includes(p.code.toString().trim()));

    if (savedPapers.length === 0) {
        html += `<h4 style="text-align:center; width:100%; color:var(--text-muted); margin-top:40px;">You haven't saved any papers yet. Click the star icon on any paper to save it here.</h4>`;
    } else {
        savedPapers.forEach(subject => {
            html += `
                <div class="tile" style="position:relative;">
                    <button class="bookmark-icon-btn active" onclick="toggleBookmark('${subject.code.replace(/'/g, "\\'")}', event); setTimeout(renderBookmarks, 150);">
                        <i class="fa-solid fa-star"></i>
                    </button>
                    <div onclick="renderPaperView('${subject.faculty.replace(/'/g, "\\'")}', '${subject.level.replace(/'/g, "\\'")}', '${subject.code.replace(/'/g, "\\'")}', '${subject.name.replace(/'/g, "\\'")}')">
                        <i class="fa-regular fa-file-pdf"></i>
                        <h3>${subject.code}</h3>
                        <p>${subject.name}</p>
                        <p style="font-size:0.8em; color:var(--accent-blue); margin-top:8px;">${subject.faculty} | ${subject.level}</p>
                    </div>
                </div>
            `;
        });
    }
    html += '</div>';
    appContent.innerHTML = html;
}

// SEARCH FUNCTION
function searchPaper() {
    let input = searchBar.value.toUpperCase();
    if (input === "") { renderHome(); return; }
    
    let html = '<div class="grid-container">';
    let found = false;
    
    siteData.papers.forEach(subject => {
        if (subject.code.toUpperCase().includes(input) || subject.name.toUpperCase().includes(input)) {
            found = true;
            let isBookmarked = currentUserBookmarks.includes(subject.code.toString().trim());
            let bookmarkClass = isBookmarked ? "active" : "";
            let starIcon = isBookmarked ? "fa-solid fa-star" : "fa-regular fa-star";

            html += `
                <div class="tile" style="position:relative;">
                    <button class="bookmark-icon-btn ${bookmarkClass}" onclick="toggleBookmark('${subject.code.replace(/'/g, "\\'")}', event)">
                        <i class="${starIcon}"></i>
                    </button>
                    <div onclick="renderPaperView('${subject.faculty.replace(/'/g, "\\'")}', '${subject.level.replace(/'/g, "\\'")}', '${subject.code.replace(/'/g, "\\'")}', '${subject.name.replace(/'/g, "\\'")}')">
                        <i class="fa-regular fa-file-pdf"></i>
                        <h3>${subject.code}</h3>
                        <p>${subject.name}</p>
                        <p style="font-size: 0.8em; margin-top:12px; color:var(--accent-blue);">${subject.faculty} | ${subject.level}</p>
                    </div>
                </div>
            `;
        }
    });
    html += '</div>';
    
    if (!found) {
        html = `<div style="text-align:center; width:100%; margin-top:40px;">
                    <i class="fa-solid fa-circle-exclamation" style="font-size:2.5em; color:#f87171; margin-bottom:15px;"></i>
                    <p style="color:#f87171; font-size:1.2em;">No papers found</p>
                </div>`;
    }
    appContent.innerHTML = html;
}

// ADMIN PANEL
function openAdmin() {
    if (currentUserRole !== "admin") { alert("Access Denied!"); return; }
    searchWrapper.style.display = 'none';
    noticeBoard.style.display = 'none';
    
    appContent.innerHTML = `
        <div class="admin-panel">
            <h2 style="text-align:center; color: var(--accent-blue); margin-bottom: 20px;"><i class="fa-solid fa-plus"></i> Add New Past Paper</h2>
            <form id="addPaperForm" onsubmit="submitNewPaper(event)">
                <div class="form-group"><label>Faculty</label><input type="text" id="f_faculty" required placeholder="e.g., Engineering"></div>
                <div class="form-group"><label>Level</label><input type="text" id="f_level" required placeholder="e.g., Level 3"></div>
                <div class="form-group"><label>Course Code</label><input type="text" id="f_code" required placeholder="e.g., EEI3346"></div>
                <div class="form-group"><label>Course Name</label><input type="text" id="f_name" required placeholder="e.g., Web Development"></div>
                <div class="form-group"><label>PDF Link</label><input type="url" id="f_pdf" required placeholder="Google Drive Link"></div>
                <button type="submit" class="download-btn" style="width:100%; justify-content:center;">Save Paper</button>
            </form>
            <p id="formStatus" style="text-align:center; margin-top:10px; font-weight:bold;"></p>
            
            <hr style="border: 0; border-top: 1px solid var(--border-color); margin: 30px 0;">
            
            <h2 style="text-align:center; color: #f59e0b; margin-bottom: 20px;"><i class="fa-solid fa-bullhorn"></i> Post New Notice</h2>
            <form id="addNoticeForm" onsubmit="submitNewNotice(event)">
                <div class="form-group">
                    <label>Notice Content</label>
                    <textarea id="f_notice" required rows="3" placeholder="Type announcement for students..."></textarea>
                </div>
                <button type="submit" class="download-btn" style="width:100%; justify-content:center; background:linear-gradient(135deg, #f59e0b 0%, #d97706 100%);">Publish Notice</button>
            </form>
            <p id="noticeFormStatus" style="text-align:center; margin-top:10px; font-weight:bold;"></p>

            <button class="back-btn" style="width:100%; margin-top:30px; justify-content:center;" onclick="fetchPapersFromDatabase()">Back to Home</button>
        </div>
    `;
}

async function submitNewPaper(e) {
    e.preventDefault();
    let status = document.getElementById('formStatus');
    status.innerText = "Saving... Please wait."; status.style.color = "var(--accent-blue)";
    
    let payload = {
        action: "add",
        admin_user: currentUser,
        admin_pass: currentUserPassword,
        faculty: document.getElementById('f_faculty').value,
        level: document.getElementById('f_level').value,
        code: document.getElementById('f_code').value,
        name: document.getElementById('f_name').value,
        pdf: document.getElementById('f_pdf').value
    };
        
    try {
        let response = await fetch(API_URL, {
            method: 'POST',
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify(payload)
        });
        let result = await response.json();
        
        if (result.status === "success") {
            status.innerText = result.message; status.style.color = "var(--accent-green)";
            document.getElementById('addPaperForm').reset();
        } else {
            status.innerText = result.message; status.style.color = "#f87171";
        }
    } catch(err) {
        status.innerText = "Connection Error! Database update failed."; status.style.color = "#f87171";
    }
}

async function submitNewNotice(e) {
    e.preventDefault();
    let status = document.getElementById('noticeFormStatus');
    status.innerText = "Publishing... Please wait."; status.style.color = "var(--accent-blue)";
    
    let payload = {
        action: "addNotice",
        admin_user: currentUser,
        admin_pass: currentUserPassword,
        text: document.getElementById('f_notice').value
    };
        
    try {
        let response = await fetch(API_URL, {
            method: 'POST',
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify(payload)
        });
        let result = await response.json();
        
        if (result.status === "success") {
            status.innerText = result.message; status.style.color = "var(--accent-green)";
            document.getElementById('addNoticeForm').reset();
        } else {
            status.innerText = result.message; status.style.color = "#f87171";
        }
    } catch(err) {
        status.innerText = "Connection Error! Notice publication failed."; status.style.color = "#f87171";
    }
}

// AUTH SYSTEM
function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    document.getElementById('authTitle').innerText = isLoginMode ? "Portal Login" : "Portal Register";
    document.getElementById('authBtn').innerText = isLoginMode ? "Login" : "Register";
    document.getElementById('toggleAuthText').innerText = isLoginMode ? "Don't have an account?" : "Already have an account?";
    document.getElementById('toggleAuthLink').innerText = isLoginMode ? " Register here" : " Login here";
    document.getElementById('contactGroup').style.display = isLoginMode ? "none" : "flex";
    document.getElementById('auth_contact').required = !isLoginMode;
    document.getElementById('authStatus').innerText = "";
    document.getElementById('authForm').reset();
}

function handleForgotPassword() {
    let enteredUser = document.getElementById('auth_user').value.trim();
    let whatsappNumber = "94784293548"; 
    let message = "Hi Admin, I forgot my password for OUSL Past Paper Portal.";
    if (enteredUser) { message += " My username is: " + enteredUser; }
    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`, '_blank');
}

async function handleAuth(e) {
    e.preventDefault();
    const username = document.getElementById('auth_user').value;
    const password = document.getElementById('auth_pass').value;
    const contact = document.getElementById('auth_contact').value;
    const statusText = document.getElementById('authStatus');
    
    statusText.innerText = isLoginMode ? "Logging in..." : "Registering...";
    statusText.style.color = "var(--accent-blue)";

    const payload = { 
        action: isLoginMode ? "login" : "register", 
        username: username, 
        password: password,
        contact: isLoginMode ? "" : contact
    };

    try {
        let response = await fetch(API_URL, {
            method: 'POST',
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify(payload)
        });
        let result = await response.json();

        if (result.status === "success") {
            statusText.style.color = "var(--accent-green)";
            statusText.innerText = result.message;
            
            if (isLoginMode) {
                currentUser = username;
                currentUserPassword = password; 
                currentUserRole = result.role; 
                currentUserBookmarks = result.bookmarks || [];
                
                setTimeout(() => {
                    document.getElementById('authContainer').style.display = 'none';
                    document.getElementById('mainPortal').style.display = 'block';
                    
                    // LOGIN වුණාම FLOATING BUTTON එක පෙන්වනවා
                    const helpBtn = document.getElementById('whatsappHelpBtn');
                    if (helpBtn) helpBtn.style.display = 'flex'; 
                    
                    document.getElementById('adminLockBtn').style.display = currentUserRole === "admin" ? "inline-flex" : "none";
                    fetchPapersFromDatabase(); 
                }, 1000);
            } else {
                setTimeout(() => toggleAuthMode(), 1500);
            }
        } else {
            statusText.style.color = "#f87171"; statusText.innerText = result.message;
        }
    } catch (error) { statusText.style.color = "#f87171"; statusText.innerText = "Error Connecting to Server."; }
}

function handleLogout() {
    currentUser = ""; currentUserPassword = ""; currentUserRole = "user"; currentUserBookmarks = [];
    document.getElementById('mainPortal').style.display = 'none';
    document.getElementById('authContainer').style.display = 'flex';
    
    // LOGOUT වුණාම FLOATING BUTTON එක හංගනවා
    const helpBtn = document.getElementById('whatsappHelpBtn');
    if (helpBtn) helpBtn.style.display = 'none'; 
    
    if(!isLoginMode) toggleAuthMode();
    document.getElementById('authForm').reset();
    document.getElementById('authStatus').innerText = "";
}