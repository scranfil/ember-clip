/**
 * Ember Clip - Two-Sided Product Gallery
 * Simple, clean gallery to showcase the two branded sides of the product.
 */
class ProductSidesGallery {
  constructor(container) {
    this.container = container;
    
    // The two key images - using the clean isolated versions for best quality
    this.sides = [
      {
        src: 'ember-logo-clean.png',
        label: 'EMBER Logo',
        description: 'Signature gold logo with flame detail'
      },
      {
        src: 'ember-tapthatash-clean.png',
        label: 'TAP THAT ASH',
        description: 'Bold text on cream accent'
      }
    ];
    
    this.currentIndex = 0;
    this.imgElement = null;
    
    this.init();
  }

  init() {
    this.render();
    this.attachEvents();
    this.showSide(0);
  }

  render() {
    this.container.innerHTML = `
      <div class="relative bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-200">
        <!-- Main Image -->
        <div class="relative bg-[#f8f9fb] flex items-center justify-center p-8" style="aspect-ratio: 1 / 1.05;">
          <img 
            class="main-image max-h-full max-w-full object-contain transition-opacity duration-300"
            alt="Ember Clip product"
          >
          
          <!-- Navigation Arrows -->
          <button class="nav-btn prev-btn absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center bg-white/90 hover:bg-white shadow-md rounded-2xl border border-slate-200 text-[#0A4D68] transition-all active:scale-95" aria-label="Previous side">
            <i class="fa-solid fa-chevron-left text-lg"></i>
          </button>
          <button class="nav-btn next-btn absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center bg-white/90 hover:bg-white shadow-md rounded-2xl border border-slate-200 text-[#0A4D68] transition-all active:scale-95" aria-label="Next side">
            <i class="fa-solid fa-chevron-right text-lg"></i>
          </button>
        </div>

        <!-- Side Selector -->
        <div class="p-5 bg-white border-t border-slate-100">
          <div class="flex gap-4">
            ${this.sides.map((side, index) => `
              <button 
                class="side-thumb flex-1 flex flex-col items-center gap-y-2 p-3 rounded-2xl border transition-all hover:border-[#0A4D68]/30"
                data-index="${index}"
              >
                <div class="w-full aspect-square bg-[#f8f9fb] rounded-xl overflow-hidden border border-slate-100">
                  <img 
                    src="${side.src}" 
                    class="w-full h-full object-contain p-3"
                    alt="${side.label}"
                  >
                </div>
                <div class="text-center">
                  <div class="font-semibold text-sm text-slate-800">${side.label}</div>
                  <div class="text-[10px] text-slate-500 mt-0.5">${side.description}</div>
                </div>
              </button>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    this.imgElement = this.container.querySelector('.main-image');
    this.prevBtn = this.container.querySelector('.prev-btn');
    this.nextBtn = this.container.querySelector('.next-btn');
    this.thumbButtons = this.container.querySelectorAll('.side-thumb');
  }

  attachEvents() {
    // Arrow navigation
    this.prevBtn.addEventListener('click', () => this.showSide(this.currentIndex - 1));
    this.nextBtn.addEventListener('click', () => this.showSide(this.currentIndex + 1));

    // Thumbnail clicks
    this.thumbButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const index = parseInt(btn.dataset.index);
        this.showSide(index);
      });
    });

    // Keyboard support
    this.container.setAttribute('tabindex', '0');
    this.container.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') this.showSide(this.currentIndex - 1);
      if (e.key === 'ArrowRight') this.showSide(this.currentIndex + 1);
    });
  }

  showSide(index) {
    // Wrap around for only 2 images
    this.currentIndex = ((index % this.sides.length) + this.sides.length) % this.sides.length;
    
    const side = this.sides[this.currentIndex];
    
    // Fade transition
    this.imgElement.style.opacity = '0';
    
    setTimeout(() => {
      this.imgElement.src = side.src;
      this.imgElement.alt = `Ember Clip - ${side.label}`;
      this.imgElement.style.opacity = '1';
    }, 150);

    // Update active thumbnail state
    this.thumbButtons.forEach((btn, i) => {
      if (parseInt(btn.dataset.index) === this.currentIndex) {
        btn.classList.add('border-[#0A4D68]', 'ring-1', 'ring-[#0A4D68]/20');
        btn.classList.remove('border-transparent');
      } else {
        btn.classList.remove('border-[#0A4D68]', 'ring-1', 'ring-[#0A4D68]/20');
        btn.classList.add('border-transparent');
      }
    });
  }
}

// Auto-initialize
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.product-360-viewer').forEach(container => {
    new ProductSidesGallery(container);
  });
});