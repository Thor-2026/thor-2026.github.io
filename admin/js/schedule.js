// =======================================
// THOR DISPLAY CMS
// Schedule Manager Backend Interface
// =======================================

async function initSchedulePage() {
    if (typeof supabaseClient === 'undefined') {
        console.error("Supabase engine connection interface missing.");
        return;
    }

    const BUCKET_NAME = 'display';
    const FOLDER_PREFIX = 'schedule/';

    try {
        // 1. Fetch Timing Settings Row
        const { data: settingsData } = await supabaseClient.from('settings').select('schedule_seconds').limit(1).single();
        const intervalInput = document.getElementById('rotationInterval');
        if (settingsData && settingsData.schedule_seconds && intervalInput) {
            intervalInput.value = settingsData.schedule_seconds;
        }

        // 2. Fetch and Load Active Data Slots mapping records inside panels UI grids
        const { data: slots, error } = await supabaseClient.from('schedule_slots').select('*').order('slot', { ascending: true });
        if (!error && slots) {
            slots.forEach(slotData => {
                const i = slotData.slot;
                const toggle = document.getElementById(`toggle-slot-${i}`);
                const previewImg = document.getElementById(`preview-img-${i}`);
                const placeholder = document.getElementById(`placeholder-${i}`);

                if (toggle) toggle.checked = slotData.enabled;
                if (slotData.url && previewImg && placeholder) {
                    previewImg.src = slotData.url + "?t=" + Date.now();
                    previewImg.style.display = 'block';
                    placeholder.style.display = 'none';
                }
            });
        }
    } catch (err) {
        console.error('Failed processing backend layout initialization states:', err);
    }

    // 3. Timing Configuration Updates Action Submit Trigger Loop
    const saveIntervalBtn = document.getElementById('saveIntervalBtn');
    if (saveIntervalBtn) {
        saveIntervalBtn.onclick = async () => {
            const value = parseInt(document.getElementById('rotationInterval').value, 10);
            const finalValue = value >= 2 ? value : 5;

            const { data: currentSettings } = await supabaseClient.from('settings').select('id').limit(1).single();
            if (currentSettings) {
                const { error } = await supabaseClient.from('settings').update({ schedule_seconds: finalValue }).eq('id', currentSettings.id);
                if (!error) alert('Rotation interval updated successfully!');
            }
        };
    }

    // 4. File Chooser Pipeline Stream Sync Handling
    document.querySelectorAll('.file-input').forEach(input => {
        input.onchange = async (e) => {
            const card = e.target.closest('.slot-card');
            const slotId = parseInt(card.dataset.slot, 10);
            const file = e.target.files[0];
            if (!file) return;

            const previewImg = document.getElementById(`preview-img-${slotId}`);
            const placeholder = document.getElementById(`placeholder-${slotId}`);

            try {
                const fileExt = file.name.split('.').pop();
                const filePath = `${FOLDER_PREFIX}slot_${slotId}.${fileExt}`;

                // Upload structural files streams direct to storage layer bucket
                const { error: uploadError } = await supabaseClient.storage
                    .from(BUCKET_NAME)
                    .upload(filePath, file, { upsert: true, cacheControl: '0' });

                if (uploadError) throw uploadError;

                const assetUrl = supabaseClient.storage.from(BUCKET_NAME).getPublicUrl(filePath).data.publicUrl;

                // Bind update values straight into target database rows indices
                const { error: dbError } = await supabaseClient
                    .from('schedule_slots')
                    .update({ url: assetUrl })
                    .eq('slot', slotId);

                if (dbError) throw dbError;

                if (previewImg && placeholder) {
                    previewImg.src = assetUrl + "?t=" + Date.now();
                    previewImg.style.display = 'block';
                    placeholder.style.display = 'none';
                }
                alert(`Slot ${slotId} schedule updated successfully!`);
            } catch (err) {
                alert(`Upload execution processing failed: ${err.message || err}`);
            }
        };
    });

    // 5. Handle Slide Toggle Status updates hooks 
    document.querySelectorAll('.slot-toggle').forEach(chk => {
        chk.onchange = async (e) => {
            const slotId = parseInt(e.target.id.replace('toggle-slot-', ''), 10);
            await supabaseClient.from('schedule_slots').update({ enabled: e.target.checked }).eq('slot', slotId);
        };
    });

    // 6. Inline Simple Lightbox Frame Dialog Modal Trigger Loops Map Action
    document.querySelectorAll('.btn-preview-modal').forEach(btn => {
        btn.onclick = (e) => {
            const slotId = e.target.closest('.btn-preview-modal').dataset.slot;
            const activeImg = document.getElementById(`preview-img-${slotId}`);
            if (activeImg && activeImg.style.display === 'block') {
                document.getElementById('lightboxTargetImage').src = activeImg.src;
                document.getElementById('simplePreviewLightbox').style.display = 'flex';
            } else {
                alert('No media file loaded into this target schedule grid slot loop layout.');
            }
        };
    });
}
