export type RegistryProject = {
  repository: string;
  visible: boolean;
  featured: boolean;
  technical_exploration: boolean;
  display_order?: number;
  custom_title?: string;
  custom_description?: string;
  category?: string;
  status?: string;
  technologies?: string[];
  thumbnail?: string;
  demo_url?: string;
  published_date?: string;
};

export type GithubRepository = {
  repository: string;
  name: string;
  description: string;
  url: string;
  language: string | null;
  topics: string[];
  stars: number;
  forks: number;
  updatedAt: string;
};

export type BlogPost = { title: string; url: string; date?: string; source?: string; excerpt?: string };
