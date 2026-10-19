import type { InternshipData } from '../../domain/model';
import { ValidationError } from '../../domain/model';
import { decodeBackup, encodeBackup, MAX_BACKUP_BYTES } from './backup';

export async function readBackupFile(file: File): Promise<InternshipData> {
  if (file.size > MAX_BACKUP_BYTES)
    throw new ValidationError(
      'backup',
      'Backup exceeds the 5 MiB UTF-8 limit.',
    );
  let bytes: ArrayBuffer;
  try {
    bytes = await file.arrayBuffer();
  } catch {
    throw new ValidationError(
      'backup',
      'Unable to read this backup file. Choose it again.',
    );
  }
  let json: string;
  try {
    json = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    throw new ValidationError(
      'backup',
      'Backup must contain valid UTF-8 text.',
    );
  }
  return decodeBackup(json);
}

export function downloadBackup(data: InternshipData): void {
  const json = encodeBackup(data);
  const url = URL.createObjectURL(
    new Blob([json], { type: 'application/json;charset=utf-8' }),
  );
  const link = document.createElement('a');
  link.href = url;
  link.download = 'internlog-pk-backup.json';
  try {
    document.body.append(link);
    link.click();
  } finally {
    link.remove();
    // Allow the browser to consume the download before releasing its local URL.
    window.setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 60_000);
  }
}
