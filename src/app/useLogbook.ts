import { useEffect, useRef, useState } from 'react';
import type { InternshipData } from '../domain/model';
import { ValidationError } from '../domain/model';
import {
  openLogDatabase,
  StorageError,
} from '../infrastructure/storage/database';
import type {
  LogDatabase,
  StoredSnapshot,
} from '../infrastructure/storage/database';

export interface Issue {
  readonly code: string;
  readonly message: string;
  readonly path?: string;
}
export type SaveResult =
  { readonly ok: true } | { readonly ok: false; readonly issue: Issue };
export type OpenDatabase = () => Promise<LogDatabase>;

export function describeIssue(error: unknown): Issue {
  if (error instanceof ValidationError)
    return { code: 'validation', message: error.message, path: error.path };
  if (error instanceof StorageError)
    return { code: error.code, message: error.message };
  return {
    code: 'unknown',
    message:
      'Unable to access local records. Your draft has not been cleared. Retry without clearing site data.',
  };
}

export function useLogbook(openDatabase: OpenDatabase = openLogDatabase) {
  const [snapshot, setSnapshot] = useState<StoredSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [problem, setProblem] = useState<Issue | null>(null);
  const [needsRefresh, setNeedsRefresh] = useState(false);
  const database = useRef<LogDatabase | null>(null);
  const current = useRef<StoredSnapshot | null>(null);
  const busy = useRef(false);
  const refreshRequired = useRef(false);
  const generation = useRef(0);

  useEffect(() => {
    const token = ++generation.current;
    let owned: LogDatabase | null = null;
    void (async () => {
      try {
        owned = await openDatabase();
        if (token !== generation.current) {
          owned.close();
          return;
        }
        const loaded = await owned.load();
        if (token !== generation.current) return;
        database.current = owned;
        current.current = loaded;
        setSnapshot(loaded);
      } catch (error) {
        owned?.close();
        if (token === generation.current) setProblem(describeIssue(error));
      } finally {
        if (token === generation.current) setLoading(false);
      }
    })();
    return () => {
      generation.current++;
      database.current?.close();
      owned?.close();
      database.current = null;
    };
  }, [openDatabase]);

  async function reload(): Promise<boolean> {
    if (busy.current) return false;
    busy.current = true;
    setLoading(true);
    const token = generation.current;
    let opened: LogDatabase | null = null;
    try {
      database.current?.close();
      database.current = null;
      opened = await openDatabase();
      const loaded = await opened.load();
      if (token !== generation.current) {
        opened.close();
        return false;
      }
      database.current = opened;
      current.current = loaded;
      setSnapshot(loaded);
      setProblem(null);
      refreshRequired.current = false;
      setNeedsRefresh(false);
      return true;
    } catch (error) {
      opened?.close();
      refreshRequired.current = true;
      if (token === generation.current) {
        setProblem(describeIssue(error));
        setNeedsRefresh(true);
      }
      return false;
    } finally {
      busy.current = false;
      if (token === generation.current) setLoading(false);
    }
  }

  async function save(
    update: (data: InternshipData) => InternshipData,
  ): Promise<SaveResult> {
    const db = database.current;
    const previous = current.current;
    if (busy.current || loading || refreshRequired.current || !db || !previous)
      return {
        ok: false,
        issue: {
          code: 'unavailable',
          message:
            'Load the latest records before saving. Your draft is still here.',
        },
      };
    busy.current = true;
    setSaving(true);
    setProblem(null);
    const token = generation.current;
    try {
      const saved = await db.save(update(previous.data), previous.revision);
      if (token === generation.current) {
        current.current = saved;
        setSnapshot(saved);
      }
      return { ok: true };
    } catch (error) {
      const issue = describeIssue(error);
      if (issue.code === 'conflict' || issue.code === 'closed')
        refreshRequired.current = true;
      if (token === generation.current) {
        if (issue.code !== 'validation') setProblem(issue);
        setNeedsRefresh(refreshRequired.current);
      }
      return { ok: false, issue };
    } finally {
      busy.current = false;
      if (token === generation.current) setSaving(false);
    }
  }

  return { snapshot, loading, saving, problem, needsRefresh, save, reload };
}

export type LogbookSession = ReturnType<typeof useLogbook>;
