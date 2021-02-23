import { v4 as uuidv4 } from 'https://jspm.dev/uuid';
let name = 'ember-app';

function _appendStyles(dest, styles) {
  let files = Object.values(styles)
  files.forEach((f)=> {
    let style = document.createElement('link')
    style.setAttribute('href', f)
    style.setAttribute('rel', 'stylesheet')
    dest.appendChild(style)
  })
}

async function _appendJs(dest, js) {
  let files = Object.values(js)
  return files.reduce(async (p, f)=> {
    await p
    return new Promise(function(resolve) {
      let js = document.createElement('script')
      js.defer = true
      js.setAttribute('src', f)
      dest.appendChild(js)
      js.onload = ()=> resolve()
    })
  }, Promise.resolve())
}


class ApplicationContainer extends HTMLElement {

  constructor() {
    super()
    this.styles = [
      this.getAttribute('vendor-css'),
      this.getAttribute('app-css'),
    ];
    this.scripts = [
      this.getAttribute('vendor-js'),
      this.getAttribute('app-js'),
    ];
    this.root = this.attachShadow({mode: 'closed'})

    // The 2 divs are a trick in how Ember finds their parent
    let rootParent = document.createElement('div')
    _appendStyles(rootParent, this.styles)
    this._loading = _appendJs(rootParent, this.scripts)
    let rootElement = document.createElement('div')
    this.uuid = uuidv4();
    rootElement.setAttribute('data-ember-root-element', this.uuid)
    this.root.appendChild(rootParent)
    rootParent.appendChild(rootElement)

  }

  // Starts the app when an element is connected
  async connectedCallback() {
    if (this.application || !this.isConnected) {
      return
    }

    await this._loading

    let app = require(`${this.getAttribute('app-name')}/app`).default.create({
      rootElement: this.root.querySelector(`[data-ember-root-element="${this.uuid}"]`)
    })
    this.application = app
  }

  // Destroy the app on disconnection of the node
  disconnectedCallback() {
    if (!this.application.isDestroyed && !this.application.isDestroying) {
      this.application.destroy()
    }
  }

  // That makes the application accessible via:
  // document.querySelector('application-name').__EMBER_APPLICATION
  get __EMBER_APPLICATION() {
    return this.application
  }
}

let componentName = name

customElements.define(componentName, ApplicationContainer)
