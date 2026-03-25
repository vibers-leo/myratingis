const { initializeApp } = require("firebase/app");
const { getFirestore, collection, setDoc, doc, serverTimestamp } = require("firebase/firestore");
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

// 1. Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyDOZZwi0_Eg30_n3l4PNWn5FIHubIbyWYk",
  authDomain: "myratingis-29082.firebaseapp.com",
  projectId: "myratingis-29082",
  storageBucket: "myratingis-29082.firebasestorage.app",
  messagingSenderId: "733334238264",
  appId: "1:733334238264:web:e58caa3fd0f86abd0022cd",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 2. Supabase Config
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL, 
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function migrateProfiles() {
  console.log("🚀 Starting Profiles Migration...");

  // Fetch all profiles
  const { data: profiles, error } = await supabase.from('profiles').select('*');
  
  if (error || !profiles) {
      console.error("Failed to fetch profiles:", error);
      return;
  }

  console.log(`📥 Found ${profiles.length} profiles.`);

  let count = 0;
  for (const p of profiles) {
      if (!p.email) {
          console.log(`⚠️ Skipping profile without email (ID: ${p.id})`);
          continue;
      }

      console.log(`Processing: ${p.email} (${p.username})`);

      const userData = {
          legacy_uid: p.id,
          username: p.username || "",
          nickname: p.nickname || p.username || "",
          profile_image: p.avatar_url || p.profile_image_url || "",
          points: p.points || 0,
          role: p.role || 'user',
          
          // Demographics & Meta
          gender: p.gender || null,
          age_group: p.age_group || null,
          occupation: p.occupation || null,
          expertise: p.expertise || {},
          interests: p.interests || {},
          bio: p.bio || "",
          website: p.website || "",
          
          migratedAt: serverTimestamp()
      };

      try {
          // Store in 'legacy_users' collection keyed by Email
          // Using setDoc to overwrite if re-run
          await setDoc(doc(db, "legacy_users", p.email), userData);
          count++;
      } catch (e) {
          console.error(`❌ Error saving ${p.email}:`, e);
      }
  }

  console.log(`🎉 Migration Complete! ${count} profiles staged for import.`);
}

migrateProfiles();
