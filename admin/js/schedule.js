// =======================================
// THOR DISPLAY CMS
// Schedule Manager (Multi-Slot Edition)
// =======================================

async function initSchedulePage() {
    if (typeof supabaseClient === 'undefined') {
        console.error("Supabase client instance not detected.");
        return;
    }

    const BUCKET_NAME = 'display';
    const FOLDER_PREFIX = 'schedule/';

    try {
        // 1. Fetch Global Rotation configuration settings row
        const { data: settingsData } = await supabaseClient.from('settings').select('schedule_seconds').limit(1).single();
        const intervalInput = document.getElementById('rotationInterval');
        if (settingsData && settingsData.schedule_seconds && intervalInput) {
            intervalInput.value = settingsData.schedule_seconds;
        }

        // 2. Map all rows into the dashboard panels UI state grids
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
        console.error('Failed processing administrative layouts init: ', err);
    }

    // 3. Save Interval Config Listener Loop Hook
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

    // 4. Track Dynamic Elements Context Swaps 
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

                // Upload direct target streams straight to cloud context pipelines
                const { error: uploadError } = await supabaseClient.storage
                    .from(BUCKET_NAME)
                    .upload(filePath, file, { upsert: true, cacheControl: '0' });

                if (uploadError) throw uploadError;

                const assetUrl = supabaseClient.storage.from(BUCKET_NAME).getPublicUrl(filePath).data.publicUrl;

                // Update row URL index maps
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
                alert(`Slot ${slotId} image updated instantly!`);
            } catch (err) {
                alert(`Upload execution failed: ${err.message || err}`);
            }
        };
    });

    // Handle Toggles
    document.querySelectorAll('.slot-toggle').forEach(chk => {
        chk.onchange = async (e) => {
            const slotId = parseInt(e.target.id.replace('toggle-slot-', ''), 10);
            await supabaseClient.from('schedule_slots').update({ enabled: e.target.checked }).eq('slot', slotId);
        };
    });

    // Handle Custom Simple Lightbox Modal Display click tracking mappings
    document.querySelectorAll('.btn-preview-modal').forEach(btn => {
        btn.onclick = (e) => {
            const slotId = e.target.closest('.btn-preview-modal').dataset.slot;
            const activeImg = document.getElementById(`preview-img-${slotId}`);
            if (activeImg && activeImg.style.display === 'block') {
                document.getElementById('lightboxTargetImage').src = activeImg.src;
                document.getElementById('simplePreviewLightbox').style.display = 'flex';
            } else {
                alert('No media asset loaded into this slot layout.');
            }
        };
    });
}
