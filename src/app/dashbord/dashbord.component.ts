import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameService } from '../services/game.service';
import { CategoriesService } from '../services/categories.service';
import { GameResult } from '../../shared/model/game-result';
import { Category } from '../../shared/model/category';
import { MatCardModule } from '@angular/material/card';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-dashbord',
  standalone: true,
  imports: [
    CommonModule,
    MatGridListModule,
    MatCardModule,
    MatIconModule,
    MatProgressBarModule,
  ],
  templateUrl: './dashbord.component.html',
  styleUrls: ['./dashbord.component.css'],
})
export class DashbordComponent implements OnInit, OnDestroy {
  // Metrics
  totalPoints: number = 0;
  totalGames: number = 0;
  highestAvgScoreGame: string = '';
  lowestAvgScoreGame: string = '';
  perfectScorePercentage: number = 0;
  mostPlayedCategory: string = '';
  learnedCategoriesCount: number = 0;
  unlearnedCategoriesCount: number = 0;
  learnedCategoriesPercentage: number = 0;
  gamesThisMonth: number = 0;
  gamesToCompleteChallenge: number = 0;
  monthlyChallengeCompleted: boolean = false;
  consecutiveDays: number = 0;
  monthlyChallengeGoal: number = 20;
  challengeSteps: number[] = [];
  totalCategories: number = 0;
  badges: string[] = [];
  currentMonthYear: string = '';
  allCategories: Category[] = [];
  categoryMap: { [key: string]: string } = {};

  gameMap: { [key: string]: string } = {
    'mixed-words': 'Mixed Words',
    'sort-words': 'Sort Words',
    'translation-attack-time': 'Translation Attack Time',
  };

  private gameResultsSubscription: Subscription | undefined;

  constructor(
    private gameService: GameService,
    private categoriesService: CategoriesService
  ) {}

  async ngOnInit(): Promise<void> {
    try {
      this.allCategories = await this.categoriesService.list();
      console.log('Categories:', this.allCategories);

      this.totalCategories = this.allCategories.length;

      this.categoryMap = {};
      this.allCategories.forEach((category) => {
        this.categoryMap[category.id] = category.name;
      });

      const now = new Date();
      this.currentMonthYear = `${now.getMonth() + 1}-${now.getFullYear()}`;
      console.log('Current Month-Year:', this.currentMonthYear);

      this.loadBadges();
      console.log('Loaded Badges:', this.badges);

      this.gameResultsSubscription = this.gameService.list().subscribe({
        next: (gameResults: GameResult[]) => {
          console.log('Received game results:', gameResults);

          this.calculateGameMetrics(gameResults);
          this.calculateMonthlyChallenge(gameResults);
          this.calculateConsecutiveDays(gameResults);
        },
        error: (error) => {
          console.error('Error receiving game results:', error);
        },
      });
    } catch (error) {
      console.error('Error initializing dashboard:', error);
    }
  }

  ngOnDestroy(): void {
    if (this.gameResultsSubscription) {
      this.gameResultsSubscription.unsubscribe();
    }
  }

  /**
   * מאגד מערך של אובייקטים לפי מפתח מסוים.
   * @param array המערך לאגוד.
   * @param key המפתח לאגוד לפי.
   * @returns אובייקט שבו כל מפתח הוא קבוצה והערך הוא מערך של אובייקטים.
   */
  groupBy<T>(array: T[], key: keyof T): { [key: string]: T[] } {
    return array.reduce((result: { [key: string]: T[] }, currentValue: T) => {
      const groupKey = currentValue[key] as unknown as string;
      (result[groupKey] = result[groupKey] || []).push(currentValue);
      return result;
    }, {});
  }

