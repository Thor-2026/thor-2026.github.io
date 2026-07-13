// =======================================
// THOR DISPLAY CMS
// Schedule Manager
// =======================================
document.addEventListener('DOMContentLoaded', async () => {
    const BUCKET_NAME = 'display'; 
    const FOLDER_PREFIX = 'schedule/';

    async function loadScheduleSettings() {
        try {
            // 1. Fetch Global Rotation Interval from settings (targeting the first row)
            const { data: settingsData } = await supabase.from('settings').select('schedule_seconds').limit(1).single();
            if (settingsData && settingsData.schedule_seconds) {
                document.getElementById('rotationInterval').value = settingsData.schedule_seconds;
            }

            // 2. Fetch all 5 rows from schedule_slots table
            const { data: slots, error } = await supabase.from('schedule_slots').select('*').order('slot', { ascending: true });
            if (error) throw error;

            slots.forEach(slotData => {
                const i = slotData.slot;
                const toggle = document.getElementById(`toggle-slot-${i}`);
                const previewImg = document.getElementById(`preview-img-${i}`);
                const placeholder = document.getElementById(`placeholder-${i}`);

                if (toggle) toggle.checked = slotData.enabled;
                if (slotData.url && previewImg) {
                    previewImg.src = `${slotData.url}?t=${new Date().getTime()}`;
                    previewImg.classList.remove('d-none');
                    placeholder.classList.add('d-none');
                }
            });
        } catch (err) {
            console.error('Error fetching relational schedule properties:', err);
        }
    }

    // Handle File Processing and Storage uploading
    document.querySelectorAll('.file-input').forEach(input => {
        input.addEventListener('change', async (e) => {
            const card = e.target.closest('.slot-card');
            const slotId = parseInt(card.dataset.slot, 10);
            const file = e.target.files[0];
            if (!file) return;

            const previewImg = document.getElementById(`preview-img-${slotId}`);
            const placeholder = document.getElementById(`placeholder-${slotId}`);

            try {
                const fileExt = file.name.split('.').pop();
                const filePath = `${FOLDER_PREFIX}slot_${slotId}.${fileExt}`;

                const { error: uploadError } = await supabase.storage
                    .from(BUCKET_NAME)
                    .upload(filePath, file, { upsert: true, cacheControl: '0' });

                if (uploadError) throw uploadError;

                const { data: publicUrlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);
                const assetUrl = publicUrlData.publicUrl;

                const { error: dbError } = await supabase
                    .from('schedule_slots')
                    .update({ url: assetUrl })
                    .eq('slot', slotId);

                if (dbError) throw dbError;
                
                previewImg.src = `${assetUrl}?t=${new Date().getTime()}`;
                previewImg.classList.remove('d-none');
                placeholder.classList.add('d-none');

            } catch (err) {
                alert(`Upload operation failed: ${err.message || err}`);
            }
        });
    });

    // Save Enable/Disable State changes straight to rows
    document.querySelectorAll('.slot-toggle').forEach(toggle => {
        toggle.addEventListener('change', async (e) => {
            const slotId = parseInt(e.target.id.replace('toggle-slot-', ''), 10);
            await supabase.from('schedule_slots').update({ enabled: e.target.checked }).eq('slot', slotId);
        });
    });

    // Handle Rotation Timer updates (Updates the first settings record matching your setup row pattern)
    document.getElementById('saveIntervalBtn').addEventListener('click', async () => {
        const value = parseInt(document.getElementById('rotationInterval').value, 10);
        const finalValue = value >= 2 ? value : 5;

        // Fetch current row ID to perform a safe update match
        const { data: currentSettings } = await supabase.from('settings').select('id').limit(1).single();
        
        if (currentSettings) {
            await supabase.from('settings').update({ schedule_seconds: finalValue }).eq('id', currentSettings.id);
            alert('Rotation frequency update complete!');
        }
    });

    // Wire Up Lightbox Dynamic Previews
    const previewModal = new bootstrap.Modal(document.getElementById('schedulePreviewModal'));
    document.querySelectorAll('.btn-preview-modal').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const slotId = e.currentTarget.dataset.slot;
            const activeImgSrc = document.getElementById(`preview-img-${slotId}`).src;
            if (activeImgSrc) {
                document.getElementById('modalPreviewImage').src = activeImgSrc;
                previewModal.show();
            } else {
                alert('No media asset loaded into this slot.');
            }
        });
    });

    await loadScheduleSettings();
});
