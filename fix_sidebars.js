const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, 'pages');
const files = ['profile.html', 'blogs.html', 'chat.html', 'report.html', 'report-sos.html', 'tests.html', 'report-detail.html', 'blog-detail.html'];

const sidebarFooterRegex = /<div class="sidebar-footer"[^>]*>[\s\S]*?<\/aside>/;
const sidebarFooterRegex2 = /<div class="sidebar-section-title">CÁ NHÂN<\/div>[\s\S]*?<\/aside>/;

const newSidebarFooterHtml = (isActiveProfile) => `
      <div class="sidebar-section-title">CÁ NHÂN</div>
      <nav class="sidebar-nav">
        <a href="profile.html" class="sidebar-link ${isActiveProfile ? 'active' : ''}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          Hồ sơ cá nhân
        </a>
      </nav>

      <div class="sidebar-footer">
        <div class="sidebar-user">
          <div class="sidebar-avatar" id="user-avatar-initial">U</div>
          <div class="sidebar-user-info">
            <div class="sidebar-user-name" id="sidebar-user-name">Đang tải...</div>
            <div class="sidebar-user-role" id="sidebar-user-role">---</div>
          </div>
          <button class="btn-icon" id="btn-logout" title="Đăng xuất">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          </button>
        </div>
      </div>
    </aside>`;

files.forEach(file => {
  const filePath = path.join(pagesDir, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');

    const isProfile = file === 'profile.html';

    if (sidebarFooterRegex2.test(content)) {
      content = content.replace(sidebarFooterRegex2, newSidebarFooterHtml(isProfile));
    } else {
      content = content.replace(sidebarFooterRegex, newSidebarFooterHtml(isProfile));
    }

    fs.writeFileSync(filePath, content);
    console.log(`Updated ${file}`);
  }
});

// Update dashboard
const dashboardPath = path.join(__dirname, 'admin', 'dashboard.html');
if (fs.existsSync(dashboardPath)) {
  let content = fs.readFileSync(dashboardPath, 'utf8');
  content = content.replace(/"index\.html"/g, '"../pages/profile.html"');
  fs.writeFileSync(dashboardPath, content);
  console.log('Updated dashboard.html');
}

// Update admin/index.html to redirect
const adminIndexPath = path.join(__dirname, 'admin', 'index.html');
if (fs.existsSync(adminIndexPath)) {
  const redirectHtml = `<!DOCTYPE html>
<html>
<head>
  <meta http-equiv="refresh" content="0; url=../pages/profile.html" />
  <title>Redirecting...</title>
</head>
<body>
  <p><a href="../pages/profile.html">Click here if you are not redirected automatically</a></p>
</body>
</html>`;
  fs.writeFileSync(adminIndexPath, redirectHtml);
  console.log('Updated admin/index.html');
}
