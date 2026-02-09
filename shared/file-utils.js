export function readFileAsText(file, encoding = 'UTF-8', onProgress = null) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    if (typeof onProgress === 'function') {
      reader.onprogress = (event) => onProgress(event);
    }
    reader.onload = (event) => resolve(event.target.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file, encoding);
  });
}
