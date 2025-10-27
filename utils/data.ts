import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// В Docker контейнере данные находятся в /app/shared/data
// На хосте это ./shared/data
const DATA_DIR = process.env.NODE_ENV === 'production' 
  ? '/app/shared/data'  // В Docker контейнере
  : path.join(__dirname, '../../../shared/data'); // На хосте при разработке

export const DEFAULT_AVATAR = '/images/default-avatar.png';

console.log('📁 DATA_DIR:', DATA_DIR);

export const readJSON = async <T>(filename: string): Promise<T[]> => {
  try {
    const filePath = path.join(DATA_DIR, filename);
    console.log(`📖 Чтение файла: ${filePath}`);
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data) as T[];
  } catch (error) {
    console.error(`❌ Ошибка чтения ${filename}:`, error);
    return [];
  }
};

export const writeJSON = async <T>(filename: string, data: T[]): Promise<boolean> => {
  try {
    const filePath = path.join(DATA_DIR, filename);
    console.log(`💾 Запись файла: ${filePath}`);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    console.log(`✅ Файл ${filename} успешно сохранен`);
    return true;
  } catch (error) {
    console.error(`❌ Ошибка записи ${filename}:`, error);
    return false;
  }
};