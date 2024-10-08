import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class GameStateService {
  private score: number = 0;
  private categoryId: string = '';
  private gameType: string = '';
  private wordsUsed: {
    origin: string;
    target: string;
    correct: boolean;
    userAnswer: string;
  }[] = [];

  setGameState(
    score: number,
    words: {
      origin: string;
      target: string;
      correct: boolean;
      userAnswer: string;
    }[],
    categoryId: string,
    gameType: string
  ): void {
    this.score = score;
    this.wordsUsed = words;
    this.categoryId = categoryId;
    this.gameType = gameType;
  }

  getScore(): number {
    return this.score;
  }

  getCategoryId(): string {
    return this.categoryId;
  }

  getGameType(): string {
    return this.gameType;
  }

  getWordsUsed(): {
    origin: string;
    target: string;
    correct: boolean;
    userAnswer: string;
  }[] {
    return this.wordsUsed;
  }

  clearState(): void {
    this.score = 0;
    this.wordsUsed = [];
    this.categoryId = '';
    this.gameType = '';
  }
}
