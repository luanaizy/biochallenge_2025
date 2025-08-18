import { useState, useEffect } from 'react'
import { supabase } from '../config/supabase'

export const useAuth = () => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
        
        // Create profile if user just signed up and doesn't have one
        if (event === 'SIGNED_IN' && session?.user) {
          await ensureProfileExists(session.user)
        }
      }
    )

    return () => subscription?.unsubscribe()
  }, [])

  const ensureProfileExists = async (user) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()

      if (error && error.code === 'PGRST116') {
        // Profile doesn't exist, create it
        await supabase.from('profiles').insert({
          id: user.id,
          name: user.user_metadata?.name || 'Usuário',
          email: user.email,
        })
      }
    } catch (error) {
      console.error('Error ensuring profile exists:', error)
    }
  }

  const signUp = async (email, password, name) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name,
        }
      }
    })
    
    return { data, error }
  }

  const signIn = async (email, password) => {
    return await supabase.auth.signInWithPassword({ email, password })
  }

  const signOut = async () => {
    return await supabase.auth.signOut()
  }

  const resetPassword = async (email) => {
    return await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'pissbuddy://reset-password',
    })
  }

  return {
    user,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
  }
}