import verifiedCatalog from './msbmVerifiedCatalog.json'
import officialCountryCatalog from './msbmCountries.json'
import officialRegionCatalog from './msbmRegions.json'

const msbmCourses = [
  {
    slug: 'masters-of-business-administration', university: 'European Institute Of Management And Technology', universitySlug: 'eimt',
    title: 'Masters of Business Administration',
    description: 'The GSS MBA is designed to cater to the needs of both experienced professionals and recent graduates looking to acquire knowledge and skills in Business Management.',
    duration: '18 Months', mode: 'Blended', fee: '£ 2,700', monthly: '£ 150/mo', image: '/assets/img/hero/hero-2.jpg', level: 'Master’s Degree',
  },
  {
    slug: 'executive-mba-tourism-hospitality-management', university: 'Azteca University', universitySlug: 'azteca-university',
    title: 'Executive Master Of Business Administration In Tourism and Hospitality Management',
    description: 'Gain expertise in strategic leadership, innovation, and sustainable practices for success in the global tourism and hospitality industry.',
    duration: '18 Months', mode: 'Blended', fee: '£ 3,150', monthly: '£ 175/mo', image: '/assets/img/case-study/cs-2.jpg', level: 'Master’s Degree',
  },
  {
    slug: 'executive-mba-production-operations-management', university: 'Azteca University', universitySlug: 'azteca-university',
    title: 'Executive Master Of Business Administration In Production And Operations Management',
    description: 'Enhance your expertise in driving operational efficiency and innovation through cutting-edge strategies in production and operations management.',
    duration: '18 Months', mode: 'Blended', fee: '£ 3,150', monthly: '£ 175/mo', image: '/assets/img/case-study/cs-3.jpg', level: 'Master’s Degree',
    paymentMonths: '18 months', administrativeFee: '£ 1,750', credits: '72 ECTS credits',
    sourceVerified: true, sourceUrl: 'https://msbm.org.uk/birmingham/programme/executive-master-of-business-administration-in-production-and-operations-management',
    longDescription: 'This executive MBA combines strategic, operational and technological perspectives to help professionals improve production systems and supply-chain performance. It connects leadership, human resources, finance, marketing and research with specialist operations practice, enabling learners to develop evidence-led solutions for complex organisational challenges.',
    outcomes: [
      'Assess and implement strategic frameworks that support competitiveness and adaptability.',
      'Apply leadership approaches that align teams and encourage long-term innovation.',
      'Evaluate human-resource practices and their relationship to organisational goals.',
      'Use strategic financial planning to manage investment and organisational resources.',
      'Create marketing strategies informed by market trends and customer insight.',
      'Apply advanced research methods to develop evidence-based business solutions.',
      'Analyse production processes to improve efficiency, quality and cost performance.',
      'Design and streamline supply-chain networks for operational excellence.',
      'Integrate environmental and social sustainability into operational practice.',
      'Use information systems to improve workflows and management decision-making.',
    ],
    entry: [
      'A recognised bachelor’s degree with a minimum overall score of 55% or GPA 2.0 on a 4.0 scale.',
      'Relevant work or research experience may be requested and can be demonstrated through a CV, portfolio or personal statement.',
      'English proficiency may be shown through IELTS 5.5, TOEFL, TOEIC, PTE or Duolingo equivalents. Eligible English-medium applicants may receive a waiver.',
      'Workshops are delivered through live webinars and this programme has no visa requirement.',
    ],
    modules: [
      ['Assignment & Study Guidelines', 'Portal navigation, course structure, academic integrity, referencing, summarising and assignment preparation.', '8 learning resources'],
      ['Strategic Management', 'Business-environment analysis, competitive advantage, strategy models, stakeholder relationships and strategic change.', 'Self-paced · Quiz'],
      ['Strategic Leadership', 'Leadership principles, team and organisational influences, performance and ethical decision-making.', 'Self-paced · Quiz'],
      ['Strategic Human Resource Management', 'Workforce planning, recruitment, development, retention and alignment between people strategy and organisational goals.', 'Self-paced · Quiz'],
      ['Strategic Financial Management', 'Cost systems, funding, performance analysis, budgeting, working capital and investment appraisal.', 'Self-paced · Quiz'],
      ['Strategic Marketing', 'Marketing mix, planning, positioning, segmentation, branding and digital strategy for competitive advantage.', 'Self-paced · Quiz'],
      ['Advanced Business Research Methods', 'Research philosophy, literature review, conceptual frameworks, research design, data analysis and ethics.', 'Self-paced · Quiz'],
      ['Operations Management', 'Inventory, quality assurance, supply-chain fundamentals, waste management and the role of operations in business.', 'Self-paced · Quiz'],
      ['Operations and Supply Chain Management', 'Network design, analysis tools, quality systems, planning models and inventory-control approaches.', 'Self-paced · Quiz'],
      ['Sustainable Operations Management', 'Frameworks and practices that align operational goals with environmental and social responsibility.', 'Self-paced · Quiz'],
      ['Operations and Information Management', 'Capacity planning, inventory, scheduling, quality systems and information-supported operations decisions.', 'Self-paced · Quiz'],
      ['Thesis in Production and Operations Management', 'An applied thesis focused on improving processes, organisational efficiency and competitive performance.', '12 ECTS research project'],
    ],
  },
  {
    slug: 'masters-continuing-education-marketing', university: 'UCAM Catholic University Of Murcia', universitySlug: 'ucam',
    title: 'Masters Degree in Continuing Education in Marketing',
    description: 'An advanced programme designed to develop strategic marketing leaders with strong business, analytical, and performance marketing expertise.',
    duration: '24 Months', mode: 'Blended', fee: '£ 3,600', monthly: '£ 150/mo', image: '/assets/img/case-study/cs-4.jpg', level: 'Master’s Degree',
    paymentMonths: '24 months', administrativeFee: '£ 2,000', credits: '10 modules × 7 ECTS + 20 ECTS thesis',
    sourceVerified: true, sourceUrl: 'https://msbm.org.uk/sierra-leone/programme/masters-degree-in-continuing-education-in-marketing-mba-mktg',
    longDescription: 'The Master’s Degree in Continuing Education in Marketing equips professionals with advanced knowledge of modern marketing practice and strategic management. It combines core business disciplines with contemporary marketing tools and digital-performance strategies, building the analytical, leadership and decision-making capability required in dynamic global markets.',
    courseDetails: 'The programme examines marketing within the broader business environment. Socioeconomic and legal context, accounting, finance, human-resource management and business strategy provide the managerial foundation. Specialist study covers marketing communication, search and social performance, affiliate and email strategies, contemporary marketing issues and data-led strategic decisions.',
    accreditation: 'GSS programmes are delivered through relevant academic partners and awarding-body relationships. This programme is presented in partnership with UCAM Catholic University of Murcia; applicants should confirm the current award and documentation with an advisor before enrolment.',
    progression: 'The curriculum provides a master’s-level continuing-education route and supports progression in marketing, brand, performance, communications and management roles.',
    workshops: 'Workshops are conducted through live webinars for online students.',
    visa: 'There is no visa requirement for this programme.',
    library: 'Learners receive access to GSS’s complimentary online learning-resource collection, including more than 31,000,000 articles and journals.',
    outcomes: [
      'Analyse socioeconomic and legal factors that influence marketing decisions.',
      'Interpret financial and accounting information to support marketing strategy.',
      'Develop marketing plans aligned with wider organisational objectives.',
      'Apply strategic-management principles to build competitive advantage.',
      'Design integrated marketing-communication strategies across channels.',
      'Evaluate and implement measurable campaigns across search and social platforms.',
      'Use affiliate and email-marketing approaches to generate measurable results.',
      'Apply leadership and human-resource skills when managing marketing teams.',
      'Assess emerging trends and contemporary challenges in marketing practice.',
      'Formulate strategic marketing decisions using evidence and performance data.',
    ],
    entry: [
      'The source programme states that there are no strict entry requirements.',
      'Learners holding an International Postgraduate Diploma or SEMP following a bachelor’s degree are eligible to enrol.',
      'An advisor can confirm documentary requirements and the appropriate pathway before application.',
    ],
    modules: [
      ['Assignment & Study Guidelines', 'Portal navigation, programme structure, academic integrity, Harvard referencing, summarising, paraphrasing and assignment preparation.', '7 learning resources'],
      ['Socioeconomic and Legal Environment', 'Economic indicators, social trends, governance, regulation, contracts and the legal context shaping strategic business and marketing decisions.', '5 lectures · 1 quiz'],
      ['Accounting and Finance', 'Financial statements, budgeting, variance analysis, cost-volume-profit analysis and managerial accounting for strategic decision-making.', '5 lectures · 1 quiz'],
      ['Marketing and Marketing Management', 'Marketing concepts, the extended mix, planning, positioning, segmentation, branding, digital identity and customer value.', '18 lectures · 1 quiz'],
      ['Human Resources Management and Management Skills', 'Talent, performance, communication, motivation, decision-making and the leadership of diverse teams.', '5 lectures · 1 quiz'],
      ['Business Strategy', 'Environmental analysis, competitive advantage, strategic tools, stakeholder relationships, implementation and organisational change.', '18 lectures · 1 quiz'],
      ['Marketing Communication', 'Advertising, public relations, promotion, direct and digital media, audience targeting, message design and integrated communications planning.', '5 lectures · 1 quiz'],
      ['Performance Marketing in Search and Social', 'Paid search and social campaigns, audience targeting, budgeting, bidding, creative, measurement, optimisation and return on investment.', '4 lectures · 1 quiz'],
      ['Performance Marketing with Affiliate and Mail Strategies', 'Native and display advertising, programmatic media, affiliate partnerships, email automation and measurable acquisition strategies.', '4 lectures · 1 quiz'],
      ['Strategic Management and Marketing', 'Strategic frameworks, market analysis, positioning, branding and growth decisions aligned to long-term organisational goals.', '5 lectures · 1 quiz'],
      ['Contemporary Issues and Principles of Marketing', 'Consumer behaviour, digital transformation, sustainability, ethics, segmentation, positioning and emerging global marketing challenges.', '5 lectures · 1 quiz'],
      ['Thesis Project', 'An independent 20 ECTS project applying research and strategic marketing knowledge to a significant professional or organisational question.', '20 ECTS thesis'],
    ],
  },
  {
    slug: 'mba-international-business', university: 'European Institute Of Management And Technology', universitySlug: 'eimt',
    title: 'Master of Business Administration In International Business', description: 'Empowering global leaders with advanced skills to navigate, innovate, and drive success in international business.',
    duration: '18 Months', mode: 'Blended', fee: '£ 2,700', monthly: '£ 150/mo', image: '/assets/img/case-study/cs-5.jpg', level: 'Master’s Degree',
  },
  {
    slug: 'mba-operations-supply-chain', university: 'European Institute Of Management And Technology', universitySlug: 'eimt',
    title: 'MBA In Operations and Supply Chain Management', description: 'Gain advanced skills in streamlining operations and optimizing supply chains across industries.',
    duration: '18 Months', mode: 'Blended', fee: '£ 2,700', monthly: '£ 150/mo', image: '/assets/img/case-study/cs-6.jpg', level: 'Master’s Degree',
  },
  {
    slug: 'mba-accounting-finance', university: 'European Institute Of Management And Technology', universitySlug: 'eimt',
    title: 'MBA In Accounting and Finance', description: 'Develop advanced skills in financial management, strategic decision-making, and business leadership.',
    duration: '18 Months', mode: 'Blended', fee: '£ 2,700', monthly: '£ 150/mo', image: '/assets/img/case-study/cs-7.jpg', level: 'Master’s Degree',
  },
  {
    slug: 'mba-supply-chain-management', university: 'Azteca University', universitySlug: 'azteca-university',
    title: 'Master Of Business Administration In Supply Chain Management', description: 'Cultivate advanced operations and financial management skills to tackle complex organisational challenges and drive success.',
    duration: '18 Months', mode: 'Blended', fee: '£ 3,150', monthly: '£ 175/mo', image: '/assets/img/case-study/cs-8.jpg', level: 'Master’s Degree',
  },
  {
    slug: 'mba-sales-marketing', university: 'Azteca University', universitySlug: 'azteca-university',
    title: 'Master Of Business Administration In Sales And Marketing', description: 'Empower your sales and marketing expertise to drive innovation and impact.',
    duration: '18 Months', mode: 'Blended', fee: '£ 3,150', monthly: '£ 175/mo', image: '/assets/img/case-study/cs-9.jpg', level: 'Master’s Degree',
  },
  {
    slug: 'masters-continuing-education-project-management', university: 'UCAM Catholic University Of Murcia', universitySlug: 'ucam',
    title: 'Masters Degree in Continuing Education in Project Management', description: 'Build the expertise to plan, lead, and deliver successful projects with advanced strategic and managerial skills.',
    duration: '24 Months', mode: 'Blended', fee: '£ 3,600', monthly: '£ 150/mo', image: '/assets/img/case-study/cs-10.jpg', level: 'Master’s Degree',
  },
  {
    slug: 'bba-business-management', university: 'European Institute Of Management And Technology', universitySlug: 'eimt',
    title: 'BBA In Business Management', description: 'Build the skills to excel in communication, management, and strategic decision-making across diverse business environments.',
    duration: '36 Months', mode: 'Blended', fee: 'Request fees', monthly: 'Flexible payment', image: '/assets/img/case-study/cs-11.jpg', level: 'Bachelor’s Degree',
  },
  {
    slug: 'bachelors-cyber-security', university: 'The Global School of Skills (GSS) and UCAM Catholic University of Murcia', universitySlug: 'ucam',
    title: 'Bachelors Degree In Cyber Security', description: 'Gain in-depth knowledge and hands-on experience in safeguarding digital systems and data in today’s interconnected world.',
    duration: '48 Months', mode: 'Blended', fee: 'Request fees', monthly: 'Flexible payment', image: '/assets/img/case-study/cs-12.jpg', level: 'Bachelor’s Degree',
  },
]

