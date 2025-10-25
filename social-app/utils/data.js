import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = '/app/data';
// ИСПРАВИЛ - убрал /shared/public
export const DEFAULT_AVATAR = '/images/default-avatar.png';

export const readJSON = async (filename) => {
  try {
    const data = await fs.readFile(path.join(DATA_DIR, filename), 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${filename}:`, error.message);
    return [];
  }
};

export const writeJSON = async (filename, data) => {
  try {
    const filePath = path.join(DATA_DIR, filename);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    console.log(`✅ Файл ${filename} успешно сохранен`);
    return true;
  } catch (error) {
    console.error(`❌ Ошибка записи ${filename}:`, error.message);
    return false;
  }
};