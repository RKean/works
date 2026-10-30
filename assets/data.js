// All content below comes from the existing portfolio (rkean.github.io).
// Client and system names are withheld; projects are described by system type only.
const I = (f, c) => ({ src: `assets/img/${f}.webp`, caption: c });

export const PROFILE = {
  name: 'Irfan bin Zainuddin',
  short: 'IRFAN',
  role: 'Senior PHP / Laravel Developer',
  base: 'Kuala Lumpur, Malaysia',
  email: 'keanzs7@gmail.com',
  phone: '016-601-2962',
  phoneHref: 'tel:+60166012962',
  intro:
    'I build secure, workflow-heavy web systems for government and enterprise clients, from database design and multi-stage approval flows to REST APIs, RBAC, audit trails and production support.',
  about: [
    'Senior PHP/Laravel Developer with 5+ years of experience delivering secure, workflow-heavy web systems for government and enterprise clients. I am currently building core modules of a government e-procurement platform for a Malaysian city authority, through which all of the authority\u2019s tenders will run once live.',
    'Previously, I led a national government platform serving 100,000+ users as its sole core developer. I am strongest in Laravel, PHP 8, MySQL, REST APIs, RBAC, audit trails, and query and page performance optimisation.',
  ],
  facts: [
    ['Education', 'B.Eng. Technology (Mechatronics), UniKL MFI'],
    ['Languages', 'Bahasa Malaysia, English (both fluent)'],
    ['Domain', 'E-procurement, approval workflows, licensing, government compliance'],
  ],
  stats: [
    ['5+', 'years of experience'],
    ['100,000+', 'users on a national platform I led as sole developer'],
    ['3 of 5', 'main e-procurement modules actively developed'],
    ['95%', 'accuracy on an AI quality-inspection system'],
  ],
  skills: {
    Backend: ['PHP 7/8', 'Laravel', 'Livewire', 'Eloquent ORM', 'Yii2 (MVC)', 'REST API', 'Laravel Passport', 'Queues / Jobs', 'Guzzle', 'SOAP'],
    Database: ['MySQL', 'Database design', 'Query optimisation', 'Performance tuning'],
    'Security & Access': ['RBAC (Spatie Permission)', 'Audit trails (Laravel Auditing)', 'Authentication', 'Server-side validation'],
    Frontend: ['Blade', 'JavaScript', 'Livewire', 'React.js', 'React Native', 'HTML5', 'CSS3', 'Chart.js', 'DataTables'],
    'Reporting & Output': ['PDF (DomPDF, Snappy)', 'Excel export', 'QR / barcode', 'Push notifications'],
    'Tools & Other': ['Git', 'Linux deployment', 'WordPress', 'Firebase', 'Figma', 'Python'],
  },
  experience: [
    { role: 'Senior PHP Developer', when: 'Aug 2025 \u2013 Present', where: 'Vista Kencana Sdn Bhd \u00b7 Kuala Lumpur', points: [
      'Develop a government e-procurement system and a licence survey system in Laravel and MySQL for a Malaysian city authority.',
      'As one of a 3-developer team in a 20\u201330 person project, deliver about 3/5 of the overall e-procurement system.',
      'Design database schemas, service layers and module structure for multi-role, multi-stage approval workflows.',
      'Implement RBAC (Spatie Laravel Permission) and audit trails; build REST APIs secured with Laravel Passport for web and mobile clients.',
      'Optimise slow pages and MySQL queries, tune background jobs, and own analysis, coding, testing, deployment and production support.',
    ]},
    { role: 'Lead Programmer (Full-Stack PHP)', when: 'Jul 2024 \u2013 Jul 2025', where: 'Aerostar System Sdn Bhd \u00b7 Kuala Lumpur', points: [
      'Led full-stack development, as sole core developer, of a national government web platform serving 100,000+ users (Yii2, MySQL).',
      'Architected the system and implemented RBAC, security controls and scalability improvements.',
      'Built React.js / React Native mobile applications and the supporting API integrations.',
    ]},
    { role: 'Software and Hardware Developer', when: 'Jul 2023 \u2013 Jun 2024', where: 'Aerostar System Sdn Bhd \u00b7 Kuala Lumpur', points: [
      'Delivered PHP/Yii2 and Python components for government and IoT initiatives.',
      'Carried the BI Dashboard & Reporting System (government asset agency) over from the previous employer and continued supporting it.',
      'Engineered IoT data pipelines (Raspberry Pi, Python) over LoRa networks spanning 20+ km.',
      'Developed a deep learning quality-inspection system (Python, OpenCV) with 95% classification accuracy.',
    ]},
    { role: 'Web Developer', when: 'Jan 2021 \u2013 Jun 2023', where: 'Galtech System Sdn Bhd \u00b7 Malaysia', points: [
      'Built Yii2 and WordPress applications for internal and client projects, including a government agency portal, intranet and booking system.',
      'Built a BI Dashboard & Reporting System for a government asset agency as sole developer: 7 modules, 4 integrated systems and PDF/Excel reporting (Yii2, MySQL, Chart.js).',
      'Customised CRMs, dashboards and business portals, owning UI/UX, PHP backend, MySQL and deployment.',
    ]},
    { role: 'Engineering Trainee (Assistant Engineer)', when: 'Jan 2020 \u2013 Sep 2020', where: 'Sony EMCS Bangi \u00b7 Malaysia', points: [
      'Supported R&D design verification testing (drop, thermal, vibration), assembly and firmware testing.',
    ]},
  ],
};

