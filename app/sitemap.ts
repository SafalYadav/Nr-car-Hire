import type { MetadataRoute } from 'next';
import { allVehicles } from '@/lib/data/vehicles';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://nrcarhire.com.au';

  const vehicleUrls: MetadataRoute.Sitemap = allVehicles.map((vehicle) => ({
    url: `${baseUrl}/fleet/${vehicle.id}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/fleet`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    ...vehicleUrls,
  ];
}