export const categories = [
  { slug: 'doctorate-degree', name: 'Doctorate Degree', description: 'Reach the pinnacle of academic excellence with advanced doctoral programmes.' },
  { slug: 'masters-degree', name: 'Master’s Degree', description: 'Accelerate your career with internationally relevant master’s programmes.' },
  { slug: 'semp-online-sep-upgradeable', name: 'SEMP Online & SEP Upgradeable', description: 'Flexible executive education designed to grow with your career.' },
  { slug: 'postgraduate-diploma-regulated', name: 'Postgraduate Diploma (Regulated)', description: 'Regulated postgraduate pathways for professional and academic progression.' },
  { slug: 'international-postgraduate-diploma-endorsed', name: 'International Postgraduate Diploma (Endorsed)', description: 'Applied postgraduate programmes built around modern workplace practice.' },
  { slug: 'bachelors-degree', name: 'Bachelor’s Degree', description: 'Undergraduate pathways that develop core professional and academic capability.' },
  { slug: 'diploma-regulated', name: 'Diploma (Regulated)', description: 'Structured diploma programmes aligned with recognised qualification levels.' },
  { slug: 'international-higher-diploma-endorsed', name: 'International Higher Diploma (Endorsed)', description: 'Higher diploma programmes for career development and degree progression.' },
  { slug: 'advanced-professional-certificate', name: 'Advanced Professional Certificate Course', description: 'Focused advanced certificates for specialist professional expertise.' },
  { slug: 'professional-certificate', name: 'Professional Certificate Course', description: 'Concise professional courses for practical, job-relevant development.' },
  { slug: 'free-online-course', name: 'Free Online Course', description: 'Accessible online courses for starting a new learning journey.' },
]

