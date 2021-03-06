import NativeObject from '../NativeObject';
import Widget from '../Widget';
import {hint} from '../Console';
import {jsxFactory} from '../JsxProcessor';

export default class Button extends Widget {

  get _nativeType() {
    return 'tabris.Button';
  }

  _getXMLAttributes() {
    return super._getXMLAttributes().concat([['text', this.text]]);
  }

  /** @this {import("../JsxProcessor").default} */
  [jsxFactory](Type, props, children) {
    return super[jsxFactory](Type, this.withContentText(props, children, 'text'));
  }

}

NativeObject.defineProperties(Button.prototype, {
  style: {
    type: ['choice', ['default', 'elevate', 'flat', 'outline', 'text']],
    const: true,
    default: 'default'
  },
  strokeColor: {
    type: 'ColorValue',
    set(name, value) {
      if (this.style === 'outline') {
        this._nativeSet(name, value);
        this._storeProperty(name, value);
      } else {
        hint(this, `The strokeColor can only be set on buttons with style "outline" but it has style ${this.style}.`);
      }
    }
  },
  strokeWidth: {
    type: 'number', nocache: true,
    set(name, value) {
      if (this.style === 'outline') {
        this._nativeSet(name, value);
        this._storeProperty(name, value);
      } else {
        hint(this, `The strokeWidth can only be set on buttons with style "outline" but it has style ${this.style}.`);
      }
    }
  },
  alignment: {type: ['choice', ['left', 'right', 'center']], default: 'center'},
  image: {type: 'ImageValue', default: null},
  text: {type: 'string', default: ''},
  textColor: {type: 'ColorValue'},
  font: {
    type: 'FontValue',
    set(name, value) {
      this._nativeSet(name, value === undefined ? null : value);
      this._storeProperty(name, value);
    },
    default: null
  }
});

NativeObject.defineEvents(Button.prototype, {
  select: {native: true},
});
