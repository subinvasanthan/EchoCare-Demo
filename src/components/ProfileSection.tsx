@@ .. @@
       const { error: updErr } = await supabase.auth.updateUser({
         data: { profile_picture_url: publicUrl },
       });
       if (updErr) throw updErr;
 
+      // Also save to profiles table
+      const { error: profileErr } = await supabase
+        .from('profiles')
+        .upsert({
+          user_id: user.id,
+          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
+          image_url: publicUrl,
+          updated_at: new Date().toISOString()
+        });
+      if (profileErr) throw profileErr;
+
       setAvatarUrl(publicUrl);
     } catch (err: any) {