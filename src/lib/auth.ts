import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export const supabaseClient = createClientComponentClient();

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email,
    password,
  });
  
  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabaseClient.auth.signOut();
  return { error };
};

export const getSession = async () => {
  const { data, error } = await supabaseClient.auth.getSession();
  return { session: data.session, error };
};

export const createAdminUser = async (email: string, password: string) => {
  // Note: You should only run this once to create the admin user
  // For security, you may want to implement this in a separate protected route
  const { data, error } = await supabaseClient.auth.signUp({
    email,
    password,
  });
  
  return { data, error };
}; 