export const specializations = [
  ['business-law', 'Business Law'], ['business-management', 'Business Management'], ['business-research', 'Business Research'],
  ['clinical-courses', 'Clinical Courses'], ['finance-and-accounting', 'Finance And Accounting'], ['health-and-psychology', 'Health And Psychology'],
  ['health-and-safety', 'Health And Safety'], ['hotel-travel-hospitality-management', 'Hotel, Travel And Hospitality Management'],
  ['human-resources', 'Human Resources'], ['information-technology', 'Information Technology'],
  ['leadership-and-entrepreneurship', 'Leadership And Entrepreneurship'],
  ['logistics-and-supply-chain-management', 'Logistics And Supply Chain Management'], ['office-productivity', 'Office Productivity'],
  ['personal-development', 'Personal Development'], ['project-operations-management', 'Project & Operations Management'],
  ['sales-and-marketing', 'Sales And Marketing'], ['teaching-and-education', 'Teaching And Education'],
].map(([slug, name]) => ({ slug, name }))

const doctorateModules = [
  ['Assignment & Study Guidelines', 'Study structure, academic expectations and assignment submission guidance.', '7 Lectures'],
  ['Advanced Research Methods', 'Qualitative and quantitative principles for doctoral research, including research philosophy, data collection, analysis and ethics.', '14 Lectures · 1 Quiz'],
  ['Advanced Human Resource Management', 'Advanced approaches to recruitment, development, motivation and people management in complex organisations.', '5 Lectures · 1 Quiz'],
  ['Strategic Management and Business Analysis', 'Frameworks for analysing competitive situations, strategic dilemmas and organisational direction.', '5 Lectures · 1 Quiz'],
  ['Global Financial Management', 'Asset valuation, financing, risk, diversification, arbitrage and hedging in global financial markets.', '5 Lectures · 1 Quiz'],
  ['Organizational Behaviour', 'Individual and group behaviour, organisation design, change and inter-organisational relationships.', '5 Lectures · 1 Quiz'],
  ['Advanced Management', 'Modern management theory, organisational development, communication, motivation and leadership.', '5 Lectures · 1 Quiz'],
  ['Project Management', 'Planning, execution, risk, resources and stakeholder communication across the project lifecycle.', '18 Lectures · 1 Quiz'],
  ['Research / Thesis', 'Independent applied research demonstrating doctoral-level analysis and academic rigour.', 'Research segment'],
]

