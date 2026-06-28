/*const SUPABASE_URL = "https://ggohaurqbsyamznzuuaf.supabase.co";

const SUPABASE_KEY = "sb_publishable_ZpHvrV-a_BmznhfbVupvxQ_b5NKYPYk";

const supabase = supabaseClient.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);*/
console.log("CORRECT supabase.js LOADED");
const SUPABASE_URL = "https://ggohaurqbsyamznzuuaf.supabase.co";
const SUPABASE_KEY = "sb_publishable_ZpHvrV-a_BmznhfbVupvxQ_b5NKYPYk";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);