export const WORKS = [
  { slug: 'league-platform', title: 'Esports League Platform', tag: 'My own product', sector: 'Gaming \u00b7 Web & mobile', year: 'Own product',
    desc: 'A website for football-game club players to organise, create and join leagues, with a companion mobile app. An earlier version of the platform also existed before the current build.',
    points: ['Sign in with Discord via Laravel Socialite', 'Authentication with Laravel Sanctum, including bearer tokens for the mobile app', 'Roles and permissions with Spatie Laravel Permission', 'Syncs club, match and player stats from the game into its own database', 'Companion Flutter mobile app (Android / iOS) on the Laravel API'],
    stack: ['Laravel 12', 'Inertia', 'Vue 3', 'Tailwind CSS', 'Sanctum', 'Socialite (Discord)', 'Spatie Permission', 'Flutter'],
    note: 'Screenshots: local run with invented leagues, clubs and players.',
    images: [I('league-leagues', 'League list: active, upcoming and completed leagues'), I('league-league-overview', 'League overview: match day fixtures and league table'), I('league-fixtures', 'Fixtures and results grouped by match day'), I('league-league-stats', 'League statistics: top scorers and assists'), I('league-players-hub', 'Players hub: top scorers, assisters and goalkeepers'), I('league-team-management', 'Club manager tools: squad, roles and lineup builder'), I('league-club-register', 'Register a club (4-step form)'), I('league-pro-clubs', 'Club browser: synced club stats and recent matches'), I('league-club', 'Synced club page: record, form and team formation'), I('league-login', 'Sign in with email or Discord')] },

  { slug: 'bi-dashboard', title: 'BI Dashboard & Reporting System', tag: 'Sole developer', sector: 'Government asset agency', year: '2022 \u2013 2023',
    desc: 'A web-based business intelligence dashboard and reporting system for a government asset agency in Malaysia that manages land, buildings and rental assets nationwide. Designed and built entirely on my own, then carried over and supported at my next employer.',
    points: ['Pulls data from 4 systems: asset and rental management, government financial accounting, GIS and attendance, plus a live commodity price feed from an industry body', 'Scheduled cron jobs keep the dashboard data in sync with the source systems', 'Reports filter by date, zone, state and constituency, with PDF and Excel export', '3 user roles (Admin, Staff, BOD) with role-based access to modules', '7 modules: Main Dashboard, Commercial, Infra, Land, Development, HR, Reporting', 'Passed Factory Acceptance Test (FAT) and live acceptance before handover'],
    stack: ['Yii2', 'PHP', 'MySQL', 'Chart.js', 'Cron jobs', 'System integration', 'PDF / Excel export'],
    note: 'Screenshots are from the system\u2019s user manuals. Client name, logos, personal data, amounts and account data are blurred or removed.',
    images: [I('bi-dashboard-main', 'Main dashboard (Admin / BOD): KPI cards, live commodity price, attendance, rental map'), I('bi-dashboard-commercial', 'Commercial: rentals by state, zone and status'), I('bi-dashboard-assets', 'Infra: building categories and asset register'), I('bi-reports-filter-export', 'Reporting: filters with PDF/Excel export'), I('bi-rental-record', 'Rental record with GIS location'), I('bi-user-roles', 'User management and access control')] },

  { slug: 'e-procurement', title: 'Government E-Procurement Platform', tag: 'Confidential', sector: 'Government \u00b7 City authority', year: 'Aug 2025 \u2013 Present',
    desc: 'An e-procurement platform for a Malaysian city authority, through which all of its tenders will run once live. Covers tendering, contractor and supplier portals, offer documents, tender evaluation, post-award consultant processes and claim workflows.',
    points: ['One of a 3-developer team; actively develop 3 of the 5 main modules and personally built more than 50% of them', 'Multi-role, multi-stage approval workflows with RBAC and audit trails', 'REST APIs secured with Laravel Passport, PDF/Excel reports and dashboards'],
    stack: ['Laravel', 'PHP', 'MySQL', 'Passport', 'Spatie Permission'], note: 'Confidential client project \u00b7 no screenshots.', images: [] },

  { slug: 'licence-survey', title: 'Licence Survey & Management System', tag: 'Confidential', sector: 'Government \u00b7 City authority', year: 'Aug 2025 \u2013 Present',
    desc: 'A licence survey system for a Malaysian city authority, used to monitor premises and billboard licences, records and compliance.',
    points: ['Interactive admin listings, forms and workflow screens built with Laravel Livewire'],
    stack: ['Laravel', 'Livewire', 'MySQL'], note: 'Confidential client project \u00b7 no screenshots.', images: [] },

  { slug: 'national-platform', title: 'National Government Web System', tag: 'Sole core developer', sector: 'Government \u00b7 National', year: 'Jul 2024 \u2013 Jul 2025',
    desc: 'A public-facing national government platform with 100,000+ users, where I was the sole core developer.',
    points: ['Owned architecture, RBAC, security controls and APIs', 'Scalability improvements and production optimisation', 'React.js / React Native apps and supporting API integrations'],
    stack: ['Yii2', 'MySQL', 'React.js', 'React Native'], note: 'Government project \u00b7 no screenshots.', images: [] },

  { slug: 'hrms-rebuild', title: 'HR Management System & 2.0 Rebuild', tag: 'HRMS \u00b7 Yii2', sector: 'Private corporate group', year: 'HRMS',
    desc: 'A human resource management system for a private corporate group, plus a 2.0 rebuild that modernises the original system.',
    points: ['Modules include employees, leave, claims, attendance, payroll, announcements, assets and projects', 'Dashboard with geolocation clock-in / clock-out and today\u2019s attendance', 'Containerised with Docker; automated tests with Codeception'],
    stack: ['Yii2', 'PHP', 'MySQL', 'Docker', 'Codeception'], note: 'Local run with invented demo data.',
    images: [I('hr-attendance-dashboard', 'Dashboard with clock-in and today\u2019s attendance'), I('hr-leave', 'Leave: weekly and monthly charts, leave list'), I('hr-attendance', 'Attendance records with filters and export')] },

  { slug: 'accident-system', title: 'Accident Reporting & Investigation System', tag: 'Government', sector: 'Federal department', year: 'Web',
    desc: 'Vehicle accident reporting and investigation system for a federal government department, covering system administration, accident data management and statistical reporting.',
    points: ['Department vehicle register and accident reports tracked from new report to completed investigation', 'Structured investigation report form with draft and submit'],
    stack: ['Web', 'Government', 'Reporting'], note: 'From the user manual; agency name, personal data and amounts blurred.',
    images: [I('accident-dashboard', 'Dashboard: vehicle counts, accident statistics by state'), I('accident-investigation-report', 'Investigation report form'), I('accident-vehicle-form', 'Vehicle data form')] },

  { slug: 'agency-portal', title: 'Agency Portal, Intranet & Booking System', tag: 'Government \u00b7 WordPress', sector: 'Federal agency', year: 'WordPress',
    desc: 'Official portal and staff intranet for a federal government agency, built on WordPress, with a department calendar and an online facility & vehicle booking system for vehicles and meeting rooms.',
    points: ['Official portal and staff intranet', 'Department calendar', 'Online booking for vehicles and meeting rooms'],
    stack: ['WordPress', 'Intranet', 'Booking'], note: 'From the user manuals; agency name and logos removed.',
    images: [I('booking-portal', 'Booking system: vehicles and meeting rooms'), I('booking-vehicle', 'Vehicle booking with availability calendar'), I('intranet-calendar', 'Intranet department calendar')] },

  { slug: 'agri-supply', title: 'Agricultural Supply Chain & Inventory System', tag: 'Agriculture', sector: 'Plantation \u00b7 Fruit producer', year: 'Web + mobile',
    desc: 'Plantation and estate system for a fruit producer in Malaysia, with a mobile app. Modules for harvesting, inventory, supply chain and sales orders, plus QR codes for fields, blocks and storage.',
    points: ['Harvesting, inventory, supply chain and sales order modules', 'QR codes for fields, blocks and storage', 'Companion mobile app'],
    stack: ['Web', 'Mobile app', 'QR code'], note: 'From the user manual; personal data and amounts blurred.',
    images: [I('agri-web-dashboard', 'Web dashboard: harvest records and field analytics'), I('agri-mobile-home', 'Mobile app home'), I('agri-product-catalog', 'Mobile app product catalogue')] },

  { slug: 'hrms-mobile', title: 'HR Management System & Mobile Apps', tag: 'HRMS', sector: 'Plantation group', year: 'Web + Android',
    desc: 'HR management system for a plantation group, with Android apps for staff. Covers employees, announcements, leave, claims, attendance and shift work on the web, plus leave and attendance in the mobile apps.',
    points: ['Leave apply, check and approve flow with statuses (pending, checked, approved, rejected, cancelled)', 'Claim applications with check and approval dates', 'Mobile clock-in / clock-out and leave application'],
    stack: ['Web', 'Android app', 'HR workflows'], note: 'From the user manual; client name, logo, personal data and amounts blurred.',
    images: [I('hrms-dashboard', 'Web dashboard and management menu'), I('hrms-leave-list', 'Leave list with approval status'), I('hrms-claims', 'Claim applications'), I('hrms-leave-app', 'Leave mobile app: leave summary'), I('hrms-leave-app-apply', 'Leave mobile app: apply leave'), I('hrms-attendance-app', 'Attendance mobile app: clock in')] },

  { slug: 'hrms-product', title: 'HRMS Product (Web & Mobile)', tag: 'In-house product', sector: 'Software house', year: 'Web + mobile',
    desc: 'An in-house HR management product covering HR functions such as employee records, payroll and performance in one package, on web and mobile.',
    points: ['Employee records, payroll and performance in one package', 'Web and mobile'],
    stack: ['Web', 'Mobile app', 'HRMS'], note: 'From the product brochure; product logo blurred.',
    images: [I('hrms-product-devices', 'HRMS product on desktop, tablet and phone')] },

  { slug: 'attendance', title: 'Attendance System', tag: 'More', sector: 'Web', year: 'Web',
    desc: 'Staff attendance tracking system.', points: [], stack: ['Web'], note: 'No screenshots.', images: [] },
  { slug: 'web-companion', title: 'Web System & Companion App', tag: 'More', sector: 'Client organisation', year: 'Web + mobile',
    desc: 'Web system for a client organisation, with a companion mobile app.', points: [], stack: ['Web', 'Mobile app'], note: 'No screenshots.', images: [] },
  { slug: 'tvet-portal', title: 'TVET Programme Portal', tag: 'More', sector: 'Government \u00b7 Education', year: 'Web',
    desc: 'Web portal for a government technical and vocational education (TVET) programme.', points: [], stack: ['Web'], note: 'No screenshots.', images: [] },
  { slug: 'kindergarten', title: 'Kindergarten Management System', tag: 'More', sector: 'Education', year: 'Yii2',
    desc: 'Enrolment, fees, attendance and billing, with Admin, Teacher and Parent roles.', points: [], stack: ['Yii2'], note: 'No screenshots.', images: [] },
  { slug: 'lora-iot', title: 'LoRa Long-Range IoT', tag: 'R&D', sector: 'IoT', year: '2023 \u2013 2024',
    desc: 'IoT data pipelines over LoRa networks spanning 20+ km, with solar-powered field relays.', points: [], stack: ['Python', 'Raspberry Pi', 'LoRa'], note: 'No screenshots.', images: [] },
  { slug: 'ai-quality', title: 'AI Quality Detection', tag: 'R&D', sector: 'Computer vision', year: '2023 \u2013 2024',
    desc: 'Deep learning quality-inspection system with camera grading, achieving 95% classification accuracy.', points: [], stack: ['Python', 'OpenCV'], note: 'No screenshots.', images: [] },
];