const gssCourses = [
  { slug: 'dba-in-project-management', title: 'DBA in Project Management (DBAPM)', description: 'An advanced doctoral programme developing strategic leaders who can manage complex projects through research, leadership and global management practice.', duration: '36 Months', mode: 'Online', fee: 'AED 25,000', monthly: 'Was AED 50,000', level: 'Doctorate Degree', categorySlug: 'doctorate-degree', subjects: ['business-management', 'business-research', 'finance-and-accounting', 'leadership-and-entrepreneurship', 'project-operations-management'], university: 'European Institute Of Management And Technology', universitySlug: 'eimt', image: '/assets/img/case-study/cs-13.jpg', featured: true, modules: doctorateModules,
    sourceVerified: true, sourceUrl: 'https://globalschoolofskills.com/programme/dba-in-project-management',
    outcomes: ['Apply advanced research methods to complex organisational challenges.', 'Evaluate strategic management practices and organisational performance.', 'Develop strategies for project planning, implementation and control.', 'Analyse leadership and organisational behaviour to improve team performance.', 'Apply global financial management principles to strategic decisions.', 'Demonstrate independent doctoral research and academic rigour.'],
    entry: ['A master’s degree in business and management; or a master’s degree in another discipline with five years of managerial experience.', 'Applicants with a bachelor’s degree may be considered with at least eight years of managerial or business experience.', 'English proficiency can be demonstrated through IELTS 5.5, TOEFL, TOEIC, PTE or Duolingo equivalents; eligible English-medium applicants may receive a waiver.'],
  },
  { slug: 'dba-in-international-business-management', title: 'DBA in International Business Management (DBAIBM)', description: 'A 180 ECTS doctoral programme for advanced business research, analysis and international leadership.', duration: '36 Months', mode: 'Online', fee: 'AED 25,000', monthly: 'Was AED 50,000', level: 'Doctorate Degree', categorySlug: 'doctorate-degree', subjects: ['business-management', 'business-research', 'leadership-and-entrepreneurship'], university: 'European Institute Of Management And Technology', universitySlug: 'eimt', image: '/assets/img/case-study/cs-14.jpg' },
  { slug: 'dba-in-human-resource-management', title: 'DBA in Human Resource Management (DBAHRM)', description: 'Develops strategic, research-driven HR leaders capable of transforming modern workplaces.', duration: '36 Months', mode: 'Online', fee: 'AED 25,000', monthly: 'Was AED 50,000', level: 'Doctorate Degree', categorySlug: 'doctorate-degree', subjects: ['business-research', 'human-resources', 'leadership-and-entrepreneurship'], university: 'European Institute Of Management And Technology', universitySlug: 'eimt', image: '/assets/img/case-study/cs-15.jpg' },
  { slug: 'dba-in-supply-chain-management', title: 'DBA in Supply Chain Management (DBASCM)', description: 'Advanced doctoral research and leadership for complex logistics and supply-chain environments.', duration: '36 Months', mode: 'Online', fee: 'AED 25,000', monthly: 'Was AED 50,000', level: 'Doctorate Degree', categorySlug: 'doctorate-degree', subjects: ['business-research', 'logistics-and-supply-chain-management', 'project-operations-management'], university: 'European Institute Of Management And Technology', universitySlug: 'eimt', image: '/assets/img/case-study/cs-16.jpg' },
  { slug: 'dba-in-entrepreneurship-and-innovation', title: 'DBA in Entrepreneurship and Innovation (DBAEI)', description: 'Doctoral study for leaders applying research to entrepreneurship, innovation and organisational growth.', duration: '12 Months', mode: 'Online', fee: 'AED 25,000', monthly: 'Was AED 50,000', level: 'Doctorate Degree', categorySlug: 'doctorate-degree', subjects: ['business-research', 'leadership-and-entrepreneurship'], university: 'European Institute Of Management And Technology', universitySlug: 'eimt', image: '/assets/img/case-study/cs-17.jpg' },
  { slug: 'dba-in-healthcare-management', title: 'DBA in Healthcare Management (DBAHCM)', description: 'Applied doctoral study addressing strategy, innovation, quality and sustainability in healthcare systems.', duration: '36 Months', mode: 'Online', fee: 'AED 25,000', monthly: 'Was AED 50,000', level: 'Doctorate Degree', categorySlug: 'doctorate-degree', subjects: ['clinical-courses', 'health-and-psychology', 'business-research'], university: 'European Institute Of Management And Technology', universitySlug: 'eimt', image: '/assets/img/case-study/cs-1.jpg' },
  { slug: 'phd-in-business-management', title: 'Doctor Of Philosophy (PhD) In Business Management', description: 'Pursue advanced expertise and research excellence in business management.', duration: '12 Months', mode: 'Online', fee: 'AED 25,000', monthly: 'Was AED 50,000', level: 'Doctorate Degree', categorySlug: 'doctorate-degree', subjects: ['business-management', 'business-research'], university: 'Azteca University', universitySlug: 'azteca-university', image: '/assets/img/gallery/gallery-1.jpg' },
  { slug: 'doctoral-degree-in-education', title: 'Doctoral Degree In Education', description: 'Build advanced competencies in research, leadership and responsible decision-making in education.', duration: '36 Months', mode: 'Online', fee: 'AED 25,000', monthly: 'Was AED 50,000', level: 'Doctorate Degree', categorySlug: 'doctorate-degree', subjects: ['business-research', 'teaching-and-education'], university: 'International Academic Partner', universitySlug: 'eimt', image: '/assets/img/gallery/gallery-2.jpg' },
  { slug: 'executive-mba-marketing-management', title: 'Executive Master Of Business Administration In Marketing Management', description: 'Strategic insight and innovative marketing expertise for organisational leadership.', duration: '18 Months', mode: 'Blended', fee: 'Request fees', monthly: 'Flexible payment', level: 'Master’s Degree', categorySlug: 'masters-degree', subjects: ['business-management', 'sales-and-marketing'], university: 'Azteca University', universitySlug: 'azteca-university', image: '/assets/img/gallery/gallery-3.jpg' },
  { slug: 'mba-security-intelligence-studies', title: 'MBA Security and Intelligence Studies', description: 'A broad view of global intelligence and security operations with strategic analysis and policy-making.', duration: '18 Months', mode: 'Online / Blended', fee: 'Request fees', monthly: 'Flexible payment', level: 'Master’s Degree', categorySlug: 'masters-degree', subjects: ['business-management', 'health-and-safety', 'leadership-and-entrepreneurship'], university: 'European Institute Of Management And Technology', universitySlug: 'eimt', image: '/assets/img/gallery/gallery-4.jpg' },
  { slug: 'master-business-administration-project-management', title: 'Master of Business Administration In Project Management (MBAPM)', description: 'Develop expertise in project management, finance, marketing, HR and strategic business planning.', duration: '12 Months', mode: 'Blended', fee: 'Request fees', monthly: 'Flexible payment', level: 'Master’s Degree', categorySlug: 'masters-degree', subjects: ['business-management', 'finance-and-accounting', 'human-resources', 'project-operations-management'], university: 'International Academic Partner', universitySlug: 'eimt', image: '/assets/img/blog/blog-1.jpg' },
  { slug: 'semp-project-management', title: 'Special Executive Masters Programme in Project Management', description: 'Executive project-management methods and leadership skills for complex delivery environments.', duration: '6 Months', mode: 'Online', fee: 'Request fees', monthly: 'Flexible payment', level: 'SEMP Online', categorySlug: 'semp-online-sep-upgradeable', subjects: ['project-operations-management', 'leadership-and-entrepreneurship'], university: 'The Global School of Skills (GSS)', universitySlug: 'eimt', image: '/assets/img/blog/blog-2.jpg' },
  { slug: 'semp-strategic-information-knowledge-management', title: 'Special Executive Master Programme in Strategic Information And Knowledge Management', description: 'Use data and knowledge assets to strengthen organisational resilience and innovation.', duration: '6 Months', mode: 'Online', fee: 'Request fees', monthly: 'Flexible payment', level: 'SEMP Online', categorySlug: 'semp-online-sep-upgradeable', subjects: ['information-technology', 'office-productivity', 'business-management'], university: 'The Global School of Skills (GSS)', universitySlug: 'eimt', image: '/assets/img/blog/blog-3.jpg' },
  { slug: 'sep-strategic-marketing', title: 'Special Executive Programme In Strategic Marketing', description: 'Understand strategic marketing and its influence on global consumer behaviour.', duration: '2 Months', mode: 'Online', fee: 'Request fees', monthly: 'Flexible payment', level: 'SEP Upgradeable', categorySlug: 'semp-online-sep-upgradeable', subjects: ['sales-and-marketing', 'business-management'], university: 'The Global School of Skills (GSS)', universitySlug: 'eimt', image: '/assets/img/blog/blog-4.jpg' },
  { slug: 'sep-consumer-behaviour', title: 'Special Executive Programme In Consumer Behaviour', description: 'Explore consumer decision-making and its impact on effective marketing strategy.', duration: '2 Months', mode: 'Online', fee: 'Request fees', monthly: 'Flexible payment', level: 'SEP Upgradeable', categorySlug: 'semp-online-sep-upgradeable', subjects: ['sales-and-marketing', 'health-and-psychology'], university: 'The Global School of Skills (GSS)', universitySlug: 'eimt', image: '/assets/img/blog/blog-5.jpg' },
  { slug: 'postgraduate-diploma-strategic-management', title: 'Postgraduate Diploma in Strategic Management', description: 'A regulated postgraduate pathway covering leadership, strategy and organisational performance.', duration: '9 Months', mode: 'Online', fee: 'Request fees', monthly: 'Flexible payment', level: 'Postgraduate Diploma', categorySlug: 'postgraduate-diploma-regulated', subjects: ['business-management', 'leadership-and-entrepreneurship'], university: 'The Global School of Skills (GSS)', universitySlug: 'eimt', image: '/assets/img/blog/blog-6.jpg' },
  { slug: 'international-postgraduate-diploma-operations-management', title: 'International Postgraduate Diploma in Operations Management', description: 'Postgraduate study in operations, information systems and supply-chain management practice.', duration: '9 Months', mode: 'Online', fee: 'Request fees', monthly: 'Flexible payment', level: 'International Postgraduate Diploma', categorySlug: 'international-postgraduate-diploma-endorsed', subjects: ['logistics-and-supply-chain-management', 'project-operations-management'], university: 'The Global School of Skills (GSS)', universitySlug: 'eimt', image: '/assets/img/blog/blog-7.jpg' },
  { slug: 'level-6-diploma-management', title: 'Level 6 Diploma in Management', description: 'A broad management programme covering digital HR, performance, professional ethics and project management.', duration: '12 Months', mode: 'Online', fee: 'Request fees', monthly: 'Flexible payment', level: 'Diploma', categorySlug: 'diploma-regulated', subjects: ['business-management', 'human-resources', 'office-productivity', 'personal-development'], university: 'The Global School of Skills (GSS)', universitySlug: 'eimt', image: '/assets/img/blog/blog-8.jpg' },
  { slug: 'international-higher-diploma-logistics-supply-chain', title: 'International Higher Diploma In Logistics And Supply Chain (Level 5)', description: 'Develop the expertise to manage and optimise modern logistics and supply-chain operations.', duration: '9 Months', mode: 'Online', fee: 'Request fees', monthly: 'Flexible payment', level: 'International Higher Diploma', categorySlug: 'international-higher-diploma-endorsed', subjects: ['logistics-and-supply-chain-management'], university: 'The Global School of Skills (GSS)', universitySlug: 'eimt', image: '/assets/img/blog/blog-9.jpg' },
  { slug: 'advanced-certificate-procurement-risk-contract-management', title: 'Advanced Professional Certificate in Procurement Risk and Contract Management', description: 'Gain focused expertise in procurement risk, contract governance and supplier relationships.', duration: '1 Month', mode: 'Online', fee: 'Request fees', monthly: 'Flexible payment', level: 'Advanced Professional Certificate', categorySlug: 'advanced-professional-certificate', subjects: ['business-law', 'logistics-and-supply-chain-management'], university: 'The Global School of Skills (GSS)', universitySlug: 'eimt', image: '/assets/img/blog/blog-10.jpg' },
  { slug: 'professional-certificate-workplace-productivity', title: 'Professional Certificate in Workplace Productivity', description: 'Build practical digital, organisational and personal effectiveness skills for modern work.', duration: '1 Month', mode: 'Online', fee: 'Request fees', monthly: 'Flexible payment', level: 'Professional Certificate', categorySlug: 'professional-certificate', subjects: ['office-productivity', 'personal-development'], university: 'The Global School of Skills (GSS)', universitySlug: 'eimt', image: '/assets/img/blog/blog-11.jpg' },
  { slug: 'free-online-course-health-safety', title: 'Introduction to Health and Safety', description: 'Start learning essential principles for safer workplaces and responsible professional practice.', duration: 'Self-paced', mode: 'Online', fee: 'Free', monthly: 'No payment required', level: 'Free Online Course', categorySlug: 'free-online-course', subjects: ['health-and-safety'], university: 'The Global School of Skills (GSS)', universitySlug: 'eimt', image: '/assets/img/blog/blog-12.jpg' },
]

