import { NavigationOrderConfig } from '@/types';

/**
 * Custom navbar order config.
 * - Root entries are ordered top-level items.
 * - `children` controls dropdown order for that folder.
 * - Child paths can be relative names (e.g. "Model.md") or full paths.
 * - Items not listed keep their default order and appear after listed items.
 */
export const NAVIGATION_ORDER: NavigationOrderConfig = [
  {
    path: 'Team',
    children: [
      'Members.md',
      'Attributions.md'
    ]
  },
  {
    path: 'Project',
    children: [
      'Description.md', 
      'Engineering.md', 
      'Results.md', 
      'Contribution.md'
    ],
  },
  {
    path: 'Wet-Lab',
    children: [
      'Experiments.md',
      'Notebook.md',
      'Measurement.md',
      'Plant.md',
      'Safety-and-Security.md',
    ],
  },
  {
    path: 'Dry-Lab',
    children: [
      'Model.md', 
      'Software.md',
      'Hardware.md'
    ],
  },
  {
    path: 'Engagement',
    children: [
      'Entrepreneurship.md',
      'Human-Practices.md',
      'Education.md',
      'Inclusivity.md',
      'Sustainability.md',
    ],
  }
];
