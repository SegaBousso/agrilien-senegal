import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { RegisterInput } from '@/lib/validations';
import {
  fetchProfile,
  fetchProducerProfile,
  upsertBuyerProfile,
  upsertProducerProfile,
} from '@/services/profiles.service';
import type { Profile, UserRole } from '@/types/database';

interface AuthContextValue {
  session: Session | null;
  profile: Profile | null;
  /** id du producer_profile (si rôle producteur), pour les requêtes liées. */
  producerId: string | null;
  role: UserRole | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  /** Renvoie `needsConfirmation: true` si l'email doit être confirmé avant connexion. */
  signUp: (input: RegisterInput) => Promise<{ needsConfirmation: boolean }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [producerId, setProducerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (userId: string) => {
    try {
      const p = await fetchProfile(userId);
      setProfile(p);
      if (p.role === 'producer') {
        const producer = await fetchProducerProfile(userId);
        setProducerId(producer?.id ?? null);
      } else {
        setProducerId(null);
      }
    } catch {
      setProfile(null);
      setProducerId(null);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      if (data.session?.user) await loadProfile(data.session.user.id);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      if (newSession?.user) {
        await loadProfile(newSession.user.id);
      } else {
        setProfile(null);
        setProducerId(null);
      }
    });

    return () => sub.subscription.unsubscribe();
  }, [loadProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const signUp = useCallback(async (input: RegisterInput) => {
    const { data, error } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        data: {
          full_name: input.full_name,
          phone: input.phone || null,
          role: input.role,
        },
      },
    });
    if (error) throw error;

    // Si l'email doit être confirmé, aucune session n'est ouverte : impossible
    // de créer le profil métier maintenant (RLS exige une session). Le profil de
    // base est créé par le trigger handle_new_user côté serveur ; le profil métier
    // sera créé paresseusement plus tard (ex. ensureProducerProfile).
    const needsConfirmation = !data.session;

    const userId = data.user?.id;
    if (userId && data.session) {
      // Best-effort : ne bloque jamais l'inscription si la création échoue.
      try {
        if (input.role === 'producer') {
          await upsertProducerProfile(userId, {
            farm_name: input.farm_name ?? '',
            region: input.region ?? '',
          });
        } else {
          await upsertBuyerProfile(userId, {
            buyer_type: input.buyer_type ?? 'particulier',
            organization_name: input.organization_name || null,
          });
        }
      } catch (err) {
        console.error('Création du profil métier différée :', err);
      }
    }

    return { needsConfirmation };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setProducerId(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (session?.user) await loadProfile(session.user.id);
  }, [session, loadProfile]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      profile,
      producerId,
      role: profile?.role ?? null,
      loading,
      signIn,
      signUp,
      signOut,
      refreshProfile,
    }),
    [session, profile, producerId, loading, signIn, signUp, signOut, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé dans un AuthProvider');
  return ctx;
}