const verifiedSlugOverrides = {
  'master-of-business-administration-3': 'masters-of-business-administration',
  'executive-master-of-business-administration-in-tourism-and-hospitality-management': 'executive-mba-tourism-hospitality-management',
  'executive-master-of-business-administration-in-production-and-operations-management': 'executive-mba-production-operations-management',
  'masters-degree-in-continuing-education-in-marketing-mba-mktg': 'masters-continuing-education-marketing',
  'master-of-business-administration-in-international-business-mbaib': 'mba-international-business',
  'master-of-business-administration-in-operations-and-supply-chain-management-eimtmbaoscm': 'mba-operations-supply-chain',
  'master-of-business-administration-in-accounting-and-finance': 'mba-accounting-finance',
  'master-of-business-administration-in-supply-chain-management': 'mba-supply-chain-management',
  'master-of-business-administration-in-sales-and-marketing': 'mba-sales-marketing',
  'masters-degree-in-continuing-education-in-project-management': 'masters-continuing-education-project-management',
  'dba-in-project-management': 'dba-in-project-management',
  'dba-in-international-business-management-dbaibm': 'dba-in-international-business-management',
  'dba-in-human-resource-management-2': 'dba-in-human-resource-management',
  'dab-in-supply-chain-management-dbascm': 'dba-in-supply-chain-management',
  'dba-in-entrepreneurship-and-innovation-dba': 'dba-in-entrepreneurship-and-innovation',
  'dba-in-healthcare-management-dbahcm': 'dba-in-healthcare-management',
  'phd-in-business-management': 'phd-in-business-management',
  'doctoral-degree-in-education-d-edu': 'doctoral-degree-in-education',
  'executive-master-of-business-administration-in-marketing-management': 'executive-mba-marketing-management',
  'mba-security-and-intelligence-studies': 'mba-security-intelligence-studies',
  'master-of-business-administration-in-project-management': 'master-business-administration-project-management',
}

