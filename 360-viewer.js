/**
 * Ember Clip 360° Product Viewer
 * Lightweight vanilla JS rotator - updated with new branded angles
 */
class Product360Viewer {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      frames: options.frames || 12,
      imagePrefix: options.imagePrefix || 'ember-',
      imageExtension: options.imageExtension || '.jpg',
      sensitivity: options.sensitivity || 1.8,
      autoplay: options.autoplay !== false,
      autoplaySpeed: options.autoplaySpeed || 160,
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
    this.showFrame(0);

    if (this.options.autoplay) {
      setTimeout(() => this.startAutoplay(), 900);
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
        <div class="relative aspect-[4/4.15] bg-[#f8f9fb] flex items-center justify-center">
          <img 
            class="max-h-[94%] max-w-full object-contain select-none pointer-events-none"
            alt="Ember Clip 360° view — drag to rotate between EMBER logo and TAP THAT ASH sides"
          >
          
          <div class="drag-hint absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-white/90 backdrop-blur-sm rounded-2xl text-xs font-medium text-slate-600 flex items-center gap-x-2 shadow-sm border border-slate-200 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <i class="fa-solid fa-arrows-alt-h"></i>
            <span>Drag to rotate</span>
          </div>

          <div class="loading-indicator absolute inset-0 flex items-center justify-center bg-white/70 transition-opacity">
            <div class="flex items-center gap-x-2 text-sm text-slate-500">
              <i class="fa-solid fa-sync fa-spin"></i>
              <span>Loading 360° views...</span>
            </div>
          </div>
        </div>

        <div class="flex items-center justify-between px-5 py-3 bg-white border-t border-slate-100">
          <div class="flex items-center gap-x-2">
            <button class="play-btn inline-flex items-center justify-center w-9 h-9 rounded-2xl border border-slate-200 hover:bg-slate-50 active:bg-slate-100 transition-colors" title="Autoplay">
              <i class="fa-solid fa-play text-[#0A4D68]"></i>
            </button>
            <span class="text-xs text-slate-500 font-medium tracking-wide">360° VIEW</span>
          </div>

          <div class="flex items-center gap-x-1.5">
            <button class="prev-btn w-9 h-9 flex items-center justify-center rounded-2xl border border-slate-200 hover:bg-slate-50 active:bg-slate-100 transition-colors" title="Previous">
              <i class="fa-solid fa-chevron-left text-slate-600"></i>
            </button>
            <button class="next-btn w-9 h-9 flex items-center justify-center rounded-2xl border border-slate-200 hover:bg-slate-50 active:bg-slate-100 transition-colors" title="Next">
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

    setTimeout(() => {
      if (this.loadingEl) this.loadingEl.style.opacity = '0';
      setTimeout(() => { if (this.loadingEl?.parentNode) this.loadingEl.parentNode.removeChild(this.loadingEl); }, 180);
    }, 550);
  }

  attachEventListeners() {
    const viewerArea = this.container.querySelector('.relative.aspect-\\[4\\/4\\.15\\]');

    viewerArea.addEventListener('mousedown', (e) => this.startDrag(e));
    window.addEventListener('mousemove', (e) => this.onDrag(e));
    window.addEventListener('mouseup', () => this.endDrag());

    viewerArea.addEventListener('touchstart', (e) => this.startDrag(e), { passive: false });
    window.addEventListener('touchmove', (e) => this.onDrag(e), { passive: false });
    window.addEventListener('touchend', () => this.endDrag());

    this.prevBtn.addEventListener('click', () => this.previousFrame());
    this.nextBtn.addEventListener('click', () => this.nextFrame());
    this.playBtn.addEventListener('click', () => this.toggleAutoplay());

    this.container.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') this.previousFrame();
      if (e.key === 'ArrowRight') this.nextFrame();
      if (e.key === ' ') { e.preventDefault(); this.toggleAutoplay(); }
    });

    this.imgElement.addEventListener('dragstart', e => e.preventDefault());
  }

  startDrag(e) {
    this.isDragging = true;
    this.startX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
    this.lastX = this.startX;
    this.stopAutoplay();
    this.container.querySelector('.drag-hint')?.classList.add('opacity-0');
  }

  onDrag(e) {
    if (!this.isDragging) return;
    const currentX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
    const deltaX = currentX - this.lastX;

    if (Math.abs(deltaX) > 7) {
      const direction = deltaX > 0 ? -1 : 1;
      const frameDelta = Math.max(1, Math.round(Math.abs(deltaX) / 16 * this.options.sensitivity));
      this.currentFrame = (this.currentFrame + (direction * frameDelta) + this.options.frames) % this.options.frames;
      this.showFrame(this.currentFrame);
      this.lastX = currentX;
    }
  }

  endDrag() { this.isDragging = false; }

  showFrame(frameIndex) {
    this.currentFrame = ((frameIndex % this.options.frames) + this.options.frames) % this.options.frames;
    const img = this.images[this.currentFrame];
    if (img?.complete) {
      this.imgElement.src = img.src;
    } else if (img) {
      img.onload = () => { if (this.currentFrame === frameIndex) this.imgElement.src = img.src; };
    }
  }

  nextFrame() { this.stopAutoplay(); this.showFrame(this.currentFrame + 1); }
  previousFrame() { this.stopAutoplay(); this.showFrame(this.currentFrame - 1); }

  startAutoplay() {
    this.stopAutoplay();
    this.isPlaying = true;
    this.updatePlayButton();
    this.autoplayInterval = setInterval(() => this.showFrame(this.currentFrame + 1), this.options.autoplaySpeed);
  }

  stopAutoplay() {
    if (this.autoplayInterval) clearInterval(this.autoplayInterval);
    this.autoplayInterval = null;
    this.isPlaying = false;
    this.updatePlayButton();
  }

  toggleAutoplay() { this.isPlaying ? this.stopAutoplay() : this.startAutoplay(); }

  updatePlayButton() {
    if (!this.playBtn) return;
    const icon = this.playBtn.querySelector('i');
    if (this.isPlaying) {
      icon.classList.replace('fa-play', 'fa-pause');
      this.playBtn.title = 'Pause rotation';
    } else {
      icon.classList.replace('fa-pause', 'fa-play');
      this.playBtn.title = 'Autoplay rotation';
    }
  }
}

// Auto-init
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.product-360-viewer').forEach(container => {
    new Product360Viewer(container, {
      frames: 12,
      imagePrefix: 'ember-',
      imageExtension: '.jpg',
      sensitivity: 1.9,
      autoplay: true,
      autoplaySpeed: 160
    });
  });
});