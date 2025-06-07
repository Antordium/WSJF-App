import React from 'react';
// @ts-ignore
import ReactDOM from 'react-dom/client';
import reactToWebComponent from 'react-to-webcomponent';
import WSJFApp from './page';
// @ts-ignore
// import styles from './globals.css?inline';
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
    } else {
      if (!this.querySelector('style[data-wsjf]')) {
        this.prepend(style);
      }
    }
  }
}

customElements.define('wsjf-app', CustomWSJFApp);
