import { supabase } from '../config/supabase';

// Get the start of the current week (Monday)
const getWeekStart = (date = new Date()) => {
  const d = new Date(date);
  const day = d.getDay();
  // Calculate days to subtract to get to Monday (1)
  // If it's Sunday (0), subtract 6 days; otherwise subtract (day - 1)
  const daysToSubtract = day === 0 ? 6 : day - 1;
  const monday = new Date(d);
  monday.setDate(d.getDate() - daysToSubtract);
  return monday;
};

// Format date to YYYY-MM-DD
const formatDate = (date) => {
  return date.toISOString().split('T')[0];
};

export const exercisePlanService = {
  // Test database connection
  async testConnection() {
    try {
      const { data, error } = await supabase.rpc('test_database_connection');
      console.log('Database test result:', { data, error });
      return { data, error };
    } catch (error) {
      console.error('Database test failed:', error);
      return { data: null, error };
    }
  },

  // Get current week's exercise plan for user
  async getCurrentWeekPlan(userId) {
    try {
      const weekStart = formatDate(getWeekStart());
      
      console.log('Getting plan for user:', userId, 'week start:', weekStart);
      
      // First, let's see what plans exist for this user
      const { data: allPlans, error: allPlansError } = await supabase
        .from('exercise_plans')
        .select('*')
        .eq('user_id', userId);
      
      console.log('All plans for user:', allPlans);
      
      const { data: plan, error: planError } = await supabase
        .from('exercise_plans')
        .select(`
          *,
          exercise_plan_items (*)
        `)
        .eq('user_id', userId)
        .eq('week_start_date', weekStart)
        .single();

      if (planError && planError.code !== 'PGRST116') {
        console.error('Error getting current week plan:', planError);
        throw planError;
      }

      console.log('Current week plan result:', plan);
      return plan;
    } catch (error) {
      console.error('Error getting current week plan:', error);
      throw error;
    }
  },

  // Generate a new exercise plan for the user
  async generatePlan(userId, weekStart = null) {
    try {
      // Calculate week start if not provided
      const calculatedWeekStart = weekStart || formatDate(getWeekStart());
      
      console.log('Generating plan for user:', userId, 'week start:', calculatedWeekStart);
      
      const { data, error } = await supabase.rpc('generate_exercise_plan', {
        p_user_id: userId,
        p_week_start: calculatedWeekStart
      });

      console.log('Generate plan result:', { data, error });

      if (error) {
        // If we get a duplicate key error, it means a plan already exists
        // Let's try to fetch it instead
        if (error.code === '23505') {
          console.log('Plan already exists, fetching existing plan...');
          return await this.getCurrentWeekPlan(userId);
        }
        console.error('Error generating plan:', error);
        throw error;
      }

      // Return the generated plan
      const plan = await this.getCurrentWeekPlan(userId);
      console.log('Generated plan fetched:', plan);
      return plan;
    } catch (error) {
      console.error('Error generating exercise plan:', error);
      throw error;
    }
  },

  // Get or create exercise plan for current week
  async getOrCreateCurrentWeekPlan(userId) {
    try {
      console.log('Getting or creating plan for user:', userId);
      
      // Try to get existing plan
      let plan = await this.getCurrentWeekPlan(userId);
      
      // If no plan exists, generate one
      if (!plan) {
        console.log('No existing plan found, generating new plan...');
        plan = await this.generatePlan(userId);
      }

      // If we still don't have a plan, something went wrong
      if (!plan) {
        throw new Error('Failed to get or create exercise plan');
      }

      console.log('Final plan result:', plan);
      return plan;
    } catch (error) {
      console.error('Error getting or creating exercise plan:', error);
      
      // Last resort: try to fetch existing plan one more time
      // This handles race conditions where a plan might have been created
      // between our first check and the generation attempt
      try {
        console.log('Attempting retry...');
        const plan = await this.getCurrentWeekPlan(userId);
        if (plan) {
          console.log('Found plan on retry, using existing plan');
          return plan;
        }
      } catch (retryError) {
        console.error('Retry also failed:', retryError);
      }
      
      // Re-throw the original error with more context
      throw new Error(`Failed to get or create exercise plan: ${error.message}`);
    }
  },

  // Get exercises for a specific day
  getExercisesForDay(plan, dayOfWeek) {
    if (!plan || !plan.exercise_plan_items) return [];
    
    return plan.exercise_plan_items.filter(item => item.day_of_week === dayOfWeek);
  },

  // Get exercises for today
  getTodaysExercises(plan) {
    const today = new Date().getDay();
    return this.getExercisesForDay(plan, today);
  },

  // Mark an exercise as completed
  async completeExercise(exercisePlanItemId) {
    try {
      const { data, error } = await supabase
        .from('exercise_plan_items')
        .update({
          is_completed: true,
          completed_at: new Date().toISOString()
        })
        .eq('id', exercisePlanItemId)
        .select()
        .single();

      if (error) throw error;

      // Also create a record in exercise_sessions for backward compatibility
      await supabase
        .from('exercise_sessions')
        .insert({
          user_id: data.user_id,
          exercise_type: data.exercise_type,
          repetitions: data.repetitions,
          completed_at: new Date().toISOString(),
          date: formatDate(new Date())
        });

      return data;
    } catch (error) {
      console.error('Error completing exercise:', error);
      throw error;
    }
  },

  // Reset exercise completion (mark as not completed)
  async resetExercise(exercisePlanItemId) {
    try {
      const { data, error } = await supabase
        .from('exercise_plan_items')
        .update({
          is_completed: false,
          completed_at: null
        })
        .eq('id', exercisePlanItemId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error resetting exercise:', error);
      throw error;
    }
  },

  // Get exercise plan statistics
  async getPlanStatistics(userId, weekStart = null) {
    try {
      const targetWeekStart = weekStart || formatDate(getWeekStart());
      
      const { data, error } = await supabase
        .from('exercise_plans')
        .select(`
          *,
          exercise_plan_items (
            id,
            exercise_type,
            day_of_week,
            is_completed
          )
        `)
        .eq('user_id', userId)
        .eq('week_start_date', targetWeekStart)
        .single();

      if (error) throw error;

      const totalExercises = data.exercise_plan_items.length;
      const completedExercises = data.exercise_plan_items.filter(item => item.is_completed).length;
      const completionRate = totalExercises > 0 ? (completedExercises / totalExercises) * 100 : 0;

      return {
        totalExercises,
        completedExercises,
        completionRate: Math.round(completionRate),
        plan: data
      };
    } catch (error) {
      console.error('Error getting plan statistics:', error);
      throw error;
    }
  }
};
