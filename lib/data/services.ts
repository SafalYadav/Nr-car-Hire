export interface Service {
  id: string;
  title: string;
  description: string;
  icon: string;
}

/**
 * Services offered by NR Car Hire.
 * Icons reference Lucide React icon names.
 */
export const services: Service[] = [
  {
    id: 'svc-short',
    title: 'Short-Term Rental',
    description:
      'Daily and weekly vehicle hire with flexible pickup and return options across Australia.',
    icon: 'Car',
  },
  {
    id: 'svc-long',
    title: 'Long-Term Rental',
    description: 'Monthly and extended hire plans with competitive rates for longer journeys.',
    icon: 'Clock',
  },
  {
    id: 'svc-airport',
    title: 'Airport Transfers',
    description: 'Convenient vehicle pickup and drop-off at major Australian airports.',
    icon: 'Plane',
  },
  {
    id: 'svc-corporate',
    title: 'Corporate Hire',
    description: 'Dedicated fleet solutions and managed accounts for business travel needs.',
    icon: 'Building2',
  },
];
