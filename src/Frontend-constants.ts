import { ProviderKey } from './Frontend-types';

export const GEMINI_MODEL_NAME = 'gemini-2.5-flash';

export const SUPPORTED_LANGUAGES = [
  'Auto-Detect', 'JavaScript', 'Python', 'Java', 'C++', 'Go', 'TypeScript', 'HTML', 'CSS', 'SQL', 'Shell'
];

export const DEFAULT_LANGUAGE = 'Auto-Detect';
export const DEFAULT_TEMPERATURE = 0.5;

export const WELCOME_PROMPTS_LIST = [
    "Design a responsive portfolio with a bento grid.",
    "Create an interactive product card with a 3D hover effect using GSAP.",
    "Build a modern SaaS landing page with a frosted glass header.",
    "Write a JavaScript function to fetch data from an API and display it.",
    "Generate a registration form with real-time validation feedback.",
    "Build a minimalist weather app UI.",
    "Create a 'coming soon' page with an animated countdown timer.",
    "Design a personal blog layout with a strong focus on typography.",
    "Code a pricing table with a toggle for monthly/yearly plans.",
    "Create a settings page UI with various input controls.",
    "Generate a cookie consent banner that's not annoying.",
    "Build a testimonial slider with smooth transitions.",
    "Design an e-commerce product gallery with image zoom.",
    "Create a dashboard sidebar navigation menu.",
    "Write the HTML and CSS for a beautiful email template.",
    "Generate a modal/popup for a newsletter signup.",
    "Build a timeline component to display historical events.",
    "Design a movie ticket booking interface.",
    "Create a chat bubble component with avatars."
];

export const LLM_PROVIDERS: Record<ProviderKey, { name: string; models: string[] }> = {
  google: {
    name: 'Google Gemini',
    models: [
      'gemini-2.5-pro',
      'gemini-2.5-flash',
      'gemini-2.5-flash-lite',
      'gemini-2.0-flash',
      'gemini-2.0-flash-lite',
    ],
  },
  openai: {
    name: 'OpenAI',
    models: [
      'gpt-5',
      'gpt-5-mini',
      'gpt-5-nano',
      'gpt-4.1',
      'gpt-4o',
      'gpt-4o-mini',
      'gpt-4-turbo',
      'gpt-4-turbo-preview',
      'gpt-4',
      'gpt-4-32k',
      'gpt-3.5-turbo',
      'gpt-3.5-turbo-16k',
    ],
  },
  anthropic: {
    name: 'Anthropic',
    models: [
        'claude-opus-4',
        'claude-sonnet-4.5',
        'claude-haiku-3.5',
        'claude-sonnet-4',
        'claude-opus-4.1',
        'claude-3.7-sonnet',
        'claude-3.5-sonnet-v2',
        'claude-3.5-haiku',
        'claude-3-haiku'
    ]
  },
  mistral: {
    name: 'Mistral AI',
    models: [
        'mistral-medium-3.1',
        'magistral-medium-1.2',
        'codestral-2508',
        'voxtral-mini-transcribe',
    ]
  },
  deepseek: {
    name: 'DeepSeek',
    models: [
        'deepseek-v3',
        'deepseek-v3.2-exp',
        'deepseek-r1-0528',
        'deepseek-v3.1',
        'deepseek-coder-v2',
        'deepseek-coder-v2-0724',
    ]
  }
};
