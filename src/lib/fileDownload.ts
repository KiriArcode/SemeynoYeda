/**
 * Утилита для скачивания файлов в браузере
 */

/**
 * Скачивает JSON данные как файл
 * @param data - данные для сохранения (объект или массив)
 * @param filename - имя файла (например, "recipes_errors.json")
 */
export function downloadJsonFile(data: unknown, filename: string): void {
  try {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('[fileDownload] Error downloading file:', error);
    throw error;
  }
}

/**
 * Скачивает текстовый файл
 * @param content - содержимое файла
 * @param filename - имя файла
 * @param mimeType - MIME тип (по умолчанию "text/plain")
 */
export function downloadTextFile(
  content: string,
  filename: string,
  mimeType: string = 'text/plain'
): void {
  try {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('[fileDownload] Error downloading text file:', error);
    throw error;
  }
}