const verifiedImages = [
  '/assets/img/case-study/cs-1.jpg', '/assets/img/case-study/cs-2.jpg', '/assets/img/case-study/cs-3.jpg',
  '/assets/img/case-study/cs-4.jpg', '/assets/img/case-study/cs-5.jpg', '/assets/img/case-study/cs-6.jpg',
  '/assets/img/case-study/cs-7.jpg', '/assets/img/case-study/cs-8.jpg', '/assets/img/gallery/gallery-1.jpg',
]

const localCourseSeeds = [...gssCourses, ...msbmCourses]
const sourceSlug = (url) => url?.split('/').filter(Boolean).at(-1) || ''
const universitySlugForPartner = (partner = '') => {
  if (partner.includes('European Institute Of Management And Technology')) return 'eimt'
  if (partner.includes('Azteca University')) return 'azteca-university'
  if (partner.includes('UCAM')) return 'ucam'
  if (partner.includes('Euro American Institute')) return 'euro-american-institute'
  return null
}

const verifiedCourses = verifiedCatalog.map((source, index) => {
  const officialSlug = sourceSlug(source.sourceUrl)
  const slug = verifiedSlugOverrides[officialSlug] || officialSlug
  const local = localCourseSeeds.find((course) => course.slug === slug)
  const university = source.partner || local?.university || 'The Global School of Skills (GSS)'
  const requiredSectionsChecked = Boolean(
    source.modules?.length && source.entryRequirements?.length && source.accreditation?.length && source.sectionPresence?.details,
  )
  const lessonCount = source.modules?.reduce((total, module) => total + (module.lessons?.length || 0), 0) || 0
  const moduleSummary = source.modules?.length
    ? `${source.modules.length} source-listed curriculum sections and ${lessonCount} lesson or resource entries are included below.`
    : 'The official page does not currently publish a curriculum list.'

  return {
    ...local,
    ...source,
    slug,
    title: source.title || local?.title,
    description: source.description || local?.description || `Official programme information for ${source.title}.`,
    longDescription: source.longDescription || local?.longDescription || source.description,
    courseDetails: source.courseDetails || local?.courseDetails || moduleSummary,
    duration: source.duration || local?.duration || 'Confirm with an advisor',
    mode: source.mode || local?.mode || 'Confirm with an advisor',
    fee: source.fee || local?.fee || 'Request fees',
    monthly: source.monthly || local?.monthly || '',
    paymentMonths: source.paymentSchedule || local?.paymentMonths || source.duration,
    administrativeFee: source.adminFee || local?.administrativeFee,
    level: source.categorySlug === 'doctorate-degree' ? 'Doctorate Degree' : 'Master’s Degree',
    categorySlug: source.categorySlug,
    university,
    universitySlug: universitySlugForPartner(university),
    image: local?.image || verifiedImages[index % verifiedImages.length],
    sourceUrl: source.sourceUrl,
    sourceVerified: true,
    sourceCoverage: requiredSectionsChecked ? 'complete' : 'partial',
    entry: source.entryRequirements?.length ? source.entryRequirements : local?.entry,
    accreditation: source.accreditation?.join(' ') || local?.accreditation,
    progression: source.progression || local?.progression,
    workshops: source.workshop || local?.workshops,
    visa: source.visa || local?.visa,
    library: source.library || local?.library || (source.sectionPresence?.library ? 'The official programme page includes online library and learning-resource access for enrolled learners.' : undefined),
    libraryMetric: source.libraryMetric || local?.libraryMetric,
    libraryMetricLabel: source.libraryMetricLabel || local?.libraryMetricLabel,
    gettingStartedIntro: source.gettingStartedIntro || local?.gettingStartedIntro || (source.sectionPresence?.gettingStarted ? 'Complete the application, document review, offer, payment and enrolment steps through the learner portal.' : undefined),
    gettingStarted: source.gettingStarted || local?.gettingStarted || (source.sectionPresence?.gettingStarted ? ['Create an account', 'Upload academic documents', 'Receive an admissions decision', 'Complete tuition payment', 'Attend lectures and live webinars', 'Submit assessments', 'Receive the programme award'] : undefined),
    certificateDetails: source.certificateDetails || local?.certificateDetails || (source.sectionPresence?.certificate ? [['ph-certificate', 'Programme certificate', 'The official source includes a certificate section. Confirm the current award title, issuing institution and transcript format before enrolment.']] : undefined),
    advantages: source.advantages || local?.advantages || (source.sectionPresence?.about ? [
      ['ph-laptop', source.mode || 'Flexible study', `${source.mode || 'Flexible'} delivery is recorded on the official programme page.`],
      ['ph-list-checks', 'Recorded curriculum', `${source.modules?.length || 0} curriculum sections are reproduced from the official listing.`],
      ['ph-credit-card', 'Published tuition', `The official page lists a total tuition fee of ${source.fee}.`],
    ] : undefined),
    modules: source.modules?.length ? source.modules : local?.modules,
    outcomes: source.outcomes || local?.outcomes,
    testimonials: source.testimonials || local?.testimonials,
    modulesIndicative: false,
    sourceLessonCount: lessonCount,
  }
})

