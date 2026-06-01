import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { getAvailableMonths, useReportData } from '@/hooks/useReportData';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/lib/logger';
import { notesApi, usersApi } from '@/lib/api';
import { Note, User } from '@/types';
import { buildTeaRecapSlides, buildTeaRecapSummary, filterNotesByMonth } from '@/utils/recap';

interface NotesPageResponse {
  data?: Note[];
  notes?: Note[];
}

function toNotesArray(data: Note[] | NotesPageResponse): Note[] {
  return Array.isArray(data) ? data : data.data ?? data.notes ?? [];
}

export function useUserRecapData(userId: number | null) {
  const { user: currentUser, isLoading: authLoading } = useAuth();
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPrivateProfile, setIsPrivateProfile] = useState(false);

  const isOwnProfile = !!currentUser && !!userId && currentUser.id === userId;

  useEffect(() => {
    if (authLoading) return;
    if (!userId) {
      setIsLoading(false);
      return;
    }

    const fetchRecapData = async () => {
      try {
        setIsLoading(true);
        setIsPrivateProfile(false);
        const publicOnly = isOwnProfile ? undefined : true;
        const [userData, notesData] = await Promise.all([
          usersApi.getById(userId),
          notesApi.getAll(userId, publicOnly, undefined, undefined, undefined, 'latest', 1, 500),
        ]);
        setProfileUser(userData);
        setNotes(toNotesArray(notesData));
      } catch (error) {
        logger.error('Failed to fetch recap data:', error);
        const statusCode = (error as { statusCode?: number })?.statusCode;
        if (statusCode === 403) {
          setIsPrivateProfile(true);
        } else if (statusCode === 404) {
          toast.error('사용자를 찾을 수 없습니다.');
        } else {
          toast.error('리캡 데이터를 불러오는데 실패했습니다.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecapData();
  }, [authLoading, isOwnProfile, userId]);

  const availableMonths = useMemo(() => getAvailableMonths(notes), [notes]);
  const report = useReportData(notes, selectedMonth);
  const filteredNotes = useMemo(() => filterNotesByMonth(notes, selectedMonth), [notes, selectedMonth]);
  const profileName = profileUser?.name ?? currentUser?.name ?? '차 애호가';
  const summary = useMemo(
    () => buildTeaRecapSummary(report, filteredNotes, selectedMonth, profileName),
    [report, filteredNotes, selectedMonth, profileName],
  );
  const slides = useMemo(() => buildTeaRecapSlides(summary), [summary]);

  return {
    authLoading,
    availableMonths,
    currentUser,
    filteredNotes,
    isLoading,
    isOwnProfile,
    isPrivateProfile,
    notes,
    profileName,
    profileUser,
    report,
    selectedMonth,
    setSelectedMonth,
    slides,
    summary,
  };
}
