// ======================================
// THOR DISPLAY CMS
// Schedule Module (Smooth Cross-Fade Slideshow)
// ======================================

let scheduleTimer = null;
let currentSlideIndex = 0;

async function loadSchedule() {
    // SECURITY GUARD: Stop execution if the presentation element is missing (e.g. inside Admin)
    const container = document.getElementById("scheduleImage");
    if (!container) return;

    if (typeof supabaseClient === 'undefined') return;

    try {
        // 1. Fetch Rotation Configuration Interval
        const { data: settingsData } = await supabaseClient.from('settings').select('schedule_seconds').limit(1).single();
        const intervalMs = (settingsData && settingsData.schedule_seconds ? parseInt(settingsData.schedule_seconds, 10) : 5) * 1000;

        // 2. Fetch Active Slots
        const { data: activeSlides, error } = await supabaseClient
            .from('schedule_slots')
            .select('url')
            .eq('enabled', true)
            .neq('url', '')
            .order('slot', { ascending: true });

        if (error || !activeSlides || activeSlides.length === 0) {
            container.parentNode.style.background = "transparent";
            container.style.display = "none";
            return;
        }

        // 3. Inject CSS for Safe Proportional Cross-Fading
        if (!document.getElementById('fade-slideshow-core-styles')) {
            const styleBlock = document.createElement('style');
            styleBlock.id = 'fade-slideshow-core-styles';
            styleBlock.innerHTML = `
                .fade-wrapper-frame {
                    position: relative;
                    width: 100%;
                    height: 100%;
                    overflow: hidden;
                    background: #000;
                }
                .fade-slide-layer {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    opacity: 0;
                    transition: opacity 1000ms ease-in-out;
                    background-size: contain; /* Ensures 100% of the image fits without cropping or stretching */
                    background-position: center;
                    background-repeat: no-repeat;
                }
                .fade-slide-layer.active {
                    opacity: 1;
                }
            `;
            document.head.appendChild(styleBlock);
        }

        // 4. Initialize Elements Setup
        const parent = container.parentNode;
        let slideshowBox = document.getElementById('slideshowRenderContainer');
        
        if (!slideshowBox) {
            slideshowBox = document.createElement('div');
            slideshowBox.id = 'slideshowRenderContainer';
            slideshowBox.className = 'fade-wrapper-frame';
            slideshowBox.style.width = "100%";
            slideshowBox.style.height = "100%";
            parent.insertBefore(slideshowBox, container);
            container.style.display = "none"; 
        }

        // Generate slide DOM wrappers with a cache-busting timestamp
        const htmlContent = activeSlides.map((slide, idx) => `
            <div class="fade-slide-layer" style="background-image: url('${slide.url}?t=${Date.now()}');"></div>
        `).join('');
        
        slideshowBox.innerHTML = htmlContent;

        
        // 5. Execute Slideshow Rotation Mechanics
        const layers = slideshowBox.querySelectorAll('.fade-slide-layer');
        if (layers.length > 0) {
            if (currentSlideIndex >= layers.length) currentSlideIndex = 0;
            layers[currentSlideIndex].classList.add('active');

            if (scheduleTimer) clearInterval(scheduleTimer);
            
            if (layers.length > 1) {
                scheduleTimer = setInterval(() => {
                    layers[currentSlideIndex].classList.remove('active');
                    currentSlideIndex = (currentSlideIndex + 1) % layers.length;
                    layers[currentSlideIndex].classList.add('active');
                }, intervalMs);
            }
        }

    } catch (err) {
        console.error("Schedule Presentation Engine Error:", err);
    }
}

function startSchedule() {
    loadSchedule();
    // Periodically re-sync from the database map state layout updates every 60 seconds
    setInterval(loadSchedule, 60000);
}

function stopSchedule() {
    if (scheduleTimer) {
        clearInterval(scheduleTimer);
        scheduleTimer = null;
    }
}
