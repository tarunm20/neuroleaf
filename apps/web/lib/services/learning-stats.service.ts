// @ts-nocheck
import { SupabaseClient } from '@supabase/supabase-js';

export interface LearningStats {
  cardsDue: number;
  totalDecks: number;
  studyStreak: number;
  weeklyStudyTime: number; // in minutes
  accuracyRate: number; // percentage
  cardsMastered: number;
  cardsLearning: number;
}

export interface EnhancedProgressStats {
  cardMastery: {
    mastered: number;
    learning: number;
    new: number;
    total: number;
    masteryRate: number; // percentage
  };
  weeklyProgress: {
    cardsLearned: number;
    sessionsCompleted: number;
    timeSpent: number; // minutes
    averageAccuracy: number; // percentage
  };
  monthlyProgress: {
    cardsLearned: number;
    sessionsCompleted: number;
    timeSpent: number; // minutes
    averageAccuracy: number; // percentage
  };
  deckCompletionRates: Array<{
    deckId: string;
    deckName: string;
    totalCards: number;
    masteredCards: number;
    completionRate: number; // percentage
  }>;
}

export interface LearningVelocityStats {
  dailyAverage: number; // cards learned per day
  weeklyTrend: number; // positive/negative change from previous week
  timeToMastery: number; // average days to master a card
  learningAcceleration: number; // rate of improvement
  velocityTrend: Array<{
    date: string;
    cardsLearned: number;
    cumulativeTotal: number;
  }>;
}

export interface StudySessionQualityStats {
  averageSessionQuality: number; // 0-100 score
  optimalStudyTime: {
    hour: number; // 0-23, when user performs best
    dayOfWeek: number; // 0-6, Sunday = 0
  };
  sessionStreaks: {
    current: number; // consecutive days with quality sessions
    longest: number; // best streak achieved
  };
  qualityTrends: Array<{
    date: string;
    qualityScore: number;
    accuracyRate: number;
    averageResponseTime: number; // milliseconds
  }>;
  performanceInsights: {
    bestTimeSlot: string; // "Morning", "Afternoon", "Evening"
    averageSessionLength: number; // minutes
    consistencyScore: number; // 0-100, how consistent study times are
  };
}

export interface ActivityItem {
  id: string;
  type: 'study_session' | 'deck_created' | 'achievement' | 'milestone';
  title: string;
  description: string;
  timestamp: Date;
  metadata?: {
    deckName?: string;
    cardsStudied?: number;
    accuracy?: number;
    achievementLevel?: string;
    sessionDuration?: number;
  };
}

export interface DueCard {
  id: string;
  deckId: string;
  deckName: string;
  frontContent: string;
  difficulty: 'easy' | 'medium' | 'hard';
  nextReviewDate: Date;
  intervalDays: number;
}

export interface DueDeck {
  id: string;
  name: string;
  cardsDue: number;
  totalCards: number;
  nextReview: Date;
  averageDifficulty: 'easy' | 'medium' | 'hard';
}

export class LearningStatsService {
  constructor(private supabase: SupabaseClient) {}

