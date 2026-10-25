/**
 * SafeBot - Trợ lý ảo AI Học đường tích hợp Google Gemini AI đời mới nhất
 * Safe School Project
 * - Giao diện thuần chữ tối giản (Text-Only), không icon emoji
 * - Khóa API được tích hợp sẵn bảo mật trong code, không hiển thị trên giao diện
 * - Trò chuyện AI tự nhiên, thông minh qua mô hình Gemini Flash thế hệ mới
 * - Thống kê số liệu Dashboard thời gian thực cho Quản trị viên (Admin)
 * - Lưu trữ và phân tách lịch sử trò chuyện theo từng tài khoản cá nhân hóa
 */

import { 
  auth, 
  db, 
  onAuthStateChanged, 
  collection, 
  getDocs, 
  doc, 
  getDoc,
  query,
  orderBy,
  limit
} from './firebaseConfig.js';

import { GEMINI_CONFIG } from './geminiConfig.js';

(() => {
  if (window.SafeBotLoaded) return;
  window.SafeBotLoaded = true;

  // Xác định đường dẫn tương đối theo thư mục
  const getBasePath = () => {
    const path = window.location.pathname.replace(/\\/g, '/');
    if (path.includes('/pages/')) {
      return { pages: '', admin: '../admin/', auth: '../auth/', root: '../', assets: '../assets/' };
    } else if (path.includes('/admin/')) {
      return { pages: '../pages/', admin: '', auth: '../auth/', root: '../', assets: '../assets/' };
    } else if (path.includes('/auth/')) {
      return { pages: '../pages/', admin: '../admin/', auth: '', root: '../', assets: '../assets/' };
    } else {
      return { pages: 'pages/', admin: 'admin/', auth: 'auth/', root: '', assets: 'assets/' };
    }
  };

  const basePath = getBasePath();

  // State người dùng
  let currentUser = null;
  let currentUserProfile = {
    uid: null,
    fullName: '',
    role: 'guest',
    gradeClass: '',
    school: '',
    email: '',
    avatar: ''
  };

  const removeAccents = (str) => {
    if (!str) return '';
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .toLowerCase()
      .trim();
  };

  const getUserShortName = () => {
    if (!currentUserProfile.fullName) return '';
    const parts = currentUserProfile.fullName.trim().split(' ');
    return parts[parts.length - 1];
  };

  // Quản lý lịch sử chat theo tài khoản
  const getStorageKey = () => {
    if (currentUser && currentUser.uid) {
      return `safebot_history_${currentUser.uid}`;
    }
    return 'safebot_history_guest';
  };

  const getChatHistory = () => {
    try {
      const data = localStorage.getItem(getStorageKey());
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  };

  const saveChatHistory = (history) => {
    try {
      const trimmed = history.slice(-60);
      localStorage.setItem(getStorageKey(), JSON.stringify(trimmed));
    } catch (e) {}
  };

  const appendToChatHistory = (item) => {
    const list = getChatHistory();
    list.push(item);
    saveChatHistory(list);
  };

  const clearCurrentChatHistory = () => {
    try {
      localStorage.removeItem(getStorageKey());
    } catch (e) {}
  };

  // ============================================================================
  // GỌI GOOGLE GEMINI AI ĐỜI MỚI NHẤT
  // ============================================================================
  const callGeminiAI = async (userInput, chatHistory) => {
    const apiKey = GEMINI_CONFIG.apiKey;
    const { role, fullName, gradeClass, school } = currentUserProfile;
    const displayName = fullName || 'bạn';
    const shortName = getUserShortName();

    const systemPrompt = `Bạn là SafeBot - Trợ lý trí tuệ nhân tạo AI An toàn Học đường & Tư vấn Tâm lý của hệ thống Safe School (Việt Nam).
THÔNG TIN NGƯỜI DÙNG:
- Họ tên: ${displayName} ${shortName ? `(gọi thân mật: ${shortName})` : ''}
- Vai trò: ${role === 'admin' ? 'Quản trị viên' : (role === 'teacher' ? 'Giáo viên' : (role === 'counselor' ? 'Chuyên viên tâm lý' : (role === 'parent' ? 'Phụ huynh' : 'Học sinh')))}
- Lớp: ${gradeClass || 'Chưa cập nhật'}
- Trường: ${school || 'Chưa cập nhật'}

QUY TẮC BẮT BUỘC VỀ VĂN PHONG VÀ ĐỊNH DẠNG:
1. KHÔNG SỬ DỤNG BẤT KỲ BIỂU TƯỢNG EMOJI HOẶC ICON NÀO trong câu trả lời. Toàn bộ câu trả lời chỉ dùng chữ cái thuần túy, dấu câu và định dạng Markdown (in đậm, gạch đầu dòng, tiêu đề).
2. Xưng hô tự nhiên, thấu hiểu, mang tính sư phạm và ấm áp: với học sinh xưng "mình" và gọi "${shortName || displayName}"; với giáo viên xưng "SafeBot" và gọi "thầy/cô"; với phụ huynh gọi "quý phụ huynh".
3. Khi người dùng gặp nguy hiểm, bị bắt nạt, đe dọa hoặc áp lực tâm lý:
   - Khuyên bình tĩnh, tìm người lớn tin cậy hoặc giáo viên.
   - Nhắc đến Tổng đài Quốc gia Bảo vệ Trẻ em: 111 (miễn phí 24/7) và Cảnh sát: 113.
   - Hướng dẫn gửi Báo cáo SOS khẩn cấp hoặc Báo cáo ẩn danh trên Safe School.
4. Khi hỏi về trường học, thi cử, ngành học: Cung cấp thông tin khách quan, chính xác, định hướng phát triển tích cực.
5. Định dạng Markdown rõ ràng, chia đoạn ngắn, dùng gạch đầu dòng (-) để dễ đọc.`;

    const contents = [];
    const recent = chatHistory.slice(-8);
    recent.forEach(msg => {
      if (msg.sender === 'user' && msg.text) {
        contents.push({ role: 'user', parts: [{ text: msg.text }] });
      } else if (msg.sender === 'bot' && msg.response) {
        contents.push({ role: 'model', parts: [{ text: msg.response }] });
      }
    });

    contents.push({ role: 'user', parts: [{ text: userInput }] });

    const modelsToTry = [GEMINI_CONFIG.primaryModel, GEMINI_CONFIG.fallbackModel, 'gemini-3.5-flash'];
    let lastError = null;

    for (const model of modelsToTry) {
      try {
        const endpoint = `${GEMINI_CONFIG.baseUrl}/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: systemPrompt }] },
            contents: contents,
            generationConfig: {
              temperature: 0.7,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 1024
            }
          })
        });

        if (response.ok) {
          const data = await response.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            // Lọc sạch mọi emoji còn sót lại
            const cleanText = text.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');
            
            const actions = [];
            const cleanLower = removeAccents(userInput);
            if (cleanLower.includes('sos') || cleanLower.includes('bat nat') || cleanLower.includes('nguy hiem')) {
              actions.push({ label: 'Gửi báo cáo SOS khẩn cấp', url: `${basePath.pages}report-sos.html`, type: 'danger' });
              actions.push({ label: 'Gọi Tổng đài 111 (Miễn phí)', url: 'tel:111', type: 'secondary' });
            } else if (cleanLower.includes('stress') || cleanLower.includes('tam ly') || cleanLower.includes('tram cam')) {
              actions.push({ label: 'Làm trắc nghiệm tâm lý DASS-21', url: `${basePath.pages}tests.html`, type: 'primary' });
              actions.push({ label: 'Chat với Tham vấn viên', url: `${basePath.pages}chat.html`, type: 'secondary' });
            }

            return {
              title: 'SafeBot AI',
              response: cleanText.trim(),
              actions: actions
            };
          }
        } else {
          const errData = await response.json().catch(() => ({}));
          lastError = errData.error?.message || `HTTP ${response.status}`;
        }
      } catch (err) {
        lastError = err.message;
      }
    }

    throw new Error(lastError || 'Không thể kết nối đến máy chủ AI');
  };

  // ============================================================================
  // THỐNG KÊ DASHBOARD CHO QUẢN TRỊ VIÊN (ADMIN)
  // ============================================================================
  const fetchDashboardStats = async () => {
    try {
      const usersSnap = await getDocs(collection(db, 'users'));
      let totalUsers = usersSnap.size || 0;
      let cStudent = 0, cTeacher = 0, cCounselor = 0, cAdmin = 0;

      usersSnap.forEach(d => {
        const r = d.data().role || 'student';
        if (r === 'student') cStudent++;
        else if (r === 'teacher') cTeacher++;
        else if (r === 'counselor') cCounselor++;
        else if (r === 'admin') cAdmin++;
      });

      const reportsSnap = await getDocs(query(collection(db, 'reports'), orderBy('createdAt', 'desc'), limit(150)));
      let totalReports = reportsSnap.size || 0;
      let pending = 0, resolved = 0, sos = 0;
      let physical = 0, cyber = 0, verbal = 0, mental = 0;

      reportsSnap.forEach(d => {
        const data = d.data();
        if (data.status === 'pending') pending++;
        if (data.status === 'resolved') resolved++;
        if (data.isSOS) sos++;

        if (data.type === 'physical') physical++;
        else if (data.type === 'cyber') cyber++;
        else if (data.type === 'verbal') verbal++;
        else mental++;
      });

      const safeTotal = totalReports || 1;
      const pPhysical = Math.round((physical / safeTotal) * 100);
      const pCyber = Math.round((cyber / safeTotal) * 100);
      const pVerbal = Math.round((verbal / safeTotal) * 100);
      const pMental = Math.round((mental / safeTotal) * 100);

      return {
        success: true,
        totalUsers, cStudent, cTeacher, cCounselor, cAdmin,
        totalReports, pending, resolved, sos,
        physical, cyber, verbal, mental,
        pPhysical, pCyber, pVerbal, pMental
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // Tạo lời chào cá nhân hóa thuần chữ (Text-Only)
  const createPersonalizedGreeting = () => {
    const { role, fullName, gradeClass, school } = currentUserProfile;
    const shortName = getUserShortName();
    const displayName = fullName || 'bạn';

    if (role === 'admin') {
      return {
        title: 'Quản trị viên',
        response: `Xin chào Quản trị viên ${displayName}.\n\nSafeBot đang hoạt động ở Chế độ Quản trị với trí tuệ nhân tạo Gemini AI:\n- Thống kê Dashboard: Số liệu người dùng, báo cáo và các vụ việc SOS theo thời gian thực\n- Quản trị thành viên: Kiểm tra số lượng học sinh, giáo viên, chuyên viên\n- Trợ lý thông minh: Giải đáp và hỗ trợ mọi nghiệp vụ học đường\n\nBạn có thể chọn câu hỏi gợi ý bên dưới hoặc nhập câu hỏi trực tiếp.`,
        actions: [
          { label: 'Thống kê số liệu Dashboard', query: 'Thống kê số liệu dashboard hệ thống', type: 'primary' },
          { label: 'Thống kê Người dùng', query: 'Thống kê người dùng hệ thống', type: 'secondary' },
          { label: 'Thống kê Báo cáo và SOS', query: 'Thống kê tình hình báo cáo và SOS', type: 'secondary' }
        ]
      };
    }

    if (role === 'teacher') {
      return {
        title: 'Giáo viên',
        response: `Kính chào Thầy/Cô ${displayName}.\n\nSafeBot AI sẵn sàng hỗ trợ Thầy/Cô trong công tác quản lý và đồng hành cùng học sinh:\n- Hướng dẫn quy trình tiếp nhận và xử lý sự việc bạo lực học đường\n- Nhận diện các dấu hiệu căng thẳng tâm lý ở lứa tuổi học sinh\n- Tra cứu thông tin tuyển sinh và trường học toàn quốc\n\nThầy/Cô cần hỗ trợ nội dung gì hôm nay?`,
        actions: [
          { label: 'Quy trình xử lý bạo lực học đường', query: 'Quy trình xử lý khi học sinh bị bắt nạt', type: 'primary' },
          { label: 'Dấu hiệu nhận biết áp lực tâm lý', query: 'Cách nhận diện học sinh bị áp lực tâm lý', type: 'secondary' },
          { label: 'Danh bạ đường dây nóng hỗ trợ', query: 'Danh sách số hotline khẩn cấp', type: 'secondary' }
        ]
      };
    }

    if (role === 'student' && fullName) {
      const classText = gradeClass ? ` - Lớp ${gradeClass}` : '';
      const schoolText = school ? ` (${school})` : '';
      return {
        title: `Chào ${shortName || fullName}`,
        response: `Xin chào bạn ${displayName}${classText}${schoolText}.\n\nMình là SafeBot - Trợ lý ảo AI An toàn Học đường. Cuộc trò chuyện này được lưu lại riêng tư cho tài khoản của bạn:\n- Hỗ trợ cách xử lý an toàn khi gặp bạo lực hoặc bị bắt nạt\n- Lắng nghe, chia sẻ và hướng dẫn bài trắc nghiệm tâm lý DASS-21\n- Tra cứu thông tin, điểm mạnh và website các trường Đại học và THPT\n- Trò chuyện và giải đáp bất kỳ câu hỏi nào bạn đang quan tâm\n\nHôm nay bạn cần hỗ trợ điều gì? Hãy nhắn cho mình nhé.`,
        actions: [
          { label: 'Tra cứu thông tin trường học', query: 'Tra cứu thông tin các trường học', type: 'primary' },
          { label: 'Cần làm gì khi bị bắt nạt', query: 'Tôi bị bắt nạt phải làm sao?', type: 'danger' },
          { label: 'Làm bài kiểm tra tâm lý DASS-21', query: 'Làm bài trắc nghiệm tâm lý DASS-21', type: 'secondary' },
          { label: 'Báo cáo khẩn cấp SOS', url: `${basePath.pages}report-sos.html`, type: 'secondary' }
        ]
      };
    }

    // Khách chưa đăng nhập
    return {
      title: 'Chào bạn',
      response: `Xin chào bạn. Mình là SafeBot - Trợ lý trí tuệ nhân tạo AI An toàn Học đường Safe School.\n\nBạn có thể đăng nhập tài khoản để SafeBot lưu lại lịch sử trò chuyện cá nhân hóa. Mình có thể hỗ trợ bạn:\n- Trò chuyện, tư vấn kỹ năng sống và giải tỏa áp lực học tập\n- Tra cứu thông tin các trường Đại học và THPT toàn quốc\n- Hướng dẫn bảo vệ an toàn và gửi báo cáo khi gặp bạo lực học đường\n- Thống kê Dashboard hệ thống dành cho Quản trị viên\n\nBạn hãy gửi câu hỏi để bắt đầu trò chuyện nhé.`,
      actions: [
        { label: 'Đăng nhập tài khoản', url: `${basePath.auth}sign-in.html`, type: 'primary' },
        { label: 'Tra cứu thông tin trường học', query: 'Tra cứu thông tin các trường học', type: 'secondary' },
        { label: 'Báo cáo khẩn cấp SOS', url: `${basePath.pages}report-sos.html`, type: 'danger' }
      ]
    };
  };

  // Gợi ý câu hỏi nhanh thuần chữ
  const getPersonalizedSuggestions = () => {
    const { role, gradeClass } = currentUserProfile;

    if (role === 'admin') {
      return [
        { text: 'Thống kê Dashboard', query: 'Thống kê số liệu dashboard hệ thống', isAdmin: true },
        { text: 'Thống kê Người dùng', query: 'Thống kê người dùng hệ thống', isAdmin: true },
        { text: 'Thống kê Báo cáo & SOS', query: 'Thống kê tình hình báo cáo và SOS', isAdmin: true },
        { text: 'Tra cứu trường học', query: 'Tra cứu thông tin các trường học' },
        { text: 'ĐH Bách Khoa Hà Nội', query: 'Thông tin trường Bách Khoa Hà Nội' }
      ];
    }

    const studentChips = [
      { text: 'Tra cứu trường học', query: 'Tra cứu thông tin các trường học' },
      { text: 'ĐH Bách Khoa Hà Nội', query: 'Thông tin trường Đại học Bách Khoa Hà Nội' },
      { text: 'ĐH Kinh tế Quốc dân', query: 'Thông tin trường Đại học Kinh tế Quốc dân' },
      { text: 'Bị bắt nạt làm sao', query: 'Tôi bị bắt nạt phải làm sao?' },
      { text: 'Báo cáo khẩn cấp SOS', query: 'Báo cáo khẩn cấp SOS' },
      { text: 'Giải tỏa áp lực thi cử', query: 'Tôi đang bị stress và áp lực' },
      { text: 'Làm bài test DASS-21', query: 'Làm bài trắc nghiệm tâm lý DASS-21' },
      { text: 'Danh bạ Hotline', query: 'Danh sách số hotline khẩn cấp' }
    ];

    if (gradeClass && gradeClass.startsWith('12')) {
      studentChips.unshift({ text: 'Định hướng tuyển sinh khối 12', query: 'Định hướng chọn trường đại học cho học sinh lớp 12' });
    }

    return studentChips;
  };

  const formatMarkdown = (text) => {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code style="background: rgba(255,255,255,0.1); padding: 2px 5px; border-radius: 4px; font-family: monospace;">$1</code>')
      .replace(/\n/g, '<br>');
  };

  const getCurrentTime = () => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  };

  // ============================================================================
  // XỬ LÝ PHẢN HỒI TIN NHẮN (AI-FIRST ARCHITECTURE)
  // ============================================================================
  const resolveBotAnswer = async (userInput, chatHistory) => {
    const cleanNoAccent = removeAccents(userInput);
    const displayName = currentUserProfile.fullName || 'bạn';

    // 1. Kiểm tra yêu cầu thống kê Dashboard (chỉ xử lý riêng cho Admin qua Firestore)
    const dashboardKeywords = [
      'thong ke', 'dashboard', 'so lieu', 'bao cao he thong', 'tong so nguoi dung',
      'so luong nguoi dung', 'bao nhieu bao cao', 'tinh hinh bao cao', 'so ca sos',
      'thong ke nguoi dung', 'thong ke user', 'so hoc sinh', 'so giao vien'
    ];

    const isDashboardQuery = dashboardKeywords.some(kw => cleanNoAccent.includes(kw));

    if (isDashboardQuery) {
      if (currentUserProfile.role !== 'admin') {
        return {
          title: 'Truy cập giới hạn',
          response: `Tính năng thống kê số liệu Dashboard và dữ liệu tổng quan sự vụ chỉ được cung cấp cho tài khoản Quản trị viên (Admin) để đảm bảo an toàn và bảo mật thông tin học đường.\n\n- Nếu bạn là Quản trị viên, vui lòng đăng nhập tài khoản Admin để tra cứu.\n- Nếu bạn là Học sinh, bạn có thể tra cứu thông tin trường học, gửi báo cáo bảo mật hoặc làm trắc nghiệm tâm lý.`,
          actions: [
            { label: 'Đăng nhập Quản trị viên', url: `${basePath.auth}sign-in.html`, type: 'primary' },
            { label: 'Tra cứu thông tin trường học', query: 'Tra cứu thông tin các trường học', type: 'secondary' }
          ]
        };
      }

      const stats = await fetchDashboardStats();
      if (!stats.success) {
        return {
          title: 'Lỗi tải dữ liệu',
          response: `Không thể kết nối đến cơ sở dữ liệu Dashboard: ${stats.error || 'Vui lòng kiểm tra lại đường truyền mạng.'}`,
          actions: [
            { label: 'Thử lại', query: 'Thống kê số liệu dashboard hệ thống', type: 'primary' },
            { label: 'Mở trang Dashboard', url: `${basePath.admin}dashboard.html`, type: 'secondary' }
          ]
        };
      }

      const responseText = `BÁO CÁO THỐNG KÊ DASHBOARD HỆ THỐNG\nDữ liệu thời gian thực được đồng bộ từ Firestore cho Quản trị viên ${displayName}:\n\n` +
        `Người dùng hệ thống: ${stats.totalUsers} tài khoản\n` +
        `- Học sinh: ${stats.cStudent}\n` +
        `- Giáo viên: ${stats.cTeacher}\n` +
        `- Tham vấn viên: ${stats.cCounselor}\n` +
        `- Quản trị viên: ${stats.cAdmin}\n\n` +
        `Tình hình Báo cáo: ${stats.totalReports} vụ việc\n` +
        `- Đang chờ xử lý: ${stats.pending} vụ\n` +
        `- Đã giải quyết: ${stats.resolved} vụ\n` +
        `- Cảnh báo khẩn cấp SOS: ${stats.sos} vụ\n\n` +
        `Phân loại sự vụ bạo lực:\n` +
        `- Bạo lực thể chất: ${stats.physical} vụ (${stats.pPhysical}%)\n` +
        `- Bắt nạt qua mạng: ${stats.cyber} vụ (${stats.pCyber}%)\n` +
        `- Bạo lực ngôn từ/lăng mạ: ${stats.verbal} vụ (${stats.pVerbal}%)\n` +
        `- Áp lực tâm lý/khác: ${stats.mental} vụ (${stats.pMental}%)`;

      return {
        title: 'Thống kê Dashboard Admin',
        response: responseText,
        actions: [
          { label: 'Xem chi tiết trang Dashboard', url: `${basePath.admin}dashboard.html`, type: 'primary' },
          { label: 'Quản lý Người dùng', url: `${basePath.pages}users.html`, type: 'secondary' },
          { label: 'Quản lý phòng Chat', url: `${basePath.pages}chat-management.html`, type: 'secondary' }
        ]
      };
    }

    // 2. Chuyển toàn bộ câu hỏi trò chuyện tới Gemini AI thế hệ mới
    return await callGeminiAI(userInput, chatHistory);
  };

  // ============================================================================
  // XÂY DỰNG GIAO DIỆN (CHỮ THUẦN TÚY, KHÔNG DÙNG ICON, KHÔNG HIỂN THỊ CỔNG API)
  // ============================================================================
  const buildChatbotUI = () => {
    // 1. Launcher button: Chữ thuần túy
    const launcher = document.createElement('button');
    launcher.id = 'safebot-launcher';
    launcher.className = 'safebot-launcher';
    launcher.setAttribute('aria-label', 'Mở trợ lý ảo SafeBot AI');
    launcher.innerHTML = `
      <span class="launcher-text-open">Trợ lý AI</span>
      <span class="launcher-text-close">Đóng</span>
      <span class="safebot-badge" id="safebot-badge" style="display: none;">1</span>
    `;

    // 2. Cửa sổ chat
    const windowEl = document.createElement('div');
    windowEl.id = 'safebot-window';
    windowEl.className = 'safebot-window';
    windowEl.innerHTML = `
      <!-- Header -->
      <div class="safebot-header">
        <div class="safebot-header-info">
          <div class="safebot-avatar">AI</div>
          <div class="safebot-title-wrap">
            <h4>
              SafeBot AI
              <span class="safebot-title-badge">Gemini</span>
              <span id="safebot-admin-header-pill" class="safebot-admin-pill" style="display: none;">Admin</span>
            </h4>
            <div style="margin-top: 2px;">
              <span id="safebot-user-badge" class="safebot-user-badge">Khách</span>
            </div>
          </div>
        </div>
        <div class="safebot-header-actions">
          <button class="safebot-header-btn" id="safebot-btn-reset" title="Bắt đầu lại cuộc trò chuyện">Làm mới</button>
          <button class="safebot-header-btn" id="safebot-btn-close" title="Thu nhỏ">Đóng</button>
        </div>
      </div>

      <!-- Messages container -->
      <div class="safebot-messages" id="safebot-messages"></div>

      <!-- Quick suggestions chips -->
      <div class="safebot-quick-chips" id="safebot-quick-chips"></div>

      <!-- Input area -->
      <div class="safebot-input-bar">
        <div class="safebot-input-wrap">
          <input type="text" class="safebot-input" id="safebot-input" placeholder="Hỏi SafeBot AI điều gì đó..." autocomplete="off">
          <button class="safebot-send-btn" id="safebot-send-btn" disabled>Gửi</button>
        </div>
        <div class="safebot-footer-hint">
          <span id="safebot-account-footer-label">Trợ lý học đường tích hợp Google Gemini AI</span>
        </div>
      </div>
    `;

    document.body.appendChild(launcher);
    document.body.appendChild(windowEl);

    return { launcher, windowEl };
  };

  // Khởi tạo Controller
  const initChatbot = () => {
    const { launcher, windowEl } = buildChatbotUI();

    const messagesContainer = document.getElementById('safebot-messages');
    const chipsContainer = document.getElementById('safebot-quick-chips');
    const input = document.getElementById('safebot-input');
    const sendBtn = document.getElementById('safebot-send-btn');
    const resetBtn = document.getElementById('safebot-btn-reset');
    const closeBtn = document.getElementById('safebot-btn-close');
    const adminPill = document.getElementById('safebot-admin-header-pill');
    const userBadge = document.getElementById('safebot-user-badge');
    const accountFooterLabel = document.getElementById('safebot-account-footer-label');

    let isOpen = false;
    let isTyping = false;

    const toggleWindow = (open) => {
      isOpen = typeof open === 'boolean' ? open : !isOpen;
      if (isOpen) {
        launcher.classList.add('open');
        windowEl.classList.add('active');
        input.focus();
        scrollToBottom();
      } else {
        launcher.classList.remove('open');
        windowEl.classList.remove('active');
      }
    };

    launcher.addEventListener('click', () => toggleWindow());
    closeBtn.addEventListener('click', () => toggleWindow(false));

    const scrollToBottom = () => {
      setTimeout(() => {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }, 40);
    };

    const renderChips = () => {
      chipsContainer.innerHTML = '';
      const list = getPersonalizedSuggestions();

      list.forEach(item => {
        const chip = document.createElement('button');
        chip.className = `safebot-chip ${item.isAdmin ? 'admin-chip' : ''}`;
        chip.type = 'button';
        chip.textContent = item.text;
        chip.addEventListener('click', () => {
          handleUserSend(item.query);
        });
        chipsContainer.appendChild(chip);
      });
    };

    const appendUserMessageDOM = (text, timeStr) => {
      const row = document.createElement('div');
      row.className = 'safebot-msg-row user';
      row.innerHTML = `
        <div class="safebot-bubble-wrap">
          <div class="safebot-bubble">${formatMarkdown(text)}</div>
          <span class="safebot-time">${timeStr || getCurrentTime()}</span>
        </div>
      `;
      messagesContainer.appendChild(row);
      scrollToBottom();
    };

    const showTyping = () => {
      const row = document.createElement('div');
      row.className = 'safebot-msg-row bot typing-indicator-row';
      row.id = 'safebot-typing-row';
      row.innerHTML = `
        <div class="safebot-msg-avatar">AI</div>
        <div class="safebot-bubble-wrap">
          <div class="safebot-bubble">
            <div class="safebot-typing-dots">
              <span></span><span></span><span></span>
            </div>
          </div>
        </div>
      `;
      messagesContainer.appendChild(row);
      scrollToBottom();
    };

    const removeTyping = () => {
      const typingEl = document.getElementById('safebot-typing-row');
      if (typingEl) typingEl.remove();
    };

    const appendBotMessageDOM = (answerObj, timeStr) => {
      const row = document.createElement('div');
      row.className = 'safebot-msg-row bot';

      let actionsHtml = '';
      if (answerObj.actions && answerObj.actions.length > 0) {
        actionsHtml = `
          <div class="safebot-actions-card">
            ${answerObj.actions.map((act, index) => {
              if (act.query) {
                return `
                  <button type="button" class="safebot-action-link ${act.type || 'secondary'}" data-action-index="${index}">
                    ${act.label}
                  </button>
                `;
              } else {
                const targetAttr = act.external ? 'target="_blank" rel="noopener noreferrer"' : '';
                return `
                  <a href="${act.url}" class="safebot-action-link ${act.type || 'secondary'}" ${targetAttr}>
                    ${act.label}
                  </a>
                `;
              }
            }).join('')}
          </div>
        `;
      }

      row.innerHTML = `
        <div class="safebot-msg-avatar">AI</div>
        <div class="safebot-bubble-wrap">
          <div class="safebot-bubble">
            ${formatMarkdown(answerObj.response)}
            ${actionsHtml}
          </div>
          <span class="safebot-time">${timeStr || getCurrentTime()}</span>
        </div>
      `;

      if (answerObj.actions) {
        const queryButtons = row.querySelectorAll('button[data-action-index]');
        queryButtons.forEach(btn => {
          const idx = parseInt(btn.getAttribute('data-action-index'), 10);
          const act = answerObj.actions[idx];
          if (act && act.query) {
            btn.addEventListener('click', () => {
              handleUserSend(act.query);
            });
          }
        });
      }

      messagesContainer.appendChild(row);
      scrollToBottom();
    };

    const loadAccountChatHistory = () => {
      messagesContainer.innerHTML = '';
      const history = getChatHistory();

      if (history.length > 0) {
        history.forEach(item => {
          if (item.sender === 'user') {
            appendUserMessageDOM(item.text, item.time);
          } else if (item.sender === 'bot') {
            appendBotMessageDOM({ response: item.response, actions: item.actions }, item.time);
          }
        });
      } else {
        const greeting = createPersonalizedGreeting();
        const nowTime = getCurrentTime();
        appendBotMessageDOM(greeting, nowTime);
        appendToChatHistory({
          sender: 'bot',
          response: greeting.response,
          actions: greeting.actions,
          time: nowTime
        });
      }

      renderChips();
    };

    const handleUserSend = async (textToSend) => {
      const text = (textToSend || input.value).trim();
      if (!text || isTyping) return;

      const userTime = getCurrentTime();
      appendUserMessageDOM(text, userTime);
      appendToChatHistory({ sender: 'user', text, time: userTime });

      input.value = '';
      sendBtn.disabled = true;
      isTyping = true;

      showTyping();

      try {
        const currentHistory = getChatHistory();
        const answer = await resolveBotAnswer(text, currentHistory);
        const botTime = getCurrentTime();
        removeTyping();
        appendBotMessageDOM(answer, botTime);
        appendToChatHistory({
          sender: 'bot',
          response: answer.response,
          actions: answer.actions,
          time: botTime
        });
      } catch (err) {
        removeTyping();
        const errorAnswer = {
          title: 'SafeBot AI',
          response: 'Đã xảy ra sự cố khi kết nối đến dịch vụ AI. Bạn vui lòng thử lại sau giây lát nhé.',
          actions: []
        };
        const botTime = getCurrentTime();
        appendBotMessageDOM(errorAnswer, botTime);
        appendToChatHistory({
          sender: 'bot',
          response: errorAnswer.response,
          actions: errorAnswer.actions,
          time: botTime
        });
      } finally {
        isTyping = false;
        if (isOpen) input.focus();
      }
    };

    input.addEventListener('input', () => {
      sendBtn.disabled = !input.value.trim();
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleUserSend();
      }
    });

    sendBtn.addEventListener('click', () => {
      handleUserSend();
    });

    resetBtn.addEventListener('click', () => {
      const accountName = currentUserProfile.fullName || (currentUserProfile.role === 'guest' ? 'Khách' : 'tài khoản này');
      if (confirm(`Bạn có muốn xóa toàn bộ lịch sử trò chuyện của ${accountName} và bắt đầu lại không?`)) {
        clearCurrentChatHistory();
        loadAccountChatHistory();
      }
    });

    onAuthStateChanged(auth, async (user) => {
      if (user) {
        currentUser = user;
        currentUserProfile.uid = user.uid;
        currentUserProfile.email = user.email || '';
        currentUserProfile.fullName = user.displayName || user.email || '';
        currentUserProfile.role = 'student';

        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            currentUserProfile.role = data.role || 'student';
            currentUserProfile.fullName = data.fullName || currentUserProfile.fullName;
            currentUserProfile.gradeClass = data.gradeClass || '';
            currentUserProfile.school = data.school || '';
            currentUserProfile.avatar = data.avatar || '';
          }
        } catch (err) {
          console.warn('SafeBot: Không thể lấy vai trò người dùng:', err);
        }
      } else {
        currentUser = null;
        currentUserProfile = {
          uid: null,
          fullName: '',
          role: 'guest',
          gradeClass: '',
          school: '',
          email: '',
          avatar: ''
        };
      }

      const role = currentUserProfile.role;
      const fullName = currentUserProfile.fullName;
      const grade = currentUserProfile.gradeClass;

      if (role === 'admin') {
        if (adminPill) adminPill.style.display = 'inline-block';
        if (userBadge) userBadge.textContent = `Admin: ${fullName || 'Quản trị viên'}`;
        if (accountFooterLabel) accountFooterLabel.textContent = `Đăng nhập: Admin (${fullName || 'Quản trị viên'})`;
      } else if (role === 'student') {
        if (adminPill) adminPill.style.display = 'none';
        if (userBadge) userBadge.textContent = fullName ? `Học sinh: ${fullName}${grade ? ` (${grade})` : ''}` : 'Học sinh';
        if (accountFooterLabel) accountFooterLabel.textContent = `Tài khoản: ${fullName || 'Học sinh'}${grade ? ` (${grade})` : ''}`;
      } else if (role === 'teacher') {
        if (adminPill) adminPill.style.display = 'none';
        if (userBadge) userBadge.textContent = `Giáo viên: ${fullName || 'Thầy/Cô'}`;
        if (accountFooterLabel) accountFooterLabel.textContent = `Tài khoản: Giáo viên ${fullName || ''}`;
      } else {
        if (adminPill) adminPill.style.display = 'none';
        if (userBadge) userBadge.textContent = 'Khách chưa đăng nhập';
        if (accountFooterLabel) accountFooterLabel.textContent = 'Trợ lý học đường tích hợp Google Gemini AI';
      }

      loadAccountChatHistory();
    });

    loadAccountChatHistory();

    window.SafeBot = {
      open: () => toggleWindow(true),
      close: () => toggleWindow(false),
      toggle: () => toggleWindow(),
      ask: (question) => {
        toggleWindow(true);
        handleUserSend(question);
      },
      getRole: () => currentUserProfile.role,
      getProfile: () => ({ ...currentUserProfile }),
      clearHistory: () => {
        clearCurrentChatHistory();
        loadAccountChatHistory();
      }
    };
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initChatbot);
  } else {
    initChatbot();
  }
})();
