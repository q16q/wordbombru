import { readFileSync } from 'fs';
import { join } from 'path';

class DictionaryService {
    private words: Set<string>;

    constructor() {
        try {
            const dictionaryPath = join(__dirname, '../../russian.txt');
            console.log('Loading dictionary from:', dictionaryPath);
            const content = readFileSync(dictionaryPath, 'utf-8');
            const words = content.toLowerCase().split('\n').map(word => word.trim()).filter(word => word.length > 0);
            this.words = new Set(words);
            console.log(`Dictionary loaded successfully: ${this.words.size} words`);
            console.log('Sample words:', Array.from(this.words).slice(0, 5));
        } catch (error) {
            console.error('Failed to load dictionary:', error);
            this.words = new Set();
        }
    }

    public isValidWord(word: string): boolean {
        const normalizedWord = word.toLowerCase().trim();
        const isValid = this.words.has(normalizedWord);
        console.log(`Checking word: "${normalizedWord}" - ${isValid ? 'valid' : 'invalid'}`);
        return isValid;
    }
}

export const dictionaryService = new DictionaryService();
