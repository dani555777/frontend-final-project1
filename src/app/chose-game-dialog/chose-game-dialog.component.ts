import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { CategoriesService } from '../services/categories.service';
import { ChangeDetectionStrategy } from '@angular/core';
import { Category } from '../../shared/model/category';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-chose-game-dialog',
  templateUrl: './chose-game-dialog.component.html',
  styleUrls: ['./chose-game-dialog.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
  ],
})
export class ChoseGameDialogComponent implements OnInit {
  categories: Category[] = [];
  selectedCategory?: Category;

  constructor(
    @Inject(MAT_DIALOG_DATA) public gameProfile: { name: string },
    private dialogRef: MatDialogRef<ChoseGameDialogComponent>,
    private router: Router,
    private categoriesService: CategoriesService
  ) {}

  async ngOnInit(): Promise<void> {
    try {
      this.categories = await this.categoriesService.list();
      if (this.categories.length === 0) {
        console.error('No categories found');
      } else {
        console.log('Categories fetched:', this.categories);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  }

  onCategorySelect(category: Category): void {
    this.selectedCategory = category;
    console.log('Selected category:', this.selectedCategory);
  }

  closeAndNavigate(): void {
    if (!this.selectedCategory || !this.selectedCategory.id) {
      console.error('Invalid or missing category ID:', this.selectedCategory);
      return;
    }

    const gameName = this.gameProfile.name.toLowerCase().replace(/\s+/g, '-');
    let gameRoute = '';

    switch (gameName) {
      case 'mixed-letters':
      case 'mixed-words':
        gameRoute = `/mixed-letters/${this.selectedCategory.id}`;
        break;
      case 'trivia':
        gameRoute = `/trivia/${this.selectedCategory.id}`;
        break;
      case 'sort-words':
      case 'sort-word':
        gameRoute = `/sort-words/${this.selectedCategory.id}`;
        break;
      case 'matching-words':
        gameRoute = `/matching-words/${this.selectedCategory.id}`;
        break;
      case 'translation-attack-time':
        gameRoute = `/translation-attack-time/${this.selectedCategory.id}`;
        break;
      default:
        console.error('Unknown game:', gameName);
        return;
    }

    console.log(
      `Navigating to ${gameRoute} with category ID: ${this.selectedCategory.id}`
    );
    this.router.navigate([gameRoute]);
    this.dialogRef.close();
  }

  closeDialog(): void {
    this.dialogRef.close();
  }
}
