import { 
  auth, onAuthStateChanged, db, doc, getDoc, setDoc, updateDoc, 
  serverTimestamp, collection, addDoc, query, where, orderBy, limit, getDocs,
  updateEmail, updatePassword, EmailAuthProvider, reauthenticateWithCredential
} from './firebaseConfig.js';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('profile-form');
  const btnCancel = document.getElementById('btn-cancel');
  
  const fullnameInput = document.getElementById('fullname');
  const phoneInput = document.getElementById('phone');
  const cccdInput = document.getElementById('cccd');
  const roleInput = document.getElementById('role');
  const dobInput = document.getElementById('dob');
  const schoolInput = document.getElementById('school');
  const gradeClassInput = document.getElementById('gradeClass');
  const sidebarLangSelect = document.getElementById('sidebar-language-select');

  // Avatar Elements
  const avatarInput = document.getElementById('avatar-input');
  const avatarPreview = document.getElementById('avatar-preview');
  const avatarPlaceholder = document.getElementById('avatar-placeholder');
  let selectedAvatarFile = null;

  // Settings & 2FA Elements
  const btnOpenSettings = document.getElementById('btn-open-settings');
  const btnCloseSettings = document.getElementById('btn-close-settings');
  const modalSettings = document.getElementById('modal-settings');
  const settingsForm = document.getElementById('settings-form');

  const settingEmail = document.getElementById('setting-email');
  const settingCurrentPass = document.getElementById('setting-current-pass');
  const settingNewPass = document.getElementById('setting-new-pass');
  const settingConfirmPass = document.getElementById('setting-confirm-pass');

  const toggle2FA = document.getElementById('toggle-2fa');
  const badge2FAStatus = document.getElementById('badge-2fa-status');
  const boxPinSetup = document.getElementById('box-pin-setup');
  const inputPinCode = document.getElementById('input-pin-code');
  const inputConfirmPin = document.getElementById('input-confirm-pin');

  // 2FA Verify Modal Elements
  const modal2FAVerify = document.getElementById('modal-2fa-verify');
  const form2FAVerify = document.getElementById('form-2fa-verify');
  const inputVerifyPin = document.getElementById('input-verify-pin');
  const btnCancelVerify = document.getElementById('btn-cancel-verify');
  const errorVerifyPin = document.getElementById('error-verify-pin');

  let currentUser = null;
  let currentUserUid = null;
  let currentUserRole = 'student'; // will be set after loading profile data
  let originalData = {};
  let pending2FAAction = null;

  // --- 1. MULTI-LANGUAGE DICTIONARY ---
  const translations = {
    vi: {
      pageTitle: "Quản lý hồ sơ cá nhân",
      pageSubtitle: "Xem và cập nhật thông tin của bạn",
      moodTitle: "Hôm nay bạn cảm thấy thế nào?",
      moodSubtitle: "Ghi nhận cảm xúc mỗi ngày giúp bạn hiểu rõ bản thân hơn.",
      lblFullname: "Họ và tên",
      lblPhone: "Số điện thoại",
      lblDob: "Ngày sinh",
      lblSchool: "Trường / Cơ sở học tập",
      lblGrade: "Lớp",
      lblCccd: "Số căn cước công dân",
      lblLanguage: "🌐 Ngôn ngữ hiển thị / Language",
      lblRole: "Vai trò (Không thể thay đổi)",
      btnSave: "Lưu thông tin",
      btnCancel: "Hủy",
      btnSettings: "⚙️ Cài đặt tài khoản & Bảo mật",
      ctaTitle: "💬 Tư vấn Tâm lý Trực tuyến",
      ctaSub: "Kết nối bảo mật với tham vấn viên chuyên nghiệp. Giải tỏa căng thẳng ngay.",
      settingsTitle: "Cài đặt Tài khoản & Bảo mật",
      secAccount: "📧 Thông tin đăng nhập",
      lblNewEmail: "Email mới",
      lblCurrentPass: "Mật khẩu hiện tại (Cần thiết khi đổi Email/Mật khẩu)",
      lblNewPass: "Mật khẩu mới",
      lblConfirmPass: "Xác nhận mật khẩu mới",
      sec2fa: "🔐 Bảo mật 2 lớp (2FA Mã PIN)",
      lblToggle2fa: "Kích hoạt xác thực mã PIN 2FA",
      txt2faDesc: "Khi bật 2FA, bạn sẽ cần nhập Mã PIN 6 chữ số mỗi khi muốn thay đổi thông tin quan trọng.",
      lblPinCode: "Mã PIN 6 chữ số mới",
      lblConfirmPin: "Xác nhận Mã PIN 6 chữ số",
      btnSaveSettings: "Lưu Cài đặt",
      verifyTitle: "Xác thực mã PIN 2FA",
      verifySub: "Vui lòng nhập Mã PIN 6 chữ số của bạn để hoàn tất thay đổi này."
    },
    en: {
      pageTitle: "Personal Profile Management",
      pageSubtitle: "View and update your personal information",
      moodTitle: "How are you feeling today?",
      moodSubtitle: "Tracking your daily mood helps you understand yourself better.",
      lblFullname: "Full Name",
      lblPhone: "Phone Number",
      lblDob: "Date of Birth",
      lblSchool: "School / Institution",
      lblGrade: "Grade / Class",
      lblCccd: "ID / National Identification",
      lblLanguage: "🌐 Display Language",
      lblRole: "Role (Cannot be changed)",
      btnSave: "Save Profile",
      btnCancel: "Cancel",
      btnSettings: "⚙️ Account & Security Settings",
      ctaTitle: "💬 Online Psychological Counseling",
      ctaSub: "Securely connect with professional counselors. Relieve stress now.",
      settingsTitle: "Account & Security Settings",
      secAccount: "📧 Login Information",
      lblNewEmail: "New Email",
      lblCurrentPass: "Current Password (Required for Email/Password changes)",
      lblNewPass: "New Password",
      lblConfirmPass: "Confirm New Password",
      sec2fa: "🔐 Two-Factor Authentication (2FA PIN)",
      lblToggle2fa: "Enable 2FA PIN Authentication",
      txt2faDesc: "When 2FA is enabled, you must enter a 6-digit PIN to perform sensitive account changes.",
      lblPinCode: "New 6-Digit PIN",
      lblConfirmPin: "Confirm 6-Digit PIN",
      btnSaveSettings: "Save Settings",
      verifyTitle: "2FA PIN Verification",
      verifySub: "Please enter your 6-digit PIN to complete this change."
    },
    zh: {
      pageTitle: "个人资料管理",
      pageSubtitle: "查看并更新您的个人信息",
      moodTitle: "今天感觉怎么样？",
      moodSubtitle: "记录每天的情绪有助于更好地了解自己。",
      lblFullname: "姓名",
      lblPhone: "电话号码",
      lblDob: "出生日期",
      lblSchool: "学校 / 机构",
      lblGrade: "班级",
      lblCccd: "身份证件号码",
      lblLanguage: "🌐 显示语言 / Language",
      lblRole: "身份角色 (无法修改)",
      btnSave: "保存资料",
      btnCancel: "取消",
      btnSettings: "⚙️ 账户与安全设置",
      ctaTitle: "💬 在线心理咨询",
      ctaSub: "与专业心理咨询师安全连接，及时舒缓压力。",
      settingsTitle: "账户与安全设置",
      secAccount: "📧 登录信息",
      lblNewEmail: "新邮箱",
      lblCurrentPass: "当前密码 (修改邮箱/密码所需)",
      lblNewPass: "新密码",
      lblConfirmPass: "确认新密码",
      sec2fa: "🔐 双重验证 (2FA PIN码)",
      lblToggle2fa: "启用2FA PIN验证",
      txt2faDesc: "启用2FA后，进行敏感修改时需要输入6位PIN码。",
      lblPinCode: "新的6位PIN码",
      lblConfirmPin: "确认6位PIN码",
      btnSaveSettings: "保存设置",
      verifyTitle: "2FA PIN 验证",
      verifySub: "请输入您的6位PIN码以完成此操作。"
    },
    ko: {
      pageTitle: "개인 프로필 관리",
      pageSubtitle: "개인 정보를 확인하고 업데이트하세요",
      moodTitle: "오늘 기분이 어떠신가요?",
      moodSubtitle: "매일의 감정을 기록하면 자신을 더 잘 이해하는 데 도움이 됩니다.",
      lblFullname: "성명",
      lblPhone: "전화번호",
      lblDob: "생년월일",
      lblSchool: "학교 / 기관",
      lblGrade: "학년 / 반",
      lblCccd: "신분증 번호",
      lblLanguage: "🌐 표시 언어 / Language",
      lblRole: "역할 (변경 불가)",
      btnSave: "정보 저장",
      btnCancel: "취소",
      btnSettings: "⚙️ 계정 및 보안 설정",
      ctaTitle: "💬 온라인 심리 상담",
      ctaSub: "전문 상담사와 안전하게 연결하여 스트레스를 해소하세요.",
      settingsTitle: "계정 및 보안 설정",
      secAccount: "📧 로그인 정보",
      lblNewEmail: "새 이메일",
      lblCurrentPass: "현재 비밀번호 (이메일/비밀번호 변경 시 필요)",
      lblNewPass: "새 비밀번호",
      lblConfirmPass: "새 비밀번호 확인",
      sec2fa: "🔐 2단계 인증 (2FA PIN 번호)",
      lblToggle2fa: "2FA PIN 인증 활성화",
      txt2faDesc: "2FA를 활성화하면 중요 정보 변경 시 6자리 PIN 번호를 입력해야 합니다.",
      lblPinCode: "새 6자리 PIN 번호",
      lblConfirmPin: "6자리 PIN 번호 확인",
      btnSaveSettings: "설정 저장",
      verifyTitle: "2FA PIN 인증",
      verifySub: "변경 사항을 완료하려면 6자리 PIN 번호를 입력하세요."
    },
    es: {
      pageTitle: "Gestión de Perfil Personal",
      pageSubtitle: "Ver y actualizar tu información personal",
      moodTitle: "¿Cómo te sientes hoy?",
      moodSubtitle: "Registrar tu estado de ánimo diario te ayuda a conocerte mejor.",
      lblFullname: "Nombre Completo",
      lblPhone: "Teléfono",
      lblDob: "Fecha de Nacimiento",
      lblSchool: "Escuela / Institución",
      lblGrade: "Grado / Curso",
      lblCccd: "Documento de Identidad",
      lblLanguage: "🌐 Idioma / Language",
      lblRole: "Rol (No modificable)",
      btnSave: "Guardar Perfil",
      btnCancel: "Cancelar",
      btnSettings: "⚙️ Configuración y Seguridad",
      ctaTitle: "💬 Orientación Psicológica en Línea",
      ctaSub: "Conéctate de forma segura con consejeros profesionales.",
      settingsTitle: "Configuración de Cuenta y Seguridad",
      secAccount: "📧 Datos de Acceso",
      lblNewEmail: "Nuevo Correo Electrónico",
      lblCurrentPass: "Contraseña Actual",
      lblNewPass: "Nueva Contraseña",
      lblConfirmPass: "Confirmar Nueva Contraseña",
      sec2fa: "🔐 Autenticación de Dos Factores (PIN 2FA)",
      lblToggle2fa: "Activar PIN de Seguridad 2FA",
      txt2faDesc: "Al activar 2FA, deberás ingresar un PIN de 6 dígitos para cambios importantes.",
      lblPinCode: "Nuevo PIN de 6 dígitos",
      lblConfirmPin: "Confirmar PIN de 6 dígitos",
      btnSaveSettings: "Guardar Configuración",
      verifyTitle: "Verificación de PIN 2FA",
      verifySub: "Ingresa tu PIN de 6 dígitos para completar la operación."
    },
    pt: {
      pageTitle: "Gerenciamento de Perfil Pessoal",
      pageSubtitle: "Veja e atualize suas informações",
      moodTitle: "Como você está se sentindo hoje?",
      moodSubtitle: "Acompanhar seu humor diário ajuda você a se conhecer melhor.",
      lblFullname: "Nome Completo",
      lblPhone: "Telefone",
      lblDob: "Data de Nascimento",
      lblSchool: "Escola / Instituição",
      lblGrade: "Série / Turma",
      lblCccd: "Documento de Identidade",
      lblLanguage: "🌐 Idioma de Exibição",
      lblRole: "Função (Não editável)",
      btnSave: "Salvar Perfil",
      btnCancel: "Cancelar",
      btnSettings: "⚙️ Configurações e Segurança",
      ctaTitle: "💬 Aconselhamento Psicológico Online",
      ctaSub: "Conecte-se com segurança com conselheiros profissionais.",
      settingsTitle: "Configurações da Conta e Segurança",
      secAccount: "📧 Dados de Login",
      lblNewEmail: "Novo E-mail",
      lblCurrentPass: "Senha Atual",
      lblNewPass: "Nova Senha",
      lblConfirmPass: "Confirmar Nova Senha",
      sec2fa: "🔐 Autenticação de Dois Fatores (PIN 2FA)",
      lblToggle2fa: "Ativar Autenticação PIN 2FA",
      txt2faDesc: "Com o 2FA ativado, você precisará digitar um PIN de 6 dígitos para alterações críticas.",
      lblPinCode: "Novo PIN de 6 dígitos",
      lblConfirmPin: "Confirmar PIN de 6 dígitos",
      btnSaveSettings: "Salvar Configurações",
      verifyTitle: "Verificação de PIN 2FA",
      verifySub: "Insira seu PIN de 6 dígitos para concluir a ação."
    },
    ru: {
      pageTitle: "Управление личным профилем",
      pageSubtitle: "Просмотр и обновление вашей информации",
      moodTitle: "Как вы себя чувствуете сегодня?",
      moodSubtitle: "Отслеживание настроения помогает лучше понять себя.",
      lblFullname: "Полное имя",
      lblPhone: "Номер телефона",
      lblDob: "Дата рождения",
      lblSchool: "Учебное заведение",
      lblGrade: "Класс / Группа",
      lblCccd: "Удостоверение личности",
      lblLanguage: "🌐 Язык интерфейса",
      lblRole: "Роль (Нельзя изменить)",
      btnSave: "Сохранить профиль",
      btnCancel: "Отмена",
      btnSettings: "⚙️ Настройки и безопасность",
      ctaTitle: "💬 Онлайн психологическая консультация",
      ctaSub: "Конфиденциальная связь с профессиональными консультантами.",
      settingsTitle: "Настройки аккаунта и безопасность",
      secAccount: "📧 Учетные данные",
      lblNewEmail: "Новый Email",
      lblCurrentPass: "Текущий пароль",
      lblNewPass: "Новый пароль",
      lblConfirmPass: "Подтвердите новый пароль",
      sec2fa: "🔐 Двухфакторная аутентификация (2FA PIN)",
      lblToggle2fa: "Включить 2FA PIN-код",
      txt2faDesc: "При включенном 2FA требуется 6-значный PIN-код для изменения важных данных.",
      lblPinCode: "Новый 6-значный PIN",
      lblConfirmPin: "Подтвердите 6-значный PIN",
      btnSaveSettings: "Сохранить настройки",
      verifyTitle: "Проверка PIN 2FA",
      verifySub: "Введите 6-значный PIN-код для завершения действия."
    },
    ja: {
      pageTitle: "プロフィール管理",
      pageSubtitle: "個人情報の確認と更新",
      moodTitle: "今日の気分はいかがですか？",
      moodSubtitle: "毎日の気分を記録することで、自分自身をよりよく理解できます。",
      lblFullname: "氏名",
      lblPhone: "電話番号",
      lblDob: "生年月日",
      lblSchool: "学校・教育機関",
      lblGrade: "学年・学級",
      lblCccd: "身分証明書番号",
      lblLanguage: "🌐 表示言語 / Language",
      lblRole: "役割 (変更不可)",
      btnSave: "プロフィールを保存",
      btnCancel: "キャンセル",
      btnSettings: "⚙️ アカウント設定とセキュリティ",
      ctaTitle: "💬 オンライン心理カウンセリング",
      ctaSub: "専門のカウンセラーに安全に相談できます。",
      settingsTitle: "アカウント設定とセキュリティ",
      secAccount: "📧 ログイン情報",
      lblNewEmail: "新しいメールアドレス",
      lblCurrentPass: "現在のパスワード",
      lblNewPass: "新しいパスワード",
      lblConfirmPass: "新しいパスワードの確認",
      sec2fa: "🔐 2段階認証 (2FA PINコード)",
      lblToggle2fa: "2FA PIN認証を有効化",
      txt2faDesc: "2FAを有効にすると、重要な変更の際に6桁のPINコードが必要になります。",
      lblPinCode: "新しい6桁のPIN",
      lblConfirmPin: "6桁のPINの確認",
      btnSaveSettings: "設定を保存",
      verifyTitle: "2FA PIN 認証",
      verifySub: "操作を完了するには6桁のPINコードを入力してください。"
    },
    tl: {
      pageTitle: "Pamamahala ng Personal na Profile",
      pageSubtitle: "Tignan at i-update ang iyong impormasyon",
      moodTitle: "Ano ang nararamdaman mo ngayong araw?",
      moodSubtitle: "Ang pag-record ng iyong mood araw-araw ay tumutulong upang mas kilalanin ang sarili.",
      lblFullname: "Buong Pangalan",
      lblPhone: "Numero ng Telepono",
      lblDob: "Petsa ng Kapanganakan",
      lblSchool: "Paaralan / Institusyon",
      lblGrade: "Baitang / Seksyon",
      lblCccd: "ID Number",
      lblLanguage: "🌐 Wika / Language",
      lblRole: "Gampanin (Hindi mababago)",
      btnSave: "I-save ang Profile",
      btnCancel: "Kanselahin",
      btnSettings: "⚙️ Settings at Seguridad",
      ctaTitle: "💬 Online Psychological Counseling",
      ctaSub: "Ligtas na kumonekta sa mga propesyonal na tagapayo.",
      settingsTitle: "Account & Security Settings",
      secAccount: "📧 Impormasyon sa Login",
      lblNewEmail: "Bagong Email",
      lblCurrentPass: "Kasalukuyang Password",
      lblNewPass: "Bagong Password",
      lblConfirmPass: "Kumpirmahin ang Bagong Password",
      sec2fa: "🔐 Two-Factor Authentication (2FA PIN)",
      lblToggle2fa: "I-activate ang 2FA PIN",
      txt2faDesc: "Kapag naka-on ang 2FA, kailangan mong ilagay ang 6-digit PIN sa bawat mahalagang pagbabago.",
      lblPinCode: "Bagong 6-Digit PIN",
      lblConfirmPin: "Kumpirmahin ang 6-Digit PIN",
      btnSaveSettings: "I-save ang Settings",
      verifyTitle: "2FA PIN Verification",
      verifySub: "Mangyaring ilagay ang iyong 6-digit PIN upang makumpleto ito."
    }
  };

  function applyLanguage(lang) {
    const t = translations[lang] || translations.vi;
    localStorage.setItem('safe_school_lang', lang);

    const el = (id, text) => {
      const element = document.getElementById(id);
      if (element) element.textContent = text;
    };

    const titleEl = document.querySelector('.page-title');
    const subEl = document.querySelector('.page-subtitle');
    if (titleEl) titleEl.textContent = t.pageTitle;
    if (subEl) subEl.textContent = t.pageSubtitle;

    el('lbl-fullname', t.lblFullname);
    el('lbl-phone', t.lblPhone);
    el('lbl-dob', t.lblDob);
    el('lbl-school', t.lblSchool);
    el('lbl-gradeClass', t.lblGrade);
    el('lbl-cccd', t.lblCccd);
    el('lbl-language', t.lblLanguage);
    el('lbl-role', t.lblRole);

    const btnSaveText = document.getElementById('btn-save-text');
    if (btnSaveText) btnSaveText.textContent = t.btnSave;
    el('btn-cancel', t.btnCancel);
    el('btn-open-settings', t.btnSettings);

    const ctaHead = document.querySelector('.counseling-cta-content h4');
    const ctaP = document.querySelector('.counseling-cta-content p');
    if (ctaHead) ctaHead.textContent = t.ctaTitle;
    if (ctaP) ctaP.textContent = t.ctaSub;

    // Settings Modal
    el('txt-settings-title', t.settingsTitle);
    el('txt-sec-account', t.secAccount);
    el('lbl-setting-email', t.lblNewEmail);
    el('lbl-setting-curr-pass', t.lblCurrentPass);
    el('lbl-setting-new-pass', t.lblNewPass);
    el('lbl-setting-conf-pass', t.lblConfirmPass);
    el('txt-sec-2fa', t.sec2fa);
    el('lbl-toggle-2fa', t.lblToggle2fa);
    el('txt-2fa-desc', t.txt2faDesc);
    el('lbl-pin-code', t.lblPinCode);
    el('lbl-confirm-pin', t.lblConfirmPin);
    el('btn-save-settings', t.btnSaveSettings);

    // Verify Modal
    el('txt-verify-title', t.verifyTitle);
    el('txt-verify-subtitle', t.verifySub);
  }

  window.addEventListener('languageChanged', (e) => {
    if (e.detail && e.detail.language) {
      applyLanguage(e.detail.language);
    }
  });

  // Initial language application from localStorage
  const initLang = localStorage.getItem('safe_school_lang') || 'vi';
  applyLanguage(initLang);

  // Auth state observer
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      currentUser = user;
      currentUserUid = user.uid;
      await loadProfileData(user.uid);
    } else {
      window.location.href = '../auth/sign-in.html';
    }
  });

  const roleLabelsByLang = {
    vi: { student: 'Học sinh', teacher: 'Giáo viên / Quản lý', counselor: 'Tham vấn viên tâm lý', parent: 'Phụ huynh', admin: 'Admin Quản trị' },
    en: { student: 'Student', teacher: 'Teacher / Manager', counselor: 'Psychological Counselor', parent: 'Parent', admin: 'System Admin' },
    zh: { student: '学生', teacher: '教师 / 管理员', counselor: '心理咨询师', parent: '家长', admin: '系统管理员' },
    ko: { student: '학생', teacher: '교사 / 관리자', counselor: '심리 상담사', parent: '학부모', admin: '시스템 관리자' },
    es: { student: 'Estudiante', teacher: 'Profesor / Administrador', counselor: 'Consejero Psicológico', parent: 'Padre / Tutor', admin: 'Administrador' },
    pt: { student: 'Estudante', teacher: 'Professor / Gestor', counselor: 'Conselheiro Psicológico', parent: 'Responsável / Pai', admin: 'Administrador' },
    ru: { student: 'Ученик', teacher: 'Учитель / Администратор', counselor: 'Психолог-консультант', parent: 'Родитель', admin: 'Администратор' },
    ja: { student: '生徒', teacher: '教師 / 管理者', counselor: '心理カウンセラー', parent: '保護者', admin: 'システム管理者' },
    tl: { student: 'Estudyante', teacher: 'Guro / Tagapamahala', counselor: 'Tagapayo sa Sikolohiya', parent: 'Magulang', admin: 'Admin' }
  };

  function normalizeRole(role) {
    if (!role) return 'student';
    const r = String(role).toLowerCase().trim();
    if (r === 'admin' || r.includes('quản trị') || r.includes('admin')) return 'admin';
    if (r === 'teacher' || r.includes('giáo viên') || r.includes('giao vien') || r.includes('teacher')) return 'teacher';
    if (r === 'counselor' || r.includes('tham vấn') || r.includes('tham van') || r.includes('counselor')) return 'counselor';
    if (r === 'parent' || r.includes('phụ huynh') || r.includes('phu huynh') || r.includes('parent')) return 'parent';
    return 'student';
  }

  function getRoleLabel(role, lang = 'vi') {
    const norm = normalizeRole(role);
    const langDict = roleLabelsByLang[lang] || roleLabelsByLang.vi;
    return langDict[norm] || roleLabelsByLang.vi[norm] || 'Học sinh';
  }

  const roleLabels = roleLabelsByLang.vi;

  async function loadProfileData(uid) {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        originalData = data;
        const userRole = normalizeRole(data.role);
        
        fullnameInput.value = data.fullName || '';
        phoneInput.value = data.phone || '';
        cccdInput.value = data.cccd || '';
        if (dobInput) dobInput.value = data.dob || '';
        if (schoolInput) schoolInput.value = data.school || '';
        if (gradeClassInput) gradeClassInput.value = data.gradeClass || '';
        if (roleInput) roleInput.value = userRole;
        updateAvatarUI(data.avatar);

        // Language setup
        const userLang = data.language || localStorage.getItem('safe_school_lang') || 'vi';
        if (sidebarLangSelect) sidebarLangSelect.value = userLang;
        applyLanguage(userLang);

        // 2FA Setup
        const is2FA = !!data.twoFactorEnabled;
        toggle2FA.checked = is2FA;
        update2FABadge(is2FA);

        // Display name under avatar
        const displayName = document.getElementById('display-name');
        const displayRole = document.getElementById('display-role');
        if (displayName) displayName.textContent = data.fullName || 'Người dùng';
        if (displayRole) displayRole.textContent = getRoleLabel(userRole, userLang);
        if (avatarPlaceholder && data.fullName) {
          avatarPlaceholder.textContent = data.fullName.charAt(0).toUpperCase();
        }

        // --- ROLE ACCESS CONTROL & PROFILE LOCKING ---
        // Requirement: Role 'học sinh' has locked info after registration. Only admin or teacher can edit.
        const isStudent = (userRole === 'student');
        const isStaff = ['admin', 'teacher'].includes(userRole);

        const lockedBanner = document.getElementById('student-locked-banner');
        const staffBadge = document.getElementById('staff-edit-badge');
        const btnSave = document.getElementById('btn-save');
        const btnCancel = document.getElementById('btn-cancel');
        const avatarWrapper = document.getElementById('avatar-wrapper');

        const identityInputs = [fullnameInput, phoneInput, cccdInput, dobInput, schoolInput, gradeClassInput];

        if (isStudent) {
          if (lockedBanner) lockedBanner.style.display = 'flex';
          if (staffBadge) staffBadge.style.display = 'none';

          // Lock inputs for student
          identityInputs.forEach(inp => {
            if (inp) {
              inp.disabled = true;
              inp.readOnly = true;
              inp.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
              inp.style.cursor = 'not-allowed';
              inp.style.opacity = '0.75';
              inp.title = 'Thông tin này đã được khóa cố định đối với học sinh.';
            }
          });

          // Hide / disable save buttons for student
          if (btnSave) {
            btnSave.disabled = true;
            btnSave.style.display = 'none';
          }
          if (btnCancel) {
            btnCancel.style.display = 'none';
          }
          if (avatarWrapper) {
            avatarWrapper.style.cursor = 'default';
          }
        } else {
          // Admin, Teacher, Counselor, Parent
          if (lockedBanner) lockedBanner.style.display = 'none';
          if (staffBadge) staffBadge.style.display = isStaff ? 'flex' : 'none';

          identityInputs.forEach(inp => {
            if (inp) {
              inp.disabled = false;
              inp.readOnly = false;
              inp.style.backgroundColor = '';
              inp.style.cursor = '';
              inp.style.opacity = '';
              inp.title = '';
            }
          });

          if (btnSave) {
            btnSave.disabled = false;
            btnSave.style.display = 'inline-flex';
          }
          if (btnCancel) {
            btnCancel.style.display = 'inline-flex';
          }
          if (avatarWrapper) {
            avatarWrapper.style.cursor = 'pointer';
          }
        }

        // Save role for later use (student editor, etc.)
        currentUserRole = userRole;

        // Show or hide student editor section for teacher/admin
        const studentEditorSection = document.getElementById('student-editor-section');
        if (studentEditorSection) {
          studentEditorSection.style.display = ['teacher', 'admin'].includes(userRole) ? 'block' : 'none';
        }
      }
    } catch (e) {
      showToast('error', 'Lỗi', 'Không thể tải thông tin hồ sơ.');
    }
  }

  function update2FABadge(enabled) {
    if (enabled) {
      badge2FAStatus.innerHTML = '🟢 Đã bật 2FA';
      badge2FAStatus.style.background = 'rgba(46, 204, 113, 0.2)';
      badge2FAStatus.style.color = '#2ecc71';
    } else {
      badge2FAStatus.innerHTML = '⚪ Chưa bật';
      badge2FAStatus.style.background = 'rgba(255, 255, 255, 0.1)';
      badge2FAStatus.style.color = 'var(--text-muted)';
    }
  }

  // Toast Function
  function showToast(type, title, message) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<div class="toast-content"><div class="toast-title">${title}</div><div class="toast-message">${message}</div></div>`;
    container.appendChild(toast);
    setTimeout(() => { toast.classList.add('removing'); setTimeout(() => toast.remove(), 300); }, 5000);
  }

  // Validation
  function validatePhone(phone) { return /^(0[3|5|7|8|9])+([0-9]{8})$/.test(phone); }
  function validateCCCD(cccd) { return /^[0-9]{12}$/.test(cccd); }
  
  function showError(groupId, show) {
    const group = document.getElementById(groupId);
    if (group) {
      if (show) group.classList.add('error');
      else group.classList.remove('error');
    }
  }

  // Avatar Logic

  function updateAvatarUI(url) {
    if (url) {
      avatarPreview.src = url;
      avatarPreview.style.display = 'block';
      avatarPlaceholder.style.display = 'none';
      
      const sidebarAvatar = document.querySelector('.sidebar-user .sidebar-avatar');
      const initialEl = document.getElementById('user-avatar-initial');
      if (sidebarAvatar) {
        sidebarAvatar.style.backgroundImage = `url(${url})`;
        sidebarAvatar.style.backgroundSize = 'cover';
        sidebarAvatar.style.backgroundPosition = 'center';
        if (initialEl) initialEl.style.display = 'none';
      }
    } else {
      avatarPreview.src = '';
      avatarPreview.style.display = 'none';
      avatarPlaceholder.style.display = 'block';

      const sidebarAvatar = document.querySelector('.sidebar-user .sidebar-avatar');
      const initialEl = document.getElementById('user-avatar-initial');
      if (sidebarAvatar) sidebarAvatar.style.backgroundImage = 'none';
      if (initialEl) initialEl.style.display = 'inline';
    }
  }

  avatarInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      selectedAvatarFile = e.target.files[0];
      const objectUrl = URL.createObjectURL(selectedAvatarFile);
      updateAvatarUI(objectUrl);
    }
  });

  // --- SAVE PROFILE FORM ---
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentUserUid) return;

    // Student guard: students cannot submit profile modifications
    if (originalData && (normalizeRole(originalData.role) === 'student')) {
      showToast('error', 'Thao tác bị khóa', 'Tài khoản Học sinh không được phép tự sửa đổi thông tin đã đăng ký. Vui lòng liên hệ Giáo viên hoặc Quản trị viên.');
      return;
    }

    const fullname = fullnameInput.value.trim();
    const phone = phoneInput.value.trim();
    const cccd = cccdInput.value.trim();
    const role = roleInput.value;

    let valid = true;
    if (!fullname) { showError('group-fullname', true); valid = false; } else showError('group-fullname', false);
    if (!validatePhone(phone)) { showError('group-phone', true); valid = false; } else showError('group-phone', false);
    if (!validateCCCD(cccd)) { showError('group-cccd', true); valid = false; } else showError('group-cccd', false);

    if (!valid) return;

    // Check if 2FA verification is needed before saving sensitive profile updates
    if (originalData.twoFactorEnabled) {
      request2FAVerification(async () => {
        await executeProfileSave(fullname, phone, cccd, role);
      });
    } else {
      await executeProfileSave(fullname, phone, cccd, role);
    }
  });

  async function executeProfileSave(fullname, phone, cccd, role) {
    try {
      document.getElementById('btn-save-text').textContent = "Đang lưu...";
      
      let avatarUrl = originalData.avatar || '';
      if (selectedAvatarFile) {
        document.getElementById('btn-save-text').textContent = "Đang tải ảnh...";
        const CLOUDINARY_URL = 'https://api.cloudinary.com/v1_1/unmjajhr/auto/upload';
        const CLOUDINARY_UPLOAD_PRESET = 'safe_school_preset';
        
        const formData = new FormData();
        formData.append('file', selectedAvatarFile);
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
        
        const res = await fetch(CLOUDINARY_URL, { method: 'POST', body: formData });
        const data = await res.json();
        if (data.secure_url) {
          avatarUrl = data.secure_url;
        }
      }

      document.getElementById('btn-save-text').textContent = "Đang lưu thông tin...";
      await setDoc(doc(db, 'users', currentUserUid), {
        fullName: fullname,
        phone: phone,
        cccd: cccd,
        dob: dobInput ? dobInput.value : '',
        school: schoolInput ? schoolInput.value.trim() : '',
        gradeClass: gradeClassInput ? gradeClassInput.value.trim() : '',
        language: sidebarLangSelect ? sidebarLangSelect.value : (localStorage.getItem('safe_school_lang') || 'vi'),
        avatar: avatarUrl,
        updatedAt: serverTimestamp()
      }, { merge: true });

      showToast('success', 'Thành công', 'Cập nhật thông tin thành công.');
      originalData = { 
        ...originalData,
        fullName: fullname, phone, cccd, role, avatar: avatarUrl,
        dob: dobInput ? dobInput.value : '',
        school: schoolInput ? schoolInput.value.trim() : '',
        gradeClass: gradeClassInput ? gradeClassInput.value.trim() : '',
        language: sidebarLangSelect ? sidebarLangSelect.value : (localStorage.getItem('safe_school_lang') || 'vi')
      };
      selectedAvatarFile = null;
    } catch (error) {
      console.error(error);
      showToast('error', 'Thất bại', 'Đã xảy ra lỗi khi cập nhật dữ liệu.');
    } finally {
      document.getElementById('btn-save-text').textContent = "Lưu thông tin";
    }
  }

  btnCancel.addEventListener('click', () => {
    fullnameInput.value = originalData.fullName || '';
    phoneInput.value = originalData.phone || '';
    cccdInput.value = originalData.cccd || '';
    if (dobInput) dobInput.value = originalData.dob || '';
    if (schoolInput) schoolInput.value = originalData.school || '';
    if (gradeClassInput) gradeClassInput.value = originalData.gradeClass || '';
    if (originalData.role) roleInput.value = originalData.role;
    if (originalData.language) {
      if (sidebarLangSelect) sidebarLangSelect.value = originalData.language;
      applyLanguage(originalData.language);
    }
    updateAvatarUI(originalData.avatar);
    selectedAvatarFile = null;
    showToast('info', 'Đã hủy', 'Đã khôi phục thông tin ban đầu.');
  });

  // --- 2. SETTINGS & 2FA LOGIC ---
  if (btnOpenSettings) {
    btnOpenSettings.addEventListener('click', () => {
      settingEmail.value = '';
      settingCurrentPass.value = '';
      settingNewPass.value = '';
      settingConfirmPass.value = '';
      inputPinCode.value = '';
      inputConfirmPin.value = '';

      const is2FA = !!originalData.twoFactorEnabled;
      toggle2FA.checked = is2FA;
      if (is2FA) {
        boxPinSetup.classList.remove('hidden');
      } else {
        boxPinSetup.classList.add('hidden');
      }

      modalSettings.classList.remove('hidden');
      modalSettings.classList.add('active');
    });
  }

  if (btnCloseSettings) {
    btnCloseSettings.addEventListener('click', () => {
      modalSettings.classList.add('hidden');
      modalSettings.classList.remove('active');
    });
  }

  toggle2FA.addEventListener('change', (e) => {
    if (e.target.checked) {
      boxPinSetup.classList.remove('hidden');
    } else {
      if (!originalData.twoFactorEnabled) {
        boxPinSetup.classList.add('hidden');
      }
    }
  });

  settingsForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentUser) return;

    const newEmail = settingEmail.value.trim();
    const currentPass = settingCurrentPass.value.trim();
    const newPass = settingNewPass.value.trim();
    const confirmPass = settingConfirmPass.value.trim();

    const isEnabling2FA = toggle2FA.checked;
    const pin = inputPinCode.value.trim();
    const confirmPin = inputConfirmPin.value.trim();

    // Check Password Match
    if (newPass && newPass !== confirmPass) {
      showToast('error', 'Lỗi', 'Mật khẩu mới không trùng khớp!');
      return;
    }
    if (newPass && newPass.length < 6) {
      showToast('error', 'Lỗi', 'Mật khẩu mới phải từ 6 ký tự trở lên!');
      return;
    }

    // Check PIN Setup
    if (isEnabling2FA && (!originalData.twoFactorEnabled || pin)) {
      if (!pin || pin.length !== 6 || !/^\d{6}$/.test(pin)) {
        showToast('error', 'Lỗi PIN', 'Mã PIN phải bao gồm đúng 6 chữ số!');
        return;
      }
      if (pin !== confirmPin) {
        showToast('error', 'Lỗi PIN', 'Mã PIN xác nhận không trùng khớp!');
        return;
      }
    }

    // If changing Email or Password, current password is required
    if ((newEmail || newPass) && !currentPass) {
      showToast('error', 'Yêu cầu mật khẩu', 'Vui lòng nhập mật khẩu hiện tại để xác nhận đổi Email/Mật khẩu.');
      return;
    }

    // Function to execute the settings updates after 2FA check
    const performSettingsUpdate = async () => {
      try {
        const btnSave = document.getElementById('btn-save-settings');
        btnSave.disabled = true;
        btnSave.textContent = 'Đang cập nhật...';

        // 1. Re-authenticate if changing email or password
        if (newEmail || newPass) {
          const credential = EmailAuthProvider.credential(currentUser.email, currentPass);
          await reauthenticateWithCredential(currentUser, credential);

          if (newEmail && newEmail !== currentUser.email) {
            await updateEmail(currentUser, newEmail);
            await updateDoc(doc(db, 'users', currentUserUid), { email: newEmail });
          }

          if (newPass) {
            await updatePassword(currentUser, newPass);
          }
        }

        // 2. Update 2FA settings in Firestore
        const updatePayload = { twoFactorEnabled: isEnabling2FA };
        if (isEnabling2FA && pin) {
          updatePayload.pinCode = pin;
        } else if (!isEnabling2FA) {
          updatePayload.pinCode = '';
        }

        await updateDoc(doc(db, 'users', currentUserUid), updatePayload);

        originalData.twoFactorEnabled = isEnabling2FA;
        if (isEnabling2FA && pin) originalData.pinCode = pin;
        else if (!isEnabling2FA) originalData.pinCode = '';

        update2FABadge(isEnabling2FA);

        modalSettings.classList.add('hidden');
        modalSettings.classList.remove('active');
        showToast('success', 'Thành công', 'Đã cập nhật cài đặt tài khoản và bảo mật!');

      } catch (err) {
        console.error('Lỗi lưu cài đặt:', err);
        if (err.code === 'auth/wrong-password') {
          showToast('error', 'Lỗi xác thực', 'Mật khẩu hiện tại không chính xác.');
        } else if (err.code === 'auth/requires-recent-login') {
          showToast('error', 'Lỗi bảo mật', 'Vui lòng đăng xuất và đăng nhập lại trước khi đổi Email/Mật khẩu.');
        } else {
          showToast('error', 'Thất bại', err.message || 'Không thể cập nhật cài đặt.');
        }
      } finally {
        const btnSave = document.getElementById('btn-save-settings');
        btnSave.disabled = false;
        btnSave.textContent = 'Lưu Cài đặt';
      }
    };

    // If 2FA is currently active, prompt for PIN first!
    if (originalData.twoFactorEnabled) {
      request2FAVerification(performSettingsUpdate);
    } else {
      await performSettingsUpdate();
    }
  });

  // --- 3. 2FA PIN VERIFICATION PROMPT ---
  function request2FAVerification(onSuccessCallback) {
    pending2FAAction = onSuccessCallback;
    inputVerifyPin.value = '';
    errorVerifyPin.style.display = 'none';
    modal2FAVerify.classList.remove('hidden');
    modal2FAVerify.classList.add('active');
    setTimeout(() => inputVerifyPin.focus(), 100);
  }

  if (btnCancelVerify) {
    btnCancelVerify.addEventListener('click', () => {
      modal2FAVerify.classList.add('hidden');
      modal2FAVerify.classList.remove('active');
      pending2FAAction = null;
    });
  }

  form2FAVerify.addEventListener('submit', (e) => {
    e.preventDefault();
    const pinEntered = inputVerifyPin.value.trim();
    if (pinEntered === originalData.pinCode) {
      modal2FAVerify.classList.add('hidden');
      modal2FAVerify.classList.remove('active');
      errorVerifyPin.style.display = 'none';
      if (pending2FAAction) {
        const action = pending2FAAction;
        pending2FAAction = null;
        action();
      }
    } else {
      errorVerifyPin.style.display = 'block';
      showToast('error', 'Xác thực 2FA thất bại', 'Mã PIN 6 chữ số không đúng.');
    }
  });

  // --- 4. MOOD TRACKER LOGIC ---
  const moodBtns = document.querySelectorAll('.mood-emoji-btn');
  const moodHistoryList = document.getElementById('mood-history-list');

  const moodEmojis = {
    'vui': '😄',
    'binh-thuong': '😐',
    'cang-thang': '😓',
    'buon': '😢'
  };

  moodBtns.forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!currentUserUid) return;
      
      const moodStr = btn.getAttribute('data-mood');
      moodBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      try {
        await addDoc(collection(db, 'moodLogs'), {
          uid: currentUserUid,
          mood: moodStr,
          createdAt: serverTimestamp()
        });
        showToast('success', 'Đã ghi nhận', 'Cảm xúc của bạn đã được ghi nhận.');
        loadMoodHistory();
      } catch (e) {
        console.error("Lỗi lưu cảm xúc:", e);
      }
    });
  });

  async function loadMoodHistory() {
    if (!currentUserUid) return;
    try {
      const today = new Date();
      today.setHours(0,0,0,0);
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const q = query(
        collection(db, 'moodLogs'),
        where('uid', '==', currentUserUid),
        where('createdAt', '>=', sevenDaysAgo),
        orderBy('createdAt', 'desc'),
        limit(7)
      );

      const snap = await getDocs(q);
      if (snap.empty) {
        if (moodHistoryList) moodHistoryList.innerHTML = '<div style="font-size: 12px; color: var(--text-muted);">Chưa có dữ liệu</div>';
        return;
      }

      if (moodHistoryList) moodHistoryList.innerHTML = '';
      const now = new Date();

      snap.forEach(docSnap => {
        const data = docSnap.data();
        if (data.createdAt && data.createdAt.toDate) {
          const d = data.createdAt.toDate();
          if (d.toDateString() === now.toDateString()) {
            moodBtns.forEach(b => {
              if (b.getAttribute('data-mood') === data.mood) b.classList.add('active');
            });
          }
        }
        
        const emoji = moodEmojis[data.mood] || '😐';
        const item = document.createElement('div');
        item.className = 'mood-history-item';
        item.title = data.createdAt?.toDate ? data.createdAt.toDate().toLocaleDateString('vi-VN') : '';
        item.textContent = emoji;
        if (moodHistoryList) moodHistoryList.appendChild(item);
      });
      
    } catch (e) {
      console.error("Lỗi tải lịch sử cảm xúc:", e);
    }
  }

  // ============================================================
  // STUDENT PROFILE EDITOR (Teacher / Admin only)
  // ============================================================
  (function initStudentEditor() {
    const searchInput    = document.getElementById('student-search-input');
    const btnSearch      = document.getElementById('btn-student-search');
    const listContainer  = document.getElementById('student-list');
    const listPlaceholder= document.getElementById('student-list-placeholder');
    const editPanel      = document.getElementById('student-edit-panel');
    const editForm       = document.getElementById('student-edit-form');
    const nameHeader     = document.getElementById('edit-student-name-header');
    const btnClose       = document.getElementById('btn-close-student-edit');
    const btnCancelEdit  = document.getElementById('btn-cancel-student-edit');

    const seFullname   = document.getElementById('se-fullname');
    const sePhone      = document.getElementById('se-phone');
    const seDob        = document.getElementById('se-dob');
    const seCccd       = document.getElementById('se-cccd');
    const seSchool     = document.getElementById('se-school');
    const seGradeClass = document.getElementById('se-gradeclass');
    const btnSaveTxt   = document.getElementById('btn-save-student-text');

    if (!searchInput || !btnSearch) return; // section not present

    let allStudents = []; // cached list
    let editingUid  = null;
    let editingOriginal = {};

    // Load all students from Firestore once (when teacher/admin opens the page)
    async function loadStudents() {
      try {
        const snap = await getDocs(collection(db, 'users'));
        allStudents = [];
        snap.forEach(d => {
          const data = d.data();
          if (normalizeRole(data.role) === 'student') {
            allStudents.push({ uid: d.id, ...data });
          }
        });
      } catch (err) {
        console.error('Lỗi tải danh sách học sinh:', err);
      }
    }

    function doSearch() {
      const q = searchInput.value.trim().toLowerCase();
      if (!q) {
        listContainer.style.display = 'none';
        listPlaceholder.style.display = 'block';
        listPlaceholder.textContent = 'Nhập tên hoặc email để tìm học sinh';
        return;
      }

      const filtered = allStudents.filter(s =>
        (s.fullName || '').toLowerCase().includes(q) ||
        (s.email || '').toLowerCase().includes(q) ||
        (s.gradeClass || '').toLowerCase().includes(q) ||
        (s.school || '').toLowerCase().includes(q)
      );

      listPlaceholder.style.display = 'none';
      listContainer.style.display = 'flex';
      listContainer.innerHTML = '';

      if (filtered.length === 0) {
        listContainer.style.display = 'none';
        listPlaceholder.style.display = 'block';
        listPlaceholder.textContent = 'Không tìm thấy học sinh phù hợp.';
        return;
      }

      filtered.slice(0, 20).forEach(s => {
        const row = document.createElement('div');
        row.style.cssText = 'display:flex; align-items:center; justify-content:space-between; padding:10px 14px; border-radius:var(--radius-md); border:1px solid var(--border-color); background:var(--bg-glass); cursor:pointer; transition: border-color 0.2s;';
        row.innerHTML = `
          <div>
            <div style="font-weight:600; font-size:14px;">${s.fullName || '(Chưa có tên)'}</div>
            <div style="font-size:12px; color:var(--text-muted);">${s.email || ''} ${s.gradeClass ? '· Lớp ' + s.gradeClass : ''} ${s.school ? '· ' + s.school : ''}</div>
          </div>
          <button type="button" class="btn btn-primary" style="font-size:12px; padding:6px 14px;">Chỉnh sửa</button>
        `;
        row.querySelector('button').addEventListener('click', () => openEditPanel(s));
        row.addEventListener('mouseenter', () => row.style.borderColor = 'var(--color-primary)');
        row.addEventListener('mouseleave', () => row.style.borderColor = 'var(--border-color)');
        listContainer.appendChild(row);
      });
    }

    function openEditPanel(student) {
      editingUid = student.uid;
      editingOriginal = { ...student };

      nameHeader.textContent = student.fullName || student.email || student.uid;
      seFullname.value   = student.fullName || '';
      sePhone.value      = student.phone || '';
      seDob.value        = student.dob || '';
      seCccd.value       = student.cccd || '';
      seSchool.value     = student.school || '';
      seGradeClass.value = student.gradeClass || '';

      editPanel.style.display = 'block';
      editPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function closeEditPanel() {
      editPanel.style.display = 'none';
      editingUid = null;
      editingOriginal = {};
      if (editForm) editForm.reset();
    }

    editForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!editingUid) return;

      const newFullname = seFullname.value.trim();
      if (!newFullname) {
        document.getElementById('se-group-fullname').classList.add('error');
        return;
      }
      document.getElementById('se-group-fullname').classList.remove('error');

      if (btnSaveTxt) btnSaveTxt.textContent = 'Đang lưu...';
      try {
        await updateDoc(doc(db, 'users', editingUid), {
          fullName:   newFullname,
          phone:      sePhone.value.trim(),
          dob:        seDob.value,
          cccd:       seCccd.value.trim(),
          school:     seSchool.value.trim(),
          gradeClass: seGradeClass.value.trim(),
          updatedAt:  serverTimestamp()
        });

        // Update cached list
        const idx = allStudents.findIndex(s => s.uid === editingUid);
        if (idx !== -1) {
          allStudents[idx] = { ...allStudents[idx],
            fullName: newFullname,
            phone: sePhone.value.trim(),
            dob: seDob.value,
            cccd: seCccd.value.trim(),
            school: seSchool.value.trim(),
            gradeClass: seGradeClass.value.trim()
          };
        }

        showToast('success', 'Thành công', `Đã cập nhật hồ sơ của ${newFullname}.`);
        nameHeader.textContent = newFullname;
        editingOriginal = { ...editingOriginal, fullName: newFullname };

        // Refresh list view
        doSearch();
      } catch (err) {
        console.error(err);
        showToast('error', 'Thất bại', 'Lỗi khi lưu thông tin học sinh.');
      } finally {
        if (btnSaveTxt) btnSaveTxt.textContent = '💾 Lưu thay đổi';
      }
    });

    btnSearch.addEventListener('click', doSearch);
    searchInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') doSearch(); });
    if (btnClose) btnClose.addEventListener('click', closeEditPanel);
    if (btnCancelEdit) btnCancelEdit.addEventListener('click', () => {
      // Restore original values
      seFullname.value   = editingOriginal.fullName || '';
      sePhone.value      = editingOriginal.phone || '';
      seDob.value        = editingOriginal.dob || '';
      seCccd.value       = editingOriginal.cccd || '';
      seSchool.value     = editingOriginal.school || '';
      seGradeClass.value = editingOriginal.gradeClass || '';
    });

    // Auto-load students when section becomes visible
    const observer = new MutationObserver(() => {
      const section = document.getElementById('student-editor-section');
      if (section && section.style.display !== 'none' && allStudents.length === 0) {
        loadStudents();
        observer.disconnect();
      }
    });
    const section = document.getElementById('student-editor-section');
    if (section) observer.observe(section, { attributes: true, attributeFilter: ['style'] });
  })();

});