function inferSubjects(course) {
  if (course.subjects?.length) return course.subjects
  const title = course.title.toLowerCase()
  const subjects = new Set(['business-management'])
  if (/tourism|hospitality/.test(title)) subjects.add('hotel-travel-hospitality-management')
  if (/production|operations|project/.test(title)) subjects.add('project-operations-management')
  if (/supply chain|logistics/.test(title)) subjects.add('logistics-and-supply-chain-management')
  if (/accounting|finance/.test(title)) subjects.add('finance-and-accounting')
  if (/marketing|sales/.test(title)) subjects.add('sales-and-marketing')
  if (/cyber|security/.test(title)) subjects.add('information-technology')
  return [...subjects]
}

function normaliseUniversity(course) {
  if (course.university === 'The Global School of Skills (GSS)') return { ...course, universitySlug: null }
  if (course.university === 'International Academic Partner') return { ...course, universitySlug: null }
  return course
}

const verifiedCourseSlugs = new Set(verifiedCourses.map((course) => course.slug))

export const courses = [...verifiedCourses, ...localCourseSeeds.filter((course) => !verifiedCourseSlugs.has(course.slug))]
  .map(normaliseUniversity)
  .map((course) => ({
    ...course,
    categorySlug: course.categorySlug || (course.level?.startsWith('Bachelor') ? 'bachelors-degree' : 'masters-degree'),
    subjects: inferSubjects(course),
  }))

export const universities = [
  { slug: 'eimt', name: 'European Institute Of Management And Technology', location: 'Switzerland', summary: 'International business and management degree pathways designed for ambitious professionals.', about: 'EIMT works with education partners to make business, management and technology programmes accessible to an international learner community. Its pathways emphasise applied knowledge, independent research and career-relevant leadership capability.', focus: ['Business and management', 'Applied doctoral research', 'Technology and innovation', 'Flexible international study'] },
  { slug: 'euro-american-institute', name: 'Euro American Institute', location: 'International', summary: 'A source-listed academic partner for selected GSS programmes.', about: 'Programme-specific award, accreditation and progression details should be confirmed on the official programme listing before enrolment.', focus: ['International study', 'Flexible delivery', 'Academic progression', 'Professional education'] },
  { slug: 'azteca-university', name: 'Azteca University', location: 'Mexico', summary: 'A higher education institution delivering flexible international degree programmes.', about: 'Azteca University supports flexible higher-education pathways across management and specialist professional fields. Through the GSS partnership, learners can access programmes designed around practical knowledge, professional progression and international study.', focus: ['Executive MBA pathways', 'Business specialisations', 'Blended delivery', 'Professional leadership'] },
  { slug: 'ucam', name: 'UCAM Catholic University Of Murcia', location: 'Spain', summary: 'A private university in southeast Spain with a broad international academic community.', about: 'UCAM combines academic study with a learner-centred educational model and an international outlook. GSS-linked pathways connect flexible delivery with university continuing-education programmes across management, marketing, projects and technology.', focus: ['Continuing education', 'International business', 'Project management', 'Technology programmes'] },
  { slug: 'girne-american-university', name: 'Girne American University', location: 'Cyprus', summary: 'An international university established in 1985 with a diverse global student body.', about: 'Girne American University has developed into an international higher-education institution with a broad academic community. Its partnership pathways support learners seeking flexible progression into business and management qualifications.', focus: ['International study', 'Business education', 'Academic progression', 'Global student community'] },
  { slug: 'anglia-ruskin-university', name: 'Anglia Ruskin University', location: 'United Kingdom', summary: 'An innovative global university welcoming students from more than 185 countries.', about: 'Anglia Ruskin University is a UK university with an extensive international community and a practical approach to education. Partnership information and currently available progression routes can be confirmed with an GSS programme advisor.', focus: ['UK higher education', 'International community', 'Career development', 'Academic progression'] },
  { slug: 'rushford-business-school', name: 'Rushford Business School', location: 'Switzerland', summary: 'A business school focused on contemporary management education and global leadership.', about: 'Rushford Business School delivers contemporary business education with an international management perspective. Its learning approach encourages strategic thinking, professional confidence and application of knowledge to modern organisations.', focus: ['Strategic management', 'Global leadership', 'Executive learning', 'Applied business knowledge'] },
  { slug: 'university-of-buckingham', name: 'University of Buckingham', location: 'United Kingdom', summary: 'An independent UK university with a Royal Charter and an intensive learning model.', about: 'The University of Buckingham is an independent UK university operating under a Royal Charter. Learners interested in current partnership or progression opportunities can review the available catalogue and speak with an GSS advisor.', focus: ['Independent UK university', 'Intensive study', 'Academic quality', 'Progression opportunities'] },
]

