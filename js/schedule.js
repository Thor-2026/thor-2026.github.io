// ======================================
// THOR DISPLAY CMS
// Schedule Module (Ken Burns Slideshow)
// ======================================

let scheduleTimer = null;
let currentSlideIndex = 0;

async function loadSchedule() {
    // If the element doesn't exist, stop execution immediately.
    // This safely keeps this script out of the admin dashboard.
    const container = document.getElementById("scheduleImage");
    if (!container) return;

    if (typeof supabaseClient === 'undefined') return;

    try {
        // 1. Fetch Rotation Configuration settings row
        const { data: settingsData } = await supabaseClient.from('settings').select('schedule_seconds').limit(1).single();
        const intervalMs = (settingsData && settingsData.schedule_seconds ? parseInt(settingsData.schedule_seconds, 10) : 5) * 1000;

        // 2. Fetch all active rows dynamically from table layers
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

        // Clean up or append CSS styles safely inside head layers once
        if (!document.getElementById('kb-slideshow-core-styles')) {
            const styleBlock = document.createElement('style');
            styleBlock.id = 'kb-slideshow-core-styles';
            styleBlock.innerHTML = `
                .kb-wrapper-frame {
                    position: relative;
                    width: 100%;
                    height: 100%;
                    overflow: hidden;
                    background: #000;
                }
                .kb-slide-layer {
                    position: absolute;
                    top:0; left:0; width:100%; height:100%;
                    opacity: 0;
                    transition: opacity 1500ms ease-in-out;
                    background-size: cover;
                    background-position: center;
                    transform: scale(1);
                }
                .kb-slide-layer.active {
                    opacity: 1;
                    animation: runKenBurnsAnimation var(--kb-speed, 6000ms) ease-in-out forwards;
                }
                @keyframes runKenBurnsAnimation {
                    0% { transform: scale(1); }
                    100% { transform: scale(1.06); }
                }
            `;
            document.head.appendChild(styleBlock);
        }

        // Setup rendering views blueprint loops mapping paths
        const parent = container.parentNode;
        let slideshowBox = document.getElementById('slideshowRenderContainer');
        
        if (!slideshowBox) {
            slideshowBox = document.createElement('div');
            slideshowBox.id = 'slideshowRenderContainer';
            slideshowBox.className = 'kb-wrapper-frame';
            // Match dimensions of original image target element bounding frames
            slideshowBox.style.width = "100%";
            slideshowBox.style.height = "100%";
            parent.insertBefore(slideshowBox, container);
            container.style.display = "none"; // Hide original img element placeholder safely
        }

        // Build HTML strings markup inside container layers maps
        const htmlContent = activeSlides.map((slide, idx) => `
            <div class="kb-slide-layer" style="background-image: url('${slide.url}?t=${Date.now()}'); --kb-speed: ${intervalMs + 1500}ms;"></div>
        `).join('');
        
        slideshowBox.innerHTML = htmlContent;

        // Process slide rotation loop sequence executions logic maps 
        const layers = slideshowBox.querySelectorAll('.kb-slide-layer');
        if (layers.length > 0) {
            if (currentSlideIndex >= layers.length) currentSlideIndex = 0;
            layers[currentSlideIndex].classList.add('active');

            // clear previous automation timers and map up new loops context timings dynamically
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
        console.error("Schedule Engine Loop Error:", err);
    }
}

function startSchedule() {
    loadSchedule();
    // Re-check for database updates or changes every 60 seconds
    setInterval(loadSchedule, 60000);
}

function stopSchedule() {
    if (scheduleTimer) {
        clearInterval(scheduleTimer);
        scheduleTimer = null;
    }
}
