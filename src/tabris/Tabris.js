import NativeObject from './NativeObject';
import NativeBridge from './NativeBridge';
import NativeObjectRegistry from './NativeObjectRegistry';
import {error} from './Console';

export default class Tabris extends NativeObject {

  constructor() {
    super();
    this._started = false;
    this._init = this._init.bind(this);
    this._notify = this._notify.bind(this);
    this._stackTraceStack = [];
  }

  get version() {
    return '${VERSION}';
  }

  get started() {
    return !!this._started;
  }

  set contentView(contentView) {
    if (!this.$contentView) {
      this.$contentView = contentView;
      this._nativeSet('contentView', contentView.cid);
    }
  }

  get contentView() {
    return this.$contentView;
  }

  _register() {
    this._nativeObjectRegistry = new NativeObjectRegistry();
    const cid = this._nativeObjectRegistry.register(this);
    Object.defineProperty(this, 'cid', {value: cid});
  }

  _init(client, options) {
    this._client = client;
    this._nativeBridge = new NativeBridge(client);
    this._nativeBridge.create(this.cid, 'tabris.Tabris');
    this.trigger('start', options);
    this._started = true;
  }

  _setEntryPoint(entryPoint) {
    this._entryPoint = entryPoint;
  }

  _notify(cid, event, param) {
    let returnValue;
    try {
      let nativeObject = this._nativeObjectRegistry.find(cid);
      if (nativeObject) {
        try {
          returnValue = nativeObject._trigger(event, param);
        } catch (err) {
          error(err);
        }
      }
      this.trigger('flush');
    } catch (err) {
      error(err);
    }
    return returnValue;
  }

}
