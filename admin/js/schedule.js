(function() {
    const getSupabaseClient = () => {
        return typeof supabaseClient !== 'undefined' ? supabaseClient : null;
    };

    const initScheduleManager = async () => {
        const client = getSupabaseClient();
        if (!client) return;

        try {
            // 1. Fetch Global Rotation Interval from settings table
            const { data: settingsData } = await client.from('settings').select('schedule_seconds').limit(1).single();
            const intervalInput = document.getElementById('rotationInterval');
            if (settingsData && settingsData.schedule_seconds && intervalInput) {
                intervalInput.value = settingsData.schedule_seconds;
            }

            // 2. Load existing setup map states inside the DOM rows
            const { data: slots, error } = await client.from('schedule_slots').select('*').order('slot', { ascending: true });
            if (!error && slots) {
                slots.forEach(slotData => {
                    const i = slotData.slot;
                    const toggle = document.getElementById(`toggle-slot-${i}`);
                    const previewImg = document.getElementById(`preview-img-${i}`);
                    const placeholder = document.getElementById(`placeholder-${i}`);

                    if (toggle) toggle.checked = slotData.enabled;
                    if (slotData.url && previewImg && placeholder) {
                        previewImg.src = `${slotData.url}?t=${new Date().getTime()}`;
                        previewImg.classList.remove('d-none');
                        placeholder.classList.add('d-none');
                    }
                });
            }
        } catch (err) {
            console.error('Failed fetching data records from backend runtime:', err);
        }

        // 3. Interval Timer Configuration Action Button Event
        const saveIntervalBtn = document.getElementById('saveIntervalBtn');
        if (saveIntervalBtn) {
            saveIntervalBtn.onclick = async () => {
                const value = parseInt(document.getElementById('rotationInterval').value, 10);
                const finalValue = value >= 2 ? value : 5;

                const { data: currentSettings } = await client.from('settings').select('id').limit(1).single();
                if (currentSettings) {
                    const { error } = await client.from('settings').update({ schedule_seconds: finalValue }).eq('id', currentSettings.id);
                    if (!error) alert('Rotation interval updated successfully!');
                }
            };
        }
    };

    // 4. Handle Live Selection Actions (File streams + Toggles)
    document.addEventListener('change', async (e) => {
        const client = getSupabaseClient();
        if (!client) return;

        const BUCKET_NAME = 'display';
        const FOLDER_PREFIX = 'schedule/';

        if (e.target.classList.contains('file-input')) {
            const card = e.target.closest('.slot-card');
            const slotId = parseInt(card.dataset.slot, 10);
            const file = e.target.files[0];
            if (!file) return;

            const previewImg = document.getElementById(`preview-img-${slotId}`);
            const placeholder = document.getElementById(`placeholder-${slotId}`);

            try {
                const fileExt = file.name.split('.').pop();
                const filePath = `${FOLDER_PREFIX}slot_${slotId}.${fileExt}`;

                // Process dynamic storage pipeline sync execution path 
                const { error: uploadError } = await client.storage
                    .from(BUCKET_NAME)
                    .upload(filePath, file, { upsert: true, cacheControl: '0' });

                if (uploadError) throw uploadError;

                const { data: publicUrlData } = client.storage.from(BUCKET_NAME).getPublicUrl(filePath);
                const assetUrl = publicUrlData.publicUrl;

                const { error: dbError } = await client
                    .from('schedule_slots')
                    .update({ url: assetUrl })
                    .eq('slot', slotId);

                if (dbError) throw dbError;

                if (previewImg && placeholder) {
                    previewImg.src = `${assetUrl}?t=${new Date().getTime()}`;
                    previewImg.classList.remove('d-none');
                    placeholder.classList.add('d-none');
                }
                alert(`Slot ${slotId} image updated instantly!`);
            } catch (err) {
                alert(`Upload operation failed: ${err.message || err}`);
            }
        }

        if (e.target.classList.contains('slot-toggle')) {
            const slotId = parseInt(e.target.id.replace('toggle-slot-', ''), 10);
            await client.from('schedule_slots').update({ enabled: e.target.checked }).eq('slot', slotId);
        }
    });

    // 5. Modal Display Triggers
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn-preview-modal');
        if (btn && window.bootstrap) {
            const slotId = btn.dataset.slot;
            const activeImg = document.getElementById(`preview-img-${slotId}`);
            if (activeImg && !activeImg.classList.contains('d-none')) {
                document.getElementById('modalPreviewImage').src = activeImg.src;
                const previewModal = new bootstrap.Modal(document.getElementById('schedulePreviewModal'));
                previewModal.show();
            } else {
                alert('No media asset loaded into this slot.');
            }
        }
    });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initScheduleManager);
    } else {
        initScheduleManager();
    }
})();