  /**
   * מחשב את המטריקות השונות על בסיס תוצאות המשחקים.
   * @param gameResults המערך של GameResult לעיבוד.
   */
  calculateGameMetrics(gameResults: GameResult[]): void {
    this.totalPoints = gameResults.reduce((sum, game) => sum + game.points, 0);
    this.totalGames = gameResults.length;
    console.log('Total Points:', this.totalPoints); // Debugging
    console.log('Total Games:', this.totalGames); // Debugging

    let highestAvgScore = -Infinity;
    let lowestAvgScore = Infinity;
    let highestAvgScoreGameId = '';
    let lowestAvgScoreGameId = '';
    const gamesGroupedByType = this.groupBy(gameResults, 'gameId');
    const categoryCountMap: { [categoryId: string]: number } = {};
    let perfectGamesCount = 0;
    let mostPlayedGameId = '';
    let mostPlayedGameCount = 0;

    for (const [gameId, games] of Object.entries(gamesGroupedByType)) {
      const avgScore =
        games.reduce((sum, game) => sum + game.points, 0) / games.length;
      console.log(`Game ID: ${gameId}, Average Score: ${avgScore}`);

      if (avgScore > highestAvgScore) {
        highestAvgScore = avgScore;
        highestAvgScoreGameId = gameId;
      }

      if (avgScore < lowestAvgScore) {
        lowestAvgScore = avgScore;
        lowestAvgScoreGameId = gameId;
      }

      games.forEach((game) => {
        if (game.points === 100) {
          perfectGamesCount++;
        }

        if (categoryCountMap[game.categoryId]) {
          categoryCountMap[game.categoryId]++;
        } else {
          categoryCountMap[game.categoryId] = 1;
        }
      });

      if (games.length > mostPlayedGameCount) {
        mostPlayedGameCount = games.length;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        mostPlayedGameId = gameId;
      }
    }

    this.highestAvgScoreGame =
      this.gameMap[highestAvgScoreGameId] || highestAvgScoreGameId || 'N/A';
    this.lowestAvgScoreGame =
      this.gameMap[lowestAvgScoreGameId] || lowestAvgScoreGameId || 'N/A';
    console.log('Highest Avg Score Game:', this.highestAvgScoreGame);
    console.log('Lowest Avg Score Game:', this.lowestAvgScoreGame);

    this.perfectScorePercentage =
      this.totalGames > 0
        ? Math.round((perfectGamesCount / this.totalGames) * 100)
        : 0;
    console.log('Perfect Score Percentage:', this.perfectScorePercentage);

    const mostPlayedCategoryId = Object.keys(categoryCountMap).reduce(
      (a, b) => (categoryCountMap[a] > categoryCountMap[b] ? a : b),
      ''
    );
    this.mostPlayedCategory = this.categoryMap[mostPlayedCategoryId] || 'N/A';
    console.log('Most Played Category:', this.mostPlayedCategory);

    this.learnedCategoriesCount = Object.keys(categoryCountMap).length;
    this.unlearnedCategoriesCount =
      this.totalCategories - this.learnedCategoriesCount;
    console.log('Learned Categories Count:', this.learnedCategoriesCount);
    console.log('Unlearned Categories Count:', this.unlearnedCategoriesCount);

    this.learnedCategoriesPercentage =
      this.totalCategories > 0
        ? Math.round((this.learnedCategoriesCount / this.totalCategories) * 100)
        : 0;
    console.log(
      'Learned Categories Percentage:',
      this.learnedCategoriesPercentage
    );
  }

  /**
   * מחשב את מטריקות אתגר החודש על בסיס תוצאות המשחקים.
   * @param gameResults המערך של GameResult לעיבוד.
   */
  calculateMonthlyChallenge(gameResults: GameResult[]): void {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const gamesThisMonth = gameResults.filter((gameResult) => {
      const gameDate =
        gameResult.date instanceof Date
          ? gameResult.date
          : new Date(gameResult.date);
      return gameDate >= firstDayOfMonth;
    });

    this.gamesThisMonth = gamesThisMonth.length;
    console.log('Games this month:', this.gamesThisMonth);

    if (this.gamesThisMonth >= this.monthlyChallengeGoal) {
      this.monthlyChallengeCompleted = true;

      if (!this.badges.includes(this.currentMonthYear)) {
        this.badges.push(this.currentMonthYear);
        this.saveBadges();
        console.log('Badge added:', this.currentMonthYear);
      }
    } else {
      this.gamesToCompleteChallenge =
        this.monthlyChallengeGoal - this.gamesThisMonth;
      console.log(
        'Games to complete challenge:',
        this.gamesToCompleteChallenge
      );
    }

    this.challengeSteps = Array.from(
      { length: this.monthlyChallengeGoal },
      (_, i) => i + 1
    );
  }

  /**
   * מחשב את מספר הימים הרצופים בהם שיחקו לפחות משחק אחד.
   * @param gameResults המערך של GameResult לעיבוד.
   */
  calculateConsecutiveDays(gameResults: GameResult[]): void {
    const gameDates = gameResults.map((gameResult) => {
      const gameDate =
        gameResult.date instanceof Date
          ? gameResult.date
          : new Date(gameResult.date);
      return gameDate.toDateString();
    });

    const uniqueDates = Array.from(new Set(gameDates));

    const sortedDates = uniqueDates
      .map((dateStr) => new Date(dateStr))
      .sort((a, b) => b.getTime() - a.getTime());

    let consecutiveDays = 0;
    const currentDate = new Date();

    while (true) {
      const startOfDay = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        currentDate.getDate()
      );
      const endOfDay = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        currentDate.getDate() + 1
      );

      const gamesOnDate = sortedDates.filter((gameDate) => {
        return gameDate >= startOfDay && gameDate < endOfDay;
      });

      if (gamesOnDate.length > 0) {
        consecutiveDays++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }

    this.consecutiveDays = consecutiveDays;
    console.log('Consecutive Days:', this.consecutiveDays);
  }

  /**
   * טוען תגמולים מאחסון מקומי.
   */
  loadBadges(): void {
    const badges = localStorage.getItem('badges');
    if (badges) {
      this.badges = JSON.parse(badges);
      console.log('Loaded Badges:', this.badges);
    }
  }

  /**
   * שומר תגמולים לאחסון מקומי.
   */
  saveBadges(): void {
    localStorage.setItem('badges', JSON.stringify(this.badges));
    console.log('Badges saved:', this.badges);
  }
}
