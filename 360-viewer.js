/**
 * Ember Clip 360° Product Viewer
 * Lightweight, dependency-free interactive rotator
 */
class Product360Viewer {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      frames: options.frames || 8,
      imagePrefix: options.imagePrefix || 'ember-',
      imageExtension: options.imageExtension || '.jpg',
      sensitivity: options.sensitivity || 1.5,
      autoplay: options.autoplay !== false,
      autoplaySpeed: options.autoplaySpeed || 80, // ms per frame
      ...options
    };

    this.currentFrame = 0;
    this.isDragging = false;
    this.startX = 0;
    this.lastX = 0;
    this.images = [];
    this.imgElement = null;
    this.autoplayInterval = null;
    this.isPlaying = false;

    this.init();
  }

  init() {
    this.preloadImages();
    this.buildUI();
    this.attachEventListeners();

    // Show first frame
    this.showFrame(0);

    // Optional autoplay on load
    if (this.options.autoplay) {
      setTimeout(() => this.startAutoplay(), 1200);
    }
  }

  preloadImages() {
    for (let i = 0; i < this.options.frames; i++) {
      const angle = (i * (360 / this.options.frames)).toString().padStart(3, '0');
      const src = `${this.options.imagePrefix}${angle}${this.options.imageExtension}`;
      
      const img = new Image();
      img.src = src;
      this.images.push(img);
    }
  }

  buildUI() {
    this.container.innerHTML = `
      <div class="relative bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-200 group">
        <!-- 360 Viewer Image -->
        <div class="relative aspect-[4/4.2] bg-[#f8f9fb] flex items-center justify-center">
          <img 
            class="max-h-full max-w-full object-contain select-none pointer-events-none transition-opacity duration-100"
            style="max-height: 92%;"
            alt="Ember Clip 360° view - drag to rotate"
          >
          
          <!-- Drag Hint Overlay -->
          <div class="drag-hint absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-white/90 backdrop-blur-sm rounded-2xl text-xs font-medium text-slate-600 flex items-center gap-x-2 shadow-sm border border-slate-200 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <i class="fa-solid fa-arrows-alt-h"></i>
            <span>Drag to rotate</span>
          </div>

          <!-- Loading indicator -->
          <div class="loading-indicator absolute inset-0 flex items-center justify-center bg-white/70 transition-opacity">
            <div class="flex items-center gap-x-2 text-sm text-slate-500">
              <i class="fa-solid fa-sync fa-spin"></i>
              <span>Loading 360° views...</span>
            </div>
          </div>
        </div>

        <!-- Controls -->
        <div class="flex items-center justify-between px-5 py-3 bg-white border-t border-slate-100">
          <div class="flex items-center gap-x-2">
            <button class="play-btn inline-flex items-center justify-center w-9 h-9 rounded-2xl border border-slate-200 hover:bg-slate-50 active:bg-slate-100 transition-colors" title="Autoplay rotation">
              <i class="fa-solid fa-play text-[#0A4D68]"></i>
            </button>
            <span class="text-xs text-slate-500 font-medium tracking-wide">360° VIEW</span>
          </div>

          <div class="flex items-center gap-x-1.5">
            <button class="prev-btn w-9 h-9 flex items-center justify-center rounded-2xl border border-slate-200 hover:bg-slate-50 active:bg-slate-100 transition-colors" title="Previous angle">
              <i class="fa-solid fa-chevron-left text-slate-600"></i>
            </button>
            <button class="next-btn w-9 h-9 flex items-center justify-center rounded-2xl border border-slate-200 hover:bg-slate-50 active:bg-slate-100 transition-colors" title="Next angle">
              <i class="fa-solid fa-chevron-right text-slate-600"></i>
            </button>
          </div>
        </div>
      </div>
    `;

    this.imgElement = this.container.querySelector('img');
    this.loadingEl = this.container.querySelector('.loading-indicator');
    this.playBtn = this.container.querySelector('.play-btn');
    this.prevBtn = this.container.querySelector('.prev-btn');
    this.nextBtn = this.container.querySelector('.next-btn');

    // Hide loading once images are ready (simple heuristic)
    setTimeout(() => {
      if (this.loadingEl) this.loadingEl.style.opacity = '0';
      setTimeout(() => {
        if (this.loadingEl && this.loadingEl.parentNode) this.loadingEl.parentNode.removeChild(this.loadingEl);
      }, 200);
    }, 600);
  }

  attachEventListeners() {
    const viewerArea = this.container.querySelector('.relative.aspect-\\[4\\/4\\.2\\]');

    // Mouse drag
    viewerArea.addEventListener('mousedown', (e) => this.startDrag(e));
    window.addEventListener('mousemove', (e) => this.onDrag(e));
    window.addEventListener('mouseup', () => this.endDrag());

    // Touch drag
    viewerArea.addEventListener('touchstart', (e) => this.startDrag(e), { passive: false });
    window.addEventListener('touchmove', (e) => this.onDrag(e), { passive: false });
    window.addEventListener('touchend', () => this.endDrag());

    // Buttons
    this.prevBtn.addEventListener('click', () => this.previousFrame());
    this.nextBtn.addEventListener('click', () => this.nextFrame());
    this.playBtn.addEventListener('click', () => this.toggleAutoplay());

    // Keyboard support
    this.container.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') this.previousFrame();
      if (e.key === 'ArrowRight') this.nextFrame();
      if (e.key.toLowerCase() === ' ') {
        e.preventDefault();
        this.toggleAutoplay();
      }
    });

    // Prevent image dragging
    this.imgElement.addEventListener('dragstart', (e) => e.preventDefault());
  }

  startDrag(e) {
    this.isDragging = true;
    this.startX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
    this.lastX = this.startX;

    // Stop autoplay while user interacts
    this.stopAutoplay();

    this.container.querySelector('.drag-hint')?.classList.add('opacity-0');
  }

  onDrag(e) {
    if (!this.isDragging) return;

    const currentX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
    const deltaX = currentX - this.lastX;

    if (Math.abs(deltaX) > 8) { // threshold to avoid jitter
      const direction = deltaX > 0 ? -1 : 1; // natural feel (drag right = rotate one way)
      const frameDelta = Math.round(Math.abs(deltaX) / 18 * this.options.sensitivity);

      if (frameDelta > 0) {
        this.currentFrame = (this.currentFrame + (direction * frameDelta) + this.options.frames) % this.options.frames;
        this.showFrame(this.currentFrame);
        this.lastX = currentX;
      }
    }
  }

  endDrag() {
    this.isDragging = false;
  }

  showFrame(frameIndex) {
    this.currentFrame = ((frameIndex % this.options.frames) + this.options.frames) % this.options.frames;
    
    const img = this.images[this.currentFrame];
    if (img && img.complete) {
      this.imgElement.src = img.src;
    } else if (img) {
      img.onload = () => {
        if (this.currentFrame === frameIndex) {
          this.imgElement.src = img.src;
        }
      };
    }
  }

  nextFrame() {
    this.stopAutoplay();
    this.showFrame(this.currentFrame + 1);
  }

  previousFrame() {
    this.stopAutoplay();
    this.showFrame(this.currentFrame - 1);
  }

  startAutoplay() {
    this.stopAutoplay();
    this.isPlaying = true;
    this.updatePlayButton();

    this.autoplayInterval = setInterval(() => {
      this.showFrame(this.currentFrame + 1);
    }, this.options.autoplaySpeed);
  }

  stopAutoplay() {
    if (this.autoplayInterval) {
      clearInterval(this.autoplayInterval);
      this.autoplayInterval = null;
    }
    this.isPlaying = false;
    this.updatePlayButton();
  }

  toggleAutoplay() {
    if (this.isPlaying) {
      this.stopAutoplay();
    } else {
      this.startAutoplay();
    }
  }

  updatePlayButton() {
    if (!this.playBtn) return;
    const icon = this.playBtn.querySelector('i');
    if (this.isPlaying) {
      icon.classList.remove('fa-play');
      icon.classList.add('fa-pause');
      this.playBtn.title = 'Pause rotation';
    } else {
      icon.classList.remove('fa-pause');
      icon.classList.add('fa-play');
      this.playBtn.title = 'Autoplay rotation';
    }
  }
}

// Auto-initialize any .product-360-viewer containers
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.product-360-viewer').forEach(container => {
    new Product360Viewer(container, {
      frames: 8,
      imagePrefix: 'ember-',
      imageExtension: '.jpg',
      sensitivity: 1.8,
      autoplay: true,
      autoplaySpeed: 90
    });
  });
});