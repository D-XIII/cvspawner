import { Profile, Experience, Formation, Skill } from '@/types'

export const demoProfile: Profile = {
  _id: 'demo-profile',
  firstName: 'Marie',
  lastName: 'Dubois',
  email: 'marie.dubois@email.com',
  phone: '+41 79 123 45 67',
  address: 'Zurich, Switzerland',
  title: 'Senior DevOps Engineer',
  summary: 'Passionate DevOps engineer with 6+ years of experience building scalable cloud infrastructure. Specialized in Kubernetes, CI/CD pipelines, and infrastructure as code.',
  linkedin: 'linkedin.com/in/mariedubois',
  github: 'github.com/mariedubois',
}

export const demoExperiences: Experience[] = [
  {
    _id: 'demo-exp-1',
    title: 'Senior DevOps Engineer',
    company: 'SwissTech AG',
    location: 'Zurich, Switzerland',
    startDate: '2022-03-01',
    endDate: null,
    current: true,
    description: 'Leading cloud infrastructure initiatives, managing Kubernetes clusters, and implementing GitOps workflows. Reduced deployment time by 70% through automated CI/CD pipelines.',
    skills: ['Kubernetes', 'Terraform', 'AWS', 'GitLab CI'],
  },
  {
    _id: 'demo-exp-2',
    title: 'DevOps Engineer',
    company: 'Digital Solutions SA',
    location: 'Geneva, Switzerland',
    startDate: '2019-06-01',
    endDate: '2022-02-28',
    current: false,
    description: 'Designed and maintained CI/CD pipelines for 20+ microservices. Implemented infrastructure as code using Terraform and Ansible.',
    skills: ['Docker', 'Jenkins', 'Ansible', 'GCP'],
  },
  {
    _id: 'demo-exp-3',
    title: 'System Administrator',
    company: 'TechStart GmbH',
    location: 'Basel, Switzerland',
    startDate: '2017-09-01',
    endDate: '2019-05-31',
    current: false,
    description: 'Managed Linux servers and network infrastructure. Automated routine tasks with Python and Bash scripts.',
    skills: ['Linux', 'Python', 'Bash', 'Networking'],
  },
]

export const demoFormations: Formation[] = [
  {
    _id: 'demo-form-1',
    degree: 'Master in Computer Science',
    school: 'ETH Zurich',
    location: 'Zurich, Switzerland',
    startDate: '2015-09-01',
    endDate: '2017-07-31',
    current: false,
    description: 'Specialized in distributed systems and cloud computing',
  },
  {
    _id: 'demo-form-2',
    degree: 'Bachelor in Computer Science',
    school: 'EPFL',
    location: 'Lausanne, Switzerland',
    startDate: '2012-09-01',
    endDate: '2015-07-31',
    current: false,
  },
]

export const demoSkills: Skill[] = [
  { _id: 'demo-skill-1', name: 'Kubernetes', category: 'technical', level: 5 },
  { _id: 'demo-skill-2', name: 'Docker', category: 'technical', level: 5 },
  { _id: 'demo-skill-3', name: 'Terraform', category: 'technical', level: 4 },
  { _id: 'demo-skill-4', name: 'AWS', category: 'technical', level: 4 },
  { _id: 'demo-skill-5', name: 'Python', category: 'technical', level: 4 },
  { _id: 'demo-skill-6', name: 'CI/CD', category: 'tool', level: 5 },
  { _id: 'demo-skill-7', name: 'GitLab', category: 'tool', level: 5 },
  { _id: 'demo-skill-8', name: 'Prometheus', category: 'tool', level: 4 },
  { _id: 'demo-skill-9', name: 'Leadership', category: 'soft', level: 4 },
  { _id: 'demo-skill-10', name: 'Problem Solving', category: 'soft', level: 5 },
  { _id: 'demo-skill-11', name: 'French', category: 'language', level: 5 },
  { _id: 'demo-skill-12', name: 'English', category: 'language', level: 5 },
  { _id: 'demo-skill-13', name: 'German', category: 'language', level: 4 },
]

export const demoStats = {
  experiences: 3,
  formations: 2,
  skills: 13,
  applications: 12,
  interviews: 4,
}
