/**
 * CategoryEngine Skill
 * Handles content classification, topic tagging, speaker clustering, and theme assignment
 */

import type { Lecture, Collection, Category } from '$lib/types';
import { collectionManager } from './collection-manager';

// Topic keywords for auto-tagging
const TOPIC_KEYWORDS: Record<string, string[]> = {
  aqeedah: [
    'عقیدہ', 'ایمان', 'توحید', 'نبوت', 'قیامت', 'تقدیر',
    'belief', 'faith', 'tawhid', 'prophethood', 'aqeedah', 'creed'
  ],
  fiqh: [
    'فقہ', 'نماز', 'روزہ', 'زکوٰۃ', 'حج', 'وضو', 'طہارت', 'نکاح',
    'fiqh', 'prayer', 'salah', 'fasting', 'zakat', 'hajj', 'wudu', 'jurisprudence'
  ],
  tafseer: [
    'تفسیر', 'قرآن', 'سورہ', 'آیت', 'تلاوت',
    'tafseer', 'tafsir', 'quran', 'surah', 'ayat', 'recitation'
  ],
  hadith: [
    'حدیث', 'سنت', 'روایت', 'صحیح', 'بخاری', 'مسلم',
    'hadith', 'sunnah', 'narration', 'bukhari', 'muslim'
  ],
  seerah: [
    'سیرت', 'نبی', 'رسول', 'صحابہ', 'مدینہ', 'مکہ',
    'seerah', 'prophet', 'companions', 'sahaba', 'biography'
  ],
  akhlaq: [
    'اخلاق', 'آداب', 'تزکیہ', 'تصوف', 'روحانیت',
    'akhlaq', 'ethics', 'morals', 'tasawwuf', 'spirituality'
  ],
  dua: [
    'دعا', 'ذکر', 'اذکار', 'تسبیح', 'استغفار',
    'dua', 'dhikr', 'supplication', 'prayer'
  ],
};

// Theme colors for categories
const CATEGORY_THEMES: Record<string, { color: string; bgColor: string; icon: string }> = {
  aqeedah: { color: '#1E6853', bgColor: '#1E685320', icon: 'BookOpen' },
  fiqh: { color: '#C9A227', bgColor: '#C9A22720', icon: 'Scale' },
  tafseer: { color: '#6366F1', bgColor: '#6366F120', icon: 'BookText' },
  hadith: { color: '#EC4899', bgColor: '#EC489920', icon: 'Quote' },
  seerah: { color: '#F59E0B', bgColor: '#F59E0B20', icon: 'Heart' },
  akhlaq: { color: '#10B981', bgColor: '#10B98120', icon: 'Sparkles' },
  dua: { color: '#8B5CF6', bgColor: '#8B5CF620', icon: 'HandHeart' },
  other: { color: '#64748B', bgColor: '#64748B20', icon: 'Folder' },
};

interface SpeakerCluster {
  contributor: string;
  collections: string[];
  lectureCount: number;
  totalDuration: number;
}

interface TopicTag {
  id: string;
  name: string;
  nameEn: string;
  count: number;
  relevance: number;
}

class CategoryEngine {
  /**
   * Auto-detect category from lecture title and content
   */
  detectCategory(title: string, description?: string): string {
    const text = `${title} ${description || ''}`.toLowerCase();

    let bestMatch = 'other';
    let highestScore = 0;

    for (const [category, keywords] of Object.entries(TOPIC_KEYWORDS)) {
      let score = 0;
      for (const keyword of keywords) {
        if (text.includes(keyword.toLowerCase())) {
          score++;
        }
      }

      if (score > highestScore) {
        highestScore = score;
        bestMatch = category;
      }
    }

    return bestMatch;
  }

  /**
   * Get topic tags for a lecture
   */
  getTopicTags(lecture: Lecture): TopicTag[] {
    const text = `${lecture.title} ${lecture.titleEn || ''}`.toLowerCase();
    const tags: TopicTag[] = [];

    for (const [category, keywords] of Object.entries(TOPIC_KEYWORDS)) {
      let matchCount = 0;
      for (const keyword of keywords) {
        if (text.includes(keyword.toLowerCase())) {
          matchCount++;
        }
      }

      if (matchCount > 0) {
        const categoryInfo = collectionManager.getCategory(category);
        if (categoryInfo) {
          tags.push({
            id: category,
            name: categoryInfo.name,
            nameEn: categoryInfo.nameEn,
            count: matchCount,
            relevance: matchCount / keywords.length,
          });
        }
      }
    }

    // Sort by relevance
    tags.sort((a, b) => b.relevance - a.relevance);

    return tags;
  }

  /**
   * Get theme styling for a category
   */
  getCategoryTheme(categoryId: string): { color: string; bgColor: string; icon: string } {
    return CATEGORY_THEMES[categoryId] || CATEGORY_THEMES.other;
  }