  async getLearningStats(userId: string): Promise<LearningStats> {
    try {
      // Get current date for calculations
      const today = new Date();
      const weekStart = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7);

      // Get total decks count
      const { count: totalDecks } = await this.supabase
        .from('decks')
        .select('*', { count: 'exact' })
        .eq('account_id', userId);

      // Get cards due today
      const { count: cardsDue } = await this.supabase
        .from('user_progress')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .lte('next_review_date', today.toISOString());

      // Get study streak (simplified - consecutive days with study sessions)
      const { data: recentSessions } = await this.supabase
        .from('study_sessions')
        .select('started_at')
        .eq('user_id', userId)
        .order('started_at', { ascending: false })
        .limit(30);

      const studyStreak = this.calculateStudyStreak(recentSessions || []);

      // Get weekly study time
      const { data: weeklySessionsData } = await this.supabase
        .from('study_sessions')
        .select('total_time_seconds')
        .eq('user_id', userId)
        .gte('started_at', weekStart.toISOString());

      const weeklyStudyTime = Math.floor(
        (weeklySessionsData || []).reduce((total, session) => total + (session.total_time_seconds || 0), 0) / 60
      );

      // Get accuracy rate from recent sessions
      const { data: accuracyData } = await this.supabase
        .from('study_sessions')
        .select('cards_studied, cards_correct')
        .eq('user_id', userId)
        .order('started_at', { ascending: false })
        .limit(10);

      const accuracyRate = this.calculateAccuracyRate(accuracyData || []);

      // Note: Mastery stats removed with spaced repetition system
      // These will be replaced with test performance metrics in future updates
      const cardsMastered = 0;
      const cardsLearning = 0;

      return {
        cardsDue: cardsDue || 0,
        totalDecks: totalDecks || 0,
        studyStreak,
        weeklyStudyTime,
        accuracyRate,
        cardsMastered: cardsMastered || 0,
        cardsLearning: cardsLearning || 0,
      };
    } catch (error) {
      console.error('Error fetching learning stats:', error);
      // Return default stats on error
      return {
        cardsDue: 0,
        totalDecks: 0,
        studyStreak: 0,
        weeklyStudyTime: 0,
        accuracyRate: 0,
        cardsMastered: 0,
        cardsLearning: 0,
      };
    }
  }

  async getRecentActivity(userId: string, limit = 10): Promise<ActivityItem[]> {
    try {
      const { data } = await this.supabase.rpc('get_user_recent_activities', {
        user_id: userId,
        activity_limit: limit,
      });

      if (!data) return [];

      return data.map((activity: any) => ({
        id: activity.activity_id,
        type: activity.activity_type as 'study_session' | 'deck_created' | 'achievement' | 'milestone',
        title: activity.title,
        description: activity.description,
        timestamp: new Date(activity.activity_timestamp),
        metadata: {
          deckName: activity.deck_name,
          cardsStudied: activity.cards_studied,
          accuracy: activity.accuracy,
          sessionDuration: activity.session_duration,
        },
      }));
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      return [];
    }
  }

  async getDueCards(userId: string, limit = 20): Promise<DueCard[]> {
    try {
      const { data } = await this.supabase
        .from('user_progress')
        .select(`
          flashcard_id,
          next_review_date,
          interval_days,
          flashcards(
            id,
            front_content,
            difficulty,
            deck_id,
            decks(name)
          )
        `)
        .eq('user_id', userId)
        .lte('next_review_date', new Date().toISOString())
        .order('next_review_date', { ascending: true })
        .limit(limit);

      if (!data) return [];

      return data
        .filter(item => item.flashcards)
        .map(item => {
          const flashcard = item.flashcards as any;
          return {
            id: flashcard.id,
            deckId: flashcard.deck_id,
            deckName: flashcard.decks?.name || 'Unknown Deck',
            frontContent: flashcard.front_content,
            difficulty: flashcard.difficulty as 'easy' | 'medium' | 'hard',
            nextReviewDate: new Date(item.next_review_date),
            intervalDays: item.interval_days,
          };
        });
    } catch (error) {
      console.error('Error fetching due cards:', error);
      return [];
    }
  }

  async getDueDecks(userId: string): Promise<DueDeck[]> {
    try {
      const { data } = await this.supabase.rpc('get_due_decks_summary', {
        user_id: userId,
      });

      if (!data) return [];

      return data.map((deck: any) => ({
        id: deck.deck_id,
        name: deck.deck_name,
        cardsDue: deck.cards_due,
        totalCards: deck.total_cards,
        nextReview: new Date(deck.next_review),
        averageDifficulty: deck.average_difficulty || 'medium',
      }));
    } catch (error) {
      console.error('Error fetching due decks:', error);
      return [];
    }
  }

  private calculateStudyStreak(sessions: any[]): number {
    if (!sessions.length) return 0;

    const today = new Date();
    const dates = sessions.map(s => {
      const date = new Date(s.started_at);
      return new Date(date.getFullYear(), date.getMonth(), date.getDate());
    });

    let streak = 0;
    let currentDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    for (let i = 0; i < dates.length; i++) {
      const sessionDate = dates[i];
      
      if (sessionDate && sessionDate.getTime() === currentDate.getTime()) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else if (sessionDate && sessionDate.getTime() < currentDate.getTime()) {
        // Gap in streak
        break;
      }
    }

    return streak;
  }

  private calculateAccuracyRate(sessions: any[]): number {
    if (!sessions.length) return 0;

    const totalStudied = sessions.reduce((sum, s) => sum + (s.cards_studied || 0), 0);
    const totalCorrect = sessions.reduce((sum, s) => sum + (s.cards_correct || 0), 0);

    return totalStudied > 0 ? Math.round((totalCorrect / totalStudied) * 100) : 0;
  }

  /**
   * Get enhanced progress statistics including card mastery breakdown and progress trends
   */
  async getEnhancedProgressStats(userId: string): Promise<EnhancedProgressStats> {
    try {
      const today = new Date();
      const weekStart = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthStart = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Get card mastery breakdown
      const [masteredCount, learningCount, newCount, totalCount] = await Promise.all([
        // Mastered cards (high ease factor and multiple repetitions)
        this.supabase
          .from('user_progress')
          .select('*', { count: 'exact' })
          .eq('user_id', userId)
          .gte('ease_factor', 2.8)
          .gte('repetitions', 3),
        
        // Learning cards (started but not mastered)
        this.supabase
          .from('user_progress')
          .select('*', { count: 'exact' })
          .eq('user_id', userId)
          .lt('ease_factor', 2.8)
          .gt('repetitions', 0),
        
        // New cards (never studied)
        this.supabase
          .from('flashcards')
          .select(`
            *,
            user_progress!left(id)
          `, { count: 'exact' })
          .eq('decks.account_id', userId)
          .is('user_progress.id', null),
        
        // Total cards for user
        this.supabase
          .from('flashcards')
          .select('*, decks!inner(*)', { count: 'exact' })
          .eq('decks.account_id', userId)
      ]);

      const mastered = masteredCount.count || 0;
      const learning = learningCount.count || 0;
      const newCards = newCount.count || 0;
      const total = totalCount.count || 0;

      // Get weekly progress
      const { data: weeklySessionsData } = await this.supabase
        .from('study_sessions')
        .select('cards_studied, cards_correct, total_time_seconds, started_at')
        .eq('user_id', userId)
        .gte('started_at', weekStart.toISOString());

      const weeklyProgress = this.calculateProgressPeriod(weeklySessionsData || []);

      // Get monthly progress
      const { data: monthlySessionsData } = await this.supabase
        .from('study_sessions')
        .select('cards_studied, cards_correct, total_time_seconds, started_at')
        .eq('user_id', userId)
        .gte('started_at', monthStart.toISOString());

      const monthlyProgress = this.calculateProgressPeriod(monthlySessionsData || []);

      // Get deck completion rates
      const { data: deckProgressData } = await this.supabase
        .from('decks')
        .select(`
          id,
          name,
          flashcards(count),
          flashcards!flashcards_deck_id_fkey!inner(
            user_progress!inner(
              ease_factor,
              repetitions
            )
          )
        `)
        .eq('account_id', userId);

      const deckCompletionRates = (deckProgressData || []).map((deck: any) => {
        const totalCards = deck.flashcards?.[0]?.count || 0;
        const masteredCards = deck.flashcards?.filter((card: any) => 
          card.user_progress?.ease_factor >= 2.8 && card.user_progress?.repetitions >= 3
        ).length || 0;
        
        return {
          deckId: deck.id,
          deckName: deck.name,
          totalCards,
          masteredCards,
          completionRate: totalCards > 0 ? Math.round((masteredCards / totalCards) * 100) : 0,
        };
      });

      return {
        cardMastery: {
          mastered,
          learning,
          new: newCards,
          total,
          masteryRate: total > 0 ? Math.round((mastered / total) * 100) : 0,
        },
        weeklyProgress,
        monthlyProgress,
        deckCompletionRates,
      };
    } catch (error) {
      console.error('Error fetching enhanced progress stats:', error);
      return {
        cardMastery: { mastered: 0, learning: 0, new: 0, total: 0, masteryRate: 0 },
        weeklyProgress: { cardsLearned: 0, sessionsCompleted: 0, timeSpent: 0, averageAccuracy: 0 },
        monthlyProgress: { cardsLearned: 0, sessionsCompleted: 0, timeSpent: 0, averageAccuracy: 0 },
        deckCompletionRates: [],
      };
    }
  }

  /**
   * Get learning velocity statistics
   */
  async getLearningVelocity(userId: string): Promise<LearningVelocityStats> {
    try {
      const today = new Date();
      const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sixtyDaysAgo = new Date(today.getTime() - 60 * 24 * 60 * 60 * 1000);

      // Get learning progress over the last 30 days
      const { data: recentProgressData } = await this.supabase
        .from('user_progress')
        .select('created_at, flashcard_id, ease_factor, repetitions')
        .eq('user_id', userId)
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: true });

      // Get historical data for comparison
      const { data: historicalProgressData } = await this.supabase
        .from('user_progress')
        .select('created_at, flashcard_id, ease_factor, repetitions')
        .eq('user_id', userId)
        .gte('created_at', sixtyDaysAgo.toISOString())
        .lt('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: true });

      const recentProgress = recentProgressData || [];
      const historicalProgress = historicalProgressData || [];

      // Calculate daily averages
      const recentDays = Math.ceil((today.getTime() - thirtyDaysAgo.getTime()) / (24 * 60 * 60 * 1000));
      const dailyAverage = recentProgress.length / recentDays;

      // Calculate weekly trend (recent vs previous period)
      const recentWeeklyAverage = recentProgress.length / 4.3; // ~30 days / 7
      const historicalWeeklyAverage = historicalProgress.length / 4.3;
      const weeklyTrend = historicalWeeklyAverage > 0 
        ? ((recentWeeklyAverage - historicalWeeklyAverage) / historicalWeeklyAverage) * 100
        : 0;

      // Calculate time to mastery (average days from first review to mastery)
      const masteredCards = recentProgress.filter(p => p.ease_factor >= 2.8 && p.repetitions >= 3);
      const timeToMastery = masteredCards.length > 0 
        ? masteredCards.reduce((sum, card) => {
            const created = new Date(card.created_at);
            const daysSinceCreated = (today.getTime() - created.getTime()) / (24 * 60 * 60 * 1000);
            return sum + daysSinceCreated;
          }, 0) / masteredCards.length
        : 0;

      // Calculate learning acceleration (improvement rate)
      const firstHalfProgress = recentProgress.slice(0, Math.floor(recentProgress.length / 2));
      const secondHalfProgress = recentProgress.slice(Math.floor(recentProgress.length / 2));
      const learningAcceleration = firstHalfProgress.length > 0 
        ? ((secondHalfProgress.length - firstHalfProgress.length) / firstHalfProgress.length) * 100
        : 0;

      // Create velocity trend data (last 30 days, grouped by day)
      const velocityTrend = this.createVelocityTrend(recentProgress, thirtyDaysAgo, today);

      return {
        dailyAverage: Math.round(dailyAverage * 10) / 10,
        weeklyTrend: Math.round(weeklyTrend * 10) / 10,
        timeToMastery: Math.round(timeToMastery * 10) / 10,
        learningAcceleration: Math.round(learningAcceleration * 10) / 10,
        velocityTrend,
      };
    } catch (error) {
      console.error('Error fetching learning velocity:', error);
      return {
        dailyAverage: 0,
        weeklyTrend: 0,
        timeToMastery: 0,
        learningAcceleration: 0,
        velocityTrend: [],
      };
    }
  }

  private calculateProgressPeriod(sessions: any[]): {
    cardsLearned: number;
    sessionsCompleted: number;
    timeSpent: number;
    averageAccuracy: number;
  } {
    if (!sessions.length) {
      return { cardsLearned: 0, sessionsCompleted: 0, timeSpent: 0, averageAccuracy: 0 };
    }

    const cardsLearned = sessions.reduce((sum, s) => sum + (s.cards_studied || 0), 0);
    const timeSpent = Math.floor(sessions.reduce((sum, s) => sum + (s.total_time_seconds || 0), 0) / 60);
    const totalCorrect = sessions.reduce((sum, s) => sum + (s.cards_correct || 0), 0);
    const averageAccuracy = cardsLearned > 0 ? Math.round((totalCorrect / cardsLearned) * 100) : 0;

    return {
      cardsLearned,
      sessionsCompleted: sessions.length,
      timeSpent,
      averageAccuracy,
    };
  }

  private createVelocityTrend(progressData: any[], startDate: Date, endDate: Date): Array<{
    date: string;
    cardsLearned: number;
    cumulativeTotal: number;
  }> {
    const trend: Array<{ date: string; cardsLearned: number; cumulativeTotal: number }> = [];
    const daysByDate: Record<string, number> = {};

    // Group progress by date
    progressData.forEach(progress => {
      if (progress.created_at) {
        const date = new Date(progress.created_at).toISOString().split('T')[0];
        daysByDate[date] = (daysByDate[date] || 0) + 1;
      }
    });

    // Create trend array for each day
    let cumulativeTotal = 0;
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const cardsLearned = daysByDate[dateStr!] || 0;
      cumulativeTotal += cardsLearned;
      
      trend.push({
        date: dateStr!,
        cardsLearned,
        cumulativeTotal,
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return trend;
  }

  /**
   * Get study session quality statistics and performance insights
   */
  async getStudySessionQuality(userId: string): Promise<StudySessionQualityStats> {
    try {
      const today = new Date();
      const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Get recent study sessions with detailed data
      const { data: sessionsData } = await this.supabase
        .from('study_sessions')
        .select('started_at, ended_at, cards_studied, cards_correct, total_time_seconds')
        .eq('user_id', userId)
        .gte('started_at', thirtyDaysAgo.toISOString())
        .order('started_at', { ascending: true });

      const sessions = sessionsData || [];

      if (sessions.length === 0) {
        return this.getEmptySessionQualityStats();
      }

      // Calculate session quality scores
      const sessionQualities = sessions.map(session => {
        const accuracyRate = session.cards_studied > 0 ? (session.cards_correct / session.cards_studied) : 0;
        const sessionLength = session.total_time_seconds || 0;
        const averageTimePerCard = session.cards_studied > 0 ? sessionLength / session.cards_studied : 0;
        
        // Quality score based on accuracy, efficiency, and engagement
        let qualityScore = 0;
        
        // Accuracy component (0-40 points)
        qualityScore += accuracyRate * 40;
        
        // Efficiency component (0-30 points) - optimal time per card is 15-45 seconds
        const optimalTimePerCard = 30; // seconds
        const timeEfficiency = Math.max(0, 1 - Math.abs(averageTimePerCard - optimalTimePerCard) / optimalTimePerCard);
        qualityScore += timeEfficiency * 30;
        
        // Engagement component (0-30 points) - based on cards studied
        const engagementScore = Math.min(1, session.cards_studied / 20); // optimal is 20+ cards
        qualityScore += engagementScore * 30;

        return {
          ...session,
          qualityScore: Math.round(qualityScore),
          accuracyRate,
          averageResponseTime: averageTimePerCard * 1000, // convert to ms
        };
      });

      // Calculate average session quality
      const averageSessionQuality = sessionQualities.reduce((sum, s) => sum + s.qualityScore, 0) / sessionQualities.length;

      // Find optimal study time (hour with highest average quality)
      const hourlyPerformance: Record<number, { totalQuality: number; count: number }> = {};
      const dailyPerformance: Record<number, { totalQuality: number; count: number }> = {};

      sessionQualities.forEach(session => {
        const sessionDate = new Date(session.started_at);
        const hour = sessionDate.getHours();
        const dayOfWeek = sessionDate.getDay();

        // Track hourly performance
        if (!hourlyPerformance[hour]) {
          hourlyPerformance[hour] = { totalQuality: 0, count: 0 };
        }
        hourlyPerformance[hour].totalQuality += session.qualityScore;
        hourlyPerformance[hour].count += 1;

        // Track daily performance
        if (!dailyPerformance[dayOfWeek]) {
          dailyPerformance[dayOfWeek] = { totalQuality: 0, count: 0 };
        }
        dailyPerformance[dayOfWeek].totalQuality += session.qualityScore;
        dailyPerformance[dayOfWeek].count += 1;
      });

      // Find optimal hour and day
      let bestHour = 0;
      let bestHourQuality = 0;
      let bestDay = 0;
      let bestDayQuality = 0;

      Object.entries(hourlyPerformance).forEach(([hour, data]) => {
        const avgQuality = data.totalQuality / data.count;
        if (avgQuality > bestHourQuality) {
          bestHourQuality = avgQuality;
          bestHour = parseInt(hour);
        }
      });

      Object.entries(dailyPerformance).forEach(([day, data]) => {
        const avgQuality = data.totalQuality / data.count;
        if (avgQuality > bestDayQuality) {
          bestDayQuality = avgQuality;
          bestDay = parseInt(day);
        }
      });

      // Calculate session streaks (consecutive days with quality > 70)
      const dailySessions = this.groupSessionsByDay(sessionQualities);
      const qualityThreshold = 70;
      let currentStreak = 0;
      let longestStreak = 0;
      let tempStreak = 0;

      const sortedDays = Object.keys(dailySessions).sort();
      const today_str = today.toISOString().split('T')[0];

      for (let i = sortedDays.length - 1; i >= 0; i--) {
        const day = sortedDays[i];
        const dayQuality = dailySessions[day].reduce((sum, s) => sum + s.qualityScore, 0) / dailySessions[day].length;
        
        if (dayQuality >= qualityThreshold) {
          tempStreak++;
          if (day === today_str || (i === sortedDays.length - 1)) {
            currentStreak = tempStreak;
          }
        } else {
          if (tempStreak > longestStreak) {
            longestStreak = tempStreak;
          }
          tempStreak = 0;
        }
      }

      if (tempStreak > longestStreak) {
        longestStreak = tempStreak;
      }

      // Create quality trends (last 30 days)
      const qualityTrends = this.createQualityTrends(sessionQualities, thirtyDaysAgo, today);

      // Calculate performance insights
      const bestTimeSlot = this.getTimeSlotName(bestHour);
      const averageSessionLength = sessions.reduce((sum, s) => sum + (s.total_time_seconds || 0), 0) / sessions.length / 60; // minutes
      const consistencyScore = this.calculateConsistencyScore(sessions);

      return {
        averageSessionQuality: Math.round(averageSessionQuality),
        optimalStudyTime: {
          hour: bestHour,
          dayOfWeek: bestDay,
        },
        sessionStreaks: {
          current: currentStreak,
          longest: longestStreak,
        },
        qualityTrends,
        performanceInsights: {
          bestTimeSlot,
          averageSessionLength: Math.round(averageSessionLength * 10) / 10,
          consistencyScore: Math.round(consistencyScore),
        },
      };
    } catch (error) {
      console.error('Error fetching study session quality:', error);
      return this.getEmptySessionQualityStats();
    }
  }

  private getEmptySessionQualityStats(): StudySessionQualityStats {
    return {
      averageSessionQuality: 0,
      optimalStudyTime: { hour: 9, dayOfWeek: 1 }, // Default to 9 AM Monday
      sessionStreaks: { current: 0, longest: 0 },
      qualityTrends: [],
      performanceInsights: {
        bestTimeSlot: 'Morning',
        averageSessionLength: 0,
        consistencyScore: 0,
      },
    };
  }

  private groupSessionsByDay(sessions: any[]): Record<string, any[]> {
    const grouped: Record<string, any[]> = {};
    
    sessions.forEach(session => {
      const date = new Date(session.started_at).toISOString().split('T')[0];
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(session);
    });

    return grouped;
  }

  private createQualityTrends(sessions: any[], startDate: Date, endDate: Date): Array<{
    date: string;
    qualityScore: number;
    accuracyRate: number;
    averageResponseTime: number;
  }> {
    const dailySessions = this.groupSessionsByDay(sessions);
    const trends: Array<{
      date: string;
      qualityScore: number;
      accuracyRate: number;
      averageResponseTime: number;
    }> = [];

    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const daysSessions = dailySessions[dateStr] || [];
      
      if (daysSessions.length > 0) {
        const avgQuality = daysSessions.reduce((sum, s) => sum + s.qualityScore, 0) / daysSessions.length;
        const avgAccuracy = daysSessions.reduce((sum, s) => sum + s.accuracyRate, 0) / daysSessions.length;
        const avgResponseTime = daysSessions.reduce((sum, s) => sum + s.averageResponseTime, 0) / daysSessions.length;

        trends.push({
          date: dateStr,
          qualityScore: Math.round(avgQuality),
          accuracyRate: Math.round(avgAccuracy * 100),
          averageResponseTime: Math.round(avgResponseTime),
        });
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return trends;
  }

  private getTimeSlotName(hour: number): string {
    if (hour >= 5 && hour < 12) return 'Morning';
    if (hour >= 12 && hour < 17) return 'Afternoon';
    if (hour >= 17 && hour < 22) return 'Evening';
    return 'Night';
  }

  private calculateConsistencyScore(sessions: any[]): number {
    if (sessions.length < 2) return 0;

    // Calculate consistency based on study time variance
    const studyHours = sessions.map(s => new Date(s.started_at).getHours());
    const avgHour = studyHours.reduce((sum, h) => sum + h, 0) / studyHours.length;
    const variance = studyHours.reduce((sum, h) => sum + Math.pow(h - avgHour, 2), 0) / studyHours.length;
    const standardDeviation = Math.sqrt(variance);

    // Convert to consistency score (lower deviation = higher consistency)
    // Perfect consistency (0 deviation) = 100, high deviation (>6 hours) = 0
    const consistencyScore = Math.max(0, 100 - (standardDeviation / 6) * 100);
    
    return consistencyScore;
  }
}