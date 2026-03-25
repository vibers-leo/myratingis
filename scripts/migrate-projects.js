const { initializeApp } = require("firebase/app");
const { getFirestore, collection, addDoc, serverTimestamp } = require("firebase/firestore");
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

// 1. Firebase Configuration
// (Hardcoded strictly for migration script usage based on client.ts)
const firebaseConfig = {
  apiKey: "AIzaSyDOZZwi0_Eg30_n3l4PNWn5FIHubIbyWYk",
  authDomain: "myratingis-29082.firebaseapp.com",
  projectId: "myratingis-29082",
  storageBucket: "myratingis-29082.firebasestorage.app",
  messagingSenderId: "733334238264",
  appId: "1:733334238264:web:e58caa3fd0f86abd0022cd",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 2. Supabase Configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Supabase credentials not found in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrate() {
  console.log("🚀 Starting Migration: Supabase to Firebase...");

  // A. Fetch Projects from Supabase
  console.log("📥 Fetching projects from Supabase...");
  // Try to fetch user email if possible via profiles join, otherwise just project
  // Assuming 'profiles' table might exist and linked, if not we will fail gracefully
  let projectsData = [];
  
  const { data, error } = await supabase
    .from("Project")
    .select(`
        *,
        profiles:user_id ( email ) 
    `);

  if (error) {
    console.warn("⚠️ Failed to fetch with profiles join (maybe relation missing). Fetching raw projects.");
    const raw = await supabase.from("Project").select("*");
    if (raw.error) {
      console.error("❌ Fatal Error fetching projects:", raw.error);
      return;
    }
    projectsData = raw.data;
  } else {
    projectsData = data;
  }

  console.log(`✅ Found ${projectsData.length} projects.`);

  // B. Upload to Firebase
  for (const p of projectsData) {
    try {
        console.log(`Processing: ${p.title} (ID: ${p.project_id})`);

        // Extract Email (if available from join)
        let authorEmail = null;
        if (p.profiles && p.profiles.email) {
            authorEmail = p.profiles.email;
        } else if (Array.isArray(p.profiles) && p.profiles[0]?.email) {
            authorEmail = p.profiles[0].email;
        }

        // Prepare Data for Firestore
        const firestoreData = {
            title: p.title,
            summary: p.summary || "",
            content_text: p.content_text || "",
            description: p.description || "",
            category_id: p.category_id || 1,
            thumbnail_url: p.thumbnail_url || "", // Keep Supabase URL
            visibility: p.visibility || 'public',
            audit_deadline: p.audit_deadline ? new Date(p.audit_deadline) : null,
            is_growth_requested: p.is_growth_requested || false,
            
            // Author Info
            author_uid: p.user_id, // Keep legacy UUID for reference
            author_email: authorEmail || "legacy_user@migration.com", // Fallback
            
            // Custom Data (JSON)
            custom_data: p.custom_data || {},
            
            // Timestamps
            createdAt: p.created_at ? new Date(p.created_at) : serverTimestamp(),
            updatedAt: serverTimestamp(),
            
            // Metrics
            view_count: p.views_count || 0,
            feedback_count: p.rating_count || 0,
            like_count: p.likes_count || 0,

            // Migration Flag
            is_migrated: true,
            legacy_id: p.project_id.toString()
        };

        // Add to Firestore
        const docRef = await addDoc(collection(db, "projects"), firestoreData);
        console.log(`   ✨ Migrated -> Firestore ID: ${docRef.id}`);

    } catch (e) {
        console.error(`   ❌ Failed to migrate project ${p.project_id}:`, e);
    }
  }

  console.log("🎉 Migration Complete!");
  console.log("Note: Images are still hosted on Supabase (served via URL).");
  process.exit(0);
}

migrate();
