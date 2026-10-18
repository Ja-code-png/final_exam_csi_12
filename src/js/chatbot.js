/**
 * SafeBot - Trợ lý ảo An toàn Học đường (24/7 AI Assistant)
 * Safe School Project
 */

(() => {
  // Tránh khởi tạo lặp lại
  if (window.SafeBotLoaded) return;
  window.SafeBotLoaded = true;

  // Xác định đường dẫn tương đối phù hợp theo thư mục hiện tại
  const getBasePath = () => {
    const path = window.location.pathname.replace(/\\/g, '/');
    if (path.includes('/pages/')) {
      return {
        pages: '',
        root: '../',
        assets: '../assets/'
      };
    } else if (path.includes('/admin/') || path.includes('/auth/')) {
      return {
        pages: '../pages/',
        root: '../',
        assets: '../assets/'
      };
    } else {
      return {
        pages: 'pages/',
        root: '',
        assets: 'assets/'
      };
    }
  };

  const basePath = getBasePath();

  // Knowledge Base & Intents
  const KNOWLEDGE_BASE = [
    {
      id: 'emergency_sos',
      keywords: ['sos', 'khẩn cấp', 'khan cap', 'cấp cứu', 'nguy hiểm', 'bị đánh', 'bi danh', 'cứu tôi', 'cuu toi', 'đang bị đe dọa', 'dang bi de doa', 'tự tử', 'tu tu', 'nguy cấp'],
      title: 'Hỗ trợ Khẩn cấp SOS',
      response: `🚨 **BẠN ĐANG GẶP NGUY HIỂM? HÃY GIỮ BÌNH TĨNH VÀ HÀNH ĐỘNG NGAY:**\n\n1. **Tìm nơi an toàn:** Di chuyển ngay tới phòng giáo viên, bảo vệ hoặc nơi đông người.\n2. **Báo cáo SOS tức thì:** Nhấn nút Báo cáo khẩn cấp bên dưới (hệ thống sẽ gửi cảnh báo kèm định vị tới giáo viên/BGH).\n3. **Gọi đường dây nóng miễn phí:**\n   • **111** (Tổng đài Quốc gia Bảo vệ Trẻ em - 24/7)\n   • **113** (Cảnh sát phản ứng nhanh)`,
      actions: [
        { label: '🚨 Gửi báo cáo SOS khẩn cấp', url: `${basePath.pages}report-sos.html`, type: 'danger' },
        { label: '📞 Gọi Tổng đài 111 (Miễn phí)', url: 'tel:111', type: 'secondary' }
      ]
    },
    {
      id: 'bullying_advice',
      keywords: ['bắt nạt', 'bat nat', 'bị bắt nạt', 'bi bat nat', 'bạo lực', 'bao luc', 'đánh nhau', 'danh nhau', 'đe dọa', 'de doa', 'trấn lột', 'tran lot', 'tẩy chay', 'tay chay', 'cô lập', 'co lap'],
      title: 'Xử lý khi bị Bắt nạt học đường',
      response: `🛡️ **HƯỚNG DẪN AN TOÀN KHI BỊ BẮT NẠT:**\n\n• **Bạn không có lỗi:** Bắt nạt là hành vi sai trái, bạn hoàn toàn không phải chịu đựng một mình.\n• **Giữ an toàn:** Không đối đầu bạo lực, tìm cách rời khỏi tình huống nguy hiểm.\n• **Lưu giữ bằng chứng:** Chụp lại tin nhắn, ghi nhớ thời gian, địa điểm và người chứng kiến.\n• **Lên tiếng:** Hãy chia sẻ với giáo viên, phụ huynh hoặc gửi báo cáo bảo mật trên Safe School.`,
      actions: [
        { label: '📋 Gửi báo cáo chi tiết', url: `${basePath.pages}report.html`, type: 'primary' },
        { label: '💬 Nói chuyện với Tham vấn viên', url: `${basePath.pages}chat.html`, type: 'secondary' }
      ]
    },
    {
      id: 'cyberbullying',
      keywords: ['bạo lực mạng', 'bao luc mang', 'cyberbullying', 'nói xấu', 'noi xau', 'bêu riếu', 'beu rieu', 'ảnh chế', 'anh che', 'tin nhắn đe dọa', 'bóc phốt', 'boc phot', 'mạng xã hội', 'facebook', 'tiktok'],
      title: 'Phòng chống Bạo lực trên mạng',
      response: `🌐 **CÁCH ĐỐI PHÓ VỚI BẠO LỰC MẠNG (CYBERBULLYING):**\n\n1. **KHÔNG đáp trả:** Kẻ bắt nạt thường kích động để bạn phản ứng tiêu cực.\n2. **Chụp màn hình làm bằng chứng:** Lưu giữ tất cả tin nhắn, bình luận xúc phạm.\n3. **Chặn & Báo cáo tài khoản:** Dùng tính năng Block/Report trên MXH.\n4. **Bảo mật thông tin:** Đặt lại mật khẩu, hạn chế chia sẻ thông tin riêng tư.\n5. **Gửi báo cáo lên nhà trường** qua hệ thống Safe School để được can thiệp.`,
      actions: [
        { label: '📋 Báo cáo sự việc mạng', url: `${basePath.pages}report.html`, type: 'primary' },
        { label: '📖 Đọc cẩm nang an toàn mạng', url: `${basePath.pages}blogs.html`, type: 'secondary' }
      ]
    },
    {
      id: 'mental_health',
      keywords: ['stress', 'áp lực', 'ap luc', 'buồn', 'buon', 'khóc', 'khoc', 'trầm cảm', 'tram cam', 'lo âu', 'lo au', 'mệt mỏi', 'met moi', 'tâm lý', 'tam ly', 'bế tắc', 'be tac', 'sợ đi học', 'so di hoc'],
      title: 'Chăm sóc Sức khỏe Tâm lý',
      response: `🌱 **MÌNH LUÔN Ở ĐÂY LẮNG NGHE BẠN!**\n\nCảm xúc tiêu cực hay áp lực học tập là điều rất bình thường mà ai cũng có thể trải qua. Bạn đừng giữ kín một mình nhé:\n\n• Hãy thử hít thở sâu, nghe một bản nhạc nhẹ hoặc đi dạo thả lỏng.\n• Làm bài **Trắc nghiệm tâm lý DASS-21** để hiểu rõ mức độ căng thẳng hiện tại.\n• Đặt lịch trò chuyện riêng tư 1-1 với Chuyên gia tâm lý học đường hoàn toàn miễn phí.`,
      actions: [
        { label: '📝 Làm trắc nghiệm tâm lý DASS-21', url: `${basePath.pages}tests.html`, type: 'primary' },
        { label: '💬 Trò chuyện với Tham vấn viên', url: `${basePath.pages}chat.html`, type: 'secondary' }
      ]
    },
    {
      id: 'anonymous_reporting',
      keywords: ['ẩn danh', 'an danh', 'bí mật', 'bi mat', 'giấu tên', 'giau ten', 'sợ bị trả thù', 'so bi tra thu', 'lộ danh tính', 'lo danh tinh'],
      title: 'Báo cáo Ẩn danh An toàn',
      response: `🔒 **BẢO MẬT & BÁO CÁO ẨN DANH TRÊN SAFE SCHOOL:**\n\n• Safe School cho phép bạn gửi báo cáo **hoàn toàn ẩn danh** mà không cần đăng nhập hoặc không hiển thị họ tên.\n• Sau khi gửi, bạn sẽ nhận được **Mã theo dõi duy nhất** để kiểm tra tiến độ giải quyết của nhà trường mà danh tính vẫn được bảo vệ 100%.\n• Dữ liệu bằng chứng (hình ảnh, video) được mã hóa bảo mật.`,
      actions: [
        { label: '📝 Gửi báo cáo ẩn danh ngay', url: `${basePath.pages}report.html`, type: 'primary' }
      ]
    },
    {
      id: 'hotlines',
      keywords: ['hotline', 'số điện thoại', 'so dien thoai', 'tổng đài', 'tong dai', 'đường dây nóng', 'duong day nong', 'liên hệ', 'lien he'],
      title: 'Danh bạ Hỗ trợ & Khẩn cấp',
      response: `📞 **CÁC ĐƯỜNG DÂY NÓNG HỖ TRỢ MIỄN PHÍ 24/7:**\n\n• **111**: Tổng đài Quốc gia Bảo vệ Trẻ em (Tư vấn tâm lý, pháp luật, can thiệp khẩn cấp).\n• **113**: Công an phản ứng nhanh (Trường hợp đánh nhau, đe dọa vũ lực nguy cấp).\n• **115**: Cấp cứu y tế.\n• **1900 969 680**: Đường dây nóng tư vấn sức khỏe tâm thần Ngày Mai.`,
      actions: [
        { label: '📞 Gọi 111 (Miễn phí)', url: 'tel:111', type: 'secondary' },
        { label: '📞 Gọi 113 (Khẩn cấp)', url: 'tel:113', type: 'danger' }
      ]
    },
    {
      id: 'about_safeschool',
      keywords: ['safe school', 'safeschool', 'là gì', 'la gi', 'tính năng', 'tinh nang', 'chức năng', 'chuc nang', 'giới thiệu', 'gioi thieu'],
      title: 'Giới thiệu Safe School',
      response: `🏫 **SAFE SCHOOL - HỆ THỐNG AN TOÀN HỌC ĐƯỜNG**\n\nNền tảng công nghệ vì trường học hạnh phúc và an toàn, bao gồm các chức năng chính:\n\n1. 🚨 **Báo cáo khẩn cấp SOS:** Báo động tức thì kèm định vị.\n2. 📋 **Báo cáo bạo lực học đường:** Gửi tin phản ánh công khai hoặc ẩn danh.\n3. 💬 **Tư vấn tâm lý 1-1:** Trò chuyện trực tuyến cùng chuyên gia tâm lý.\n4. 📝 **Trắc nghiệm tâm lý:** Tự đánh giá mức độ lo âu, trầm cảm, căng thẳng.\n5. 📰 **Bài viết tuyên truyền:** Kiến thức phòng chống bạo lực và kỹ năng sống.`,
      actions: [
        { label: '🏠 Về trang chủ', url: `${basePath.root}index.html`, type: 'primary' },
        { label: '📋 Gửi báo cáo', url: `${basePath.pages}report.html`, type: 'secondary' }
      ]
    },
    {
      id: 'counseling_chat',
      keywords: ['tư vấn', 'tu van', 'tham vấn', 'tham van', 'chuyên gia', 'chuyen gia', 'thầy cô tâm lý', 'tro chuyen nguoi that', 'người thật'],
      title: 'Phòng Tư vấn Tâm lý 1-1',
      response: `💬 **KẾT NỐI VỚI THAM VẤN VIÊN TÂM LÝ:**\n\nBạn có thể vào phòng chat trực tuyến để trao đổi trực tiếp với các thầy cô và chuyên viên tâm lý của nhà trường. Cuộc trò chuyện được bảo mật hoàn toàn.`,
      actions: [
        { label: '💬 Mở Phòng Tư vấn Tâm lý', url: `${basePath.pages}chat.html`, type: 'primary' }
      ]
    },
    {
      id: 'test_mental',
      keywords: ['test', 'bài test', 'bai test', 'trắc nghiệm', 'trac nghiem', 'dass', 'kiểm tra tâm lý', 'kiem tra tam ly', 'đánh giá'],
      title: 'Trắc nghiệm Tâm lý DASS-21',
      response: `📝 **BÀI ĐÁNH GIÁ SỨC KHỎE TÂM LÝ:**\n\nHệ thống Safe School cung cấp bài test chuẩn DASS-21 giúp bạn nhận biết tình trạng Căng thẳng (Stress), Lo âu (Anxiety) và Trầm cảm (Depression) chỉ trong 3 phút, có lời khuyên hữu ích ngay sau khi làm xong.`,
      actions: [
        { label: '📝 Bắt đầu làm bài test', url: `${basePath.pages}tests.html`, type: 'primary' }
      ]
    },
    {
      id: 'greeting',
      keywords: ['chào', 'chao', 'xin chào', 'xin chao', 'hello', 'hi', 'bạn là ai', 'ban la ai', 'helo', 'alo', 'hey'],
      title: 'Lời chào',
      response: `👋 **Xin chào bạn! Mình là SafeBot — Trợ lý ảo An toàn Học đường.**\n\nMình có thể hỗ trợ bạn:\n• Hướng dẫn cách xử lý khi gặp bạo lực hoặc bắt nạt học đường\n• Gửi báo cáo SOS khẩn cấp hoặc báo cáo ẩn danh\n• Lời khuyên giải tỏa căng thẳng tâm lý & bài test DASS-21\n• Cung cấp các số điện thoại hỗ trợ khẩn cấp (111, 113)\n\nBạn có thể nhấn vào các gợi ý bên dưới hoặc gõ câu hỏi cho mình nhé!`,
      actions: []
    },
    {
      id: 'thanks',
      keywords: ['cảm ơn', 'cam on', 'thanks', 'thank you', 'tuyệt vời', 'tuyet voi', 'tạm biệt', 'tam biet', 'bye'],
      title: 'Cảm ơn',
      response: `❤️ **Không có gì bạn nhé!**\n\nHãy nhớ rằng bạn luôn có sự đồng hành và bảo vệ từ nhà trường và Safe School. Bất cứ khi nào cần hỗ trợ hay tâm sự, hãy mở SafeBot nhé! Chúc bạn một ngày an lành và tự tin! ✨`,
      actions: []
    }
  ];

  // Các câu hỏi gợi ý nhanh
  const QUICK_SUGGESTIONS = [
    { text: '🚨 Bị bắt nạt phải làm sao?', query: 'Tôi bị bắt nạt phải làm sao?' },
    { text: '🆘 Báo cáo khẩn cấp SOS', query: 'Báo cáo khẩn cấp SOS' },
    { text: '🧠 Bị stress / áp lực học tập', query: 'Tôi đang bị stress và áp lực' },
    { text: '🔒 Báo cáo ẩn danh như thế nào?', query: 'Cách gửi báo cáo ẩn danh' },
    { text: '📞 Hotline hỗ trợ khẩn cấp', query: 'Danh sách số hotline khẩn cấp' },
    { text: '📝 Làm bài test tâm lý', query: 'Làm bài trắc nghiệm tâm lý DASS-21' },
    { text: '🌐 Bạo lực mạng phải làm gì?', query: 'Bị nói xấu trên mạng xã hội phải làm sao?' }
  ];

  // Helper loại bỏ dấu tiếng Việt để so khớp tự nhiên
  const removeAccents = (str) => {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .toLowerCase()
      .trim();
  };

  // Phát âm thanh thông báo nhẹ nhàng qua Web Audio API (không cần tải file)
  const playChime = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch (e) {
      // AudioContext có thể bị chặn khi chưa có user interaction
    }
  };

  // Render HTML cho tin nhắn (hỗ trợ in đậm markdown đơn giản và xuống dòng)
  const formatMarkdown = (text) => {
    if (!text) return '';
    let html = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');
    return html;
  };

  // Lấy thời gian hiện tại định dạng HH:mm
  const getCurrentTime = () => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  };

  // Tìm kiếm câu trả lời phù hợp nhất từ knowledge base
  const findAnswer = (userInput) => {
    const cleanRaw = userInput.toLowerCase();
    const cleanNoAccent = removeAccents(userInput);

    let bestMatch = null;
    let highestScore = 0;

    for (const item of KNOWLEDGE_BASE) {
      let score = 0;
      for (const kw of item.keywords) {
        const kwNoAccent = removeAccents(kw);
        if (cleanRaw.includes(kw.toLowerCase())) {
          score += 3;
        } else if (cleanNoAccent.includes(kwNoAccent)) {
          score += 2;
        }
      }
      if (score > highestScore) {
        highestScore = score;
        bestMatch = item;
      }
    }

    if (bestMatch && highestScore > 0) {
      return bestMatch;
    }

    // Fallback response nếu không nhận diện được
    return {
      title: 'Trợ giúp',
      response: `🤔 **SafeBot chưa hiểu rõ câu hỏi này.**\n\nBạn có thể thử đặt câu hỏi khác hoặc lựa chọn một trong các chủ đề hỗ trợ nhanh bên dưới nhé!\n\nNếu bạn cần trợ giúp trực tiếp, hãy gửi báo cáo hoặc gặp Tham vấn viên tâm lý.`,
      actions: [
        { label: '🚨 Gửi báo cáo khẩn cấp', url: `${basePath.pages}report-sos.html`, type: 'danger' },
        { label: '💬 Chat với Tham vấn viên', url: `${basePath.pages}chat.html`, type: 'primary' },
        { label: '📞 Gọi 111 (Miễn phí)', url: 'tel:111', type: 'secondary' }
      ]
    };
  };

  // Xây dựng DOM cho Chatbot
  const buildChatbotUI = () => {
    // 1. Nút Launcher tròn
    const launcher = document.createElement('button');
    launcher.id = 'safebot-launcher';
    launcher.className = 'safebot-launcher';
    launcher.setAttribute('aria-label', 'Mở trợ lý ảo SafeBot');
    launcher.innerHTML = `
      <svg class="icon-bot" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2 2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"/>
        <rect x="3" y="8" width="18" height="12" rx="4"/>
        <line x1="8" y1="13" x2="8.01" y2="13"/>
        <line x1="16" y1="13" x2="16.01" y2="13"/>
        <path d="M9 17h6"/>
      </svg>
      <svg class="icon-close" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"/>
        <line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
      <span class="safebot-badge" id="safebot-badge">1</span>
      <span class="safebot-tooltip">Trợ lý SafeBot 24/7 💬</span>
    `;

    // 2. Cửa sổ chat
    const windowEl = document.createElement('div');
    windowEl.id = 'safebot-window';
    windowEl.className = 'safebot-window';
    windowEl.innerHTML = `
      <!-- Header -->
      <div class="safebot-header">
        <div class="safebot-header-info">
          <div class="safebot-avatar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            <span class="safebot-online-dot"></span>
          </div>
          <div class="safebot-title-wrap">
            <h4>SafeBot AI <span class="safebot-title-badge">24/7</span></h4>
            <p>Trợ lý An toàn & Hỗ trợ Tâm lý</p>
          </div>
        </div>
        <div class="safebot-header-actions">
          <button class="safebot-header-btn" id="safebot-btn-reset" title="Bắt đầu lại cuộc trò chuyện">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="1 4 1 10 7 10"/>
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
            </svg>
          </button>
          <button class="safebot-header-btn" id="safebot-btn-close" title="Thu nhỏ">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Messages container -->
      <div class="safebot-messages" id="safebot-messages"></div>

      <!-- Quick suggestions chips -->
      <div class="safebot-quick-chips" id="safebot-quick-chips"></div>

      <!-- Input area -->
      <div class="safebot-input-bar">
        <div class="safebot-input-wrap">
          <input type="text" class="safebot-input" id="safebot-input" placeholder="Nhập câu hỏi cho SafeBot..." autocomplete="off">
          <button class="safebot-send-btn" id="safebot-send-btn" disabled title="Gửi tin nhắn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
        <div class="safebot-footer-hint">
          <span>🔒 Hoàn toàn bảo mật & bảo vệ quyền lợi học sinh</span>
        </div>
      </div>
    `;

    document.body.appendChild(launcher);
    document.body.appendChild(windowEl);

    return { launcher, windowEl };
  };

  // Khởi tạo Chatbot logic
  const initChatbot = () => {
    const { launcher, windowEl } = buildChatbotUI();

    const messagesContainer = document.getElementById('safebot-messages');
    const chipsContainer = document.getElementById('safebot-quick-chips');
    const input = document.getElementById('safebot-input');
    const sendBtn = document.getElementById('safebot-send-btn');
    const resetBtn = document.getElementById('safebot-btn-reset');
    const closeBtn = document.getElementById('safebot-btn-close');
    const badge = document.getElementById('safebot-badge');

    let isOpen = false;
    let isTyping = false;

    // Toggle Open/Close
    const toggleWindow = (open) => {
      isOpen = typeof open === 'boolean' ? open : !isOpen;
      if (isOpen) {
        launcher.classList.add('open');
        windowEl.classList.add('active');
        badge.style.display = 'none';
        input.focus();
        scrollToBottom();
      } else {
        launcher.classList.remove('open');
        windowEl.classList.remove('active');
      }
    };

    launcher.addEventListener('click', () => toggleWindow());
    closeBtn.addEventListener('click', () => toggleWindow(false));

    // Cuộn xuống tin nhắn mới nhất
    const scrollToBottom = () => {
      setTimeout(() => {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }, 50);
    };

    // Render nút Suggestions
    const renderChips = () => {
      chipsContainer.innerHTML = '';
      QUICK_SUGGESTIONS.forEach(item => {
        const chip = document.createElement('button');
        chip.className = 'safebot-chip';
        chip.type = 'button';
        chip.textContent = item.text;
        chip.addEventListener('click', () => {
          handleUserSend(item.query);
        });
        chipsContainer.appendChild(chip);
      });
    };

    // Thêm tin nhắn của User
    const appendUserMessage = (text) => {
      const row = document.createElement('div');
      row.className = 'safebot-msg-row user';
      row.innerHTML = `
        <div class="safebot-bubble-wrap">
          <div class="safebot-bubble">${formatMarkdown(text)}</div>
          <span class="safebot-time">${getCurrentTime()}</span>
        </div>
      `;
      messagesContainer.appendChild(row);
      scrollToBottom();
    };

    // Thêm typing indicator
    const showTyping = () => {
      const row = document.createElement('div');
      row.className = 'safebot-msg-row bot typing-indicator-row';
      row.id = 'safebot-typing-row';
      row.innerHTML = `
        <div class="safebot-msg-avatar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
        </div>
        <div class="safebot-bubble-wrap">
          <div class="safebot-bubble">
            <div class="safebot-typing-dots">
              <span></span>
              <span></span>
              <span></span>
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

    // Thêm tin nhắn của Bot
    const appendBotMessage = (answerObj) => {
      const row = document.createElement('div');
      row.className = 'safebot-msg-row bot';

      let actionsHtml = '';
      if (answerObj.actions && answerObj.actions.length > 0) {
        actionsHtml = `
          <div class="safebot-actions-card">
            ${answerObj.actions.map(act => `
              <a href="${act.url}" class="safebot-action-link ${act.type || 'secondary'}">
                ${act.label}
              </a>
            `).join('')}
          </div>
        `;
      }

      row.innerHTML = `
        <div class="safebot-msg-avatar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
        </div>
        <div class="safebot-bubble-wrap">
          <div class="safebot-bubble">
            ${formatMarkdown(answerObj.response)}
            ${actionsHtml}
          </div>
          <span class="safebot-time">${getCurrentTime()}</span>
        </div>
      `;

      messagesContainer.appendChild(row);
      scrollToBottom();
      playChime();
    };

    // Xử lý gửi tin nhắn
    const handleUserSend = (textToSend) => {
      const text = (textToSend || input.value).trim();
      if (!text || isTyping) return;

      appendUserMessage(text);
      input.value = '';
      sendBtn.disabled = true;
      isTyping = true;

      // Giả lập typing thời gian thực
      showTyping();

      setTimeout(() => {
        removeTyping();
        const answer = findAnswer(text);
        appendBotMessage(answer);
        isTyping = false;
        // Tự động focus lại vào input
        if (isOpen) input.focus();
      }, 650);
    };

    // Input events
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

    // Reset Chatbot
    const resetChat = () => {
      messagesContainer.innerHTML = '';
      const greeting = KNOWLEDGE_BASE.find(k => k.id === 'greeting');
      if (greeting) {
        appendBotMessage(greeting);
      }
      renderChips();
    };

    resetBtn.addEventListener('click', () => {
      if (confirm('Bạn có muốn bắt đầu lại cuộc trò chuyện với SafeBot không?')) {
        resetChat();
      }
    });

    // Khởi tạo ban đầu
    resetChat();

    // Export Global API để các thành phần khác có thể kích hoạt
    window.SafeBot = {
      open: () => toggleWindow(true),
      close: () => toggleWindow(false),
      toggle: () => toggleWindow(),
      ask: (question) => {
        toggleWindow(true);
        handleUserSend(question);
      }
    };
  };

  // Tự động khởi chạy khi DOM sẵn sàng
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initChatbot);
  } else {
    initChatbot();
  }
})();
