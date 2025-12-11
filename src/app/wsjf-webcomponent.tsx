import React from 'react';
// @ts-ignore
import ReactDOM from 'react-dom/client';
import reactToWebComponent from 'react-to-webcomponent';
import WSJFApp from './page';
// @ts-ignore
import styles from './wsjf-app-style';

const Base = reactToWebComponent(WSJFApp, React, ReactDOM) as typeof HTMLElement;

class CustomWSJFApp extends Base {
  connectedCallback() {
    // Call the base class's method if it exists (react-to-webcomponent attaches it directly to the prototype)
    const baseProto = Object.getPrototypeOf(CustomWSJFApp.prototype);
    if (typeof baseProto.connectedCallback === 'function') {
      baseProto.connectedCallback.call(this);
    }
    
    // Try to inject style into shadowRoot, or fallback to light DOM if shadowRoot is not available
    const style = document.createElement('style');
    style.setAttribute('data-wsjf', '');
    style.textContent = styles;
    
    if (this.shadowRoot) {
      if (!this.shadowRoot.querySelector('style[data-wsjf]')) {
        this.shadowRoot.prepend(style);
      }
      
      // Dark mode observer for shadow root
      this.observeDarkMode();
    } else {
      if (!this.querySelector('style[data-wsjf]')) {
        this.prepend(style);
      }
      
      // Dark mode observer for light DOM
      this.observeDarkMode();
    }
  }
  
  observeDarkMode() {
    // Initial check for dark mode
    this.updateDarkMode();
    
    // Watch for changes in the document's dark mode class
    if (typeof window !== 'undefined') {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
            this.updateDarkMode();
          }
        });
      });
      
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class']
      });
      
      // Store observer reference for cleanup
      (this as any)._darkModeObserver = observer;
    }
  }
  
  updateDarkMode() {
    const isDark = document.documentElement.classList.contains('dark');
    
    if (this.shadowRoot) {
      // Apply dark class to shadow root host
      this.classList.toggle('dark', isDark);
    } else {
      // Apply dark class to the component itself
      this.classList.toggle('dark', isDark);
    }
  }
  
  disconnectedCallback() {
    // Cleanup observer
    if ((this as any)._darkModeObserver) {
      (this as any)._darkModeObserver.disconnect();
    }
    
    // Call parent disconnectedCallback if it exists
    const baseProto = Object.getPrototypeOf(CustomWSJFApp.prototype);
    if (typeof baseProto.disconnectedCallback === 'function') {
      baseProto.disconnectedCallback.call(this);
    }
  }
}

customElements.define('wsjf-app', CustomWSJFApp);
