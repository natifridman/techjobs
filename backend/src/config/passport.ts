import passport from 'passport';
import { Strategy as GoogleStrategy, Profile } from 'passport-google-oauth20';
import { v4 as uuidv4 } from 'uuid';
import supabase, { User } from '../database';

export type { User };

// Serialize user to session
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id: string, done) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error deserializing user:', error);
      return done(null, null);
    }

    done(null, user as User);
  } catch (error) {
    done(error, null);
  }
});

// Configure Google OAuth Strategy
const setupGoogleStrategy = () => {
  const clientID = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const callbackURL = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3001/auth/google/callback';

  if (!clientID || !clientSecret) {
    console.warn('⚠️  Google OAuth not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.');
    return;
  }

  passport.use(new GoogleStrategy(
    {
      clientID,
      clientSecret,
      callbackURL,
    },
    async (accessToken: string, refreshToken: string, profile: Profile, done) => {
      try {
        const googleId = profile.id;
        const email = profile.emails?.[0]?.value || '';
        const name = profile.displayName || '';
        const picture = profile.photos?.[0]?.value || '';

        // Check if user exists
        const { data: existingUser, error: selectError } = await supabase
          .from('users')
          .select('*')
          .eq('google_id', googleId)
          .single();

        if (selectError && selectError.code !== 'PGRST116') {
          // PGRST116 = no rows returned, which is expected for new users
          console.error('Error checking existing user:', selectError);
          return done(selectError as any, undefined);
        }

        let user: User;

        if (existingUser) {
          // Update existing user
          const now = new Date().toISOString();
          const { data: updatedUser, error: updateError } = await supabase
            .from('users')
            .update({
              name,
              picture,
              email,
              updated_date: now
            } as any)
            .eq('id', (existingUser as any).id)
            .select()
            .single();

          if (updateError) {
            console.error('Error updating user:', updateError);
            return done(updateError as any, undefined);
          }

          user = updatedUser as User;
        } else {
          // Create new user
          const id = uuidv4();
          const now = new Date().toISOString();

          const { data: newUser, error: insertError } = await supabase
            .from('users')
            .insert({
              id,
              google_id: googleId,
              email,
              name,
              picture,
              created_date: now,
              updated_date: now
            } as any)
            .select()
            .single();

          if (insertError) {
            console.error('Error creating user:', insertError);
            return done(insertError as any, undefined);
          }

          user = newUser as User;
        }

        done(null, user);
      } catch (error) {
        done(error as Error, undefined);
      }
    }
  ));

  console.log('✅ Google OAuth configured');
};

setupGoogleStrategy();

export default passport;
