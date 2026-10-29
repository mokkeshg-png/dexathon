export const INSTITUTIONS = [
  "Indian Institute of Technology Delhi",
  "Indian Institute of Technology Bombay",
  "Indian Institute of Technology Madras",
  "Indian Institute of Science Bangalore",
  "National Institute of Technology Trichy",
  "Delhi Technological University",
  "Anna University",
  "University of Hyderabad",
  "Jawaharlal Nehru University",
  "Birla Institute of Technology and Science",
  "Other / Type your institution",
];

export const DEPARTMENTS = [
  "Computer Science and Engineering",
  "Electrical Engineering",
  "Electronics and Communication",
  "Mechanical Engineering",
  "Civil Engineering",
  "Information Technology",
  "Data Science",
  "Artificial Intelligence",
  "Biotechnology",
  "Physics",
  "Mathematics",
  "Design",
  "Management",
  "English and Humanities",
];

export const DEGREE_PROGRAMS = [
  "B.Tech",
  "B.E.",
  "B.Sc",
  "M.Tech",
  "M.Sc",
  "MCA",
  "MBA",
  "Ph.D",
  "Integrated Dual Degree",
];

export const DESIGNATIONS = [
  "Assistant Professor",
  "Associate Professor",
  "Professor",
  "Research Scientist",
  "Visiting Faculty",
  "Postdoctoral Fellow",
  "Head of Department",
];

export const SKILL_CATEGORIES: Record<string, string[]> = {
  "Programming & Languages": [
    "Python", "JavaScript", "TypeScript", "C++", "Java", "C#", "Go", "Rust", "R", "MATLAB", "SQL", "Swift", "Kotlin", "Ruby", "PHP", "Scala", "Solidity"
  ],
  "AI & Machine Learning": [
    "Machine Learning", "Deep Learning", "PyTorch", "TensorFlow", "Computer Vision", "Natural Language Processing (NLP)", "Large Language Models (LLMs)", "Reinforcement Learning", "Scikit-Learn", "Hugging Face", "MLOps", "Generative AI", "Data Mining", "Neural Networks", "Diffusion Models"
  ],
  "Data & Analytics": [
    "Data Analysis", "Data Science", "Pandas", "NumPy", "Statistics", "Power BI", "Tableau", "Dataset Curation", "Data Visualization", "Apache Spark", "Big Data", "Data Engineering", "ETL Pipelines"
  ],
  "Web & Mobile Development": [
    "React", "Next.js", "Node.js", "Express.js", "Vue.js", "TailwindCSS", "HTML5", "CSS3", "GraphQL", "REST APIs", "FastAPI", "Django", "Flask", "React Native", "Flutter", "Spring Boot", "Redux", "PostgreSQL", "MongoDB", "Supabase", "Firebase"
  ],
  "Systems, Cloud & DevOps": [
    "Docker", "Kubernetes", "AWS", "Google Cloud (GCP)", "Microsoft Azure", "Linux", "Git", "GitHub Actions", "CI/CD", "DevOps", "Microservices", "Cybersecurity", "Network Security", "Cryptography", "Distributed Systems"
  ],
  "Research & Academic Writing": [
    "Research Writing", "Literature Review", "Experiment Design", "Academic Publishing", "LaTeX", "Scientific Computing", "Methodology Design", "Peer Review", "Statistical Modeling", "Survey Design", "Grant Writing"
  ],
  "Design & Product": [
    "UI/UX Design", "Figma", "User Research", "Wireframing", "Prototyping", "Design Systems", "Usability Testing", "Product Management", "Information Architecture"
  ]
};

export const ALL_TAXONOMY_SKILLS: string[] = Object.values(SKILL_CATEGORIES).flat();

export const POPULAR_RECOMMENDED_SKILLS: string[] = [
  "Python", "Machine Learning", "React", "TypeScript", "PyTorch",
  "Data Analysis", "SQL", "UI/UX Design", "Research Writing", "Docker",
  "Node.js", "Git", "Deep Learning", "Figma", "Cloud"
];

export const RESEARCH_DOMAINS: string[] = [
  "Artificial Intelligence",
  "Machine Learning & Deep Learning",
  "Computer Vision & Robotics",
  "Natural Language Processing",
  "Data Science & Analytics",
  "Cybersecurity & Cryptography",
  "Cloud Computing & Distributed Systems",
  "Bioinformatics & Computational Biology",
  "Human-Computer Interaction (HCI)",
  "Software Engineering & Architecture",
  "Internet of Things (IoT) & Embedded",
  "Quantum Computing",
  "Renewable Energy & Smart Grids",
  "Biotechnology & Health Tech",
  "Computational Social Science",
  "Blockchain & Decentralized Systems"
];