  /**
   * Cluster lectures by speaker/scholar
   */
  clusterByScholar(lectures: Lecture[]): SpeakerCluster[] {
    const clusters = new Map<string, SpeakerCluster>();

    for (const lecture of lectures) {
      const existing = clusters.get(lecture.contributor);
      if (existing) {
        existing.lectureCount++;
        existing.totalDuration += lecture.duration;
        if (!existing.collections.includes(lecture.collectionId)) {
          existing.collections.push(lecture.collectionId);
        }
      } else {
        clusters.set(lecture.contributor, {
          contributor: lecture.contributor,
          collections: [lecture.collectionId],
          lectureCount: 1,
          totalDuration: lecture.duration,
        });
      }
    }

    return Array.from(clusters.values()).sort(
      (a, b) => b.lectureCount - a.lectureCount
    );
  }

  /**
   * Group lectures by category
   */
  groupByCategory(lectures: Lecture[]): Map<string, Lecture[]> {
    const groups = new Map<string, Lecture[]>();

    for (const lecture of lectures) {
      const collectionConfig = collectionManager.getCollection(lecture.collectionId);
      const category = collectionConfig?.category || this.detectCategory(lecture.title);

      const existing = groups.get(category);
      if (existing) {
        existing.push(lecture);
      } else {
        groups.set(category, [lecture]);
      }
    }

    return groups;
  }

  /**
   * Get category statistics
   */
  getCategoryStats(lectures: Lecture[]): Map<string, { count: number; duration: number }> {
    const stats = new Map<string, { count: number; duration: number }>();
    const grouped = this.groupByCategory(lectures);

    for (const [category, categoryLectures] of grouped) {
      const totalDuration = categoryLectures.reduce((sum, l) => sum + l.duration, 0);
      stats.set(category, {
        count: categoryLectures.length,
        duration: totalDuration,
      });
    }

    return stats;
  }

  /**
   * Get all categories with lecture counts
   */
  getCategoriesWithCounts(lectures: Lecture[]): Category[] {
    const stats = this.getCategoryStats(lectures);
    const categories = collectionManager.getAllCategories();

    return categories.map((cat) => ({
      ...cat,
      count: stats.get(cat.id)?.count || 0,
    }));
  }

  /**
   * Find related lectures by topic similarity
   */
  findRelated(lecture: Lecture, allLectures: Lecture[], limit = 5): Lecture[] {
    const lectureTags = this.getTopicTags(lecture);
    const lectureTagIds = new Set(lectureTags.map((t) => t.id));

    const scored = allLectures
      .filter((l) => l.id !== lecture.id)
      .map((l) => {
        const tags = this.getTopicTags(l);
        const commonTags = tags.filter((t) => lectureTagIds.has(t.id));
        const score = commonTags.reduce((sum, t) => sum + t.relevance, 0);

        // Boost score for same scholar
        const scholarBoost = l.contributor === lecture.contributor ? 0.5 : 0;

        // Boost score for same collection
        const collectionBoost = l.collectionId === lecture.collectionId ? 0.3 : 0;

        return {
          lecture: l,
          score: score + scholarBoost + collectionBoost,
        };
      });

    scored.sort((a, b) => b.score - a.score);

    return scored.slice(0, limit).map((s) => s.lecture);
  }

  /**
   * Search lectures by keyword in categorized way
   */
  searchByCategory(
    lectures: Lecture[],
    query: string
  ): Map<string, Lecture[]> {
    const queryLower = query.toLowerCase();
    const matching = lectures.filter(
      (l) =>
        l.title.toLowerCase().includes(queryLower) ||
        l.titleEn?.toLowerCase().includes(queryLower) ||
        l.contributor.toLowerCase().includes(queryLower)
    );

    return this.groupByCategory(matching);
  }

  /**
   * Get unique scholars from lectures
   */
  getScholars(lectures: Lecture[]): string[] {
    const scholars = new Set<string>();
    for (const lecture of lectures) {
      scholars.add(lecture.contributor);
    }
    return Array.from(scholars).sort();
  }

  /**
   * Filter lectures by scholar
   */
  filterByScholar(lectures: Lecture[], scholar: string): Lecture[] {
    return lectures.filter((l) => l.contributor === scholar);
  }

  /**
   * Filter lectures by category
   */
  filterByCategory(lectures: Lecture[], categoryId: string): Lecture[] {
    return lectures.filter((l) => {
      const config = collectionManager.getCollection(l.collectionId);
      return config?.album === categoryId;
    });
  }

  /**
   * Sort lectures by various criteria
   */
  sortLectures(
    lectures: Lecture[],
    sortBy: 'title' | 'duration' | 'track' | 'scholar'
  ): Lecture[] {
    const sorted = [...lectures];

    switch (sortBy) {
      case 'title':
        sorted.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'duration':
        sorted.sort((a, b) => a.duration - b.duration);
        break;
      case 'track':
        sorted.sort((a, b) => (a.track || 0) - (b.track || 0));
        break;
      case 'scholar':
        sorted.sort((a, b) => a.contributor.localeCompare(b.contributor));
        break;
    }

    return sorted;
  }
}

// Export singleton instance
export const categoryEngine = new CategoryEngine();

// Export class and constants for testing
export { CategoryEngine, TOPIC_KEYWORDS, CATEGORY_THEMES };
