import { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';

export const useWeeklyQuestionnaire = (user) => {
  const [needsQuestionnaire, setNeedsQuestionnaire] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkQuestionnaireStatus = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const now = new Date();
      const dayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday
      const currentWeekNumber = getCurrentWeekNumber();

      // For testing: show questionnaire every day
      // TODO: Change back to Sunday only (dayOfWeek === 0) after testing
      console.log('Current day of week:', dayOfWeek, 'Sunday = 0, Saturday = 6');
      
      // Show questionnaire on Sunday (day 0) - last day of week
      // if (dayOfWeek !== 0) {
      //   setNeedsQuestionnaire(false);
      //   setLoading(false);
      //   return;
      // }

      // Check if questionnaire was completed this week
      const { data, error } = await supabase
        .from('progress_tracking')
        .select('*')
        .eq('user_id', user.id)
        .eq('metric_type', 'iciq_sf')
        .eq('week_number', currentWeekNumber)
        .order('recorded_at', { ascending: false })
        .limit(1);

      console.log('Questionnaire check:', {
        currentWeekNumber,
        dayOfWeek,
        data,
        error,
        dataLength: data?.length
      });

      if (error) {
        console.error('Error checking questionnaire status:', error);
        setNeedsQuestionnaire(false);
      } else {
        // If no record found for this week, questionnaire is needed
        const needsIt = !data || data.length === 0;
        console.log('Needs questionnaire:', needsIt);
        setNeedsQuestionnaire(needsIt);
      }
    } catch (error) {
      console.error('Error in checkQuestionnaireStatus:', error);
      setNeedsQuestionnaire(false);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentWeekNumber = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const diff = now - start;
    const oneWeek = 1000 * 60 * 60 * 24 * 7;
    return Math.ceil(diff / oneWeek);
  };

  const markQuestionnaireCompleted = async () => {
    console.log('markQuestionnaireCompleted called');
    setNeedsQuestionnaire(false);
    setLoading(true);
    // Re-check immediately to ensure consistency
    await checkQuestionnaireStatus();
    console.log('markQuestionnaireCompleted finished, needsQuestionnaire should be false');
  };

  useEffect(() => {
    checkQuestionnaireStatus();
  }, [user]);

  return {
    needsQuestionnaire,
    loading,
    checkQuestionnaireStatus,
    markQuestionnaireCompleted,
  };
};