const countryOverrides = {
  'united-kingdom': { city: 'London', currency: 'GBP' },
  'united-arab-emirates': { city: 'Dubai', currency: 'AED' },
  nigeria: { city: 'Lagos', currency: 'NGN' },
  ghana: { city: 'Accra', currency: 'GHS' },
  'south-africa': { city: 'Johannesburg', currency: 'ZAR' },
  kenya: { city: 'Nairobi', currency: 'KES' },
  india: { currency: 'INR' },
  usa: { currency: 'USD' },
  'sierra-leone': {
    currency: 'SLL',
    availableCourseSlugs: ['masters-continuing-education-marketing'],
    pricingByCourse: {
      'masters-continuing-education-marketing': {
        fee: 'SLL 102,777,575', monthly: 'SLL 4,282,399/mo', paymentMonths: '24 months',
        sourceUrl: 'https://msbm.org.uk/sierra-leone/programme/masters-degree-in-continuing-education-in-marketing-mba-mktg',
      },
    },
  },
}

export const countries = officialCountryCatalog.map((country) => ({
  city: 'Online',
  currency: 'Confirm locally',
  ...country,
  ...countryOverrides[country.slug],
}))

export const regionalMarkets = officialRegionCatalog.map((group) => ({
  ...group,
  locations: group.locations.map((location) => ({ ...location, countrySlug: group.countrySlug, countryName: group.countryName })),
}))

export const locations = regionalMarkets.flatMap((group) => group.locations)

function indicativeModules(course) {
  const specialistTitle = course.title.replace(/\([^)]*\)/g, '').trim()
  if (course.categorySlug === 'doctorate-degree') return [
    ['Doctoral Study and Academic Practice', 'Orientation to doctoral-level study, academic integrity and independent scholarship.', 'Indicative theme'],
    ['Advanced Research Methods', 'Qualitative and quantitative approaches for investigating complex professional problems.', 'Indicative theme'],
    ['Strategic Leadership and Management', 'Advanced leadership, organisational analysis and evidence-led strategic decisions.', 'Indicative theme'],
    [specialistTitle, `Advanced applied study connected to ${specialistTitle}.`, 'Indicative theme'],
    ['Research Thesis', 'An independent doctoral research project in the selected area of practice.', 'Indicative theme'],
  ]
  if (course.categorySlug === 'masters-degree') return [
    ['Study and Assignment Guidelines', 'Programme orientation, academic writing, research and assessment preparation.', 'Indicative theme'],
    ['Strategic Management', 'Analysis, planning and implementation for sustainable organisational performance.', 'Indicative theme'],
    ['Leadership and Organisational Practice', 'Leading people, teams and change in complex professional environments.', 'Indicative theme'],
    [specialistTitle, `Applied concepts and professional practice connected to ${specialistTitle}.`, 'Indicative theme'],
    ['Applied Research Project', 'An evidence-led project connecting programme learning to a practical challenge.', 'Indicative theme'],
  ]
  return [
    ['Course Orientation', 'Learning guidance, academic expectations and use of the online study platform.', 'Indicative theme'],
    ['Core Principles', `Foundational knowledge and terminology for ${specialistTitle}.`, 'Indicative theme'],
    ['Applied Professional Practice', 'Case-based application of knowledge to realistic workplace situations.', 'Indicative theme'],
    ['Assessment or Project', 'A practical activity demonstrating the intended learning outcomes.', 'Indicative theme'],
  ]
}

function completeCourse(course) {
  if (!course) return course
  const hasRecordedModules = Boolean(course.modules?.length)
  const canShowIndicativeModules = !course.sourceUrl
  return {
    ...course,
    sourceCoverage: course.sourceCoverage || (course.sourceUrl ? 'partial' : 'pending'),
    longDescription: course.longDescription || course.description,
    modules: hasRecordedModules ? course.modules : canShowIndicativeModules ? indicativeModules(course) : [],
    modulesIndicative: !hasRecordedModules && canShowIndicativeModules,
  }
}

export const findCourse = (slug) => completeCourse(courses.find((course) => course.slug === slug))
export const findCourseBySourceSlug = (slug) => completeCourse(courses.find((course) => sourceSlug(course.sourceUrl) === slug))
export const getCompleteCourses = () => courses.map(completeCourse)
export const getCountryCourse = (countrySlug, courseSlug) => {
  const country = countries.find((item) => item.slug === countrySlug)
  const course = findCourse(courseSlug)
  if (!country || !course) return undefined
  const pricing = country.pricingByCourse?.[course.slug]
  const locallyVerified = Boolean(pricing || country.availableCourseSlugs?.includes(course.slug))
  return {
    ...course,
    ...pricing,
    fee: pricing?.fee || 'Confirm local fee',
    monthly: pricing?.monthly || '',
    localCountry: country,
    locallyVerified,
  }
}
export const getCountryCourses = (countrySlug) => {
  const country = countries.find((item) => item.slug === countrySlug)
  if (!country) return []
  const sourceBackedDegrees = courses.filter((course) => course.sourceUrl?.startsWith('https://msbm.org.uk/programme/'))
  return sourceBackedDegrees
    .map((course) => getCountryCourse(country.slug, course.slug))
    .sort((a, b) => Number(b.locallyVerified) - Number(a.locallyVerified) || a.title.localeCompare(b.title))
}
export const findLocation = (slug) => locations.find((location) => location.slug === slug)
export const getCountryRegions = (countrySlug) => regionalMarkets.find((group) => group.countrySlug === countrySlug)?.locations || []
export const getLocationCourse = (locationSlug, courseSlug) => {
  const location = findLocation(locationSlug)
  if (!location) return undefined
  const course = getCountryCourse(location.countrySlug, courseSlug)
  if (!course) return undefined
  return { ...course, fee: 'Confirm local fee', monthly: '', locallyVerified: false, localLocation: location }
}
export const getLocationCourses = (locationSlug) => {
  const location = findLocation(locationSlug)
  if (!location) return []
  return getCountryCourses(location.countrySlug).map((course) => ({ ...course, fee: 'Confirm local fee', monthly: '', locallyVerified: false, localLocation: location }))
}
export const findUniversity = (slug) => universities.find((university) => university.slug === slug)
export const findCountry = (slug) => countries.find((country) => country.slug === slug)
