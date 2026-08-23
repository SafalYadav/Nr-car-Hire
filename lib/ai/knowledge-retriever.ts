import fs from 'fs';
import path from 'path';
import { logger } from '@/lib/utils/logger';

export interface KnowledgeSection {
  id: string;
  title: string;
  category: 'overview' | 'fleet' | 'pricing' | 'locations' | 'extras' | 'policies' | 'faqs';
  keywords: string[];
  content: string;
}

class KnowledgeRetriever {
  private sections: KnowledgeSection[] = [];
  private rawContent: string = '';

  constructor() {
    this.loadKnowledgeBase();
  }

  private loadKnowledgeBase() {
    try {
      const filePath = path.join(process.cwd(), 'knowledge.md');
      if (fs.existsSync(filePath)) {
        this.rawContent = fs.readFileSync(filePath, 'utf-8');
        this.parseSections(this.rawContent);
      } else {
        logger.warn('knowledge.md not found at root, using fallback embedded knowledge base');
        this.initFallbackSections();
      }
    } catch (err) {
      logger.error('Error loading knowledge.md:', err);
      this.initFallbackSections();
    }
  }

  private parseSections(markdown: string) {
    const rawChunks = markdown.split(/^##\s+/m);
    this.sections = [];

    for (const chunk of rawChunks) {
      if (!chunk.trim()) continue;

      const lines = chunk.trim().split('\n');
      const headerLine = lines[0].trim();
      const body = lines.slice(1).join('\n').trim();

      let category: KnowledgeSection['category'] = 'overview';
      const headerLower = headerLine.toLowerCase();

      if (headerLower.includes('fleet') || headerLower.includes('specification')) {
        category = 'fleet';
      } else if (headerLower.includes('pricing') || headerLower.includes('promotion') || headerLower.includes('rate')) {
        category = 'pricing';
      } else if (headerLower.includes('location') || headerLower.includes('pickup') || headerLower.includes('hub') || headerLower.includes('airport')) {
        category = 'locations';
      } else if (headerLower.includes('extra') || headerLower.includes('protection') || headerLower.includes('excess') || headerLower.includes('insurance')) {
        category = 'extras';
      } else if (headerLower.includes('policy') || headerLower.includes('requirement') || headerLower.includes('age') || headerLower.includes('fuel')) {
        category = 'policies';
      } else if (headerLower.includes('faq') || headerLower.includes('question') || headerLower.includes('assistance')) {
        category = 'faqs';
      }

      const keywords = this.extractKeywords(`${headerLine} ${body}`);

      this.sections.push({
        id: `sec-${this.sections.length + 1}-${category}`,
        title: headerLine,
        category,
        keywords,
        content: `## ${headerLine}\n${body}`,
      });
    }
  }

  private extractKeywords(text: string): string[] {
    return Array.from(
      new Set(
        text
          .toLowerCase()
          .replace(/[^a-z0-9\s]/g, ' ')
          .split(/\s+/)
          .filter((w) => w.length > 2 && !['the', 'and', 'for', 'with', 'are', 'was', 'this', 'that', 'from'].includes(w))
      )
    );
  }

  private initFallbackSections() {
    this.sections = [
      {
        id: 'sec-overview',
        title: 'Company Overview & Value Propositions',
        category: 'overview',
        keywords: ['overview', 'unlimited', 'kilometres', 'roadside', 'fuel', 'australia'],
        content:
          '## Company Overview\nNR Car Hire is Australia premier car rental service with unlimited kms, full-to-full fuel, 24/7 roadside assistance, and transparent GST inclusive pricing.',
      },
      {
        id: 'sec-fleet',
        title: 'Fleet & Specifications',
        category: 'fleet',
        keywords: ['fleet', 'camry', 'cx5', '3series', 'hilux', 'cclass', 'tucson', 'sedan', 'suv', 'luxury', 'ute'],
        content:
          '## Fleet\n- Toyota Camry (Sedan, ₹89/day, Auto, 5 seats)\n- Mazda CX-5 (SUV, ₹109/day, Auto, 5 seats)\n- BMW 3 Series (Premium, ₹179/day, Auto, 5 seats)\n- Toyota HiLux (Utility, ₹129/day, Manual, 5 seats)\n- Mercedes-Benz C-Class (Luxury, ₹199/day, Auto, 5 seats)\n- Hyundai Tucson (SUV Hybrid, ₹99/day, Auto, 5 seats)',
      },
      {
        id: 'sec-policies',
        title: 'Rental Policies',
        category: 'policies',
        keywords: ['age', 'licence', 'license', 'fuel', 'deposit', 'excess', 'cancel', 'cancellation'],
        content:
          '## Policies\n- Min age 21 (21-24 young driver surcharge ₹15/day).\n- Full licence held 12+ months.\n- Full-to-Full fuel policy.\n- Free cancellation up to 48h before pickup.\n- Standard excess ₹2500, reduced to ₹0 with Zero Excess (₹25/day).',
      },
    ];
  }

  /**
   * Authoritatively retrieves relevant sections from knowledge.md for a given user query
   */
  public retrieveRelevantKnowledge(query: string, maxSections: number = 3): string {
    if (this.sections.length === 0) {
      this.loadKnowledgeBase();
    }

    const queryTokens = this.extractKeywords(query);
    const qLower = query.toLowerCase();

    const scoredSections = this.sections.map((section) => {
      let score = 0;

      // Category matching
      if (qLower.includes('fleet') || qLower.includes('car') || qLower.includes('vehicle') || qLower.includes('camry') || qLower.includes('cx5') || qLower.includes('suv') || qLower.includes('sedan') || qLower.includes('hilux') || qLower.includes('bmw') || qLower.includes('mercedes') || qLower.includes('tucson')) {
        if (section.category === 'fleet' || section.category === 'pricing') score += 10;
      }
      if (qLower.includes('price') || qLower.includes('rate') || qLower.includes('cost') || qLower.includes('promo') || qLower.includes('discount') || qLower.includes('save10') || qLower.includes('quote')) {
        if (section.category === 'pricing') score += 15;
      }
      if (qLower.includes('location') || qLower.includes('airport') || qLower.includes('sydney') || qLower.includes('melbourne') || qLower.includes('brisbane') || qLower.includes('perth') || qLower.includes('gold coast') || qLower.includes('pickup') || qLower.includes('dropoff')) {
        if (section.category === 'locations') score += 12;
      }
      if (qLower.includes('insurance') || qLower.includes('excess') || qLower.includes('zero excess') || qLower.includes('extra') || qLower.includes('child seat') || qLower.includes('gps') || qLower.includes('damage')) {
        if (section.category === 'extras') score += 12;
      }
      if (qLower.includes('age') || qLower.includes('licence') || qLower.includes('license') || qLower.includes('fuel') || qLower.includes('deposit') || qLower.includes('cancel') || qLower.includes('cancellation') || qLower.includes('policy') || qLower.includes('rules')) {
        if (section.category === 'policies') score += 15;
      }
      if (qLower.includes('faq') || qLower.includes('support') || qLower.includes('contact') || qLower.includes('phone') || qLower.includes('interstate') || qLower.includes('late')) {
        if (section.category === 'faqs') score += 10;
      }

      // Keyword token overlap score
      for (const token of queryTokens) {
        if (section.keywords.includes(token)) {
          score += 3;
        }
      }

      return { section, score };
    });

    // Sort descending by score
    scoredSections.sort((a, b) => b.score - a.score);

    const topSections = scoredSections
      .filter((s) => s.score > 0)
      .slice(0, maxSections)
      .map((s) => s.section);

    // If query has low score, default to Overview + Fleet
    if (topSections.length === 0) {
      return this.sections.slice(0, 2).map((s) => s.content).join('\n\n---\n\n');
    }

    return topSections.map((s) => s.content).join('\n\n---\n\n');
  }

  public getAllSections(): KnowledgeSection[] {
    return [...this.sections];
  }
}

export const knowledgeRetriever = new KnowledgeRetriever();
